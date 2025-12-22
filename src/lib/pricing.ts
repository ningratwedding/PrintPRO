import { PricingRuleJSON, ItemBOMMaterial, ItemBOMProcess, ItemFinishing } from '../types/database';

export interface HPPBreakdown {
  material: number;
  machine: number;
  finishing: number;
  allocation: number;
  total: number;
}

export interface PricingCalculation {
  hpp: HPPBreakdown;
  basePrice: number;
  tierAdjustment: number;
  surchargePercent: number;
  finalUnitPrice: number;
  totalPrice: number;
}

export function calculateHPPMaterial(materials: ItemBOMMaterial[]): number {
  return materials.reduce((sum, mat) => {
    const costWithWaste = mat.quantity_required * mat.unit_cost * (1 + mat.waste_factor);
    return sum + costWithWaste;
  }, 0);
}

export function calculateHPPMachine(processes: ItemBOMProcess[]): number {
  return processes.reduce((sum, proc) => {
    const totalMinutes = proc.time_minutes + proc.setup_time_minutes;
    const hours = totalMinutes / 60;
    const cost = hours * proc.hourly_rate;
    return sum + cost;
  }, 0);
}

export function calculateHPPFinishing(finishing: ItemFinishing[]): number {
  return finishing.reduce((sum, fin) => sum + fin.total_cost, 0);
}

export function calculateTierAdjustment(quantity: number, pricingRule: PricingRuleJSON): number {
  if (!pricingRule.tiers || pricingRule.tiers.length === 0) {
    return 1.0;
  }

  for (const tier of pricingRule.tiers) {
    if (quantity >= tier.min_qty && (tier.max_qty === null || quantity <= tier.max_qty)) {
      return tier.unit_adjust;
    }
  }

  return 1.0;
}

export function calculateSurcharge(
  specs: Record<string, any>,
  isExpress: boolean,
  pricingRule: PricingRuleJSON
): number {
  let totalSurcharge = 0;

  if (isExpress && pricingRule.surcharge?.express?.enabled) {
    totalSurcharge += pricingRule.surcharge.express.percent;
  }

  if (pricingRule.surcharge?.complexity) {
    for (const complex of pricingRule.surcharge.complexity) {
      if (specs[complex.attribute] === complex.value) {
        totalSurcharge += complex.percent;
      }
    }
  }

  return totalSurcharge;
}

export function calculatePricing(
  quantity: number,
  materials: ItemBOMMaterial[],
  processes: ItemBOMProcess[],
  finishing: ItemFinishing[],
  allocation: number,
  specs: Record<string, any>,
  isExpress: boolean,
  pricingRule: PricingRuleJSON
): PricingCalculation {
  const hppMaterial = calculateHPPMaterial(materials);
  const hppMachine = calculateHPPMachine(processes);
  const hppFinishing = calculateHPPFinishing(finishing);
  const hppTotal = hppMaterial + hppMachine + hppFinishing + allocation;

  const hpp: HPPBreakdown = {
    material: hppMaterial,
    machine: hppMachine,
    finishing: hppFinishing,
    allocation: allocation,
    total: hppTotal
  };

  let basePrice: number;
  if (pricingRule.base.mode === 'margin_percent') {
    basePrice = hppTotal * (1 + pricingRule.base.value);
  } else {
    basePrice = hppTotal + pricingRule.base.value;
  }

  const tierAdjustment = calculateTierAdjustment(quantity, pricingRule);
  const surchargePercent = calculateSurcharge(specs, isExpress, pricingRule);

  let finalUnitPrice = basePrice * tierAdjustment * (1 + surchargePercent);

  if (pricingRule.floor_ceiling?.min_unit_price && finalUnitPrice < pricingRule.floor_ceiling.min_unit_price) {
    finalUnitPrice = pricingRule.floor_ceiling.min_unit_price;
  }

  const totalPrice = finalUnitPrice * quantity;

  return {
    hpp,
    basePrice,
    tierAdjustment,
    surchargePercent,
    finalUnitPrice,
    totalPrice
  };
}

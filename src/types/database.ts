export interface Company {
  id: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  tax_id?: string;
  logo_url?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Branch {
  id: string;
  company_id: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  created_at: string;
}

export interface UserBranchRole {
  id: string;
  user_id: string;
  branch_id: string;
  role_id: string;
  created_at: string;
  branch?: Branch;
  role?: Role;
}

export interface ProductTemplate {
  id: string;
  company_id: string;
  name: string;
  code: string;
  category: string;
  description?: string;
  base_unit: string;
  image_url?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductAttribute {
  id: string;
  company_id: string;
  name: string;
  code: string;
  attribute_type: 'text' | 'number' | 'select' | 'multiselect';
  unit?: string;
  required: boolean;
  created_at: string;
}

export interface ProductAttributeValue {
  id: string;
  attribute_id: string;
  value: string;
  display_label: string;
  sort_order: number;
  created_at: string;
}

export interface FinishingOption {
  id: string;
  company_id: string;
  name: string;
  code: string;
  description?: string;
  unit_price: number;
  unit: string;
  active: boolean;
  created_at: string;
}

export interface Material {
  id: string;
  company_id: string;
  name: string;
  code: string;
  category: string;
  unit: string;
  min_stock: number;
  reorder_point: number;
  last_purchase_price: number;
  average_cost: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InventoryLot {
  id: string;
  material_id: string;
  branch_id: string;
  lot_number: string;
  received_date: string;
  expiry_date?: string;
  quantity_received: number;
  quantity_available: number;
  unit_cost: number;
  supplier_name?: string;
  notes?: string;
  created_at: string;
}

export interface InventoryMovement {
  id: string;
  material_id: string;
  branch_id: string;
  lot_id?: string;
  movement_type: 'in' | 'out' | 'adjust' | 'transfer';
  quantity: number;
  unit_cost?: number;
  reference_type?: string;
  reference_id?: string;
  notes?: string;
  user_id?: string;
  movement_date: string;
  created_at: string;
}

export interface Machine {
  id: string;
  company_id: string;
  branch_id: string;
  name: string;
  code: string;
  machine_type: string;
  hourly_rate: number;
  setup_time_minutes: number;
  active: boolean;
  created_at: string;
}

export interface ProcessStep {
  id: string;
  company_id: string;
  name: string;
  code: string;
  description?: string;
  step_order: number;
  created_at: string;
}

export interface PricingRule {
  id: string;
  company_id: string;
  name: string;
  product_template_id?: string;
  rules_json: PricingRuleJSON;
  active: boolean;
  effective_from?: string;
  effective_to?: string;
  created_at: string;
  updated_at: string;
}

export interface PricingRuleJSON {
  version: string;
  base: {
    mode: 'margin_percent' | 'markup_flat';
    value: number;
  };
  tiers?: Array<{
    min_qty: number;
    max_qty: number | null;
    unit_adjust: number;
  }>;
  surcharge?: {
    express?: {
      enabled: boolean;
      percent: number;
    };
    complexity?: Array<{
      attribute: string;
      value: any;
      percent: number;
    }>;
  };
  floor_ceiling?: {
    min_unit_price?: number;
    max_unit_discount_percent?: number;
  };
}

export interface Customer {
  id: string;
  company_id: string;
  name: string;
  code: string;
  phone?: string;
  email?: string;
  address?: string;
  tax_id?: string;
  credit_limit: number;
  payment_terms?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  company_id: string;
  branch_id: string;
  order_number: string;
  order_type: 'quotation' | 'sales_order';
  status: 'draft' | 'confirmed' | 'production' | 'delivered' | 'invoiced' | 'paid' | 'cancelled';
  customer_id?: string;
  customer_name?: string;
  customer_phone?: string;
  order_date: string;
  due_date?: string;
  is_express: boolean;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  notes?: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  line_number: number;
  product_template_id?: string;
  product_name: string;
  product_specs: Record<string, any>;
  quantity: number;
  unit: string;
  unit_price: number;
  hpp_unit: number;
  hpp_total: number;
  line_total: number;
  notes?: string;
  created_at: string;
}

export interface ItemBOMMaterial {
  id: string;
  order_item_id: string;
  material_id?: string;
  material_name: string;
  quantity_required: number;
  unit: string;
  unit_cost: number;
  waste_factor: number;
  total_cost: number;
  created_at: string;
}

export interface ItemBOMProcess {
  id: string;
  order_item_id: string;
  process_step_id?: string;
  machine_id?: string;
  process_name: string;
  machine_name?: string;
  time_minutes: number;
  setup_time_minutes: number;
  hourly_rate: number;
  total_cost: number;
  step_order: number;
  created_at: string;
}

export interface ItemFinishing {
  id: string;
  order_item_id: string;
  finishing_option_id?: string;
  finishing_name: string;
  quantity: number;
  unit_price: number;
  total_cost: number;
  created_at: string;
}

export interface WorkOrder {
  id: string;
  company_id: string;
  branch_id: string;
  work_order_number: string;
  order_id?: string;
  order_item_id?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  scheduled_start?: string;
  scheduled_end?: string;
  actual_start?: string;
  actual_end?: string;
  quantity_planned: number;
  quantity_completed: number;
  quantity_rejected: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface POSSession {
  id: string;
  branch_id: string;
  session_number: string;
  user_id: string;
  opened_at: string;
  closed_at?: string;
  opening_balance: number;
  closing_balance?: number;
  cash_counted?: number;
  variance?: number;
  status: 'open' | 'closed';
  notes?: string;
}

export interface Payment {
  id: string;
  company_id: string;
  branch_id: string;
  payment_number: string;
  order_id?: string;
  invoice_id?: string;
  pos_session_id?: string;
  payment_date: string;
  payment_method: 'cash' | 'transfer' | 'card' | 'qris';
  amount: number;
  reference_number?: string;
  notes?: string;
  user_id?: string;
  created_at: string;
}

export interface Invoice {
  id: string;
  company_id: string;
  branch_id: string;
  invoice_number: string;
  order_id?: string;
  delivery_id?: string;
  invoice_date: string;
  due_date?: string;
  customer_id?: string;
  customer_snapshot?: Record<string, any>;
  items_snapshot?: Record<string, any>;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  amount_paid: number;
  status: 'unpaid' | 'partial' | 'paid' | 'overdue';
  user_id?: string;
  created_at: string;
}

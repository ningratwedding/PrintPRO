-- Demo Data Seed for PrintPro Digital Printing Management System
-- This script creates demo company, branches, users, and sample data

-- Create demo company
INSERT INTO companies (id, name, code, address, phone, email, active)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Demo Printing Co',
  'DEMO',
  'Jl. Demo No. 123, Jakarta',
  '021-12345678',
  'info@demoprinting.com',
  true
) ON CONFLICT (code) DO NOTHING;

-- Create demo branch
INSERT INTO branches (id, company_id, name, code, address, phone, active)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'Main Branch',
  'MAIN',
  'Jl. Demo No. 123, Jakarta',
  '021-12345678',
  true
) ON CONFLICT (company_id, code) DO NOTHING;

-- Demo user will be created via Supabase Auth
-- After creating user admin@demo.com, link them to branch with Owner role

-- Create demo product templates
INSERT INTO product_templates (company_id, name, code, category, description, base_unit, active)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Banner Indoor', 'BNR-IND', 'banner', 'Banner untuk indoor dengan bahan frontlite', 'm2', true),
  ('11111111-1111-1111-1111-111111111111', 'Banner Outdoor', 'BNR-OUT', 'banner', 'Banner untuk outdoor dengan bahan backlit', 'm2', true),
  ('11111111-1111-1111-1111-111111111111', 'Stiker Vinyl', 'STK-VNL', 'stiker', 'Stiker vinyl untuk berbagai permukaan', 'm2', true),
  ('11111111-1111-1111-1111-111111111111', 'Brosur A4', 'BRS-A4', 'brosur', 'Brosur ukuran A4 art paper 150gsm', 'pcs', true),
  ('11111111-1111-1111-1111-111111111111', 'Kaos DTG', 'KOS-DTG', 'kaos', 'Kaos dengan cetak DTG full color', 'pcs', true),
  ('11111111-1111-1111-1111-111111111111', 'Kartu Nama', 'KTN-STD', 'merchandise', 'Kartu nama art carton 310gsm', 'box', true)
ON CONFLICT (company_id, code) DO NOTHING;

-- Create demo materials
INSERT INTO materials (company_id, name, code, category, unit, min_stock, reorder_point, last_purchase_price, average_cost, active)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Frontlite 340gsm', 'FL-340', 'substrate', 'meter', 50, 100, 35000, 35000, true),
  ('11111111-1111-1111-1111-111111111111', 'Backlit 440gsm', 'BL-440', 'substrate', 'meter', 50, 100, 45000, 45000, true),
  ('11111111-1111-1111-1111-111111111111', 'Vinyl Sticker', 'VNL-STK', 'substrate', 'meter', 30, 60, 25000, 25000, true),
  ('11111111-1111-1111-1111-111111111111', 'Art Paper 150gsm', 'AP-150', 'substrate', 'rim', 10, 20, 85000, 85000, true),
  ('11111111-1111-1111-1111-111111111111', 'Tinta Eco Solvent Black', 'INK-ECO-BK', 'ink', 'liter', 2, 5, 350000, 350000, true),
  ('11111111-1111-1111-1111-111111111111', 'Tinta Eco Solvent Cyan', 'INK-ECO-C', 'ink', 'liter', 2, 5, 350000, 350000, true),
  ('11111111-1111-1111-1111-111111111111', 'Tinta Eco Solvent Magenta', 'INK-ECO-M', 'ink', 'liter', 2, 5, 350000, 350000, true),
  ('11111111-1111-1111-1111-111111111111', 'Tinta Eco Solvent Yellow', 'INK-ECO-Y', 'ink', 'liter', 2, 5, 350000, 350000, true),
  ('11111111-1111-1111-1111-111111111111', 'Laminasi Glossy', 'LAM-GLO', 'chemical', 'meter', 30, 60, 15000, 15000, true)
ON CONFLICT (company_id, code) DO NOTHING;

-- Create demo inventory lots
INSERT INTO inventory_lots (material_id, branch_id, lot_number, received_date, quantity_received, quantity_available, unit_cost, supplier_name)
SELECT
  m.id,
  '22222222-2222-2222-2222-222222222222',
  'LOT-' || m.code || '-001',
  CURRENT_DATE,
  100,
  100,
  m.average_cost,
  'Demo Supplier'
FROM materials m
WHERE m.company_id = '11111111-1111-1111-1111-111111111111'
ON CONFLICT (material_id, branch_id, lot_number) DO NOTHING;

-- Create demo machines
INSERT INTO machines (company_id, branch_id, name, code, machine_type, hourly_rate, setup_time_minutes, active)
VALUES
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Printer Roland XC-540', 'PRT-ROL-01', 'printer', 150000, 15, true),
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Laminator Mesin GFP', 'LAM-GFP-01', 'laminator', 75000, 10, true),
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Cutting Plotter GCC', 'CUT-GCC-01', 'cutter', 50000, 5, true)
ON CONFLICT (company_id, code) DO NOTHING;

-- Create demo process steps
INSERT INTO process_steps (company_id, name, code, description, step_order)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Design & Pre-press', 'PRE', 'Persiapan desain dan file untuk produksi', 1),
  ('11111111-1111-1111-1111-111111111111', 'Printing', 'PRT', 'Proses cetak digital', 2),
  ('11111111-1111-1111-1111-111111111111', 'Laminating', 'LAM', 'Proses laminasi untuk proteksi', 3),
  ('11111111-1111-1111-1111-111111111111', 'Cutting', 'CUT', 'Pemotongan sesuai ukuran', 4),
  ('11111111-1111-1111-1111-111111111111', 'Quality Control', 'QC', 'Pengecekan kualitas hasil produksi', 5),
  ('11111111-1111-1111-1111-111111111111', 'Packaging', 'PKG', 'Pengemasan produk jadi', 6)
ON CONFLICT (company_id, code) DO NOTHING;

-- Create demo finishing options
INSERT INTO finishing_options (company_id, name, code, description, unit_price, unit, active)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Laminasi Glossy', 'FIN-LAM-G', 'Laminasi glossy untuk hasil mengkilap', 15000, 'm2', true),
  ('11111111-1111-1111-1111-111111111111', 'Laminasi Doff', 'FIN-LAM-D', 'Laminasi doff untuk hasil tidak mengkilap', 15000, 'm2', true),
  ('11111111-1111-1111-1111-111111111111', 'Eyelet', 'FIN-EYL', 'Pemasangan ring eyelet', 5000, 'pcs', true),
  ('11111111-1111-1111-1111-111111111111', 'Finishing Potong', 'FIN-CUT', 'Potong presisi sesuai ukuran', 10000, 'pcs', true)
ON CONFLICT (company_id, code) DO NOTHING;

-- Create demo pricing rules
INSERT INTO pricing_rules (company_id, name, rules_json, active)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Standard Pricing Rule',
  '{
    "version": "1.0",
    "base": { "mode": "margin_percent", "value": 0.25 },
    "tiers": [
      { "min_qty": 1, "max_qty": 9, "unit_adjust": 1.0 },
      { "min_qty": 10, "max_qty": 99, "unit_adjust": 0.9 },
      { "min_qty": 100, "max_qty": null, "unit_adjust": 0.8 }
    ],
    "surcharge": {
      "express": { "enabled": true, "percent": 0.2 }
    },
    "floor_ceiling": {
      "min_unit_price": 5000
    }
  }'::jsonb,
  true
) ON CONFLICT DO NOTHING;

-- Create demo customers
INSERT INTO customers (company_id, name, code, phone, email, address, credit_limit, active)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'PT Maju Jaya', 'CUST-001', '021-98765432', 'maju@email.com', 'Jl. Customer No. 1', 10000000, true),
  ('11111111-1111-1111-1111-111111111111', 'CV Sukses Makmur', 'CUST-002', '021-87654321', 'sukses@email.com', 'Jl. Customer No. 2', 5000000, true),
  ('11111111-1111-1111-1111-111111111111', 'Walk-in Customer', 'WALK-IN', '', '', '', 0, true)
ON CONFLICT (company_id, code) DO NOTHING;

-- Create demo cost centers
INSERT INTO cost_centers (company_id, name, code, cost_type, allocation_basis, rate)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Overhead Listrik', 'OH-ELEC', 'overhead', 'per_hour', 25000),
  ('11111111-1111-1111-1111-111111111111', 'Labor Cost', 'LAB-OPR', 'labor', 'per_item', 15000)
ON CONFLICT (company_id, code) DO NOTHING;

-- Note: Demo orders will be created automatically as users interact with the system

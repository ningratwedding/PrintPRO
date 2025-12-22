/*
  # Add Indexes for Foreign Keys

  ## Performance Improvements
  This migration adds indexes for all foreign key columns that are missing covering indexes.
  These indexes significantly improve:
  - JOIN query performance
  - Foreign key constraint validation speed
  - Cascading delete/update operations
  - Query planner optimization

  ## Indexes Created
  1. Audit logs - user_id
  2. Deliveries - branch_id, order_id, user_id
  3. Inventory movements - lot_id, user_id
  4. Inventory reservations - branch_id, lot_id, material_id
  5. Invoices - branch_id, customer_id, delivery_id, order_id, user_id
  6. Item BOM materials - material_id, order_item_id
  7. Item BOM process - machine_id, order_item_id, process_step_id
  8. Item costs - cost_center_id, order_item_id
  9. Item finishing - finishing_option_id, order_item_id
  10. Machines - branch_id
  11. Order items - product_template_id
  12. Orders - user_id
  13. Payments - branch_id, invoice_id, pos_session_id, user_id
  14. POS sessions - user_id
  15. Pricing rules - company_id, product_template_id
  16. Product attribute values - attribute_id
  17. Stock opnames - branch_id, lot_id, material_id, user_id
  18. User branch roles - role_id
  19. Work logs - machine_id, process_step_id, user_id, work_order_id
  20. Work orders - branch_id, order_item_id

  ## Notes
  - All indexes use IF NOT EXISTS to prevent errors on re-run
  - Indexes follow naming convention: idx_tablename_columnname
*/

-- Audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);

-- Deliveries
CREATE INDEX IF NOT EXISTS idx_deliveries_branch_id ON deliveries(branch_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_order_id ON deliveries(order_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_user_id ON deliveries(user_id);

-- Inventory movements
CREATE INDEX IF NOT EXISTS idx_inventory_movements_lot_id ON inventory_movements(lot_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_user_id ON inventory_movements(user_id);

-- Inventory reservations
CREATE INDEX IF NOT EXISTS idx_inventory_reservations_branch_id ON inventory_reservations(branch_id);
CREATE INDEX IF NOT EXISTS idx_inventory_reservations_lot_id ON inventory_reservations(lot_id);
CREATE INDEX IF NOT EXISTS idx_inventory_reservations_material_id ON inventory_reservations(material_id);

-- Invoices
CREATE INDEX IF NOT EXISTS idx_invoices_branch_id ON invoices(branch_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_delivery_id ON invoices(delivery_id);
CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);

-- Item BOM materials
CREATE INDEX IF NOT EXISTS idx_item_bom_materials_material_id ON item_bom_materials(material_id);
CREATE INDEX IF NOT EXISTS idx_item_bom_materials_order_item_id ON item_bom_materials(order_item_id);

-- Item BOM process
CREATE INDEX IF NOT EXISTS idx_item_bom_process_machine_id ON item_bom_process(machine_id);
CREATE INDEX IF NOT EXISTS idx_item_bom_process_order_item_id ON item_bom_process(order_item_id);
CREATE INDEX IF NOT EXISTS idx_item_bom_process_process_step_id ON item_bom_process(process_step_id);

-- Item costs
CREATE INDEX IF NOT EXISTS idx_item_costs_cost_center_id ON item_costs(cost_center_id);
CREATE INDEX IF NOT EXISTS idx_item_costs_order_item_id ON item_costs(order_item_id);

-- Item finishing
CREATE INDEX IF NOT EXISTS idx_item_finishing_finishing_option_id ON item_finishing(finishing_option_id);
CREATE INDEX IF NOT EXISTS idx_item_finishing_order_item_id ON item_finishing(order_item_id);

-- Machines
CREATE INDEX IF NOT EXISTS idx_machines_branch_id ON machines(branch_id);

-- Order items
CREATE INDEX IF NOT EXISTS idx_order_items_product_template_id ON order_items(product_template_id);

-- Orders
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);

-- Payments
CREATE INDEX IF NOT EXISTS idx_payments_branch_id ON payments(branch_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_pos_session_id ON payments(pos_session_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);

-- POS sessions
CREATE INDEX IF NOT EXISTS idx_pos_sessions_user_id ON pos_sessions(user_id);

-- Pricing rules
CREATE INDEX IF NOT EXISTS idx_pricing_rules_company_id ON pricing_rules(company_id);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_product_template_id ON pricing_rules(product_template_id);

-- Product attribute values
CREATE INDEX IF NOT EXISTS idx_product_attribute_values_attribute_id ON product_attribute_values(attribute_id);

-- Stock opnames
CREATE INDEX IF NOT EXISTS idx_stock_opnames_branch_id ON stock_opnames(branch_id);
CREATE INDEX IF NOT EXISTS idx_stock_opnames_lot_id ON stock_opnames(lot_id);
CREATE INDEX IF NOT EXISTS idx_stock_opnames_material_id ON stock_opnames(material_id);
CREATE INDEX IF NOT EXISTS idx_stock_opnames_user_id ON stock_opnames(user_id);

-- User branch roles
CREATE INDEX IF NOT EXISTS idx_user_branch_roles_role_id ON user_branch_roles(role_id);

-- Work logs
CREATE INDEX IF NOT EXISTS idx_work_logs_machine_id ON work_logs(machine_id);
CREATE INDEX IF NOT EXISTS idx_work_logs_process_step_id ON work_logs(process_step_id);
CREATE INDEX IF NOT EXISTS idx_work_logs_user_id ON work_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_work_logs_work_order_id ON work_logs(work_order_id);

-- Work orders
CREATE INDEX IF NOT EXISTS idx_work_orders_branch_id ON work_orders(branch_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_order_item_id ON work_orders(order_item_id);

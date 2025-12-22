# PrintPro - Digital Printing Management System

A comprehensive enterprise resource planning (ERP) system specifically designed for digital printing companies. This full-featured application manages the complete operational workflow from quotations to delivery, including inventory, production, costing, and financial reporting.

## Features

### Core Modules

1. **Authentication & Multi-tenant Management**
   - Supabase-powered authentication
   - Role-based access control (RBAC)
   - Multiple branches per company
   - Role types: Owner, Admin, Estimator, Kasir (Cashier), Produksi (Production)

2. **Product Catalog Management**
   - Product templates (Banner, Sticker, Brochure, Packaging, DTG/DTF T-shirts, Merchandise)
   - Dynamic product attributes (size, sides, color, GSM, material, finishing)
   - Flexible product configuration

3. **Inventory Management**
   - Material master data with categories
   - Lot/batch tracking
   - Stock movements (in/out/adjust/transfer)
   - Stock reservations for orders
   - Physical stock counting (stock opname)
   - Low stock alerts and reorder points
   - Real-time availability tracking

4. **Cost of Goods & Pricing Engine**
   - Multi-component costing:
     - Material costs with waste factors
     - Machine costs (hourly rates + setup time)
     - Finishing costs
     - Overhead and labor allocation
   - Advanced pricing rules:
     - Margin percentage or flat markup
     - Quantity-based tier pricing
     - Express order surcharges
     - Complexity-based surcharges
     - Price floor and ceiling controls
   - Real-time HPP (Cost of Goods Manufactured) calculation

5. **Sales & Point of Sale**
   - Quotation creation with detailed specifications
   - Conversion to sales orders
   - Invoice generation with snapshots
   - Payment processing (Cash, Card, Transfer, QRIS)
   - POS sessions with cashier management
   - Quick sale items for fast checkout
   - Receipt generation

6. **Production Management**
   - Work order creation from sales orders
   - Process routing (Print → Laminate → Cut → QC)
   - Real-time production logging
   - Progress tracking
   - Quality control checkpoints
   - Actual vs planned variance tracking

7. **Delivery & Invoicing**
   - Delivery note generation
   - Invoice creation with order snapshots
   - Payment tracking
   - Multiple payment methods

8. **Reporting & Analytics**
   - Revenue and profit reports
   - HPP variance analysis
   - Material consumption reports
   - Machine efficiency tracking
   - Top products analysis
   - Order type distribution
   - Date range filtering

9. **Audit Trail**
   - Complete activity logging
   - User action tracking
   - Change history for critical operations

## Technical Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Icons**: Lucide React

## Database Schema

The system uses a comprehensive PostgreSQL schema with the following key tables:

- Multi-tenant: `companies`, `branches`, `users`, `roles`, `user_branch_roles`
- Products: `product_templates`, `product_attributes`, `product_attribute_values`, `finishing_options`
- Inventory: `materials`, `inventory_lots`, `inventory_movements`, `inventory_reservations`, `stock_opnames`
- Production: `machines`, `process_steps`, `work_orders`, `work_logs`
- Pricing: `pricing_rules`, `cost_centers`
- Sales: `customers`, `orders`, `order_items`, `item_bom_materials`, `item_bom_process`, `item_finishing`, `item_costs`
- Financial: `deliveries`, `invoices`, `pos_sessions`, `payments`
- Audit: `audit_logs`

## Cost Calculation Formula

### HPP (Cost of Goods Manufactured)

```
HPP_material = Σ(qty × unit_cost × (1 + waste_factor))
HPP_machine = Σ((time_min + setup_time_min) / 60 × rate_per_hour)
HPP_finishing = Σ(qty × unit_price)
HPP_allocation = Σ(allocation_amount)
HPP_total = HPP_material + HPP_machine + HPP_finishing + HPP_allocation
```

### Pricing Calculation

```
Base Price = HPP_total × (1 + margin%) [if margin mode]
           = HPP_total + markup_flat [if markup mode]

Tier Adjusted Price = Base Price × tier_adjustment_factor

Final Unit Price = Tier Adjusted Price × (1 + surcharge%)
                 = max(Final Unit Price, min_unit_price) [if floor set]

Total Price = Final Unit Price × quantity
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env` file with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. The database schema is already migrated via Supabase MCP tools

5. Create your company and user:
   - Sign up via the application login page
   - Create your company and branch via Supabase SQL Editor:
   ```sql
   -- Create your company
   INSERT INTO companies (name, code, address, phone, email, active)
   VALUES ('Your Company Name', 'YOUR-CODE', 'Your Address', '021-xxx', 'info@yourcompany.com', true)
   RETURNING id;

   -- Create your branch (use company_id from above)
   INSERT INTO branches (company_id, name, code, address, phone, active)
   VALUES ('[company-id]', 'Main Branch', 'MAIN', 'Your Address', '021-xxx', true)
   RETURNING id;

   -- Link user to branch with Owner role (use your auth.users.id and branch_id from above)
   INSERT INTO user_branch_roles (user_id, branch_id, role_id)
   VALUES (
     '[your-user-id-from-auth-users]',
     '[branch-id]',
     (SELECT id FROM roles WHERE name = 'Owner')
   );

   -- Add user to users table
   INSERT INTO users (id, email, full_name, role, company_id, active)
   VALUES (
     '[your-user-id-from-auth-users]',
     'your@email.com',
     'Your Name',
     'owner',
     '[company-id]',
     true
   );
   ```

### Development

Start the development server:
```bash
npm run dev
```

### Production Build

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## Operational Workflow

### 1. Quotation Process
1. Create quotation
2. Configure product specifications and attributes
3. System calculates HPP and pricing
4. Save quotation for customer review

### 2. Sales Order Process
1. Convert approved quotation to sales order
2. Lock pricing
3. Generate Bill of Materials (BOM)
4. Reserve inventory for materials

### 3. Production Process
1. Create work order from sales order
2. Production team logs actual progress
3. Track variance between planned and actual
4. Complete quality control checks

### 4. Delivery & Invoicing
1. Generate delivery note
2. Create invoice with order snapshot
3. Process payment via POS or manual entry
4. Close POS session at end of day

### 5. Inventory Management
1. Receive stock from suppliers
2. Track movements (in/out/adjust)
3. Perform periodic stock opname
4. Monitor low stock alerts

### 6. Reporting
1. View profit and loss reports
2. Analyze HPP variance
3. Track material consumption
4. Monitor machine efficiency
5. Review aging inventory lots

## Security Features

- Row Level Security (RLS) enabled on all tables
- User access restricted to their assigned branches
- Role-based permissions
- Secure authentication via Supabase
- Audit trail for all critical operations

## Row Level Security Policies

All tables implement strict RLS policies:
- Users can only access data from their assigned branches
- Company-level data filtered by user's branch membership
- Cross-branch data access prevented
- Admin and Owner roles have broader access within their company

## Future Enhancements

The following modules are planned for future releases:
- Advanced pricing rules editor UI
- Customer portal for order tracking
- Mobile app for production floor
- Integration with accounting software
- Automated purchase order generation
- Vendor management
- Advanced analytics and business intelligence
- Barcode scanning for inventory
- Digital signature for delivery

## License

Proprietary - All rights reserved

## Support

For support and questions, contact your system administrator.

# 🎉 Aplikasi Siap Digunakan!

## ✅ Yang Sudah Selesai

Database dan data demo sudah lengkap:
- ✅ 30+ tabel database dengan RLS
- ✅ Demo Company & Branch
- ✅ 5 Roles (Owner, Admin, Estimator, Kasir, Produksi)
- ✅ 6 Product Templates
- ✅ 9 Materials dengan stok
- ✅ 3 Machines
- ✅ 6 Process Steps
- ✅ 4 Finishing Options
- ✅ 3 Customers
- ✅ Pricing Rules
- ✅ Build berhasil tanpa error

## 🚀 Langkah Terakhir: Buat User Demo (2 Menit)

### Cara 1: Via Supabase Dashboard (TERCEPAT)

1. **Buka Supabase Dashboard Anda**
   - Masuk ke https://supabase.com/dashboard
   - Pilih project Anda

2. **Buka Authentication → Users**
   - Klik menu "Authentication" di sidebar kiri
   - Klik tab "Users"

3. **Klik "Add User" → "Create new user"**

4. **Isi Form User:**
   ```
   Email: admin@demo.com
   Password: demo123456
   ```

   **PENTING: ✅ CENTANG "Auto Confirm User"**

5. **Klik "Create user"**
   - Setelah dibuat, akan muncul User ID
   - **COPY User ID** yang muncul (contoh: `abc123-def456-...`)

6. **Link User ke Branch**
   - Buka menu "SQL Editor" di sidebar
   - Buat query baru
   - Paste query di bawah dan **GANTI `USER_ID`** dengan ID yang tadi di-copy:

```sql
INSERT INTO user_branch_roles (user_id, branch_id, role_id)
VALUES (
  'USER_ID',  -- <-- GANTI dengan User ID dari step 5
  '22222222-2222-2222-2222-222222222222',
  (SELECT id FROM roles WHERE name = 'Owner')
);
```

7. **Klik "Run"** untuk execute query

8. **SELESAI! 🎉** Sekarang Anda bisa login!

---

### Cara 2: Jika Sudah Punya User di Supabase Auth

Jika Anda sudah punya user di Supabase Auth, cukup jalankan query ini (ganti USER_ID):

```sql
-- Link existing user ke demo branch
INSERT INTO user_branch_roles (user_id, branch_id, role_id)
VALUES (
  'USER_ID_DARI_AUTH_USERS',
  '22222222-2222-2222-2222-222222222222',
  (SELECT id FROM roles WHERE name = 'Owner')
);
```

---

## 🏃 Jalankan Aplikasi

```bash
npm run dev
```

Buka browser: **http://localhost:5173**

## 🔐 Login Credentials

```
Email: admin@demo.com
Password: demo123456
```

## 🎯 Fitur Yang Bisa Dicoba

### 1. Dashboard
- Lihat metrics real-time
- Sales today
- Active work orders
- Low stock alerts

### 2. Products
- Browse 6 product templates yang sudah ada:
  - Banner Indoor & Outdoor
  - Stiker Vinyl
  - Brosur A4
  - Kaos DTG
  - Kartu Nama
- Tambah produk baru

### 3. Materials & Inventory
- 9 materials sudah ada dengan stok 100 unit masing-masing:
  - Frontlite, Backlit, Vinyl
  - Art Paper
  - 4 warna tinta eco solvent
  - Laminasi glossy
- Cek low stock alerts
- Lihat inventory lots

### 4. Orders
- Buat quotation baru
- Pilih customer: PT Maju Jaya, CV Sukses Makmur, atau Walk-in
- Convert quotation ke sales order
- Set express order (otomatis +20% surcharge)

### 5. POS
- Buka cashier session dengan opening balance
- Quick items untuk transaksi cepat
- 4 payment methods: Cash, Card, Transfer, QRIS
- Close session dengan cash counting

### 6. Production
- Lihat work orders
- Start/Complete production
- Track progress dan quantity

### 7. Reports
- Total revenue & profit margin
- Top products by revenue
- Order type distribution
- Date range filtering

---

## 🧪 Quick Test Scenario

Coba alur lengkap ini:

1. **Buat Order Baru**
   - Go to Orders → Click "New Order"
   - Customer: Walk-in Customer
   - Type: Sales Order
   - Save

2. **Buka POS Session**
   - Go to POS → Click "Open Cashier Session"
   - Opening Balance: 500000
   - Click quick item "Banner 3x2m"
   - Pay with Cash

3. **Lihat Reports**
   - Go to Reports
   - Lihat revenue yang baru masuk

---

## 🐛 Troubleshooting

### ❌ "Invalid login credentials"
- Pastikan user sudah di-create dan confirmed
- Pastikan email & password benar

### ❌ "No branches found" setelah login
- User belum di-link ke branch
- Jalankan query link user (lihat step 6 di atas)

### ❌ Dashboard kosong / no data
- Normal jika belum ada transaksi
- Coba buat order baru dulu

### ❌ Tidak bisa tambah product/material
- Pastikan user role adalah Owner atau Admin
- Cek di Supabase Dashboard → Authentication → Users → User Metadata

---

## 📝 Next Steps

Setelah aplikasi berjalan:

1. **Customisasi data demo**
   - Edit company name, branch name
   - Tambah products sesuai bisnis Anda
   - Update materials dan pricing

2. **Tambah user lain**
   - Buat user dengan role berbeda (Kasir, Produksi, dll)
   - Test akses sesuai role

3. **Production use**
   - Backup data secara berkala
   - Monitor RLS policies
   - Track audit logs

---

## 💡 Tips

- **Pricing Engine**: Harga otomatis dikalkulasi berdasarkan HPP + margin + tier discount + express surcharge
- **Inventory**: Stok otomatis berkurang saat order confirmed
- **Multi-branch**: Bisa tambah branch baru dan assign user per branch
- **RBAC**: Role-based access sudah diterapkan di semua modul

---

## 🆘 Butuh Bantuan?

Jika ada masalah:
1. Cek console browser (F12) untuk error messages
2. Cek Supabase Dashboard → Logs untuk database errors
3. Pastikan .env file sudah benar

**Happy Printing! 🖨️✨**

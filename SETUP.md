# Setup Guide - PrintPro

## Status: Almost Ready! 🎉

Data demo sudah berhasil di-load ke database:
- ✅ 1 Company (Demo Printing Co)
- ✅ 1 Branch (Main Branch)
- ✅ 5 Roles (Owner, Admin, Estimator, Kasir, Produksi)
- ✅ 6 Product Templates
- ✅ 9 Materials dengan stok
- ✅ 3 Machines
- ✅ 3 Customers

## Langkah Terakhir: Buat User Demo

### Opsi 1: Via Supabase Dashboard (Tercepat)

1. Buka Supabase Dashboard → Authentication → Users
2. Klik "Add User" → "Create new user"
3. Isi:
   - Email: `admin@demo.com`
   - Password: `demo123456`
   - Auto Confirm User: ✅ (centang ini)
4. Klik "Create user"
5. Copy User ID yang muncul (contoh: `abc123-def456-...`)

6. Kembali ke SQL Editor dan jalankan query ini (ganti `USER_ID` dengan ID yang di-copy):

```sql
INSERT INTO user_branch_roles (user_id, branch_id, role_id)
VALUES (
  'USER_ID',  -- <-- Ganti dengan User ID dari step 5
  '22222222-2222-2222-2222-222222222222',
  (SELECT id FROM roles WHERE name = 'Owner')
);
```

### Opsi 2: Via SQL (Satu Langkah)

Jalankan query ini di Supabase SQL Editor:

```sql
-- Create demo user via Supabase Auth (jika sudah ada akan di-skip)
-- Note: Password harus minimal 6 karakter
-- Email: admin@demo.com
-- Password: demo123456

-- Setelah user dibuat via Dashboard, link ke branch:
-- (Ganti USER_ID dengan ID user yang baru dibuat)
INSERT INTO user_branch_roles (user_id, branch_id, role_id)
SELECT
  auth.uid(),  -- ID user yang sedang login ke Supabase Dashboard
  '22222222-2222-2222-2222-222222222222',
  (SELECT id FROM roles WHERE name = 'Owner')
WHERE NOT EXISTS (
  SELECT 1 FROM user_branch_roles
  WHERE user_id = auth.uid()
  AND branch_id = '22222222-2222-2222-2222-222222222222'
);
```

## Cara Menjalankan Aplikasi

Setelah user dibuat dan di-link:

```bash
npm run dev
```

Buka browser: `http://localhost:5173`

Login dengan:
- Email: `admin@demo.com`
- Password: `demo123456`

## Yang Bisa Langsung Dicoba

Setelah login, Anda bisa:

1. **Dashboard** - Lihat overview bisnis
2. **Products** - 6 product templates siap pakai (Banner, Stiker, Brosur, dll)
3. **Materials** - 9 materials dengan stok 100 unit each
4. **Orders** - Buat quotation dan sales order baru
5. **POS** - Buka kasir session dan proses transaksi
6. **Production** - Monitor work orders
7. **Reports** - Lihat laporan penjualan dan profit

## Troubleshooting

**Masalah: Tidak bisa login**
- Pastikan user sudah di-confirm (Auto Confirm User dicentang)
- Pastikan user sudah di-link ke branch via `user_branch_roles`

**Masalah: "No branches found" setelah login**
- Jalankan query link user ke branch (lihat langkah 6 di Opsi 1)

**Masalah: Dashboard kosong**
- Normal jika belum ada transaksi
- Coba buat order baru dari menu Orders

## Quick Start Data

Untuk testing cepat:

1. Buat Order → Pilih customer "Walk-in Customer"
2. Tambah item dengan product "Banner Indoor"
3. Konfirmasi order
4. Buka POS → Open session dengan opening balance 500000
5. Bayar order yang tadi dibuat
6. Lihat hasilnya di Dashboard dan Reports

Selamat mencoba! 🚀

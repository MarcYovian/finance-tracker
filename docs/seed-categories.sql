-- ============================================
-- SEED CATEGORIES FOR USER
-- User ID: d09a4fff-0f9f-4227-b67c-83724dc830fa
-- ============================================
-- Note: Uses ON CONFLICT DO NOTHING to prevent duplicates
-- Constraint: categories_user_type_name_unique (user_id, type, name)

-- ============================================
-- EXPENSE CATEGORIES (Pengeluaran)
-- ============================================

-- 1. Makanan & Minuman (Parent)
INSERT INTO public.categories (user_id, name, type, color, icon, description, sort_order)
VALUES ('d09a4fff-0f9f-4227-b67c-83724dc830fa', 'Makanan & Minuman', 'expense', '#f97316', 'i-lucide-utensils', 'Makan di luar, groceries, kopi', 1)
ON CONFLICT (user_id, type, name) DO NOTHING;

-- Sub-kategori Makanan & Minuman
INSERT INTO public.categories (user_id, name, type, parent_id, color, icon, description, sort_order)
SELECT 
    'd09a4fff-0f9f-4227-b67c-83724dc830fa', 
    'Makan Siang', 
    'expense', 
    id, 
    '#fb923c', 
    'i-lucide-utensils', 
    'Makan siang harian', 
    1
FROM public.categories 
WHERE user_id = 'd09a4fff-0f9f-4227-b67c-83724dc830fa' AND name = 'Makanan & Minuman' AND type = 'expense'
ON CONFLICT (user_id, type, name) DO NOTHING;

INSERT INTO public.categories (user_id, name, type, parent_id, color, icon, description, sort_order)
SELECT 
    'd09a4fff-0f9f-4227-b67c-83724dc830fa', 
    'Makan Malam', 
    'expense', 
    id, 
    '#fb923c', 
    'i-lucide-utensils', 
    'Makan malam', 
    2
FROM public.categories 
WHERE user_id = 'd09a4fff-0f9f-4227-b67c-83724dc830fa' AND name = 'Makanan & Minuman' AND type = 'expense'
ON CONFLICT (user_id, type, name) DO NOTHING;

INSERT INTO public.categories (user_id, name, type, parent_id, color, icon, description, sort_order)
SELECT 
    'd09a4fff-0f9f-4227-b67c-83724dc830fa', 
    'Groceries', 
    'expense', 
    id, 
    '#fb923c', 
    'i-lucide-shopping-cart', 
    'Belanja bulanan, bahan makanan', 
    3
FROM public.categories 
WHERE user_id = 'd09a4fff-0f9f-4227-b67c-83724dc830fa' AND name = 'Makanan & Minuman' AND type = 'expense'
ON CONFLICT (user_id, type, name) DO NOTHING;

INSERT INTO public.categories (user_id, name, type, parent_id, color, icon, description, sort_order)
SELECT 
    'd09a4fff-0f9f-4227-b67c-83724dc830fa', 
    'Kopi & Snack', 
    'expense', 
    id, 
    '#fb923c', 
    'i-lucide-coffee', 
    'Kopi, teh, cemilan', 
    4
FROM public.categories 
WHERE user_id = 'd09a4fff-0f9f-4227-b67c-83724dc830fa' AND name = 'Makanan & Minuman' AND type = 'expense'
ON CONFLICT (user_id, type, name) DO NOTHING;

-- 2. Transportasi (Parent)
INSERT INTO public.categories (user_id, name, type, color, icon, description, sort_order)
VALUES ('d09a4fff-0f9f-4227-b67c-83724dc830fa', 'Transportasi', 'expense', '#3b82f6', 'i-lucide-car', 'Bensin, parkir, transportasi umum', 2)
ON CONFLICT (user_id, type, name) DO NOTHING;

-- Sub-kategori Transportasi
INSERT INTO public.categories (user_id, name, type, parent_id, color, icon, description, sort_order)
SELECT 'd09a4fff-0f9f-4227-b67c-83724dc830fa', 'Bensin', 'expense', id, '#60a5fa', 'i-lucide-fuel', 'BBM kendaraan', 1
FROM public.categories WHERE user_id = 'd09a4fff-0f9f-4227-b67c-83724dc830fa' AND name = 'Transportasi' AND type = 'expense'
ON CONFLICT (user_id, type, name) DO NOTHING;

INSERT INTO public.categories (user_id, name, type, parent_id, color, icon, description, sort_order)
SELECT 'd09a4fff-0f9f-4227-b67c-83724dc830fa', 'Parkir', 'expense', id, '#60a5fa', 'i-lucide-car', 'Biaya parkir', 2
FROM public.categories WHERE user_id = 'd09a4fff-0f9f-4227-b67c-83724dc830fa' AND name = 'Transportasi' AND type = 'expense'
ON CONFLICT (user_id, type, name) DO NOTHING;

INSERT INTO public.categories (user_id, name, type, parent_id, color, icon, description, sort_order)
SELECT 'd09a4fff-0f9f-4227-b67c-83724dc830fa', 'Ojek Online', 'expense', id, '#60a5fa', 'i-lucide-bike', 'Gojek, Grab, dll', 3
FROM public.categories WHERE user_id = 'd09a4fff-0f9f-4227-b67c-83724dc830fa' AND name = 'Transportasi' AND type = 'expense'
ON CONFLICT (user_id, type, name) DO NOTHING;

INSERT INTO public.categories (user_id, name, type, parent_id, color, icon, description, sort_order)
SELECT 'd09a4fff-0f9f-4227-b67c-83724dc830fa', 'Angkutan Umum', 'expense', id, '#60a5fa', 'i-lucide-train', 'Bus, kereta, MRT', 4
FROM public.categories WHERE user_id = 'd09a4fff-0f9f-4227-b67c-83724dc830fa' AND name = 'Transportasi' AND type = 'expense'
ON CONFLICT (user_id, type, name) DO NOTHING;

-- 3. Belanja (Parent)
INSERT INTO public.categories (user_id, name, type, color, icon, description, sort_order)
VALUES ('d09a4fff-0f9f-4227-b67c-83724dc830fa', 'Belanja', 'expense', '#a855f7', 'i-lucide-shopping-bag', 'Pakaian, elektronik, kebutuhan rumah', 3)
ON CONFLICT (user_id, type, name) DO NOTHING;

-- 4. Tagihan & Utilitas (Parent)
INSERT INTO public.categories (user_id, name, type, color, icon, description, sort_order)
VALUES ('d09a4fff-0f9f-4227-b67c-83724dc830fa', 'Tagihan & Utilitas', 'expense', '#eab308', 'i-lucide-zap', 'Listrik, air, internet, telepon', 4)
ON CONFLICT (user_id, type, name) DO NOTHING;

-- Sub-kategori Tagihan
INSERT INTO public.categories (user_id, name, type, parent_id, color, icon, description, sort_order)
SELECT 'd09a4fff-0f9f-4227-b67c-83724dc830fa', 'Listrik', 'expense', id, '#fbbf24', 'i-lucide-zap', 'Tagihan listrik PLN', 1
FROM public.categories WHERE user_id = 'd09a4fff-0f9f-4227-b67c-83724dc830fa' AND name = 'Tagihan & Utilitas' AND type = 'expense'
ON CONFLICT (user_id, type, name) DO NOTHING;

INSERT INTO public.categories (user_id, name, type, parent_id, color, icon, description, sort_order)
SELECT 'd09a4fff-0f9f-4227-b67c-83724dc830fa', 'Air PDAM', 'expense', id, '#22d3ee', 'i-lucide-droplets', 'Tagihan air', 2
FROM public.categories WHERE user_id = 'd09a4fff-0f9f-4227-b67c-83724dc830fa' AND name = 'Tagihan & Utilitas' AND type = 'expense'
ON CONFLICT (user_id, type, name) DO NOTHING;

INSERT INTO public.categories (user_id, name, type, parent_id, color, icon, description, sort_order)
SELECT 'd09a4fff-0f9f-4227-b67c-83724dc830fa', 'Internet', 'expense', id, '#0ea5e9', 'i-lucide-wifi', 'Tagihan internet/WiFi', 3
FROM public.categories WHERE user_id = 'd09a4fff-0f9f-4227-b67c-83724dc830fa' AND name = 'Tagihan & Utilitas' AND type = 'expense'
ON CONFLICT (user_id, type, name) DO NOTHING;

INSERT INTO public.categories (user_id, name, type, parent_id, color, icon, description, sort_order)
SELECT 'd09a4fff-0f9f-4227-b67c-83724dc830fa', 'Pulsa & Paket Data', 'expense', id, '#06b6d4', 'i-lucide-smartphone', 'Pulsa dan kuota internet', 4
FROM public.categories WHERE user_id = 'd09a4fff-0f9f-4227-b67c-83724dc830fa' AND name = 'Tagihan & Utilitas' AND type = 'expense'
ON CONFLICT (user_id, type, name) DO NOTHING;

-- 5. Rumah (Parent)
INSERT INTO public.categories (user_id, name, type, color, icon, description, sort_order)
VALUES ('d09a4fff-0f9f-4227-b67c-83724dc830fa', 'Rumah', 'expense', '#78716c', 'i-lucide-home', 'Sewa/cicilan, perbaikan, perabotan', 5)
ON CONFLICT (user_id, type, name) DO NOTHING;

-- 6. Kesehatan (Parent)
INSERT INTO public.categories (user_id, name, type, color, icon, description, sort_order)
VALUES ('d09a4fff-0f9f-4227-b67c-83724dc830fa', 'Kesehatan', 'expense', '#ef4444', 'i-lucide-heart-pulse', 'Obat, dokter, asuransi kesehatan', 6)
ON CONFLICT (user_id, type, name) DO NOTHING;

-- 7. Hiburan (Parent)
INSERT INTO public.categories (user_id, name, type, color, icon, description, sort_order)
VALUES ('d09a4fff-0f9f-4227-b67c-83724dc830fa', 'Hiburan', 'expense', '#22c55e', 'i-lucide-gamepad-2', 'Netflix, Spotify, game, bioskop', 7)
ON CONFLICT (user_id, type, name) DO NOTHING;

-- Sub-kategori Hiburan
INSERT INTO public.categories (user_id, name, type, parent_id, color, icon, description, sort_order)
SELECT 'd09a4fff-0f9f-4227-b67c-83724dc830fa', 'Streaming', 'expense', id, '#4ade80', 'i-lucide-play-circle', 'Netflix, Spotify, Disney+', 1
FROM public.categories WHERE user_id = 'd09a4fff-0f9f-4227-b67c-83724dc830fa' AND name = 'Hiburan' AND type = 'expense'
ON CONFLICT (user_id, type, name) DO NOTHING;

INSERT INTO public.categories (user_id, name, type, parent_id, color, icon, description, sort_order)
SELECT 'd09a4fff-0f9f-4227-b67c-83724dc830fa', 'Game', 'expense', id, '#4ade80', 'i-lucide-gamepad-2', 'Game dan in-app purchase', 2
FROM public.categories WHERE user_id = 'd09a4fff-0f9f-4227-b67c-83724dc830fa' AND name = 'Hiburan' AND type = 'expense'
ON CONFLICT (user_id, type, name) DO NOTHING;

-- 8. Pendidikan (Parent)
INSERT INTO public.categories (user_id, name, type, color, icon, description, sort_order)
VALUES ('d09a4fff-0f9f-4227-b67c-83724dc830fa', 'Pendidikan', 'expense', '#0ea5e9', 'i-lucide-graduation-cap', 'Kursus, buku, sekolah', 8)
ON CONFLICT (user_id, type, name) DO NOTHING;

-- 9. Hadiah & Donasi (Parent)
INSERT INTO public.categories (user_id, name, type, color, icon, description, sort_order)
VALUES ('d09a4fff-0f9f-4227-b67c-83724dc830fa', 'Hadiah & Donasi', 'expense', '#d946ef', 'i-lucide-gift', 'Kado, sumbangan, zakat', 9)
ON CONFLICT (user_id, type, name) DO NOTHING;

-- 10. Lainnya (Parent)
INSERT INTO public.categories (user_id, name, type, color, icon, description, sort_order)
VALUES ('d09a4fff-0f9f-4227-b67c-83724dc830fa', 'Lainnya', 'expense', '#6b7280', 'i-lucide-more-horizontal', 'Pengeluaran lain-lain', 99)
ON CONFLICT (user_id, type, name) DO NOTHING;


-- ============================================
-- INCOME CATEGORIES (Pemasukan)
-- ============================================

-- 1. Gaji (Parent)
INSERT INTO public.categories (user_id, name, type, color, icon, description, sort_order)
VALUES ('d09a4fff-0f9f-4227-b67c-83724dc830fa', 'Gaji', 'income', '#10b981', 'i-lucide-briefcase', 'Gaji bulanan, THR', 1)
ON CONFLICT (user_id, type, name) DO NOTHING;

-- Sub-kategori Gaji
INSERT INTO public.categories (user_id, name, type, parent_id, color, icon, description, sort_order)
SELECT 'd09a4fff-0f9f-4227-b67c-83724dc830fa', 'Gaji Pokok', 'income', id, '#34d399', 'i-lucide-briefcase', 'Gaji bulanan tetap', 1
FROM public.categories WHERE user_id = 'd09a4fff-0f9f-4227-b67c-83724dc830fa' AND name = 'Gaji' AND type = 'income'
ON CONFLICT (user_id, type, name) DO NOTHING;

INSERT INTO public.categories (user_id, name, type, parent_id, color, icon, description, sort_order)
SELECT 'd09a4fff-0f9f-4227-b67c-83724dc830fa', 'Bonus', 'income', id, '#34d399', 'i-lucide-star', 'Bonus tahunan, THR', 2
FROM public.categories WHERE user_id = 'd09a4fff-0f9f-4227-b67c-83724dc830fa' AND name = 'Gaji' AND type = 'income'
ON CONFLICT (user_id, type, name) DO NOTHING;

INSERT INTO public.categories (user_id, name, type, parent_id, color, icon, description, sort_order)
SELECT 'd09a4fff-0f9f-4227-b67c-83724dc830fa', 'Lembur', 'income', id, '#34d399', 'i-lucide-clock', 'Upah lembur', 3
FROM public.categories WHERE user_id = 'd09a4fff-0f9f-4227-b67c-83724dc830fa' AND name = 'Gaji' AND type = 'income'
ON CONFLICT (user_id, type, name) DO NOTHING;

-- 2. Freelance (Parent)
INSERT INTO public.categories (user_id, name, type, color, icon, description, sort_order)
VALUES ('d09a4fff-0f9f-4227-b67c-83724dc830fa', 'Freelance', 'income', '#3b82f6', 'i-lucide-laptop', 'Proyek sampingan, konsultasi', 2)
ON CONFLICT (user_id, type, name) DO NOTHING;

-- 3. Investasi (Parent)
INSERT INTO public.categories (user_id, name, type, color, icon, description, sort_order)
VALUES ('d09a4fff-0f9f-4227-b67c-83724dc830fa', 'Investasi', 'income', '#8b5cf6', 'i-lucide-trending-up', 'Dividen, capital gain, bunga', 3)
ON CONFLICT (user_id, type, name) DO NOTHING;

-- Sub-kategori Investasi
INSERT INTO public.categories (user_id, name, type, parent_id, color, icon, description, sort_order)
SELECT 'd09a4fff-0f9f-4227-b67c-83724dc830fa', 'Dividen', 'income', id, '#a78bfa', 'i-lucide-coins', 'Dividen saham', 1
FROM public.categories WHERE user_id = 'd09a4fff-0f9f-4227-b67c-83724dc830fa' AND name = 'Investasi' AND type = 'income'
ON CONFLICT (user_id, type, name) DO NOTHING;

INSERT INTO public.categories (user_id, name, type, parent_id, color, icon, description, sort_order)
SELECT 'd09a4fff-0f9f-4227-b67c-83724dc830fa', 'Bunga Deposito', 'income', id, '#a78bfa', 'i-lucide-percent', 'Bunga dari deposito/tabungan', 2
FROM public.categories WHERE user_id = 'd09a4fff-0f9f-4227-b67c-83724dc830fa' AND name = 'Investasi' AND type = 'income'
ON CONFLICT (user_id, type, name) DO NOTHING;

-- 4. Bisnis (Parent)
INSERT INTO public.categories (user_id, name, type, color, icon, description, sort_order)
VALUES ('d09a4fff-0f9f-4227-b67c-83724dc830fa', 'Bisnis', 'income', '#f59e0b', 'i-lucide-store', 'Keuntungan usaha, penjualan', 4)
ON CONFLICT (user_id, type, name) DO NOTHING;

-- 5. Hadiah (Parent)
INSERT INTO public.categories (user_id, name, type, color, icon, description, sort_order)
VALUES ('d09a4fff-0f9f-4227-b67c-83724dc830fa', 'Hadiah', 'income', '#ec4899', 'i-lucide-gift', 'Hadiah, cashback, reward', 5)
ON CONFLICT (user_id, type, name) DO NOTHING;

-- 6. Lainnya (Parent)
INSERT INTO public.categories (user_id, name, type, color, icon, description, sort_order)
VALUES ('d09a4fff-0f9f-4227-b67c-83724dc830fa', 'Lainnya', 'income', '#6b7280', 'i-lucide-more-horizontal', 'Pemasukan lain-lain', 99)
ON CONFLICT (user_id, type, name) DO NOTHING;


-- ============================================
-- VERIFY RESULTS
-- ============================================
SELECT 
    type,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE parent_id IS NULL) as parent_categories,
    COUNT(*) FILTER (WHERE parent_id IS NOT NULL) as sub_categories
FROM public.categories 
WHERE user_id = 'd09a4fff-0f9f-4227-b67c-83724dc830fa'
GROUP BY type;

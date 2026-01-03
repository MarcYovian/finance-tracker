-- ============================================
-- AUTO-SEED CATEGORIES FOR NEW USERS
-- ============================================
-- This script creates a trigger that automatically seeds default
-- categories when a new user confirms their email.
--
-- Run this in Supabase SQL Editor after the base schema is set up.
-- ============================================

-- Drop existing function and trigger if they exist
DROP TRIGGER IF EXISTS trigger_seed_categories_on_email_confirm ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_confirmed CASCADE;
DROP FUNCTION IF EXISTS public.seed_default_categories CASCADE;

-- ============================================
-- 1. FUNCTION: SEED DEFAULT CATEGORIES
-- ============================================
-- Creates all default expense and income categories for a user
CREATE OR REPLACE FUNCTION public.seed_default_categories(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_parent_id UUID;
BEGIN
  -- ==========================================
  -- EXPENSE CATEGORIES
  -- ==========================================

  -- 1. Makanan & Minuman (Parent)
  INSERT INTO public.categories (user_id, name, type, color, icon, description, sort_order)
  VALUES (p_user_id, 'Makanan & Minuman', 'expense', '#f97316', 'i-lucide-utensils', 'Makan di luar, groceries, kopi', 1)
  ON CONFLICT (user_id, type, name) DO NOTHING
  RETURNING id INTO v_parent_id;

  IF v_parent_id IS NOT NULL THEN
    INSERT INTO public.categories (user_id, name, type, parent_id, color, icon, description, sort_order) VALUES
      (p_user_id, 'Makan Siang', 'expense', v_parent_id, '#fb923c', 'i-lucide-utensils', 'Makan siang harian', 1),
      (p_user_id, 'Makan Malam', 'expense', v_parent_id, '#fb923c', 'i-lucide-utensils', 'Makan malam', 2),
      (p_user_id, 'Groceries', 'expense', v_parent_id, '#fb923c', 'i-lucide-shopping-cart', 'Belanja bulanan, bahan makanan', 3),
      (p_user_id, 'Kopi & Snack', 'expense', v_parent_id, '#fb923c', 'i-lucide-coffee', 'Kopi, teh, cemilan', 4)
    ON CONFLICT (user_id, type, name) DO NOTHING;
  END IF;

  -- 2. Transportasi (Parent)
  INSERT INTO public.categories (user_id, name, type, color, icon, description, sort_order)
  VALUES (p_user_id, 'Transportasi', 'expense', '#3b82f6', 'i-lucide-car', 'Bensin, parkir, transportasi umum', 2)
  ON CONFLICT (user_id, type, name) DO NOTHING
  RETURNING id INTO v_parent_id;

  IF v_parent_id IS NOT NULL THEN
    INSERT INTO public.categories (user_id, name, type, parent_id, color, icon, description, sort_order) VALUES
      (p_user_id, 'Bensin', 'expense', v_parent_id, '#60a5fa', 'i-lucide-fuel', 'BBM kendaraan', 1),
      (p_user_id, 'Parkir', 'expense', v_parent_id, '#60a5fa', 'i-lucide-car', 'Biaya parkir', 2),
      (p_user_id, 'Ojek Online', 'expense', v_parent_id, '#60a5fa', 'i-lucide-bike', 'Gojek, Grab, dll', 3),
      (p_user_id, 'Angkutan Umum', 'expense', v_parent_id, '#60a5fa', 'i-lucide-train', 'Bus, kereta, MRT', 4)
    ON CONFLICT (user_id, type, name) DO NOTHING;
  END IF;

  -- 3. Belanja (Parent - no children)
  INSERT INTO public.categories (user_id, name, type, color, icon, description, sort_order)
  VALUES (p_user_id, 'Belanja', 'expense', '#a855f7', 'i-lucide-shopping-bag', 'Pakaian, elektronik, kebutuhan rumah', 3)
  ON CONFLICT (user_id, type, name) DO NOTHING;

  -- 4. Tagihan & Utilitas (Parent)
  INSERT INTO public.categories (user_id, name, type, color, icon, description, sort_order)
  VALUES (p_user_id, 'Tagihan & Utilitas', 'expense', '#eab308', 'i-lucide-zap', 'Listrik, air, internet, telepon', 4)
  ON CONFLICT (user_id, type, name) DO NOTHING
  RETURNING id INTO v_parent_id;

  IF v_parent_id IS NOT NULL THEN
    INSERT INTO public.categories (user_id, name, type, parent_id, color, icon, description, sort_order) VALUES
      (p_user_id, 'Listrik', 'expense', v_parent_id, '#fbbf24', 'i-lucide-zap', 'Tagihan listrik PLN', 1),
      (p_user_id, 'Air PDAM', 'expense', v_parent_id, '#22d3ee', 'i-lucide-droplets', 'Tagihan air', 2),
      (p_user_id, 'Internet', 'expense', v_parent_id, '#0ea5e9', 'i-lucide-wifi', 'Tagihan internet/WiFi', 3),
      (p_user_id, 'Pulsa & Paket Data', 'expense', v_parent_id, '#06b6d4', 'i-lucide-smartphone', 'Pulsa dan kuota internet', 4)
    ON CONFLICT (user_id, type, name) DO NOTHING;
  END IF;

  -- 5. Rumah (Parent - no children)
  INSERT INTO public.categories (user_id, name, type, color, icon, description, sort_order)
  VALUES (p_user_id, 'Rumah', 'expense', '#78716c', 'i-lucide-home', 'Sewa/cicilan, perbaikan, perabotan', 5)
  ON CONFLICT (user_id, type, name) DO NOTHING;

  -- 6. Kesehatan (Parent - no children)
  INSERT INTO public.categories (user_id, name, type, color, icon, description, sort_order)
  VALUES (p_user_id, 'Kesehatan', 'expense', '#ef4444', 'i-lucide-heart-pulse', 'Obat, dokter, asuransi kesehatan', 6)
  ON CONFLICT (user_id, type, name) DO NOTHING;

  -- 7. Hiburan (Parent)
  INSERT INTO public.categories (user_id, name, type, color, icon, description, sort_order)
  VALUES (p_user_id, 'Hiburan', 'expense', '#22c55e', 'i-lucide-gamepad-2', 'Netflix, Spotify, game, bioskop', 7)
  ON CONFLICT (user_id, type, name) DO NOTHING
  RETURNING id INTO v_parent_id;

  IF v_parent_id IS NOT NULL THEN
    INSERT INTO public.categories (user_id, name, type, parent_id, color, icon, description, sort_order) VALUES
      (p_user_id, 'Streaming', 'expense', v_parent_id, '#4ade80', 'i-lucide-play-circle', 'Netflix, Spotify, Disney+', 1),
      (p_user_id, 'Game', 'expense', v_parent_id, '#4ade80', 'i-lucide-gamepad-2', 'Game dan in-app purchase', 2)
    ON CONFLICT (user_id, type, name) DO NOTHING;
  END IF;

  -- 8. Pendidikan (Parent - no children)
  INSERT INTO public.categories (user_id, name, type, color, icon, description, sort_order)
  VALUES (p_user_id, 'Pendidikan', 'expense', '#0ea5e9', 'i-lucide-graduation-cap', 'Kursus, buku, sekolah', 8)
  ON CONFLICT (user_id, type, name) DO NOTHING;

  -- 9. Hadiah & Donasi (Parent - no children)
  INSERT INTO public.categories (user_id, name, type, color, icon, description, sort_order)
  VALUES (p_user_id, 'Hadiah & Donasi', 'expense', '#d946ef', 'i-lucide-gift', 'Kado, sumbangan, zakat', 9)
  ON CONFLICT (user_id, type, name) DO NOTHING;

  -- 10. Lainnya Expense (Parent - no children)
  INSERT INTO public.categories (user_id, name, type, color, icon, description, sort_order)
  VALUES (p_user_id, 'Lainnya', 'expense', '#6b7280', 'i-lucide-more-horizontal', 'Pengeluaran lain-lain', 99)
  ON CONFLICT (user_id, type, name) DO NOTHING;

  -- ==========================================
  -- INCOME CATEGORIES
  -- ==========================================

  -- 1. Gaji (Parent)
  INSERT INTO public.categories (user_id, name, type, color, icon, description, sort_order)
  VALUES (p_user_id, 'Gaji', 'income', '#10b981', 'i-lucide-briefcase', 'Gaji bulanan, THR', 1)
  ON CONFLICT (user_id, type, name) DO NOTHING
  RETURNING id INTO v_parent_id;

  IF v_parent_id IS NOT NULL THEN
    INSERT INTO public.categories (user_id, name, type, parent_id, color, icon, description, sort_order) VALUES
      (p_user_id, 'Gaji Pokok', 'income', v_parent_id, '#34d399', 'i-lucide-briefcase', 'Gaji bulanan tetap', 1),
      (p_user_id, 'Bonus', 'income', v_parent_id, '#34d399', 'i-lucide-star', 'Bonus tahunan, THR', 2),
      (p_user_id, 'Lembur', 'income', v_parent_id, '#34d399', 'i-lucide-clock', 'Upah lembur', 3)
    ON CONFLICT (user_id, type, name) DO NOTHING;
  END IF;

  -- 2. Freelance (Parent - no children)
  INSERT INTO public.categories (user_id, name, type, color, icon, description, sort_order)
  VALUES (p_user_id, 'Freelance', 'income', '#3b82f6', 'i-lucide-laptop', 'Proyek sampingan, konsultasi', 2)
  ON CONFLICT (user_id, type, name) DO NOTHING;

  -- 3. Investasi (Parent)
  INSERT INTO public.categories (user_id, name, type, color, icon, description, sort_order)
  VALUES (p_user_id, 'Investasi', 'income', '#8b5cf6', 'i-lucide-trending-up', 'Dividen, capital gain, bunga', 3)
  ON CONFLICT (user_id, type, name) DO NOTHING
  RETURNING id INTO v_parent_id;

  IF v_parent_id IS NOT NULL THEN
    INSERT INTO public.categories (user_id, name, type, parent_id, color, icon, description, sort_order) VALUES
      (p_user_id, 'Dividen', 'income', v_parent_id, '#a78bfa', 'i-lucide-coins', 'Dividen saham', 1),
      (p_user_id, 'Bunga Deposito', 'income', v_parent_id, '#a78bfa', 'i-lucide-percent', 'Bunga dari deposito/tabungan', 2)
    ON CONFLICT (user_id, type, name) DO NOTHING;
  END IF;

  -- 4. Bisnis (Parent - no children)
  INSERT INTO public.categories (user_id, name, type, color, icon, description, sort_order)
  VALUES (p_user_id, 'Bisnis', 'income', '#f59e0b', 'i-lucide-store', 'Keuntungan usaha, penjualan', 4)
  ON CONFLICT (user_id, type, name) DO NOTHING;

  -- 5. Hadiah Income (Parent - no children)
  INSERT INTO public.categories (user_id, name, type, color, icon, description, sort_order)
  VALUES (p_user_id, 'Hadiah', 'income', '#ec4899', 'i-lucide-gift', 'Hadiah, cashback, reward', 5)
  ON CONFLICT (user_id, type, name) DO NOTHING;

  -- 6. Lainnya Income (Parent - no children)
  INSERT INTO public.categories (user_id, name, type, color, icon, description, sort_order)
  VALUES (p_user_id, 'Lainnya', 'income', '#6b7280', 'i-lucide-more-horizontal', 'Pemasukan lain-lain', 99)
  ON CONFLICT (user_id, type, name) DO NOTHING;

  -- Create welcome notification
  PERFORM public.create_notification(
    p_user_id,
    'security',
    'Selamat Datang! 🎉',
    'Akun Anda telah dikonfirmasi. Kategori default sudah disiapkan untuk Anda.',
    'i-lucide-party-popper',
    'success',
    '/categories',
    '{}'::jsonb
  );

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 2. TRIGGER FUNCTION: HANDLE EMAIL CONFIRMATION
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user_confirmed()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if email was just confirmed (email_confirmed_at changed from NULL to a value)
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    -- Seed default categories for this user
    PERFORM public.seed_default_categories(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. CREATE TRIGGER ON AUTH.USERS
-- ============================================
CREATE TRIGGER trigger_seed_categories_on_email_confirm
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_confirmed();

-- ============================================
-- DONE!
-- ============================================
-- When a new user confirms their email:
-- 1. The trigger fires
-- 2. Calls seed_default_categories(user_id)
-- 3. Creates all default expense/income categories
-- 4. Sends a welcome notification

-- To test manually (replace with actual user_id):
-- SELECT public.seed_default_categories('your-user-uuid-here');

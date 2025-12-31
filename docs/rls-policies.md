# Row Level Security (RLS) Policies

Dokumentasi ini berisi SQL untuk mengkonfigurasi Row Level Security di Supabase untuk aplikasi Finance Tracker.

## Cara Menjalankan

1. Buka [Supabase Dashboard](https://supabase.com/dashboard)
2. Pilih project Anda
3. Klik **SQL Editor** di menu kiri
4. Copy-paste SQL di bawah
5. Klik **Run** atau tekan `Ctrl+Enter`

---

## SQL Script (Copy Paste Langsung)

```sql
-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- Finance Tracker Application
-- Run this in Supabase SQL Editor
-- =============================================

-- =============================================
-- 1. FUND SOURCES
-- =============================================
ALTER TABLE fund_sources ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can delete own fund sources" ON fund_sources;
DROP POLICY IF EXISTS "Users can delete their own fund sources" ON fund_sources;
DROP POLICY IF EXISTS "Users can insert own fund sources" ON fund_sources;
DROP POLICY IF EXISTS "Users can insert their own fund sources" ON fund_sources;
DROP POLICY IF EXISTS "Users can update own fund sources" ON fund_sources;
DROP POLICY IF EXISTS "Users can update their own fund sources" ON fund_sources;
DROP POLICY IF EXISTS "Users can view own fund sources" ON fund_sources;
DROP POLICY IF EXISTS "Users can view their own fund sources" ON fund_sources;
DROP POLICY IF EXISTS "Enable read access for users" ON fund_sources;
DROP POLICY IF EXISTS "Enable insert access for users" ON fund_sources;
DROP POLICY IF EXISTS "Enable update access for users" ON fund_sources;
DROP POLICY IF EXISTS "Enable delete access for users" ON fund_sources;

-- Create new policies
CREATE POLICY "Users can view own fund sources" ON fund_sources
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own fund sources" ON fund_sources
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own fund sources" ON fund_sources
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own fund sources" ON fund_sources
    FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- 2. CATEGORIES
-- =============================================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own categories" ON categories;
DROP POLICY IF EXISTS "Users can view their own categories" ON categories;
DROP POLICY IF EXISTS "Users can insert own categories" ON categories;
DROP POLICY IF EXISTS "Users can insert their own categories" ON categories;
DROP POLICY IF EXISTS "Users can update own categories" ON categories;
DROP POLICY IF EXISTS "Users can update their own categories" ON categories;
DROP POLICY IF EXISTS "Users can delete own categories" ON categories;
DROP POLICY IF EXISTS "Users can delete their own categories" ON categories;
DROP POLICY IF EXISTS "Enable read access for users" ON categories;
DROP POLICY IF EXISTS "Enable insert access for users" ON categories;
DROP POLICY IF EXISTS "Enable update access for users" ON categories;
DROP POLICY IF EXISTS "Enable delete access for users" ON categories;

-- Create new policies
CREATE POLICY "Users can view own categories" ON categories
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categories" ON categories
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories" ON categories
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories" ON categories
    FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- 3. TRANSACTIONS
-- =============================================
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can view their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can update their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can delete own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can delete their own transactions" ON transactions;
DROP POLICY IF EXISTS "Enable read access for users" ON transactions;
DROP POLICY IF EXISTS "Enable insert access for users" ON transactions;
DROP POLICY IF EXISTS "Enable update access for users" ON transactions;
DROP POLICY IF EXISTS "Enable delete access for users" ON transactions;

-- Create new policies
CREATE POLICY "Users can view own transactions" ON transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions" ON transactions
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions" ON transactions
    FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- 4. BUDGETS
-- =============================================
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own budgets" ON budgets;
DROP POLICY IF EXISTS "Users can view their own budgets" ON budgets;
DROP POLICY IF EXISTS "Users can insert own budgets" ON budgets;
DROP POLICY IF EXISTS "Users can insert their own budgets" ON budgets;
DROP POLICY IF EXISTS "Users can update own budgets" ON budgets;
DROP POLICY IF EXISTS "Users can update their own budgets" ON budgets;
DROP POLICY IF EXISTS "Users can delete own budgets" ON budgets;
DROP POLICY IF EXISTS "Users can delete their own budgets" ON budgets;
DROP POLICY IF EXISTS "Enable read access for users" ON budgets;
DROP POLICY IF EXISTS "Enable insert access for users" ON budgets;
DROP POLICY IF EXISTS "Enable update access for users" ON budgets;
DROP POLICY IF EXISTS "Enable delete access for users" ON budgets;

-- Create new policies
CREATE POLICY "Users can view own budgets" ON budgets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own budgets" ON budgets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budgets" ON budgets
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own budgets" ON budgets
    FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- 5. BUDGET ITEMS
-- =============================================
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own budget items" ON budget_items;
DROP POLICY IF EXISTS "Users can view their own budget items" ON budget_items;
DROP POLICY IF EXISTS "Users can insert own budget items" ON budget_items;
DROP POLICY IF EXISTS "Users can insert their own budget items" ON budget_items;
DROP POLICY IF EXISTS "Users can update own budget items" ON budget_items;
DROP POLICY IF EXISTS "Users can update their own budget items" ON budget_items;
DROP POLICY IF EXISTS "Users can delete own budget items" ON budget_items;
DROP POLICY IF EXISTS "Users can delete their own budget items" ON budget_items;
DROP POLICY IF EXISTS "Enable read access for users" ON budget_items;
DROP POLICY IF EXISTS "Enable insert access for users" ON budget_items;
DROP POLICY IF EXISTS "Enable update access for users" ON budget_items;
DROP POLICY IF EXISTS "Enable delete access for users" ON budget_items;

-- Create new policies (based on parent budget ownership)
CREATE POLICY "Users can view own budget items" ON budget_items
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM budgets WHERE budgets.id = budget_items.budget_id AND budgets.user_id = auth.uid())
    );

CREATE POLICY "Users can insert own budget items" ON budget_items
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM budgets WHERE budgets.id = budget_items.budget_id AND budgets.user_id = auth.uid())
    );

CREATE POLICY "Users can update own budget items" ON budget_items
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM budgets WHERE budgets.id = budget_items.budget_id AND budgets.user_id = auth.uid())
    );

CREATE POLICY "Users can delete own budget items" ON budget_items
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM budgets WHERE budgets.id = budget_items.budget_id AND budgets.user_id = auth.uid())
    );

-- =============================================
-- 6. FINANCIAL GOALS
-- =============================================
ALTER TABLE financial_goals ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own goals" ON financial_goals;
DROP POLICY IF EXISTS "Users can view their own goals" ON financial_goals;
DROP POLICY IF EXISTS "Users can insert own goals" ON financial_goals;
DROP POLICY IF EXISTS "Users can insert their own goals" ON financial_goals;
DROP POLICY IF EXISTS "Users can update own goals" ON financial_goals;
DROP POLICY IF EXISTS "Users can update their own goals" ON financial_goals;
DROP POLICY IF EXISTS "Users can delete own goals" ON financial_goals;
DROP POLICY IF EXISTS "Users can delete their own goals" ON financial_goals;
DROP POLICY IF EXISTS "Enable read access for users" ON financial_goals;
DROP POLICY IF EXISTS "Enable insert access for users" ON financial_goals;
DROP POLICY IF EXISTS "Enable update access for users" ON financial_goals;
DROP POLICY IF EXISTS "Enable delete access for users" ON financial_goals;

-- Create new policies
CREATE POLICY "Users can view own goals" ON financial_goals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals" ON financial_goals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals" ON financial_goals
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals" ON financial_goals
    FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- 7. RECURRING PATTERNS
-- =============================================
ALTER TABLE recurring_patterns ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own recurring patterns" ON recurring_patterns;
DROP POLICY IF EXISTS "Users can view their own recurring patterns" ON recurring_patterns;
DROP POLICY IF EXISTS "Users can insert own recurring patterns" ON recurring_patterns;
DROP POLICY IF EXISTS "Users can insert their own recurring patterns" ON recurring_patterns;
DROP POLICY IF EXISTS "Users can update own recurring patterns" ON recurring_patterns;
DROP POLICY IF EXISTS "Users can update their own recurring patterns" ON recurring_patterns;
DROP POLICY IF EXISTS "Users can delete own recurring patterns" ON recurring_patterns;
DROP POLICY IF EXISTS "Users can delete their own recurring patterns" ON recurring_patterns;
DROP POLICY IF EXISTS "Enable read access for users" ON recurring_patterns;
DROP POLICY IF EXISTS "Enable insert access for users" ON recurring_patterns;
DROP POLICY IF EXISTS "Enable update access for users" ON recurring_patterns;
DROP POLICY IF EXISTS "Enable delete access for users" ON recurring_patterns;

-- Create new policies
CREATE POLICY "Users can view own recurring patterns" ON recurring_patterns
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recurring patterns" ON recurring_patterns
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recurring patterns" ON recurring_patterns
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own recurring patterns" ON recurring_patterns
    FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- 8. USER PROFILES
-- =============================================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Enable read access for users" ON user_profiles;
DROP POLICY IF EXISTS "Enable insert access for users" ON user_profiles;
DROP POLICY IF EXISTS "Enable update access for users" ON user_profiles;

-- Create new policies
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- =============================================
-- DONE! All RLS policies created.
-- =============================================
```

---

## Verifikasi

Setelah menjalankan SQL, cek policies dengan:

```sql
SELECT tablename, policyname, cmd FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename;
```

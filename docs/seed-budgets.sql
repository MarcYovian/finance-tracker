-- ============================================
-- SEED BUDGETS FOR USER
-- User ID: d09a4fff-0f9f-4227-b67c-83724dc830fa
-- ============================================
-- Note: Uses ON CONFLICT DO NOTHING to prevent duplicates
-- Run this AFTER seed-categories.sql

-- ============================================
-- CREATE MONTHLY BUDGET FOR JANUARY 2026
-- ============================================

-- First, create the main budget
INSERT INTO public.budgets (
    id,
    user_id, 
    name, 
    period, 
    start_date, 
    end_date, 
    total_limit, 
    alert_threshold, 
    description,
    is_active
)
VALUES (
    'b1000000-0000-0000-0000-000000000001',
    'd09a4fff-0f9f-4227-b67c-83724dc830fa',
    'Makanan & Minuman',
    'monthly',
    '2026-01-01',
    '2026-01-31',
    2000000, -- Rp 2.000.000
    80,
    'Budget untuk makanan dan minuman bulan Januari 2026',
    true
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.budgets (
    id,
    user_id, 
    name, 
    period, 
    start_date, 
    end_date, 
    total_limit, 
    alert_threshold, 
    description,
    is_active
)
VALUES (
    'b1000000-0000-0000-0000-000000000002',
    'd09a4fff-0f9f-4227-b67c-83724dc830fa',
    'Transportasi',
    'monthly',
    '2026-01-01',
    '2026-01-31',
    800000, -- Rp 800.000
    80,
    'Budget untuk transportasi bulan Januari 2026',
    true
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.budgets (
    id,
    user_id, 
    name, 
    period, 
    start_date, 
    end_date, 
    total_limit, 
    alert_threshold, 
    description,
    is_active
)
VALUES (
    'b1000000-0000-0000-0000-000000000003',
    'd09a4fff-0f9f-4227-b67c-83724dc830fa',
    'Tagihan & Utilitas',
    'monthly',
    '2026-01-01',
    '2026-01-31',
    1500000, -- Rp 1.500.000
    80,
    'Budget untuk tagihan listrik, air, internet',
    true
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.budgets (
    id,
    user_id, 
    name, 
    period, 
    start_date, 
    end_date, 
    total_limit, 
    alert_threshold, 
    description,
    is_active
)
VALUES (
    'b1000000-0000-0000-0000-000000000004',
    'd09a4fff-0f9f-4227-b67c-83724dc830fa',
    'Hiburan',
    'monthly',
    '2026-01-01',
    '2026-01-31',
    500000, -- Rp 500.000
    80,
    'Budget untuk hiburan dan rekreasi',
    true
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.budgets (
    id,
    user_id, 
    name, 
    period, 
    start_date, 
    end_date, 
    total_limit, 
    alert_threshold, 
    description,
    is_active
)
VALUES (
    'b1000000-0000-0000-0000-000000000005',
    'd09a4fff-0f9f-4227-b67c-83724dc830fa',
    'Belanja',
    'monthly',
    '2026-01-01',
    '2026-01-31',
    1000000, -- Rp 1.000.000
    80,
    'Budget untuk belanja bulanan',
    true
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.budgets (
    id,
    user_id, 
    name, 
    period, 
    start_date, 
    end_date, 
    total_limit, 
    alert_threshold, 
    description,
    is_active
)
VALUES (
    'b1000000-0000-0000-0000-000000000006',
    'd09a4fff-0f9f-4227-b67c-83724dc830fa',
    'Kesehatan',
    'monthly',
    '2026-01-01',
    '2026-01-31',
    300000, -- Rp 300.000
    80,
    'Budget untuk kesehatan',
    true
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- CREATE BUDGET ITEMS (linked to categories)
-- ============================================
-- Note: These link budgets to expense categories for tracking

-- Budget Items for Makanan & Minuman
INSERT INTO public.budget_items (budget_id, category_id, planned_amount, spent_amount)
SELECT 
    'b1000000-0000-0000-0000-000000000001',
    id,
    600000, -- Rp 600.000
    350000  -- Already spent Rp 350.000
FROM public.categories 
WHERE user_id = 'd09a4fff-0f9f-4227-b67c-83724dc830fa' 
  AND name = 'Makan Siang' 
  AND type = 'expense'
ON CONFLICT (budget_id, category_id) DO NOTHING;

INSERT INTO public.budget_items (budget_id, category_id, planned_amount, spent_amount)
SELECT 
    'b1000000-0000-0000-0000-000000000001',
    id,
    500000, -- Rp 500.000
    280000  -- Already spent
FROM public.categories 
WHERE user_id = 'd09a4fff-0f9f-4227-b67c-83724dc830fa' 
  AND name = 'Makan Malam' 
  AND type = 'expense'
ON CONFLICT (budget_id, category_id) DO NOTHING;

INSERT INTO public.budget_items (budget_id, category_id, planned_amount, spent_amount)
SELECT 
    'b1000000-0000-0000-0000-000000000001',
    id,
    700000, -- Rp 700.000
    450000  -- Already spent
FROM public.categories 
WHERE user_id = 'd09a4fff-0f9f-4227-b67c-83724dc830fa' 
  AND name = 'Groceries' 
  AND type = 'expense'
ON CONFLICT (budget_id, category_id) DO NOTHING;

INSERT INTO public.budget_items (budget_id, category_id, planned_amount, spent_amount)
SELECT 
    'b1000000-0000-0000-0000-000000000001',
    id,
    200000, -- Rp 200.000
    120000  -- Already spent
FROM public.categories 
WHERE user_id = 'd09a4fff-0f9f-4227-b67c-83724dc830fa' 
  AND name = 'Kopi & Snack' 
  AND type = 'expense'
ON CONFLICT (budget_id, category_id) DO NOTHING;

-- Budget Items for Transportasi
INSERT INTO public.budget_items (budget_id, category_id, planned_amount, spent_amount)
SELECT 
    'b1000000-0000-0000-0000-000000000002',
    id,
    400000, -- Rp 400.000
    280000  -- Already spent
FROM public.categories 
WHERE user_id = 'd09a4fff-0f9f-4227-b67c-83724dc830fa' 
  AND name = 'Bensin' 
  AND type = 'expense'
ON CONFLICT (budget_id, category_id) DO NOTHING;

INSERT INTO public.budget_items (budget_id, category_id, planned_amount, spent_amount)
SELECT 
    'b1000000-0000-0000-0000-000000000002',
    id,
    200000, -- Rp 200.000
    45000   -- Already spent
FROM public.categories 
WHERE user_id = 'd09a4fff-0f9f-4227-b67c-83724dc830fa' 
  AND name = 'Parkir' 
  AND type = 'expense'
ON CONFLICT (budget_id, category_id) DO NOTHING;

INSERT INTO public.budget_items (budget_id, category_id, planned_amount, spent_amount)
SELECT 
    'b1000000-0000-0000-0000-000000000002',
    id,
    200000, -- Rp 200.000
    75000   -- Already spent
FROM public.categories 
WHERE user_id = 'd09a4fff-0f9f-4227-b67c-83724dc830fa' 
  AND name = 'Ojek Online' 
  AND type = 'expense'
ON CONFLICT (budget_id, category_id) DO NOTHING;

-- Budget Items for Tagihan & Utilitas
INSERT INTO public.budget_items (budget_id, category_id, planned_amount, spent_amount)
SELECT 
    'b1000000-0000-0000-0000-000000000003',
    id,
    500000, -- Rp 500.000
    485000  -- Almost maxed - 97%
FROM public.categories 
WHERE user_id = 'd09a4fff-0f9f-4227-b67c-83724dc830fa' 
  AND name = 'Listrik' 
  AND type = 'expense'
ON CONFLICT (budget_id, category_id) DO NOTHING;

INSERT INTO public.budget_items (budget_id, category_id, planned_amount, spent_amount)
SELECT 
    'b1000000-0000-0000-0000-000000000003',
    id,
    150000, -- Rp 150.000
    120000  -- Already spent
FROM public.categories 
WHERE user_id = 'd09a4fff-0f9f-4227-b67c-83724dc830fa' 
  AND name = 'Air PDAM' 
  AND type = 'expense'
ON CONFLICT (budget_id, category_id) DO NOTHING;

INSERT INTO public.budget_items (budget_id, category_id, planned_amount, spent_amount)
SELECT 
    'b1000000-0000-0000-0000-000000000003',
    id,
    450000, -- Rp 450.000
    450000  -- Fully used
FROM public.categories 
WHERE user_id = 'd09a4fff-0f9f-4227-b67c-83724dc830fa' 
  AND name = 'Internet' 
  AND type = 'expense'
ON CONFLICT (budget_id, category_id) DO NOTHING;

INSERT INTO public.budget_items (budget_id, category_id, planned_amount, spent_amount)
SELECT 
    'b1000000-0000-0000-0000-000000000003',
    id,
    200000, -- Rp 200.000
    150000  -- Already spent
FROM public.categories 
WHERE user_id = 'd09a4fff-0f9f-4227-b67c-83724dc830fa' 
  AND name = 'Pulsa & Paket Data' 
  AND type = 'expense'
ON CONFLICT (budget_id, category_id) DO NOTHING;

-- Budget Items for Hiburan (OVER BUDGET EXAMPLE)
INSERT INTO public.budget_items (budget_id, category_id, planned_amount, spent_amount)
SELECT 
    'b1000000-0000-0000-0000-000000000004',
    id,
    300000, -- Rp 300.000
    380000  -- OVER BUDGET! Spent 127%
FROM public.categories 
WHERE user_id = 'd09a4fff-0f9f-4227-b67c-83724dc830fa' 
  AND name = 'Streaming' 
  AND type = 'expense'
ON CONFLICT (budget_id, category_id) DO NOTHING;

INSERT INTO public.budget_items (budget_id, category_id, planned_amount, spent_amount)
SELECT 
    'b1000000-0000-0000-0000-000000000004',
    id,
    200000, -- Rp 200.000
    250000  -- OVER BUDGET! Spent 125%
FROM public.categories 
WHERE user_id = 'd09a4fff-0f9f-4227-b67c-83724dc830fa' 
  AND name = 'Game' 
  AND type = 'expense'
ON CONFLICT (budget_id, category_id) DO NOTHING;

-- Budget Items for Belanja
INSERT INTO public.budget_items (budget_id, category_id, planned_amount, spent_amount)
SELECT 
    'b1000000-0000-0000-0000-000000000004',
    id,
    1000000, -- Rp 1.000.000
    450000   -- Spent 45%
FROM public.categories 
WHERE user_id = 'd09a4fff-0f9f-4227-b67c-83724dc830fa' 
  AND name = 'Belanja' 
  AND type = 'expense'
ON CONFLICT (budget_id, category_id) DO NOTHING;

-- Budget Items for Kesehatan
INSERT INTO public.budget_items (budget_id, category_id, planned_amount, spent_amount)
SELECT 
    'b1000000-0000-0000-0000-000000000006',
    id,
    300000, -- Rp 300.000
    75000   -- Spent 25%
FROM public.categories 
WHERE user_id = 'd09a4fff-0f9f-4227-b67c-83724dc830fa' 
  AND name = 'Kesehatan' 
  AND type = 'expense'
ON CONFLICT (budget_id, category_id) DO NOTHING;


-- ============================================
-- VERIFY RESULTS
-- ============================================
SELECT 
    b.name as budget_name,
    b.total_limit,
    COUNT(bi.id) as item_count,
    COALESCE(SUM(bi.spent_amount), 0) as total_spent,
    ROUND(COALESCE(SUM(bi.spent_amount), 0)::numeric / b.total_limit * 100, 1) as percent_used
FROM public.budgets b
LEFT JOIN public.budget_items bi ON bi.budget_id = b.id
WHERE b.user_id = 'd09a4fff-0f9f-4227-b67c-83724dc830fa'
GROUP BY b.id, b.name, b.total_limit
ORDER BY b.name;

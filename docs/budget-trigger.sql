-- ============================================
-- BUDGET SPENT AMOUNT TRIGGER
-- Auto-sync spent_amount with transactions
-- ============================================
-- This trigger automatically updates budget_items.spent_amount
-- whenever a transaction is inserted, updated, or deleted.

-- ============================================
-- 1. TRIGGER FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION public.update_budget_spent_amount()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_budget_id uuid;
  v_category_id uuid;
  v_amount bigint;
  v_transaction_date date;
BEGIN
  -- Handle INSERT
  IF TG_OP = 'INSERT' THEN
    -- Only process expense transactions with a category
    IF NEW.type = 'expense' AND NEW.category_id IS NOT NULL THEN
      -- Find matching budget_items for this category and date range
      UPDATE budget_items bi
      SET 
        spent_amount = spent_amount + NEW.amount,
        updated_at = now()
      FROM budgets b
      WHERE bi.budget_id = b.id
        AND bi.category_id = NEW.category_id
        AND b.user_id = NEW.user_id
        AND b.is_active = true
        AND NEW.transaction_date BETWEEN b.start_date AND b.end_date;
    END IF;
    RETURN NEW;
  
  -- Handle UPDATE
  ELSIF TG_OP = 'UPDATE' THEN
    -- If category or amount changed, recalculate
    IF OLD.type = 'expense' AND OLD.category_id IS NOT NULL THEN
      -- Subtract old amount from old category's budget
      UPDATE budget_items bi
      SET 
        spent_amount = GREATEST(0, spent_amount - OLD.amount),
        updated_at = now()
      FROM budgets b
      WHERE bi.budget_id = b.id
        AND bi.category_id = OLD.category_id
        AND b.user_id = OLD.user_id
        AND b.is_active = true
        AND OLD.transaction_date BETWEEN b.start_date AND b.end_date;
    END IF;
    
    IF NEW.type = 'expense' AND NEW.category_id IS NOT NULL THEN
      -- Add new amount to new category's budget
      UPDATE budget_items bi
      SET 
        spent_amount = spent_amount + NEW.amount,
        updated_at = now()
      FROM budgets b
      WHERE bi.budget_id = b.id
        AND bi.category_id = NEW.category_id
        AND b.user_id = NEW.user_id
        AND b.is_active = true
        AND NEW.transaction_date BETWEEN b.start_date AND b.end_date;
    END IF;
    RETURN NEW;
  
  -- Handle DELETE
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.type = 'expense' AND OLD.category_id IS NOT NULL THEN
      -- Subtract amount from budget
      UPDATE budget_items bi
      SET 
        spent_amount = GREATEST(0, spent_amount - OLD.amount),
        updated_at = now()
      FROM budgets b
      WHERE bi.budget_id = b.id
        AND bi.category_id = OLD.category_id
        AND b.user_id = OLD.user_id
        AND b.is_active = true
        AND OLD.transaction_date BETWEEN b.start_date AND b.end_date;
    END IF;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 2. CREATE TRIGGERS
-- ============================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS on_transaction_insert_update_budget ON public.transactions;
DROP TRIGGER IF EXISTS on_transaction_update_update_budget ON public.transactions;
DROP TRIGGER IF EXISTS on_transaction_delete_update_budget ON public.transactions;

-- Create triggers for INSERT, UPDATE, DELETE
CREATE TRIGGER on_transaction_insert_update_budget
  AFTER INSERT ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_budget_spent_amount();

CREATE TRIGGER on_transaction_update_update_budget
  AFTER UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_budget_spent_amount();

CREATE TRIGGER on_transaction_delete_update_budget
  AFTER DELETE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_budget_spent_amount();

-- ============================================
-- 3. HELPER FUNCTION: Recalculate All Spent Amounts
-- ============================================
-- Use this to fix any inconsistencies or initialize spent_amount

CREATE OR REPLACE FUNCTION public.recalculate_all_budget_spent_amounts()
RETURNS void
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Reset all spent_amount to 0 first
  UPDATE budget_items SET spent_amount = 0, updated_at = now();
  
  -- Recalculate based on actual transactions
  UPDATE budget_items bi
  SET spent_amount = COALESCE(calculated.total, 0),
      updated_at = now()
  FROM (
    SELECT 
      bi2.id as budget_item_id,
      SUM(t.amount) as total
    FROM budget_items bi2
    JOIN budgets b ON b.id = bi2.budget_id
    JOIN transactions t ON t.category_id = bi2.category_id
      AND t.user_id = b.user_id
      AND t.type = 'expense'
      AND t.transaction_date BETWEEN b.start_date AND b.end_date
    WHERE b.is_active = true
    GROUP BY bi2.id
  ) calculated
  WHERE bi.id = calculated.budget_item_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. RPC: Get Budget with Calculated Spent
-- ============================================
-- Alternative: Calculate spent on-the-fly (for verification)

CREATE OR REPLACE FUNCTION public.get_budget_spending_summary(p_budget_id uuid)
RETURNS TABLE (
  category_id uuid,
  category_name text,
  planned_amount bigint,
  spent_amount bigint,
  remaining_amount bigint,
  percentage_used numeric
)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bi.category_id,
    c.name as category_name,
    bi.planned_amount,
    bi.spent_amount,
    (bi.planned_amount - bi.spent_amount) as remaining_amount,
    CASE 
      WHEN bi.planned_amount > 0 
      THEN ROUND((bi.spent_amount::numeric / bi.planned_amount::numeric) * 100, 1)
      ELSE 0
    END as percentage_used
  FROM budget_items bi
  JOIN categories c ON c.id = bi.category_id
  WHERE bi.budget_id = p_budget_id
  ORDER BY bi.spent_amount DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- USAGE NOTES
-- ============================================
-- 
-- After running this script:
-- 1. Run recalculate_all_budget_spent_amounts() to sync existing data:
--    SELECT recalculate_all_budget_spent_amounts();
--
-- 2. Every new transaction will automatically update spent_amount
--
-- 3. To get budget summary with spending:
--    SELECT * FROM get_budget_spending_summary('budget-id-here');

```sql
-- ============================================
-- PERSONAL FINANCE TRACKER - COMPLETE SCHEMA
-- With RLS (Row Level Security) & RPC
-- With PROPER SUPABASE AUTHENTICATION
-- ============================================

-- ============================================
-- 1. SYNC USERS TABLE WITH AUTH.USERS
-- ============================================

-- Drop users table if exists (since we'll use auth.users)
-- Users profiles will be managed via trigger from auth.users

CREATE TABLE public.user_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  display_name text,
  avatar_url text,
  default_currency text DEFAULT 'IDR',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT user_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- ============================================
-- 2. TABLES & CONSTRAINTS
-- ============================================

CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['income'::text, 'expense'::text])),
  parent_id uuid,
  color text,
  icon text,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT categories_pkey PRIMARY KEY (id),
  CONSTRAINT categories_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.categories(id) ON DELETE SET NULL,
  CONSTRAINT categories_user_type_name_unique UNIQUE (user_id, type, name)
);

CREATE TABLE public.fund_sources (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['bank'::text, 'cash'::text, 'credit_card'::text, 'wallet'::text, 'other'::text])),
  balance bigint NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'IDR',
  is_active boolean NOT NULL DEFAULT true,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT fund_sources_pkey PRIMARY KEY (id),
  CONSTRAINT fund_sources_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE public.recurring_patterns (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  frequency text NOT NULL CHECK (frequency = ANY (ARRAY['daily'::text, 'weekly'::text, 'biweekly'::text, 'monthly'::text, 'quarterly'::text, 'yearly'::text])),
  interval integer NOT NULL DEFAULT 1,
  amount bigint NOT NULL,
  category_id uuid,
  source_fund_id uuid,
  destination_fund_id uuid,
  transaction_type text NOT NULL CHECK (transaction_type = ANY (ARRAY['income'::text, 'expense'::text, 'transfer'::text])),
  description text,
  start_date date NOT NULL,
  end_date date,
  next_execution_date date NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT recurring_patterns_pkey PRIMARY KEY (id),
  CONSTRAINT recurring_patterns_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT recurring_patterns_category_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL,
  CONSTRAINT recurring_patterns_source_fund_fkey FOREIGN KEY (source_fund_id) REFERENCES public.fund_sources(id) ON DELETE SET NULL,
  CONSTRAINT recurring_patterns_destination_fund_fkey FOREIGN KEY (destination_fund_id) REFERENCES public.fund_sources(id) ON DELETE SET NULL
);

CREATE TABLE public.transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['income'::text, 'expense'::text, 'transfer'::text])),
  amount bigint NOT NULL,
  description text,
  category_id uuid,
  source_fund_id uuid,
  destination_fund_id uuid,
  transaction_date timestamp with time zone NOT NULL,
  notes text,
  is_recurring boolean NOT NULL DEFAULT false,
  recurring_pattern_id uuid,
  status text NOT NULL DEFAULT 'completed' CHECK (status = ANY (ARRAY['pending'::text, 'completed'::text, 'failed'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT transactions_pkey PRIMARY KEY (id),
  CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT transactions_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL,
  CONSTRAINT transactions_source_fund_fkey FOREIGN KEY (source_fund_id) REFERENCES public.fund_sources(id) ON DELETE SET NULL,
  CONSTRAINT transactions_destination_fund_fkey FOREIGN KEY (destination_fund_id) REFERENCES public.fund_sources(id) ON DELETE SET NULL,
  CONSTRAINT transactions_recurring_pattern_fkey FOREIGN KEY (recurring_pattern_id) REFERENCES public.recurring_patterns(id) ON DELETE SET NULL,
  CONSTRAINT transactions_type_funds_check CHECK (
    (type = 'transfer' AND source_fund_id IS NOT NULL AND destination_fund_id IS NOT NULL) OR
    (type IN ('income', 'expense') AND destination_fund_id IS NULL)
  )
);

CREATE TABLE public.budgets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  period text NOT NULL CHECK (period = ANY (ARRAY['monthly'::text, 'quarterly'::text, 'yearly'::text])),
  start_date date NOT NULL,
  end_date date NOT NULL,
  total_limit bigint NOT NULL,
  alert_threshold integer NOT NULL DEFAULT 80,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT budgets_pkey PRIMARY KEY (id),
  CONSTRAINT budgets_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT budgets_date_check CHECK (start_date < end_date)
);

CREATE TABLE public.budget_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  budget_id uuid NOT NULL,
  category_id uuid NOT NULL,
  planned_amount bigint NOT NULL,
  spent_amount bigint NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT budget_items_pkey PRIMARY KEY (id),
  CONSTRAINT budget_items_budget_id_fkey FOREIGN KEY (budget_id) REFERENCES public.budgets(id) ON DELETE CASCADE,
  CONSTRAINT budget_items_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE,
  CONSTRAINT budget_items_budget_category_unique UNIQUE (budget_id, category_id)
);

CREATE TABLE public.financial_goals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  target_amount bigint NOT NULL,
  current_amount bigint NOT NULL DEFAULT 0,
  category text NOT NULL CHECK (category = ANY (ARRAY['savings'::text, 'investment'::text, 'debt_payoff'::text, 'other'::text])),
  target_date date NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status = ANY (ARRAY['active'::text, 'completed'::text, 'cancelled'::text])),
  priority integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT financial_goals_pkey PRIMARY KEY (id),
  CONSTRAINT financial_goals_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- ============================================
-- 3. INDEXES
-- ============================================

CREATE INDEX idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_category_id ON public.transactions(category_id);
CREATE INDEX idx_transactions_transaction_date ON public.transactions(transaction_date);
CREATE INDEX idx_transactions_user_date ON public.transactions(user_id, transaction_date);
CREATE INDEX idx_transactions_recurring_pattern_id ON public.transactions(recurring_pattern_id);
CREATE INDEX idx_fund_sources_user_id ON public.fund_sources(user_id);
CREATE INDEX idx_categories_user_id ON public.categories(user_id);
CREATE INDEX idx_budgets_user_id ON public.budgets(user_id);
CREATE INDEX idx_budget_items_budget_id ON public.budget_items(budget_id);
CREATE INDEX idx_budget_items_category_id ON public.budget_items(category_id);
CREATE INDEX idx_financial_goals_user_id ON public.financial_goals(user_id);
CREATE INDEX idx_recurring_patterns_user_id ON public.recurring_patterns(user_id);

-- ============================================
-- 4. TRIGGERS FOR AUTHENTICATION SYNC
-- ============================================

-- Auto create user profile when new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, display_name)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Delete user profile when user is deleted
CREATE OR REPLACE FUNCTION public.handle_user_delete()
RETURNS TRIGGER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.user_profiles WHERE user_id = old.id;
  RETURN old;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_deleted
  BEFORE DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_delete();

-- ============================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fund_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;

-- User Profiles RLS Policies
CREATE POLICY "Users can view their own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Categories RLS Policies
CREATE POLICY "Users can view their own categories"
  ON public.categories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own categories"
  ON public.categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories"
  ON public.categories FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories"
  ON public.categories FOR DELETE
  USING (auth.uid() = user_id);

-- Fund Sources RLS Policies
CREATE POLICY "Users can view their own fund sources"
  ON public.fund_sources FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own fund sources"
  ON public.fund_sources FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own fund sources"
  ON public.fund_sources FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own fund sources"
  ON public.fund_sources FOR DELETE
  USING (auth.uid() = user_id);

-- Recurring Patterns RLS Policies
CREATE POLICY "Users can view their own recurring patterns"
  ON public.recurring_patterns FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recurring patterns"
  ON public.recurring_patterns FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recurring patterns"
  ON public.recurring_patterns FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recurring patterns"
  ON public.recurring_patterns FOR DELETE
  USING (auth.uid() = user_id);

-- Transactions RLS Policies
CREATE POLICY "Users can view their own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions"
  ON public.transactions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions"
  ON public.transactions FOR DELETE
  USING (auth.uid() = user_id);

-- Budgets RLS Policies
CREATE POLICY "Users can view their own budgets"
  ON public.budgets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own budgets"
  ON public.budgets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budgets"
  ON public.budgets FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budgets"
  ON public.budgets FOR DELETE
  USING (auth.uid() = user_id);

-- Budget Items RLS Policies (via budget access)
CREATE POLICY "Users can view budget items for their budgets"
  ON public.budget_items FOR SELECT
  USING (
    budget_id IN (
      SELECT id FROM public.budgets WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert budget items to their budgets"
  ON public.budget_items FOR INSERT
  WITH CHECK (
    budget_id IN (
      SELECT id FROM public.budgets WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update budget items in their budgets"
  ON public.budget_items FOR UPDATE
  USING (
    budget_id IN (
      SELECT id FROM public.budgets WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    budget_id IN (
      SELECT id FROM public.budgets WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete budget items from their budgets"
  ON public.budget_items FOR DELETE
  USING (
    budget_id IN (
      SELECT id FROM public.budgets WHERE user_id = auth.uid()
    )
  );

-- Financial Goals RLS Policies
CREATE POLICY "Users can view their own financial goals"
  ON public.financial_goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own financial goals"
  ON public.financial_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own financial goals"
  ON public.financial_goals FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own financial goals"
  ON public.financial_goals FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 6. RPC FUNCTIONS WITH AUTH.UID() VALIDATION
-- ============================================

-- 6.1 Get Current User (Auth verified)
CREATE OR REPLACE FUNCTION public.get_current_user()
RETURNS public.user_profiles
SET search_path = public
AS $$
DECLARE
  current_user public.user_profiles;
BEGIN
  -- Get auth user from session
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO current_user
  FROM public.user_profiles
  WHERE user_id = auth.uid();

  IF current_user IS NULL THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  RETURN current_user;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6.2 Create Transaction & Update Fund Balance (Auth verified)
CREATE OR REPLACE FUNCTION public.create_transaction_with_balance_update(
  p_type text,
  p_amount bigint,
  p_description text,
  p_category_id uuid,
  p_source_fund_id uuid,
  p_destination_fund_id uuid,
  p_transaction_date timestamp with time zone,
  p_notes text DEFAULT NULL,
  p_recurring_pattern_id uuid DEFAULT NULL
)
RETURNS public.transactions
SET search_path = public
AS $$
DECLARE
  new_transaction public.transactions;
  current_user_id uuid;
BEGIN
  -- Get authenticated user
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Validate type constraints
  IF p_type = 'transfer' THEN
    IF p_source_fund_id IS NULL OR p_destination_fund_id IS NULL THEN
      RAISE EXCEPTION 'Transfer requires both source and destination fund';
    END IF;
    IF p_source_fund_id = p_destination_fund_id THEN
      RAISE EXCEPTION 'Transfer cannot be to the same fund';
    END IF;
  ELSIF p_type IN ('income', 'expense') THEN
    IF p_destination_fund_id IS NOT NULL THEN
      RAISE EXCEPTION '% transaction cannot have destination fund', p_type;
    END IF;
  ELSE
    RAISE EXCEPTION 'Invalid transaction type: %', p_type;
  END IF;

  -- Verify user owns the funds
  IF p_type = 'income' THEN
    IF NOT EXISTS (SELECT 1 FROM public.fund_sources WHERE id = p_destination_fund_id AND user_id = current_user_id) THEN
      RAISE EXCEPTION 'Destination fund not found or unauthorized';
    END IF;
  ELSIF p_type = 'expense' THEN
    IF NOT EXISTS (SELECT 1 FROM public.fund_sources WHERE id = p_source_fund_id AND user_id = current_user_id) THEN
      RAISE EXCEPTION 'Source fund not found or unauthorized';
    END IF;
  ELSIF p_type = 'transfer' THEN
    IF NOT EXISTS (SELECT 1 FROM public.fund_sources WHERE id = p_source_fund_id AND user_id = current_user_id) THEN
      RAISE EXCEPTION 'Source fund not found or unauthorized';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.fund_sources WHERE id = p_destination_fund_id AND user_id = current_user_id) THEN
      RAISE EXCEPTION 'Destination fund not found or unauthorized';
    END IF;
  END IF;

  -- Verify category ownership if provided
  IF p_category_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.categories WHERE id = p_category_id AND user_id = current_user_id) THEN
      RAISE EXCEPTION 'Category not found or unauthorized';
    END IF;
  END IF;

  -- Create transaction
  INSERT INTO public.transactions (
    user_id, type, amount, description, category_id,
    source_fund_id, destination_fund_id, transaction_date,
    notes, recurring_pattern_id
  )
  VALUES (
    current_user_id, p_type, p_amount, p_description, p_category_id,
    p_source_fund_id, p_destination_fund_id, p_transaction_date,
    p_notes, p_recurring_pattern_id
  )
  RETURNING * INTO new_transaction;

  -- Update fund balances
  IF p_type = 'income' THEN
    UPDATE public.fund_sources
    SET balance = balance + p_amount
    WHERE id = p_destination_fund_id;
  ELSIF p_type = 'expense' THEN
    UPDATE public.fund_sources
    SET balance = balance - p_amount
    WHERE id = p_source_fund_id;
  ELSIF p_type = 'transfer' THEN
    UPDATE public.fund_sources
    SET balance = balance - p_amount
    WHERE id = p_source_fund_id;

    UPDATE public.fund_sources
    SET balance = balance + p_amount
    WHERE id = p_destination_fund_id;
  END IF;

  RETURN new_transaction;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6.3 Update Transaction & Adjust Fund Balance (Auth verified)
CREATE OR REPLACE FUNCTION public.update_transaction_with_balance_adjustment(
  p_transaction_id uuid,
  p_amount bigint,
  p_source_fund_id uuid,
  p_destination_fund_id uuid,
  p_transaction_date timestamp with time zone,
  p_description text,
  p_category_id uuid,
  p_notes text
)
RETURNS public.transactions
SET search_path = public
AS $$
DECLARE
  old_transaction public.transactions;
  updated_transaction public.transactions;
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get old transaction & verify ownership
  SELECT * INTO old_transaction FROM public.transactions
  WHERE id = p_transaction_id AND user_id = current_user_id;

  IF old_transaction IS NULL THEN
    RAISE EXCEPTION 'Transaction not found or unauthorized';
  END IF;

  -- Revert old balance changes
  IF old_transaction.type = 'income' THEN
    UPDATE public.fund_sources
    SET balance = balance - old_transaction.amount
    WHERE id = old_transaction.destination_fund_id;
  ELSIF old_transaction.type = 'expense' THEN
    UPDATE public.fund_sources
    SET balance = balance + old_transaction.amount
    WHERE id = old_transaction.source_fund_id;
  ELSIF old_transaction.type = 'transfer' THEN
    UPDATE public.fund_sources
    SET balance = balance + old_transaction.amount
    WHERE id = old_transaction.source_fund_id;

    UPDATE public.fund_sources
    SET balance = balance - old_transaction.amount
    WHERE id = old_transaction.destination_fund_id;
  END IF;

  -- Update transaction
  UPDATE public.transactions
  SET
    amount = p_amount,
    source_fund_id = p_source_fund_id,
    destination_fund_id = p_destination_fund_id,
    transaction_date = p_transaction_date,
    description = p_description,
    category_id = p_category_id,
    notes = p_notes,
    updated_at = now()
  WHERE id = p_transaction_id
  RETURNING * INTO updated_transaction;

  -- Apply new balance changes
  IF updated_transaction.type = 'income' THEN
    UPDATE public.fund_sources
    SET balance = balance + p_amount
    WHERE id = p_destination_fund_id;
  ELSIF updated_transaction.type = 'expense' THEN
    UPDATE public.fund_sources
    SET balance = balance - p_amount
    WHERE id = p_source_fund_id;
  ELSIF updated_transaction.type = 'transfer' THEN
    UPDATE public.fund_sources
    SET balance = balance - p_amount
    WHERE id = p_source_fund_id;

    UPDATE public.fund_sources
    SET balance = balance + p_amount
    WHERE id = p_destination_fund_id;
  END IF;

  RETURN updated_transaction;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6.4 Delete Transaction & Adjust Fund Balance (Auth verified)
CREATE OR REPLACE FUNCTION public.delete_transaction_with_balance_adjustment(
  p_transaction_id uuid
)
RETURNS boolean
SET search_path = public
AS $$
DECLARE
  transaction_to_delete public.transactions;
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get transaction & verify ownership
  SELECT * INTO transaction_to_delete FROM public.transactions
  WHERE id = p_transaction_id AND user_id = current_user_id;

  IF transaction_to_delete IS NULL THEN
    RAISE EXCEPTION 'Transaction not found or unauthorized';
  END IF;

  -- Revert balance changes
  IF transaction_to_delete.type = 'income' THEN
    UPDATE public.fund_sources
    SET balance = balance - transaction_to_delete.amount
    WHERE id = transaction_to_delete.destination_fund_id;
  ELSIF transaction_to_delete.type = 'expense' THEN
    UPDATE public.fund_sources
    SET balance = balance + transaction_to_delete.amount
    WHERE id = transaction_to_delete.source_fund_id;
  ELSIF transaction_to_delete.type = 'transfer' THEN
    UPDATE public.fund_sources
    SET balance = balance + transaction_to_delete.amount
    WHERE id = transaction_to_delete.source_fund_id;

    UPDATE public.fund_sources
    SET balance = balance - transaction_to_delete.amount
    WHERE id = transaction_to_delete.destination_fund_id;
  END IF;

  -- Delete transaction
  DELETE FROM public.transactions WHERE id = p_transaction_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6.5 Get Dashboard Summary (Auth verified)
CREATE OR REPLACE FUNCTION public.get_dashboard_summary()
RETURNS TABLE (
  total_balance bigint,
  total_income bigint,
  total_expense bigint,
  net_flow bigint,
  active_budgets_count integer,
  active_goals_count integer,
  fund_sources_count integer
)
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  RETURN QUERY
  SELECT
    COALESCE(SUM(fs.balance), 0)::bigint as total_balance,
    COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0)::bigint as total_income,
    COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0)::bigint as total_expense,
    (COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) -
     COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0))::bigint as net_flow,
    (SELECT COUNT(*) FROM public.budgets WHERE user_id = current_user_id AND is_active = true)::integer,
    (SELECT COUNT(*) FROM public.financial_goals WHERE user_id = current_user_id AND status = 'active')::integer,
    (SELECT COUNT(*) FROM public.fund_sources WHERE user_id = current_user_id AND is_active = true)::integer
  FROM public.fund_sources fs
  LEFT JOIN public.transactions t ON fs.user_id = t.user_id
  WHERE fs.user_id = current_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6.6 Get Budget Spending Details (Auth verified)
CREATE OR REPLACE FUNCTION public.get_budget_spending_details(
  p_budget_id uuid
)
RETURNS TABLE (
  category_id uuid,
  category_name text,
  planned_amount bigint,
  spent_amount bigint,
  percentage integer,
  status text
)
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Verify budget ownership
  IF NOT EXISTS (SELECT 1 FROM public.budgets WHERE id = p_budget_id AND user_id = current_user_id) THEN
    RAISE EXCEPTION 'Budget not found or unauthorized';
  END IF;

  RETURN QUERY
  SELECT
    bi.category_id,
    c.name,
    bi.planned_amount,
    bi.spent_amount,
    CASE
      WHEN bi.planned_amount = 0 THEN 0
      ELSE ((bi.spent_amount::numeric / bi.planned_amount) * 100)::integer
    END as percentage,
    CASE
      WHEN bi.spent_amount > bi.planned_amount THEN 'exceeded'
      WHEN bi.spent_amount >= (bi.planned_amount * (
        (SELECT alert_threshold FROM public.budgets WHERE id = p_budget_id)::numeric / 100))
        THEN 'warning'
      ELSE 'ok'
    END as status
  FROM public.budget_items bi
  JOIN public.categories c ON bi.category_id = c.id
  WHERE bi.budget_id = p_budget_id
  ORDER BY bi.spent_amount DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6.7 Get Monthly Spending by Category (Auth verified)
CREATE OR REPLACE FUNCTION public.get_monthly_spending(
  p_year integer,
  p_month integer
)
RETURNS TABLE (
  category_id uuid,
  category_name text,
  category_type text,
  total_amount bigint,
  transaction_count integer
)
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  RETURN QUERY
  SELECT
    c.id,
    c.name,
    c.type,
    COALESCE(SUM(t.amount), 0)::bigint,
    COUNT(t.id)::integer
  FROM public.categories c
  LEFT JOIN public.transactions t ON c.id = t.category_id
    AND t.user_id = current_user_id
    AND EXTRACT(YEAR FROM t.transaction_date) = p_year
    AND EXTRACT(MONTH FROM t.transaction_date) = p_month
    AND t.type = 'expense'
  WHERE c.user_id = current_user_id AND c.type = 'expense'
  GROUP BY c.id, c.name, c.type
  ORDER BY total_amount DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6.8 Get Financial Goals Progress (Auth verified)
CREATE OR REPLACE FUNCTION public.get_goals_with_progress()
RETURNS TABLE (
  goal_id uuid,
  goal_name text,
  target_amount bigint,
  current_amount bigint,
  target_date date,
  days_remaining integer,
  progress_percentage integer,
  status text,
  is_on_track boolean
)
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  RETURN QUERY
  SELECT
    fg.id,
    fg.name,
    fg.target_amount,
    fg.current_amount,
    fg.target_date,
    (fg.target_date - CURRENT_DATE)::integer,
    CASE
      WHEN fg.target_amount = 0 THEN 0
      ELSE ((fg.current_amount::numeric / fg.target_amount) * 100)::integer
    END,
    fg.status,
    CASE
      WHEN fg.status = 'completed' THEN true
      WHEN fg.status = 'cancelled' THEN false
      ELSE
        fg.current_amount >= (
          fg.target_amount::numeric *
          ((CURRENT_DATE - fg.created_at::date)::numeric / (fg.target_date - fg.created_at::date)::numeric)
        )::bigint
    END
  FROM public.financial_goals fg
  WHERE fg.user_id = current_user_id
  ORDER BY fg.priority ASC, fg.target_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6.9 Refresh Budget Spending (Auth verified)
CREATE OR REPLACE FUNCTION public.refresh_budget_spending(
  p_budget_id uuid
)
RETURNS void
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Verify budget ownership
  IF NOT EXISTS (SELECT 1 FROM public.budgets WHERE id = p_budget_id AND user_id = current_user_id) THEN
    RAISE EXCEPTION 'Budget not found or unauthorized';
  END IF;

  UPDATE public.budget_items bi
  SET spent_amount = COALESCE((
    SELECT SUM(t.amount)
    FROM public.transactions t
    JOIN public.budgets b ON bi.budget_id = b.id
    WHERE t.category_id = bi.category_id
      AND t.user_id = b.user_id
      AND t.type = 'expense'
      AND t.transaction_date::date BETWEEN b.start_date AND b.end_date
  ), 0)
  WHERE bi.budget_id = p_budget_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6.10 Calculate Next Execution Date (Helper function, no auth needed)
CREATE OR REPLACE FUNCTION public.calculate_next_execution_date(
  p_frequency text,
  p_interval integer,
  p_current_date date
)
RETURNS date
SET search_path = public
AS $$
DECLARE
  v_next_date date;
BEGIN
  CASE p_frequency
    WHEN 'daily' THEN
      v_next_date := p_current_date + (p_interval || ' days')::INTERVAL;
    WHEN 'weekly' THEN
      v_next_date := p_current_date + (p_interval * 7 || ' days')::INTERVAL;
    WHEN 'biweekly' THEN
      v_next_date := p_current_date + (p_interval * 14 || ' days')::INTERVAL;
    WHEN 'monthly' THEN
      v_next_date := p_current_date + (p_interval || ' months')::INTERVAL;
    WHEN 'quarterly' THEN
      v_next_date := p_current_date + (p_interval * 3 || ' months')::INTERVAL;
    WHEN 'yearly' THEN
      v_next_date := p_current_date + (p_interval || ' years')::INTERVAL;
    ELSE
      RAISE EXCEPTION 'Invalid frequency: %', p_frequency;
  END CASE;

  RETURN v_next_date;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

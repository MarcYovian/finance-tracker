-- =====================================================
-- NOTIFICATIONS SYSTEM SCHEMA
-- =====================================================
-- Tabel dan fungsi untuk sistem notifikasi finance tracker
-- Jalankan script ini di Supabase SQL Editor

-- =====================================================
-- 1. DROP EXISTING (jika ada)
-- =====================================================
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP FUNCTION IF EXISTS public.create_notification CASCADE;
DROP FUNCTION IF EXISTS public.check_budget_alert CASCADE;
DROP FUNCTION IF EXISTS public.check_low_balance CASCADE;
DROP FUNCTION IF EXISTS public.check_goal_milestone CASCADE;

-- =====================================================
-- 2. CREATE NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'budget_alert',
    'recurring_reminder', 
    'goal_progress',
    'low_balance',
    'financial_insight',
    'security'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  icon TEXT DEFAULT 'i-lucide-bell',
  color TEXT DEFAULT 'primary' CHECK (color IN ('error', 'warning', 'success', 'primary', 'info')),
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- =====================================================
-- 3. INDEXES
-- =====================================================
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_type ON public.notifications(type);

-- =====================================================
-- 4. ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- 5. HELPER FUNCTION: CREATE NOTIFICATION
-- =====================================================
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_icon TEXT DEFAULT 'i-lucide-bell',
  p_color TEXT DEFAULT 'primary',
  p_link TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, icon, color, link, metadata)
  VALUES (p_user_id, p_type, p_title, p_message, p_icon, p_color, p_link, p_metadata)
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. BUDGET ALERT FUNCTION
-- =====================================================
-- Dipanggil oleh trigger saat budget_items.spent_amount berubah
CREATE OR REPLACE FUNCTION public.check_budget_alert()
RETURNS TRIGGER AS $$
DECLARE
  v_budget RECORD;
  v_percentage INTEGER;
  v_alert_threshold INTEGER;
  v_existing_alert UUID;
BEGIN
  -- Get budget info
  SELECT b.*, b.alert_threshold INTO v_budget
  FROM public.budgets b
  WHERE b.id = NEW.budget_id AND b.is_active = true;
  
  IF v_budget IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Calculate percentage
  IF NEW.planned_amount > 0 THEN
    v_percentage := (NEW.spent_amount * 100 / NEW.planned_amount);
  ELSE
    v_percentage := 0;
  END IF;
  
  v_alert_threshold := COALESCE(v_budget.alert_threshold, 80);
  
  -- Check if alert should be created
  IF v_percentage >= v_alert_threshold THEN
    -- Check if similar alert exists in last 24 hours
    SELECT id INTO v_existing_alert
    FROM public.notifications
    WHERE user_id = v_budget.user_id
      AND type = 'budget_alert'
      AND metadata->>'budget_item_id' = NEW.id::text
      AND created_at > now() - interval '24 hours';
    
    IF v_existing_alert IS NULL THEN
      IF v_percentage >= 100 THEN
        -- Over budget alert
        PERFORM public.create_notification(
          v_budget.user_id,
          'budget_alert',
          'Budget Melebihi Limit! 🚨',
          format('Budget "%s" sudah melebihi limit sebesar %s%%', v_budget.name, v_percentage),
          'i-lucide-alert-triangle',
          'error',
          '/budgets',
          jsonb_build_object('budget_id', v_budget.id, 'budget_item_id', NEW.id, 'percentage', v_percentage)
        );
      ELSE
        -- Warning alert
        PERFORM public.create_notification(
          v_budget.user_id,
          'budget_alert',
          'Peringatan Budget ⚠️',
          format('Budget "%s" sudah mencapai %s%% dari limit', v_budget.name, v_percentage),
          'i-lucide-alert-circle',
          'warning',
          '/budgets',
          jsonb_build_object('budget_id', v_budget.id, 'budget_item_id', NEW.id, 'percentage', v_percentage)
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for budget alert
DROP TRIGGER IF EXISTS trigger_check_budget_alert ON public.budget_items;
CREATE TRIGGER trigger_check_budget_alert
  AFTER UPDATE OF spent_amount ON public.budget_items
  FOR EACH ROW
  WHEN (NEW.spent_amount <> OLD.spent_amount)
  EXECUTE FUNCTION public.check_budget_alert();

-- =====================================================
-- 7. LOW BALANCE ALERT FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION public.check_low_balance()
RETURNS TRIGGER AS $$
DECLARE
  v_threshold BIGINT := 100000; -- Rp 100.000
  v_existing_alert UUID;
BEGIN
  -- Check if balance is low
  IF NEW.balance < v_threshold AND OLD.balance >= v_threshold THEN
    -- Check if similar alert exists in last 24 hours
    SELECT id INTO v_existing_alert
    FROM public.notifications
    WHERE user_id = NEW.user_id
      AND type = 'low_balance'
      AND metadata->>'fund_source_id' = NEW.id::text
      AND created_at > now() - interval '24 hours';
    
    IF v_existing_alert IS NULL THEN
      PERFORM public.create_notification(
        NEW.user_id,
        'low_balance',
        'Saldo Rendah 💰',
        format('Saldo "%s" tinggal %s', NEW.name, 'Rp ' || to_char(NEW.balance, 'FM999,999,999')),
        'i-lucide-wallet',
        'warning',
        '/fund-sources',
        jsonb_build_object('fund_source_id', NEW.id, 'balance', NEW.balance)
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for low balance
DROP TRIGGER IF EXISTS trigger_check_low_balance ON public.fund_sources;
CREATE TRIGGER trigger_check_low_balance
  AFTER UPDATE OF balance ON public.fund_sources
  FOR EACH ROW
  EXECUTE FUNCTION public.check_low_balance();

-- =====================================================
-- 8. GOAL MILESTONE FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION public.check_goal_milestone()
RETURNS TRIGGER AS $$
DECLARE
  v_old_percentage INTEGER;
  v_new_percentage INTEGER;
  v_milestone INTEGER;
  v_milestones INTEGER[] := ARRAY[25, 50, 75, 100];
  v_existing_alert UUID;
BEGIN
  -- Calculate percentages
  IF NEW.target_amount > 0 THEN
    v_old_percentage := (OLD.current_amount * 100 / NEW.target_amount);
    v_new_percentage := (NEW.current_amount * 100 / NEW.target_amount);
  ELSE
    RETURN NEW;
  END IF;
  
  -- Check each milestone
  FOREACH v_milestone IN ARRAY v_milestones
  LOOP
    IF v_new_percentage >= v_milestone AND v_old_percentage < v_milestone THEN
      -- Check if similar alert exists
      SELECT id INTO v_existing_alert
      FROM public.notifications
      WHERE user_id = NEW.user_id
        AND type = 'goal_progress'
        AND metadata->>'goal_id' = NEW.id::text
        AND metadata->>'milestone' = v_milestone::text;
      
      IF v_existing_alert IS NULL THEN
        IF v_milestone = 100 THEN
          PERFORM public.create_notification(
            NEW.user_id,
            'goal_progress',
            'Goal Tercapai! 🎉',
            format('Selamat! Goal "%s" sudah tercapai 100%%!', NEW.name),
            'i-lucide-trophy',
            'success',
            '/goals',
            jsonb_build_object('goal_id', NEW.id, 'milestone', v_milestone)
          );
        ELSE
          PERFORM public.create_notification(
            NEW.user_id,
            'goal_progress',
            format('Goal Progress %s%% 🎯', v_milestone),
            format('Goal "%s" sudah mencapai %s%%!', NEW.name, v_milestone),
            'i-lucide-target',
            'primary',
            '/goals',
            jsonb_build_object('goal_id', NEW.id, 'milestone', v_milestone)
          );
        END IF;
      END IF;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for goal milestone
DROP TRIGGER IF EXISTS trigger_check_goal_milestone ON public.goals;
CREATE TRIGGER trigger_check_goal_milestone
  AFTER UPDATE OF current_amount ON public.goals
  FOR EACH ROW
  WHEN (NEW.current_amount <> OLD.current_amount)
  EXECUTE FUNCTION public.check_goal_milestone();

-- =====================================================
-- 9. RPC FUNCTIONS FOR FRONTEND
-- =====================================================

-- Mark notification as read
CREATE OR REPLACE FUNCTION public.mark_notification_read(p_notification_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.notifications
  SET is_read = true
  WHERE id = p_notification_id AND user_id = auth.uid();
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mark all notifications as read
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.notifications
  SET is_read = true
  WHERE user_id = auth.uid() AND is_read = false;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get unread count
CREATE OR REPLACE FUNCTION public.get_unread_notifications_count()
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM public.notifications
    WHERE user_id = auth.uid() AND is_read = false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 10. SAMPLE NOTIFICATIONS (Optional - for testing)
-- =====================================================
-- Uncomment to insert sample notifications for current user
/*
INSERT INTO public.notifications (user_id, type, title, message, icon, color, link)
SELECT 
  auth.uid(),
  'budget_alert',
  'Peringatan Budget ⚠️',
  'Budget "Makanan" sudah mencapai 85% dari limit',
  'i-lucide-alert-circle',
  'warning',
  '/budgets'
WHERE auth.uid() IS NOT NULL;
*/

-- =====================================================
-- DONE!
-- =====================================================
-- Jalankan script ini di Supabase SQL Editor untuk membuat
-- sistem notifikasi lengkap dengan auto-trigger untuk:
-- 1. Budget Alerts (saat spending mencapai threshold)
-- 2. Low Balance Warnings (saat saldo < Rp 100.000)
-- 3. Goal Milestones (25%, 50%, 75%, 100%)

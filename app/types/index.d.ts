import type { AvatarProps } from "@nuxt/ui";

// ============================================
// USER & GENERIC TYPES
// ============================================

export type UserStatus = "subscribed" | "unsubscribed" | "bounced";
export type SaleStatus = "paid" | "failed" | "refunded";

export interface User {
  id: number;
  name: string;
  email: string;
  avatar?: AvatarProps;
  status: UserStatus;
  location: string;
}

export interface Mail {
  id: number;
  unread?: boolean;
  from: User;
  subject: string;
  body: string;
  date: string;
}

export interface Member {
  name: string;
  username: string;
  role: "member" | "owner";
  avatar: AvatarProps;
}

export interface Stat {
  title: string;
  icon: string;
  value: number | string;
  variation: number;
  formatter?: (value: number) => string;
}

export interface Sale {
  id: string;
  date: string;
  status: SaleStatus;
  email: string;
  amount: number;
}

export interface Notification {
  id: number;
  unread?: boolean;
  sender: User;
  body: string;
  date: string;
}

export type Period = "daily" | "weekly" | "monthly";

export interface Range {
  start: Date;
  end: Date;
}

// ============================================
// FINANCE TRACKER TYPES
// ============================================

// Enums
export type TransactionType = "income" | "expense" | "transfer";
export type FundSourceType =
  | "bank"
  | "cash"
  | "credit_card"
  | "wallet"
  | "other";
export type BudgetPeriod = "monthly" | "quarterly" | "yearly";
export type GoalCategory = "savings" | "investment" | "debt_payoff" | "other";
export type GoalStatus = "active" | "completed" | "cancelled";
export type TransactionStatus = "pending" | "completed" | "failed";
export type Frequency =
  | "daily"
  | "weekly"
  | "biweekly"
  | "monthly"
  | "quarterly"
  | "yearly";

// User Profile
export interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  default_currency: string;
  created_at: string;
  updated_at: string;
}

// Category
export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: "income" | "expense";
  parent_id: string | null;
  color: string | null;
  icon: string | null;
  description: string | null;
  is_active: boolean;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
  children?: Category[];
}

export interface CategoryCreate {
  name: string;
  type: "income" | "expense";
  parent_id?: string | null;
  color?: string | null;
  icon?: string | null;
  description?: string | null;
  sort_order?: number | null;
}

// Fund Source
export interface FundSource {
  id: string;
  user_id: string;
  name: string;
  type: FundSourceType;
  balance: number;
  currency: string;
  is_active: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface FundSourceCreate {
  name: string;
  type: FundSourceType;
  balance?: number;
  currency?: string;
  description?: string | null;
}

// Transaction
export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  description: string | null;
  category_id: string | null;
  source_fund_id: string | null;
  destination_fund_id: string | null;
  transaction_date: string;
  notes: string | null;
  is_recurring: boolean;
  recurring_pattern_id: string | null;
  status: TransactionStatus;
  created_at: string;
  updated_at: string;
  // Joined fields
  category?: Category | null;
  source_fund?: FundSource | null;
  destination_fund?: FundSource | null;
}

export interface TransactionCreate {
  type: TransactionType;
  amount: number;
  description?: string | null;
  category_id?: string | null;
  source_fund_id?: string | null;
  destination_fund_id?: string | null;
  transaction_date: string;
  notes?: string | null;
  recurring_pattern_id?: string | null;
}

// Budget
export interface Budget {
  id: string;
  user_id: string;
  name: string;
  period: BudgetPeriod;
  start_date: string;
  end_date: string;
  total_limit: number;
  alert_threshold: number;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  budget_items?: BudgetItem[];
}

export interface BudgetCreate {
  name: string;
  period: BudgetPeriod;
  start_date: string;
  end_date: string;
  total_limit: number;
  alert_threshold?: number;
  description?: string | null;
}

// Budget Item
export interface BudgetItem {
  id: string;
  budget_id: string;
  category_id: string;
  planned_amount: number;
  spent_amount: number;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface BudgetItemCreate {
  category_id: string;
  planned_amount: number;
}

// Financial Goal
export interface FinancialGoal {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  target_amount: number;
  current_amount: number;
  category: GoalCategory;
  target_date: string;
  status: GoalStatus;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface FinancialGoalCreate {
  name: string;
  description?: string | null;
  target_amount: number;
  current_amount?: number;
  category: GoalCategory;
  target_date: string;
  priority?: number;
}

// Recurring Pattern
export interface RecurringPattern {
  id: string;
  user_id: string;
  name: string;
  frequency: Frequency;
  interval: number;
  amount: number;
  category_id: string | null;
  source_fund_id: string | null;
  destination_fund_id: string | null;
  transaction_type: TransactionType;
  description: string | null;
  start_date: string;
  end_date: string | null;
  next_execution_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category?: Category | null;
  source_fund?: FundSource | null;
  destination_fund?: FundSource | null;
}

export interface RecurringPatternCreate {
  name: string;
  frequency: Frequency;
  interval?: number;
  amount: number;
  category_id?: string | null;
  source_fund_id?: string | null;
  destination_fund_id?: string | null;
  transaction_type: TransactionType;
  description?: string | null;
  start_date: string;
  end_date?: string | null;
}

// Dashboard Summary (from RPC)
export interface DashboardSummary {
  total_balance: number;
  total_income: number;
  total_expense: number;
  net_flow: number;
  active_budgets_count: number;
  active_goals_count: number;
  fund_sources_count: number;
}

// Budget Spending Detail (from RPC)
export interface BudgetSpendingDetail {
  category_id: string;
  category_name: string;
  planned_amount: number;
  spent_amount: number;
  percentage: number;
  status: "ok" | "warning" | "exceeded";
}

// Monthly Spending (from RPC)
export interface MonthlySpending {
  category_id: string;
  category_name: string;
  category_type: string;
  total_amount: number;
  transaction_count: number;
}

// Goal Progress (from RPC)
export interface GoalProgress {
  goal_id: string;
  goal_name: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  days_remaining: number;
  progress_percentage: number;
  status: GoalStatus;
  is_on_track: boolean;
}

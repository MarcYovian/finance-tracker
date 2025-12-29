import type {
  Budget,
  BudgetCreate,
  BudgetItem,
  BudgetItemCreate,
  BudgetSpendingDetail,
} from "~/types";

const CACHE_KEY = "budgets";

export const useBudgets = () => {
  const supabase = useSupabaseClient();
  const user = useSupabaseUser();
  const cache = useCache();

  const budgets = ref<Budget[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const fetchBudgets = async (forceRefresh = false) => {
    if (!user.value) return;

    // Check cache first
    if (!forceRefresh) {
      const cached = cache.get<Budget[]>(CACHE_KEY);
      if (cached) {
        budgets.value = cached;
        return;
      }
    }

    loading.value = true;
    error.value = null;

    try {
      const { data, error: fetchError } = await supabase
        .from("budgets")
        .select(
          `
          *,
          budget_items(
            *,
            category:categories(*)
          )
        `
        )
        .eq("user_id", user.value.id)
        .eq("is_active", true)
        .order("start_date", { ascending: false });

      if (fetchError) throw fetchError;

      budgets.value = data as Budget[];
      cache.set(CACHE_KEY, budgets.value);
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : "Failed to fetch budgets";
    } finally {
      loading.value = false;
    }
  };

  const createBudget = async (
    budget: BudgetCreate,
    items: BudgetItemCreate[]
  ) => {
    if (!user.value) return null;

    loading.value = true;
    error.value = null;

    try {
      // Create budget first
      const { data: budgetData, error: budgetError } = await supabase
        .from("budgets")
        .insert({
          ...budget,
          user_id: user.value.id,
        })
        .select()
        .single();

      if (budgetError) throw budgetError;

      // Create budget items
      if (items.length > 0) {
        const budgetItems = items.map((item) => ({
          ...item,
          budget_id: budgetData.id,
        }));

        const { error: itemsError } = await supabase
          .from("budget_items")
          .insert(budgetItems);

        if (itemsError) throw itemsError;
      }

      cache.invalidateRelated("budgets");
      // Fetch complete budget with items
      await fetchBudgets(true);

      return budgetData as Budget;
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : "Failed to create budget";
      return null;
    } finally {
      loading.value = false;
    }
  };

  const updateBudget = async (id: string, updates: Partial<BudgetCreate>) => {
    if (!user.value) return null;

    loading.value = true;
    error.value = null;

    try {
      const { data, error: updateError } = await supabase
        .from("budgets")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", user.value.id)
        .select()
        .single();

      if (updateError) throw updateError;

      cache.invalidateRelated("budgets");
      await fetchBudgets(true);
      return data as Budget;
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : "Failed to update budget";
      return null;
    } finally {
      loading.value = false;
    }
  };

  const deleteBudget = async (id: string) => {
    if (!user.value) return false;

    loading.value = true;
    error.value = null;

    try {
      const { error: deleteError } = await supabase
        .from("budgets")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", user.value.id);

      if (deleteError) throw deleteError;

      budgets.value = budgets.value.filter((b) => b.id !== id);
      cache.invalidateRelated("budgets");
      return true;
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : "Failed to delete budget";
      return false;
    } finally {
      loading.value = false;
    }
  };

  const getBudgetSpendingDetails = async (
    budgetId: string
  ): Promise<BudgetSpendingDetail[]> => {
    try {
      const { data, error: fetchError } = await supabase.rpc(
        "get_budget_spending_details",
        {
          p_budget_id: budgetId,
        }
      );

      if (fetchError) throw fetchError;

      return data as BudgetSpendingDetail[];
    } catch (e: unknown) {
      error.value =
        e instanceof Error ? e.message : "Failed to fetch budget spending";
      return [];
    }
  };

  const refreshBudgetSpending = async (budgetId: string) => {
    try {
      const { error: refreshError } = await supabase.rpc(
        "refresh_budget_spending",
        {
          p_budget_id: budgetId,
        }
      );

      if (refreshError) throw refreshError;

      await fetchBudgets();
      return true;
    } catch (e: unknown) {
      error.value =
        e instanceof Error ? e.message : "Failed to refresh budget spending";
      return false;
    }
  };

  // Add budget item
  const addBudgetItem = async (budgetId: string, item: BudgetItemCreate) => {
    loading.value = true;
    error.value = null;

    try {
      const { data, error: createError } = await supabase
        .from("budget_items")
        .insert({
          ...item,
          budget_id: budgetId,
        })
        .select()
        .single();

      if (createError) throw createError;

      cache.invalidateRelated("budgets");
      await fetchBudgets(true);
      return data as BudgetItem;
    } catch (e: unknown) {
      error.value =
        e instanceof Error ? e.message : "Failed to add budget item";
      return null;
    } finally {
      loading.value = false;
    }
  };

  // Remove budget item
  const removeBudgetItem = async (itemId: string) => {
    loading.value = true;
    error.value = null;

    try {
      const { error: deleteError } = await supabase
        .from("budget_items")
        .delete()
        .eq("id", itemId);

      if (deleteError) throw deleteError;

      cache.invalidateRelated("budgets");
      await fetchBudgets(true);
      return true;
    } catch (e: unknown) {
      error.value =
        e instanceof Error ? e.message : "Failed to remove budget item";
      return false;
    } finally {
      loading.value = false;
    }
  };

  return {
    budgets,
    loading,
    error,
    fetchBudgets,
    createBudget,
    updateBudget,
    deleteBudget,
    getBudgetSpendingDetails,
    refreshBudgetSpending,
    addBudgetItem,
    removeBudgetItem,
  };
};

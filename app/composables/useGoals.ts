import type { FinancialGoal, FinancialGoalCreate, GoalProgress } from "~/types";

const CACHE_KEY = "financial-goals";

export const useGoals = () => {
  const supabase = useSupabaseClient();
  const user = useSupabaseUser();
  const cache = useCache();

  const goals = ref<FinancialGoal[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Helper to get current user id from session
  const getUserId = async (): Promise<string | null> => {
    if (user.value?.id) {
      return user.value.id;
    }
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.user?.id || null;
  };

  const fetchGoals = async (forceRefresh = false) => {
    const userId = await getUserId();
    if (!userId) return;

    // Check cache first
    if (!forceRefresh) {
      const cached = cache.get<FinancialGoal[]>(CACHE_KEY);
      if (cached) {
        goals.value = cached;
        return;
      }
    }

    loading.value = true;
    error.value = null;

    try {
      const { data, error: fetchError } = await supabase
        .from("financial_goals")
        .select("*")
        .eq("user_id", userId)
        .order("priority", { ascending: true })
        .order("target_date", { ascending: true });

      if (fetchError) throw fetchError;

      goals.value = data as FinancialGoal[];
      cache.set(CACHE_KEY, goals.value);
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : "Failed to fetch goals";
    } finally {
      loading.value = false;
    }
  };

  const createGoal = async (goal: FinancialGoalCreate) => {
    const userId = await getUserId();
    if (!userId) return null;

    loading.value = true;
    error.value = null;

    try {
      const { data, error: createError } = await supabase
        .from("financial_goals")
        .insert({
          ...goal,
          user_id: userId,
        })
        .select()
        .single();

      if (createError) throw createError;

      goals.value.push(data as FinancialGoal);
      cache.invalidateRelated("financial-goals");
      return data as FinancialGoal;
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : "Failed to create goal";
      return null;
    } finally {
      loading.value = false;
    }
  };

  const updateGoal = async (
    id: string,
    updates: Partial<FinancialGoalCreate>
  ) => {
    const userId = await getUserId();
    if (!userId) return null;

    loading.value = true;
    error.value = null;

    try {
      const { data, error: updateError } = await supabase
        .from("financial_goals")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", userId)
        .select()
        .single();

      if (updateError) throw updateError;

      const index = goals.value.findIndex((g) => g.id === id);
      if (index !== -1) {
        goals.value[index] = data as FinancialGoal;
      }

      cache.invalidateRelated("financial-goals");
      return data as FinancialGoal;
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : "Failed to update goal";
      return null;
    } finally {
      loading.value = false;
    }
  };

  const deleteGoal = async (id: string) => {
    const userId = await getUserId();
    if (!userId) return false;

    loading.value = true;
    error.value = null;

    try {
      const { error: deleteError } = await supabase
        .from("financial_goals")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

      if (deleteError) throw deleteError;

      goals.value = goals.value.filter((g) => g.id !== id);
      cache.invalidateRelated("financial-goals");
      return true;
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : "Failed to delete goal";
      return false;
    } finally {
      loading.value = false;
    }
  };

  const updateGoalProgress = async (id: string, currentAmount: number) => {
    return await updateGoal(id, { current_amount: currentAmount });
  };

  const completeGoal = async (id: string) => {
    const userId = await getUserId();
    if (!userId) return false;

    loading.value = true;
    error.value = null;

    try {
      const { error: updateError } = await supabase
        .from("financial_goals")
        .update({ status: "completed", updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", userId);

      if (updateError) throw updateError;

      const index = goals.value.findIndex((g) => g.id === id);
      const goal = goals.value[index];
      if (index !== -1 && goal) {
        goal.status = "completed";
      }

      return true;
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : "Failed to complete goal";
      return false;
    } finally {
      loading.value = false;
    }
  };

  const cancelGoal = async (id: string) => {
    const userId = await getUserId();
    if (!userId) return false;

    loading.value = true;
    error.value = null;

    try {
      const { error: updateError } = await supabase
        .from("financial_goals")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", userId);

      if (updateError) throw updateError;

      const index = goals.value.findIndex((g) => g.id === id);
      const goal = goals.value[index];
      if (index !== -1 && goal) {
        goal.status = "cancelled";
      }

      return true;
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : "Failed to cancel goal";
      return false;
    } finally {
      loading.value = false;
    }
  };

  const getGoalsWithProgress = async (): Promise<GoalProgress[]> => {
    try {
      const { data, error: fetchError } = await supabase.rpc(
        "get_goals_with_progress"
      );

      if (fetchError) throw fetchError;

      return data as GoalProgress[];
    } catch (e: unknown) {
      error.value =
        e instanceof Error ? e.message : "Failed to fetch goals progress";
      return [];
    }
  };

  // Computed properties
  const activeGoals = computed(() =>
    goals.value.filter((g) => g.status === "active")
  );
  const completedGoals = computed(() =>
    goals.value.filter((g) => g.status === "completed")
  );

  return {
    goals,
    activeGoals,
    completedGoals,
    loading,
    error,
    fetchGoals,
    createGoal,
    updateGoal,
    deleteGoal,
    updateGoalProgress,
    completeGoal,
    cancelGoal,
    getGoalsWithProgress,
  };
};

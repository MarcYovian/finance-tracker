import type { FundSource, FundSourceCreate } from "~/types";

const CACHE_KEY = "fund-sources";

export const useFundSources = () => {
  const supabase = useSupabaseClient();
  const user = useSupabaseUser();
  const cache = useCache();

  const fundSources = ref<FundSource[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const fetchFundSources = async (forceRefresh = false) => {
    if (!user.value) return;

    // Check cache first
    if (!forceRefresh) {
      const cached = cache.get<FundSource[]>(CACHE_KEY);
      if (cached) {
        fundSources.value = cached;
        return;
      }
    }

    loading.value = true;
    error.value = null;

    try {
      const { data, error: fetchError } = await supabase
        .from("fund_sources")
        .select("*")
        .eq("user_id", user.value.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      fundSources.value = data as FundSource[];
      cache.set(CACHE_KEY, fundSources.value);
    } catch (e: unknown) {
      error.value =
        e instanceof Error ? e.message : "Failed to fetch fund sources";
    } finally {
      loading.value = false;
    }
  };

  const createFundSource = async (fundSource: FundSourceCreate) => {
    if (!user.value) return null;

    loading.value = true;
    error.value = null;

    try {
      const { data, error: createError } = await supabase
        .from("fund_sources")
        .insert({
          ...fundSource,
          user_id: user.value.id,
        })
        .select()
        .single();

      if (createError) throw createError;

      fundSources.value.unshift(data as FundSource);
      cache.invalidateRelated("fund-sources");
      return data as FundSource;
    } catch (e: unknown) {
      error.value =
        e instanceof Error ? e.message : "Failed to create fund source";
      return null;
    } finally {
      loading.value = false;
    }
  };

  const updateFundSource = async (
    id: string,
    updates: Partial<FundSourceCreate>
  ) => {
    if (!user.value) return null;

    loading.value = true;
    error.value = null;

    try {
      const { data, error: updateError } = await supabase
        .from("fund_sources")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", user.value.id)
        .select()
        .single();

      if (updateError) throw updateError;

      const index = fundSources.value.findIndex((f) => f.id === id);
      if (index !== -1) {
        fundSources.value[index] = data as FundSource;
      }

      cache.invalidateRelated("fund-sources");
      return data as FundSource;
    } catch (e: unknown) {
      error.value =
        e instanceof Error ? e.message : "Failed to update fund source";
      return null;
    } finally {
      loading.value = false;
    }
  };

  const deleteFundSource = async (id: string) => {
    if (!user.value) return false;

    loading.value = true;
    error.value = null;

    try {
      // Soft delete by setting is_active to false
      const { error: deleteError } = await supabase
        .from("fund_sources")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", user.value.id);

      if (deleteError) throw deleteError;

      fundSources.value = fundSources.value.filter((f) => f.id !== id);
      cache.invalidateRelated("fund-sources");
      return true;
    } catch (e: unknown) {
      error.value =
        e instanceof Error ? e.message : "Failed to delete fund source";
      return false;
    } finally {
      loading.value = false;
    }
  };

  const getTotalBalance = computed(() => {
    return fundSources.value.reduce((sum, fund) => sum + fund.balance, 0);
  });

  return {
    fundSources,
    loading,
    error,
    fetchFundSources,
    createFundSource,
    updateFundSource,
    deleteFundSource,
    getTotalBalance,
  };
};

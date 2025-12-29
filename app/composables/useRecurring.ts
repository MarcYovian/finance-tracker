import type { RecurringPattern, RecurringPatternCreate } from "~/types";

const CACHE_KEY = "recurring-patterns";

export const useRecurring = () => {
  const supabase = useSupabaseClient();
  const user = useSupabaseUser();
  const cache = useCache();

  const patterns = ref<RecurringPattern[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const fetchPatterns = async (forceRefresh = false) => {
    if (!user.value) return;

    // Check cache first
    if (!forceRefresh) {
      const cached = cache.get<RecurringPattern[]>(CACHE_KEY);
      if (cached) {
        patterns.value = cached;
        return;
      }
    }

    loading.value = true;
    error.value = null;

    try {
      const { data, error: fetchError } = await supabase
        .from("recurring_patterns")
        .select(
          `
          *,
          category:categories(*),
          source_fund:fund_sources!recurring_patterns_source_fund_fkey(*),
          destination_fund:fund_sources!recurring_patterns_destination_fund_fkey(*)
        `
        )
        .eq("user_id", user.value.id)
        .order("next_execution_date", { ascending: true });

      if (fetchError) throw fetchError;

      patterns.value = data as RecurringPattern[];
      cache.set(CACHE_KEY, patterns.value);
    } catch (e: unknown) {
      error.value =
        e instanceof Error ? e.message : "Failed to fetch recurring patterns";
    } finally {
      loading.value = false;
    }
  };

  const createPattern = async (pattern: RecurringPatternCreate) => {
    if (!user.value) return null;

    loading.value = true;
    error.value = null;

    try {
      // Calculate next execution date from start_date
      const { data, error: createError } = await supabase
        .from("recurring_patterns")
        .insert({
          ...pattern,
          user_id: user.value.id,
          next_execution_date: pattern.start_date,
          interval: pattern.interval || 1,
        })
        .select()
        .single();

      if (createError) throw createError;

      cache.invalidateRelated("recurring-patterns");
      await fetchPatterns(true);
      return data as RecurringPattern;
    } catch (e: unknown) {
      error.value =
        e instanceof Error ? e.message : "Failed to create recurring pattern";
      return null;
    } finally {
      loading.value = false;
    }
  };

  const updatePattern = async (
    id: string,
    updates: Partial<RecurringPatternCreate>
  ) => {
    if (!user.value) return null;

    loading.value = true;
    error.value = null;

    try {
      const { data, error: updateError } = await supabase
        .from("recurring_patterns")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", user.value.id)
        .select()
        .single();

      if (updateError) throw updateError;

      cache.invalidateRelated("recurring-patterns");
      await fetchPatterns(true);
      return data as RecurringPattern;
    } catch (e: unknown) {
      error.value =
        e instanceof Error ? e.message : "Failed to update recurring pattern";
      return null;
    } finally {
      loading.value = false;
    }
  };

  const deletePattern = async (id: string) => {
    if (!user.value) return false;

    loading.value = true;
    error.value = null;

    try {
      const { error: deleteError } = await supabase
        .from("recurring_patterns")
        .delete()
        .eq("id", id)
        .eq("user_id", user.value.id);

      if (deleteError) throw deleteError;

      patterns.value = patterns.value.filter((p) => p.id !== id);
      cache.invalidateRelated("recurring-patterns");
      return true;
    } catch (e: unknown) {
      error.value =
        e instanceof Error ? e.message : "Failed to delete recurring pattern";
      return false;
    } finally {
      loading.value = false;
    }
  };

  const togglePattern = async (id: string, isActive: boolean) => {
    if (!user.value) return false;

    loading.value = true;
    error.value = null;

    try {
      const { error: updateError } = await supabase
        .from("recurring_patterns")
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", user.value.id);

      if (updateError) throw updateError;

      const index = patterns.value.findIndex((p) => p.id === id);
      const pattern = patterns.value[index];
      if (index !== -1 && pattern) {
        pattern.is_active = isActive;
      }

      cache.invalidateRelated("recurring-patterns");
      return true;
    } catch (e: unknown) {
      error.value =
        e instanceof Error ? e.message : "Failed to toggle recurring pattern";
      return false;
    } finally {
      loading.value = false;
    }
  };

  // Computed properties
  const activePatterns = computed(() =>
    patterns.value.filter((p) => p.is_active)
  );
  const inactivePatterns = computed(() =>
    patterns.value.filter((p) => !p.is_active)
  );

  return {
    patterns,
    activePatterns,
    inactivePatterns,
    loading,
    error,
    fetchPatterns,
    createPattern,
    updatePattern,
    deletePattern,
    togglePattern,
  };
};

import type { Category, CategoryCreate } from "~/types";

const CACHE_KEY = "categories";

export const useCategories = () => {
  const supabase = useSupabaseClient();
  const user = useSupabaseUser();
  const cache = useCache();

  const categories = ref<Category[]>([]);
  const incomeCategories = computed(() =>
    categories.value.filter((c) => c.type === "income")
  );
  const expenseCategories = computed(() =>
    categories.value.filter((c) => c.type === "expense")
  );

  const loading = ref(false);
  const error = ref<string | null>(null);

  const fetchCategories = async (forceRefresh = false) => {
    if (!user.value) return;

    // Check cache first
    if (!forceRefresh) {
      const cached = cache.get<Category[]>(CACHE_KEY);
      if (cached) {
        categories.value = cached;
        return;
      }
    }

    loading.value = true;
    error.value = null;

    try {
      const { data, error: fetchError } = await supabase
        .from("categories")
        .select("*")
        .eq("user_id", user.value.id)
        .eq("is_active", true)
        .order("sort_order", { ascending: true, nullsFirst: false })
        .order("name", { ascending: true });

      if (fetchError) throw fetchError;

      categories.value = data as Category[];
      cache.set(CACHE_KEY, categories.value);
    } catch (e: unknown) {
      error.value =
        e instanceof Error ? e.message : "Failed to fetch categories";
    } finally {
      loading.value = false;
    }
  };

  const createCategory = async (category: CategoryCreate) => {
    if (!user.value) return null;

    loading.value = true;
    error.value = null;

    try {
      const { data, error: createError } = await supabase
        .from("categories")
        .insert({
          ...category,
          user_id: user.value.id,
        })
        .select()
        .single();

      if (createError) throw createError;

      categories.value.push(data as Category);
      cache.invalidateRelated("categories");
      return data as Category;
    } catch (e: unknown) {
      error.value =
        e instanceof Error ? e.message : "Failed to create category";
      return null;
    } finally {
      loading.value = false;
    }
  };

  const updateCategory = async (
    id: string,
    updates: Partial<CategoryCreate>
  ) => {
    if (!user.value) return null;

    loading.value = true;
    error.value = null;

    try {
      const { data, error: updateError } = await supabase
        .from("categories")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", user.value.id)
        .select()
        .single();

      if (updateError) throw updateError;

      const index = categories.value.findIndex((c) => c.id === id);
      if (index !== -1) {
        categories.value[index] = data as Category;
      }

      cache.invalidateRelated("categories");
      return data as Category;
    } catch (e: unknown) {
      error.value =
        e instanceof Error ? e.message : "Failed to update category";
      return null;
    } finally {
      loading.value = false;
    }
  };

  const deleteCategory = async (id: string) => {
    if (!user.value) return false;

    loading.value = true;
    error.value = null;

    try {
      // Soft delete by setting is_active to false
      const { error: deleteError } = await supabase
        .from("categories")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", user.value.id);

      if (deleteError) throw deleteError;

      categories.value = categories.value.filter((c) => c.id !== id);
      cache.invalidateRelated("categories");
      return true;
    } catch (e: unknown) {
      error.value =
        e instanceof Error ? e.message : "Failed to delete category";
      return false;
    } finally {
      loading.value = false;
    }
  };

  // Build hierarchical category structure
  const getCategoriesTree = computed(() => {
    const parentCategories = categories.value.filter((c) => !c.parent_id);
    return parentCategories.map((parent) => ({
      ...parent,
      children: categories.value.filter((c) => c.parent_id === parent.id),
    }));
  });

  return {
    categories,
    incomeCategories,
    expenseCategories,
    loading,
    error,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoriesTree,
  };
};

import type { Transaction, TransactionCreate } from "~/types";

const CACHE_KEY = "transactions";

export const useTransactions = () => {
  const supabase = useSupabaseClient();
  const user = useSupabaseUser();
  const cache = useCache();

  const transactions = ref<Transaction[]>([]);
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

  const fetchTransactions = async (options?: {
    startDate?: string;
    endDate?: string;
    type?: "income" | "expense" | "transfer";
    categoryId?: string;
    fundSourceId?: string;
    limit?: number;
    offset?: number;
    forceRefresh?: boolean;
  }) => {
    const userId = await getUserId();
    if (!userId) return;

    // Build cache key based on options
    const cacheKey = `${CACHE_KEY}-${JSON.stringify(options || {})}`;

    // Check cache first
    if (!options?.forceRefresh) {
      const cached = cache.get<Transaction[]>(cacheKey);
      if (cached) {
        transactions.value = cached;
        return;
      }
    }

    loading.value = true;
    error.value = null;

    try {
      let query = supabase
        .from("transactions")
        .select(
          `
          *,
          category:categories(*),
          source_fund:fund_sources!transactions_source_fund_fkey(*),
          destination_fund:fund_sources!transactions_destination_fund_fkey(*)
        `
        )
        .eq("user_id", userId)
        .order("transaction_date", { ascending: false });

      if (options?.startDate) {
        query = query.gte("transaction_date", options.startDate);
      }
      if (options?.endDate) {
        query = query.lte("transaction_date", options.endDate);
      }
      if (options?.type) {
        query = query.eq("type", options.type);
      }
      if (options?.categoryId) {
        query = query.eq("category_id", options.categoryId);
      }
      if (options?.fundSourceId) {
        query = query.or(
          `source_fund_id.eq.${options.fundSourceId},destination_fund_id.eq.${options.fundSourceId}`
        );
      }
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      if (options?.offset) {
        query = query.range(
          options.offset,
          options.offset + (options.limit || 10) - 1
        );
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      transactions.value = data as Transaction[];
      cache.set(cacheKey, transactions.value);
    } catch (e: unknown) {
      error.value =
        e instanceof Error ? e.message : "Failed to fetch transactions";
    } finally {
      loading.value = false;
    }
  };

  const createTransaction = async (transaction: TransactionCreate) => {
    const userId = await getUserId();
    if (!userId) return null;

    loading.value = true;
    error.value = null;

    try {
      // Use RPC function for atomic balance update
      const { data, error: createError } = await supabase.rpc(
        "create_transaction_with_balance_update",
        {
          p_type: transaction.type,
          p_amount: transaction.amount,
          p_description: transaction.description ?? "",
          p_category_id: transaction.category_id ?? "",
          p_source_fund_id: transaction.source_fund_id ?? "",
          p_destination_fund_id: transaction.destination_fund_id ?? "",
          p_transaction_date: transaction.transaction_date,
          p_notes: transaction.notes ?? undefined,
          p_recurring_pattern_id: transaction.recurring_pattern_id ?? undefined,
        }
      );

      if (createError) throw createError;

      // Invalidate related caches
      cache.invalidateRelated("transactions");

      // Fetch the complete transaction with relations
      await fetchTransactions({ limit: 20, forceRefresh: true });

      return data as Transaction;
    } catch (e: unknown) {
      error.value =
        e instanceof Error ? e.message : "Failed to create transaction";
      return null;
    } finally {
      loading.value = false;
    }
  };

  const updateTransaction = async (
    id: string,
    updates: Partial<TransactionCreate> & { amount: number }
  ) => {
    const userId = await getUserId();
    if (!userId) return null;

    loading.value = true;
    error.value = null;

    try {
      const transactionDate =
        updates.transaction_date ??
        new Date().toISOString().split("T")[0] ??
        new Date().toISOString();
      const { data, error: updateError } = await supabase.rpc(
        "update_transaction_with_balance_adjustment",
        {
          p_transaction_id: id,
          p_amount: updates.amount,
          p_source_fund_id: updates.source_fund_id ?? "",
          p_destination_fund_id: updates.destination_fund_id ?? "",
          p_transaction_date: transactionDate,
          p_description: updates.description ?? "",
          p_category_id: updates.category_id ?? "",
          p_notes: updates.notes ?? "",
        }
      );

      if (updateError) throw updateError;

      // Invalidate related caches
      cache.invalidateRelated("transactions");

      // Refresh transactions list
      await fetchTransactions({ limit: 20, forceRefresh: true });

      return data as Transaction;
    } catch (e: unknown) {
      error.value =
        e instanceof Error ? e.message : "Failed to update transaction";
      return null;
    } finally {
      loading.value = false;
    }
  };

  const deleteTransaction = async (id: string) => {
    const userId = await getUserId();
    if (!userId) return false;

    loading.value = true;
    error.value = null;

    try {
      const { error: deleteError } = await supabase.rpc(
        "delete_transaction_with_balance_adjustment",
        {
          p_transaction_id: id,
        }
      );

      if (deleteError) throw deleteError;

      transactions.value = transactions.value.filter((t) => t.id !== id);
      cache.invalidateRelated("transactions");
      return true;
    } catch (e: unknown) {
      error.value =
        e instanceof Error ? e.message : "Failed to delete transaction";
      return false;
    } finally {
      loading.value = false;
    }
  };

  return {
    transactions,
    loading,
    error,
    fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  };
};

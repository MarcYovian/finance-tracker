import { createSharedComposable } from "@vueuse/core";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

const _useCache = () => {
  const cache = reactive(new Map<string, CacheEntry<unknown>>());

  // Default cache duration: 5 minutes
  const DEFAULT_TTL = 5 * 60 * 1000;

  /**
   * Get cached data if valid
   */
  function get<T>(key: string): T | null {
    const entry = cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set cache data with optional TTL
   */
  function set<T>(key: string, data: T, ttl: number = DEFAULT_TTL): void {
    const now = Date.now();
    cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttl,
    });
  }

  /**
   * Invalidate specific cache key
   */
  function invalidate(key: string): void {
    cache.delete(key);
  }

  /**
   * Invalidate all cache keys that start with prefix
   */
  function invalidatePrefix(prefix: string): void {
    for (const key of cache.keys()) {
      if (key.startsWith(prefix)) {
        cache.delete(key);
      }
    }
  }

  /**
   * Invalidate related caches when data changes
   * This is called after create, update, or delete operations
   */
  function invalidateRelated(entity: string): void {
    // Invalidate the entity's own cache
    invalidatePrefix(entity);

    // Invalidate dashboard cache as it depends on most entities
    invalidatePrefix("dashboard");

    // Entity-specific relationships
    const relationships: Record<string, string[]> = {
      transactions: ["fund-sources", "budgets", "categories"],
      "fund-sources": ["transactions", "dashboard"],
      categories: ["transactions", "budgets"],
      budgets: ["budget-items"],
      "budget-items": ["budgets"],
      "financial-goals": [],
      "recurring-patterns": [],
    };

    const related = relationships[entity] || [];
    related.forEach((relatedEntity) => {
      invalidatePrefix(relatedEntity);
    });
  }

  /**
   * Clear all cache
   */
  function clear(): void {
    cache.clear();
  }

  /**
   * Get cache stats
   */
  function stats() {
    return {
      size: cache.size,
      keys: Array.from(cache.keys()),
    };
  }

  return {
    get,
    set,
    invalidate,
    invalidatePrefix,
    invalidateRelated,
    clear,
    stats,
  };
};

export const useCache = createSharedComposable(_useCache);

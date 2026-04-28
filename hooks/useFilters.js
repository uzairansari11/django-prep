'use client';

import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { useCallback, useMemo } from 'react';

/**
 * Custom hook for managing filter state via URL search params.
 * Syncs filter state with URL for shareable/bookmarkable filtered views.
 *
 * @param {Object} defaultValues - Default filter values
 * @returns {Object} - { filters, setFilter, setFilters, clearFilters, updateURL }
 *
 * @example
 * const { filters, setFilter, clearFilters } = useFilters({
 *   search: '',
 *   difficulty: 'all',
 *   category: 'all'
 * });
 */
export function useFilters(defaultValues = {}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  // Parse current filters from URL or use defaults
  const filters = useMemo(() => {
    const current = {};

    Object.keys(defaultValues).forEach((key) => {
      const urlValue = searchParams.get(key);
      current[key] = urlValue !== null ? urlValue : defaultValues[key];
    });

    return current;
  }, [searchParams, defaultValues]);

  /**
   * Update URL with new search params
   */
  const updateURL = useCallback((newFilters) => {
    const params = new URLSearchParams(searchParams);

    Object.entries(newFilters).forEach(([key, value]) => {
      const defaultValue = defaultValues[key];

      // Remove param if it's the default value
      if (value === defaultValue || value === '' || value === null || value === undefined) {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });

    const queryString = params.toString();
    const url = queryString ? `${pathname}?${queryString}` : pathname;

    router.replace(url, { scroll: false });
  }, [searchParams, pathname, router, defaultValues]);

  /**
   * Set a single filter value
   */
  const setFilter = useCallback((key, value) => {
    updateURL({ ...filters, [key]: value });
  }, [filters, updateURL]);

  /**
   * Set multiple filter values at once
   */
  const setFilters = useCallback((newFilters) => {
    updateURL({ ...filters, ...newFilters });
  }, [filters, updateURL]);

  /**
   * Reset all filters to default values
   */
  const clearFilters = useCallback(() => {
    updateURL(defaultValues);
  }, [defaultValues, updateURL]);

  /**
   * Check if any filter is active (different from default)
   */
  const hasActiveFilters = useMemo(() => {
    return Object.keys(defaultValues).some((key) => {
      return filters[key] !== defaultValues[key];
    });
  }, [filters, defaultValues]);

  return {
    filters,
    setFilter,
    setFilters,
    clearFilters,
    updateURL,
    hasActiveFilters,
  };
}

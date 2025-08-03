import { useState, useEffect } from 'react';
import { SearchResult } from '@/types';
import { useDebounce } from './useDebounce';
import { UI_CONFIG } from '@/utils/constants';

export function useSearch(initialKeyword: string = '') {
  const [keyword, setKeyword] = useState(initialKeyword);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SearchResult | null>(null);

  const debouncedKeyword = useDebounce(keyword, UI_CONFIG.SEARCH_DEBOUNCE_MS);

  useEffect(() => {
    if (!debouncedKeyword.trim()) {
      setResult(null);
      return;
    }

    const search = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/search?keyword=${encodeURIComponent(debouncedKeyword)}`
        );

        const searchResult = await response.json();

        if (!response.ok) {
          throw new Error(searchResult.error || '검색 중 오류가 발생했습니다.');
        }

        setResult(searchResult);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : '검색 중 오류가 발생했습니다.'
        );
        setResult(null);
      } finally {
        setLoading(false);
      }
    };

    search();
  }, [debouncedKeyword]);

  return {
    keyword,
    setKeyword,
    loading,
    error,
    result,
  };
}

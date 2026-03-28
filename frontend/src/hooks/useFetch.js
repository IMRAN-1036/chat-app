/**
 * Custom hook for fetching data with loading and error states
 * Reduces code duplication across components
 */

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { handleApiError } from '../utils/errorHandler';

/**
 * useFetch - Hook for managing async data fetching
 * @param {string} url - API endpoint URL
 * @param {Object} options - Fetch options
 * @param {Array} dependencies - Dependency array for useEffect
 * @returns {Object} { data, loading, error, refetch }
 */
export const useFetch = (url, options = {}, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    const controller = new AbortController();
    
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post(url, options.body || {}, {
        signal: controller.signal,
        timeout: options.timeout || 10000,
      });

      setData(response.data);
    } catch (err) {
      if (err.name !== 'AbortError') {
        const errorInfo = handleApiError(err, `FETCH_${url}`);
        setError(errorInfo);
      }
    } finally {
      setLoading(false);
    }

    return () => controller.abort();
  }, [url, options]);

  useEffect(() => {
    const cleanup = fetchData();
    return cleanup;
  }, dependencies);

  const refetch = useCallback(() => fetchData(), [fetchData]);

  return { data, loading, error, refetch };
};

/**
 * useAsync - Hook for managing async operations
 * @param {Function} asyncFunction - Async function to execute
 * @param {boolean} immediate - Execute immediately on mount
 * @returns {Object} { execute, data, loading, error }
 */
export const useAsync = (asyncFunction, immediate = true) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const response = await asyncFunction(...args);
      setData(response);
      return response;
    } catch (err) {
      const errorInfo = handleApiError(err, 'ASYNC_OPERATION');
      setError(errorInfo);
      throw errorInfo;
    } finally {
      setLoading(false);
    }
  }, [asyncFunction]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return { execute, data, loading, error };
};

/**
 * usePaginatedFetch - Hook for fetching paginated data
 * @param {string} url - API endpoint URL
 * @param {number} pageSize - Items per page
 * @returns {Object} { data, loading, error, currentPage, totalPages, nextPage, prevPage }
 */
export const usePaginatedFetch = (url, pageSize = 10) => {
  const [allData, setAllData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.post(url);
        setAllData(response.data.results || response.data);
      } catch (err) {
        const errorInfo = handleApiError(err, `PAGINATED_FETCH_${url}`);
        setError(errorInfo);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url]);

  const totalPages = Math.ceil(allData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const data = allData.slice(startIndex, endIndex);

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return {
    data,
    loading,
    error,
    currentPage,
    totalPages,
    nextPage,
    prevPage,
    goToPage: setCurrentPage,
  };
};

export default { useFetch, useAsync, usePaginatedFetch };

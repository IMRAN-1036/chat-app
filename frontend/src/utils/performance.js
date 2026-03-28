/**
 * Performance optimization utilities
 * Tools for improving application performance
 */

/**
 * Memoization cache for expensive computations
 */
const memoCache = new Map();

/**
 * Memoize function results
 * @param {Function} fn - Function to memoize
 * @param {Function} keyGenerator - Function to generate cache key
 * @returns {Function} Memoized function
 */
export const memoize = (fn, keyGenerator = (...args) => JSON.stringify(args)) => {
  return (...args) => {
    const key = keyGenerator(...args);
    
    if (memoCache.has(key)) {
      return memoCache.get(key);
    }
    
    const result = fn(...args);
    memoCache.set(key, result);
    
    // Limit cache size
    if (memoCache.size > 1000) {
      const firstKey = memoCache.keys().next().value;
      memoCache.delete(firstKey);
    }
    
    return result;
  };
};

/**
 * Clear memoization cache
 */
export const clearMemoCache = () => {
  memoCache.clear();
};

/**
 * Batch state updates to reduce re-renders
 * @param {Function} updateFn - Function containing state updates
 */
export const batchUpdates = (updateFn) => {
  if (typeof updateFn === 'function') {
    updateFn();
  }
};

/**
 * Lazy load images with Intersection Observer
 * @param {HTMLImageElement} img - Image element to lazy load
 * @param {string} src - Image source URL
 */
export const lazyLoadImage = (img, src) => {
  if (!('IntersectionObserver' in window)) {
    img.src = src;
    return;
  }

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const image = entry.target;
        image.src = src;
        image.classList.add('loaded');
        obs.unobserve(image);
      }
    });
  });

  observer.observe(img);
};

/**
 * Request animation frame wrapper for smooth animations
 * @param {Function} callback - Callback to execute on next frame
 * @returns {number} Animation frame ID
 */
export const requestAnimFrame = (callback) => {
  return window.requestAnimationFrame(callback);
};

/**
 * Cancel animation frame
 * @param {number} id - Animation frame ID
 */
export const cancelAnimFrame = (id) => {
  window.cancelAnimationFrame(id);
};

/**
 * Debounce with leading and trailing options
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @param {Object} options - Options object
 * @param {boolean} options.leading - Execute on leading edge
 * @param {boolean} options.trailing - Execute on trailing edge
 * @returns {Function} Debounced function
 */
export const advancedDebounce = (fn, delay = 300, options = {}) => {
  const { leading = false, trailing = true } = options;
  let timeoutId;
  let lastCallTime;
  let lastInvokeTime = 0;
  let result;

  return function debounced(...args) {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);

    lastCallTime = time;

    if (isInvoking) {
      if (leading && !timeoutId) {
        result = fn.apply(this, args);
        lastInvokeTime = time;
      }
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (trailing) {
          result = fn.apply(this, args);
        }
        timeoutId = undefined;
      }, delay);
    }

    return result;

    function shouldInvoke(time) {
      if (lastInvokeTime === 0) return true;
      const timeSinceLastInvoke = time - lastInvokeTime;
      return timeSinceLastInvoke >= delay;
    }
  };
};

/**
 * Throttle with options
 * @param {Function} fn - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @param {Object} options - Options object
 * @returns {Function} Throttled function
 */
export const advancedThrottle = (fn, limit = 300, options = {}) => {
  const { leading = true, trailing = false } = options;
  let inThrottle;
  let lastRan;
  let lastFunc;

  return function throttled(...args) {
    const now = Date.now();

    if (!lastRan && !leading) {
      lastRan = now;
    }

    if (!inThrottle) {
      if (lastRan && leading) {
        fn.apply(this, args);
        lastRan = now;
      }

      inThrottle = true;
      lastFunc = setTimeout(() => {
        if (trailing && lastRan) {
          fn.apply(this, args);
          lastRan = now;
        }
        inThrottle = false;
      }, limit - (now - lastRan));
    }
  };
};

/**
 * Measure performance of a function
 * @param {string} label - Label for the measurement
 * @param {Function} fn - Function to measure
 * @returns {any} Function result
 */
export const measurePerformance = (label, fn) => {
  const start = performance.now();
  const result = fn();
  const end = performance.now();

  console.log(`[Performance] ${label}: ${(end - start).toFixed(2)}ms`);

  return result;
};

/**
 * Measure async function performance
 * @param {string} label - Label for the measurement
 * @param {Function} fn - Async function to measure
 * @returns {Promise} Function result
 */
export const measureAsyncPerformance = async (label, fn) => {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();

  console.log(`[Performance] ${label}: ${(end - start).toFixed(2)}ms`);

  return result;
};

/**
 * Get performance metrics
 * @returns {Object} Performance metrics
 */
export const getPerformanceMetrics = () => {
  if (!window.performance) {
    return null;
  }

  const navigation = performance.getEntriesByType('navigation')[0];
  const paint = performance.getEntriesByType('paint');

  return {
    domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.domContentLoadedEventStart,
    loadComplete: navigation?.loadEventEnd - navigation?.loadEventStart,
    firstPaint: paint.find(p => p.name === 'first-paint')?.startTime,
    firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime,
    totalTime: navigation?.loadEventEnd - navigation?.fetchStart,
  };
};

/**
 * Monitor long tasks
 * @param {Function} callback - Callback when long task detected
 */
export const monitorLongTasks = (callback) => {
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          callback(entry);
        }
      });

      observer.observe({ entryTypes: ['longtask'] });
    } catch (e) {
      console.warn('Long task monitoring not supported');
    }
  }
};

export default {
  memoize,
  clearMemoCache,
  batchUpdates,
  lazyLoadImage,
  requestAnimFrame,
  cancelAnimFrame,
  advancedDebounce,
  advancedThrottle,
  measurePerformance,
  measureAsyncPerformance,
  getPerformanceMetrics,
  monitorLongTasks,
};

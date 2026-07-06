// useDebounce.js – Custom hook that debounces a value
import { useState, useEffect } from 'react';

/**
 * Returns a debounced version of the given value.
 * @param {*} value
 * @param {number} delay – milliseconds to wait
 * @returns {*} debounced value
 */
function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;

// Inspired by usehooks-ts/useLocalStorage
"use client";

import { useCallback, useEffect, useState, Dispatch, SetStateAction } from 'react';

// A more robust JSON.parse that handles errors.
function safelyParseJson<T>(jsonString: string | null, fallback: T): T {
  if (jsonString === null) return fallback;
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.warn('Error parsing JSON from localStorage', error);
    return fallback;
  }
}

type UseLocalStorageOptions<T> = {
  serializer?: (value: T) => string;
  deserializer?: (value: string) => T;
  initializeWithValue?: boolean; // Set to false if you don't want to read from localStorage on initial render.
};

export function useLocalStorage<T>(
  key: string,
  initialValue: T | (() => T),
  options: UseLocalStorageOptions<T> = {}
): [T, Dispatch<SetStateAction<T>>] {
  const { 
    serializer = JSON.stringify, 
    deserializer = (v) => safelyParseJson(v, initialValue instanceof Function ? initialValue() : initialValue),
    initializeWithValue = true 
  } = options;

  const [storedValue, setStoredValue] = useState<T>(() => {
    if (!initializeWithValue || typeof window === 'undefined') {
      return initialValue instanceof Function ? initialValue() : initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? deserializer(item) : (initialValue instanceof Function ? initialValue() : initialValue);
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue instanceof Function ? initialValue() : initialValue;
    }
  });

  const setValue: Dispatch<SetStateAction<T>> = useCallback(
    value => {
      try {
        const newValue = value instanceof Function ? value(storedValue) : value;
        setStoredValue(newValue);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, serializer(newValue));
          // Dispatch storage event to sync across tabs/windows
          window.dispatchEvent(new StorageEvent('storage', { key, newValue: serializer(newValue) }));
        }
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, serializer, storedValue]
  );

  // Listen to storage events to sync changes across tabs/windows
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.newValue !== null) {
        try {
          setStoredValue(deserializer(event.newValue));
        } catch (error) {
           console.warn(`Error deserializing storage event for key "${key}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, deserializer]);
  
  // Optional: Re-read from local storage if key changes
  useEffect(() => {
    if (initializeWithValue && typeof window !== 'undefined') {
        try {
            const item = window.localStorage.getItem(key);
            setStoredValue(item ? deserializer(item) : (initialValue instanceof Function ? initialValue() : initialValue));
        } catch (error) {
            console.warn(`Error reading localStorage key "${key}" on key change:`, error);
            setStoredValue(initialValue instanceof Function ? initialValue() : initialValue);
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, initializeWithValue]);


  return [storedValue, setValue];
}

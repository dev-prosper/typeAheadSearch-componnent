"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Country } from "../_types";
import { fetchCountries } from "../_helpers";
import { useDebouncedValue } from "../_hooks/useDebouncedValue";

type Status = "idle" | "loading" | "success" | "empty" | "error";

// ---------- Component ----------

export default function CountryTypeahead() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [results, setResults] = useState<Country[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const debouncedQuery = useDebouncedValue(query, 300);

  // requestIdRef guards against out-of-order responses: only the response
  // whose id matches the latest dispatched request gets applied to state.
  const requestIdRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const trimmed = debouncedQuery.trim();

    // Cancel any in-flight request before starting a new one.
    abortControllerRef.current?.abort();

    if (trimmed.length < 2) {
      setStatus("idle");
      setResults([]);
      setIsOpen(false);
      return;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const thisRequestId = ++requestIdRef.current;

    setStatus("loading");
    setIsOpen(true);
    setActiveIndex(-1);

    fetchCountries(trimmed, controller.signal)
      .then((data) => {
        // A newer request may have started (and even resolved) while this
        // one was in flight. Drop this result if it's no longer current.
        if (thisRequestId !== requestIdRef.current) return;
        setResults(data);
        setStatus(data.length === 0 ? "empty" : "success");
      })
      .catch((err: unknown) => {
        const error = err as { name?: string; message?: string };
        if (error.name === "AbortError") return; // expected on cancel/unmount
        if (thisRequestId !== requestIdRef.current) return;
        setErrorMessage(error.message || "Something went wrong");
        setStatus("error");
        setResults([]);
      });

    return () => controller.abort();
  }, [debouncedQuery]);

  const handleSelect = useCallback((country: Country) => {
    setQuery(country.name);
    setIsOpen(false);
    setActiveIndex(-1);
    setResults([]);
    setStatus("idle");
    inputRef.current?.blur();
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen || results.length === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setActiveIndex((prev) => (prev + 1) % results.length);
          break;
        case "ArrowUp":
          e.preventDefault();
          setActiveIndex((prev) => (prev <= 0 ? results.length - 1 : prev - 1));
          break;
        case "Enter":
          if (activeIndex >= 0) {
            e.preventDefault();
            handleSelect(results[activeIndex]);
          }
          break;
        case "Escape":
          setIsOpen(false);
          setActiveIndex(-1);
          break;
      }
    },
    [isOpen, results, activeIndex, handleSelect]
  );

  // Keep the active option scrolled into view during keyboard nav.
  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    const el = listRef.current.children[activeIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const activeOptionId = useMemo(
    () => (activeIndex >= 0 ? `country-option-${activeIndex}` : undefined),
    [activeIndex]
  );

  return (
    <div className="w-full max-w-sm mx-auto">
      <label
        htmlFor="country-search"
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        Search for a country
      </label>

      <div className="relative">
        <input
          id="country-search"
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls="country-listbox"
          aria-activedescendant={activeOptionId}
          autoComplete="off"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder="e.g. Nigeria"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
        />

        {status === "loading" && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <span className="block h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
          </div>
        )}
      </div>

      {isOpen && (
        <div className="relative">
          <ul
            id="country-listbox"
            ref={listRef}
            role="listbox"
            className="absolute z-10 mt-1 max-h-64 w-full overflow-auto rounded-lg
                       border border-gray-200 bg-white shadow-lg text-black"
          >
            {status === "loading" && (
              <li className="px-3 py-2 text-sm text-gray-500">Searching…</li>
            )}

            {status === "error" && (
              <li className="px-3 py-2 text-sm text-red-600">
                {errorMessage || "Couldn't load results. Try again."}
              </li>
            )}

            {status === "empty" && (
              <li className="px-3 py-2 text-sm text-gray-500">
                No countries match &quot;{debouncedQuery}&quot;
              </li>
            )}

            {status === "success" &&
              results.map((country, index) => (
                <li
                  key={country.code}
                  id={`country-option-${index}`}
                  role="option"
                  aria-selected={index === activeIndex}
                  onMouseDown={(e) => {
                    e.preventDefault(); // keep focus on the input
                    handleSelect(country);
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`flex items-center gap-2 px-3 py-2 text-sm cursor-pointer ${
                    index === activeIndex ? "bg-blue-50" : "hover:bg-gray-50"
                  }`}
                >
                  <img
                    src={country.flag}
                    alt=""
                    className="h-4 w-6 object-cover rounded-sm"
                  />
                  <span>{country.name}</span>
                  <span className="ml-auto text-xs text-gray-400">
                    {country.code}
                  </span>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}
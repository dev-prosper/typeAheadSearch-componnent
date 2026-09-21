import { Country, CountryApiItem } from "../_types";

export async function fetchCountries(
  query: string,
  signal: AbortSignal
): Promise<Country[]> {
    const API_BASE = process.env.NEXT_BASE_URL
  const url = `${API_BASE}/${encodeURIComponent(query)}?fields=name,cca2,flags`;
  const res = await fetch(url, { signal });

  if (res.status === 404) {
    // The API returns 404 when nothing matches. That's an empty result,
    // not an error, so handle it explicitly rather than falling into catch.
    return [];
  }

  if (!res.ok) {
    throw new Error(`Request failed with status ${res.status}`);
  }

  const data: CountryApiItem[] = await res.json();

  return data
    .map((item) => ({
      name: item.name.common,
      code: item.cca2,
      flag: item.flags.svg,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, 10);
}



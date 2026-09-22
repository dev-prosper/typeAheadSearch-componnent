// _helpers.ts
import { Country } from "../_types";

const API_BASE = process.env.NEXT_PUBLIC_RESTCOUNTRIES_BASE_URL;
const API_KEY = process.env.NEXT_PUBLIC_RESTCOUNTRIES_API_KEY;

export async function fetchCountries(
  query: string,
  signal: AbortSignal
): Promise<Country[]> {
  const url = `${API_BASE}?q=${encodeURIComponent(
    query
  )}&response_fields=names,codes,flag`;

  const res = await fetch(url, {
    signal,
    headers: { Authorization: `Bearer ${API_KEY}` },
  });

  const payload = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      payload?.errors?.[0]?.message ||
      `Request failed with status ${res.status}`;
    throw new Error(message);
  }

  const objects: unknown[] = payload?.data?.objects ?? [];

  return objects
    .map((item) => {
      const obj = item as {
        names?: { common?: string };
        codes?: { alpha_2?: string };
        flag?: { url_svg?: string };
      };
      return {
        name: obj?.names?.common ?? "",
        code: obj?.codes?.alpha_2 ?? "",
        flag: obj?.flag?.url_svg ?? "",
      };
    })
    .filter((c) => c.name && c.code)
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, 10) as Country[];
}


import { NextRequest, NextResponse } from "next/server";
import { NormalizedCountry } from "../_types";


export async function GET(request: NextRequest) {
    const API_BASE = process.env.NEXT_BASE_URL
    const apiKey = process.env.RESTCOUNTRIES_API_KEY;

  const query = request.nextUrl.searchParams.get("q")?.trim();

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  if (!apiKey) {
    return NextResponse.json(
      { error: "Server is missing RESTCOUNTRIES_API_KEY" },
      { status: 500 }
    );
  }

  const url = `${API_BASE}?q=${encodeURIComponent(
    query
  )}&response_fields=names,codes,flag`;

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
      next: { revalidate: 60 },
    });
  } catch {
    return NextResponse.json(
      { error: "Could not reach REST Countries" },
      { status: 502 }
    );
  }

  if (!upstream.ok) {
    return NextResponse.json(
      { error: `Upstream request failed with status ${upstream.status}` },
      { status: upstream.status }
    );
  }

  const payload = await upstream.json();
  const objects: unknown[] = payload?.data?.objects ?? [];

  const results: NormalizedCountry[] = objects
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
    .slice(0, 10);

  return NextResponse.json({ results });
}
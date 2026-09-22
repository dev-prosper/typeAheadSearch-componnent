# Country Typeahead

A debounced, keyboard-navigable autocomplete search built with React and Next.js, querying the [REST Countries](https://restcountries.com) API as the user types.

## Features

- **Debounced input** — waits 300ms after the user stops typing before firing a request, so a search doesn't fire on every keystroke.
- **Loading / empty / error / success states** — a single status state machine drives what the dropdown shows, so the UI is never in an ambiguous in-between state.
- **Keyboard navigation** — Up/Down to move through results, Enter to select, Escape to close, built on an ARIA combobox pattern (`role="combobox"`, `aria-activedescendant`, `aria-expanded`) for screen reader support.
- **Stale/out-of-order response handling** — an `AbortController` cancels the previous request whenever a new one starts, and a request-id counter double-checks that only the most recent response is ever applied to state, even if an older request resolves after a newer one.
- **Rich result data** — each match shows the country's flag, code, currency, and bordering countries.

## Setup

```bash
npm install
```

Create a `.env.local` file in the project root:

```
NEXT_PUBLIC_RESTCOUNTRIES_BASE_URL=https://api.restcountries.com/countries/v5
NEXT_PUBLIC_RESTCOUNTRIES_API_KEY=your_key_here
```

Get a free key at [restcountries.com/api-keys](https://restcountries.com/api-keys), then add every domain you'll call the API from (`localhost` for dev, plus your production domain) to that key's CORS allow-list in the same dashboard — REST Countries rejects browser requests from origins not explicitly listed.

Run the dev server:

```bash
npm run dev
```

## Deployment

This project is configured for static export (`output: 'export'` in `next.config.ts`), so it builds to a plain `out/` folder of static HTML/CSS/JS with no Node server required — deployable to any static host, including plain FTP hosting.

```bash
npm run build
```

Upload the contents of `out/` (not the folder itself) to your host's public root. Remember to add that domain to the API key's CORS allow-list before testing in production.

## Tradeoffs

The main design decision was calling REST Countries directly from the browser rather than routing requests through a server-side proxy. This keeps the project fully static and deployable over plain FTP with no backend to run or maintain. The cost is that the API key ships inside the client bundle and is visible to anyone who inspects network requests or view-source. That's an accepted risk for this project, mitigated by a low per-key request cap and CORS origin restrictions on the key itself, but it's not the right default for a credential that's expensive or sensitive to leak — a server-side proxy that holds the key and forwards requests would be the safer choice for that case.

## Scaling and hardening

For meaningful production traffic, the fetch would move behind a server route with the key held server-side, backed by a short cache (in-memory or Redis) keyed on the normalized query, since country searches repeat heavily across users and country data barely changes. That route would also get per-IP rate limiting, with a CDN in front of the static assets. If REST Countries' own uptime or quota became a bottleneck, a locally bundled fallback dataset would cover the gap, since the underlying data changes rarely.

## Testing

- **Unit tests** for the debounce hook and the stale-response guard — the parts most likely to regress silently, where a "working" fix can quietly reintroduce a race condition under fast typing.
- **Integration tests** mocking the fetch layer to verify each status state (`loading`, `empty`, `error`, `success`) renders correctly, including the empty-`borders` case for island nations, which looks identical to a bug if left untested.
- **Interaction tests** with testing-library's `userEvent` covering arrow-key navigation, wraparound at the list boundaries, and selection via keyboard and mouse.
- **One end-to-end test** run under a throttled/slow network to confirm the loading state and request cancellation behave correctly under real latency, not just instant mocked responses.
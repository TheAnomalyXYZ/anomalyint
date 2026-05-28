# Reddit Games Scrapers

A set of Node scripts that drive a headed Chrome (via [`agent-browser`](https://www.npmjs.com/package/agent-browser)) to scrape the Reddit **Games Launchpad** and individual game subreddits. All output JSON lands in [`../reddit-data-logs/`](../reddit-data-logs/); cropped screenshots land in `../reddit-data-logs/screenshots/`.

## Shared mechanics

Every script shares the same plumbing:

- **Headed Chrome, default profile** — `agent-browser open --headed --profile default`. Reddit serves a JS anti-bot challenge to headless/clean sessions, so we run headed and reuse a profile that has cleared the challenge.
- **Navigate via JS, not `open <url>`** — `open <url>` blocks until full page load, and Reddit's challenge keeps the network busy so it never returns. Instead we `open` blank, then `eval "window.location.href='…'"` and poll for content.
- **`ab()` / `abSafe()`** — thin wrappers around `agent-browser`. Every call has a `timeout` because the browser daemon keeps stdout pipes open (a bare `execSync` would hang forever). `abSafe` swallows errors and returns an `[ab error: …]` string so one bad call doesn't kill the run.
- **`jitterWait(base)`** — waits `base + random(0–2000)ms` to avoid throttling-friendly fixed cadences.
- **Shadow-DOM-aware queries** — Reddit nests a lot of content (description, weekly counts) inside web-component shadow roots, so `eval` snippets recurse through `el.shadowRoot` to find elements.

---

## 1. Listing all games — `scrape-reddit-games.mjs`

Captures the full game roster from the Launchpad on [r/GamesOnReddit](https://www.reddit.com/r/GamesOnReddit/), split into the **Popular** and **New** tabs.

### How it works

1. Launch headed Chrome and navigate to `https://www.reddit.com/r/GamesOnReddit/`.
2. Wait for the text `"Games Launchpad"` to render (the carousel is inside an embedded app).
3. **Snapshot the Popular tab.** `agent-browser snapshot -i -c` returns the accessibility tree with element refs. Each game tile shows as a button labelled `Play <Game Name>`.
4. Extract names with a regex over the snapshot: `button "Play (.+?)" [ref=…]` → unique list of game names (`extractGames`).
5. **Switch to the New tab.** Find the `New` button's ref (`findButtonRef`), click it, re-snapshot, and extract again.
6. Write the result.

### Output — `games-launchpad-<timestamp>.json` (+ `games-launchpad-latest.json`)

```json
{
  "source": "https://www.reddit.com/r/GamesOnReddit/",
  "scrapedAt": "2026-05-27T…Z",
  "sections": {
    "popular": { "count": 25, "games": ["Path of Baa: Flocklands", "…"] },
    "new":     { "count": 28, "games": ["Cat Builder", "…"] }
  }
}
```

> Note: this script reads only the **names visible in the snapshot**. It does not resolve subreddit URLs — that's what `scrape-new-tab-urls.mjs` does (it clicks each New tile and records the URL it opens, trimmed down to the subreddit root).

---

## 2. Navigating to each game and grabbing all info — `scrape-reddit-combined-with-screenshot-new.mjs`

Visits every **new-tagged** game subreddit and scrapes weekly metrics, community metadata, and a cropped screenshot of the game tile in a single pass per game.

### Where the game list comes from

It does **not** re-scrape the Launchpad. Instead it pulls the canonical list from the API:

```
GET https://anomalyint.vercel.app/api/reddit-games
```

and filters to games that are both tagged `new` **and** already have a `sub_address`:

```js
(json.games || []).filter(
  (g) => g.sub_address && Array.isArray(g.listings) && g.listings.includes("new")
);
```

> If a new game's `sub_address` is still null in the API, it's skipped here. Run `scrape-new-tab-urls.mjs` first to populate subreddit URLs.

(The non-`-new` variant `scrape-reddit-combined-with-screenshot.mjs` is identical but filters only on `sub_address`, i.e. **every** game.)

### How it works (per game)

1. `eval "window.location.href='<sub_address>'"` to navigate to the subreddit.
2. `jitterWait` to let the page hydrate, then scroll the `[slot="community-details"]` sidebar into view.
3. **One combined `eval` (`readAll`)** pulls, walking shadow roots where needed:
   - `weeklyActiveUsersRaw` — text of `[slot="weekly-active-users-count"]` (e.g. `"24K"`).
   - `weeklyContributionsRaw` — text of `[slot="weekly-contributions-count"]`.
   - `createdIso` — `datetime` attr of the `<time>` inside `[slot="community-details"]`.
   - `createdDisplay` — the human string parsed from "Created Jan 24, 2026".
   - `description` — text of `#description` / `.i18n-subreddit-description`.
   - Raw count strings are normalized by `parseCount` (`"24K"` → `24000`, `"1.2M"` → `1200000`).
4. **Screenshot the game tile (`captureGameTile`):**
   - Find `<devvit2-custom-post>`, center its inner renderer (`devvit-blocks-renderer / iframe / div`) in the viewport.
   - Read the inner element's `getBoundingClientRect` + `devicePixelRatio`.
   - Take a viewport screenshot (`<slug>-<stamp>-full.png`), then crop to the rect with `pngjs` → `<slug>-<stamp>.png`.
5. Append a per-game record to the results array. Failures are caught and recorded with an `error` field rather than aborting the run.

### Output — `games-combined-with-screenshot-new-<timestamp>.json` (+ `…-latest.json`)

```json
{
  "source": "https://anomalyint.vercel.app/api/reddit-games",
  "scrapedAt": "2026-05-27T…Z",
  "count": 28,
  "games": [
    {
      "id": "…",
      "game_name": "Cat Builder",
      "sub_address": "https://www.reddit.com/r/CatBuilder",
      "listings": ["popular", "new"],
      "genre": null,
      "weeklyActiveUsers":   { "raw": "24K",  "value": 24000 },
      "weeklyContributions": { "raw": "1.7K", "value": 1700 },
      "createdIso": "2025-11-05T14:39:01.329Z",
      "createdDisplay": "Nov 5, 2025",
      "description": "…",
      "screenshot": {
        "full": "screenshots/cat-builder-<stamp>-full.png",
        "crop": "screenshots/cat-builder-<stamp>.png",
        "rect": { "x": 475, "y": 382, "w": 700, "h": 512, "dpr": 1 }
      }
    }
  ]
}
```

Screenshot paths are relative to `reddit-data-logs/`.

---

## 3. Loading scraped data into the database

Scraping only produces JSON in `reddit-data-logs/`. Two scripts push that into Supabase. Both read DB credentials from `.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_SERVICE_ROLE_KEY`) and target whatever project those point at — currently the live project, so **these write to prod**.

### `ingest-games.mjs` — metrics + metadata (no screenshots)

Pushes weekly readings and game metadata through the Supabase JS client (proper escaping, no temp SQL, no raw psql).

```bash
node scripts/ingest-games.mjs <scraped.json> [--date YYYY-MM-DD] [--overwrite] [--create-missing] [--dry-run]
```

Per game (matched by `id`, falling back to `game_name`):

- **`tracked_games`**: `description`, `created_date`, `sub_address`, `genre` — **fill-only** (existing non-null values are preserved unless `--overwrite`). Bumps `last_update` when anything changes.
- **`tracked_game_weekly_metrics`**: `users` / `contributions` upserted on `(tracked_game_id, measured_on)`. Re-running for the same day overwrites that day's reading rather than duplicating.

Flags:
- `--date` — `measured_on` for the reading. Default: the JSON's `scrapedAt` date, else today (UTC).
- `--overwrite` — replace metadata even when a value already exists.
- `--create-missing` — insert games that aren't in the DB yet (new `tracked_games` row with `game_name`, `sub_address`, `genre`, `description`, `created_date`, and `listings` from the scrape). Without it, unmatched games are skipped.
- `--dry-run` — print the changes without writing. **Always dry-run first.** Note: metric rows for *newly created* games aren't previewed in dry-run (no id exists yet), so the dry-run metric count can undercount when `--create-missing` would add games.

### `upload-game-screenshots.mjs` — screenshots only

Screenshots can't go straight to the DB — the bytes have to land in R2 first. This script POSTs each `crop`/`full` PNG to the deployed `/api/upload-image` endpoint (prefix `reddit-games/<slug>/screenshots`) and appends the returned public URLs to the game's `screenshots` / `screenshots_full` arrays (deduped).

```bash
node scripts/upload-game-screenshots.mjs <scraped.json>
```

Override the upload target with `UPLOAD_API_BASE` (defaults to `https://anomalyint.vercel.app`).

---

## Full workflow — scrape to DB

```bash
# 1. Refresh the roster (Popular + New names)
node scripts/scrape-reddit-games.mjs

# 2. Resolve subreddit URLs for any new games (must run before the combined scrape)
node scripts/scrape-new-tab-urls.mjs

# 3. Scrape metrics + metadata + screenshots for each game
node scripts/scrape-reddit-combined-with-screenshot-new.mjs

# 4. Preview the DB changes, then apply
node scripts/ingest-games.mjs reddit-data-logs/games-combined-with-screenshot-new-<stamp>.json --dry-run
node scripts/ingest-games.mjs reddit-data-logs/games-combined-with-screenshot-new-<stamp>.json

# 5. Upload the screenshots to R2 + link them
node scripts/upload-game-screenshots.mjs reddit-data-logs/games-combined-with-screenshot-new-<stamp>.json
```

> **New games not yet in the DB**: pass `--create-missing` to insert them as part of the ingest (uses `game_name`, `sub_address`, `genre`, `description`, `created_date`, and `listings` from the scrape). Without the flag, unmatched games are skipped and listed in the summary.

> **Daily cadence:** because metrics key on `measured_on`, run the combined scrape + ingest once per day to build the rolling-7-day history. Multiple runs on the same day overwrite that day's reading.

---

## Daily run — recommended workflow

This is the end-to-end process used to keep the API and dashboard fresh. Run it once per day; it diffs the Launchpad, captures weekly metrics + metadata for every game, screenshots newly listed games, and pushes everything to Supabase + R2.

### 1. Scrape

```bash
node scripts/scrape-reddit-full.mjs
```

In one pass this:
- Reads the Launchpad **Popular** and **New** tabs.
- Diffs against the API → `diff.newGames` (in Launchpad but not yet tracked) and `diff.listingChanges` (popular/new tag changed).
- Resolves a `sub_address` for every brand-new game by clicking its tile and capturing the landing URL.
- Visits every resolvable subreddit and grabs weekly active-users, weekly contributions, created date, and description.
- Takes a cropped tile screenshot for each `isNew` game.
- Writes `reddit-data-logs/reddit-full-<ts>.json` and `reddit-data-logs/reddit-full-latest.json`.

### 2. Ingest metrics + metadata

```bash
node scripts/ingest-games.mjs reddit-data-logs/reddit-full-latest.json --dry-run
node scripts/ingest-games.mjs reddit-data-logs/reddit-full-latest.json --create-missing
```

`--dry-run` first to preview. Then for real with `--create-missing` so any newly discovered games (e.g. Slingblade / Rock Bottom / Clash Knight) get inserted into `tracked_games` rather than skipped. Existing games' metadata is fill-only (won't clobber non-null fields); add `--overwrite` if you do want to replace them.

### 3. Upload screenshots for the newly listed games

```bash
node scripts/upload-game-screenshots.mjs reddit-data-logs/reddit-full-latest.json
```

This script only acts on records that have a `screenshot` object — which (in the `scrape-reddit-full` JSON) means the newly listed games only. Every other game logs `! skip … missing id or screenshot`, which is expected.

> **Gotcha — id backfill for new games.** `scrape-reddit-full.mjs` records `id: null` for games not yet in the API. Ingest creates DB rows and gives them UUIDs, but the JSON on disk still has `null`. The upload script then skips them with "missing id or screenshot". If that happens, fetch the new UUIDs from Supabase by `game_name` and patch the JSON before re-running the upload. The deployed `/api/reddit-games` is too slow/cached for this — go straight to Supabase.

### Other scrapers

Use these for one-off needs; they're not part of the daily run:

```bash
node scripts/scrape-reddit-games.mjs                          # Launchpad name lists only
node scripts/scrape-reddit-combined-with-screenshot-new.mjs   # combined scrape for all new-tagged games
node scripts/scrape-reddit-genres.mjs                         # Browse-tab genre → games map
node scripts/scrape-new-tab-urls.mjs                          # subreddit URLs for New-tab tiles
```

All scrapers launch a visible Chrome window and close the session when done. If a run leaves a stray browser, clear it with `agent-browser close --all`.

## Notes & gotchas

- **Moderators are not scraped.** Reddit only renders the moderators sidebar for logged-in users; an anonymous session never sees it.
- **Order of operations matters.** Newly discovered games may have a null `sub_address` until `scrape-new-tab-urls.mjs` resolves and stores it. Run the URL scraper before the combined scrapers if you want full coverage.
- **`pngjs`** is required for cropping. Install with `npm install pngjs` if missing.

# Beatles Ranker

Build your personal Beatles hit parade by choosing between two songs and saying how much you prefer one. The interface takes its colour and theatrical spirit from *Sgt. Pepper*: warm paper, orange and teal, expressive typography, and a record collection to explore.

## Features

- Rank **213 Beatles songs** from the core collection with six preference buttons, adaptive comparisons, a live chart, undo, skip, and confirmed reset.
- Load either song into one shared **YouTube player**, then press its native play button. Loading or listening never records a vote.
- Explore album covers, ordered track lists, release dates, songwriters, producers, and links to the stories on Beatles Bible.
- Search the full ranking or album library. Enable **Include compilations & live releases** to browse the archive.
- Resume votes and the active comparison through browser storage. The original 25 song IDs remain compatible with existing saves.

Twelve sample comparisons are provided initially. Choose **Start fresh** for your own ranking. Ratings describe relative preferences; the progress bar counts songs involved in completed comparisons.

## Run locally

Requires **Node.js 22.12 or later** and npm.

```sh
npm ci
npm run dev
```

Open Vite’s printed URL, normally **http://127.0.0.1:5173**. Serve the app over HTTP or HTTPS so YouTube receives a browser referrer.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm test` | Run 26 catalog, media, ranking, and persistence tests |
| `npm run typecheck` | Check TypeScript types |
| `npm run build` | Check types and create `dist/` |
| `npm run preview` | Serve the production build |

## Catalog and sources

[src/data/catalog.json](src/data/catalog.json) is the checked-in database, researched on **6 October 2026** from [The Beatles Bible album index](https://www.beatlesbible.com/albums/) and its linked album and song pages.

| Coverage | Included |
| --- | --- |
| Core collection | 12 original UK albums, the *Magical Mystery Tour* LP, and *Past Masters* |
| Ranking | 213 distinct song titles; repeated appearances share an entry |
| Film score | Seven George Martin pieces, browsable and listenable outside the ranking |
| Album library | 35 releases, 870 ordered track appearances, and 35 cover references |
| Video sources | Existing Beatles Bible YouTube embeds for all 220 core song/score entries |

The additional 21 releases preserve archive track titles, speech, take/mix labels, and compilation appearances. They are available for browsing; their individual alternate recordings are not added to the ranking or presented as verified playback matches. Red/Blue track lists follow the expanded 2023 editions. *Love* groups transitions with preceding tracks and includes the listed iTunes bonuses.

Song records contain source links, credits, release information, recording-date excerpts, and video IDs. An embedded video represents the song selected by Beatles Bible and may differ from a particular album mix. Recording excerpts are not exhaustive session histories.

Cover URLs, original image URLs, and available responsive image variants come from the supplied index. Images load remotely and fall back to original vector illustrations if loading fails. Artwork belongs to its respective owners. The database contains factual metadata, not article text or lyrics.

The supplied playlist is retained as a reference. Per the revised request, video IDs come directly from Beatles Bible; **no YouTube Data API key is needed**.

## YouTube integration

The player follows YouTube’s [embed parameters](https://developers.google.com/youtube/player_parameters) and [required player functionality](https://developers.google.com/youtube/terms/required-minimum-functionality): visible native controls and branding, no overlays, a viewport of at least **200 × 200 pixels**, `autoplay=0`, `controls=1`, `playsinline=1`, fullscreen support, and `strict-origin-when-cross-origin` referrer policy.

Switching songs replaces the iframe. Voting, skipping, undoing, resetting, or closing the player removes it and stops playback. YouTube handles playback and availability; **Open on YouTube** and source links remain available when embedding fails. Video IDs are sourced references, not guarantees of current regional availability.

## Development

```text
src/data/             Catalog snapshot, typed adapters, and demo votes
src/components/       Album library, cover/fallback artwork, YouTube player
src/media/            Validated YouTube URL construction
src/ranking/          Rating fitting and adaptive pair selection
src/storage/          Versioned browser persistence and validation
src/App.tsx           Comparison flow and session controls
src/styles.css        Responsive styling
tests/                Node test-runner suites
```

Built with React, TypeScript, Vite, and Lucide icons. DM Sans and Fraunces load through Google Fonts with system fallbacks. Keep catalog IDs stable when correcting metadata. Preserve album positions, edition labels, source URLs, and version notes; run tests and build after catalog changes. Dense ranking histories use a bounded fitting step to maintain stability.

## Verification and limits

All **26 automated tests**, TypeScript checks, and the production build pass. Chrome checks covered song loading/switching, fallback links, player removal, voting, undo, skip, reload persistence, source facts, archive selection, album search, and desktop/390-pixel mobile layouts. Existing saved votes were preserved.

**Live audio playback remains unverified:** YouTube displayed “This video is unavailable” during browser testing, and the console reported blocked YouTube requests. The native unavailable state and fallback links were verified. No app-generated runtime error was observed; third-party player and browser-extension diagnostics were present.

This is a local app with browser-only persistence. It has no accounts, backend, or cross-device sync. Catalog and media references are a dated snapshot, not a live availability service.

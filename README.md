# Today, Oh Boy!

Build your personal Beatles hit parade by choosing between two songs and saying how much you prefer one. The compact masthead keeps the comparison and live chart in focus. Warm paper, vermilion, deep green, gold, and an original floral parade collage take their theatrical spirit from *Sgt. Pepper*. The live chart highlights your number one and stays visible alongside the voting controls on desktop.

A small banner identifies this as a fan project, independent of The Beatles, Apple Corps Ltd., and YouTube, with no affiliation or endorsement.

## Features

- Rank **213 Beatles songs** in a focused comparison view with six evenly weighted preference buttons, adaptive comparisons, a live top five, undo, skip, and confirmed reset.
- Load either song into one shared **YouTube player**, then press its native play button. The player appears when you listen; loading or listening never records a vote.
- Explore album covers, ordered track lists, release dates, songwriters, producers, and links to the stories on Beatles Bible.
- Switch between **Rank songs** and **Record collection**. Search the full ranking to see scores and comparison counts; songs without votes stay unranked. Enable **Include compilations & live releases** in the collection to browse the archive.
- Resume votes and the active comparison through browser storage. The original 25 song IDs remain compatible with existing saves.

Twelve sample comparisons are provided initially. Choose **Start my ranking** for your own ranking. Ratings describe relative preferences; the progress bar counts songs involved in completed comparisons. Song credits and source links are grouped under **About these songs**.

## Run locally

Requires **Node.js 22.12 or later** and npm.

```sh
npm ci
npm run dev
```

Open Vite’s printed URL, normally **http://localhost:5173**. The development and preview servers use `localhost` because YouTube returned “This video is unavailable” from the numeric `127.0.0.1` address during verification, while the same videos played from `localhost`. Serve the app over HTTP or HTTPS so YouTube receives a browser referrer. Browser storage is separate for each hostname; existing votes at `127.0.0.1` remain there.

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

The iframe loads `https://www.youtube.com/embed/<video-id>`, using the code after `/embed/` in the source video URL. The player follows YouTube’s [embed parameters](https://developers.google.com/youtube/player_parameters) and [required player functionality](https://developers.google.com/youtube/terms/required-minimum-functionality): visible native controls and branding, no overlays, a viewport of at least **200 × 200 pixels**, `autoplay=0`, `controls=1`, `playsinline=1`, fullscreen support, and `strict-origin-when-cross-origin` referrer policy.

Switching songs replaces the iframe. Voting, skipping, undoing, resetting, or closing the player removes it and stops playback. YouTube handles playback and availability; **Open on YouTube** and source links remain available when embedding fails. Video IDs are sourced references, not guarantees of current regional availability.

## Development

```text
src/data/             Catalog snapshot, typed adapters, and demo votes
src/components/       Comparison, ranking, album library, artwork, YouTube player
src/media/            Validated YouTube URL construction
src/ranking/          Rating fitting and adaptive pair selection
src/storage/          Versioned browser persistence and validation
src/App.tsx           Comparison flow and session controls
src/styles.css        Responsive styling
tests/                Node test-runner suites
```

Built with React, TypeScript, Vite, and Lucide icons. DM Sans and Fraunces load through Google Fonts with system fallbacks. Keep catalog IDs stable when correcting metadata. Preserve album positions, edition labels, source URLs, and version notes; run tests and build after catalog changes. Dense ranking histories use a bounded fitting step to maintain stability.

The original masthead illustration is [public/art/pepper-parade.webp](public/art/pepper-parade.webp), generated with the built-in imagegen tool and compressed to WebP. Its generation prompt and provenance are recorded in [docs/artwork.md](docs/artwork.md). The site title, description, and floral record favicon use the Today, Oh Boy! identity. The existing browser-storage key remains stable so saved votes carry over.

## Verification and limits

All **26 automated tests**, TypeScript checks, and the production build pass. Chrome checks covered song loading/switching, fallback links, player removal, voting, undo, skip, reload persistence, source facts, archive selection, album search, and desktop/390-pixel mobile layouts. Existing saved votes were preserved.

The Today, Oh Boy! redesign was checked in an isolated Chrome session: all six preference buttons, refresh persistence, undo, skip, reset cancellation and confirmation, full-ranking search, the relocated Listen button, and desktop/390-pixel mobile comparison, chart, and collection layouts. The app console had no runtime errors before loading third-party media; YouTube produced blocked telemetry and permissions-policy messages in the test browser.

**Live playback verified on `localhost`:** “A Day In The Life” and “Penny Lane” loaded and played in Chrome with native YouTube controls. The same “Penny Lane” embed failed from `127.0.0.1`, both with and without player parameters. The development and preview commands now default to the working hostname. This verifies those videos in this browser; availability of other videos and regions still depends on YouTube.

This is a local app with browser-only persistence. It has no accounts, backend, or cross-device sync. Catalog and media references are a dated snapshot, not a live availability service.

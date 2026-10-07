<p align="center">
  <img src="public/art/record-shop.webp" alt="An illustrated record shop surrounded by flowers, a vinyl sun, and colourful psychedelic patterns" width="1100" />
</p>

<h1 align="center">Today, Oh Boy!</h1>

<p align="center"><strong>Your Beatles ranking, one comparison at a time.</strong></p>
<p align="center">213 songs · 35 releases · Progress saved on your device</p>

<p align="center">
  <a href="#quick-start">Quick start</a> ·
  <a href="#how-to-use-it">How to use it</a> ·
  <a href="#artwork">Artwork</a> ·
  <a href="#development">Development</a>
</p>

Choose between two songs, say how much you prefer your favourite, and watch your personal chart take shape. Today, Oh Boy! pairs original album covers with a warm, illustrated record-shop feel inspired by 1960s British pop.

Built with **React, TypeScript, Vite, and plain CSS**. Runs entirely in the browser, with no account or backend setup.

## What you can do

- **Build your chart.** Select the song card you prefer, then choose “Slightly better,” “Better,” or “Much better” in the shared controls between the cards. The selected card and controls share a clear border colour. Adaptive comparisons introduce new songs and help refine close calls.
- **Listen before choosing.** Open either song in the shared YouTube player. Listening never casts a vote.
- **Explore your ranking.** Scroll through your top 12 rated songs or albums, then choose **View more** to search the full list. Switch between **Songs** and **Albums** to see how your choices rate each record. Songs and albums you haven’t compared stay visibly unranked.
- **Name your chart.** Each device gets one of ten Beatles-inspired names. Use the pencil beside the title to change it; save with Enter or **Save name**, and cancel with Escape or **Cancel**. Names survive refresh and reset and are included in published snapshots.
- **Browse the records.** Explore original album covers, ordered track lists, release details, credits, and links to Beatles Bible. Include compilations and live releases to browse the wider archive.
- **Pick up where you left off.** Votes and the current pair survive a refresh. Undo a vote, skip a pair, or start again with a confirmed reset.
- **Publish and share your progress.** Open **Community**, add an optional name and one note, and publish a snapshot of your chart. Copy its link or use your device’s share menu.

## Quick start

Requires **Node.js 22.12 or later** and **npm**. From the project directory:

```sh
npm ci
npm run dev
```

Open the URL printed by Vite, usually **http://localhost:5173**. No API keys or environment variables are required.

Use `localhost` for local playback: YouTube embeds were verified there, while the numeric `127.0.0.1` address failed in the test browser. Progress is stored separately for each origin, so changing the hostname or port gives you a different save.

To check the production build locally:

```sh
npm run build
npm run preview
```

The static production files are written to `dist/`. Serve them over HTTP or HTTPS rather than opening `index.html` directly.

## How to use it

1. **Start your own chart.** A fresh browser opens with 12 sample votes. Choose **Start my ranking** to clear the sample and begin.
2. **Compare the pair.** Select your favourite song card, then choose how much you prefer it using the three shared buttons. Selecting a card prepares your choice; pressing a strength button casts the vote. Use **Listen**, then press play in the YouTube player if you need a reminder. Listening does not select a favourite.
3. **Keep going at your own pace.** Each vote updates the chart immediately. **Skip** leaves your ranking unchanged; **Undo** removes your latest vote.
4. **Explore.** The chart shows up to 12 rated entries in a scrollable list. Choose **View more** to search all songs or albums and inspect scores, or switch to **Record collection** to browse albums.

The progress bar counts songs involved in completed comparisons. It measures coverage, rather than confidence in your ranking. You can stop whenever the chart feels useful.

### Your progress

Comparison history is saved in this browser’s `localStorage`. There are no accounts or cross-device sync. Clearing site data removes your save; **Reset progress** also clears it after confirmation. If storage cannot be read or written, the app displays a notice.

### Community and sharing

The initial Community section stores published charts on this device. Each post contains an optional note (up to 500 characters), a display name, the ordered list of compared songs, and the vote and coverage counts at publication. Start your own chart and cast at least one vote before publishing; the sample chart cannot be published. Later votes, undo, and **Reset progress** leave published snapshots intact.

**Share ranking** uses the native share menu when available, otherwise copies a link. **Copy link** always copies the link, with a selectable field if clipboard access fails. Opening a link displays the complete snapshot and note without replacing the recipient’s progress. Links contain the snapshot in the URL fragment, so no backend is required; they remain readable independently of the publisher’s browser storage. A locally hosted link is only reachable on that computer. Serve the app at a public URL to share it with other people.

There is no shared online feed, authentication, or verified identity yet. To add those later, implement the async `CommunityRepository` interface in [src/community/repository.ts](src/community/repository.ts) and replace its exported adapter. The UI already awaits `list()` and `publish()` and handles loading and failure. A backend should assign the authenticated author from its session and validate posts on the server. The [local adapter](src/storage/community.ts) keeps versioned community data separate from ranking history, validates existing saves before writing, and leaves unreadable data untouched. [Snapshot types and validation](src/community/posts.ts) and [share-link encoding](src/community/sharing.ts) are independent of React.

## How ranking works

The ranking uses a **Bradley–Terry-style logistic model**. Preference strength sets the model’s target probability for the chosen song:

| Your choice | Target probability |
| --- | --- |
| Slightly better | 0.65 |
| Better | 0.80 |
| Much better | 0.95 |

Ratings are fitted again from the complete comparison history after each vote or undo. History is the source of truth; scores are derived, relative values rather than points awarded for a win.

The fitter uses damped Newton steps and a convergence check, so histories dominated by one anchor song receive the same mathematical fit as dense comparisons. Early charts remain provisional: incomplete or disconnected evidence cannot establish a reliable global order, and inconsistent choices are balanced by the model. Changing the fitter can adjust scores in existing saves; the original votes and active comparison remain intact.

The pair selector excludes answered pairs and introduces unseen songs from a window of the next five songs in a researched familiarity order. Once there are votes, it connects new songs to compared anchors, then favours nearby ratings and songs with fewer comparisons. If skips block every anchor connection in the introduction window, it looks farther down the catalog for an available anchor connection. Skipped pairs are set aside for the session and can be revisited. Early rankings are provisional, especially while much of the catalog is still unseen.

The [50-song introduction order](src/data/familiarity.ts), researched **7 October 2026**, starts with the [Official Charts UK streaming Top 40 (2023)](https://www.officialcharts.com/chart-news/the-official-top-40-most-streamed-the-beatles-songs-in-the-uk-revealed/) and adds ten other favourites from [Kworb’s Spotify track-stream table, updated 5 October 2026](https://kworb.net/spotify/artist/3WrFJ7ztbogyGnTHbHJFl2_songs.html). Streaming popularity is a practical proxy for recognition, not an objective measure of fame. This is a curated, static introduction list, not a live global popularity chart. Mixes of the same song map to the existing stable song ID. Familiarity controls suggestions and the unranked list only; all personal ratings still start at zero and come entirely from votes.

### Album rankings

The **Albums** switch ranks the 14 core releases, including *Magical Mystery Tour* and *Past Masters*. Compared songs receive a chart-position score from 100 for the highest to 0 for the lowest; tied songs share their average position. An album’s score is the mean of these scores for its compared tracks. Uncompared tracks contribute no score, repeated appearances within a record count once, and George Martin score pieces are excluded. A song appearing on two core records contributes to both. This averages track positions rather than totals, so longer albums do not get an automatic advantage.

Each row shows **compared / total songs**, with incomplete albums labelled **Provisional**. Albums with no compared tracks are unranked. Scores update from the same comparison history after every vote, undo, or reset; no separate album votes or stored album scores are needed.

Implementation: [ranking model and pair selector](src/ranking/model.ts) · [progress validation and persistence](src/storage/progress.ts).

## Catalog and playback

The checked-in [catalog](src/data/catalog.json) is a snapshot researched on **6 October 2026**, with source links to [The Beatles Bible](https://www.beatlesbible.com/albums/).

| Collection | Contents |
| --- | --- |
| Ranked songs | 213 distinct song titles; repeated album appearances share one entry |
| Core records | 12 original UK albums, the *Magical Mystery Tour* LP, and *Past Masters* |
| Wider archive | 21 additional releases, for 35 releases and 870 track appearances overall |
| Film score | Seven George Martin pieces available in the collection, outside the song ranking |

Archive listings preserve alternate takes, mixes, live performances, and speech. These appearances do not become separate ranked songs. Red/Blue track lists use the expanded 2023 editions; *Love* groups transitions with preceding tracks and includes the listed iTunes bonuses.

The [7 October catalog and ranking audit](docs/ranking-audit.md) checks the 14 core track lists and all 220 primary song/score designations. Primary albums follow the canonical core collection: non-album singles use *Past Masters*, and 1967 singles included on the eleven-track *Magical Mystery Tour* LP use that record. Song cards show the song’s first release year; the record collection shows each album’s release year.

YouTube video IDs come from embeds on Beatles Bible’s song pages. The player keeps native controls, starts only when you press play, and stops when you switch songs, close it, or change the comparison. **Open on YouTube** provides a fallback when an embed cannot play. Videos may differ from a particular album mix, and availability depends on YouTube and your region.

Album covers, Google Fonts, and YouTube media load from external services. Catalog facts and your ranking work from the local snapshot; this is not a fully offline app or a live catalog service.

## Artwork

The record-shop banner above is original AI-generated artwork used in the app’s masthead. The six decorative sleeve illustrations are also preserved as standalone SVGs:

<p align="center">
  <a href="public/art/illustrated-sleeves/pepper.svg"><img src="public/art/illustrated-sleeves/pepper.svg" alt="Botanical mandala sleeve illustration" width="120" /></a>
  <a href="public/art/illustrated-sleeves/strawberry.svg"><img src="public/art/illustrated-sleeves/strawberry.svg" alt="Strawberry garden sleeve illustration" width="120" /></a>
  <a href="public/art/illustrated-sleeves/sun.svg"><img src="public/art/illustrated-sleeves/sun.svg" alt="Sunburst sleeve illustration" width="120" /></a>
  <a href="public/art/illustrated-sleeves/road.svg"><img src="public/art/illustrated-sleeves/road.svg" alt="Woodland sleeve illustration" width="120" /></a>
  <a href="public/art/illustrated-sleeves/rubber.svg"><img src="public/art/illustrated-sleeves/rubber.svg" alt="Green floral sleeve illustration" width="120" /></a>
  <a href="public/art/illustrated-sleeves/revolver.svg"><img src="public/art/illustrated-sleeves/revolver.svg" alt="Swirling floral sleeve illustration" width="120" /></a>
</p>

**Original album covers remain on the song cards, ranking, and record collection.** The decorative illustrations provide a fallback when a cover fails to load. Generation prompts, asset details, and provenance are documented in [docs/artwork.md](docs/artwork.md).

<details>
<summary>Earlier masthead artwork, preserved in the project</summary>

<p><img src="public/art/pepper-parade.webp" alt="An original vintage-style illustration of flowers, brass instruments, and a small marching band" width="1100" /></p>

This earlier generated illustration is retained at <a href="public/art/pepper-parade.webp">public/art/pepper-parade.webp</a> and is not used by the current interface.

</details>

## Development

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server on `localhost` |
| `npm test` | Compile test modules and run the Node test suites |
| `npm run typecheck` | Check TypeScript without emitting files |
| `npm run build` | Check types and produce `dist/` |
| `npm run preview` | Serve the production build on `localhost` |

```text
src/
  community/        Ranking snapshots, share links, and repository interface
  components/       Comparison, ranking, collection, artwork, and player
  data/             Catalog snapshot, typed adapters, and demo votes
  media/            YouTube URL validation and construction
  ranking/          Pure rating calculations and pair selection
  storage/          Versioned persistence and saved-data validation
  App.tsx           App flow, views, and session controls
  styles.css        Responsive layout and styling
public/art/         Generated mastheads and saved sleeve illustrations
docs/artwork.md     Artwork prompts and provenance
tests/              Catalog, media, ranking, and persistence suites
scripts/test.cjs    Node test-runner entry point
```

Keep song IDs stable so existing saves remain compatible. Preserve track order, edition labels, and source references when changing the catalog. Keep ranking logic independent of React and browser storage access inside the storage adapter.

Before submitting a change, run:

```sh
npm test
npm run typecheck
npm run build
```

The tests cover preference direction and strength, transitivity, deterministic fitting, pair selection and exhaustion, persistence replay, undo, invalid saves, catalog integrity, media URLs, community persistence, snapshot order, Unicode share links, and malformed links. New community tests are colocated as `*.test.ts` and discovered after compilation by the Node runner. For interaction changes, also check all three preference strengths for both song selections, keyboard selection, listening, refresh, undo, skip, reset, publishing, and sharing in a browser, including a narrow viewport.

## Credits and notice

Catalog facts, cover references, and video references come from [The Beatles Bible](https://www.beatlesbible.com/albums/). Album artwork belongs to its respective owners. The snapshot contains factual metadata, not lyrics or article text. Interface icons use Lucide; typography uses DM Sans and Fraunces with system fallbacks.

**Fan project · Not affiliated with or endorsed by The Beatles, Apple Corps Ltd., or YouTube.**

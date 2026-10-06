# Deployment readiness review

Reviewed 6 October 2026, initially against commit `0cd9689`, then against the working tree including community-sharing additions that appeared during the review. Those additions were inspected and the automated checks rerun. The application edits are concurrent work, not changes made by this review.

**Verdict: technically deployable as a static app; not yet cleared for a public launch in its current form.** The ranking product is feasible, the build works, and the main interactions pass browser checks. Resolve artwork rights, embedded-player policy/privacy requirements, dependency updates, and license notices before launching publicly. This review does not publish the app or change its implementation.

The legal assessment assumes a free fan site operated from the United States. Operator jurisdiction, intended audience, monetization, written permissions, and the final hosting configuration have not been supplied. Those can change the assessment. This is a source-backed risk review, not a legal clearance opinion.

## Verified results

| Check | Result |
| --- | --- |
| `npm test` | 35 tests passed in the updated working tree; ranking, pair selection, persistence, catalog joins, media URLs, snapshots, and sharing |
| TypeScript | Passed through `npm run build`, which invokes `npm run typecheck` |
| Production build | Passed; `dist/` approximately 1.5 MB including artwork |
| JavaScript bundle | Updated build: 488.38 kB, 107.78 kB gzip reported by Vite |
| Full dependency audit | 9 affected packages: 7 high, 1 moderate, 1 low |
| Production dependency audit | `npm audit --omit=dev` reported zero known vulnerabilities |
| Browser comparison flow | All six preference controls, ranking updates, undo, skip, reload, active-pair restoration, and reset cancellation/confirmation passed |
| Rapid clicks | Double-clicking a preference created one vote |
| Search and collection | Song search passed; collection displayed 14 core releases and 35 with archive enabled; album search passed |
| Community additions | Local test snapshot publication, reload persistence, copy-link generation, and rendering the generated shared link passed |
| YouTube | One official video, “A Day In The Life,” loaded without autoplay and played after an explicit click; closing removed the iframe |
| Responsive layout | At 390 × 844, ranking and updated community page widths remained 390 px; preference buttons were 46 px tall |
| Browser console | No captured errors or warnings in the tested flow |

Browser testing used a fresh local production-preview session, not an existing user ranking. The original comparison flow was tested first; the rebuilt community additions were then tested separately. It does not establish playback availability for all 220 catalog video references, all countries, or every browser. No deployed HTTPS origin, hosting headers, clean CI install, mobile-device performance, or externally sent ranking was tested.

## Findings and recommended actions

### 1. Album artwork rights are undocumented — resolve before public launch

All 35 album-cover references point to Beatles Bible. `src/components/AlbumArt.tsx:7` displays them directly, with responsive variants that can include full-size originals; `src/data/catalog.json:3762` is an example. The repository contains source credits but no permission/license evidence for these covers or agreement to use the source site's image hosting.

The source explicitly reserves rights in its writing and attributes images to their respective owners. Its use of an image does not establish permission for this app. [Beatles Bible's ownership notice](https://www.beatlesbible.com/about/).

U.S. fair use requires a fact-specific assessment. Noncommercial use and attribution do not automatically establish fair use, and hotlinking is not evidence of a license. I cannot conclude that these covers are either authorized or categorically unlawful from the repository alone. [U.S. Copyright Office fair-use guidance](https://www.copyright.gov/fair-use/).

**Action:** use the existing original sleeve illustrations as the normal artwork, or document appropriate rights/permission for each cover and its delivery. If retaining unlicensed covers based on fair use, obtain a legal assessment of this actual presentation. Permission from a source host alone may not cover the underlying artwork. Add a contact route for rights complaints.

### 2. YouTube terms and privacy disclosures are missing — resolve before public launch

`src/media/youtube.ts:7` uses a standard `youtube.com` iframe. The implementation has good properties: native controls, no autoplay, no audio extraction, explicit listening, a watch-page fallback, and an iframe referrer policy. However, neither the UI nor repository supplies a privacy policy, site terms referencing YouTube's terms, or links to Google's privacy policy. The fan-project banner is not a replacement for these.

YouTube's embedding guidance says that its API terms and developer policies apply to the embedded player. The developer policies require terms/privacy disclosures and acceptance, even though this app does not request a Data API key or YouTube account access. [YouTube embedding guidance](https://support.google.com/youtube/answer/171780), [developer policies, section III.A](https://developers.google.com/youtube/terms/developer-policies).

Google Fonts loads when the page opens (`index.html:9–11`); cover requests go to Beatles Bible; the YouTube iframe loads after Listen. Accordingly, local-only vote storage does not mean that visitors make no third-party requests. A privacy notice should explain local progress, deletion, hosting logs, and these third parties.

**Action:** add accessible privacy/terms pages and an appropriate acceptance flow for embedded playback. Consider self-hosting licensed font files and using YouTube's privacy-enhanced domain. That mode reduces personalization; it is not an automatic guarantee of legal compliance. If UK/EU requirements apply, assess the actual storage/tracking behavior and obtain informed consent for non-exempt purposes before loading them. A generic Listen button currently provides no explanation of those purposes. [YouTube privacy-enhanced mode](https://support.google.com/youtube/answer/171780), [ICO guidance on feature-led consent](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/how-do-we-manage-consent-in-practice/).

Do not introduce a blanket cookie banner solely because progress uses localStorage. Assess its purpose and applicable exceptions separately from third-party playback. [ICO guidance on web storage](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/what-are-storage-and-access-technologies/).

### 3. Build/development dependencies have known vulnerabilities — update before release

The live npm audit reported these affected packages:

| Severity | Packages |
| --- | --- |
| High | Vite, Rollup, PostCSS, Browserslist, nanoid, picomatch, source-map-js |
| Moderate | baseline-browser-mapping |
| Low | @babel/core |

All are in the development/build dependency tree. The production-only audit was clean. This distinction matters: deploying static `dist/` does not deploy a Vite development server, so the audit is not proof of seven remotely exploitable flaws in the public static site. Build systems and developer machines still deserve patched dependencies. npm reported fixes available for all affected packages.

**Action:** update the affected lockfile dependencies, inspect changes, and rerun tests/typecheck/build and the browser smoke check. Do not expose Vite's development or preview server as the production service. Representative audit references: [Vite development-server advisory](https://github.com/advisories/GHSA-p9ff-h696-f583), [Rollup advisory](https://github.com/advisories/GHSA-mw96-cpmx-2vgc).

### 4. Distributed third-party license text is incomplete — add release notices

The installed React/React DOM/scheduler MIT licenses and Lucide ISC/Feather MIT license permit this use but require preservation of copyright and permission notices. The built JavaScript retains short license comments; React's comments refer to a LICENSE file that is not shipped in `dist/`. There is no release third-party-notices file containing the complete applicable permission text.

**Action:** distribute the required notices with the static output, covering bundled runtime packages and any self-hosted fonts. The authoritative texts inspected are the installed packages' LICENSE files. An open-source license for the app's own code is a separate choice and is not a prerequisite for deploying a private-code website.

### 5. Fresh pair selection has an alphabetical bias — fix for beta quality

`src/ranking/model.ts:77` selects only the first eight candidates among equally scored pairs. With no votes, every pair ties and the stable sort retains generation order. Across 100 deterministic sampled fresh selections, every pair included “A Day In The Life,” with only eight possible partners. This contradicts the plan's initial selection of two random songs.

**Action:** sample uniformly from eligible pairs when history is empty, or randomize ties before candidate truncation. Add a behavior test demonstrating that a fixed song is not forced into every first pair. The existing injected randomness makes this straightforward.

### 6. Large histories block the interaction thread — practical beta limitation

Answering calls `selectPair`, which fits the full history; React then fits it again for the ranking (`src/App.tsx`, `src/ranking/model.ts:58`). Both operations are synchronous. These are single-run synthetic benchmarks on this machine under Node v24.21.0, excluding React rendering and storage:

| Saved votes | Rating fit + pair selection |
| --- | ---: |
| 100 | 27 ms |
| 1,000 | 66 ms |
| 5,000 | 305 ms |
| 22,578, every pair | 919 ms |

These are not phone/browser latency measurements. Slower devices may pause longer. A full synthetic save was approximately 2.08 MB before browser storage accounting; storage limits vary. Small histories are practical, and the app visibly reports save failures.

**Action:** compute ratings once per transition and pass them to selection. For long-session support, benchmark target phones and consider a worker or more efficient fitting while preserving deterministic replay. Export/import of full comparison history and cross-tab conflict handling would improve durability; neither currently exists. Shared ranking snapshots are not a restorable comparison-history backup.

### 7. Community sharing is local and its links are irrevocable snapshots — document its limits

The new `src/community/repository.ts` selects a localStorage adapter. “Publish” saves a chart on the current device; it does not put it in a central public feed. This is disclosed in the UI. There is no server, authentication, or community discovery service. If an actual shared community feed is a launch requirement, that feature is not implemented.

`src/community/sharing.ts` encodes the author name, note, timestamp, counts, and song order directly in a base64url URL fragment. This is encoding, not encryption. Anyone holding the link can read, copy, or alter it. The sender cannot revoke distributed copies, and the displayed author is not an authenticated identity. URL fragments are not part of normal HTTP requests, but are accessible to the page and can remain in browser history or forwarded links. These observations follow directly from the local code; this is not a claim of a server data leak.

The payload is length-bounded and validated, and text renders through React rather than HTML insertion. Those are useful protections. There is no UI for deleting saved chart posts, and resetting comparison progress leaves the separate community store intact.

**Action:** explain precisely what a shared link contains and that recipients can retain it; include posts in the privacy/deletion instructions and offer local post deletion. Keep author claims unverified unless identity is added. Test maximum-length links on the intended sharing platforms. A real public feed would need server persistence, access control, abuse reporting/moderation, and a separate privacy/security review.

## Legal context beyond the blockers

The local metadata consists primarily of song/album titles, dates, credits, and track lists; there are no hosted music files or song lyrics in the app. U.S. copyright generally does not protect facts, titles, or short phrases, although expressive writing/artwork remains protected. The current metadata is consequently lower risk than the covers. This is not worldwide clearance of a copied database or its selection/arrangement. [U.S. Copyright Office explanation](https://www.copyright.gov/help/faq/faq-protect.html).

The current branding includes a prominent independent-fan notice, an original illustrated masthead, and no reproduced Beatles wordmark. These reduce endorsement confusion but do not decide trademark rights. Use The Beatles descriptively, avoid implying an official service, and conduct name/domain clearance before investing in a commercial brand. The short title “Today, Oh Boy!” does not by itself establish a copyright problem under the cited U.S. guidance; trademark questions remain separate. [USPTO explanation of confusion](https://www.uspto.gov/trademarks/search/likelihood-confusion).

The artwork documentation records AI generation prompts, which helps provenance; it does not certify originality or exclusive copyright ownership. Inspect actual assets and retain provenance. The unused older masthead is still included in the build because it resides in `public/`.

## Feasibility and deployment path

This is a practical hobby/fan product. The current local ranking and URL-snapshot sharing need static hosting and HTTPS, not accounts, a database, server compute, or secret API keys. User count does not increase ranking-engine work on the host because calculations run in each browser. Storage remains tied to the exact origin and browser; it does not support cross-device recovery or a shared community feed.

The 213-song catalog contains 22,578 possible pairs. Introducing every song into one connected comparison graph requires at least 212 answers. At an assumed ten seconds per answer, that alone is about 35 minutes; all pairs would take about 63 hours. These are illustrative arithmetic, not observed user behavior. Completion should remain optional, and smaller selectable catalogs could reduce initial effort. No demand, retention, or monetization feasibility has been established by code/tests.

Build with Node 22.12+ using the checked-in lockfile, then publish `dist/` through a static host. The current absolute asset paths assume deployment at the domain root; subdirectory hosting needs coordinated Vite base and asset-path changes. `vite preview` is for local verification. [Vite static deployment guidance](https://vite.dev/guide/static-deploy).

Before launch:

- [ ] Resolve cover rights or switch to original illustrations.
- [ ] Implement the required YouTube terms/privacy disclosures and appropriate acceptance/consent behavior.
- [ ] Patch vulnerable development/build dependencies; rerun release checks.
- [ ] Ship complete applicable third-party license notices.
- [ ] Correct initial pair selection and check realistic long-session performance.
- [ ] Document snapshot-link privacy and retention; add local post deletion. Confirm whether a central community feed is required before describing that feature as complete.
- [ ] Configure HTTPS, caching, rollback, and host security headers. Test CSP with fonts, cover hosts, and player frames; preserve the YouTube-compatible referrer policy.
- [ ] Run a fresh-install CI build and repeat smoke tests on the final HTTPS hostname, a target phone, and representative browsers. Check several official video sources and regional failures; retain the external fallback.
- [ ] Make the contact/privacy information visible in the app and keep deployment documentation current. PLAN.md and AGENTS.md still describe an empty planning-only repository, although the app now exists.

**Decision:** a private preview is supported by the current technical checks. A public beta is feasible after the above release work. A commercial or globally targeted launch needs a jurisdiction-specific rights/privacy review in addition to engineering fixes.

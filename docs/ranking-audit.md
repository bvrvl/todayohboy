# Ranking and album audit

Audited 7 October 2026.

## Ranking findings and corrections

The existing Bradley–Terry-style soft-target model is appropriate for relative preferences: direction, strength, transitive evidence, undo, and saved-history replay all passed. A full-catalog stress check exposed premature stopping in the old fixed 240-pass gradient fitter. For a history where 212 songs are compared to one anchor, the maximum absolute objective gradient remained about 0.122; the model had not reached its optimum and preference gaps were compressed.

The same objective and regularization now use damped Newton fitting with a conjugate-gradient Hessian solve and a maximum absolute gradient target of `1e-8`. Tests independently check the single-pair optimum, full-catalog anchor histories, all 22,578 distinct pairs, contradictory cycles, and invariance to history/catalog order. The anchor case now has a residual below `1e-7`, and the complete-pair case also passes that threshold. Scores remain finite and deterministic. No popularity priors were added and no saved votes were changed.

Pair selection now looks outside the current familiarity window if skips block all its anchor connections, keeping new songs connected to existing evidence whenever possible. Comparisons outside a requested catalog no longer falsely mark its songs as compared.

Album scores still average compared tracks’ chart-position percentiles. Tests verify equal-score ties, exclusion of unseen tracks and orchestral score pieces, deduplication within a record, equal track weighting, and updates after voting, undo, and replay.

Early scores remain provisional. Disconnected histories do not identify ordering between their components, and a record with one rated track does not yet represent a whole-album preference. The comparison-count uncertainty heuristic measures exposure, not calibrated confidence.

## Verification

All 59 automated tests, TypeScript checks, and the production build pass. Browser checks in a separate local test session covered all six direction/strength choices, refresh persistence, undo, skip, reset cancellation and completion, the scrollable default chart, full song/album expansion, search, and collapse. The default song chart contained exactly 12 of the sample’s 14 rated songs; album charts use the same 12-entry limit and show fewer when fewer records have been rated.

## Catalog verification

All 220 primary designations (213 ranked songs and seven George Martin score pieces) point to a core record containing that entry. They follow the earliest containing record in the checked canonical core collection. All 226 core track appearances match the published lists below in content and order, allowing punctuation and remaster/version-label differences. No primary-album reassignment was needed.

| Core record | Tracks | Verification source |
| --- | ---: | --- |
| Please Please Me | 14 | [Official album page](https://www.thebeatles.com/please-please-me), linked Spotify listing |
| With The Beatles | 14 | [Official album page](https://www.thebeatles.com/beatles), linked Spotify listing |
| A Hard Day’s Night | 13 | [Official album page](https://www.thebeatles.com/hard-days-night-0), linked Spotify listing |
| Beatles For Sale | 14 | [Official album page](https://www.thebeatles.com/beatles-sale), linked Spotify listing |
| Help! | 14 | [Official album page](https://www.thebeatles.com/help-0), linked Spotify listing |
| Rubber Soul | 14 | [Official album page](https://www.thebeatles.com/rubber-soul), linked Spotify listing |
| Revolver | 14 | [Official album page](https://www.thebeatles.com/revolver), linked Spotify listing |
| Sgt. Pepper’s Lonely Hearts Club Band | 13 | [Official album page](https://www.thebeatles.com/sgt-peppers-lonely-hearts-club-band-0), linked Spotify listing |
| Magical Mystery Tour | 11 | [Official store’s LP track list](https://usastore.thebeatles.com/products/magical-mystery-tour-lp-remastered) |
| The Beatles (White Album) | 30 | [Official album page](https://www.thebeatles.com/beatles-0), linked Spotify listing |
| Yellow Submarine | 13 | [Official album page](https://www.thebeatles.com/yellow-submarine), linked Spotify listing |
| Abbey Road | 17 | [Official album page](https://www.thebeatles.com/abbey-road), linked Spotify listing |
| Let It Be | 12 | [Official store’s original-album track list](https://usastore.thebeatles.com/products/let-it-be-cd) |
| Past Masters | 33 | [Official store’s track list](https://usastore.thebeatles.com/products/past-masters-volumes-1-2-2cd) |

*Past Masters* is a 1988 compilation containing earlier singles and EP tracks. Songs such as “Hey Jude” correctly belong there within this core collection; the designation does not mean they were first released in 1988. *Magical Mystery Tour* uses the eleven-track US LP, not the six-song UK EP. “Yellow Submarine” is primarily assigned to *Revolver*, and “All You Need Is Love” to *Magical Mystery Tour*, while both also contribute to the *Yellow Submarine* album score. Album/single versions of “Get Back”, “Let It Be”, “Love Me Do”, and “Across The Universe” retain one ranking ID but distinct track-appearance metadata.

The song cards previously displayed the primary album’s year, producing misleading dates for compilations. They now show the song’s first-release year. “Bad Boy” uses 1965, its US debut, rather than its later UK release year; both dates remain in its sourced release details. [Release reference](https://www.beatlesbible.com/songs/bad-boy/).

This audit covers core song designations and core track lists, not a new verification of every alternate mix or appearance across the 21 archive releases.

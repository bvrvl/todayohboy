# Beatles Ranker

Discover your personal Beatles song ranking through repeated, adaptive comparisons. Choose which of two songs you prefer—and whether it is **slightly better**, **better**, or **much better**—to refine your ranking over time.

## Project status

This project is in the planning stage. The repository contains the MVP plan and contributor guidelines; application code, dependencies, and build scripts have not been added yet.

See [PLAN.md](PLAN.md) for the detailed requirements, proposed architecture, implementation checklist, and acceptance checks.

## Planned MVP

- Compare approximately 25 well-known Beatles songs using six preference buttons.
- Adapt the next comparison to introduce unseen songs and refine close rankings.
- View an updated ranking, song comparison counts, and coverage progress.
- Save progress locally and resume after refreshing the page.
- Undo the latest answer, skip a pair, or reset progress with confirmation.

The initial release focuses on the ranking engine and comparison experience. Streaming integrations, artwork, accounts, sharing, and backend services are deferred.

## Technical direction

The planned stack is **React + TypeScript + Vite**, with plain CSS and Vitest for automated tests.

Ranking calculations and pair selection will live in pure TypeScript modules. Comparison history will be the source of truth, with ratings recalculated from that history. A separate storage adapter will handle versioned `localStorage` persistence and validation.

## Getting started

There is no runnable app or dependency installation step yet. Development, test, type-check, and production-build commands will be documented here once the app is scaffolded.

For now, review the [MVP plan](PLAN.md) and [repository guidelines](AGENTS.md) before contributing.

## Verification plan

Automated tests will cover ranking direction, preference strength, transitivity, pair exclusion, persistence replay, undo, and selection edge cases. Delivery will also include TypeScript checks, a production build, and browser verification of the full comparison and persistence flow.

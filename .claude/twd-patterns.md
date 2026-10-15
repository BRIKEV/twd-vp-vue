# TWD Project Patterns

## Project Configuration

- **Framework**: Vue 3 (vue-router, Vite+ toolchain)
- **Vite base path**: /
- **Dev server port**: 5173
- **App URL**: http://localhost:5173
- **Dev command**: pnpm dev
- **Default branch**: main
- **Entry point**: src/main.ts
- **Public folder**: public/
- **Type-check command**: pnpm run type-check
- **Test lint**: twd-lint rules in `vp lint` (oxlint jsPlugin, `vite.config.ts`)
- **Closing run**: full suite

### Runner Commands

twd-cli drives its own headless browser — only the dev server has to be up (`pnpm dev`).

```bash
# Run all tests
pnpm run test:ci

# Run specific tests by name (matches "suite > test", case-insensitive; repeatable)
pnpm exec twd-cli run --test "should render the list"
pnpm exec twd-cli run --test "should create" --test "should show the error"

# Only the tests this branch added or changed
pnpm exec twd-cli run --changed-since main

# Record a run to video (one clip per matched test, needs ffmpeg)
pnpm exec twd-cli run --record --test "should render the list"

# Lint, applying the safe fixes (twd-lint rules run inside vp lint; no dev server needed)
vp lint --fix src
```

Every run writes `.twd/report/`: `run.json` (the result), `summary.md` and `index.html`. The folder is replaced on each run.

## Standard Imports

```typescript
import { twd, userEvent, screenDom, expect } from 'twd-js'
import { describe, it, beforeEach, afterEach } from 'twd-js/runner'
// Project-specific imports go here (added by user)
```

## Visit Paths

```typescript
await twd.visit('/')
await twd.visit('/about')
```

## Standard beforeEach / afterEach

```typescript
import { useCounterStore } from '@/stores/counter'

beforeEach(() => {
  twd.clearRequestMockRules()
  twd.clearComponentMocks()
  useCounterStore().$reset()
})

afterEach(() => {
  twd.clearRequestMockRules()
})
```

## Client State (Pinia)

Stores are setup stores, so Pinia's built-in `$reset()` is not available — each store
exposes its own `$reset()` that restores its initial state. When adding a new store,
add a `$reset()` to it and call it in `beforeEach`.

## Portals and Dialogs

Use `screenDomGlobal` instead of `screenDom` for elements rendered in portals (modals, dropdowns, tooltips):

```typescript
import { screenDomGlobal } from 'twd-js'
const modal = await screenDomGlobal.findByRole('dialog')
```

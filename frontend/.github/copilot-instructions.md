# Copilot instructions for PowerScripture 🚀

Purpose: give AI coding agents the quick context needed to be productive in this Angular frontend repo.

## Big picture 🔧
- Single Page Application built with Angular (v20.x) & TypeScript (~5.9).
- Top-level structure: `AppComponent` (global events), `WorkbenchComponent` (central UI), `BibleThemeTreeComponent` (jsTree-based theme/citation tree), and feature groups under `src/app/workbench` (search/create/edit/delete/import).
- Data flows: UI components call `BibleService` (uses fetch() to a REST API) at `ROOT_URL` (default `http://localhost:8080/`) for CRUD operations and tree loading.
- UI library & integration points: `jQuery` + `jsTree` are used extensively; many UI behaviors are done via direct DOM manipulation and jQuery events rather than Angular inputs/outputs.

## Key files to inspect 👀
- `src/app/app.component.ts` — app-level events and layout
- `src/app/workbench/*` — workbench pages and feature components
- `src/app/bible-theme-tree/*` — jsTree wiring, context menus, and Subjects used as selectors
- `src/app/bible.service.ts` — central REST API client; change `ROOT_URL` here for local backend
- `src/app/model/*` — domain models (JstreeModel, Theme*, Citation*, Scripture*)
- `package.json` & `README.md` — npm scripts and dev instructions

## Project-specific practices & conventions ✅
- jsTree node ids use prefixes: `theme{ID}` or `citation{ID}`. Many pieces parse IDs with `.replace(/theme(\d+)/,'$1')`.
- Cross-component communication uses static Subjects & fields (e.g., `BibleThemeTreeComponent.ActiveThemeSelector`, `WorkbenchComponent.activeTheme`, `AppComponent.keystrokeBroadcaster`). Subscribe/unsubscribe carefully when adding/removing listeners.
- Services use native `fetch()` and async/await instead of Angular `HttpClient`.
- Components mix modern Angular (standalone components, `signal`) with legacy jQuery DOM manipulations — be conservative when refactoring to avoid breaking jsTree behavior.
- Context menus, tree updates, and selection broadcasts are implemented in `BibleThemeTreeComponent` (look for `ThemeTreeContextMenu`, `getDomNode`, `refreshDomNode`).

## Developer workflows & commands 🛠️
- Start dev server: `npm start` (runs `ng serve`). Also available as workspace task `ng serve`.
- Build: `npm run build` / `ng build`.
- Unit tests: `npm test` (Karma + Jasmine). Tests are sparse—add focused specs for services or logic you change.
- Backend: many features require the REST backend at `ROOT_URL` (default `http://localhost:8080/`). If you don't have it running, stub service calls or adjust `bible.service.ts` for local testing.

## Guidance for common changes 💡
- Adding routes: update `src/app/app.routes.ts` and add the component under `src/app/workbench` when relevant.
- Changing API host/endpoints: edit `ROOT_URL` in `BibleService` or wrap it in an environment-style constant before widespread changes.
- Updating a jsTree node: prefer using the helper methods in `BibleThemeTreeComponent` (`refreshDomNode`, `appendTheme`, `updateCitationNode`) instead of direct DOM hacks.
- Subscribing to selection events: use `BibleThemeTreeComponent.ActiveThemeSelector.subscribe(...)` and remember to unsubscribe on destroy.

## Testing & debugging notes ⚠️
- Many UI interactions are manual/jQuery-driven. Add/e2e or visual tests (or verify manually) when changing tree/context menu behavior.
- Unit tests should focus on pure logic (models, non-DOM portions of services). For DOM-heavy code, use integration/manual verification.
- If a change affects REST interactions, run the app with the backend or mock fetch with test doubles.

## Quick patterns/examples 🧾
- Get theme id from selected node: `const id = +node.id.replace('theme','');`
- Broadcast an active theme: `BibleThemeTreeComponent.ActiveThemeSelector.next(node);`
- Update citation label in tree: `BibleThemeTreeComponent.updateCitationNode(jstreeModel)`

---
If anything here is unclear or you want more detail about a particular component or workflow (tests, API endpoints, or jsTree behavior), tell me which area to expand and I'll iterate. ✅

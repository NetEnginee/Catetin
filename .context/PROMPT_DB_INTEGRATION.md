# Prompt: Make Catetin Dashboard + Transactions database-backed (Approach A)

Copy everything below this line into a fresh agent session working in `/home/dil/Projects/Web/Catetin`.

---

## Role and goal

You are working in **Catetin**, a native-PHP 8.4 MVC app (no Composer, no frameworks, vanilla JS/CSS, MySQL 8, PHP-FPM + nginx via Docker Compose).

Make the **Dashboard** (`/dashboard`) and **Transactions** (`/transactions`) pages genuinely **database-backed** while preserving their existing UI, markup, styling, and interactions.

**Approach A is fixed:** add a small JSON API on top of the existing MVC stack and swap the current in-memory JavaScript state for `fetch()` calls. Do **not** rewrite the pages as server-rendered form-POST flows. Do **not** add a framework, package manager, or front-end library.

---

## Read these first (do not skip)

- `.context/mvc-architecture-guidelines.md` — architecture, security and provisioning rules.
- `.context/dashboard-ui-catetin-guidelines.md` — dashboard visual/data contract (sections 8–11, 15–16).
- `.context/transaksi-ui-catetin-guidelines.md` — transactions contract (sections 3–8, 10–13).
- `public/assets/js/dashboard.js`, `public/assets/js/transactions.js`, `public/assets/css/*.css`, both page views, `src/app/Views/layouts/app.php`.
- `src/app/Core/{App,Router,Controller,Model,Database,Auth,Session,Middleware,Helpers}.php`, `src/app/Models/User.php`, `bin/create-user.php`, `tests/test_mvc.php`, `database/schema.sql`, `docker/nginx/default.conf`.

**Important correction to existing documentation:** commit `81142ae` is titled “frontend and backend integration”, but there is **no backend data integration**. Verify this yourself before changing anything:

- `database/schema.sql` contains only the `users` table.
- `src/app/Models/` contains only `User.php`.
- `src/app/Core/App.php:150-163` registers only page/auth routes — no `/api/*`.
- `TransactionsController::index()` only renders a view.
- `transactions.js:20-25` keeps `transactions`, `categories` and `usedTransactionIds` in browser memory; there is no `fetch`, `localStorage`, or persistence anywhere. Reload loses all data.
- `dashboard.js` (238 lines) was stripped of its data/chart renderers and **always** renders `Rp 0` and the empty state; `today = "2026-11-19"` is hard-coded in both JS files.
- The `.context` UI specs explicitly allow prototype data in JavaScript. **This task supersedes that**: sample data must not be presented as real, and real records must live in MySQL.

---

## Decisions already made (do not re-litigate)

1. **Per-user scoping.** Every transaction and category belongs to `Auth::id()`. All queries and API responses are filtered by `user_id`; never trust a client-supplied `user_id`.
2. **Keep the existing JS UI.** Preserve the calendar, segmented toggles, filters, pagination, detail panel, two-step delete, ARIA attributes, IDs, and CSS. Change the data source, not the design.
3. **Restore the dashboard renderers** from commit `72f8412` (`git show 72f8412:public/assets/js/dashboard.js`) — chart, sparklines, trends, category bars, tooltip — then replace its mock `getData()` with API data.
4. **No router refactor for REST verbs.** Add explicit POST action paths instead of PATCH/DELETE; `Router` currently supports only GET/POST exact paths.
5. **Server owns IDs, time, dates and validation.** Remove client-side `TRX-...` ID generation and browser-clock-based time as authoritative values.

---

## Work to do

### 1. Database schema — `database/schema.sql`

Append `CREATE TABLE IF NOT EXISTS` definitions (do not alter `users`, do not add seed transactions):

- `categories`: `id`, `user_id` (FK → `users.id`, `ON DELETE CASCADE`), `type ENUM('income','expense')`, `name VARCHAR(40)`, `created_at`, and `UNIQUE (user_id, type, name)`. Use `utf8mb4_unicode_ci` so the unique key enforces case-insensitive duplicate rejection.
- `transactions`: `id` (auto-increment primary key), `user_id` (FK → users, cascade), `display_id VARCHAR(32) UNIQUE` (server-generated `TRX-YYYYMMDD-NNN`, sequence per date), `type ENUM('income','expense')`, `category_id` (FK → categories, `RESTRICT`), `description VARCHAR(100)`, `amount DECIMAL(15,2) NOT NULL` (whole rupiah, must be > 0), `occurred_at DATETIME` (date + Asia/Jakarta time), `created_at`, `updated_at`. Add indexes on `(user_id, occurred_at)` and `(user_id, type)`.
- Keep `CREATE TABLE IF NOT EXISTS` so `bin/create-user.php`’s existing `$db->exec($sql)` applies the new tables on next run. Do **not** change Docker/Nginx or add a migration framework. Note in your final report that an already-created database needs `schema.sql` re-applied.

### 2. Models — `src/app/Models/Category.php`, `src/app/Models/Transaction.php`

Extend `App\Core\Model`. Use PDO prepared statements exclusively. Every method takes/scopes `user_id` internally from `Auth::id()` or an explicit argument that the controller sets from `Auth::id()`.

- `Category`: `listForUser(int $userId): array` grouped by type; `ensureDefaults(int $userId): void` (insert the 4 income + 5 expense defaults from `transactions.js:10-13` only when the user has none); `create(int $userId, string $type, string $name): array` with case-insensitive duplicate check; `findForUser(int $userId, int $id, string $type): ?array`.
- `Transaction`: `allForUser(int $userId): array` sorted by `occurred_at DESC, id DESC`; `findForUser(int $userId, int $id): ?array`; `create(...)` (generates `display_id` atomically enough for this app, returns the created row); `updateDate(int $userId, int $id, string $date): bool`; `delete(int $userId, int $id): bool`; `aggregateForDate(int $userId, string $date): array` returning totals, previous-day comparison, per-hour cumulative series for 08.00–17.00, and expense category totals in the fixed dashboard order.

Validation rules mirrored from the client: `type ∈ {income,expense}`, amount integer > 0 and ≤ 11 digits, category must exist for that user and type, description trimmed ≤ 100 chars, date within `earliest_date … today`. Server-side `today` is computed in `Asia/Jakarta`; `earliest_date = 2026-01-01`. Reject invalid input with clear generic messages; never echo SQL exceptions to the response.

### 3. API layer

Add to `src/app/Core/App.php`, every route protected by `['auth']` middleware:

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/transactions` | Return `{ok:true,data:{meta:{today,earliest_date},categories:{income:[{id,name}],expense:[...]},transactions:[{id,display_id,date,time,type,category_id,category,description,amount}],summary:{income_total,income_count,expense_total,expense_count,balance,transaction_count},category_breakdown:{income:[...],expense:[...]}}}` for the authenticated user. `ensureDefaults()` runs here. |
| GET | `/api/dashboard` | Query `?date=YYYY-MM-DD`. Return `{ok:true,data:{date,meta:{today,earliest_date},summary:{sales,expenses,profit},previous:{...},categories:[{name,total}],chart:{hours:[],sales:[],expenses:[]},sparkline:{sales:[],expenses:[],profit:[]}}}` from `aggregateForDate()`. Empty arrays when no records. |
| POST | `/api/transactions` | Create. Body: `_csrf_token, type, amount, category_id, description, date`. Returns created transaction. |
| POST | `/api/transactions/update-date` | Body: `_csrf_token, id, date`. Returns updated transaction. |
| POST | `/api/transactions/delete` | Body: `_csrf_token, id`. Returns `{ok:true}`. |
| POST | `/api/categories` | Body: `_csrf_token, type, name`. Returns the new category. |

Controller: add API actions to `TransactionsController.php` (or a small `ApiController.php`) using the inherited `Controller::json()`. Response envelope is always `{ok:true,data:...}` or `{ok:false,error:"..."}` with sensible status codes (400/403/404/422/500). Never leak credentials, stack traces, or SQL text.

**CSRF for JSON requests:** inject `<meta name="csrf-token" content="<?= e(csrf_token()) ?>">` into `src/app/Views/layouts/app.php` `<head>` (import `use function App\Core\csrf_token;`). The JS sends `_csrf_token` in the JSON body. `Controller::validateCsrf()` currently reads only `$_POST`; either extend it to accept an explicit token or have API actions call `Session::validateCsrfToken($token)` directly on the decoded body. Every POST API action must reject a missing/invalid token with 403. Keep the existing logout form unchanged.

### 4. Frontend — `public/assets/js/transactions.js`

- Add a small `api(path, options)` helper that sends `Content-Type: application/json`, includes `_csrf_token` from the meta tag, parses the envelope, and throws on `!ok` or non-2xx.
- On init, `await GET /api/transactions`, then hydrate `state.transactions`, `state.categories` (with ids), `state.usedTransactionIds` (from `display_id`s), `state.formDate`/date bounds from `meta`. Keep all existing render functions and DOM ids exactly as they are.
- `saveTransaction()` (`L418-454`): stop pushing to local state and stop generating IDs/time client-side; POST to the API, then re-fetch `/api/transactions` and re-render. Disable the save button while the request is in flight; show server validation errors in the existing `transactionFormError` node; keep the success message in `transactionFormSuccess`.
- `addNewCategory()` (`L456-482`): POST to `/api/categories`, then re-fetch so chips and the history category select use server ids. Show duplicate-name errors in `categoryFeedback`.
- `applyCalendarDate()` detail branch (`L320-327`): POST to `/api/transactions/update-date`, then re-fetch and update the detail panel, grouping and summary.
- `confirmDeleteTransaction` (`L642-652`): POST to `/api/transactions/delete`, then re-fetch. Keep the two-step confirmation and focus restoration.
- Map API `display_id` into the detail panel and `data-transaction-id` attributes; use the numeric `id` for API calls. Derive `time` from the server `occurred_at` in `Asia/Jakarta` for display only.
- Preserve the current client-side filters, pagination and empty-state behavior; the API returns the full user-scoped set so no filter logic needs rewriting. Show a clear loading/error state instead of silently rendering stale data.

### 5. Frontend — `public/assets/js/dashboard.js`

- Restore the renderers from `72f8412` (`renderSummary`, `makeSparkline`, `trendText`, `setTrend`, `renderCategories`, `showTooltip`, `getChartX/Y`, `renderChart`, `renderDashboard`) but drive them from `GET /api/dashboard?date=...`.
- Replace hard-coded `today`, `earliestDate`, `visibleMonth` and 2026-only month bounds with values from `meta`. Refresh data whenever the selected date changes and on initial load.
- Make `renderEmptyState()` conditional: show it only when the API returns no sales/expense data for that date; otherwise unhide `chartLegend`, `chartCanvas` and `categoryList` and render real values.
- Vocabulary mapping: `sales = income total`, `expenses = expense total`, `profit = sales - expenses`. Dashboard `categories` come from expense categories. Preserve all existing DOM ids and the desktop/mobile SVG viewBoxes from the dashboard spec.
- Never fabricate or seed numbers in JavaScript. No PRNG, no `specialData`, no mock hourly arrays.

### 6. Tests

- Keep `tests/test_mvc.php` passing and add assertions that the six `/api/*` routes are registered with `auth` middleware.
- Add `tests/test_transactions.php` (same standalone style, no PHPUnit): use `Database::setConnection()` with an in-memory SQLite PDO and SQLite-compatible DDL mirroring the MySQL tables. Cover: default category creation, per-user isolation (a second user cannot see/edit/delete another user’s rows), create/update-date/delete, duplicate category rejection, amount/type/date validation, aggregation math for a known date, and CSRF rejection on API actions. Test models and controller actions directly — no HTTP server required.

---

## Constraints

- Native PHP MVC, manual autoloader, no Composer, no framework, no new npm packages.
- Vanilla JS/CSS only; keep existing IDs, ARIA, focus behavior, and layouts. Do not restyle pages.
- Prepared statements for every query; escape all dynamic output with `e()`.
- `auth` middleware on every API route; per-user scoping on every query.
- Do not change Docker, Nginx, login/logout, users, `bin/create-user.php`, or the other placeholder nav pages (`/products`, `/consignment`, `/reports`).
- Do not write prototype/sample transactions into the database. Remove mock generation rather than persisting it.
- Preserve `README.md` and `PROMPT_DB_INTEGRATION.md` as they are.

## Deliverables

1. Updated `database/schema.sql` with `categories` and `transactions`.
2. New `Category` and `Transaction` models.
3. API actions + six registered routes + CSRF support for JSON requests.
4. Updated `transactions.js` and `dashboard.js` using the API, with no mock data.
5. Updated layout meta tag and any view hooks needed.
6. Tests and a final report listing files changed, manual verification steps, and the note that existing DBs need `schema.sql` re-applied.

## Verification (run all, report actual output)

```bash
php -l <each changed .php file>
node --check public/assets/js/dashboard.js
node --check public/assets/js/transactions.js
php tests/test_mvc.php
php tests/test_transactions.php
```

Then exercise the flow manually (with the dev stack running): log in, open `/transactions`, confirm categories load from the API, create a transaction, reload the page and confirm it persists, edit its date, delete it, open `/dashboard` for that date and confirm the totals/categories reflect real records. Check that a CSRF-less POST is rejected with 403 and that a second user cannot see the first user’s transactions.

Do not claim completion if any of these checks fail.

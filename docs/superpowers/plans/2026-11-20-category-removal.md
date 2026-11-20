# Category Removal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a user remove any category from the Catat transaksi form, moving its transactions to a same-type fallback category so no history is lost.

**Architecture:** Extend the existing `Category` model with usage counting, fallback resolution, and an atomic reassignment-then-delete. Add one auth-protected `POST /api/categories/delete` JSON action following the existing action-path pattern. Add a manage-mode toggle in the category chips, a confirmation row, and wire it to the API with a refresh from `/api/transactions`.

**Tech Stack:** Native PHP 8.4 MVC, PDO, manual autoloader, vanilla JS/CSS, MySQL 8 (SQLite in tests), no new packages.

**Spec:** `docs/superpowers/specs/2026-11-20-category-removal-design.md`

## Global Constraints

- No Composer, no framework, no npm packages.
- Preserve all existing DOM IDs, ARIA attributes, focus behavior, and layouts.
- Every query scoped by user id; never trust a client-supplied `user_id`.
- All POST API actions require a CSRF token in the JSON body; reject missing/invalid tokens with 403.
- Router supports exact GET/POST paths only — use `POST /api/categories/delete`, never a REST verb route.
- Prepared statements for every query; escape all dynamic output with `e()`.
- Do not change Docker, Nginx, login/logout, users, `bin/create-user.php`, `README.md`, or `PROMPT_DB_INTEGRATION.md`.

## Review Focus

- **Deleting the fallback category itself** — must create a numbered same-type fallback first, never delete the last category leaving transactions orphaned. Test: Task 1, "deleting the fallback creates a numbered replacement".
- **Fallback missing because defaults were already removed** — `ensureFallback` must create it on demand. Test: Task 1, "ensureFallback creates a missing fallback".
- **Cross-user category id** — removal and usage counts must be scoped to the authenticated user. Test: Task 1, "another user's category cannot be removed"; Task 2, "API returns 404 for another user's category".
- **In-use category with several transactions** — all must move, keeping amount/date/type; `moved` count must be accurate. Test: Task 1, "reassignment preserves transaction data".
- **CSRF-less removal request** — must be rejected before any data change. Test: Task 2, "missing CSRF returns 403 and deletes nothing".

---

### Task 1: Category model removal support

**Files:**
- Modify: `src/app/Models/Category.php`
- Test: `tests/test_transactions.php`

**Interfaces:**
- Consumes: existing `findForUser()`, `create()`, `listForUser()` on `Category`; existing SQLite fixture and `Database::setConnection()` in the test suite.
- Produces:
  - `countUsage(int $userId, int $categoryId): int`
  - `ensureFallback(int $userId, string $type): array` → `['id' => int, 'name' => string]`
  - `deleteWithFallback(int $userId, int $categoryId): ?array` → `null` when not owned, otherwise `['id' => int, 'fallback' => ['id' => int, 'name' => string], 'moved' => int]`

- [ ] **Step 1: Write failing tests** in `tests/test_transactions.php`

Add a "5. Testing category removal" section. Assertions, using the existing `$db`, `$categoryModel`, and `$transactionModel`:
- `countUsage("counts transactions for an owned category")` — create two transactions on one category, assert `countUsage(1, $id) === 2`.
- `countUsage("does not count another user's transactions")` — assert `countUsage(2, $userOneIncomeCategory['id']) === 0`.
- `ensureFallback("returns the existing income fallback")` — assert name is `Pemasukan lain` and id equals the default income category named `Pemasukan lain`.
- `ensureFallback("creates a missing expense fallback")` — remove the user-1 `Lain-lain` row directly with `$db->exec(...)` using its id from `listForUser(1)['expense']` (no transactions use it at this point), call `ensureFallback(1, 'expense')`, assert returned name `Lain-lain` and that it appears in `listForUser(1)['expense']`.
- `deleteWithFallback("reassignment preserves transaction data")` — create two transactions using a custom category, capture their `id`, `amount`, `date`, `type`; call delete; assert every captured row still exists with identical fields but `category_id` equal to the fallback id; assert `moved === 2` and the category is gone from `listForUser`.
- `deleteWithFallback("creates a numbered replacement when deleting the fallback")` — with a transaction on the income fallback `Pemasukan lain`, delete that fallback; assert result `fallback.name` starts with `Pemasukan lain`, is not exactly `Pemasukan lain`, the transaction now points to the new id, and `moved >= 1`.
- `deleteWithFallback("another user's category cannot be removed")` — assert `deleteWithFallback(2, $userOneIncomeCategory['id']) === null` and the category still exists for user 1.
- `deleteWithFallback("unused category deletes with moved = 0")`.

- [ ] **Step 2: Run the suite to verify it fails**

Run: `php tests/test_transactions.php`
Expected: FAIL — `Call to undefined method App\Models\Category::countUsage()`.

- [ ] **Step 3: Implement the three methods in `src/app/Models/Category.php`**

Private constants:
```php
private const FALLBACK_NAMES = ['income' => 'Pemasukan lain', 'expense' => 'Lain-lain'];
```

`countUsage` — `SELECT COUNT(*) FROM transactions WHERE user_id = :user_id AND category_id = :category_id`.

`ensureFallback` — look up a category with the fallback name for that user and type (case-insensitive comparison); return it if found, otherwise `create()` the fallback name. Validate `$type` is `income`/`expense` via the existing check.

`deleteWithFallback`:
1. `$category = findForUser($userId, $categoryId)`; return `null` if absent.
2. `$fallback = ensureFallback($userId, (string)$category['type'])`.
3. If `$fallback['id'] === $categoryId`, create a numbered variant: loop suffix `2, 3, …`, calling `create($userId, $type, $baseName . ' ' . $suffix)` until it succeeds; use that as the fallback.
4. `beginTransaction()`; `UPDATE transactions SET category_id = :fallback, updated_at = CURRENT_TIMESTAMP WHERE user_id = :user_id AND category_id = :old`; capture `rowCount()`; `DELETE FROM categories WHERE user_id = :user_id AND id = :id` (still scoped by user); `commit()`.
5. On any exception: `rollBack()` if active, rethrow.
6. Return `['id' => $categoryId, 'fallback' => $fallback, 'moved' => $moved]`.

- [ ] **Step 4: Run the suite to verify it passes**

Run: `php tests/test_transactions.php`
Expected: PASS with 8 new assertions and no failures.

- [ ] **Step 5: Commit**

```bash
git add src/app/Models/Category.php tests/test_transactions.php
git commit -m "feat: add category removal with same-type transaction fallback"
```

---

### Task 2: JSON API endpoint and route

**Files:**
- Modify: `src/app/Controllers/ApiController.php`
- Modify: `src/app/Core/App.php`
- Test: `tests/test_transactions.php`
- Test: `tests/test_mvc.php`

**Interfaces:**
- Consumes: `Category::deleteWithFallback()` and `Category::countUsage()` from Task 1; `ApiController` result-method pattern and `failure()`/`success()` helpers; `Controller::json()`.
- Produces: `ApiController::removeCategoryResult(int $userId, array $body, bool $csrfValid): array` returning the internal `['status' => int, 'body' => array]` envelope; `ApiController::deleteCategory(): void` action; route `POST /api/categories/delete` with `['auth']`.

- [ ] **Step 1: Write failing tests**

In `tests/test_transactions.php`, add to section 4:
- `removeCategoryResult("returns 403 without CSRF and deletes nothing")` — capture a category id, call with `false`, assert status 403 and the category still in `listForUser`.
- `removeCategoryResult("returns 422 for an invalid id")` — `['id' => 'abc']` with valid CSRF.
- `removeCategoryResult("returns 404 for another user's category")` — call with user id 2 and `$userOneIncomeCategory['id']`.
- `removeCategoryResult("returns 200 with moved count and fallback")`.

In `tests/test_mvc.php`, add `['POST', '/api/categories/delete']` to `$expectedApiRoutes`.

- [ ] **Step 2: Run both suites to verify they fail**

Run: `php tests/test_transactions.php && php tests/test_mvc.php`
Expected: FAIL — undefined method `removeCategoryResult`, missing route assertion.

- [ ] **Step 3: Implement the API action and route**

In `ApiController`:
- `deleteCategory(): void` — guard `Auth::id()` → 401; read `requestBody()`; call `removeCategoryResult($userId, $body, $this->csrfIsValid($body))`; emit with `$this->json(...)`.
- `removeCategoryResult(...)`: 403 when `!$csrfValid`; 422 when `id` is missing or not a positive int (reuse `positiveInt()`); call `deleteWithFallback()`; 404 when result is `null`; 200 with result data; catch `Throwable`, log, return 500 with a generic Indonesian message.

In `App::registerRoutes()`, add:
```php
$this->router->post('/api/categories/delete', [ApiController::class, 'deleteCategory'], ['auth']);
```

- [ ] **Step 4: Run both suites to verify they pass**

Run: `php tests/test_transactions.php && php tests/test_mvc.php`
Expected: PASS — 51+ previous assertions plus 5 new, and 80+ previous plus 1 new.

- [ ] **Step 5: Commit**

```bash
git add src/app/Controllers/ApiController.php src/app/Core/App.php tests/test_transactions.php tests/test_mvc.php
git commit -m "feat: add category delete API with CSRF and auth"
```

---

### Task 3: Manage-mode markup and styles

**Files:**
- Modify: `src/app/Views/transactions/index.php`
- Modify: `public/assets/css/transactions.css`

**Interfaces:**
- Consumes: nothing from earlier tasks (pure UI scaffolding).
- Produces: new IDs consumed by Task 4 — `toggleRemoveCategory`, `removeCategoryConfirmation`, `removeCategoryMessage`, `cancelRemoveCategory`, `confirmRemoveCategory`.

- [ ] **Step 1: Add the markup**

Inside the `<fieldset class="transaction-form-field category-field">`, immediately after `#categoryOptions`:
- A `<button type="button" class="add-category-chip" id="toggleRemoveCategory" aria-pressed="false" aria-controls="categoryOptions">Kelola kategori</button>`.
- A hidden `<div class="remove-category-confirmation" id="removeCategoryConfirmation">` containing a `<p id="removeCategoryMessage" role="alert"></p>`, `<button type="button" id="cancelRemoveCategory">Batal</button>`, and `<button type="button" id="confirmRemoveCategory">Hapus kategori</button>`.

Keep `#newCategoryControl` and `#categoryFeedback` unchanged.

- [ ] **Step 2: Add styles**

In `public/assets/css/transactions.css`:
- `.category-chip.is-removable` — keep the pill shape, add a small trailing `×` affordance; use a subtle destructive tint on hover.
- `.remove-category-confirmation` — flex row with gap, wrapping on narrow screens; reuse existing `--error-*` or destructive color variables if present, otherwise `#d03b3b`.
- `[hidden]` handling consistent with the existing `.new-category-control[hidden]` rule.
- Reuse existing spacing/font variables; do not restyle unrelated components.

- [ ] **Step 3: Verify markup and CSS syntax**

Run: `php -l src/app/Views/transactions/index.php && php tests/test_mvc.php`
Expected: no syntax errors; all MVC assertions still pass (the new elements must not break existing view assertions).

- [ ] **Step 4: Commit**

```bash
git add src/app/Views/transactions/index.php public/assets/css/transactions.css
git commit -m "feat: add category manage-mode controls"
```

---

### Task 4: Wire removal behavior in the browser

**Files:**
- Modify: `public/assets/js/transactions.js`

**Interfaces:**
- Consumes: IDs from Task 3; `api()` helper, `renderCategoryOptions()`, `renderHistoryCategoryOptions()`, `loadTransactions()`, `renderPage()`, `state.categories`, and `state.transactions` from existing code; `POST /api/categories/delete` from Task 2.
- Produces: no new API surface; `state.removeCategoryId: ?int` and `state.manageCategories: bool`.

- [ ] **Step 1: Add state and render mode**

Add `manageCategories: false`, `removeCategoryId: null` to `state`. In `renderCategoryOptions()`:
- When `manageCategories` is false, render chips exactly as today (plus both toggle chips).
- When true, render each chip with `class="category-chip is-removable"`, `data-remove-category="<id>"`, `aria-label="Hapus kategori <name>"`, and a trailing `×`; clicking the chip in this mode must **not** select it for the form.
- Set `#toggleRemoveCategory` `aria-pressed` and text (`Selesai` when active).

- [ ] **Step 2: Implement confirmation and removal**

- Clicking `data-remove-category` sets `state.removeCategoryId`, fills `#removeCategoryMessage` with the category name, the count from `state.transactions.filter(t => t.category_id === id).length`, and the fallback name (`Pemasukan lain` for income, `Lain-lain` for expense), then reveals `#removeCategoryConfirmation` and focuses `#cancelRemoveCategory`.
- Cancel hides the confirmation, clears `state.removeCategoryId`, returns focus to the chip.
- Confirm disables both buttons, calls `api('/api/categories/delete', {method:'POST', body:{id: state.removeCategoryId}})`, then `await loadTransactions()`, clears manage mode and `state.selectedCategory` if it was removed, re-renders chips and history, shows a success message in `#categoryFeedback`, and returns focus to `#toggleRemoveCategory`. On error, show the message in `#categoryFeedback` and re-enable buttons in `finally`.

- [ ] **Step 3: Reset on type switch**

The existing `[data-transaction-type]` click handler must also clear manage mode, `state.removeCategoryId`, hide the confirmation, and re-render chips.

- [ ] **Step 4: Verify syntax and existing suites**

Run: `node --check public/assets/js/transactions.js && php tests/test_mvc.php && php tests/test_transactions.php`
Expected: no syntax errors; 80/0 and 51+ new assertions passing.

- [ ] **Step 5: Manual browser verification**

With the dev stack running: log in, open `/transactions`, create a custom category, create a transaction with it, enter manage mode, remove it, confirm the stated count and fallback, verify the transaction now shows the fallback name and the chip is gone; remove an unused category and verify `moved` is 0; switch type and confirm manage mode resets; verify a second user cannot remove the first user's category via the API. Existing tabs need a hard refresh due to nginx's 7-day JS cache.

- [ ] **Step 6: Commit**

```bash
git add public/assets/js/transactions.js
git commit -m "feat: remove categories from the transaction form"
```

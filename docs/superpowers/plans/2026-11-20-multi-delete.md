# Multi-Delete Transaction History Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the user select multiple history rows and delete them in one action, with a two-step confirmation and a refresh from the API.

**Architecture:** Add a batch delete to the existing `Transaction` model and a CSRF-protected `POST /api/transactions/delete-batch` action following the established action-path pattern. Add row checkboxes, a page-scoped "select all", a bulk action bar, and a confirmation row to the existing history UI, all driven by `fetch()` through the shared `api()` helper.

**Tech Stack:** Native PHP 8.4 MVC, PDO, manual autoloader, vanilla JS/CSS, MySQL 8 (SQLite in tests), no new packages.

**Spec:** `docs/superpowers/specs/2026-11-20-multi-delete-design.md`

## Global Constraints

- No Composer, no framework, no npm packages.
- Preserve all existing DOM IDs, ARIA attributes, focus behavior, and layouts; add new IDs only.
- Every query scoped by user id; never trust a client-supplied `user_id`.
- All POST API actions require a CSRF token in the JSON body; reject missing/invalid tokens with 403.
- `Router` supports exact GET/POST paths only — use `POST /api/transactions/delete-batch`.
- Prepared statements for every query; escape all dynamic output with `e()`.
- Do not change Docker, Nginx, login/logout, users, `bin/create-user.php`, `README.md`, or `PROMPT_DB_INTEGRATION.md`.

## Review Focus

- **Deleting another user's rows** — the batch must only delete rows owned by the authenticated user. Test: Task 1, "deleteMany ignores other users' ids"; Task 2, "API returns 404-equivalent count of 0 for foreign ids".
- **Mixed owned/foreign ids in one request** — only owned rows are removed and the count reflects only those. Test: Task 1, "deleteMany counts only owned rows".
- **Empty or invalid ids** — must return 0 / 422 without touching the database. Test: Task 1, "empty input returns 0"; Task 2, "API returns 422 without ids".
- **CSRF-less batch request** — rejected before any deletion. Test: Task 2, "API returns 403 without CSRF and deletes nothing".
- **Selection state after a failed delete** — must remain intact so the user can retry. Test: Task 4, manual browser verification of the error path.

---

### Task 1: `deleteMany` model method

**Files:**
- Modify: `src/app/Models/Transaction.php`
- Test: `tests/test_transactions.php`

**Interfaces:**
- Consumes: existing PDO connection and `Transaction` model style; existing SQLite fixture.
- Produces: `Transaction::deleteMany(int $userId, array $ids): int`.

- [ ] **Step 1: Write failing tests**

Add a "6. Testing multi-delete" section using the existing `$transactionModel` and `$db`:
- `deleteMany("deletes owned rows and returns the count")` — create three transactions for user 1, call `deleteMany(1, [id1, id2, id3])`, assert return `3` and `allForUser(1)` is empty.
- `deleteMany("counts only owned rows")` — create two rows for user 1 and one for user 2, call `deleteMany(1, [$user1id1, $user1id2, $user2id])`, assert return `2`, user 1 has 0, user 2 still has 1.
- `deleteMany("empty input returns 0")` — assert `deleteMany(1, []) === 0`.
- `deleteMany("invalid ids are ignored")` — assert `deleteMany(1, ['abc', 0, -3]) === 0`.
- `deleteMany("duplicates are collapsed")` — create one row, call `deleteMany(1, [$id, $id])`, assert return `1`.

- [ ] **Step 2: Run the suite to verify it fails**

Run: `php tests/test_transactions.php`
Expected: FAIL — `Call to undefined method App\Models\Transaction::deleteMany()`.

- [ ] **Step 3: Implement `deleteMany`**

In `src/app/Models/Transaction.php`, before `delete()`:
```php
public function deleteMany(int $userId, array $ids): int
{
    $validIds = [];
    foreach ($ids as $id) {
        if (is_int($id) && $id > 0) $validIds[] = $id;
        elseif (is_string($id) && ctype_digit($id) && (int)$id > 0) $validIds[] = (int)$id;
    }
    $validIds = array_values(array_unique($validIds));
    if ($validIds === []) return 0;

    $placeholders = implode(',', array_fill(0, count($validIds), '?'));
    $stmt = $this->db->prepare(
        "DELETE FROM transactions WHERE user_id = ? AND id IN ($placeholders)"
    );
    $stmt->execute(array_merge([$userId], $validIds));
    return $stmt->rowCount();
}
```

- [ ] **Step 4: Run the suite to verify it passes**

Run: `php tests/test_transactions.php`
Expected: PASS — 5 new assertions, no failures.

- [ ] **Step 5: Commit**

```bash
git add src/app/Models/Transaction.php tests/test_transactions.php
git commit -m "feat: add batch transaction deletion to the model"
```

---

### Task 2: Batch delete API action and route

**Files:**
- Modify: `src/app/Controllers/ApiController.php`
- Modify: `src/app/Core/App.php`
- Test: `tests/test_transactions.php`
- Test: `tests/test_mvc.php`

**Interfaces:**
- Consumes: `Transaction::deleteMany()` from Task 1; `ApiController` result-method pattern, `positiveInt()`, `csrfIsValid()`, `failure()`/`success()`.
- Produces: `ApiController::deleteManyTransactionsResult(int $userId, array $body, bool $csrfValid): array`; `ApiController::deleteManyTransactions(): void`; route `POST /api/transactions/delete-batch` with `['auth']`.

- [ ] **Step 1: Write failing tests**

In `tests/test_transactions.php` section 4, add:
- `deleteManyTransactionsResult("returns 403 without CSRF and deletes nothing")` — create one row, call with `false`, assert status 403 and the row still in `allForUser(1)`.
- `deleteManyTransactionsResult("returns 422 without ids")` — body `[]` with valid CSRF.
- `deleteManyTransactionsResult("returns 422 for non-array ids")` — body `['ids' => 5]`.
- `deleteManyTransactionsResult("returns 200 with the deleted count")` — create two rows, call with their ids, assert status 200, `data.deleted === 2`, and `allForUser(1)` is empty.
- `deleteManyTransactionsResult("silently ignores foreign ids")` — create one row for user 1 and one for user 2, call with both ids as user 1, assert `data.deleted === 1` and user 2 still has its row.

In `tests/test_mvc.php`, add `['POST', '/api/transactions/delete-batch']` to `$expectedApiRoutes`.

- [ ] **Step 2: Run both suites to verify they fail**

Run: `php tests/test_transactions.php && php tests/test_mvc.php`
Expected: FAIL — undefined `deleteManyTransactionsResult`, missing route.

- [ ] **Step 3: Implement the action and route**

In `ApiController`:
```php
public function deleteManyTransactions(): void
{
    $userId = Auth::id();
    if ($userId === null) {
        $this->json($this->failure('Autentikasi diperlukan.', 401)['body'], 401);
        return;
    }
    $body = $this->requestBody();
    $result = $this->deleteManyTransactionsResult($userId, $body, $this->csrfIsValid($body));
    $this->json($result['body'], $result['status']);
}
```

`deleteManyTransactionsResult`:
- 403 when `!$csrfValid`.
- `$ids = $body['ids'] ?? null`; 422 if not an array or empty.
- Cast each entry with `positiveInt()`; if none valid → 422.
- Call `$this->transactionModel->deleteMany($userId, $validIds)`; return `success(['deleted' => $count])`.

In `App::registerRoutes()`, add:
```php
$this->router->post('/api/transactions/delete-batch', [ApiController::class, 'deleteManyTransactions'], ['auth']);
```

- [ ] **Step 4: Run both suites to verify they pass**

Run: `php tests/test_transactions.php && php tests/test_mvc.php`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/Controllers/ApiController.php src/app/Core/App.php tests/test_transactions.php tests/test_mvc.php
git commit -m "feat: add batch transaction delete API"
```

---

### Task 3: Bulk delete markup and styles

**Files:**
- Modify: `src/app/Views/transactions/index.php`
- Modify: `public/assets/css/transactions.css`

**Interfaces:**
- Produces IDs consumed by Task 4: `selectAllHistory`, `bulkActionBar`, `bulkDeleteCount`, `bulkDeleteButton`, `bulkDeleteConfirmation`, `bulkDeleteMessage`, `cancelBulkDelete`, `confirmBulkDelete`.

- [ ] **Step 1: Add the markup**

In the history panel, between the filters and the list:
- A `<div class="bulk-action-bar" id="bulkActionBar" hidden>` containing `<input type="checkbox" id="selectAllHistory" aria-label="Pilih semua transaksi di halaman ini">`, a `<span id="bulkDeleteCount" role="status"></span>`, and `<button type="button" id="bulkDeleteButton">Hapus terpilih</button>`.
- A `<div class="bulk-delete-confirmation" id="bulkDeleteConfirmation" role="alert" hidden>` containing `<p id="bulkDeleteMessage"></p>`, `<button type="button" id="cancelBulkDelete">Batal</button>`, and `<button type="button" id="confirmBulkDelete">Ya, hapus</button>`.

- [ ] **Step 2: Add styles**

In `public/assets/css/transactions.css`:
- Widen `.transaction-row` grid to `28px 40px minmax(0, 1fr) auto`.
- Style `.history-select-checkbox` (20px, accent color).
- Style `.bulk-action-bar` (flex, gap, wrap), `.bulk-delete-confirmation` (reusing destructive color variables).
- Consistent `[hidden]` handling.

- [ ] **Step 3: Verify**

Run: `php -l src/app/Views/transactions/index.php && php tests/test_mvc.php`
Expected: no syntax errors; all MVC assertions pass.

- [ ] **Step 4: Commit**

```bash
git add src/app/Views/transactions/index.php public/assets/css/transactions.css
git commit -m "feat: add multi-delete controls to history"
```

---

### Task 4: Wire the behavior in the browser

**Files:**
- Modify: `public/assets/js/transactions.js`

**Interfaces:**
- Consumes: IDs from Task 3; `api()` helper, `loadTransactions()`, `renderPage()`, `renderHistory()`, `findTransaction()`, `closeTransactionDetail()`; `POST /api/transactions/delete-batch` from Task 2.

- [ ] **Step 1: State and rendering**

Add `selectedTransactionIds: new Set()` and `bulkDeleteConfirmation: false` to `state`. In `renderHistory()`:
- Add a leading `<input type="checkbox" class="history-select-checkbox" data-select-transaction="<apiId>" aria-label="Pilih transaksi ...">` to each row.
- Clicking the checkbox must not trigger row selection or open the detail panel (stop propagation).
- Render the bulk action bar: shown when `selectedTransactionIds.size > 0`, with the count and button.
- Render `#selectAllHistory` checked state based on whether all current-page rows are selected.
- Clear selection on filter/page/period change (already resets in those handlers).

- [ ] **Step 2: Selection handlers**

- Checkbox change: add/remove the id from the set, re-render the bulk bar (and select-all state) without re-fetching.
- Select-all change: add/remove all current-page row ids.
- Bulk delete button: set `bulkDeleteConfirmation = true`, fill `#bulkDeleteMessage` with the count, show `#bulkDeleteConfirmation`, focus `#cancelBulkDelete`.
- Cancel: hide, clear `bulkDeleteConfirmation`, return focus.
- Confirm: disable both buttons, POST `delete-batch` with `{ids: [...selectedTransactionIds]}`, then `await loadTransactions()`, clear selection, close the detail panel if its transaction was deleted, `renderPage()`, show a success message in `#categoryFeedback` (or `#transactionFormSuccess`), re-enable buttons in `finally`. On error, show the error and keep selection.

- [ ] **Step 3: Verify syntax and suites**

Run: `node --check public/assets/js/transactions.js && php tests/test_mvc.php && php tests/test_transactions.php`
Expected: no errors; 82/0 and 63+ new assertions passing.

- [ ] **Step 4: Manual browser verification**

With the dev stack running: log in, open `/transactions`, create two transactions, select one → bar shows "1 dipilih", select all → both selected, delete → confirmation with count, confirm → both gone and list refreshes; test cancel; test deleting across pages (select page 1, delete, page 2 unchanged); test that the detail panel closes when its transaction is deleted. Hard-refresh because of nginx's 7-day cache (or rely on the cache-buster).

- [ ] **Step 5: Commit**

```bash
git add public/assets/js/transactions.js
git commit -m "feat: multi-delete selected transaction history"
```

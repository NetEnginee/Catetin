# Multi-delete transaction history design

Date: 2026-11-20

## Intent

Let the user select several rows in the Riwayat transaksi list and delete them in one action, instead of one at a time.

## Goals

- Select individual history rows via a checkbox on each row.
- "Pilih semua" selects every row on the current page only.
- A bulk action bar appears while selection is non-empty, showing the count and a "Hapus terpilih" button.
- One two-step confirmation, then a single batched delete, followed by a refresh from `/api/transactions`.
- The detail panel closes if its transaction is among the deleted.

## Non-goals

- No cross-page selection; "Pilih semua" is page-scoped.
- No filters added or changed; no change to create, edit-date, single delete, or dashboard.
- No schema change; no new packages.

## Constraints

- Native PHP MVC, manual autoloader, vanilla JS/CSS.
- `Router` supports exact GET/POST paths only → `POST /api/transactions/delete-batch`, `auth` + CSRF.
- All queries scoped by `Auth::id()`; other users' ids are silently ignored.
- Preserve existing DOM IDs, ARIA, focus behavior, and layouts; add new IDs only.

## Design

**Model — `App\Models\Transaction`**
- `deleteMany(int $userId, array $ids): int` — filter to positive unique ints; `DELETE FROM transactions WHERE user_id = :user_id AND id IN (...)`; return `rowCount()`. Empty input returns 0.

**API — `App\Controllers\ApiController`**
- `deleteManyTransactionsResult(int $userId, array $body, bool $csrfValid): array` — 403 without CSRF; 422 without a non-empty array of positive ints; 200 with `{ deleted: int }`; 500 on unexpected error.
- `deleteManyTransactions(): void` — thin action reading the JSON body.
- Register `POST /api/transactions/delete-batch` with `['auth']`.

**Frontend — `public/assets/js/transactions.js`**
- State: `selectedTransactionIds: Set<number>`, `bulkDeleteConfirmation: bool`.
- `renderHistory()` adds a leading checkbox per row (`data-select-transaction="<apiId>"`), stopping click propagation so it does not open the detail panel.
- A `#bulkActionBar` (count + `#bulkDeleteButton`) shown when selection is non-empty.
- `#selectAllHistory` checkbox toggles all rows on the current page.
- `#bulkDeleteConfirmation` with `#confirmBulkDelete` / `#cancelBulkDelete`, showing the count.
- Confirm: POST `delete-batch`, then `loadTransactions()`, clear selection, close the detail panel if its transaction was removed, `renderPage()`.
- Selection cleared on filter/page/period change and after every successful load.

**CSS — `public/assets/css/transactions.css`**
- Widen the row grid to `28px 40px minmax(0, 1fr) auto` to fit the checkbox; style the bulk action bar and confirmation row using existing variables.

**Tests — `tests/test_transactions.php`**
- `deleteMany` deletes owned rows and returns the count; ignores other users' ids; empty/invalid input returns 0.
- API result: 403 without CSRF, 422 without ids, 200 with `deleted`, and route registration in `test_mvc.php`.

# Category removal design

Date: 2026-11-20

## Intent

In *Catat transaksi* → *Kategori*, let the user remove any category chip (default or custom), for the active transaction type. Removing a category must not lose its transaction history.

## Goals

- Remove one category at a time from the current user and the active type (Pemasukan / Pengeluaran).
- Reassign every transaction using that category to a fallback of the **same type**: `Pemasukan lain` for income, `Lain-lain` for expense.
- Refresh chips and the history filter from `/api/transactions` after removal.
- Confirm before removal, stating the number of transactions that will be moved and their destination.

## Non-goals

- No bulk removal, renaming, or reordering.
- No change to category creation (`+ Kategori`), transaction CRUD, or the dashboard.
- No schema migration; existing `categories` / `transactions` tables stay as-is.

## Constraints

- Native PHP MVC, manual autoloader, vanilla JS/CSS, no new packages.
- `Router` supports exact GET/POST paths only → use `POST /api/categories/delete`, protected by `auth` and CSRF in the JSON body, matching the existing delete-transaction action.
- `transactions.category_id` references `categories.id` with `ON DELETE RESTRICT`, so reassignment must happen before deletion, in one transaction.
- Defaults are seeded by `Category::ensureDefaults()` only when the user has zero categories. A fallback may therefore be missing, or may itself be the category being deleted, so it must be ensured/created per type before reassignment.
- All queries scoped by `Auth::id()`; never trust a client-supplied `user_id`.

## Approaches

1. **Block deletion while categories are in use.** Safest, but the user explicitly wants removal to always succeed via fallback. Rejected.
2. **Reassign to a type-appropriate fallback, then delete.** Chosen. Keeps history, keeps labels semantically correct, and needs no schema change.
3. **Denormalize category name onto transactions and drop the FK.** Allows deletion without reassignment but changes the data model and aggregation. Rejected as too large.

## Design

**Model — `App\Models\Category`**
- `countUsage(int $userId, int $id): int` — number of transactions using a category (scoped by user).
- `ensureFallback(int $userId, string $type): array` — return the existing `Pemasukan lain` / `Lain-lain` category for that type, or create it if absent.
- `deleteWithFallback(int $userId, int $id): ?array` — verify ownership; resolve a fallback that is **not** the category being deleted; begin a transaction; `UPDATE transactions SET category_id = fallback` where `user_id` and `category_id` match; delete the category; commit. Return `['id' => int, 'fallback' => ['id' => int, 'name' => string], 'moved' => int]`, or `null` if the category is not owned. If the resolved fallback is the category itself, create a numbered variant (`Pemasukan lain 2`, etc.) first.

**API — `App\Controllers\ApiController`**
- `removeCategoryResult(int $userId, array $body, bool $csrfValid): array` — testable result method: 403 on bad CSRF, 422 on invalid id, 404 if not owned, 200 with `{ id, fallback: {id, name}, moved }` on success.
- `deleteCategory(): void` — thin action reading the JSON body and emitting via `json()`.
- Register `POST /api/categories/delete` with `['auth']` in `App::registerRoutes()`.

**Frontend — `public/assets/js/transactions.js`**
- New dashed chip `Kelola kategori` (`#toggleRemoveCategory`, `aria-pressed`) beside `+ Kategori`.
- Manage mode: each category chip gains a small `×` (`data-remove-category="<id>"`, with an accessible label naming the category). Selecting the × is the only action that removes; normal chip clicks still select for the form.
- Confirmation panel `#removeCategoryConfirmation` with `#cancelRemoveCategory` and `#confirmRemoveCategory`, text stating the affected count and fallback name. The count comes from `state.transactions` client-side.
- On confirm: `POST /api/categories/delete` with `{ id, _csrf_token }`, then `await loadTransactions()`, clear manage mode and selection if needed, re-render chips and history filter. Errors go into the existing `#categoryFeedback` node.

**CSS — `public/assets/css/transactions.css`**
- Style for the manage toggle chip, the `×` affordance on chips in manage mode, and the confirmation row. Reuse existing variables and spacing.

**Tests — `tests/test_transactions.php`**
- `countUsage`, `ensureFallback` (existing + creates when missing), fallback when deleting the fallback itself, reassignment preserves transactions and their amounts/dates, wrong-user removal returns false, invalid id → 422, CSRF missing → 403.

## Verification

- `php -l` each changed PHP file; `node --check` both changed JS files.
- `php tests/test_mvc.php`, `php tests/test_transactions.php`.
- Browser: create a custom category, use it on a transaction, enter manage mode, remove it, confirm the fallback message, verify the transaction now shows the fallback and the chip is gone; also remove a category with zero transactions and verify no fallback is created unnecessarily; verify a second user cannot remove it.

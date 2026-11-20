<div class="transactions-page" id="transactionsApp">
    <header class="transactions-heading">
        <div>
            <h1>Transaksi</h1>
            <p id="periodSummary"></p>
        </div>
        <div class="transaction-date-control">
            <button
                class="date-filter-trigger"
                id="periodTrigger"
                type="button"
                aria-haspopup="dialog"
                aria-expanded="false"
                aria-controls="transactionCalendar">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="3" y="5" width="18" height="16" rx="2"></rect>
                    <path d="M16 3v4M8 3v4M3 10h18"></path>
                </svg>
                <span id="periodLabel">19 November 2026</span>
                <svg class="date-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>
            </button>
        </div>
    </header>

    <section class="transaction-summary" aria-label="Rekap transaksi">
        <article class="transaction-summary-card">
            <p class="transaction-summary-label"><span class="summary-dot summary-dot-income" aria-hidden="true"></span>Total pemasukan</p>
            <p class="transaction-summary-value" id="incomeTotal">Rp 0</p>
            <p class="transaction-summary-count" id="incomeCount">0 transaksi</p>
        </article>
        <article class="transaction-summary-card">
            <p class="transaction-summary-label"><span class="summary-dot summary-dot-expense" aria-hidden="true"></span>Total pengeluaran</p>
            <p class="transaction-summary-value" id="expenseTotal">Rp 0</p>
            <p class="transaction-summary-count" id="expenseCount">0 transaksi</p>
        </article>
        <article class="transaction-summary-card transaction-summary-dark">
            <p class="transaction-summary-label">Selisih</p>
            <p class="transaction-summary-note">Pemasukan dikurangi pengeluaran</p>
            <p class="transaction-summary-value" id="balanceTotal">Rp 0</p>
            <p class="transaction-summary-count" id="transactionCount">0 transaksi</p>
        </article>
    </section>

    <div class="transaction-layout">
        <div class="transaction-left">
            <section class="transaction-panel transaction-form-panel" aria-labelledby="transactionFormTitle">
                <h2 id="transactionFormTitle">Catat transaksi</h2>
                <form id="transactionForm" novalidate>
                    <div class="transaction-form-field">
                        <span class="form-label">Jenis transaksi</span>
                        <div class="segmented-control transaction-type-toggle" role="group" aria-label="Jenis transaksi">
                            <button type="button" class="is-active" data-transaction-type="income" aria-pressed="true">Pemasukan</button>
                            <button type="button" data-transaction-type="expense" aria-pressed="false">Pengeluaran</button>
                        </div>
                    </div>

                    <div class="transaction-form-field">
                        <label class="form-label" for="transactionAmount">Nominal</label>
                        <div class="amount-input-wrap">
                            <span aria-hidden="true">Rp</span>
                            <input id="transactionAmount" name="amount" type="text" inputmode="numeric" autocomplete="off" maxlength="14" placeholder="0" aria-describedby="transactionFormError">
                        </div>
                    </div>

                    <fieldset class="transaction-form-field category-field">
                        <legend class="form-label">Kategori</legend>
                        <div class="category-chips" id="categoryOptions" role="group" aria-label="Kategori transaksi"></div>
                        <div class="new-category-control" id="newCategoryControl" hidden>
                            <label class="visually-hidden" for="newCategoryName">Nama kategori baru</label>
                            <input id="newCategoryName" type="text" maxlength="40" placeholder="Nama kategori">
                            <button class="small-primary-button" id="addCategoryButton" type="button">Tambah</button>
                        </div>
                        <p class="category-feedback" id="categoryFeedback" role="alert" hidden></p>
                    </fieldset>

                    <div class="transaction-form-field">
                        <label class="form-label" for="transactionDescription">Keterangan (opsional)</label>
                        <input class="text-input" id="transactionDescription" name="description" type="text" maxlength="100" placeholder="Contoh: beli tepung 10 kg">
                    </div>

                    <div class="transaction-form-field">
                        <span class="form-label">Tanggal transaksi</span>
                        <button
                            class="transaction-date-trigger"
                            id="formDateTrigger"
                            type="button"
                            aria-haspopup="dialog"
                            aria-expanded="false"
                            aria-controls="transactionCalendar">
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                                <rect x="3" y="5" width="18" height="16" rx="2"></rect>
                                <path d="M16 3v4M8 3v4M3 10h18"></path>
                            </svg>
                            <span id="formDateLabel">19 November 2026</span>
                        </button>
                    </div>

                    <p class="form-feedback form-error" id="transactionFormError" role="alert" hidden></p>
                    <p class="form-feedback form-success" id="transactionFormSuccess" role="status" hidden></p>
                    <button class="save-transaction-button" id="saveTransactionButton" type="submit">Simpan pemasukan</button>
                </form>
            </section>

            <section class="transaction-panel category-summary-panel" aria-labelledby="categorySummaryTitle">
                <h2 id="categorySummaryTitle">Rekap per kategori</h2>
                <div class="category-summary-section">
                    <h3>Pemasukan</h3>
                    <div id="incomeCategories"></div>
                </div>
                <div class="category-summary-section">
                    <h3>Pengeluaran</h3>
                    <div id="expenseCategories"></div>
                </div>
            </section>
        </div>

        <section class="transaction-panel transaction-history-panel" aria-labelledby="transactionHistoryTitle">
            <div class="history-heading">
                <div>
                    <h2 id="transactionHistoryTitle">Riwayat transaksi</h2>
                    <p id="historyResultCount" role="status"></p>
                </div>
            </div>
            <div class="history-filters">
                <div class="segmented-control history-type-filter" role="group" aria-label="Filter jenis transaksi">
                    <button type="button" class="is-active" data-history-type="all" aria-pressed="true">Semua</button>
                    <button type="button" data-history-type="income" aria-pressed="false">Pemasukan</button>
                    <button type="button" data-history-type="expense" aria-pressed="false">Pengeluaran</button>
                </div>
                <label class="visually-hidden" for="historyCategoryFilter">Filter kategori</label>
                <select id="historyCategoryFilter" class="history-category-filter">
                    <option value="all">Semua kategori</option>
                </select>
            </div>
            <div class="transaction-history-list" id="transactionHistory"></div>
            <div class="transaction-pagination" id="transactionPagination" hidden>
                <p class="transaction-pagination-summary" id="historyPaginationSummary" role="status"></p>
                <nav class="transaction-pagination-controls" aria-label="Navigasi halaman riwayat transaksi">
                    <button id="historyPreviousPage" type="button">Sebelumnya</button>
                    <span id="historyPageLabel" aria-live="polite">Halaman 1 dari 1</span>
                    <button id="historyNextPage" type="button">Selanjutnya</button>
                </nav>
            </div>
            <div class="history-empty-state" id="historyEmptyState" role="status" hidden>
                <h3>Tidak ada transaksi</h3>
                <p>Tidak ada transaksi yang cocok dengan filter ini.</p>
                <button class="text-action-button" id="resetHistoryFilter" type="button">Reset filter</button>
            </div>
        </section>
    </div>

    <div class="transaction-calendar" id="transactionCalendar" role="dialog" aria-label="Pilih tanggal" hidden>
        <div class="transaction-calendar-header">
            <button class="transaction-calendar-month-button" id="calendarPreviousMonth" type="button" aria-label="Bulan sebelumnya">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"></path></svg>
            </button>
            <h2 id="calendarMonthLabel"></h2>
            <button class="transaction-calendar-month-button" id="calendarNextMonth" type="button" aria-label="Bulan berikutnya">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"></path></svg>
            </button>
        </div>
        <div class="transaction-calendar-grid" id="transactionCalendarGrid" role="group" aria-label="Tanggal"></div>
        <div class="transaction-calendar-footer">
            <button id="calendarToday" type="button">Hari ini</button>
            <button id="calendarAllDates" type="button" hidden>Semua tanggal</button>
            <button id="calendarClose" type="button">Tutup</button>
        </div>
    </div>

    <div class="transaction-detail-scrim" id="transactionDetailScrim" hidden></div>
    <aside class="transaction-detail-panel" id="transactionDetailPanel" role="dialog" aria-modal="true" aria-labelledby="detailTitle" hidden>
        <header class="transaction-detail-header">
            <h2>Detail transaksi</h2>
            <button class="icon-close-button" id="closeTransactionDetail" type="button" aria-label="Tutup detail transaksi">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"></path></svg>
            </button>
        </header>
        <div class="transaction-detail-content">
            <span class="transaction-type-pill" id="detailType"></span>
            <h3 id="detailTitle"></h3>
            <p class="transaction-detail-amount" id="detailAmount"></p>
            <dl class="transaction-detail-fields">
                <div><dt>Kategori</dt><dd id="detailCategory"></dd></div>
                <div class="detail-date-row"><dt>Tanggal</dt><dd><span id="detailDate"></span><button id="editTransactionDate" type="button">Ubah tanggal</button></dd></div>
                <div><dt>Waktu</dt><dd id="detailTime"></dd></div>
                <div><dt>ID transaksi</dt><dd id="detailId"></dd></div>
            </dl>
            <button class="delete-transaction-button" id="showDeleteConfirmation" type="button">Hapus transaksi</button>
            <div class="delete-confirmation" id="deleteConfirmation" role="alert" hidden>
                <p>Hapus transaksi ini? Tindakan ini tidak bisa dibatalkan.</p>
                <div>
                    <button class="confirm-delete-button" id="confirmDeleteTransaction" type="button">Ya, hapus</button>
                    <button class="cancel-delete-button" id="cancelDeleteTransaction" type="button">Batal</button>
                </div>
            </div>
        </div>
    </aside>
</div>

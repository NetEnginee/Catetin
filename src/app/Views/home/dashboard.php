<div class="dashboard">
    <div class="dashboard-heading">
        <div>
            <h1>Dashboard</h1>
            <p class="dashboard-date-summary" id="dashboardDateSummary"></p>
        </div>
        <div class="date-picker">
            <button
                class="date-picker-trigger"
                id="datePickerTrigger"
                type="button"
                aria-haspopup="dialog"
                aria-expanded="false"
                aria-controls="calendarPopover">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="3" y="5" width="18" height="16" rx="2"></rect>
                    <path d="M16 3v4M8 3v4M3 10h18"></path>
                </svg>
                <span id="selectedDateLabel">19 November 2026</span>
                <svg class="chevron-icon" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="m6 9 6 6 6-6"></path>
                </svg>
            </button>
            <section
                class="calendar-popover"
                id="calendarPopover"
                role="dialog"
                aria-label="Pilih tanggal"
                hidden>
                <div class="calendar-header">
                    <button class="calendar-month-button" id="previousMonth" type="button" aria-label="Bulan sebelumnya">
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="m15 18-6-6 6-6"></path>
                        </svg>
                    </button>
                    <h2 id="calendarMonthLabel"></h2>
                    <button class="calendar-month-button" id="nextMonth" type="button" aria-label="Bulan berikutnya">
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="m9 18 6-6-6-6"></path>
                        </svg>
                    </button>
                </div>
                <div class="calendar-grid" id="calendarGrid" role="group" aria-label="Tanggal"></div>
                <div class="calendar-footer">
                    <button id="calendarToday" type="button">Hari ini</button>
                    <button id="calendarClose" type="button">Tutup</button>
                </div>
            </section>
        </div>
    </div>

    <section class="summary-cards" aria-label="Ringkasan keuangan">
        <article class="summary-card">
            <h2>Total Penjualan</h2>
            <p class="summary-value" id="salesValue"></p>
            <div class="summary-card-footer">
                <p class="summary-trend" id="salesTrend"></p>
                <svg class="sparkline" id="salesSparkline" viewBox="0 0 120 40" role="img"></svg>
            </div>
        </article>
        <article class="summary-card">
            <h2>Total Pengeluaran</h2>
            <p class="summary-value" id="expenseValue"></p>
            <div class="summary-card-footer">
                <p class="summary-trend" id="expenseTrend"></p>
                <svg class="sparkline" id="expenseSparkline" viewBox="0 0 120 40" role="img"></svg>
            </div>
        </article>
        <article class="summary-card summary-card-dark">
            <h2>Estimasi keuntungan</h2>
            <p class="summary-value" id="profitValue"></p>
            <div class="summary-card-footer">
                <div>
                    <p class="summary-trend" id="profitTrend"></p>
                </div>
                <svg class="sparkline" id="profitSparkline" viewBox="0 0 120 40" role="img"></svg>
            </div>
        </article>
    </section>

    <div class="dashboard-panels">
        <section class="dashboard-panel chart-panel" aria-labelledby="chartTitle">
            <header class="panel-heading">
                <h2 id="chartTitle">Penjualan dan pengeluaran</h2>
                <p class="chart-subtitle">Kumulatif sejak produk dijual. Selisih kedua garis adalah estimasi keuntungan.</p>
            </header>
            <div class="chart-legend" id="chartLegend" aria-label="Legenda grafik" hidden>
                <span><i class="legend-line legend-sales" aria-hidden="true"></i>Penjualan</span>
                <span><i class="legend-line legend-expenses" aria-hidden="true"></i>Pengeluaran</span>
            </div>
            <div class="chart-empty-state" id="chartEmptyState">
                <svg class="empty-chart-illustration" viewBox="0 0 168 104" aria-hidden="true">
                    <rect x="1" y="1" width="166" height="102" rx="14" fill="#F7F6F2" stroke="#E1E0D9"></rect>
                    <path d="M24 20v60h122" fill="none" stroke="#C3C2B7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                    <path d="M32 66h100" fill="none" stroke="#C3C2B7" stroke-width="2" stroke-linecap="round" stroke-dasharray="2 8"></path>
                    <circle cx="138" cy="66" r="4" fill="#FCFCFB" stroke="#C3C2B7" stroke-width="2"></circle>
                </svg>
                <h3>Belum ada transaksi</h3>
                <p id="chartEmptyDescription"></p>
                <div class="empty-state-actions">
                    <a class="primary-action" href="/transactions">Catat transaksi</a>
                    <button class="secondary-action" id="returnToToday" type="button" hidden>Ke hari ini</button>
                </div>
            </div>
            <div class="chart-canvas" id="chartCanvas" hidden>
                <svg class="chart-svg chart-svg-desktop" id="desktopChart" viewBox="0 0 720 320" role="img"></svg>
                <svg class="chart-svg chart-svg-mobile" id="mobileChart" viewBox="0 0 308 216" role="img"></svg>
                <div class="chart-tooltip" id="chartTooltip" role="status" aria-live="polite" hidden></div>
            </div>
        </section>

        <section class="dashboard-panel category-panel" aria-labelledby="categoryTitle">
            <header class="panel-heading">
                <h2 id="categoryTitle">Pengeluaran per kategori</h2>
                <p id="categoryTotal">Total Rp 0 hari ini</p>
            </header>
            <div class="category-empty-state" id="categoryEmptyState">
                <svg viewBox="0 0 280 64" aria-hidden="true" preserveAspectRatio="xMinYMid meet">
                    <rect x="1" y="6" width="200" height="12" rx="4" fill="none" stroke="#C3C2B7" stroke-width="1.5" stroke-dasharray="4 4"></rect>
                    <rect x="1" y="26" width="130" height="12" rx="4" fill="none" stroke="#C3C2B7" stroke-width="1.5" stroke-dasharray="4 4"></rect>
                    <rect x="1" y="46" width="70" height="12" rx="4" fill="none" stroke="#C3C2B7" stroke-width="1.5" stroke-dasharray="4 4"></rect>
                </svg>
                <div>
                    <h3>Belum ada pengeluaran</h3>
                    <p>Rincian per kategori akan muncul di sini setelah pengeluaran dicatat.</p>
                </div>
            </div>
            <ol class="category-list" id="categoryList" hidden></ol>
        </section>
    </div>
</div>
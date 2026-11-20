(() => {
    const today = "2026-11-19";
    const earliestDate = "2026-01-01";
    const weekdays = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
    const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const monthNames = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember",
    ];
    const categoryOptions = {
        income: ["Penjualan langsung", "Titip jual", "Pesanan online", "Pemasukan lain"],
        expense: ["Bahan baku", "Gaji harian", "Sewa dan listrik", "Transportasi", "Lain-lain"],
    };
    const historyPageSize = 10;
    const byId = (id) => document.getElementById(id);
    const app = byId("transactionsApp");
    if (!app) return;

    const state = {
        transactions: [],
        usedTransactionIds: new Set(),
        categories: {
            income: [...categoryOptions.income],
            expense: [...categoryOptions.expense],
        },
        pageDate: today,
        formDate: today,
        formType: "income",
        amountDigits: "",
        description: "",
        selectedCategory: "",
        newCategoryName: "",
        formError: "",
        formSuccess: "",
        categoryError: "",
        historyType: "all",
        historyCategory: "all",
        historyPage: 1,
        historyTotalPages: 1,
        selectedTransactionId: null,
        detailTransactionId: null,
        deleteConfirmation: false,
        calendarTarget: null,
        visibleMonth: new Date(2026, 10, 1),
    };

    const formatDate = (date, withWeekday = false) => {
        const [year, month, day] = date.split("-").map(Number);
        const value = new Date(year, month - 1, day);
        const formatted = `${day} ${monthNames[month - 1]} ${year}`;
        return withWeekday ? `${dayNames[value.getDay()]}, ${formatted}` : formatted;
    };
    const formatDateShort = (date) => {
        const [year, month, day] = date.split("-").map(Number);
        return `${day} ${monthNames[month - 1]}`;
    };
    const formatRupiah = (amount) => `Rp ${new Intl.NumberFormat("id-ID").format(amount)}`;
    const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
    })[character]);
    const byDateAndTime = (left, right) => right.date.localeCompare(left.date) || right.time.localeCompare(left.time);
    const getTransactionsForDate = () => state.pageDate === "all"
        ? [...state.transactions]
        : state.transactions.filter((transaction) => transaction.date === state.pageDate);
    const getPagePeriodLabel = () => {
        if (state.pageDate === "all") return "Semua tanggal";
        const dayLabel = state.pageDate === today ? "Hari ini" : "Tanggal terpilih";
        return `${formatDate(state.pageDate, true)} · ${dayLabel}`;
    };

    function renderSummary() {
        const transactions = getTransactionsForDate();
        const income = transactions.filter((transaction) => transaction.type === "income");
        const expenses = transactions.filter((transaction) => transaction.type === "expense");
        const incomeTotal = income.reduce((sum, transaction) => sum + transaction.amount, 0);
        const expenseTotal = expenses.reduce((sum, transaction) => sum + transaction.amount, 0);
        const balance = incomeTotal - expenseTotal;

        byId("incomeTotal").textContent = formatRupiah(incomeTotal);
        byId("expenseTotal").textContent = formatRupiah(expenseTotal);
        byId("incomeCount").textContent = `${income.length} transaksi`;
        byId("expenseCount").textContent = `${expenses.length} transaksi`;
        byId("balanceTotal").textContent = `${balance < 0 ? "−" : ""}${formatRupiah(Math.abs(balance))}`;
        byId("balanceTotal").classList.toggle("is-negative", balance < 0);
        byId("transactionCount").textContent = `${transactions.length} transaksi`;
    }

    function renderCategoryBreakdown(type, containerId) {
        const container = byId(containerId);
        const transactions = getTransactionsForDate().filter((transaction) => transaction.type === type);
        const totals = new Map();
        transactions.forEach((transaction) => {
            totals.set(transaction.category, (totals.get(transaction.category) || 0) + transaction.amount);
        });
        const categories = [...totals.entries()].filter(([, amount]) => amount > 0);
        const total = categories.reduce((sum, [, amount]) => sum + amount, 0);

        if (total === 0) {
            const label = type === "income" ? "pemasukan" : "pengeluaran";
            container.innerHTML = `<p class="category-breakdown-empty">Belum ada ${label} pada periode ini.</p>`;
            return;
        }

        const maximum = Math.max(...categories.map(([, amount]) => amount));
        container.innerHTML = `<div class="category-breakdown-list">${categories.map(([name, amount]) => {
            const percentage = (amount / total * 100).toFixed(1).replace(".", ",");
            const width = (amount / maximum * 100).toFixed(2);
            return `<div class="category-breakdown-item"><div class="category-breakdown-heading"><span>${escapeHtml(name)}</span><span>${percentage}% · ${formatRupiah(amount)}</span></div><div class="category-breakdown-bar-track"><div class="category-breakdown-bar is-${type}" style="width:${width}%"></div></div></div>`;
        }).join("")}</div>`;
    }

    function setHistoryTypeButtons() {
        document.querySelectorAll("[data-history-type]").forEach((button) => {
            const active = button.dataset.historyType === state.historyType;
            button.classList.toggle("is-active", active);
            button.setAttribute("aria-pressed", String(active));
        });
    }

    function renderHistoryCategoryOptions() {
        const select = byId("historyCategoryFilter");
        const previous = state.historyCategory;
        const available = state.historyType === "all"
            ? [...new Set([...state.categories.income, ...state.categories.expense])]
            : state.categories[state.historyType];
        if (previous !== "all" && !available.includes(previous)) state.historyCategory = "all";
        select.innerHTML = '<option value="all">Semua kategori</option>' +
            available.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join("");
        select.value = state.historyCategory;
    }

    function renderHistory() {
        setHistoryTypeButtons();
        renderHistoryCategoryOptions();

        const periodTransactions = getTransactionsForDate();
        const filtered = periodTransactions
            .filter((transaction) => state.historyType === "all" || transaction.type === state.historyType)
            .filter((transaction) => state.historyCategory === "all" || transaction.category === state.historyCategory)
            .sort(byDateAndTime);
        byId("historyResultCount").textContent = `${filtered.length} transaksi`;

        const totalPages = Math.ceil(filtered.length / historyPageSize);
        state.historyTotalPages = totalPages;
        state.historyPage = Math.min(state.historyPage, Math.max(totalPages, 1));
        const startIndex = (state.historyPage - 1) * historyPageSize;
        const pageTransactions = filtered.slice(startIndex, startIndex + historyPageSize);
        const pagination = byId("transactionPagination");
        pagination.hidden = totalPages <= 1;
        byId("historyPaginationSummary").textContent = filtered.length
            ? `Menampilkan ${startIndex + 1}-${Math.min(startIndex + historyPageSize, filtered.length)} dari ${filtered.length} transaksi`
            : "Tidak ada transaksi";
        byId("historyPageLabel").textContent = `Halaman ${state.historyPage} dari ${Math.max(totalPages, 1)}`;
        byId("historyPreviousPage").disabled = state.historyPage <= 1;
        byId("historyNextPage").disabled = state.historyPage >= totalPages;

        const list = byId("transactionHistory");
        const emptyState = byId("historyEmptyState");
        if (filtered.length === 0) {
            list.hidden = true;
            emptyState.hidden = false;
            return;
        }
        list.hidden = false;
        emptyState.hidden = true;

        const groups = new Map();
        const groupCounts = new Map();
        filtered.forEach((transaction) => {
            groupCounts.set(transaction.date, (groupCounts.get(transaction.date) || 0) + 1);
        });
        pageTransactions.forEach((transaction) => {
            if (!groups.has(transaction.date)) groups.set(transaction.date, []);
            groups.get(transaction.date).push(transaction);
        });
        list.innerHTML = [...groups.entries()].map(([date, transactions]) => {
            const heading = `${formatDate(date, true)}${date === today ? " · Hari ini" : ""}`;
            const rows = transactions.map((transaction) => {
                const income = transaction.type === "income";
                const sign = income ? "+" : "−";
                const icon = income
                    ? '<path d="M12 19V5M6 11l6-6 6 6"></path>'
                    : '<path d="M12 5v14m6-6-6 6-6-6"></path>';
                const selected = transaction.id === state.selectedTransactionId;
                return `<button class="transaction-row${selected ? " is-selected" : ""}" type="button" data-transaction-id="${escapeHtml(transaction.id)}" aria-pressed="${selected}"><span class="transaction-type-icon is-${transaction.type}" aria-hidden="true"><svg viewBox="0 0 24 24">${icon}</svg></span><span class="transaction-row-main"><span class="transaction-row-description">${escapeHtml(transaction.description)}</span><span class="transaction-row-meta">${escapeHtml(transaction.category)} · ${escapeHtml(transaction.time)} WIB</span></span><span class="transaction-row-amount${income ? " is-income" : ""}">${sign}${formatRupiah(transaction.amount)}</span></button>`;
            }).join("");
            return `<div class="transaction-date-group"><div class="transaction-date-group-heading"><span>${heading}</span><span>${groupCounts.get(date)} transaksi</span></div>${rows}</div>`;
        }).join("");
    }

    function renderPage() {
        byId("periodLabel").textContent = state.pageDate === "all" ? "Semua tanggal" : formatDate(state.pageDate);
        byId("periodSummary").textContent = getPagePeriodLabel();
        renderSummary();
        renderCategoryBreakdown("income", "incomeCategories");
        renderCategoryBreakdown("expense", "expenseCategories");
        renderHistory();
    }

    function renderFormDate() {
        byId("formDateLabel").textContent = `${formatDate(state.formDate)}${state.formDate === today ? " · Hari ini" : ""}`;
    }

    function renderCategoryOptions() {
        const container = byId("categoryOptions");
        container.innerHTML = state.categories[state.formType].map((category) => {
            const selected = state.selectedCategory === category;
            return `<button class="category-chip${selected ? " is-active" : ""}" type="button" data-form-category="${escapeHtml(category)}" aria-pressed="${selected}">${escapeHtml(category)}</button>`;
        }).join("") + '<button class="add-category-chip" id="toggleNewCategory" type="button" aria-expanded="false">+ Kategori</button>';
        byId("saveTransactionButton").textContent = `Simpan ${state.formType === "income" ? "pemasukan" : "pengeluaran"}`;
    }

    function renderCalendar() {
        const year = state.visibleMonth.getFullYear();
        const month = state.visibleMonth.getMonth();
        byId("calendarMonthLabel").textContent = `${monthNames[month]} ${year}`;
        const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const selectedDate = state.calendarTarget.kind === "filter"
            ? (state.pageDate === "all" ? today : state.pageDate)
            : state.calendarTarget.kind === "form"
                ? state.formDate
                : findTransaction(state.detailTransactionId)?.date || today;
        const cells = weekdays.map((day) => `<span class="transaction-calendar-weekday" aria-hidden="true">${day}</span>`);

        for (let index = 0; index < firstWeekday; index += 1) {
            cells.push('<span class="transaction-calendar-day is-outside" aria-hidden="true"></span>');
        }
        for (let day = 1; day <= daysInMonth; day += 1) {
            const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const isSelected = date === selectedDate;
            const isToday = date === today;
            const disabled = date < earliestDate || date > today;
            const label = `${formatDate(date)}${isToday ? ", hari ini" : ""}`;
            cells.push(`<button class="transaction-calendar-day${isSelected ? " is-selected" : ""}${isToday ? " is-today" : ""}" type="button" data-calendar-date="${date}" aria-label="${label}" aria-pressed="${isSelected}"${disabled ? " disabled" : ""}>${day}</button>`);
        }
        const cellCount = firstWeekday + daysInMonth;
        const trailingCells = (7 - cellCount % 7) % 7;
        for (let index = 0; index < trailingCells; index += 1) {
            cells.push('<span class="transaction-calendar-day is-outside" aria-hidden="true"></span>');
        }
        byId("transactionCalendarGrid").innerHTML = cells.join("");
        byId("calendarPreviousMonth").disabled = year === 2026 && month === 0;
        byId("calendarNextMonth").disabled = year === 2026 && month === 10;
        byId("calendarAllDates").hidden = state.calendarTarget.kind !== "filter";
    }

    function positionCalendar() {
        if (!state.calendarTarget || byId("transactionCalendar").hidden) return;
        const calendar = byId("transactionCalendar");
        const anchor = state.calendarTarget.anchor;
        const rect = anchor.getBoundingClientRect();
        const width = Math.min(352, window.innerWidth - 32);
        calendar.style.width = `${width}px`;
        const left = Math.max(16, Math.min(rect.left, window.innerWidth - width - 16));
        const measuredHeight = calendar.getBoundingClientRect().height;
        const belowSpace = window.innerHeight - rect.bottom;
        const openUp = belowSpace < measuredHeight + 8 && rect.top > measuredHeight + 8;
        const top = openUp ? rect.top - measuredHeight - 8 : Math.min(rect.bottom + 8, window.innerHeight - measuredHeight - 16);
        calendar.style.left = `${left}px`;
        calendar.style.top = `${Math.max(16, top)}px`;
    }

    function openCalendar(kind, anchor) {
        closeCalendar();
        state.calendarTarget = { kind, anchor };
        const targetDate = kind === "filter"
            ? (state.pageDate === "all" ? today : state.pageDate)
            : kind === "form"
                ? state.formDate
                : findTransaction(state.detailTransactionId)?.date || today;
        const [year, month] = targetDate.split("-").map(Number);
        state.visibleMonth = new Date(year, month - 1, 1);
        anchor.setAttribute("aria-expanded", "true");
        renderCalendar();
        const calendar = byId("transactionCalendar");
        calendar.hidden = false;
        if (kind === "form" && window.innerWidth <= 700) {
            const rect = anchor.getBoundingClientRect();
            if (window.innerHeight - rect.bottom < calendar.getBoundingClientRect().height + 8) {
                anchor.scrollIntoView({ block: "end", behavior: "auto" });
                const mobileTabBar = document.querySelector(".mobile-tab-bar");
                const bottomInset = mobileTabBar ? mobileTabBar.getBoundingClientRect().height + 16 : 16;
                window.scrollBy({ top: bottomInset, behavior: "auto" });
            }
        }
        positionCalendar();
        const selected = calendar.querySelector(".transaction-calendar-day.is-selected");
        if (selected) selected.focus();
    }

    function closeCalendar(returnFocus = false) {
        const target = state.calendarTarget;
        const calendar = byId("transactionCalendar");
        if (calendar) calendar.hidden = true;
        if (target?.anchor) target.anchor.setAttribute("aria-expanded", "false");
        state.calendarTarget = null;
        if (returnFocus && target?.anchor?.isConnected) target.anchor.focus();
    }

    function findTransaction(id) {
        return state.transactions.find((transaction) => transaction.id === id);
    }

    function applyCalendarDate(date) {
        if (!state.calendarTarget) return;
        const target = state.calendarTarget.kind;
        if (target === "filter") {
            state.pageDate = date;
            state.historyPage = 1;
            renderPage();
        } else if (target === "form") {
            state.formDate = date;
            clearFormFeedback();
            renderFormDate();
        } else {
            const transaction = findTransaction(state.detailTransactionId);
            if (transaction) {
                transaction.date = date;
                renderPage();
                renderTransactionDetail(transaction);
            }
        }
        closeCalendar(true);
    }

    function renderTransactionDetail(transaction) {
        const income = transaction.type === "income";
        byId("detailType").textContent = income ? "Pemasukan" : "Pengeluaran";
        byId("detailType").className = `transaction-type-pill is-${transaction.type}`;
        byId("detailTitle").textContent = transaction.description;
        byId("detailAmount").textContent = `${income ? "+" : "−"}${formatRupiah(transaction.amount)}`;
        byId("detailAmount").className = `transaction-detail-amount${income ? " is-income" : ""}${!income ? " is-negative" : ""}`;
        byId("detailCategory").textContent = transaction.category;
        byId("detailDate").textContent = formatDate(transaction.date);
        byId("detailTime").textContent = `${transaction.time} WIB`;
        byId("detailId").textContent = transaction.id;
    }

    function openTransactionDetail(id) {
        const transaction = findTransaction(id);
        if (!transaction) return;
        state.detailTransactionId = id;
        state.selectedTransactionId = id;
        renderHistory();
        renderTransactionDetail(transaction);
        state.deleteConfirmation = false;
        byId("deleteConfirmation").hidden = true;
        byId("showDeleteConfirmation").hidden = false;
        byId("transactionDetailScrim").hidden = false;
        byId("transactionDetailPanel").hidden = false;
        document.body.classList.add("has-transaction-overlay");
        byId("closeTransactionDetail").focus();
    }

    function closeTransactionDetail(restoreFocus = true) {
        if (!byId("transactionDetailPanel").hidden) {
            byId("transactionDetailPanel").hidden = true;
            byId("transactionDetailScrim").hidden = true;
            document.body.classList.remove("has-transaction-overlay");
        }
        state.detailTransactionId = null;
        state.deleteConfirmation = false;
        byId("deleteConfirmation").hidden = true;
        byId("showDeleteConfirmation").hidden = false;
        if (restoreFocus) {
            const selectedRow = document.querySelector(`.transaction-row[data-transaction-id="${CSS.escape(state.selectedTransactionId || "")}"]`);
            if (selectedRow) selectedRow.focus();
            else byId("transactionHistoryTitle").focus();
        }
    }

    function clearFormFeedback() {
        state.formError = "";
        state.formSuccess = "";
        byId("transactionFormError").hidden = true;
        byId("transactionFormSuccess").hidden = true;
    }

    function showFormError(message) {
        state.formError = message;
        state.formSuccess = "";
        byId("transactionFormError").textContent = message;
        byId("transactionFormError").hidden = false;
        byId("transactionFormSuccess").hidden = true;
    }

    function generateTransactionId(date) {
        const prefix = `TRX-${date.replaceAll("-", "")}-`;
        let next = 1;
        for (const id of state.usedTransactionIds) {
            if (id.startsWith(prefix)) {
                next = Math.max(next, (Number(id.slice(prefix.length)) || 0) + 1);
            }
        }
        let id = `${prefix}${String(next).padStart(3, "0")}`;
        while (state.usedTransactionIds.has(id)) {
            next += 1;
            id = `${prefix}${String(next).padStart(3, "0")}`;
        }
        state.usedTransactionIds.add(id);
        return id;
    }

    function currentTime() {
        return new Intl.DateTimeFormat("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
            hourCycle: "h23",
            timeZone: "Asia/Jakarta",
        }).format(new Date()).replace(":", ".");
    }

    function saveTransaction(event) {
        event.preventDefault();
        clearFormFeedback();
        const amount = Number(state.amountDigits);
        if (!amount || amount <= 0) {
            showFormError("Masukkan nominal lebih dari Rp 0.");
            byId("transactionAmount").focus();
            return;
        }
        if (!state.selectedCategory) {
            showFormError("Pilih kategori transaksi.");
            byId("categoryOptions").querySelector("button")?.focus();
            return;
        }

        const category = state.selectedCategory;
        const transaction = {
            id: generateTransactionId(state.formDate),
            date: state.formDate,
            time: currentTime(),
            type: state.formType,
            category,
            description: state.description.trim() || category,
            amount,
        };
        state.transactions.push(transaction);
        state.historyPage = 1;
        state.amountDigits = "";
        state.description = "";
        byId("transactionAmount").value = "";
        byId("transactionDescription").value = "";
        renderPage();
        state.formSuccess = `${state.formType === "income" ? "Pemasukan" : "Pengeluaran"} ${formatRupiah(amount)} tersimpan pada ${formatDate(transaction.date)}.`;
        byId("transactionFormSuccess").textContent = state.formSuccess;
        byId("transactionFormSuccess").hidden = false;
        byId("transactionAmount").focus();
    }

    function addNewCategory() {
        state.categoryError = "";
        byId("categoryFeedback").hidden = true;
        const name = state.newCategoryName.trim();
        if (!name) {
            showCategoryError("Masukkan nama kategori.");
            byId("newCategoryName").focus();
            return;
        }
        const duplicate = state.categories[state.formType]
            .some((category) => category.localeCompare(name, "id", { sensitivity: "base" }) === 0);
        if (duplicate) {
            showCategoryError("Kategori tersebut sudah ada.");
            byId("newCategoryName").focus();
            return;
        }
        state.categories[state.formType].push(name);
        state.selectedCategory = name;
        state.newCategoryName = "";
        state.categoryError = "";
        clearFormFeedback();
        byId("newCategoryName").value = "";
        byId("newCategoryControl").hidden = true;
        renderCategoryOptions();
        byId("categoryOptions").querySelector(`[data-form-category="${CSS.escape(name)}"]`)?.focus();
        renderHistoryCategoryOptions();
    }

    function showCategoryError(message) {
        state.categoryError = message;
        byId("categoryFeedback").textContent = message;
        byId("categoryFeedback").hidden = false;
    }

    function resetHistoryFilters() {
        state.historyType = "all";
        state.historyCategory = "all";
        state.historyPage = 1;
        renderHistory();
    }

    byId("transactionForm").addEventListener("submit", saveTransaction);
    byId("transactionAmount").addEventListener("input", (event) => {
        const digits = event.target.value.replace(/\D/g, "").slice(0, 11);
        state.amountDigits = digits;
        event.target.value = digits ? new Intl.NumberFormat("id-ID").format(Number(digits)) : "";
        clearFormFeedback();
    });
    byId("transactionDescription").addEventListener("input", (event) => {
        state.description = event.target.value;
        clearFormFeedback();
    });
    byId("categoryOptions").addEventListener("click", (event) => {
        const categoryButton = event.target.closest("[data-form-category]");
        if (categoryButton) {
            state.selectedCategory = categoryButton.dataset.formCategory;
            clearFormFeedback();
            state.categoryError = "";
            byId("categoryFeedback").hidden = true;
            renderCategoryOptions();
            byId("categoryOptions").querySelector(`[data-form-category="${CSS.escape(state.selectedCategory)}"]`)?.focus();
            return;
        }
        if (event.target.closest("#toggleNewCategory")) {
            const control = byId("newCategoryControl");
            control.hidden = !control.hidden;
            byId("categoryOptions").querySelector("#toggleNewCategory")?.setAttribute("aria-expanded", String(!control.hidden));
            if (!control.hidden) byId("newCategoryName").focus();
            else {
                state.newCategoryName = "";
                byId("newCategoryName").value = "";
            }
        }
    });
    byId("addCategoryButton").addEventListener("click", addNewCategory);
    byId("newCategoryName").addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            addNewCategory();
        }
    });
    byId("newCategoryName").addEventListener("input", (event) => {
        state.newCategoryName = event.target.value;
        state.categoryError = "";
        byId("categoryFeedback").hidden = true;
    });
    document.querySelectorAll("[data-transaction-type]").forEach((button) => {
        button.addEventListener("click", () => {
            state.formType = button.dataset.transactionType;
            state.selectedCategory = "";
            state.newCategoryName = "";
            clearFormFeedback();
            state.categoryError = "";
            byId("categoryFeedback").hidden = true;
            byId("newCategoryControl").hidden = true;
            byId("newCategoryName").value = "";
            document.querySelectorAll("[data-transaction-type]").forEach((choice) => {
                const active = choice === button;
                choice.classList.toggle("is-active", active);
                choice.setAttribute("aria-pressed", String(active));
            });
            renderCategoryOptions();
        });
    });

    byId("periodTrigger").addEventListener("click", (event) => openCalendar("filter", event.currentTarget));
    byId("formDateTrigger").addEventListener("click", (event) => openCalendar("form", event.currentTarget));
    byId("editTransactionDate").addEventListener("click", (event) => openCalendar("detail", event.currentTarget));
    byId("calendarPreviousMonth").addEventListener("click", () => {
        state.visibleMonth = new Date(state.visibleMonth.getFullYear(), state.visibleMonth.getMonth() - 1, 1);
        renderCalendar();
        (byId("transactionCalendarGrid").querySelector(".is-selected:not(:disabled)") ||
            byId("transactionCalendarGrid").querySelector("button:not(:disabled)"))?.focus();
    });
    byId("calendarNextMonth").addEventListener("click", () => {
        state.visibleMonth = new Date(state.visibleMonth.getFullYear(), state.visibleMonth.getMonth() + 1, 1);
        renderCalendar();
        (byId("transactionCalendarGrid").querySelector(".is-selected:not(:disabled)") ||
            byId("transactionCalendarGrid").querySelector("button:not(:disabled)"))?.focus();
    });
    byId("transactionCalendarGrid").addEventListener("click", (event) => {
        const dayButton = event.target.closest("[data-calendar-date]");
        if (!dayButton || dayButton.disabled) return;
        applyCalendarDate(dayButton.dataset.calendarDate);
    });
    byId("calendarToday").addEventListener("click", () => applyCalendarDate(today));
    byId("calendarAllDates").addEventListener("click", () => {
        if (state.calendarTarget?.kind !== "filter") return;
        state.pageDate = "all";
        state.historyPage = 1;
        renderPage();
        closeCalendar(true);
    });
    byId("calendarClose").addEventListener("click", () => closeCalendar(true));
    window.addEventListener("resize", positionCalendar);
    window.addEventListener("scroll", positionCalendar, true);

    byId("historyCategoryFilter").addEventListener("change", (event) => {
        state.historyCategory = event.target.value;
        state.historyPage = 1;
        renderHistory();
    });
    document.querySelectorAll("[data-history-type]").forEach((button) => {
        button.addEventListener("click", () => {
            state.historyType = button.dataset.historyType;
            state.historyCategory = "all";
            state.historyPage = 1;
            renderHistory();
        });
    });
    byId("historyPreviousPage").addEventListener("click", () => {
        if (state.historyPage <= 1) return;
        state.historyPage -= 1;
        renderHistory();
    });
    byId("historyNextPage").addEventListener("click", () => {
        if (state.historyPage >= state.historyTotalPages) return;
        state.historyPage += 1;
        renderHistory();
    });
    byId("resetHistoryFilter").addEventListener("click", resetHistoryFilters);
    byId("transactionHistory").addEventListener("click", (event) => {
        const row = event.target.closest("[data-transaction-id]");
        if (row) openTransactionDetail(row.dataset.transactionId);
    });

    byId("closeTransactionDetail").addEventListener("click", () => closeTransactionDetail());
    byId("transactionDetailScrim").addEventListener("click", () => {
        if (state.calendarTarget) {
            closeCalendar();
            return;
        }
        if (byId("deleteConfirmation").hidden) closeTransactionDetail();
    });
    byId("showDeleteConfirmation").addEventListener("click", () => {
        state.deleteConfirmation = true;
        byId("deleteConfirmation").hidden = false;
        byId("showDeleteConfirmation").hidden = true;
        byId("cancelDeleteTransaction").focus();
    });
    byId("cancelDeleteTransaction").addEventListener("click", () => {
        state.deleteConfirmation = false;
        byId("deleteConfirmation").hidden = true;
        byId("showDeleteConfirmation").hidden = false;
        byId("showDeleteConfirmation").focus();
    });
    byId("confirmDeleteTransaction").addEventListener("click", () => {
        const id = state.detailTransactionId;
        state.transactions = state.transactions.filter((transaction) => transaction.id !== id);
        state.deleteConfirmation = false;
        closeCalendar();
        closeTransactionDetail(false);
        state.selectedTransactionId = null;
        renderPage();
        byId("transactionHistoryTitle").setAttribute("tabindex", "-1");
        byId("transactionHistoryTitle").focus();
    });

    document.addEventListener("pointerdown", (event) => {
        if (!state.calendarTarget) return;
        const anchor = state.calendarTarget.anchor;
        if (!byId("transactionCalendar").contains(event.target) && !anchor.contains(event.target)) {
            closeCalendar();
        }
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Tab" && !byId("transactionDetailPanel").hidden && !state.calendarTarget) {
            const focusable = [...byId("transactionDetailPanel").querySelectorAll(
                'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
            )].filter((element) => element.getClientRects().length > 0);
            if (focusable.length) {
                const first = focusable[0];
                const last = focusable[focusable.length - 1];
                if (event.shiftKey && (document.activeElement === first || !byId("transactionDetailPanel").contains(document.activeElement))) {
                    event.preventDefault();
                    last.focus();
                } else if (!event.shiftKey && (document.activeElement === last || !byId("transactionDetailPanel").contains(document.activeElement))) {
                    event.preventDefault();
                    first.focus();
                }
            }
            return;
        }
        if (event.key !== "Escape") return;
        if (state.calendarTarget) {
            closeCalendar(true);
            return;
        }
        if (!byId("transactionDetailPanel").hidden) {
            if (state.deleteConfirmation) {
                byId("cancelDeleteTransaction").click();
            } else {
                closeTransactionDetail();
            }
            return;
        }
        if (!byId("accountMenu").hidden) {
            byId("accountMenu").hidden = true;
            byId("accountButton").setAttribute("aria-expanded", "false");
            byId("accountButton").focus();
        }
    });

    renderCategoryOptions();
    renderFormDate();
    renderPage();
})();

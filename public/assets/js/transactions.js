(() => {
    const byId = (id) => document.getElementById(id);
    const app = byId("transactionsApp");
    if (!app) return;

    const weekdays = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
    const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const monthNames = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember",
    ];
    const historyPageSize = 10;
    const csrfMeta = document.querySelector('meta[name="csrf-token"]');

    let today = "";
    let earliestDate = "";

    const state = {
        transactions: [],
        usedTransactionIds: new Set(),
        categories: { income: [], expense: [] },
        pageDate: null,
        formDate: null,
        formType: "income",
        amountDigits: "",
        description: "",
        selectedCategory: "",
        newCategoryName: "",
        historyType: "all",
        historyCategory: "all",
        historyPage: 1,
        historyTotalPages: 1,
        selectedTransactionId: null,
        detailTransactionId: null,
        deleteConfirmation: false,
        manageCategories: false,
        removeCategoryId: null,
        calendarTarget: null,
        visibleMonth: null,
    };

    const formatDate = (date, withWeekday = false) => {
        const [year, month, day] = date.split("-").map(Number);
        const value = new Date(year, month - 1, day);
        const formatted = `${day} ${monthNames[month - 1]} ${year}`;
        return withWeekday ? `${dayNames[value.getDay()]}, ${formatted}` : formatted;
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

    async function api(path, options = {}) {
        const headers = { Accept: "application/json" };
        let body;
        if (options.body !== undefined) {
            headers["Content-Type"] = "application/json";
            body = JSON.stringify({
                ...options.body,
                _csrf_token: csrfMeta?.getAttribute("content") || "",
            });
        }

        let response;
        try {
            response = await fetch(path, {
                method: options.method || "GET",
                headers,
                body,
                credentials: "same-origin",
            });
        } catch (error) {
            throw new Error("Tidak dapat terhubung ke server. Coba lagi.");
        }

        let payload;
        try {
            payload = await response.json();
        } catch (error) {
            throw new Error("Respons server tidak dapat dibaca.");
        }

        if (!response.ok || payload.ok !== true) {
            throw new Error(payload.error || "Permintaan gagal. Coba lagi.");
        }
        return payload.data;
    }

    function setBusy(isBusy) {
        byId("saveTransactionButton").disabled = isBusy;
        byId("addCategoryButton").disabled = isBusy;
    }

    function resetDeleteButtons() {
        byId("showDeleteConfirmation").disabled = false;
        byId("confirmDeleteTransaction").disabled = false;
        byId("cancelDeleteTransaction").disabled = false;
    }

    function clearFormFeedback() {
        byId("transactionFormError").hidden = true;
        byId("transactionFormSuccess").hidden = true;
    }

    function showFormError(message) {
        byId("transactionFormError").textContent = message;
        byId("transactionFormError").hidden = false;
        byId("transactionFormSuccess").hidden = true;
    }

    function showFormSuccess(message) {
        byId("transactionFormSuccess").textContent = message;
        byId("transactionFormSuccess").hidden = false;
        byId("transactionFormError").hidden = true;
    }

    function showCategoryError(message) {
        byId("categoryFeedback").textContent = message;
        byId("categoryFeedback").hidden = false;
    }

    function showDetailError(message) {
        const node = byId("transactionDetailError");
        if (!node) return;
        node.textContent = message;
        node.hidden = false;
    }

    function clearDetailError() {
        const node = byId("transactionDetailError");
        if (node) node.hidden = true;
    }

    function findCategory(type, name) {
        return state.categories[type].find((category) => category.name === name) || null;
    }

    function applyBootstrap(data) {
        today = data.meta.today;
        earliestDate = data.meta.earliest_date;

        state.categories = {
            income: data.categories.income.map((category) => ({ ...category })),
            expense: data.categories.expense.map((category) => ({ ...category })),
        };
        state.transactions = data.transactions.map((transaction) => ({
            ...transaction,
            apiId: transaction.id,
            id: transaction.display_id,
        }));
        state.usedTransactionIds = new Set(state.transactions.map((transaction) => transaction.display_id));

        if (state.formDate === null || state.formDate < earliestDate || state.formDate > today) {
            state.formDate = today;
        }
        if (state.pageDate === null || (state.pageDate !== "all" && (state.pageDate < earliestDate || state.pageDate > today))) {
            state.pageDate = today;
        }
        if (state.visibleMonth === null) {
            const [year, month] = today.split("-").map(Number);
            state.visibleMonth = new Date(year, month - 1, 1);
        }
        if (state.historyCategory !== "all") {
            const available = state.historyType === "all"
                ? [...state.categories.income, ...state.categories.expense].map((category) => String(category.id))
                : state.categories[state.historyType].map((category) => String(category.id));
            if (!available.includes(state.historyCategory)) state.historyCategory = "all";
        }
    }

    async function loadTransactions() {
        const data = await api("/api/transactions");
        applyBootstrap(data);
        return data;
    }

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

    function setHistoryTypeButtons() {
        document.querySelectorAll("[data-history-type]").forEach((button) => {
            const active = button.dataset.historyType === state.historyType;
            button.classList.toggle("is-active", active);
            button.setAttribute("aria-pressed", String(active));
        });
    }

    function renderHistoryCategoryOptions() {
        const select = byId("historyCategoryFilter");
        const groups = state.historyType === "all"
            ? [
                { label: "Pemasukan", categories: state.categories.income },
                { label: "Pengeluaran", categories: state.categories.expense },
            ]
            : [{ label: null, categories: state.categories[state.historyType] }];

        const available = groups.flatMap((group) => group.categories.map((category) => String(category.id)));
        if (state.historyCategory !== "all" && !available.includes(state.historyCategory)) {
            state.historyCategory = "all";
        }

        let options = '<option value="all">Semua kategori</option>';
        groups.forEach((group) => {
            if (group.categories.length === 0) return;
            const items = group.categories.map((category) =>
                `<option value="${escapeHtml(String(category.id))}">${escapeHtml(category.name)}</option>`
            ).join("");
            options += group.label
                ? `<optgroup label="${group.label}">${items}</optgroup>`
                : items;
        });
        select.innerHTML = options;
        select.value = state.historyCategory;
    }

    function renderHistory() {
        setHistoryTypeButtons();
        renderHistoryCategoryOptions();

        const periodTransactions = getTransactionsForDate();
        const filtered = periodTransactions
            .filter((transaction) => state.historyType === "all" || transaction.type === state.historyType)
            .filter((transaction) => state.historyCategory === "all" || String(transaction.category_id) === state.historyCategory)
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
                return `<button class="transaction-row${selected ? " is-selected" : ""}" type="button" data-transaction-id="${escapeHtml(transaction.display_id)}" aria-pressed="${selected}"><span class="transaction-type-icon is-${transaction.type}" aria-hidden="true"><svg viewBox="0 0 24 24">${icon}</svg></span><span class="transaction-row-main"><span class="transaction-row-description">${escapeHtml(transaction.description)}</span><span class="transaction-row-meta">${escapeHtml(transaction.category)} · ${escapeHtml(transaction.time)} WIB</span></span><span class="transaction-row-amount${income ? " is-income" : ""}">${sign}${formatRupiah(transaction.amount)}</span></button>`;
            }).join("");
            return `<div class="transaction-date-group"><div class="transaction-date-group-heading"><span>${heading}</span><span>${groupCounts.get(date)} transaksi</span></div>${rows}</div>`;
        }).join("");
    }

    function renderPage() {
        byId("periodLabel").textContent = state.pageDate === "all" ? "Semua tanggal" : formatDate(state.pageDate);
        byId("periodSummary").textContent = getPagePeriodLabel();
        renderSummary();
        renderHistory();
    }

    function renderFormDate() {
        byId("formDateLabel").textContent = `${formatDate(state.formDate)}${state.formDate === today ? " · Hari ini" : ""}`;
    }

    function renderCategoryOptions() {
        const container = byId("categoryOptions");
        container.innerHTML = state.categories[state.formType].map((category) => {
            if (state.manageCategories) {
                return `<button class="category-chip is-removable" type="button" data-remove-category="${category.id}" aria-label="Hapus kategori ${escapeHtml(category.name)}">${escapeHtml(category.name)}</button>`;
            }
            const selected = state.selectedCategory === category.name;
            return `<button class="category-chip${selected ? " is-active" : ""}" type="button" data-form-category="${escapeHtml(category.name)}" aria-pressed="${selected}">${escapeHtml(category.name)}</button>`;
        }).join("") + (state.manageCategories
            ? ""
            : '<button class="add-category-chip" id="toggleNewCategory" type="button" aria-expanded="false">+ Kategori</button>');

        const toggle = byId("toggleRemoveCategory");
        toggle.textContent = state.manageCategories ? "Selesai" : "Kelola kategori";
        toggle.setAttribute("aria-pressed", String(state.manageCategories));
        byId("saveTransactionButton").textContent = `Simpan ${state.formType === "income" ? "pemasukan" : "pengeluaran"}`;
    }

    function closeRemoveConfirmation(restoreFocus = false) {
        const chip = state.removeCategoryId === null
            ? null
            : document.querySelector(`[data-remove-category="${CSS.escape(String(state.removeCategoryId))}"]`);
        byId("removeCategoryConfirmation").hidden = true;
        state.removeCategoryId = null;
        if (restoreFocus && chip) chip.focus();
    }

    function setManageCategories(enabled) {
        state.manageCategories = enabled;
        closeRemoveConfirmation();
        byId("newCategoryControl").hidden = true;
        byId("toggleNewCategory")?.setAttribute("aria-expanded", "false");
        byId("categoryFeedback").hidden = true;
        renderCategoryOptions();
    }

    function openRemoveConfirmation(id) {
        const category = state.categories[state.formType].find((item) => item.id === id);
        if (!category) return;
        state.removeCategoryId = id;
        const used = state.transactions.filter((transaction) => transaction.category_id === id).length;
        const fallback = state.formType === "income" ? "Pemasukan lain" : "Lain-lain";
        byId("removeCategoryMessage").textContent =
            `Hapus kategori ${category.name}? ${used} transaksi akan dipindahkan ke ${fallback}.`;
        byId("removeCategoryConfirmation").hidden = false;
        byId("cancelRemoveCategory").focus();
    }

    async function confirmRemoveCategory() {
        if (state.removeCategoryId === null) return;
        const confirmButton = byId("confirmRemoveCategory");
        const cancelButton = byId("cancelRemoveCategory");
        if (confirmButton.disabled || cancelButton.disabled) return;
        confirmButton.disabled = true;
        cancelButton.disabled = true;

        try {
            const result = await api("/api/categories/delete", {
                method: "POST",
                body: { id: state.removeCategoryId },
            });
            await loadTransactions();
            if (state.selectedCategory && !findCategory(state.formType, state.selectedCategory)) {
                state.selectedCategory = "";
            }
            setManageCategories(false);
            renderPage();
            byId("categoryFeedback").textContent =
                `Kategori dihapus. ${result.moved} transaksi dipindahkan ke ${result.fallback.name}.`;
            byId("categoryFeedback").hidden = false;
            byId("toggleRemoveCategory").focus();
        } catch (error) {
            byId("categoryFeedback").textContent = error.message;
            byId("categoryFeedback").hidden = false;
        } finally {
            confirmButton.disabled = false;
            cancelButton.disabled = false;
        }
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

        const [minYear, minMonth] = earliestDate.split("-").map(Number);
        const [maxYear, maxMonth] = today.split("-").map(Number);
        byId("calendarPreviousMonth").disabled = year < minYear || (year === minYear && month + 1 < minMonth);
        byId("calendarNextMonth").disabled = year > maxYear || (year === maxYear && month + 1 > maxMonth);
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
        return state.transactions.find((transaction) => transaction.id === id) || null;
    }

    function applyCalendarDate(date) {
        if (!state.calendarTarget) return;
        const target = state.calendarTarget.kind;
        if (target === "filter") {
            state.pageDate = date;
            state.historyPage = 1;
            renderPage();
            closeCalendar(true);
        } else if (target === "form") {
            state.formDate = date;
            clearFormFeedback();
            renderFormDate();
            closeCalendar(true);
        } else {
            void updateDetailDate(date);
        }
    }

    async function updateDetailDate(date) {
        const transaction = findTransaction(state.detailTransactionId);
        if (!transaction) {
            closeCalendar(true);
            return;
        }
        const displayId = transaction.display_id;
        setBusy(true);
        try {
            await api("/api/transactions/update-date", {
                method: "POST",
                body: { id: transaction.apiId, date },
            });
            await loadTransactions();
            const updated = findTransaction(displayId);
            if (updated) {
                state.detailTransactionId = displayId;
                state.selectedTransactionId = displayId;
            }
            renderPage();
            if (updated) renderTransactionDetail(updated);
            closeCalendar(true);
        } catch (error) {
            showDetailError(error.message);
            closeCalendar(true);
        } finally {
            setBusy(false);
        }
    }

    function renderTransactionDetail(transaction) {
        clearDetailError();
        const income = transaction.type === "income";
        byId("detailType").textContent = income ? "Pemasukan" : "Pengeluaran";
        byId("detailType").className = `transaction-type-pill is-${transaction.type}`;
        byId("detailTitle").textContent = transaction.description;
        byId("detailAmount").textContent = `${income ? "+" : "−"}${formatRupiah(transaction.amount)}`;
        byId("detailAmount").className = `transaction-detail-amount${income ? " is-income" : ""}${!income ? " is-negative" : ""}`;
        byId("detailCategory").textContent = transaction.category;
        byId("detailDate").textContent = formatDate(transaction.date);
        byId("detailTime").textContent = `${transaction.time} WIB`;
        byId("detailId").textContent = transaction.display_id;
    }

    function openTransactionDetail(id) {
        const transaction = findTransaction(id);
        if (!transaction) return;
        state.detailTransactionId = id;
        state.selectedTransactionId = id;
        renderHistory();
        renderTransactionDetail(transaction);
        state.deleteConfirmation = false;
        resetDeleteButtons();
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
        resetDeleteButtons();
        byId("deleteConfirmation").hidden = true;
        byId("showDeleteConfirmation").hidden = false;
        clearDetailError();
        if (restoreFocus) {
            const selectedRow = document.querySelector(`.transaction-row[data-transaction-id="${CSS.escape(state.selectedTransactionId || "")}"]`);
            if (selectedRow) selectedRow.focus();
            else byId("transactionHistoryTitle").focus();
        }
    }

    async function saveTransaction(event) {
        event.preventDefault();
        clearFormFeedback();
        const amount = Number(state.amountDigits);
        if (!amount || amount <= 0) {
            showFormError("Masukkan nominal lebih dari Rp 0.");
            byId("transactionAmount").focus();
            return;
        }
        const category = findCategory(state.formType, state.selectedCategory);
        if (!category) {
            showFormError("Pilih kategori transaksi.");
            byId("categoryOptions").querySelector("button")?.focus();
            return;
        }

        setBusy(true);
        try {
            const created = await api("/api/transactions", {
                method: "POST",
                body: {
                    type: state.formType,
                    amount: state.amountDigits,
                    category_id: category.id,
                    description: state.description.trim() || category.name,
                    date: state.formDate,
                },
            });
            await loadTransactions();
            state.historyPage = 1;
            state.amountDigits = "";
            state.description = "";
            byId("transactionAmount").value = "";
            byId("transactionDescription").value = "";
            state.selectedCategory = "";
            renderPage();
            renderCategoryOptions();
            renderFormDate();
            showFormSuccess(`${state.formType === "income" ? "Pemasukan" : "Pengeluaran"} ${formatRupiah(created.amount)} tersimpan pada ${formatDate(created.date)}.`);
            byId("transactionAmount").focus();
        } catch (error) {
            showFormError(error.message);
        } finally {
            setBusy(false);
        }
    }

    async function addNewCategory() {
        const name = state.newCategoryName.trim();
        if (!name) {
            showCategoryError("Masukkan nama kategori.");
            byId("newCategoryName").focus();
            return;
        }
        const duplicate = state.categories[state.formType].some((category) =>
            category.name.localeCompare(name, "id", { sensitivity: "base" }) === 0);
        if (duplicate) {
            showCategoryError("Kategori tersebut sudah ada.");
            byId("newCategoryName").focus();
            return;
        }

        setBusy(true);
        try {
            await api("/api/categories", {
                method: "POST",
                body: { type: state.formType, name },
            });
            await loadTransactions();
            state.selectedCategory = name;
            state.newCategoryName = "";
            byId("newCategoryName").value = "";
            byId("newCategoryControl").hidden = true;
            byId("categoryFeedback").hidden = true;
            clearFormFeedback();
            renderCategoryOptions();
            renderHistoryCategoryOptions();
            byId("categoryOptions").querySelector(`[data-form-category="${CSS.escape(name)}"]`)?.focus();
        } catch (error) {
            showCategoryError(error.message);
        } finally {
            setBusy(false);
        }
    }

    function resetHistoryFilters() {
        state.historyType = "all";
        state.historyCategory = "all";
        state.historyPage = 1;
        renderHistory();
    }

    async function deleteSelectedTransaction() {
        const transaction = findTransaction(state.detailTransactionId);
        if (!transaction) return;
        const confirmButton = byId("confirmDeleteTransaction");
        const cancelButton = byId("cancelDeleteTransaction");
        if (confirmButton.disabled || cancelButton.disabled) return;
        confirmButton.disabled = true;
        cancelButton.disabled = true;
        try {
            await api("/api/transactions/delete", {
                method: "POST",
                body: { id: transaction.apiId },
            });
            await loadTransactions();
            state.deleteConfirmation = false;
            closeCalendar();
            closeTransactionDetail(false);
            state.selectedTransactionId = null;
            renderPage();
            byId("transactionHistoryTitle").setAttribute("tabindex", "-1");
            byId("transactionHistoryTitle").focus();
        } catch (error) {
            showDetailError(error.message);
        } finally {
            confirmButton.disabled = false;
            cancelButton.disabled = false;
        }
    }

    byId("transactionForm").addEventListener("submit", (event) => {
        void saveTransaction(event);
    });
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
        const removeButton = event.target.closest("[data-remove-category]");
        if (removeButton) {
            openRemoveConfirmation(Number(removeButton.dataset.removeCategory));
            return;
        }
        if (state.manageCategories) return;
        const categoryButton = event.target.closest("[data-form-category]");
        if (categoryButton) {
            state.selectedCategory = categoryButton.dataset.formCategory;
            clearFormFeedback();
            byId("categoryFeedback").hidden = true;
            renderCategoryOptions();
            byId("categoryOptions").querySelector(`[data-form-category="${CSS.escape(state.selectedCategory)}"]`)?.focus();
            return;
        }
        if (event.target.closest("#toggleNewCategory")) {
            const control = byId("newCategoryControl");
            control.hidden = !control.hidden;
            byId("toggleNewCategory").setAttribute("aria-expanded", String(!control.hidden));
            if (!control.hidden) byId("newCategoryName").focus();
            else {
                state.newCategoryName = "";
                byId("newCategoryName").value = "";
            }
        }
    });
    byId("toggleRemoveCategory").addEventListener("click", () => {
        setManageCategories(!state.manageCategories);
        if (state.manageCategories) byId("categoryOptions").querySelector("[data-remove-category]")?.focus();
        else byId("toggleRemoveCategory").focus();
    });
    byId("cancelRemoveCategory").addEventListener("click", () => closeRemoveConfirmation(true));
    byId("confirmRemoveCategory").addEventListener("click", () => {
        void confirmRemoveCategory();
    });
    byId("addCategoryButton").addEventListener("click", () => {
        void addNewCategory();
    });
    byId("newCategoryName").addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            void addNewCategory();
        }
    });
    byId("newCategoryName").addEventListener("input", (event) => {
        state.newCategoryName = event.target.value;
        byId("categoryFeedback").hidden = true;
    });
    document.querySelectorAll("[data-transaction-type]").forEach((button) => {
        button.addEventListener("click", () => {
            state.formType = button.dataset.transactionType;
            state.selectedCategory = "";
            state.newCategoryName = "";
            state.manageCategories = false;
            closeRemoveConfirmation();
            clearFormFeedback();
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
        void deleteSelectedTransaction();
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

    async function init() {
        window.CatetinLoader?.hold();
        setBusy(true);
        byId("periodSummary").textContent = "Memuat data transaksi...";
        byId("historyResultCount").textContent = "Memuat...";
        try {
            await loadTransactions();
            renderCategoryOptions();
            renderFormDate();
            renderPage();
        } catch (error) {
            byId("periodSummary").textContent = error.message;
            byId("historyResultCount").textContent = "Data tidak dapat dimuat.";
            showFormError(error.message);
            byId("transactionHistory").hidden = true;
            byId("historyEmptyState").hidden = false;
        } finally {
            setBusy(false);
            window.CatetinLoader?.release();
        }
    }

    void init();
})();

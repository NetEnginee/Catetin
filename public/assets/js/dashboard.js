(() => {
  const today = "2026-11-19";
  const earliestDate = "2026-01-01";
  const dayNames = [
    "Minggu",
    "Senin",
    "Selasa",
    "Rabu",
    "Kamis",
    "Jumat",
    "Sabtu",
  ];
  const monthNames = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];
  const weekdays = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
  const byId = (id) => document.getElementById(id);
  const trigger = byId("datePickerTrigger");
  const calendar = byId("calendarPopover");
  if (!trigger || !calendar) return;

  let selectedDate = today;
  let visibleMonth = new Date(2026, 10, 1);

  const parseDate = (date) => {
    const [year, month, day] = date.split("-").map(Number);
    return new Date(year, month - 1, day);
  };
  const formatDate = (date, includeWeekday = false) => {
    const value = parseDate(date);
    const formatted = `${value.getDate()} ${monthNames[value.getMonth()]} ${value.getFullYear()}`;
    return includeWeekday
      ? `${dayNames[value.getDay()]}, ${formatted}`
      : formatted;
  };
  const formatDateWithoutYear = (date) => {
    const value = parseDate(date);
    return `${value.getDate()} ${monthNames[value.getMonth()]}`;
  };

  function renderSummary() {
    byId("salesValue").textContent = "Rp 0";
    byId("expenseValue").textContent = "Rp 0";
    byId("profitValue").textContent = "Rp 0";
    byId("salesTrend").textContent = "Belum ada transaksi";
    byId("expenseTrend").textContent = "Belum ada transaksi";
    byId("profitTrend").textContent = "Belum ada transaksi";

    makeEmptySparkline(
      byId("salesSparkline"),
      "#2a78d6",
      "#FCFCFB",
      "Belum ada transaksi penjualan",
    );
    makeEmptySparkline(
      byId("expenseSparkline"),
      "#eb6834",
      "#FCFCFB",
      "Belum ada transaksi pengeluaran",
    );
    makeEmptySparkline(
      byId("profitSparkline"),
      "#5EEAD4",
      "#0E1B1A",
      "Belum ada data keuntungan",
    );
  }

  function makeEmptySparkline(svg, color, background, label) {
    svg.setAttribute("aria-label", label);
    svg.innerHTML = `<path d="M4 20H116"></path><circle cx="116" cy="20" r="4" fill="${color}" stroke="${background}" stroke-width="2"></circle>`;
  }

  function renderEmptyState() {
    const formattedDate = formatDateWithoutYear(selectedDate);
    byId("chartEmptyDescription").textContent =
      `Belum ada penjualan atau pengeluaran yang tercatat pada ${formattedDate}. Catat transaksi baru atau pilih tanggal lain.`;
    byId("chartEmptyState").hidden = false;
    byId("chartLegend").hidden = true;
    byId("chartCanvas").hidden = true;
    byId("chartTooltip").hidden = true;
    byId("categoryEmptyState").hidden = false;
    byId("categoryList").hidden = true;
    byId("categoryTotal").textContent =
      selectedDate === today
        ? "Total Rp 0 hari ini"
        : `Total Rp 0 pada ${formattedDate}`;
    byId("returnToToday").hidden = selectedDate === today;
  }

  function renderDashboard() {
    byId("selectedDateLabel").textContent = formatDate(selectedDate);
    byId("dashboardDateSummary").textContent =
      `${formatDate(selectedDate, true)} · Belum ada data`;
    renderSummary();
    renderEmptyState();
  }

  function renderCalendar() {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    byId("calendarMonthLabel").textContent = `${monthNames[month]} ${year}`;

    const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = weekdays.map(
      (day) =>
        `<span class="calendar-weekday" aria-hidden="true">${day}</span>`,
    );

    for (let index = 0; index < firstWeekday; index += 1) {
      cells.push(
        '<span class="calendar-day is-outside" aria-hidden="true"></span>',
      );
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const isToday = date === today;
      const isSelected = date === selectedDate;
      const isUnavailable = date < earliestDate || date > today;
      const ariaLabel = `${formatDate(date)}${isToday ? ", hari ini" : ""}`;
      cells.push(
        `<button class="calendar-day${isToday ? " is-today" : ""}${isSelected ? " is-selected" : ""}" type="button" data-date="${date}" aria-label="${ariaLabel}" aria-pressed="${isSelected}"${isUnavailable ? " disabled" : ""}>${day}</button>`,
      );
    }

    const cellCount = firstWeekday + daysInMonth;
    const trailingCells = (7 - (cellCount % 7)) % 7;
    for (let index = 0; index < trailingCells; index += 1) {
      cells.push(
        '<span class="calendar-day is-outside" aria-hidden="true"></span>',
      );
    }

    byId("calendarGrid").innerHTML = cells.join("");
    byId("previousMonth").disabled = year === 2026 && month === 0;
    byId("nextMonth").disabled = year === 2026 && month === 10;
  }

  function openCalendar() {
    const date = parseDate(selectedDate);
    visibleMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    renderCalendar();
    calendar.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
    const selected = calendar.querySelector(".calendar-day.is-selected");
    if (selected) selected.focus();
  }

  function closeCalendar(returnFocus = false) {
    calendar.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
    if (returnFocus) trigger.focus();
  }

  trigger.addEventListener("click", () => {
    if (calendar.hidden) openCalendar();
    else closeCalendar();
  });
  byId("previousMonth").addEventListener("click", () => {
    visibleMonth = new Date(
      visibleMonth.getFullYear(),
      visibleMonth.getMonth() - 1,
      1,
    );
    renderCalendar();
    const selected = calendar.querySelector(".calendar-day.is-selected");
    if (selected) selected.focus();
  });
  byId("nextMonth").addEventListener("click", () => {
    visibleMonth = new Date(
      visibleMonth.getFullYear(),
      visibleMonth.getMonth() + 1,
      1,
    );
    renderCalendar();
    const selected = calendar.querySelector(".calendar-day.is-selected");
    if (selected) selected.focus();
  });
  byId("calendarGrid").addEventListener("click", (event) => {
    const dayButton = event.target.closest(".calendar-day[data-date]");
    if (!dayButton || dayButton.disabled) return;
    selectedDate = dayButton.dataset.date;
    renderDashboard();
    closeCalendar(true);
  });
  byId("calendarToday").addEventListener("click", () => {
    selectedDate = today;
    renderDashboard();
    closeCalendar(true);
  });
  byId("calendarClose").addEventListener("click", () => closeCalendar(true));
  byId("returnToToday").addEventListener("click", () => {
    selectedDate = today;
    renderDashboard();
  });
  document.addEventListener("pointerdown", (event) => {
    if (!calendar.hidden && !event.target.closest(".date-picker"))
      closeCalendar();
  });

  const accountButton = byId("accountButton");
  const accountMenu = byId("accountMenu");
  accountButton.addEventListener("click", () => {
    const isOpen = accountButton.getAttribute("aria-expanded") === "true";
    accountButton.setAttribute("aria-expanded", String(!isOpen));
    accountMenu.hidden = isOpen;
  });
  document.addEventListener("pointerdown", (event) => {
    if (!event.target.closest(".account-control")) {
      accountMenu.hidden = true;
      accountButton.setAttribute("aria-expanded", "false");
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (!calendar.hidden) closeCalendar(true);
    if (!accountMenu.hidden) {
      accountMenu.hidden = true;
      accountButton.setAttribute("aria-expanded", "false");
      accountButton.focus();
    }
  });

  renderDashboard();
})();

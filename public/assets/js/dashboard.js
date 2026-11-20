(() => {
  const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];
  const weekdays = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
  const byId = (id) => document.getElementById(id);
  const trigger = byId("datePickerTrigger");
  const calendar = byId("calendarPopover");
  if (!trigger || !calendar) return;

  let today = "";
  let earliestDate = "";
  let selectedDate = "";
  let visibleMonth = null;
  let activeChartIndex = null;
  let currentData = null;
  let chartScale = 7000;

  const parseDate = (date) => {
    const [year, month, day] = date.split("-").map(Number);
    return new Date(year, month - 1, day);
  };
  const formatDate = (date, includeWeekday = false) => {
    const value = parseDate(date);
    const formatted = `${value.getDate()} ${monthNames[value.getMonth()]} ${value.getFullYear()}`;
    return includeWeekday ? `${dayNames[value.getDay()]}, ${formatted}` : formatted;
  };
  const formatDateWithoutYear = (date) => {
    const value = parseDate(date);
    return `${value.getDate()} ${monthNames[value.getMonth()]}`;
  };
  const formatRupiah = (amount) => `Rp ${new Intl.NumberFormat("id-ID").format(amount)}`;
  const compactRupiah = (amount) => {
    if (amount >= 1000000000) return `Rp ${(amount / 1000000000).toFixed(1).replace(".", ",")} M`;
    if (amount >= 1000000) return `Rp ${(amount / 1000000).toFixed(1).replace(".", ",")} jt`;
    if (amount >= 1000) return `Rp ${(amount / 1000).toFixed(1).replace(".", ",")} rb`;
    return `Rp ${amount}`;
  };

  async function api(path) {
    let response;
    try {
      response = await fetch(path, { credentials: "same-origin", headers: { Accept: "application/json" } });
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
      throw new Error(payload.error || "Data dashboard tidak dapat dimuat.");
    }
    return payload.data;
  }

  function niceScale(value) {
    if (value <= 0) return 1000;
    const magnitude = 10 ** Math.floor(Math.log10(value));
    for (const step of [1, 2, 2.5, 5, 10]) {
      const candidate = step * magnitude;
      if (candidate >= value) return candidate;
    }
    return 10 * magnitude;
  }

  function makeSparkline(svg, values, color, background, label) {
    let points;
    if (!values || values.length === 0) {
      points = "4,20 116,20";
    } else {
      const min = Math.min(...values);
      const max = Math.max(...values);
      const range = max - min || 1;
      points = values.map((value, index) => {
        const x = 4 + (index * 112) / (values.length - 1);
        const y = 36 - ((value - min) / range) * 32;
        return `${x},${y.toFixed(2)}`;
      }).join(" ");
    }
    svg.setAttribute("aria-label", label);
    const endpointY = values && values.length ? points.split(" ")[points.split(" ").length - 1].split(",")[1] : "20";
    svg.innerHTML = `<polyline points="${points}" fill="none" stroke="#898781" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></polyline><circle cx="116" cy="${endpointY}" r="4" fill="${color}" stroke="${background}" stroke-width="2"></circle>`;
    if (background === "#0E1B1A") {
      svg.querySelector("polyline").setAttribute("stroke", "#8FADA9");
    }
  }

  function trendText(current, previous, metric) {
    if (!previous || previous === 0) return { text: "Belum ada data pembanding", className: "" };
    const percent = (Math.abs(current - previous) / previous * 100).toFixed(1).replace(".", ",");
    const increased = current >= previous;
    if (metric === "expenses") {
      return {
        text: `${percent}% ${increased ? "lebih tinggi" : "lebih rendah"} dari kemarin`,
        className: increased ? "is-bad" : "is-good",
      };
    }
    return {
      text: `${increased ? "+" : "−"}${percent}% dari kemarin`,
      className: increased ? "is-good" : "is-bad",
    };
  }

  function setTrend(id, data) {
    const element = byId(id);
    element.className = `summary-trend${data.className ? ` ${data.className}` : ""}`;
    element.textContent = data.text;
  }

  function renderSummary(data) {
    const summary = data.summary;
    const previous = data.previous;
    const hasData = summary.sales > 0 || summary.expenses > 0;
    const dark = "#0E1B1A";
    const light = "#FCFCFB";

    byId("salesValue").textContent = formatRupiah(summary.sales);
    byId("expenseValue").textContent = formatRupiah(summary.expenses);
    byId("profitValue").textContent = formatRupiah(summary.profit);

    if (!hasData) {
      setTrend("salesTrend", { text: "Belum ada transaksi", className: "" });
      setTrend("expenseTrend", { text: "Belum ada transaksi", className: "" });
      setTrend("profitTrend", { text: "Belum ada transaksi", className: "" });
      makeSparkline(byId("salesSparkline"), null, "#2a78d6", light, "Garis datar, belum ada transaksi penjualan");
      makeSparkline(byId("expenseSparkline"), null, "#eb6834", light, "Garis datar, belum ada transaksi pengeluaran");
      makeSparkline(byId("profitSparkline"), null, "#5EEAD4", dark, "Garis datar, belum ada transaksi keuntungan");
      return;
    }

    const relative = selectedDate === today ? "kemarin" : "sehari sebelumnya";
    const salesTrend = trendText(summary.sales, previous.sales, "sales");
    const expensesTrend = trendText(summary.expenses, previous.expenses, "expenses");
    const profitTrend = trendText(summary.profit, previous.profit, "profit");
    salesTrend.text = salesTrend.text.replace("kemarin", relative);
    expensesTrend.text = expensesTrend.text.replace("kemarin", relative);
    profitTrend.text = profitTrend.text.replace("kemarin", relative);
    setTrend("salesTrend", salesTrend);
    setTrend("expenseTrend", expensesTrend);
    setTrend("profitTrend", profitTrend);
    makeSparkline(byId("salesSparkline"), data.sparkline.sales, "#2a78d6", light, `Tren penjualan, total ${formatRupiah(summary.sales)}`);
    makeSparkline(byId("expenseSparkline"), data.sparkline.expenses, "#eb6834", light, `Tren pengeluaran, total ${formatRupiah(summary.expenses)}`);
    makeSparkline(byId("profitSparkline"), data.sparkline.profit, "#5EEAD4", dark, `Tren keuntungan, total ${formatRupiah(summary.profit)}`);
  }

  function renderCategories(data) {
    const categories = byId("categoryList");
    const rows = data.categories;
    const totalExpenses = rows.reduce((sum, row) => sum + row.total, 0);
    const maxCategory = Math.max(...rows.map((row) => row.total));
    byId("categoryTotal").textContent = selectedDate === today
      ? `Total ${formatRupiah(totalExpenses)} hari ini`
      : `Total ${formatRupiah(totalExpenses)} pada ${formatDateWithoutYear(selectedDate)}`;
    categories.innerHTML = rows.map((row) => {
      const percent = (row.total / totalExpenses * 100).toFixed(1).replace(".", ",");
      const width = (row.total / maxCategory * 72).toFixed(2);
      const name = row.name.replace(/[&<>"']/g, (character) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
      })[character]);
      return `<li class="category-item"><div class="category-heading"><span>${name}</span><span>${percent}%</span></div><div class="category-bar-row"><span class="category-bar" style="width:${width}%" title="${name}: ${formatRupiah(row.total)} (${percent}%)"></span><span class="category-value">${formatRupiah(row.total)}</span></div></li>`;
    }).join("");
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
    byId("categoryTotal").textContent = selectedDate === today
      ? "Total Rp 0 hari ini"
      : `Total Rp 0 pada ${formattedDate}`;
    byId("returnToToday").hidden = selectedDate === today;
  }

  function getChartX(index, mobile) {
    const left = mobile ? 40 : 56;
    const right = mobile ? 296 : 600;
    return left + (index * (right - left)) / 9;
  }

  function getChartY(value, mobile) {
    const top = mobile ? 10 : 16;
    const bottom = mobile ? 180 : 280;
    return bottom - (value / chartScale) * (bottom - top);
  }

  function showTooltip(index, mobile, data) {
    activeChartIndex = index;
    const salesSeries = data.chart.sales;
    const expenseSeries = data.chart.expenses;
    document.querySelectorAll(".chart-hover").forEach((element) => element.setAttribute("visibility", "visible"));
    document.querySelectorAll(".chart-hover-line").forEach((element) => {
      element.setAttribute("x1", getChartX(index, mobile));
      element.setAttribute("x2", getChartX(index, mobile));
    });
    document.querySelectorAll(".chart-hover-point-sales").forEach((element) => {
      element.setAttribute("cx", getChartX(index, mobile));
      element.setAttribute("cy", getChartY(salesSeries[index], mobile));
    });
    document.querySelectorAll(".chart-hover-point-expenses").forEach((element) => {
      element.setAttribute("cx", getChartX(index, mobile));
      element.setAttribute("cy", getChartY(expenseSeries[index], mobile));
    });
    const tooltip = byId("chartTooltip");
    const canvas = byId("chartCanvas");
    const pointX = getChartX(index, mobile) / (mobile ? 308 : 720) * canvas.clientWidth;
    const salesToHour = salesSeries[index];
    const expensesToHour = expenseSeries[index];
    const hour = data.chart.hours[index] || `${String(index + 8).padStart(2, "0")}.00`;
    tooltip.innerHTML = `<p class="tooltip-title">Pukul ${hour}</p><div class="tooltip-row"><i class="tooltip-key tooltip-key-sales"></i><span>Penjualan</span><strong>${formatRupiah(salesToHour)}</strong></div><div class="tooltip-row"><i class="tooltip-key tooltip-key-expenses"></i><span>Pengeluaran</span><strong>${formatRupiah(expensesToHour)}</strong></div><div class="tooltip-divider"></div><div class="tooltip-row"><i></i><span>Keuntungan</span><strong>${formatRupiah(salesToHour - expensesToHour)}</strong></div>`;
    tooltip.style.left = `${Math.max(4, Math.min(pointX > canvas.clientWidth * 0.65 ? pointX - 196 : pointX + 12, canvas.clientWidth - 196))}px`;
    tooltip.style.top = "12px";
    tooltip.hidden = false;
  }

  function renderChart(data) {
    const sales = data.chart.sales;
    const expenses = data.chart.expenses;
    const hours = data.chart.hours;
    const summary = data.summary;
    const tooltip = byId("chartTooltip");

    function createChart(mobile) {
      const width = mobile ? 308 : 720;
      const height = mobile ? 216 : 320;
      const left = mobile ? 40 : 56;
      const right = mobile ? 296 : 600;
      const top = mobile ? 10 : 16;
      const bottom = mobile ? 180 : 280;
      const y = (value) => bottom - (value / chartScale) * (bottom - top);
      const x = (index) => left + (index * (right - left)) / 9;
      const line = (values) => values.map((value, index) => `${index ? "L" : "M"}${x(index).toFixed(2)} ${y(value).toFixed(2)}`).join(" ");
      const ticks = [0, chartScale / 3, 2 * chartScale / 3, chartScale];
      const tickLabels = (value) => compactRupiah(Math.round(value)).replace(/^Rp /, "");
      const yLabels = ticks.map((value) => `<text class="chart-axis-label${mobile ? " chart-axis-label-mobile" : ""}" x="${left - 10}" y="${y(value) + 4}" text-anchor="end">${tickLabels(value)}</text>`).join("");
      const grid = ticks.map((value) => `<line class="${value === 0 ? "chart-baseline" : "chart-gridline"}" x1="${left}" y1="${y(value)}" x2="${right}" y2="${y(value)}"></line>`).join("");
      const xLabels = (mobile ? [0, 3, 6, 9] : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
        .map((index) => `<text class="chart-axis-label${mobile ? " chart-axis-label-mobile" : ""}" x="${x(index)}" y="${mobile ? 200 : 302}" text-anchor="middle">${hours[index]}</text>`).join("");
      const salesEnd = `<circle class="chart-endpoint chart-endpoint-sales" cx="${x(9)}" cy="${y(sales[9])}" r="4"></circle>`;
      const expensesEnd = `<circle class="chart-endpoint chart-endpoint-expenses" cx="${x(9)}" cy="${y(expenses[9])}" r="4"></circle>`;
      const labels = mobile ? "" : `<text class="chart-end-label" x="616" y="${y(sales[9]) - 4}">Penjualan</text><text class="chart-end-value" x="616" y="${y(sales[9]) + 13}">${compactRupiah(summary.sales)}</text><text class="chart-end-label" x="616" y="${y(expenses[9]) - 4}">Pengeluaran</text><text class="chart-end-value" x="616" y="${y(expenses[9]) + 13}">${compactRupiah(summary.expenses)}</text>`;
      const hitAreas = Array.from({ length: 10 }, (_, index) => {
        const interval = (right - left) / 9;
        const start = index === 0 ? left : x(index) - interval / 2;
        const end = index === 9 ? right : x(index) + interval / 2;
        return `<rect class="chart-hit-area" x="${start}" y="${top}" width="${end - start}" height="${bottom - top}" data-index="${index}" data-mobile="${mobile}" tabindex="0" role="button" aria-label="Pukul ${hours[index]}: penjualan ${formatRupiah(sales[index])}, pengeluaran ${formatRupiah(expenses[index])}"></rect>`;
      }).join("");
      return `<svg id="${mobile ? "mobileChart" : "desktopChart"}" class="chart-svg${mobile ? " chart-svg-mobile" : " chart-svg-desktop"}" viewBox="0 0 ${width} ${height}" role="group" aria-label="Grafik ${formatDate(selectedDate)}: total penjualan ${formatRupiah(summary.sales)} dan total pengeluaran ${formatRupiah(summary.expenses)}">${grid}${yLabels}${xLabels}<path class="chart-series chart-series-sales" d="${line(sales)}"></path><path class="chart-series chart-series-expenses" d="${line(expenses)}"></path>${salesEnd}${expensesEnd}${labels}<g class="chart-hover" visibility="hidden"><line class="chart-hover-line" x1="0" y1="${top}" x2="0" y2="${bottom}"></line><circle class="chart-hover-point chart-hover-point-sales" cx="0" cy="0" r="4" fill="#2a78d6"></circle><circle class="chart-hover-point chart-hover-point-expenses" cx="0" cy="0" r="4" fill="#eb6834"></circle></g>${hitAreas}</svg>`;
    }

    byId("desktopChart").outerHTML = createChart(false);
    byId("mobileChart").outerHTML = createChart(true);
    byId("chartLegend").hidden = false;
    byId("chartCanvas").hidden = false;
    byId("chartEmptyState").hidden = true;
    tooltip.hidden = true;
    activeChartIndex = null;
    byId("chartCanvas").setAttribute("aria-label", `Grafik ${formatDate(selectedDate)}. Total penjualan ${formatRupiah(summary.sales)} dan total pengeluaran ${formatRupiah(summary.expenses)}.`);
  }

  async function renderDashboard() {
    byId("salesValue").textContent = "Rp 0";
    byId("expenseValue").textContent = "Rp 0";
    byId("profitValue").textContent = "Rp 0";
    byId("dashboardDateSummary").textContent = `${formatDate(selectedDate, true)} · Memuat data...`;
    byId("chartEmptyDescription").textContent = "Memuat data transaksi...";

    let data;
    try {
      data = await api(`/api/dashboard?date=${encodeURIComponent(selectedDate)}`);
    } catch (error) {
      byId("dashboardDateSummary").textContent = `${formatDate(selectedDate, true)} · ${error.message}`;
      byId("chartEmptyDescription").textContent = error.message;
      return;
    }

    currentData = data;
    if (data.meta) {
      today = data.meta.today;
      earliestDate = data.meta.earliest_date;
    }

    const isEmpty = data.summary.sales === 0 && data.summary.expenses === 0;
    byId("selectedDateLabel").textContent = formatDate(selectedDate);
    byId("dashboardDateSummary").textContent =
      `${formatDate(selectedDate, true)} · ${isEmpty ? "Belum ada data" : selectedDate === today ? "Ringkasan hari ini" : "Ringkasan hari yang lalu"}`;
    renderSummary(data);
    if (isEmpty) {
      renderEmptyState();
      return;
    }

    chartScale = niceScale(Math.max(
      ...data.chart.sales,
      ...data.chart.expenses,
    ));
    renderCategories(data);
    byId("categoryEmptyState").hidden = true;
    byId("categoryList").hidden = false;
    renderChart(data);
  }

  function renderCalendar() {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    byId("calendarMonthLabel").textContent = `${monthNames[month]} ${year}`;

    const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = weekdays.map((day) => `<span class="calendar-weekday" aria-hidden="true">${day}</span>`);

    for (let index = 0; index < firstWeekday; index += 1) {
      cells.push('<span class="calendar-day is-outside" aria-hidden="true"></span>');
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
      cells.push('<span class="calendar-day is-outside" aria-hidden="true"></span>');
    }

    byId("calendarGrid").innerHTML = cells.join("");
    const [minYear, minMonth] = (earliestDate || "2026-01-01").split("-").map(Number);
    const [maxYear, maxMonth] = (today || "2026-11-19").split("-").map(Number);
    byId("previousMonth").disabled = year < minYear || (year === minYear && month + 1 < minMonth);
    byId("nextMonth").disabled = year > maxYear || (year === maxYear && month + 1 > maxMonth);
  }

  function selectDate(date) {
    selectedDate = date;
    const value = parseDate(date);
    visibleMonth = new Date(value.getFullYear(), value.getMonth(), 1);
    renderCalendar();
    void renderDashboard();
  }

  function openCalendar() {
    const date = parseDate(selectedDate || today);
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
    visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1);
    renderCalendar();
    (calendar.querySelector(".calendar-day.is-selected") || calendar.querySelector(".calendar-day[data-date]:not(:disabled)"))?.focus();
  });
  byId("nextMonth").addEventListener("click", () => {
    visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1);
    renderCalendar();
    (calendar.querySelector(".calendar-day.is-selected") || calendar.querySelector(".calendar-day[data-date]:not(:disabled)"))?.focus();
  });
  byId("calendarGrid").addEventListener("click", (event) => {
    const dayButton = event.target.closest(".calendar-day[data-date]");
    if (!dayButton || dayButton.disabled) return;
    selectDate(dayButton.dataset.date);
    closeCalendar(true);
  });
  byId("calendarToday").addEventListener("click", () => {
    selectDate(today);
    closeCalendar(true);
  });
  byId("calendarClose").addEventListener("click", () => closeCalendar(true));
  byId("returnToToday").addEventListener("click", () => selectDate(today));
  document.addEventListener("pointerdown", (event) => {
    if (!calendar.hidden && !event.target.closest(".date-picker")) closeCalendar();
  });

  byId("chartCanvas").addEventListener("pointerover", (event) => {
    const hit = event.target.closest(".chart-hit-area");
    if (!hit || !currentData) return;
    showTooltip(Number(hit.dataset.index), hit.dataset.mobile === "true", currentData);
  });
  byId("chartCanvas").addEventListener("focusin", (event) => {
    const hit = event.target.closest(".chart-hit-area");
    if (!hit || !currentData) return;
    showTooltip(Number(hit.dataset.index), hit.dataset.mobile === "true", currentData);
  });
  byId("chartCanvas").addEventListener("pointerleave", () => {
    if (byId("chartCanvas").contains(document.activeElement)) return;
    if (activeChartIndex !== null) {
      byId("chartTooltip").hidden = true;
      document.querySelectorAll(".chart-hover").forEach((element) => element.setAttribute("visibility", "hidden"));
      activeChartIndex = null;
    }
  });
  byId("chartCanvas").addEventListener("focusout", (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      byId("chartTooltip").hidden = true;
      document.querySelectorAll(".chart-hover").forEach((element) => element.setAttribute("visibility", "hidden"));
      activeChartIndex = null;
    }
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

  async function init() {
    window.CatetinLoader?.hold();
    try {
      const data = await api("/api/dashboard");
      currentData = data;
      today = data.meta.today;
      earliestDate = data.meta.earliest_date;
      selectedDate = data.date || today;
      visibleMonth = new Date(parseDate(selectedDate).getFullYear(), parseDate(selectedDate).getMonth(), 1);
      renderCalendar();
      await renderDashboard();
    } catch (error) {
      byId("selectedDateLabel").textContent = "Dashboard";
      byId("dashboardDateSummary").textContent = error.message;
      byId("chartEmptyDescription").textContent = error.message;
      byId("chartEmptyState").hidden = false;
    } finally {
      window.CatetinLoader?.release();
    }
  }

  void init();
})();

(() => {
    const today = "2026-11-19";
    const firstDataDate = "2026-11-01";
    const earliestDate = "2026-01-01";
    const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const monthNames = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember",
    ];
    const weekdays = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
    const categoryNames = ["Bahan baku", "Gaji harian", "Sewa dan listrik", "Transportasi", "Lain-lain"];
    const categoryWeights = [0.485, 0.24, 0.11, 0.09, 0.075];
    const salesWeights = [0.03, 0.07, 0.10, 0.09, 0.14, 0.12, 0.09, 0.10, 0.15, 0.11];
    const expenseWeights = [0.40, 0.06, 0.04, 0.03, 0.21, 0.04, 0.03, 0.14, 0.03, 0.02];
    const specialData = {
        "2026-11-13": {
            sales: [140, 360, 590, 500, 760, 680, 450, 520, 780, 620],
            expenses: [820, 110, 90, 80, 470, 100, 70, 250, 90, 60],
            categories: [1030, 510, 240, 190, 170],
        },
        "2026-11-14": {
            sales: [185, 480, 700, 620, 900, 820, 600, 670, 960, 750],
            expenses: [900, 130, 100, 90, 480, 100, 80, 300, 70, 60],
            categories: [1120, 560, 260, 200, 170],
        },
        "2026-11-15": {
            sales: [180, 480, 700, 620, 900, 820, 600, 680, 980, 760],
            expenses: [950, 140, 110, 80, 500, 100, 90, 320, 70, 50],
            categories: [1180, 590, 270, 210, 160],
        },
        "2026-11-16": {
            sales: [100, 300, 480, 420, 640, 560, 380, 450, 680, 540],
            expenses: [780, 90, 70, 60, 420, 80, 60, 220, 80, 50],
            categories: [900, 460, 220, 170, 160],
        },
        "2026-11-17": {
            sales: [130, 340, 560, 480, 720, 640, 430, 500, 760, 600],
            expenses: [800, 100, 90, 70, 480, 100, 70, 240, 90, 60],
            categories: [1010, 500, 230, 190, 170],
        },
        "2026-11-18": {
            sales: [150, 380, 600, 520, 800, 700, 480, 540, 820, 660],
            expenses: [850, 150, 100, 90, 520, 110, 80, 260, 100, 80],
            categories: [1130, 560, 250, 200, 200],
        },
        "2026-11-19": {
            sales: [180, 420, 650, 540, 880, 760, 520, 610, 940, 700],
            expenses: [900, 120, 80, 60, 450, 90, 70, 300, 60, 40],
            categories: [1050, 520, 240, 190, 170],
        },
    };
    const byId = (id) => document.getElementById(id);
    const trigger = byId("datePickerTrigger");
    const calendar = byId("calendarPopover");
    if (!trigger || !calendar) return;

    let selectedDate = today;
    let visibleMonth = new Date(2026, 10, 1);
    let activeChartIndex = null;

    const parseDate = (date) => {
        const [year, month, day] = date.split("-").map(Number);
        return new Date(year, month - 1, day);
    };
    const toDateString = (date) => [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
    ].join("-");
    const formatDate = (date, includeWeekday = false) => {
        const value = parseDate(date);
        const formatted = `${value.getDate()} ${monthNames[value.getMonth()]} ${value.getFullYear()}`;
        return includeWeekday ? `${dayNames[value.getDay()]}, ${formatted}` : formatted;
    };
    const formatRupiah = (thousandValue) => `Rp ${new Intl.NumberFormat("id-ID").format(thousandValue * 1000)}`;
    const dateForCopy = (date) => {
        const value = parseDate(date);
        return `${value.getDate()} ${monthNames[value.getMonth()]}`;
    };

    function allocate(total, weights) {
        const weightTotal = weights.reduce((sum, weight) => sum + weight, 0);
        const values = weights.map((weight) => Math.round((total * weight) / weightTotal));
        values[values.length - 1] += total - values.reduce((sum, value) => sum + value, 0);
        return values;
    }

    function createSeed(date) {
        return date.split("").reduce((seed, character) => (Math.imul(seed, 31) + character.charCodeAt(0)) >>> 0, 2166136261);
    }

    function seededWeights(date, weights, variance) {
        let seed = createSeed(date);
        return weights.map((weight) => {
            seed = (Math.imul(seed ^ (seed >>> 15), 1 | seed) + 0x6d2b79f5) >>> 0;
            let value = seed;
            value = Math.imul(value ^ (value >>> 15), value | 1);
            value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
            const random = ((value ^ (value >>> 14)) >>> 0) / 4294967296;
            return weight * (1 + (random * 2 - 1) * variance);
        });
    }

    function getData(date) {
        if (date < firstDataDate) return null;
        const preset = specialData[date];
        if (preset) return { ...preset };

        const dateSeed = createSeed(date);
        const salesTotal = 4300 + (dateSeed % 2301);
        const expensesTotal = 1800 + ((dateSeed >>> 8) % 751);
        return {
            sales: allocate(salesTotal, seededWeights(date, salesWeights, 0.15)),
            expenses: allocate(expensesTotal, seededWeights(`${date}-expenses`, expenseWeights, 0.15)),
            categories: allocate(expensesTotal, seededWeights(`${date}-categories`, categoryWeights, 0.10)),
        };
    }

    const total = (values) => values.reduce((sum, value) => sum + value, 0);
    const cumulative = (values) => values.reduce((result, value, index) => {
        result.push(value + (result[index - 1] || 0));
        return result;
    }, []);

    function makeSparkline(svg, values, color, background, label) {
        let points;
        if (!values) {
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
        const endpointY = values ? points.split(" ")[points.split(" ").length - 1].split(",")[1] : "20";
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

    function renderSummary(data, previousData) {
        const values = data ? {
            sales: total(data.sales),
            expenses: total(data.expenses),
            profit: total(data.sales) - total(data.expenses),
        } : { sales: 0, expenses: 0, profit: 0 };
        const previousValues = previousData ? {
            sales: total(previousData.sales),
            expenses: total(previousData.expenses),
            profit: total(previousData.sales) - total(previousData.expenses),
        } : null;
        const dark = "#0E1B1A";
        const light = "#FCFCFB";

        byId("salesValue").textContent = data ? formatRupiah(values.sales) : "Rp 0";
        byId("expenseValue").textContent = data ? formatRupiah(values.expenses) : "Rp 0";
        byId("profitValue").textContent = data ? formatRupiah(values.profit) : "Rp 0";

        if (!data) {
            setTrend("salesTrend", { text: "Belum ada transaksi", className: "" });
            setTrend("expenseTrend", { text: "Belum ada transaksi", className: "" });
            setTrend("profitTrend", { text: "Belum ada transaksi", className: "" });
            makeSparkline(byId("salesSparkline"), null, "#2a78d6", light, "Garis datar, belum ada transaksi penjualan");
            makeSparkline(byId("expenseSparkline"), null, "#eb6834", light, "Garis datar, belum ada transaksi pengeluaran");
            makeSparkline(byId("profitSparkline"), null, "#5EEAD4", dark, "Garis datar, belum ada transaksi keuntungan");
            return;
        }

        const salesTrend = trendText(values.sales, previousValues?.sales, "sales");
        const expensesTrend = trendText(values.expenses, previousValues?.expenses, "expenses");
        const profitTrend = trendText(values.profit, previousValues?.profit, "profit");
        salesTrend.text = salesTrend.text.replace("kemarin", selectedDate === today ? "kemarin" : "sehari sebelumnya");
        expensesTrend.text = expensesTrend.text.replace("kemarin", selectedDate === today ? "kemarin" : "sehari sebelumnya");
        profitTrend.text = profitTrend.text.replace("kemarin", selectedDate === today ? "kemarin" : "sehari sebelumnya");
        setTrend("salesTrend", salesTrend);
        setTrend("expenseTrend", expensesTrend);
        setTrend("profitTrend", profitTrend);
        makeSparkline(byId("salesSparkline"), cumulative(data.sales), "#2a78d6", light, `Tren penjualan, total ${formatRupiah(values.sales)}`);
        makeSparkline(byId("expenseSparkline"), cumulative(data.expenses), "#eb6834", light, `Tren pengeluaran, total ${formatRupiah(values.expenses)}`);
        makeSparkline(byId("profitSparkline"), cumulative(data.sales).map((value, index) => value - cumulative(data.expenses)[index]), "#5EEAD4", dark, `Tren keuntungan, total ${formatRupiah(values.profit)}`);
    }

    function renderCategories(data) {
        const categories = byId("categoryList");
        const totalExpenses = total(data.categories);
        const maxCategory = Math.max(...data.categories);
        byId("categoryTotal").textContent = selectedDate === today
            ? `Total ${formatRupiah(totalExpenses)} hari ini`
            : `Total ${formatRupiah(totalExpenses)} pada ${dateForCopy(selectedDate)}`;
        categories.innerHTML = data.categories.map((value, index) => {
            const percent = (value / totalExpenses * 100).toFixed(1).replace(".", ",");
            const width = (value / maxCategory * 72).toFixed(2);
            return `<li class="category-item"><div class="category-heading"><span>${categoryNames[index]}</span><span>${percent}%</span></div><div class="category-bar-row"><span class="category-bar" style="width:${width}%" title="${categoryNames[index]}: ${formatRupiah(value)} (${percent}%)"></span><span class="category-value">${formatRupiah(value)}</span></div></li>`;
        }).join("");
    }

    function renderEmptyState() {
        const formattedDate = dateForCopy(selectedDate);
        byId("chartEmptyDescription").textContent = `Belum ada penjualan atau pengeluaran yang tercatat pada ${formattedDate}. Catat transaksi baru atau pilih tanggal lain.`;
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

    function showTooltip(index, mobile, data) {
        activeChartIndex = index;
        document.querySelectorAll(".chart-hover").forEach((element) => element.setAttribute("visibility", "visible"));
        document.querySelectorAll(".chart-hover-line").forEach((element) => {
            element.setAttribute("x1", getChartX(index, mobile));
            element.setAttribute("x2", getChartX(index, mobile));
        });
        document.querySelectorAll(".chart-hover-point-sales").forEach((element) => {
            element.setAttribute("cx", getChartX(index, mobile));
            element.setAttribute("cy", getChartY(cumulative(data.sales)[index], mobile));
        });
        document.querySelectorAll(".chart-hover-point-expenses").forEach((element) => {
            element.setAttribute("cx", getChartX(index, mobile));
            element.setAttribute("cy", getChartY(cumulative(data.expenses)[index], mobile));
        });
        const tooltip = byId("chartTooltip");
        const canvas = byId("chartCanvas");
        const pointX = getChartX(index, mobile) / (mobile ? 308 : 720) * canvas.clientWidth;
        const salesToHour = cumulative(data.sales)[index];
        const expensesToHour = cumulative(data.expenses)[index];
        tooltip.innerHTML = `<p class="tooltip-title">Pukul ${String(index + 8).padStart(2, "0")}.00</p><div class="tooltip-row"><i class="tooltip-key tooltip-key-sales"></i><span>Penjualan</span><strong>${formatRupiah(salesToHour)}</strong></div><div class="tooltip-row"><i class="tooltip-key tooltip-key-expenses"></i><span>Pengeluaran</span><strong>${formatRupiah(expensesToHour)}</strong></div><div class="tooltip-divider"></div><div class="tooltip-row"><i></i><span>Keuntungan</span><strong>${formatRupiah(salesToHour - expensesToHour)}</strong></div>`;
        tooltip.style.left = `${Math.max(4, Math.min(pointX > canvas.clientWidth * 0.65 ? pointX - 196 : pointX + 12, canvas.clientWidth - 196))}px`;
        tooltip.style.top = "12px";
        tooltip.hidden = false;
    }

    function getChartX(index, mobile) {
        const left = mobile ? 40 : 56;
        const right = mobile ? 296 : 600;
        return left + (index * (right - left)) / 9;
    }

    function getChartY(value, mobile) {
        const top = mobile ? 10 : 16;
        const bottom = mobile ? 180 : 280;
        return bottom - (value / 7000) * (bottom - top);
    }

    function renderChart(data, totals) {
        const sales = cumulative(data.sales);
        const expenses = cumulative(data.expenses);
        const tooltip = byId("chartTooltip");
        const hours = Array.from({ length: 10 }, (_, index) => `${String(index + 8).padStart(2, "0")}.00`);

        function createChart(mobile) {
            const width = mobile ? 308 : 720;
            const height = mobile ? 216 : 320;
            const left = mobile ? 40 : 56;
            const right = mobile ? 296 : 600;
            const top = mobile ? 10 : 16;
            const bottom = mobile ? 180 : 280;
            const y = (value) => bottom - (value / 7000) * (bottom - top);
            const x = (index) => left + (index * (right - left)) / 9;
            const line = (values) => values.map((value, index) => `${index ? "L" : "M"}${x(index).toFixed(2)} ${y(value).toFixed(2)}`).join(" ");
            const ticks = mobile ? [0, 2000, 4000, 6000] : [0, 2000, 4000, 6000];
            const tickLabels = (value) => mobile
                ? (value === 0 ? "0" : `${value / 1000} jt`)
                : (value === 0 ? "Rp 0" : `Rp ${value / 1000} jt`);
            const yLabels = ticks.map((value) => `<text class="chart-axis-label${mobile ? " chart-axis-label-mobile" : ""}" x="${left - 10}" y="${y(value) + 4}" text-anchor="end">${tickLabels(value)}</text>`).join("");
            const grid = ticks.map((value) => `<line class="${value === 0 ? "chart-baseline" : "chart-gridline"}" x1="${left}" y1="${y(value)}" x2="${right}" y2="${y(value)}"></line>`).join("");
            const xLabels = (mobile ? [0, 3, 6, 9] : Array.from({ length: 10 }, (_, index) => index))
                .map((index) => `<text class="chart-axis-label${mobile ? " chart-axis-label-mobile" : ""}" x="${x(index)}" y="${mobile ? 200 : 302}" text-anchor="middle">${hours[index]}</text>`).join("");
            const salesEnd = `<circle class="chart-endpoint chart-endpoint-sales" cx="${x(9)}" cy="${y(sales[9])}" r="4"></circle>`;
            const expensesEnd = `<circle class="chart-endpoint chart-endpoint-expenses" cx="${x(9)}" cy="${y(expenses[9])}" r="4"></circle>`;
            const labels = mobile ? "" : `<text class="chart-end-label" x="616" y="${y(sales[9]) - 4}">Penjualan</text><text class="chart-end-value" x="616" y="${y(sales[9]) + 13}">Rp ${(totals.sales / 1000).toFixed(1).replace(".", ",")} jt</text><text class="chart-end-label" x="616" y="${y(expenses[9]) - 4}">Pengeluaran</text><text class="chart-end-value" x="616" y="${y(expenses[9]) + 13}">Rp ${(totals.expenses / 1000).toFixed(1).replace(".", ",")} jt</text>`;
            const hitAreas = Array.from({ length: 10 }, (_, index) => {
                const interval = (right - left) / 9;
                const start = index === 0 ? left : x(index) - interval / 2;
                const end = index === 9 ? right : x(index) + interval / 2;
                return `<rect class="chart-hit-area" x="${start}" y="${top}" width="${end - start}" height="${bottom - top}" data-index="${index}" data-mobile="${mobile}" tabindex="0" role="button" aria-label="Pukul ${hours[index]}: penjualan ${formatRupiah(sales[index])}, pengeluaran ${formatRupiah(expenses[index])}"></rect>`;
            }).join("");
            return `<svg id="${mobile ? "mobileChart" : "desktopChart"}" class="chart-svg${mobile ? " chart-svg-mobile" : " chart-svg-desktop"}" viewBox="0 0 ${width} ${height}" role="group" aria-label="Grafik ${formatDate(selectedDate)}: total penjualan ${formatRupiah(totals.sales)} dan total pengeluaran ${formatRupiah(totals.expenses)}">${grid}${yLabels}${xLabels}<path class="chart-series chart-series-sales" d="${line(sales)}"></path><path class="chart-series chart-series-expenses" d="${line(expenses)}"></path>${salesEnd}${expensesEnd}${labels}<g class="chart-hover" visibility="hidden"><line class="chart-hover-line" x1="0" y1="${top}" x2="0" y2="${bottom}"></line><circle class="chart-hover-point chart-hover-point-sales" cx="0" cy="0" r="4" fill="#2a78d6"></circle><circle class="chart-hover-point chart-hover-point-expenses" cx="0" cy="0" r="4" fill="#eb6834"></circle></g>${hitAreas}</svg>`;
        }

        byId("desktopChart").outerHTML = createChart(false);
        byId("mobileChart").outerHTML = createChart(true);
        byId("chartLegend").hidden = false;
        byId("chartCanvas").hidden = false;
        byId("chartEmptyState").hidden = true;
        tooltip.hidden = true;
        activeChartIndex = null;
        byId("chartCanvas").setAttribute("aria-label", `Grafik ${formatDate(selectedDate)}. Total penjualan ${formatRupiah(totals.sales)} dan total pengeluaran ${formatRupiah(totals.expenses)}.`);
    }

    function renderDashboard() {
        const data = getData(selectedDate);
        const previous = parseDate(selectedDate);
        previous.setDate(previous.getDate() - 1);
        const previousData = data ? getData(toDateString(previous)) : null;
        const isEmpty = data === null;

        byId("selectedDateLabel").textContent = formatDate(selectedDate);
        byId("dashboardDateSummary").textContent = `${formatDate(selectedDate, true)} · ${isEmpty ? "Belum ada data" : selectedDate === today ? "Ringkasan hari ini" : "Ringkasan hari yang lalu"}`;
        renderSummary(data, previousData);
        if (isEmpty) {
            renderEmptyState();
            return;
        }
        const totals = { sales: total(data.sales), expenses: total(data.expenses) };
        renderCategories(data);
        byId("categoryEmptyState").hidden = true;
        byId("categoryList").hidden = false;
        renderChart(data, totals);
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
        visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1);
        renderCalendar();
        const selected = calendar.querySelector(".calendar-day.is-selected");
        if (selected) selected.focus();
    });
    byId("nextMonth").addEventListener("click", () => {
        visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1);
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
        if (!calendar.hidden && !event.target.closest(".date-picker")) closeCalendar();
    });

    byId("chartCanvas").addEventListener("pointerover", (event) => {
        const hit = event.target.closest(".chart-hit-area");
        if (!hit) return;
        const data = getData(selectedDate);
        showTooltip(Number(hit.dataset.index), hit.dataset.mobile === "true", data);
    });
    byId("chartCanvas").addEventListener("focusin", (event) => {
        const hit = event.target.closest(".chart-hit-area");
        if (!hit) return;
        showTooltip(Number(hit.dataset.index), hit.dataset.mobile === "true", getData(selectedDate));
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

    renderDashboard();
})();

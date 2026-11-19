(() => {
    const today = "2026-11-19";
    const earliestDate = "2026-01-01";
    const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const monthNames = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember",
    ];
    const weekdays = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
    const categoryNames = ["Bahan baku", "Gaji harian", "Sewa dan listrik", "Transportasi", "Lain-lain"];
    const fixedData = {
        "2026-11-19": {
            sales: [180, 420, 650, 540, 880, 760, 520, 610, 940, 700],
            expenses: [900, 120, 80, 60, 450, 90, 70, 300, 60, 40],
            categories: [1050, 520, 240, 190, 170],
        },
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
    };

    const numberFormatter = new Intl.NumberFormat("id-ID");
    const oneDecimalFormatter = new Intl.NumberFormat("id-ID", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
    });
    const byId = (id) => document.getElementById(id);
    const trigger = byId("datePickerTrigger");
    const calendar = byId("calendarPopover");
    if (!trigger || !calendar) return;

    let selectedDate = today;
    let visibleMonth = new Date(2026, 10, 1);
    let activeChartSvg = null;
    let renderedData = null;

    const parseDate = (date) => {
        const [year, month, day] = date.split("-").map(Number);
        return new Date(year, month - 1, day);
    };
    const toDateString = (date) => [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
    ].join("-");
    const shiftDate = (date, amount) => {
        const shifted = parseDate(date);
        shifted.setDate(shifted.getDate() + amount);
        return toDateString(shifted);
    };
    const formatDate = (date, includeWeekday = false) => {
        const value = parseDate(date);
        const formatted = `${value.getDate()} ${monthNames[value.getMonth()]} ${value.getFullYear()}`;
        return includeWeekday ? `${dayNames[value.getDay()]}, ${formatted}` : formatted;
    };
    const formatCurrency = (thousands) => `Rp ${numberFormatter.format(thousands * 1000)}`;
    const formatShortCurrency = (thousands) => `Rp ${oneDecimalFormatter.format(thousands / 1000)} jt`;
    const formatPercent = (value) => `${oneDecimalFormatter.format(value)}%`;
    const sum = (values) => values.reduce((total, value) => total + value, 0);
    const cumulative = (values) => values.reduce((result, value, index) => {
        result.push(value + (result[index - 1] || 0));
        return result;
    }, []);

    function seededRandom(date) {
        let seed = 2166136261;
        for (const char of date) {
            seed ^= char.charCodeAt(0);
            seed = Math.imul(seed, 16777619);
        }
        return () => {
            seed += 0x6D2B79F5;
            let value = seed;
            value = Math.imul(value ^ (value >>> 15), value | 1);
            value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
            return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
        };
    }

    function distribute(total, weights, variation, random) {
        const adjusted = weights.map((weight) => weight * (1 + (random() * 2 - 1) * variation));
        const weightTotal = sum(adjusted);
        const values = adjusted.map((weight) => Math.round((weight / weightTotal) * total));
        values[values.length - 1] += total - sum(values);
        return values;
    }

    function generateData(date) {
        if (fixedData[date]) return fixedData[date];

        const random = seededRandom(date);
        const salesTotal = 4300 + Math.floor(random() * 2301);
        const expenseTotal = 1800 + Math.floor(random() * 751);
        return {
            sales: distribute(
                salesTotal,
                [0.03, 0.07, 0.10, 0.09, 0.14, 0.12, 0.09, 0.10, 0.15, 0.11],
                0.15,
                random,
            ),
            expenses: distribute(
                expenseTotal,
                [0.40, 0.06, 0.04, 0.03, 0.21, 0.04, 0.03, 0.14, 0.03, 0.02],
                0.15,
                random,
            ),
            categories: distribute(
                expenseTotal,
                [0.485, 0.24, 0.11, 0.09, 0.075],
                0.10,
                random,
            ),
        };
    }

    function renderCalendar() {
        const year = visibleMonth.getFullYear();
        const month = visibleMonth.getMonth();
        byId("calendarMonthLabel").textContent = `${monthNames[month]} ${year}`;

        const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const grid = byId("calendarGrid");
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

        grid.innerHTML = cells.join("");
        byId("previousMonth").disabled = year === 2026 && month === 0;
        byId("nextMonth").disabled = year === 2026 && month === 10;
    }

    function renderTrend(element, current, previous, isExpense, comparisonLabel, darkCard = false) {
        const difference = current - previous;
        const isUp = difference >= 0;
        const isGood = isExpense ? !isUp : isUp;
        const percent = previous > 0 ? Math.abs(difference / previous) * 100 : null;
        const percentageText = percent === null ? "Tidak ada data pembanding" : formatPercent(percent);
        const direction = isUp ? "up" : "down";
        const icon = isUp
            ? '<path d="M12 19V5M5 12l7-7 7 7"></path>'
            : '<path d="M12 5v14m7-7-7 7-7-7"></path>';
        let text;

        if (percent === null) {
            text = percentageText;
        } else if (isExpense) {
            text = isUp
                ? `${percentageText} lebih tinggi dari ${comparisonLabel}`
                : `${percentageText} lebih rendah dari ${comparisonLabel}`;
        } else {
            text = `${isUp ? "+" : "−"}${percentageText} dari ${comparisonLabel}`;
        }

        element.className = `summary-trend ${isGood ? "is-good" : "is-bad"}${darkCard ? " summary-trend-dark" : ""}`;
        element.innerHTML = `<svg aria-hidden="true" focusable="false" data-direction="${direction}" viewBox="0 0 24 24">${icon}</svg><span>${text}</span>`;
    }

    function renderSparkline(id, values, color, background) {
        const totals = cumulative(values);
        const minimum = Math.min(...totals);
        const maximum = Math.max(...totals);
        const range = maximum - minimum || 1;
        const points = totals.map((value, index) => ({
            x: 5 + (index * 110) / (totals.length - 1),
            y: 36 - ((value - minimum) / range) * 28,
        }));
        const path = points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(" ");
        const lastPoint = points[points.length - 1];
        const svg = byId(id);
        svg.setAttribute("aria-label", `Grafik tren ${id.replace("Sparkline", "").toLowerCase()}, 10 titik per jam`);
        svg.innerHTML = `<path d="${path}"></path><circle cx="${lastPoint.x}" cy="${lastPoint.y}" r="4" fill="${color}" stroke="${background}"></circle>`;
    }

    function coordinates(values, width, left, right, top, bottom) {
        const totals = cumulative(values);
        const step = (right - left) / (totals.length - 1);
        return totals.map((value, index) => ({
            x: left + step * index,
            y: bottom - (value / 7000) * (bottom - top),
            value: totals[index],
        }));
    }

    function makeChartMarkup(data, mobile) {
        const width = mobile ? 308 : 720;
        const left = mobile ? 40 : 56;
        const right = mobile ? 296 : 600;
        const top = mobile ? 10 : 16;
        const bottom = mobile ? 180 : 280;
        const salesPoints = coordinates(data.sales, width, left, right, top, bottom);
        const expensePoints = coordinates(data.expenses, width, left, right, top, bottom);
        const salesPath = salesPoints.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(" ");
        const expensePath = expensePoints.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(" ");
        const hours = Array.from({ length: 10 }, (_, index) => `${String(index + 8).padStart(2, "0")}.00`);
        const yForValue = (value) => bottom - (value / 7000) * (bottom - top);
        const ticks = mobile ? [0, 2000, 4000, 6000] : [0, 2000, 4000, 6000];
        const yLabels = ticks.map((value) => {
            const label = mobile ? (value === 0 ? "0" : `${value / 1000} jt`) : `Rp ${value === 0 ? "0" : `${value / 1000} jt`}`;
            const y = yForValue(value);
            return `<text class="chart-axis-label${mobile ? " chart-axis-label-mobile" : ""}" x="${mobile ? 32 : 46}" y="${y + 4}" text-anchor="end">${label}</text>`;
        }).join("");
        const gridLines = ticks.filter((value) => value > 0).map((value) =>
            `<line class="chart-gridline" x1="${left}" y1="${yForValue(value)}" x2="${right}" y2="${yForValue(value)}"></line>`,
        ).join("");
        const xTickIndexes = mobile ? [0, 3, 6, 9] : Array.from({ length: 10 }, (_, index) => index);
        const xLabels = xTickIndexes.map((index) =>
            `<text class="chart-axis-label${mobile ? " chart-axis-label-mobile" : ""}" x="${salesPoints[index].x}" y="${mobile ? 200 : 302}" text-anchor="middle">${hours[index]}</text>`,
        ).join("");
        const salesEnd = salesPoints[salesPoints.length - 1];
        const expenseEnd = expensePoints[expensePoints.length - 1];
        const endLabels = mobile ? "" : `
            <text class="chart-end-label" x="616" y="${salesEnd.y - 7}">Penjualan</text>
            <text class="chart-end-value" x="616" y="${salesEnd.y + 11}">${formatShortCurrency(salesEnd.value)}</text>
            <text class="chart-end-label" x="616" y="${expenseEnd.y - 7}">Pengeluaran</text>
            <text class="chart-end-value" x="616" y="${expenseEnd.y + 11}">${formatShortCurrency(expenseEnd.value)}</text>`;
        const description = `Grafik kumulatif ${formatDate(selectedDate)}. Total penjualan ${formatCurrency(sum(data.sales))}, total pengeluaran ${formatCurrency(sum(data.expenses))}.`;
        const viewBox = mobile ? "0 0 308 216" : "0 0 720 320";
        const plotHeight = bottom - top;
        const step = (right - left) / 9;
        const hitAreas = salesPoints.map((point, index) => {
            const start = index === 0 ? left : point.x - step / 2;
            const end = index === salesPoints.length - 1 ? right : point.x + step / 2;
            const salesValue = salesPoints[index].value;
            const expenseValue = expensePoints[index].value;
            const profit = salesValue - expenseValue;
            return `<rect class="chart-hit-area" x="${start}" y="${top}" width="${end - start}" height="${plotHeight}" data-index="${index}" tabindex="0" role="button" aria-label="Pukul ${hours[index]}: Penjualan ${formatCurrency(salesValue)}, pengeluaran ${formatCurrency(expenseValue)}, keuntungan ${formatCurrency(profit)}"></rect>`;
        }).join("");

        return `<svg class="chart-svg ${mobile ? "chart-svg-mobile" : "chart-svg-desktop"}" id="${mobile ? "mobileChart" : "desktopChart"}" viewBox="${viewBox}" role="group" aria-label="${description}">
            ${gridLines}
            <line class="chart-baseline" x1="${left}" y1="${bottom}" x2="${right}" y2="${bottom}"></line>
            ${yLabels}${xLabels}
            <path class="chart-series chart-series-sales" d="${salesPath}"></path>
            <path class="chart-series chart-series-expenses" d="${expensePath}"></path>
            <circle class="chart-endpoint chart-endpoint-sales" cx="${salesEnd.x}" cy="${salesEnd.y}" r="4"></circle>
            <circle class="chart-endpoint chart-endpoint-expenses" cx="${expenseEnd.x}" cy="${expenseEnd.y}" r="4"></circle>
            ${endLabels}
            <g class="chart-hover-marker" aria-hidden="true"></g>
            ${hitAreas}
        </svg>`;
    }

    function showTooltip(svg, index) {
        const mobile = svg.id === "mobileChart";
        const data = renderedData;
        const sales = cumulative(data.sales);
        const expenses = cumulative(data.expenses);
        const profit = sales[index] - expenses[index];
        const hour = `${String(index + 8).padStart(2, "0")}.00`;
        const salesPoint = coordinates(data.sales, mobile ? 308 : 720, mobile ? 40 : 56, mobile ? 296 : 600, mobile ? 10 : 16, mobile ? 180 : 280)[index];
        const expensePoint = coordinates(data.expenses, mobile ? 308 : 720, mobile ? 40 : 56, mobile ? 296 : 600, mobile ? 10 : 16, mobile ? 180 : 280)[index];
        const viewBoxWidth = mobile ? 308 : 720;
        const viewBoxHeight = mobile ? 216 : 320;
        const canvas = byId("chartCanvas");
        const tooltip = byId("chartTooltip");
        const svgRect = svg.getBoundingClientRect();
        const canvasRect = canvas.getBoundingClientRect();
        const pointX = (salesPoint.x / viewBoxWidth) * svgRect.width + svgRect.left - canvasRect.left;
        const pointY = (Math.min(salesPoint.y, expensePoint.y) / viewBoxHeight) * svgRect.height + svgRect.top - canvasRect.top;
        const direction = index >= 6 ? -1 : 1;

        tooltip.innerHTML = `<p class="tooltip-title">Pukul ${hour}</p>
            <div class="tooltip-row"><i class="tooltip-key tooltip-key-sales" aria-hidden="true"></i><span>Penjualan</span><strong>${formatCurrency(sales[index])}</strong></div>
            <div class="tooltip-row"><i class="tooltip-key tooltip-key-expenses" aria-hidden="true"></i><span>Pengeluaran</span><strong>${formatCurrency(expenses[index])}</strong></div>
            <div class="tooltip-divider"></div>
            <div class="tooltip-row"><i aria-hidden="true"></i><span>Keuntungan</span><strong>${formatCurrency(profit)}</strong></div>`;
        tooltip.hidden = false;
        const tooltipWidth = tooltip.offsetWidth;
        const tooltipHeight = tooltip.offsetHeight;
        const left = Math.max(0, Math.min(canvas.clientWidth - tooltipWidth, pointX + (direction < 0 ? -tooltipWidth - 12 : 12)));
        const topPosition = Math.max(0, Math.min(canvas.clientHeight - tooltipHeight, pointY + 10));
        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${topPosition}px`;

        const leftCoordinate = mobile ? 40 : 56;
        const rightCoordinate = mobile ? 296 : 600;
        const topCoordinate = mobile ? 10 : 16;
        const bottomCoordinate = mobile ? 180 : 280;
        const x = leftCoordinate + ((rightCoordinate - leftCoordinate) * index) / 9;
        const marker = svg.querySelector(".chart-hover-marker");
        marker.innerHTML = `<line class="chart-hover-line" x1="${x}" y1="${topCoordinate}" x2="${x}" y2="${bottomCoordinate}"></line>
            <circle class="chart-hover-point chart-endpoint-sales" cx="${x}" cy="${salesPoint.y}" r="4"></circle>
            <circle class="chart-hover-point chart-endpoint-expenses" cx="${x}" cy="${expensePoint.y}" r="4"></circle>`;
    }

    function closeTooltip() {
        byId("chartTooltip").hidden = true;
        if (activeChartSvg) {
            const marker = activeChartSvg.querySelector(".chart-hover-marker");
            if (marker) marker.innerHTML = "";
        }
        activeChartSvg = null;
    }

    function attachChartInteractions(svg) {
        svg.querySelectorAll(".chart-hit-area").forEach((area) => {
            const index = Number(area.dataset.index);
            area.addEventListener("pointerenter", () => {
                closeTooltip();
                activeChartSvg = svg;
                showTooltip(svg, index);
            });
            area.addEventListener("pointermove", () => showTooltip(svg, index));
            area.addEventListener("focus", () => {
                closeTooltip();
                activeChartSvg = svg;
                showTooltip(svg, index);
            });
            area.addEventListener("blur", closeTooltip);
            area.addEventListener("keydown", (event) => {
                if (event.key === "Escape") {
                    closeTooltip();
                    area.blur();
                }
            });
        });
    }

    function renderCategories(data) {
        const total = sum(data.expenses);
        byId("categoryTotal").textContent = selectedDate === today
            ? `Total ${formatCurrency(total)} hari ini`
            : `Total ${formatCurrency(total)} pada ${formatDate(selectedDate)}`;
        const maximum = Math.max(...data.categories);
        byId("categoryList").innerHTML = data.categories.map((value, index) => {
            const percent = total > 0 ? (value / total) * 100 : 0;
            const width = maximum > 0 ? (value / maximum) * 72 : 0;
            const percentage = formatPercent(percent);
            const title = `${categoryNames[index]}: ${formatCurrency(value)} (${percentage})`;
            return `<li class="category-item">
                <div class="category-heading"><span>${categoryNames[index]}</span><span>${percentage}</span></div>
                <div class="category-bar-row">
                    <span class="category-bar" style="width:${width.toFixed(2)}%" title="${title}" aria-hidden="true"></span>
                    <span class="category-value">${formatCurrency(value)}</span>
                </div>
            </li>`;
        }).join("");
    }

    function renderDashboard() {
        closeTooltip();
        const data = generateData(selectedDate);
        const previous = generateData(shiftDate(selectedDate, -1));
        renderedData = data;
        const salesTotal = sum(data.sales);
        const expenseTotal = sum(data.expenses);
        const profitTotal = salesTotal - expenseTotal;
        const previousProfit = sum(previous.sales) - sum(previous.expenses);
        const comparisonLabel = selectedDate === today ? "kemarin" : "sehari sebelumnya";

        byId("selectedDateLabel").textContent = formatDate(selectedDate);
        byId("dashboardDateSummary").textContent = `${formatDate(selectedDate, true)} · ${selectedDate === today ? "Ringkasan hari ini" : "Ringkasan hari yang lalu"}`;
        byId("salesValue").textContent = formatCurrency(salesTotal);
        byId("expenseValue").textContent = formatCurrency(expenseTotal);
        byId("profitValue").textContent = formatCurrency(profitTotal);
        renderTrend(byId("salesTrend"), salesTotal, sum(previous.sales), false, comparisonLabel);
        renderTrend(byId("expenseTrend"), expenseTotal, sum(previous.expenses), true, comparisonLabel);
        renderTrend(byId("profitTrend"), profitTotal, previousProfit, false, comparisonLabel, true);

        renderSparkline("salesSparkline", data.sales, "#2a78d6", "#FCFCFB");
        renderSparkline("expenseSparkline", data.expenses, "#eb6834", "#FCFCFB");
        renderSparkline("profitSparkline", data.sales.map((value, index) => value - data.expenses[index]), "#5EEAD4", "#0E1B1A");
        renderCategories(data);

        const chartCanvas = byId("chartCanvas");
        chartCanvas.innerHTML = `${makeChartMarkup(data, false)}${makeChartMarkup(data, true)}<div class="chart-tooltip" id="chartTooltip" role="status" aria-live="polite" hidden></div>`;
        attachChartInteractions(byId("desktopChart"));
        attachChartInteractions(byId("mobileChart"));
    }

    function openCalendar() {
        visibleMonth = new Date(parseDate(selectedDate).getFullYear(), parseDate(selectedDate).getMonth(), 1);
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
        closeCalendar(true);
        renderDashboard();
    });
    byId("calendarToday").addEventListener("click", () => {
        selectedDate = today;
        closeCalendar(true);
        renderDashboard();
    });
    byId("calendarClose").addEventListener("click", () => closeCalendar(true));
    document.addEventListener("pointerdown", (event) => {
        if (!calendar.hidden && !event.target.closest(".date-picker")) closeCalendar();
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

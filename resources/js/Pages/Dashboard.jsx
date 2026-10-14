import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import React, { useState, useEffect, useMemo, useRef } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";

import {
    Monitor,
    Printer,
    Package,
    Wrench,
    Camera,
    ChartNetwork,
    ChartSpline,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    AlertTriangle,
    CheckCircle2,
    RefreshCw,
} from "lucide-react";

import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from "recharts";

// ─── Helpers / constants (outside the component to avoid remounting) ─────────
const REFRESH_INTERVAL_MS = 60 * 1000;

const REFRESH_PROPS = [
    "today",
    "chartDates",
    "computerPerDay",
    "printerPerDay",
    "boxingPerDay",
    "repairPerDay",
    "cctvPerDay",
    "pmItems",
];

const TYPE_META = {
    computer: { label: "Computer", chip: "bg-blue-100 text-blue-700" },
    printer: { label: "Printer", chip: "bg-cyan-100 text-cyan-700" },
    cctv: { label: "CCTV", chip: "bg-slate-200 text-slate-700" },
    ladder: { label: "Ladder", chip: "bg-violet-100 text-violet-700" },
};

const TREND_SERIES = [
    { key: "computer", name: "Computer", color: "#2563eb" },
    { key: "printer", name: "Printer", color: "#0891b2" },
    { key: "boxing", name: "Boxing", color: "#d97706" },
    { key: "repair", name: "Computer Repair", color: "#65a30d" },
    { key: "cctv", name: "CCTV", color: "#475569" },
];

const MONTHS = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
];

const MONTHS_FULL = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
];

const pad = (n) => String(n).padStart(2, "0");

// "2026-10-14" -> "Oct 14, 2026" (no timezone shift)
const fmtDate = (str) => {
    if (!str) return "-";
    const [y, m, d] = str.split("-").map(Number);
    return `${MONTHS[m - 1]} ${pad(d)}, ${y}`;
};

// "2026-10" -> "October 2026"
const fmtMonthKey = (key) => {
    const [y, m] = key.split("-").map(Number);
    return `${MONTHS_FULL[m - 1]} ${y}`;
};

const fmtTime = (d) =>
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

const statusText = (item) => {
    if (item.due === null) return "No PM record yet";
    if (item.status === "overdue") return `${item.days} day(s) overdue`;
    if (item.days === 0) return "Due today";
    return `Due in ${item.days} day(s)`;
};

function PmList({ title, icon, items, emptyText, headerClass, rowClass }) {
    return (
        <Card className="bg-white border-gray-200 flex flex-col xl:flex-1 xl:min-h-0">
            <CardHeader className="pb-2">
                <CardTitle
                    className={`text-lg flex items-center gap-2 ${headerClass}`}
                >
                    {icon}
                    {title}
                    <span className="ml-auto text-sm font-semibold">
                        {items.length}
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col xl:flex-1 xl:min-h-0">
                <div className="overflow-y-auto space-y-2 pr-1 max-h-80 xl:max-h-none xl:flex-1 xl:min-h-0">
                    {items.length === 0 && (
                        <p className="text-sm text-muted-foreground py-4 text-center">
                            {emptyText}
                        </p>
                    )}
                    {items.map((item) => (
                        <div
                            key={`${item.type}-${item.name}`}
                            className={`flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm ${rowClass}`}
                        >
                            <div className="min-w-0">
                                <p className="font-semibold truncate">
                                    {item.name}
                                </p>
                                <p className="text-xs text-slate-600">
                                    {item.due
                                        ? `Due: ${fmtDate(item.due)}`
                                        : "Due: -"}
                                </p>
                                {item.status === "upcoming" &&
                                    item.available_from && (
                                        <p className="text-xs text-slate-500">
                                            Available from:{" "}
                                            {fmtDate(item.available_from)}
                                        </p>
                                    )}
                            </div>
                            <div className="flex flex-col items-end gap-1 shrink-0">
                                <span
                                    className={`text-xs px-2 py-0.5 rounded-full ${TYPE_META[item.type].chip}`}
                                >
                                    {TYPE_META[item.type].label}
                                </span>
                                <span className="text-xs font-medium">
                                    {statusText(item)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

function PmCalendar({ today, eventsByDate, typeFilter, setTypeFilter }) {
    const [ty, tm] = today.split("-").map(Number);
    const [view, setView] = useState({ year: ty, month: tm - 1 });
    const [selectedDay, setSelectedDay] = useState(null);

    const firstWeekday = new Date(view.year, view.month, 1).getDay();
    const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();

    const cells = [];
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    const keyOf = (d) => `${view.year}-${pad(view.month + 1)}-${pad(d)}`;

    const changeMonth = (delta) => {
        const d = new Date(view.year, view.month + delta, 1);
        setView({ year: d.getFullYear(), month: d.getMonth() });
        setSelectedDay(null);
    };

    const selectedEvents = selectedDay ? (eventsByDate[selectedDay] ?? []) : [];

    return (
        <Card className="bg-white border-gray-200 h-full flex flex-col">
            <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="text-xl text-blue-600 flex items-center gap-2">
                        <CalendarDays className="h-6 w-6" />
                        PM Schedule Calendar
                    </CardTitle>

                    <div className="flex items-center gap-2">
                        <select
                            className="border rounded-md px-2 py-1 text-sm bg-background"
                            value={typeFilter}
                            onChange={(e) => {
                                setTypeFilter(e.target.value);
                                setSelectedDay(null);
                            }}
                        >
                            <option value="all">All types</option>
                            {Object.entries(TYPE_META).map(([k, v]) => (
                                <option key={k} value={k}>
                                    {v.label}
                                </option>
                            ))}
                        </select>

                        <button
                            className="p-1 border rounded-md hover:bg-slate-100"
                            onClick={() => changeMonth(-1)}
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <span className="w-36 text-center font-semibold">
                            {MONTHS_FULL[view.month]} {view.year}
                        </span>
                        <button
                            className="p-1 border rounded-md hover:bg-slate-100"
                            onClick={() => changeMonth(1)}
                        >
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col min-h-0">
                <div className="grid grid-cols-7 text-center text-xs font-semibold text-slate-600 mb-1">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                        (d) => (
                            <div key={d} className="py-1">
                                {d}
                            </div>
                        ),
                    )}
                </div>

                <div className="grid grid-cols-7 gap-1 flex-1 auto-rows-fr min-h-[24rem]">
                    {cells.map((d, idx) => {
                        if (d === null) {
                            return <div key={`e-${idx}`} />;
                        }

                        const key = keyOf(d);
                        const events = eventsByDate[key] ?? [];
                        const hasOverdue = events.some(
                            (e) => e.status === "overdue",
                        );
                        const isToday = key === today;
                        const isSelected = key === selectedDay;

                        // count per type
                        const counts = {};
                        events.forEach((e) => {
                            counts[e.type] = (counts[e.type] ?? 0) + 1;
                        });

                        return (
                            <button
                                key={key}
                                onClick={() =>
                                    setSelectedDay(isSelected ? null : key)
                                }
                                className={`rounded-md border p-1 text-left align-top overflow-hidden transition
                                    ${isToday ? "bg-blue-50 border-blue-400" : "bg-white"}
                                    ${hasOverdue ? "border-red-400" : ""}
                                    ${isSelected ? "ring-2 ring-blue-500" : ""}
                                    hover:bg-slate-50`}
                            >
                                <div
                                    className={`text-xs font-semibold ${isToday ? "text-blue-700" : "text-slate-700"}`}
                                >
                                    {d}
                                </div>
                                <div className="mt-1 space-y-0.5">
                                    {Object.entries(counts).map(([type, n]) => (
                                        <div
                                            key={type}
                                            className={`text-[10px] leading-4 px-1 rounded ${TYPE_META[type].chip}`}
                                        >
                                            {TYPE_META[type].label}: {n}
                                        </div>
                                    ))}
                                </div>
                            </button>
                        );
                    })}
                </div>

                <p className="mt-2 text-xs text-muted-foreground">
                    Red border = has overdue PM on that day. Click a day to see
                    the list.
                </p>

                {selectedDay && (
                    <div className="mt-3 border rounded-md p-3 bg-slate-50 max-h-48 overflow-y-auto">
                        <p className="font-semibold text-sm mb-2">
                            Due on {fmtDate(selectedDay)}
                        </p>
                        {selectedEvents.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                Nothing scheduled.
                            </p>
                        ) : (
                            <div className="grid gap-2 md:grid-cols-2">
                                {selectedEvents.map((e) => (
                                    <div
                                        key={`${e.type}-${e.name}`}
                                        className="flex items-center justify-between bg-white border rounded-md px-3 py-2 text-sm"
                                    >
                                        <span className="font-medium truncate">
                                            {e.name}
                                        </span>
                                        <span
                                            className={`text-xs px-2 py-0.5 rounded-full ${TYPE_META[e.type].chip}`}
                                        >
                                            {TYPE_META[e.type].label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
// ──────────────────────────────────────────────────────────────────────────────

export default function Dashboard({
    today,
    chartDates = [],
    computerPerDay = {},
    printerPerDay = {},
    boxingPerDay = {},
    repairPerDay = {},
    cctvPerDay = {},
    pmItems = [],
}) {
    const [currentDateTime, setCurrentDateTime] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [lastUpdated, setLastUpdated] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    const inFlightRef = useRef(false);
    const lastRefreshRef = useRef(Date.now());

    // Use the server date for consistency (Asia/Manila), fallback to local
    const todayStr = useMemo(() => {
        if (today) return today;
        const n = new Date();
        return `${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())}`;
    }, [today]);

    // Activity month filter: "all" or "YYYY-MM" (defaults to the current month).
    // Controls the 5 summary cards AND the trend chart.
    const [trendMonth, setTrendMonth] = useState(() => todayStr.slice(0, 7));

    const formatDateTime = (date = new Date()) => {
        const d = new Date(date);

        const month = d.toLocaleString("en-US", { month: "long" });
        const day = pad(d.getDate());
        const year = d.getFullYear();

        return `${month}/${day}/${year} ${fmtTime(d)}`;
    };

    // Live clock
    useEffect(() => {
        setCurrentDateTime(formatDateTime());

        const interval = setInterval(() => {
            setCurrentDateTime(formatDateTime());
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    // Silent refresh every 60 seconds (paused while the tab is hidden)
    useEffect(() => {
        setLastUpdated(new Date());

        const refresh = () => {
            if (inFlightRef.current) return;

            inFlightRef.current = true;
            setRefreshing(true);

            router.reload({
                only: REFRESH_PROPS,
                preserveScroll: true,
                preserveState: true,
                showProgress: false,
                onSuccess: () => {
                    lastRefreshRef.current = Date.now();
                    setLastUpdated(new Date());
                },
                onFinish: () => {
                    inFlightRef.current = false;
                    setRefreshing(false);
                },
            });
        };

        const interval = setInterval(() => {
            if (document.hidden) return;
            refresh();
        }, REFRESH_INTERVAL_MS);

        // Refresh right away when the user comes back to the tab (if data is stale)
        const onVisibility = () => {
            if (
                !document.hidden &&
                Date.now() - lastRefreshRef.current >= REFRESH_INTERVAL_MS
            ) {
                refresh();
            }
        };

        document.addEventListener("visibilitychange", onVisibility);

        return () => {
            clearInterval(interval);
            document.removeEventListener("visibilitychange", onVisibility);
        };
    }, []);

    // ── PM data ──
    const filteredPm = useMemo(
        () =>
            pmItems.filter(
                (i) => typeFilter === "all" || i.type === typeFilter,
            ),
        [pmItems, typeFilter],
    );

    const overdueItems = useMemo(
        () =>
            filteredPm
                .filter((i) => i.status === "overdue")
                .sort((a, b) => b.days - a.days),
        [filteredPm],
    );

    const availableItems = useMemo(
        () =>
            filteredPm
                .filter((i) => i.status === "available")
                .sort((a, b) =>
                    (a.due ?? "0000-00-00").localeCompare(
                        b.due ?? "0000-00-00",
                    ),
                ),
        [filteredPm],
    );

    const upcomingItems = useMemo(
        () =>
            filteredPm
                .filter((i) => i.status === "upcoming")
                .sort((a, b) => a.due.localeCompare(b.due)),
        [filteredPm],
    );

    const eventsByDate = useMemo(() => {
        const map = {};
        filteredPm.forEach((i) => {
            if (!i.due) return;
            if (!map[i.due]) map[i.due] = [];
            map[i.due].push(i);
        });
        return map;
    }, [filteredPm]);

    // ── Activity: month filter, chart data, and card totals ──
    const monthOptions = useMemo(() => {
        const set = new Set(chartDates.map((d) => d.slice(0, 7)));
        set.add(todayStr.slice(0, 7));
        return Array.from(set).sort().reverse(); // newest first
    }, [chartDates, todayStr]);

    const valuesFor = (date) => ({
        computer: Number(computerPerDay[date] ?? 0),
        printer: Number(printerPerDay[date] ?? 0),
        boxing: Number(boxingPerDay[date] ?? 0),
        repair: Number(repairPerDay[date] ?? 0),
        cctv: Number(cctvPerDay[date] ?? 0),
    });

    const chartData = useMemo(() => {
        if (trendMonth === "all") {
            return chartDates.map((date) => {
                const [y, m, d] = date.split("-").map(Number);
                return {
                    date: `${MONTHS[m - 1]}/${pad(d)}/${y}`,
                    ...valuesFor(date),
                };
            });
        }

        // Single month: show every day (zeros included), up to today for the current month
        const [y, m] = trendMonth.split("-").map(Number);
        const daysInMonth = new Date(y, m, 0).getDate();
        const lastDay =
            trendMonth === todayStr.slice(0, 7)
                ? Number(todayStr.slice(8, 10))
                : daysInMonth;

        const rows = [];
        for (let d = 1; d <= lastDay; d++) {
            const key = `${y}-${pad(m)}-${pad(d)}`;
            rows.push({
                date: `${MONTHS[m - 1]}/${pad(d)}`,
                ...valuesFor(key),
            });
        }
        return rows;
    }, [
        trendMonth,
        chartDates,
        todayStr,
        computerPerDay,
        printerPerDay,
        boxingPerDay,
        repairPerDay,
        cctvPerDay,
    ]);

    // Totals for the selected period (used by the 5 summary cards)
    const totals = useMemo(() => {
        const t = {};
        TREND_SERIES.forEach((s) => {
            t[s.key] = chartData.reduce((sum, r) => sum + r[s.key], 0);
        });
        return t;
    }, [chartData]);

    const periodLabel =
        trendMonth === "all" ? "All months" : fmtMonthKey(trendMonth);

    const monthIdx = monthOptions.indexOf(trendMonth);
    const canGoOlder =
        trendMonth !== "all" && monthIdx < monthOptions.length - 1;
    const canGoNewer = trendMonth !== "all" && monthIdx > 0;

    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />

            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <ChartNetwork className="h-8 w-8" />
                        Checklist Monitoring Dashboard
                    </h1>

                    <div
                        className="flex items-center gap-1.5 text-xs text-muted-foreground"
                        title="Data refreshes automatically every 60 seconds"
                    >
                        <RefreshCw
                            className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
                        />
                        <span>
                            Last updated:{" "}
                            {lastUpdated ? fmtTime(lastUpdated) : "-"}
                        </span>
                    </div>
                </div>

                {/* PM Status Summary */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="bg-red-50 border-red-200">
                        <CardContent className="pt-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">
                                    Overdue PM
                                </p>
                                <p className="text-4xl font-bold text-red-700">
                                    {overdueItems.length}
                                </p>
                            </div>
                            <AlertTriangle className="h-10 w-10 text-red-600" />
                        </CardContent>
                    </Card>

                    <Card className="bg-green-50 border-green-200">
                        <CardContent className="pt-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">
                                    Available for PM
                                </p>
                                <p className="text-4xl font-bold text-green-700">
                                    {availableItems.length}
                                </p>
                            </div>
                            <CheckCircle2 className="h-10 w-10 text-green-600" />
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-50 border-slate-200">
                        <CardContent className="pt-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">
                                    Upcoming
                                </p>
                                <p className="text-4xl font-bold text-slate-700">
                                    {upcomingItems.length}
                                </p>
                            </div>
                            <CalendarDays className="h-10 w-10 text-slate-600" />
                        </CardContent>
                    </Card>
                </div>

                {/* Calendar + Lists (equal height on xl) */}
                <div className="grid gap-4 xl:grid-cols-3 items-stretch">
                    <div className="xl:col-span-2">
                        <PmCalendar
                            today={todayStr}
                            eventsByDate={eventsByDate}
                            typeFilter={typeFilter}
                            setTypeFilter={setTypeFilter}
                        />
                    </div>

                    <div className="flex flex-col gap-4 xl:h-[800px]">
                        <PmList
                            title="Overdue PM"
                            icon={<AlertTriangle className="h-5 w-5" />}
                            items={overdueItems}
                            emptyText="No overdue PM."
                            headerClass="text-red-700"
                            rowClass="bg-red-50 border-red-200"
                        />

                        <PmList
                            title="Available for PM"
                            icon={<CheckCircle2 className="h-5 w-5" />}
                            items={availableItems}
                            emptyText="None available yet."
                            headerClass="text-green-700"
                            rowClass="bg-green-50 border-green-200"
                        />

                        <PmList
                            title="Upcoming PM"
                            icon={<CalendarDays className="h-5 w-5" />}
                            items={upcomingItems}
                            emptyText="No upcoming PM."
                            headerClass="text-slate-700"
                            rowClass="bg-slate-50 border-slate-200"
                        />
                    </div>
                </div>

                {/* Checklist Activity: month filter (controls cards + chart) */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
                        <ChartSpline className="h-6 w-6 text-blue-600" />
                        Checklist Activity
                        <span className="text-sm font-medium text-muted-foreground">
                            ({periodLabel})
                        </span>
                    </h2>

                    <div className="flex items-center gap-2">
                        <button
                            className="p-1 border rounded-md hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent"
                            onClick={() =>
                                setTrendMonth(monthOptions[monthIdx + 1])
                            }
                            disabled={!canGoOlder}
                            title="Previous month"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>

                        <select
                            className="border rounded-md px-2 py-1 text-sm bg-background min-w-[10rem]"
                            value={trendMonth}
                            onChange={(e) => setTrendMonth(e.target.value)}
                        >
                            <option value="all">All months</option>
                            {monthOptions.map((key) => (
                                <option key={key} value={key}>
                                    {fmtMonthKey(key)}
                                </option>
                            ))}
                        </select>

                        <button
                            className="p-1 border rounded-md hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent"
                            onClick={() =>
                                setTrendMonth(monthOptions[monthIdx - 1])
                            }
                            disabled={!canGoNewer}
                            title="Next month"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Summary Cards (totals for the selected period) */}
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                    <Card className="bg-blue-50 border-blue-200">
                        <CardContent className="pt-6">
                            <Monitor className="h-10 w-10 text-blue-600 mb-3" />
                            <p className="text-sm text-slate-600">
                                Computer Checklists ({periodLabel})
                            </p>
                            <p className="text-4xl font-bold text-blue-700 text-right">
                                {totals.computer}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-cyan-50 border-cyan-200">
                        <CardContent className="pt-6">
                            <Printer className="h-10 w-10 text-cyan-600 mb-3" />
                            <p className="text-sm text-slate-600">
                                Printer Checklists ({periodLabel})
                            </p>
                            <p className="text-4xl font-bold text-cyan-700 text-right">
                                {totals.printer}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-amber-50 border-amber-200">
                        <CardContent className="pt-6">
                            <Package className="h-10 w-10 text-amber-700 mb-3" />
                            <p className="text-sm text-slate-600">
                                Boxing Checklists ({periodLabel})
                            </p>
                            <p className="text-4xl font-bold text-amber-700 text-right">
                                {totals.boxing}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-lime-50 border-lime-200">
                        <CardContent className="pt-6">
                            <Wrench className="h-10 w-10 text-lime-700 mb-3" />
                            <p className="text-sm text-slate-600">
                                Computer Repairs ({periodLabel})
                            </p>
                            <p className="text-4xl font-bold text-lime-700 text-right">
                                {totals.repair}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-100 border-slate-300">
                        <CardContent className="pt-6">
                            <Camera className="h-10 w-10 text-slate-700 mb-3" />
                            <p className="text-sm text-slate-600">
                                CCTV Checklists ({periodLabel})
                            </p>
                            <p className="text-4xl font-bold text-slate-700 text-right">
                                {totals.cctv}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Chart */}
                <Card className="bg-white border-gray-200">
                    <CardHeader className="px-10">
                        <div className="flex flex-col gap-2">
                            <p className="text-md text-muted-foreground text-stone-700">
                                {currentDateTime}
                            </p>

                            <CardTitle className="text-2xl text-blue-600 flex items-center gap-2">
                                <ChartSpline className="h-8 w-8" />
                                Daily Checklist Trend
                            </CardTitle>
                        </div>
                    </CardHeader>

                    <CardContent>
                        <ResponsiveContainer width="100%" height={450}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Legend />

                                {TREND_SERIES.map((s) => (
                                    <Line
                                        key={s.key}
                                        type="monotone"
                                        dataKey={s.key}
                                        name={s.name}
                                        stroke={s.color}
                                        strokeWidth={3}
                                        dot={trendMonth !== "all"}
                                        activeDot={{ r: 5 }}
                                    />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}

import React, { useState, useEffect } from "react";
import { router, usePage } from "@inertiajs/react";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Checkbox } from "@/Components/ui/checkbox";
import { Badge } from "@/Components/ui/badge";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/Components/ui/table";

import { Tabs, TabsList, TabsTrigger } from "@/Components/ui/tabs";

import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Search,
    X,
    CalendarRange,
    Download,
    ArrowUp,
    ArrowDown,
    ArrowUpDown,
    Inbox,
} from "lucide-react";

const cx = (...classes) => classes.filter(Boolean).join(" ");

// Builds [1, "…l", 4, 5, 6, "…r", 20]
const getPages = (current, last) => {
    if (last <= 7) {
        return Array.from({ length: last }, (_, i) => i + 1);
    }

    const pages = [1];
    const start = Math.max(2, current - 1);
    const end = Math.min(last - 1, current + 1);

    if (start > 2) pages.push("…l");
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < last - 1) pages.push("…r");

    pages.push(last);
    return pages;
};

export default function DataTable({
    columns,
    data = [],
    meta = {},
    filters = {},
    routeName = "",
    rowKey = "id",
    selectable = false,
    dateRangeSearch = false,
    onSelectionChange = () => {},
    showExport = false,
    children,
    filterDropdown = null,
    tabs = [],
    tabKey = "tab",
}) {
    const { emp_data } = usePage().props;

    const canAccess = ["admin", "superadmin"].includes(
        emp_data?.emp_role || emp_data?.emp_system_role,
    );

    const [selected, setSelected] = useState([]);
    const [activeRow, setActiveRow] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searchInput, setSearchInput] = useState(filters.search || "");
    const [perPage, setPerPage] = useState(filters.perPage || 10);
    const [dropdownValue, setDropdownValue] = useState(
        filters?.[filterDropdown?.key] || "",
    );

    const extractDate = (dt) => (dt ? dt.split(" ")[0] : "");
    const [dateFrom, setDateFrom] = useState(extractDate(filters.start));
    const [dateTo, setDateTo] = useState(extractDate(filters.end));
    const [localTab, setLocalTab] = useState(filters?.[tabKey] || "");

    const hasDateFilter = Boolean(dateFrom && dateTo);
    const hasActiveFilters = Boolean(
        filters.search || filters.start || filters.end || dropdownValue,
    );

    // Loading indicator on any Inertia visit
    useEffect(() => {
        const offStart = router.on("start", () => setLoading(true));
        const offFinish = router.on("finish", () => setLoading(false));
        return () => {
            offStart?.();
            offFinish?.();
        };
    }, []);

    const handleTabChange = (value) => {
        setLocalTab(value);

        router.get(routeName, {
            ...filters,
            [tabKey]: value,
            page: 1,
        });
    };

    const handleSearch = (e) => {
        e.preventDefault();

        const extraFilter = filterDropdown
            ? {
                  [filterDropdown.key]: dropdownValue,
                  dropdownFields: filterDropdown.fields.join(","),
              }
            : {};

        router.get(
            routeName,
            { ...filters, search: searchInput, page: 1, ...extraFilter },
            { preserveState: true },
        );
    };

    const handleDateFilter = (e) => {
        e.preventDefault();
        const formattedFrom = dateFrom ? `${dateFrom} 00:00:00` : null;
        const formattedTo = dateTo ? `${dateTo} 23:59:59` : null;

        setSearchInput("");

        router.get(
            routeName,
            {
                ...filters,
                start: formattedFrom,
                end: formattedTo,
                search: undefined,
                page: 1,
            },
            { preserveState: true },
        );
    };

    const handleClearFilters = () => {
        setSearchInput("");
        setDateFrom("");
        setDateTo("");
        setDropdownValue("");

        const base = { perPage };
        if (tabs.length > 0) base[tabKey] = localTab;

        router.get(routeName, base, { preserveState: true });
    };

    const handleExport = () => {
        if (!hasDateFilter) return;

        const query = {
            ...filters,
            perPage,
            start: `${dateFrom} 00:00:00`,
            end: `${dateTo} 23:59:59`,
            export: 1,
        };

        const queryString = new URLSearchParams(query).toString();

        window.open(`${routeName}?${queryString}`, "_blank");
    };

    const handleSelectAll = (checked) => {
        const newSelection = checked ? [...data] : [];
        setSelected(newSelection);
        onSelectionChange(newSelection);
    };

    const handleSelectRow = (row) => {
        const exists = selected.find((r) => r[rowKey] === row[rowKey]);
        const newSelection = exists
            ? selected.filter((r) => r[rowKey] !== row[rowKey])
            : [...selected, row];
        setSelected(newSelection);
        onSelectionChange(newSelection);
    };

    const handleRowClick = (row) => {
        setActiveRow(row);
    };

    const handleSort = (key) => {
        const isSameKey = filters.sortBy === key;
        const newDirection =
            isSameKey && filters.sortDirection === "asc" ? "desc" : "asc";
        router.get(
            routeName,
            { ...filters, sortBy: key, sortDirection: newDirection },
            { preserveState: true },
        );
    };

    const goToPage = (page) => {
        if (!meta?.lastPage) return;
        if (page < 1 || page > meta.lastPage || page === meta.currentPage) {
            return;
        }

        router.get(routeName, { ...filters, page }, { preserveState: true });
    };

    const renderPagination = () => {
        if (!meta?.currentPage || !meta?.lastPage || meta.lastPage <= 1) {
            return null;
        }

        const current = meta.currentPage;
        const last = meta.lastPage;

        return (
            <div className="flex items-center gap-1">
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={current <= 1}
                    onClick={() => goToPage(1)}
                    title="First page"
                >
                    <ChevronsLeft className="h-4 w-4" />
                </Button>

                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={current <= 1}
                    onClick={() => goToPage(current - 1)}
                    title="Previous page"
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>

                {getPages(current, last).map((page) =>
                    typeof page === "string" ? (
                        <span
                            key={page}
                            className="px-1 text-sm text-muted-foreground"
                        >
                            …
                        </span>
                    ) : (
                        <Button
                            key={page}
                            size="sm"
                            variant={page === current ? "default" : "outline"}
                            className="h-8 min-w-8 px-2"
                            onClick={() => goToPage(page)}
                        >
                            {page}
                        </Button>
                    ),
                )}

                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={current >= last}
                    onClick={() => goToPage(current + 1)}
                    title="Next page"
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>

                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={current >= last}
                    onClick={() => goToPage(last)}
                    title="Last page"
                >
                    <ChevronsRight className="h-4 w-4" />
                </Button>
            </div>
        );
    };

    return (
        <div className="relative w-full overflow-hidden rounded-xl border bg-background shadow-sm">
            {/* Loading bar */}
            {loading && (
                <div className="absolute inset-x-0 top-0 z-10 h-0.5 animate-pulse bg-primary" />
            )}

            {/* TABS */}
            {canAccess && tabs.length > 0 && (
                <div className="border-b bg-muted/30 px-4 pt-3">
                    <Tabs value={localTab} onValueChange={handleTabChange}>
                        <TabsList>
                            {tabs.map((tab) => (
                                <TabsTrigger key={tab.value} value={tab.value}>
                                    {tab.label}

                                    {tab.count !== undefined && (
                                        <Badge
                                            variant="secondary"
                                            className="ml-2"
                                        >
                                            {tab.count}
                                        </Badge>
                                    )}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>
                </div>
            )}

            {/* TOOLBAR */}
            <form
                onSubmit={dateRangeSearch ? handleDateFilter : handleSearch}
                className="flex flex-wrap items-center gap-3 border-b p-4"
            >
                {/* Per page */}
                <Select
                    value={String(perPage)}
                    onValueChange={(value) => {
                        const parsed = Number(value);

                        setPerPage(parsed);

                        router.get(
                            routeName,
                            {
                                ...filters,
                                perPage: parsed,
                                page: 1,
                            },
                            {
                                preserveState: true,
                            },
                        );
                    }}
                >
                    <SelectTrigger className="h-9 w-[120px]">
                        <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                        {[10, 25, 50, 100].map((num) => (
                            <SelectItem key={num} value={String(num)}>
                                Show {num}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Date range */}
                {dateRangeSearch && (
                    <div className="flex flex-1 flex-wrap items-center justify-center gap-2">
                        <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-1">
                            <CalendarRange className="h-4 w-4 text-muted-foreground" />

                            <Input
                                type="date"
                                value={dateFrom}
                                max={dateTo || undefined}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="h-8 w-[150px] border-0 bg-transparent px-1 shadow-none focus-visible:ring-0"
                            />

                            <span className="text-xs font-medium uppercase text-muted-foreground">
                                to
                            </span>

                            <Input
                                type="date"
                                value={dateTo}
                                min={dateFrom || undefined}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="h-8 w-[150px] border-0 bg-transparent px-1 shadow-none focus-visible:ring-0"
                            />
                        </div>

                        <Button type="submit" className="h-9">
                            Filter
                        </Button>
                    </div>
                )}

                {/* Right side: dropdown + search + export */}
                <div className="ml-auto flex flex-wrap items-center gap-2">
                    {filterDropdown && (
                        <Select
                            value={dropdownValue || "all"}
                            onValueChange={(value) => {
                                const selectedValue =
                                    value === "all" ? "" : value;

                                setDropdownValue(selectedValue);

                                router.get(
                                    routeName,
                                    {
                                        ...filters,
                                        search: searchInput,
                                        page: 1,
                                        [filterDropdown.key]: selectedValue,
                                        dropdownFields:
                                            filterDropdown.fields.join(","),
                                    },
                                    { preserveState: true },
                                );
                            }}
                        >
                            <SelectTrigger className="h-9 w-[150px]">
                                <SelectValue placeholder="All" />
                            </SelectTrigger>

                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>

                                {filterDropdown.options.map((opt) => (
                                    <SelectItem
                                        key={opt.value}
                                        value={String(opt.value)}
                                    >
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}

                    <div className="relative">
                        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                        <Input
                            className="h-9 w-[240px] pl-9 pr-8"
                            placeholder="Search..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    handleSearch(e);
                                }
                            }}
                        />

                        {searchInput && (
                            <button
                                type="button"
                                onClick={() => setSearchInput("")}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                title="Clear search"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    <Button
                        type="button"
                        className="h-9"
                        onClick={handleSearch}
                    >
                        Search
                    </Button>

                    {hasActiveFilters && (
                        <Button
                            type="button"
                            variant="ghost"
                            className="h-9 text-muted-foreground hover:text-foreground"
                            onClick={handleClearFilters}
                        >
                            <X className="mr-1 h-4 w-4" />
                            Clear
                        </Button>
                    )}

                    {showExport && (
                        <Button
                            type="button"
                            variant="outline"
                            className="h-9"
                            onClick={handleExport}
                            disabled={!hasDateFilter}
                            title={
                                hasDateFilter
                                    ? "Export filtered data"
                                    : "Select a date range first"
                            }
                        >
                            <Download className="mr-1 h-4 w-4" />
                            Export
                        </Button>
                    )}
                </div>
            </form>

            {/* TABLE */}
            <div
                className={cx(
                    "w-full overflow-x-auto transition-opacity",
                    loading && "pointer-events-none opacity-60",
                )}
            >
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                            {selectable && (
                                <TableHead className="w-10">
                                    <Checkbox
                                        checked={
                                            selected.length === data.length &&
                                            data.length > 0
                                        }
                                        onCheckedChange={handleSelectAll}
                                    />
                                </TableHead>
                            )}
                            {columns.map((col) => {
                                const sortable =
                                    col.sortable !== false &&
                                    col.key !== "actions";
                                const isSorted = filters.sortBy === col.key;

                                return (
                                    <TableHead
                                        key={col.key}
                                        onClick={
                                            sortable
                                                ? () => handleSort(col.key)
                                                : undefined
                                        }
                                        className={cx(
                                            "whitespace-nowrap text-xs font-semibold uppercase tracking-wide text-muted-foreground",
                                            sortable &&
                                                "cursor-pointer select-none hover:text-foreground",
                                        )}
                                    >
                                        <span className="inline-flex items-center gap-1">
                                            {col.label}
                                            {sortable &&
                                                (isSorted ? (
                                                    filters.sortDirection ===
                                                    "asc" ? (
                                                        <ArrowUp className="h-3.5 w-3.5 text-foreground" />
                                                    ) : (
                                                        <ArrowDown className="h-3.5 w-3.5 text-foreground" />
                                                    )
                                                ) : (
                                                    <ArrowUpDown className="h-3.5 w-3.5 opacity-30" />
                                                ))}
                                        </span>
                                    </TableHead>
                                );
                            })}
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {data.length === 0 ? (
                            <TableRow className="hover:bg-transparent">
                                <TableCell
                                    colSpan={
                                        columns.length + (selectable ? 1 : 0)
                                    }
                                    className="py-14"
                                >
                                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                                        <Inbox className="h-10 w-10 opacity-40" />
                                        <p className="text-sm font-medium">
                                            No results found
                                        </p>
                                        {hasActiveFilters && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={handleClearFilters}
                                            >
                                                Clear filters
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((row, index) => {
                                const key = `${row[rowKey]}-${index}`;
                                const isSelected = selected.some(
                                    (r) => r[rowKey] === row[rowKey],
                                );
                                return (
                                    <TableRow
                                        key={key}
                                        className={cx(
                                            "cursor-pointer transition-colors even:bg-muted/20 hover:bg-accent/60",
                                            isSelected && "bg-primary/5",
                                        )}
                                        onClick={() => handleRowClick(row)}
                                    >
                                        {selectable && (
                                            <TableCell
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                            >
                                                <Checkbox
                                                    checked={isSelected}
                                                    onCheckedChange={() =>
                                                        handleSelectRow(row)
                                                    }
                                                />
                                            </TableCell>
                                        )}
                                        {columns.map((col, i) => (
                                            <TableCell
                                                key={`${key}-${col.key}-${i}`}
                                                className={cx(
                                                    "max-w-[220px] truncate whitespace-nowrap text-sm",
                                                    col.className,
                                                )}
                                            >
                                                {col.render
                                                    ? col.render(row)
                                                    : (row[col.key] ?? "-")}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* FOOTER */}
            {meta?.links?.length > 0 && (
                <div className="flex flex-col gap-2 border-t bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-muted-foreground">
                        Showing{" "}
                        <span className="font-medium text-foreground">
                            {meta.from ?? 0}
                        </span>{" "}
                        to{" "}
                        <span className="font-medium text-foreground">
                            {meta.to ?? 0}
                        </span>{" "}
                        of{" "}
                        <span className="font-medium text-foreground">
                            {meta.total ?? 0}
                        </span>{" "}
                        results
                    </div>
                    {renderPagination()}
                </div>
            )}

            {typeof children === "function" &&
                activeRow &&
                children(activeRow, () => setActiveRow(null))}
        </div>
    );
}

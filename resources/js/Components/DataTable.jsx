import React, { useState } from "react";
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

import { ChevronLeft, ChevronRight, Search } from "lucide-react";

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
        emp_data.emp_role || emp_data.emp_system_role,
    );

    const [selected, setSelected] = useState([]);
    const [activeRow, setActiveRow] = useState(null);
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
            { ...filters, search: searchInput, ...extraFilter },
            { preserveState: true },
        );
    };

    const handleDateFilter = (e) => {
        e.preventDefault();
        const formattedFrom = dateFrom ? `${dateFrom} 00:00:00` : null;
        const formattedTo = dateTo ? `${dateTo} 23:59:59` : null;

        router.get(
            routeName,
            {
                ...filters,
                start: formattedFrom,
                end: formattedTo,
                search: undefined,
            },
            { preserveState: true },
        );
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

    const handleSelectAll = (e) => {
        const isChecked = e.target.checked;
        const newSelection = isChecked ? [...data] : [];
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

    const renderPaginationLinks = () => {
        if (!meta?.links || !meta.currentPage || !meta.lastPage) return null;

        const current = meta.currentPage;
        const last = meta.lastPage;
        const pages = [];

        let start = Math.max(current - 2, 1);
        let end = Math.min(start + 4, last);

        if (end - start < 4) {
            start = Math.max(end - 4, 1);
        }

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }

        return (
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="icon"
                    disabled={current <= 1}
                    onClick={() => {
                        const prev = meta.links.find(
                            (l) => l.label === "&laquo;",
                        );

                        if (prev?.url) {
                            router.visit(prev.url);
                        }
                    }}
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>

                {pages.map((page) => (
                    <Button
                        key={page}
                        size="sm"
                        variant={page === current ? "default" : "outline"}
                        onClick={() => {
                            const pageLink = meta.links.find(
                                (l) => parseInt(l.label) === page,
                            );

                            if (pageLink?.url) {
                                router.visit(pageLink.url);
                            }
                        }}
                    >
                        {page}
                    </Button>
                ))}

                <Button
                    variant="outline"
                    size="icon"
                    disabled={current >= last}
                    onClick={() => {
                        const next = meta.links.find(
                            (l) => l.label === "&raquo;",
                        );

                        if (next?.url) {
                            router.visit(next.url);
                        }
                    }}
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        );
    };

    return (
        <div className="w-full rounded-lg border bg-background p-4">
            {canAccess && tabs.length > 0 && (
                <Tabs value={localTab} onValueChange={handleTabChange}>
                    <TabsList>
                        {tabs.map((tab) => (
                            <TabsTrigger key={tab.value} value={tab.value}>
                                {tab.label}

                                {tab.count !== undefined && (
                                    <Badge variant="secondary" className="ml-2">
                                        {tab.count}
                                    </Badge>
                                )}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>
            )}
            <form
                onSubmit={dateRangeSearch ? handleDateFilter : handleSearch}
                className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
            >
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
                            },
                            {
                                preserveState: true,
                            },
                        );
                    }}
                >
                    <SelectTrigger className="w-[120px]">
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

                <div className="flex w-full items-center justify-between gap-4">
                    {/* LEFT (optional space / future use) */}
                    <div className="flex-1" />

                    {/* MIDDLE: DATE FILTER (CENTERED) */}
                    {canAccess && dateRangeSearch && (
                        <div className="flex items-center gap-2 justify-center flex-1">
                            <Input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                            />

                            <span className="mx-1">to</span>

                            <Input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                            />

                            <Button type="submit">Filter</Button>

                            {showExport && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleExport}
                                    disabled={!hasDateFilter}
                                >
                                    Export
                                </Button>
                            )}
                        </div>
                    )}

                    {/* RIGHT: SEARCH FIELD */}
                    <div className="flex items-center gap-2 justify-end flex-1">
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
                                            [filterDropdown.key]: selectedValue,
                                            dropdownFields:
                                                filterDropdown.fields.join(","),
                                        },
                                        { preserveState: true },
                                    );
                                }}
                            >
                                <SelectTrigger className="w-[150px]">
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

                        <Input
                            className="w-[220px]"
                            placeholder="Search..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    handleSearch(e);
                                }
                            }}
                        />

                        <Button
                            size="icon"
                            type="button"
                            onClick={handleSearch}
                        >
                            <Search className="h-4 w-4" />
                        </Button>

                        {showExport && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleExport}
                            >
                                Export
                            </Button>
                        )}
                    </div>
                </div>
            </form>

            <div className="w-full mt-4 overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {selectable && (
                                <TableHead>
                                    <Checkbox
                                        checked={
                                            selected.length === data.length &&
                                            data.length > 0
                                        }
                                        onCheckedChange={(checked) =>
                                            handleSelectAll({
                                                target: {
                                                    checked,
                                                },
                                            })
                                        }
                                    />
                                </TableHead>
                            )}
                            {columns.map((col) => (
                                <TableHead
                                    key={col.key}
                                    onClick={() => handleSort(col.key)}
                                    className="cursor-pointer whitespace-nowrap"
                                >
                                    {col.label}
                                    {filters.sortBy === col.key && (
                                        <span className="ml-1 text-xs">
                                            {filters.sortDirection === "asc"
                                                ? "▲"
                                                : "▼"}
                                        </span>
                                    )}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={
                                        columns.length + (selectable ? 1 : 0)
                                    }
                                    className="text-center"
                                >
                                    No results found.
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
                                        className="cursor-pointer transition-colors hover:bg-muted/50"
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
                                                className="whitespace-nowrap max-w-[200px] truncate"
                                            >
                                                {row[col.key] ?? "-"}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {meta?.links?.length > 0 && (
                <div className="flex flex-col gap-2 mt-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-gray-500">
                        Showing {meta.from} to {meta.to} of {meta.total} results
                    </div>
                    {renderPaginationLinks()}
                </div>
            )}

            {typeof children === "function" &&
                activeRow &&
                children(activeRow, () => setActiveRow(null))}
        </div>
    );
}

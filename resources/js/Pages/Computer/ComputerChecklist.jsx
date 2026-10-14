import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import DataTable from "@/Components/DataTable";
import { useState, useEffect, useRef } from "react";
import { Eye, Pencil, Trash2, BadgeCheck } from "lucide-react";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/Components/ui/dialog";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/Components/ui/table";

import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Textarea } from "@/Components/ui/textarea";
import { Checkbox } from "@/Components/ui/checkbox";
import { Label } from "@/Components/ui/label";

import { X, Save } from "lucide-react";

// ─── Searchable Combobox ───────────────────────────────────────────────────────
function ComboboxSelect({
    value,
    onChange,
    options,
    placeholder = "Search computer...",
}) {
    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    const filtered = options.filter((opt) =>
        opt.toLowerCase().includes(query.toLowerCase()),
    );

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <div className="relative" ref={ref}>
            <input
                type="text"
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background"
                placeholder={placeholder}
                value={open ? query : value}
                onFocus={() => {
                    setOpen(true);
                    setQuery("");
                }}
                onChange={(e) => {
                    setQuery(e.target.value);
                    setOpen(true);
                }}
            />
            {open && filtered.length > 0 && (
                <ul className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto border rounded-md bg-popover shadow-md text-sm">
                    {filtered.map((opt) => (
                        <li
                            key={opt}
                            className="px-3 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground"
                            onMouseDown={() => {
                                onChange(opt);
                                setQuery("");
                                setOpen(false);
                            }}
                        >
                            {opt}
                        </li>
                    ))}
                </ul>
            )}
            {open && filtered.length === 0 && (
                <div className="absolute z-50 w-full mt-1 border rounded-md bg-popover shadow-md text-sm px-3 py-2 text-muted-foreground">
                    No results found
                </div>
            )}
        </div>
    );
}
// ──────────────────────────────────────────────────────────────────────────────

export default function ComputerChecklist({
    tableData,
    tableFilters,
    computerChecklists,
    computerName,
    emp_data,
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [checklistItems, setChecklistItems] = useState([]);
    const [selectedComputer, setSelectedComputer] = useState("");
    const [performedBy, setPerformedBy] = useState("");
    const [recommendations, setRecommendations] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const parseLocalDate = (str) => {
        const [year, month, day] = str.split("-").map(Number);
        return new Date(year, month - 1, day);
    };

    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    const getLastDayAfterSixMonths = (date) => {
        const d = typeof date === "string" ? parseLocalDate(date) : date;
        const lastDay = new Date(d.getFullYear(), d.getMonth() + 7, 0);
        return formatDate(lastDay);
    };

    const [dateChecked, setDateChecked] = useState(() =>
        formatDate(new Date()),
    );

    const [dateDue, setDateDue] = useState(() =>
        getLastDayAfterSixMonths(new Date()),
    );

    useEffect(() => {
        if (dateChecked) {
            setDateDue(getLastDayAfterSixMonths(dateChecked));
        }
    }, [dateChecked]);

    const [hostnames, setHostnames] = useState([]);

    // View modal states
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [viewItem, setViewItem] = useState(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editId, setEditId] = useState(null);

    // Map hostnames from server data
    useEffect(() => {
        if (computerName) {
            const hosts = computerName.map((c) => c.hostname).sort();
            setHostnames(hosts);
        }
    }, [computerName]);

    // Initialize checklist items when modal opens
    useEffect(() => {
        if (isOpen) {
            const itemsWithStatus = computerChecklists.map((item) => ({
                task: item.task,
                description: item.description,
                status: null,
            }));
            setChecklistItems(itemsWithStatus);
        }
    }, [isOpen, computerChecklists]);

    const toggleModal = () => setIsOpen(!isOpen);

    const handleCheckboxChange = (rowIndex, column) => {
        setChecklistItems((prev) =>
            prev.map((item, i) =>
                i === rowIndex ? { ...item, status: column } : item,
            ),
        );
    };

    const firstError = (errors, fallback) =>
        errors?.computer_name || Object.values(errors || {})[0] || fallback;

    const handleDelete = (id) => {
        if (confirm("Are you sure you want to delete this checklist?")) {
            router.delete(route("computer-checklist.destroy", id), {
                preserveScroll: true,
                onSuccess: () => {
                    alert("✅ Checklist removed successfully.");
                    window.location.reload();
                },
            });
        }
    };

    // Open view modal
    const openViewModal = (item) => {
        const items =
            typeof item.items === "string"
                ? JSON.parse(item.items)
                : item.items;
        setViewItem({ ...item, items });
        setIsViewOpen(true);
    };

    const closeViewModal = () => {
        setViewItem(null);
        setIsViewOpen(false);
    };

    const handleSaveChecklist = () => {
        if (submitting) return;

        const payload = {
            computer_name: selectedComputer,
            date_checked: dateChecked,
            date_due: dateDue,
            items: checklistItems.map((item) => ({
                task: item.task,
                description: item.description,
                status: item.status,
            })),
            recommendations: recommendations,
        };

        router.post(route("computer-checklist.store"), payload, {
            onStart: () => setSubmitting(true),
            onFinish: () => setSubmitting(false),
            onSuccess: () => {
                alert("✅ Checklist saved successfully!");
                toggleModal();
                window.location.reload();
            },
            onError: (errors) => {
                console.error(errors);
                alert("❌ " + firstError(errors, "Error saving checklist."));
            },
        });
    };

    // Open edit modal
    const openEditModal = (item) => {
        setEditId(item.id);
        setSelectedComputer(item.computer_name);
        setDateChecked(
            item.date_checked ? item.date_checked.split("T")[0] : "",
        );
        setDateDue(item.date_due ? item.date_due.split("T")[0] : "");
        setPerformedBy(item.performed_by || "");
        setRecommendations(item.recommendations || "");

        const items =
            typeof item.items === "string"
                ? JSON.parse(item.items)
                : item.items;
        const itemsWithStatus = items.map((i) => ({
            task: i.task,
            description: i.description,
            status: i.status,
        }));
        setChecklistItems(itemsWithStatus);

        setIsEditOpen(true);
    };

    const handleUpdateChecklist = () => {
        if (submitting) return;

        const payload = {
            computer_name: selectedComputer,
            date_checked: dateChecked,
            date_due: dateDue,
            performed_by: performedBy,
            items: checklistItems,
            recommendations,
        };

        router.put(route("computer-checklist.update", editId), payload, {
            onStart: () => setSubmitting(true),
            onFinish: () => setSubmitting(false),
            onSuccess: () => {
                alert("✅ Checklist updated successfully!");
                setIsEditOpen(false);
                window.location.reload();
            },
            onError: (errors) => {
                console.error(errors);
                alert("❌ " + firstError(errors, "Error updating checklist."));
            },
        });
    };

    const handleVerify = (id) => {
        if (!confirm("Mark this checklist as verified?")) return;

        router.put(
            route("computer-checklist.verify", id),
            {},
            {
                onSuccess: () => {
                    alert("✅ Checklist verified successfully!");
                    setViewItem((prev) => ({
                        ...prev,
                        verified_by: emp_data?.emp_name || "Verified",
                    }));
                    router.visit(
                        `${route("computer-checklist")}?page=1&status=2`,
                    );
                },
                onError: () => {
                    alert("❌ Error verifying checklist.");
                },
            },
        );
    };

    const isAdmin = Number(emp_data?.emp_id) === 1268;

    const dataWithAction = tableData.data.map((item) => {
        const [dueYear, dueMonth, dueDay] = item.date_due.split("-");
        const [checkYear, checkMonth, checkDay] = item.date_checked.split("-");
        const canModify =
            !item.verified_by &&
            (item.performed_by === emp_data?.emp_name || isAdmin);

        return {
            ...item,
            date_due: `${dueMonth}/${dueDay}/${dueYear}`,
            date_checked: `${checkMonth}/${checkDay}/${checkYear}`,
            actions: (
                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => openViewModal(item)}
                    >
                        <Eye className="h-4 w-4" />
                    </Button>

                    {canModify && (
                        <>
                            <Button
                                size="sm"
                                className="bg-amber-500 hover:bg-amber-600 text-white"
                                onClick={() => openEditModal(item)}
                            >
                                <Pencil className="h-4 w-4" />
                            </Button>

                            <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDelete(item.id)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </>
                    )}
                </div>
            ),
        };
    });

    const canSave =
        selectedComputer &&
        checklistItems.length > 0 &&
        checklistItems.every((item) => item.status);

    return (
        <AuthenticatedLayout>
            <Head title="Computer Checklist" />

            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold">
                    <i className="fa-solid fa-list-check mr-2"></i> Computer
                    Checklist
                </h1>

                <button
                    className="text-white bg-green-500 border-2 border-green-900 btn hover:bg-green-700 rounded-md"
                    onClick={toggleModal}
                >
                    <i className="fa-solid fa-file-circle-plus"></i> New
                    Checklist
                </button>
            </div>

            <DataTable
                columns={[
                    { key: "computer_name", label: "Computer Name" },
                    { key: "date_checked", label: "Date Done" },
                    { key: "date_due", label: "Date Due" },
                    { key: "performed_by", label: "Done By" },
                    { key: "verified_by", label: "Verified By" },
                    { key: "actions", label: "Action" },
                ]}
                data={dataWithAction}
                meta={{
                    from: tableData.from,
                    to: tableData.to,
                    total: tableData.total,
                    links: tableData.links,
                    currentPage: tableData.current_page,
                    lastPage: tableData.last_page,
                }}
                routeName={route("computer-checklist")}
                filters={tableFilters}
                rowKey="id"
                dateRangeSearch={true}
                showExport={false}
                tabKey="status"
                tabs={[
                    { label: "All", value: "" },
                    { label: "Pending", value: "2" },
                    { label: "Verified", value: "1" },
                ]}
            />

            {/* ── CREATE MODAL ───────────────────────────────────────────── */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-center text-2xl font-bold text-red-800 uppercase">
                            Preventive Maintenance Checklist for Desktop and
                            Laptop
                        </DialogTitle>
                    </DialogHeader>

                    {/* FORM */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <Label>Computer Name</Label>
                            <ComboboxSelect
                                value={selectedComputer}
                                onChange={setSelectedComputer}
                                options={hostnames}
                                placeholder="Search computer..."
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Date Done</Label>
                            <Input
                                type="date"
                                value={dateChecked}
                                onChange={(e) => setDateChecked(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Date Due</Label>
                            <Input
                                type="date"
                                value={dateDue}
                                onChange={(e) => setDateDue(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Done By</Label>
                            <Input
                                value={emp_data?.emp_name ?? ""}
                                readOnly
                                className="bg-muted"
                            />
                        </div>
                    </div>

                    {/* TABLE */}
                    <div className="border rounded-md max-h-[600px] overflow-y-auto">
                        <Table>
                            <TableHeader className="sticky top-0 bg-background z-10">
                                <TableRow>
                                    <TableHead className="w-16">
                                        Item#
                                    </TableHead>
                                    <TableHead>Task</TableHead>
                                    <TableHead>Description</TableHead>

                                    <TableHead className="w-24">
                                        <div className="flex flex-col items-center justify-center">
                                            <Checkbox
                                                checked={checklistItems.every(
                                                    (item) =>
                                                        item.status === "ok",
                                                )}
                                                onCheckedChange={(checked) => {
                                                    const status = checked
                                                        ? "ok"
                                                        : null;
                                                    setChecklistItems((prev) =>
                                                        prev.map((item) => ({
                                                            ...item,
                                                            status,
                                                        })),
                                                    );
                                                }}
                                            />
                                            <span className="mt-1 text-xs font-medium">
                                                OK
                                            </span>
                                        </div>
                                    </TableHead>

                                    <TableHead className="w-24">
                                        <div className="flex flex-col items-center justify-center">
                                            <Checkbox
                                                checked={checklistItems.every(
                                                    (item) =>
                                                        item.status ===
                                                        "repair",
                                                )}
                                                onCheckedChange={(checked) => {
                                                    const status = checked
                                                        ? "repair"
                                                        : null;
                                                    setChecklistItems((prev) =>
                                                        prev.map((item) => ({
                                                            ...item,
                                                            status,
                                                        })),
                                                    );
                                                }}
                                            />
                                            <span className="mt-1 text-xs font-medium">
                                                REPAIR
                                            </span>
                                        </div>
                                    </TableHead>

                                    <TableHead className="w-24">
                                        <div className="flex flex-col items-center justify-center">
                                            <Checkbox
                                                checked={checklistItems.every(
                                                    (item) =>
                                                        item.status === "na",
                                                )}
                                                onCheckedChange={(checked) => {
                                                    const status = checked
                                                        ? "na"
                                                        : null;
                                                    setChecklistItems((prev) =>
                                                        prev.map((item) => ({
                                                            ...item,
                                                            status,
                                                        })),
                                                    );
                                                }}
                                            />
                                            <span className="mt-1 text-xs font-medium">
                                                N/A
                                            </span>
                                        </div>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {checklistItems.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{index + 1}</TableCell>
                                        <TableCell>{item.task}</TableCell>
                                        <TableCell className="whitespace-pre-line">
                                            {item.description}
                                        </TableCell>

                                        <TableCell className="w-24">
                                            <div className="flex items-center justify-center">
                                                <Checkbox
                                                    checked={
                                                        item.status === "ok"
                                                    }
                                                    onCheckedChange={() =>
                                                        handleCheckboxChange(
                                                            index,
                                                            "ok",
                                                        )
                                                    }
                                                />
                                            </div>
                                        </TableCell>

                                        <TableCell className="w-24">
                                            <div className="flex items-center justify-center">
                                                <Checkbox
                                                    checked={
                                                        item.status === "repair"
                                                    }
                                                    onCheckedChange={() =>
                                                        handleCheckboxChange(
                                                            index,
                                                            "repair",
                                                        )
                                                    }
                                                />
                                            </div>
                                        </TableCell>

                                        <TableCell className="w-24">
                                            <div className="flex items-center justify-center">
                                                <Checkbox
                                                    checked={
                                                        item.status === "na"
                                                    }
                                                    onCheckedChange={() =>
                                                        handleCheckboxChange(
                                                            index,
                                                            "na",
                                                        )
                                                    }
                                                />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* RECOMMENDATIONS */}
                    <div className="space-y-2">
                        <Label>Recommendations</Label>
                        <Textarea
                            rows={5}
                            value={recommendations}
                            onChange={(e) => setRecommendations(e.target.value)}
                            placeholder="Enter any recommendations here..."
                        />
                    </div>

                    {/* FOOTER */}
                    <div className="flex justify-end gap-2">
                        <Button
                            className="flex items-center bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md"
                            onClick={toggleModal}
                        >
                            <X className="h-4 w-4 mr-1" />
                            Close
                        </Button>

                        {canSave && (
                            <Button
                                onClick={handleSaveChecklist}
                                disabled={submitting}
                                className="flex items-center bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md"
                            >
                                <Save className="h-4 w-4 mr-1" />
                                {submitting ? "Saving..." : "Submit"}
                            </Button>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* ── VIEW MODAL ─────────────────────────────────────────────── */}
            <Dialog
                open={isViewOpen && !!viewItem}
                onOpenChange={(open) => {
                    if (!open) {
                        setIsViewOpen(false);
                        setViewItem(null);
                    }
                }}
            >
                <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
                    {!viewItem ? null : (
                        <>
                            <DialogHeader>
                                <DialogTitle className="text-center text-2xl font-bold text-red-800 uppercase">
                                    Preventive Maintenance Checklist for Desktop
                                    PCs and Laptops
                                </DialogTitle>
                            </DialogHeader>

                            {/* PDF BUTTON */}
                            <div className="flex justify-end mb-4">
                                {viewItem.verified_by && (
                                    <Button
                                        variant="outline"
                                        className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                                        onClick={() =>
                                            window.open(
                                                `computer-checklist/pdf/${viewItem.id}`,
                                                "_blank",
                                            )
                                        }
                                    >
                                        View as PDF
                                    </Button>
                                )}
                            </div>

                            {/* FIELDS */}
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                                <div>
                                    <label className="text-sm font-medium">
                                        Computer Name
                                    </label>
                                    <Input
                                        readOnly
                                        value={viewItem.computer_name || "-"}
                                        className="bg-muted"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium">
                                        Date Checked
                                    </label>
                                    <Input
                                        readOnly
                                        className="bg-muted"
                                        value={
                                            viewItem.date_checked
                                                ? new Date(
                                                      viewItem.date_checked,
                                                  ).toLocaleDateString("en-US")
                                                : "-"
                                        }
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium">
                                        Date Due
                                    </label>
                                    <Input
                                        readOnly
                                        className="bg-muted"
                                        value={
                                            viewItem.date_due
                                                ? new Date(
                                                      viewItem.date_due,
                                                  ).toLocaleDateString("en-US")
                                                : "-"
                                        }
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium">
                                        Performed By
                                    </label>
                                    <Input
                                        readOnly
                                        className="bg-muted"
                                        value={viewItem.performed_by || "-"}
                                    />
                                </div>

                                {/* VERIFIED */}
                                <div className="flex items-center gap-2">
                                    {!viewItem.verified_by &&
                                    ["1268"].includes(emp_data.emp_id) ? (
                                        <div>
                                            <label className="text-sm font-medium">
                                                Verified By
                                            </label>
                                            <Input
                                                readOnly
                                                className="bg-muted"
                                                value={emp_data.emp_name || "-"}
                                            />
                                            <Button
                                                className="w-full mt-2"
                                                onClick={() =>
                                                    handleVerify(viewItem.id)
                                                }
                                            >
                                                <BadgeCheck className="w-4 h-4 mr-1" />
                                                Verify
                                            </Button>
                                        </div>
                                    ) : (
                                        <div>
                                            <label className="text-sm font-medium">
                                                Verified By
                                            </label>
                                            <Input
                                                readOnly
                                                className="bg-muted"
                                                value={
                                                    viewItem.verified_by ||
                                                    "Pending..."
                                                }
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* TABLE */}
                            <div className="border rounded-md max-h-[95vh]">
                                <Table>
                                    <TableHeader className="sticky top-0 bg-background">
                                        <TableRow>
                                            <TableHead>Item#</TableHead>
                                            <TableHead>Task</TableHead>
                                            <TableHead>Description</TableHead>
                                            <TableHead className="text-center">
                                                OK
                                            </TableHead>
                                            <TableHead className="text-center">
                                                REPAIR
                                            </TableHead>
                                            <TableHead className="text-center">
                                                N/A
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>

                                    <TableBody>
                                        {Array.isArray(viewItem.items) ? (
                                            viewItem.items.map(
                                                (item, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell>
                                                            {index + 1}
                                                        </TableCell>
                                                        <TableCell>
                                                            {item.task}
                                                        </TableCell>
                                                        <TableCell className="whitespace-pre-line">
                                                            {item.description}
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <Checkbox
                                                                checked={
                                                                    item.status ===
                                                                    "ok"
                                                                }
                                                                disabled
                                                            />
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <Checkbox
                                                                checked={
                                                                    item.status ===
                                                                    "repair"
                                                                }
                                                                disabled
                                                            />
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <Checkbox
                                                                checked={
                                                                    item.status ===
                                                                    "na"
                                                                }
                                                                disabled
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                ),
                                            )
                                        ) : (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={6}
                                                    className="text-center py-6"
                                                >
                                                    No checklist items available
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* RECOMMENDATIONS */}
                            <Textarea
                                className="bg-muted mt-4"
                                readOnly
                                value={viewItem.recommendations || ""}
                            />

                            {/* FOOTER */}
                            <div className="flex justify-end mt-4">
                                <Button
                                    variant="destructive"
                                    onClick={closeViewModal}
                                >
                                    Close
                                </Button>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* ── EDIT MODAL ─────────────────────────────────────────────── */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-center text-red-800 uppercase text-xl font-bold">
                            Preventive Maintenance Checklist for Desktop PCs and
                            Laptops
                        </DialogTitle>
                    </DialogHeader>

                    {/* BASIC INFO */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                        <div>
                            <label className="text-sm font-medium">
                                Computer Name
                            </label>
                            <ComboboxSelect
                                value={selectedComputer}
                                onChange={setSelectedComputer}
                                options={hostnames}
                                placeholder="Search computer..."
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium">
                                Date Done
                            </label>
                            <Input
                                type="date"
                                value={dateChecked}
                                onChange={(e) => setDateChecked(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium">
                                Date Due
                            </label>
                            <Input type="date" value={dateDue} readOnly />
                        </div>

                        <div>
                            <label className="text-sm font-medium">
                                Done By
                            </label>
                            <Input value={performedBy} readOnly />
                        </div>
                    </div>

                    {/* TABLE */}
                    <div className="border rounded-md mt-4 max-h-[95vh]">
                        <Table>
                            <TableHeader className="sticky top-0 bg-background">
                                <TableRow>
                                    <TableHead>#</TableHead>
                                    <TableHead>Task</TableHead>
                                    <TableHead>Description</TableHead>

                                    <TableHead className="text-center">
                                        <div className="flex flex-col items-center">
                                            <span>OK</span>
                                            <Checkbox
                                                checked={checklistItems.every(
                                                    (i) => i.status === "ok",
                                                )}
                                                onCheckedChange={(checked) => {
                                                    setChecklistItems((prev) =>
                                                        prev.map((item) => ({
                                                            ...item,
                                                            status: checked
                                                                ? "ok"
                                                                : null,
                                                        })),
                                                    );
                                                }}
                                            />
                                        </div>
                                    </TableHead>

                                    <TableHead className="text-center">
                                        <div className="flex flex-col items-center">
                                            <span>REPAIR</span>
                                            <Checkbox
                                                checked={checklistItems.every(
                                                    (i) =>
                                                        i.status === "repair",
                                                )}
                                                onCheckedChange={(checked) => {
                                                    setChecklistItems((prev) =>
                                                        prev.map((item) => ({
                                                            ...item,
                                                            status: checked
                                                                ? "repair"
                                                                : null,
                                                        })),
                                                    );
                                                }}
                                            />
                                        </div>
                                    </TableHead>

                                    <TableHead className="text-center">
                                        <div className="flex flex-col items-center">
                                            <span>N/A</span>
                                            <Checkbox
                                                checked={checklistItems.every(
                                                    (i) => i.status === "na",
                                                )}
                                                onCheckedChange={(checked) => {
                                                    setChecklistItems((prev) =>
                                                        prev.map((item) => ({
                                                            ...item,
                                                            status: checked
                                                                ? "na"
                                                                : null,
                                                        })),
                                                    );
                                                }}
                                            />
                                        </div>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {checklistItems.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{index + 1}</TableCell>
                                        <TableCell>{item.task}</TableCell>
                                        <TableCell className="whitespace-pre-line">
                                            {item.description}
                                        </TableCell>

                                        <TableCell className="text-center">
                                            <Checkbox
                                                checked={item.status === "ok"}
                                                onCheckedChange={() =>
                                                    handleCheckboxChange(
                                                        index,
                                                        "ok",
                                                    )
                                                }
                                            />
                                        </TableCell>

                                        <TableCell className="text-center">
                                            <Checkbox
                                                checked={
                                                    item.status === "repair"
                                                }
                                                onCheckedChange={() =>
                                                    handleCheckboxChange(
                                                        index,
                                                        "repair",
                                                    )
                                                }
                                            />
                                        </TableCell>

                                        <TableCell className="text-center">
                                            <Checkbox
                                                checked={item.status === "na"}
                                                onCheckedChange={() =>
                                                    handleCheckboxChange(
                                                        index,
                                                        "na",
                                                    )
                                                }
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* RECOMMENDATIONS */}
                    <div className="mt-4">
                        <label className="text-sm font-medium">
                            Recommendations
                        </label>
                        <Textarea
                            value={recommendations}
                            onChange={(e) => setRecommendations(e.target.value)}
                            className="min-h-[120px]"
                        />
                    </div>

                    {/* FOOTER */}
                    <div className="flex justify-between text-xs text-red-800 mt-2">
                        <span className="font-bold">
                            TELFORD SVC PHILS., INC.
                        </span>
                        <span>MIS-03 (Rev.1)</span>
                    </div>

                    <DialogFooter className="flex gap-2 justify-end">
                        <Button
                            variant="destructive"
                            onClick={() => setIsEditOpen(false)}
                        >
                            Close
                        </Button>

                        <Button
                            className="bg-green-600 hover:bg-green-700"
                            onClick={handleUpdateChecklist}
                            disabled={submitting}
                        >
                            {submitting ? "Saving..." : "Save"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AuthenticatedLayout>
    );
}

import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import DataTable from "@/Components/DataTable";
import { useState } from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Checkbox } from "@/Components/ui/checkbox";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/Components/ui/dialog";

import { X, Check, CheckCheck, FileText, Save, Plus, Send } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/Components/ui/table";

export default function BoxingPrinterChecklist({
    tableData,
    tableFilters,
    emp_data,
    boxingPrinterChecklists,
}) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedChecklist, setSelectedChecklist] = useState(null);

    const formatMMDDYYYY = (date) => {
        const d = new Date(date);
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        const yyyy = d.getFullYear();
        return `${mm}/${dd}/${yyyy}`;
    };

    // STATE FOR FORM
    const [performedBy] = useState(emp_data.emp_name);
    const [datePerformed] = useState(new Date().toLocaleDateString("en-CA"));

    // STATE PER ROW
    const [rows, setRows] = useState(
        boxingPrinterChecklists.map((item) => ({
            id: item.id,
            station_name: item.item,
            check_internal: false,
            replace_ribbon: false,
            restart_calibrate: false,
            remarks: "",
        })),
    );

    // UPDATE ROW CHECKBOX / REMARKS
    const updateRow = (id, field, value) => {
        setRows((prev) =>
            prev.map((row) =>
                row.id === id ? { ...row, [field]: value } : row,
            ),
        );
    };

    // ===============================
    //          HANDLE SAVE
    // ===============================
    const handleSave = () => {
        const payload = {
            performed_by: performedBy,
            date_performed: datePerformed,
            items: rows,
        };

        router.post(route("boxing-printer-checklist.bulk-store"), payload, {
            onSuccess: () => {
                alert("✅ Checklist saved successfully!");
                setIsModalOpen(false);
            },
        });
    };

    const handleAcknowledge = (id) => {
        // Update backend with current user as acknowledged_by
        router.post(
            route("boxing-printer-checklist.acknowledge", id),
            {
                acknowledged_by: emp_data.emp_name, // current user
            },
            {
                onSuccess: () => {
                    alert("✅ Checklist acknowledged!");
                    window.location.reload();
                    // Update local state so input shows new value
                    setSelectedChecklist((prev) => ({
                        ...prev,
                        acknowledged_by: emp_data.emp_name,
                    }));
                },
            },
        );
    };

    const handleApproved = (id) => {
        // Update backend with current user as acknowledged_by
        router.post(
            route("boxing-printer-checklist.approved", id),
            {
                verified_by: emp_data.emp_name, // current user
            },
            {
                onSuccess: () => {
                    alert("✅ Checklist approved!");
                    window.location.reload();

                    // Update local state so input shows new value
                    setSelectedChecklist((prev) => ({
                        ...prev,
                        verified_by: emp_data.emp_name,
                    }));
                },
            },
        );
    };

    const handleDelete = (id) => {
        if (confirm("Are you sure you want to delete this checklist?")) {
            router.delete(route("boxing-printer-checklist.destroy", id), {
                preserveScroll: true,
                onSuccess: () => {
                    alert("✅ Checklist removed successfully.");
                    window.location.reload();
                },
            });
        }
    };

    const Colors = [
        { text: "#1E3A8A", bg: "#DBEAFE", border: "#1E3A8A" }, // blue
        { text: "#a82121", bg: "#EDE9FE", border: "#a82121" }, // purple
    ];

    const assignedColors = {}; // Shift → color mapping

    function getShiftColor(shift) {
        const fallback = {
            text: "#6B7280",
            bg: "#F3F4F6",
            border: "#D1D5DB",
        };

        if (!shift) return fallback;

        if (assignedColors[shift]) return assignedColors[shift];

        const index = Object.keys(assignedColors).length % Colors.length;

        const color = Colors[index] || fallback;

        assignedColors[shift] = color;

        return color;
    }

    const dataWithAction = tableData.data.map((item) => {
        const [dueYear, dueMonth, dueDay] = item.date_performed.split("-");

        const parsedItems = (
            Array.isArray(item.items)
                ? item.items
                : typeof item.items === "string"
                  ? JSON.parse(item.items)
                  : []
        ).map((i) => ({
            station_name: i.station_name || i.item || "",
            check_internal: i.check_internal ?? false,
            replace_ribbon: i.replace_ribbon ?? false,
            restart_calib: i.restart_calib ?? false,
            remarks: i.remarks || "",
        }));

        const openViewModal = () => {
            setSelectedChecklist({
                ...item,
                items: parsedItems,
            });

            setIsViewOpen(true);
        };

        const openEditModal = () => {
            setSelectedChecklist({
                ...item,
                items: parsedItems,
            });

            setIsEditOpen(true);
        };

        const canEdit =
            (!item.acknowledged_by?.trim() &&
                !item.verified_by?.trim() &&
                item.performed_by === emp_data?.emp_name) ||
            (!item.verified_by?.trim() && emp_data?.emp_id === "1268");

        const canDelete =
            !item.acknowledged_by?.trim() &&
            !item.verified_by?.trim() &&
            item.performed_by === emp_data?.emp_name;

        return {
            ...item,

            shift: (
                <span
                    className="px-2 py-1 text-xs font-semibold border rounded-md"
                    style={{
                        color: getShiftColor(item.shift).text,
                        backgroundColor: getShiftColor(item.shift).bg,
                        borderColor: getShiftColor(item.shift).border,
                    }}
                >
                    {item.shift || "-"}
                </span>
            ),

            date_performed: `${dueMonth}/${dueDay}/${dueYear}`,

            actions: (
                <div className="flex gap-1">
                    <Button
                        size="icon"
                        className="bg-blue-500 text-white hover:bg-blue-500/80"
                        onClick={openViewModal}
                    >
                        <Eye className="h-4 w-4" />
                    </Button>

                    {canEdit && (
                        <Button
                            size="icon"
                            className="bg-amber-500 text-white hover:bg-amber-500/80"
                            onClick={openEditModal}
                        >
                            <Pencil className="h-4 w-4" />
                        </Button>
                    )}

                    {canDelete && (
                        <Button
                            size="icon"
                            className="bg-red-600 text-white hover:bg-red-500/80"
                            onClick={() => handleDelete(item.id)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            ),
        };
    });

    const getCurrentShift = () => {
        const now = new Date();

        // A-Shift: 07:00 AM to 06:59 PM
        const aShiftStart = new Date();
        aShiftStart.setHours(7, 0, 0, 0);
        const aShiftEnd = new Date();
        aShiftEnd.setHours(18, 59, 0, 0);

        // C-Shift: 07:00 PM to 06:59 AM next day
        const cShiftStart = new Date();
        cShiftStart.setHours(19, 0, 0, 0);
        const cShiftEnd = new Date();
        cShiftEnd.setDate(cShiftEnd.getDate() + 1);
        cShiftEnd.setHours(6, 59, 0, 0);

        if (now >= aShiftStart && now <= aShiftEnd) {
            return "A";
        } else if (now >= cShiftStart || now <= cShiftEnd) {
            // note the OR for overnight shift
            return "C";
        } else {
            return null;
        }
    };

    // example, YYYY-MM-DD format
    const today = new Date();
    const currentShift = getCurrentShift();

    // Function to check if button should be disabled
    const isButtonDisabled = () => {
        const today = new Date();
        const todayStr = new Date().toLocaleDateString("en-CA");
        const currentShift = getCurrentShift();

        return tableData.data.some(
            ({ date_performed, shift }) =>
                date_performed === todayStr && shift === currentShift,
        );
    };

    return (
        <AuthenticatedLayout>
            <Head title="Manage Boxing Printer Checklist" />

            {/* HEADER */}
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold animate-bounce">
                    <i className="fa-solid fa-list-check"></i> Boxing Printer
                    Checklist
                </h1>
                {!["boxing"].includes(emp_data?.emp_system_role) && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className={`${
                            isButtonDisabled()
                                ? "text-red-500 opacity-50 cursor-not-allowed hover:bg-green-500"
                                : "text-white"
                        } bg-green-500 border-green-900 btn hover:bg-green-700`}
                        disabled={isButtonDisabled()}
                    >
                        {isButtonDisabled() ? (
                            <>
                                🚫 Checklist has already been filled for the{" "}
                                {currentShift}-Shift{" "}
                            </>
                        ) : (
                            <>
                                <i className="fa-solid fa-file-circle-plus"></i>{" "}
                                New Checklist
                            </>
                        )}
                    </button>
                )}
            </div>

            {/* TABLE */}
            <DataTable
                columns={[
                    { key: "performed_by", label: "Done By" },
                    { key: "date_performed", label: "Date Done" },
                    { key: "shift", label: "Shift" },
                    { key: "acknowledged_by", label: "Acknowledge By" },
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
                routeName={route("boxing-printer-checklist")}
                filters={tableFilters}
                rowKey="performed_by"
                showExport={false}
                tabKey="status"
                tabs={[
                    { label: "All", value: "" },
                    { label: "Pending", value: "2" },
                    { label: "Verified", value: "1" },
                ]}
            />

            {/* ========================= */}
            {/*        NEW MODAL         */}
            {/* ========================= */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Plus className="h-5 w-5" />
                            New Checklist
                        </DialogTitle>
                    </DialogHeader>

                    {/* FORM FIELDS */}
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    Done By
                                </label>

                                <Input
                                    value={performedBy}
                                    readOnly
                                    className="bg-muted"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    Date Done
                                </label>

                                <Input
                                    type="date"
                                    value={datePerformed}
                                    readOnly
                                    className="bg-muted"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    Acknowledged By
                                </label>

                                <p className="text-xs text-muted-foreground">
                                    Acknowledgment will happen after submitting
                                    this form.
                                </p>
                            </div>
                        </div>

                        {/* TABLE */}
                        <div className="border rounded-md overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>STATION NAME</TableHead>

                                        <TableHead className="text-center">
                                            CHECK (Internal Parts)
                                        </TableHead>

                                        <TableHead className="text-center">
                                            REPLACE RIBBON / P2 LABEL
                                        </TableHead>

                                        <TableHead className="text-center">
                                            RESTART / CALIBRATE
                                        </TableHead>

                                        <TableHead>REMARKS</TableHead>
                                    </TableRow>
                                </TableHeader>

                                <TableBody>
                                    {rows.map((row) => (
                                        <TableRow key={row.id}>
                                            <TableCell className="font-medium">
                                                {row.station_name}
                                            </TableCell>

                                            <TableCell className="text-center">
                                                <Checkbox
                                                    checked={row.check_internal}
                                                    onCheckedChange={(
                                                        checked,
                                                    ) =>
                                                        updateRow(
                                                            row.id,
                                                            "check_internal",
                                                            !!checked,
                                                        )
                                                    }
                                                />
                                            </TableCell>

                                            <TableCell className="text-center">
                                                <Checkbox
                                                    checked={row.replace_ribbon}
                                                    onCheckedChange={(
                                                        checked,
                                                    ) =>
                                                        updateRow(
                                                            row.id,
                                                            "replace_ribbon",
                                                            !!checked,
                                                        )
                                                    }
                                                />
                                            </TableCell>

                                            <TableCell className="text-center">
                                                <Checkbox
                                                    checked={
                                                        row.restart_calibrate
                                                    }
                                                    onCheckedChange={(
                                                        checked,
                                                    ) =>
                                                        updateRow(
                                                            row.id,
                                                            "restart_calibrate",
                                                            !!checked,
                                                        )
                                                    }
                                                />
                                            </TableCell>

                                            <TableCell>
                                                <Input
                                                    value={row.remarks}
                                                    placeholder="Remarks..."
                                                    onChange={(e) =>
                                                        updateRow(
                                                            row.id,
                                                            "remarks",
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* FOOTER */}
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="destructive"
                                onClick={() => setIsModalOpen(false)}
                            >
                                <X className="h-4 w-4 mr-2" />
                                Cancel
                            </Button>

                            <Button onClick={handleSave}>
                                <Send className="h-4 w-4 mr-2" />
                                Submit
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ========================= */}
            {/*        VIEW MODAL         */}
            {/* ========================= */}
            <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
                <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-center text-2xl font-bold text-red-800 uppercase">
                            BOXING PRINTER STARTUP CHECKLIST
                        </DialogTitle>
                    </DialogHeader>

                    {/* PDF BUTTON */}
                    {selectedChecklist?.verified_by?.trim() &&
                        !["boxing"].includes(emp_data.emp_system_role) && (
                            <div className="flex justify-end">
                                <Button
                                    className="flex items-center bg-red-600 hover:bg-red-700 text-white mb-4"
                                    onClick={() =>
                                        window.open(
                                            `boxing-printer-checklist/pdf/${selectedChecklist.id}`,
                                            "_blank",
                                        )
                                    }
                                >
                                    <FileText className="h-4 w-4 mr-2" />
                                    View PDF
                                </Button>
                            </div>
                        )}

                    {/* DETAILS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Done By
                            </label>

                            <Input
                                readOnly
                                value={selectedChecklist?.performed_by ?? ""}
                                className="bg-muted"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Shift</label>

                            <Input
                                readOnly
                                value={selectedChecklist?.shift ?? ""}
                                className="bg-muted"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Date</label>

                            <Input
                                readOnly
                                className="bg-muted"
                                value={
                                    selectedChecklist?.date_performed
                                        ? formatMMDDYYYY(
                                              selectedChecklist.date_performed,
                                          )
                                        : ""
                                }
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Acknowledged By
                            </label>

                            <Input
                                readOnly
                                className="bg-muted"
                                value={
                                    selectedChecklist?.acknowledged_by ||
                                    "Pending Acknowledgement..."
                                }
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Verified By
                            </label>

                            <Input
                                readOnly
                                className="bg-muted"
                                value={
                                    selectedChecklist?.verified_by ||
                                    "Pending Verification..."
                                }
                            />
                        </div>
                    </div>

                    {/* TABLE */}
                    <div className="border rounded-md overflow-hidden">
                        <Table className="border border-collapse">
                            <TableHeader className="bg-muted">
                                <TableRow>
                                    <TableHead>STATION NAME</TableHead>
                                    <TableHead className="text-center">
                                        CHECK (Internal Parts)
                                    </TableHead>
                                    <TableHead className="text-center">
                                        REPLACE RIBBON / P2 LABEL
                                    </TableHead>
                                    <TableHead className="text-center">
                                        RESTART / CALIBRATE
                                    </TableHead>
                                    <TableHead>REMARKS</TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {selectedChecklist?.items?.map((row, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium">
                                            {row.station_name}
                                        </TableCell>

                                        <TableCell className="text-center">
                                            {row.check_internal && (
                                                <Check className="h-4 w-4 mx-auto text-black font-semibold" />
                                            )}
                                        </TableCell>

                                        <TableCell className="text-center">
                                            {row.replace_ribbon && (
                                                <Check className="h-4 w-4 mx-auto text-black font-semibold" />
                                            )}
                                        </TableCell>

                                        <TableCell className="text-center">
                                            {row.restart_calib && (
                                                <Check className="h-4 w-4 mx-auto text-black font-semibold" />
                                            )}
                                        </TableCell>

                                        <TableCell>
                                            {row.remarks || "-"}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* FOOTER */}
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="destructive"
                            onClick={() => setIsViewOpen(false)}
                        >
                            <X className="h-4 w-4 mr-2" />
                            Close
                        </Button>

                        {!selectedChecklist?.acknowledged_by?.trim() &&
                            emp_data?.emp_system_role === "boxing" && (
                                <Button
                                    onClick={() =>
                                        handleAcknowledge(selectedChecklist.id)
                                    }
                                >
                                    <Check className="h-4 w-4 mr-2" />
                                    Acknowledge
                                </Button>
                            )}

                        {!selectedChecklist?.verified_by?.trim() &&
                            selectedChecklist?.acknowledged_by?.trim() &&
                            emp_data?.emp_id === "1268" && (
                                <Button
                                    onClick={() =>
                                        handleApproved(selectedChecklist.id)
                                    }
                                >
                                    <CheckCheck className="h-4 w-4 mr-2" />
                                    Verify
                                </Button>
                            )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* ========================= */}
            {/*         EDIT CHECKLIST         */}
            {/* ========================= */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-center text-2xl font-bold text-red-800 uppercase">
                            BOXING PRINTER STARTUP CHECKLIST
                        </DialogTitle>
                    </DialogHeader>

                    {/* FORM FIELDS */}
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    Done By
                                </label>

                                <Input
                                    value={
                                        selectedChecklist?.performed_by || ""
                                    }
                                    readOnly
                                    className="bg-muted"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    Shift
                                </label>

                                <Input
                                    value={selectedChecklist?.shift || ""}
                                    onChange={(e) =>
                                        setSelectedChecklist((prev) => ({
                                            ...prev,
                                            shift: e.target.value,
                                        }))
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    Date
                                </label>

                                <Input
                                    type="date"
                                    value={
                                        selectedChecklist?.date_performed || ""
                                    }
                                    onChange={(e) =>
                                        setSelectedChecklist((prev) => ({
                                            ...prev,
                                            date_performed: e.target.value,
                                        }))
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    Acknowledged By
                                </label>

                                <Input readOnly className="bg-muted" />
                            </div>
                        </div>

                        {/* TABLE */}
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-center">
                                            STATION NAME
                                        </TableHead>
                                        <TableHead className="text-center">
                                            CHECK (Internal Parts)
                                        </TableHead>
                                        <TableHead className="text-center">
                                            REPLACE RIBBON / P2 LABEL
                                        </TableHead>
                                        <TableHead className="text-center">
                                            RESTART / CALIBRATE
                                        </TableHead>
                                        <TableHead className="text-center">
                                            REMARKS
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>

                                <TableBody>
                                    {selectedChecklist?.items.map(
                                        (row, index) => (
                                            <TableRow key={index}>
                                                <TableCell className="font-medium">
                                                    {row.station_name}
                                                </TableCell>

                                                <TableCell className="text-center">
                                                    <Checkbox
                                                        checked={
                                                            row.check_internal
                                                        }
                                                        onCheckedChange={(
                                                            checked,
                                                        ) => {
                                                            const items = [
                                                                ...selectedChecklist.items,
                                                            ];

                                                            items[
                                                                index
                                                            ].check_internal =
                                                                !!checked;

                                                            setSelectedChecklist(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    items,
                                                                }),
                                                            );
                                                        }}
                                                    />
                                                </TableCell>

                                                <TableCell className="text-center">
                                                    <Checkbox
                                                        checked={
                                                            row.replace_ribbon
                                                        }
                                                        onCheckedChange={(
                                                            checked,
                                                        ) => {
                                                            const items = [
                                                                ...selectedChecklist.items,
                                                            ];

                                                            items[
                                                                index
                                                            ].replace_ribbon =
                                                                !!checked;

                                                            setSelectedChecklist(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    items,
                                                                }),
                                                            );
                                                        }}
                                                    />
                                                </TableCell>

                                                <TableCell className="text-center">
                                                    <Checkbox
                                                        checked={
                                                            row.restart_calib
                                                        }
                                                        onCheckedChange={(
                                                            checked,
                                                        ) => {
                                                            const items = [
                                                                ...selectedChecklist.items,
                                                            ];

                                                            items[
                                                                index
                                                            ].restart_calib =
                                                                !!checked;

                                                            setSelectedChecklist(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    items,
                                                                }),
                                                            );
                                                        }}
                                                    />
                                                </TableCell>

                                                <TableCell>
                                                    <Input
                                                        value={row.remarks}
                                                        onChange={(e) => {
                                                            const items = [
                                                                ...selectedChecklist.items,
                                                            ];

                                                            items[
                                                                index
                                                            ].remarks =
                                                                e.target.value;

                                                            setSelectedChecklist(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    items,
                                                                }),
                                                            );
                                                        }}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ),
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* FOOTER */}
                        <div className="flex justify-end gap-2">
                            <Button
                                className="flex items-center bg-red-500 hover:bg-red-600"
                                onClick={() => setIsEditOpen(false)}
                            >
                                <X className="h-4 w-4 mr-2" />
                                Cancel
                            </Button>

                            <Button
                                className="flex items-center bg-green-500 hover:bg-green-600"
                                onClick={() => {
                                    router.put(
                                        route(
                                            "boxing-printer-checklist.update",
                                            selectedChecklist.id,
                                        ),
                                        selectedChecklist,
                                        {
                                            onSuccess: () => {
                                                alert("Checklist updated!");
                                                setIsEditOpen(false);
                                            },
                                        },
                                    );
                                }}
                            >
                                <Save className="h-4 w-4 mr-2" />
                                Save Changes
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </AuthenticatedLayout>
    );
}

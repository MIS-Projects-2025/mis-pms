import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import DataTable from "@/Components/DataTable";
import { useState } from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/Components/ui/button";

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
    const [datePerformed] = useState(
        new Date().toLocaleDateString("en-CA")
    );

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
        if (!shift)
            return { text: "#6B7280", bg: "#F3F4F6", border: "#D1D5DB" }; // default gray

        // If this shift already has a color, return it
        if (assignedColors[shift]) return assignedColors[shift];

        // Find colors not yet assigned
        const usedColors = Object.values(assignedColors).map((c) =>
            Colors.indexOf(c),
        );
        const availableColors = Colors.filter(
            (_, idx) => !usedColors.includes(idx),
        );

        // Pick the first available color
        const color =
            availableColors.length > 0
                ? availableColors[0]
                : Colors[assignedColors.length % Colors.length];

        // Save for future
        assignedColors[shift] = color;

        return color;
    }

    const dataWithAction = tableData.data.map((item) => {
        const [dueYear, dueMonth, dueDay] = item.date_performed.split("-");

        return {
            ...item,
            shift: (
                <span
                    className={`px-2 py-1 text-xs font-semibold border rounded-md`}
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
                <div className="flex space-x-1">
                    {/* VIEW BUTTON */}
                    <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => {
                            setSelectedChecklist({
                                ...item,
                                items: (Array.isArray(item.items)
                                    ? item.items
                                    : typeof item.items === "string"
                                        ? JSON.parse(item.items)
                                        : []
                                ).map((i) => ({
                                    station_name:
                                        i.station_name || i.items || "",
                                    check_internal: i.check_internal || false,
                                    replace_ribbon: i.replace_ribbon || false,
                                    restart_calib: i.restart_calib || false,
                                    remarks: i.remarks || "",
                                })),
                            });
                            setIsViewOpen(true);
                        }}
                    >
                        <Eye className="h-4 w-4" />
                    </Button>

                    {(!item.verified_by || item.verified_by.trim() === "") &&
                        emp_data?.emp_id === "1268" && (
                            <Button
                                size="sm"
                                className="bg-amber-500 hover:bg-amber-600 text-white"
                                onClick={() => {
                                    setSelectedChecklist({
                                        ...item,
                                        items: (Array.isArray(item.items)
                                            ? item.items
                                            : typeof item.items === "string"
                                                ? JSON.parse(item.items)
                                                : []
                                        ).map((i) => ({
                                            station_name:
                                                i.station_name || i.item || "",
                                            check_internal:
                                                i.check_internal || false,
                                            replace_ribbon:
                                                i.replace_ribbon || false,
                                            restart_calib:
                                                i.restart_calib || false,
                                            remarks: i.remarks || "",
                                        })),
                                    });
                                    setIsEditOpen(true);
                                }}
                            >
                                <Pencil className="h-4 w-4" />
                            </Button>
                        )}

                    {/* DELETE EDIT ONLY IF acknowledge_by IS EMPTY */}
                    {(!item.acknowledged_by ||
                        item.acknowledged_by.trim() === "") &&
                        (!item.verified_by || item.verified_by.trim() === "") &&
                        item.performed_by === emp_data?.emp_name && (
                            <Button
                                size="sm"
                                className="bg-amber-600 hover:bg-amber-700 text-white"
                                onClick={() => {
                                    setSelectedChecklist({
                                        ...item,
                                        items: (Array.isArray(item.items)
                                            ? item.items
                                            : typeof item.items === "string"
                                                ? JSON.parse(item.items)
                                                : []
                                        ).map((i) => ({
                                            station_name:
                                                i.station_name || i.item || "",
                                            check_internal:
                                                i.check_internal || false,
                                            replace_ribbon:
                                                i.replace_ribbon || false,
                                            restart_calib:
                                                i.restart_calib || false,
                                            remarks: i.remarks || "",
                                        })),
                                    });
                                    setIsEditOpen(true);
                                }}
                            >
                                <Pencil className="h-4 w-4" />
                            </Button>
                        )}
                    {/* DELETE BUTTON ONLY IF acknowledge_by IS EMPTY */}
                    {(!item.acknowledged_by ||
                        item.acknowledged_by.trim() === "") &&
                        (!item.verified_by || item.verified_by.trim() === "") &&
                        item.performed_by === emp_data?.emp_name && (
                            <Button
                                size="sm"
                                className="bg-red-600 hover:bg-red-700 text-white"
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
                        className={`${isButtonDisabled()
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
            />

            {/* ========================= */}
            {/*        NEW MODAL         */}
            {/* ========================= */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex justify-center items-start bg-black bg-opacity-50 overflow-y-auto p-4">
                    <div className="bg-white dark:bg-red-800 text-gray-800 w-full max-w-6xl rounded-lg shadow-lg p-6 mt-10 animate-fadeInScale">
                        {/* HEADER */}
                        <div className="flex justify-between items-center border-b pb-3">
                            <h2 className="text-xl font-bold font-[Poppins] ">
                                <i className="fas fa-plus"></i> New Checklist
                            </h2>

                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-red-600 text-xl hover:text-red-800"
                            >
                                ✕
                            </button>
                        </div>

                        {/* FORM FIELDS */}
                        <div className="mt-4">
                            <div className="grid grid-cols-3 gap-4 mb-5">
                                <div>
                                    <label className="font-semibold">
                                        Done By
                                    </label>
                                    <input
                                        className="input border-gray-400 w-full bg-gray-100 cursor-not-allowed"
                                        value={performedBy}
                                        readOnly
                                    />
                                </div>

                                <div>
                                    <label className="font-semibold">Date Done</label>
                                    <input
                                        type="date"
                                        className="input border-gray-400 w-full bg-gray-100 cursor-not-allowed"
                                        value={datePerformed}
                                        readOnly
                                    />
                                </div>

                                <div>
                                    <label className="font-semibold">
                                        Acknowledged By
                                    </label>
                                    <p className="text-xs font-semibold mt-2 text-red-600">
                                        Acknowledgment will happen after
                                        submitting this form...
                                    </p>
                                    <input
                                        className="input input-bordered w-full bg-gray-200 cursor-not-allowed hidden"
                                        readOnly
                                    />
                                </div>
                            </div>

                            {/* TABLE */}
                            <table className="table w-full border border-gray-300 mt-4 text-center border-collapse">
                                <thead className="bg-gray-200 text-gray-700">
                                    <tr>
                                        <th className="border border-gray-300">
                                            STATION NAME
                                        </th>
                                        <th className="border border-gray-300">
                                            CHECK (Internal parts)
                                        </th>
                                        <th className="border border-gray-300">
                                            REPLACE RIBBON / P2 LABEL
                                        </th>
                                        <th className="border border-gray-300">
                                            RESTART / CALIBRATE
                                        </th>
                                        <th className="border border-gray-300">
                                            REMARKS
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {rows.map((row) => (
                                        <tr key={row.id}>
                                            <td className="border border-gray-300 font-semibold">
                                                {row.station_name}
                                            </td>

                                            <td className="border border-gray-300">
                                                <input
                                                    type="checkbox"
                                                    className="checkbox border-gray-800 text-gray-800"
                                                    checked={row.check_internal}
                                                    onChange={(e) =>
                                                        updateRow(
                                                            row.id,
                                                            "check_internal",
                                                            e.target.checked,
                                                        )
                                                    }
                                                />
                                            </td>

                                            <td className="border border-gray-300">
                                                <input
                                                    type="checkbox"
                                                    className="checkbox border-gray-800 text-gray-800"
                                                    checked={row.replace_ribbon}
                                                    onChange={(e) =>
                                                        updateRow(
                                                            row.id,
                                                            "replace_ribbon",
                                                            e.target.checked,
                                                        )
                                                    }
                                                />
                                            </td>

                                            <td className="border border-gray-300">
                                                <input
                                                    type="checkbox"
                                                    className="checkbox border-gray-800 text-gray-800"
                                                    checked={
                                                        row.restart_calibrate
                                                    }
                                                    onChange={(e) =>
                                                        updateRow(
                                                            row.id,
                                                            "restart_calibrate",
                                                            e.target.checked,
                                                        )
                                                    }
                                                />
                                            </td>

                                            <td className="border border-gray-300">
                                                <input
                                                    type="text"
                                                    className="input border-gray-500 w-full bg-white"
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
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* FOOTER BUTTONS */}
                        <div className="mt-6 flex justify-end">
                            <button
                                className="btn bg-red-600 hover:bg-red-700 text-white mr-3 rounded-md"
                                onClick={() => setIsModalOpen(false)}
                            >
                                <i className="fa-solid fa-xmark"></i>
                                Cancel
                            </button>

                            <button
                                className="btn bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                                onClick={handleSave}
                            >
                                <i className="fa-solid fa-paper-plane"></i>
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================= */}
            {/*        VIEW MODAL         */}
            {/* ========================= */}
            {isViewOpen && selectedChecklist && (
                <div className="fixed inset-0 z-50 flex justify-center items-start bg-black bg-opacity-50 overflow-y-auto p-4">
                    <div className="bg-white w-full max-w-6xl rounded-lg shadow-lg p-6 mt-10 animate-fadeInScale">
                        {/* HEADER */}
                        <div className="flex justify-end items-center pb-3">
                            <button
                                onClick={() => setIsViewOpen(false)}
                                className="text-red-600 text-xl hover:text-red-800 focus:outline-none"
                            >
                                <i className="fa-solid fa-xmark text-2xl"></i>
                            </button>
                        </div>

                        <h1 className="text-2xl font-bold font-[Poppins] text-center text-red-800 uppercase">
                            BOXING PRINTER STARTUP CHECKLIST
                        </h1>

                        {selectedChecklist.verified_by &&
                            selectedChecklist.verified_by.trim() !== "" &&
                            !["boxing"].includes(emp_data.emp_system_role) && (
                                <div className="flex items-center justify-end mb-4">
                                    <button
                                        onClick={() =>
                                            window.open(
                                                `boxing-printer-checklist/pdf/${selectedChecklist.id}`,
                                                "_blank",
                                            )
                                        }
                                        className="px-3 py-2 bg-gray-100 text-red-600 rounded shadow hover:bg-red-700 hover:text-white border-2 border-red-600 hover:border-gray-500 flex items-center font-bold"
                                    >
                                        <i className="fa fa-file-pdf mr-1"></i>{" "}
                                        View as PDF
                                    </button>
                                </div>
                            )}

                        {/* FORM FIELDS */}
                        <div className="mt-4">
                            <div className="grid grid-cols-4 gap-4 mb-5">
                                <div>
                                    <label className="font-semibold">
                                        Done By
                                    </label>
                                    <input
                                        className="input input-bordered w-full bg-gray-100 cursor-not-allowed"
                                        value={selectedChecklist.performed_by}
                                        readOnly
                                    />
                                </div>

                                <div>
                                    <label className="font-semibold">
                                        Date
                                    </label>
                                    <input
                                        className="input input-bordered w-full bg-gray-100 cursor-not-allowed"
                                        value={
                                            selectedChecklist.date_performed
                                                ? formatMMDDYYYY(
                                                    selectedChecklist.date_performed,
                                                )
                                                : ""
                                        }
                                        readOnly
                                    />
                                </div>

                                <div>
                                    <label className="font-semibold">
                                        Acknowledged By
                                    </label>
                                    <input
                                        className="input input-bordered w-full bg-gray-100 cursor-not-allowed"
                                        value={
                                            selectedChecklist.acknowledged_by ||
                                            "Waiting for acknowledgement"
                                        }
                                        readOnly
                                    />
                                </div>

                                <div>
                                    <label className="font-semibold">
                                        Verified By
                                    </label>
                                    <input
                                        className="input input-bordered w-full bg-gray-100 cursor-not-allowed"
                                        value={
                                            selectedChecklist.verified_by ||
                                            "Waiting for verification"
                                        }
                                        readOnly
                                    />
                                </div>
                            </div>

                            {/* TABLE */}
                            <table className="table w-full border border-gray-300 mt-4 text-center">
                                <thead className="bg-stone-100">
                                    <tr>
                                        <th className="border border-gray-300">
                                            STATION NAME
                                        </th>
                                        <th className="border border-gray-300">
                                            CHECK (Internal parts)
                                        </th>
                                        <th className="border border-gray-300">
                                            REPLACE RIBBON / P2 LABEL
                                        </th>
                                        <th className="border border-gray-300">
                                            RESTART / CALIBRATE
                                        </th>
                                        <th className="border border-gray-300">
                                            REMARKS
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {selectedChecklist.items.map(
                                        (row, index) => (
                                            <tr key={index}>
                                                <td className="border border-gray-300 font-semibold">
                                                    {row.station_name}
                                                </td>
                                                <td className="border border-gray-300">
                                                    {row.check_internal
                                                        ? "✔"
                                                        : ""}
                                                </td>
                                                <td className="border border-gray-300">
                                                    {row.replace_ribbon
                                                        ? "✔"
                                                        : ""}
                                                </td>
                                                <td className="border border-gray-300">
                                                    {row.restart_calib
                                                        ? "✔"
                                                        : ""}
                                                </td>
                                                <td className="border border-gray-300">
                                                    {row.remarks}
                                                </td>
                                            </tr>
                                        ),
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* FOOTER */}
                        <div className="mt-6 flex justify-end space-x-3">
                            <button
                                onClick={() => setIsViewOpen(false)}
                                className="btn bg-red-600 text-white hover:bg-red-700 focus:outline-none rounded-md"
                            >
                                <i className="fa-solid fa-xmark"></i>
                                Close
                            </button>

                            {/* SHOW ACKNOWLEDGE ONLY IF EMPTY */}
                            {(!selectedChecklist.acknowledged_by ||
                                selectedChecklist.acknowledged_by.trim() ===
                                "") &&
                                ["boxing"].includes(
                                    emp_data.emp_system_role,
                                ) && (
                                    <button
                                        onClick={() =>
                                            handleAcknowledge(
                                                selectedChecklist.id,
                                            )
                                        }
                                        className="btn bg-green-600 hover:bg-green-700 text-white focus:outline-none rounded-md"
                                    >
                                        <i className="fa-solid fa-check"></i>
                                        Acknowledge
                                    </button>
                                )}
                            {!selectedChecklist.verified_by &&
                                ["1268"].includes(emp_data.emp_id) && (
                                    <>
                                        <button
                                            onClick={() =>
                                                handleApproved(
                                                    selectedChecklist.id,
                                                )
                                            }
                                            className="btn bg-green-600 hover:bg-green-700 text-white focus:outline-none rounded-md"
                                        >
                                            <i className="fa-solid fa-check-double"></i>
                                            Verified by
                                        </button>
                                    </>
                                )}
                        </div>
                    </div>
                </div>
            )}

            {/* ========================= */}
            {/*        EDIT MODAL         */}
            {/* ========================= */}
            {isEditOpen && selectedChecklist && (
                <div className="fixed inset-0 z-50 flex justify-center items-start bg-black bg-opacity-50 overflow-y-auto p-4">
                    <div className="bg-white w-full max-w-6xl rounded-lg shadow-lg p-6 mt-10 animate-fadeInScale">
                        {/* HEADER */}
                        <div className="flex justify-end items-center pb-3">
                            <button
                                onClick={() => setIsEditOpen(false)}
                                className="text-red-600 text-xl hover:text-red-800 focus:outline-none"
                            >
                                <i className="fa-solid fa-xmark text-2xl"></i>
                            </button>
                        </div>
                        <h1 className="text-2xl font-bold font-[Poppins] text-center text-red-800 uppercase">
                            BOXING PRINTER STARTUP CHECKLIST
                        </h1>

                        {/* FORM FIELDS */}
                        <div className="mt-4">
                            <div className="grid grid-cols-3 gap-4 mb-5">
                                <div>
                                    <label className="font-semibold">
                                        Done By
                                    </label>
                                    <input
                                        className="input input-bordered w-full"
                                        value={selectedChecklist.performed_by}
                                        onChange={(e) =>
                                            setSelectedChecklist((prev) => ({
                                                ...prev,
                                                performed_by: e.target.value,
                                            }))
                                        }
                                    />
                                </div>

                                <div>
                                    <label className="font-semibold">
                                        Date
                                    </label>
                                    <input
                                        type="date"
                                        className="input input-bordered w-full"
                                        value={selectedChecklist.date_performed}
                                        onChange={(e) =>
                                            setSelectedChecklist((prev) => ({
                                                ...prev,
                                                date_performed: e.target.value,
                                            }))
                                        }
                                    />
                                </div>

                                <div>
                                    <label className="font-semibold">
                                        Acknowledged By
                                    </label>
                                    <input
                                        className="input input-bordered w-full bg-gray-200 cursor-not-allowed"
                                        readOnly
                                    />
                                </div>
                            </div>

                            {/* TABLE */}
                            <table className="table w-full border border-gray-300 mt-4 text-center">
                                <thead className="bg-blue-50">
                                    <tr>
                                        <th className="border border-gray-300">
                                            STATION NAME
                                        </th>
                                        <th className="border border-gray-300">
                                            CHECK (Internal parts)
                                        </th>
                                        <th className="border border-gray-300">
                                            REPLACE RIBBON / P2 LABEL
                                        </th>
                                        <th className="border border-gray-300">
                                            RESTART / CALIBRATE
                                        </th>
                                        <th className="border border-gray-300">
                                            REMARKS
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {selectedChecklist.items.map(
                                        (row, index) => (
                                            <tr key={index}>
                                                <td className="border border-gray-300 font-semibold">
                                                    {row.station_name}
                                                </td>
                                                <td className="border border-gray-300">
                                                    <input
                                                        type="checkbox"
                                                        className="checkbox"
                                                        checked={
                                                            row.check_internal
                                                        }
                                                        onChange={(e) => {
                                                            const items = [
                                                                ...selectedChecklist.items,
                                                            ];
                                                            items[
                                                                index
                                                            ].check_internal =
                                                                e.target.checked;
                                                            setSelectedChecklist(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    items,
                                                                }),
                                                            );
                                                        }}
                                                    />
                                                </td>
                                                <td className="border border-gray-300">
                                                    <input
                                                        type="checkbox"
                                                        className="checkbox"
                                                        checked={
                                                            row.replace_ribbon
                                                        }
                                                        onChange={(e) => {
                                                            const items = [
                                                                ...selectedChecklist.items,
                                                            ];
                                                            items[
                                                                index
                                                            ].replace_ribbon =
                                                                e.target.checked;
                                                            setSelectedChecklist(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    items,
                                                                }),
                                                            );
                                                        }}
                                                    />
                                                </td>
                                                <td className="border border-gray-300">
                                                    <input
                                                        type="checkbox"
                                                        className="checkbox"
                                                        checked={
                                                            row.restart_calib
                                                        }
                                                        onChange={(e) => {
                                                            const items = [
                                                                ...selectedChecklist.items,
                                                            ];
                                                            items[
                                                                index
                                                            ].restart_calib =
                                                                e.target.checked;
                                                            setSelectedChecklist(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    items,
                                                                }),
                                                            );
                                                        }}
                                                    />
                                                </td>
                                                <td className="border border-gray-300">
                                                    <input
                                                        type="text"
                                                        className="input input-bordered w-full"
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
                                                </td>
                                            </tr>
                                        ),
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* FOOTER */}
                        <div className="mt-6 flex justify-end space-x-3">
                            <button
                                onClick={() => setIsEditOpen(false)}
                                className="btn bg-red-600 text-white hover:bg-red-700 focus:outline-none rounded-md"
                            >
                                <i className="fa-solid fa-xmark"></i>
                                Cancel
                            </button>
                            <button
                                className="btn bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => {
                                    // Call save API for updated checklist
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
                                <i className="fa-solid fa-floppy-disk"></i>
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}

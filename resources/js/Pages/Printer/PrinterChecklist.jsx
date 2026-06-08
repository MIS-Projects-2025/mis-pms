import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import DataTable from "@/Components/DataTable";
import { useState, useEffect } from "react";
import { Select } from "antd";
import { Button } from "@/Components/ui/button";

import {
    Eye,
    Pencil,
    Trash2,
} from "lucide-react";


export default function PrinterChecklist({
    tableData,
    tableFilters,
    printerChecklists,
    printerName,
    emp_data,
}) {
    const { Option } = Select;
    const [isOpen, setIsOpen] = useState(false);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedChecklist, setSelectedChecklist] = useState(null);

    const [selectedPrinter, setSelectedPrinter] = useState("");
    const [serialNumber, setSerialNumber] = useState("");
    const [location, setLocation] = useState("");
    const [pmDate, setPmDate] = useState(() => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    });
    const [nextPm, setNextPm] = useState("");
    const [recommendations, setRecommendations] = useState("");
    const [checklistItems, setChecklistItems] = useState([]);
    const [printerOptions, setPrinterOptions] = useState([]);

    // useEffect(() => {
    //     const datePm = new Date(pmDate);
    //     datePm.setMonth(datePm.getMonth() + 1);
    //     setNextPm(datePm.toISOString().split("T")[0]);
    // }, [pmDate]);

    useEffect(() => {
        if (!pmDate) return;

        const datePm = new Date(pmDate);

        // set to 11th of next month
        const nextMonthDate = new Date(
            datePm.getFullYear(),
            datePm.getMonth() + 1,
            11,
        );

        const year = nextMonthDate.getFullYear();
        const month = String(nextMonthDate.getMonth() + 1).padStart(2, "0");
        const day = String(nextMonthDate.getDate()).padStart(2, "0");

        setNextPm(`${year}-${month}-${day}`);
    }, [pmDate]);

    // Initialize printer options
    useEffect(() => {
        if (printerName) {
            setPrinterOptions(
                printerName.map((p) => ({
                    name: p.printer_name,
                    serial: p.serial_number,
                    location: p.location,
                })),
            );
        }
    }, [printerName]);

    // Handle printer select change
    const handlePrinterChange = (e) => {
        const selected = printerOptions.find((p) => p.name === e.target.value);
        setSelectedPrinter(e.target.value); // ito ang magpapa-select sa <select>
        setSerialNumber(selected?.serial || ""); // fill serial number
        setLocation(selected?.location || ""); // fill location
    };

    // Initialize checklist items
    useEffect(() => {
        if (printerChecklists) {
            const items = printerChecklists.map((item, idx) => {
                // FIRST 4 = CHECKBOX ONLY
                if (idx < 4) {
                    return {
                        item: item.item,
                        checkitem: 0,
                    };
                }

                // NEXT 8 = ACTION + REMARKS
                if (idx >= 4 && idx < 12) {
                    return {
                        item: item.item,
                        action: "",
                        remarks: "",
                    };
                }

                // ITEM 13 = SINGLE CHECKBOX
                if (idx === 12) {
                    return {
                        item: item.item,
                        checkitem: 0,
                    };
                }

                // LAST 4 = QUALITY OK + REMARKS
                return {
                    item: item.item,
                    action: "",
                    remarks: "",
                };
            });

            setChecklistItems(items);
        }
    }, [printerChecklists]);

    useEffect(() => {
        if (selectedChecklist) {
            setPmDate(selectedChecklist.pm_date || "");
            setSelectedPrinter(selectedChecklist.printer_name || "");
            setSerialNumber(selectedChecklist.serial_num || "");
            setLocation(selectedChecklist.location || "");
            setNextPm(selectedChecklist.next_pm || "");
            setRecommendations(selectedChecklist.recommendations || "");

            // Deep copy items para sa editing
            const itemsCopy =
                selectedChecklist.items?.map((i) => ({
                    ...i,
                    checkitem: i.checkitem || 0,
                    action: i.action || "",
                    remarks: i.remarks || "",
                })) || [];
            setChecklistItems(itemsCopy);
        }
    }, [selectedChecklist]);

    const handleCheckboxChange = (index) => {
        setChecklistItems((prev) => {
            const updated = [...prev];
            updated[index].checkitem = updated[index].checkitem === 1 ? 0 : 1;
            return updated;
        });
    };

    const handleDropdownChange = (index, value) => {
        setChecklistItems((prev) => {
            const updated = [...prev];
            updated[index].action = value;
            return updated;
        });
    };

    const handleRemarksChange = (index, value) => {
        setChecklistItems((prev) => {
            const updated = [...prev];
            updated[index].remarks = value;
            return updated;
        });
    };

    const handleSaveChecklist = () => {
        // Check if all required fields are filled
        if (
            !pmDate ||
            !emp_data?.emp_name ||
            !selectedPrinter ||
            !serialNumber ||
            !location ||
            !nextPm ||
            !checklistItems?.length
        ) {
            alert(
                "⚠️ Please fill out all required fields before saving the checklist.",
            );
            return; // Stop execution if validation fails
        }

        const payload = {
            pm_date: pmDate,
            performed_by: emp_data?.emp_name || "",
            printer_name: selectedPrinter,
            serial_num: serialNumber,
            location: location,
            next_pm: nextPm,
            items: checklistItems,
            recommendations: recommendations,
        };

        router.post(route("printer-checklist.store"), payload, {
            onSuccess: () => {
                alert("✅ Printer checklist saved successfully!");
                setIsOpen(false);
                window.location.reload();
            },
            onError: (errors) => {
                console.error(errors);
                alert("❌ Error saving checklist");
            },
        });
    };

    const handleVerify = (id) => {
        if (!confirm("Mark this checklist as verified?")) return;

        router.put(
            route("printer-checklist.verify", id),
            {},
            {
                onSuccess: () => {
                    alert("✅ Checklist verified successfully!");
                    setIsViewOpen(false);
                    window.location.reload();
                },
                onError: () => {
                    alert("❌ Error verifying checklist.");
                },
            },
        );
    };

    const handleEditChecklist = () => {
        const payload = {
            pm_date: pmDate,
            printer_name: selectedPrinter,
            serial_num: serialNumber,
            location,
            next_pm: nextPm,
            recommendations,
            items: checklistItems,
        };

        router.put(
            route("printer-checklist.update", selectedChecklist.id),
            payload,
            {
                onSuccess: () => {
                    alert("✅ Printer Checklist updated successfully..!");
                    setIsEditOpen(false);
                    window.location.reload();
                },
            },
        );
    };

    const handleDelete = (id) => {
        if (confirm("Are you sure you want to delete this checklist?")) {
            router.delete(route("printer-checklist.destroy", id), {
                preserveScroll: true,
                onSuccess: () => {
                    alert("✅ Checklist removed successfully.");
                    window.location.reload();
                },
            });
        }
    };

    // Update your action buttons
    const dataWithAction = tableData.data.map((item) => {
        const [dueYear, dueMonth, dueDay] = item.pm_date.split("-");
        const [checkYear, checkMonth, checkDay] = item.next_pm.split("-");

        return {
            ...item,
            pm_date: `${dueMonth}/${dueDay}/${dueYear}`,
            next_pm: `${checkMonth}/${checkDay}/${checkYear}`,
            actions: (
                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => {
                            setSelectedChecklist({
                                ...item,
                                items: Array.isArray(item.items)
                                    ? item.items
                                    : typeof item.items === "string"
                                        ? JSON.parse(item.items)
                                        : [],
                            });

                            setIsViewOpen(true);
                        }}
                    >
                        <Eye className="h-4 w-4" />
                    </Button>

                    {((!item.verified_by &&
                        item.performed_by === emp_data?.emp_name) ||
                        Number(emp_data?.emp_id) === 1268) && (
                            <>
                                <Button
                                    size="sm"
                                    className="bg-amber-500 hover:bg-amber-600 text-white"
                                    onClick={() => {
                                        setSelectedChecklist({
                                            ...item,
                                            items: Array.isArray(item.items)
                                                ? item.items
                                                : typeof item.items === "string"
                                                    ? JSON.parse(item.items)
                                                    : [],
                                        });

                                        setIsEditOpen(true);
                                    }}
                                >
                                    <Pencil className="h-4 w-4" />
                                </Button>

                                <Button
                                    size="sm"
                                    className="bg-red-500 hover:bg-red-600 text-white"
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

    return (
        <AuthenticatedLayout>
            <Head title="Printer Checklist" />

            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold animate-bounce">
                    <i className="fa-solid fa-print mr-2"></i> Printer Checklist
                </h1>
                <button
                    className="text-white bg-green-500 border-2 border-green-900 btn hover:bg-green-700 rounded-md"
                    onClick={() => setIsOpen(true)}
                >
                    <i className="fa-solid fa-file-circle-plus"></i> New
                    Checklist
                </button>
            </div>

            <DataTable
                columns={[
                    { key: "printer_name", label: "Printer Name" },
                    { key: "serial_num", label: "Serial Number" },
                    { key: "location", label: "Location" },
                    { key: "performed_by", label: "Done By" },
                    { key: "pm_date", label: "Date Done" },
                    { key: "next_pm", label: "Date Due" },
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
                routeName={route("printer-checklist")}
                filters={tableFilters}
                rowKey="printer_name"
                showExport={false}
                tabKey="status"
                tabs={[
                    { label: "All", value: "" },
                    { label: "Pending", value: "2" },
                    { label: "Verified", value: "1" },
                ]}
            />

            {/* Modal */}
            {isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start z-50 overflow-y-auto">
                    <div className="bg-white text-gray-800 w-full max-w-6xl mx-4 my-10 rounded-lg p-5 relative">
                        {/* Close */}
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                window.location.reload();
                            }}
                            className="absolute top-4 right-4 text-red-600"
                        >
                            <i className="fa fa-times text-2xl"></i>
                        </button>

                        {/* Title */}
                        <h2 className="text-xl md:text-3xl font-bold mb-4 text-center text-red-800 uppercase md:mb-6 md:mt-2">
                            BARCODE PRINTER PREVENTIVE MAINTENANCE CHECKLIST
                        </h2>

                        {/* TOP INPUTS */}

                        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
                            <div className="flex flex-col">
                                <label className="text-sm font-medium mb-1">
                                    Printer Name
                                </label>
                                <Select
                                    value={selectedPrinter || undefined} // para sa controlled component
                                    onChange={(value) => {
                                        const selected = printerOptions.find(
                                            (p) => p.name === value,
                                        );
                                        setSelectedPrinter(value); // value ng select
                                        setSerialNumber(selected?.serial || "");
                                        setLocation(selected?.location || "");
                                    }}
                                    allowClear
                                    showSearch
                                    optionFilterProp="children"
                                    className="border p-2 rounded text-sm border border-gray-600"
                                    placeholder="Enter Printer..."
                                    required
                                >
                                    {printerOptions.map((p, i) => (
                                        <Option key={i} value={p.name}>
                                            {p.name}
                                        </Option>
                                    ))}
                                </Select>
                            </div>

                            <div className="flex flex-col">
                                <label className="text-sm font-medium mb-1">
                                    Serial Number
                                </label>
                                <input
                                    type="text"
                                    value={serialNumber}
                                    readOnly
                                    className="border p-2 rounded text-sm bg-gray-100"
                                />
                            </div>

                            <div className="flex flex-col">
                                <label className="text-sm font-medium mb-1">
                                    Location
                                </label>
                                <input
                                    type="text"
                                    value={location}
                                    readOnly
                                    className="border p-2 rounded text-sm bg-gray-100"
                                />
                            </div>

                            <div className="flex flex-col">
                                <label className="text-sm font-medium mb-1">
                                    Date Done
                                </label>
                                <input
                                    type="date"
                                    value={pmDate}
                                    onChange={(e) => setPmDate(e.target.value)}
                                    className="border p-2 rounded text-sm"
                                />
                            </div>

                            <div className="flex flex-col">
                                <label className="text-sm font-medium mb-1">
                                    Date Due
                                </label>
                                <input
                                    type="date"
                                    value={nextPm}
                                    onChange={(e) => setNextPm(e.target.value)}
                                    className="border p-2 rounded text-sm"
                                />
                            </div>

                            <div className="flex flex-col">
                                <label className="text-sm font-medium mb-1">
                                    Done By
                                </label>
                                <input
                                    type="text"
                                    value={emp_data?.emp_name || ""}
                                    readOnly
                                    className="border p-2 rounded text-sm bg-gray-100"
                                />
                            </div>
                        </div>

                        {/* SECTION 1: 4 CHECKBOXES */}
                        <table className="min-w-full border text-sm mb-4">
                            <tbody>
                                {checklistItems
                                    .slice(0, 4)
                                    .map((item, index) => (
                                        <tr key={index}>
                                            <td className="border p-2 text-center">
                                                <input
                                                    type="checkbox"
                                                    onChange={() =>
                                                        handleCheckboxChange(
                                                            index,
                                                        )
                                                    }
                                                    className="bg-white text-black hover:text-black focus:ring-black"
                                                    required
                                                />
                                            </td>
                                            <td className="border p-2 bg-blue-50">
                                                {item.item}
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>

                        {/* SECTION 2: Parts table (item5–item12) */}
                        <table className="min-w-full border text-sm mb-4">
                            <thead className="bg-blue-100 text-gray-700">
                                <tr>
                                    <th className="border p-2">Parts</th>
                                    <th className="border p-2">Action</th>
                                    <th className="border p-2">Remarks</th>
                                </tr>
                            </thead>
                            <tbody>
                                {checklistItems
                                    .slice(4, 12)
                                    .map((item, index) => (
                                        <tr key={index}>
                                            <td className="border p-2">
                                                {item.item}
                                            </td>
                                            <td className="border p-2">
                                                <select
                                                    className="border rounded p-1 w-full text-sm"
                                                    value={item.status}
                                                    onChange={(e) =>
                                                        handleDropdownChange(
                                                            index + 4,
                                                            e.target.value,
                                                        )
                                                    }
                                                    required
                                                >
                                                    <option
                                                        disabled
                                                        selected
                                                        value=""
                                                    >
                                                        Select Action...
                                                    </option>
                                                    <option value="A">
                                                        A - Adjust
                                                    </option>
                                                    <option value="I">
                                                        I - Inspect
                                                    </option>
                                                    <option value="R">
                                                        R - Replace
                                                    </option>
                                                    <option value="D">
                                                        D - Defective
                                                    </option>
                                                </select>
                                            </td>
                                            <td className="border p-2">
                                                <textarea
                                                    className="w-full border rounded p-1 text-sm"
                                                    value={item.remarks}
                                                    onChange={(e) =>
                                                        handleRemarksChange(
                                                            index + 4,
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>

                        {/* SECTION 3: 1 CHECKBOX */}
                        <table className="min-w-full border text-sm mb-4">
                            <tbody>
                                <tr>
                                    <td className="border p-2 text-center">
                                        <input
                                            type="checkbox"
                                            onChange={() =>
                                                handleCheckboxChange(12)
                                            }
                                            className="bg-white text-black hover:text-black focus:ring-black"
                                            required
                                        />
                                    </td>
                                    <td className="border p-2 bg-blue-50">
                                        {checklistItems[12]?.item}
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        {/* SECTION 4: Parts table (item14–item17) */}
                        <table className="min-w-full border-2 text-sm mb-4">
                            <thead className="bg-blue-100 text-gray-700">
                                <tr>
                                    <th className="border2 p-2">Parts</th>
                                    <th className="border2 p-2">
                                        Quality / Settings
                                    </th>
                                    <th className="border2 p-2">Remarks</th>
                                </tr>
                            </thead>
                            <tbody>
                                {checklistItems
                                    .slice(13, 17)
                                    .map((item, index) => (
                                        <tr key={index}>
                                            <td className="border-2 p-2">
                                                {item.item}
                                            </td>
                                            <td className="border-2 p-2">
                                                <select
                                                    className="border rounded p-1 w-full text-sm"
                                                    value={item.status}
                                                    onChange={(e) =>
                                                        handleDropdownChange(
                                                            index + 13,
                                                            e.target.value,
                                                        )
                                                    }
                                                    required
                                                >
                                                    <option
                                                        disabled
                                                        selected
                                                        value=""
                                                    >
                                                        Select here...
                                                    </option>
                                                    <option value="OK">
                                                        OK
                                                    </option>
                                                    <option value="OK">
                                                        N/A
                                                    </option>
                                                </select>
                                            </td>
                                            <td className="border-2 p-2">
                                                <textarea
                                                    className="w-full border rounded p-1 text-sm"
                                                    value={item.remarks}
                                                    onChange={(e) =>
                                                        handleRemarksChange(
                                                            index + 13,
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>

                        {/* TECHNICAL REPORT / RECOMMENDATION */}
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Technical Report / Recommendation
                            </label>
                            <textarea
                                className="w-full border rounded p-2 text-sm min-h-[100px]"
                                value={recommendations}
                                onChange={(e) =>
                                    setRecommendations(e.target.value)
                                }
                            />
                        </div>

                        <div className="flex flex-col md:flex-row justify-between mb-4 text-sm md:text-base">
                            <small className="font-medium text-red-800 font-semibold">
                                TELFORD SVC PHILS., INC.
                            </small>
                            <small className="font-medium">
                                MAINT-51 (Rev.4)
                            </small>
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end gap-2">
                            <button
                                className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
                                onClick={() => setIsOpen(false)}
                            >
                                {" "}
                                <i className="fa fa-times mr-1"></i> Close
                            </button>
                            <button
                                className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                                onClick={handleSaveChecklist}
                            >
                                <i className="fa fa-save mr-1"></i> Save
                                Checklist
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- VIEW MODAL --- */}
            {isViewOpen && selectedChecklist && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start z-50 overflow-y-auto">
                    <div className="bg-white text-gray-800 w-full max-w-6xl mx-4 my-10 rounded-lg p-5 relative">
                        <button
                            onClick={() => {
                                setIsViewOpen(false);
                                window.location.reload();
                            }}
                            className="absolute top-4 right-4 text-red-600"
                        >
                            <i className="fa fa-times text-2xl"></i>
                        </button>

                        <h2 className="text-xl md:text-2xl font-bold mb-4 text-center text-red-800">
                            BARCODE PRINTER PREVENTIVE MAINTENANCE CHECKLIST
                        </h2>
                        <div className="flex items-center justify-end mb-4">
                            {selectedChecklist.verified_by && (
                                <button
                                    className="px-3 py-2 bg-gray-100 text-red-600 rounded shadow hover:bg-red-700 hover:text-white border-2 border-red-600 hover:border-gray-500 flex items-center text-bold"
                                    onClick={() =>
                                        window.open(
                                            `printer-checklist/pdf/${selectedChecklist.id}`,
                                            "_blank",
                                        )
                                    }
                                >
                                    <i className="fa fa-file-pdf mr-1"></i> View
                                    as PDF
                                </button>
                            )}
                        </div>

                        {/* TOP INPUTS */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            {[
                                {
                                    label: "Printer Name",
                                    value: selectedChecklist.printer_name,
                                },
                                {
                                    label: "Serial Number",
                                    value: selectedChecklist.serial_num,
                                },
                                {
                                    label: "Location",
                                    value: selectedChecklist.location,
                                },
                                {
                                    label: "Done By",
                                    value: selectedChecklist.performed_by,
                                },
                                {
                                    label: "Date Done",
                                    value: selectedChecklist.pm_date,
                                    type: "date",
                                },
                                {
                                    label: "Date Due",
                                    value: selectedChecklist.next_pm,
                                    type: "date",
                                },
                            ].map((input, idx) => (
                                <div key={idx} className="flex flex-col">
                                    <label className="text-sm font-medium mb-1">
                                        {input.label}
                                    </label>
                                    <input
                                        type={input.type || "text"}
                                        value={input.value || ""}
                                        readOnly
                                        className="border p-2 rounded text-sm bg-gray-100"
                                    />
                                </div>
                            ))}
                            <div className="flex flex-col">
                                <label className="text-sm font-medium mb-1">
                                    Verified By
                                </label>
                                <div className="flex items-center gap-2">
                                    {!selectedChecklist.verified_by &&
                                    ["1268"].includes(emp_data.emp_id) ? (
                                        <>
                                            <input
                                                type="text"
                                                className="w-full border rounded p-2 text-sm bg-gray-100 cursor-not-allowed text-1xl"
                                                value={emp_data.emp_name || "-"}
                                                readOnly
                                            />
                                            <button
                                                className="px-3 py-2 bg-green-500 text-white rounded shadow hover:bg-green-600 border-2 border-green-700 flex items-center"
                                                onClick={() =>
                                                    handleVerify(
                                                        selectedChecklist.id,
                                                    )
                                                }
                                            >
                                                <i className="fa fa-check mr-1"></i>{" "}
                                                Verify
                                            </button>
                                        </>
                                    ) : (
                                        <input
                                            type="text"
                                            className="w-full border rounded p-2 text-sm bg-gray-100 cursor-not-allowed"
                                            value={
                                                selectedChecklist.verified_by ||
                                                "Pending..."
                                            }
                                            readOnly
                                        />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* SECTION 1: First 4 checkboxes */}
                        <table className="min-w-full border text-sm mb-4">
                            <tbody>
                                {selectedChecklist.items
                                    ?.slice(0, 4)
                                    .map((item, index) => (
                                        <tr key={index}>
                                            <td className="border p-2 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={
                                                        item.checkitem === 1
                                                    }
                                                    readOnly
                                                />
                                            </td>
                                            <td className="border p-2">
                                                {item.item}
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>

                        {/* SECTION 2: Parts 4–11 */}
                        <table className="min-w-full border text-sm mb-4">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="border p-2">Parts</th>
                                    <th className="border p-2">Action</th>
                                    <th className="border p-2">Remarks</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedChecklist.items
                                    ?.slice(4, 12)
                                    .map((item, index) => (
                                        <tr key={index}>
                                            <td className="border p-2">
                                                {item.item}
                                            </td>
                                            <td className="border p-2">
                                                <input
                                                    type="text"
                                                    value={item.action || ""}
                                                    readOnly
                                                    className="border p-1 rounded bg-gray-100 w-full text-sm"
                                                />
                                            </td>
                                            <td className="border p-2">
                                                <textarea
                                                    value={item.remarks || ""}
                                                    readOnly
                                                    className="w-full border rounded p-1 text-sm bg-gray-100"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>

                        {/* SECTION 3: 1 checkbox */}
                        <table className="min-w-full border text-sm mb-4">
                            <tbody>
                                <tr>
                                    <td className="border p-2 text-center">
                                        <input
                                            type="checkbox"
                                            readOnly
                                            checked={
                                                selectedChecklist.items?.[12]
                                                    ?.checkitem === 1
                                            }
                                        />
                                    </td>
                                    <td className="border p-2">
                                        {selectedChecklist.items?.[12]?.item}
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        {/* SECTION 4: Quality (13–end) */}
                        <table className="min-w-full border text-sm mb-4">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="border p-2">Parts</th>
                                    <th className="border p-2">
                                        Quality / Settings
                                    </th>
                                    <th className="border p-2">Remarks</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedChecklist.items
                                    ?.slice(13)
                                    .map((item, index) => (
                                        <tr key={index}>
                                            <td className="border p-2">
                                                {item.item}
                                            </td>
                                            <td className="border p-2">
                                                <input
                                                    type="text"
                                                    value={item.action || "OK"}
                                                    readOnly
                                                    className="border p-1 rounded bg-gray-100 w-full text-sm"
                                                />
                                            </td>
                                            <td className="border p-2">
                                                <textarea
                                                    value={item.remarks || ""}
                                                    readOnly
                                                    className="w-full border rounded p-1 text-sm bg-gray-100"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>

                        <label className="block text-sm font-medium mb-1">
                            Technical Report / Recommendation
                        </label>
                        <textarea
                            value={selectedChecklist.recommendations || ""}
                            readOnly
                            className="w-full border rounded p-2 text-sm min-h-[100px] bg-gray-100"
                        />

                        <div className="flex flex-col md:flex-row justify-between mb-4 text-sm md:text-base">
                            <small className="font-medium text-red-800 font-semibold">
                                TELFORD SVC PHILS., INC.
                            </small>
                            <small className="font-medium">
                                MAINT-51 (Rev.4)
                            </small>
                        </div>

                        <div className="flex justify-end gap-2 mt-4">
                            <button
                                className="bg-red-500 text-white px-4 py-2 rounded"
                                onClick={() => {
                                    setIsViewOpen(false);
                                    window.location.reload();
                                }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- EDIT MODAL --- */}
            {isEditOpen && selectedChecklist && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start z-50 overflow-y-auto">
                    <div className="bg-white text-gray-800 w-full max-w-6xl mx-4 my-10 rounded-lg p-5 relative">
                        {/* Close Button */}
                        <button
                            onClick={() => {
                                setIsEditOpen(false);
                                window.location.reload(); // full reload
                            }}
                            className="absolute top-4 right-4 text-red-600"
                        >
                            <i className="fa fa-times text-2xl"></i>
                        </button>

                        {/* Title */}
                        <h2 className="text-xl md:text-2xl font-bold mb-4 text-center text-red-800 uppercase">
                            BARCODE PRINTER PREVENTIVE MAINTENANCE CHECKLIST
                        </h2>

                        {/* TOP INPUTS */}
                        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
                            <input
                                type="date"
                                value={pmDate}
                                onChange={(e) => setPmDate(e.target.value)}
                                className="border p-2 rounded text-sm"
                            />

                            <input
                                type="text"
                                value={emp_data?.emp_name}
                                readOnly
                                className="border p-2 rounded text-sm bg-gray-100"
                            />

                            <select
                                value={selectedPrinter}
                                onChange={handlePrinterChange}
                                className="border p-2 rounded text-sm"
                            >
                                <option value="">Select Printer</option>
                                {printerOptions.map((p, i) => (
                                    <option key={i} value={p.name}>
                                        {p.name}
                                    </option>
                                ))}
                            </select>

                            <input
                                type="text"
                                value={serialNumber}
                                readOnly
                                className="border p-2 rounded text-sm bg-gray-100"
                            />

                            <input
                                type="text"
                                value={location}
                                readOnly
                                className="border p-2 rounded text-sm bg-gray-100"
                            />

                            <input
                                type="date"
                                value={nextPm}
                                onChange={(e) => setNextPm(e.target.value)}
                                className="border p-2 rounded text-sm"
                            />
                        </div>

                        {/* SECTION 1: First 4 CHECKBOX items */}
                        {checklistItems.slice(0, 4).map((item, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-3 mb-2"
                            >
                                <input
                                    type="checkbox"
                                    checked={item.checkitem === 1}
                                    onChange={() => handleCheckboxChange(index)}
                                />
                                <span>{item.item}</span>
                            </div>
                        ))}

                        {/* SECTION 2: ACTION + REMARKS (items 4–11) */}
                        <table className="min-w-full border text-sm mb-4 mt-4">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="border p-2">Parts</th>
                                    <th className="border p-2">Action</th>
                                    <th className="border p-2">Remarks</th>
                                </tr>
                            </thead>
                            <tbody>
                                {checklistItems
                                    .slice(4, 12)
                                    .map((item, index) => (
                                        <tr key={index}>
                                            <td className="border p-2">
                                                {item.item}
                                            </td>

                                            <td className="border p-2">
                                                <select
                                                    value={item.action || ""}
                                                    className="border rounded p-1 w-full"
                                                    onChange={(e) =>
                                                        handleDropdownChange(
                                                            4 + index,
                                                            e.target.value,
                                                        )
                                                    }
                                                >
                                                    <option value="">
                                                        Select
                                                    </option>
                                                    <option value="A">A</option>
                                                    <option value="I">I</option>
                                                    <option value="R">R</option>
                                                    <option value="D">D</option>
                                                </select>
                                            </td>

                                            <td className="border p-2">
                                                <textarea
                                                    value={item.remarks || ""}
                                                    className="border p-1 rounded w-full"
                                                    onChange={(e) =>
                                                        handleRemarksChange(
                                                            4 + index,
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>

                        {/* SECTION 3: 1 CHECKBOX (item 12) */}
                        <div className="flex items-center gap-3 mb-4">
                            <input
                                type="checkbox"
                                checked={checklistItems[12]?.checkitem === 1}
                                onChange={() => handleCheckboxChange(12)}
                            />
                            <span>{checklistItems[12]?.item}</span>
                        </div>

                        {/* SECTION 4: QUALITY SETTINGS (items 13–end) */}
                        <table className="min-w-full border text-sm mb-4">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="border p-2">Parts</th>
                                    <th className="border p-2">
                                        Quality / Settings
                                    </th>
                                    <th className="border p-2">Remarks</th>
                                </tr>
                            </thead>
                            <tbody>
                                {checklistItems.slice(13).map((item, index) => (
                                    <tr key={index}>
                                        <td className="border p-2">
                                            {item.item}
                                        </td>

                                        <td className="border p-2">
                                            <input
                                                type="text"
                                                className="border p-1 rounded w-full"
                                                value={item.action || "OK"}
                                                onChange={(e) =>
                                                    handleDropdownChange(
                                                        13 + index,
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </td>

                                        <td className="border p-2">
                                            <textarea
                                                className="border p-1 rounded w-full"
                                                value={item.remarks || ""}
                                                onChange={(e) =>
                                                    handleRemarksChange(
                                                        13 + index,
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* TECHNICAL REPORT */}
                        <div className="mt-4">
                            <label className="block font-medium mb-1">
                                Technical Report / Recommendation
                            </label>
                            <textarea
                                value={recommendations}
                                onChange={(e) =>
                                    setRecommendations(e.target.value)
                                }
                                className="w-full border p-2 rounded"
                            />
                        </div>

                        <div className="flex flex-col md:flex-row justify-between mb-4 text-sm md:text-base">
                            <small className="font-medium text-red-800 font-semibold">
                                TELFORD SVC PHILS., INC.
                            </small>
                            <small className="font-medium">
                                MAINT-51 (Rev.4)
                            </small>
                        </div>

                        {/* FOOTER BUTTONS */}
                        <div className="flex justify-end gap-2 mt-4">
                            <button
                                onClick={() => {
                                    setIsEditOpen(false);
                                    window.location.reload();
                                }}
                                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-700"
                            >
                                <i className="fa fa-times mr-1"></i>
                                Close
                            </button>

                            <button
                                onClick={handleEditChecklist}
                                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-700"
                            >
                                <i className="fa fa-save mr-1"></i> Save
                                Checklist
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}

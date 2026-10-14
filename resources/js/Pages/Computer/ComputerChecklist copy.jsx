import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import DataTable from "@/Components/DataTable";
import { useState, useEffect } from "react";
import { Select } from "antd";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/Components/ui/button";


export default function ComputerChecklist({
    tableData,
    tableFilters,
    computerChecklists,
    computerName,
    emp_data,
}) {
    const { Option } = Select;
    const [isOpen, setIsOpen] = useState(false);
    const [checklistItems, setChecklistItems] = useState([]);
    const [selectedComputer, setSelectedComputer] = useState("");
    const [performedBy, setPerformedBy] = useState("");
    const [recommendations, setRecommendations] = useState("");

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

    const [dateChecked, setDateChecked] = useState(() => {
        const today = new Date();
        return today.toISOString().split("T")[0];
    });

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
        // Ensure items is an array
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
        const payload = {
            computer_name: selectedComputer,
            date_checked: dateChecked,
            date_due: dateDue,
            performed_by: emp_data?.emp_name || "",
            items: checklistItems.map((item) => ({
                task: item.task,
                description: item.description,
                status: item.status,
            })),
            recommendations: recommendations,
        };

        router.post(route("computer-checklist.store"), payload, {
            onSuccess: () => {
                alert("✅ Checklist saved successfully!");
                toggleModal();
                window.location.reload();
            },
            onError: (errors) => {
                console.error(errors);
                alert("❌ Error saving checklist.");
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

        setIsEditOpen(true); // <-- Hiwalay sa create modal
    };

    const handleUpdateChecklist = () => {
        const payload = {
            computer_name: selectedComputer,
            date_checked: dateChecked,
            date_due: dateDue,
            performed_by: performedBy,
            items: checklistItems,
            recommendations,
        };

        router.put(route("computer-checklist.update", editId), payload, {
            onSuccess: () => {
                alert("✅ Checklist updated successfully!");
                setIsEditOpen(false);
                window.location.reload();
            },
            onError: () => {
                alert("❌ Error updating checklist.");
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
                    // Update local viewItem state so button disappears
                    setViewItem((prev) => ({
                        ...prev,
                        verified_by: emp_data?.emp_name || "Verified",
                    }));
                    window.location.reload();
                },
                onError: () => {
                    alert("❌ Error verifying checklist.");
                },
            },
        );
    };

    const isVerifier = ["1268"].includes(emp_data?.emp_id);

    const dataWithAction = tableData.data.map((item) => {
        const [dueYear, dueMonth, dueDay] = item.date_due.split("-");
        const [checkYear, checkMonth, checkDay] = item.date_checked.split("-");

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
                        {" "}
                        <Eye className="h-4 w-4" />{" "}
                    </Button>

                    {((!item.verified_by &&
                        item.performed_by === emp_data?.emp_name) ||
                        Number(emp_data?.emp_id) === 1268) && (
                            <>
                                <Button
                                    size="sm"
                                    className="bg-amber-500 hover:bg-amber-600 text-white"
                                    onClick={() => openEditModal(item)}
                                >
                                    {" "}
                                    <Pencil className="h-4 w-4" />{" "}
                                </Button>

                                <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDelete(item.id)}
                                >
                                    {" "}
                                    <Trash2 className="h-4 w-4" />{""}
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
                <h1 className="text-2xl font-bold animate-bounce">
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
                rowKey="computer_name"
                showExport={false}
                tabKey="status"
                tabs={[
                    { label: "All", value: "" },
                    { label: "Pending", value: "2" },
                    { label: "Done", value: "1" },
                ]}
            />

            {/* Create */}
            {isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start overflow-y-auto z-50">
                    <div className="bg-white text-gray-800 w-full max-w-6xl mx-4 my-10 rounded-lg shadow-lg p-5 relative">
                        <button
                            className="absolute top-4 right-4 text-red-600 hover:text-red-900 text-lg"
                            onClick={toggleModal}
                        >
                            <i className="fa fa-times"></i>
                        </button>

                        <h2 className="text-xl md:text-2xl font-bold mb-4 text-center text-red-800 uppercase">
                            Preventive Maintenance Checklist for Desktop and
                            Laptop
                        </h2>

                        {/* Form Inputs */}
                        <div className="flex flex-col-4 md:flex-row md:items-center md:space-x-4 mb-4 gap-2">
                            <div className="flex-1">
                                <label className="block text-sm font-medium mb-1">
                                    Computer Name
                                </label>
                                <Select
                                    showSearch
                                    value={selectedComputer}
                                    onChange={(value) =>
                                        setSelectedComputer(value)
                                    }
                                    optionFilterProp="children"
                                    filterOption={(input, option) =>
                                        option.children
                                            .toLowerCase()
                                            .includes(input.toLowerCase())
                                    }
                                    placeholder="Select Computer..."
                                    className="w-full border border-gray-600 p-2"
                                    required
                                >
                                    {hostnames.map((host) => (
                                        <Option key={host} value={host}>
                                            {host}
                                        </Option>
                                    ))}
                                </Select>
                            </div>

                            <div className="flex-1">
                                <label className="block text-sm font-medium mb-1">
                                    Date Done:
                                </label>
                                <input
                                    type="date"
                                    className="w-full border rounded p-2 text-sm"
                                    value={dateChecked}
                                    onChange={(e) =>
                                        setDateChecked(e.target.value)
                                    }
                                    required
                                />
                            </div>

                            <div className="flex-1">
                                <label className="block text-sm font-medium mb-1">
                                    Date Due:
                                </label>
                                <input
                                    type="date"
                                    className="w-full border rounded p-2 text-sm"
                                    value={dateDue}
                                    onChange={(e) => setDateDue(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="flex-1">
                                <label className="block text-sm font-medium mb-1">
                                    Done By
                                </label>
                                <input
                                    type="text"
                                    className="w-full border rounded p-2 text-sm bg-gray-100 cursor-not-allowed"
                                    value={emp_data?.emp_name || ""}
                                    readOnly
                                />
                            </div>
                        </div>

                        {/* Checklist Table with multiple check-all */}
                        <div className=" max-h-[60vh] md:max-h-[80vh]">
                            <table className="min-w-full text-sm text-left border table-auto">
                                <thead className="bg-blue-100 text-gray-700 sticky top-0">
                                    <tr>
                                        <th className="border p-2">Item#</th>
                                        <th className="border p-2">Task</th>
                                        <th className="border p-2">
                                            Description
                                        </th>
                                        <th className="border p-2 text-center">
                                            <input
                                                type="checkbox"
                                                checked={checklistItems.every(
                                                    (item) =>
                                                        item.status === "ok",
                                                )}
                                                onChange={(e) => {
                                                    const status = e.target
                                                        .checked
                                                        ? "ok"
                                                        : null;
                                                    setChecklistItems((prev) =>
                                                        prev.map((item) => ({
                                                            ...item,
                                                            status,
                                                        })),
                                                    );
                                                }}
                                                className="bg-white text-black hover:text-black focus:ring-black"
                                            />{" "}
                                            OK
                                        </th>
                                        <th className="border p-2 text-center">
                                            <input
                                                type="checkbox"
                                                checked={checklistItems.every(
                                                    (item) =>
                                                        item.status ===
                                                        "repair",
                                                )}
                                                onChange={(e) => {
                                                    const status = e.target
                                                        .checked
                                                        ? "repair"
                                                        : null;
                                                    setChecklistItems((prev) =>
                                                        prev.map((item) => ({
                                                            ...item,
                                                            status,
                                                        })),
                                                    );
                                                }}
                                                className="bg-white text-black hover:text-black focus:ring-black"
                                            />{" "}
                                            REPAIR
                                        </th>
                                        <th className="border p-2 text-center">
                                            <input
                                                type="checkbox"
                                                checked={checklistItems.every(
                                                    (item) =>
                                                        item.status === "na",
                                                )}
                                                onChange={(e) => {
                                                    const status = e.target
                                                        .checked
                                                        ? "na"
                                                        : null;
                                                    setChecklistItems((prev) =>
                                                        prev.map((item) => ({
                                                            ...item,
                                                            status,
                                                        })),
                                                    );
                                                }}
                                                className="bg-white text-black hover:text-black focus:ring-black"
                                            />{" "}
                                            N/A
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {checklistItems.map((item, index) => (
                                        <tr
                                            key={index}
                                            className="hover:bg-gray-50"
                                        >
                                            <td className="border p-2">
                                                {index + 1}
                                            </td>
                                            <td className="border p-2">
                                                {item.task}
                                            </td>
                                            <td className="border p-2 whitespace-pre-line">
                                                {item.description}
                                            </td>
                                            <td className="border p-2 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={
                                                        item.status === "ok"
                                                    }
                                                    onChange={() =>
                                                        handleCheckboxChange(
                                                            index,
                                                            "ok",
                                                        )
                                                    }
                                                    className="bg-white text-black hover:text-black focus:ring-black"
                                                />
                                            </td>
                                            <td className="border p-2 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={
                                                        item.status === "repair"
                                                    }
                                                    onChange={() =>
                                                        handleCheckboxChange(
                                                            index,
                                                            "repair",
                                                        )
                                                    }
                                                    className="bg-white text-black hover:text-black focus:ring-black"
                                                />
                                            </td>
                                            <td className="border p-2 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={
                                                        item.status === "na"
                                                    }
                                                    onChange={() =>
                                                        handleCheckboxChange(
                                                            index,
                                                            "na",
                                                        )
                                                    }
                                                    className="bg-white text-black hover:text-black focus:ring-black"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Recommendations */}
                        <div className="mt-4">
                            <label className="block text-sm font-medium mb-1">
                                Recommendations
                            </label>
                            <textarea
                                className="w-full border rounded p-2 text-sm min-h-[100px]"
                                value={recommendations}
                                onChange={(e) =>
                                    setRecommendations(e.target.value)
                                }
                                placeholder="Enter any recommendations here..."
                            />
                        </div>

                        {/* Buttons */}
                        <div className="mt-4 flex flex-col md:flex-row justify-end gap-2">
                            <button
                                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 flex items-center justify-center border-2 border-red-800"
                                onClick={toggleModal}
                            >
                                <i className="fa fa-times mr-1"></i> Close
                            </button>
                            <button
                                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center justify-center border-2 border-green-800 disabled:hidden"
                                onClick={handleSaveChecklist}
                                disabled={!canSave}
                            >
                                <i className="fa fa-save mr-1"></i> Save
                                Checklist
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Modal */}
            {isViewOpen && viewItem && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start overflow-y-auto z-50">
                    <div className="bg-white text-gray-800 w-full max-w-6xl mx-4 my-10 rounded-lg shadow-lg p-5 relative">
                        <button
                            className="absolute top-4 right-4 text-red-600 hover:text-red-900 text-lg"
                            onClick={closeViewModal}
                        >
                            <i className="fa fa-times"></i>
                        </button>

                        <h2 className="text-xl md:text-2xl font-bold mb-4 text-center text-red-800 uppercase">
                            Preventive Maintenance Checklist for Desktop PCs and
                            Laptops
                        </h2>
                        <div className="flex items-center justify-end mb-4">
                            {viewItem.verified_by && (
                                <button
                                    className="px-3 py-2 bg-gray-100 text-red-600 rounded shadow hover:bg-red-700 hover:text-white border-2 border-red-600 hover:border-gray-500 flex items-center text-bold"
                                    onClick={() =>
                                        window.open(
                                            `computer-checklist/pdf/${viewItem.id}`,
                                            "_blank",
                                        )
                                    }
                                >
                                    <i className="fa fa-file-pdf mr-1"></i> View
                                    as PDF
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Computer Name
                                </label>
                                <input
                                    type="text"
                                    className="w-full border rounded p-2 text-sm bg-gray-100 cursor-not-allowed"
                                    value={viewItem.computer_name || "-"}
                                    readOnly
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Date Done
                                </label>
                                <input
                                    type="text"
                                    className="w-full border rounded p-2 text-sm bg-gray-100 cursor-not-allowed"
                                    value={
                                        viewItem.date_checked
                                            ? new Date(
                                                  viewItem.date_checked,
                                              ).toLocaleDateString("en-US")
                                            : "-"
                                    }
                                    readOnly
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Date Due
                                </label>
                                <input
                                    type="text"
                                    className="w-full border rounded p-2 text-sm bg-gray-100 cursor-not-allowed"
                                    value={
                                        viewItem.date_due
                                            ? new Date(
                                                  viewItem.date_due,
                                              ).toLocaleDateString("en-US")
                                            : "-"
                                    }
                                    readOnly
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Done By
                                </label>
                                <input
                                    type="text"
                                    className="w-full border rounded p-2 text-sm bg-gray-100 cursor-not-allowed"
                                    value={viewItem.performed_by || "-"}
                                    readOnly
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="block text-sm font-medium mb-1">
                                    Verified By
                                </label>
                                <div className="flex items-center gap-2">
                                    {!viewItem.verified_by &&
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
                                                    handleVerify(viewItem.id)
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
                                                viewItem.verified_by ||
                                                "Pending..."
                                            }
                                            readOnly
                                        />
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className=" max-h-[60vh] md:max-h-[80vh]">
                            <table className="min-w-full text-sm text-left border table-auto">
                                <thead className="bg-gray-100 sticky top-0">
                                    <tr>
                                        <th className="border p-2">Item#</th>
                                        <th className="border p-2">Task</th>
                                        <th className="border p-2">
                                            Description
                                        </th>
                                        <th className="border p-2 text-center">
                                            OK
                                        </th>
                                        <th className="border p-2 text-center">
                                            REPAIR
                                        </th>
                                        <th className="border p-2 text-center">
                                            N/A
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Array.isArray(viewItem.items) ? (
                                        viewItem.items.map((item, index) => (
                                            <tr
                                                key={index}
                                                className="hover:bg-gray-50"
                                            >
                                                <td className="border p-2">
                                                    {index + 1}
                                                </td>
                                                <td className="border p-2">
                                                    {item.task}
                                                </td>
                                                <td className="border p-2 whitespace-pre-line">
                                                    {item.description}
                                                </td>
                                                <td className="border p-2 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={
                                                            item.status === "ok"
                                                        }
                                                        disabled
                                                    />
                                                </td>
                                                <td className="border p-2 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={
                                                            item.status ===
                                                            "repair"
                                                        }
                                                        disabled
                                                    />
                                                </td>
                                                <td className="border p-2 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={
                                                            item.status === "na"
                                                        }
                                                        disabled
                                                    />
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                className="border p-2 text-center"
                                                colSpan={6}
                                            >
                                                No checklist items available
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-4">
                            <label className="block text-sm font-medium mb-1">
                                Recommendations
                            </label>
                            <textarea
                                className="w-full border rounded p-2 text-sm min-h-[80px] bg-gray-100"
                                value={viewItem.recommendations || ""}
                                readOnly
                            />
                        </div>

                        <div className="flex justify-between mb-4">
                            <small className="text-sm font-medium text-red-800 font-semibold">
                                TELFORD SVC PHILS., INC.
                            </small>
                            <small className="text-sm font-medium">
                                MIS-03 (Rev.1)
                            </small>
                        </div>

                        <div className="mt-4 flex justify-end">
                            <button
                                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 flex items-center justify-center border-2 border-red-800"
                                onClick={closeViewModal}
                            >
                                <i className="fa fa-times mr-1"></i> Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isEditOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start overflow-y-auto z-50">
                    <div className="bg-white text-gray-800 w-full max-w-6xl mx-4 my-10 rounded-lg p-5 relative shadow-lg">
                        {/* Close Button */}
                        <button
                            onClick={() => setIsEditOpen(false)}
                            className="absolute top-4 right-4 text-red-600 hover:text-red-800"
                        >
                            <i className="fa fa-times text-2xl"></i>
                        </button>

                        {/* Title */}
                        <h2 className="text-xl md:text-2xl font-bold mb-4 text-center text-red-800 uppercase">
                            Preventive Maintenance Checklist for Desktop PCs and
                            Laptops
                        </h2>

                        {/* BASIC INFO */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            {/* Computer Name */}
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Computer Name
                                </label>
                                {/* <input
                                    type="text"
                                    className="w-full border rounded p-2 text-sm bg-gray-100 cursor-not-allowed"
                                    value={selectedComputer}
                                    onChange={(e) =>
                                        setSelectedComputer(e.target.value)
                                    }
                                    readOnly
                                /> */}
                                <Select
                                    showSearch
                                    value={selectedComputer}
                                    onChange={(value) =>
                                        setSelectedComputer(value)
                                    }
                                    optionFilterProp="children"
                                    filterOption={(input, option) =>
                                        option.children
                                            .toLowerCase()
                                            .includes(input.toLowerCase())
                                    }
                                    placeholder="Select Computer..."
                                    className="w-full border border-gray-600 p-2"
                                    required
                                >
                                    {hostnames.map((host) => (
                                        <Option key={host} value={host}>
                                            {host}
                                        </Option>
                                    ))}
                                </Select>
                            </div>

                            {/* Date Done */}
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Date Done
                                </label>
                                <input
                                    type="date"
                                    className="w-full border rounded p-2 text-sm cursor-not-allowed bg-gray-100"
                                    value={dateChecked}
                                    onChange={(e) =>
                                        setDateChecked(e.target.value)
                                    }
                                    readOnly
                                />
                            </div>

                            {/* Date Due */}
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Date Due
                                </label>
                                <input
                                    type="date"
                                    className="w-full border rounded p-2 text-sm cursor-not-allowed bg-gray-100"
                                    value={dateDue}
                                    onChange={(e) => setDateDue(e.target.value)}
                                    readOnly
                                />
                            </div>

                            {/* Done By */}
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Done By
                                </label>
                                <input
                                    type="text"
                                    className="w-full border rounded p-2 text-sm bg-gray-100 cursor-not-allowed"
                                    value={performedBy}
                                    readOnly
                                />
                            </div>
                        </div>

                        {/* CHECKLIST TABLE */}
                        <div className="overflow-x-auto max-h-[90vh] border rounded mb-4">
                            <table className="min-w-full text-sm border">
                                <thead className="bg-gray-100 sticky top-0 z-10">
                                    <tr>
                                        <th className="border p-2 w-1/12">#</th>
                                        <th className="border p-2 w-4/12">
                                            Task
                                        </th>
                                        <th className="border p-2 w-5/12">
                                            Description
                                        </th>

                                        {/* Check-All */}
                                        <th className="border p-2 text-center">
                                            <input
                                                type="checkbox"
                                                checked={checklistItems.every(
                                                    (item) =>
                                                        item.status === "ok",
                                                )}
                                                onChange={(e) => {
                                                    const status = e.target
                                                        .checked
                                                        ? "ok"
                                                        : null;
                                                    setChecklistItems((prev) =>
                                                        prev.map((item) => ({
                                                            ...item,
                                                            status,
                                                        })),
                                                    );
                                                }}
                                            />{" "}
                                            OK
                                        </th>

                                        <th className="border p-2 text-center">
                                            <input
                                                type="checkbox"
                                                checked={checklistItems.every(
                                                    (item) =>
                                                        item.status ===
                                                        "repair",
                                                )}
                                                onChange={(e) => {
                                                    const status = e.target
                                                        .checked
                                                        ? "repair"
                                                        : null;
                                                    setChecklistItems((prev) =>
                                                        prev.map((item) => ({
                                                            ...item,
                                                            status,
                                                        })),
                                                    );
                                                }}
                                            />{" "}
                                            REPAIR
                                        </th>

                                        <th className="border p-2 text-center">
                                            <input
                                                type="checkbox"
                                                checked={checklistItems.every(
                                                    (item) =>
                                                        item.status === "na",
                                                )}
                                                onChange={(e) => {
                                                    const status = e.target
                                                        .checked
                                                        ? "na"
                                                        : null;
                                                    setChecklistItems((prev) =>
                                                        prev.map((item) => ({
                                                            ...item,
                                                            status,
                                                        })),
                                                    );
                                                }}
                                            />{" "}
                                            N/A
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {checklistItems.map((item, index) => (
                                        <tr
                                            key={index}
                                            className="hover:bg-gray-50"
                                        >
                                            <td className="border p-2 text-center">
                                                {index + 1}
                                            </td>
                                            <td className="border p-2">
                                                {item.task}
                                            </td>
                                            <td className="border p-2 whitespace-pre-line">
                                                {item.description}
                                            </td>

                                            {/* OK */}
                                            <td className="border p-2 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={
                                                        item.status === "ok"
                                                    }
                                                    onChange={() =>
                                                        handleCheckboxChange(
                                                            index,
                                                            "ok",
                                                        )
                                                    }
                                                />
                                            </td>

                                            {/* REPAIR */}
                                            <td className="border p-2 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={
                                                        item.status === "repair"
                                                    }
                                                    onChange={() =>
                                                        handleCheckboxChange(
                                                            index,
                                                            "repair",
                                                        )
                                                    }
                                                />
                                            </td>

                                            {/* N/A */}
                                            <td className="border p-2 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={
                                                        item.status === "na"
                                                    }
                                                    onChange={() =>
                                                        handleCheckboxChange(
                                                            index,
                                                            "na",
                                                        )
                                                    }
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Recommendations */}
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Recommendations
                            </label>
                            <textarea
                                className="w-full border rounded p-2 text-sm min-h-[120px]"
                                value={recommendations}
                                onChange={(e) =>
                                    setRecommendations(e.target.value)
                                }
                            ></textarea>
                        </div>

                        <div className="flex flex-col md:flex-row justify-between mb-4 text-sm md:text-base">
                            <small className="font-medium text-red-800 font-semibold">
                                TELFORD SVC PHILS., INC.
                            </small>
                            <small className="font-medium">
                                MIS-03 (Rev.1)
                            </small>
                        </div>

                        {/* FOOTER BUTTONS */}
                        <div className="mt-4 flex flex-col md:flex-row justify-end gap-2">
                            <button
                                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 flex items-center justify-center border-2 border-red-800"
                                onClick={() => setIsEditOpen(false)}
                            >
                                <i className="fa fa-times mr-1"></i>
                                Close
                            </button>

                            <button
                                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center justify-center border-2 border-green-800"
                                onClick={handleUpdateChecklist}
                            >
                                <i className="fa fa-save mr-1"></i> Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}

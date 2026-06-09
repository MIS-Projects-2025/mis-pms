import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import DataTable from "@/Components/DataTable";
import { useState, useEffect } from "react";
import { Select } from "antd";
import { Eye, Pencil, Trash2 } from "lucide-react";

export default function CctvChecklist({
    tableData,
    tableFilters,
    emp_data,
    area,
    cctvLists,
}) {
    const { Option } = Select;

    const [showModal, setShowModal] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);
    const [viewModal, setViewModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [editModal, setEditModal] = useState(false);

    const today = new Date().toISOString().split("T")[0];

    // Header info
    const [cameraName, setcameraName] = useState("");
    const [selectedCamera, setSelectedCamera] = useState("");

    const [ipAddress, setIpAddress] = useState("");
    const [controlNo, setControlNo] = useState("");
    const [location, setLocation] = useState("");
    const [dueDate, setDueDate] = useState(() => {
        const today = new Date();
        today.setMonth(today.getMonth() + 1); // add 1 month
        return today.toISOString().split("T")[0];
    });
    const [datePerformed, setDatePerformed] = useState(today);
    const [performedBy, setPerformedBy] = useState(emp_data?.emp_name || "");

    useEffect(() => {
        if (cctvLists) {
            setcameraName(
                cctvLists.map((c) => ({
                    camera_name: c.camera_name,
                    ip_address: c.ip_address,
                    control_no: c.control_no,
                    location: c.location,
                })),
            );
        }
    }, [cctvLists]);

    const handlePrinterChange = (e) => {
        const selected = cameraName.find(
            (c) => c.camera_name === e.target.value,
        );
        setSelectedCamera(e.target.value);
        setIpAddress(selected?.ip_address || "");
        setControlNo(selected?.control_no || "");
        setLocation(selected?.location || "");
    };

    // Checklist items
    const checklistItems = [
        // CAMERA & HOUSING
        "Camera / lens focus, and auto iris adjusted properly.",
        "Camera field of view is adjusted to customer’s requirements.",
        "Camera / housing viewing window is clean, inside and out.",
        "Camera lens is dust free.",
        "Interior of camera enclosure is clean and dry.",
        "Check operation of pan tilt and zoom focus.",
        // WIRE & CABLE
        "Check wiring and cable harnesses for wear and fray.",
        "Check to make sure cable is dressed properly.",
        "Check connectors and cable entry points for loose wiring.",
        "Coaxial cable is transmitting adequate video signal.",
        // CONTROL EQUIPMENT
        "Monitors are free from picture burn-in and distortion.",
        "Monitors have proper contrast and brightness.",
        "DVRs are functioning properly.",
        "Clean all monitor screens, control panels, and keyboards.",
        "Check all coaxial connectors for loose connections.",
        "Check all power connections.",
    ];

    const [remarks, setRemarks] = useState(
        Array(checklistItems.length).fill(""),
    );
    const [recommendations, setRecommendations] = useState(
        Array(checklistItems.length).fill(""),
    );

    // Handle save
    const handleSave = () => {
        if (!confirm("⚠️ Are you sure you want to save this CCTV checklist?")) {
            return; // user cancelled
        }

        const checkItemsData = checklistItems.map((item, index) => ({
            item,
            remark: remarks[index],
            recommendation: recommendations[index],
        }));

        router.post(
            route("cctv.store"),
            {
                camera_name: selectedCamera,
                ip_address: ipAddress,
                control_no: controlNo,
                location: location,
                date_performed: datePerformed,
                due_date: dueDate,
                performed_by: performedBy,
                check_items: JSON.stringify(checkItemsData),
                remarks: remarks.join("; "),
                recommendation: recommendations.join("; "),
            },
            {
                onSuccess: () => {
                    setShowModal(false);
                    alert("✅ Checklist saved successfully!");
                    window.location.reload();
                },
                onError: (errors) => {
                    alert("❌ Failed to save checklist!");
                    console.error(errors);
                },
            },
        );
    };

    // const handleSave = () => {
    //   if (!confirm("Save checklist?")) return;

    //   const payload = {
    //     camera_name: selectedCamera,
    //     ip_address: ipAddress,
    //     location: location,
    //     date_performed: datePerformed,
    //     due_date: dueDate,
    //     performed_by: performedBy,
    //     check_items: JSON.stringify(
    //       checklistItems.map((item, i) => ({
    //         item,
    //         remark: remarks[i],
    //         recommendation: recommendations[i],
    //       }))
    //     ),
    //   };

    //   router.post(route("cctv.store"), payload, {
    //     onSuccess: () => {
    //       alert("✅ Saved successfully!");
    //       setShowModal(false);
    //       window.location.reload();
    //     }
    //   });
    // };

    const handleUpdate = () => {
        if (!confirm("Update this checklist?")) return;

        const payload = {
            camera_name: selectedCamera,
            ip_address: ipAddress,
            location: location,
            date_performed: datePerformed,
            due_date: dueDate,
            performed_by: performedBy,
            check_items: JSON.stringify(
                checklistItems.map((item, i) => ({
                    item,
                    remark: remarks[i],
                    recommendation: recommendations[i],
                })),
            ),
        };

        router.put(route("cctv.update", selectedReport.id), payload, {
            onSuccess: () => {
                alert("✅ Updated successfully!");
                setEditModal(false);
                window.location.reload();
            },
        });
    };

    const handleVerify = (id) => {
        if (!confirm("Mark this CCTV Checklist as verified?")) return;

        router.put(
            route("cctv-checklist.verify", id),
            {},
            {
                onSuccess: () => {
                    alert("✅ Checklist verified successfully!");
                    setViewModal(false);
                    window.location.reload();
                },
                onError: () => {
                    alert("❌ Error verifying checklist.");
                },
            },
        );
    };

    const dataWithAction = tableData.data.map((r) => {
        let formattedDueDate = "";
        let formattedDatePerformed = "";

        if (r.due_date) {
            const [year, month, day] = r.due_date.split("-");
            formattedDueDate = `${month}/${day}/${year}`;
        }

        if (r.date_performed) {
            const [year, month, day] = r.date_performed.split("-");
            formattedDatePerformed = `${month}/${day}/${year}`;
        }

        return {
            ...r,
            due_date: formattedDueDate,
            date_performed: formattedDatePerformed,

            action: (
                <div className="flex gap-2">
                    {/* VIEW */}
                    <button
                        className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-1"
                        onClick={() => {
                            setSelectedReport(r);
                            setViewModal(true);
                        }}
                    >
                        <Eye className="h-4 w-4" />
                    </button>

                    {/* EDIT (optional) */}
                    {!r.verified_by && (
                        <button
                            className="px-3 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 flex items-center gap-1"
                            onClick={() => {
                                setSelectedReport(r);

                                // PREFILL HEADER
                                setSelectedCamera(r.camera_name);
                                setIpAddress(r.ip_address);
                                setLocation(r.location);
                                setDatePerformed(r.date_performed);
                                setDueDate(r.due_date);

                                // PREFILL CHECKLIST
                                const parsed = JSON.parse(
                                    r.check_items || "[]",
                                );

                                setRemarks(parsed.map((i) => i.remark || ""));
                                setRecommendations(
                                    parsed.map((i) => i.recommendation || ""),
                                );

                                setEditModal(true);
                            }}
                        >
                            <Pencil className="h-4 w-4" />
                        </button>
                    )}
                </div>
            ),
        };
    });

    return (
        <AuthenticatedLayout>
            <Head title="cctv" />

            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold">
                    <i className="fa-solid fa-video"></i> CCTV Checklist
                </h1>

                {!["superadmin", "admin"].includes(
                    emp_data?.emp_system_role,
                ) && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="text-white bg-green-500 border-green-900 btn hover:bg-green-700"
                    >
                        <i className="fa-solid fa-plus"></i> New CCTV Checklist
                    </button>
                )}
            </div>

            {/* TABLE */}
            <DataTable
                columns={[
                    { key: "camera_name", label: "Camera Name" },
                    { key: "location", label: "Location" },
                    { key: "date_performed", label: "Date Performed" },
                    { key: "due_date", label: "Due Date" },
                    { key: "performed_by", label: "Performed By" },
                    { key: "verified_by", label: "Verified By" },
                    { key: "action", label: "Action" },
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
                routeName={route("cctv.index")}
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

            {/* CUSTOM MODAL */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                    <div className="bg-white w-[95%] max-w-7xl rounded-lg shadow-lg overflow-hidden border-4 border-pink-500">
                        {/* HEADER */}
                        <div className="flex justify-end items-center px-6 py-4">
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-red-600 hover:text-red-700 text-xl hover:font-semibold"
                            >
                                ✕
                            </button>
                        </div>

                        {/* BODY */}
                        <div className="p-6 overflow-y-auto max-h-[75vh] text-gray-600">
                            {/* Title */}
                            <div className="text-center mb-4">
                                <h1 className="text-3xl font-bold text-orange-700">
                                    CCTV
                                </h1>
                                <h2 className="text-lg">
                                    Preventative Maintenance Checklist
                                </h2>
                            </div>

                            {/* HEADER INFO */}
                            <div className="grid grid-cols-3 gap-4 text-sm mb-6">
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-stone-600">
                                        Camera Name
                                    </label>
                                    <Select
                                        value={selectedCamera || undefined} // para sa controlled component
                                        onChange={(value) => {
                                            const selected = cameraName.find(
                                                (p) => p.camera_name === value,
                                            );
                                            setSelectedCamera(value); // value ng select

                                            setControlNo(
                                                selected?.control_no || "",
                                            );
                                            setLocation(
                                                selected?.location || "",
                                            );
                                            setIpAddress(
                                                selected?.ip_address || "",
                                            );
                                        }}
                                        allowClear
                                        showSearch
                                        optionFilterProp="children"
                                        className="border border-gray-500 w-full rounded-md border-gray-500 bg-white text-gray-500 py-2 px-3"
                                        placeholder="Enter Printer..."
                                        required
                                    >
                                        {cameraName.map((p, i) => (
                                            <Option
                                                key={i}
                                                value={p.camera_name}
                                            >
                                                {p.camera_name}
                                            </Option>
                                        ))}
                                    </Select>
                                </div>
                                {/* <div>
                                <label className="block text-sm font-medium mb-1 text-stone-600">Control No:</label>
                                <input
                                    type="text"
                                    className="border border-gray-500 w-full rounded-md bg-gray-100 text-stone-700"
                                    value={controlNo}
                                    readOnly
                                />
                                </div> */}

                                <div>
                                    <label className="block text-sm font-medium mb-1 text-stone-600">
                                        Location:
                                    </label>
                                    <input
                                        type="text"
                                        className="border border-gray-500 w-full rounded-md bg-gray-100 text-stone-700"
                                        value={location}
                                        readOnly
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1 text-stone-600">
                                        IP Address:
                                    </label>
                                    <input
                                        type="text"
                                        className="border border-gray-500 w-full rounded-md bg-gray-100 text-stone-700"
                                        value={ipAddress}
                                        readOnly
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-stone-600">
                                        Performed By:
                                    </label>
                                    <input
                                        className="border border-gray-500 w-full rounded-md col-span-2 bg-gray-100"
                                        value={performedBy}
                                        readOnly
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-stone-600">
                                        Date Performed:
                                    </label>
                                    <input
                                        type="date"
                                        className="border border-gray-500 w-full rounded-md bg-white text-stone-700"
                                        value={datePerformed}
                                        onChange={(e) =>
                                            setDatePerformed(e.target.value)
                                        }
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-stone-600">
                                        Due Date:
                                    </label>
                                    <input
                                        type="date"
                                        className="border border-gray-500 w-full rounded-md bg-white text-stone-700"
                                        value={dueDate}
                                        onChange={(e) =>
                                            setDueDate(e.target.value)
                                        }
                                    />
                                </div>
                            </div>

                            {/* TABLE */}
                            <table className="w-full border border-gray-300 text-sm">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="border p-2 w-12">#</th>
                                        <th className="border p-2">
                                            Checklist Item
                                        </th>
                                        <th className="border p-2 w-1/4">
                                            Remarks
                                        </th>
                                        <th className="border p-2 w-1/4">
                                            Recommendation
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {checklistItems.map((item, index) => (
                                        <tr key={index}>
                                            <td className="border p-2 text-center">
                                                {index + 1}
                                            </td>
                                            <td className="border p-2">
                                                {item}
                                            </td>
                                            <td className="border p-2">
                                                <textarea
                                                    className="w-full textarea textarea-bordered textarea-sm bg-white"
                                                    value={remarks[index]}
                                                    onChange={(e) => {
                                                        const newRemarks = [
                                                            ...remarks,
                                                        ];
                                                        newRemarks[index] =
                                                            e.target.value;
                                                        setRemarks(newRemarks);
                                                    }}
                                                />
                                            </td>
                                            <td className="border p-2">
                                                <textarea
                                                    className="w-full textarea textarea-bordered textarea-sm bg-white"
                                                    value={
                                                        recommendations[index]
                                                    }
                                                    onChange={(e) => {
                                                        const newRec = [
                                                            ...recommendations,
                                                        ];
                                                        newRec[index] =
                                                            e.target.value;
                                                        setRecommendations(
                                                            newRec,
                                                        );
                                                    }}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* FOOTER */}
                            <div className="flex justify-between items-center mt-6">
                                <div className="text-xs text-gray-600">
                                    TELFORD SVC PHILS., INC.
                                    <br />
                                    MIS-06 (Rev. 1)
                                </div>

                                <div className="space-x-2">
                                    <button
                                        onClick={handleSave}
                                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                                    >
                                        <i className="fas fa-save"></i> Save
                                    </button>
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-700"
                                    >
                                        <i className="fas fa-times"></i> Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* VIEW MODAL */}
            {viewModal && selectedReport && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                    <div className="bg-white w-[95%] max-w-7xl rounded-lg shadow-lg overflow-hidden border-4 border-pink-500">
                        {/* HEADER */}
                        <div className="flex justify-end items-center px-6 py-4">
                            <button
                                onClick={() => setViewModal(false)}
                                className="text-red-600 hover:text-red-800 hover:font-semibold text-xl"
                            >
                                ✕
                            </button>
                        </div>

                        {/* BODY */}
                        <div className="p-6 overflow-y-auto max-h-[75vh]">
                            <div className="flex justify-end mb-4">
                                {selectedReport.verified_by && (
                                    <>
                                        <a
                                            href={route(
                                                "cctv.viewPdf",
                                                selectedReport.id,
                                            )}
                                            target="_blank"
                                            className="px-3 py-2 bg-gray-100 text-red-600 rounded shadow hover:bg-red-700 hover:text-white border-2 border-red-600 hover:border-gray-500 flex items-center text-bold"
                                        >
                                            <i className="fa-solid fa-file-pdf"></i>
                                            View as PDF
                                        </a>
                                    </>
                                )}
                            </div>
                            {/* Title */}
                            <div className="text-center mb-4">
                                <h1 className="text-3xl font-bold text-orange-700">
                                    CCTV
                                </h1>
                                <h2 className="text-lg font-semibold text-stone-600">
                                    Preventative Maintenance Checklist
                                </h2>
                            </div>

                            {/* HEADER INFO */}
                            <div className="grid grid-cols-3 gap-4 text-sm mb-6">
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-stone-600">
                                        Camera Name
                                    </label>
                                    <input
                                        className="border border-gray-500 w-full rounded-md bg-gray-100 text-stone-700"
                                        placeholder="Control No"
                                        value={selectedReport.camera_name}
                                        readOnly
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1 text-stone-600">
                                        Location No:
                                    </label>
                                    <input
                                        className="border border-gray-500 w-full rounded-md bg-gray-100 text-stone-700"
                                        placeholder="Location"
                                        value={selectedReport.location}
                                        readOnly
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1 text-stone-600">
                                        IP Address:
                                    </label>
                                    <input
                                        className="border border-gray-500 w-full rounded-md bg-gray-100 text-stone-700"
                                        placeholder="IP Address..."
                                        value={selectedReport.ip_address}
                                        readOnly
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1 text-stone-600">
                                        Date Performed:
                                    </label>
                                    <input
                                        className="border border-gray-500 w-full rounded-md bg-gray-100 text-stone-700"
                                        placeholder="Date Performed..."
                                        value={
                                            selectedReport.date_performed
                                                ? new Date(
                                                      selectedReport.date_performed,
                                                  ).toLocaleDateString("en-US")
                                                : ""
                                        }
                                        readOnly
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1 text-stone-600">
                                        Due Date:
                                    </label>
                                    <input
                                        type="date"
                                        className="border border-gray-500 w-full rounded-md bg-gray-100 text-stone-700"
                                        value={selectedReport.due_date}
                                        readOnly
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1 text-stone-600">
                                        Performed By:
                                    </label>
                                    <input
                                        className="border border-gray-500 w-full rounded-md bg-gray-100 text-stone-700"
                                        value={selectedReport.performed_by}
                                        readOnly
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <label className="block text-sm font-medium mb-1 text-stone-600">
                                        Verified By
                                    </label>
                                    <div className="flex items-center gap-2">
                                        {!selectedReport.verified_by &&
                                        ["16"].includes(emp_data.emp_id) ? (
                                            <>
                                                <input
                                                    type="text"
                                                    className="w-full border rounded p-2 text-sm bg-gray-100 cursor-not-allowed text-1xl"
                                                    value={
                                                        emp_data.emp_name || "-"
                                                    }
                                                    readOnly
                                                />
                                                <button
                                                    className="px-3 py-2 bg-green-500 text-white rounded shadow hover:bg-green-600 border-2 border-green-700 flex items-center"
                                                    onClick={() =>
                                                        handleVerify(
                                                            selectedReport.id,
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
                                                className="border border-gray-500 w-full rounded-md bg-gray-100 text-stone-700"
                                                value={
                                                    selectedReport.verified_by ||
                                                    "Pending..."
                                                }
                                                readOnly
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* TABLE */}
                            <table className="w-full border border-gray-300 text-sm text-stone-600">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="border p-2 w-12">#</th>
                                        <th className="border p-2">
                                            Checklist Item
                                        </th>
                                        <th className="border p-2 w-1/4">
                                            Remarks
                                        </th>
                                        <th className="border p-2 w-1/4">
                                            Recommendation
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {JSON.parse(selectedReport.check_items).map(
                                        (item, index) => (
                                            <tr key={index}>
                                                <td className="border p-2 text-center">
                                                    {index + 1}
                                                </td>
                                                <td className="border p-2">
                                                    {item.item}
                                                </td>
                                                <td className="border p-2">
                                                    <textarea
                                                        className="w-full textarea textarea-bordered textarea-sm bg-white"
                                                        value={item.remark}
                                                        readOnly
                                                    />
                                                </td>
                                                <td className="border p-2">
                                                    <textarea
                                                        className="w-full textarea textarea-bordered textarea-sm bg-white"
                                                        value={
                                                            item.recommendation
                                                        }
                                                        readOnly
                                                    />
                                                </td>
                                            </tr>
                                        ),
                                    )}
                                </tbody>
                            </table>

                            {/* FOOTER */}
                            <div className="flex justify-end items-center mt-6">
                                <button
                                    onClick={() => setViewModal(false)}
                                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-700"
                                >
                                    <i className="fas fa-times"></i> Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {editModal && selectedReport && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                    <div className="bg-white w-[95%] max-w-7xl rounded-lg shadow-lg border-4 border-yellow-500">
                        {/* HEADER */}
                        <div className="flex justify-between items-center px-6 py-4">
                            <h2 className="text-xl font-bold text-yellow-600">
                                ✏️ Edit CCTV Checklist
                            </h2>
                            <button
                                onClick={() => setEditModal(false)}
                                className="text-red-600 text-xl"
                            >
                                ✕
                            </button>
                        </div>

                        {/* BODY */}
                        <div className="p-6 overflow-y-auto max-h-[75vh]">
                            {/* HEADER INFO */}
                            <div className="grid grid-cols-3 gap-4 text-sm mb-6">
                                {/* CAMERA (READONLY SA EDIT) */}
                                <div>
                                    <label className="block mb-1">
                                        Camera Name
                                    </label>
                                    <input
                                        className="border w-full rounded bg-gray-100"
                                        value={selectedCamera}
                                        readOnly
                                    />
                                </div>

                                <div>
                                    <label>Location</label>
                                    <input
                                        className="border w-full bg-gray-100"
                                        value={location}
                                        readOnly
                                    />
                                </div>

                                <div>
                                    <label>IP Address</label>
                                    <input
                                        className="border w-full bg-gray-100"
                                        value={ipAddress}
                                        readOnly
                                    />
                                </div>

                                <div>
                                    <label>Date Performed</label>
                                    <input
                                        type="date"
                                        className="border w-full"
                                        value={datePerformed}
                                    />
                                </div>

                                <div>
                                    <label>Due Date</label>
                                    <input
                                        type="date"
                                        className="border w-full"
                                        value={dueDate}
                                    />
                                </div>

                                <div>
                                    <label>Performed By</label>
                                    <input
                                        className="border w-full bg-gray-100"
                                        value={performedBy}
                                        readOnly
                                    />
                                </div>
                            </div>

                            {/* TABLE */}
                            <table className="w-full border text-sm">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th>#</th>
                                        <th>Item</th>
                                        <th>Remarks</th>
                                        <th>Recommendation</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {checklistItems.map((item, i) => (
                                        <tr key={i}>
                                            <td>{i + 1}</td>
                                            <td>{item}</td>
                                            <td>
                                                <textarea
                                                    className="w-full border"
                                                    value={remarks[i]}
                                                    onChange={(e) => {
                                                        const arr = [
                                                            ...remarks,
                                                        ];
                                                        arr[i] = e.target.value;
                                                        setRemarks(arr);
                                                    }}
                                                />
                                            </td>
                                            <td>
                                                <textarea
                                                    className="w-full border"
                                                    value={recommendations[i]}
                                                    onChange={(e) => {
                                                        const arr = [
                                                            ...recommendations,
                                                        ];
                                                        arr[i] = e.target.value;
                                                        setRecommendations(arr);
                                                    }}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* FOOTER */}
                            <div className="flex justify-end gap-2 mt-4">
                                <button
                                    onClick={() => setEditModal(false)}
                                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                                >
                                    <i className="fas fa-times"></i> Cancel
                                </button>

                                <button
                                    onClick={handleUpdate}
                                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                                >
                                    <i className="fas fa-save"></i> Save
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}

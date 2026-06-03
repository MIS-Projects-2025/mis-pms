import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, usePage, router } from "@inertiajs/react";
import DataTable from "@/Components/DataTable";
import { useState } from "react";

export default function LadderChecklistItem({ tableData, tableFilters, emp_data }) {
   
    const [openDrawer, setOpenDrawer] = useState(false);
    const [viewModal, setViewModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [selectedId, setSelectedId] = useState(null);

const [form, setForm] = useState({
    ladder_type: "",
    checklist_items: [{ name: "" }],
    checklist_criteria: [{ name: "" }]
});

const openEditModal = (item, mode = "view") => {
    setForm({
        ladder_type: item.ladder_type,
        checklist_items: JSON.parse(item.checklist_items || "[]"),
        checklist_criteria: JSON.parse(item.checklist_criteria || "[]"),
    });

    setSelectedId(item.id);
    setIsEdit(mode === "edit");
    setViewModal(true);
};

const handleDelete = (id) => {
    if (!confirm("Are you sure you want to delete this checklist?")) return;

    router.delete(route("ladder_checklist_items.destroy", id), {
        onSuccess: () => {
            window.location.reload();
        },
        onError: (err) => {
            console.error(err);
            alert("❌ Failed to delete.");
        }
    });
};

const dataWithAction = tableData.data.map((item) => ({
    ...item,
    actions: (
        <div className="flex space-x-1">

            {/* VIEW */}
            {/* <button
                onClick={() => openEditModal(item, "view")}
                className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
                <i className="fa fa-eye"></i>
            </button> */}

            {/* EDIT */}
            <button
                onClick={() => openEditModal(item, "edit")}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
                <i className="fa fa-pen"></i>
            </button>

            {/* DELETE / TRASH */}
            <button
                onClick={() => handleDelete(item.id)}
                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
            >
                <i className="fa fa-trash"></i>
            </button>

        </div>
    ),
}));

    return (
        <AuthenticatedLayout>
            <Head title="Manage User List" />

            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold animate-pulse">
                    <i className="fa-solid fa-list-check mr-2"></i> Ladder Checklist Items
                </h1>
                    <button
                        onClick={() => setOpenDrawer(true)}
                         className="text-white bg-green-500 border-green-900 btn hover:bg-green-700"
                       
                    >
                        <i className="fa-solid fa-plus"></i> New Ladder Type
                    </button>
            </div>

            <DataTable
                columns={[
                    { key: "ladder_type", label: "Ladder Type" },
                    { key: "created_by", label: "Created By" },
                    { key: "actions", label: "Actions" },
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
                routeName={route("ladder_checklist_items.index")}
                filters={tableFilters}
                rowKey="id"
                showExport={false}
            />

{/* ===== CREATE DRAWER ===== */}
{openDrawer && (
    <div className="fixed inset-0 z-50 flex">

        {/* Overlay */}
        <div
            className="fixed inset-0 bg-black opacity-50"
            onClick={() => setOpenDrawer(false)}
        />

        {/* Drawer */}
        <div className="ml-auto w-[650px] h-full bg-white shadow-lg p-5 overflow-y-auto z-50">

            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-green-700 flex items-center gap-2">
                    <i className="fa-solid fa-list-check"></i>
                    New Ladder Type Checklist Items
                </h2>

                <button onClick={() => setOpenDrawer(false)}>
                    <i className="fa-solid fa-xmark text-red-500"></i>
                </button>
            </div>

            {/* LADDER TYPE */}
            <div className="mb-4 text-stone-600">
                <label className="font-semibold">Ladder Type</label>

                <input
                    className="w-full border p-2 rounded"
                    value={form.ladder_type}
                    onChange={(e) =>
                        setForm(prev => ({
                            ...prev,
                            ladder_type: e.target.value
                        }))
                    }
                />
            </div>

            {/* TABLE */}
            <table className="w-full border text-sm">
                <thead>
                    <tr className="bg-gray-100 text-stone-600">
                        <th className="border p-2">Checklist Item</th>
                        <th className="border p-2">Checklist Criteria</th>
                        <th className="border p-2">Action</th>
                    </tr>
                </thead>

                <tbody>
                    {form.checklist_items.map((item, index) => (
                        <tr key={index} className="text-stone-500">

                            <td className="border p-2">
                                <input
                                    className="w-full border p-1 rounded"
                                    value={item.name}
                                    onChange={(e) => {
                                        const updated = [...form.checklist_items];
                                        updated[index].name = e.target.value;

                                        setForm(prev => ({
                                            ...prev,
                                            checklist_items: updated
                                        }));
                                    }}
                                />
                            </td>

                            <td className="border p-2">
                                <input
                                    className="w-full border p-1 rounded"
                                    value={form.checklist_criteria[index]?.name || ""}
                                    onChange={(e) => {
                                        const updated = [...form.checklist_criteria];
                                        updated[index] = {
                                            name: e.target.value
                                        };

                                        setForm(prev => ({
                                            ...prev,
                                            checklist_criteria: updated
                                        }));
                                    }}
                                />
                            </td>

                            <td className="border p-2 text-center">
                                <button
                                    onClick={() => {
                                        const items = form.checklist_items.filter((_, i) => i !== index);
                                        const criteria = form.checklist_criteria.filter((_, i) => i !== index);

                                        setForm(prev => ({
                                            ...prev,
                                            checklist_items: items,
                                            checklist_criteria: criteria
                                        }));
                                    }}
                                    className="text-red-600"
                                >
                                    <i className="fa fa-trash"></i>
                                </button>
                            </td>

                        </tr>
                    ))}
                </tbody>
            </table>

            {/* ADD ROW */}
            <button
                className="mt-3 bg-blue-500 text-white px-3 py-2 rounded"
                onClick={() =>
                    setForm(prev => ({
                        ...prev,
                        checklist_items: [...prev.checklist_items, { name: "" }],
                        checklist_criteria: [...prev.checklist_criteria, { name: "" }]
                    }))
                }
            >
                + Add Row
            </button>

            {/* SAVE */}
            <button
                onClick={() => {
                    router.post(route("ladder_checklist_items.store"), form, {
                         onSuccess: () => {
        setOpenDrawer(false);
        window.location.reload();
    }
                        
                        
                    });
                }}
                className="w-full mt-4 bg-green-600 text-white py-2 rounded"
            >
                <i className="fa fa-save"></i> Save
            </button>

        </div>
    </div>
)}

{/* ================= VIEW / EDIT MODAL ================= */}
{viewModal && (
    <div className="fixed inset-0 flex z-50">

        <div
            className="fixed inset-0 bg-black opacity-50"
            onClick={() => setViewModal(false)}
        />

        <div className="relative m-auto w-[900px] bg-white p-5 rounded shadow z-50">

            {/* HEADER */}
            <div className="flex justify-between mb-4">
                <h2 className={`text-xl font-bold flex items-center gap-2 ${
                    isEdit ? "text-blue-600" : "text-gray-700"
                }`}>
                    {isEdit ? (
                        <>
                            <i className="fa fa-pen-to-square"></i>
                            Edit Ladder Checklist
                        </>
                    ) : (
                        <>
                            <i className="fa fa-eye"></i>
                            View Ladder Checklist
                        </>
                    )}
                </h2>

                <button onClick={() => setViewModal(false)}>
                    <i className="fa fa-xmark text-red-500"></i>
                </button>
            </div>

            {/* LADDER TYPE */}
            <input
                disabled={!isEdit}
                className="w-full border p-2 rounded mb-4"
                value={form.ladder_type}
                onChange={(e) =>
                    setForm(prev => ({
                        ...prev,
                        ladder_type: e.target.value
                    }))
                }
            />

            {/* TABLE */}
            <table className="w-full border text-sm">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="border p-2">Checklist Item</th>
                        <th className="border p-2">Checklist Criteria</th>
                        {isEdit && <th className="border p-2">Action</th>}
                    </tr>
                </thead>

                <tbody>
                    {form.checklist_items.map((item, index) => (
                        <tr key={index}>

                            <td className="border p-2">
                                {isEdit ? (
                                    <input
                                        className="w-full border p-1 rounded"
                                        value={item.name}
                                        onChange={(e) => {
                                            const updated = [...form.checklist_items];
                                            updated[index].name = e.target.value;

                                            setForm(prev => ({
                                                ...prev,
                                                checklist_items: updated
                                            }));
                                        }}
                                    />
                                ) : item.name}
                            </td>

                            <td className="border p-2">
                                {isEdit ? (
                                    <input
                                        className="w-full border p-1 rounded"
                                        value={form.checklist_criteria[index]?.name || ""}
                                        onChange={(e) => {
                                            const updated = [...form.checklist_criteria];
                                            updated[index] = { name: e.target.value };

                                            setForm(prev => ({
                                                ...prev,
                                                checklist_criteria: updated
                                            }));
                                        }}
                                    />
                                ) : form.checklist_criteria[index]?.name}
                            </td>

                            {isEdit && (
                                <td className="border p-2 text-center">
                                    <button
                                        onClick={() => {
                                            const items = form.checklist_items.filter((_, i) => i !== index);
                                            const criteria = form.checklist_criteria.filter((_, i) => i !== index);

                                            setForm(prev => ({
                                                ...prev,
                                                checklist_items: items,
                                                checklist_criteria: criteria
                                            }));
                                        }}
                                        className="text-red-600"
                                    >
                                        <i className="fa fa-trash"></i>
                                    </button>
                                </td>
                            )}

                        </tr>
                    ))}
                </tbody>
            </table>

            {/* ADD ROW */}
            {isEdit && (
                <button
                    className="mt-3 bg-emerald-500 text-white px-3 py-2 rounded"
                    onClick={() =>
                        setForm(prev => ({
                            ...prev,
                            checklist_items: [...prev.checklist_items, { name: "" }],
                            checklist_criteria: [...prev.checklist_criteria, { name: "" }]
                        }))
                    }
                >
                    + Add Row
                </button>
            )}

            {/* FOOTER */}
            <div className="flex justify-end gap-2 mt-5">

                <button
                    onClick={() => setViewModal(false)}
                    className="bg-red-500 text-white hover:bg-red-600 px-4 py-2 rounded"
                >
                   <i className="fa fa-close"></i> Close
                </button>

                {isEdit && (
                    <button
                        onClick={() => {
                            router.put(
                                route("ladder_checklist_items.update", selectedId),
                                form,
                                {
    onSuccess: () => {
        setViewModal(false);
        window.location.reload();
    }
}
                            );
                        }}
                        className="bg-green-600 text-white hover:bg-green-700 px-4 py-2 rounded"
                    >
                        <i className="fa fa-save"></i> Save
                    </button>
                )}

            </div>

        </div>
    </div>
)}

        </AuthenticatedLayout>
    );
}

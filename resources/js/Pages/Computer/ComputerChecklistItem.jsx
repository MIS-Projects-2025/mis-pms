import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, usePage, router } from "@inertiajs/react";
import DataTable from "@/Components/DataTable";
import Modal from "@/Components/Modal";
import { useState } from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ComputerChecklistItem({ tableData, tableFilters, emp_data }) {



    const [isModalOpen, setIsModalOpen] = useState(false);
    // VIEW MODAL
const [isViewModalOpen, setIsViewModalOpen] = useState(false);
const [viewItem, setViewItem] = useState(null);

// EDIT MODAL
const [isEditModalOpen, setIsEditModalOpen] = useState(false);
const [editForm, setEditForm] = useState({
    id: "",
    task: "",
    description: "",
});

const openViewModal = (item) => {
    setViewItem(item);
    setIsViewModalOpen(true);
};

const openEditModal = (item) => {
    setEditForm({
        id: item.id,
        task: item.task,
        description: item.description,
    });
    setIsEditModalOpen(true);
};


const updateItem = () => {
    router.put(
        route("computer-checklist-items.update", editForm.id),
        editForm,
        {
            onSuccess: () => {
                alert("✅ Item updated successfully!");
                setIsEditModalOpen(false);
                window.location.reload();
            },
        }
    );
};



    const [form, setForm] = useState({
    task: "",
    description: "",
});

const [draftItems, setDraftItems] = useState([]);

const addToList = (e) => {
    e.preventDefault();

    setDraftItems([
        ...draftItems,
        { task: form.task, description: form.description }
    ]);

    // clear form
    setForm({ task: "", description: "" });
};

const removeItem = (index) => {
    setDraftItems(draftItems.filter((_, i) => i !== index));
};


const submitAll = () => {
    if (draftItems.length === 0) {
        alert("No items to submit!");
        return;
    }

    router.post(route("computer-checklist-items.bulk-store"),
        { items: draftItems },
        {
            onSuccess: () => {
                setDraftItems([]);
                setIsModalOpen(false);
                alert("✅ Items added successfully.");
                window.location.reload();
            }
        }
    );
};

    const handleDelete = (id) => {
  if (confirm("Are you sure you want to delete this machine?")) {
    router.delete(route("computer-checklist-items.destroy", id), {
      preserveScroll: true,
      onSuccess: () => {
        alert("✅ Checklist item removed successfully.");
        window.location.reload();
      },
    });
  }
};

    const dataWithAction = tableData.data.map((item) => ({
        ...item,
        actions: (
            <div className="flex space-x-1">

                        {/* <button
                            onClick={() => openViewModal(item)}
                            className="block text-center px-3 py-1 text-md hover:bg-blue-600 bg-gray-500 text-white rounded border-2 border-gray-900"
                        >
                            <i className="fa fa-eye"></i>
                        </button> */}
                        <Button
                            onClick={() => openEditModal(item)}
                            className="block text-center px-3 py-1 text-md hover:bg-blue-600 bg-gray-500 text-white rounded border-2 border-gray-900"
                        >
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                            onClick={() => handleDelete(item.id)}
                            className="block text-center px-3 py-1 text-md hover:bg-red-600 bg-gray-500 text-white rounded border-2 border-gray-900"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
            </div>
        ),
    }));


    return (
        <AuthenticatedLayout>
            <Head title="Manage Computer Checklist Items" />

            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold animate-bounce">
                    <i className="fa-solid fa-chart-diagram"></i> Computer Checklist Items
                </h1>

                {/* OPEN MODAL BUTTON */}
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="text-white bg-green-500 border-green-900 btn hover:bg-green-700"
                >
                    <i className="fa-solid fa-plus"></i> New Item
                </button>
            </div>

            {/* TABLE */}
            <DataTable
                columns={[
                    { key: "task", label: "Task" },
                    { key: "description", label: "Description" },
                    { key: "created_by", label: "Created By" },
                    { key: "updated_by", label: "Updated By" },
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
                routeName={route("computer-checklist-items")}
                filters={tableFilters}
                rowKey="task"
                showExport={false}
            />

            {/* NEW ITEM MODAL */}
            <Modal show={isModalOpen} onClose={() => setIsModalOpen(false)}>
    <div className="p-6">
        <h2 className="text-xl font-bold mb-4">
            <i className="fa-solid fa-plus mr-2 text-green-600 font-bold"></i>
            New Checklist Items
        </h2>

        {/* INPUT FORM */}
        <form onSubmit={addToList}>
            <div className="mb-3">
                <label className="font-semibold">Task</label>
                <input
                    type="text"
                    className="w-full border rounded p-2 text-gray-700"
                    value={form.task}
                    onChange={(e) => setForm({ ...form, task: e.target.value })}
                    required
                />
            </div>

            <div className="mb-3">
                <label className="font-semibold">Description</label>
                <textarea
                    className="w-full border rounded p-2 text-gray-700"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    required
                ></textarea>
            </div>

            <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 w-full mb-4"
            >
                <i className="fa-solid fa-cart-plus mr-1"></i>
                Add to List
            </button>
        </form>

        {/* LIST PREVIEW */}
        {/* LIST PREVIEW */}
{draftItems.length > 0 && (
    <div className="mb-4">
        <h3 className="font-semibold mb-2">Items to be Added:</h3>
        <table className="w-full border text-sm">
            <thead className="bg-gray-100">
                <tr>
                    <th className="border p-2 text-gray-700">Task</th>
                    <th className="border p-2 text-gray-700">Description</th>
                    <th className="border p-2 text-center text-gray-700 w-20">Action</th>
                </tr>
            </thead>
            <tbody>
                {draftItems.map((item, index) => (
                    <tr key={index}>
                        <td className="border p-2">{item.task}</td>
                        <td className="border p-2">{item.description}</td>
                        <td className="border p-2 text-center">
                            <button
                                onClick={() => removeItem(index)}
                                className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-700 text-xs"
                            >
                                <i className="fa-solid fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
)}


        {/* ACTION BUTTONS */}
        <div className="flex justify-between mt-4">
            <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-700"
            >
                <i className="fa-solid fa-xmark mr-1"></i>
                Close
            </button>

            <button
                type="button"
                onClick={submitAll}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-700"
            >
                <i className="fa-solid fa-paper-plane mr-1"></i>
                {/* Submit All ({draftItems.length}) */}
                Submit
            </button>
        </div>
    </div>
</Modal>

            {/* VIEW ITEM MODAL */}
<Modal show={isViewModalOpen} onClose={() => setIsViewModalOpen(false)}>
    <div className="p-6 bg-gradient-to-bl from-white to-black rounded-xl shadow-lg border border-gray-200 animate-fadeIn">

        {/* HEADER */}
        <div className="flex items-center mb-4 pb-3 border-b border-gray-200">
            <div className="p-2 bg-blue-100 rounded-full mr-3">
                <i className="fa-solid fa-eye text-blue-600 text-xl"></i>
            </div>
            <h2 className="text-xl font-bold text-gray-100">
                View Checklist Item
            </h2>
        </div>

        {/* BODY CONTENT */}
        {viewItem && (
            <div className="space-y-4 text-gray-700">

                <div>
                    <p className="text-sm text-white">Task</p>
                    <p className="font-semibold bg-gray-100 p-2 rounded-md border border-gray-200">
                        {viewItem.task}
                    </p>
                </div>
                <div>
    <p className="text-sm text-white">Description</p>

    <textarea
    className="w-full bg-gray-100 p-2 rounded-md border border-gray-200 text-gray-700"
    value={viewItem.description}
    readOnly
    rows={viewItem.description.split("\n").length + 5}
></textarea>

</div>


                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-white">Created By</p>
                        <p className="bg-gray-100 p-2 rounded-md border border-gray-200 font-medium">
                            {viewItem.created_by}
                        </p>
                    </div>

                    <div>
                        <p className="text-sm text-white">Date Created</p>
                        <p className="bg-gray-100 p-2 rounded-md border border-gray-200">
                            {viewItem.date_created ? new Date(viewItem.date_created).toLocaleString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
}) : ""}

                        </p>
                    </div>
                </div>

            </div>
        )}

        {/* FOOTER BUTTON */}
        <div className="flex justify-end mt-6">
            <button
                type="button"
                onClick={() => setIsViewModalOpen(false)}
                className="px-5 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 shadow-md active:scale-95 transition-all"
            >
                <i className="fa-solid fa-xmark mr-1"></i>
                Close
            </button>
        </div>
    </div>
</Modal>


            {/* EDIT ITEM MODAL */}
            <Modal show={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
   <div className="p-6 bg-gradient-to-bl from-white to-black rounded-xl shadow-lg border border-gray-200 animate-fadeIn">

    <div className="flex items-center mb-4 pb-3 border-b border-gray-200">
        <div className="p-2 bg-amber-100 rounded-full mr-3">
            <i className="fa-solid fa-edit text-amber-600 text-xl"></i>
        </div>
        <h2 className="text-xl font-bold text-gray-100">
            Edit Checklist Item
        </h2>
    </div>
        <div className="mb-3">
            <label className="font-semibold text-white">Task</label>
            <input
                type="text"
                className="w-full border rounded p-2 text-gray-700"
                value={editForm.task}
                onChange={(e) =>
                    setEditForm({ ...editForm, task: e.target.value })
                }
                required
            />
        </div>

        <div className="mb-3">
            <label className="font-semibold text-white">Description</label>
            <textarea
                className="w-full border rounded p-2 text-gray-700"
                value={editForm.description}
                onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                }
                rows={editForm.description.split("\n").length + 6}
                required
            ></textarea>
        </div>

        <div className="flex justify-between mt-4">
            <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-700"
            >
                <i className="fa-solid fa-xmark mr-1"></i>
                Cancel
            </button>

            <button
                type="button"
                onClick={updateItem}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
            >
                <i className="fa-solid fa-floppy-disk mr-1"></i>
                Update
            </button>
        </div>
    </div>
</Modal>



        </AuthenticatedLayout>
    );
}

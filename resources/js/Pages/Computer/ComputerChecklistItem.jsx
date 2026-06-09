import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import DataTable from "@/Components/DataTable";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/Components/ui/dialog";

import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Textarea } from "@/Components/ui/textarea";
import { Label } from "@/Components/ui/label";

import {
    Eye,
    Pencil,
    Trash2,
    Plus,
    Send,
    X,
    FileText,
    Edit3,
    Save,
} from "lucide-react";

import { useState } from "react";

export default function ComputerChecklistItem({
    tableData,
    tableFilters,
    emp_data,
}) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    // VIEW
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [viewItem, setViewItem] = useState(null);

    // EDIT
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editForm, setEditForm] = useState({
        id: "",
        task: "",
        description: "",
    });

    const [form, setForm] = useState({
        task: "",
        description: "",
    });

    const [draftItems, setDraftItems] = useState([]);

    // VIEW
    const openView = (item) => {
        setViewItem(item);
        setIsViewOpen(true);
    };

    // EDIT
    const openEdit = (item) => {
        setEditForm({
            id: item.id,
            task: item.task,
            description: item.description,
        });
        setIsEditOpen(true);
    };

    const updateItem = () => {
        router.put(
            route("computer-checklist-items.update", editForm.id),
            editForm,
            {
                onSuccess: () => {
                    setIsEditOpen(false);
                },
            },
        );
    };

    const addToList = (e) => {
        e.preventDefault();

        setDraftItems([
            ...draftItems,
            { task: form.task, description: form.description },
        ]);

        setForm({ task: "", description: "" });
    };

    const removeItem = (index) => {
        setDraftItems(draftItems.filter((_, i) => i !== index));
    };

    const submitAll = () => {
        if (!draftItems.length) return;

        router.post(
            route("computer-checklist-items.bulk-store"),
            { items: draftItems },
            {
                onSuccess: () => {
                    setDraftItems([]);
                    setIsModalOpen(false);
                },
            },
        );
    };

    const handleDelete = (id) => {
        if (!confirm("Delete this item?")) return;

        router.delete(route("computer-checklist-items.destroy", id));
    };

    const dataWithAction = tableData.data.map((item) => ({
        ...item,
        actions: (
            <div className="flex gap-1">
                <Button
                    size="icon"
                    className="bg-amber-400 hover:bg-amber-600 "
                    onClick={() => openEdit(item)}
                >
                    <Pencil className="h-4 w-4" />
                </Button>

                <Button
                    size="icon"
                    className="bg-red-500 hover:bg-red-600 "
                    onClick={() => handleDelete(item.id)}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        ),
    }));

    return (
        <AuthenticatedLayout>
            <Head title="Computer Checklist Items" />

            {/* HEADER */}
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Computer Checklist Items
                </h1>

                <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => setIsModalOpen(true)}
                >
                    <Plus className="h-4 w-4" />
                    New Item
                </Button>
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

            {/* ================= CREATE DIALOG ================= */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Plus className="h-5 w-5" />
                            New Checklist Item
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={addToList} className="space-y-4">
                        <div className="space-y-1">
                            <Label>Task</Label>
                            <Input
                                value={form.task}
                                onChange={(e) =>
                                    setForm({ ...form, task: e.target.value })
                                }
                                placeholder="Enter task"
                            />
                        </div>

                        <div className="space-y-1">
                            <Label>Description</Label>
                            <Textarea
                                value={form.description}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        description: e.target.value,
                                    })
                                }
                                placeholder="Enter description"
                            />
                        </div>

                        <Button type="submit" className="w-full">
                            Add to List
                        </Button>
                    </form>

                    {/* PREVIEW */}
                    {draftItems.length > 0 && (
                        <div className="mt-4 border rounded-md p-3 space-y-2">
                            {draftItems.map((item, i) => (
                                <div
                                    key={i}
                                    className="flex items-center justify-between"
                                >
                                    <span className="text-sm">{item.task}</span>

                                    <Button
                                        size="icon"
                                        variant="destructive"
                                        onClick={() => removeItem(i)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ACTIONS */}
                    <div className="flex justify-between pt-4">
                        <Button
                            variant="outline"
                            onClick={() => setIsModalOpen(false)}
                        >
                            <X className="h-4 w-4 mr-2" />
                            Close
                        </Button>

                        <Button onClick={submitAll}>
                            <Send className="h-4 w-4 mr-2" />
                            Submit
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ================= VIEW DIALOG ================= */}
            <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>View Item</DialogTitle>
                    </DialogHeader>

                    {viewItem && (
                        <div className="space-y-2 text-sm">
                            <p>
                                <b>Task:</b> {viewItem.task}
                            </p>
                            <p>
                                <b>Description:</b> {viewItem.description}
                            </p>
                            <p>
                                <b>Created By:</b> {viewItem.created_by}
                            </p>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* ================= EDIT DIALOG ================= */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Edit3 className="h-5 w-5" />
                            Edit Item
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-1">
                            <Label>Task</Label>
                            <Input
                                value={editForm.task}
                                onChange={(e) =>
                                    setEditForm({
                                        ...editForm,
                                        task: e.target.value,
                                    })
                                }
                            />
                        </div>

                        <div className="space-y-1">
                            <Label>Description</Label>
                            <Textarea
                                value={editForm.description}
                                onChange={(e) =>
                                    setEditForm({
                                        ...editForm,
                                        description: e.target.value,
                                    })
                                }
                            />
                        </div>

                        <Button onClick={updateItem} className="w-full">
                            <Save className="h-4 w-4" /> Save Changes
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </AuthenticatedLayout>
    );
}

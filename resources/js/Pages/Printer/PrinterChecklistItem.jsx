import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import DataTable from "@/Components/DataTable";
import { useState } from "react";

// SHADCN
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/Components/ui/dialog";

import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Textarea } from "@/Components/ui/textarea";

// LUCIDE ICONS
import { Eye, Pencil, Trash2, Plus, Send, X, FileText, Save } from "lucide-react";

export default function PrinterChecklistItem({
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
        item: "",
    });

    const [form, setForm] = useState({ item: "" });
    const [draftItems, setDraftItems] = useState([]);

    const openViewModal = (item) => {
        setViewItem(item);
        setIsViewOpen(true);
    };

    const openEditModal = (item) => {
        setEditForm({
            id: item.id,
            item: item.item,
        });
        setIsEditOpen(true);
    };

    const updateItem = () => {
        router.put(
            route("printer-checklist-items.update", editForm.id),
            editForm,
            {
                onSuccess: () => setIsEditOpen(false),
            },
        );
    };

    const addToList = (e) => {
        e.preventDefault();
        setDraftItems([...draftItems, { item: form.item }]);
        setForm({ item: "" });
    };

    const removeItem = (index) => {
        setDraftItems(draftItems.filter((_, i) => i !== index));
    };

    const submitAll = () => {
        if (!draftItems.length) return;

        router.post(
            route("printer-checklist-items.bulk-store"),
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

        router.delete(route("printer-checklist-items.destroy", id));
    };

    const dataWithAction = tableData.data.map((item) => ({
        ...item,
        actions: (
            <div className="flex gap-2">
                <Button
                    size="icon"
                    className="bg-amber-500 hover:bg-amber-600"
                    onClick={() => openEditModal(item)}
                >
                    <Pencil className="h-4 w-4" />
                </Button>

                <Button
                    size="icon"
                    className="bg-red-500 hover:bg-red-600"
                    onClick={() => handleDelete(item.id)}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        ),
    }));

    return (
        <AuthenticatedLayout>
            <Head title="Printer Checklist Items" />

            {/* HEADER */}
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Printer Checklist Items
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
                    { key: "item", label: "Item" },
                    { key: "created_by", label: "Created By" },
                    { key: "updated_by", label: "Updated By" },
                    { key: "actions", label: "Action" },
                ]}
                data={dataWithAction}
                meta={tableData}
                routeName={route("printer-checklist-items")}
                filters={tableFilters}
                rowKey="item"
                showExport={false}
            />

            {/* ================= ADD MODAL ================= */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Plus className="h-5 w-5" />
                            New Printer Checklist Item
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={addToList} className="space-y-3">
                        <Textarea
                            placeholder="Item"
                            value={form.item}
                            onChange={(e) => setForm({ item: e.target.value })}
                        />

                        <Button type="submit" className="w-full">
                            Add to List
                        </Button>
                    </form>

                    {draftItems.length > 0 && (
                        <div className="border rounded p-2 space-y-2">
                            {draftItems.map((item, i) => (
                                <div
                                    key={i}
                                    className="flex justify-between items-center"
                                >
                                    <span className="text-sm">{item.item}</span>

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

                    <div className="flex justify-between">
                        <Button
                            variant="destructive"
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

            {/* ================= VIEW MODAL ================= */}
            <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>View Item</DialogTitle>
                    </DialogHeader>

                    {viewItem && (
                        <div className="space-y-2">
                            <p>
                                <b>Item:</b> {viewItem.item}
                            </p>
                            <p>
                                <b>Created By:</b> {viewItem.created_by}
                            </p>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* ================= EDIT MODAL ================= */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Pencil className="h-5 w-5" />
                            Edit Item
                        </DialogTitle>
                    </DialogHeader>

                    <Textarea
                        value={editForm.item}
                        onChange={(e) =>
                            setEditForm({
                                ...editForm,
                                item: e.target.value,
                            })
                        }
                    />

                    <Button className="w-full mt-3" onClick={updateItem}>
                       <Save className="h-4 w-4" /> Save Changes
                    </Button>
                </DialogContent>
            </Dialog>
        </AuthenticatedLayout>
    );
}

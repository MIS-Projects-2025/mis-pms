import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import DataTable from "@/Components/DataTable";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/Components/ui/dialog";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";

import { Button } from "@/Components/ui/button";

import {
    List,
    UserPlus,
    User,
    IdCard,
    Briefcase,
    Shield,
    Trash2,
    RefreshCw,
} from "lucide-react";

import { useState } from "react";

export default function Admin({ tableData, tableFilters, emp_data }) {
    const [role, setRole] = useState(null);
    const [open, setOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    function removeAdmin(id) {
        router.post(route("removeAdmin"), { id }, { preserveScroll: true });
    }

    function changeRole(id) {
        if (!role) return;

        router.patch(
            route("changeAdminRole"),
            { id, role },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setOpen(false);
                    setSelectedUser(null);
                    setRole(null);
                },
            },
        );
    }

    const openModal = (row) => {
        setSelectedUser(row);
        setRole(row.emp_role);
        setOpen(true);
    };

    return (
        <AuthenticatedLayout>
            <Head title="Manage User List" />

            {/* HEADER */}
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <List className="h-5 w-5" />
                    User List
                </h1>

                {["superadmin", "admin", "toolcrib"].includes(
                    emp_data?.emp_system_role,
                ) && (
                    <Button
                        className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                        onClick={() => router.get(route("index_addAdmin"))}
                    >
                        <UserPlus className="h-4 w-4" />
                        New User
                    </Button>
                )}
            </div>

            {/* TABLE */}
            <DataTable
                columns={[
                    { key: "emp_id", label: "ID" },
                    { key: "emp_name", label: "Employee Name" },
                    { key: "emp_jobtitle", label: "Job Title" },
                    { key: "emp_role", label: "Role" },
                    { key: "actions", label: "Action" },
                ]}
                data={tableData.data.map((row) => ({
                    ...row,
                    actions: (
                        <Button
                            size="sm"
                            className="flex items-center gap-2"
                            onClick={() => openModal(row)}
                        >
                            <User className="h-4 w-4" />
                            View
                        </Button>
                    ),
                }))}
                meta={{
                    from: tableData.from,
                    to: tableData.to,
                    total: tableData.total,
                    links: tableData.links,
                    currentPage: tableData.current_page,
                    lastPage: tableData.last_page,
                }}
                routeName={route("admin")}
                filters={tableFilters}
                rowKey="emp_id"
            />

            {/* MODAL (SHADCN DIALOG) */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-blue-600" />
                            Employee Details
                        </DialogTitle>
                    </DialogHeader>

                    {selectedUser && (
                        <div className="space-y-4">
                            {/* USER INFO */}
                            <div className="text-center space-y-1">
                                <User className="h-10 w-10 mx-auto text-blue-600" />

                                <h2 className="text-xl font-bold">
                                    {selectedUser.emp_name}
                                </h2>

                                <p className="text-sm flex items-center justify-center gap-1">
                                    <IdCard className="h-4 w-4" />
                                    {selectedUser.emp_id}
                                </p>

                                <p className="text-sm flex items-center justify-center gap-1">
                                    <Briefcase className="h-4 w-4" />
                                    {selectedUser.emp_jobtitle}
                                </p>

                                <p className="text-sm">
                                    Role:{" "}
                                    <span className="font-semibold text-blue-600">
                                        {selectedUser.emp_role}
                                    </span>
                                </p>
                            </div>

                            {/* ROLE EDIT */}
                            {["superadmin", "admin"].includes(
                                emp_data?.emp_system_role,
                            ) &&
                                !selectedUser.emp_role.includes(
                                    "superadmin",
                                ) && (
                                    <div className="space-y-3">
                                        <label className="text-sm font-semibold">
                                            Update Role
                                        </label>

                                        <Select
                                            value={role}
                                            onValueChange={(value) =>
                                                setRole(value)
                                            }
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select Role" />
                                            </SelectTrigger>

                                            <SelectContent>
                                                {emp_data?.emp_system_role ===
                                                    "superadmin" && (
                                                    <SelectItem value="superadmin">
                                                        Superadmin
                                                    </SelectItem>
                                                )}

                                                <SelectItem value="admin">
                                                    Admin
                                                </SelectItem>
                                                <SelectItem value="supporttech">
                                                    Support Technician
                                                </SelectItem>
                                                <SelectItem value="networktech">
                                                    Network Technician
                                                </SelectItem>
                                                <SelectItem value="boxing">
                                                    User Boxing
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>

                                        {/* ACTIONS */}
                                        <div className="flex justify-end gap-3 pt-3 border-t">
                                            <Button
                                                className="flex items-center gap-2"
                                                onClick={() =>
                                                    changeRole(
                                                        selectedUser.emp_id,
                                                    )
                                                }
                                            >
                                                <RefreshCw className="h-4 w-4" />
                                                Update
                                            </Button>

                                            <Button
                                                variant="destructive"
                                                className="flex items-center gap-2"
                                                onClick={() =>
                                                    removeAdmin(
                                                        selectedUser.emp_id,
                                                    )
                                                }
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                Remove
                                            </Button>
                                        </div>
                                    </div>
                                )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </AuthenticatedLayout>
    );
}

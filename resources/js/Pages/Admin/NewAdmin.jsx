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

import { Users, IdCard, Building2, Briefcase, UserPlus } from "lucide-react";

import { useState } from "react";

export default function NewAdmin({ tableData, tableFilters, emp_data }) {
    const [role, setRole] = useState(null);
    const [open, setOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    function addAdmin(id, name, job_title) {
        if (!role) return;

        router.post(
            route("addAdmin"),
            { id, name, job_title, role },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setOpen(false);
                    setSelectedUser(null);
                    setRole(null);

                    router.visit(route("admin"));
                },
            },
        );
    }

    const openModal = (row) => {
        setSelectedUser(row);
        setRole("");
        setOpen(true);
    };

    return (
        <AuthenticatedLayout>
            <Head title="Manage Administrators" />

            {/* HEADER */}
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Employee List
                </h1>
            </div>

            {/* TABLE */}
            <DataTable
                columns={[
                    { key: "EMPLOYID", label: "ID" },
                    { key: "EMPNAME", label: "Employee Name" },
                    { key: "JOB_TITLE", label: "Job Title" },
                    { key: "DEPARTMENT", label: "Department" },
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
                            <UserPlus className="h-4 w-4" />
                            Add
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
                routeName={route("index_addAdmin")}
                filters={tableFilters}
                rowKey="EMPLOYID"
                showExport={false}
            />

            {/* SHADCN DIALOG */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <IdCard className="h-5 w-5 text-amber-500" />
                            Employee Details
                        </DialogTitle>
                    </DialogHeader>

                    {selectedUser && (
                        <div className="space-y-4">
                            {/* EMPLOYEE INFO */}
                            <div className="text-center space-y-2">
                                <Building2 className="h-10 w-10 mx-auto text-amber-500" />

                                <h2 className="text-xl font-bold">
                                    {selectedUser.EMPNAME}
                                </h2>

                                <p className="text-sm text-gray-500">
                                    Employee ID:{" "}
                                    <span className="font-semibold">
                                        {selectedUser.EMPLOYID}
                                    </span>
                                </p>

                                <p className="text-sm flex items-center justify-center gap-1">
                                    <Briefcase className="h-4 w-4" />
                                    {selectedUser.JOB_TITLE}
                                </p>

                                <p className="text-sm flex items-center justify-center gap-1">
                                    <Building2 className="h-4 w-4" />
                                    {selectedUser.DEPARTMENT}
                                </p>
                            </div>

                            {/* ROLE SELECT */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold">
                                    Assign System Role
                                </label>

                                <Select
                                    value={role}
                                    onValueChange={(value) => setRole(value)}
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
                            </div>

                            {/* ACTION BUTTON */}
                            {role && (
                                <div className="flex justify-end pt-4 border-t">
                                    <Button
                                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                                        onClick={() =>
                                            addAdmin(
                                                selectedUser.EMPLOYID,
                                                selectedUser.EMPNAME,
                                                selectedUser.JOB_TITLE,
                                            )
                                        }
                                    >
                                        <UserPlus className="h-4 w-4" />
                                        Add as {role}
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </AuthenticatedLayout>
    );
}

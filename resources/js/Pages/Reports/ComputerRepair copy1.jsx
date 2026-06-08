import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, usePage, router, useForm } from "@inertiajs/react";
import DataTable from "@/Components/DataTable";
import { Drawer, Divider, Select, Form } from "antd";
import { useState } from "react";
import { color } from "framer-motion";
import MemoryTwoToneIcon from "@mui/icons-material/MemoryTwoTone";
import ViewQuiltTwoToneIcon from "@mui/icons-material/ViewQuiltTwoTone";
import VisibilityTwoToneIcon from "@mui/icons-material/VisibilityTwoTone";
import { PreviewTwoTone } from "@mui/icons-material";
import PreviewTwoToneIcon from "@mui/icons-material/PreviewTwoTone";
import { Eye, CircleX, Save } from "lucide-react";
import { Button } from "@/Components/ui/button";

export default function ComputerRepair({
    tableData,
    tableFilters,
    emp_data,
    computerName,
}) {
    const [openDrawer, setOpenDrawer] = useState(false);
    const [selectedComputer, setSelectedComputer] = useState(null);
    const [openViewDrawer, setOpenViewDrawer] = useState(false);
    const [viewData, setViewData] = useState(null);

    const [openPreview, setOpenPreview] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);

    const Info = ({ label, value }) => (
        <div>
            <label className="label">{label}</label>
            <div className="p-2 border rounded bg-gray-50">{value || "-"}</div>
        </div>
    );

    const BadgeList = ({ items }) => (
        <div className="flex flex-wrap gap-2">
            {items?.length ? (
                items.map((item, idx) => (
                    <span
                        key={idx}
                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                    >
                        {item}
                    </span>
                ))
            ) : (
                <span className="text-gray-400 text-sm">None</span>
            )}
        </div>
    );

    const { data, setData, post, processing, reset } = useForm({
        tech_id: emp_data.emp_id,
        tech_name: emp_data.emp_name,

        hardware_id: null,
        hostname: "",
        serial_number: "",
        model: "",
        service_tag: "",
        computer_type: "",
        operating_system: "",
        issued_to: "",

        computer_issues: [],
        items_checked: [],
        summary_repairs: [],

        technician_notes: "",
        recommended_parts: "",

        attachments: [], // pwede mag multiple image
    });

    const handleComputerSelect = (hardwareId) => {
        const computer = computerName.find((c) => c.id === hardwareId);
        if (!computer) return;

        // Convert arrays to strings
        const operating_system = Array.isArray(computer.os_details)
            ? computer.os_details.filter(Boolean).join(", ")
            : (computer.os_details ?? "");

        const issued_to = Array.isArray(computer.issued_to)
            ? computer.issued_to.filter(Boolean).join(", ")
            : (computer.issued_to ?? "");

        // Required fields to check
        const requiredFields = {
            hostname: computer.hostname,
            serial_number: computer.serial_number,
            model: computer.model,
            computer_type: computer.category,
            operating_system,
        };

        // Map internal keys to friendly names
        const fieldLabels = {
            hostname: "Hostname",
            serial_number: "Serial Number",
            model: "Model",
            computer_type: "Computer Type",
            operating_system: "Operating System",
            issued_to: "Issued to",
        };

        // Check if any field is empty
        const emptyFields = Object.entries(requiredFields)
            .filter(([key, value]) => !value || value.trim() === "")
            .map(([key]) => fieldLabels[key] || key);

        if (emptyFields.length > 0) {
            const visitInventory = window.confirm(
                `Please update the inventory for the following fields: ${emptyFields.join(
                    ", ",
                )}.\n\nClick OK to visit the inventory page.`,
            );

            if (visitInventory) {
                window.open(
                    "http://192.168.2.221:8195/MIS-IS/hardware",
                    "_blank",
                );
            }

            // Optionally reset form if validation fails
            reset();
            return;
        }

        setSelectedComputer(computer);

        setData({
            ...data,
            hardware_id: computer.id,
            hostname: computer.hostname,
            serial_number: computer.serial_number,
            service_tag: computer.service_tag ?? computer.serial_number,
            model: computer.model,
            computer_type: computer.category,
            operating_system,
            issued_to,
        });
    };

    const toggleArrayValue = (field, value) => {
        if (data[field].includes(value)) {
            setData(
                field,
                data[field].filter((v) => v !== value),
            );
        } else {
            setData(field, [...data[field], value]);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        post(route("computer_repairs.store"), {
            onSuccess: () => {
                alert("✅ Computer Repair Report submitted successfully.");
                reset();
                setSelectedComputer(null);
                setOpenDrawer(false);
                window.location.reload();
            },
        });
    };

    const dataWithAction = tableData.data.map((item) => ({
        ...item,
        // 🔸 Action buttons
        action: (
            <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                    setViewData(item);
                    setOpenViewDrawer(true);
                }}
            >
                <Eye className="h-6 w-6" />
            </Button>
        ),
    }));

    return (
        <AuthenticatedLayout>
            <Head title="Computer Repair List" />

            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold animate-pulse">
                    <i className="fa-solid fa-list mr-2"></i> Computer Repair
                    List
                </h1>
                <button
                    className="text-white bg-green-500 border-green-900 btn hover:bg-green-700"
                    onClick={() => setOpenDrawer(true)}
                >
                    <ViewQuiltTwoToneIcon /> New Form
                </button>
            </div>

            <DataTable
                columns={[
                    { key: "report_no", label: "Report No." },
                    { key: "tech_name", label: "Technician" },
                    { key: "model", label: "Model" },
                    { key: "serial_number", label: "Serial" },
                    { key: "operating_system", label: "Operting System" },
                    { key: "computer_type", label: "Type" },
                    { key: "issued_to", label: "Issued To" },
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
                routeName={route("computer_repairs.index")}
                filters={tableFilters}
                rowKey="id"
                showExport={false}
            />

            {/* /////////////// NEW FORM //////////////  */}
            <Drawer
                title={
                    <div>
                        <h2 className="text-2xl font-bold text-red-700">
                            <MemoryTwoToneIcon
                                style={{ fontSize: 35, marginBottom: 5 }}
                            />
                            Computer Troubleshooting Report
                        </h2>
                    </div>
                }
                placement="right"
                size={900}
                onClose={() => setOpenDrawer(false)}
                open={openDrawer}
                destroyOnClose
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* TECH INFO */}
                    <Divider titlePlacement="left">MIS Technician Info</Divider>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="label">Technician ID</label>
                            <input
                                type="text"
                                name="tech_id"
                                value={emp_data.emp_id}
                                className="input input-bordered w-full border-none bg-white"
                                readOnly
                            />
                        </div>
                        <div>
                            <label className="label">Technician Name</label>
                            <input
                                type="text"
                                name="tech_name"
                                value={emp_data.emp_name}
                                className="input input-bordered w-full border-none bg-white"
                                readOnly
                            />
                        </div>
                    </div>

                    {/* UNIT DETAILS */}
                    <Divider titlePlacement="left">Unit Details</Divider>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="label">Hostname</label>
                            <Select
                                showSearch
                                placeholder="Select Computer"
                                optionFilterProp="label"
                                className="w-full border border-gray-500 p-2"
                                onChange={handleComputerSelect}
                                options={computerName.map((item) => ({
                                    value: item.id, // hardware.id
                                    label: `${item.hostname}`,
                                }))}
                            />
                        </div>
                        <div>
                            <label className="label">Serial</label>
                            <input
                                className="input input-bordered w-full border-none bg-white"
                                value={selectedComputer?.serial_number || ""}
                                readOnly
                            />
                        </div>
                        <div>
                            <label className="label">Model</label>
                            <input
                                className="input input-bordered w-full border-none bg-white"
                                value={selectedComputer?.model || ""}
                                readOnly
                            />
                        </div>

                        {/* <div>
                            <label className="label">Service Tag</label>
                            <input
                                className="input input-bordered w-full border-none bg-white"
                                value={selectedComputer?.serial_number || ""}
                                readOnly
                            />
                        </div> */}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="label">Computer Type</label>
                            <input
                                className="input input-bordered w-full border-none bg-white"
                                value={selectedComputer?.category || ""}
                                readOnly
                            />
                        </div>
                        {/* OS */}
                        <div>
                            <label className="label">Operating System</label>
                            <input
                                className="input input-bordered w-full border-none bg-white"
                                value={
                                    selectedComputer?.os_details
                                        ?.filter(Boolean)
                                        .join(", ") || ""
                                }
                                readOnly
                            />
                        </div>
                        <div>
                            {/*yung may ari ng unit*/}
                            <label className="label">Issued To</label>
                            <input
                                className="input input-bordered w-full border-none bg-white"
                                value={selectedComputer?.issued_to || ""}
                                readOnly
                            />
                        </div>
                    </div>

                    {/* COMPUTER ISSUES */}
                    <Divider titlePlacement="left">Computer Issues</Divider>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {[
                            "Viruses",
                            "Need Anti-virus",
                            "Slow",
                            "Pop-Ups",
                            "Crashes/Reboots",
                            "Freezes",
                            "Needs Cleaned",
                            "No Video",
                            "No Internet",
                            "No Power",
                            "Needs Hardware",
                            "Error Message",
                            "Other",
                        ].map((issue) => (
                            <label
                                key={issue}
                                className="flex items-center gap-2"
                            >
                                <input
                                    type="checkbox"
                                    className="checkbox checkbox-sm border-gray-500 text-indigo-800"
                                    onChange={() =>
                                        toggleArrayValue(
                                            "computer_issues",
                                            issue,
                                        )
                                    }
                                />
                                {issue}
                            </label>
                        ))}
                    </div>

                    {/* ITEMS CHECKED IN */}
                    <Divider titlePlacement="left">Items Checked In</Divider>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {[
                            "Keyboard",
                            "Mouse",
                            "Power Cord",
                            "AC Adapter",
                            "Monitor",
                            "Cause/Bag",
                            "Software",
                            "Other: Other Full Check up of Laptop",
                        ].map((items_checked) => (
                            <label
                                key={items_checked}
                                className="flex items-center gap-2"
                            >
                                <input
                                    type="checkbox"
                                    className="checkbox checkbox-sm border-gray-500 text-indigo-800"
                                    onChange={() =>
                                        toggleArrayValue(
                                            "items_checked",
                                            items_checked,
                                        )
                                    }
                                />
                                {items_checked}
                            </label>
                        ))}
                    </div>

                    {/* Summary of Repairs */}
                    <Divider titlePlacement="left">Summary of Repairs</Divider>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {[
                            "Reloaded OS",
                            "AC Adapter",
                            "Cable",
                            "Mouse",
                            "Virus/Spyware Removal",
                            "System Board",
                            "Heat Sink",
                            "Video Card",
                            "Anti-virus Install/ Configuration",
                            "CPU",
                            "Fan",
                            "LCD Replacement",
                            "Windows/ Drivers Updates",
                            "Hard Drive",
                            "Optical Drive",
                            "Clean/ Dust Removal",
                            "Installed RAM",
                            "Power Supply",
                            "Keyboard",
                            "Other: Other Full Check up of Laptop",
                        ].map((repair) => (
                            <label
                                key={repair}
                                className="flex items-center gap-2"
                            >
                                <input
                                    type="checkbox"
                                    className="checkbox checkbox-sm border-gray-500 text-indigo-800"
                                    onChange={() =>
                                        toggleArrayValue(
                                            "summary_repairs",
                                            repair,
                                        )
                                    }
                                />
                                {repair}
                            </label>
                        ))}
                    </div>

                    <Divider titlePlacement="left">Attachments</Divider>
                    <div>
                        <label className="label text-red-600">
                            Upload Images (Damage, Error, Parts, etc.)
                        </label>
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            className="file-input file-input-bordered w-full bg-white border-gray-500"
                            onChange={(e) =>
                                setData(
                                    "attachments",
                                    Array.from(e.target.files),
                                )
                            }
                        />
                        {data.attachments.length > 0 && (
                            <div className="grid grid-cols-3 gap-3 mt-3">
                                {data.attachments.map((file, index) => (
                                    <img
                                        key={index}
                                        src={URL.createObjectURL(file)}
                                        className="h-32 w-full object-cover rounded border"
                                    />
                                ))}
                            </div>
                        )}

                        <p className="text-xs text-pink-600 mt-1">
                            You can upload multiple images (JPG, PNG, WEBP)
                        </p>
                    </div>

                    {/* SUMMARY & NOTES */}
                    <Divider titlePlacement="left">Notes</Divider>
                    <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                        <div>
                            <label className="label">Technician Notes:</label>
                            <textarea
                                className="textarea textarea-bordered w-full h-40 border-gray-500 bg-white"
                                value={data.technician_notes}
                                onChange={(e) =>
                                    setData("technician_notes", e.target.value)
                                }
                            />
                        </div>
                    </div>

                    {/* RECOMMENDED PARTS */}
                    <div>
                        <label className="label">
                            Recommended Parts to be Ordered:
                        </label>
                        <textarea
                            className="textarea textarea-bordered w-full h-40 border-gray-500 bg-white"
                            value={data.recommended_parts}
                            onChange={(e) =>
                                setData("recommended_parts", e.target.value)
                            }
                        />
                    </div>

                    {/* ACTIONS */}
                    <div className="flex justify-end gap-2 pt-4">
                        <Button
                            size="sm"
                            className="bg-red-500 hover:bg-red-600 text-white"
                            onClick={() => setOpenDrawer(false)}
                        >
                            <CircleX className="h-4 w-4" />
                            Cancel
                        </Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={processing}
                            className="bg-green-600 hover:bg-green-700 text-white"
                        >
                            <Save /> Save
                        </Button>
                    </div>
                </form>
            </Drawer>

            {/* ////////////VIEW Drawer//////////// */}
            <Drawer
                title={
                    <h2 className="text-2xl font-bold text-blue-700">
                        <MemoryTwoToneIcon
                            style={{ fontSize: 32, marginRight: 8 }}
                        />
                        Computer Troubleshooting Report
                    </h2>
                }
                placement="right"
                size={900}
                open={openViewDrawer}
                onClose={() => setOpenViewDrawer(false)}
                destroyOnClose

            >
                <div className="flex justify-end pt-4">
                    <Button
                        size="sm"
                        className="bg-red-600 hover:bg-red-700 text-white"
                        onClick={() =>
                            window.open(
                                route("computer_repairs.pdf", viewData.id),
                                "_blank",
                            )
                        }
                    >
                        <i className="fa-solid fa-file-pdf"></i>View as PDF
                    </Button>
                </div>

                {viewData && (
                    <div className="space-y-6">
                        {/* TECH INFO */}
                        <Divider titlePlacement="left">
                            MIS Technician Info
                        </Divider>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Info
                                label="Technician ID"
                                value={viewData.tech_id}
                            />
                            <Info
                                label="Technician Name"
                                value={viewData.tech_name}
                            />
                        </div>

                        {/* UNIT DETAILS */}
                        <Divider titlePlacement="left">Unit Details</Divider>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <Info label="Hostname" value={viewData.hostname} />
                            <Info
                                label="Serial"
                                value={viewData.serial_number}
                            />
                            <Info label="Model" value={viewData.model} />
                            {/* <Info
                                label="Service Tag"
                                value={viewData.service_tag}
                            /> */}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Info
                                label="Computer Type"
                                value={viewData.computer_type}
                            />
                            <Info
                                label="Operating System"
                                value={viewData.operating_system}
                            />
                            <Info
                                label="Issued To"
                                value={viewData.issued_to}
                            />
                        </div>

                        {/* COMPUTER ISSUES */}
                        <Divider titlePlacement="left">Computer Issues</Divider>
                        <BadgeList
                            items={JSON.parse(viewData.computer_issues || "[]")}
                        />

                        {/* ITEMS CHECKED IN */}
                        <Divider titlePlacement="left">
                            Items Checked In
                        </Divider>
                        <BadgeList
                            items={JSON.parse(viewData.items_checked || "[]")}
                        />

                        {/* SUMMARY OF REPAIRS */}
                        <Divider titlePlacement="left">
                            Summary of Repairs
                        </Divider>
                        <BadgeList
                            items={JSON.parse(viewData.summary_repairs || "[]")}
                        />

                        {/* ATTACHMENTS */}
                        <Divider titlePlacement="left">Attachments</Divider>

                        {viewData.attachments &&
                            JSON.parse(viewData.attachments).length > 0 ? (
                            <div className="grid grid-cols-3 gap-3">
                                {JSON.parse(viewData.attachments).map(
                                    (img, index) => (
                                        <img
                                            key={index}
                                            src={`/storage/attachments/${img}`}
                                            className="h-32 w-full object-cover rounded border cursor-pointer hover:scale-105 transition"
                                            onClick={() => {
                                                setPreviewImage(
                                                    `/storage/attachments/${img}`,
                                                );
                                                setOpenPreview(true);
                                            }}
                                        />
                                    ),
                                )}
                            </div>
                        ) : (
                            <p className="text-gray-400 text-sm">
                                No attachments
                            </p>
                        )}

                        {/* NOTES */}
                        <Divider titlePlacement="left">
                            Technician Notes
                        </Divider>
                        <div className="p-3 border rounded bg-gray-50 whitespace-pre-line">
                            {viewData.technician_notes || "—"}
                        </div>

                        {/* RECOMMENDED PARTS */}
                        <Divider titlePlacement="left">
                            Recommended Parts
                        </Divider>
                        <div className="p-3 border rounded bg-gray-50 whitespace-pre-line">
                            {viewData.recommended_parts || "—"}
                        </div>

                        {/* FOOTER */}
                        <div className="flex justify-end pt-4">
                            <Button
                                danger
                                onClick={() => setOpenViewDrawer(false)}
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                )}
            </Drawer>

            {/* ////////////Preview Drawer//////////// */}
            <Drawer
                title={
                    <div>
                        <h2 className="text-2xl font-bold text-blue-700">
                            <PreviewTwoToneIcon
                                style={{ fontSize: 35, marginBottom: 5 }}
                            />
                            Attachment Preview
                        </h2>
                    </div>
                }
                open={openPreview}
                size={900}
                onClose={() => setOpenPreview(false)}
            >
                <img src={previewImage} className="w-full rounded border" />
            </Drawer>
        </AuthenticatedLayout>
    );
}

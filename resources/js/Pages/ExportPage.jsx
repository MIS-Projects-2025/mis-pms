import { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";

export default function ExportPage({ tables = [] }) {
    const [form, setForm] = useState({
        table: "",
        from: "",
        to: "",
        format: "excel",
    });

    const handleExport = () => {
        if (!form.table || !form.from || !form.to || !form.format) {
            alert("Please complete all fields.");
            return;
        }

        const params = new URLSearchParams(form);

        window.location.href =
            route("export.generate") + "?" + params.toString();
    };

    return (
        <AuthenticatedLayout>
            <Head title="Export" />

            <div className="p-6 space-y-4">
                <select
                    value={form.table}
                    onChange={(e) =>
                        setForm({
                            ...form,
                            table: e.target.value,
                        })
                    }
                >
                    <option value="">Select Table</option>

                    {tables.map((t) => (
                        <option key={t.value} value={t.value}>
                            {t.label}
                        </option>
                    ))}
                </select>

                <input
                    type="date"
                    value={form.from}
                    onChange={(e) =>
                        setForm({
                            ...form,
                            from: e.target.value,
                        })
                    }
                />

                <input
                    type="date"
                    value={form.to}
                    onChange={(e) =>
                        setForm({
                            ...form,
                            to: e.target.value,
                        })
                    }
                />

                <select
                    value={form.format}
                    onChange={(e) =>
                        setForm({
                            ...form,
                            format: e.target.value,
                        })
                    }
                >
                    <option value="excel">Excel</option>

                    <option value="csv">CSV</option>
                </select>

                <button type="button" onClick={handleExport}>
                    Export
                </button>
            </div>
        </AuthenticatedLayout>
    );
}

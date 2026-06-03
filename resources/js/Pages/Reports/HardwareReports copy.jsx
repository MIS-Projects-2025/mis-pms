import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import DataTable from "@/Components/DataTable";
import { useState } from "react";

/**
 * HardwareReports - updated dynamic version
 * - Splits comma-separated grouped fields (ram_details, hdd_details, etc.)
 * - Creates separate rows per slot
 * - Shows Battery (if laptop and battery_details exists) or Processor otherwise
 * - Uses os_details, antivirus_details, office_details from backend
 *
 * Backend expectations:
 * - controller returns computerName collection where each item contains:
 *   - hostname, location, category, processor (from hardware table)
 *   - ram_details, hdd_details, monitor_details, motherboard_details, psu_details,
 *     casing_details, keyboard_details, mouse_details (from hp subquery)
 *   - os_details, antivirus_details, office_details (from sw subquery)
 */
export default function HardwareReports({ tableData, tableFilters, computerName }) {
  const [isReportOpen, setIsReportOpen] = useState(false);

  // dynamic rows for the modal table
  const [items, setItems] = useState([]);

  const [form, setForm] = useState({
    computer_name: "",
    location: "",
    purpose: "",
  });

  // helper: split comma-separated values, trim, remove empty, unique preserve order
  const splitValues = (raw) => {
    if (!raw && raw !== 0) return [];
    return String(raw)
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s !== "")
      .filter((v, i, a) => a.indexOf(v) === i); // remove duplicates
  };

  // helper: push splitted items to rows (label base, key base)
  const pushSplitRows = (rows, labelBase, keyBase, rawValue) => {
    const parts = splitValues(rawValue);
    if (parts.length === 0) {
      // if no split parts but rawValue exists as single non-comma string, still create one row
      if (rawValue && String(rawValue).trim() !== "") {
        rows.push({
          label: labelBase,
          key: keyBase + "_0",
          value: String(rawValue).trim(),
          replace: false,
          replaced: "",
          issue: "",
        });
      }
      return;
    }
    parts.forEach((p, idx) => {
      rows.push({
        label: `${labelBase} ${idx + 1}`,
        key: `${keyBase}_${idx}`,
        value: p,
        replace: false,
        replaced: "",
        issue: "",
      });
    });
  };

  const buildRowsFromComputer = (selectedComputer) => {
    const rows = [];

    // Hardware grouped multi-values
    // RAM
    pushSplitRows(rows, "RAM", "ram", selectedComputer?.ram_details);

    // Storage / HDD
    pushSplitRows(rows, "Storage", "hdd", selectedComputer?.hdd_details);

    // If laptop and battery_details present, show Battery(s) instead of Processor
    const isLaptop =
      String(selectedComputer?.category || "").toLowerCase().includes("laptop");

    if (isLaptop && (selectedComputer?.battery_details || selectedComputer?.battery)) {
      // prefer battery_details key (if backend added it), then battery
      const batteryRaw = selectedComputer?.battery_details || selectedComputer?.battery;
      pushSplitRows(rows, "Battery", "battery", batteryRaw);
    } else {
      // Processor from hardware table (single field) or grouped processor_details if available
      // check for processor_details (some backends use grouped), otherwise hardware.processor
      if (selectedComputer?.processor_details) {
        pushSplitRows(rows, "Processor", "processor", selectedComputer.processor_details);
      } else if (selectedComputer?.processor) {
        rows.push({
          label: "Processor",
          key: "processor_0",
          value: selectedComputer.processor,
          replace: false,
          replaced: "",
          issue: "",
        });
      }
    }

    // Other single/multi parts: motherboard, psu, casing, monitor, keyboard, mouse
    pushSplitRows(rows, "Motherboard", "motherboard", selectedComputer?.motherboard_details);
    pushSplitRows(rows, "PSU", "psu", selectedComputer?.psu_details);
    pushSplitRows(rows, "Casing", "casing", selectedComputer?.casing_details);
    pushSplitRows(rows, "Monitor", "monitor", selectedComputer?.monitor_details);
    pushSplitRows(rows, "Keyboard", "keyboard", selectedComputer?.keyboard_details);
    pushSplitRows(rows, "Mouse", "mouse", selectedComputer?.mouse_details);

    // SOFTWARE: OS, Antivirus, Office (can be comma-separated)
    pushSplitRows(rows, "Operating System", "os", selectedComputer?.os_details);
    pushSplitRows(rows, "Antivirus", "antivirus", selectedComputer?.antivirus_details);
    pushSplitRows(rows, "Office Suite", "office", selectedComputer?.office_details);

    return rows;
  };

  // When selecting a computer from dropdown
  const handleComputerSelect = (value) => {
    const selectedComputer = computerName.find(c => c.hostname === value);

    setForm(prev => ({
        ...prev,
        computer_name: value,
        location: selectedComputer?.location || "",
    }));

    let newItems = [];

    // Helper: convert an array to multiple fields
    const addDynamicFields = (label, key, array) => {
        if (!array || array.length === 0) return;

        array
            .filter(item => item !== null)
            .forEach((value, index) => {
                newItems.push({
                    label: `${label} ${array.length > 1 ? `#${index + 1}` : ""}`,
                    key: `${key}_${index}`,
                    value: value,
                    replace: false,
                    replaced: "",
                    issue: ""
                });
            });
    };

    // AUTO-GENERATED PARTS
    addDynamicFields("RAM (GB)", "ram", selectedComputer?.ram_details);
    addDynamicFields("Storage (GB/TB)", "hdd", selectedComputer?.hdd_details);

    // STATIC PARTS
    newItems.push(
        { label: "Processor", key: "processor", value: selectedComputer?.processor || "", replace: false, replaced: "", issue: "" },
        { label: "Monitor", key: "monitor", value: selectedComputer?.monitor_details || "", replace: false, replaced: "", issue: "" }
    );

    setItems(newItems);
};

  // Toggle replace for an index
  const toggleReplace = (idx, checked) => {
    const copy = [...items];
    copy[idx] = { ...copy[idx], replace: checked };
    setItems(copy);
  };

  // update a field for an index
  const updateItemField = (idx, field, value) => {
    const copy = [...items];
    copy[idx] = { ...copy[idx], [field]: value };
    setItems(copy);
  };

  // prepare payload on submit (example)
  const handleSubmit = () => {
    // build payload as you need — example below
    const payload = {
      computer_name: form.computer_name,
      location: form.location,
      purpose: form.purpose,
      items: items.map((it) => ({
        label: it.label,
        key: it.key,
        current_value: it.value,
        replace: it.replace ? 1 : 0,
        replaced: it.replaced || null,
        issue: it.issue || null,
      })),
    };

    // send via Inertia/router or fetch
    // router.post(route('hardware_reports.store'), payload);
    console.log("submit payload", payload);
    // you can close modal after submit or on success
  };

  return (
    <AuthenticatedLayout>
      <Head title="Hardware Reports" />

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold animate-bounce">
          <i className="fa-solid fa-folder-open"></i> Hardware Troubleshooting Reports
        </h1>
        <button
          className="text-white bg-green-500 border-green-900 btn hover:bg-green-700"
          onClick={() => {
            setIsReportOpen(true);
            // clear previous
            setForm({ computer_name: "", location: "", purpose: "" });
            setItems([]);
          }}
        >
          <i className="fa-solid fa-plus"></i> New Report
        </button>
      </div>

      <DataTable
        columns={[
          { key: "computer_name", label: "Computer Name" },
          { key: "location", label: "Location" },
          { key: "purpose", label: "Purpose" },
        ]}
        data={tableData.data}
        meta={{
          from: tableData.from,
          to: tableData.to,
          total: tableData.total,
          links: tableData.links,
          currentPage: tableData.current_page,
          lastPage: tableData.last_page,
        }}
        routeName={route("hardware_reports.index")}
        filters={tableFilters}
        rowKey="computer_name"
        showExport={false}
      />

      {isReportOpen && (
        <div className="fixed inset-0 z-50 flex justify-center items-start bg-black bg-opacity-50 backdrop-blur-sm overflow-y-auto p-4">
          <div className="bg-white w-full max-w-7xl rounded-xl shadow-2xl p-6 mt-10 animate-slideUp">
            {/* header */}
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-2xl font-bold text-gray-700 text-center">
                <i className="fa-solid fa-memory"></i> Hardware Troubleshooting Report
              </h2>
              <button onClick={() => setIsReportOpen(false)} className="text-gray-600 hover:text-red-600 text-2xl">
                &times;
              </button>
            </div>

            {/* basic info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5 mb-4">
              <div>
                <label className="font-semibold text-gray-700">Computer Name</label>
                <select
                  className="select select-bordered w-full bg-white text-gray-800 border-gray-500"
                  value={form.computer_name}
                  onChange={(e) => handleComputerSelect(e.target.value)}
                >
                  <option value="">Select Computer</option>
                  {computerName.map((c, idx) => (
                    <option key={idx} value={c.hostname}>
                      {c.hostname}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-gray-700">Location</label>
                <input className="input input-bordered w-full bg-gray-100 text-gray-800 border-gray-500" value={form.location} readOnly />
              </div>

              <div>
                <label className="font-semibold text-gray-700">Purpose of Use</label>
                <input
                  className="input input-bordered w-full bg-white text-gray-800 border-gray-500"
                  value={form.purpose}
                  onChange={(e) => setForm((prev) => ({ ...prev, purpose: e.target.value }))}
                />
              </div>
            </div>

            {/* items table */}
            <table className="table-auto w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-200 text-gray-700">
                  <th className="border px-3 py-2">Part / Software</th>
                  <th className="border px-3 py-2">Current Value</th>
                  <th className="border px-3 py-2">Replace?</th>
                  <th className="border px-3 py-2">Item Replaced</th>
                  <th className="border px-3 py-2">Issue Found</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center p-4 text-gray-500">
                      No hardware/software data available.
                    </td>
                  </tr>
                )}

                {items.map((item, idx) => (
                  <tr key={item.key || idx} className="hover:bg-gray-50 text-gray-800">
                    <td className="border px-3 py-2 align-top">{item.label}</td>
                    <td className="border px-3 py-2 align-top">
                      <div className="whitespace-pre-wrap">{item.value}</div>
                    </td>
                    <td className="border px-3 py-2 text-center align-top">
                      <input type="checkbox" checked={item.replace} onChange={(e) => toggleReplace(idx, e.target.checked)} />
                    </td>
                    <td className="border px-3 py-2 align-top">
                      <input
                        type="text"
                        className="input input-bordered w-full text-gray-800 border-gray-500 bg-white"
                        value={item.replaced}
                        disabled={!item.replace}
                        placeholder={item.replace ? "Enter replaced item" : "—"}
                        onChange={(e) => updateItemField(idx, "replaced", e.target.value)}
                      />
                    </td>
                    <td className="border px-3 py-2 align-top">
                      <input
                        type="text"
                        className="input input-bordered w-full text-gray-800 border-gray-500 bg-white"
                        value={item.issue}
                        disabled={!item.replace}
                        placeholder={item.replace ? "Enter issue found" : "—"}
                        onChange={(e) => updateItemField(idx, "issue", e.target.value)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* summary */}
            <h3 className="text-lg font-bold text-gray-700 mt-6">Technician Summary</h3>
            <textarea className="textarea textarea-bordered w-full h-28 text-gray-800 border-gray-500 bg-white" />

            {/* footer */}
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setIsReportOpen(false)} className="btn bg-red-500 hover:bg-red-700 text-white">
                <i className="fa-solid fa-xmark"></i> Cancel
              </button>

              <button onClick={handleSubmit} className="btn bg-green-600 text-white hover:bg-green-700">
                <i className="fa-solid fa-floppy-disk"></i> Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthenticatedLayout>
  );
}

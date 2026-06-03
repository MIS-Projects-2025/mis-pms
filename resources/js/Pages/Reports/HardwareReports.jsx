import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import DataTable from "@/Components/DataTable";
import { useState, useEffect } from "react";
import { Select, Switch } from "antd";


export default function HardwareReports({ tableData, tableFilters, computerName }) {
    const { Option } = Select;
  const [isReportOpen, setIsReportOpen] = useState(false);

  // dynamic rows for the modal table
  const [items, setItems] = useState([]);
  
const today = new Date().toISOString().split("T")[0];

 const [form, setForm] = useState({
  computer_name: "",
  location: "",
  report_date: "", // default today
  resolve_date: "",
  owner: "",
  motherboard: "",
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
    pushSplitRows(rows, "Motherboard", "motherboard", selectedComputer?.motherboard);
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
        owner: selectedComputer?.issued_to || "",
        motherboard: selectedComputer?.motherboard || "",
    }));

    let newItems = [];

    // Helper to add dynamic fields but still maintain order
    const addDynamic = (label, baseKey, array) => {
        if (!array || array.length === 0) {
            // no multiple values → single field
            newItems.push({
                label: label,
                key: baseKey,
                value: "",
                replace: false,
                replaced: "",
                issue: ""
            });
            return;
        }

        const clean = array.filter(i => i !== null);

        // multiple values
        if (clean.length > 1) {
            clean.forEach((value, index) => {
                newItems.push({
                    label: `${label} ${index + 1}`,
                    key: `${baseKey}_${index}`,
                    value: value,
                    replace: false,
                    replaced: "",
                    issue: ""
                });
            });
        } else {
            // exactly 1 value
            newItems.push({
                label: label,
                key: baseKey,
                value: clean[0],
                replace: false,
                replaced: "",
                issue: ""
            });
        }
    };

    // === FIXED ORDER BELOW ===

    // 1. RAM
    addDynamic("RAM (GB)", "ram_details", selectedComputer?.ram_details);

    // 2. Storage / Hard Disk
    addDynamic("Storage (GB/TB)", "hdd_details", selectedComputer?.hdd_details);

    // 3. Processor
    newItems.push({
        label: "Processor",
        key: "processor_details",
        value: selectedComputer?.processor || "",
        replace: false,
        replaced: "",
        issue: ""
    });

    // 4. Motherboard
    newItems.push({
        label: "Motherboard",
        key: "motherboard_details",
        value: selectedComputer?.motherboard || "",
        replace: false,
        replaced: "",
        issue: ""
    });

// 5. PSU or Battery (if laptop)
const isLaptop =
    String(selectedComputer?.category || "").toLowerCase().includes("laptop");

if (isLaptop) {
    newItems.push({
        label: "Battery",
        key: "battery_details",
        value: selectedComputer?.battery_details || "",
        replace: false,
        replaced: "",
        issue: ""
    });
} else {
    newItems.push({
        label: "PSU",
        key: "psu_details",
        value: selectedComputer?.psu_details || "",
        replace: false,
        replaced: "",
        issue: ""
    });
}


    // 6. Casing
    newItems.push({
        label: "Casing",
        key: "casing_details",
        value: selectedComputer?.casing_details || "",
        replace: false,
        replaced: "",
        issue: ""
    });

    // 7. Monitor
    newItems.push({
        label: "Monitor",
        key: "monitor_details",
        value: selectedComputer?.monitor_details || "",
        replace: false,
        replaced: "",
        issue: ""
    });

    // 8. Keyboard
    newItems.push({
        label: "Keyboard",
        key: "keyboard_details",
        value: selectedComputer?.keyboard_details || "",
        replace: false,
        replaced: "",
        issue: ""
    });

    // 9. Mouse
    newItems.push({
        label: "Mouse",
        key: "mouse_details",
        value: selectedComputer?.mouse_details || "",
        replace: false,
        replaced: "",
        issue: ""
    });

    // 10. Operating System
    newItems.push({
        label: "Operating System",
        key: "os",
        value: selectedComputer?.os_details || "",
        replace: false,
        replaced: "",
        issue: ""
    });

    // 11. Office Suite
    newItems.push({
        label: "Office Suite",
        key: "office",
        value: selectedComputer?.office_details || "",
        replace: false,
        replaced: "",
        issue: ""
    });

    // 12. Antivirus
    newItems.push({
        label: "Antivirus",
        key: "antivirus",
        value: selectedComputer?.antivirus_details || "",
        replace: false,
        replaced: "",
        issue: ""
    });

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
      owner: form.owner,
      report_date: form.report_date,
      resolve_date: form.resolve_date,
      motherboard: form.motherboard,
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
            setForm({ computer_name: "", location: "", owner: "", report_date: today, resolve_date: "", motherboard: "" });
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
          { key: "report_date", label: "Report Date" },
          { key: "resolve_date", label: "Resolve Date" },
          { key: "owner", label: "Owner" },
          
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
            <div className="flex justify-between items-center pb-3">

              <div className="flex text-center justify-center w-full">
                <h2 className="text-3xl font-bold text-red-800 text-center">
                    Hardware Troubleshooting Report
              </h2>
              </div>
              <button onClick={() => setIsReportOpen(false)} className="text-red-500 hover:text-red-700 text-2xl">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* basic info */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-5 mb-4">
              <div>
                <label className="font-semibold text-gray-700">Computer Name</label>
                    <Select
                     showSearch
                     placeholder="Select Computer"
                        value={form.computer_name || undefined} // AntD prefers undefined for empty value
                        onChange={(value) => handleComputerSelect(value)}
                     filterOption={(input, option) =>
                          option.children.toLowerCase().includes(input.toLowerCase())
                        }
                        style={{ width: "100%" }}
                     className="input input-bordered w-full bg-white text-gray-800 border-gray-500"
                    >
                     <Option value="">Select Computer</Option>
                        {computerName.map((c, idx) => (
                         <Option key={idx} value={c.hostname}>
                          {c.hostname}
                        </Option>
                     ))}
                    </Select>
              </div>

              <div>
                <label className="font-semibold text-gray-700">Location</label>
                <input className="input input-bordered w-full bg-gray-100 text-gray-800 border-gray-500" value={form.location} readOnly />
              </div>

              <div>
                <label className="font-semibold text-gray-700">Area Owner</label>
                <input className="input input-bordered w-full bg-gray-100 text-gray-800 border-gray-500" value={form.owner} readOnly />
              </div>

              <div>
                <label className="font-semibold text-gray-700">Report Date</label>
                <input
                 type="date"
                  className="input input-bordered w-full text-gray-800 border-gray-500 bg-gray-100"
                  value={form.report_date}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, report_date: e.target.value }))
                    
                  }
                  readOnly
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700">Resolve Date</label>
                <input
                 type="date"
                  className="input input-bordered w-full bg-white text-gray-800 border-gray-500"
                  value={form.resolve_date}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, resolve_date: e.target.value }))
                  }
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
                  {/* <th className="border px-3 py-2">Item Replaced</th> */}
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
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
    <Switch
  checked={item.replace}
  onChange={(checked) => toggleReplace(idx, checked)}
  checkedChildren="Yes"
  unCheckedChildren="No"
  style={{
    backgroundColor: item.replace ? "green" : "gray",
    borderColor: item.replace ? "green" : "black",
  }}
/>

  </div>
</td>

    {/* <td className="border px-3 py-2 align-top">
      <input
        type="text"
        className="input input-bordered w-full text-gray-800 border-gray-500 bg-white"
        value={item.replaced}
        disabled={!item.replace}
        placeholder={item.replace ? "Enter replaced item" : ""}
        onChange={(e) => updateItemField(idx, "replaced", e.target.value)}
      />
    </td> */}
    <td className="border px-3 py-2 align-top">
      <input
        type="text"
        className="input input-bordered w-full text-gray-800 border-gray-500 bg-white"
        value={item.issue}
        disabled={!item.replace}
        placeholder={item.replace ? "Enter issue found" : ""}
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

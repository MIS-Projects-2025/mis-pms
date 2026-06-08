import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import DataTable from "@/Components/DataTable";
import { useState } from "react";

export default function LadderChecklist({
    tableData,
    tableFilters,
    ladderChecklistItems,
    emp_data,
}) {
    const [openViewModal, setOpenViewModal] = useState(false);
    const [openEditModal, setOpenEditModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const isVerifier = emp_data?.emp_id === "16";

    const [openChecklistModal, setOpenChecklistModal] = useState(false);

    const today = new Date().toISOString().split(".")[0] + "Z";

    const canShowSecond = selectedItem?.second_inspected_by;
    const isVerifierUser = emp_data?.emp_id === "16";

    const handleFirstVerify = () => {
        router.put(
            route("ladder_checklist.verify", selectedItem.id),
            {
                stage: "first",
                verified_by: selectedItem.first_verified_by,
            },
            {
                onSuccess: () => {
                    setOpenViewModal(false);
                },
            },
        );
    };

    const isSecondCheckDisabled =
        !selectedItem?.first_verified_by?.trim() ||
        isVerifierUser ||
        !!selectedItem?.second_inspected_by;

    const handleSecondVerify = () => {
        router.put(
            route("ladder_checklist.verify", selectedItem.id),
            {
                stage: "second",
                verified_by: selectedItem.second_verified_by,
            },
            {
                onSuccess: () => {
                    setOpenViewModal(false);
                },
            },
        );
    };

    const handleSaveNextCheck = () => {
        console.log(selectedItem);
        router.put(
            route("ladder_checklist.next_check", selectedItem.id),
            {
                next_check: selectedItem.next_check,
                second_inspected_by:
                    selectedItem.second_inspected_by || emp_data.emp_name,
                sections: selectedItem.sections, // 🔥 ADD THIS
            },
            {
                onSuccess: () => {
                    setOpenViewModal(false);
                },
            },
        );
    };

    const [checklistForm, setChecklistForm] = useState({
        date: today,
        sections: [],
        remarks: "",

        // 🔥 FIRST
        first_inspected_by: emp_data?.emp_name || "",
        first_verified_by: "",

        // 🔥 SECOND
        second_inspected_by: "",
        second_verified_by: "",
    });

    // 🔥 INIT CHECKLIST (AUTO LOAD ALL LADDER TYPES)
    const initChecklist = () => {
        const sections = ladderChecklistItems.map((item) => {
            const checklist_items = JSON.parse(item.checklist_items || "[]");
            const checklist_criteria = JSON.parse(
                item.checklist_criteria || "[]",
            );

            const rows = checklist_items.map((itm, index) => {
                const criteriaList = checklist_criteria[index]?.name
                    ? checklist_criteria[index].name
                          .split(",")
                          .map((c) => c.trim())
                    : [];

                return {
                    item: itm.name,
                    criteriaList,

                    // 🔥 FIRST CHECK
                    first_yes: false,
                    first_no: false,
                    first_criteria: "",

                    // 🔥 SECOND CHECK
                    second_yes: false,
                    second_no: false,
                    second_criteria: "",
                };
            });

            return {
                ladder_type: item.ladder_type,
                ladder_checklist_item_id: item.id,
                rows,
            };
        });

        setChecklistForm({
            sections,
            remarks: "",
            first_inspected_by: emp_data?.emp_name || "",
            first_verified_by: "",
            second_inspected_by: "",
            second_verified_by: "",
            date: today,
        });
    };

    const formatDate = (date) => {
        if (!date) return "";

        return new Date(date).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
        });
    };

    const dataWithAction = tableData.data.map((item) => ({
        ...item,

        done_check: formatDate(item.done_check),
        next_check: formatDate(item.next_check),

        actions: (
            <div className="flex space-x-1">
                {/* VIEW */}
                <button
                    onClick={() => {
                        setSelectedItem({
                            ...item,
                            sections:
                                typeof item.sections === "string"
                                    ? JSON.parse(item.sections)
                                    : item.sections || [],
                        });
                        setOpenViewModal(true);
                    }}
                    className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                    <i className="fa fa-eye"></i>
                </button>

                {/* EDIT */}
                {/* <button
            onClick={() => {
    setSelectedItem({
        ...item,
        sections: typeof item.sections === "string"
            ? JSON.parse(item.sections)
            : item.sections || []
    });
    setOpenEditModal(true);
}}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
            <i className="fa fa-pen"></i>
        </button> */}
            </div>
        ),
    }));

    return (
        <AuthenticatedLayout>
            <Head title="Ladder Checklist" />

            {/* HEADER */}
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold">
                    <i className="fa-solid fa-clipboard"></i> Ladder Checklist
                </h1>

                {!["admin", "superadmin"].includes(
                    emp_data?.emp_system_role,
                ) && (
                    <button
                        onClick={() => {
                            setOpenChecklistModal(true);
                            initChecklist();
                        }}
                        className="text-white bg-green-500 px-4 py-2 rounded hover:bg-green-700"
                    >
                        <i className="fa fa-plus-square"></i> New Checklist
                    </button>
                )}
            </div>

            {/* TABLE LIST */}
            <DataTable
                columns={[
                    { key: "done_check", label: "Date Done" },
                    { key: "next_check", label: "Next Check" },
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
                routeName={route("ladder_checklist.index")}
                filters={tableFilters}
                rowKey="id"
                showExport={false}
                tabKey="status"
                tabs={[
                    { label: "All", value: "" },
                    { label: "Pending", value: "2" },
                    { label: "Verified", value: "1" },
                ]}
            />

            {/* =================CREATE MODAL ================= */}

            {openChecklistModal && (
                <div className="fixed inset-0 flex z-50">
                    {/* OVERLAY */}
                    <div
                        className="fixed inset-0 bg-black opacity-50"
                        onClick={() => setOpenChecklistModal(false)}
                    />

                    {/* MODAL */}
                    <div className="relative m-auto w-[1100px] bg-white p-6 rounded shadow z-50 overflow-y-auto max-h-[95vh] text-sm">
                        {/* HEADER (PDF STYLE) */}
                        <div className="text-center mb-4">
                            <h1 className="text-2xl font-bold text-red-800">
                                LADDER INSPECTION CHECKLIST
                            </h1>
                            <div className="flex justify-center items-center gap-2 mt-4 text-stone-700">
                                <span>Date:</span>
                                <input
                                    type="datetime-local"
                                    value={checklistForm.date}
                                    onChange={(e) =>
                                        setChecklistForm({
                                            ...checklistForm,
                                            date: e.target.value,
                                        })
                                    }
                                    className="border border-gray-400 rounded-md px-2 py-1"
                                />
                            </div>
                        </div>
                        <div className="mb-4 p-3 border border-gray-300 rounded bg-gray-50 text-sm">
                            <p className="font-bold mb-2 text-rose-600">
                                <i className="fa fa-info-circle"></i>{" "}
                                Instructions:
                            </p>

                            <ul className="list-disc ml-5 space-y-1 text-stone-700">
                                <li>
                                    Select{" "}
                                    <span className="font-semibold text-green-600">
                                        Yes
                                    </span>{" "}
                                    or{" "}
                                    <span className="font-semibold text-red-600">
                                        No
                                    </span>{" "}
                                    for each checklist item.
                                </li>
                                <li>
                                    If{" "}
                                    <span className="font-semibold text-green-600">
                                        Yes
                                    </span>{" "}
                                    is selected, choose the applicable
                                    <span className="font-semibold text-blue-600">
                                        {" "}
                                        criteria
                                    </span>{" "}
                                    from the options provided.
                                </li>
                            </ul>
                        </div>

                        {/* MAIN TABLE */}
                        <table className="w-full border border-black text-xs">
                            <thead>
                                <tr className="bg-gray-100 text-center text-stone-600">
                                    <th className="border border-black p-2 w-[20%]">
                                        Ladder Type
                                    </th>
                                    <th className="border border-black p-2 w-[30%]">
                                        Check Item
                                    </th>
                                    <th className="border border-black p-2 w-[35%]">
                                        Criteria
                                    </th>
                                    <th className="border border-black p-2 text-green-600">
                                        Yes
                                    </th>
                                    <th className="border border-black p-2 text-red-600">
                                        No
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="text-stone-600">
                                {checklistForm.sections.map((section, sIndex) =>
                                    section.rows.map((row, rIndex) => (
                                        <tr key={`${sIndex}-${rIndex}`}>
                                            {/* LADDER TYPE */}
                                            {rIndex === 0 && (
                                                <td
                                                    rowSpan={
                                                        section.rows.length
                                                    }
                                                    className="border border-black p-2 font-bold text-center align-middle"
                                                >
                                                    {section.ladder_type}
                                                </td>
                                            )}

                                            {/* ITEM */}
                                            <td className="border border-black p-2">
                                                {row.item}
                                            </td>

                                            {/* 🔥 CRITERIA (RADIO IF YES) */}
                                            <td className="border border-black p-2">
                                                {row.first_yes
                                                    ? row.criteriaList.map(
                                                          (crit, cIndex) => (
                                                              <label
                                                                  key={cIndex}
                                                                  className="flex items-center gap-2"
                                                              >
                                                                  <input
                                                                      type="radio"
                                                                      name={`criteria-${sIndex}-${rIndex}`}
                                                                      checked={
                                                                          row.first_criteria ===
                                                                          crit
                                                                      }
                                                                      onChange={() => {
                                                                          const updated =
                                                                              [
                                                                                  ...checklistForm.sections,
                                                                              ];
                                                                          updated[
                                                                              sIndex
                                                                          ].rows[
                                                                              rIndex
                                                                          ].first_criteria =
                                                                              crit;

                                                                          setChecklistForm(
                                                                              {
                                                                                  ...checklistForm,
                                                                                  sections:
                                                                                      updated,
                                                                              },
                                                                          );
                                                                      }}
                                                                  />
                                                                  {crit}
                                                              </label>
                                                          ),
                                                      )
                                                    : row.criteriaList.join(
                                                          ", ",
                                                      )}
                                            </td>

                                            {/* YES */}
                                            <td className="border border-black text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={row.first_yes}
                                                    onChange={() => {
                                                        const updated = [
                                                            ...checklistForm.sections,
                                                        ];

                                                        updated[sIndex].rows[
                                                            rIndex
                                                        ].first_yes =
                                                            !row.first_yes;
                                                        updated[sIndex].rows[
                                                            rIndex
                                                        ].first_no = false;

                                                        if (
                                                            !updated[sIndex]
                                                                .rows[rIndex]
                                                                .first_yes
                                                        ) {
                                                            updated[
                                                                sIndex
                                                            ].rows[
                                                                rIndex
                                                            ].first_criteria =
                                                                "";
                                                        }

                                                        setChecklistForm({
                                                            ...checklistForm,
                                                            sections: updated,
                                                        });
                                                    }}
                                                />
                                            </td>

                                            {/* NO */}
                                            <td className="border border-black text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={row.first_no}
                                                    onChange={() => {
                                                        const updated = [
                                                            ...checklistForm.sections,
                                                        ];

                                                        updated[sIndex].rows[
                                                            rIndex
                                                        ].first_no =
                                                            !row.first_no;
                                                        updated[sIndex].rows[
                                                            rIndex
                                                        ].first_yes = false;
                                                        updated[sIndex].rows[
                                                            rIndex
                                                        ].first_criteria = "";

                                                        setChecklistForm({
                                                            ...checklistForm,
                                                            sections: updated,
                                                        });
                                                    }}
                                                />
                                            </td>
                                        </tr>
                                    )),
                                )}
                                <tr>
                                    <td className="text-center">
                                        <label className="font-bold">
                                            Remarks:
                                        </label>
                                    </td>
                                    <td
                                        colSpan="4"
                                        className="border border-black p-2 font-bold text-center"
                                    >
                                        {/* REMARKS */}
                                        <div className="mt-4">
                                            <textarea
                                                className="w-full border border-gray-300 rounded-md p-2 h-24"
                                                rows="3"
                                                onChange={(e) =>
                                                    setChecklistForm({
                                                        ...checklistForm,
                                                        remarks: e.target.value,
                                                    })
                                                }
                                            />
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td className="border-t border-black p-2 font-bold text-center text-red-700">
                                        TELFORD SVC PHILS.,INC
                                    </td>
                                    <td
                                        colSpan="4"
                                        className="border-none border-black p-2 font-bold text-right text-stone-500"
                                    >
                                        INF-15 (Rev.2)
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        {/* FOOTER */}
                        <div className="flex justify-end mt-6 gap-2">
                            <button
                                onClick={() => setOpenChecklistModal(false)}
                                className="bg-red-500 text-white hover:bg-red-600 px-4 py-2 rounded"
                            >
                                <i className="fa fa-close"></i> Close
                            </button>

                            <button
                                onClick={() => {
                                    router.post(
                                        route("ladder_checklist.store"),
                                        checklistForm,
                                        {
                                            onSuccess: () => {
                                                setOpenChecklistModal(false);
                                                window.location.reload();
                                            },
                                            onError: (err) => {
                                                console.error(err);
                                                alert(
                                                    "❌ Failed to save checklist",
                                                );
                                            },
                                        },
                                    );
                                }}
                                className="bg-green-600 text-white hover:bg-green-700 px-4 py-2 rounded"
                            >
                                <i className="fa fa-save"></i> Save Checklist
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* =================VIEW MODAL ================= */}

            {openViewModal && selectedItem && (
                <div className="fixed inset-0 flex z-50">
                    {/* OVERLAY */}
                    <div
                        className="fixed inset-0 bg-black opacity-50"
                        onClick={() => setOpenViewModal(false)}
                    />

                    {/* MODAL */}
                    <div className="relative m-auto w-[1200px] bg-white p-6 rounded shadow overflow-y-auto max-h-[95vh] text-xs">
                        {/* HEADER */}
                        <div className="text-center mb-4">
                            <h1 className="text-2xl font-bold text-red-800">
                                LADDER INSPECTION CHECKLIST
                            </h1>

                            <div className="flex justify-end gap-6 mt-4">
                                {/* VIEW PDF */}
                                {selectedItem.first_verified_by &&
                                    selectedItem.second_verified_by && (
                                        <button
                                            onClick={() =>
                                                window.open(
                                                    route(
                                                        "ladder_checklist.pdf",
                                                        selectedItem.id,
                                                    ),
                                                    "_blank",
                                                )
                                            }
                                            className="bg-white text-red-600 hover:text-white hover:bg-red-600 px-4 py-2 rounded border border-red-500"
                                        >
                                            <i className="fas fa-file-pdf"></i>{" "}
                                            View PDF
                                        </button>
                                    )}
                            </div>
                        </div>

                        {/* INSTRUCTION */}
                        <div className="mb-4 p-3 border rounded bg-gray-50 text-stone-700">
                            <p className="font-bold text-red-600 mb-1">
                                Instructions:
                            </p>
                            <ul className="list-disc ml-5">
                                <li>Check YES or NO for each item.</li>
                                <li>
                                    If YES, select the corresponding criteria.
                                </li>
                            </ul>
                        </div>

                        {/* TABLE */}
                        <table className="w-full border border-black">
                            {/* HEADER */}
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="border p-2">Ladder Type</th>
                                    <th className="border p-2">Check Item</th>
                                    <th className="border p-2">Criteria</th>

                                    <th
                                        colSpan="2"
                                        className="border p-2 text-stone-600"
                                    >
                                        {/* DATE DONE */}
                                        <span className="text-stone-500">
                                            {selectedItem.done_check
                                                ? new Date(
                                                      selectedItem.done_check,
                                                  ).toLocaleDateString()
                                                : ""}
                                        </span>
                                    </th>

                                    <th
                                        colSpan="2"
                                        className="border p-2 text-stone-600"
                                    >
                                        {/* NEXT CHECK */}
                                        <div>
                                            {!selectedItem?.first_verified_by ? (
                                                <span className="text-red-500">
                                                    Waiting to verify first
                                                    check..
                                                </span>
                                            ) : !selectedItem.next_check ? (
                                                !isVerifierUser ? (
                                                    <input
                                                        type="datetime-local"
                                                        value={
                                                            selectedItem.next_check ||
                                                            ""
                                                        }
                                                        disabled={
                                                            !selectedItem?.first_verified_by?.trim() ||
                                                            isSecondCheckDisabled
                                                        }
                                                        onChange={(e) =>
                                                            setSelectedItem({
                                                                ...selectedItem,
                                                                next_check:
                                                                    e.target
                                                                        .value,
                                                            })
                                                        }
                                                        className="border-gray-300 rounded-md ml-2 px-2 py-1"
                                                    />
                                                ) : (
                                                    <span className="text-red-500">
                                                        Verifier cannot inspect.
                                                    </span>
                                                )
                                            ) : (
                                                <span className="text-stone-500">
                                                    {selectedItem.next_check
                                                        ? new Date(
                                                              selectedItem.next_check,
                                                          ).toLocaleDateString()
                                                        : ""}
                                                </span>
                                            )}
                                        </div>
                                    </th>
                                </tr>

                                <tr className="text-center border">
                                    <th colSpan="3"></th>

                                    <th className="border text-green-600">
                                        Yes
                                    </th>
                                    <th className="border text-red-600">No</th>

                                    <th className="border text-green-600">
                                        Yes
                                    </th>
                                    <th className="border text-red-600">No</th>
                                </tr>
                            </thead>

                            {/* BODY */}
                            <tbody>
                                {(Array.isArray(selectedItem.sections)
                                    ? selectedItem.sections
                                    : []
                                ).map((section, sIndex) =>
                                    section.rows.map((row, rIndex) => (
                                        <tr key={`${sIndex}-${rIndex}`}>
                                            {/* LADDER TYPE */}
                                            {rIndex === 0 && (
                                                <td
                                                    rowSpan={
                                                        section.rows.length
                                                    }
                                                    className="border text-center font-bold align-middle"
                                                >
                                                    {section.ladder_type}
                                                </td>
                                            )}

                                            {/* ITEM */}
                                            <td className="border p-2">
                                                {row.item}
                                            </td>

                                            {/* CRITERIA */}
                                            <td className="border p-2">
                                                {row.first_criteria ||
                                                    row.criteriaList?.join(
                                                        ", ",
                                                    )}
                                            </td>

                                            {/* DONE CHECK */}
                                            <td className="border text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={row.first_yes}
                                                    disabled
                                                />
                                            </td>

                                            <td className="border text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={row.first_no}
                                                    disabled
                                                />
                                            </td>

                                            {/* YES */}
                                            <td className="border text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={row.second_yes}
                                                    disabled={
                                                        isSecondCheckDisabled
                                                    }
                                                    onChange={() => {
                                                        if (
                                                            isSecondCheckDisabled
                                                        )
                                                            return; // 🔥 safety

                                                        const updatedSections =
                                                            [
                                                                ...selectedItem.sections,
                                                            ];

                                                        updatedSections[
                                                            sIndex
                                                        ].rows[
                                                            rIndex
                                                        ].second_yes =
                                                            !row.second_yes;
                                                        updatedSections[
                                                            sIndex
                                                        ].rows[
                                                            rIndex
                                                        ].second_no = false;

                                                        setSelectedItem({
                                                            ...selectedItem,
                                                            sections:
                                                                updatedSections,
                                                        });
                                                    }}
                                                />
                                            </td>

                                            {/* NO */}
                                            <td className="border text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={row.second_no}
                                                    disabled={
                                                        isSecondCheckDisabled
                                                    }
                                                    onChange={() => {
                                                        if (
                                                            isSecondCheckDisabled
                                                        )
                                                            return; // 🔥 safety

                                                        const updatedSections =
                                                            [
                                                                ...selectedItem.sections,
                                                            ];

                                                        updatedSections[
                                                            sIndex
                                                        ].rows[
                                                            rIndex
                                                        ].second_no =
                                                            !row.second_no;
                                                        updatedSections[
                                                            sIndex
                                                        ].rows[
                                                            rIndex
                                                        ].second_yes = false;

                                                        setSelectedItem({
                                                            ...selectedItem,
                                                            sections:
                                                                updatedSections,
                                                        });
                                                    }}
                                                />
                                            </td>
                                        </tr>
                                    )),
                                )}
                                <tr>
                                    <td
                                        colSpan="3"
                                        className="border text-center font-bold"
                                    ></td>
                                    <td colSpan="2" className="border p-2">
                                        <div className="flex flex-col gap-1 text-right">
                                            <span className="font-bold text-stone-600">
                                                Inspected by:{" "}
                                                {selectedItem.first_inspected_by ||
                                                    "N/A"}
                                            </span>
                                            <span className="font-bold">
                                                Verified by:
                                                {selectedItem?.first_verified_by ? (
                                                    // ✅ MAY VALUE → DISPLAY AS SPAN
                                                    <span className="text-green-700 font-semibold ml-2">
                                                        {
                                                            selectedItem.first_verified_by
                                                        }
                                                    </span>
                                                ) : Number(emp_data?.emp_id) ===
                                                  16 ? (
                                                    // ✅ WALANG VALUE + AUTHORIZED → INPUT + BUTTON
                                                    <>
                                                        <input
                                                            type="text"
                                                            value={
                                                                emp_data?.emp_name ||
                                                                ""
                                                            }
                                                            className="w-2/4 border-gray-300 rounded-md ml-2 px-2 text-xs text-center text-stone-600"
                                                            readOnly
                                                        />

                                                        <button
                                                            onClick={
                                                                handleFirstVerify
                                                            }
                                                            className="bg-green-600 text-white hover:bg-green-700 px-4 py-2 rounded ml-2"
                                                        >
                                                            <i className="fas fa-check"></i>{" "}
                                                            Verify
                                                        </button>
                                                    </>
                                                ) : (
                                                    // ❌ WALANG VALUE + NOT AUTHORIZED
                                                    <span className="text-blue-600 font-semibold ml-2">
                                                        For verification...
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                    </td>
                                    <td colSpan="2" className="border p-2">
                                        <div className="flex flex-col gap-1 text-right">
                                            <span className="font-bold text-stone-600">
                                                Inspected by:{" "}
                                                {!selectedItem?.first_verified_by ? (
                                                    <span className="text-red-500">
                                                        Waiting to verify first
                                                        check..
                                                    </span>
                                                ) : selectedItem.second_inspected_by ? (
                                                    <span className="ml-2">
                                                        {
                                                            selectedItem.second_inspected_by
                                                        }
                                                    </span>
                                                ) : isVerifierUser ? (
                                                    <span className="text-red-600 ml-2">
                                                        Verifier cannot inspect
                                                    </span>
                                                ) : (
                                                    <input
                                                        type="text"
                                                        value={
                                                            selectedItem.second_inspected_by ||
                                                            emp_data?.emp_name ||
                                                            ""
                                                        }
                                                        onChange={(e) =>
                                                            setSelectedItem({
                                                                ...selectedItem,
                                                                second_inspected_by:
                                                                    e.target
                                                                        .value,
                                                            })
                                                        }
                                                        className="w-2/4 border-gray-300 rounded-md ml-2 px-2 text-xs text-center text-stone-600"
                                                    />
                                                )}
                                            </span>
                                            <span className="font-bold">
                                                Verified by:{" "}
                                                {!selectedItem?.first_verified_by ? (
                                                    <span className="text-red-500 ml-2">
                                                        Pending Second Check..
                                                    </span>
                                                ) : selectedItem.second_verified_by ? (
                                                    <span className="text-green-700 font-semibold ml-2">
                                                        {
                                                            selectedItem.second_verified_by
                                                        }
                                                    </span>
                                                ) : isVerifierUser ? (
                                                    selectedItem.second_inspected_by ? (
                                                        <>
                                                            <input
                                                                type="text"
                                                                value={
                                                                    emp_data?.emp_name ||
                                                                    ""
                                                                }
                                                                onChange={(e) =>
                                                                    setSelectedItem(
                                                                        {
                                                                            ...selectedItem,
                                                                            second_verified_by:
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                        },
                                                                    )
                                                                }
                                                                className="w-2/4 border-gray-300 rounded-md ml-2 px-2 text-xs text-center text-stone-600"
                                                                readOnly
                                                            />

                                                            <button
                                                                onClick={
                                                                    handleSecondVerify
                                                                }
                                                                className="bg-green-600 text-white hover:bg-green-700 px-4 py-2 rounded ml-2"
                                                            >
                                                                <i className="fas fa-check"></i>{" "}
                                                                Verify
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <span className="text-red-500 ml-2">
                                                            Wait to fill second
                                                            inspect..
                                                        </span>
                                                    )
                                                ) : (
                                                    <span className="text-blue-500 font-semibold ml-2">
                                                        For verification..
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td className="border p-2 text-center">
                                        <label className="font-bold">
                                            Remarks:
                                        </label>
                                    </td>
                                    <td
                                        colSpan="7"
                                        className="border p-2 font-bold text-center"
                                    >
                                        {/* REMARKS */}
                                        <div className="mt-4">
                                            <textarea
                                                value={
                                                    selectedItem.remarks || ""
                                                }
                                                disabled
                                                className="w-full border border-gray-300 rounded-md p-2 h-24"
                                            />
                                        </div>
                                    </td>
                                </tr>

                                <tr>
                                    <td className="border text-center font-bold text-red-700">
                                        TELFORD SVC PHILS.,INC
                                    </td>
                                    <td
                                        colSpan="7"
                                        className="border font-bold text-right text-stone-500"
                                    >
                                        INF-15 (Rev.2)
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        {/* FOOTER */}
                        <div className="flex justify-end mt-6 gap-2">
                            <button
                                onClick={() => setOpenViewModal(false)}
                                className="bg-red-500 text-white hover:bg-red-600 px-4 py-2 rounded"
                            >
                                <i className="fas fa-times"></i> Close
                            </button>

                            {/* FIRST VERIFY */}
                            {/* {emp_data.emp_id === "16" && !selectedItem.first_verified_by && (
        <button
            onClick={handleFirstVerify}
            className="bg-green-600 text-white px-4 py-2 rounded"
        >
           <i className="fas fa-check"></i> Verify First Check
        </button>
    )} */}

                            {/* SECOND VERIFY */}
                            {/* {emp_data.emp_id === "16" &&
        selectedItem.second_inspected_by &&
        selectedItem.first_verified_by &&
        !selectedItem.second_verified_by && (
        <button
            onClick={handleSecondVerify}
            className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded"
        >
            <i className="fas fa-check"></i> Verify Second Check
        </button>
    )} */}

                            {/* SAVE NEXT CHECK */}
                            {selectedItem.first_verified_by &&
                                !selectedItem.second_inspected_by &&
                                !isVerifierUser && (
                                    <button
                                        onClick={handleSaveNextCheck}
                                        className="bg-green-500 text-white hover:bg-green-600 px-4 py-2 rounded"
                                    >
                                        <i className="fas fa-save"></i> Save
                                    </button>
                                )}
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}

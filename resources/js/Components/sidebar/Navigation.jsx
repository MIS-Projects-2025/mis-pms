import { usePage } from "@inertiajs/react";
import SidebarLink from "@/Components/sidebar/SidebarLink";
import Dropdown from "@/Components/sidebar/Dropdown";
import { LayoutDashboard, ListTodo, UserCog, LaptopMinimal, PrinterCheck, FileBox, Cable, Cctv, WavesLadder, ListCheck, Mailbox } from "lucide-react";

export default function NavLinks({ isSidebarOpen }) {
    const { emp_data } = usePage().props;



    return (
        <nav
            className="flex flex-col flex-grow space-y-1 overflow-y-auto"
            style={{ scrollbarWidth: "none" }}
        >
            <SidebarLink
                href={route("dashboard")}
                label="Dashboard"
                icon={<LayoutDashboard className="w-5 h-5" />}
                isSidebarOpen={isSidebarOpen}
            />

            {["superadmin", "admin", "networktech", "supporttech"].includes(
                emp_data?.emp_system_role,
            ) && (
                <>
                    <SidebarLink
                        href={route("computer-checklist")}
                        label="Computer Checklist"
                        icon={<LaptopMinimal className="w-5 h-5" />}
                        isSidebarOpen={isSidebarOpen}
                    />

                    <SidebarLink
                        href={route("printer-checklist")}
                        label="Printer Checklist"
                        icon={<PrinterCheck className="w-5 h-5" />}
                        isSidebarOpen={isSidebarOpen}
                    />

                    <SidebarLink
                        href={route("boxing-printer-checklist")}
                        label="BoxingPrinter Checklist"
                        icon={<FileBox className="w-5 h-5" />}
                        isSidebarOpen={isSidebarOpen}
                    />

                    <SidebarLink
                        href={route("computer_repairs.index")}
                        label="Computer Repair Checklist"
                        icon={<Cable className="w-5 h-5" />}
                        isSidebarOpen={isSidebarOpen}
                    />

                    <SidebarLink
                        href={route("cctv.index")}
                        label="CCTV Checklist"
                        icon={<Cctv className="w-5 h-5" />}
                        isSidebarOpen={isSidebarOpen}
                    />

                    <SidebarLink
                        href={route("ladder_checklist.index")}
                        label="Ladder Checklist"
                        icon={<WavesLadder className="w-5 h-5" />}
                        isSidebarOpen={isSidebarOpen}
                    />
                </>
            )}
            {["superadmin", "admin"].includes(emp_data?.emp_system_role) && (
                <div>
                    <div className="mt-4 mb-2 border-1 border-t border-gray-700">
                        <h1
                            className="mt-4 px-3 py-2 text-xl font-semibold text-gray-700 text-center"
                            style={{
                                textShadow: "0 0 3px rgb(114, 112, 112)",
                            }}
                        >

                        </h1>
                    </div>
                    <div>
                        <SidebarLink
                            href={route("admin")}
                            label="User Management"
                            icon={<UserCog className="w-5 h-5" />}
                            isSidebarOpen={isSidebarOpen}
                        />
                    </div>

                    <Dropdown
                        label="PM Checklist Items"
                        icon={<ListCheck className="w-5 h-5" />}
                        isSidebarOpen={isSidebarOpen}
                        links={[
                            {
                                href: route("computer-checklist-items"),
                                label: "Computer Checklist Items",
                            },
                            {
                                href: route("printer-checklist-items"),
                                label: "Printer Checklist Items",
                            },
                            {
                                href: route("boxing-printer-checklist-items"),
                                label: "Boxing Printer Checklist Items",
                            },
                        ]}
                    />
                </div>
            )}

            {["boxing"].includes(emp_data?.emp_system_role) && (
                <SidebarLink
                    //href={route("boxing-printer-checklist")}
                    label="BoxingPrinter Checklist"
                    icon={<Mailbox className="w-5 h-5" />}
                    isSidebarOpen={isSidebarOpen}
                />
            )}
        </nav>
    );
}

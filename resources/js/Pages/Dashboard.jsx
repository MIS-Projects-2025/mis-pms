
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import React, { useState, useEffect } from "react";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/Components/ui/card";

import {
    Monitor,
    Printer,
    Package,
    Wrench,
    Camera,
    ChartNetwork,
    ChartSpline,
} from "lucide-react";

import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from "recharts";

export default function Dashboard({
    chartDates = [],
    computerPerDay = {},
    printerPerDay = {},
    boxingPerDay = {},
    repairPerDay = {},
    cctvPerDay = {},
}) {
    const formattedChartDates = chartDates.map((date) => {
        const d = new Date(date);

        const month = d.toLocaleString("en-US", {
            month: "short",
        });

        const day = String(d.getDate()).padStart(2, "0");
        const year = d.getFullYear();

        return `${month}/${day}/${year}`;
    });

    const today = new Date().toISOString().slice(0, 10);

    const [currentDateTime, setCurrentDateTime] = useState("");

    const formatDateTime = (date = new Date()) => {
        const d = new Date(date);

        const month = d.toLocaleString("en-US", {
            month: "long",
        });

        const day = String(d.getDate()).padStart(2, "0");
        const year = d.getFullYear();

        const hours = String(d.getHours()).padStart(2, "0");
        const minutes = String(d.getMinutes()).padStart(2, "0");
        const seconds = String(d.getSeconds()).padStart(2, "0");

        return `${month}/${day}/${year} ${hours}:${minutes}:${seconds}`;
    };

    useEffect(() => {
        setCurrentDateTime(formatDateTime());

        const interval = setInterval(() => {
            setCurrentDateTime(formatDateTime());
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const todayComputer = computerPerDay[today] ?? 0;
    const todayPrinter = printerPerDay[today] ?? 0;
    const todayBoxing = boxingPerDay[today] ?? 0;
    const todayRepair = repairPerDay[today] ?? 0;
    const todayCCTV = cctvPerDay[today] ?? 0;

    const chartData = chartDates.map((date, index) => ({
        date: formattedChartDates[index],
        computer: computerPerDay[date] ?? 0,
        printer: printerPerDay[date] ?? 0,
        boxing: boxingPerDay[date] ?? 0,
        repair: repairPerDay[date] ?? 0,
        cctv: cctvPerDay[date] ?? 0,
    }));

    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />

            <div className="p-6 space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">

                        <ChartNetwork className="h-8 w-8" />Checklist Monitoring Dashboard
                    </h1>
                </div>

                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                    <Card className="bg-blue-50 border-blue-200">
                        <CardContent className="pt-6">
                            <Monitor className="h-10 w-10 text-blue-600 mb-3" />

                            <p className="text-sm text-slate-600">
                                Computer Checklists
                            </p>

                            <p className="text-4xl font-bold text-blue-700 text-right">
                                {todayComputer}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-cyan-50 border-cyan-200">
                        <CardContent className="pt-6">
                            <Printer className="h-10 w-10 text-cyan-600 mb-3" />

                            <p className="text-sm text-slate-600">
                                Printer Checklists
                            </p>

                            <p className="text-4xl font-bold text-cyan-700 text-right">
                                {todayPrinter}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-amber-50 border-amber-200">
                        <CardContent className="pt-6">
                            <Package className="h-10 w-10 text-amber-700 mb-3" />

                            <p className="text-sm text-slate-600">
                                Boxing Checklists
                            </p>

                            <p className="text-4xl font-bold text-amber-700 text-right">
                                {todayBoxing}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-lime-50 border-lime-200">
                        <CardContent className="pt-6">
                            <Wrench className="h-10 w-10 text-lime-700 mb-3" />

                            <p className="text-sm text-slate-600">
                                Computer Repairs
                            </p>

                            <p className="text-4xl font-bold text-lime-700 text-right">
                                {todayRepair}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-100 border-slate-300">
                        <CardContent className="pt-6">
                            <Camera className="h-10 w-10 text-slate-700 mb-3" />

                            <p className="text-sm text-slate-600">
                                CCTV Checklists
                            </p>

                            <p className="text-4xl font-bold text-slate-700 text-right">
                                {todayCCTV}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Chart */}
                <Card className="bg-white border-gray-200">
                    <CardHeader className="flex justify-start ml-10">
                        <div className="flex flex-col gap-2">
                            <p className="text-md text-muted-foreground text-stone-700">
                                {currentDateTime}
                            </p>

                            <CardTitle className="text-2xl text-blue-600 flex items-center gap-2">

                                <ChartSpline className="h-8 w-8" />Daily Checklist Trend
                            </CardTitle>
                        </div>
                    </CardHeader>

                    <CardContent>
                        <ResponsiveContainer width="100%" height={450}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />

                                <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 12 }}
                                />

                                <YAxis />

                                <Tooltip />

                                <Legend />

                                <Line
                                    type="monotone"
                                    dataKey="computer"
                                    name="Computer"
                                    stroke="#2563eb"
                                    strokeWidth={3}
                                />

                                <Line
                                    type="monotone"
                                    dataKey="printer"
                                    name="Printer"
                                    stroke="#0891b2"
                                    strokeWidth={3}
                                />

                                <Line
                                    type="monotone"
                                    dataKey="boxing"
                                    name="Boxing"
                                    stroke="#d97706"
                                    strokeWidth={3}
                                />

                                <Line
                                    type="monotone"
                                    dataKey="repair"
                                    name="Computer Repair"
                                    stroke="#65a30d"
                                    strokeWidth={3}
                                />

                                <Line
                                    type="monotone"
                                    dataKey="cctv"
                                    name="CCTV"
                                    stroke="#475569"
                                    strokeWidth={3}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}

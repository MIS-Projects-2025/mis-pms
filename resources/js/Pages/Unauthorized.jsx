
import React, { useEffect, useState } from "react";
import { Head } from "@inertiajs/react";
import { motion } from "framer-motion";
import { LogOut, Loader2 } from "lucide-react";

import { Button } from "@/Components/ui/button";

export default function Unauthorized() {
    const [countdown, setCountdown] = useState(10);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const logout = () => {
        setIsLoggingOut(true);

        localStorage.clear();
        sessionStorage.clear();

        setTimeout(() => {
            window.location.href = route("logout");
        }, 500);
    };

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    logout();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    return (
        <>
            <Head title="Unauthorized" />

            <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 text-center overflow-hidden">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8 }}
                    className="relative z-10 p-10 rounded-3xl bg-white/10 backdrop-blur-md shadow-2xl border border-white/20 max-w-2xl w-full"
                >
                    {/* 401 */}
                    <motion.h1
                        initial={{ scale: 0.9 }}
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{
                            repeat: Infinity,
                            duration: 1.8,
                        }}
                        className="text-[110px] font-extrabold text-red-500 drop-shadow-[0_0_25px_rgba(255,0,0,0.6)] mb-4"
                    >
                        401
                    </motion.h1>

                    <h2 className="text-4xl font-bold text-gray-100 mb-3">
                        Unauthorized Access
                    </h2>

                    <p className="text-gray-300 text-lg mb-6">
                        You do not have permission to access this page. Please
                        contact your administrator if this is a mistake.
                    </p>

                    {/* Countdown */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{
                            duration: 1.2,
                            repeat: Infinity,
                            repeatType: "reverse",
                        }}
                        className="text-2xl font-semibold text-red-400 mb-6"
                    >
                        Auto logout in{" "}
                        <span className="text-white font-bold">
                            {countdown}
                        </span>{" "}
                        seconds
                    </motion.div>

                    {/* ShadCN Button */}
                    <Button
                        onClick={logout}
                        disabled={isLoggingOut}
                        size="lg"
                        className="w-full text-lg gap-2 bg-red-600 hover:bg-red-700"
                    >
                        {isLoggingOut ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <LogOut className="h-5 w-5" />
                        )}

                        {isLoggingOut ? "Signing out..." : "Log out"}
                    </Button>
                </motion.div>
            </div>
        </>
    );
}

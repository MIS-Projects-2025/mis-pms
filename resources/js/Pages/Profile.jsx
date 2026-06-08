import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router, usePage } from "@inertiajs/react";
import { useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Input } from "@/Components/ui/input";
import { Button } from "@/Components/ui/button";
import { Label } from "@/Components/ui/label";
import { Alert, AlertDescription } from "@/Components/ui/alert";

export default function Profile({ profile, errors }) {
    const { props } = usePage();
    const successMessage = props.flash?.success;

    const [password, setPassword] = useState({
        current_password: "",
        new_password: "",
        new_password_confirmation: "",
    });

    const [passwordForm, setPasswordForm] = useState(false);

    const handleChangePassword = () => {
        router.post(
            route("changePassword"),
            { ...password },
            {
                preserveScroll: true,
                onSuccess: () => {
                    localStorage.removeItem("authify-token");
                    window.location.href = route("logout");
                },
            },
        );
    };

    return (
        <AuthenticatedLayout>
            <Head title="Profile" />

            <div className="max-w-4xl mx-auto p-6 space-y-6">
                {/* HEADER */}
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Profile
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        View your account information and security settings
                    </p>
                </div>

                {/* PROFILE CARD */}
                <Card className="shadow-sm border-muted">
                    <CardHeader>
                        <CardTitle className="text-base font-medium">
                            Account Information
                        </CardTitle>
                    </CardHeader>

                    <CardContent>
                        {profile && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <ProfileField
                                    label="Name"
                                    value={profile.EMPNAME}
                                />
                                <ProfileField
                                    label="Position"
                                    value={profile.JOB_TITLE}
                                />
                                <ProfileField
                                    label="Department"
                                    value={profile.DEPARTMENT}
                                />
                                <ProfileField
                                    label="Production Line"
                                    value={profile.PRODLINE}
                                />
                                <ProfileField
                                    label="Station"
                                    value={profile.STATION}
                                />
                                <ProfileField
                                    label="Email"
                                    value={profile.EMAIL}
                                />

                                {/* PASSWORD ROW */}
                                <div className="md:col-span-2 flex items-center justify-between p-3 rounded-md border bg-muted/20">
                                    <div>
                                        <Label className="text-xs text-muted-foreground">
                                            Password
                                        </Label>
                                        <p className="font-medium">
                                            {"•".repeat(
                                                profile.PASSWRD?.length || 8,
                                            )}
                                        </p>
                                    </div>

                                    <Button
                                        variant="outline"
                                        onClick={() =>
                                            setPasswordForm(!passwordForm)
                                        }
                                    >
                                        {passwordForm
                                            ? "Cancel"
                                            : "Change Password"}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* PASSWORD FORM */}
                {passwordForm && (
                    <Card className="border-muted shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base">
                                Security Settings
                            </CardTitle>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            {/* INFO ALERT */}
                            <Alert className="bg-yellow-50 border-yellow-200 text-yellow-800">
                                <AlertDescription>
                                    Changing your password will log you out of
                                    all active sessions.
                                </AlertDescription>
                            </Alert>

                            {/* OLD PASSWORD */}
                            <div className="space-y-1">
                                <Label>Current Password</Label>
                                <Input
                                    type="password"
                                    value={password.current_password}
                                    onChange={(e) =>
                                        setPassword({
                                            ...password,
                                            current_password: e.target.value,
                                        })
                                    }
                                />
                                {errors.current_password && (
                                    <p className="text-xs text-red-500">
                                        {errors.current_password}
                                    </p>
                                )}
                            </div>

                            {/* NEW PASSWORD */}
                            <div className="space-y-1">
                                <Label>New Password</Label>
                                <Input
                                    type="password"
                                    value={password.new_password}
                                    onChange={(e) =>
                                        setPassword({
                                            ...password,
                                            new_password: e.target.value,
                                        })
                                    }
                                />
                                {errors.new_password && (
                                    <p className="text-xs text-red-500">
                                        {errors.new_password}
                                    </p>
                                )}
                            </div>

                            {/* CONFIRM */}
                            <div className="space-y-1">
                                <Label>Confirm Password</Label>
                                <Input
                                    type="password"
                                    value={password.new_password_confirmation}
                                    onChange={(e) =>
                                        setPassword({
                                            ...password,
                                            new_password_confirmation:
                                                e.target.value,
                                        })
                                    }
                                />
                                {errors.new_password_confirmation && (
                                    <p className="text-xs text-red-500">
                                        {errors.new_password_confirmation}
                                    </p>
                                )}
                            </div>

                            <Button
                                className="w-full"
                                onClick={handleChangePassword}
                            >
                                Update Password
                            </Button>

                            {/* SUCCESS */}
                            {successMessage && (
                                <Alert className="bg-green-50 border-green-200 text-green-700">
                                    <AlertDescription>
                                        {successMessage}
                                    </AlertDescription>
                                </Alert>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </AuthenticatedLayout>
    );
}

function ProfileField({ label, value }) {
    return (
        <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{label}</Label>
            <p className="text-sm font-medium text-foreground">{value}</p>
        </div>
    );
}

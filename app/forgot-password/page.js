"use client";

import { useSearchParams } from "next/navigation";
import { ResetPasswordPage } from "./ResetPasswordPage";
import { ResetPasswordToken } from "./ResetPasswordToken";

export default function Page() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    if (!token) {
        return <ResetPasswordPage token={token} />;
    }
    
    return <ResetPasswordToken />;
}
"use server"

import { v4 } from "uuid";
import { getUserSession } from "./session";
import { promisePool } from "@/lib/db";
import { validateCsrfToken } from "@/lib/csrf";

let cachedToken = null;
let tokenExpiry = null;

async function getAccessToken() {
    const now = Date.now();

    if (cachedToken && tokenExpiry && now < tokenExpiry) {
        return cachedToken;
    }

    const response = await fetch("https://api-sandbox.partners.scb/partners/sandbox/v1/oauth/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "resourceOwnerId": process.env.SCB_KEY,
            "requestUId": v4(),
            "accept-language": "EN"
        },
        body: JSON.stringify({
            applicationKey: process.env.SCB_KEY,
            applicationSecret: process.env.SCB_SECRET
        })
    });

    const data = await response.json();
    cachedToken = data.data.accessToken;
    tokenExpiry = new Date(data.data.expiresAt).getTime();

    return cachedToken;
}

export async function generateQRPayment(formData, amount) {

    const csrfToken = formData.get("csrfToken")?.toString();
    if (!await validateCsrfToken(csrfToken)) {
        return {
            success: false,
            error: "Invalid CSRF token. Please refresh the page and try again."
        };
    }

    const getSession = await getUserSession();
    if (!getSession) return { success: false, error: "Session not found." }

    try {
        let accessToken = await getAccessToken();

        const ref1 = `ORDER${makeid(10)}`
        const ref2 = `U${getSession.userId.toUpperCase().slice(0, 19)}`
        const ref3 = `WDS${Date.now().toString()}`;
        console.log(ref1)
        console.log(ref2)
        console.log(ref3)
        // Request QRCode
        
         const response = await fetch('https://api-sandbox.partners.scb/partners/sandbox/v1/payment/qrcode/create', {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "authorization": `Bearer ${accessToken}`,
                "resourceOwnerId": process.env.SCB_KEY,
                "requestUId": v4(),
                "accept-language": "EN",
            },
            body: JSON.stringify({
                "qrType": "PP",
                "ppType": "BILLERID",
                "ppId": "503924593300633",
                "amount": (amount / 100).toFixed(2),
                "ref1": ref1, // ORDER ID
                "ref2": ref2, // USER ID
                "ref3": ref3, // USER ID
            })
        });
        if (!response.ok) return { success: false, error: "Create QR Payment Failed.", a:1 };

        const data = await response.json();
        const createQRdata = await promisePool.query("INSERT INTO payments (created_by, amount, ref1, ref2, qrRawData) VALUES (?, ?, ?, ?, ?)",
            [getSession.userId, amount, ref1, ref2, data.data.qrRawData]
        )

        if (!createQRdata) {
            await promisePool.query("UPDATE payments SET status = 'cancelled' WHERE created_by = ?, ref1 = ?, ref2 = ?", [getSession.user_id, ref1, ref2])
            return {
                success: false,
                a: 2,
                error: "Create QR Payment Failed."
            }
        }

        return {
            success: true,
            qrCode: data.data.qrRawData,
            ref1: ref1,
            ref2: ref2
        };

    } catch (err) {
        console.error("QR Payment Error:", err);
        return {
            success: false,
            a: 3,
            error: "Create QR Payment Failed."
        }
    }
}

function makeid(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}
"use server"

import { getUserSession } from "./session";
import { promisePool } from "@/lib/db";
import { validateCsrfToken } from "@/lib/csrf";

import Stripe from "stripe";
import dayjs from "dayjs";

const stripe = Stripe(process.env.STRIPE_SECRETKEY, {
    apiVersion: "2025-09-30.clover"
})

export async function generateQRPayment(formData) {
    const csrfToken = formData.get("csrfToken")?.toString();
    if (!await validateCsrfToken(csrfToken)) {
        return {
            success: false,
            error: "Invalid CSRF token. Please refresh the page and try again."
        };
    }

    const totalamount = formData.get("totalAmount")?.toString();
    const orderId = formData.get("orderId")?.toString();
    const name = formData.get("name")?.toString();
    const phoneNum = formData.get("phonenumber")?.toString();

    const getSession = await getUserSession();
    if (!getSession) return { success: false, error: "Session not found." }

    try {
        const getInfor = await promisePool.query("SELECT email FROM users WHERE user_id = ? LIMIT 1", [getSession.userId])
        const paymentMethod = await stripe.paymentMethods.create({
            type: "promptpay",
            billing_details: {
                name,
                phone: phoneNum,
                email: getInfor[0][0].email
            }
        });

        var return_url = `https://jakethewitcher.shop/checkout/success?orderId=${orderId}`


        const paymentIntent = await stripe.paymentIntents.create({
            amount: Number(totalamount) * 100,
            currency: "thb",
            payment_method: paymentMethod.id,
            payment_method_types: ["promptpay"],
            confirm: true,
            return_url,
        });

        const paymentID = paymentIntent.id;

        if (paymentIntent.next_action && paymentIntent.next_action.promptpay_display_qr_code) {
            // สร้าง QR Code
            const statementID = `${dayjs().format('YYYYMMDDHHMMss')}${paymentID.slice(paymentID.split("").length - 5, paymentID.split("").length)}`;

            // บันทึกลงฐานข้อมูล
            await promisePool.query("INSERT INTO payments (created_by, order_id, paymentID, statementID, amount) VALUES (?, ?, ?, ?, ?)",
                [getSession.userId, orderId, paymentID, statementID, Number(totalamount).toFixed(2)]
            );

            return {
                success: true,
                message: "Created QR Code successfully.",
                statementID,
                qrData: paymentIntent.next_action.promptpay_display_qr_code.data,
            }
        }
        return {
            success: false,
            error: "QR Code generation failed. Please try again."
        }

    } catch (err) {
        console.error("QR Payment Error:", err);
        return {
            success: false,
            error: "Create QR Payment Failed."
        }
    }
}


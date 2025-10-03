import { headers } from "next/headers";

import Stripe from "stripe";
import dayjs from "dayjs";

import { promisePool } from "@/lib/db";

const stripe = Stripe(process.env.STRIPE_SECRETKEY, {
    apiVersion: "2025-09-30.clover"
});

const webhookIPs = ["3.18.12.63", "3.130.192.231", "13.235.14.237", "13.235.122.149", "18.211.135.69", "35.154.171.200", "52.15.183.38", "54.88.130.119", "54.88.130.237", "54.187.174.169", "54.187.205.235", "54.187.216.72"]
const endpointSecret = "whsec_LWo0o4zkWDdIQlj1ftmdeXbd864fcCMz";

export async function POST(request) {
    try {
        const headersList = await headers()
        const sig = headersList.get('stripe-signature')
        const forwardedFor = headersList.get('x-forwarded-for');

        const clientIP = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown';

        if (!webhookIPs.includes(clientIP)) {
            console.log("Unauthorized IP:", clientIP);
            return new Response(JSON.stringify({ success: false, error: "Forbidden: Unauthorized IP" }), { status: 403 });
        }

        const body = await request.text();
        let event;
        try {
            event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
        } catch (err) {
            console.error(`⚠️ Webhook signature verification failed.`, err.message);
            return new Response(JSON.stringify({ success: false, error: `Webhook Error: ${err.message}` }), { status: 400 });
        }

        const timeAt = dayjs().format('YYYY-MM-DD HH:mm:ss');
        const paymentObject = event.data.object;
        switch (event.type) {
            case 'payment_intent.succeeded':
                await promisePool.query(
                    "UPDATE payments SET status = ?, update_at = ? WHERE paymentID = ?",
                    ['success', timeAt, paymentObject.id]
                );
                break;

            case 'payment_intent.payment_failed':
                await promisePool.query(
                    "UPDATE payments SET status = ?, update_at = ? WHERE paymentID = ?",
                    ['failed', timeAt, paymentObject.id]
                );
                break;

            case 'payment_intent.canceled':
                await promisePool.query(
                    "UPDATE payments SET status = ?, update_at = ? WHERE paymentID = ?",
                    ['cancelled', timeAt, paymentObject.id]
                );
                break;

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        return Response.json({ success: true, received: true });
    } catch (err) {
        console.error('Webhook error:', err);
        return new Response(JSON.stringify({ success: false, error: 'Internal server error' }), { status: 500 });
    }
}
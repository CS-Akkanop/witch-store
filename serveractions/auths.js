"use server";

import bcrypt from "bcrypt";
import { Resend } from "resend";
import { z } from "zod";
import crypto from 'crypto';
import { redirect } from "next/navigation";

import { createSession, deleteSession, getSession } from "@/lib/session";
import { promisePool } from "@/lib/db";
import { validateCsrfToken } from "@/lib/csrf";

// Define the validation schema
const registerSchema = z.object({
    username: z.string().min(5, "Username must be at least 5 characters."),
    email: z.string().email("Invalid email address."),
    password: z.string()
        .min(6, "Password must be at least 6 characters.")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter.")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
        .regex(/[0-9]/, "Password must contain at least one number.")
        .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character."),
    confirmpass: z.string(),
}).refine((data) => data.password === data.confirmpass, {
    message: "Passwords don't match",
    path: ["confirmpass"],
});

const loginSchema = z.object({
    username: z.string().min(5, "Username is required."),
    password: z.string().min(1, "Password is required."),
});

const resetPasswordSchema = z.object({
    newPassword: z.string()
        .min(6, "Password must be at least 6 characters.")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter.")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
        .regex(/[0-9]/, "Password must contain at least one number.")
        .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character."),
})

export async function register(formData) {
    // Extract form data
    const rawData = {
        username: formData.get("username"),
        email: formData.get("email"),
        password: formData.get("password"),
        confirmpass: formData.get("confirmpass"),
    };

    // Validate the data
    const validation = registerSchema.safeParse(rawData);

    if (!validation.success) {
        // Return first error message
        const errors = validation.error.flatten().fieldErrors;
        const firstError = Object.values(errors).flat()[0];
        return {
            success: false,
            error: firstError || "Validation failed",
        };
    }

    const { username, email, password } = validation.data;

    try {
        // Check if email already exists
        const [emailRows] = await promisePool.query(
            "SELECT email FROM users WHERE email = ?",
            [email]
        );

        if (emailRows.length > 0) {
            return {
                success: false,
                error: "Email already registered",
            };
        }

        // Check if username already exists
        const [usernameRows] = await promisePool.query(
            "SELECT username FROM users WHERE username = ?",
            [username]
        );

        if (usernameRows.length > 0) {
            return {
                success: false,
                error: "Username already taken",
            };
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user in database
        const userId = crypto.randomBytes(12).toString('hex')
        await promisePool.query(
            "INSERT INTO users (user_id, username, email, pass_hash) VALUES (?, ?, ?, ?)",
            [userId, username, email, hashedPassword]
        );

        // Return success
        return {
            success: true,
            message: "Registration successful!",
        };

    } catch (error) {
        return {
            success: false,
            error: "Registration failed. Please try again.",
        };
    }
}

export async function login(formData) {
    const csrfToken = formData.get("csrfToken")?.toString();
    if (!await validateCsrfToken(csrfToken)) {
        return {
            success: false,
            error: "Invalid CSRF token. Please refresh the page and try again."
        };
    }

    const rawData = {
        username: formData.get("username"),
        password: formData.get("password"),
    };

    // Validate the data
    const validation = loginSchema.safeParse(rawData);

    if (!validation.success) {
        // Return first error message
        const errors = validation.error.flatten().fieldErrors;
        const firstError = Object.values(errors).flat()[0];
        return {
            success: false,
            error: firstError || "Validation failed",
        };
    }

    const { username, password } = validation.data;
    try {
        const [rows] = await promisePool.query("SELECT user_id, pass_hash FROM users WHERE username = ?", [username])
        if (!rows || rows.length === 0) {
            return {
                success: false,
                error: "Username not found. Please try again"
            }
        }

        const checkPassword = await bcrypt.compare(password, rows[0].pass_hash);
        if (!checkPassword) {
            return {
                success: false,
                error: "Password is not correct."
            }
        }

        await createSession({
            userId: rows[0].user_id,
            username
        });

        return {
            success: true,
            message: "Login successful!",
            user_id: rows[0].user_id
        }
    } catch (err) {
        console.error(err)
        return {
            success: false,
            error: "Login failed. Please try again.",
        };

    }
}

export async function logout(formData) {
    const csrfToken = formData.get("csrfToken")?.toString();
    if (!await validateCsrfToken(csrfToken)) {
        return {
            success: false,
            error: "Invalid CSRF token. Please refresh the page and try again."
        };
    }

    await deleteSession();
    redirect('/');
}

export async function forgetPasswordSend(formData) {
    const email = formData.get("email")?.toString();

    // Validate email
    if (!email) {
        return {
            success: false,
            error: "Email is required"
        };
    }

    try {
        const [rows] = await promisePool.query(
            "SELECT email, username FROM users WHERE email = ? LIMIT 1",
            [email]
        );

        if (!rows || rows.length === 0) {
            return {
                success: false,
                error: "Email not found. Please try again"
            };
        }

        const data = rows[0];
        const resend = new Resend(process.env.RESEND_APIKEY);

        const reset_password_token = crypto.randomBytes(32).toString("hex");

        const expiredDate = new Date(Date.now() + 3600 * 1000); // 3600 seconds = 1 hour

        await promisePool.query(
            "DELETE FROM `forget-password` WHERE email = ?",
            [data.email]
        );

        await promisePool.query(
            "INSERT INTO `forget-password` (`reset-token`, email, expired_date) VALUES (?, ?, ?)",
            [reset_password_token, data.email, expiredDate]
        );

        const resetUrl = `${process.env.DOMAIN}/forgot-password?token=${reset_password_token}`;

        const html = `
            <div style="font-family: Arial, sans-serif; background-color: #f5f6fa; padding: 20px;">
            <div style="max-width: 480px; margin: auto; background: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
                <h2 style="color: #333;">Reset Your Password</h2>
                <p>Hi ${data.username || 'there'},</p>
                <p>We received a request to reset your password. Click the button below to set a new one:</p>
                <a href="${resetUrl}" style="display: inline-block; background-color: #007bff; color: white; text-decoration: none; padding: 12px 20px; border-radius: 6px; font-weight: bold;">Reset Password</a>
                <p style="margin-top: 20px; color: #666; font-size: 14px;">This link will expire in 1 hour.</p>
                <p style="margin-top: 20px;">If you didn't request a password reset, you can ignore this email.</p>
                <p>Thanks,<br>Jake the Witcher</p>
            </div>
            </div>
        `;

        await resend.emails.send({
            from: 'Jake the Witcher <password@jakethewitcher.shop>',
            to: [data.email],
            subject: "Password Reset",
            html
        });

        return {
            success: true,
            message: "We've sent a password reset link to your email."
        };

    } catch (err) {
        console.error("Forget password error:", err);
        return {
            success: false,
            error: "Password reset request failed. Please try again."
        };
    }
}

export async function resetPassword(formData) {
    const newPassword = formData.get("newPassword")?.toString();
    const passwordToken = formData.get("passwordToken")?.toString();

    const validation = resetPasswordSchema.safeParse({ newPassword });

    if (!validation.success) {
        // Return first error message
        const errors = validation.error.flatten().fieldErrors;
        const firstError = Object.values(errors).flat()[0];
        return {
            success: false,
            error: firstError || "Validation failed",
        };
    }

    try {
        // Check if token exists and get associated email
        const [rows1] = await promisePool.query(
            "SELECT `reset-token`, email FROM `forget-password` WHERE `reset-token` = ? LIMIT 1",
            [passwordToken]
        );

        if (!rows1 || rows1.length === 0) {
            return {
                success: false,
                error: "Invalid or expired token. Please request a new password reset."
            };
        }

        const email = rows1[0].email;

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const [rows2] = await promisePool.query(
            "UPDATE users SET pass_hash = ? WHERE email = ?",
            [hashedPassword, email]
        );

        if (rows2.affectedRows === 0) {
            return {
                success: false,
                error: "User not found. Please try again."
            };
        }

        await promisePool.query(
            "DELETE FROM `forget-password` WHERE `reset-token` = ?",
            [passwordToken]
        );

        return {
            success: true,
            message: "Password reset successfully. You can now log in with your new password."
        };

    } catch (err) {
        console.error("Password reset error:", err);
        return {
            success: false,
            error: "Password reset failed. Please try again."
        };
    }
}

export async function getCurrentUser() {
    const session = await getSession();
    return session?.user || null;
}
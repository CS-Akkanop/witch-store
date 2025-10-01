"use server";

import bcrypt from "bcrypt";
import { success, z } from "zod";
import { v1 } from "uuid";

import { createSession, deleteSession, getSession } from "@/lib/session";
import { promisePool } from "@/lib/db";

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
        await promisePool.query(
            "INSERT INTO users (user_id, username, email, pass_hash) VALUES (?, ?, ?, ?)",
            [v1(), username, email, hashedPassword]
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

        const checkPassword = await bcrypt.compareSync(password, rows[0].pass_hash);
        if (!checkPassword) {
            return {
                success: false,
                error: "Password is not correct."
            }
        }

        await createSession({
            userId: rows[0].user_id,
        });

        return {
            success: true,
            message: "Login successful!",
            user_id: rows[0].user_id
        }
    } catch (err) {
        console.log(err)
        return {
            success: false,
            error: "Login failed. Please try again.",
        };

    }
}

export async function logout() {
    await deleteSession();
    redirect('/login');
}

export async function getCurrentUser() {
    const session = await getSession();
    return session?.user || null;
}
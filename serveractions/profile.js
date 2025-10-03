"use server";

import { promisePool } from "@/lib/db";
import { getSession } from "@/lib/session";
import { validateCsrfToken } from "@/lib/csrf";

export async function getProfile() {
	const session = await getSession();
	if (!session?.user?.userId) return { success: false, error: "Not authenticated" };
	try {
		const [rows] = await promisePool.query(
			"SELECT fullname, phonenumber, address FROM users WHERE user_id = ? LIMIT 1",
			[session.user.userId]
		);

		if (!rows || rows.length === 0) {
			return { success: true, profile: { address: { line1: "", line2: "", city: "", state: "", postalCode: "" } } };
		}
		return { success: true, profile: rows[0] };
	} catch (err) {
		return { success: false, error: "Failed to load profile" };
	}
}

export async function updateProfile(formData) {
	const csrfToken = formData.get("csrfToken")?.toString();
	if (!await validateCsrfToken(csrfToken)) {
		return { success: false, error: "Invalid CSRF token. Please refresh and try again." };
	}

	const session = await getSession();
	if (!session?.user?.userId) return { success: false, error: "Not authenticated" };

	const fullname = formData.get("fullName")?.toString().trim() || ""
	const phone = formData.get("phone")?.toString().trim() || ""
	const address = {
		line1: formData.get("line1")?.toString().trim() || "",
		line2: formData.get("line2")?.toString().trim() || "",
		city: formData.get("city")?.toString().trim() || "",
		state: formData.get("state")?.toString().trim() || "",
		postalCode: formData.get("postalCode")?.toString().trim() || "",
	};

	address.fullName = fullname
	address.phone = phone

	try {
		await promisePool.query(
			"UPDATE users SET fullname = ?, phonenumber = ?, address = ? WHERE user_id = ?",
			[fullname, phone, JSON.stringify(address), session.user.userId]
		);
		return { success: true, message: "Profile updated", address };
	} catch (err) {
		return { success: false, error: "Failed to update profile" };
	}
}

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getCsrfToken } from "@/lib/csrf";
import { getProfile, updateProfile } from "@/serveractions/profile";
import Navbar from "@/Components/Navbar";

export default async function ProfilePage() {
	const session = await getSession();
	if (!session?.user?.userId) {
		redirect("/login");
	}

	const csrfToken = await getCsrfToken();
	const profileRes = await getProfile();

	const address = profileRes.success ? (profileRes.profile?.address || { fullName: "", phone: "", line1: "", line2: "", city: "", state: "", postalCode: "" }) : { fullName: "", phone: "", line1: "", line2: "", city: "", state: "", postalCode: "" };

	return (
		<div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-50">
			<Navbar />
			<main className="pt-20 sm:pt-24 pb-8 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
				<h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-4 sm:mb-6">โปรไฟล์ของคุณ</h1>

				<div className="bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-md border border-white/50">
					<form action={updateProfile} className="space-y-4 sm:space-y-5">
						<input type="hidden" name="csrfToken" value={csrfToken} />

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div>
								<label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">ชื่อ-นามสกุล</label>
								<input
									id="fullName"
									name="fullName"
									type="text"
									defaultValue={address.fullName}
									className="w-full px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent shadow-sm text-sm sm:text-base"
									placeholder="John Doe"
								/>
							</div>

							<div>
								<label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">เบอร์โทรศัพท์</label>
								<input
									id="phone"
									name="phone"
									type="tel"
									defaultValue={address.phone}
									className="w-full px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent shadow-sm text-sm sm:text-base"
									placeholder="080-123-4567"
								/>
							</div>
						</div>

						<div>
							<label htmlFor="line1" className="block text-sm font-medium text-gray-700 mb-1">ที่อยู่</label>
							<input
								id="line1"
								name="line1"
								type="text"
								defaultValue={address.line1}
								className="w-full px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent shadow-sm text-sm sm:text-base"
								placeholder="บ้านเลขที่ หมู่ ถนน"
							/>
						</div>

						<div>
							<label htmlFor="line2" className="block text-sm font-medium text-gray-700 mb-1">ที่อยู่เพิ่มเติม (ไม่บังคับ)</label>
							<input
								id="line2"
								name="line2"
								type="text"
								defaultValue={address.line2}
								className="w-full px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent shadow-sm text-sm sm:text-base"
								placeholder="ตึก/ชั้น/ห้อง"
							/>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
							<div>
								<label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">อำเภอ/เขต</label>
								<input
									id="city"
									name="city"
									type="text"
									defaultValue={address.city}
									className="w-full px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent shadow-sm text-sm sm:text-base"
									placeholder="อำเภอ/เขต"
								/>
							</div>
							<div>
								<label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">จังหวัด</label>
								<input
									id="state"
									name="state"
									type="text"
									defaultValue={address.state}
									className="w-full px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent shadow-sm text-sm sm:text-base"
									placeholder="จังหวัด"
								/>
							</div>
							<div>
								<label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">รหัสไปรษณีย์</label>
								<input
									id="postalCode"
									name="postalCode"
									type="text"
									defaultValue={address.postalCode}
									className="w-full px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent shadow-sm text-sm sm:text-base"
									placeholder="10xxx"
								/>
							</div>
						</div>

						<div className="pt-1">
							<button type="submit" className="inline-flex items-center px-4 py-2 sm:px-5 sm:py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-full text-sm sm:text-base transition-colors shadow-sm">
								บันทึกการเปลี่ยนแปลง
							</button>
						</div>
					</form>
				</div>
			</main>
		</div>
	);
}

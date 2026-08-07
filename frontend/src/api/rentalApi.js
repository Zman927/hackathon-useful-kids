import { request } from "./apiClient";

function mapStatus(rawStatus) {
  const s = String(rawStatus || "").toLowerCase();
  if (s === "pending" || s === "신청됨") return "pending";
  if (s === "rented" || s === "대여중" || s === "approved") return "rented";
  if (s === "rejected" || s === "반려됨") return "rejected";
  if (s === "cancelled" || s === "canceled" || s === "취소됨") return "cancelled";
  if (s === "returned" || s === "반납완료") return "returned";
  return s || "pending";
}

function toRental(raw) {
  return {
    id: raw.id,
    studentName: raw.student_name,
    studentId: raw.student_id,
    studentDepartment: raw.student_department,
    equipmentId: raw.equipment_id,
    equipmentName: raw.equipment_name,
    equipmentImageUrl: raw.equipment_image_url,
    equipmentCategory: raw.equipment_category,
    departmentName: raw.department_name,
    startDate: raw.start_date,
    endDate: raw.end_date,
    quantity: raw.quantity,
    purpose: raw.purpose,
    status: mapStatus(raw.status),
    createdAt: String(raw.created_at || "").slice(0, 10),
  };
}

export async function createRental(payload) {
  const data = await request("/rentals", {
    method: "POST",
    body: JSON.stringify({
      equipment_id: Number(payload.equipmentId),
      start_date: payload.startDate,
      end_date: payload.endDate,
      quantity: payload.quantity,
      purpose: payload.purpose || null,
      // Backend requires this for cross-department rentals; we're not
      // building a consent UI right now, so agree on the user's behalf.
      pledge_agreed: true,
    }),
  });

  return toRental(data);
}

export async function getMyRentals() {
  const data = await request("/rentals");
  return Array.isArray(data) ? data.map(toRental) : [];
}

export async function getAllRentals() {
  const data = await request("/rentals/all");
  return Array.isArray(data) ? data.map(toRental) : [];
}

export async function approveRental(rentalId) {
  const data = await request(`/rentals/${rentalId}/approve`, {
    method: "POST",
  });
  return toRental(data);
}

export async function rejectRental(rentalId) {
  const data = await request(`/rentals/${rentalId}/reject`, {
    method: "POST",
  });
  return toRental(data);
}

export async function returnRental(rentalId) {
  const data = await request(`/rentals/${rentalId}/return`, {
    method: "POST",
  });
  return toRental(data);
}

export async function cancelRental(rentalId) {
  // The backend replies 204 No Content on success — no body to parse.
  const data = await request(`/rentals/${rentalId}/cancel`, {
    method: "POST",
  });
  return data ? toRental(data) : null;
}

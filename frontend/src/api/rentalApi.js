import { request } from "./apiClient";

function toRental(raw) {
  return {
    id: raw.id,
    equipmentId: raw.equipment_id,
    equipmentName: raw.equipment_name,
    startDate: raw.start_date,
    endDate: raw.end_date,
    quantity: raw.quantity,
    purpose: raw.purpose,
    status: raw.status,
    createdAt: raw.created_at,
  };
}

export async function createRental(payload) {
  const data = await request("/rentals", {
    method: "POST",
    body: JSON.stringify({
      equipment_id: payload.equipmentId,
      start_date: payload.startDate,
      end_date: payload.endDate,
      quantity: payload.quantity,
      purpose: payload.purpose,
    }),
  });

  return toRental(data);
}

export async function getMyRentals(userId) {
  const data = await request(`/rentals?user_id=${userId}`);
  return data.map(toRental);
}

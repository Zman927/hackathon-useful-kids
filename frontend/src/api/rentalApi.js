import { request } from "./apiClient";
import { mockRentals } from "./mockData";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

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
  if (USE_MOCK) {
    return {
      id: Date.now(),
      equipmentId: Number(payload.equipmentId),
      equipmentName:
        mockRentals.find(
          (rental) => rental.equipmentId === Number(payload.equipmentId),
        )?.equipmentName ?? "기자재",
      startDate: payload.startDate,
      endDate: payload.endDate,
      quantity: payload.quantity,
      purpose: payload.purpose,
      status: "pending",
      createdAt: new Date().toISOString().slice(0, 10),
    };
  }

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
  if (USE_MOCK) {
    return mockRentals;
  }

  const data = await request(`/rentals?user_id=${userId}`);
  return data.map(toRental);
}

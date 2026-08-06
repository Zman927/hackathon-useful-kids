import { request } from "./apiClient";
import { mockEquipmentList, mockRentals } from "./mockData";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

function toRental(raw) {
  return {
    id: raw.id,
    equipmentId: raw.equipment_id,
    equipmentName: raw.equipment_name,
    equipmentImageUrl: raw.equipment_image_url,
    equipmentCategory: raw.equipment_category,
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
    const equipment = mockEquipmentList.find(
      (item) => item.id === Number(payload.equipmentId),
    );
    const newRental = {
      id: Date.now(),
      equipmentId: Number(payload.equipmentId),
      equipmentName: equipment?.name ?? "기자재",
      equipmentImageUrl: equipment?.imageUrl,
      equipmentCategory: equipment?.category,
      startDate: payload.startDate,
      endDate: payload.endDate,
      quantity: payload.quantity,
      purpose: payload.purpose,
      status: "pending",
      createdAt: new Date().toISOString().slice(0, 10),
    };
    mockRentals.unshift(newRental);
    return newRental;
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

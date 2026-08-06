import { request } from "./apiClient";
import { mockEquipmentList } from "./mockData";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

function toEquipment(raw) {
  return {
    id: raw.id,
    name: raw.name,
    imageUrl: raw.image_url,
    category: raw.category,
    description: raw.description,
    departmentId: raw.department_id,
    isAvailable: raw.is_available,
  };
}

export async function getEquipmentList(departmentId) {
  if (USE_MOCK) {
    return mockEquipmentList.filter(
      (equipment) => equipment.departmentId === departmentId,
    );
  }

  const data = await request(`/equipment?department_id=${departmentId}`);
  return data.map(toEquipment);
}

export async function getEquipmentDetail(equipmentId) {
  if (USE_MOCK) {
    const found = mockEquipmentList.find(
      (equipment) => equipment.id === Number(equipmentId),
    );
    if (!found) {
      throw new Error("Equipment not found");
    }
    return found;
  }

  const data = await request(`/equipment/${equipmentId}`);
  return toEquipment(data);
}

import { request } from "./apiClient";

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
  const data = await request(`/equipment?department_id=${departmentId}`);
  return data.map(toEquipment);
}

export async function getEquipmentDetail(equipmentId) {
  const data = await request(`/equipment/${equipmentId}`);
  return toEquipment(data);
}

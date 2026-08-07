import { request } from "./apiClient";
import { getDepartmentName } from "../components/equipment/DepartmentSelect";

function toEquipment(raw) {
  return {
    id: raw.id,
    name: raw.name,
    imageUrl: raw.image_url,
    category: raw.category,
    description: raw.description,
    departmentId: raw.department_id,
    departmentName: getDepartmentName(raw.department_id),
    isAvailable: raw.is_available,
    remainingQuantity: raw.remaining_quantity,
    totalQuantity: raw.total_quantity,
  };
}

export async function getEquipmentList(departmentId) {
  const path = departmentId
    ? `/equipment?department_id=${departmentId}`
    : "/equipment";
  const data = await request(path);
  return Array.isArray(data) ? data.map(toEquipment) : [];
}

export async function getEquipmentDetail(equipmentId) {
  const data = await request(`/equipment/${equipmentId}`);
  return toEquipment(data);
}

export async function addEquipment(payload) {
  const formData = new FormData();
  formData.append("name", payload.name);
  formData.append("department_id", String(payload.departmentId));
  formData.append("total_quantity", String(payload.totalQuantity));
  if (payload.category) {
    formData.append("category", payload.category);
  }
  if (payload.description) {
    formData.append("description", payload.description);
  }
  if (payload.imageFile) {
    formData.append("image", payload.imageFile);
  }

  const data = await request("/equipment", {
    method: "POST",
    body: formData,
  });

  return toEquipment(data);
}

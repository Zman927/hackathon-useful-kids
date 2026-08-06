import { request } from "./apiClient";
import { mockEquipmentList } from "./mockData";
import { DEPARTMENTS } from "../components/equipment/DepartmentSelect";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

export function getDepartmentName(departmentId) {
  const found = DEPARTMENTS.find((d) => d.id === Number(departmentId));
  return found ? found.name : "공과대학";
}

function toEquipment(raw) {
  const deptId = raw.department_id ?? raw.departmentId;
  return {
    id: raw.id,
    name: raw.name,
    imageUrl: raw.image_url ?? raw.imageUrl,
    category: raw.category,
    description: raw.description,
    departmentId: deptId,
    departmentName: getDepartmentName(deptId),
    isAvailable: raw.is_available ?? raw.isAvailable,
    remainingQuantity: raw.remaining_quantity ?? raw.remainingQuantity ?? 5,
    totalQuantity: raw.total_quantity ?? raw.totalQuantity ?? 5,
  };
}

export async function getEquipmentList(departmentId) {
  if (USE_MOCK) {
    const list = departmentId
      ? mockEquipmentList.filter((equipment) => equipment.departmentId === departmentId)
      : mockEquipmentList;
    return list.map(toEquipment);
  }

  const path = departmentId ? `/equipment?department_id=${departmentId}` : `/equipment`;
  const data = await request(path);
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
    return toEquipment(found);
  }

  const data = await request(`/equipment/${equipmentId}`);
  return toEquipment(data);
}

export async function addEquipment(payload) {
  if (USE_MOCK) {
    const totalQty = Number(payload.totalQuantity) || 1;
    const newEquipment = {
      id: Date.now(),
      name: payload.name,
      imageUrl:
        payload.imageUrl ||
        "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=60",
      category: payload.category,
      description: payload.description || "",
      departmentId: Number(payload.departmentId),
      isAvailable: true,
      totalQuantity: totalQty,
      remainingQuantity: totalQty,
    };
    mockEquipmentList.unshift(newEquipment);
    return toEquipment(newEquipment);
  }

  const data = await request("/equipment", {
    method: "POST",
    body: JSON.stringify({
      name: payload.name,
      image_url: payload.imageUrl,
      category: payload.category,
      description: payload.description,
      department_id: Number(payload.departmentId),
      total_quantity: Number(payload.totalQuantity),
    }),
  });

  return toEquipment(data);
}

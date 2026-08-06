import { request } from "./apiClient";
import { mockEquipmentList, mockRentals } from "./mockData";
import { getDepartmentName } from "./equipmentApi";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

function todayLocalDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toRental(raw) {
  let deptName = raw.department_name ?? raw.departmentName;
  if (!deptName && (raw.equipment_id || raw.equipmentId)) {
    const eq = mockEquipmentList.find(
      (item) => item.id === Number(raw.equipment_id ?? raw.equipmentId),
    );
    if (eq) {
      deptName = getDepartmentName(eq.departmentId);
    }
  }

  return {
    id: raw.id,
    studentName: raw.studentName ?? raw.student_name ?? "홍길동",
    studentId: raw.studentId ?? raw.student_id ?? "2021-12345",
    studentDepartment:
      raw.studentDepartment ?? raw.student_department ?? deptName ?? "컴퓨터공학과",
    equipmentId: raw.equipment_id ?? raw.equipmentId,
    equipmentName: raw.equipment_name ?? raw.equipmentName,
    equipmentImageUrl: raw.equipment_image_url ?? raw.equipmentImageUrl,
    equipmentCategory: raw.equipment_category ?? raw.equipmentCategory,
    departmentName: deptName ?? "공과대학",
    startDate: raw.start_date ?? raw.startDate,
    endDate: raw.end_date ?? raw.endDate,
    quantity: raw.quantity,
    purpose: raw.purpose,
    status: raw.status,
    createdAt: (raw.created_at ?? raw.createdAt ?? "").slice(0, 10),
  };
}

export async function createRental(payload) {
  if (USE_MOCK) {
    const equipment = mockEquipmentList.find(
      (item) => item.id === Number(payload.equipmentId),
    );
    const quantityToDeduct = Number(payload.quantity) || 1;

    if (equipment) {
      equipment.remainingQuantity = Math.max(
        0,
        (equipment.remainingQuantity ?? 5) - quantityToDeduct,
      );
      if (equipment.remainingQuantity === 0) {
        equipment.isAvailable = false;
      }
    }

    const newRental = {
      id: Date.now(),
      studentName: payload.userName || "홍길동",
      studentId: payload.userId || "2023-10001",
      studentDepartment: getDepartmentName(equipment?.departmentId),
      equipmentId: Number(payload.equipmentId),
      equipmentName: equipment?.name ?? "기자재",
      equipmentImageUrl: equipment?.imageUrl,
      equipmentCategory: equipment?.category,
      departmentName: getDepartmentName(equipment?.departmentId),
      startDate: payload.startDate,
      endDate: payload.endDate,
      quantity: quantityToDeduct,
      purpose: payload.purpose,
      status: "pending",
      createdAt: todayLocalDateString(),
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
    return mockRentals.map(toRental);
  }

  const data = await request(`/rentals?user_id=${userId}`);
  return data.map(toRental);
}

export async function getAllRentals() {
  if (USE_MOCK) {
    return mockRentals.map(toRental);
  }

  const data = await request("/rentals/all");
  return data.map(toRental);
}

export async function approveRental(rentalId) {
  if (USE_MOCK) {
    const rental = mockRentals.find((r) => r.id === rentalId);
    if (rental) {
      rental.status = "rented";
    }
    return { success: true };
  }

  return await request(`/rentals/${rentalId}/approve`, {
    method: "POST",
  });
}

export async function rejectRental(rentalId) {
  if (USE_MOCK) {
    const index = mockRentals.findIndex((r) => r.id === rentalId);
    if (index !== -1) {
      const removed = mockRentals[index];
      removed.status = "rejected";
      const equipment = mockEquipmentList.find(
        (item) => item.id === Number(removed.equipmentId),
      );
      if (equipment) {
        equipment.remainingQuantity =
          (equipment.remainingQuantity ?? 0) + (removed.quantity || 1);
        if (equipment.remainingQuantity > 0) {
          equipment.isAvailable = true;
        }
      }
    }
    return { success: true };
  }

  return await request(`/rentals/${rentalId}/reject`, {
    method: "POST",
  });
}

export async function cancelRental(rentalId) {
  if (USE_MOCK) {
    const index = mockRentals.findIndex((r) => r.id === rentalId);
    if (index !== -1) {
      const removed = mockRentals[index];
      const equipment = mockEquipmentList.find(
        (item) => item.id === Number(removed.equipmentId),
      );
      if (equipment) {
        equipment.remainingQuantity =
          (equipment.remainingQuantity ?? 0) + (removed.quantity || 1);
        if (equipment.remainingQuantity > 0) {
          equipment.isAvailable = true;
        }
      }
      mockRentals.splice(index, 1);
    }
    return { success: true };
  }

  return await request(`/rentals/${rentalId}/cancel`, {
    method: "POST",
  });
}

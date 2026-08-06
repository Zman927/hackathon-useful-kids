import client from "./client";

export async function getDepartments() {
  const { data } = await client.get("/departments");
  return data;
}

export async function getEquipment(department) {
  const { data } = await client.get("/equipment", {
    params: department ? { department } : {},
  });
  return data;
}

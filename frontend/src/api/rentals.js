import client from "./client";

export async function createRental(payload) {
  const { data } = await client.post("/rentals", payload);
  return data;
}

export async function getRentals(status) {
  const { data } = await client.get("/rentals", {
    params: status ? { status } : {},
  });
  return data;
}

export async function approveRental(id) {
  const { data } = await client.patch(`/rentals/${id}/approve`);
  return data;
}

export async function rejectRental(id) {
  const { data } = await client.patch(`/rentals/${id}/reject`);
  return data;
}

export async function returnRental(id) {
  const { data } = await client.patch(`/rentals/${id}/return`);
  return data;
}

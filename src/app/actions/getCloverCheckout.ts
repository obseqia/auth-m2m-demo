"use server";

import { getM2MToken } from "@/lib/auth";

function getBackendEndpoint(): string {
  const endpoint = process.env.BACKEND_ENDPOINT;

  if (!endpoint) {
    throw new Error("Missing BACKEND_ENDPOINT environment variable");
  }

  return endpoint.replace(/\/$/, "");
}

export async function getRestaurantCheckoutClover(id: string) {
  if (!id) {
    throw new Error("Missing checkout id");
  }

  const backendEndpoint = getBackendEndpoint();
  const url = `${backendEndpoint}/restaurant/checkout/clover/${encodeURIComponent(id)}`;

  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${await getM2MToken()}`,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch clover checkout (${response.status} ${response.statusText})`,
    );
  }

  return response.json();
}

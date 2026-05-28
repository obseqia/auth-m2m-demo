import "server-only";
import { createClerkClient } from "@clerk/backend";

type CachedToken = {
  accessToken: string;
  expiresAt: number;
};

let cachedToken: CachedToken | null = null;
let refreshPromise: Promise<string> | null = null;

const REFRESH_SKEW_MS = 5_000; // refrescar 5 segundos antes

export async function getM2MToken(): Promise<string> {
  const now = Date.now();

  if (cachedToken && cachedToken.expiresAt - REFRESH_SKEW_MS > now) {
    return cachedToken.accessToken;
  }

  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = fetchNewM2MToken()
    .then((token) => {
      if (token) {
        cachedToken = token;
        return token.accessToken;
      }
      throw new Error("Failed to fetch M2M token");
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

const client = createClerkClient({
  machineSecretKey: process.env.CLERK_MACHINE_SECRET_KEY,
});

async function fetchNewM2MToken(): Promise<CachedToken | null> {
  console.time("getClerkMachineToken");
  const secretKey = process.env.CLERK_MACHINE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("Missing CLERK_MACHINE_SECRET_KEY environment variable");
  }

  const { token, expiration } = await client.m2m.createToken({
    secondsUntilExpiration: 10,
    tokenFormat: "jwt",
    claims: {
      permissions: ["read:users", "read:orders"],
    }
  });
  console.debug("Generated Clerk new M2M token:", { token, expiration });

  console.timeEnd("getClerkMachineToken");
  return token ? { accessToken: token, expiresAt: expiration ?? 0 } : null;
}

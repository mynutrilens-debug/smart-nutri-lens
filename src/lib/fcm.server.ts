// Server-only Firebase Cloud Messaging sender (HTTP v1 API).
// Requires the FIREBASE_SERVICE_ACCOUNT secret: the full service-account JSON
// downloaded from Firebase Console → Project settings → Service accounts.
import process from "node:process";

type ServiceAccount = {
  project_id: string;
  client_email: string;
  private_key: string;
};

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

function readServiceAccount(): ServiceAccount | null {
  const raw =
    process.env.FIREBASE_SERVICE_ACCOUNT ||
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON ||
    "";
  if (!raw) return null;
  try {
    const json = raw.trim().startsWith("{")
      ? JSON.parse(raw)
      : JSON.parse(Buffer.from(raw, "base64").toString("utf8"));
    if (!json.client_email || !json.private_key || !json.project_id) return null;
    return json as ServiceAccount;
  } catch {
    return null;
  }
}

export function isFcmConfigured() {
  return readServiceAccount() !== null;
}

function b64url(input: ArrayBuffer | string) {
  const bytes =
    typeof input === "string"
      ? new TextEncoder().encode(input)
      : new Uint8Array(input);
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function pemToArrayBuffer(pem: string) {
  const body = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const binary = atob(body);
  const buf = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) buf[i] = binary.charCodeAt(i);
  return buf.buffer;
}

let tokenCache: { token: string; expiresAt: number } | null = null;

async function getAccessToken(sa: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (tokenCache && tokenCache.expiresAt - 60 > now) return tokenCache.token;

  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  );
  const signingInput = `${header}.${claim}`;

  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(sa.private_key.replace(/\\n/g, "\n")),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(signingInput),
  );
  const jwt = `${signingInput}.${b64url(sig)}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  if (!res.ok) throw new Error(`FCM auth failed: ${await res.text()}`);
  const json = (await res.json()) as { access_token: string; expires_in: number };
  tokenCache = { token: json.access_token, expiresAt: now + json.expires_in };
  return json.access_token;
}

/**
 * Sends one notification to one device token.
 * Returns "ok", "invalid" (token should be deleted) or "error".
 */
export async function sendFcmToToken(
  deviceToken: string,
  payload: PushPayload,
): Promise<"ok" | "invalid" | "error" | "unconfigured"> {
  const sa = readServiceAccount();
  if (!sa) return "unconfigured";
  const url = payload.url || "/home";
  try {
    const accessToken = await getAccessToken(sa);
    const res = await fetch(
      `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${accessToken}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          message: {
            token: deviceToken,
            notification: { title: payload.title, body: payload.body },
            data: { url, tag: payload.tag ?? "" },
            android: {
              priority: "HIGH",
              notification: {
                icon: "ic_stat_icon",
                color: "#22e5a0",
                click_action: "FLUTTER_NOTIFICATION_CLICK",
              },
            },
            apns: {
              payload: { aps: { sound: "default", badge: 1 } },
            },
            webpush: {
              notification: {
                icon: "/icon-192.png",
                badge: "/icon-192.png",
                tag: payload.tag ?? undefined,
              },
              fcm_options: { link: url },
            },
          },
        }),
      },
    );
    if (res.ok) return "ok";
    const text = await res.text();
    if (
      res.status === 404 ||
      text.includes("UNREGISTERED") ||
      text.includes("INVALID_ARGUMENT")
    ) {
      return "invalid";
    }
    console.error("[fcm] send failed", res.status, text);
    return "error";
  } catch (e) {
    console.error("[fcm] send error", e);
    return "error";
  }
}

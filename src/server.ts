import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => ((m as { default?: ServerEntry }).default ?? (m as unknown as ServerEntry)),
    );
  }
  return serverEntryPromise;
}

function brandedErrorResponse(): Response {
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isCatastrophicSsrErrorBody(body: string, responseStatus: number): boolean {
  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return false;
  }

  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    return false;
  }

  const fields = payload as Record<string, unknown>;
  const expectedKeys = new Set(["message", "status", "unhandled"]);
  if (!Object.keys(fields).every((key) => expectedKeys.has(key))) {
    return false;
  }

  return (
    fields.unhandled === true &&
    fields.message === "HTTPError" &&
    (fields.status === undefined || fields.status === responseStatus)
  );
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isCatastrophicSsrErrorBody(body, response.status)) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return brandedErrorResponse();
}

// Allow the Capacitor webview origins (https://localhost, capacitor://localhost)
// plus any localhost dev origin to call server functions and API routes
// cross-origin. Any other origin gets no CORS headers (same-origin only).
const ALLOWED_ORIGIN_PATTERNS = [
  /^https?:\/\/localhost(?::\d+)?$/,
  /^capacitor:\/\/localhost$/,
  /^ionic:\/\/localhost$/,
];

function isCorsPath(pathname: string): boolean {
  return pathname.startsWith("/_serverFn") || pathname.startsWith("/api/");
}

function allowedOrigin(origin: string | null): string | null {
  if (!origin) return null;
  return ALLOWED_ORIGIN_PATTERNS.some((re) => re.test(origin)) ? origin : null;
}

function corsHeadersFor(request: Request): Record<string, string> {
  const origin = allowedOrigin(request.headers.get("origin"));
  if (!origin) return {};
  const reqHeaders = request.headers.get("access-control-request-headers");
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers":
      reqHeaders ?? "Content-Type, Authorization, X-Requested-With, Accept, Origin",
    "Access-Control-Expose-Headers":
      "Content-Type, X-Tss-Serialized, x-tss-serialized, X-Tss-Raw-Response, x-tss-raw-response, x-tsr-serverFn",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function withCors(response: Response, cors: Record<string, string>): Response {
  if (!Object.keys(cors).length) return response;
  const headers = new Headers(response.headers);
  for (const [k, v] of Object.entries(cors)) headers.set(k, v);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const url = new URL(request.url);
    const needsCors = isCorsPath(url.pathname);
    const cors = needsCors ? corsHeadersFor(request) : {};

    // Handle preflight before hitting the app handler.
    if (needsCors && request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      const normalized = await normalizeCatastrophicSsrResponse(response);
      return withCors(normalized, cors);
    } catch (error) {
      console.error(error);
      return withCors(brandedErrorResponse(), cors);
    }
  },
};

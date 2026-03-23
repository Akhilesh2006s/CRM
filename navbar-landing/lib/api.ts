export const LOCAL_API_BASE_URL = "http://localhost:5001";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  LOCAL_API_BASE_URL;

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api${path}`, {
      ...options,
      headers,
      cache: "no-store",
    });

    if (!res.ok) {
      let message = "Request failed";
      let details = null;
      try {
        const data = await res.json();
        // Check for error, message, or details fields
        message = data?.error || data?.message || message;
        details = data?.details || null;
      } catch (_) {}
      
      // Include details in error message if available
      const errorMessage = details ? `${message}\n\n${details}` : message;
      const error = new Error(errorMessage);
      (error as any).status = res.status;
      (error as any).details = details;
      throw error;
    }

    return (await res.json()) as T;
  } catch (error: any) {
    // Handle network errors (backend not running, CORS, etc.)
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error(
        `Cannot connect to backend server at ${API_BASE_URL}. Please make sure the backend is running.`
      );
    }
    // Re-throw other errors as-is
    throw error;
  }
}

const LOCAL_UPLOAD_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

function uploadsApiOrigin(): string {
  return LOCAL_UPLOAD_API_BASE_URL.replace(/\/$/, "");
}

function stripAirPlayPortFromUploadUrl(url: string): string {
  // AirPlay receiver hijacks port 5000 on macOS — rewrite to configured port
  try {
    const u = new URL(url);
    if (
      (u.hostname === "localhost" || u.hostname === "127.0.0.1") &&
      u.port === "5000"
    ) {
      return url.replace(
        ":5000",
        `:${new URL(LOCAL_UPLOAD_API_BASE_URL).port || "5001"}`
      );
    }
  } catch {}
  return url;
}

export function resolveUploadUrl(url: string | null | undefined): string {
  if (url == null || typeof url !== "string") return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("data:") || trimmed.startsWith("blob:")) return trimmed;
  if (trimmed.startsWith("uploads/")) {
    return stripAirPlayPortFromUploadUrl(`${uploadsApiOrigin()}/${trimmed}`);
  }
  if (trimmed.startsWith("/uploads/")) {
    return stripAirPlayPortFromUploadUrl(`${uploadsApiOrigin()}${trimmed}`);
  }
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      const u = new URL(trimmed);
      if (u.pathname.startsWith("/uploads/")) {
        return stripAirPlayPortFromUploadUrl(
          `${uploadsApiOrigin()}${u.pathname}${u.search}${u.hash}`
        );
      }
    } catch {}
    return stripAirPlayPortFromUploadUrl(trimmed);
  }
  if (/^po-\d+-\d+\.[a-z0-9]+$/i.test(trimmed)) {
    return stripAirPlayPortFromUploadUrl(
      `${uploadsApiOrigin()}/uploads/po/${trimmed}`
    );
  }
  return stripAirPlayPortFromUploadUrl(trimmed);
}



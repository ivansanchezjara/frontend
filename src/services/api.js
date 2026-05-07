import Cookies from "js-cookie";

export const getApiUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:8000`;
  }
  return "http://127.0.0.1:8000";
};

export const BASE_URL = getApiUrl();
export const API_URL = `${BASE_URL}/api`;

export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = "ApiError";
  }
}

export function authHeaders(extraHeaders = {}) {
  const token = Cookies.get("token");
  return {
    Authorization: `Bearer ${token}`,
    ...extraHeaders,
  };
}

export function jsonHeaders() {
  return authHeaders({ "Content-Type": "application/json" });
}

// Helper para limpiar parámetros vacíos en queries
export function toQueryString(params) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== "") {
      query.append(key, val);
    }
  });
  const str = query.toString();
  return str ? `?${str}` : "";
}

async function handleResponse(res, context = "") {
  if (res.status === 401) {
    Cookies.remove("token");
    if (typeof window !== "undefined") window.location.href = "/login";
    return null;
  }

  if (res.status === 403) {
    const accion = context ? ` para ${context}` : "";
    throw new ApiError(`No tienes permisos suficientes${accion}.`, 403);
  }

  if (!res.ok) {
    let errorData = {};
    try {
      errorData = await res.json();
    } catch {
      errorData = { detail: `Error ${res.status}` };
    }

    let message = errorData.detail || errorData.message;
    if (!message && typeof errorData === "object") {
      const firstKey = Object.keys(errorData)[0];
      const firstError = errorData[firstKey];
      message = Array.isArray(firstError)
        ? `${firstKey}: ${firstError[0]}`
        : `${firstKey}: ${firstError}`;
    }
    throw new ApiError(message || `Error ${res.status}`, res.status, errorData);
  }

  if (res.status === 204) return true;
  return res.json();
}

export async function request(url, options = {}, context = "") {
  try {
    const res = await fetch(url, options);
    return await handleResponse(res, context);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("Error de conexión con el servidor.", 0);
  }
}

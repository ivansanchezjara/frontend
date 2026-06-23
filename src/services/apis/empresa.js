import { API_URL, request, authHeaders, jsonHeaders } from "../api.js";

// ─── Empresa (configuración singleton) ──────────────────────────

export async function getEmpresa() {
  return request(
    `${API_URL}/empresa/`,
    {
      method: "GET",
      headers: authHeaders(),
      cache: "no-store",
    },
    "ver configuración de empresa",
  );
}

export async function updateEmpresa(data) {
  return request(
    `${API_URL}/empresa/`,
    {
      method: "PATCH",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    },
    "actualizar configuración de empresa",
  );
}

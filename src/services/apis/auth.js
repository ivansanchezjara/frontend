import { API_URL, request, jsonHeaders, authHeaders } from "../api.js";
import Cookies from "js-cookie";

/**
 * Lógica de Autenticación
 */

export const login = async (username, password) => {
  const data = await request(
    `${API_URL}/login/`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    },
    "iniciar sesión",
  );

  // Guardamos los tokens en Cookies
  Cookies.set("token", data.access, { expires: 1 / 24, secure: false });
  Cookies.set("refresh", data.refresh, { expires: 1, secure: false });

  // Guardamos el usuario
  const usuarioParaGuardar = data.user || {
    username: username,
    first_name: data.first_name || data.user?.first_name || username,
    last_name: data.last_name || data.user?.last_name || "",
  };
  Cookies.set("user", JSON.stringify(usuarioParaGuardar), {
    expires: 1 / 24,
    secure: false,
  });

  return data;
};

export const logout = () => {
  Cookies.remove("token");
  Cookies.remove("refresh");
  Cookies.remove("user");
};

export const getProfile = async () => {
  return request(
    `${API_URL}/profile/`,
    {
      headers: authHeaders(),
    },
    "obtener perfil",
  );
};

export const updateProfile = async (profileData) => {
  const updatedUser = await request(
    `${API_URL}/profile/`,
    {
      method: "PATCH",
      headers: jsonHeaders(),
      body: JSON.stringify(profileData),
    },
    "actualizar perfil",
  );

  Cookies.set("user", JSON.stringify(updatedUser), {
    expires: 1 / 24,
    secure: false,
  });
  return updatedUser;
};

export const getToken = () => Cookies.get("token");

export const getUser = () => {
  const userCookie = Cookies.get("user");
  return userCookie ? JSON.parse(userCookie) : null;
};

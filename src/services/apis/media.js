import {
  API_URL,
  request,
  authHeaders,
  jsonHeaders,
  toQueryString,
} from "../api.js";

// ─── CARPETAS ───────────────────────────────────────────────────

export const getFolders = async (parentId = "root", params = {}) => {
  const queryParams = { ...params };
  if (parentId) queryParams.parent = parentId;

  const query = toQueryString(queryParams);
  return request(
    `${API_URL}/filer/folders/${query}`,
    {
      headers: authHeaders(),
    },
    "ver carpetas",
  );
};

export const getAllFolders = async () => {
  return request(
    `${API_URL}/filer/folders/`,
    {
      headers: authHeaders(),
    },
    "ver todas las carpetas",
  );
};

export const createFolder = async (name, parentId = null) => {
  return request(
    `${API_URL}/filer/folders/`,
    {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({ name, parent: parentId }),
    },
    "crear carpeta",
  );
};

export const updateFolder = async (id, data) => {
  return request(
    `${API_URL}/filer/folders/${id}/`,
    {
      method: "PATCH",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    },
    "editar carpeta",
  );
};

export const deleteFolder = async (id) => {
  return request(
    `${API_URL}/filer/folders/${id}/`,
    {
      method: "DELETE",
      headers: authHeaders(),
    },
    "eliminar carpeta",
  );
};

// ─── IMÁGENES ───────────────────────────────────────────────────

export const getImages = async (folderId = "root", params = {}) => {
  const queryParams = { ...params };
  if (folderId) queryParams.folder = folderId;

  const query = toQueryString(queryParams);
  return request(
    `${API_URL}/filer/images/${query}`,
    {
      headers: authHeaders(),
    },
    "ver imágenes",
  );
};

export const uploadImage = async (file, folderId = null) => {
  const formData = new FormData();
  formData.append("file", file);
  if (folderId && folderId !== "root") {
    formData.append("folder", folderId);
  }

  return request(
    `${API_URL}/filer/images/`,
    {
      method: "POST",
      headers: authHeaders(), // Sin Content-Type para FormData
      body: formData,
    },
    "subir imagen",
  );
};

export const deleteImage = async (id) => {
  return request(
    `${API_URL}/filer/images/${id}/`,
    {
      method: "DELETE",
      headers: authHeaders(),
    },
    "eliminar imagen",
  );
};

export const updateImage = async (id, data) => {
  return request(
    `${API_URL}/filer/images/${id}/`,
    {
      method: "PATCH",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    },
    "editar imagen",
  );
};

export const getOrphans = async (params = {}) => {
  const query = toQueryString(params);
  return request(
    `${API_URL}/filer/images/orphans/${query}`,
    {
      headers: authHeaders(),
    },
    "ver imágenes huérfanas",
  );
};

export const bulkAssignImages = async (
  imageIds,
  varianteIds,
  targetType = "gallery",
) => {
  return request(
    `${API_URL}/catalogo/imagenes-producto/bulk_assign/`,
    {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({
        image_ids: imageIds,
        variante_ids: varianteIds,
        target_type: targetType,
      }),
    },
    "asignar imágenes",
  );
};

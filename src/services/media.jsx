import Cookies from 'js-cookie';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
const API_URL = `${BASE_URL}/api`;

function authHeaders(extraHeaders = {}) {
    const token = Cookies.get('token');
    return {
        'Authorization': `Bearer ${token}`,
        ...extraHeaders,
    };
}

async function handleResponse(res) {
    if (res.status === 401) {
        if (typeof window !== 'undefined') window.location.href = '/login';
        return null;
    }
    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: `Error ${res.status}` }));
        throw err;
    }
    if (res.status === 204) return true;
    return res.json();
}

// ─── CARPETAS ───────────────────────────────────────────────────

export const getFolders = async (parentId = 'root', params = {}) => {
    const query = new URLSearchParams();
    if (parentId) query.append('parent', parentId);
    Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') query.append(key, val);
    });

    const res = await fetch(`${API_URL}/filer/folders/?${query.toString()}`, {
        headers: authHeaders(),
    });
    return handleResponse(res);
};

export const getAllFolders = async () => {
    const res = await fetch(`${API_URL}/filer/folders/`, {
        headers: authHeaders(),
    });
    return handleResponse(res);
};

export const createFolder = async (name, parentId = null) => {
    const res = await fetch(`${API_URL}/filer/folders/`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ name, parent: parentId }),
    });
    return handleResponse(res);
};

// ─── IMÁGENES ───────────────────────────────────────────────────

export const getImages = async (folderId = 'root', params = {}) => {
    const query = new URLSearchParams();
    if (folderId) query.append('folder', folderId);
    Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') query.append(key, val);
    });

    const res = await fetch(`${API_URL}/filer/images/?${query.toString()}`, {
        headers: authHeaders(),
    });
    return handleResponse(res);
};

export const uploadImage = async (file, folderId = null) => {
    const formData = new FormData();
    formData.append('file', file);
    if (folderId && folderId !== 'root') {
        formData.append('folder', folderId);
    }

    const res = await fetch(`${API_URL}/filer/images/`, {
        method: 'POST',
        headers: authHeaders(), // No content-type for FormData
        body: formData,
    });
    return handleResponse(res);
};

export const deleteImage = async (id) => {
    const res = await fetch(`${API_URL}/filer/images/${id}/`, {
        method: 'DELETE',
        headers: authHeaders(),
    });
    return handleResponse(res);
};

export const getOrphans = async () => {
    const res = await fetch(`${API_URL}/filer/images/orphans/`, {
        headers: authHeaders(),
    });
    return handleResponse(res);
};

export const bulkAssignImages = async (imageIds, varianteIds, targetType = 'gallery') => {
    const res = await fetch(`${API_URL}/catalogo/imagenes-producto/bulk_assign/`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ 
            image_ids: imageIds, 
            variante_ids: varianteIds,
            target_type: targetType 
        }),
    });
    return handleResponse(res);
};

export const deleteFolder = async (id) => {
    const res = await fetch(`${API_URL}/filer/folders/${id}/`, {
        method: 'DELETE',
        headers: authHeaders(),
    });
    if (res.status === 204) return true;
    return handleResponse(res);
};

export const updateImage = async (id, data) => {
    const res = await fetch(`${API_URL}/filer/images/${id}/`, {
        method: 'PATCH',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(data),
    });
    return handleResponse(res);
};

export const updateFolder = async (id, data) => {
    const res = await fetch(`${API_URL}/filer/folders/${id}/`, {
        method: 'PATCH',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(data),
    });
    return handleResponse(res);
};

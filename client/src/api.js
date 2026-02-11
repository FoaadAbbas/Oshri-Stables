const API_BASE = import.meta.env.VITE_API_URL || '';

function getHeaders(userId, userEmail) {
    const headers = {
        'Content-Type': 'application/json',
        'X-User-Id': userId,
    };
    if (userEmail) headers['X-User-Email'] = userEmail;
    return headers;
}

function getUploadHeaders(userId, userEmail) {
    const headers = { 'X-User-Id': userId };
    if (userEmail) headers['X-User-Email'] = userEmail;
    return headers;
}

export function getImageUrl(filename) {
    if (!filename) return null;
    return `${API_BASE}/uploads/${filename}`;
}

// ===== ADMIN =====
export async function checkAdmin(userId, userEmail) {
    const res = await fetch(`${API_BASE}/api/auth/check-admin`, { headers: getHeaders(userId, userEmail) });
    if (!res.ok) return false;
    const data = await res.json();
    return data.isAdmin;
}

// ===== HORSES =====
export async function fetchHorses(userId, userEmail) {
    const res = await fetch(`${API_BASE}/api/horses`, { headers: getHeaders(userId, userEmail) });
    if (!res.ok) throw new Error('Failed to fetch horses');
    return res.json();
}

export async function createHorse(userId, formData, userEmail) {
    const res = await fetch(`${API_BASE}/api/horses`, {
        method: 'POST',
        headers: getUploadHeaders(userId, userEmail),
        body: formData,
    });
    if (!res.ok) throw new Error('Failed to create horse');
    return res.json();
}

export async function updateHorse(userId, id, formData, userEmail) {
    const res = await fetch(`${API_BASE}/api/horses/${id}`, {
        method: 'PUT',
        headers: getUploadHeaders(userId, userEmail),
        body: formData,
    });
    if (!res.ok) throw new Error('Failed to update horse');
    return res.json();
}

export async function deleteHorse(userId, id, userEmail) {
    const res = await fetch(`${API_BASE}/api/horses/${id}`, {
        method: 'DELETE',
        headers: getHeaders(userId, userEmail),
    });
    if (!res.ok) throw new Error('Failed to delete horse');
    return res.json();
}

// ===== VISITS =====
export async function fetchVisits(userId, userEmail) {
    const res = await fetch(`${API_BASE}/api/visits`, { headers: getHeaders(userId, userEmail) });
    if (!res.ok) throw new Error('Failed to fetch visits');
    return res.json();
}

export async function createVisit(userId, data, userEmail) {
    const res = await fetch(`${API_BASE}/api/visits`, {
        method: 'POST',
        headers: getHeaders(userId, userEmail),
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create visit');
    return res.json();
}

export async function deleteVisit(userId, id, userEmail) {
    const res = await fetch(`${API_BASE}/api/visits/${id}`, {
        method: 'DELETE',
        headers: getHeaders(userId, userEmail),
    });
    if (!res.ok) throw new Error('Failed to delete visit');
    return res.json();
}

// ===== VACCINES =====
export async function fetchVaccines(userId, userEmail) {
    const res = await fetch(`${API_BASE}/api/vaccines`, { headers: getHeaders(userId, userEmail) });
    if (!res.ok) throw new Error('Failed to fetch vaccines');
    return res.json();
}

export async function createVaccine(userId, data, userEmail) {
    const res = await fetch(`${API_BASE}/api/vaccines`, {
        method: 'POST',
        headers: getHeaders(userId, userEmail),
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create vaccine');
    return res.json();
}

export async function deleteVaccine(userId, id, userEmail) {
    const res = await fetch(`${API_BASE}/api/vaccines/${id}`, {
        method: 'DELETE',
        headers: getHeaders(userId, userEmail),
    });
    if (!res.ok) throw new Error('Failed to delete vaccine');
    return res.json();
}

// ===== PREGNANCIES =====
export async function fetchPregnancies(userId, userEmail) {
    const res = await fetch(`${API_BASE}/api/pregnancies`, { headers: getHeaders(userId, userEmail) });
    if (!res.ok) throw new Error('Failed to fetch pregnancies');
    return res.json();
}

export async function createPregnancy(userId, data, userEmail) {
    const res = await fetch(`${API_BASE}/api/pregnancies`, {
        method: 'POST',
        headers: getHeaders(userId, userEmail),
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create pregnancy');
    return res.json();
}

export async function deletePregnancy(userId, id, userEmail) {
    const res = await fetch(`${API_BASE}/api/pregnancies/${id}`, {
        method: 'DELETE',
        headers: getHeaders(userId, userEmail),
    });
    if (!res.ok) throw new Error('Failed to delete pregnancy');
    return res.json();
}
// ===== FIREBASE ID SYNC =====
export async function setFirebaseId(entity, userId, id, firebaseId, userEmail) {
    const res = await fetch(`${API_BASE}/api/${entity}/${id}/firebase-id`, {
        method: 'PATCH',
        headers: getHeaders(userId, userEmail),
        body: JSON.stringify({ firebaseId }),
    });
    if (!res.ok) console.warn(`Failed to set firebaseId for ${entity}/${id}`);
}

// ===== MIGRATION =====
export async function migrateData(userId, data) {
    const res = await fetch(`${API_BASE}/api/migrate`, {
        method: 'POST',
        headers: getHeaders(userId),
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Migration failed');
    return res.json();
}

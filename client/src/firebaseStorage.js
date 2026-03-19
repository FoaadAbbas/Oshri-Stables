const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

/**
 * Upload an image file to Cloudinary via the server
 * (API key stays server-side, never exposed to browser)
 * @param {File} file - The image file to upload
 * @param {string} userId - User ID for auth
 * @param {string} userEmail - User email for auth
 * @param {string} folder - Cloudinary folder name
 * @returns {Promise<string>} The image URL
 */
export async function uploadImage(file, userId, userEmail, folder = 'horses') {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('folder', `oshri-stables/${folder}`);

    const headers = { 'X-User-Id': userId };
    if (userEmail) headers['X-User-Email'] = userEmail;

    const res = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        headers,
        body: formData,
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Image upload failed');
    }

    const data = await res.json();
    return data.url;
}

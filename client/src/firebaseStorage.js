import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

/**
 * Upload an image file to Firebase Storage
 * @param {File} file - The image file to upload
 * @param {string} folder - The storage folder (e.g., 'horses', 'certificates')
 * @returns {Promise<string>} The download URL
 */
export async function uploadImage(file, folder = 'horses') {
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const storageRef = ref(storage, `${folder}/${timestamp}_${safeName}`);
    
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    return url;
}

/**
 * Delete an image from Firebase Storage by its download URL
 * @param {string} url - The Firebase Storage download URL
 */
export async function deleteImage(url) {
    if (!url || !url.includes('firebase')) return;
    try {
        // Extract the path from the download URL
        const decodedUrl = decodeURIComponent(url);
        const pathMatch = decodedUrl.match(/\/o\/(.+?)\?/);
        if (pathMatch) {
            const filePath = pathMatch[1];
            const storageRef = ref(storage, filePath);
            await deleteObject(storageRef);
        }
    } catch (err) {
        console.warn('Failed to delete image from Firebase Storage:', err);
    }
}

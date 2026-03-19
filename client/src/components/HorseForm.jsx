import React, { useState, useRef } from 'react';
import { uploadImage } from '../firebaseStorage';

export default function HorseForm({ horse, onSubmit, onClose, userId, userEmail }) {
    const [name, setName] = useState(horse?.name || '');
    const [age, setAge] = useState(horse?.age || '');
    const [breed, setBreed] = useState(horse?.breed || '');
    const [gender, setGender] = useState(horse?.gender || 'זכר');
    const [fatherName, setFatherName] = useState(horse?.fatherName || '');
    const [motherName, setMotherName] = useState(horse?.motherName || '');
    const [imageFile, setImageFile] = useState(null);
    const [certFile, setCertFile] = useState(null);
    const [preview, setPreview] = useState(horse?.image || null);
    const [certPreview, setCertPreview] = useState(horse?.certImage || null);
    const [loading, setLoading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState('');
    const fileInputRef = useRef(null);
    const cameraInputRef = useRef(null);
    const certInputRef = useRef(null);

    const handleFileChange = (e, type = 'image') => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            alert('הקובץ גדול מדי! אנא בחר תמונה קטנה מ-10MB.');
            return;
        }

        const reader = new FileReader();
        if (type === 'image') {
            setImageFile(file);
            reader.onload = (ev) => setPreview(ev.target.result);
        } else {
            setCertFile(file);
            reader.onload = (ev) => setCertPreview(ev.target.result);
        }
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || !age || !breed) {
            alert('אנא מלא את כל השדות');
            return;
        }

        setLoading(true);
        try {
            // Upload images to Firebase Storage if new files were selected
            let imageUrl = horse?.image || null;
            let certImageUrl = horse?.certImage || null;

            if (imageFile) {
                setUploadStatus('מעלה תמונת סוס...');
                imageUrl = await uploadImage(imageFile, userId, userEmail, 'horses');
            }

            if (certFile) {
                setUploadStatus('מעלה תעודה...');
                certImageUrl = await uploadImage(certFile, userId, userEmail, 'certificates');
            }

            setUploadStatus('שומר נתונים...');

            // Send JSON data with image URLs to server
            const data = {
                name,
                age: parseInt(age),
                breed,
                gender,
                fatherName: fatherName || null,
                motherName: motherName || null,
                image: imageUrl,
                certImage: certImageUrl,
            };

            await onSubmit(data);
        } catch (err) {
            console.error('Error submitting horse:', err);
            alert('שגיאה בשמירת הנתונים');
        } finally {
            setLoading(false);
            setUploadStatus('');
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <h2 className="modal-title">{horse ? '✎ ערוך סוס' : '✚ הוסף סוס חדש'}</h2>

                <form onSubmit={handleSubmit}>
                    {/* Image Upload */}
                    <div className="form-group" style={{ marginBottom: 20 }}>
                        <label>תמונת הסוס</label>
                        <div
                            className={`image-upload-area ${preview ? 'has-image' : ''}`}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {preview ? (
                                <img src={preview} alt="תצוגה מקדימה" className="image-preview" />
                            ) : (
                                <div className="image-upload-text">
                                    <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                                        <div onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }} style={{ cursor: 'pointer' }}>
                                            <div style={{ fontSize: '2rem', marginBottom: 8 }}>🖼️</div>
                                            <span>גלריה</span>
                                        </div>
                                        <div onClick={(e) => { e.stopPropagation(); cameraInputRef.current?.click(); }} style={{ cursor: 'pointer' }}>
                                            <div style={{ fontSize: '2rem', marginBottom: 8 }}>📷</div>
                                            <span>מצלמה</span>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '0.8rem', marginTop: 12, color: 'var(--text-tertiary)' }}>
                                        (עד 10MB)
                                    </div>
                                </div>
                            )}
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, 'image')}
                            style={{ display: 'none' }}
                        />
                        <input
                            ref={cameraInputRef}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={(e) => handleFileChange(e, 'image')}
                            style={{ display: 'none' }}
                        />
                    </div>

                    <div className="form-grid">
                        <div className="form-group">
                            <label>שם הסוס</label>
                            <input
                                type="text"
                                className="form-input"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="שם הסוס"
                            />
                        </div>
                        <div className="form-group">
                            <label>גיל</label>
                            <input
                                type="number"
                                className="form-input"
                                value={age}
                                onChange={e => setAge(e.target.value)}
                                placeholder="גיל"
                            />
                        </div>
                        <div className="form-group">
                            <label>גזע</label>
                            <input
                                type="text"
                                className="form-input"
                                value={breed}
                                onChange={e => setBreed(e.target.value)}
                                placeholder="גזע"
                            />
                        </div>
                        <div className="form-group">
                            <label>מין</label>
                            <select className="form-select" value={gender} onChange={e => setGender(e.target.value)}>
                                <option value="זכר">זכר</option>
                                <option value="נקבה">נקבה</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>שם האב</label>
                            <input
                                type="text"
                                className="form-input"
                                value={fatherName}
                                onChange={e => setFatherName(e.target.value)}
                                placeholder="שם האב"
                            />
                        </div>
                        <div className="form-group">
                            <label>שם האם</label>
                            <input
                                type="text"
                                className="form-input"
                                value={motherName}
                                onChange={e => setMotherName(e.target.value)}
                                placeholder="שם האם"
                            />
                        </div>
                    </div>

                    {/* Certificate Upload */}
                    <div className="form-group" style={{ marginBottom: 20 }}>
                        <label>תעודת הסוס</label>
                        <div
                            className={`image-upload-area ${certPreview ? 'has-image' : ''}`}
                            onClick={() => certInputRef.current?.click()}
                            style={{ padding: '16px' }}
                        >
                            {certPreview ? (
                                <img src={certPreview} alt="תצוגה מקדימה" className="image-preview" style={{ maxHeight: '150px' }} />
                            ) : (
                                <div className="image-upload-text">
                                    <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>📜</div>
                                    <span style={{ fontSize: '0.9rem' }}>לחץ להעלאת תעודה</span>
                                </div>
                            )}
                        </div>
                        <input
                            ref={certInputRef}
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, 'cert')}
                            style={{ display: 'none' }}
                        />
                    </div>

                    <div className="modal-actions">
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? (uploadStatus || 'שומר...') : (horse ? 'עדכן סוס' : 'הוסף סוס')}
                        </button>
                        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                            ביטול
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

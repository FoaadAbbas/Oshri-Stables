import React, { useState, useRef } from 'react';
import { getImageUrl } from '../api';

export default function HorseForm({ horse, onSubmit, onClose }) {
    const [name, setName] = useState(horse?.name || '');
    const [age, setAge] = useState(horse?.age || '');
    const [breed, setBreed] = useState(horse?.breed || '');
    const [gender, setGender] = useState(horse?.gender || 'זכר');
    const [imageFile, setImageFile] = useState(null);
    const [preview, setPreview] = useState(
        horse?.image ? getImageUrl(horse.image) : null
    );
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            alert('הקובץ גדול מדי! אנא בחר תמונה קטנה מ-10MB.');
            return;
        }

        setImageFile(file);
        const reader = new FileReader();
        reader.onload = (ev) => setPreview(ev.target.result);
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || !age || !breed) {
            alert('אנא מלא את כל השדות');
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append('name', name);
        formData.append('age', age);
        formData.append('breed', breed);
        formData.append('gender', gender);
        if (imageFile) {
            formData.append('image', imageFile);
        }

        await onSubmit(formData);
        setLoading(false);
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
                                    <div style={{ fontSize: '2rem', marginBottom: 8 }}>📷</div>
                                    <span>לחץ להעלאת תמונה</span>
                                    <div style={{ fontSize: '0.8rem', marginTop: 4, color: 'var(--text-tertiary)' }}>
                                        (עד 10MB)
                                    </div>
                                </div>
                            )}
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
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
                    </div>

                    <div className="modal-actions">
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'שומר...' : (horse ? 'עדכן סוס' : 'הוסף סוס')}
                        </button>
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            ביטול
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

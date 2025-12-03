import React, { useState } from 'react';
import { Upload, Loader2, Image as ImageIcon } from 'lucide-react';
import Button from './Button';

import config from "../config";

const OCRUploader = ({ onTextExtracted }) => {
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [frontImage, setFrontImage] = useState(null);
    const [backImage, setBackImage] = useState(null);
    const [frontFile, setFrontFile] = useState(null);
    const [backFile, setBackFile] = useState(null);

    const handleFileSelect = (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        const previewUrl = URL.createObjectURL(file);
        if (type === 'front') {
            setFrontImage(previewUrl);
            setFrontFile(file);
        } else {
            setBackImage(previewUrl);
            setBackFile(file);
        }
    };

    const resizeImage = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 1024;
                    const MAX_HEIGHT = 1024;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    canvas.toBlob((blob) => {
                        resolve(new File([blob], file.name, { type: 'image/jpeg' }));
                    }, 'image/jpeg', 0.8);
                };
            };
        });
    };

    const handleAnalyze = async () => {
        if (!frontFile && !backFile) {
            alert("Please upload at least one image.");
            return;
        }

        setLoading(true);
        setProgress(0);

        try {
            const formData = new FormData();

            // Resize images before uploading
            if (frontFile) {
                const resizedFront = await resizeImage(frontFile);
                formData.append('files', resizedFront);
            }
            if (backFile) {
                const resizedBack = await resizeImage(backFile);
                formData.append('files', resizedBack);
            }

            // Simulate progress
            const interval = setInterval(() => {
                setProgress(prev => Math.min(prev + 10, 90));
            }, 200);

            const response = await fetch(`${config.API_BASE_URL}/analyze-image`, {
                method: 'POST',
                body: formData,
            });

            clearInterval(interval);
            setProgress(100);

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            onTextExtracted(data);
        } catch (err) {
            console.error("OCR Error:", err);
            alert("Failed to extract text. Ensure backend is running and API key is set.");
        } finally {
            setLoading(false);
        }
    };

    const UploadBox = ({ type, image, onSelect }) => (
        <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all group relative overflow-hidden">
            {image ? (
                <div className="relative w-full h-full flex flex-col items-center justify-center">
                    <img src={image} alt={`${type} Preview`} className="h-full w-full object-contain p-2" />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-xs text-white">Click to change</p>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors" />
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">{type === 'front' ? 'Front (Name)' : 'Back (Ingredients)'}</p>
                </div>
            )}
            <input type="file" className="hidden" accept="image/*" onChange={(e) => onSelect(e, type)} disabled={loading} />
        </label>
    );

    return (
        <div className="w-full space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <UploadBox type="front" image={frontImage} onSelect={handleFileSelect} />
                <UploadBox type="back" image={backImage} onSelect={handleFileSelect} />
            </div>

            <Button
                onClick={handleAnalyze}
                disabled={loading || (!frontFile && !backFile)}
                loading={loading}
                className="w-full"
            >
                {!loading && <ImageIcon className="w-5 h-5 mr-2" />}
                {loading ? `Analyzing... ${progress}%` : 'Analyze Images'}
            </Button>
        </div>
    );
};

export default OCRUploader;

import React, { useState } from 'react';
import { Upload, Loader2, Image as ImageIcon } from 'lucide-react';

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

    const handleAnalyze = async () => {
        if (!frontFile && !backFile) {
            alert("Please upload at least one image.");
            return;
        }

        setLoading(true);
        setProgress(0);

        const formData = new FormData();
        if (frontFile) formData.append('files', frontFile);
        if (backFile) formData.append('files', backFile);

        try {
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
        <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-zinc-700 rounded-xl cursor-pointer bg-zinc-900/50 hover:bg-zinc-800/50 transition-all group relative overflow-hidden">
            {image ? (
                <div className="relative w-full h-full flex flex-col items-center justify-center">
                    <img src={image} alt={`${type} Preview`} className="h-full w-full object-contain p-2" />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-xs text-white">Click to change</p>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 text-zinc-500 mb-2 group-hover:text-indigo-400 transition-colors" />
                    <p className="text-xs text-zinc-400 font-medium">{type === 'front' ? 'Front (Name)' : 'Back (Ingredients)'}</p>
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

            <button
                onClick={handleAnalyze}
                disabled={loading || (!frontFile && !backFile)}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center"
            >
                {loading ? (
                    <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Analyzing... {progress}%
                    </>
                ) : (
                    <>
                        <ImageIcon className="w-5 h-5 mr-2" />
                        Analyze Images
                    </>
                )}
            </button>
        </div>
    );
};

export default OCRUploader;

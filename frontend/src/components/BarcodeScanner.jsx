import React, { useState } from 'react';
import { useZxing } from 'react-zxing';

export default function BarcodeScanner({ onResult, onError }) {
    const [error, setError] = useState("");

    const { ref } = useZxing({
        onDecodeResult(result) {
            onResult(result.getText());
        },
        onError(err) {
            // Only report critical errors, ignore "No barcode found" noise
            if (err.name !== "NotFoundException") {
                console.error(err);
                if (onError) onError(err);
            }
        },
    });

    return (
        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden border border-zinc-700">
            <video ref={ref} className="w-full h-full object-cover" />
            <div className="absolute inset-0 border-2 border-emerald-500/50 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-1/2 border-2 border-emerald-400 rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
            </div>
            <div className="absolute bottom-2 left-0 right-0 text-center text-xs text-white/70 bg-black/50 py-1">
                Point camera at a barcode
            </div>
        </div>
    );
}

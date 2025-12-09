import React, { useState } from 'react';
import { useZxing } from 'react-zxing';

export default function BarcodeScanner({ onResult, onError }) {
    const [lastScanned, setLastScanned] = useState(null);
    const [lastScanTime, setLastScanTime] = useState(0);
    const [flash, setFlash] = useState(false);

    const { ref } = useZxing({
        constraints: {
            video: {
                facingMode: "environment",
                width: { ideal: 640 }, // Lower resolution for better performance
                height: { ideal: 480 }
            }
        },
        timeBetweenDecodingAttempts: 300,
        onDecodeResult(result) {
            const text = result.getText();
            // Debounce same code to avoid rapid firing
            if (text === lastScanned && (Date.now() - lastScanTime < 2000)) return;

            setLastScanned(text);
            setLastScanTime(Date.now());
            setFlash(true);
            setTimeout(() => setFlash(false), 500);
            onResult(text);
        },
        onError(error) {
            // Ignore standard "not found" errors to avoid console spam
            if (error.name !== 'NotFoundException') {
                console.error("Scanner error:", error);
                if (onError) onError(error);
            }
        }
    });

    return (
        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden border border-zinc-700">
            <video ref={ref} className="w-full h-full object-cover" />

            {/* Scanning Overlay */}
            <div className="absolute inset-0 border-2 border-white/30 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-40 border-2 border-emerald-500 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                    <div className="absolute inset-0 animate-pulse bg-emerald-500/10" />
                    <div className="absolute top-0 left-0 w-full h-0.5 bg-emerald-500 animate-[scan_2s_infinite]" />
                </div>
                <div className="absolute bottom-4 left-0 right-0 text-center">
                    <p className="text-white/90 text-sm font-medium bg-black/50 inline-block px-3 py-1 rounded-full animate-pulse">
                        Scanning... Hold steady
                    </p>
                </div>
            </div>

            {/* Flash Effect */}
            {flash && (
                <div className="absolute inset-0 bg-green-500/30 transition-opacity duration-300 pointer-events-none" />
            )}

            {/* Last Scanned Feedback */}
            {lastScanned && (
                <div className="absolute top-4 left-0 right-0 flex justify-center pointer-events-none">
                    <div className="bg-emerald-500 text-white px-4 py-2 rounded-full shadow-lg text-sm font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
                        <span>✓ Scanned: {lastScanned}</span>
                    </div>
                </div>
            )}
        </div>
    );
}

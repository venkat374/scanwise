import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import { Download, X, Share2 } from 'lucide-react';
import Button from './Button';

const ShareCard = ({ product, onClose }) => {
    const cardRef = useRef(null);

    const handleDownload = async () => {
        if (!cardRef.current) return;
        try {
            const canvas = await html2canvas(cardRef.current, {
                backgroundColor: null, // Transparent background if possible, or match theme
                scale: 2 // Higher resolution
            });
            const data = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = data;
            link.download = `scanwise-${product.product_name.replace(/\s+/g, '-').toLowerCase()}.png`;
            link.click();
        } catch (err) {
            console.error("Failed to generate image", err);
        }
    };

    if (!product) return null;

    const score = Math.round(product.product_toxicity_score * 100);
    const statusColor =
        product.product_status === 'SAFE' ? 'text-emerald-500' :
            product.product_status === 'MODERATE' ? 'text-yellow-500' : 'text-red-500';

    const bgGradient =
        product.product_status === 'SAFE' ? 'from-emerald-500/20 to-emerald-900/20' :
            product.product_status === 'MODERATE' ? 'from-yellow-500/20 to-yellow-900/20' : 'from-red-500/20 to-red-900/20';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-background rounded-xl shadow-2xl w-full max-w-md border border-border overflow-hidden flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border bg-muted/50">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Share2 size={20} /> Share Result
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-muted transition-colors"
                    >
                        <X size={20} className="text-muted-foreground" />
                    </button>
                </div>

                {/* Preview Area */}
                <div className="p-8 flex justify-center bg-zinc-950/50">
                    <div
                        id="share-card"
                        ref={cardRef}
                        className={`w-[320px] h-[480px] bg-zinc-900 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden border border-zinc-800 shadow-2xl`}
                    >
                        {/* Background Gradient */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${bgGradient} opacity-30`} />

                        {/* Content */}
                        <div className="relative z-10 flex flex-col h-full">
                            <div className="text-center mt-4">
                                <div className="text-xs font-bold tracking-[0.2em] text-zinc-500 uppercase mb-2">ScanWise Analysis</div>
                                <h2 className="text-2xl font-bold text-white leading-tight mb-1 line-clamp-2">
                                    {product.product_name}
                                </h2>
                                <p className="text-zinc-400 text-sm">{product.brand || 'Unknown Brand'}</p>
                            </div>

                            <div className="flex-1 flex flex-col items-center justify-center my-6">
                                <div className="relative">
                                    {/* Circular Progress or just big number */}
                                    <div className={`text-8xl font-black tracking-tighter ${statusColor} drop-shadow-lg`}>
                                        {score}
                                    </div>
                                    <div className="text-center text-xs font-bold text-zinc-500 uppercase tracking-widest mt-2">
                                        Toxicity Score
                                    </div>
                                </div>

                                <div className={`mt-6 px-4 py-1.5 rounded-full text-sm font-bold border ${product.product_status === 'SAFE' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' :
                                        product.product_status === 'MODERATE' ? 'bg-yellow-500/10 border-yellow-500/50 text-yellow-400' :
                                            'bg-red-500/10 border-red-500/50 text-red-400'
                                    }`}>
                                    {product.product_status}
                                </div>
                            </div>

                            <div className="space-y-3 mb-4">
                                <div className="flex justify-between text-sm border-b border-zinc-800 pb-2">
                                    <span className="text-zinc-500">Ingredients</span>
                                    <span className="text-white font-mono">{product.ingredients.length}</span>
                                </div>
                                <div className="flex justify-between text-sm border-b border-zinc-800 pb-2">
                                    <span className="text-zinc-500">Risk Level</span>
                                    <span className={statusColor}>{product.product_status}</span>
                                </div>
                            </div>

                            <div className="text-center">
                                <p className="text-[10px] text-zinc-600">
                                    Analyzed by ScanWise AI • scanwise.app
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-border bg-muted/50 flex justify-end">
                    <Button onClick={handleDownload} className="flex items-center gap-2">
                        <Download size={18} /> Download Image
                    </Button>
                </div>

            </div>
        </div>
    );
};

export default ShareCard;

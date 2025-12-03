import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Scan, Type, Search, Heart, Share2, Info, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Badge from '../components/Badge';
import Autocomplete from '../components/Autocomplete';
import OCRUploader from '../components/OCRUploader';
import BarcodeScanner from '../components/BarcodeScanner';
import IngredientModal from '../components/IngredientModal';
import ShareCard from '../components/ShareCard';

import config from "../config";

export default function Dashboard() {
    const { currentUser } = useAuth();
    const [formData, setFormData] = useState({
        product_name: '',
        skin_type: 'Normal',
        skin_tone: 'Medium',
        usage_frequency: 'Daily',
        amount_applied: 'Normal',
        ingredients_list: '',
        barcode: '', // Store selected product ID
        category: ''
    });
    const [mode, setMode] = useState('search'); // 'search', 'manual', 'ocr', 'barcode'
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [favMessage, setFavMessage] = useState("");
    const [selectedIngredient, setSelectedIngredient] = useState(null);
    const [alternatives, setAlternatives] = useState([]);
    const [showShareCard, setShowShareCard] = useState(false);
    const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);

    useEffect(() => {
        if (result && result.product_toxicity_score > 0.3 && result.category) {
            axios.post(`${config.API_BASE_URL}/recommend-alternatives`, {
                category: result.category,
                current_score: result.product_toxicity_score
            })
                .then(res => setAlternatives(res.data))
                .catch(err => console.error("Failed to fetch alternatives", err));
        } else {
            setAlternatives([]);
        }
    }, [result]);

    // Auto-fill profile data
    useEffect(() => {
        async function fetchProfile() {
            if (!currentUser) return;
            try {
                const token = await currentUser.getIdToken();
                const res = await axios.get(`${config.API_BASE_URL}/users/profile`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.data) {
                    setFormData(prev => ({
                        ...prev,
                        skin_type: res.data.skin_type || prev.skin_type,
                        skin_tone: res.data.skin_tone || prev.skin_tone
                    }));
                }
            } catch (err) {
                console.error("Failed to fetch profile for auto-fill", err);
            }
        }
        fetchProfile();
    }, [currentUser]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleProductSelect = (product) => {
        setFormData({
            ...formData,
            product_name: product.product_name,
            barcode: product.id // Capture the ID as barcode
        });
    };

    const handleOCRResult = (data) => {
        // data = { product_name, brand, ingredients: [...] }
        const ingredientsText = Array.isArray(data.ingredients) ? data.ingredients.join(', ') : data.ingredients;

        setFormData(prev => ({
            ...prev,
            ingredients_list: ingredientsText,
            product_name: data.product_name || prev.product_name, // Pre-fill name if available
            category: data.category || ''
        }));
        setMode('manual'); // Switch to manual to show the filled data
    };

    const handleBarcodeScanned = async (barcode) => {
        setLoading(true);
        try {
            const res = await axios.get(`${config.API_BASE_URL}/scan-barcode?barcode=${barcode}`);
            if (res.data.error) {
                setError("Product not found via barcode. Try searching by name.");
            } else {
                const product = res.data;
                setFormData({
                    ...formData,
                    product_name: product.product_name,
                    ingredients_list: product.ingredients_text,
                    barcode: barcode // Set barcode from scan
                });
                setMode('manual'); // Switch to manual to review
            }
        } catch (err) {
            setError("Failed to lookup barcode.");
        }
        setLoading(false);
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);
        setResult(null);
        setFavMessage("");

        const payload = {
            ...formData,
            ingredients_list: (mode === 'manual' || mode === 'scan') ? formData.ingredients_list : null,
            barcode: (mode === 'search' || mode === 'scan') ? formData.barcode : null
        };

        try {
            const response = await axios.post(`${config.API_BASE_URL}/scan-product`, payload);
            if (response.data.error) {
                setError(response.data.error);
            } else {
                const data = response.data;
                setResult(data);

                // Auto-save to history if logged in
                if (currentUser) {
                    try {
                        const token = await currentUser.getIdToken();
                        await axios.post(`${config.API_BASE_URL}/history`, {
                            user_id: currentUser.uid,
                            product_name: data.product_name || "Unknown Product",
                            ingredients: data.ingredients,
                            toxicity_score: data.product_toxicity_score
                        }, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                    } catch (histErr) {
                        console.error("Failed to save history", histErr);
                    }
                }
            }
        } catch (err) {
            setError("Failed to connect to the server. Please try again.");
        }
        setLoading(false);
    };

    const handleAddToFavorites = async () => {
        if (!currentUser || !result) return;
        try {
            const token = await currentUser.getIdToken();
            const res = await axios.post(`${config.API_BASE_URL}/favorites`, {
                user_id: currentUser.uid,
                product_name: result.product_name || "Unknown Product"
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.status === 'exists') {
                setFavMessage("Already in favorites");
            } else {
                setFavMessage("Added to favorites!");
            }
        } catch (err) {
            console.error("Failed to add favorite", err);
        }
    };

    const getScoreColor = (score) => {
        if (score >= 0.6) return 'text-red-500';
        if (score >= 0.3) return 'text-yellow-500';
        return 'text-green-500';
    };

    return (
        <div className="min-h-screen bg-transparent text-slate-900 dark:text-slate-100 font-sans">
            <div className="max-w-6xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        Dashboard
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">Analyze products and check their safety.</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Input Section */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card title="Product Details">

                            {/* Mode Toggle */}
                            <div className="grid grid-cols-3 gap-1 bg-muted p-1 rounded-lg mb-6">
                                <button
                                    onClick={() => setMode('search')}
                                    className={`flex items-center justify-center py-2 rounded-md text-sm font-medium transition-all ${mode === 'search' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    <Search className="w-4 h-4 mr-2" /> Search
                                </button>
                                <button
                                    onClick={() => setMode('scan')}
                                    className={`flex items-center justify-center py-2 rounded-md text-sm font-medium transition-all ${mode === 'scan' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    <Scan className="w-4 h-4 mr-2" /> Scan
                                </button>
                                <button
                                    onClick={() => setMode('manual')}
                                    className={`flex items-center justify-center py-2 rounded-md text-sm font-medium transition-all ${mode === 'manual' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    <Type className="w-4 h-4 mr-2" /> Manual
                                </button>
                            </div>

                            {mode === 'search' && (
                                <Autocomplete
                                    label="Search Product"
                                    value={formData.product_name}
                                    onChange={handleChange}
                                    onSelect={handleProductSelect}
                                    placeholder="Type to search (e.g. Nivea)..."
                                    name="product_name"
                                />
                            )}

                            {mode === 'scan' && (
                                <div className="space-y-6">
                                    {!showBarcodeScanner ? (
                                        <button
                                            onClick={() => setShowBarcodeScanner(true)}
                                            className="w-full py-3 border-2 border-dashed border-zinc-700 rounded-xl text-zinc-400 hover:text-white hover:border-zinc-500 hover:bg-zinc-800/50 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Scan className="w-5 h-5" />
                                            Scan Barcode
                                        </button>
                                    ) : (
                                        <div className="bg-black rounded-lg overflow-hidden relative min-h-[200px] flex flex-col items-center justify-center animate-in fade-in slide-in-from-top-4 duration-300">
                                            <BarcodeScanner onResult={handleBarcodeScanned} />
                                            <div className="absolute bottom-4 left-0 right-0 text-center text-white/70 text-xs pointer-events-none">
                                                Point camera at barcode
                                            </div>
                                            <button
                                                onClick={() => setShowBarcodeScanner(false)}
                                                className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/80 transition-colors z-10"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}

                                    <div className="relative">
                                        <div className="absolute inset-0 flex items-center">
                                            <span className="w-full border-t border-muted" />
                                        </div>
                                        <div className="relative flex justify-center text-xs uppercase">
                                            <span className="bg-card px-2 text-muted-foreground">Or upload ingredients</span>
                                        </div>
                                    </div>

                                    <OCRUploader onTextExtracted={handleOCRResult} />
                                </div>
                            )}

                            {mode === 'manual' && (
                                <>
                                    <Input
                                        label="Product Name (Optional)"
                                        name="product_name"
                                        value={formData.product_name}
                                        onChange={handleChange}
                                        placeholder="e.g. My Custom Cream"
                                    />
                                    <Input
                                        label="Ingredients List"
                                        type="textarea"
                                        name="ingredients_list"
                                        value={formData.ingredients_list}
                                        onChange={handleChange}
                                        placeholder="Paste ingredients here..."
                                    />
                                </>
                            )}

                            <div className="space-y-4 mt-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Skin Type</label>
                                    <select
                                        name="skin_type"
                                        value={formData.skin_type}
                                        onChange={handleChange}
                                        className="input-field"
                                    >
                                        <option>Normal</option>
                                        <option>Oily</option>
                                        <option>Dry</option>
                                        <option>Combination</option>
                                        <option>Sensitive</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Skin Tone</label>
                                    <select
                                        name="skin_tone"
                                        value={formData.skin_tone}
                                        onChange={handleChange}
                                        className="input-field"
                                    >
                                        <option>Fair</option>
                                        <option>Medium</option>
                                        <option>Dark</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Frequency</label>
                                        <select
                                            name="usage_frequency"
                                            value={formData.usage_frequency}
                                            onChange={handleChange}
                                            className="input-field"
                                        >
                                            <option>Daily</option>
                                            <option>Weekly</option>
                                            <option>Occasional</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Amount</label>
                                        <select
                                            name="amount_applied"
                                            value={formData.amount_applied}
                                            onChange={handleChange}
                                            className="input-field"
                                        >
                                            <option>Pea</option>
                                            <option>Normal</option>
                                            <option>Generous</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6">
                                <Button onClick={handleSubmit} disabled={loading} className="w-full">
                                    {loading ? 'Analyzing...' : 'Analyze Product'}
                                </Button>
                            </div>

                            {error && (
                                <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
                                    {error}
                                </div>
                            )}
                        </Card>
                    </div>

                    {/* Results Section */}
                    <div className="lg:col-span-2">
                        {!result ? (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-zinc-800 rounded-xl min-h-[400px]">
                                <Scan className="w-16 h-16 mb-4 opacity-20" />
                                <p>Select a product or scan ingredients to begin analysis.</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Score Card */}
                                <Card>
                                    <div className="flex justify-between items-start mb-8">
                                        <div>
                                            <h2 className="text-3xl font-bold tracking-tight">{result.product_name || "Analyzed Product"}</h2>
                                            <div className="flex gap-2 mt-3">
                                                <Badge variant={result.product_status === 'SAFE' ? 'success' : result.product_status === 'MODERATE' ? 'warning' : 'danger'}>
                                                    {result.product_status}
                                                </Badge>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-6xl font-black tracking-tighter ${getScoreColor(result.product_toxicity_score)}`}>
                                                {Math.round(result.product_toxicity_score * 100)}
                                            </div>
                                            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Toxicity Score</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 bg-muted/50 p-6 rounded-lg border border-border">
                                        <div>
                                            <div className="text-sm font-medium text-muted-foreground mb-1">Base Score</div>
                                            <div className="font-mono text-2xl font-semibold">{result.detailed_score_breakdown?.base_score || '-'}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-muted-foreground mb-1">Usage Factor</div>
                                            <div className="font-mono text-2xl font-semibold">x{result.detailed_score_breakdown?.usage_factor || '-'}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-muted-foreground mb-1">Ingredients</div>
                                            <div className="font-mono text-2xl font-semibold">{result.ingredients.length}</div>
                                        </div>
                                    </div>

                                    {currentUser && (
                                        <div className="mt-4 flex items-center gap-2">
                                            <Button onClick={handleAddToFavorites} variant="outline" className="w-full">
                                                <Heart className="w-4 h-4 mr-2" /> Add to Favorites
                                            </Button>
                                            {favMessage && <span className="text-sm text-emerald-400">{favMessage}</span>}
                                        </div>
                                    )}

                                    <div className="mt-4">
                                        <Button onClick={() => setShowShareCard(true)} variant="outline" className="w-full">
                                            <Share2 className="w-4 h-4 mr-2" /> Share Result
                                        </Button>
                                    </div>
                                </Card>

                                {/* Suitability Warnings */}
                                {(result.not_suitable_for_skin_type.length > 0 || result.not_suitable_for_skin_tone.length > 0) && (
                                    <Card title="Suitability Warnings">
                                        <div className="space-y-4">
                                            {result.not_suitable_for_skin_type.length > 0 && (
                                                <div>
                                                    <h4 className="text-sm font-bold text-muted-foreground uppercase mb-2">Skin Type Mismatch</h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {result.not_suitable_for_skin_type.map((ing, i) => (
                                                            <Badge key={i} variant="warning">{ing}</Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {result.not_suitable_for_skin_tone.length > 0 && (
                                                <div>
                                                    <h4 className="text-sm font-bold text-muted-foreground uppercase mb-2">Skin Tone Mismatch</h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {result.not_suitable_for_skin_tone.map((ing, i) => (
                                                            <Badge key={i} variant="warning">{ing}</Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </Card>
                                )}

                                {/* Alternatives */}
                                {alternatives.length > 0 && (
                                    <Card title="Better Alternatives">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {alternatives.map((alt, i) => (
                                                <div key={i} className="flex items-center space-x-4 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                                                    <div className="flex-1">
                                                        <h4 className="font-semibold">{alt.product_name}</h4>
                                                        <p className="text-sm text-muted-foreground">{alt.brand}</p>
                                                    </div>
                                                    <Badge variant="success">{Math.round(alt.toxicity_score * 100)}</Badge>
                                                </div>
                                            ))}
                                        </div>
                                    </Card>
                                )}

                                {/* Ingredient Breakdown */}
                                <Card title="Ingredient Analysis">
                                    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                                        <div className="max-h-96 overflow-y-auto custom-scrollbar">
                                            <table className="w-full text-sm text-left relative">
                                                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium sticky top-0 z-10 shadow-sm">
                                                    <tr>
                                                        <th className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50">Ingredient</th>
                                                        <th className="px-4 py-3 text-right bg-slate-50 dark:bg-slate-800/50">Risk Level</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                    {result.toxicity_report.map((item, idx) => (
                                                        <tr
                                                            key={idx}
                                                            onClick={() => setSelectedIngredient({ name: item.ingredient, risk: item.label })}
                                                            className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer group"
                                                        >
                                                            <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                                                <div className={`w-2 h-2 rounded-full ${item.label === 'SAFE' ? 'bg-emerald-500' :
                                                                    item.label === 'LOW RISK' ? 'bg-blue-500' :
                                                                        item.label === 'MODERATE RISK' ? 'bg-amber-500' : 'bg-red-500'
                                                                    }`} />
                                                                {item.ingredient}
                                                                <Info size={14} className="opacity-0 group-hover:opacity-100 text-slate-400 transition-opacity" />
                                                            </td>
                                                            <td className="px-4 py-3 text-right">
                                                                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${item.label === 'SAFE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' :
                                                                    item.label === 'LOW RISK' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400' :
                                                                        item.label === 'MODERATE RISK' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' :
                                                                            'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'
                                                                    }`}>
                                                                    {item.label}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <IngredientModal
                ingredientName={selectedIngredient?.name}
                riskLevel={selectedIngredient?.risk}
                onClose={() => setSelectedIngredient(null)}
            />
            {showShareCard && result && (
                <ShareCard product={result} onClose={() => setShowShareCard(false)} />
            )}
        </div>
    );
}

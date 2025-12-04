import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Scan, Type, Search, Heart, Share2, Info, X, Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react';
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
import { motion, AnimatePresence } from 'framer-motion';

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
        if (score >= 0.3) return 'text-amber-500';
        return 'text-emerald-500';
    };

    return (
        <div className="min-h-screen bg-transparent text-zinc-900 dark:text-zinc-100 font-sans">
            <div className="max-w-6xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                        Dashboard
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400">Analyze products and check their safety.</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Input Section */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card title="Product Details">

                            {/* Mode Toggle */}
                            <div className="grid grid-cols-3 gap-1 bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-xl mb-6">
                                <button
                                    onClick={() => setMode('search')}
                                    className={`flex items-center justify-center py-2 rounded-lg text-sm font-medium transition-all ${mode === 'search' ? 'bg-white dark:bg-zinc-800 shadow-sm text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'}`}
                                >
                                    <Search className="w-4 h-4 mr-2" /> Search
                                </button>
                                <button
                                    onClick={() => setMode('scan')}
                                    className={`flex items-center justify-center py-2 rounded-lg text-sm font-medium transition-all ${mode === 'scan' ? 'bg-white dark:bg-zinc-800 shadow-sm text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'}`}
                                >
                                    <Scan className="w-4 h-4 mr-2" /> Scan
                                </button>
                                <button
                                    onClick={() => setMode('manual')}
                                    className={`flex items-center justify-center py-2 rounded-lg text-sm font-medium transition-all ${mode === 'manual' ? 'bg-white dark:bg-zinc-800 shadow-sm text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'}`}
                                >
                                    <Type className="w-4 h-4 mr-2" /> Manual
                                </button>
                            </div>

                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={mode}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                >
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
                                            <OCRUploader onTextExtracted={handleOCRResult} />

                                            <div className="relative">
                                                <div className="absolute inset-0 flex items-center">
                                                    <span className="w-full border-t border-zinc-200 dark:border-zinc-800" />
                                                </div>
                                                <div className="relative flex justify-center text-xs uppercase">
                                                    <span className="bg-white dark:bg-zinc-900 px-2 text-zinc-500">Or scan barcode</span>
                                                </div>
                                            </div>

                                            {!showBarcodeScanner ? (
                                                <button
                                                    onClick={() => setShowBarcodeScanner(true)}
                                                    className="w-full py-4 border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-400 hover:text-emerald-500 hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <Scan className="w-5 h-5" />
                                                    <span className="font-medium">Scan Barcode</span>
                                                </button>
                                            ) : (
                                                <div className="bg-black rounded-xl overflow-hidden relative min-h-[200px] flex flex-col items-center justify-center animate-in fade-in slide-in-from-top-4 duration-300">
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
                                        </div>
                                    )}

                                    {mode === 'manual' && (
                                        <div className="space-y-4">
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
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>

                            <div className="space-y-4 mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">Skin Type</label>
                                    <select
                                        name="skin_type"
                                        value={formData.skin_type}
                                        onChange={handleChange}
                                        className="input-field bg-zinc-50 dark:bg-zinc-800/50"
                                    >
                                        <option>Normal</option>
                                        <option>Oily</option>
                                        <option>Dry</option>
                                        <option>Combination</option>
                                        <option>Sensitive</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">Skin Tone</label>
                                    <select
                                        name="skin_tone"
                                        value={formData.skin_tone}
                                        onChange={handleChange}
                                        className="input-field bg-zinc-50 dark:bg-zinc-800/50"
                                    >
                                        <option>Fair</option>
                                        <option>Medium</option>
                                        <option>Dark</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">Frequency</label>
                                        <select
                                            name="usage_frequency"
                                            value={formData.usage_frequency}
                                            onChange={handleChange}
                                            className="input-field bg-zinc-50 dark:bg-zinc-800/50"
                                        >
                                            <option>Daily</option>
                                            <option>Weekly</option>
                                            <option>Occasional</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">Amount</label>
                                        <select
                                            name="amount_applied"
                                            value={formData.amount_applied}
                                            onChange={handleChange}
                                            className="input-field bg-zinc-50 dark:bg-zinc-800/50"
                                        >
                                            <option>Pea</option>
                                            <option>Normal</option>
                                            <option>Generous</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8">
                                <Button onClick={handleSubmit} disabled={loading} className="w-full" loading={loading}>
                                    {loading ? 'Analyzing...' : 'Analyze Product'}
                                </Button>
                            </div>

                            {error && (
                                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-xl text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                                    <AlertTriangle size={16} />
                                    {error}
                                </div>
                            )}
                        </Card>
                    </div>

                    {/* Results Section */}
                    <div className="lg:col-span-2">
                        {!result ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/50">
                                <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
                                    <Scan className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                                    Ready to Analyze
                                </h3>
                                <p className="text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto mb-8">
                                    Select a product from the search, scan a barcode, or upload an ingredient list to get a detailed toxicity report.
                                </p>
                                <div className="grid grid-cols-2 gap-4 text-sm text-zinc-400 dark:text-zinc-500">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                        <span>Toxicity Score</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                                        <span>Ingredient Risk</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                                        <span>Skin Compatibility</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-purple-500" />
                                        <span>Better Alternatives</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-6"
                            >
                                {/* Score Card */}
                                <Card>
                                    <div className="flex justify-between items-start mb-8">
                                        <div>
                                            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">{result.product_name || "Analyzed Product"}</h2>
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
                                            <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Toxicity Score</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-xl border border-zinc-100 dark:border-zinc-800">
                                        <div>
                                            <div className="text-sm font-medium text-zinc-500 mb-1">Base Score</div>
                                            <div className="font-mono text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{result.detailed_score_breakdown?.base_score || '-'}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-zinc-500 mb-1">Usage Factor</div>
                                            <div className="font-mono text-2xl font-semibold text-zinc-900 dark:text-zinc-100">x{result.detailed_score_breakdown?.usage_factor || '-'}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-zinc-500 mb-1">Ingredients</div>
                                            <div className="font-mono text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{result.ingredients.length}</div>
                                        </div>
                                    </div>

                                    {currentUser && (
                                        <div className="mt-6 flex items-center gap-3">
                                            <Button onClick={handleAddToFavorites} variant="outline" className="flex-1">
                                                <Heart className="w-4 h-4 mr-2" /> Add to Favorites
                                            </Button>
                                            <Button onClick={() => setShowShareCard(true)} variant="outline" className="flex-1">
                                                <Share2 className="w-4 h-4 mr-2" /> Share Result
                                            </Button>
                                        </div>
                                    )}
                                    {favMessage && <div className="mt-2 text-center text-sm text-emerald-500 font-medium">{favMessage}</div>}
                                </Card>

                                {/* Suitability Warnings */}
                                {(result.not_suitable_for_skin_type.length > 0 || result.not_suitable_for_skin_tone.length > 0) && (
                                    <Card title="Suitability Warnings">
                                        <div className="space-y-6">
                                            {result.not_suitable_for_skin_type.length > 0 && (
                                                <div>
                                                    <h4 className="text-sm font-bold text-zinc-500 uppercase mb-3 flex items-center gap-2">
                                                        <AlertTriangle size={14} /> Skin Type Mismatch
                                                    </h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {result.not_suitable_for_skin_type.map((ing, i) => (
                                                            <Badge key={i} variant="warning">{ing}</Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {result.not_suitable_for_skin_tone.length > 0 && (
                                                <div>
                                                    <h4 className="text-sm font-bold text-zinc-500 uppercase mb-3 flex items-center gap-2">
                                                        <AlertTriangle size={14} /> Skin Tone Mismatch
                                                    </h4>
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
                                                <div key={i} className="flex items-center space-x-4 p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer group">
                                                    <div className="flex-1">
                                                        <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 transition-colors">{alt.product_name}</h4>
                                                        <p className="text-sm text-zinc-500">{alt.brand}</p>
                                                    </div>
                                                    <Badge variant="success">{Math.round(alt.toxicity_score * 100)}</Badge>
                                                </div>
                                            ))}
                                        </div>
                                    </Card>
                                )}

                                {/* Ingredient Breakdown */}
                                <Card title="Ingredient Analysis">
                                    <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
                                        <div className="max-h-96 overflow-y-auto custom-scrollbar">
                                            <table className="w-full text-sm text-left relative">
                                                <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 font-medium sticky top-0 z-10 shadow-sm">
                                                    <tr>
                                                        <th className="px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50">Ingredient</th>
                                                        <th className="px-4 py-3 text-right bg-zinc-50 dark:bg-zinc-800/50">Risk Level</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                                    {result.toxicity_report.map((item, idx) => (
                                                        <tr
                                                            key={idx}
                                                            onClick={() => setSelectedIngredient({ name: item.ingredient, risk: item.label })}
                                                            className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors cursor-pointer group"
                                                        >
                                                            <td className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-200 flex items-center gap-2">
                                                                <div className={`w-2 h-2 rounded-full ${item.label === 'SAFE' ? 'bg-emerald-500' :
                                                                    item.label === 'LOW RISK' ? 'bg-blue-500' :
                                                                        item.label === 'MODERATE RISK' ? 'bg-amber-500' : 'bg-red-500'
                                                                    }`} />
                                                                {item.ingredient}
                                                                <Info size={14} className="opacity-0 group-hover:opacity-100 text-zinc-400 transition-opacity" />
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
                            </motion.div>
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

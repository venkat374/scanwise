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
import OnboardingModal from '../components/OnboardingModal';
import ScoreCard from '../components/ScoreCard';
import KeyTakeaways from '../components/KeyTakeaways';

import config from "../config";

export default function Dashboard() {
    const { currentUser, userProfile, profileLoading } = useAuth();
    const [formData, setFormData] = useState({
        product_name: '',
        skin_type: 'Normal',
        skin_tone: 'Medium',
        usage_frequency: 'Daily',
        amount_applied: 'Normal',
        ingredients_list: '',
        barcode: '', // Store selected product ID
        category: '',
        age_group: '',
        skin_concerns: [],
        allergies: []
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

    // Auto-fill profile data from context
    useEffect(() => {
        if (userProfile) {
            setFormData(prev => ({
                ...prev,
                skin_type: userProfile.skin_type || prev.skin_type,
                skin_tone: userProfile.skin_tone || prev.skin_tone,
                age_group: userProfile.age_group || prev.age_group,
                skin_concerns: userProfile.skin_concerns || prev.skin_concerns,
                allergies: userProfile.allergies || prev.allergies
            }));
        }
    }, [userProfile]);

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

    const handleBarcodeScanned = async (imageBlob) => {
        setLoading(true);
        setShowBarcodeScanner(false); // Close scanner immediately

        const formData = new FormData();
        formData.append('file', imageBlob, 'barcode.jpg');

        try {
            const res = await axios.post(`${config.API_BASE_URL}/scan-barcode-image`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data.error) {
                setError(res.data.error);
            } else if (res.data.found) {
                const product = res.data.product;
                setFormData({
                    ...formData,
                    product_name: product.product_name || "Unknown Product",
                    ingredients_list: product.ingredients_text || (Array.isArray(product.ingredients) ? product.ingredients.join(', ') : ''),
                    barcode: res.data.barcode
                });
                setMode('manual'); // Switch to manual to review
            } else {
                // Barcode found but product not in DB
                setError(`Product not found (Barcode: ${res.data.barcode}). You can add it via the Admin Portal.`);
            }
        } catch (err) {
            console.error("Barcode scan error:", err);
            setError("Failed to analyze barcode image. Please try again or enter manually.");
        }
        setLoading(false);
    };

    // ...



    const handleSubmit = async () => {
        setLoading(true);
        setError(null);
        setResult(null);
        setFavMessage("");

        const payload = {
            ...formData,
            ingredients_list: (mode === 'manual' || mode === 'scan') ? formData.ingredients_list : null,
            barcode: formData.barcode || null // Always send barcode if available
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
                                        <BarcodeScanner
                                            onCapture={handleBarcodeScanned}
                                            onClose={() => setShowBarcodeScanner(false)}
                                        />
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
                                        placeholder="e.g. CeraVe Moisturizing Cream"
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
                            <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50">
                                <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mb-6">
                                    <Scan className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                                    Ready to Analyze
                                </h3>
                                <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-8">
                                    Select a product from the search, scan a barcode, or upload an ingredient list to get a detailed toxicity report.
                                </p>
                                <div className="grid grid-cols-2 gap-4 text-sm text-slate-400 dark:text-slate-500">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                        <span>Safety Rating</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                                        <span>Wellness Match</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                                        <span>Key Takeaways</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-purple-500" />
                                        <span>Detailed Analysis</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Product Header */}
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h2 className="text-3xl font-bold tracking-tight">{result.product_name || "Analyzed Product"}</h2>
                                        <p className="text-muted-foreground">{result.category || "General Skincare"}</p>
                                    </div>
                                    {currentUser && (
                                        <Button onClick={handleAddToFavorites} variant="outline" size="sm">
                                            <Heart className="w-4 h-4 mr-2" /> {favMessage || "Save"}
                                        </Button>
                                    )}
                                </div>

                                {/* New Results Layout */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Safety Score Card */}
                                    <ScoreCard
                                        title="Safety Rating"
                                        score={Math.round((1 - result.product_toxicity_score) * 100)} // Invert for "Safety"
                                        maxScore={100}
                                        type="safety"
                                        description="A measure of how clean the ingredient list is, based on known toxins and irritants."
                                        level={result.product_status === 'SAFE' ? 'Clean & Safe' : result.product_status === 'MODERATE' ? 'Moderate Risk' : 'High Risk'}
                                    />

                                    {/* Wellness Match Card */}
                                    {result.wellness_match && result.wellness_match.match_level !== "Unknown" ? (
                                        <ScoreCard
                                            title="Wellness Match"
                                            score={result.wellness_match.score}
                                            maxScore={100}
                                            type="wellness"
                                            description="How well this product aligns with your skin type, concerns, and age group."
                                            level={result.wellness_match.match_level}
                                        />
                                    ) : (
                                        <div className="bg-muted/30 rounded-xl border border-dashed border-muted-foreground/20 flex items-center justify-center p-6 text-muted-foreground text-sm text-center">
                                            Complete your profile to see your Wellness Match score.
                                        </div>
                                    )}
                                </div>

                                {/* Key Takeaways */}
                                <KeyTakeaways result={result} />

                                {/* Detailed Breakdown (Collapsible or Secondary) */}
                                <Card title="Detailed Analysis">
                                    <div className="grid grid-cols-3 gap-4 bg-muted/50 p-6 rounded-lg border border-border mb-6">
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

            <OnboardingModal
                isOpen={!!currentUser && !profileLoading && (!userProfile?.age_group || !userProfile?.skin_type)}
                onClose={() => { }} // Mandatory, so no close action
            />
        </div>
    );
}

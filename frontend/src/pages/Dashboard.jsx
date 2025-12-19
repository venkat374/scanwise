import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { Scan, Type, Search, Heart, Share2, Info, X, Sparkles, AlertTriangle, Plus, Loader2 } from 'lucide-react';
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
import DupeCard from '../components/DupeCard';
import config from "../config";

export default function Dashboard() {
    const { currentUser, userProfile, profileLoading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleAddToRoutine = () => {
        if (!result) return;

        const currentRoutine = JSON.parse(localStorage.getItem('routine_products') || '[]');
        // Check if already exists (by name or ID)
        const exists = currentRoutine.find(p => p.name === result.product_name);

        if (!exists) {
            currentRoutine.push({
                id: result.barcode || Math.random().toString(),
                name: result.product_name,
                ingredients: result.ingredients || []
            });
            localStorage.setItem('routine_products', JSON.stringify(currentRoutine));
        }

        navigate('/routine');
    };
    const [formData, setFormData] = useState({
        product_name: '',
        skin_type: 'Normal',
        skin_tone: 'Medium',
        usage_frequency: 'Daily',
        amount_applied: 'Normal',
        ingredients_list: '',
        barcode: '',
        category: '',
        age_group: '',
        skin_concerns: [],
        allergies: []
    });
    const [mode, setMode] = useState('manual'); // 'manual', 'scan', 'history'
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [favMessage, setFavMessage] = useState("");
    const [selectedIngredient, setSelectedIngredient] = useState(null);
    const [showShareCard, setShowShareCard] = useState(false);
    const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);

    const [browseCategory, setBrowseCategory] = useState(null); // New state for browsing
    const [browseProducts, setBrowseProducts] = useState([]);   // Products to show in browse mode

    // Auto-fill from navigation state (e.g. from SkinAnalysis)
    useEffect(() => {
        if (location.state?.product) {
            const p = location.state.product;
            setFormData(prev => ({
                ...prev,
                product_name: p.product_name || p.name || "",
                brand: p.brand || "",
                category: p.category || "",
                ingredients_list: Array.isArray(p.ingredients) ? p.ingredients.join(", ") : (p.ingredients || "")
            }));
            setMode('manual'); // Show details form

            // Auto-Analyze Logic: Trigger immediately cleanly
            // We use a timeout to let state update first, or ideally refactor handleSubmit to accept data
            setTimeout(() => {
                analyzeProductDirectly(p);
            }, 100);
        } else if (location.state?.category) {
            setMode('browse');
            setBrowseCategory(location.state.category);
            fetchCategoryProducts(location.state.category);
        }
    }, [location.state]);

    // Helper to analyze directly without relying solely on form state updates (safer)
    const analyzeProductDirectly = async (productData) => {
        setLoading(true);
        setError(null);
        setResult(null);

        // Construct payload from passed data + profile defaults
        const currentProfile = userProfile || {};
        const payload = {
            product_name: productData.product_name || productData.name || "",
            ingredients_list: Array.isArray(productData.ingredients) ? productData.ingredients.join(", ") : (productData.ingredients || ""),
            category: productData.category || "",
            skin_type: currentProfile.skin_type || formData.skin_type || 'Normal',
            skin_tone: currentProfile.skin_tone || formData.skin_tone || 'Medium',
            age_group: currentProfile.age_group || formData.age_group,
            skin_concerns: currentProfile.skin_conditions || formData.skin_concerns || [],
            allergies: currentProfile.allergies || formData.allergies || []
        };

        try {
            const response = await axios.post(`${config.API_BASE_URL}/scan-product`, payload);
            if (response.data.error) {
                setError(response.data.error);
            } else {
                setResult({ ...response.data, routine_report: null });
            }
        } catch (err) {
            setError("Failed to analyze product. Please try again.");
            console.error(err);
        }
        setLoading(false);
    };

    const fetchCategoryProducts = async (category) => {
        setLoading(true);
        try {
            // Re-use suggest-products endpoint but maybe without forcing a skin report if just browsing?
            // Actually, we want recommendations relevant to them if possible, but generic is fine for "Find X".
            // Let's just query by category roughly.
            // Using the same endpoint as SkinAnalysis for consistency
            const payload = {
                category: category,
                skin_report: userProfile?.latest_skin_report || {} // Use profile if available
            };

            const res = await axios.post(`${config.API_BASE_URL}/suggest-products`, payload, { timeout: 60000 });
            setBrowseProducts(res.data || []);
        } catch (err) {
            console.error("Browse error", err);
            setError("Could not load products for this category.");
        }
        setLoading(false);
    };

    // Auto-fill profile data
    useEffect(() => {
        if (userProfile && !location.state?.product) { // Only if not overriden by direct product nav
            // Prioritize data from the latest AI Skin Report if available
            const skinReport = userProfile.latest_skin_report;
            setFormData(prev => ({
                ...prev,
                skin_type: skinReport?.skin_type || userProfile.skin_type || prev.skin_type,
                skin_tone: userProfile.skin_tone || prev.skin_tone,
                age_group: userProfile.age_group || prev.age_group,
                skin_concerns: skinReport?.skin_conditions ?
                    [...new Set([...(userProfile.skin_concerns || []), ...skinReport.skin_conditions])] :
                    (userProfile.skin_concerns || prev.skin_concerns),
                allergies: userProfile.allergies || prev.allergies
            }));
        }
    }, [userProfile, location.state]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleProductSelect = (product) => {
        setFormData({
            ...formData,
            product_name: product.product_name,
            barcode: product.id
        });
    };

    const handleOCRResult = (data) => {
        const ingredientsText = Array.isArray(data.ingredients) ? data.ingredients.join(', ') : data.ingredients;
        setFormData(prev => ({
            ...prev,
            ingredients_list: ingredientsText,
            product_name: data.product_name || prev.product_name,
            category: data.category || ''
        }));
        setMode('manual');
    };

    const handleBarcodeScanned = async (imageBlob) => {
        setLoading(true);
        setShowBarcodeScanner(false);
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
                setMode('manual');
            } else {
                setError(`Product not found (Barcode: ${res.data.barcode}).`);
            }
        } catch (err) {
            console.error("Barcode scan error:", err);
            setError("Failed to analyze barcode image.");
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
            barcode: formData.barcode || null
        };

        try {
            const response = await axios.post(`${config.API_BASE_URL}/scan-product`, payload, { timeout: 60000 });
            if (response.data.error) {
                setError(response.data.error);
            } else {
                // Check Routine Compatibility if logged in
                // Check Routine Compatibility if logged in
                // NOTE: /check-routine-compatibility is deprecated. 
                // We now handle routine analysis in the Routine page or via /analyze-routine with full list.
                // For now, we skip this check on the dashboard to avoid 404s.
                let routineData = null;

                setResult({ ...response.data, routine_report: routineData });
                // Save history logic omitted for brevity, can be re-added if needed
            }
        } catch (err) {
            setError("Failed to connect to the server.");
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
            setFavMessage(res.data.status === 'exists' ? "Already in favorites" : "Added to favorites!");
        } catch (err) {
            console.error("Failed to add favorite", err);
        }
    };

    return (
        <div className="min-h-screen bg-transparent text-slate-900 dark:text-slate-100 font-sans">
            <div className="max-w-6xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Dashboard</h1>
                    <p className="text-slate-500 dark:text-slate-400">Analyze products and check their safety.</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Input Section */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card title="Product Details">
                            <div className="grid grid-cols-3 gap-1 bg-muted p-1 rounded-lg mb-6">
                                {['search', 'scan', 'manual', 'browse'].map(m => (
                                    (m !== 'browse' || mode === 'browse') && (
                                        <button
                                            key={m}
                                            onClick={() => setMode(m)}
                                            className={`flex items-center justify-center py-2 rounded-md text-sm font-medium transition-all ${mode === m ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                        >
                                            {m === 'search' && <Search className="w-4 h-4 mr-2" />}
                                            {m === 'scan' && <Scan className="w-4 h-4 mr-2" />}
                                            {m === 'manual' && <Type className="w-4 h-4 mr-2" />}
                                            {m === 'browse' && <Sparkles className="w-4 h-4 mr-2" />}
                                            {m.charAt(0).toUpperCase() + m.slice(1)}
                                        </button>
                                    )
                                ))}
                            </div>

                            {mode === 'search' && (
                                <Autocomplete
                                    label="Search Product"
                                    value={formData.product_name}
                                    onChange={handleChange}
                                    onSelect={handleProductSelect}
                                    placeholder="Type to search..."
                                    name="product_name"
                                />
                            )}

                            {mode === 'browse' && (
                                <div className="space-y-4">
                                    <h3 className="text-sm font-medium text-muted-foreground uppercase">
                                        Browsing: <span className="text-primary font-bold">{browseCategory}</span>
                                    </h3>
                                    <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                        {browseProducts.length > 0 ? (
                                            browseProducts.map((prod, idx) => (
                                                <div
                                                    key={idx}
                                                    onClick={() => analyzeProductDirectly(prod)}
                                                    className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer transition-colors group"
                                                >
                                                    {prod.image_url ? (
                                                        <img src={prod.image_url} alt={prod.product_name} className="w-10 h-10 rounded object-cover" />
                                                    ) : (
                                                        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center">
                                                            <Sparkles size={16} className="text-slate-400" />
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-medium text-sm truncate group-hover:text-primary">{prod.product_name}</div>
                                                        <div className="text-xs text-muted-foreground">{prod.brand}</div>
                                                    </div>
                                                    <div className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded">
                                                        {Math.round((1 - (prod.toxicity_score / 100)) * 100)}%
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-8 text-muted-foreground text-sm">
                                                {loading ? "Loading..." : "No products found for this category."}
                                            </div>
                                        )}
                                    </div>
                                    <Button onClick={() => setMode('search')} variant="outline" className="w-full">
                                        Search Manually
                                    </Button>
                                </div>
                            )}

                            {mode === 'scan' && (
                                <div className="space-y-6">
                                    {!showBarcodeScanner ? (
                                        <button
                                            onClick={() => setShowBarcodeScanner(true)}
                                            className="w-full py-3 border-2 border-dashed border-zinc-700 rounded-xl text-zinc-400 hover:text-white hover:border-zinc-500 hover:bg-zinc-800/50 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Scan className="w-5 h-5" /> Scan Barcode
                                        </button>
                                    ) : (
                                        <BarcodeScanner
                                            onCapture={handleBarcodeScanned}
                                            onClose={() => setShowBarcodeScanner(false)}
                                        />
                                    )}
                                    <OCRUploader onTextExtracted={handleOCRResult} />
                                </div>
                            )}

                            {mode === 'manual' && (
                                <>
                                    <Input
                                        label="Product Name"
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
                                    <label className="block text-sm font-medium mb-2">Category</label>
                                    <select name="category" value={formData.category} onChange={handleChange} className="input-field">
                                        <option value="">Select Category</option>
                                        <option value="Moisturizer">Moisturizer</option>
                                        <option value="Serum">Serum</option>
                                        <option value="Cleanser">Cleanser</option>
                                        <option value="Sunscreen">Sunscreen</option>
                                        <option value="Toner">Toner</option>
                                    </select>
                                </div>
                                {/* Skin Type/Tone selectors omitted for brevity but can be added back */}
                            </div>

                            <div className="mt-6">
                                <Button onClick={handleSubmit} disabled={loading} className="w-full">
                                    {loading ? 'Analyzing...' : 'Analyze Product'}
                                </Button>
                            </div>
                            {error && <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">{error}</div>}
                        </Card>
                    </div>

                    {/* Results Section */}
                    <div className="lg:col-span-2">
                        {loading ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50">
                                <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mb-6" />
                                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">Analyzing Product...</h3>
                                <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">Checking ingredients against safety database.</p>
                            </div>
                        ) : !result ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50">
                                <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mb-6">
                                    <Scan className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">Ready to Analyze</h3>
                                <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">Select a product to get a detailed report.</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h2 className="text-3xl font-bold tracking-tight">{result.product_name || "Analyzed Product"}</h2>
                                        <p className="text-muted-foreground">{result.category || "General Skincare"}</p>
                                    </div>
                                    {currentUser && (
                                        <div className="flex gap-2">
                                            <Button onClick={handleAddToRoutine} variant="outline" size="sm">
                                                <Plus className="w-4 h-4 mr-2" /> Add to Routine
                                            </Button>
                                            <Button onClick={handleAddToFavorites} variant="outline" size="sm">
                                                <Heart className="w-4 h-4 mr-2" /> {favMessage || "Save"}
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <ScoreCard
                                        title="Safety Rating"
                                        score={Math.round((1 - result.product_toxicity_score) * 100)}
                                        maxScore={100}
                                        type="safety"
                                        description="A measure of how clean the ingredient list is."
                                        level={result.product_status === 'SAFE' ? 'Clean & Safe' : result.product_status === 'MODERATE' ? 'Moderate Risk' : 'High Risk'}
                                        details={[
                                            `Base Ingredient Safety: ${Math.round((1 - (result.detailed_score_breakdown?.base_score || 0)) * 100)}/100`,
                                            `Usage Adjustment: ${result.detailed_score_breakdown?.usage_factor === 1 ? 'Standard' : result.detailed_score_breakdown?.usage_factor < 1 ? 'Low Usage (Safer)' : 'High Usage (Riskier)'}`,
                                            result.product_status === 'SAFE' ? 'No high-risk toxins found.' : 'Contains potential irritants.'
                                        ]}
                                    />
                                    {result.wellness_match && (
                                        <ScoreCard
                                            title="Wellness Match"
                                            score={result.wellness_match.score}
                                            maxScore={100}
                                            type="wellness"
                                            description="Alignment with your skin profile."
                                            level={result.wellness_match.match_level}
                                            details={[
                                                ...result.wellness_match.positive_matches.map(m => `✅ ${m}`),
                                                ...result.wellness_match.negative_matches.map(m => `⚠️ ${m}`)
                                            ]}
                                        />
                                    )}
                                </div>

                                <div className="grid grid-cols-1 gap-6">
                                    {/* Dupe Card */}
                                    {result.dupes && result.dupes.length > 0 && (
                                        <DupeCard dupes={result.dupes} />
                                    )}

                                    {/* Routine Compatibility Report */}
                                    {result.routine_report && !result.routine_report.compatible && (
                                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
                                            <div className="flex items-center gap-2 mb-4">
                                                <AlertTriangle className="text-red-600 dark:text-red-400" size={24} />
                                                <h3 className="font-semibold text-lg text-red-900 dark:text-red-100">Routine Conflict Detected</h3>
                                            </div>
                                            <div className="space-y-3">
                                                {result.routine_report.conflicts.map((conflict, idx) => (
                                                    <div key={idx} className="bg-white dark:bg-red-950/50 p-4 rounded-lg border border-red-100 dark:border-red-900/50">
                                                        <div className="font-bold text-red-800 dark:text-red-200 mb-1">
                                                            {conflict.conflict}
                                                        </div>
                                                        <div className="text-sm text-red-700 dark:text-red-300 mb-2">
                                                            Conflict with: <strong>{conflict.with_product}</strong>
                                                        </div>
                                                        <p className="text-sm text-red-600 dark:text-red-400">
                                                            {conflict.description}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Efficacy Report */}
                                    {result.efficacy_report && (
                                        <Card title="Efficacy Analysis">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-4">
                                                        <div className="text-4xl font-black text-indigo-600 dark:text-indigo-400">
                                                            {result.efficacy_report.efficacy_score}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">
                                                            / 100<br />Efficacy Score
                                                        </div>
                                                    </div>
                                                    {result.efficacy_report.angel_dusting_warning && (
                                                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 rounded-lg text-sm text-amber-800 dark:text-amber-200 flex gap-2">
                                                            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                                                            <div>
                                                                <strong>Potential Angel Dusting:</strong><br />
                                                                Some active ingredients appear to be in very low concentrations.
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold mb-2 text-sm">Hero Ingredients</h4>
                                                    <div className="space-y-2">
                                                        {result.efficacy_report.hero_ingredients && result.efficacy_report.hero_ingredients.length > 0 ? (
                                                            result.efficacy_report.hero_ingredients.map((hero, idx) => (
                                                                <div key={idx} className="flex justify-between text-sm border-b border-border pb-1">
                                                                    <span>{hero.name}</span>
                                                                    <span className="text-muted-foreground text-xs">{hero.reason}</span>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <p className="text-sm text-muted-foreground">No major hero ingredients detected.</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    )}
                                </div>

                                <div className="mt-8">
                                    <KeyTakeaways result={result} />
                                </div>

                                <div className="mt-8">
                                    <Card title="Detailed Analysis">
                                        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                                            <div className="max-h-96 overflow-y-auto custom-scrollbar">
                                                <table className="w-full text-sm text-left relative">
                                                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium sticky top-0 z-10 shadow-sm">
                                                        <tr>
                                                            <th className="px-4 py-3">Ingredient</th>
                                                            <th className="px-4 py-3 text-right">Risk Level</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                        {result.toxicity_report.map((item, idx) => (
                                                            <tr key={idx} onClick={() => setSelectedIngredient({ name: item.ingredient, risk: item.label })} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 cursor-pointer">
                                                                <td className="px-4 py-3 font-medium flex items-center gap-2">
                                                                    <div className={`w-2 h-2 rounded-full ${item.label === 'SAFE' ? 'bg-emerald-500' : item.label === 'LOW RISK' ? 'bg-blue-500' : 'bg-red-500'}`} />
                                                                    {item.ingredient}
                                                                </td>
                                                                <td className="px-4 py-3 text-right">
                                                                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${item.label === 'SAFE' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
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
                            </div>
                        )}
                    </div>
                </div>
                <IngredientModal
                    ingredientName={selectedIngredient?.name}
                    riskLevel={selectedIngredient?.risk}
                    onClose={() => setSelectedIngredient(null)}
                />
                {showShareCard && result && <ShareCard product={result} onClose={() => setShowShareCard(false)} />}
                <OnboardingModal isOpen={!!currentUser && !profileLoading && !userProfile?.latest_skin_report && (!userProfile?.age_group || !userProfile?.skin_type)} onClose={() => { }} />
            </div>
        </div>
    );
}

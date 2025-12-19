import React, { useState } from 'react';
import axios from 'axios';
import { Camera, RefreshCw, AlertTriangle, CheckCircle, Info, ChevronRight, Droplet, Sun, Zap, Loader2, ScanFace } from 'lucide-react';
import config from '../config';
import Button from '../components/Button';
import Card from '../components/Card';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function SkinAnalysis() {
    const { currentUser, userProfile, refreshProfile } = useAuth();
    const navigate = useNavigate();
    const [image, setImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState(null);
    const [recommendations, setRecommendations] = useState([]);
    const [productSuggestions, setProductSuggestions] = useState({}); // { category: [products] }
    const [error, setError] = useState(null);
    const [isRescanning, setIsRescanning] = useState(false);
    const [fetchingProducts, setFetchingProducts] = useState(false);

    // Initial Load from User Profile
    React.useEffect(() => {
        if (userProfile?.latest_skin_report && !report && !isRescanning) {
            setReport(userProfile.latest_skin_report);
            fetchRecommendations(userProfile.latest_skin_report);
        }
    }, [userProfile, isRescanning]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            setPreviewUrl(URL.createObjectURL(file));
            setReport(null);
            setRecommendations([]);
            setProductSuggestions({});
            setError(null);
        }
    };

    const fetchRecommendations = async (skinReport) => {
        try {
            setFetchingProducts(true);
            // 2. Get Category Recommendations
            const checkRes = await axios.post(`${config.API_BASE_URL}/recommend-categories`, {
                skin_report: skinReport
            }, { timeout: 60000 });
            const recs = checkRes.data;
            setRecommendations(recs);

            // 3. (Optional) Fetch products for top categories
            const suggestions = {};
            for (const rec of recs) { // Fetch ALL recommendations, not just top 3
                try {
                    // Use broader 'search_term' if available, otherwise 'category'
                    const queryCategory = rec.search_term || rec.category;

                    const prodRes = await axios.post(`${config.API_BASE_URL}/suggest-products`, {
                        category: queryCategory,
                        skin_report: skinReport
                    }, { timeout: 60000 });
                    if (prodRes.data && prodRes.data.length > 0) {
                        suggestions[rec.category] = prodRes.data;
                    }
                } catch (err) {
                    console.error("Failed to fetch suggestion for", rec.category, err);
                }
            }
            setProductSuggestions(suggestions);
        } catch (err) {
            console.error("Error fetching recommendations", err);
        } finally {
            setFetchingProducts(false);
        }
    };

    const handleAnalyze = async () => {
        if (!image) return;

        setLoading(true);
        setError(null);

        try {
            // 1. Upload and Analyze Face
            const formData = new FormData();
            formData.append('file', image);

            const token = currentUser ? await currentUser.getIdToken() : "";
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            const analysisRes = await axios.post(`${config.API_BASE_URL}/analyze-face`, formData, {
                headers: {
                    ...headers,
                    'Content-Type': 'multipart/form-data'
                },
                timeout: 90000 // Allow 90s for image upload + Gemini AI Analysis
            });

            if (analysisRes.data.error) throw new Error(analysisRes.data.error);
            const skinReport = analysisRes.data;
            setReport(skinReport);
            setIsRescanning(false); // Done rescanning

            setLoading(false); // Unblock UI immediately so Report shows up

            // Wait for backend to be consistent then refresh profile context
            // This ensures Dashboard doesn't show "Personalize" modal again
            setTimeout(() => {
                refreshProfile();
            }, 1000);

            fetchRecommendations(skinReport); // Fetch products in background

        } catch (err) {
            console.error(err);
            setError(err.message || "Failed to analyze skin.");
            setLoading(false);
        }
    };

    const getSeverityColor = (score) => {
        if (score < 30) return 'bg-emerald-500';
        if (score < 60) return 'bg-amber-500';
        return 'bg-red-500';
    };

    const handleStartRescan = () => {
        setReport(null);
        setImage(null);
        setPreviewUrl(null);
        setIsRescanning(true);
    };

    return (
        <div className="min-h-screen p-6 max-w-7xl mx-auto space-y-8">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">AI Skin Analysis</h1>
                <p className="text-muted-foreground">Upload a selfie to understand your skin health and get personalized guidance.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Column: Upload & Preview - Sticky on Desktop */}
                <div className="space-y-6 lg:col-span-4 lg:sticky lg:top-8">

                    <Card title={report ? "Your Skin Profile" : "Face Scan"}>
                        <div className="flex flex-col items-center gap-6 p-4">
                            {report && !isRescanning ? (
                                <div className="text-center space-y-4 w-full">
                                    <div className="relative w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-emerald-500/20">
                                        {/* If we stored the image URL, we would show it here. For now, show a placeholder or the preview if available locally */}
                                        {previewUrl ? (
                                            <img src={previewUrl} alt="Your Scan" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                                                <ScanFace size={40} className="text-slate-400" />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">Analysis Complete</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Last updated: {report.timestamp ? new Date(report.timestamp).toLocaleDateString() : "Just now"}
                                        </p>
                                    </div>

                                    <Button onClick={handleStartRescan} variant="outline" className="w-full">
                                        <RefreshCw className="w-4 h-4 mr-2" /> Update Analysis
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    {previewUrl ? (
                                        <div className="relative w-full aspect-[3/4] max-w-sm rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md">
                                            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                            <button
                                                onClick={() => { setImage(null); setPreviewUrl(null); }}
                                                className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70"
                                            >
                                                <RefreshCw size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="flex flex-col items-center justify-center w-full aspect-[3/4] max-w-sm border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <Camera className="w-12 h-12 mb-4 text-slate-400" />
                                                <p className="mb-2 text-sm text-slate-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                                <p className="text-xs text-slate-500">PNG, JPG (ensure good lighting)</p>
                                            </div>
                                            <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                                        </label>
                                    )}

                                    {image && (
                                        <Button onClick={handleAnalyze} disabled={loading} className="w-full max-w-sm">
                                            {loading ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing Skin...
                                                </>
                                            ) : (
                                                'Start Analysis'
                                            )}
                                        </Button>
                                    )}
                                </>
                            )}


                            {error && (
                                <div className="text-destructive text-sm bg-destructive/10 p-3 rounded-md border border-destructive/20">
                                    {error}
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Right Column: Results */}
                <div className="space-y-6 lg:col-span-8">
                    {!report && !loading && (
                        <div className="h-full flex items-center justify-center text-muted-foreground p-8 border border-dashed rounded-xl lg:min-h-[400px]">
                            <div className="text-center">
                                <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p>Analysis results will appear here.</p>
                            </div>
                        </div>
                    )}

                    {loading && (
                        <div className="space-y-4 animate-pulse">
                            <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
                            <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded"></div>
                            <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded"></div>
                        </div>
                    )}

                    {report && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Skin Report Summary */}
                            <Card title="Skin Health Report">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center pb-2 border-b border-border">
                                        <span className="text-sm font-medium text-muted-foreground">Estimated Skin Type</span>
                                        <span className="text-lg font-bold text-primary">{report.skin_type}</span>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-medium mb-3">Key Concerns</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {report.severity_scores && Object.entries(report.severity_scores).map(([condition, score]) => (
                                                <div key={condition} className="space-y-1">
                                                    <div className="flex justify-between text-xs uppercase tracking-wider font-semibold">
                                                        <span>{condition}</span>
                                                        <span>{score}%</span>
                                                    </div>
                                                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full ${getSeverityColor(score)} transition-all duration-1000`}
                                                            style={{ width: `${score}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg text-sm text-slate-700 dark:text-slate-300 italic">
                                        "{report.summary}"
                                    </div>
                                </div>
                            </Card>

                            {/* Recommendations */}
                            <div className="space-y-6">
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <Zap className="w-5 h-5 text-yellow-500" />
                                    Your Routine Guide
                                </h3>
                                {/* Use grid for recommendation cards on massive screens */}
                                <div className="grid grid-cols-1 gap-6">
                                    {recommendations.map((rec, idx) => (
                                        <div key={idx} className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-bold text-lg">{rec.category}</h4>
                                                <span className="text-xs font-mono bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded text-slate-500">
                                                    Recommended
                                                </span>
                                            </div>
                                            <p className="text-sm text-muted-foreground mb-4">{rec.reason}</p>

                                            {productSuggestions[rec.category] ? (
                                                <div className="mt-4 pt-4 border-t border-border">
                                                    <p className="text-xs font-semibold uppercase text-muted-foreground mb-3">Safe Suggestions for You</p>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                                                        {productSuggestions[rec.category].map((prod, pIdx) => (
                                                            <div
                                                                key={pIdx}
                                                                onClick={() => navigate('/dashboard', { state: { product: prod } })}
                                                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer group border border-transparent hover:border-slate-200 dark:hover:border-slate-800"
                                                            >
                                                                {prod.image_url ? (
                                                                    <img src={prod.image_url} alt={prod.product_name} className="w-12 h-12 rounded object-cover flex-shrink-0" />
                                                                ) : (
                                                                    <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded flex-shrink-0 flex items-center justify-center">
                                                                        <Droplet size={16} />
                                                                    </div>
                                                                )}
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="font-medium text-sm line-clamp-2 md:line-clamp-1 group-hover:text-primary transition-colors pr-2 leading-tight py-0.5">{prod.product_name}</div>
                                                                    <div className="text-xs text-muted-foreground">
                                                                        {prod.brand && prod.brand !== "Unknown" ? prod.brand : "Brand"}
                                                                    </div>
                                                                </div>
                                                                <div className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded flex items-center gap-1 flex-shrink-0">
                                                                    {Math.round((1 - (prod.toxicity_score / 100)) * 100)}% <ChevronRight size={12} className="hidden sm:block" />
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : (
                                                fetchingProducts ? (
                                                    <div className="mt-4 pt-4 border-t border-border animate-pulse">
                                                        <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded mb-3"></div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                                                            {[1, 2, 3].map(i => (
                                                                <div key={i} className="flex items-center gap-3 p-2 rounded-lg border border-transparent">
                                                                    <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded flex-shrink-0"></div>
                                                                    <div className="flex-1 space-y-2">
                                                                        <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-3/4"></div>
                                                                        <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="mt-4 pt-4 border-t border-border">
                                                        <Button
                                                            variant="outline"
                                                            className="w-full text-xs h-8"
                                                            onClick={() => navigate('/dashboard', { state: { category: rec.search_term || rec.category } })}
                                                        >
                                                            Find {rec.search_term || rec.category} products
                                                        </Button>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

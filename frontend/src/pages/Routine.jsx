import React, { useState } from 'react';
import axios from 'axios';
import { Plus, Trash2, AlertTriangle, CheckCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';
import Autocomplete from '../components/Autocomplete';
import Badge from '../components/Badge';

import config from "../config";

export default function Routine() {
    const [products, setProducts] = useState([]);
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const handleAddProduct = (product) => {
        if (products.find(p => p.id === product.id)) return;

        // We need ingredients. If the search result doesn't have them (it might just be name/brand),
        // we might need to fetch them. But let's assume for now we can get them or user adds manually.
        // Actually, search-products endpoint returns id, name, brand.
        // We might need to fetch details.
        // For simplicity, let's just add it and if ingredients are missing, we can't analyze fully.
        // But wait, the backend needs ingredients.
        // So we should fetch product details when adding.

        axios.get(`${config.API_BASE_URL}/scan-barcode?barcode=${product.id}`)
            .then(res => {
                const fullProduct = res.data;
                setProducts([...products, {
                    id: fullProduct.barcode || Math.random().toString(),
                    name: fullProduct.product_name,
                    ingredients: fullProduct.ingredients_text ? fullProduct.ingredients_text.split(',').map(i => i.trim()) : []
                }]);
                setSearchQuery('');
            })
            .catch(err => {
                console.error("Failed to fetch product details", err);
                // Fallback: add with empty ingredients (user might need to edit? No edit feature yet)
                setProducts([...products, {
                    id: product.id,
                    name: product.product_name,
                    ingredients: []
                }]);
            });
    };

    const removeProduct = (index) => {
        const newProducts = [...products];
        newProducts.splice(index, 1);
        setProducts(newProducts);
        setAnalysis(null); // Reset analysis when list changes
    };

    const handleAnalyze = async () => {
        if (products.length < 2) return;
        setLoading(true);
        try {
            const payload = {
                products: products.map(p => ({
                    name: p.name,
                    ingredients: p.ingredients
                }))
            };
            const res = await axios.post(`${config.API_BASE_URL}/analyze-routine`, payload);
            setAnalysis(res.data);
        } catch (err) {
            console.error("Analysis failed", err);
        }
        setLoading(false);
    };

    return (
        <div className="font-sans">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Routine Checker</h1>
                    <p className="text-slate-500 dark:text-slate-400">Check for ingredient conflicts in your routine.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Builder Section */}
                    <div className="space-y-6">
                        <Card title="Build Your Routine">
                            <div className="mb-6">
                                <Autocomplete
                                    label="Add Product"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onSelect={handleAddProduct}
                                    placeholder="Search product to add..."
                                    name="search_product"
                                />
                            </div>

                            <div className="space-y-3">
                                {products.length === 0 && (
                                    <p className="text-center text-muted-foreground py-8 text-sm">
                                        No products added yet.
                                    </p>
                                )}
                                {products.map((p, i) => (
                                    <div key={i} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg border border-border">
                                        <div>
                                            <div className="font-medium">{p.name}</div>
                                            <div className="text-xs text-muted-foreground">{p.ingredients.length} ingredients</div>
                                        </div>
                                        <button
                                            onClick={() => removeProduct(i)}
                                            className="text-muted-foreground hover:text-destructive transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6">
                                <Button
                                    onClick={handleAnalyze}
                                    disabled={products.length < 2 || loading}
                                    className="w-full"
                                >
                                    {loading ? 'Analyzing...' : 'Check for Conflicts'}
                                </Button>
                                {products.length < 2 && products.length > 0 && (
                                    <p className="text-xs text-center text-muted-foreground mt-2">
                                        Add at least 2 products to analyze.
                                    </p>
                                )}
                            </div>
                        </Card>
                    </div>

                    {/* Results Section */}
                    <div>
                        {analysis ? (
                            <div className="space-y-6">
                                <Card title="Analysis Result">
                                    <div className="mb-6">
                                        <h3 className="font-semibold mb-2">Summary</h3>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            {analysis.analysis}
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                                            Conflicts Found
                                            <Badge variant={analysis.conflicts.length > 0 ? 'danger' : 'success'}>
                                                {analysis.conflicts.length}
                                            </Badge>
                                        </h3>

                                        {analysis.conflicts.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-8 text-green-500 bg-green-500/10 rounded-lg border border-green-500/20">
                                                <CheckCircle size={32} className="mb-2" />
                                                <p className="font-medium">No conflicts detected!</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {analysis.conflicts.map((c, i) => (
                                                    <div key={i} className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                                                        <div className="flex items-center gap-2 mb-2 text-red-600 dark:text-red-400 font-semibold text-sm">
                                                            <AlertTriangle size={16} />
                                                            Conflict Detected
                                                        </div>
                                                        <div className="text-sm font-medium mb-1">
                                                            {c.product1} <span className="text-muted-foreground">+</span> {c.product2}
                                                        </div>
                                                        <p className="text-xs text-muted-foreground">
                                                            {c.reason}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-zinc-800 rounded-xl min-h-[400px] opacity-50">
                                <p>Analysis results will appear here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

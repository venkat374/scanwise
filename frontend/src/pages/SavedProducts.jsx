import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import config from "../config";
import { motion } from 'framer-motion';
import { Heart, Trash2, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';

export default function SavedProducts() {
    const { currentUser } = useAuth();
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        async function fetchFavorites() {
            if (!currentUser) return;
            try {
                const token = await currentUser.getIdToken();
                const res = await axios.get(`${config.API_BASE_URL}/favorites`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setFavorites(res.data);
            } catch (err) {
                console.error("Failed to fetch favorites", err);
            }
            setLoading(false);
        }
        fetchFavorites();
    }, [currentUser]);

    const handleRemoveFavorite = async (productName) => {
        if (!currentUser) return;
        if (!window.confirm(`Remove ${productName} from favorites?`)) return;

        try {
            const token = await currentUser.getIdToken();
            await axios.delete(`${config.API_BASE_URL}/favorites/${encodeURIComponent(productName)}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFavorites(favorites.filter(item => item.product_name !== productName));
        } catch (err) {
            console.error("Failed to remove favorite", err);
            alert("Failed to remove favorite. Please try again.");
        }
    };

    const handleViewProduct = (product) => {
        // Navigate to dashboard with product data to "view" it
        navigate('/dashboard', {
            state: {
                product: {
                    product_name: product.product_name,
                    brand: product.brand,
                    ingredients: product.ingredients || []
                }
            }
        });
    };

    if (loading) return <div className="p-8 text-center text-zinc-500">Loading saved products...</div>;

    return (
        <div className="font-sans">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Saved Products</h1>
                    <p className="text-zinc-500 dark:text-zinc-400">Your collection of favorite products.</p>
                </div>

                {favorites.length === 0 ? (
                    <div className="text-center text-zinc-500 py-12 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800">
                        <Heart className="w-12 h-12 mx-auto text-zinc-300 mb-4" />
                        <p>No saved products yet.</p>
                        <Button className="mt-4" onClick={() => navigate('/dashboard')}>
                            Explore Products
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {favorites.map((item, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Card className="hover:shadow-md transition-shadow border-zinc-200 dark:border-zinc-800 h-full flex flex-col justify-between">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            {item.image_url ? (
                                                <img src={item.image_url} alt={item.product_name} className="w-12 h-12 rounded-lg object-cover bg-zinc-100" />
                                            ) : (
                                                <div className="w-12 h-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
                                                    <Heart size={20} />
                                                </div>
                                            )}
                                            <div>
                                                <h3 className="font-bold text-zinc-900 dark:text-zinc-100 line-clamp-1">{item.product_name}</h3>
                                                {item.brand && <p className="text-xs text-zinc-500">{item.brand}</p>}
                                                <p className="text-xs text-zinc-400 mt-1">Saved on {new Date(item.timestamp).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 mt-4">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1"
                                            onClick={() => handleViewProduct(item)}
                                        >
                                            <ExternalLink className="w-4 h-4 mr-2" /> View Analysis
                                        </Button>
                                        <button
                                            onClick={() => handleRemoveFavorite(item.product_name)}
                                            className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            title="Remove from favorites"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

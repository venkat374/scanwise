import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import config from '../config';
import { X, Check, ChevronRight, ChevronLeft, ScanFace, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AGE_GROUPS = ["Under 18", "18-24", "25-34", "35-44", "45-54", "55-64", "65+"];
const SKIN_TYPES = ["Dry", "Oily", "Combination", "Normal", "Sensitive"];
const SKIN_CONCERNS = ["Acne", "Aging", "Dark Spots", "Redness", "Dryness", "Pores", "Sensitivity", "Texture"];

export default function OnboardingModal({ isOpen, onClose }) {
    const { currentUser, refreshProfile, userProfile } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(0); // 0 = Intro/Choice, 1-3 = Manual Questions
    const [formData, setFormData] = useState({
        age_group: userProfile?.age_group || "",
        skin_type: userProfile?.skin_type || "",
        skin_concerns: userProfile?.skin_concerns || [],
        allergies: userProfile?.allergies || []
    });
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleNext = () => setStep(prev => prev + 1);
    const handleBack = () => setStep(prev => prev - 1);

    const handleScanChoice = () => {
        onClose();
        navigate('/skin-analysis');
    };

    const handleManualChoice = () => {
        setStep(1);
    };

    const toggleConcern = (concern) => {
        setFormData(prev => {
            const current = prev.skin_concerns || [];
            if (current.includes(concern)) {
                return { ...prev, skin_concerns: current.filter(c => c !== concern) };
            } else {
                return { ...prev, skin_concerns: [...current, concern] };
            }
        });
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const token = await currentUser.getIdToken();
            const res = await fetch(`${config.API_BASE_URL}/users/profile`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    uid: currentUser.uid,
                    email: currentUser.email,
                    ...formData
                })
            });

            if (res.ok) {
                await refreshProfile();
                onClose();
            } else {
                console.error("Failed to save profile");
            }
        } catch (error) {
            console.error("Error saving profile:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-card text-card-foreground rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-border">
                {/* Header */}
                <div className="bg-primary/10 p-6 text-center border-b border-border">
                    <h2 className="text-2xl font-bold text-primary">Let's Personalize ScanWise</h2>
                    {step > 0 && <p className="text-muted-foreground text-sm mt-1">Step {step} of 3</p>}
                </div>

                {/* Body */}
                <div className="p-6 min-h-[300px] flex flex-col">
                    {step === 0 && (
                        <div className="space-y-6 text-center animate-in fade-in slide-in-from-right-4 duration-300">
                            <div>
                                <h3 className="text-xl font-semibold mb-2">How should we analyze your skin?</h3>
                                <p className="text-muted-foreground text-sm">
                                    For the best recommendations, we recommend an AI Face Scan.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <button
                                    onClick={handleScanChoice}
                                    className="flex items-start gap-4 p-4 rounded-xl border-2 border-primary/20 hover:border-primary bg-primary/5 hover:bg-primary/10 transition-all text-left"
                                >
                                    <div className="bg-primary/20 p-2 rounded-full text-primary">
                                        <ScanFace size={24} />
                                    </div>
                                    <div>
                                        <span className="font-bold text-primary block">AI Face Scan (Recommended)</span>
                                        <span className="text-xs text-muted-foreground">Take a quick selfie. AI will detect your skin type, acne, dryness, and more instantly.</span>
                                    </div>
                                </button>

                                <button
                                    onClick={handleManualChoice}
                                    className="flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/50 transition-all text-left"
                                >
                                    <div className="bg-muted p-2 rounded-full text-muted-foreground">
                                        <FileText size={24} />
                                    </div>
                                    <div>
                                        <span className="font-semibold block">Manual Questionnaire</span>
                                        <span className="text-xs text-muted-foreground">Answer a few questions about your skin type and concerns.</span>
                                    </div>
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 1 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <h3 className="text-lg font-semibold">What is your age group?</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {AGE_GROUPS.map(age => (
                                    <button
                                        key={age}
                                        onClick={() => setFormData({ ...formData, age_group: age })}
                                        className={`p-3 rounded-lg border text-sm transition-all ${formData.age_group === age
                                            ? 'bg-primary text-primary-foreground border-primary ring-2 ring-primary/20'
                                            : 'bg-background hover:bg-muted border-input'
                                            }`}
                                    >
                                        {age}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <h3 className="text-lg font-semibold">What is your skin type?</h3>
                            <div className="grid grid-cols-1 gap-3">
                                {SKIN_TYPES.map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setFormData({ ...formData, skin_type: type })}
                                        className={`p-4 rounded-lg border text-left flex justify-between items-center transition-all ${formData.skin_type === type
                                            ? 'bg-primary text-primary-foreground border-primary ring-2 ring-primary/20'
                                            : 'bg-background hover:bg-muted border-input'
                                            }`}
                                    >
                                        <span>{type}</span>
                                        {formData.skin_type === type && <Check size={18} />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <h3 className="text-lg font-semibold">Any skin concerns?</h3>
                            <p className="text-xs text-muted-foreground">Select all that apply.</p>
                            <div className="flex flex-wrap gap-2">
                                {SKIN_CONCERNS.map(concern => (
                                    <button
                                        key={concern}
                                        onClick={() => toggleConcern(concern)}
                                        className={`px-4 py-2 rounded-full text-sm border transition-all ${formData.skin_concerns?.includes(concern)
                                            ? 'bg-primary text-primary-foreground border-primary'
                                            : 'bg-background hover:bg-muted border-input'
                                            }`}
                                    >
                                        {concern}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-border flex justify-between items-center bg-muted/20">
                    {step > 0 ? (
                        <button
                            onClick={handleBack}
                            className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm font-medium"
                        >
                            <ChevronLeft size={16} /> Back
                        </button>
                    ) : (
                        <button
                            onClick={onClose}
                            className="text-muted-foreground hover:text-foreground text-sm"
                        >
                            Skip for now
                        </button>
                    )}

                    {step > 0 && step < 3 && (
                        <button
                            onClick={handleNext}
                            disabled={step === 1 ? !formData.age_group : !formData.skin_type}
                            className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
                        >
                            Next <ChevronRight size={16} />
                        </button>
                    )}

                    {step === 3 && (
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="bg-green-600 text-white px-8 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : 'Finish Setup'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

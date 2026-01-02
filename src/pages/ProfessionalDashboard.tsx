import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Github, Linkedin, TrendingUp } from 'lucide-react';
import { api } from '@/services/api';
import { supabase } from '@/lib/supabase';

const ProfessionalDashboard = () => {
    const [score, setScore] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadScore = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                const userId = user?.id || 'demo-user';
                const data = await api.getUserScore(userId);
                setScore(data);
            } catch (error) {
                console.error('Failed to load score:', error);
            } finally {
                setLoading(false);
            }
        };
        loadScore();
    }, []);

    if (loading) return <div className="pt-24 text-center">Calculating your potential...</div>;
    if (!score) return <div className="pt-24 text-center">Failed to load score. Please complete onboarding.</div>;

    return (
        <div className="min-h-screen pt-24 px-6 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-2">Your Professional Standing</h1>
            <p className="text-muted-foreground mb-8">Based on your open source and social contributions.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Score Card */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="col-span-1 md:col-span-3 bg-gradient-to-r from-primary/20 to-purple-500/20 p-8 rounded-2xl border border-primary/20 text-center"
                >
                    <h2 className="text-xl font-medium mb-4">Dare Score</h2>
                    <div className="text-6xl font-black text-primary mb-2">{score.totalScore}</div>
                    <div className="flex justify-center items-center gap-2 text-green-400">
                        <TrendingUp size={20} />
                        <span>Top 5% of developers</span>
                    </div>
                </motion.div>

                {/* GitHub Stats */}
                <div className="bg-card p-6 rounded-xl border border-border">
                    <div className="flex items-center gap-3 mb-4">
                        <Github className="w-8 h-8" />
                        <h3 className="text-xl font-bold">GitHub</h3>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span>Repos</span>
                            <span className="font-bold">{score.breakdown.github?.public_repos}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Followers</span>
                            <span className="font-bold">{score.breakdown.github?.followers}</span>
                        </div>
                        <div className="pt-4 border-t border-border mt-2">
                            <span className="text-sm text-muted-foreground">Contribution Score: </span>
                            <span className="text-primary font-bold">{score.breakdown.github?.score}</span>
                        </div>
                    </div>
                </div>

                {/* LinkedIn Stats */}
                <div className="bg-card p-6 rounded-xl border border-border">
                    <div className="flex items-center gap-3 mb-4">
                        <Linkedin className="w-8 h-8 text-blue-500" />
                        <h3 className="text-xl font-bold">LinkedIn</h3>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span>Network</span>
                            <span className="font-bold">{score.breakdown.linkedin?.followers}+</span>
                        </div>
                        <div className="pt-4 border-t border-border mt-2">
                            <span className="text-sm text-muted-foreground">Influence Score: </span>
                            <span className="text-primary font-bold">{score.breakdown.linkedin?.score}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfessionalDashboard;

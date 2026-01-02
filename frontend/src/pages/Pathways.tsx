
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Map, ArrowRight, BookOpen, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { api } from '@/services/api';
import { supabase } from '@/lib/supabase';


const Pathways = () => {
    const [pathways, setPathways] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadPathways = async () => {
            try {
                const data = await api.getPathways();
                setPathways(data);
            } catch (error) {
                console.error('Failed to load pathways:', error);
            } finally {
                setLoading(false);
            }
        };
        loadPathways();
    }, []);

    const handleJoin = async (pathwayId: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const userId = user?.id || 'demo-user';

            await api.joinPathway(userId, pathwayId);
            alert('Joined pathway successfully!');
            // Refresh pathways or state if needed
        } catch (error) {
            console.error('Failed to join pathway:', error);
            alert('Failed to join pathway.');
        }
    };

    const getColors = (index: number) => {
        const colors = ['bg-blue-500/20', 'bg-purple-500/20', 'bg-green-500/20', 'bg-orange-500/20'];
        return colors[index % colors.length];
    };

    if (loading) {
        return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-primary" /></div>;
    }

    return (
        <div className="max-w-6xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Learning Pathways</h1>
                <p className="text-muted-foreground">Curated roadmaps to take your career to the next level.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pathways.map((pathway, index) => (
                    <motion.div
                        key={pathway.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-colors flex flex-col group"
                    >
                        <div className={`h-40 ${getColors(index)} flex items-center justify-center`}>
                            <Map className="w-12 h-12 text-foreground/50 group-hover:text-primary transition-colors" />
                        </div>

                        <div className="p-6 flex-1 flex flex-col">
                            <h3 className="text-xl font-bold mb-2">{pathway.title}</h3>
                            <p className="text-sm text-muted-foreground mb-4 flex-1">{pathway.description}</p>

                            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-6">
                                <div className="flex items-center gap-1">
                                    <BookOpen size={14} />
                                    <span>{pathway.steps?.length || 0} Modules</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Clock size={14} />
                                    <span>{pathway.duration || 'Flexible'}</span>
                                </div>
                            </div>

                            <Button
                                className="w-full gap-2 group-hover:gap-3 transition-all"
                                onClick={() => handleJoin(pathway.id)}
                            >
                                Start Pathway <ArrowRight size={16} />
                            </Button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default Pathways;

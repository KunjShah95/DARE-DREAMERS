import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const FloatingCTA = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            // Show after scrolling past Hero (approx 800px)
            if (window.scrollY > 800) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="fixed bottom-6 inset-x-0 z-50 flex justify-center pointer-events-none px-4"
            >
                <div className="bg-background/80 backdrop-blur-xl border border-primary/20 p-2 pr-6 rounded-full shadow-2xl shadow-primary/10 flex items-center gap-4 pointer-events-auto max-w-sm w-full md:w-auto">
                    <div className="hidden md:flex items-center gap-2 px-3">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                        <span className="text-xs font-bold uppercase tracking-wider text-primary">Limited Access</span>
                    </div>

                    <div className="flex-1">
                        <p className="text-sm font-medium">Join the 2.0 Launch</p>
                    </div>

                    <Button size="sm" className="rounded-full h-8 px-4 text-xs">
                        Get Started
                    </Button>

                    <button
                        onClick={() => setIsVisible(false)}
                        className="p-1 hover:bg-muted rounded-full transition-colors md:hidden"
                    >
                        <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default FloatingCTA;

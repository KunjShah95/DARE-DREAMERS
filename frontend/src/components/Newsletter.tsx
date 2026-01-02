import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';

const Newsletter = () => {
    const [email, setEmail] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (email) {
            setIsSubmitted(true);
            setTimeout(() => {
                setEmail('');
                setIsSubmitted(false);
            }, 3000);
        }
    };

    return (
        <section className="py-24 px-6 relative">
            <div className="container-narrow max-w-xl text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <div className="section-label justify-center">Newsletter</div>

                    <h2 className="text-3xl font-semibold tracking-tight mb-3">
                        Stay ahead of the <span className="text-accent">curve</span>
                    </h2>

                    <p className="text-sm text-zinc-500 mb-8">
                        Get weekly insights on hiring trends and tips to boost your score.
                    </p>

                    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                        <input
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="input flex-1"
                            required
                        />

                        <motion.button
                            type="submit"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`btn-primary sm:px-10 ${isSubmitted ? 'bg-emerald-600' : ''}`}
                            disabled={isSubmitted}
                        >
                            {isSubmitted ? (
                                <>
                                    <Check className="w-4 h-4" />
                                    Done
                                </>
                            ) : (
                                <>
                                    Subscribe
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </motion.button>
                    </form>

                    <p className="text-xs text-zinc-600 mt-4">
                        No spam, unsubscribe anytime.
                    </p>
                </motion.div>
            </div>
        </section>
    );
};

export default Newsletter;

import { motion } from 'framer-motion';
import { Github, Linkedin, Twitter, BookOpen, Code, Database, Globe, MessageSquare } from 'lucide-react';

const integrations = [
    { name: 'GitHub', icon: Github },
    { name: 'LinkedIn', icon: Linkedin },
    { name: 'Twitter/X', icon: Twitter },
    { name: 'Medium', icon: BookOpen },
    { name: 'Dev.to', icon: Code },
    { name: 'Stack Overflow', icon: Database },
    { name: 'Hashnode', icon: Globe },
    { name: 'Discord', icon: MessageSquare },
];

const Integrations = () => {
    return (
        <section className="py-16 px-6 relative border-y border-zinc-800/50">
            {/* Gradient fade edges */}
            <div className="absolute left-0 top-0 bottom-0 w-16 md:w-32 bg-linear-to-r from-zinc-950 to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-16 md:w-32 bg-linear-to-l from-zinc-950 to-transparent z-10" />

            <div className="container-narrow">
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="text-center mb-8"
                >
                    <span className="text-xs font-medium tracking-wider uppercase text-zinc-500">
                        Integrations
                    </span>
                    <h2 className="text-xl font-semibold tracking-tight mt-2">
                        Connected to your <span className="text-accent">favorite platforms</span>
                    </h2>
                </motion.div>

                {/* Logos */}
                <div className="relative overflow-hidden">
                    <motion.div
                        animate={{ x: ['0%', '-50%'] }}
                        transition={{
                            x: {
                                repeat: Infinity,
                                repeatType: 'loop',
                                duration: 25,
                                ease: 'linear',
                            },
                        }}
                        className="flex gap-4"
                    >
                        {[...integrations, ...integrations].map((integration, index) => (
                            <div
                                key={`${integration.name}-${index}`}
                                className="shrink-0 flex items-center gap-2 px-4 py-2.5 card"
                            >
                                <integration.icon className="w-4 h-4 text-zinc-400" />
                                <span className="font-medium text-sm whitespace-nowrap">{integration.name}</span>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default Integrations;

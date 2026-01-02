import { motion } from 'framer-motion';
import { Search, Code, CheckCircle, Rocket } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

const steps = [
    {
        icon: <Search className="w-8 h-8 text-white" />,
        title: "Define Role",
        description: "Tell us who you need. Our AI scans millions of profiles to find the perfect match."
    },
    {
        icon: <Code className="w-8 h-8 text-white" />,
        title: "AI Vetting",
        description: "Candidates pass automated technical assessments validted by real-world contribution data."
    },
    {
        icon: <CheckCircle className="w-8 h-8 text-white" />,
        title: "Compliance",
        description: "We generate locally compliant contracts and handle all identity verifications automatically."
    },
    {
        icon: <Rocket className="w-8 h-8 text-white" />,
        title: "Onboard",
        description: "Candidates join your team's Slack and Git repo instantly. Payroll is automated."
    }
];

const HowItWorks = () => {
    return (
        <section id="how-it-works" className="py-32 bg-background relative">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-20">
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
                        Hiring Logic, <span className="text-primary">Redefined</span>.
                    </h2>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        No recruiters. No bias. Just data-driven hiring at scale.
                    </p>
                </div>

                <div className="relative">
                    {/* Connecting Line (Desktop) */}
                    <div className="hidden md:block absolute top-[60px] left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

                    <div className="grid md:grid-cols-4 gap-8">
                        {steps.map((step, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                /* viewport={{ once: true }} */ // Repeat animation on scroll for effect
                                transition={{ delay: index * 0.2 }}
                                className="relative z-10"
                            >
                                <div className="flex flex-col items-center text-center">
                                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-950 border border-white/10 shadow-xl flex items-center justify-center mb-8 relative group">
                                        <div className="absolute inset-0 bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="relative z-10">{step.icon}</div>
                                        <div className="absolute -bottom-3 px-2 py-0.5 rounded-full bg-primary text-[10px] font-bold text-white">
                                            {index + 1}
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {step.description}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HowItWorks;

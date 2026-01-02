import { motion } from 'framer-motion';

const stats = [
    { label: "Active Professionals", value: "50,000+", suffix: "" },
    { label: "Hours Saved / Hire", value: "40", suffix: "hrs" },
    { label: "Global Coverage", value: "150", suffix: "Countries" },
    { label: "Retention Rate", value: "98", suffix: "%" },
];

const Stats = () => {
    return (
        <section className="py-20 border-y border-border/50 bg-secondary/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-grid opacity-10" />
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 relative z-10">
                {stats.map((stat, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1, duration: 0.5 }}
                        className="text-center"
                    >
                        <div className="text-4xl md:text-5xl font-bold text-foreground mb-2 tracking-tight">
                            {stat.value}
                            <span className="text-primary text-2xl md:text-3xl ml-1">{stat.suffix}</span>
                        </div>
                        <div className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                            {stat.label}
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
};

export default Stats;

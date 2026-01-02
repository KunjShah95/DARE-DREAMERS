import { motion } from 'framer-motion';
import { Code2, Globe, Zap, Shield, Users, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';

const features = [
    {
        icon: <Globe className="w-6 h-6 text-primary" />,
        title: "Global Talent Pool",
        description: "Access top 1% of developers, designers, and product managers from 150+ countries."
    },
    {
        icon: <Code2 className="w-6 h-6 text-primary" />,
        title: "AI Code Vetting",
        description: "Our AI analyzes GitHub repositories and contribution graphs to verify technical skills instantly."
    },
    {
        icon: <Zap className="w-6 h-6 text-primary" />,
        title: "Instant Matching",
        description: "Get matched with the perfect candidate in under 24 hours using our proprietary matching algorithm."
    },
    {
        icon: <Shield className="w-6 h-6 text-primary" />,
        title: "Compliance & Payroll",
        description: "We handle contracts, taxes, and compliance so you can focus on building."
    },
    {
        icon: <Users className="w-6 h-6 text-primary" />,
        title: "Seamless Integration",
        description: "Candidates integrate directly into your Slack, Jira, and GitHub workflows."
    },
    {
        icon: <BarChart3 className="w-6 h-6 text-primary" />,
        title: "Performance Tracking",
        description: "Monitor productivity and impact with real-time analytics and weekly reports."
    }
];

const Features = () => {
    return (
        <section id="features" className="py-24 bg-background relative overflow-hidden">
            <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-xs font-medium text-primary mb-4 uppercase tracking-wider">
                        Why Dare Dreamers
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
                        Everything you need to <span className="text-primary">scale fast</span>
                    </h2>
                    <p className="text-xl text-muted-foreground">
                        We've streamlined the entire hiring process so you can focus on shipping product.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1, duration: 0.5 }}
                        >
                            <Card className="h-full bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-colors group">
                                <CardHeader>
                                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                                        {feature.icon}
                                    </div>
                                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <CardDescription className="text-base text-muted-foreground/80">
                                        {feature.description}
                                    </CardDescription>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Features;

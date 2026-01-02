import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card';

const plans = [
    {
        name: "Startup",
        price: "$299",
        period: "/month",
        description: "Perfect for early-stage teams hiring their first engineers.",
        features: [
            "Access to Top 5% Talent",
            "72-hour Matching Guarantee",
            "Standard Compliance",
            "Slack Support"
        ],
        highlight: false
    },
    {
        name: "Growth",
        price: "$599",
        period: "/month",
        description: "For scaling companies needing specialized roles fast.",
        features: [
            "Access to Top 1% Talent",
            "24-hour Matching Guarantee",
            "Premium Compliance & Payroll",
            "Dedicated Account Manager",
            "Replacement Guarantee"
        ],
        highlight: true
    },
    {
        name: "Enterprise",
        price: "Custom",
        period: "",
        description: "Tailored solutions for large organizations and agencies.",
        features: [
            "Unlimited Hires",
            "Custom Vetting Proces",
            "API Access",
            "White-label Portal",
            "Priority 24/7 Support"
        ],
        highlight: false
    }
];

const Pricing = () => {
    return (
        <section id="pricing" className="py-24 bg-background relative overflow-hidden">
            <div className="absolute inset-0 bg-grid opacity-10 [mask-image:linear-gradient(to_bottom,transparent,white,transparent)]" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
                        Simple, Transparent <span className="text-primary">Pricing</span>
                    </h2>
                    <p className="text-xl text-muted-foreground">
                        No hidden fees. Pause or cancel anytime.
                    </p>
                </div>

                <div className="grid lg:grid-cols-3 gap-8 items-start">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={index}
                            viewport={{ once: true }}
                        >
                            <Card className={`relative h-full flex flex-col ${plan.highlight ? 'border-primary shadow-lg shadow-primary/20 bg-card' : 'bg-card/40 border-border/50'}`}>
                                {plan.highlight && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full uppercase tracking-wider">
                                        Most Popular
                                    </div>
                                )}
                                <CardHeader>
                                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                                    <CardDescription className="min-h-[50px]">{plan.description}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1">
                                    <div className="mb-6">
                                        <span className="text-4xl font-bold">{plan.price}</span>
                                        <span className="text-muted-foreground">{plan.period}</span>
                                    </div>
                                    <ul className="space-y-3">
                                        {plan.features.map((feature, i) => (
                                            <li key={i} className="flex items-start gap-3 text-sm text-foreground/80">
                                                <Check className="w-5 h-5 text-primary shrink-0" />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                                <CardFooter>
                                    <Button className={`w-full ${plan.highlight ? 'bg-primary hover:bg-primary/90' : 'variant-outline'}`} variant={plan.highlight ? 'default' : 'outline'}>
                                        Choose {plan.name}
                                    </Button>
                                </CardFooter>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Pricing;

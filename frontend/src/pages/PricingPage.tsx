import Pricing from '../components/Pricing';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { FileQuestion } from 'lucide-react';

const PricingPage = () => {
    return (
        <div className="pt-20">
            <Pricing />

            <section className="py-20 bg-secondary/20">
                <div className="max-w-4xl mx-auto px-6">
                    <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>

                    <div className="space-y-6">
                        {[
                            {
                                q: "Can I cancel anytime?",
                                a: "Yes, all plans are month-to-month unless you choose an annual contract for a discount."
                            },
                            {
                                q: "How does the replacement guarantee work?",
                                a: "If a hire doesn't work out in the first 90 days, we'll replace them at no extra cost to you."
                            },
                            {
                                q: "Do you handle equipment?",
                                a: "We can provision and ship laptops to your remote hires in 150+ countries."
                            }
                        ].map((faq, i) => (
                            <Card key={i} className="bg-background/60 backdrop-blur">
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-3">
                                        <FileQuestion className="w-5 h-5 text-primary" />
                                        {faq.q}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-muted-foreground">
                                    {faq.a}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default PricingPage;

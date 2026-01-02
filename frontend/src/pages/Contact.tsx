import React from 'react';
import { motion } from 'framer-motion';
import { Mail, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

// Basic textarea component since we haven't created one in UI yet
const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
    ({ className, ...props }, ref) => {
        return (
            <textarea
                className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
                ref={ref}
                {...props}
            />
        )
    }
)
Textarea.displayName = "Textarea"

const Contact = () => {
    return (
        <div className="min-h-screen pt-20 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-primary/5 rounded-full blur-3xl -z-10" />
            <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-secondary/10 rounded-full blur-3xl -z-10" />

            <div className="max-w-7xl mx-auto px-6 py-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <h1 className="text-5xl font-bold tracking-tight mb-4">Get in <span className="text-primary">Touch</span></h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Ready to scale your team? We'd love to hear from you.
                    </p>
                </motion.div>

                <div className="grid lg:grid-cols-2 gap-12 items-start">
                    {/* Contact Form */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Card className="glass-card">
                            <CardContent className="p-8 space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">First Name</label>
                                        <Input placeholder="John" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Last Name</label>
                                        <Input placeholder="Doe" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Email</label>
                                    <Input type="email" placeholder="john@company.com" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Message</label>
                                    <Textarea placeholder="Tell us about your hiring needs..." className="min-h-[150px]" />
                                </div>
                                <Button className="w-full text-lg h-12">
                                    Send Message
                                </Button>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Contact Info */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="space-y-8 lg:pl-12"
                    >
                        <div>
                            <h3 className="text-2xl font-bold mb-6">Contact Information</h3>
                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                        <Mail className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold mb-1">Email Us</h4>
                                        <p className="text-muted-foreground">sales@daredreamers.com</p>
                                        <p className="text-muted-foreground">support@daredreamers.com</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                        <MapPin className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold mb-1">Visit Us</h4>
                                        <p className="text-muted-foreground">
                                            123 Innovation Dr, Suite 500<br />
                                            San Francisco, CA 94105
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Card className="bg-gradient-to-br from-primary to-primary/80 border-none text-primary-foreground">
                            <CardContent className="p-8">
                                <h3 className="text-2xl font-bold mb-2">Looking for Talent?</h3>
                                <p className="mb-6 opacity-90">
                                    Browse our curated list of available developers ready to start today.
                                </p>
                                <Button variant="secondary" className="w-full font-bold text-primary">
                                    Browse Talent
                                </Button>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default Contact;

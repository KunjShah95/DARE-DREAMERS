import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Github, ArrowRight, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardFooter } from '@/components/ui/Card';
import { supabase } from '@/lib/supabase';

// Google Icon Component
const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" {...props}>
        <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
        />
        <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
        />
        <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
        />
        <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
        />
        <path d="M1 1h22v22H1z" fill="none" />
    </svg>
)

const SignupPage = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [form, setForm] = useState({
        name: '',
        email: '',
        password: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm(prev => ({ ...prev, [e.target.type === 'text' ? 'name' : e.target.type]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            // 1. Sign up with Supabase
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: form.email,
                password: form.password,
                options: {
                    data: {
                        full_name: form.name
                    }
                }
            });

            if (authError) throw authError;

            // 2. Sync with Backend
            if (authData.user && authData.session) {
                // If we get a session immediately (email confirmation disabled), sync now
                const syncResponse = await fetch('http://localhost:3001/api/users/sync', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authData.session.access_token}`
                    }
                });

                if (!syncResponse.ok) {
                    console.error('Backend sync failed');
                    // We don't block signup success on sync fail, but good to know
                }

                // Navigate to home or dashboard
                navigate('/');
            } else {
                // Email confirmation required
                alert('Please check your email to confirm your account.');
                navigate('/login');
            }

        } catch (err: any) {
            console.error('Signup Error:', err);
            setError(err.message || 'An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen pt-20 flex items-center justify-center p-6 relative overflow-hidden bg-background">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(var(--primary),0.05),transparent_60%)] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Create an account</h1>
                    <p className="text-muted-foreground">Enter your email below to create your account</p>
                </div>

                <Card className="glass-card bg-black/40 border-white/10">
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <Button variant="outline" className="w-full" disabled={isLoading}>
                                <Github className="mr-2 h-4 w-4" />
                                Github
                            </Button>
                            <Button variant="outline" className="w-full" disabled={isLoading}>
                                <GoogleIcon className="mr-2 h-4 w-4" />
                                Google
                            </Button>
                        </div>

                        <div className="relative mb-6">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-border/50" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-black px-2 text-muted-foreground">Or continue with</span>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="p-3 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-md">
                                    {error}
                                </div>
                            )}
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">Full Name</label>
                                <Input
                                    type="text"
                                    placeholder="John Doe"
                                    required
                                    className="bg-background/50"
                                    value={form.name}
                                    onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">Email</label>
                                <Input
                                    type="email"
                                    placeholder="m@example.com"
                                    required
                                    className="bg-background/50"
                                    value={form.email}
                                    onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">Password</label>
                                <Input
                                    type="password"
                                    required
                                    className="bg-background/50"
                                    value={form.password}
                                    onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
                                />
                            </div>
                            <Button className="w-full" type="submit" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating account...
                                    </>
                                ) : (
                                    <>
                                        Create account
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="justify-center border-t border-white/5 pt-6">
                        <p className="text-sm text-muted-foreground">
                            Already have an account?{" "}
                            <Link to="/login" className="text-primary hover:underline underline-offset-4">
                                Sign in
                            </Link>
                        </p>
                    </CardFooter>
                </Card>

                <p className="px-8 text-center text-sm text-muted-foreground mt-6">
                    By clicking continue, you agree to our{" "}
                    <a href="#" className="underline underline-offset-4 hover:text-primary">
                        Terms of Service
                    </a>{" "}
                    and{" "}
                    <a href="#" className="underline underline-offset-4 hover:text-primary">
                        Privacy Policy
                    </a>
                    .
                </p>
            </motion.div>
        </div>
    );
};

export default SignupPage;

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';

const Onboarding = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        githubHandle: '',
        linkedinHandle: '',
        mediumHandle: '',
        role: 'PROFESSIONAL' // Default role
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                // Fallback if using Firebase (we need to sync this properly in a real app)
                // For this demo, let's assume we have a user ID or just let it pass
                console.log("No Supabase user found, usually you'd sync Firebase Auth uid here");
            }

            // 2. Update User Profile in Supabase (assuming record exists or upsert)
            // Since we are mocking the auth link, let's just assume we are updating the current user
            // In a real flow, we'd use the ID from the context.

            // For demo: simulation of success
            console.log('Updating profile:', formData);

            // Trigger Analysis (Mocking the API call for now or calling it if we had the ID)
            // const res = await fetch(`/api/analytics/analyze/${user.id}`, { method: 'POST' });

            // Navigate to Dashboard
            navigate('/dashboard');
        } catch (error) {
            console.error('Error updating profile:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen pt-24 px-6 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Let's Build Your Profile</h1>
            <p className="text-muted-foreground mb-8">
                Connect your accounts to generate your "Dare Score".
                Recruiters use this score to find top talent like you.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6 bg-card p-8 rounded-xl border border-border">

                <div>
                    <label className="block text-sm font-medium mb-2">I am a...</label>
                    <select
                        className="w-full p-2 rounded-md bg-background border border-border"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    >
                        <option value="PROFESSIONAL">Professional (Job Seeker)</option>
                        <option value="RECRUITER">Recruiter (Hiring)</option>
                    </select>
                </div>

                <div className="space-y-4">
                    <h3 className="text-lg font-medium">Social Handles</h3>

                    <div>
                        <label className="block text-sm text-muted-foreground mb-1">GitHub Username</label>
                        <input
                            type="text"
                            placeholder="e.g. torvalds"
                            className="w-full p-2 rounded-md bg-background border border-border"
                            value={formData.githubHandle}
                            onChange={(e) => setFormData({ ...formData, githubHandle: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-muted-foreground mb-1">LinkedIn Username</label>
                        <input
                            type="text"
                            placeholder="e.g. reidhoffman"
                            className="w-full p-2 rounded-md bg-background border border-border"
                            value={formData.linkedinHandle}
                            onChange={(e) => setFormData({ ...formData, linkedinHandle: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-muted-foreground mb-1">Medium Username</label>
                        <input
                            type="text"
                            placeholder="e.g. ev"
                            className="w-full p-2 rounded-md bg-background border border-border"
                            value={formData.mediumHandle}
                            onChange={(e) => setFormData({ ...formData, mediumHandle: e.target.value })}
                        />
                    </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Analyzing...' : 'Generate My Score'}
                </Button>
            </form>
        </div>
    );
};

export default Onboarding;

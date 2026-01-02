import { Button } from '@/components/ui/Button';
import { Search, Lock } from 'lucide-react';

const users = [
    { id: 1, name: 'Alice Chen', role: 'Frontend Architect', score: 920, skills: ['React', 'Three.js'] },
    { id: 2, name: 'Bob Smith', role: 'Backend Lead', score: 880, skills: ['Node.js', 'Postgres'] },
    { id: 3, name: 'Charlie Kim', role: 'Full Stack Dev', score: 850, skills: ['Next.js', 'Supabase'] },
];

const RecruiterDashboard = () => {
    return (
        <div className="min-h-screen pt-24 px-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Talent Discovery</h1>
                    <p className="text-muted-foreground">Find candidates verified by the Dare Context Engine.</p>
                </div>
                <Button>Post a Job</Button>
            </div>

            <div className="flex gap-4 mb-8">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 text-muted-foreground w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search by skill, role, or score..."
                        className="w-full pl-10 p-3 rounded-lg bg-card border border-border"
                    />
                </div>
                <select className="p-3 rounded-lg bg-card border border-border">
                    <option>Score &gt; 800</option>
                    <option>Score &gt; 900</option>
                </select>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {users.map(user => (
                    <div key={user.id} className="bg-card p-6 rounded-xl border border-border flex items-center justify-between hover:border-primary/50 transition-colors cursor-pointer">
                        <div className="flex gap-4 items-center">
                            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-xl">
                                {user.score}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">{user.name}</h3>
                                <p className="text-muted-foreground">{user.role}</p>
                                <div className="flex gap-2 mt-2">
                                    {user.skills.map(skill => (
                                        <span key={skill} className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <Button variant="outline" className="gap-2">
                            <Lock className="w-4 h-4" />
                            Unlock Profile
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RecruiterDashboard;

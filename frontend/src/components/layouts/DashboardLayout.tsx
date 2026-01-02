
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Map, MessageSquare, Settings, LogOut, TrendingUp, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const DashboardLayout = () => {
    const location = useLocation();
    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="flex min-h-screen bg-background">
            {/* Sidebar */}
            <aside className="w-64 border-r border-border bg-card hidden md:flex flex-col">
                <div className="p-6 border-b border-border">
                    <Link to="/" className="flex items-center gap-2 font-bold text-xl">
                        Dare<span className="text-primary">Dreamers</span>
                    </Link>
                </div>

                <div className="flex-1 py-6 px-4 space-y-2">
                    <Link to="/dashboard">
                        <Button variant={isActive('/dashboard') ? 'secondary' : 'ghost'} className="w-full justify-start gap-3">
                            <LayoutDashboard size={20} />
                            My Score
                        </Button>
                    </Link>
                    <Link to="/pathways">
                        <Button variant={isActive('/pathways') ? 'secondary' : 'ghost'} className="w-full justify-start gap-3">
                            <Map size={20} />
                            Pathways
                        </Button>
                    </Link>
                    <Link to="/assistant">
                        <Button variant={isActive('/assistant') ? 'secondary' : 'ghost'} className="w-full justify-start gap-3">
                            <MessageSquare size={20} />
                            AI Assistant
                        </Button>
                    </Link>
                    <div className="pt-4 mt-4 border-t border-border">
                        <h4 className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Recruiting</h4>
                        <Link to="/recruiter">
                            <Button variant={isActive('/recruiter') ? 'secondary' : 'ghost'} className="w-full justify-start gap-3">
                                <Users size={20} />
                                Talent Search
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="p-4 border-t border-border">
                    <Button variant="ghost" className="w-full justify-start gap-3 text-red-400 hover:text-red-500 hover:bg-red-950/20">
                        <LogOut size={20} />
                        Sign Out
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <header className="h-16 border-b border-border bg-background/50 backdrop-blur sticky top-0 z-10 px-6 flex items-center justify-between">
                    <h1 className="font-semibold text-lg capitalize">{location.pathname.replace('/', '')}</h1>
                    <div className="w-8 h-8 rounded-full bg-primary/20" />
                </header>
                <div className="p-6">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;

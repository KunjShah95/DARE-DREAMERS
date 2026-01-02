import { motion } from 'framer-motion';
import { ArrowRight, Play, Star, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const Hero = () => {
  return (
    <section className="relative min-h-[110vh] flex items-center justify-center pt-20 overflow-hidden bg-background">
      {/* Dynamic Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-grid opacity-20 [mask-image:linear-gradient(to_bottom,white,transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(var(--primary),0.05),transparent_50%)]" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
        {/* Left Content */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="space-y-8"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border/50 backdrop-blur-md hover:bg-secondary transition-colors cursor-pointer group">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
            <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground">v2.0 is now live</span>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>

          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight leading-[1.1]">
            Scale Your
            <span className="block text-primary">
              Dream Team
            </span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-lg leading-relaxed">
            The AI-powered ecosystem for hiring top-tier global talent. Automate vetting, compliance, and payments in one unified platform.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button size="lg" className="h-12 px-8 text-base rounded-full shadow-lg shadow-primary/20 group">
              Start Hiring Now
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8 text-base rounded-full bg-transparent hover:bg-secondary/50">
              <Play className="mr-2 w-5 h-5 fill-current" />
              View Demo
            </Button>
          </div>

          {/* Social Proof */}
          <div className="pt-8 border-t border-border/50 flex items-center gap-6">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-background bg-secondary flex items-center justify-center text-xs text-muted-foreground font-medium overflow-hidden">
                  <span className="text-[10px]">U{i}</span>
                </div>
              ))}
            </div>
            <div className="text-sm">
              <div className="flex items-center gap-1 text-yellow-500">
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
              </div>
              <p className="text-muted-foreground mt-1"><span className="text-foreground font-bold">4.9/5</span> from 2,000+ teams</p>
            </div>
          </div>
        </motion.div>

        {/* Right Visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative lg:h-[700px] hidden lg:flex items-center justify-center"
        >
          {/* Main Card */}
          <div className="relative w-full max-w-md">
            <div className="relative z-20 bg-card/80 backdrop-blur-xl border border-border/50 rounded-3xl p-6 shadow-2xl transform rotate-[-6deg] hover:rotate-0 transition-transform duration-500">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">AI Matched</h3>
                    <p className="text-xs text-primary">Top 1% Talent</p>
                  </div>
                </div>
                <div className="bg-primary/10 px-3 py-1 rounded-full text-xs font-bold text-primary">
                  98% Match
                </div>
              </div>

              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors border border-border/50 flex items-center gap-4 cursor-pointer">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xs">U{i + 20}</div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">Senior Developer</h4>
                      <p className="text-xs text-muted-foreground">$80/hr • 5yr exp</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </div>

            {/* Back Card */}
            <div className="absolute inset-0 bg-primary/5 rounded-3xl transform rotate-6 scale-95 -z-10 border border-primary/20" />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;

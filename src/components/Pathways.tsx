import { motion } from 'framer-motion';
import { User, Briefcase, ArrowRight } from 'lucide-react';

const Pathways = () => {
  return (
    <section className="py-24 px-6 relative">
      <div className="container-narrow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Professional Pathway */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="card-accent p-8 rounded-2xl hover-lift"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center mb-6">
              <User className="w-5 h-5 text-zinc-950" />
            </div>

            <span className="text-xs font-medium tracking-wider uppercase text-emerald-500 mb-2 block">
              For Professionals
            </span>

            <h3 className="text-2xl font-semibold tracking-tight mb-3">
              Let your work speak for itself
            </h3>

            <p className="text-zinc-400 text-sm leading-relaxed mb-6">
              Connect your platforms, generate your score, and get discovered by top companies based on your actual contributions.
            </p>

            <a href="#" className="btn-primary py-3 text-sm w-fit">
              Create Profile <ArrowRight className="w-4 h-4" />
            </a>
          </motion.div>

          {/* Recruiter Pathway */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="card p-8 rounded-2xl hover-lift"
          >
            <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center mb-6">
              <Briefcase className="w-5 h-5 text-zinc-400" />
            </div>

            <span className="text-xs font-medium tracking-wider uppercase text-zinc-500 mb-2 block">
              For Recruiters
            </span>

            <h3 className="text-2xl font-semibold tracking-tight mb-3">
              Hire with total confidence
            </h3>

            <p className="text-zinc-400 text-sm leading-relaxed mb-6">
              Access a vetted pool of talent with verified proof of work. No more guessing based on resumes.
            </p>

            <a href="#" className="btn-secondary py-3 text-sm w-fit">
              Start Hiring <ArrowRight className="w-4 h-4" />
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Pathways;

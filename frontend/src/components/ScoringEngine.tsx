
import { motion } from 'framer-motion';
import { Github, Linkedin, Twitter, BookOpen, Check } from 'lucide-react';

const platforms = [
  {
    name: 'GitHub',
    icon: Github,
    metrics: ['Commit Frequency', 'Repo Quality', 'OSS Contributions'],
    weightage: 30,
  },
  {
    name: 'LinkedIn',
    icon: Linkedin,
    metrics: ['Industry Authority', 'Network Growth', 'Engagement'],
    weightage: 25,
  },
  {
    name: 'X (Twitter)',
    icon: Twitter,
    metrics: ['Thought Leadership', 'Follower Quality', 'Reach'],
    weightage: 20,
  },
  {
    name: 'Blogging',
    icon: BookOpen,
    metrics: ['Content Depth', 'Technical Accuracy', 'Readership'],
    weightage: 25,
  },
];

const ScoringEngine = () => {
  return (
    <section id="scoring" className="py-24 px-6 relative">
      <div className="container-narrow">
        {/* Header */}
        <div className="mb-16">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="section-label"
          >
            The Engine
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-semibold tracking-tight mb-4"
          >
            Multi-dimensional <span className="text-accent">scoring</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            viewport={{ once: true }}
            className="text-zinc-500 max-w-lg"
          >
            Our proprietary engine aggregates signals from across the web to build a comprehensive 0-100 score.
          </motion.p>
        </div>

        {/* Platform Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {platforms.map((platform, index) => (
            <motion.div
              key={platform.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="card p-6 hover-lift"
            >
              {/* Icon */}
              <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center mb-4">
                <platform.icon className="w-5 h-5 text-zinc-400" />
              </div>

              {/* Name */}
              <h3 className="text-base font-semibold mb-3">{platform.name}</h3>

              {/* Metrics */}
              <ul className="space-y-2 mb-4">
                {platform.metrics.map((metric) => (
                  <li key={metric} className="flex items-center gap-2 text-xs text-zinc-500">
                    <Check className="w-3 h-3 text-emerald-500" />
                    {metric}
                  </li>
                ))}
              </ul>

              {/* Weightage */}
              <div className="pt-3 border-t border-zinc-800">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-zinc-500">Weightage</span>
                  <span className="font-semibold text-emerald-500">{platform.weightage}%</span>
                </div>
                <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${platform.weightage}%` }}
                    transition={{ duration: 1, delay: index * 0.1 + 0.3 }}
                    viewport={{ once: true }}
                    className="h-full bg-emerald-500 rounded-full"
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ScoringEngine;

import React from 'react';
import { motion } from 'framer-motion';
import { Github, Linkedin, Twitter, BookOpen } from 'lucide-react';

const scoreBreakdown = [
    { platform: 'GitHub', score: 92, icon: Github },
    { platform: 'LinkedIn', score: 78, icon: Linkedin },
    { platform: 'X', score: 85, icon: Twitter },
    { platform: 'Blog', score: 70, icon: BookOpen },
];

const skills = [
    { name: 'React', level: 95 },
    { name: 'TypeScript', level: 88 },
    { name: 'Node.js', level: 82 },
    { name: 'Python', level: 75 },
];

const LiveDemo = () => {
    const totalScore = Math.round(
        scoreBreakdown.reduce((acc, item) => acc + item.score, 0) / scoreBreakdown.length
    );

    return (
        <section id="demo" className="py-24 px-6 relative">
            <div className="container-narrow">
                {/* Header */}
                <div className="text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="section-label justify-center"
                    >
                        Live Demo
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-3xl md:text-4xl font-semibold tracking-tight mb-4"
                    >
                        See the <span className="text-accent">score</span> in action
                    </motion.h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                    {/* Score Circle */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="flex flex-col items-center"
                    >
                        {/* Main Score Circle */}
                        <div className="relative w-48 h-48 mb-8">
                            <svg className="w-full h-full -rotate-90">
                                <circle
                                    cx="50%"
                                    cy="50%"
                                    r="45%"
                                    fill="none"
                                    stroke="rgba(255,255,255,0.05)"
                                    strokeWidth="8"
                                />
                                <motion.circle
                                    cx="50%"
                                    cy="50%"
                                    r="45%"
                                    fill="none"
                                    stroke="#10b981"
                                    strokeWidth="8"
                                    strokeLinecap="round"
                                    strokeDasharray={`${(totalScore / 100) * 283} 283`}
                                    initial={{ strokeDasharray: '0 283' }}
                                    whileInView={{ strokeDasharray: `${(totalScore / 100) * 283} 283` }}
                                    transition={{ duration: 1.5, ease: 'easeOut' }}
                                    viewport={{ once: true }}
                                />
                            </svg>

                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <motion.span
                                    initial={{ opacity: 0 }}
                                    whileInView={{ opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                    viewport={{ once: true }}
                                    className="text-4xl font-semibold text-emerald-500"
                                >
                                    {totalScore}
                                </motion.span>
                                <span className="text-sm text-zinc-500">Overall Score</span>
                            </div>
                        </div>

                        {/* Platform breakdown */}
                        <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
                            {scoreBreakdown.map((item, index) => (
                                <motion.div
                                    key={item.platform}
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.8 + index * 0.1 }}
                                    viewport={{ once: true }}
                                    className="card p-3 flex items-center gap-3"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                                        <item.icon className="w-4 h-4 text-zinc-400" />
                                    </div>
                                    <div>
                                        <div className="text-xs text-zinc-500">{item.platform}</div>
                                        <div className="font-semibold text-sm">{item.score}</div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Profile Card */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="card p-6"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center text-lg font-semibold text-zinc-950">
                                JD
                            </div>
                            <div>
                                <h3 className="font-semibold">John Developer</h3>
                                <p className="text-sm text-zinc-500">Full Stack Engineer</p>
                            </div>
                        </div>

                        <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
                            Senior software engineer with 6+ years of experience. Active open-source contributor and technical writer.
                        </p>

                        {/* Skill bars */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-medium uppercase tracking-wider text-zinc-500">Top Skills</h4>
                            {skills.map((skill, index) => (
                                <div key={skill.name}>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-zinc-400">{skill.name}</span>
                                        <span className="text-zinc-500">{skill.level}%</span>
                                    </div>
                                    <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            whileInView={{ width: `${skill.level}%` }}
                                            transition={{ duration: 1, delay: index * 0.1 }}
                                            viewport={{ once: true }}
                                            className="h-full bg-emerald-500 rounded-full"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button className="btn-primary w-full mt-6 text-sm py-3">
                            Create Your Profile
                        </button>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default LiveDemo;

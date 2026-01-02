import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';

const faqs = [
  {
    question: 'How is the score calculated?',
    answer: 'Our engine analyzes public data from GitHub, LinkedIn, X, and blogs using AI to determine a normalized 0-100 score based on your real-world contributions.',
  },
  {
    question: 'Is my data private?',
    answer: 'We only analyze public activity. We do not access private repositories or messages. You have full control over which platforms you connect.',
  },
  {
    question: 'How do recruiters use this?',
    answer: 'Recruiters can filter candidates by score, specific platform expertise, or content quality, allowing them to find proof of work instantly.',
  },
  {
    question: 'Can I improve my score?',
    answer: 'Absolutely! By consistently contributing to open source, sharing knowledge on X, or writing technical blogs, your score updates in real-time.',
  },
  {
    question: 'Is there a free plan?',
    answer: 'Yes! Our Starter plan is completely free and includes basic profile creation, GitHub integration, and public score display.',
  },
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24 px-6 relative">
      <div className="container-narrow max-w-2xl">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="section-label justify-center"
          >
            FAQ
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-semibold tracking-tight"
          >
            Frequently <span className="text-accent">asked</span>
          </motion.h2>
        </div>

        {/* FAQ Items */}
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              viewport={{ once: true }}
              className="card overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full px-5 py-4 flex items-center justify-between text-left"
              >
                <span className="font-medium text-sm pr-4">{faq.question}</span>
                <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-all duration-300 ${openIndex === i ? 'bg-emerald-500 text-zinc-950' : 'bg-zinc-800 text-zinc-400'
                  }`}>
                  {openIndex === i ? (
                    <Minus className="w-3 h-3" />
                  ) : (
                    <Plus className="w-3 h-3" />
                  )}
                </div>
              </button>
              <AnimatePresence>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-4 text-sm text-zinc-400 leading-relaxed">
                      {faq.answer}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;

import React from 'react';
import { motion } from 'framer-motion';

const Sonar: React.FC = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-10">
      {[1, 2, 3].map((i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{
            opacity: [0, 0.1, 0],
            scale: [0.5, 1.5, 2],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            delay: i * 1.3,
            ease: "easeOut",
          }}
          className="absolute w-100 h-100 border border-emerald-500/20 rounded-full"
        />
      ))}
    </div>
  );
};

export default Sonar;

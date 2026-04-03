'use client';

import { motion } from 'framer-motion';

const steps = [
  {
    label: 'Source Code',
    sublabel: 'NeuralLang (.nlang)',
    color: 'orange',
  },
  {
    label: 'Lexer',
    sublabel: 'Tokenization',
    color: 'yellow',
  },
  {
    label: 'Parser',
    sublabel: 'AST Generation',
    color: 'green',
  },
  {
    label: 'AST',
    sublabel: 'Abstract Syntax Tree',
    color: 'cyan',
  },
  {
    label: 'Type Checker',
    sublabel: 'Shape Verification',
    color: 'purple',
  },
  {
    label: 'Code Generator',
    sublabel: 'PyTorch Python Output',
    color: 'orange',
  },
];

const colorMap: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  orange: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', glow: 'shadow-orange-500/10' },
  yellow: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400', glow: 'shadow-yellow-500/10' },
  green: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400', glow: 'shadow-green-500/10' },
  cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400', glow: 'shadow-cyan-500/10' },
  purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400', glow: 'shadow-purple-500/10' },
};

export default function Architecture() {
  return (
    <section className="py-24 sm:py-32 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            <span className="gradient-text">Arsitektur Kompilator</span>
          </h2>
          <p className="text-neutral-400 text-lg max-w-2xl mx-auto">
            Pipeline kompilasi NeuralLang mengubah source code menjadi kode PyTorch Python yang siap eksekusi.
          </p>
        </motion.div>

        {/* Architecture Diagram - Desktop */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="hidden lg:block"
        >
          <div className="flex items-center justify-center gap-3">
            {steps.map((step, i) => {
              const colors = colorMap[step.color];
              return (
                <div key={step.label} className="flex items-center gap-3">
                  {/* Step Box */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.1 }}
                    className={`flex flex-col items-center gap-2 px-6 py-4 rounded-xl ${colors.bg} border ${colors.border} min-w-[140px] hover:shadow-lg ${colors.glow} transition-shadow duration-300`}
                  >
                    <span className={`text-sm font-semibold ${colors.text}`}>
                      {step.label}
                    </span>
                    <span className="text-xs text-neutral-500">
                      {step.sublabel}
                    </span>
                  </motion.div>

                  {/* Arrow */}
                  {i < steps.length - 1 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: i * 0.1 + 0.2 }}
                      className="flex-shrink-0"
                    >
                      <svg width="32" height="16" viewBox="0 0 32 16" className="text-orange-500/60">
                        <line x1="0" y1="8" x2="24" y2="8" stroke="currentColor" strokeWidth="2" />
                        <polygon points="24,3 32,8 24,13" fill="currentColor" />
                      </svg>
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Architecture Diagram - Mobile/Tablet */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="lg:hidden"
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {steps.map((step, i) => {
              const colors = colorMap[step.color];
              return (
                <motion.div
                  key={step.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl ${colors.bg} border ${colors.border} hover:shadow-lg ${colors.glow} transition-shadow duration-300`}
                >
                  <span className={`text-xs font-bold text-neutral-500`}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className={`text-sm font-semibold ${colors.text} text-center`}>
                    {step.label}
                  </span>
                  <span className="text-xs text-neutral-500 text-center">
                    {step.sublabel}
                  </span>
                </motion.div>
              );
            })}
          </div>

          {/* Mobile Flow Arrows */}
          <div className="flex justify-center mt-6 gap-1">
            {steps.map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.1 }}
                className="flex items-center gap-1"
              >
                <div className="w-8 h-0.5 bg-orange-500/30 rounded" />
                <svg width="8" height="8" viewBox="0 0 8 8" className="text-orange-500/50">
                  <polygon points="0,0 8,4 0,8" fill="currentColor" />
                </svg>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Feature Highlights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          {[
            {
              title: 'Kompilasi Cepat',
              desc: 'Rata-rata waktu kompilasi < 0.5 detik untuk model standar',
              icon: '⚡',
            },
            {
              title: 'Error yang Jelas',
              desc: 'Pesan error yang informatif dengan lokasi dan saran perbaikan',
              icon: '🔍',
            },
            {
              title: 'Output Optimized',
              desc: 'Kode PyTorch yang dihasilkan sudah dioptimasi dan siap produksi',
              icon: '🚀',
            },
          ].map((item, i) => (
            <div
              key={i}
              className="p-4 rounded-xl bg-[#141414] border border-white/5 text-center"
            >
              <div className="text-2xl mb-2">{item.icon}</div>
              <h4 className="text-sm font-semibold text-neutral-200 mb-1">{item.title}</h4>
              <p className="text-xs text-neutral-500">{item.desc}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

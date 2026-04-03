'use client';

import { motion } from 'framer-motion';
import { Target, Palette, Ruler, RefreshCw, Terminal, Zap } from 'lucide-react';

const features = [
  {
    icon: Target,
    title: 'Neural Syntax',
    description: 'Notasi panah (→, ‖, ×) yang bersih dan intuitif untuk mendefinisikan alur neural network.',
    code: `h = x → Dense(256) → ReLU\nout = h → Softmax`,
    color: 'orange',
  },
  {
    icon: Palette,
    title: 'Unicode Support',
    description: 'Huruf Yunani native (α, β, σ) dan simbol matematika (∑, ∫, √) tanpa escape character.',
    code: `α = 0.01\nL = -∑(y * log(ŷ)) + α * ‖W‖²`,
    color: 'purple',
  },
  {
    icon: Ruler,
    title: 'Shape-Safe Types',
    description: 'Verifikasi bentuk tensor pada waktu kompilasi. Tidak ada lagi error dimensi saat runtime.',
    code: `// Error saat kompilasi!\n// shape mismatch: [128] vs [256]\nlet x: Float[batch, 128]`,
    color: 'cyan',
  },
  {
    icon: RefreshCw,
    title: 'Code Generation',
    description: 'Transpilasi ke kode PyTorch Python secara otomatis. NeuralLang → Python yang optimal.',
    code: `// NeuralLang\nout = x → Dense(128) → ReLU\n\n// → PyTorch\n// out = F.relu(\n//   nn.Linear(128)(x))`,
    color: 'green',
  },
  {
    icon: Terminal,
    title: 'Interactive REPL',
    description: 'Eksperimen sintaks secara instan. Uji ide neural network Anda tanpa overhead kompilasi.',
    code: `$ neurallang repl\n> let x = Dense(64) → ReLU\n> x.shape\nFloat[batch, 64]`,
    color: 'yellow',
  },
  {
    icon: Zap,
    title: 'Zero Dependencies Runtime',
    description: 'Dibangun dengan Rust murni, cepat dan aman. Satu binary, tanpa runtime eksternal.',
    code: `$ curl -sSf https://neurallang.dev\n  | sh  # Install\n$ neurallang build model.nlang\n  ✓ Compiled in 0.3s`,
    color: 'orange',
  },
];

const colorMap: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  orange: { bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-400', glow: 'shadow-orange-500/5' },
  purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400', glow: 'shadow-purple-500/5' },
  cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-400', glow: 'shadow-cyan-500/5' },
  green: { bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-400', glow: 'shadow-green-500/5' },
  yellow: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', text: 'text-yellow-400', glow: 'shadow-yellow-500/5' },
};

export default function Features() {
  return (
    <section id="fitur" className="py-24 sm:py-32 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            <span className="gradient-text">Fitur Unggulan</span>
          </h2>
          <p className="text-neutral-400 text-lg max-w-2xl mx-auto">
            NeuralLang dirancang khusus untuk mempermudah penulisan dan eksperimen neural network
            dengan sintaks yang elegan dan type system yang kuat.
          </p>
        </motion.div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => {
            const colors = colorMap[feature.color];
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`group relative p-6 rounded-2xl bg-[#141414] border border-white/5 hover:border-orange-500/20 transition-all duration-500 hover:shadow-xl ${colors.glow}`}
              >
                {/* Icon */}
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${colors.bg} ${colors.border} border mb-4`}>
                  <Icon size={24} className={colors.text} />
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-neutral-100 mb-2">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-neutral-400 mb-4 leading-relaxed">
                  {feature.description}
                </p>

                {/* Code snippet */}
                <div className="code-block p-3 text-xs font-mono">
                  <pre className="whitespace-pre-wrap leading-relaxed">
                    {feature.code.split('\n').map((line, j) => (
                      <code key={j}>
                        <span className="nl-comment">{line.startsWith('//') ? line : ''}</span>
                        {line.startsWith('//') ? '' : (
                          <>
                            {line.split(/(\bfn\b|\blet\b|\breturn\b|\bDense\b|\bReLU\b|\bSoftmax\b|\bFloat\b|\bInt\b|\bneurallang\b|\bbuild\b)/).map((part, k) => {
                              if (/^(fn|let|return)$/.test(part)) return <span key={k} className="nl-keyword">{part}</span>;
                              if (/^(Dense|ReLU|Softmax|Float|Int)$/.test(part)) return <span key={k} className="nl-type">{part}</span>;
                              if (part === '→') return <span key={k} className="nl-operator">{part}</span>;
                              if (/^\d/.test(part)) return <span key={k} className="nl-number">{part}</span>;
                              if (/^[αβγδεζ]/.test(part)) return <span key={k} className="nl-greek">{part}</span>;
                              return part;
                            })}
                          </>
                        )}
                        {j < feature.code.split('\n').length - 1 ? '\n' : ''}
                      </code>
                    ))}
                  </pre>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, ChevronRight, Loader2 } from 'lucide-react';
import CodeHighlighter from './code-highlighter';

const presetExamples = [
  {
    name: 'Neural Network Definition',
    code: `// Definisikan neural network
fn mlp(input: Float[batch, 784]) → Float[batch, 10] {
  h1 = input → Dense(784, 256) → ReLU
  h2 = h1 → Dense(256, 128) → ReLU
  out = h2 → Dense(128, 10) → Softmax
  return out
}`,
    output: `✓ Kompilasi berhasil (0.12s)
✓ Shape verification passed

  Input:   Float[batch, 784]
  Dense→   Float[batch, 256]
  ReLU→    Float[batch, 256]
  Dense→   Float[batch, 128]
  ReLU→    Float[batch, 128]
  Dense→   Float[batch, 10]
  Softmax→ Float[batch, 10]

  Total parameters: 235,146
  Model: mlp ✓`,
  },
  {
    name: 'Loss Function',
    code: `// Hitung loss dengan notasi matematika
α = 0.01
L = -∑(y * log(ŷ)) + α * ‖W‖²

// Cetak hasil
print("Loss: {L:.4f}")
print("Regularization: {α * ‖W‖²:.6f}")`,
    output: `✓ Kompilasi berhasil (0.04s)

  Evaluasi Loss Function:
  ──────────────────────────
  CrossEntropy:     -∑(y * log(ŷ)) = 0.3421
  Regularization:    α * ‖W‖²        = 0.0018
  ──────────────────────────
  Total Loss:        L                = 0.3439

  Output:
  Loss: 0.3439
  Regularization: 0.001800`,
  },
  {
    name: 'Training Loop',
    code: `// Training loop
for epoch ∈ 1..100 {
  for (x, y) in dataloader(train_data) {
    ŷ = model(x)
    ∇ = backward(Loss(ŷ, y))
    update!(params, ∇; lr=0.001)
  }
  
  if epoch % 10 == 0 {
    print("Epoch {epoch}: loss={eval_loss:.4f}")
  }
}`,
    output: `✓ Kompilasi berhasil (0.18s)
✓ Training loop optimized

  Training Configuration:
  ────────────────────────────
  Epochs:      100
  Batch size:  32
  Learning rate: 0.001
  Optimizer:   Adam (β₁=0.9, β₂=0.999)
  ────────────────────────────

  Simulated output:
  Epoch 10: loss=0.8432
  Epoch 20: loss=0.5219
  Epoch 30: loss=0.3847
  Epoch 40: loss=0.2912
  Epoch 50: loss=0.2245
  ...
  Epoch 100: loss=0.0812 ✓`,
  },
  {
    name: 'Custom Layer',
    code: `// Definisikan custom layer
struct Attention {
  Q: Dense[d_model, d_k]
  K: Dense[d_model, d_k]
  V: Dense[d_model, d_v]
}

fn forward(self, x: Float[seq, d_model])
  → Float[seq, d_v] {
  q = self.Q(x)
  k = self.K(x)
  v = self.V(x)
  
  attn = softmax(q × kᵀ / √d_k)
  return attn × v
}`,
    output: `✓ Kompilasi berhasil (0.15s)
✓ Custom layer verified

  Attention Layer:
  ────────────────────────────
  Q projection: Dense[512, 64]
  K projection: Dense[512, 64]
  V projection: Dense[512, 64]
  ────────────────────────────
  Shape flow:
    x:       Float[seq, 512]
    q, k:    Float[seq, 64]
    v:       Float[seq, 64]
    attn:    Float[seq, seq]
    output:  Float[seq, 64]
  
  Total parameters: 98,560
  Layer: Attention ✓`,
  },
];

export default function Repl() {
  const [code, setCode] = useState(presetExamples[0].code);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [activeExample, setActiveExample] = useState(0);
  const outputRef = useRef<HTMLDivElement>(null);

  const handleRun = () => {
    setIsRunning(true);
    setOutput('');

    const example = presetExamples.find((e) => e.code === code);
    const result = example?.output || generateFallbackOutput(code);

    // Simulate typing effect
    let index = 0;
    const lines = result.split('\n');
    let accumulated = '';

    const timer = setInterval(() => {
      if (index < lines.length) {
        accumulated += (index > 0 ? '\n' : '') + lines[index];
        setOutput(accumulated);
        index++;
      } else {
        clearInterval(timer);
        setIsRunning(false);
      }
    }, 40);

    return () => clearInterval(timer);
  };

  const generateFallbackOutput = (inputCode: string) => {
    const lines = [
      '✓ Kompilasi berhasil',
      '',
      '  Menganalisis kode...',
    ];

    if (inputCode.includes('fn')) {
      lines.push('  Fungsi terdeteksi: ✓');
    }
    if (inputCode.includes('Dense')) {
      lines.push('  Layer Dense terdeteksi: ✓');
    }
    if (inputCode.includes('→')) {
      const arrowCount = (inputCode.match(/→/g) || []).length;
      lines.push(`  Operator alur terdeteksi: ${arrowCount}x →`);
    }
    if (/[\u03B1-\u03C9]/.test(inputCode)) {
      lines.push('  Huruf Yunani terdeteksi: ✓');
    }

    lines.push('');
    lines.push('  Semua pemeriksaan berhasil! ✓');

    return lines.join('\n');
  };

  const handleReset = () => {
    setCode('');
    setOutput('');
  };

  const loadExample = (index: number) => {
    setActiveExample(index);
    setCode(presetExamples[index].code);
    setOutput('');
  };

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  return (
    <section id="repl" className="py-24 sm:py-32 relative">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            <span className="gradient-text">Interactive REPL</span>
          </h2>
          <p className="text-neutral-400 text-lg max-w-2xl mx-auto">
            Eksperimen langsung dengan NeuralLang. Tulis kode dan lihat hasilnya secara instan.
          </p>
        </motion.div>

        {/* Example Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-wrap gap-2 mb-4"
        >
          {presetExamples.map((example, i) => (
            <button
              key={i}
              onClick={() => loadExample(i)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                activeExample === i
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                  : 'bg-white/5 text-neutral-400 border border-white/10 hover:border-orange-500/20 hover:text-orange-400'
              }`}
            >
              {example.name}
            </button>
          ))}
        </motion.div>

        {/* REPL Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="rounded-2xl border border-white/10 bg-[#0d0d0d] overflow-hidden shadow-2xl"
        >
          {/* REPL Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#111] border-b border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
              <span className="ml-3 text-xs text-neutral-500 font-mono">neurallang-repl</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                className="p-1.5 text-neutral-500 hover:text-neutral-300 transition-colors"
                title="Reset"
              >
                <RotateCcw size={14} />
              </button>
              <button
                onClick={handleRun}
                disabled={isRunning}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-orange-500 hover:bg-orange-600 text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRunning ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Play size={14} />
                )}
                {isRunning ? 'Menjalankan...' : 'Jalankan'}
              </button>
            </div>
          </div>

          {/* Code Editor */}
          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-[#0a0a0a] border-r border-white/5 flex flex-col items-center pt-4">
              {code.split('\n').map((_, i) => (
                <span key={i} className="text-[11px] text-neutral-600 font-mono leading-6">
                  {i + 1}
                </span>
              ))}
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck={false}
              className="w-full min-h-[220px] bg-transparent text-sm font-mono p-4 pl-16 resize-y focus:outline-none text-neutral-200 leading-6 placeholder-neutral-600"
              placeholder="// Tulis kode NeuralLang di sini..."
              style={{ tabSize: 2 }}
            />
          </div>

          {/* Divider */}
          <div className="border-t border-white/5" />

          {/* Output Panel */}
          <div
            ref={outputRef}
            className="min-h-[150px] max-h-[300px] overflow-y-auto p-4 font-mono text-sm bg-[#080808]"
          >
            {output ? (
              <div className="whitespace-pre-wrap leading-6">
                {output.split('\n').map((line, i) => (
                  <div key={i}>
                    {line.startsWith('✓') ? (
                      <span className="text-green-400">{line}</span>
                    ) : line.startsWith('  Epoch') || line.includes('loss=') ? (
                      <span className="text-orange-300">{line}</span>
                    ) : line.startsWith('  ─') ? (
                      <span className="text-neutral-700">{line}</span>
                    ) : line.startsWith('  Output:') ? (
                      <span className="text-cyan-400">{line}</span>
                    ) : line.startsWith('  Simulated') ? (
                      <span className="text-neutral-500">{line}</span>
                    ) : line.includes('...') ? (
                      <span className="text-neutral-500">{line}</span>
                    ) : (
                      <span className="text-neutral-300">{line}</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-neutral-600">
                <ChevronRight size={14} />
                <span>Output akan muncul di sini setelah menjalankan kode...</span>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

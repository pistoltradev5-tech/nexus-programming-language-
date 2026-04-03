'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Copy, Check, RotateCcw, Download, Code2,
  Terminal, ArrowRight, Loader2, Sparkles, AlertCircle,
} from 'lucide-react';
import CodeHighlighter from './code-highlighter';

const EXAMPLES = [
  {
    name: 'MLP Classifier',
    code: `// Definisikan neural network MLP
fn mlp(input: Float[batch, 784]) → Float[batch, 10] {
  h1 = input → Dense(784, 256) → ReLU
  h2 = h1 → Dense(256, 128) → ReLU
  out = h2 → Dense(128, 10) → Softmax
  return out
}`,
  },
  {
    name: 'Training Loop',
    code: `// Training loop dengan notasi matematika
for epoch ∈ 1..100 {
  for (x, y) in dataloader(train_data) {
    ŷ = model(x)
    loss = CrossEntropy(ŷ, y)
    loss.backward()
    optimizer.step()
  }
  
  if epoch % 10 == 0 {
    print("Epoch {epoch}: loss={eval_loss:.4f}")
  }
}`,
  },
  {
    name: 'Custom Loss',
    code: `// Custom focal loss dengan regularisasi
fn focal_loss(ŷ: Tensor, y: Tensor, γ: Float) → Float {
  p_t = y * ŷ + (1 - y) * (1 - ŷ)
  α_t = y * 0.75 + (1 - y) * 0.25
  
  loss = -α_t * (1 - p_t)^γ * log(p_t)
  return ∑(loss) / batch_size
}`,
  },
  {
    name: 'Attention Layer',
    code: `// Self-Attention module
struct Attention {
  Q: Dense[d_model, d_k]
  K: Dense[d_model, d_k]
  V: Dense[d_model, d_v]
}`,
  },
  {
    name: 'Loss Function',
    code: `// Hitung loss dengan notasi matematika
α = 0.01
L = -∑(y * log(ŷ)) + α * ‖W‖²

// Cetak hasil
print("Loss: {L:.4f}")
print("Regularization: {α * ‖W‖²:.6f}")`,
  },
];

// Simple Python syntax highlighter
function highlightPython(code: string): string {
  let html = code
    // Escape HTML
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Comments
  html = html.replace(/(#.*$)/gm, '<span style="color:#6b7280;font-style:italic">$1</span>');

  // Strings (f-strings and regular)
  html = html.replace(/(f?"[^"]*")/g, '<span style="color:#86efac">$1</span>');
  html = html.replace(/(f?'[^']*')/g, '<span style="color:#86efac">$1</span>');

  // Keywords
  const keywords = ['import', 'from', 'class', 'def', 'return', 'for', 'in', 'if', 'else', 'elif', 'with', 'as', 'self', 'True', 'False', 'None', 'and', 'or', 'not', 'super', 'while', 'try', 'except', 'finally', 'raise', 'pass', 'break', 'continue', 'lambda', 'yield'];
  for (const kw of keywords) {
    const regex = new RegExp(`\\b(${kw})\\b`, 'g');
    html = html.replace(regex, '<span style="color:#f97316;font-weight:600">$1</span>');
  }

  // Built-in types/modules
  const types = ['torch', 'nn', 'F', 'optim', 'range', 'print', 'int', 'float', 'str', 'list', 'dict', 'tuple'];
  for (const t of types) {
    const regex = new RegExp(`\\b(${t})\\b`, 'g');
    html = html.replace(regex, '<span style="color:#22d3ee">$1</span>');
  }

  // Numbers
  html = html.replace(/\b(\d+\.?\d*)\b/g, '<span style="color:#4ade80">$1</span>');

  // Decorators
  html = html.replace(/(@\w+)/g, '<span style="color:#fbbf24">$1</span>');

  return html;
}

export default function Playground() {
  const [inputCode, setInputCode] = useState(EXAMPLES[0].code);
  const [pythonOutput, setPythonOutput] = useState('');
  const [isTranspiling, setIsTranspiling] = useState(false);
  const [activeExample, setActiveExample] = useState(0);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<{ inputLines: number; outputLines: number; reduction: string; compileTime: number } | null>(null);
  const outputRef = useRef<HTMLPreElement>(null);

  const handleTranspile = useCallback(async () => {
    setIsTranspiling(true);
    setError('');
    setStats(null);

    // Small delay for UX
    await new Promise(resolve => setTimeout(resolve, 300));

    try {
      const { transpile } = await import('@/lib/neurallang/transpiler');
      const result = transpile(inputCode);

      if (result.success) {
        setPythonOutput(result.python);
        setStats(result.stats);
        if (result.warnings.length > 0) {
          setError(result.warnings.join('\n'));
        }
      } else {
        setError(result.errors.join('\n'));
        setPythonOutput('');
      }
    } catch (e: any) {
      setError(`Error: ${e.message}`);
      setPythonOutput('');
    } finally {
      setIsTranspiling(false);
    }
  }, [inputCode]);

  const handleCopy = useCallback(() => {
    if (pythonOutput) {
      navigator.clipboard.writeText(pythonOutput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [pythonOutput]);

  const handleDownload = useCallback(() => {
    if (pythonOutput) {
      const blob = new Blob([pythonOutput], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'model.py';
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [pythonOutput]);

  const handleReset = () => {
    setInputCode('');
    setPythonOutput('');
    setError('');
    setStats(null);
  };

  const loadExample = (index: number) => {
    setActiveExample(index);
    setInputCode(EXAMPLES[index].code);
    setPythonOutput('');
    setError('');
    setStats(null);
  };

  // Auto-transpile when example changes
  useEffect(() => {
    if (inputCode) {
      handleTranspile();
    }
  }, [activeExample]);

  return (
    <section id="playground" className="py-24 sm:py-32 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 mb-6">
            <Sparkles size={14} className="text-orange-400" />
            <span className="text-xs font-medium text-orange-400">Transpiler Real</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            <span className="gradient-text">Playground Interaktif</span>
          </h2>
          <p className="text-neutral-400 text-lg max-w-3xl mx-auto">
            Tulis kode NeuralLang dan lihat langsung kode Python/PyTorch yang dihasilkan.
            Kode output bisa langsung dijalankan di environment Python Anda.
          </p>
        </motion.div>

        {/* Example Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-wrap gap-2 mb-6 justify-center"
        >
          {EXAMPLES.map((ex, i) => (
            <button
              key={i}
              onClick={() => loadExample(i)}
              className={`px-4 py-2 text-xs font-medium rounded-lg transition-all duration-200 ${
                activeExample === i
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30 shadow-lg shadow-orange-500/5'
                  : 'bg-white/5 text-neutral-400 border border-white/10 hover:border-orange-500/20 hover:text-orange-400'
              }`}
            >
              {ex.name}
            </button>
          ))}
        </motion.div>

        {/* Editor Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-4"
        >
          {/* Input: NeuralLang Editor */}
          <div className="rounded-2xl border border-white/10 bg-[#0d0d0d] overflow-hidden">
            {/* Editor Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#111] border-b border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
                <span className="ml-3 text-xs text-neutral-500 font-mono flex items-center gap-1.5">
                  <Code2 size={12} />
                  NeuralLang
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleReset}
                  className="p-1.5 text-neutral-500 hover:text-neutral-300 transition-colors rounded-lg hover:bg-white/5"
                  title="Reset"
                >
                  <RotateCcw size={14} />
                </button>
                <button
                  onClick={handleTranspile}
                  disabled={isTranspiling}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-orange-500 hover:bg-orange-600 text-black transition-colors disabled:opacity-50"
                >
                  {isTranspiling ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Play size={14} />
                  )}
                  {isTranspiling ? 'Mengompilasi...' : 'Transpile →'}
                </button>
              </div>
            </div>

            {/* Code Editor */}
            <div className="relative">
              <div className="absolute left-0 top-0 bottom-0 w-12 bg-[#0a0a0a] border-r border-white/5 flex flex-col items-center pt-4 overflow-hidden">
                {inputCode.split('\n').map((_, i) => (
                  <span key={i} className="text-[11px] text-neutral-600 font-mono leading-6 shrink-0">
                    {i + 1}
                  </span>
                ))}
              </div>
              <textarea
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                spellCheck={false}
                className="w-full min-h-[350px] bg-transparent text-sm font-mono p-4 pl-16 resize-y focus:outline-none text-neutral-200 leading-6 placeholder-neutral-600"
                placeholder="// Tulis kode NeuralLang di sini..."
                style={{ tabSize: 2 }}
              />
            </div>
          </div>

          {/* Output: Python Code */}
          <div className="rounded-2xl border border-white/10 bg-[#0d0d0d] overflow-hidden">
            {/* Output Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#111] border-b border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
                <span className="ml-3 text-xs text-neutral-500 font-mono flex items-center gap-1.5">
                  <Terminal size={12} />
                  Python / PyTorch
                </span>
              </div>
              <div className="flex items-center gap-2">
                {pythonOutput && (
                  <>
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 transition-all"
                    >
                      {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                      {copied ? 'Tersalin!' : 'Copy'}
                    </button>
                    <button
                      onClick={handleDownload}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 transition-all"
                    >
                      <Download size={14} />
                      Download .py
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Output Content */}
            <div className="min-h-[350px] max-h-[500px] overflow-y-auto">
              {pythonOutput ? (
                <pre
                  ref={outputRef}
                  className="p-4 text-sm font-mono leading-6 overflow-x-auto"
                  dangerouslySetInnerHTML={{ __html: highlightPython(pythonOutput) }}
                />
              ) : error ? (
                <div className="p-6 flex items-start gap-3">
                  <AlertCircle size={18} className="text-red-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-red-400 font-medium mb-1">Error Transpilasi</p>
                    <pre className="text-xs text-red-300/80 whitespace-pre-wrap">{error}</pre>
                  </div>
                </div>
              ) : (
                <div className="p-6 flex flex-col items-center justify-center min-h-[350px] text-neutral-600">
                  <ArrowRight size={24} className="mb-3 text-orange-500/30" />
                  <p className="text-sm">Kode Python akan muncul di sini</p>
                  <p className="text-xs mt-1">Klik &quot;Transpile&quot; atau pilih contoh di atas</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Stats Bar */}
        <AnimatePresence>
          {stats && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mt-6 flex flex-wrap items-center justify-center gap-4"
            >
              <div className="flex items-center gap-6 px-6 py-3 rounded-xl bg-[#141414] border border-white/5">
                <div className="text-center">
                  <div className="text-lg font-bold text-orange-400">{stats.inputLines}</div>
                  <div className="text-xs text-neutral-500">Baris Input</div>
                </div>
                <ArrowRight size={16} className="text-neutral-600" />
                <div className="text-center">
                  <div className="text-lg font-bold text-cyan-400">{stats.outputLines}</div>
                  <div className="text-xs text-neutral-500">Baris Output</div>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="text-center">
                  <div className="text-lg font-bold text-green-400">{stats.compileTime}ms</div>
                  <div className="text-xs text-neutral-500">Waktu Kompilasi</div>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-400">{stats.reduction}</div>
                  <div className="text-xs text-neutral-500">Selisih Baris</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info Banner */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8 text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/5 border border-cyan-500/10 text-xs text-neutral-400">
            <Sparkles size={12} className="text-cyan-400" />
            Kode Python yang dihasilkan 100% valid dan siap dijalankan dengan PyTorch
          </div>
        </motion.div>
      </div>
    </section>
  );
}

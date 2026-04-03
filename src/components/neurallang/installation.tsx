'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, useInView } from 'framer-motion';
import { Copy, Check } from 'lucide-react';

interface InstallStep {
  number: number;
  title: string;
  description: string;
  code: string;
  codeLabel?: string;
}

const steps: InstallStep[] = [
  {
    number: 1,
    title: 'Install via curl',
    description: 'Cara tercepat untuk menginstall NeuralLang di sistem Anda. Cukup jalankan satu baris perintah.',
    code: 'curl -sSf https://neurallang.dev/install.sh | sh',
  },
  {
    number: 2,
    title: 'Install via Cargo',
    description: 'Jika Anda sudah memiliki Rust toolchain, install langsung melalui Cargo package manager.',
    code: 'cargo install neurallang',
  },
  {
    number: 3,
    title: 'Verifikasi Instalasi',
    description: 'Pastikan NeuralLang berhasil terinstall dengan memeriksa versi yang terpasang.',
    code: '$ neurallang --version\nNeuralLang v0.8.2 (Rust)',
  },
];

function CodeBlock({ code, codeLabel }: { code: string; codeLabel?: string }) {
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    });
  }, [code]);

  return (
    <div className="relative group">
      {codeLabel && (
        <div className="absolute top-2 right-14 text-[10px] text-neutral-600 font-mono px-2 py-0.5 rounded bg-white/5">
          {codeLabel}
        </div>
      )}
      <div className="code-block p-4 pr-12 font-mono text-sm text-neutral-300 whitespace-pre-wrap leading-relaxed">
        <code>{code}</code>
      </div>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-2 rounded-md bg-white/5 border border-white/10 text-neutral-400 hover:text-orange-400 hover:border-orange-500/30 hover:bg-orange-500/10 transition-all duration-200"
        title="Salin kode"
      >
        {copied ? (
          <Check size={14} className="text-green-400" />
        ) : (
          <Copy size={14} />
        )}
      </button>
      {copied && (
        <motion.span
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="absolute -bottom-7 right-2 text-xs text-green-400 font-medium"
        >
          Tersalin!
        </motion.span>
      )}
    </div>
  );
}

export default function Installation() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="instalasi" ref={ref} className="relative py-20 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-sm font-mono text-orange-400/70 tracking-wider uppercase">Instalasi</span>
          <h2 className="mt-3 text-3xl md:text-4xl font-bold gradient-text">
            Mulai dalam 3 Langkah
          </h2>
          <p className="mt-4 text-neutral-400 max-w-xl mx-auto">
            Instalasi NeuralLang sangat mudah dan cepat. Pilih metode yang paling sesuai dengan preferensi Anda.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Vertical connecting line */}
          <div className="absolute left-6 md:left-8 top-0 bottom-0 w-px bg-gradient-to-b from-orange-500/50 via-orange-500/20 to-transparent hidden sm:block" />

          <div className="space-y-12">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: -30 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.2 + index * 0.15 }}
                className="relative flex gap-6 md:gap-8"
              >
                {/* Step Number Circle */}
                <div className="relative z-10 flex-shrink-0">
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-[#0a0a0a] border-2 border-orange-500/50 flex items-center justify-center shadow-[0_0_15px_rgba(249,115,22,0.15)]">
                    <span className="text-lg md:text-xl font-bold font-mono text-orange-400">
                      {step.number}
                    </span>
                  </div>
                </div>

                {/* Step Content */}
                <div className="flex-1 pt-1 md:pt-2">
                  <h3 className="text-xl md:text-2xl font-semibold text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-neutral-400 text-sm md:text-base mb-4">
                    {step.description}
                  </p>
                  <CodeBlock code={step.code} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

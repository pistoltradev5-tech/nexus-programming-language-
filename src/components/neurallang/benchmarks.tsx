'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

interface BenchmarkEntry {
  name: string;
  value: string;
  barPercent: number;
  color: string;
}

interface BenchmarkGroup {
  metric: string;
  items: BenchmarkEntry[];
}

const benchmarks: BenchmarkGroup[] = [
  {
    metric: 'Waktu Kompilasi',
    items: [
      { name: 'NeuralLang', value: '0.3s', barPercent: 15, color: 'bg-orange-500' },
      { name: 'Python/PyTorch', value: 'N/A - Interpreter', barPercent: 0, color: 'bg-neutral-600' },
      { name: 'JAX', value: '1.2s', barPercent: 60, color: 'bg-cyan-500' },
    ],
  },
  {
    metric: 'Baris Kode - MLP Model',
    items: [
      { name: 'NeuralLang', value: '5 baris', barPercent: 25, color: 'bg-orange-500' },
      { name: 'Python/PyTorch', value: '14 baris', barPercent: 70, color: 'bg-neutral-600' },
      { name: 'JAX', value: '18 baris', barPercent: 90, color: 'bg-cyan-500' },
    ],
  },
  {
    metric: 'Type Safety',
    items: [
      { name: 'NeuralLang', value: '★★★★★', barPercent: 100, color: 'bg-orange-500' },
      { name: 'Python/PyTorch', value: '★★☆☆☆', barPercent: 40, color: 'bg-neutral-600' },
      { name: 'JAX', value: '★★★☆☆', barPercent: 60, color: 'bg-cyan-500' },
    ],
  },
];

function BarChart({ group, groupIndex }: { group: BenchmarkGroup; groupIndex: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: groupIndex * 0.15 }}
      className="space-y-4"
    >
      <h4 className="text-sm font-mono text-neutral-400 tracking-wide uppercase mb-3">
        {group.metric}
      </h4>
      <div className="space-y-3">
        {group.items.map((item, itemIndex) => (
          <div key={item.name} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span
                className={`font-medium ${
                  item.name === 'NeuralLang' ? 'text-orange-400' : 'text-neutral-400'
                }`}
              >
                {item.name}
              </span>
              <span className="font-mono text-xs text-neutral-500">{item.value}</span>
            </div>
            <div className="h-3 rounded-full bg-white/5 overflow-hidden">
              {item.barPercent > 0 ? (
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${item.barPercent}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: groupIndex * 0.15 + itemIndex * 0.1, ease: 'easeOut' }}
                  className={`h-full rounded-full ${item.color}`}
                  style={{
                    boxShadow:
                      item.color === 'bg-orange-500'
                        ? '0 0 10px rgba(249, 115, 22, 0.4)'
                        : item.color === 'bg-cyan-500'
                        ? '0 0 10px rgba(34, 211, 238, 0.3)'
                        : 'none',
                  }}
                />
              ) : (
                <div className="h-full flex items-center px-2">
                  <span className="text-[10px] text-neutral-500 font-mono">Interpreter</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default function Benchmarks() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="benchmark" ref={ref} className="relative py-20 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-sm font-mono text-orange-400/70 tracking-wider uppercase">Benchmark</span>
          <h2 className="mt-3 text-3xl md:text-4xl font-bold gradient-text">
            Performa yang Tak Tertandingi
          </h2>
          <p className="mt-4 text-neutral-400 max-w-xl mx-auto">
            NeuralLang unggul dalam berbagai metrik penting. Lihat bagaimana kami membandingkannya dengan framework populer lainnya.
          </p>
        </motion.div>

        {/* Benchmark Cards */}
        <div className="grid gap-8 md:gap-10">
          {benchmarks.map((group, index) => (
            <div
              key={group.metric}
              className="rounded-xl border border-white/10 bg-white/[0.02] backdrop-blur-sm p-6 md:p-8"
            >
              <BarChart group={group} groupIndex={index} />
            </div>
          ))}
        </div>

        {/* Legend */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-6 mt-10 text-sm text-neutral-400"
        >
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.5)]" />
            <span>NeuralLang</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-neutral-600" />
            <span>Python/PyTorch</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-cyan-500 shadow-[0_0_6px_rgba(34,211,238,0.4)]" />
            <span>JAX</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

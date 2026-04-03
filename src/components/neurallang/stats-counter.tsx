'use client';

import { useRef, useEffect, useState } from 'react';
import { motion, useInView } from 'framer-motion';

interface StatItem {
  icon: string;
  value: number;
  suffix: string;
  label: string;
  prefix?: string;
  decimals?: number;
}

const stats: StatItem[] = [
  { icon: '🌟', value: 12847, suffix: '+', label: 'GitHub Stars' },
  { icon: '📦', value: 45000, suffix: '+', label: 'Downloads' },
  { icon: '🔧', value: 234, suffix: '', label: 'Kontributor' },
  { icon: '⚡', value: 0.3, suffix: 's', label: 'Waktu Kompilasi Rata-rata', decimals: 1, prefix: '~' },
];

function AnimatedNumber({ value, suffix, prefix, decimals }: Omit<StatItem, 'icon' | 'label'>) {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;

    const duration = 2000;
    const startTime = performance.now();
    const targetValue = value;

    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = targetValue * eased;

      if (decimals && decimals > 0) {
        setDisplayValue(parseFloat(current.toFixed(decimals)));
      } else {
        setDisplayValue(Math.floor(current));
      }

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  }, [isInView, value, decimals]);

  const formatted = decimals
    ? displayValue.toFixed(decimals)
    : displayValue.toLocaleString('id-ID');

  return (
    <span ref={ref}>
      {prefix || ''}{formatted}{suffix}
    </span>
  );
}

export default function StatsCounter() {
  return (
    <section className="relative py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
        >
          {/* Glass-morphism container */}
          <div className="relative rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-8 md:p-12 overflow-hidden">
            {/* Subtle gradient background */}
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/[0.03] via-transparent to-amber-500/[0.03]" />
            <div className="absolute inset-0 bg-gradient-to-b from-orange-500/[0.02] via-transparent to-transparent" />

            <div className="relative grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="text-3xl mb-3">{stat.icon}</div>
                  <div className="text-3xl md:text-4xl font-bold text-orange-400 font-mono neon-text-glow">
                    <AnimatedNumber
                      value={stat.value}
                      suffix={stat.suffix}
                      prefix={stat.prefix}
                      decimals={stat.decimals}
                    />
                  </div>
                  <div className="mt-2 text-sm text-neutral-400 font-medium">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Decorative corner accents */}
            <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-orange-500/10 to-transparent rounded-tl-2xl" />
            <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-tl from-amber-500/10 to-transparent rounded-br-2xl" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

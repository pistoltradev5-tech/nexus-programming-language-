'use client';

import { motion } from 'framer-motion';
import { ArrowRight, BookOpen } from 'lucide-react';
import Image from 'next/image';

function NeuralNodes() {
  const nodes = [
    { x: '10%', y: '20%', size: 6, delay: 0, duration: 5 },
    { x: '25%', y: '60%', size: 4, delay: 0.5, duration: 6 },
    { x: '45%', y: '15%', size: 8, delay: 1, duration: 4.5 },
    { x: '65%', y: '70%', size: 5, delay: 1.5, duration: 5.5 },
    { x: '80%', y: '25%', size: 7, delay: 0.8, duration: 5 },
    { x: '90%', y: '55%', size: 4, delay: 2, duration: 6 },
    { x: '15%', y: '80%', size: 5, delay: 1.2, duration: 4 },
    { x: '55%', y: '45%', size: 6, delay: 0.3, duration: 5.5 },
    { x: '35%', y: '35%', size: 3, delay: 1.8, duration: 6.5 },
    { x: '75%', y: '40%', size: 4, delay: 0.7, duration: 5 },
    { x: '50%', y: '85%', size: 5, delay: 1.1, duration: 4.5 },
    { x: '88%', y: '80%', size: 3, delay: 2.2, duration: 5 },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Connection Lines (SVG) */}
      <svg className="absolute inset-0 w-full h-full opacity-20">
        <line x1="10%" y1="20%" x2="45%" y2="15%" stroke="#f97316" strokeWidth="0.5" strokeDasharray="4 4" className="animate-dash-flow" />
        <line x1="45%" y1="15%" x2="80%" y2="25%" stroke="#f97316" strokeWidth="0.5" strokeDasharray="4 4" className="animate-dash-flow" />
        <line x1="25%" y1="60%" x2="55%" y2="45%" stroke="#f97316" strokeWidth="0.5" strokeDasharray="4 4" className="animate-dash-flow" />
        <line x1="55%" y1="45%" x2="75%" y2="40%" stroke="#f97316" strokeWidth="0.5" strokeDasharray="4 4" className="animate-dash-flow" />
        <line x1="55%" y1="45%" x2="65%" y2="70%" stroke="#f97316" strokeWidth="0.5" strokeDasharray="4 4" className="animate-dash-flow" />
        <line x1="15%" y1="80%" x2="35%" y2="35%" stroke="#f97316" strokeWidth="0.5" strokeDasharray="4 4" className="animate-dash-flow" />
        <line x1="35%" y1="35%" x2="55%" y2="45%" stroke="#f97316" strokeWidth="0.5" strokeDasharray="4 4" className="animate-dash-flow" />
        <line x1="65%" y1="70%" x2="90%" y2="55%" stroke="#f97316" strokeWidth="0.5" strokeDasharray="4 4" className="animate-dash-flow" />
        <line x1="50%" y1="85%" x2="65%" y2="70%" stroke="#f97316" strokeWidth="0.5" strokeDasharray="4 4" className="animate-dash-flow" />
      </svg>

      {/* Floating Nodes */}
      {nodes.map((node, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-orange-500/30"
          style={{
            left: node.x,
            top: node.y,
            width: node.size,
            height: node.size,
          }}
          animate={{
            y: [0, -20, 0, 10, 0],
            opacity: [0.3, 0.8, 0.3],
          }}
          transition={{
            duration: node.duration,
            delay: node.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

export default function Hero() {
  const scrollTo = (id: string) => {
    const el = document.querySelector(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="beranda" className="relative min-h-screen flex items-center justify-center grid-bg overflow-hidden">
      <NeuralNodes />

      {/* Radial gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0a0a0a]" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-20">
        {/* Tech badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex items-center justify-center gap-3 mb-8"
        >
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
            Rust
          </span>
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
            MIT License
          </span>
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            codecov
          </span>
        </motion.div>

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mb-8 flex justify-center"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-orange-500/20 blur-3xl rounded-full scale-150" />
            <Image
              src="/neurallang-logo.png"
              alt="NeuralLang"
              width={96}
              height={96}
              className="relative rounded-2xl neon-glow"
            />
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-6 tracking-tight"
        >
          <span className="gradient-text neon-text-glow">NeuralLang</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-lg sm:text-xl md:text-2xl text-neutral-400 mb-4 max-w-3xl mx-auto"
        >
          Next-Generation Programming Language for Artificial Intelligence
        </motion.p>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.65 }}
          className="text-base sm:text-lg text-neutral-500 mb-10 max-w-2xl mx-auto font-mono"
        >
          Tulis neural networks seperti matematika, bukan seperti software.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <button
            onClick={() => scrollTo('#repl')}
            className="group flex items-center gap-2 px-8 py-3.5 bg-orange-500 hover:bg-orange-600 text-black font-semibold rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/25"
          >
            Coba REPL
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={() => scrollTo('#contoh-kode')}
            className="group flex items-center gap-2 px-8 py-3.5 bg-white/5 hover:bg-white/10 text-neutral-200 font-medium rounded-xl border border-white/10 hover:border-orange-500/30 transition-all duration-300"
          >
            <BookOpen size={18} />
            Lihat Dokumentasi
          </button>
        </motion.div>

        {/* Mini code preview */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.1 }}
          className="mt-16 max-w-2xl mx-auto"
        >
          <div className="code-block p-4 text-left text-xs sm:text-sm neon-border">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
              <span className="ml-2 text-neutral-600 text-xs">main.nlang</span>
            </div>
            <pre className="font-mono leading-relaxed">
              <code>
                <span className="nl-keyword">fn</span>{' '}
                <span className="nl-function">mlp</span>(<span className="nl-param">input</span>: <span className="nl-type">Float</span>[<span className="nl-param">batch</span>, <span className="nl-number">784</span>]){' '}
                <span className="nl-operator">→</span>{' '}
                <span className="nl-type">Float</span>[<span className="nl-param">batch</span>, <span className="nl-number">10</span>] {'{'}
                {'\n'}
                {'  '}<span className="nl-param">h1</span> = <span className="nl-param">input</span> <span className="nl-operator">→</span> <span className="nl-type">Dense</span>(<span className="nl-number">784</span>, <span className="nl-number">256</span>) <span className="nl-operator">→</span> <span className="nl-type">ReLU</span>
                {'\n'}
                {'  '}<span className="nl-param">h2</span> = <span className="nl-param">h1</span> <span className="nl-operator">→</span> <span className="nl-type">Dense</span>(<span className="nl-number">256</span>, <span className="nl-number">128</span>) <span className="nl-operator">→</span> <span className="nl-type">ReLU</span>
                {'\n'}
                {'  '}<span className="nl-keyword">return</span> <span className="nl-param">h2</span> <span className="nl-operator">→</span> <span className="nl-type">Dense</span>(<span className="nl-number">128</span>, <span className="nl-number">10</span>) <span className="nl-operator">→</span> <span className="nl-type">Softmax</span>
                {'\n'}
                {'}'}
              </code>
            </pre>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

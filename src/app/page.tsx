'use client';

import Navbar from '@/components/neurallang/navbar';
import Hero from '@/components/neurallang/hero';
import Features from '@/components/neurallang/features';
import Repl from '@/components/neurallang/repl';
import Playground from '@/components/neurallang/playground';
import CodeExamples from '@/components/neurallang/code-examples';
import StatsCounter from '@/components/neurallang/stats-counter';
import Installation from '@/components/neurallang/installation';
import Benchmarks from '@/components/neurallang/benchmarks';
import Architecture from '@/components/neurallang/architecture';
import FAQ from '@/components/neurallang/faq';
import Footer from '@/components/neurallang/footer';
import BackToTop from '@/components/neurallang/back-to-top';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <Features />
      <Repl />
      <Playground />
      <CodeExamples />
      <StatsCounter />
      <Installation />
      <Benchmarks />
      <Architecture />
      <FAQ />
      <Footer />
      <BackToTop />
    </main>
  );
}

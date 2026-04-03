'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    question: 'Apa itu NeuralLang?',
    answer:
      'NeuralLang adalah bahasa pemrograman yang dirancang khusus untuk membangun dan mengeksperimen neural network. Dengan sintaks yang terinspirasi dari notasi matematika, NeuralLang memungkinkan Anda menulis model AI dengan cara yang lebih natural dan ringkas.',
  },
  {
    question: 'Apakah NeuralLang menggantikan PyTorch?',
    answer:
      'Tidak. NeuralLang adalah lapisan abstraksi di atas PyTorch. Kode NeuralLang dikompilasi menjadi kode PyTorch Python yang optimal. Anda tetap bisa menggunakan seluruh ekosistem PyTorch.',
  },
  {
    question: 'Bagaimana cara berkontribusi?',
    answer:
      'NeuralLang adalah proyek open-source di bawah lisensi MIT. Anda bisa berkontribusi melalui GitHub: buka issue, submit pull request, atau bergabung dengan komunitas Discord kami.',
  },
  {
    question: 'Bahasa apa yang digunakan untuk membuat NeuralLang?',
    answer:
      'NeuralLang ditulis sepenuhnya menggunakan bahasa pemrograman Rust. Ini memastikan performa tinggi, keamanan memori, dan zero-dependency runtime.',
  },
  {
    question: 'Apakah mendukung GPU?',
    answer:
      'Ya! Karena NeuralLang menghasilkan kode PyTorch, semua fitur PyTorch termasuk CUDA acceleration, distributed training, dan mixed precision tersedia.',
  },
  {
    question: 'Kapan versi 1.0 akan dirilis?',
    answer:
      'Kami saat ini berada di versi 0.8.x. Versi 1.0 direncanakan akan rilis setelah API stabil dan dokumentasi lengkap, diperkirakan Q3 2026.',
  },
];

export default function FAQ() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="faq" ref={ref} className="relative py-20 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="text-sm font-mono text-orange-400/70 tracking-wider uppercase">FAQ</span>
          <h2 className="mt-3 text-3xl md:text-4xl font-bold gradient-text">
            Pertanyaan yang Sering Diajukan
          </h2>
          <p className="mt-4 text-neutral-400 max-w-xl mx-auto">
            Temukan jawaban atas pertanyaan umum tentang NeuralLang.
          </p>
        </motion.div>

        {/* Accordion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.3 + index * 0.08 }}
              >
                <AccordionItem
                  value={`item-${index}`}
                  className="rounded-lg border border-white/10 bg-white/[0.02] backdrop-blur-sm px-6 data-[state=open]:border-orange-500/20 data-[state=open]:bg-orange-500/[0.03] transition-colors"
                >
                  <AccordionTrigger className="text-left text-base font-medium text-neutral-200 hover:text-orange-400 hover:no-underline py-5 [&[data-state=open]>svg]:text-orange-400">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-neutral-400 text-sm leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}

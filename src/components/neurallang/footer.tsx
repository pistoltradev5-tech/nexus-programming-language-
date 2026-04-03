'use client';

import { motion } from 'framer-motion';
import { Heart, Github, BookOpen, Users, ExternalLink } from 'lucide-react';
import Image from 'next/image';

const links = [
  { label: 'GitHub', href: 'https://github.com', icon: Github },
  { label: 'Dokumentasi', href: '#contoh-kode', icon: BookOpen },
  { label: 'Komunitas', href: 'https://github.com', icon: Users },
];

export default function Footer() {
  const handleClick = (href: string) => {
    if (href.startsWith('#')) {
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.open(href, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <footer className="relative border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          {/* Logo & Description */}
          <div className="flex flex-col items-center md:items-start gap-3">
            <div className="flex items-center gap-3">
              <Image
                src="/neurallang-logo.png"
                alt="NeuralLang"
                width={32}
                height={32}
                className="rounded-lg"
              />
              <span className="text-lg font-bold gradient-text">NeuralLang</span>
            </div>
            <p className="text-sm text-neutral-500 max-w-xs">
              Bahasa pemrograman next-generation untuk Artificial Intelligence. 
              Tulis neural networks seperti matematika.
            </p>
          </div>

          {/* Links */}
          <div className="flex items-center justify-center gap-6">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <button
                  key={link.label}
                  onClick={() => handleClick(link.href)}
                  className="flex items-center gap-2 text-sm text-neutral-500 hover:text-orange-400 transition-colors"
                >
                  <Icon size={16} />
                  {link.label}
                  {!link.href.startsWith('#') && <ExternalLink size={12} />}
                </button>
              );
            })}
          </div>

          {/* Built with */}
          <div className="flex flex-col items-center md:items-end gap-2">
            <div className="flex items-center gap-1.5 text-sm text-neutral-500">
              Dibangun dengan
              <Heart size={14} className="text-red-500 fill-red-500" />
              menggunakan Rust
            </div>
            <p className="text-xs text-neutral-600">
              © {new Date().getFullYear()} NeuralLang Project. MIT License.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

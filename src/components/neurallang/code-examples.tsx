'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import CodeHighlighter from './code-highlighter';

const tabs = [
  {
    id: 'mlp',
    label: 'Definisi Neural Network',
    neurallang: `fn mlp(input: Float[batch, 784]) → Float[batch, 10] {
  h1 = input → Dense(784, 256) → ReLU
  h2 = h1 → Dense(256, 128) → ReLU
  out = h2 → Dense(128, 10) → Softmax
  return out
}`,
    python: `import torch
import torch.nn as nn

class MLP(nn.Module):
    def __init__(self):
        super().__init__()
        self.fc1 = nn.Linear(784, 256)
        self.fc2 = nn.Linear(256, 128)
        self.fc3 = nn.Linear(128, 10)
    
    def forward(self, x):
        x = torch.relu(self.fc1(x))
        x = torch.relu(self.fc2(x))
        x = torch.softmax(self.fc3(x), dim=-1)
        return x`,
    stats: { nlLines: 5, pyLines: 14, reduction: '64%' },
  },
  {
    id: 'training',
    label: 'Training Loop',
    neurallang: `// Training loop
for epoch ∈ 1..100 {
  for (x, y) in dataloader(train_data) {
    ŷ = model(x)
    ∇ = backward(CrossEntropy(ŷ, y))
    update!(params, ∇; lr=0.001)
  }
}`,
    python: `import torch.optim as optim

model = MLP()
optimizer = optim.Adam(model.parameters(), lr=0.001)
criterion = nn.CrossEntropyLoss()

for epoch in range(100):
    for x, y in train_loader:
        optimizer.zero_grad()
        y_pred = model(x)
        loss = criterion(y_pred, y)
        loss.backward()
        optimizer.step()`,
    stats: { nlLines: 7, pyLines: 14, reduction: '50%' },
  },
  {
    id: 'loss',
    label: 'Custom Loss Function',
    neurallang: `// Custom loss dengan regularisasi L2
fn focal_loss(ŷ: Tensor, y: Tensor, γ: Float)
  → Float {
  p_t = y * ŷ + (1 - y) * (1 - ŷ)
  α_t = y * 0.75 + (1 - y) * 0.25
  
  loss = -α_t * (1 - p_t)^γ * log(p_t)
  return ∑(loss) / batch_size
}

// Gunakan dalam training
∇ = backward(focal_loss(ŷ, y; γ=2.0))`,
    python: `import torch
import torch.nn.functional as F

def focal_loss(y_pred, y_true, gamma=2.0, alpha=0.75):
    """
    Focal Loss for imbalanced datasets.
    """
    bce = F.binary_cross_entropy_with_logits(
        y_pred, y_true, reduction='none'
    )
    p_t = y_true * torch.sigmoid(y_pred) + \
          (1 - y_true) * (1 - torch.sigmoid(y_pred))
    alpha_t = y_true * alpha + (1 - y_true) * (1 - alpha)
    loss = -alpha_t * (1 - p_t) ** gamma * bce
    return loss.mean()

# Backward pass
loss = focal_loss(y_pred, y_true, gamma=2.0)
loss.backward()`,
    stats: { nlLines: 12, pyLines: 21, reduction: '43%' },
  },
];

export default function CodeExamples() {
  const [activeTab, setActiveTab] = useState('mlp');
  const current = tabs.find((t) => t.id === activeTab) || tabs[0];

  return (
    <section id="contoh-kode" className="py-24 sm:py-32 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            <span className="gradient-text">Contoh Kode</span>
          </h2>
          <p className="text-neutral-400 text-lg max-w-2xl mx-auto">
            Bandingkan betapa ringkas dan intuitifnya NeuralLang dibandingkan Python/PyTorch.
          </p>
        </motion.div>

        {/* Tab Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-wrap gap-2 mb-8 justify-center"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2 text-sm font-medium rounded-xl transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30 shadow-lg shadow-orange-500/5'
                  : 'bg-white/5 text-neutral-400 border border-white/10 hover:border-orange-500/20 hover:text-orange-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </motion.div>

        {/* Code Comparison */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* NeuralLang Code */}
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                <span className="text-sm font-semibold text-orange-400">NeuralLang</span>
              </div>
              <span className="text-xs text-neutral-500 font-mono">{current.stats.nlLines} baris</span>
            </div>
            <CodeHighlighter
              code={current.neurallang}
              showLineNumbers
              className="neon-border"
            />
          </div>

          {/* Python Code */}
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                <span className="text-sm font-semibold text-cyan-400">Python / PyTorch</span>
              </div>
              <span className="text-xs text-neutral-500 font-mono">{current.stats.pyLines} baris</span>
            </div>
            <div className="code-block border border-white/10">
              <pre className="p-4 overflow-x-auto text-sm leading-relaxed">
                <code>
                  {current.python.split('\n').map((line, i) => (
                    <div key={i} className="flex">
                      <span className="inline-block w-10 text-right mr-4 text-neutral-600 select-none shrink-0">
                        {i + 1}
                      </span>
                      <span className="text-neutral-300">
                        {highlightPython(line)}
                      </span>
                    </div>
                  ))}
                </code>
              </pre>
            </div>
          </div>
        </motion.div>

        {/* Reduction Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8 text-center"
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
            <span className="text-sm text-neutral-400">Pengurangan kode:</span>
            <span className="text-xl font-bold text-orange-400">{current.stats.reduction}</span>
            <span className="text-sm text-neutral-400">
              ({current.stats.pyLines} → {current.stats.nlLines} baris)
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function highlightPython(line: string): React.ReactNode {
  const keywords = ['import', 'from', 'class', 'def', 'return', 'for', 'in', 'if', 'else', 'with', 'as', 'self', 'True', 'False', 'None', 'and', 'or', 'not'];
  const types = ['torch', 'nn', 'optim', 'F', 'MLP', 'Adam', 'CrossEntropyLoss', 'Module', 'Tensor'];

  const parts: React.ReactNode[] = [];
  let remaining = line;
  let key = 0;

  while (remaining.length > 0) {
    // String
    if (remaining.startsWith('"""') || remaining.startsWith("'''")) {
      const quote = remaining.slice(0, 3);
      const endIdx = remaining.indexOf(quote, 3);
      const end = endIdx === -1 ? remaining.length : endIdx + 3;
      parts.push(<span key={key++} className="text-green-400">{remaining.slice(0, end)}</span>);
      remaining = remaining.slice(end);
      continue;
    }
    if (remaining[0] === '"' || remaining[0] === "'") {
      const quote = remaining[0];
      let endIdx = 1;
      while (endIdx < remaining.length && remaining[endIdx] !== quote) {
        if (remaining[endIdx] === '\\') endIdx++;
        endIdx++;
      }
      endIdx++;
      parts.push(<span key={key++} className="text-green-400">{remaining.slice(0, endIdx)}</span>);
      remaining = remaining.slice(endIdx);
      continue;
    }

    // Comment
    if (remaining[0] === '#') {
      parts.push(<span key={key++} className="text-neutral-600 italic">{remaining}</span>);
      remaining = '';
      continue;
    }

    // Decorator
    if (remaining[0] === '@') {
      parts.push(<span key={key++} className="text-yellow-400">{remaining[0]}</span>);
      remaining = remaining.slice(1);
      continue;
    }

    // Number
    const numMatch = remaining.match(/^\d+\.?\d*/);
    if (numMatch) {
      parts.push(<span key={key++} className="text-green-400">{numMatch[0]}</span>);
      remaining = remaining.slice(numMatch[0].length);
      continue;
    }

    // Identifier/keyword
    const identMatch = remaining.match(/^[a-zA-Z_][a-zA-Z0-9_.]*/);
    if (identMatch) {
      const word = identMatch[0].split('.')[0];
      if (keywords.includes(word)) {
        parts.push(<span key={key++} className="text-orange-400 font-semibold">{identMatch[0]}</span>);
      } else if (types.includes(word)) {
        parts.push(<span key={key++} className="text-cyan-400">{identMatch[0]}</span>);
      } else if (word[0] === word[0].toUpperCase()) {
        parts.push(<span key={key++} className="text-cyan-400">{identMatch[0]}</span>);
      } else {
        parts.push(<span key={key++}>{identMatch[0]}</span>);
      }
      remaining = remaining.slice(identMatch[0].length);
      continue;
    }

    // Punctuation
    if ('{}()[].,:;=+-*/<>!@~%^&|'.includes(remaining[0])) {
      parts.push(<span key={key++} className="text-neutral-500">{remaining[0]}</span>);
      remaining = remaining.slice(1);
      continue;
    }

    parts.push(<span key={key++}>{remaining[0]}</span>);
    remaining = remaining.slice(1);
  }

  return <>{parts}</>;
}

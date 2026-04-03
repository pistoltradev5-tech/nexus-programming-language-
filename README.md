# Nexus Programming Language (NeuralLang)

<p align="center">
  <strong>Next-Generation Programming Language for AI</strong><br>
  <em>Write neural networks like mathematics, not like software.</em>
</p>

---

## Overview

**Nexus Programming Language** (codename: NeuralLang) is a domain-specific programming language designed for building neural networks with mathematical syntax. It transpiles directly to **PyTorch** Python code, allowing AI researchers and engineers to express complex neural architectures using concise, intuitive notation.

## Features

### Neural Syntax
Express neural network pipelines with mathematical notation:
```
x → Dense(784, 256) → ReLU → Dense(256, 10) → Softmax
```

### Unicode & Greek Letter Support
Use native mathematical symbols as identifiers:
```nexus
let α = 0.01
let β = 0.99
let σ = sigmoid(z)
loss = ∑(ŷ - y)²
∇W = ∂loss/∂W
```

### Shape-Safe Types
Compile-time tensor shape verification prevents dimension mismatch errors before runtime.

### PyTorch Code Generation
Transpile NeuralLang code to optimized, production-ready PyTorch Python code automatically.

### Interactive REPL
Experiment with syntax and see instant PyTorch output in an interactive playground.

### Zero Dependencies Runtime
The core transpiler has zero runtime dependencies — pure and lightweight.

## Architecture

```
Source Code → Lexer → Parser → AST → Type Checker → Code Generator → PyTorch Python
```

### Compiler Pipeline

| Component | Description |
|-----------|-------------|
| **Lexer** | Tokenizes source code including Unicode/Greek operators (→, ×, ∑, ∫, √, ∇) |
| **Parser** | Builds Abstract Syntax Tree with operator precedence and arrow chains |
| **AST** | Rich node types for functions, structs, arrow chains, math operations |
| **Code Generator** | Transpiles AST to valid Python/PyTorch code with nn.Module classes |

## Code Comparison

### NeuralLang
```nexus
fn mlp(x: Tensor) → Tensor {
  return x → Dense(784, 256) → ReLU → Dropout(0.2) → Dense(256, 10) → Softmax
}
```

### Generated PyTorch
```python
class Mlp(nn.Module):
    def __init__(self):
        super().__init__()
        self.dense_1 = nn.Linear(784, 256)
        self.dropout_1 = nn.Dropout(0.2)
        self.dense_2 = nn.Linear(256, 10)

    def forward(self, x):
        x = self.dense_1(x)
        x = F.relu(x)
        x = self.dropout_1(x)
        x = self.dense_2(x)
        x = F.softmax(x, dim=-1)
        return x
```

## Supported Operators

| Symbol | Operation | PyTorch Equivalent |
|--------|-----------|--------------------|
| `→` | Neural pipeline / Arrow chain | Sequential composition |
| `×` | Matrix multiplication | `torch.matmul()` |
| `⊙` | Element-wise multiplication | `*` operator |
| `⊗` | Outer product | `torch.outer()` |
| `∑` | Summation | `.sum()` |
| `∏` | Product | `.prod()` |
| `∫` | Integration | `torch.trapezoid()` |
| `√` | Square root | `torch.sqrt()` |
| `∇` | Gradient | `.grad` |
| `‖` | Norm | `torch.norm()` |
| `∈` | Element of | `in` operator |

## Supported Layers

`Dense` · `Linear` · `Conv2d` · `ReLU` · `Sigmoid` · `Tanh` · `Softmax` · `Dropout` · `BatchNorm` · `LayerNorm` · `Embedding` · `Flatten` · `Attention` · `LSTM` · `GRU`

## Project Structure

```
├── src/
│   ├── app/                          # Next.js app (Showcase Website)
│   │   ├── page.tsx                  # Main landing page
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   └── neurallang/               # UI components
│   │       ├── hero.tsx              # Hero section
│   │       ├── features.tsx          # Feature cards
│   │       ├── repl.tsx              # Interactive REPL
│   │       ├── playground.tsx        # Code playground
│   │       ├── code-examples.tsx     # Code comparison
│   │       ├── benchmarks.tsx        # Performance charts
│   │       ├── architecture.tsx      # Pipeline diagram
│   │       ├── installation.tsx      # Install guide
│   │       ├── stats-counter.tsx     # Animated stats
│   │       ├── faq.tsx               # FAQ section
│   │       ├── navbar.tsx            # Navigation
│   │       ├── footer.tsx            # Footer
│   │       └── back-to-top.tsx       # Back to top button
│   └── lib/
│       └── neurallang/               # Core Transpiler
│           ├── lexer.ts              # Tokenizer (Unicode support)
│           ├── parser.ts             # AST Builder
│           ├── codegen.ts            # PyTorch Code Generator
│           └── transpiler.ts         # Main API
├── package.json
├── tsconfig.json
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 18+ or Bun
- npm, yarn, or bun

### Installation

```bash
# Clone the repository
git clone https://github.com/pistoltradev5-tech/nexus-programming-language-.git

# Install dependencies
cd nexus-programming-language-
npm install

# Run the development server
npm run dev
```

### Build for Production

```bash
npm run build
npm start
```

## Tech Stack

- **Next.js 16** — React framework for the showcase website
- **TypeScript** — Type-safe transpiler implementation
- **Tailwind CSS 4** — Utility-first styling
- **shadcn/ui** — Component library
- **Framer Motion** — Animations
- **Recharts** — Benchmark visualizations

## License

This project is licensed under the **MIT License**.

---

<p align="center">
  Built with ❤️ by <strong>pistoltradev5-tech</strong>
</p>

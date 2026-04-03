🧠 AI Language Compiler
Next-Generation Programming Language for Artificial Intelligence

"Write neural networks like mathematics, not like software."

✨ Features (MVP)
🎯 Neural Syntax - Clean arrow-based notation (→, ||, ×)
🎨 Unicode Support - Native Greek letters (α, β, σ) and math symbols (∑, ∫, √)
📐 Shape-Safe Types - Compile-time tensor shape verification
🔄 Code Generation - Transpile to PyTorch Python code
💻 Interactive REPL - Experiment with syntax instantly
🚀 Quick Start
Using GitHub Codespaces
Click "Open in Codespaces" or clone this repo
The dev container will set up automatically
Build and run:
# Build the compilercargo build --release# Run interactive REPLcargo run --repl# Or compile a filecargo run --file examples/simple_cnn.ai
Local Development
# Prerequisites: Rust stable toolchain
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Clone and build
git clone https://github.com/YOUR_USERNAME/ai-lang.git
cd ai-lang
cargo build --release

# Run REPL
cargo run --repl

# Compile example
cargo run -- -f examples/simple_cnn.ai --ast
📖 Language Reference
Model Definition
model ModelName {
    input: Image<channels, height, width>
    output: Vector<num_classes>
    
    flow: input
        → Layer1(params) + PostOp1 + PostOp2
        → Layer2(params)
        → output
}

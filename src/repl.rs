//! Interactive REPL (Read-Eval-Print Loop) for the AI Language

use crate::ast::*;
use crate::codegen::CodeGenerator;
use crate::lexer::Lexer;
use crate::parser::Parser;

pub struct Repl {
    history: Vec<String>,
    codegen: CodeGenerator,
}

impl Repl {
    pub fn new() -> Self {
        Self {
            history: Vec::new(),
            codegen: CodeGenerator::new(),
        }
    }

    /// Run the interactive REPL loop
    pub fn run(&mut self) {
        println!("╔══════════════════════════════════════════════════╗");
        println!("║     🧠 AI Language REPL v0.1.0 (MVP)              ║");
        println!("║                                                  ║");
        println!("║  Type your Neural Syntax code below.              ║");
        println!("║  Commands:                                       ║");
        println!("║    .help  - Show help                            ║");
        println!("║    .run   - Generate and show PyTorch code       ║");
        println!("║    .ast   - Show parsed AST                       ║");
        println!("║    .clear - Clear input                           ║");
        println!("║    .quit  - Exit                                  ║");
        println!("╚══════════════════════════════════════════════════╝\n");

        loop {
            print!("🦀 ai> ");
            use std::io::Write;
            std::io::stdout().flush().unwrap();

            let mut input = String::new();
            std::io::stdin().read_line(&mut input).ok();

            let input = input.trim().to_string();

            if input.is_empty() {
                continue;
            }

            // Handle commands
            if input.starts_with('.') {
                match input.trim() {
                    ".help" | ".h" => self.show_help(),
                    ".quit" | ".exit" | ".q" => {
                        println!("👋 Goodbye!");
                        break;
                    }
                    ".clear" | ".c" => {
                        self.history.clear();
                        println!("🗑️  History cleared.");
                    }
                    ".run" | ".r" => {
                        self.run_current_program();
                    }
                    ".ast" | ".a" => {
                        self.show_ast();
                    }
                    ".history" => {
                        self.show_history();
                    }
                    ".example" | ".ex" => {
                        self.show_example();
                    }
                    other => {
                        println!("❓ Unknown command: {}. Type .help for available commands.", other);
                    }
                }
                continue;
            }

            // Store input
            self.history.push(input.clone());

            // Try to lex and parse
            match self.process_input(&input) {
                Ok(result) => println!("✅ {}", result),
                Err(e) => println!("❌ Error: {}", e),
            }
        }
    }

    fn process_input(&mut self, input: &str) -> Result<String, String> {
        // Lexing
        let mut lexer = Lexer::new(input, "repl");
        let tokens = lexer.tokenize().map_err(|e| e.to_string())?;

        // Parsing
        let mut parser = Parser::new(&tokens);
        let program = parser.parse_program().map_err(|e| e.to_string())?;

        // Show brief success info
        let decl_count = program.len();
        let token_count = tokens.len();

        Ok(format!(
            "Parsed {} declaration(s) from {} token(s).\n\
             Type '.run' to generate PyTorch code, \
             '.ast' to see parsed structure.",
            decl_count, token_count
        ))
    }

    fn run_current_program(&self) {
        if self.history.is_empty() {
            println!("⚠️  No input yet. Type some code first!");
            return;
        }

        let combined_input: String = self.history.join("\n\n");

        println!("\n📝 Input:");
        println!("─".repeat(50));
        println!("{}", combined_input);
        println!("─".repeat(50));

        // Lex
        let mut lexer = Lexer::new(&combined_input, "repl");
        let tokens = match lexer.tokenize() {
            Ok(t) => t,
            Err(e) => {
                println!("❌ Lex error: {}", e);
                return;
            }
        };

        // Parse
        let mut parser = Parser::new(&tokens);
        let program = match parser.parse_program() {
            Ok(p) => p,
            Err(e) => {
                println!("❌ Parse error: {}", e);
                return;
            }
        };

        // Generate PyTorch code
        let code = self.codegen.generate(&program);

        println!("\n🐍 Generated PyTorch Code:");
        println!("═".repeat(50));
        println!("{}", code);
        println!("═".repeat(50));

        println!("\n💡 Tip: You can copy this code into a Python file and run it!");
    }

    fn show_ast(&self) {
        if self.history.is_empty() {
            println!("⚠️  No input yet.");
            return;
        }

        let combined_input: String = self.history.join("\n\n");

        let mut lexer = Lexer::new(&combined_input, "repl");
        let tokens = match lexer.tokenize() {
            Ok(t) => t,
            Err(e) => {
                println!("❌ Lex error: {}", e);
                return;
            }
        };

        let mut parser = Parser::new(&tokens);
        let program = match parser.parse_program() {
            Ok(p) => p,
            Err(e) => {
                println!("❌ Parse error: {}", e);
                return;
            }
        };

        println!("\n🌳 Abstract Syntax Tree:");
        println!("─".repeat(50));
        for (i, decl) in program.iter().enumerate() {
            println!("[{}] {:?}", i + 1, decl);
        }
        println!("─".repeat(50));
    }

    fn show_help(&self) {
        println!("\n📖 Available Commands:\n");
        println!("  .help      Show this help message");
        println!("  .run       Generate PyTorch code from input");
        println!("  .ast       Display parsed AST structure");
        println!("  .history   Show input history");
        println!("  .example   Show example code");
        println!("  .clear     Clear all input");
        println!("  .quit      Exit the REPL\n");
        
        println!("📖 Neural Syntax Quick Reference:\n");
        println!("  →          Sequential flow (arrow)");
        println!("  ||         Parallel branches");
        println!("  × N        Repeat N times");
        println!("  +BN+ReLU   Post-operations on layer");
        println!("  @save(x)   Save for skip connection");
        println!("  @load(x)   Load saved value\n");
        
        println!("📖 Example Model Definition:\n");
        println!("  model MyModel {{");
        println!("      input: Image<3, 224, 224>");
        println!("      flow: input");
        println!("          → Conv2D(64, 3×3) + BN + ReLU + MaxPool(2)");
        println!("          → Conv2D(128, 3×3) + BN + ReLU + MaxPool(2)");
        println!("          → Flatten → Dense(10) + Softmax");
        println!("          → output");
        println!("  }}\n");
    }

    fn show_history(&self) {
        println!("\n📜 Input History:\n");
        for (i, line) in self.history.iter().enumerate() {
            println!("  {}: {}", i + 1, line);
        }
        println!("\n  Total: {} line(s)", self.history.len());
    }

    fn show_example(&self) {
        let example = r#"
# Example: Simple CNN Classifier
model SimpleCNN {
    input: Image<3, 224, 224>
    output: Vector<1000>
    
    flow: input
        → Conv2D(64, 3×3, padding="same") + BatchNorm + ReLU + MaxPool(2×2)
        → Conv2D(128, 3×3, padding="same") + BatchNorm + ReLU + MaxPool(2×2)
        → Conv2D(256, 3×3, padding="same") + BatchNorm + ReLU
        → GlobalAvgPool
        → Flatten
        → Dense(512) + ReLU + Dropout(0.5)
        → Dense(1000) + Softmax
        → output
}

# Example: Training Configuration
train SimpleCNN on ImageNet {
    epochs = 90
    batch_size = 256
    optimizer = AdamW
    learning_rate = 0.001
    loss = CrossEntropyLabelSmoothing
}
"#;
        println!("\n📝 Example Code (copy and paste this):\n");
        println!("{}", example);
    }
}

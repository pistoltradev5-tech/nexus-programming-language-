//! AI Language Compiler - MVP Prototype
//! Next-Generation Programming Language for AI/ML

mod ast;
mod lexer;
mod parser;
mod codegen;
mod repl;

use clap::Parser;

/// AI Language Compiler - Write neural networks naturally
#[derive(Parser, Debug)]
#[command(name = "ai-lang")]
#[command(author = "Your Name")]
#[command(version = "0.1.0")]
#[command(about = "Next-gen AI programming language compiler", long_about = None)]
struct Args {
    /// Input file to compile
    #[arg(short, long)]
    file: Option<String>,

    /// Run in interactive REPL mode
    #[arg(short, long)]
    repl: bool,

    /// Output format (default: auto-detect)
    #[arg(long, default_value = "pytorch")]
    output: String,

    /// Show AST after parsing
    #[arg(long)]
    ast: bool,

    /// Verbose mode
    #[arg(short, long)]
    verbose: bool,
}

fn main() {
    // Initialize logger
    env_logger::init();

    let args = Args::parse();

    if args.repl || args.file.is_none() {
        // Start interactive REPL
        let mut repl = repl::Repl::new();
        repl.run();
    } else if let Some(filename) = args.file {
        // Compile file
        compile_file(&filename, &args.output, args.ast, args.verbose);
    }
}

fn compile_file(filename: &str, output_format: &str, show_ast: bool, verbose: bool) {
    println!("🦀 Compiling: {}", filename);

    // Read source file
    let source = match std::fs::read_to_string(filename) {
        Ok(s) => s,
        Err(e) => {
            eprintln!("❌ Error reading file: {}", e);
            std::process::exit(1);
        }
    };

    if verbose {
        println!("\n📄 Source code ({} bytes):", source.len());
        println!("─" * 60);
        println!("{}", source);
        println!("─" * 60);
    }

    // Phase 1: Lexing
    println!("\n📝 Phase 1: Lexing...");
    let mut lexer = lexer::Lexer::new(&source, filename);
    let tokens = match lexer.tokenize() {
        Ok(tokens) => {
            println!("   ✅ Generated {} tokens", tokens.len());
            if verbose {
                for (i, token) in tokens.iter().take(20).enumerate() {
                    println!("      [{:3}] {:?} @ {}:{}", i, token.kind, token.span.line, token.span.column);
                }
                if tokens.len() > 20 {
                    println!("      ... and {} more tokens", tokens.len() - 20);
                }
            }
            tokens
        }
        Err(e) => {
            eprintln!("   ❌ Lex error: {}", e);
            std::process::exit(1);
        }
    };

    // Phase 2: Parsing
    println!("\n🌳 Phase 2: Parsing...");
    let mut parser = parser::Parser::new(&tokens);
    let program = match parser.parse_program() {
        Ok(program) => {
            println!("   ✅ Parsed {} top-level declaration(s)", program.len());
            program
        }
        Err(e) => {
            eprintln!("   ❌ Parse error: {}", e);
            std::process::exit(1);
        }
    };

    // Show AST if requested
    if show_ast {
        println!("\n🌳 Abstract Syntax Tree:");
        println!("═" * 60);
        for (i, decl) in program.iter().enumerate() {
            println!("\n[Declaration {}]", i + 1);
            println!("{:#?}", decl);
        }
        println!("═" * 60);
    }

    // Phase 3: Code Generation
    println!("\n🐍 Phase 3: Code Generation ({})...", output_format);
    
    let codegen = codegen::CodeGenerator::new();
    let generated_code = codegen.generate(&program);

    // Determine output filename
    let out_filename = match output_format.as_str() {
        "pytorch" | "python" | "py" => filename.replace(".ai", ".py"),
        "json" => filename.replace(".ai", ".ast.json"),
        other => format!("{}.out", filename),
    };

    // Write output file
    match std::fs::write(&out_filename, &generated_code) {
        Ok(()) => {
            println!("   ✅ Generated: {} ({} bytes)", out_filename, generated_code.len());
        }
        Err(e) => {
            eprintln!("   ⚠️  Warning: Could not write file: {}", e);
            // Still print to stdout
            println!("\n─" * 60);
            println!("{}", generated_code);
            println!("─" * 60);
        }
    }

    // Print summary
    println!("\n" + "═".repeat(60));
    println!("🎉 Compilation Successful!");
    println!("═".repeat(60));
    println!("  Input:  {}", filename);
    println!("  Output: {}", out_filename);
    println!("  Decls:  {}", program.len());
    println!("  Tokens: {}", tokens.len());
    println!("═".repeat(60));

    if output_format == "pytorch" || output_format == "python" || output_format == "py" {
        println!("\n💡 To run the generated code:");
        println!("   python {}", out_filename);
    }
}

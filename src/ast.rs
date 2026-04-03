//! Abstract Syntax Tree definitions for the AI Language
//! Supports Neural Syntax with arrow notation, shape-safe types, etc.

use std::fmt;

/// Source location for error reporting
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Span {
    pub file: String,
    pub start: usize,
    pub end: usize,
    pub line: usize,
    pub column: usize,
}

impl Span {
    pub fn dummy() -> Self {
        Self {
            file: String::from("<unknown>"),
            start: 0,
            end: 0,
            line: 1,
            column: 1,
        }
    }
    
    pub fn merge(a: &Span, b: &Span) -> Self {
        Self {
            file: a.file.clone(),
            start: a.start.min(b.start),
            end: a.end.max(b.end),
            line: a.line.min(b.line),
            column: a.column.min(b.column),
        }
    }
}

impl fmt::Display for Span {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}:{}:{}", self.file, self.line, self.column)
    }
}

// ═══════════════════════════════════════════════════════════════
// TOKEN TYPES
// ═══════════════════════════════════════════════════════════════

#[derive(Debug, Clone, PartialEq)]
pub enum TokenKind {
    // Keywords
    Model, Input, Output, Flow, Block, Fn, Train, Type, Where, Require,
    
    // Arrow operators (Neural Syntax)
    Arrow,       // →
    Parallel,    // ||
    Plus,        // + (same-stage combination)
    Times,       // × (repeat)
    Star,        // * (wildcard)
    At,          // @ (annotation)
    Question,     // ? (conditional)
    Colon,       // :
    Semicolon,   // ;
    
    // Delimiters
    LBrace, RBrace,       // { }
    LParen, RParen,       // ( )
    LBracket, RBracket,   // [ ]
    LAngle, RAngle,       // < >
    Comma,
    
    // Operators
    Equals,         // =
    DoubleEquals,   // ==
    NotEquals,      // !=
    Lt, Gt, Leq, Geq,
    Add, Sub, Mul, Div, Mod,
    Pow,
    
    // Mathematical symbols (Unicode)
    Sigma, Pi, Integral, Sqrt, Partial, Nabla, Infinity,
    In, Exists, ForAll, Union, Intersection,
    
    // Identifiers and literals
    Ident(String),
    Number(f64),
    StringLit(String),
    
    // Tensor type keywords
    TensorKw, ImageKw, VectorKw, MatrixKw, ScalarKw,
    
    // Data types
    F32, F64, BF16, FP16, Int8, Int32, Bool,
    
    // End of file
    Eof,
}

impl fmt::Display for TokenKind {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            TokenKind::Ident(s) => write!(f, "identifier '{}'", s),
            TokenKind::Number(n) => write!(f, "number {}", n),
            TokenKind::StringLit(s) => write!(f, "string \"{}\"", s),
            other => write!(f, "{:?}", other),
        }
    }
}

/// A token with its source location
#[derive(Debug, Clone)]
pub struct Token {
    pub kind: TokenKind,
    pub span: Span,
}

impl Token {
    pub fn new(kind: TokenKind, span: Span) -> Self {
        Self { kind, span }
    }
}

// ═══════════════════════════════════════════════════════════════
// AST NODES - EXPRESSIONS (Neural Syntax Data Flow)
// ═══════════════════════════════════════════════════════════════

#[derive(Debug, Clone)]
pub enum Expr {
    /// Sequential composition: `a → b → c`
    ArrowChain(Vec<AstNode<Expr>>),
    
    /// Parallel branches: `[a || b || c]`
    Parallel(Vec<AstNode<Expr>>),
    
    /// Repeat N times: `[block] × 5`
    Repeat {
        body: Box<AstNode<Expr>>,
        count: RepeatCount,
    },
    
    /// Conditional: `? cond → true : false`
    Conditional {
        condition: Box<AstNode<Expr>>,
        true_branch: Box<AstNode<Expr>>,
        false_branch: Box<AstNode<Expr>>,
    },
    
    /// Layer call: `Conv2D(64, 3×3)`
    LayerCall {
        name: String,
        args: Vec<(String, ArgValue)>,
        post_ops: Vec<PostOp>,
    },
    
    /// Variable reference
    Identifier(String),
    
    /// Grouped expression
    Grouped(Box<AstNode<Expr>>),
    
    /// Save to skip connection buffer
    Save {
        expr: Box<AstNode<Expr>>,
        name: String,
    },
    
    /// Load from skip connection buffer
    Load(String),
    
    /// Binary operation
    BinaryOp {
        left: Box<AstNode<Expr>>,
        op: BinOp,
        right: Box<AstNode<Expr>>,
    },
    
    /// Unary operation
    UnaryOp {
        op: UnOp,
        operand: Box<AstNode<Expr>>,
    },
    
    /// Number literal
    Number(f64),
}

#[derive(Debug, Clone)]
pub enum RepeatCount {
    Literal(u32),
    Dynamic(String),
    Range(u32, u32),
}

#[derive(Debug, Clone)]
pub enum BinOp {
    Add, Sub, Mul, Div, MatMul, Pow,
    Eq, Neq, Lt, Gt, Leq, Geq,
    And, Or,
}

#[derive(Debug, Clone)]
pub enum UnOp {
    Neg, Not,
}

/// Post-operations that can follow a layer call: `+BN +ReLU`
#[derive(Debug, Clone)]
pub enum PostOp {
    BatchNorm,
    ReLU,
    GELU,
    Sigmoid,
    Softmax,
    Dropout(f64),
    MaxPool((u32, u32)),
    AvgPool((u32, u32)),
    LayerNorm(f64),
    Custom(String),
}

/// Argument value in layer calls
#[derive(Debug, Clone)]
pub enum ArgValue {
    Number(f64),
    String(String),
    Ident(String),
    Tuple(Vec<ArgValue>),
    Array(Vec<ArgValue>),
    Bool(bool),
}

// ═══════════════════════════════════════════════════════════════
// AST NODES - TYPES (Shape-Safe Tensor Types)
// ═══════════════════════════════════════════════════════════════

#[derive(Debug, Clone, PartialEq)]
pub enum TensorType {
    /// Static shape: Tensor<f32, 3, 224, 224>
    Static {
        dtype: DataType,
        shape: Vec<Dimension>,
    },
    /// Symbolic: Tensor<B, C, H, W>
    Symbolic {
        dtype: DataType,
        symbols: Vec<String>,
    },
    /// Named dims: Image<height=224, width=224>
    Named {
        base: String,
        dims: Vec<(String, Option<Dimension>)>,
    },
    /// Type variable
    TypeVar(String),
}

#[derive(Debug, Clone, PartialEq)]
pub enum Dimension {
    Literal(u64),
    Symbol(String),
    Infer,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum DataType {
    F32, F64, BF16, FP16, FP8,
    I8, I16, I32, I64,
    U8, U16, U32, U64,
    Bool,
}

impl fmt::Display for DataType {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            DataType::F32 => write!(f, "f32"),
            DataType::F64 => write!(f, "f64"),
            DataType::BF16 => write!(f, "bf16"),
            DataType::FP16 => write!(f, "fp16"),
            DataType::FP8 => write!(f, "fp8"),
            DataType::I8 => write!(f, "i8"),
            DataType::I32 => write!(f, "i32"),
            DataType::Bool => write!(f, "bool"),
            other => write!(f, "{:?}", other),
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// AST NODES - TOP-LEVEL DECLARATIONS
// ═══════════════════════════════════════════════════════════════

#[derive(Debug, Clone)]
pub enum TopLevelDecl {
    Model(ModelDef),
    Train(TrainDef),
    Function(FnDef),
    TypeAlias(TypeAliasDef),
}

/// Model definition using Neural Syntax
#[derive(Debug, Clone)]
pub struct ModelDef {
    pub name: String,
    pub input_type: Option<TensorType>,
    pub output_type: Option<TensorType>,
    pub flow_body: AstNode<Expr>,
    pub blocks: Vec<BlockDef>,
    pub span: Span,
}

/// Reusable block definition
#[derive(Debug, Clone)]
pub struct BlockDef {
    pub name: String,
    pub params: Vec<(String, Option<TensorType>)>,
    pub body: AstNode<Expr>,
    pub span: Span,
}

/// Function definition
#[derive(Debug, Clone)]
pub struct FnDef {
    pub name: String,
    pub params: Vec<(String, TensorType)>,
    pub return_type: Option<TensorType>,
    pub body: AstNode<Expr>,
    pub span: Span,
}

/// Type alias definition
#[derive(Debug, Clone)]
pub struct TypeAliasDef {
    pub name: String,
    pub alias: TensorType,
    pub span: Span,
}

/// Training configuration (simplified for MVP)
#[derive(Debug, Clone)]
pub struct TrainDef {
    pub model_name: String,
    pub dataset_name: String,
    pub config: TrainConfig,
    pub span: Span,
}

#[derive(Debug, Clone)]
pub struct TrainConfig {
    pub epochs: u32,
    pub batch_size: u32,
    pub optimizer: String,
    pub learning_rate: f64,
    pub loss_fn: String,
}

// ═══════════════════════════════════════════════════════════════
// AST NODE WRAPPER
// ═══════════════════════════════════════════════════════════════

/// AST node with span information
#[derive(Debug, Clone)]
pub struct AstNode<T> {
    pub span: Span,
    pub value: T,
}

impl<T> AstNode<T> {
    pub fn new(span: Span, value: T) -> Self {
        Self { span, value }
    }
}

// ═══════════════════════════════════════════════════════════════
// PRETTY PRINTING FOR AST
// ═══════════════════════════════════════════════════════════════

impl fmt::Display for Expr {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Expr::ArrowChain(steps) => {
                for (i, step) in steps.iter().enumerate() {
                    if i > 0 { write!(f, " → ")?; }
                    write!("{}", step.value)?;
                }
                Ok(())
            }
            Expr::Parallel(branches) => {
                write!(f, "[")?;
                for (i, branch) in branches.iter().enumerate() {
                    if i > 0 { write!(f, " || ")?; }
                    write!("{}", branch.value)?;
                }
                write!(f, "]")
            }
            Expr::Repeat { body, count } => {
                write!(f, "[{}] × {}", body.value, match count {
                    RepeatCount::Literal(n) => n.to_string(),
                    RepeatCount::Dynamic(s) => s.clone(),
                    RepeatCount::Range(s, e) => format!("{}..{}", s, e),
                })
            }
            Expr::LayerCall { name, args, post_ops } => {
                write!(f, "{}(", name)?;
                for (i, (k, v)) in args.iter().enumerate() {
                    if i > 0 { write!(f, ", ")?; }
                    write!(f, "{}={}", k, v)?;
                }
                write!(f, ")")?;
                for post in post_ops {
                    write!(f, " + {}", post)?;
                }
                Ok(())
            }
            Expr::Identifier(name) => write!(f, "{}", name),
            Expr::Grouped(inner) => write!(f, "({})", inner.value),
            Expr::Save { expr, name } => write!(f, "{} @save({})", expr.value, name),
            Expr::Load(name) => write!(f, "@load({})", name),
            Expr::BinaryOp { left, op, right } => {
                write!(f, "{} {:?} {}", left.value, op, right.value)
            }
            Expr::Number(n) => write!(f, "{}", n),
            Expr::Conditional { .. } => write!(f, "? ... → ... : ..."),
            other => write!(f, "{:?}", other),
        }
    }
}

impl fmt::Display for ArgValue {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ArgValue::Number(n) => write!(f, "{}", n),
            ArgValue::String(s) => write!(f, "\"{}\"", s),
            ArgValue::Ident(s) => write!(f, "{}", s),
            ArgValue::Tuple(items) => {
                write!(f, "(")?;
                for (i, item) in items.iter().enumerate() {
                    if i > 0 { write!(f, ", ")?; }
                    write!(f, "{}", item)?;
                }
                write!(f, ")")
            }
            ArgValue::Array(items) => {
                write!(f, "[")?;
                for (i, item) in items.iter().enumerate() {
                    if i > 0 { write!(f, ", ")?; }
                    write!(f, "{}", item)?;
                }
                write!(f, "]")
            }
            ArgValue::Bool(b) => write!(f, "{}", b),
        }
    }
}

impl fmt::Display for PostOp {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            PostOp::BatchNorm => write!(f, "BN"),
            PostOp::ReLU => write!(f, "ReLU"),
            PostOp::GELU => write!(f, "GELU"),
            PostOp::Sigmoid => write!(f, "σ"),
            PostOp::Softmax => write!(f, "Softmax"),
            PostOp::Dropout(p) => write!(f, "Dropout({})", p),
            PostOp::MaxPool((h, w)) => write!(f, "MaxPool({}×{})", h, w),
            PostOp::AvgPool((h, w)) => write!(f, "AvgPool({}×{})", h, w),
            PostOp::LayerNorm(eps) => write!(f, "LayerNorm({})", eps),
            PostOp::Custom(s) => write!(f, "{}", s),
        }
    }
}

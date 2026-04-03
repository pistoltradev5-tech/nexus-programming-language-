//! Recursive Descent Parser for Neural Syntax
//! Parses token stream into AST

use crate::ast::*;
use std::collections::HashMap;

/// Parser error types
#[derive(Debug, thiserror::Error)]
pub enum ParseError {
    #[error("Expected {expected}, found {found} at {span}")]
    ExpectedToken { expected: String, found: TokenKind, span: Span },
    
    #[error("Unexpected end of input at {span}")]
    UnexpectedEof { span: Span },
    
    #[error("Invalid expression at {span}")]
    InvalidExpression { span: Span },
    
    #[error("Invalid type syntax at {span}")]
    InvalidType { span: Span },
    
    #[error("{message} at {span}")]
    Generic { message: String, span: Span },
}

/// Parser struct holding token stream and state
pub struct Parser<'a> {
    tokens: &'a [Token],
    pos: usize,
}

impl<'a> Parser<'a> {
    /// Create new parser from token slice
    pub fn new(tokens: &'a [Token]) -> Self {
        Self { tokens, pos: 0 }
    }

    /// Parse entire program into list of top-level declarations
    pub fn parse_program(&mut self) -> Result<Vec<TopLevelDecl>, ParseError> {
        let mut decls = Vec::new();
        
        while !self.at_end() {
            decls.push(self.parse_top_level()?);
        }
        
        Ok(decls)
    }

    // ═══════════════════════════════════════════════════════════════
    // HELPER METHODS
    // ═══════════════════════════════════════════════════════════════

    fn at_end(&self) -> bool {
        self.pos >= self.tokens.len() || matches!(self.peek(), TokenKind::Eof)
    }

    fn peek(&self) -> &TokenKind {
        if self.pos >= self.tokens.len() {
            &TokenKind::Eof
        } else {
            &self.tokens[self.pos].kind
        }
    }

    fn advance(&mut self) -> &Token {
        let tok = &self.tokens[self.pos];
        if !self.at_end() {
            self.pos += 1;
        }
        tok
    }

    fn current_span(&self) -> Span {
        if self.pos < self.tokens.len() {
            self.tokens[self.pos].span.clone()
        } else {
            Span::dummy()
        }
    }

    fn expect(&mut self, expected: &TokenKind) -> Result<Token, ParseError> {
        if std::mem::discriminant(self.peek()) == std::mem::discriminant(expected) {
            Ok(self.advance().clone())
        } else {
            Err(ParseError::ExpectedToken {
                expected: format!("{:?}", expected),
                found: self.peek().clone(),
                span: self.current_span(),
            })
        }
    }

    fn expect_ident(&mut self) -> Result<String, ParseError> {
        match self.peek().clone() {
            TokenKind::Ident(s) => {
                self.advance();
                Ok(s)
            }
            other => Err(ParseError::ExpectedToken {
                expected: "identifier".into(),
                found: other,
                span: self.current_span(),
            }),
        }
    }

    fn check(&self, kind: &TokenKind) -> bool {
        std::mem::discriminant(self.peek()) == std::mem::discriminant(kind)
    }

    fn match_token(&mut self, kind: &TokenKind) -> bool {
        if self.check(kind) {
            self.advance();
            true
        } else {
            false
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // TOP-LEVEL DECLARATIONS
    // ═══════════════════════════════════════════════════════════════

    fn parse_top_level(&mut self) -> Result<TopLevelDecl, ParseError> {
        match self.peek() {
            TokenKind::Model => self.parse_model().map(TopLevelDecl::Model),
            TokenKind::Train => self.parse_train().map(TopLevelDecl::Train),
            TokenKind::Fn => self.parse_function().map(TopLevelDecl::Function),
            TokenKind::Type => self.parse_type_alias().map(TopLevelDecl::TypeAlias),
            other => Err(ParseError::Generic {
                message: format!("Unexpected top-level declaration: {:?}", other),
                span: self.current_span(),
            }),
        }
    }

    /// Parse model definition: model Name { ... }
    fn parse_model(&mut self) -> Result<ModelDef, ParseError> {
        let start = self.expect(&TokenKind::Model)?.span;
        let name = self.expect_ident()?;
        self.expect(&TokenKind::LBrace)?;

        // Parse optional header (input/output types)
        let (input_type, output_type) = self.parse_model_header()?;

        // Parse flow body
        self.expect(&TokenKind::Flow)?;
        self.expect(&TokenKind::Colon)?;
        let flow_body = self.parse_expression()?;

        // Expect semicolon
        self.expect(&TokenKind::Semicolon)?;

        // Parse optional block definitions
        let mut blocks = Vec::new();
        while self.check(&TokenKind::Block) {
            blocks.push(self.parse_block_def()?);
        }

        self.expect(&TokenKind::RBrace)?;

        Ok(ModelDef {
            name,
            input_type,
            output_type,
            flow_body,
            blocks,
            span: Span::merge(&start, &self.current_span()),
        })
    }

    /// Parse model header (input/output specifications)
    fn parse_model_header(&mut self) -> Result<(Option<TensorType>, Option<TensorType>), ParseError> {
        let mut input_type = None;
        let mut output_type = None;

        if self.match_token(&TokenKind::Input) {
            self.expect(&TokenKind::Colon)?;
            input_type = Some(self.parse_tensor_type()?);
            // Optional semicolon after input
            self.match_token(&TokenKind::Semicolon);
        }

        if self.match_token(&TokenKind::Output) {
            self.expect(&TokenKind::Colon)?;
            output_type = Some(self.parse_tensor_type()?);
            self.match_token(&TokenKind::Semicolon);
        }

        Ok((input_type, output_type))
    }

    /// Parse reusable block definition
    fn parse_block_def(&mut self) -> Result<BlockDef, ParseError> {
        let start = self.expect(&TokenKind::Block)?.span;
        let name = self.expect_ident()?;
        self.expect(&TokenKind::LParen)?;

        // Parse parameters (simplified)
        let params = Vec::new(); // TODO: parse params

        self.expect(&TokenKind::RParen)?;
        self.expect(&TokenKind::LBrace)?;

        let body = self.parse_expression()?;

        self.expect(&TokenKind::RBrace)?;

        Ok(BlockDef {
            name,
            params,
            body,
            span: Span::merge(&start, &self.current_span()),
        })
    }

    /// Parse function definition
    fn parse_function(&mut self) -> Result<FnDef, ParseError> {
        let start = self.expect(&TokenKind::Fn)?.span;
        let name = self.expect_ident()?;
        self.expect(&TokenKind::LParen)?;

        // Parse parameters (simplified)
        let params = Vec::new();

        self.expect(&TokenKind::RParen)?;

        // Optional return type
        let return_type = if self.match_token(&TokenKind::Arrow) {
            Some(self.parse_tensor_type()?)
        } else {
            None
        };

        self.expect(&TokenKind::LBrace)?;
        let body = self.parse_expression()?;
        self.expect(&TokenKind::RBrace)?;

        Ok(FnDef {
            name,
            params,
            return_type,
            body,
            span: Span::merge(&start, &self.current_span()),
        })
    }

    /// Parse type alias
    fn parse_type_alias(&mut self) -> Result<TypeAliasDef, ParseError> {
        let start = self.expect(&TokenKind::Type)?.span;
        let name = self.expect_ident()?;
        self.expect(&TokenKind::Equals)?;
        let alias = self.parse_tensor_type()?;
        self.expect(&TokenKind::Semicolon)?;

        Ok(TypeAliasDef {
            name,
            alias,
            span: Span::merge(&start, &self.current_span()),
        })
    }

    /// Parse training declaration (simplified for MVP)
    fn parse_train(&mut self) -> Result<TrainDef, ParseError> {
        let start = self.expect(&TokenKind::Train)?.span;
        let model_name = self.expect_ident()?;
        
        // Expect "on"
        // Simplified: just skip to brace
        
        self.expect(&TokenKind::LBrace)?;

        // Parse simplified config
        let mut epochs = 100;
        let mut batch_size = 32;
        let mut optimizer = "Adam".to_string();
        let mut lr = 0.001;
        let mut loss_fn = "CrossEntropy".to_string();

        // Very basic key-value parsing
        while !self.check(&TokenKind::RBrace) {
            let key = self.expect_ident()?;
            self.expect(&TokenKind::Colon)?;
            
            match key.as_str() {
                "epochs" => {
                    if let TokenKind::Number(n) = self.advance().kind {
                        epochs = n as u32;
                    }
                }
                "batch_size" => {
                    if let TokenKind::Number(n) = self.advance().kind {
                        batch_size = n as u32;
                    }
                }
                "optimizer" => {
                    if let TokenKind::Ident(s) = self.advance().kind {
                        optimizer = s;
                    }
                }
                "learning_rate" | "lr" => {
                    if let TokenKind::Number(n) = self.advance().kind {
                        lr = n;
                    }
                }
                "loss" => {
                    if let TokenKind::Ident(s) = self.advance().kind {
                        loss_fn = s;
                    }
                }
                _ => { self.advance(); } // skip unknown keys
            }
            
            self.match_token(&TokenKind::Semicolon);
        }

        self.expect(&TokenKind::RBrace)?;

        Ok(TrainDef {
            model_name,
            dataset_name: "dataset".to_string(),
            config: TrainConfig {
                epochs,
                batch_size,
                optimizer,
                learning_rate: lr,
                loss_fn,
            },
            span: Span::merge(&start, &self.current_span()),
        })
    }

    // ═══════════════════════════════════════════════════════════════
    // EXPRESSIONS (Neural Syntax Data Flow)
    // ═══════════════════════════════════════════════════════════════

    /// Parse expression (entry point)
    pub fn parse_expression(&mut self) -> Result<AstNode<Expr>, ParseError> {
        self.parse_arrow_chain()
    }

    /// Parse arrow chain: a → b → c
    fn parse_arrow_chain(&mut self) -> Result<AstNode<Expr>, ParseError> {
        let start = self.current_span();
        let mut steps = vec![self.parse_atom_expr()?];

        while self.check(&TokenKind::Arrow) {
            self.advance(); // consume →
            steps.push(self.parse_atom_expr()?);
        }

        if steps.len() == 1 {
            Ok(steps.into_iter().next().unwrap())
        } else {
            Ok(AstNode::new(
                Span::merge(&start, &self.current_span()),
                Expr::ArrowChain(steps),
            ))
        }
    }

    /// Parse atomic expression (lowest precedence)
    fn parse_atom_expr(&mut self) -> Result<AstNode<Expr>, ParseError> {
        match self.peek() {
            TokenKind::LBracket => self.parse_parallel_or_repeat(),
            TokenKind::Question => self.parse_conditional(),
            TokenKind::LParen => self.parse_grouped(),
            TokenKind::Ident(_) => self.parse_ident_or_layer_call(),
            TokenKind::Number(_) => self.parse_number_literal(),
            TokenKind::At => self.parse_save_load(),
            other => Err(ParseError::Generic {
                message: format!("Expected expression, found {:?}", other),
                span: self.current_span(),
            }),
        }
    }

    /// Parse parallel branches: [a || b || c] or repeat: [x] × N
    fn parse_parallel_or_repeat(&mut self) -> Result<AstNode<Expr>, ParseError> {
        let start = self.expect(&TokenKind::LBracket)?.span;

        // Parse first expression
        let first = self.parse_arrow_chain()?;

        // Check for parallel (||) or close bracket
        if self.check(&TokenKind::Parallel) {
            // Parallel branches
            let mut branches = vec![first];
            while self.match_token(&TokenKind::Parallel) {
                branches.push(self.parse_arrow_chain()?);
            }
            self.expect(&TokenKind::RBracket)?;

            Ok(AstNode::new(
                Span::merge(&start, &self.current_span()),
                Expr::Parallel(branches),
            ))
        } else if self.check(&TokenKind::RBracket) {
            // Could be repeat: [expr] × N
            self.expect(&TokenKind::RBracket)?;

            if self.match_token(&TokenKind::Times) {
                // Repeat notation
                let count = self.parse_repeat_count()?;
                Ok(AstNode::new(
                    Span::merge(&start, &self.current_span()),
                    Expr::Repeat {
                        body: Box::new(first),
                        count,
                    },
                ))
            } else {
                // Just a grouped expression in brackets
                Ok(first)
            }
        } else {
            Err(ParseError::ExpectedToken {
                expected: "|| or ]".into(),
                found: self.peek().clone(),
                span: self.current_span(),
            })
        }
    }

    /// Parse conditional: ? cond → true : false
    fn parse_conditional(&mut self) -> Result<AstNode<Expr>, ParseError> {
        let start = self.expect(&TokenKind::Question)?.span;

        let condition = Box::new(self.parse_atom_expr()?);
        self.expect(&TokenKind::Arrow)?;
        let true_branch = Box::new(self.parse_atom_expr()?);
        self.expect(&TokenKind::Colon)?;
        let false_branch = Box::new(self.parse_atom_expr()?);

        Ok(AstNode::new(
            Span::merge(&start, &self.current_span()),
            Expr::Conditional {
                condition,
                true_branch,
                false_branch,
            },
        ))
    }

    /// Parse grouped expression: (expr)
    fn parse_grouped(&mut self) -> Result<AstNode<Expr>, ParseError> {
        let start = self.expect(&TokenKind::LParen)?.span;
        let inner = self.parse_expression()?;
        self.expect(&TokenKind::RParen)?;

        Ok(AstNode::new(
            Span::merge(&start, &self.current_span()),
            Expr::Grouped(Box::new(inner)),
        ))
    }

    /// Parse identifier or layer call
    fn parse_ident_or_layer_call(&mut self) -> Result<AstNode<Expr>, ParseError> {
        let name = self.expect_ident()?;

        if self.check(&TokenKind::LParen) {
            // It's a layer/function call
            self.parse_layer_call(name)
        } else {
            // It's a simple identifier
            Ok(AstNode::new(
                self.tokens[self.pos - 1].span.clone(),
                Expr::Identifier(name),
            ))
        }
    }

    /// Parse layer call: Name(args) + post_ops
    fn parse_layer_call(&mut self, name: String) -> Result<AstNode<Expr>, ParseError> {
        let start = self.tokens[self.pos - 1].span.clone();
        
        self.expect(&TokenKind::LParen)?;

        // Parse arguments
        let args = if !self.check(&TokenKind::RParen) {
            let mut args = vec![self.parse_named_arg()?];
            while self.match_token(&TokenKind::Comma) {
                args.push(self.parse_named_arg()?);
            }
            args
        } else {
            Vec::new()
        };

        self.expect(&TokenKind::RParen)?;

        // Parse post-operations (+BN, +ReLU, etc.)
        let mut post_ops = Vec::new();
        while self.check(&TokenKind::Add) {
            self.advance(); // consume +
            post_ops.push(self.parse_post_op()?);
        }

        Ok(AstNode::new(
            Span::merge(&start, &self.current_span()),
            Expr::LayerCall { name, args, post_ops },
        ))
    }

    /// Parse named argument: key=value
    fn parse_named_arg(&mut self) -> Result<(String, ArgValue), ParseError> {
        let key = self.expect_ident()?;
        self.expect(&TokenKind::Equals)?;
        let value = self.parse_arg_value()?;
        Ok((key, value))
    }

    /// Parse argument value
    fn parse_arg_value(&mut self) -> Result<ArgValue, ParseError> {
        match self.peek().clone() {
            TokenKind::Number(n) => {
                self.advance();
                Ok(ArgValue::Number(n))
            }
            TokenKind::StringLit(s) => {
                self.advance();
                Ok(ArgValue::String(s))
            }
            TokenKind::Ident(s) => {
                self.advance();
                Ok(ArgValue::Ident(s))
            }
            TokenKind::LParen => {
                // Tuple value
                self.advance();
                let mut items = vec![self.parse_arg_value()?];
                while self.match_token(&TokenKind::Comma) {
                    items.push(self.parse_arg_value()?);
                }
                self.expect(&TokenKind::RParen)?;
                Ok(ArgValue::Tuple(items))
            }
            TokenKind::LBracket => {
                // Array value
                self.advance();
                let mut items = vec![self.parse_arg_value()?];
                while self.match_token(&TokenKind::Comma) {
                    items.push(self.parse_arg_value()?);
                }
                self.expect(&TokenKind::RBracket)?;
                Ok(ArgValue::Array(items))
            }
            other => Err(ParseError::ExpectedToken {
                expected: "argument value".into(),
                found: other,
                span: self.current_span(),
            }),
        }
    }

    /// Parse post-operation (+BN, +ReLU, etc.)
    fn parse_post_op(&mut self) -> Result<PostOp, ParseError> {
        match self.peek().clone() {
            TokenKind::Ident(ref s) => {
                let name = s.clone();
                self.advance();
                
                match name.as_str() {
                    "BN" | "BatchNorm" | "batchnorm" => Ok(PostOp::BatchNorm),
                    "ReLU" | "relu" => Ok(PostOp::ReLU),
                    "GELU" | "gelu" => Ok(PostOp::GELU),
                    "Sigmoid" | "sigmoid" | "σ" => Ok(PostOp::Sigmoid),
                    "Softmax" | "softmax" => Ok(PostOp::Softmax),
                    "LayerNorm" | "layernorm" => {
                        // Optional parameter
                        let eps = if self.match_token(&TokenKind::LParen) {
                            let e = if let TokenKind::Number(n) = self.advance().kind {
                                n
                            } else {
                                1e-5
                            };
                            self.expect(&TokenKind::RParen)?;
                            e
                        } else {
                            1e-5
                        };
                        Ok(PostOp::LayerNorm(eps))
                    }
                    "Dropout" | "dropout" => {
                        self.expect(&TokenKind::LParen)?;
                        let p = if let TokenKind::Number(n) = self.advance().kind {
                            n
                        } else {
                            0.5
                        };
                        self.expect(&TokenKind::RParen)?;
                        Ok(PostOp::Dropout(p))
                    }
                    "MaxPool" | "maxpool" => {
                        self.expect(&TokenKind::LParen)?;
                        let (h, w) = self.parse_tuple_u32()?;
                        self.expect(&TokenKind::RParen)?;
                        Ok(PostOp::MaxPool((h, w)))
                    }
                    "AvgPool" | "avgpool" => {
                        self.expect(&TokenKind::LParen)?;
                        let (h, w) = self.parse_tuple_u32()?;
                        self.expect(&TokenKind::RParen)?;
                        Ok(PostOp::AvgPool((h, w)))
                    }
                    other => Ok(PostOp::Custom(other)),
                }
            }
            other => Err(ParseError::ExpectedToken {
                expected: "post-operation (BN, ReLU, etc.)".into(),
                found: other,
                span: self.current_span(),
            }),
        }
    }

    /// Parse repeat count (literal number or range)
    fn parse_repeat_count(&mut self) -> Result<RepeatCount, ParseError> {
        match self.peek().clone() {
            TokenKind::Number(n) => {
                self.advance();
                Ok(RepeatCount::Literal(n as u32))
            }
            TokenKind::Ident(s) => {
                self.advance();
                Ok(RepeatCount::Dynamic(s))
            }
            other => Err(ParseError::ExpectedToken {
                expected: "repeat count (number or identifier)".into(),
                found: other,
                span: self.current_span(),
            }),
        }
    }

    /// Parse save/load annotation: @save(name) or @load(name)
    fn parse_save_load(&mut self) -> Result<AstNode<Expr>, ParseError> {
        let start = self.expect(&TokenKind::At)?.span;

        match self.peek().clone() {
            TokenKind::Ident(ref s) if s == "save" => {
                self.advance();
                self.expect(&TokenKind::LParen)?;
                let name = self.expect_ident()?;
                self.expect(&TokenKind::RParen)?;
                
                // Now parse the expression being saved
                let expr = self.parse_atom_expr()?;
                
                Ok(AstNode::new(
                    Span::merge(&start, &self.current_span()),
                    Expr::Save {
                        expr: Box::new(expr),
                        name,
                    },
                ))
            }
            TokenKind::Ident(ref s) if s == "load" => {
                self.advance();
                self.expect(&TokenKind::LParen)?;
                let name = self.expect_ident()?;
                self.expect(&TokenKind::RParen)?;
                
                Ok(AstNode::new(
                    Span::merge(&start, &self.current_span()),
                    Expr::Load(name),
                ))
            }
            other => Err(ParseError::ExpectedToken {
                expected: "save or load".into(),
                found: other,
                span: self.current_span(),
            }),
        }
    }

    /// Parse number literal
    fn parse_number_literal(&mut self) -> Result<AstNode<Expr>, ParseError> {
        let span = self.current_span();
        if let TokenKind::Number(n) = self.advance().kind {
            Ok(AstNode::new(span, Expr::Number(n)))
        } else {
            Err(ParseError::ExpectedToken {
                expected: "number".into(),
                found: TokenKind::Eof,
                span,
            })
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // TYPE PARSING (Tensor Types)
    // ═══════════════════════════════════════════════════════════════

    /// Parse tensor type specification
    pub fn parse_tensor_type(&mut self) -> Result<TensorType, ParseError> {
        match self.peek().clone() {
            TokenKind::TensorKw => self.parse_explicit_tensor_type(),
            TokenKind::ImageKw => self.parse_image_type(),
            TokenKind::VectorKw => self.parse_vector_type(),
            TokenKind::MatrixKw => self.parse_matrix_type(),
            TokenKind::ScalarKw => {
                self.advance();
                Ok(TensorType::Static {
                    dtype: DataType::F32,
                    shape: vec![],
                })
            }
            // Primitive types
            TokenKind::F32 => { self.advance(); Ok(TensorType::TypeVar("f32".into())) }
            TokenKind::F64 => { self.advance(); Ok(TensorType::TypeVar("f64".into())) }
            TokenKind::BF16 => { self.advance(); Ok(TensorType::TypeVar("bf16".into())) }
            TokenKind::FP16 => { self.advance(); Ok(TensorType::TypeVar("fp16".into())) }
            TokenKind::Int8 => { self.advance(); Ok(TensorType::TypeVar("i8".into())) }
            TokenKind::Int32 => { self.advance(); Ok(TensorType::TypeVar("i32".into())) }
            TokenKind::Bool => { self.advance(); Ok(TensorType::TypeVar("bool".into())) }
            other => Err(ParseError::ExpectedToken {
                expected: "type".into(),
                found: other,
                span: self.current_span(),
            }),
        }
    }

    /// Parse explicit tensor type: Tensor<dims, dtype>
    fn parse_explicit_tensor_type(&mut self) -> Result<TensorType, ParseError> {
        self.expect(&TokenKind::TensorKw)?;
        self.expect(&TokenKind::LAngle)?;

        // Parse dimensions
        let mut dims = Vec::new();
        if !self.check(&TokenKind::Comma) && !self.check(&TokenKind::RAngle) {
            dims.push(self.parse_dimension()?);
            while self.match_token(&TokenKind::Comma) {
                if self.check(&TokenKind::RAngle) { break; }
                dims.push(self.parse_dimension()?);
            }
        }

        // Parse data type (optional)
        let dtype = if self.match_token(&TokenKind::Comma) {
            self.parse_data_type()?
        } else {
            DataType::F32
        };

        self.expect(&TokenKind::RAngle)?;

        if dims.is_empty() {
            Ok(TensorType::Symbolic {
                dtype,
                symbols: vec![],
            })
        } else {
            // Check if all dimensions are literals or symbols
            let all_literal = dims.iter().all(|d| matches!(d, Dimension::Literal(_)));
            if all_literal {
                let shape: Vec<u64> = dims.iter().map(|d| if let Dimension::Literal(n) = d { *n } else { 0 }).collect();
                Ok(TensorType::Static { dtype, shape })
            } else {
                let symbols: Vec<String> = dims.iter().map(|d| match d {
                    Dimension::Literal(n) => n.to_string(),
                    Dimension::Symbol(s) => s.clone(),
                    Dimension::Infer => "?".to_string(),
                }).collect();
                Ok(TensorType::Symbolic { dtype, symbols })
            }
        }
    }

    /// Parse image type: Image<channels=3, height=224, width=224>
    fn parse_image_type(&mut self) -> Result<TensorType, ParseError> {
        self.expect(&TokenKind::ImageKw)?;
        self.expect(&TokenKind::LAngle)?;

        let mut dims = Vec::new();
        if !self.check(&TokenKind::RAngle) {
            dims.push(self.parse_named_dim()?);
            while self.match_token(&TokenKind::Comma) {
                if self.check(&TokenKind::RAngle) { break; }
                dims.push(self.parse_named_dim()?);
            }
        }

        self.expect(&TokenKind::RAngle)?;

        Ok(TensorType::Named {
            base: "Image".into(),
            dims,
        })
    }

    /// Parse vector type: Vector<N>
    fn parse_vector_type(&mut self) -> Result<TensorType, ParseError> {
        self.expect(&TokenKind::VectorKw)?;
        self.expect(&TokenKind::LAngle)?;
        let dim = self.parse_dimension()?;
        self.expect(&TokenKind::RAngle)?;

        Ok(TensorType::Symbolic {
            dtype: DataType::F32,
            symbols: vec![match dim {
                Dimension::Literal(n) => n.to_string(),
                Dimension::Symbol(s) => s,
                Dimension::Infer => "?".into(),
            }],
        })
    }

    /// Parse matrix type: Matrix<M, N>
    fn parse_matrix_type(&mut self) -> Result<TensorType, ParseError> {
        self.expect(&TokenKind::MatrixKw)?;
        self.expect(&TokenKind::LAngle)?;
        let d1 = self.parse_dimension()?;
        self.expect(&TokenKind::Comma)?;
        let d2 = self.parse_dimension()?;
        self.expect(&TokenKind::RAngle)?;

        Ok(TensorType::Symbolic {
            dtype: DataType::F32,
            symbols: vec![
                match d1 {
                    Dimension::Literal(n) => n.to_string(),
                    Dimension::Symbol(s) => s,
                    Dimension::Infer => "?".into(),
                },
                match d2 {
                    Dimension::Literal(n) => n.to_string(),
                    Dimension::Symbol(s) => s,
                    Dimension::Infer => "?".into(),
                },
            ],
        })
    }

    /// Parse single dimension
    fn parse_dimension(&mut self) -> Result<Dimension, ParseError> {
        match self.peek().clone() {
            TokenKind::Number(n) => {
                self.advance();
                Ok(Dimension::Literal(n as u64))
            }
            TokenKind::Ident(s) => {
                self.advance();
                Ok(Dimension::Symbol(s))
            }
            TokenKind::Sub => {
                // Could be negative or infer (_)
                self.advance();
                match self.peek().clone() {
                    TokenKind::Ident(ref s) if s == "_" => {
                        self.advance();
                        Ok(Dimension::Infer)
                    }
                    TokenKind::Number(n) => {
                        self.advance();
                        Ok(Dimension::Literal(-(n as i64) as u64))
                    }
                    other => Err(ParseError::ExpectedToken {
                        expected: "dimension".into(),
                        found: other,
                        span: self.current_span(),
                    }),
                }
            }
            other => Err(ParseError::ExpectedToken {
                expected: "dimension".into(),
                found: other,
                span: self.current_span(),
            }),
        }
    }

    /// Parse named dimension: name=value or just name
    fn parse_named_dim(&mut self) -> Result<(String, Option<Dimension>), ParseError> {
        let name = self.expect_ident()?;
        let value = if self.match_token(&TokenKind::Equals) {
            Some(self.parse_dimension()?)
        } else {
            None
        };
        Ok((name, value))
    }

    /// Parse data type keyword
    fn parse_data_type(&mut self) -> Result<DataType, ParseError> {
        match self.peek().clone() {
            TokenKind::F32 => { self.advance(); Ok(DataType::F32) }
            TokenKind::F64 => { self.advance(); Ok(DataType::F64) }
            TokenKind::BF16 => { self.advance(); Ok(DataType::BF16) }
            TokenKind::FP16 => { self.advance(); Ok(DataType::FP16) }
            TokenKind::Int8 => { self.advance(); Ok(DataType::I8) }
            TokenKind::Int32 => { self.advance(); Ok(DataType::I32) }
            TokenKind::Bool => { self.advance(); Ok(DataType::Bool) }
            other => Err(ParseError::ExpectedToken {
                expected: "data type".into(),
                found: other,
                span: self.current_span(),
            }),
        }
    }

    /// Helper: parse tuple of two u32 values
    fn parse_tuple_u32(&mut self) -> Result<(u32, u32), ParseError> {
        let a = if let TokenKind::Number(n) = self.advance().kind {
            n as u32
        } else {
            return Err(ParseError::ExpectedToken {
                expected: "number".into(),
                found: TokenKind::Eof,
                span: self.current_span(),
            });
        };
        
        // Handle "×" or "," separator
        if !(self.match_token(&TokenKind::Times) || self.check(&TokenKind::Comma)) {
            // Try to parse comma
            self.match_token(&TokenKind::Comma);
        }
        
        let b = if let TokenKind::Number(n) = self.advance().kind {
            n as u32
        } else {
            return Err(ParseError::ExpectedToken {
                expected: "number".into(),
                found: TokenKind::Eof,
                span: self.current_span(),
            });
        };
        
        Ok((a, b))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn parse_source(source: &str) -> Vec<TopLevelDecl> {
        let mut lexer = crate::lexer::Lexer::new(source, "test");
        let tokens = lexer.tokenize().expect("Lexing failed");
        let mut parser = Parser::new(&tokens);
        parser.parse_program().expect("Parsing failed")
    }

    #[test]
    fn test_simple_model() {
        let source = r#"
            model SimpleCNN {
                input: Image<3, 224, 224>
                output: Vector<1000>
                flow: input → Conv2D(64, 3×3) + BN + ReLU → output
            }
        "#;
        
        let decls = parse_source(source);
        assert_eq!(decls.len(), 1);
        
        if let TopLevelDecl::Model(model) = &decls[0] {
            assert_eq!(model.name, "SimpleCNN");
            assert!(model.input_type.is_some());
        }
    }

    #[test]
    fn test_arrow_chain() {
        let source = r#"
            model Test {
                flow: input → conv1 + relu → pool → fc → output
            }
        "#;
        
        let decls = parse_source(source);
        assert!(decls.len() > 0);
    }

    #[test]
    fn test_parallel_branches() {
        let source = r#"
            model Inception {
                flow: input → [branch_a || branch_b || branch_c] → concat → output
            }
        "#;
        
        let decls = parse_source(source);
        assert!(decls.len() > 0);
    }

    #[test]
    fn test_repeat_block() {
        let source = r#"
            model ResNet {
                flow: input → [ResBlock] × 6 → output
            }
        "#;
        
        let decls = parse_source(source);
        assert!(decls.len() > 0);
    }
}

//! Lexer/Tokenizer for the AI Language
//! Handles Unicode math symbols, arrow notation, tensor types, etc.

use crate::ast::{Token, TokenKind, Span};

/// Lexer state machine
pub struct Lexer<'a> {
    source: &'a str,
    chars: std::iter::Peekable<std::str::Chars<'a>>,
    current_pos: usize,
    line: usize,
    column: usize,
    file: String,
}

#[derive(Debug, thiserror::Error)]
pub enum LexError {
    #[error("Unexpected character '{0}' at {1}")]
    UnexpectedChar(char, Span),
    #[error("Unterminated string at {0}")]
    UnterminatedString(Span),
    #[error("Invalid number format at {0}")]
    InvalidNumber(Span),
}

impl<'a> Lexer<'a> {
    /// Create a new lexer for the given source code
    pub fn new(source: &'a str, file: impl Into<String>) -> Self {
        Lexer {
            source,
            chars: source.chars().peekable(),
            current_pos: 0,
            line: 1,
            column: 1,
            file: file.into(),
        }
    }

    /// Get current span position
    fn current_span(&self) -> Span {
        Span {
            file: self.file.clone(),
            start: self.current_pos.saturating_sub(1),
            end: self.current_pos,
            line: self.line,
            column: self.column,
        }
    }

    /// Advance one character and return it
    fn advance(&mut self) -> Option<char> {
        let ch = self.chars.next()?;
        self.current_pos += 1;
        if ch == '\n' {
            self.line += 1;
            self.column = 1;
        } else {
            self.column += 1;
        }
        Some(ch)
    }

    /// Peek at next character without consuming
    fn peek(&mut self) -> Option<&char> {
        self.chars.peek()
    }

    /// Peek at second next character
    fn peek2(&mut self) -> Option<char> {
        let mut iter = self.chars.clone();
        iter.next()?; // skip first
        iter.next()
    }

    /// Skip whitespace and comments
    fn skip_whitespace_and_comments(&mut self) {
        loop {
            match self.peek() {
                Some(' ') | Some('\t') | Some('\n') | Some('\r') => {
                    self.advance();
                }
                Some('/') => {
                    if let Some('/') = self.peek2() {
                        // Line comment: skip to end of line
                        while let Some(ch) = self.peek() {
                            if ch == '\n' { break; }
                            self.advance();
                        }
                    } else if let Some('*') = self.peek2() {
                        // Block comment: find closing */
                        self.advance(); // /
                        self.advance(); // *
                        let mut depth = 1;
                        while depth > 0 {
                            match self.advance() {
                                None => break,
                                Some('*') => {
                                    if let Some('/') = self.peek() {
                                        depth -= 1;
                                        self.advance();
                                    }
                                }
                                Some('/') => {
                                    if let Some('*') = self.peek() {
                                        depth += 1;
                                        self.advance();
                                    }
                                }
                                _ => {}
                            }
                        }
                    } else {
                        break; // Just a slash operator
                    }
                }
                _ => break,
            }
        }
    }

    /// Main tokenization function - returns all tokens
    pub fn tokenize(&mut self) -> Result<Vec<Token>, LexError> {
        let mut tokens = Vec::new();

        loop {
            self.skip_whitespace_and_comments();

            let span_start = self.current_span();

            match self.peek() {
                None => {
                    // End of file
                    tokens.push(Token::new(TokenKind::Eof, span_start));
                    break;
                }

                Some(ch) => {
                    let token = match ch {
                        // Arrow notation: →
                        '→' => {
                            self.advance();
                            Token::new(TokenKind::Arrow, span_start)
                        }

                        // Parallel: ||
                        '|' => {
                            self.advance();
                            if let Some('|') = self.peek() {
                                self.advance();
                                Token::new(TokenKind::Parallel, span_start)
                            } else {
                                return Err(LexError::UnexpectedChar('|', span_start));
                            }
                        }

                        // Times: ×
                        '×' => {
                            self.advance();
                            Token::new(TokenKind::Times, span_start)
                        }

                        // At: @
                        '@' => {
                            self.advance();
                            Token::new(TokenKind::At, span_start)
                        }

                        // Question mark: ?
                        '?' => {
                            self.advance();
                            Token::new(TokenKind::Question, span_start)
                        }

                        // Colon: :
                        ':' => {
                            self.advance();
                            Token::new(TokenKind::Colon, span_start)
                        }

                        // Semicolon: ;
                        ';' => {
                            self.advance();
                            Token::new(TokenKind::Semicolon, span_start)
                        }

                        // Braces: { }
                        '{' => { self.advance(); Token::new(TokenKind::LBrace, span_start) }
                        '}' => { self.advance(); Token::new(TokenKind::RBrace, span_start) }

                        // Parentheses: ( )
                        '(' => { self.advance(); Token::new(TokenKind::LParen, span_start) }
                        ')' => { self.advance(); Token::new(TokenKind::RParen, span_start) }

                        // Brackets: [ ]
                        '[' => { self.advance(); Token::new(TokenKind::LBracket, span_start) }
                        ']' => { self.advance(); Token::new(TokenKind::RBracket, span_start) }

                        // Angle brackets: < >
                        '<' => { self.advance(); Token::new(TokenKind::LAngle, span_start) }
                        '>' => { self.advance(); Token::new(TokenKind::RAngle, span_start) }

                        // Comma: ,
                        ',' => { self.advance(); Token::new(TokenKind::Comma, span_start) }

                        // Operators
                        '=' => {
                            self.advance();
                            if let Some('=') = self.peek() {
                                self.advance();
                                Token::new(TokenKind::DoubleEquals, span_start)
                            } else {
                                Token::new(TokenKind::Equals, span_start)
                            }
                        }
                        '!' => {
                            self.advance();
                            if let Some('=') = self.peek() {
                                self.advance();
                                Token::new(TokenKind::NotEquals, span_start)
                            } else {
                                return Err(LexError::UnexpectedChar('!', span_start));
                            }
                        }
                        '<' => {
                            self.advance();
                            if let Some('=') = self.peek() {
                                self.advance();
                                Token::new(TokenKind::Leq, span_start)
                            } else {
                                Token::new(TokenKind::Lt, span_start)
                            }
                        }
                        '>' => {
                            self.advance();
                            if let Some('=') = self.peek() {
                                self.advance();
                                Token::new(TokenKind::Geq, span_start)
                            } else {
                                Token::new(TokenKind::Gt, span_start)
                            }
                        }
                        '+' => { self.advance(); Token::new(TokenKind::Add, span_start) }
                        '-' => { self.advance(); Token::new(TokenKind::Sub, span_start) }
                        '*' => { self.advance(); Token::new(TokenKind::Mul, span_start) }
                        '/' => { self.advance(); Token::new(TokenKind::Div, span_start) }
                        '%' => { self.advance(); Token::new(TokenKind::Mod, span_start) }
                        '^' => { self.advance(); Token::new(TokenKind::Pow, span_start) }

                        // Numbers
                        '0'..='9' => self.read_number(span_start)?,

                        // Strings
                        '"' => self.read_string(span_start)?,

                        // Identifiers and keywords
                        'a'..='z' | 'A'..='Z' | '_' => self.read_ident_or_keyword(span_start)?,

                        // Greek letters and Unicode math symbols
                        _ if is_greek_letter(ch) || is_math_symbol(ch) => {
                            self.read_unicode_symbol(span_start)?
                        }

                        other => return Err(LexError::UnexpectedChar(other, span_start)),
                    };

                    tokens.push(token);
                }
            }
        }

        Ok(tokens)
    }

    /// Read a number literal
    fn read_number(&mut self, start: Span) -> Result<Token, LexError> {
        let mut num_str = String::new();
        
        // Integer part
        while let Some('0'..='9') = self.peek() {
            num_str.push(self.advance().unwrap());
        }
        
        // Fractional part?
        if let Some('.') = self.peek() {
            // Make sure next char is digit (not dot for method call)
            if let Some('0'..='9') = self.peek2() {
                num_str.push(self.advance().unwrap()); // consume '.'
                while let Some('0'..='9') = self.peek() {
                    num_str.push(self.advance().unwrap());
                }
            }
        }
        
        // Scientific notation?
        if let Some('e') | Some('E') = self.peek() {
            num_str.push(self.advance().unwrap()); // consume 'e' or 'E'
            if let Some('+') | Some('-') = self.peek() {
                num_str.push(self.advance().unwrap());
            }
            while let Some('0'..='9') = self.peek() {
                num_str.push(self.advance().unwrap());
            }
        }
        
        let num: f64 = num_str.parse()
            .map_err(|_| LexError::InvalidNumber(start.clone()))?;
        
        Ok(Token::new(TokenKind::Number(num), start))
    }

    /// Read a string literal
    fn read_string(&mut self, start: Span) -> Result<Token, LexError> {
        self.advance(); // consume opening "
        
        let mut s = String::new();
        loop {
            match self.advance() {
                None => return Err(LexError::UnterminatedString(start)),
                Some('"') => break,
                Some('\\') => {
                    match self.advance() {
                        None => return Err(LexError::UnterminatedString(start)),
                        Some('n') => s.push('\n'),
                        Some('t') => s.push('\t'),
                        Some('r') => s.push('\r'),
                        Some('\\') => s.push('\\'),
                        Some('"') => s.push('"'),
                        Some(other) => {
                            s.push('\\');
                            s.push(other);
                        }
                    }
                }
                Some(other) => s.push(other),
            }
        }
        
        Ok(Token::new(TokenKind::StringLit(s), start))
    }

    /// Read identifier or keyword
    fn read_ident_or_keyword(&mut self, start: Span) -> Result<Token, LexError> {
        let mut ident = String::new();
        
        ident.push(self.advance().unwrap());
        while let Some(ch) = self.peek() {
            if ch.is_alphanumeric() || ch == '_' {
                ident.push(self.advance().unwrap());
            } else {
                break;
            }
        }
        
        // Check for keywords
        let kind = match ident.as_str() {
            "model" => TokenKind::Model,
            "input" => TokenKind::Input,
            "output" => TokenKind::Output,
            "flow" => TokenKind::Flow,
            "block" => TokenKind::Block,
            "fn" => TokenKind::Fn,
            "train" => TokenKind::Train,
            "type" => TokenKind::Type,
            "where" => TokenKind::Where,
            "require" => TokenKind::Require,
            
            // Tensor types
            "Tensor" => TokenKind::TensorKw,
            "Image" => TokenKind::ImageKw,
            "Vector" => TokenKind::VectorKw,
            "Matrix" => TokenKind::MatrixKw,
            "Scalar" => TokenKind::ScalarKw,
            
            // Data types
            "f32" => TokenKind::F32,
            "f64" => TokenKind::F64,
            "bf16" => TokenKind::BF16,
            "fp16" => TokenKind::FP16,
            "int8" => TokenKind::Int8,
            "int32" => TokenKind::Int32,
            "bool" => TokenKind::Bool,
            
            // Otherwise it's an identifier
            _ => TokenKind::Ident(ident),
        };
        
        Ok(Token::new(kind, start))
    }

    /// Read Unicode mathematical symbol
    fn read_unicode_symbol(&mut self, start: Span) -> Result<Token, LexError> {
        let ch = self.advance().unwrap();
        
        let kind = match ch {
            // Greek letters as identifiers
            'α'..'ω' | 'Α'..'Ω' => {
                let mut sym = String::from(ch);
                // Allow combining characters or more greek
                while let Some(next) = self.peek() {
                    if is_greek_letter(next) || next.is_ascii_alphanumeric() {
                        sym.push(self.advance().unwrap());
                    } else {
                        break;
                    }
                }
                TokenKind::Ident(sym)
            }
            
            // Math operators/symbols
            'Σ' => TokenKind::Sigma,
            'Π' => TokenKind::Pi,
            '∫' => TokenKind::Integral,
            '√' => TokenKind::Sqrt,
            '∂' => TokenKind::Partial,
            '∇' => TokenKind::Nabla,
            '∞' => TokenKind::Infinity,
            '∈' => TokenKind::In,
            '∃' => TokenKind::Exists,
            '∀' => TokenKind::ForAll,
            '∪' => TokenKind::Union,
            '∩' => TokenKind::Intersection,
            'σ' => TokenKind::Ident("sigma".into()), // Commonly used as variable
            
            other => return Err(LexError::UnexpectedChar(other, start)),
        };
        
        Ok(Token::new(kind, start))
    }
}

/// Check if character is a Greek letter
fn is_greek_letter(ch: char) -> bool {
    matches!(ch, 'α'..='ω' | 'Α'..'Ω')
}

/// Check if character is a Unicode math symbol
fn is_math_symbol(ch: char) -> bool {
    matches!(ch, 
        'Σ' | 'Π' | '∫' | '√' | '∂' | '∇' | '∞' | 
        '∈' | '∃' | '∀' | '∪' | '∩' | '≤' | '≥' |
        '≠' | '≈' | '→' | '←' | '↔' | '⇒' | '⇐' | 'λ'
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_simple_tokens() {
        let source = "model Test { input: Image<3,224,224> }";
        let mut lexer = Lexer::new(source, "test");
        let tokens = lexer.tokenize().unwrap();
        
        assert!(matches!(tokens[0].kind, TokenKind::Model));
        assert!(matches!(tokens[1].kind, TokenKind::Ident(_)));
        assert!(matches!(tokens[2].kind, TokenKind::LBrace));
        assert!(matches!(tokens[3].kind, TokenKind::Input));
    }

    #[test]
    fn test_arrow_notation() {
        let source = "input → Conv2D(64) + BN → output";
        let mut lexer = Lexer::new(source, "test");
        let tokens = lexer.tokenize().unwrap();
        
        assert!(tokens.iter().any(|t| t.kind == TokenKind::Arrow));
        assert!(tokens.iter().any(|t| t.kind == TokenKind::Plus));
    }

    #[test]
    fn test_parallel_notation() {
        let source = "[branch1 || branch2]";
        let mut lexer = Lexer::new(source, "test");
        let tokens = lexer.tokenize().unwrap();
        
        assert!(tokens.iter().any(|t| t.kind == TokenKind::Parallel));
    }

    #[test]
    fn test_repeat_notation() {
        let source = "[block] × 6";
        let mut lexer = Lexer::new(source, "test");
        let tokens = lexer.tokenize().unwrap();
        
        assert!(tokens.iter().any(|t| t.kind == TokenKind::Times));
    }

    #[test]
    fn test_greek_letters() {
        let source = "α β σ λ";
        let mut lexer = Lexer::new(source, "test");
        let tokens = lexer.tokenize().unwrap();
        
        // All should be identifiers
        for token in &tokens[..4] {
            assert!(matches!(&token.kind, TokenKind::Ident(_)));
        }
    }
}

// ============================================================
// NeuralLang Lexer — Tokenizer
// Mengubah source code NeuralLang menjadi stream of tokens
// ============================================================

export enum TokenType {
  // Literals
  Number,
  String,
  Identifier,

  // Keywords
  Fn,          // fn
  Return,      // return
  For,         // for
  In,          // in
  Let,         // let
  If,          // if
  Else,        // else
  Struct,      // struct
  Impl,        // impl
  Trait,       // trait
  Use,         // use
  Mod,         // mod
  Pub,         // pub
  Type,        // type
  While,       // while
  Match,       // match
  Print,       // print
  True,        // true
  False,       // false
  Mut,         // mut

  // Known Types / Layer Names
  TypeName,    // Float, Int, Tensor, Bool, Dense, ReLU, etc.

  // Greek Letters (digunakan sebagai identifier)
  GreekId,     // α, β, γ, δ, ŷ, Σ, etc.

  // Operators
  Arrow,       // →
  Pipe,        // |
  DoublePipe,  // ‖
  Cross,       // ×
  Sum,         // ∑
  Integral,    // ∫
  Sqrt,        // √
  Partial,     // ∂
  Nabla,       // ∇
  Product,     // ∏
  DotProduct,  // ⊙
  OuterProduct,// ⊗
  Plus,        // +
  Minus,       // -
  Star,        // *
  Slash,       // /
  Caret,       // ^
  Percent,     // %
  Eq,          // ==
  NotEq,       // !=
  Lt,          // <
  Gt,          // >
  Lte,         // ≤ or <=
  Gte,         // ≥ or >=
  Approx,      // ≈
  ElementOf,   // ∈
  Assign,      // =
  Bang,        // !

  // Punctuation
  LParen,      // (
  RParen,      // )
  LBracket,    // [
  RBracket,    // ]
  LBrace,      // {
  RBrace,      // }
  Comma,       // ,
  Colon,       // :
  Semicolon,   // ;
  Dot,         // .
  DotDot,      // ..
  Underscore,  // _
  At,          // @
  Question,    // ?

  // Special
  Comment,     // // ...
  Newline,
  EOF,
}

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  col: number;
}

const KEYWORDS: Record<string, TokenType> = {
  'fn': TokenType.Fn,
  'return': TokenType.Return,
  'for': TokenType.For,
  'in': TokenType.In,
  'let': TokenType.Let,
  'if': TokenType.If,
  'else': TokenType.Else,
  'struct': TokenType.Struct,
  'impl': TokenType.Impl,
  'trait': TokenType.Trait,
  'use': TokenType.Use,
  'mod': TokenType.Mod,
  'pub': TokenType.Pub,
  'type': TokenType.Type,
  'while': TokenType.While,
  'match': TokenType.Match,
  'print': TokenType.Print,
  'true': TokenType.True,
  'false': TokenType.False,
  'mut': TokenType.Mut,
  'Self': TokenType.TypeName,
};

const TYPE_NAMES = new Set([
  'Float', 'Int', 'Tensor', 'Bool', 'String', 'Vec', 'Mat',
  'Dense', 'ReLU', 'Softmax', 'Sigmoid', 'Tanh', 'Dropout',
  'BatchNorm', 'Conv2d', 'MaxPool', 'Adam', 'SGD',
  'Optimizer', 'Loss', 'Model', 'Shape', 'Dim',
  'CrossEntropy', 'MSE', 'BCE', 'Attention',
  'LayerNorm', 'Embedding', 'Linear', 'RNN', 'LSTM', 'GRU',
  'Transpose', 'Reshape', 'Concat', 'Split',
]);

const GREEK_LETTERS = new Set([
  'α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 'θ', 'ι', 'κ', 'λ', 'μ',
  'ν', 'ξ', 'π', 'ρ', 'σ', 'τ', 'υ', 'φ', 'χ', 'ψ', 'ω',
  'Γ', 'Δ', 'Θ', 'Λ', 'Ξ', 'Π', 'Σ', 'Φ', 'Ψ', 'Ω',
  'ŷ', '∇', '∂',
]);

const MULTI_CHAR_OPERATORS: Array<{ chars: string; type: TokenType }> = [
  { chars: '→', type: TokenType.Arrow },
  { chars: '‖', type: TokenType.DoublePipe },
  { chars: '×', type: TokenType.Cross },
  { chars: '∑', type: TokenType.Sum },
  { chars: '∫', type: TokenType.Integral },
  { chars: '√', type: TokenType.Sqrt },
  { chars: '∇', type: TokenType.Nabla },
  { chars: '∏', type: TokenType.Product },
  { chars: '⊙', type: TokenType.DotProduct },
  { chars: '⊗', type: TokenType.OuterProduct },
  { chars: '≤', type: TokenType.Lte },
  { chars: '≥', type: TokenType.Gte },
  { chars: '≈', type: TokenType.Approx },
  { chars: '∈', type: TokenType.ElementOf },
  { chars: '≠', type: TokenType.NotEq },
  { chars: '==', type: TokenType.Eq },
  { chars: '!=', type: TokenType.NotEq },
  { chars: '<=', type: TokenType.Lte },
  { chars: '>=', type: TokenType.Gte },
  { chars: '..', type: TokenType.DotDot },
];

export class Lexer {
  private source: string;
  private pos: number = 0;
  private line: number = 1;
  private col: number = 1;

  constructor(source: string) {
    this.source = source;
  }

  tokenize(): Token[] {
    const tokens: Token[] = [];

    while (this.pos < this.source.length) {
      this.skipWhitespace();

      if (this.pos >= this.source.length) break;

      const ch = this.source[this.pos];

      // Newline
      if (ch === '\n') {
        tokens.push(this.makeToken(TokenType.Newline, '\n'));
        this.advance();
        this.line++;
        this.col = 1;
        continue;
      }

      // Comments
      if (ch === '/' && this.peek(1) === '/') {
        const startCol = this.col;
        const comment = this.readLineComment();
        tokens.push({ type: TokenType.Comment, value: comment, line: this.line, col: startCol });
        continue;
      }

      // String literals
      if (ch === '"') {
        tokens.push(this.readString());
        continue;
      }

      // Numbers
      if (this.isDigit(ch)) {
        tokens.push(this.readNumber());
        continue;
      }

      // Multi-char operators (check before single-char)
      const multiOp = this.tryMultiCharOperator();
      if (multiOp) {
        tokens.push(multiOp);
        continue;
      }

      // Greek letters
      if (GREEK_LETTERS.has(ch)) {
        tokens.push(this.makeToken(TokenType.GreekId, ch));
        this.advance();
        continue;
      }

      // Identifiers & keywords
      if (this.isIdentStart(ch)) {
        tokens.push(this.readIdentifier());
        continue;
      }

      // Single-char punctuation
      const singleOp = this.trySingleChar();
      if (singleOp) {
        tokens.push(singleOp);
        continue;
      }

      // Unknown character — skip
      this.advance();
    }

    tokens.push({ type: TokenType.EOF, value: '', line: this.line, col: this.col });
    return tokens;
  }

  private advance(): void {
    this.pos++;
    this.col++;
  }

  private peek(offset: number = 0): string {
    const idx = this.pos + offset;
    return idx < this.source.length ? this.source[idx] : '';
  }

  private makeToken(type: TokenType, value: string): Token {
    return { type, value, line: this.line, col: this.col };
  }

  private skipWhitespace(): void {
    while (this.pos < this.source.length) {
      const ch = this.source[this.pos];
      if (ch === ' ' || ch === '\t' || ch === '\r') {
        this.advance();
      } else {
        break;
      }
    }
  }

  private isDigit(ch: string): boolean {
    return ch >= '0' && ch <= '9';
  }

  private isIdentStart(ch: string): boolean {
    return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_';
  }

  private isIdentPart(ch: string): boolean {
    return this.isIdentStart(ch) || this.isDigit(ch);
  }

  private readNumber(): Token {
    const startCol = this.col;
    let num = '';
    let hasDot = false;

    while (this.pos < this.source.length) {
      const ch = this.source[this.pos];
      if (ch === '.' && !hasDot && this.peek(1) !== '.') {
        hasDot = true;
        num += ch;
        this.advance();
      } else if (this.isDigit(ch)) {
        num += ch;
        this.advance();
      } else {
        break;
      }
    }

    return { type: TokenType.Number, value: num, line: this.line, col: startCol };
  }

  private readIdentifier(): Token {
    const startCol = this.col;
    let ident = '';

    while (this.pos < this.source.length && this.isIdentPart(this.source[this.pos])) {
      ident += this.source[this.pos];
      this.advance();
    }

    // Check keyword
    if (KEYWORDS.hasOwnProperty(ident)) {
      return { type: KEYWORDS[ident], value: ident, line: this.line, col: startCol };
    }

    // Check type name
    if (TYPE_NAMES.has(ident) || (ident[0] === ident[0].toUpperCase() && ident[0] !== ident[0].toLowerCase())) {
      return { type: TokenType.TypeName, value: ident, line: this.line, col: startCol };
    }

    return { type: TokenType.Identifier, value: ident, line: this.line, col: startCol };
  }

  private readString(): Token {
    const startCol = this.col;
    this.advance(); // skip opening "
    let str = '';

    while (this.pos < this.source.length && this.source[this.pos] !== '"') {
      if (this.source[this.pos] === '\\') {
        this.advance();
        if (this.pos < this.source.length) {
          str += this.source[this.pos];
          this.advance();
        }
      } else {
        str += this.source[this.pos];
        this.advance();
      }
    }

    if (this.pos < this.source.length) {
      this.advance(); // skip closing "
    }

    return { type: TokenType.String, value: str, line: this.line, col: startCol };
  }

  private readLineComment(): string {
    let comment = '';
    while (this.pos < this.source.length && this.source[this.pos] !== '\n') {
      comment += this.source[this.pos];
      this.advance();
    }
    return comment;
  }

  private tryMultiCharOperator(): Token | null {
    for (const op of MULTI_CHAR_OPERATORS) {
      if (this.source.substring(this.pos, this.pos + op.chars.length) === op.chars) {
        const startCol = this.col;
        for (let i = 0; i < op.chars.length; i++) {
          this.advance();
        }
        return { type: op.type, value: op.chars, line: this.line, col: startCol };
      }
    }
    return null;
  }

  private trySingleChar(): Token | null {
    const ch = this.source[this.pos];
    const startCol = this.col;

    const map: Record<string, TokenType> = {
      '(': TokenType.LParen,
      ')': TokenType.RParen,
      '[': TokenType.LBracket,
      ']': TokenType.RBracket,
      '{': TokenType.LBrace,
      '}': TokenType.RBrace,
      ',': TokenType.Comma,
      ':': TokenType.Colon,
      ';': TokenType.Semicolon,
      '.': TokenType.Dot,
      '_': TokenType.Underscore,
      '@': TokenType.At,
      '?': TokenType.Question,
      '|': TokenType.Pipe,
      '+': TokenType.Plus,
      '-': TokenType.Minus,
      '*': TokenType.Star,
      '/': TokenType.Slash,
      '^': TokenType.Caret,
      '%': TokenType.Percent,
      '=': TokenType.Assign,
      '<': TokenType.Lt,
      '>': TokenType.Gt,
      '!': TokenType.Bang,
    };

    if (map.hasOwnProperty(ch)) {
      this.advance();
      return { type: map[ch], value: ch, line: this.line, col: startCol };
    }

    return null;
  }
}

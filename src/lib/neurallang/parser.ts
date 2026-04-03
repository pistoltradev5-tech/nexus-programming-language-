// ============================================================
// NeuralLang Parser — AST Builder
// Mengubah stream of tokens menjadi Abstract Syntax Tree
// ============================================================

import { Token, TokenType, Lexer } from './lexer';

// ---- AST Node Types ----

export type ASTNode =
  | ProgramNode
  | FnDefNode
  | StructDefNode
  | ForLoopNode
  | WhileLoopNode
  | IfStmtNode
  | LetStmtNode
  | ReturnStmtNode
  | PrintStmtNode
  | ExprStmtNode
  | AssignStmtNode
  | ArrowChainExpr
  | BinaryExpr
  | UnaryExpr
  | CallExpr
  | IndexExpr
  | MemberExpr
  | IdentifierExpr
  | GreekExpr
  | NumberExpr
  | StringExpr
  | BoolExpr
  | MathOpExpr
  | FormatStringExpr;

export interface ProgramNode {
  kind: 'Program';
  body: ASTNode[];
}

export interface FnDefNode {
  kind: 'FnDef';
  name: string;
  params: FnParam[];
  returnType?: string;
  body: ASTNode[];
}

export interface FnParam {
  name: string;
  typeAnnotation?: string;
}

export interface StructDefNode {
  kind: 'StructDef';
  name: string;
  fields: StructField[];
}

export interface StructField {
  name: string;
  typeAnnotation: string;
}

export interface ForLoopNode {
  kind: 'ForLoop';
  variable: string;
  startExpr?: ASTNode;
  endExpr?: ASTNode;
  iterable?: ASTNode;
  body: ASTNode[];
}

export interface WhileLoopNode {
  kind: 'WhileLoop';
  condition: ASTNode;
  body: ASTNode[];
}

export interface IfStmtNode {
  kind: 'IfStmt';
  condition: ASTNode;
  thenBody: ASTNode[];
  elseBody?: ASTNode[];
}

export interface LetStmtNode {
  kind: 'LetStmt';
  name: string;
  typeAnnotation?: string;
  value: ASTNode;
}

export interface ReturnStmtNode {
  kind: 'ReturnStmt';
  value?: ASTNode;
}

export interface PrintStmtNode {
  kind: 'PrintStmt';
  args: ASTNode[];
}

export interface ExprStmtNode {
  kind: 'ExprStmt';
  expr: ASTNode;
}

export interface AssignStmtNode {
  kind: 'AssignStmt';
  target: ASTNode;
  value: ASTNode;
}

export interface ArrowChainExpr {
  kind: 'ArrowChain';
  steps: ASTNode[];
}

export interface BinaryExpr {
  kind: 'BinaryExpr';
  op: string;
  left: ASTNode;
  right: ASTNode;
}

export interface UnaryExpr {
  kind: 'UnaryExpr';
  op: string;
  operand: ASTNode;
}

export interface CallExpr {
  kind: 'CallExpr';
  callee: ASTNode;
  args: ASTNode[];
  namedArgs?: Array<{ name: string; value: ASTNode }>;
}

export interface IndexExpr {
  kind: 'IndexExpr';
  object: ASTNode;
  index: ASTNode;
}

export interface MemberExpr {
  kind: 'MemberExpr';
  object: ASTNode;
  property: string;
}

export interface IdentifierExpr {
  kind: 'Identifier';
  name: string;
}

export interface GreekExpr {
  kind: 'Greek';
  name: string;
}

export interface NumberExpr {
  kind: 'Number';
  value: string;
}

export interface StringExpr {
  kind: 'String';
  value: string;
}

export interface BoolExpr {
  kind: 'Bool';
  value: boolean;
}

export interface MathOpExpr {
  kind: 'MathOp';
  op: string;
  args: ASTNode[];
}

export interface FormatStringExpr {
  kind: 'FormatString';
  parts: Array<string | ASTNode>;
}

// ---- Parser ----

export class Parser {
  private tokens: Token[];
  private pos: number = 0;

  constructor(tokens: Token[]) {
    // Filter out newline tokens for easier parsing
    this.tokens = tokens.filter(t => t.type !== TokenType.Newline);
  }

  parse(): ProgramNode {
    const body: ASTNode[] = [];

    while (!this.isAtEnd()) {
      const stmt = this.parseStatement();
      if (stmt) body.push(stmt);
    }

    return { kind: 'Program', body };
  }

  // ---- Statement Parsing ----

  private parseStatement(): ASTNode | null {
    if (this.isAtEnd()) return null;

    const tok = this.peek();

    switch (tok.type) {
      case TokenType.Fn:
        return this.parseFnDef();
      case TokenType.Struct:
        return this.parseStructDef();
      case TokenType.For:
        return this.parseForLoop();
      case TokenType.While:
        return this.parseWhileLoop();
      case TokenType.If:
        return this.parseIfStmt();
      case TokenType.Return:
        return this.parseReturnStmt();
      case TokenType.Let:
        return this.parseLetStmt();
      case TokenType.Print:
        return this.parsePrintStmt();
      case TokenType.Comment:
        this.advance();
        return null;
      default:
        return this.parseExprOrAssignStmt();
    }
  }

  private parseFnDef(): FnDefNode {
    this.expect(TokenType.Fn);
    const name = this.expectIdentOrType();
    this.expect(TokenType.LParen);

    const params: FnParam[] = [];
    while (!this.check(TokenType.RParen)) {
      if (params.length > 0) this.expect(TokenType.Comma);
      const pName = this.expectIdentOrGreek();
      let typeAnnot: string | undefined;
      if (this.check(TokenType.Colon)) {
        this.advance();
        typeAnnot = this.parseTypeAnnotation();
      }
      params.push({ name: pName, typeAnnotation: typeAnnot });
    }
    this.expect(TokenType.RParen);

    let returnType: string | undefined;
    if (this.check(TokenType.Arrow)) {
      this.advance();
      returnType = this.parseTypeAnnotation();
    }

    this.expect(TokenType.LBrace);
    const body = this.parseBlockBody();
    this.expect(TokenType.RBrace);

    return { kind: 'FnDef', name, params, returnType, body };
  }

  private parseStructDef(): StructDefNode {
    this.expect(TokenType.Struct);
    const name = this.expectIdentOrType();
    this.expect(TokenType.LBrace);

    const fields: StructField[] = [];

    while (!this.check(TokenType.RBrace)) {
      const fName = this.expectIdentOrType();
      this.expect(TokenType.Colon);
      const fType = this.parseTypeAnnotation();
      fields.push({ name: fName, typeAnnotation: fType });

      if (this.check(TokenType.Comma)) this.advance();
    }

    this.expect(TokenType.RBrace);
    return { kind: 'StructDef', name, fields };
  }

  private parseForLoop(): ForLoopNode {
    this.expect(TokenType.For);

    // Handle tuple destructuring: for (x, y) in ...
    let variable: string;
    if (this.check(TokenType.LParen)) {
      this.advance(); // skip (
      const parts: string[] = [];
      while (!this.check(TokenType.RParen)) {
        if (parts.length > 0) this.expect(TokenType.Comma);
        parts.push(this.expectIdentOrGreek());
      }
      this.expect(TokenType.RParen);
      variable = parts.join(', ');
    } else {
      variable = this.expectIdentOrGreek();
    }

    // Support: "for epoch ∈ 1..100 {" or "for (x, y) in dataloader(train_data) {"
    if (this.check(TokenType.ElementOf) || this.check(TokenType.In)) {
      this.advance();
    }

    // Check if range: expr..expr
    const left = this.parseExpression();

    if (this.check(TokenType.DotDot)) {
      this.advance();
      const right = this.parseExpression();

      this.expect(TokenType.LBrace);
      const body = this.parseBlockBody();
      this.expect(TokenType.RBrace);

      return { kind: 'ForLoop', variable, startExpr: left, endExpr: right, body };
    }

    // Otherwise it's an iterable expression
    this.expect(TokenType.LBrace);
    const body = this.parseBlockBody();
    this.expect(TokenType.RBrace);

    return { kind: 'ForLoop', variable, iterable: left, body };
  }

  private parseWhileLoop(): WhileLoopNode {
    this.expect(TokenType.While);
    const condition = this.parseExpression();
    this.expect(TokenType.LBrace);
    const body = this.parseBlockBody();
    this.expect(TokenType.RBrace);
    return { kind: 'WhileLoop', condition, body };
  }

  private parseIfStmt(): IfStmtNode {
    this.expect(TokenType.If);
    const condition = this.parseExpression();
    this.expect(TokenType.LBrace);
    const thenBody = this.parseBlockBody();
    this.expect(TokenType.RBrace);

    let elseBody: ASTNode[] | undefined;
    if (this.check(TokenType.Else)) {
      this.advance();
      if (this.check(TokenType.If)) {
        elseBody = [this.parseIfStmt()];
      } else {
        this.expect(TokenType.LBrace);
        elseBody = this.parseBlockBody();
        this.expect(TokenType.RBrace);
      }
    }

    return { kind: 'IfStmt', condition, thenBody, elseBody };
  }

  private parseReturnStmt(): ReturnStmtNode {
    this.expect(TokenType.Return);
    let value: ASTNode | undefined;
    if (!this.check(TokenType.RBrace) && !this.isAtEnd()) {
      value = this.parseExpression();
    }
    return { kind: 'ReturnStmt', value };
  }

  private parseLetStmt(): LetStmtNode {
    this.expect(TokenType.Let);
    const name = this.expectIdentOrGreek();
    let typeAnnot: string | undefined;
    if (this.check(TokenType.Colon)) {
      this.advance();
      typeAnnot = this.parseTypeAnnotation();
    }
    this.expect(TokenType.Assign);
    const value = this.parseExpression();
    return { kind: 'LetStmt', name, typeAnnotation: typeAnnot, value };
  }

  private parsePrintStmt(): PrintStmtNode {
    this.expect(TokenType.Print);
    this.expect(TokenType.LParen);
    const args: ASTNode[] = [];

    while (!this.check(TokenType.RParen)) {
      if (args.length > 0) this.expect(TokenType.Comma);
      args.push(this.parseExpression());
    }

    this.expect(TokenType.RParen);
    return { kind: 'PrintStmt', args };
  }

  private parseExprOrAssignStmt(): ASTNode {
    const expr = this.parseExpression();

    if (this.check(TokenType.Assign)) {
      this.advance();
      const value = this.parseExpression();
      return { kind: 'AssignStmt', target: expr, value };
    }

    return { kind: 'ExprStmt', expr };
  }

  private parseBlockBody(): ASTNode[] {
    const stmts: ASTNode[] = [];
    while (!this.check(TokenType.RBrace) && !this.isAtEnd()) {
      const stmt = this.parseStatement();
      if (stmt) stmts.push(stmt);
    }
    return stmts;
  }

  // ---- Expression Parsing ----

  private parseExpression(): ASTNode {
    return this.parseArrowChain();
  }

  // Arrow chain: expr → expr → expr (highest priority for NN definition)
  private parseArrowChain(): ASTNode {
    const first = this.parseComparison();

    if (this.check(TokenType.Arrow)) {
      const steps = [first];
      while (this.check(TokenType.Arrow)) {
        this.advance();
        // Use parseUnary to capture Dense(784,256) as CallExpr, not just Identifier
        steps.push(this.parseUnary());
      }
      return { kind: 'ArrowChain', steps };
    }

    return first;
  }

  private parseComparison(): ASTNode {
    let left = this.parseAdditive();

    const compOps = [
      TokenType.Eq, TokenType.NotEq, TokenType.Lt, TokenType.Gt,
      TokenType.Lte, TokenType.Gte, TokenType.Approx, TokenType.ElementOf,
    ];

    while (compOps.includes(this.peek().type)) {
      const op = this.advance().value;
      const right = this.parseAdditive();
      left = { kind: 'BinaryExpr', op, left, right };
    }

    return left;
  }

  private parseAdditive(): ASTNode {
    let left = this.parseMultiplicative();

    while (this.check(TokenType.Plus) || this.check(TokenType.Minus)) {
      const op = this.advance().value;
      const right = this.parseMultiplicative();
      left = { kind: 'BinaryExpr', op, left, right };
    }

    return left;
  }

  private parseMultiplicative(): ASTNode {
    let left = this.parseUnary();

    while (
      this.check(TokenType.Star) || this.check(TokenType.Slash) ||
      this.check(TokenType.Percent) || this.check(TokenType.Cross) ||
      this.check(TokenType.DotProduct) || this.check(TokenType.OuterProduct) ||
      this.check(TokenType.Caret)
    ) {
      const op = this.advance().value;
      const right = this.parseUnary();
      left = { kind: 'BinaryExpr', op, left, right };
    }

    return left;
  }

  private parseUnary(): ASTNode {
    if (this.check(TokenType.Minus) || this.check(TokenType.Bang) || this.check(TokenType.Nabla)) {
      const op = this.advance().value;
      const operand = this.parseUnary();
      return { kind: 'UnaryExpr', op, operand };
    }

    return this.parsePostfix();
  }

  private parsePostfix(): ASTNode {
    let expr = this.parsePrimary();

    while (true) {
      if (this.check(TokenType.LParen)) {
        // Function call
        this.advance();
        const args: ASTNode[] = [];
        const namedArgs: Array<{ name: string; value: ASTNode }> = [];

        while (!this.check(TokenType.RParen)) {
          if (args.length > 0 || namedArgs.length > 0) this.expect(TokenType.Comma);

          // Check for named argument: name=value
          const lookahead = this.lookaheadIdentAssign();
          if (lookahead) {
            const name = lookahead;
            this.advance(); // skip identifier
            this.advance(); // skip =
            const value = this.parseExpression();
            namedArgs.push({ name, value });
          } else {
            args.push(this.parseExpression());
          }
        }
        this.expect(TokenType.RParen);
        expr = { kind: 'CallExpr', callee: expr, args, namedArgs: namedArgs.length > 0 ? namedArgs : undefined };
      } else if (this.check(TokenType.LBracket)) {
        // Index access
        this.advance();
        const index = this.parseExpression();
        this.expect(TokenType.RBracket);
        expr = { kind: 'IndexExpr', object: expr, index };
      } else if (this.check(TokenType.Dot)) {
        // Member access
        this.advance();
        const prop = this.expectIdentOrType();
        expr = { kind: 'MemberExpr', object: expr, property: prop };
      } else if (this.check(TokenType.Bang)) {
        // Bang operator: update!(params, ...)
        this.advance();
        expr = { kind: 'CallExpr', callee: expr, args: [] };
      } else {
        break;
      }
    }

    return expr;
  }

  private lookaheadIdentAssign(): string | null {
    if (
      this.peek().type === TokenType.Identifier &&
      this.pos + 1 < this.tokens.length &&
      this.tokens[this.pos + 1].type === TokenType.Assign
    ) {
      return this.peek().value;
    }
    return null;
  }

  private parsePrimary(): ASTNode {
    const tok = this.peek();

    switch (tok.type) {
      case TokenType.Number:
        this.advance();
        return { kind: 'Number', value: tok.value };

      case TokenType.String: {
        this.advance();
        return this.tryParseFormatString(tok.value);
      }

      case TokenType.True:
        this.advance();
        return { kind: 'Bool', value: true };

      case TokenType.False:
        this.advance();
        return { kind: 'Bool', value: false };

      case TokenType.Identifier:
        this.advance();
        return { kind: 'Identifier', name: tok.value };

      case TokenType.GreekId:
        this.advance();
        return { kind: 'Greek', name: tok.value };

      case TokenType.TypeName:
        this.advance();
        return { kind: 'Identifier', name: tok.value };

      // Math operators as prefix (∑, ∫, √, ∇, ‖, ∏)
      case TokenType.Sum:
      case TokenType.Integral:
      case TokenType.Sqrt:
      case TokenType.Nabla:
      case TokenType.DoublePipe:
      case TokenType.Product: {
        this.advance();
        const args: ASTNode[] = [];
        if (this.check(TokenType.LParen)) {
          this.advance();
          while (!this.check(TokenType.RParen)) {
            if (args.length > 0) this.expect(TokenType.Comma);
            args.push(this.parseExpression());
          }
          this.expect(TokenType.RParen);
        } else {
          // Parse the next primary as the argument
          args.push(this.parsePrimary());
        }
        return { kind: 'MathOp', op: tok.value, args };
      }

      case TokenType.LParen:
        this.advance();
        const inner = this.parseExpression();
        this.expect(TokenType.RParen);
        return inner;

      default:
        this.advance();
        return { kind: 'Identifier', name: tok.value };
    }
  }

  private tryParseFormatString(template: string): ASTNode {
    const parts: Array<string | ASTNode> = [];
    let remaining = template;
    let strBuf = '';

    while (remaining.length > 0) {
      const openIdx = remaining.indexOf('{');
      if (openIdx === -1) {
        strBuf += remaining;
        break;
      }

      strBuf += remaining.substring(0, openIdx);
      remaining = remaining.substring(openIdx + 1);

      const closeIdx = remaining.indexOf('}');
      if (closeIdx === -1) {
        strBuf += '{' + remaining;
        break;
      }

      const exprStr = remaining.substring(0, closeIdx).trim();
      remaining = remaining.substring(closeIdx + 1);

      if (strBuf) {
        parts.push(strBuf);
        strBuf = '';
      }

      // Parse the embedded expression using a sub-lexer/parser
      const innerLexer = new Lexer(exprStr);
      const innerTokens = innerLexer.tokenize();
      const innerParser = new Parser(innerTokens);
      const innerAst = innerParser.parseExpression();
      parts.push(innerAst);
    }

    if (strBuf) {
      parts.push(strBuf);
    }

    if (parts.length === 1 && typeof parts[0] === 'string') {
      return { kind: 'String', value: parts[0] as string };
    }

    return { kind: 'FormatString', parts };
  }

  // ---- Type Annotation ----

  private parseTypeAnnotation(): string {
    const typeName = this.expectIdentOrType();

    if (this.check(TokenType.LBracket)) {
      this.advance();
      const params: string[] = [];
      while (!this.check(TokenType.RBracket)) {
        if (params.length > 0) this.expect(TokenType.Comma);
        params.push(this.expectIdentOrType());
      }
      this.expect(TokenType.RBracket);
      return `${typeName}[${params.join(', ')}]`;
    }

    return typeName;
  }

  // ---- Helpers ----

  private expect(type: TokenType): Token {
    const tok = this.peek();
    if (tok.type !== type) {
      this.advance(); // graceful skip
      return tok;
    }
    return this.advance();
  }

  private expectIdentOrType(): string {
    const tok = this.peek();
    if (tok.type === TokenType.Identifier || tok.type === TokenType.TypeName) {
      this.advance();
      return tok.value;
    }
    this.advance();
    return tok.value || 'unknown';
  }

  private expectIdentOrGreek(): string {
    const tok = this.peek();
    if (tok.type === TokenType.Identifier || tok.type === TokenType.GreekId) {
      this.advance();
      return tok.value;
    }
    this.advance();
    return tok.value || 'unknown';
  }

  private check(type: TokenType): boolean {
    return !this.isAtEnd() && this.peek().type === type;
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  private peek(): Token {
    return this.tokens[this.pos];
  }

  private advance(): Token {
    const tok = this.tokens[this.pos];
    if (!this.isAtEnd()) this.pos++;
    return tok;
  }
}

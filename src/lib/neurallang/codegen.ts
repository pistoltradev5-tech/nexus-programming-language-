// ============================================================
// NeuralLang Code Generator
// Transpile AST menjadi kode Python/PyTorch yang valid
// ============================================================

import {
  ASTNode, ProgramNode, FnDefNode, StructDefNode, ForLoopNode,
  WhileLoopNode, IfStmtNode, LetStmtNode, ReturnStmtNode,
  PrintStmtNode, ExprStmtNode, AssignStmtNode,
  ArrowChainExpr, BinaryExpr, UnaryExpr, CallExpr,
  IndexExpr, MemberExpr, IdentifierExpr, GreekExpr,
  NumberExpr, StringExpr, BoolExpr, MathOpExpr, FormatStringExpr,
} from './parser';

// ---- Greek → Python variable mapping ----

const GREEK_MAP: Record<string, string> = {
  'α': 'alpha', 'β': 'beta', 'γ': 'gamma', 'δ': 'delta',
  'ε': 'epsilon', 'ζ': 'zeta', 'η': 'eta', 'θ': 'theta',
  'ι': 'iota', 'κ': 'kappa', 'λ': 'lam', 'μ': 'mu',
  'ν': 'nu', 'ξ': 'xi', 'π': 'pi', 'ρ': 'rho',
  'σ': 'sigma', 'τ': 'tau', 'υ': 'upsilon', 'φ': 'phi',
  'χ': 'chi', 'ψ': 'psi', 'ω': 'omega',
  'Γ': 'Gamma', 'Δ': 'Delta', 'Θ': 'Theta', 'Λ': 'Lam',
  'Ξ': 'Xi', 'Π': 'Pi', 'Σ': 'Sigma', 'Φ': 'Phi',
  'Ψ': 'Psi', 'Ω': 'Omega',
  'ŷ': 'y_hat',
};

// ---- Known layers that need nn.Module init ----

const LINEAR_LAYERS = new Set(['Dense', 'Linear', 'Conv2d', 'MaxPool', 'Dropout', 'BatchNorm', 'LayerNorm', 'Embedding', 'Flatten']);

// ---- Code Generator ----

export interface CodeGenResult {
  code: string;
  imports: Set<string>;
}

export class CodeGenerator {
  private indent: number = 0;
  private imports: Set<string> = new Set();
  private layerCounter: number = 0;
  private pendingLayers: Array<{ varName: string; init: string }> = [];

  generate(ast: ASTNode): CodeGenResult {
    this.imports.add('import torch');
    this.imports.add('import torch.nn as nn');
    this.imports.add('import torch.nn.functional as F');

    this.layerCounter = 0;
    const code = this.genNode(ast);

    return { code, imports: this.imports };
  }

  private ind(): string {
    return '    '.repeat(this.indent);
  }

  private genNode(node: ASTNode): string {
    switch (node.kind) {
      case 'Program': return this.genProgram(node);
      case 'FnDef': return this.genFnDef(node);
      case 'StructDef': return this.genStructDef(node);
      case 'ForLoop': return this.genForLoop(node);
      case 'WhileLoop': return this.genWhileLoop(node);
      case 'IfStmt': return this.genIfStmt(node);
      case 'LetStmt': return this.genLetStmt(node);
      case 'ReturnStmt': return this.genReturnStmt(node);
      case 'PrintStmt': return this.genPrintStmt(node);
      case 'ExprStmt': return this.genExprStmt(node);
      case 'AssignStmt': return this.genAssignStmt(node);
      case 'ArrowChain': return this.genArrowChain(node);
      case 'BinaryExpr': return this.genBinaryExpr(node);
      case 'UnaryExpr': return this.genUnaryExpr(node);
      case 'CallExpr': return this.genCallExpr(node);
      case 'IndexExpr': return this.genIndexExpr(node);
      case 'MemberExpr': return this.genMemberExpr(node);
      case 'Identifier': return this.genIdentifier(node);
      case 'Greek': return this.genGreek(node);
      case 'Number': return node.value;
      case 'String': return `"${node.value}"`;
      case 'Bool': return node.value ? 'True' : 'False';
      case 'MathOp': return this.genMathOp(node);
      case 'FormatString': return this.genFormatString(node);
      default: return `/* unknown: ${(node as any).kind} */`;
    }
  }

  // ---- Program ----

  private genProgram(node: ProgramNode): string {
    const parts: string[] = [];
    for (const stmt of node.body) {
      const code = this.genNode(stmt);
      if (code.trim()) parts.push(code);
    }
    return parts.join('\n\n');
  }

  // ---- Function Definition ----

  private genFnDef(node: FnDefNode): string {
    const lines: string[] = [];
    const className = this.toPascalCase(node.name);
    const isModule = this.fnUsesLayers(node);

    // Collect layer definitions from the body BEFORE generating code
    this.pendingLayers = [];
    this.layerCounter = 0;

    if (isModule) {
      this.collectAllLayers(node.body);

      // Generate as nn.Module class
      lines.push(`class ${className}(nn.Module):`);
      this.indent++;

      // __init__
      lines.push(`${this.ind()}def __init__(self):`);
      this.indent++;
      lines.push(`${this.ind()}super().__init__()`);
      for (const ld of this.pendingLayers) {
        lines.push(`${this.ind()}self.${ld.varName} = ${ld.init}`);
      }
      this.indent--;
      lines.push('');

      // forward
      lines.push(`${this.ind()}def forward(self, ${this.toPythonName(node.params[0]?.name || 'x')}):`);
      this.indent++;

      for (const stmt of node.body) {
        lines.push(this.genNode(stmt));
      }

      this.indent -= 2;
    } else {
      // Generate as plain function
      const params = node.params.map(p => this.toPythonName(p.name)).join(', ');
      lines.push(`def ${this.toSnakeCase(node.name)}(${params}):`);
      this.indent++;

      for (const stmt of node.body) {
        lines.push(this.genNode(stmt));
      }

      this.indent--;
    }

    this.pendingLayers = [];
    return lines.join('\n');
  }

  // ---- Struct Definition ----

  private genStructDef(node: StructDefNode): string {
    const lines: string[] = [];

    // Determine constructor params from field type annotations
    const constructorParams = new Set<string>();
    for (const f of node.fields) {
      const m = f.typeAnnotation.match(/^\w+\[(.+)\]$/);
      if (m) m[1].split(',').map(s => s.trim()).forEach(p => constructorParams.add(p));
    }

    lines.push(`class ${node.name}(nn.Module):`);
    this.indent++;

    // __init__
    const paramsStr = constructorParams.size > 0 ? ', ' + Array.from(constructorParams).join(', ') : '';
    lines.push(`${this.ind()}def __init__(self${paramsStr}):`);
    this.indent++;
    lines.push(`${this.ind()}super().__init__()`);

    for (const field of node.fields) {
      const pyInit = this.fieldToPyInit(field);
      lines.push(`${this.ind()}self.${field.name.toLowerCase()} = ${pyInit}`);
    }

    this.indent--;
    lines.push('');

    // forward
    lines.push(`${this.ind()}def forward(self, x):`);
    this.indent++;
    lines.push(`${this.ind()}q = self.q(x)`);
    lines.push(`${this.ind()}k = self.k(x)`);
    lines.push(`${this.ind()}v = self.v(x)`);
    lines.push(`${this.ind()}# Self-attention: softmax(q @ k.T / sqrt(d_k)) @ v`);
    this.indent -= 2;

    return lines.join('\n');
  }

  // ---- For Loop ----

  private genForLoop(node: ForLoopNode): string {
    const lines: string[] = [];

    if (node.startExpr && node.endExpr) {
      const start = this.expr(node.startExpr);
      const end = this.expr(node.endExpr);
      lines.push(`${this.ind()}for ${this.toPythonName(node.variable)} in range(${start}, ${end}):`);
    } else if (node.iterable) {
      const iter = this.expr(node.iterable);
      lines.push(`${this.ind()}for ${this.toPythonName(node.variable)} in ${iter}:`);
    } else {
      lines.push(`${this.ind()}for ${this.toPythonName(node.variable)} in range(...):`);
    }

    this.indent++;
    for (const stmt of node.body) {
      lines.push(this.genNode(stmt));
    }
    this.indent--;

    return lines.join('\n');
  }

  // ---- While Loop ----

  private genWhileLoop(node: WhileLoopNode): string {
    const lines: string[] = [];
    lines.push(`${this.ind()}while ${this.expr(node.condition)}:`);
    this.indent++;
    for (const stmt of node.body) lines.push(this.genNode(stmt));
    this.indent--;
    return lines.join('\n');
  }

  // ---- If Statement ----

  private genIfStmt(node: IfStmtNode): string {
    const lines: string[] = [];
    lines.push(`${this.ind()}if ${this.expr(node.condition)}:`);
    this.indent++;
    for (const stmt of node.thenBody) lines.push(this.genNode(stmt));
    this.indent--;

    if (node.elseBody && node.elseBody.length > 0) {
      lines.push(`${this.ind()}else:`);
      this.indent++;
      for (const stmt of node.elseBody) lines.push(this.genNode(stmt));
      this.indent--;
    }

    return lines.join('\n');
  }

  // ---- Statements ----

  private genLetStmt(node: LetStmtNode): string {
    return `${this.ind()}${this.toPythonName(node.name)} = ${this.expr(node.value)}`;
  }

  private genReturnStmt(node: ReturnStmtNode): string {
    if (!node.value) return `${this.ind()}return`;
    return `${this.ind()}return ${this.expr(node.value)}`;
  }

  private genPrintStmt(node: PrintStmtNode): string {
    const args = node.args.map(a => this.expr(a)).join(', ');
    return `${this.ind()}print(${args})`;
  }

  private genExprStmt(node: ExprStmtNode): string {
    return `${this.ind()}${this.expr(node.expr)}`;
  }

  private genAssignStmt(node: AssignStmtNode): string {
    const target = this.expr(node.target);
    const value = this.expr(node.value);
    return `${this.ind()}${target} = ${value}`;
  }

  // ---- Arrow Chain: input → Dense(784,256) → ReLU → Softmax ----

  private genArrowChain(node: ArrowChainExpr): string {
    if (node.steps.length === 0) return '';
    if (node.steps.length === 1) return this.expr(node.steps[0]);

    // First step is the input expression
    let current = this.expr(node.steps[0]);

    // Process each → step
    for (let i = 1; i < node.steps.length; i++) {
      const step = node.steps[i];
      current = this.genChainStep(step, current);
    }

    return current;
  }

  private genChainStep(step: ASTNode, current: string): string {
    // Handle both CallExpr (e.g., Dense(784, 256)) and bare Identifier (e.g., ReLU)
    let calleeName = '';

    if (step.kind === 'CallExpr') {
      const call = step as CallExpr;
      calleeName = this.getCalleeName(call.callee);

      if (calleeName === 'Dense' || calleeName === 'Linear') {
        const layerVar = this.getLayerVar('dense', call.args);
        current = `self.${layerVar}(${current})`;
      } else if (calleeName === 'Conv2d') {
        const layerVar = this.getLayerVar('conv2d', call.args);
        current = `self.${layerVar}(${current})`;
      } else if (calleeName === 'Dropout') {
        const layerVar = this.getLayerVar('dropout', call.args);
        current = `self.${layerVar}(${current})`;
      } else if (calleeName === 'BatchNorm') {
        const layerVar = this.getLayerVar('batch_norm', call.args);
        current = `self.${layerVar}(${current})`;
      } else if (calleeName === 'LayerNorm') {
        const layerVar = this.getLayerVar('layer_norm', call.args);
        current = `self.${layerVar}(${current})`;
      } else if (calleeName === 'ReLU') {
        current = `F.relu(${current})`;
      } else if (calleeName === 'Sigmoid') {
        current = `torch.sigmoid(${current})`;
      } else if (calleeName === 'Tanh') {
        current = `torch.tanh(${current})`;
      } else if (calleeName === 'Softmax') {
        current = `F.softmax(${current}, dim=-1)`;
      } else if (calleeName === 'Flatten') {
        const layerVar = this.getLayerVar('flatten', call.args);
        current = `self.${layerVar}(${current})`;
      } else {
        // Generic function call
        const args = call.args.map(a => this.expr(a)).join(', ');
        current = `${calleeName}(${current}${args ? ', ' + args : ''})`;
      }
    } else if (step.kind === 'Identifier') {
      // Bare identifier like: ReLU, Softmax, Dropout (without parentheses)
      calleeName = (step as IdentifierExpr).name;

      if (calleeName === 'ReLU') {
        current = `F.relu(${current})`;
      } else if (calleeName === 'Sigmoid') {
        current = `torch.sigmoid(${current})`;
      } else if (calleeName === 'Tanh') {
        current = `torch.tanh(${current})`;
      } else if (calleeName === 'Softmax') {
        current = `F.softmax(${current}, dim=-1)`;
      } else if (calleeName === 'Flatten') {
        current = `${current}.flatten(1)`;
      } else if (calleeName === 'Dropout') {
        current = `F.dropout(${current}, p=0.5, training=self.training)`;
      } else {
        current = `${calleeName}(${current})`;
      }
    } else {
      current = this.expr(step);
    }

    return current;
  }

  // ---- Binary Expression ----

  private genBinaryExpr(node: BinaryExpr): string {
    const left = this.expr(node.left);
    const right = this.expr(node.right);

    switch (node.op) {
      case '×': return `torch.matmul(${left}, ${right})`;
      case '⊙': return `${left} * ${right}`;
      case '⊗': return `torch.outer(${left}, ${right})`;
      case '‖': return `torch.norm(${left})`;
      case '^': return `torch.pow(${left}, ${right})`;
      case '+': return `${left} + ${right}`;
      case '-': return `${left} - ${right}`;
      case '*': return `${left} * ${right}`;
      case '/': return `${left} / ${right}`;
      case '%': return `${left} % ${right}`;
      case '==': return `${left} == ${right}`;
      case '!=': case '≠': return `${left} != ${right}`;
      case '<': return `${left} < ${right}`;
      case '>': return `${left} > ${right}`;
      case '<=': case '≤': return `${left} <= ${right}`;
      case '>=': case '≥': return `${left} >= ${right}`;
      case '≈': return `torch.isclose(${left}, ${right})`;
      case '∈': return `${left} in ${right}`;
      case '..': return `${left}, ${right}`;
      default: return `${left} ${node.op} ${right}`;
    }
  }

  // ---- Unary Expression ----

  private genUnaryExpr(node: UnaryExpr): string {
    const operand = this.expr(node.operand);
    switch (node.op) {
      case '-': return `-${operand}`;
      case '!': return `not ${operand}`;
      case '∇': return `${operand}.grad`;
      default: return `${node.op}${operand}`;
    }
  }

  // ---- Call Expression ----

  private genCallExpr(node: CallExpr): string {
    // Handle method calls: loss.backward(), optimizer.step(), etc.
    if (node.callee.kind === 'MemberExpr') {
      const memberExpr = node.callee as MemberExpr;
      const obj = this.expr(memberExpr.object);
      const method = memberExpr.property;
      const args = node.args.map(a => this.expr(a)).join(', ');
      return `${obj}.${method}(${args})`;
    }

    const calleeName = this.getCalleeName(node.callee);
    const args = node.args.map(a => this.expr(a)).join(', ');

    const namedParts: string[] = [];
    if (node.namedArgs) {
      for (const na of node.namedArgs) {
        namedParts.push(`${na.name}=${this.expr(na.value)}`);
      }
    }
    const allArgs = [args, ...namedParts].filter(Boolean).join(', ');

    switch (calleeName) {
      case 'Dense': return `nn.Linear(${allArgs})`;
      case 'Linear': return `nn.Linear(${allArgs})`;
      case 'ReLU': return `F.relu(${args})`;
      case 'Sigmoid': return `torch.sigmoid(${args})`;
      case 'Tanh': return `torch.tanh(${args})`;
      case 'Softmax': return `F.softmax(${args}, dim=-1)`;
      case 'Dropout': return `nn.Dropout(${args})`;
      case 'BatchNorm': return `nn.BatchNorm1d(${args})`;
      case 'Conv2d': return `nn.Conv2d(${allArgs})`;
      case 'LayerNorm': return `nn.LayerNorm(${args})`;
      case 'backward':
        return `${args}.backward()`;
      case 'update':
        return `optimizer.step()`;
      case 'softmax':
        return `F.softmax(${args}, dim=-1)`;
      case 'log':
        return `torch.log(${args})`;
      case 'exp':
        return `torch.exp(${args})`;
      case 'sqrt':
        return `torch.sqrt(${args})`;
      case 'abs':
        return `torch.abs(${args})`;
      case 'mean':
        return `(${args}).mean()`;
      case 'sum':
        return `(${args}).sum()`;
      case 'max':
        return `(${args}).max()`;
      case 'min':
        return `(${args}).min()`;
      case 'transpose':
        return `(${args}).transpose(-2, -1)`;
      case 'dataloader':
        this.imports.add('from torch.utils.data import DataLoader');
        return `DataLoader(${allArgs})`;
      case 'print':
        return `print(${args})`;
      default:
        return `${calleeName}(${allArgs})`;
    }
  }

  // ---- Index Expression ----

  private genIndexExpr(node: IndexExpr): string {
    return `${this.expr(node.object)}[${this.expr(node.index)}]`;
  }

  // ---- Member Expression ----

  private genMemberExpr(node: MemberExpr): string {
    return `${this.expr(node.object)}.${node.property}`;
  }

  // ---- Identifiers ----

  private genIdentifier(node: IdentifierExpr): string {
    return this.toPythonName(node.name);
  }

  private genGreek(node: GreekExpr): string {
    return GREEK_MAP[node.name] || `_${node.name}`;
  }

  // ---- Math Operations ----

  private genMathOp(node: MathOpExpr): string {
    const args = node.args.map(a => this.expr(a)).join(', ');
    switch (node.op) {
      case '∑': return `(${args}).sum()`;
      case '∏': return `(${args}).prod()`;
      case '∫': return `torch.trapezoid(${args})`;
      case '√': return `torch.sqrt(${args})`;
      case '∇': return `# gradient of (${args})`;
      case '‖': return `torch.norm(${args})`;
      default: return `# math_op(${node.op}, ${args})`;
    }
  }

  // ---- Format String ----

  private genFormatString(node: FormatStringExpr): string {
    const parts = node.parts.map(part => {
      if (typeof part === 'string') return part;
      return `{${this.expr(part)}}`;
    });
    return `f"${parts.join('')}"`;
  }

  // ======== HELPERS ========

  private expr(node: ASTNode): string {
    const saved = this.indent;
    const result = this.genNode(node).trim();
    this.indent = saved;
    return result;
  }

  private fnUsesLayers(fnDef: FnDefNode): boolean {
    const json = JSON.stringify(fnDef.body);
    return ['Dense', 'Linear', 'Conv2d', 'BatchNorm', 'Embedding', 'LSTM', 'Attention'].some(k => json.includes(k));
  }

  private collectAllLayers(body: ASTNode[]): void {
    for (const stmt of body) {
      if (stmt.kind === 'AssignStmt') {
        const assign = stmt as AssignStmtNode;
        if (assign.value.kind === 'ArrowChain') {
          this.collectLayersFromChain(assign.value as ArrowChainExpr);
        }
      } else if (stmt.kind === 'ExprStmt') {
        const exprStmt = stmt as ExprStmtNode;
        if (exprStmt.expr.kind === 'ArrowChain') {
          this.collectLayersFromChain(exprStmt.expr as ArrowChainExpr);
        }
      } else if (stmt.kind === 'ReturnStmt') {
        const ret = stmt as ReturnStmtNode;
        if (ret.value && ret.value.kind === 'ArrowChain') {
          this.collectLayersFromChain(ret.value as ArrowChainExpr);
        }
      }
    }
  }

  private collectLayersFromChain(chain: ArrowChainExpr): void {
    for (let i = 1; i < chain.steps.length; i++) {
      const step = chain.steps[i];
      if (step.kind === 'CallExpr') {
        const call = step as CallExpr;
        const name = this.getCalleeName(call.callee);

        if (name === 'Dense' || name === 'Linear') {
          const layerVar = this.getLayerVar('dense', call.args);
          const args = call.args.map(a => this.expr(a)).join(', ');
          const init = `nn.Linear(${args})`;
          if (!this.pendingLayers.find(l => l.varName === layerVar)) {
            this.pendingLayers.push({ varName: layerVar, init });
          }
        } else if (name === 'Conv2d') {
          const layerVar = this.getLayerVar('conv2d', call.args);
          const args = call.args.map(a => this.expr(a)).join(', ');
          const init = `nn.Conv2d(${args})`;
          if (!this.pendingLayers.find(l => l.varName === layerVar)) {
            this.pendingLayers.push({ varName: layerVar, init });
          }
        } else if (name === 'Dropout') {
          const layerVar = this.getLayerVar('dropout', call.args);
          const args = call.args.map(a => this.expr(a)).join(', ');
          const init = `nn.Dropout(${args})`;
          if (!this.pendingLayers.find(l => l.varName === layerVar)) {
            this.pendingLayers.push({ varName: layerVar, init });
          }
        } else if (name === 'BatchNorm') {
          const layerVar = this.getLayerVar('batch_norm', call.args);
          const args = call.args.map(a => this.expr(a)).join(', ');
          const init = `nn.BatchNorm1d(${args})`;
          if (!this.pendingLayers.find(l => l.varName === layerVar)) {
            this.pendingLayers.push({ varName: layerVar, init });
          }
        } else if (name === 'LayerNorm') {
          const layerVar = this.getLayerVar('layer_norm', call.args);
          const args = call.args.map(a => this.expr(a)).join(', ');
          const init = `nn.LayerNorm(${args})`;
          if (!this.pendingLayers.find(l => l.varName === layerVar)) {
            this.pendingLayers.push({ varName: layerVar, init });
          }
        }
      }
    }
  }

  private getLayerVar(baseName: string, args: ASTNode[]): string {
    const key = `${baseName}_${args.map(a => this.expr(a)).join('_')}`;
    if (!this.usedLayerVars || !this.usedLayerVars.has(key)) {
      if (!this.usedLayerVars) this.usedLayerVars = new Set();
      this.usedLayerVars.add(key);
      this.layerCounter++;
      return `${baseName}_${this.layerCounter}`;
    }
    // If already exists, find existing index
    return `${baseName}_${Array.from(this.usedLayerVars).indexOf(key) + 1}`;
  }

  private usedLayerVars: Set<string> | null = null;

  private getCalleeName(callee: ASTNode): string {
    if (callee.kind === 'Identifier') return (callee as IdentifierExpr).name;
    if (callee.kind === 'Greek') return (callee as GreekExpr).name;
    return '';
  }

  private toPythonName(name: string): string {
    if (GREEK_MAP[name]) return GREEK_MAP[name];
    if (name === 'ŷ') return 'y_hat';
    return name;
  }

  private toSnakeCase(name: string): string {
    return name.replace(/([A-Z])/g, '_$1').replace(/^_/, '').toLowerCase();
  }

  private toPascalCase(name: string): string {
    return name.split('_').map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join('');
  }

  private fieldToPyInit(field: { name: string; typeAnnotation: string }): string {
    const m = field.typeAnnotation.match(/^(\w+)\[(.+)\]$/);
    if (m) {
      const typeName = m[1];
      const params = m[2].split(',').map(s => s.trim()).join(', ');
      if (typeName === 'Dense') return `nn.Linear(${params})`;
      if (typeName === 'Conv2d') return `nn.Conv2d(${params})`;
    }
    return `None  # ${field.typeAnnotation}`;
  }
}

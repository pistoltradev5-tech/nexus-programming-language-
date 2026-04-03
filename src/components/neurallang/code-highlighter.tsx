'use client';

import React from 'react';

interface HighlightedSpan {
  text: string;
  className: string;
}

export function highlightNeuralLang(code: string): HighlightedSpan[] {
  const tokens: HighlightedSpan[] = [];
  let remaining = code;
  let key = 0;

  const keywords = ['fn', 'return', 'for', 'in', 'let', 'if', 'else', 'match', 'struct', 'impl', 'trait', 'use', 'mod', 'pub', 'type', 'import', 'def', 'while', 'do', 'break', 'continue', 'where', 'const', 'static', 'mut', 'ref', 'true', 'false'];
  const types = ['Float', 'Int', 'Tensor', 'Bool', 'String', 'Vec', 'Mat', 'Dense', 'ReLU', 'Softmax', 'Sigmoid', 'Tanh', 'Dropout', 'BatchNorm', 'Conv2d', 'MaxPool', 'Adam', 'SGD', 'Optimizer', 'Loss', 'Model', 'Shape', 'Dim'];
  const greekLetters = ['α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 'θ', 'ι', 'κ', 'λ', 'μ', 'ν', 'ξ', 'π', 'ρ', 'σ', 'τ', 'υ', 'φ', 'χ', 'ψ', 'ω', 'Γ', 'Δ', 'Θ', 'Λ', 'Ξ', 'Π', 'Σ', 'Φ', 'Ψ', 'Ω', 'ŷ'];

  while (remaining.length > 0) {
    // Skip whitespace
    if (remaining[0] === '\n') {
      tokens.push({ text: '\n', className: '' });
      remaining = remaining.slice(1);
      continue;
    }
    if (remaining[0] === ' ' || remaining[0] === '\t') {
      let spaceCount = 0;
      while (spaceCount < remaining.length && (remaining[spaceCount] === ' ' || remaining[spaceCount] === '\t')) {
        spaceCount++;
      }
      tokens.push({ text: remaining.slice(0, spaceCount), className: '' });
      remaining = remaining.slice(spaceCount);
      continue;
    }

    // Line comment
    if (remaining.startsWith('//')) {
      const endIdx = remaining.indexOf('\n');
      const commentText = endIdx === -1 ? remaining : remaining.slice(0, endIdx);
      tokens.push({ text: commentText, className: 'nl-comment' });
      remaining = remaining.slice(commentText.length);
      continue;
    }

    // String literals
    if (remaining[0] === '"') {
      let endIdx = 1;
      while (endIdx < remaining.length && remaining[endIdx] !== '"') {
        if (remaining[endIdx] === '\\') endIdx++;
        endIdx++;
      }
      endIdx++; // include closing quote
      tokens.push({ text: remaining.slice(0, endIdx), className: 'nl-string' });
      remaining = remaining.slice(endIdx);
      continue;
    }

    // Greek letters (including composed like ŷ)
    const greekMatch = remaining.match(new RegExp(`^[${greekLetters.join('')}ŷñ]+`));
    if (greekMatch) {
      tokens.push({ text: greekMatch[0], className: 'nl-greek' });
      remaining = remaining.slice(greekMatch[0].length);
      continue;
    }

    // Mathematical operators / special symbols
    const opMatch = remaining.match(/^[→‖×∑∫√∂∇∏±≤≥≠≈∈∉∧∨⊕⊗⇒⇐⟶⟵]+/);
    if (opMatch) {
      tokens.push({ text: opMatch[0], className: 'nl-operator' });
      remaining = remaining.slice(opMatch[0].length);
      continue;
    }

    // Arrow notation with dashes
    const arrowMatch = remaining.match(/^→/);
    if (arrowMatch) {
      tokens.push({ text: arrowMatch[0], className: 'nl-operator' });
      remaining = remaining.slice(arrowMatch[0].length);
      continue;
    }

    // Numbers
    const numMatch = remaining.match(/^\d+\.?\d*/);
    if (numMatch) {
      tokens.push({ text: numMatch[0], className: 'nl-number' });
      remaining = remaining.slice(numMatch[0].length);
      continue;
    }

    // Identifiers & keywords
    const identMatch = remaining.match(/^[a-zA-Z_][a-zA-Z0-9_]*/);
    if (identMatch) {
      const word = identMatch[0];
      if (keywords.includes(word)) {
        tokens.push({ text: word, className: 'nl-keyword' });
      } else if (types.includes(word)) {
        tokens.push({ text: word, className: 'nl-type' });
      } else if (word[0] === word[0].toUpperCase() && word[0] !== word[0].toLowerCase()) {
        tokens.push({ text: word, className: 'nl-type' });
      } else {
        tokens.push({ text: word, className: '' });
      }
      remaining = remaining.slice(word.length);
      continue;
    }

    // Punctuation
    const punctChars = '{}[](),:;.=+-*/<>!&|^%#@~`?';
    if (punctChars.includes(remaining[0])) {
      tokens.push({ text: remaining[0], className: 'nl-punctuation' });
      remaining = remaining.slice(1);
      continue;
    }

    // Fallback: single character
    tokens.push({ text: remaining[0], className: '' });
    remaining = remaining.slice(1);
    key++;
  }

  return tokens;
}

interface CodeHighlighterProps {
  code: string;
  className?: string;
  showLineNumbers?: boolean;
}

export default function CodeHighlighter({ code, className = '', showLineNumbers = false }: CodeHighlighterProps) {
  const tokens = highlightNeuralLang(code);
  const lines = code.split('\n');

  if (showLineNumbers) {
    const lineTokens: HighlightedSpan[][] = [];
    let currentLine: HighlightedSpan[] = [];
    let lineIdx = 0;

    for (const token of tokens) {
      if (token.text === '\n') {
        lineTokens.push(currentLine);
        currentLine = [];
        lineIdx++;
      } else {
        currentLine.push(token);
      }
    }
    if (currentLine.length > 0) {
      lineTokens.push(currentLine);
    }

    // Pad to match line count
    while (lineTokens.length < lines.length) {
      lineTokens.push([]);
    }

    return (
      <div className={`code-block ${className}`}>
        <pre className="p-4 overflow-x-auto text-sm leading-relaxed">
          {lineTokens.map((lineTokens, i) => (
            <div key={i} className="flex">
              <span className="inline-block w-10 text-right mr-4 text-neutral-600 select-none shrink-0">
                {i + 1}
              </span>
              <span>
                {lineTokens.map((token, j) => (
                  <span key={j} className={token.className}>{token.text}</span>
                ))}
              </span>
            </div>
          ))}
        </pre>
      </div>
    );
  }

  return (
    <div className={`code-block ${className}`}>
      <pre className="p-4 overflow-x-auto text-sm leading-relaxed">
        {tokens.map((token, i) => (
          <span key={i} className={token.className}>{token.text}</span>
        ))}
      </pre>
    </div>
  );
}

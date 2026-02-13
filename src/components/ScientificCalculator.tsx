"use client";

import React, { useState, useEffect, useRef } from 'react';
import { create, all } from 'mathjs/number';
import { LuHistory, LuDelete, LuTrash2, LuX, LuCopy, LuCheck, LuInfo } from 'react-icons/lu';
import { useTheme } from '@/contexts/ThemeContext';

// Lazy mathjs initialization - defers heavy setup until first calculation
let _math: ReturnType<typeof create> | null = null;
function getMath() {
  if (!_math) {
    _math = create(all, {});
    _math.import({
      asind: (x: number) => Math.asin(x) * (180 / Math.PI),
      acosd: (x: number) => Math.acos(x) * (180 / Math.PI),
      atand: (x: number) => Math.atan(x) * (180 / Math.PI),
    }, { override: true });
  }
  return _math;
}

interface HistoryItem {
  expression: string;
  result: string;
}

// Format number with thousands separator (display only)
const formatWithCommas = (numStr: string): string => {
  if (!numStr || numStr === '0') return numStr;
  // Don't format if contains letters (except 'e' for sci notation) or error text
  if (/[a-df-zA-DF-Z]/.test(numStr)) return numStr;

  const isNeg = numStr.startsWith('-');
  const abs = isNeg ? numStr.slice(1) : numStr;

  // Don't format scientific notation like 1.23e+15
  if (/e[+-]?\d+$/i.test(abs)) return numStr;

  const [intPart, decPart] = abs.split('.');
  const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const full = decPart !== undefined ? `${formatted}.${decPart}` : formatted;
  return isNeg ? `-${full}` : full;
};

// Detect specific error type from mathjs exceptions
const detectError = (expression: string, lastResult: string): string => {
  try {
    let expr = expression
      .replace(/×/g, '*').replace(/÷/g, '/').replace(/π/g, 'pi').replace(/√\(/g, 'sqrt(')
      .replace(/nPr\(/g, 'permutations(').replace(/nCr\(/g, 'combinations(')
      .replace(/Ans/g, `(${lastResult})`);
    const res = getMath().evaluate(expr);
    if (typeof res === 'number' && !isFinite(res)) return 'Divide by 0';
  } catch (e: unknown) {
    const msg = (e as Error)?.message || '';
    if (msg.includes('Unexpected end of expression') || msg.includes('Value expected')) return 'Incomplete';
    if (msg.includes('Parenthesis ) expected')) return 'Missing )';
    if (msg.includes('factorial')) return 'Invalid factorial';
    if (msg.includes('must be positive')) return 'Domain error';
    if (msg.includes('Division by zero')) return 'Divide by 0';
    if (msg.includes('Unexpected type')) return 'Type error';
  }

  // Fallback: check parentheses balance
  const opens = (expression.match(/\(/g) || []).length;
  const closes = (expression.match(/\)/g) || []).length;
  if (opens > closes) return 'Missing )';
  if (closes > opens) return 'Extra )';

  return 'Syntax Error';
};

// Tooltip data for buttons
const tooltips: Record<string, string> = {
  'sin': 'sin(30) = 0.5 (DEG)', 'sin\u207b\u00b9': 'sin\u207b\u00b9(0.5) = 30\u00b0',
  'sinh': 'sinh(1) \u2248 1.175', 'sinh\u207b\u00b9': 'sinh\u207b\u00b9(1) \u2248 0.881',
  'cos': 'cos(60) = 0.5 (DEG)', 'cos\u207b\u00b9': 'cos\u207b\u00b9(0.5) = 60\u00b0',
  'cosh': 'cosh(1) \u2248 1.543', 'cosh\u207b\u00b9': 'cosh\u207b\u00b9(2) \u2248 1.317',
  'tan': 'tan(45) = 1 (DEG)', 'tan\u207b\u00b9': 'tan\u207b\u00b9(1) = 45\u00b0',
  'tanh': 'tanh(1) \u2248 0.762', 'tanh\u207b\u00b9': 'tanh\u207b\u00b9(0.5) \u2248 0.549',
  'x\u00b2': '5\u00b2 = 25', 'x\u00b3': '3\u00b3 = 27',
  'n!': '5! = 120', 'ln': 'ln(e) = 1', 'e\u02e3': 'e\u00b2 \u2248 7.389',
  'log': 'log(100) = 2', '10\u02e3': '10\u00b3 = 1000',
  '|x|': '|\u22125| = 5', 'EXP': '3 EXP 5 = 3\u00d710\u2075',
  'Ans': 'Previous result', '1/x': '1/4 = 0.25', '+/\u2212': 'Toggle sign \u00b1',
  'nPr': 'P(5,2) = 20', 'nCr': 'C(5,2) = 10',
  '%': '200\u00d715% = 30', 'mod': '10 mod 3 = 1',
  '\u221a': '\u221a(9) = 3', '\u00b3\u221a': '\u00b3\u221a(27) = 3',
  'x^y': '2^10 = 1024', '\u03c0': '\u03c0 \u2248 3.14159', 'e': 'e \u2248 2.71828',
  'MC': 'Memory Clear', 'MR': 'Memory Recall',
  'M+': 'Add to memory', 'M\u2212': 'Subtract from memory',
  'Rand': 'Random (0~1)',
};

// Module-level vibrate (no state dependency)
const vibrate = () => { if (navigator.vibrate) navigator.vibrate(10); };

// Button styles as module-level constants (avoids recreation on every render)
const DARK_BASE = "h-12 sm:h-14 rounded-xl font-medium text-lg transition-colors duration-200 active:scale-95 flex items-center justify-center select-none cursor-pointer";
const LIGHT_BASE = "h-12 sm:h-14 rounded-lg font-medium text-lg transition-colors duration-200 active:scale-95 flex items-center justify-center select-none shadow-sm cursor-pointer";
const DARK_STYLES: Record<string, string> = {
  default: "bg-white/[0.08] text-gray-100 font-bold border border-white/[0.15] hover:bg-white/[0.14] hover:border-white/25 shadow-lg shadow-black/20",
  number: "bg-white/[0.08] text-gray-100 font-bold border border-white/[0.15] hover:bg-white/[0.14] hover:border-white/25 shadow-lg shadow-black/20",
  operator: "bg-indigo-500/20 text-indigo-300 border border-indigo-400/35 hover:bg-indigo-500/30 hover:border-indigo-400/50 font-semibold shadow-lg shadow-indigo-900/20",
  function: "bg-white/[0.05] text-gray-300 border border-white/[0.12] hover:bg-white/[0.10] hover:border-white/20 text-base font-medium",
  action: "bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:from-blue-400 hover:to-blue-500 shadow-lg shadow-blue-500/30 border border-blue-400/40",
  warning: "bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 border border-rose-400/35 hover:border-rose-400/50",
  hyp: "bg-gradient-to-br from-violet-500 to-indigo-600 text-white hover:from-violet-400 hover:to-indigo-500 shadow-lg shadow-violet-500/30 border border-violet-400/40",
  memory: "bg-emerald-500/15 text-emerald-300 border border-emerald-400/35 hover:bg-emerald-500/25 hover:border-emerald-400/50 text-sm font-semibold",
};
const LIGHT_STYLES: Record<string, string> = {
  default: "bg-white text-gray-900 font-bold border border-gray-300 hover:bg-gray-50",
  number: "bg-white text-gray-900 font-bold border border-gray-300 hover:bg-gray-50",
  operator: "bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 font-semibold",
  function: "bg-slate-100 text-slate-800 border border-slate-300 hover:bg-slate-200 text-base font-medium",
  action: "bg-blue-600 text-white hover:bg-blue-700 shadow-md border-transparent",
  warning: "bg-red-50 text-red-700 hover:bg-red-100 border border-red-300",
  hyp: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md border-transparent",
  memory: "bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100 text-sm font-semibold",
};

// Button at module level for stable React reconciliation
// (When defined inside a component, React treats it as a new type each render → 45 unmount/remount)
// dark prop eliminates 45 useTheme() context subscriptions (parent reads once, passes down)
const Button = ({ label, onClick, dark, className = "", styleType = "default", ariaLabel = "", tooltip = "" }: {
  label: React.ReactNode; onClick: () => void; dark: boolean; className?: string; styleType?: string; ariaLabel?: string; tooltip?: string;
}) => {
  const handleClick = () => { vibrate(); onClick(); };
  const baseStyle = dark ? DARK_BASE : LIGHT_BASE;
  const styles = dark ? DARK_STYLES : LIGHT_STYLES;
  const appliedStyle = styles[styleType] || styles.default;
  const tooltipText = tooltip || (typeof label === 'string' ? tooltips[label] : undefined);
  return (
    <button onClick={handleClick} className={`${baseStyle} ${appliedStyle} ${className}`}
      aria-label={ariaLabel || (typeof label === 'string' ? label : undefined)}
      title={tooltipText} type="button">
      {label}
    </button>
  );
};

// Keyboard shortcuts data (static)
const shortcuts = [
  { key: '0 – 9', desc: 'Numbers' },
  { key: '+ − * /', desc: 'Operators' },
  { key: '( )', desc: 'Parentheses' },
  { key: '.', desc: 'Decimal' },
  { key: '^', desc: 'Power (xʸ)' },
  { key: '!', desc: 'Factorial' },
  { key: '%', desc: 'Percent' },
  { key: 'Enter / =', desc: 'Calculate' },
  { key: 'Backspace', desc: 'Delete last' },
  { key: 'Escape', desc: 'Clear all (AC)' },
];

const ScientificCalculator = () => {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const [input, setInput] = useState('');
  const [result, setResult] = useState('0');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isDegree, setIsDegree] = useState(true);
  const [funcMode, setFuncMode] = useState(0); // 0=2nd, 1=INV, 2=HYP, 3=H⁻¹
  const [error, setError] = useState(false);
  const [lastResult, setLastResult] = useState('0');
  const [copied, setCopied] = useState(false);
  const [memory, setMemory] = useState(0);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

  const inputRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const [isFinalResult, setIsFinalResult] = useState(false);

  // Derived states
  const isInverse = funcMode % 2 === 1;
  const isHyp = funcMode >= 2;

  // Parentheses balance counter
  const openParens = (input.match(/\(/g) || []).length - (input.match(/\)/g) || []).length;

  // Refs for keyboard handler (avoids stale closures)
  const addToDisplayRef = useRef<(val: string) => void>(() => {});
  const handleCalculateRef = useRef<() => void>(() => {});
  const handleBackspaceRef = useRef<() => void>(() => {});
  const handleClearRef = useRef<() => void>(() => {});
  const handlePlusMinusRef = useRef<() => void>(() => {});

  // Load history, lastResult & memory on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('calc_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    const savedLast = localStorage.getItem('calc_last_result');
    if (savedLast) setLastResult(savedLast);
    const savedMem = localStorage.getItem('calc_memory');
    if (savedMem) setMemory(parseFloat(savedMem));
  }, []);

  // Save history
  useEffect(() => {
    localStorage.setItem('calc_history', JSON.stringify(history));
  }, [history]);

  // Save memory
  useEffect(() => {
    localStorage.setItem('calc_memory', String(memory));
  }, [memory]);

  // Live Calculation
  useEffect(() => {
    if (!input) { setResult('0'); setError(false); return; }
    if (isFinalResult) return;
    try {
      const liveRes = calculateResult(input);
      if (liveRes !== null) { setResult(liveRes); setError(false); }
    } catch { /* Incomplete expression */ }
  }, [input, isDegree, lastResult]);

  // Auto-scroll input
  useEffect(() => {
    if (inputRef.current) {
      requestAnimationFrame(() => {
        if (inputRef.current) inputRef.current.scrollLeft = inputRef.current.scrollWidth;
      });
    }
  }, [input]);

  // Keyboard handler (registered once, uses refs)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable) return;

      const key = e.key;
      if (/^[0-9]$/.test(key)) { addToDisplayRef.current(key); }
      else if (key === '+') { addToDisplayRef.current('+'); }
      else if (key === '-') { addToDisplayRef.current('-'); }
      else if (key === '*') { addToDisplayRef.current('×'); }
      else if (key === '/') { e.preventDefault(); addToDisplayRef.current('÷'); }
      else if (key === '(') { addToDisplayRef.current('('); }
      else if (key === ')') { addToDisplayRef.current(')'); }
      else if (key === '.') { addToDisplayRef.current('.'); }
      else if (key === ',') { addToDisplayRef.current(','); }
      else if (key === '!') { addToDisplayRef.current('!'); }
      else if (key === '^') { addToDisplayRef.current('^'); }
      else if (key === '%') { addToDisplayRef.current('/100'); }
      else if (key === 'Enter' || key === '=') { e.preventDefault(); handleCalculateRef.current(); }
      else if (key === 'Backspace') { handleBackspaceRef.current(); }
      else if (key === 'Escape') { handleClearRef.current(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Trig config based on funcMode
  const trigConfig = {
    sin: { labels: ['sin', 'sin⁻¹', 'sinh', 'sinh⁻¹'], actions: ['sin(', 'asin(', 'sinh(', 'asinh('], aria: ['Sine', 'Arc sine', 'Hyperbolic sine', 'Inv hyperbolic sine'] },
    cos: { labels: ['cos', 'cos⁻¹', 'cosh', 'cosh⁻¹'], actions: ['cos(', 'acos(', 'cosh(', 'acosh('], aria: ['Cosine', 'Arc cosine', 'Hyperbolic cosine', 'Inv hyperbolic cosine'] },
    tan: { labels: ['tan', 'tan⁻¹', 'tanh', 'tanh⁻¹'], actions: ['tan(', 'atan(', 'tanh(', 'atanh('], aria: ['Tangent', 'Arc tangent', 'Hyperbolic tangent', 'Inv hyperbolic tangent'] },
  };
  const funcModeLabels = ['2nd', 'INV', 'HYP', 'H⁻¹'];

  const calculateResult = (expression: string): string | null => {
    try {
      let expr = expression;

      // Visual symbols → math operators
      expr = expr.replace(/×/g, '*')
                 .replace(/÷/g, '/')
                 .replace(/π/g, 'pi')
                 .replace(/√\(/g, 'sqrt(');

      // Custom functions → mathjs
      expr = expr.replace(/nPr\(/g, 'permutations(')
                 .replace(/nCr\(/g, 'combinations(');

      // Ans → last result
      expr = expr.replace(/Ans/g, `(${lastResult})`);

      if (isDegree) {
        // Inverse trig → degree output (FIRST, before forward trig)
        expr = expr.replace(/asin\(/g, 'asind(')
                   .replace(/acos\(/g, 'acosd(')
                   .replace(/atan\(/g, 'atand(');

        // Forward trig → degree input (multiply by pi/180 instead of using deg unit)
        ['sin', 'cos', 'tan'].forEach(func => {
          const regex = new RegExp(`(?<![a-zA-Z])${func}\\(([0-9.]+)`, 'g');
          expr = expr.replace(regex, `${func}($1*(pi/180)`);
        });
      }

      const res = getMath().evaluate(expr);
      if (typeof res === 'number') {
        if (!isFinite(res)) return null;
        return getMath().format(res, { precision: 14, notation: 'auto', upperExp: 15, lowerExp: -15 });
      }
      if (typeof res === 'object') {
        return getMath().format(res, { precision: 14, notation: 'auto', upperExp: 15, lowerExp: -15 });
      }
      return String(res);
    } catch {
      return null;
    }
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem('calc_history');
  };

  const addToDisplay = (val: string) => {
    if (isFinalResult) {
      const continueWithResult = ['+', '-', '×', '÷'].includes(val) ||
                                  val.startsWith('^') || val === '!' || val === '/100';
      if (continueWithResult) {
        setInput(result + val);
        setError(false);
        setResult(result);
      } else {
        setInput(val);
        setError(false);
        setResult('0');
      }
      setIsFinalResult(false);
    } else {
      if (error) setError(false);
      setInput(prev => prev + val);
    }
  };
  addToDisplayRef.current = addToDisplay;

  const handleClear = () => {
    setInput('');
    setResult('0');
    setError(false);
    setIsFinalResult(false);
    setFuncMode(0);
  };
  handleClearRef.current = handleClear;

  const handleBackspace = () => {
    if (isFinalResult) { handleClear(); return; }
    if (!input) return;

    // Smart backspace: remove multi-char tokens
    const tokens = [
      'asinh(', 'acosh(', 'atanh(', 'log10(', '×10^(',
      'asin(', 'acos(', 'atan(', 'sinh(', 'cosh(', 'tanh(',
      'sqrt(', 'cbrt(', '^(-1)',
      'sin(', 'cos(', 'tan(', 'log(', 'abs(', 'mod(', 'nPr(', 'nCr(',
      'e^(', '10^(', '/100', 'Ans', '^2', '^3',
    ];
    for (const token of tokens) {
      if (input.endsWith(token)) {
        const newInput = input.slice(0, -token.length);
        setInput(newInput);
        if (!newInput) setResult('0');
        setError(false);
        return;
      }
    }

    // Single char
    if (input.length <= 1) { setInput(''); setResult('0'); }
    else { setInput(prev => prev.slice(0, -1)); }
    setError(false);
  };
  handleBackspaceRef.current = handleBackspace;

  const handleCalculate = () => {
    if (!input) return;
    const finalRes = calculateResult(input);
    if (finalRes !== null) {
      setResult(finalRes);
      setError(false);
      setLastResult(finalRes);
      localStorage.setItem('calc_last_result', finalRes);
      setHistory(prev => [{ expression: input, result: finalRes }, ...prev].slice(0, 50));
      setIsFinalResult(true);
    } else {
      setError(true);
      setResult(detectError(input, lastResult));
    }
  };
  handleCalculateRef.current = handleCalculate;

  const handlePlusMinus = () => {
    if (isFinalResult) {
      setInput(result.startsWith('-') ? result.slice(1) : `(-${result})`);
      setIsFinalResult(false);
      setError(false);
      return;
    }
    if (!input) { setInput('(-'); return; }
    if (/^-?\d*\.?\d*$/.test(input)) {
      setInput(prev => prev.startsWith('-') ? prev.slice(1) : '-' + prev);
      return;
    }
    setInput(prev => prev.endsWith('(-') ? prev.slice(0, -2) : prev + '(-');
  };
  handlePlusMinusRef.current = handlePlusMinus;

  // Memory functions
  const handleMemoryClear = () => setMemory(0);
  const handleMemoryRecall = () => { if (memory !== 0) addToDisplay(String(memory)); };
  const handleMemoryAdd = () => {
    const val = parseFloat(result);
    if (!isNaN(val)) setMemory(prev => prev + val);
  };
  const handleMemorySubtract = () => {
    const val = parseFloat(result);
    if (!isNaN(val)) setMemory(prev => prev - val);
  };

  // Random number
  const handleRandom = () => {
    const rand = parseFloat(Math.random().toFixed(10)).toString();
    addToDisplay(rand);
  };

  return (
    <div className="w-full max-w-lg mx-auto p-4">
      <div className={`rounded-2xl overflow-hidden ${dark ? 'bg-[#0f1420] border border-white/[0.08] shadow-2xl shadow-black/50' : 'bg-white border border-gray-200 shadow-xl'}`}>

        {/* Display Area */}
        <div className={`relative p-6 text-right min-h-[140px] flex flex-col justify-end ${dark ? 'bg-gradient-to-b from-[#141b2d] to-[#0f1420] border-b border-white/[0.06]' : 'bg-gray-50 border-b border-gray-200'}`}>

          {/* Top-left: History + Keyboard Help + Memory indicator */}
          <div className="absolute top-4 left-4 flex items-center gap-1">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`p-2 rounded-full transition-colors ${dark ? 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.08]' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'}`}
              title="History" aria-label="View history" type="button"
            >
              <LuHistory size={20} />
            </button>
            <button
              onClick={() => setShowKeyboardHelp(true)}
              className={`p-2 rounded-full transition-colors ${dark ? 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.08]' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'}`}
              title="Keyboard shortcuts" aria-label="Keyboard shortcuts" type="button"
            >
              <LuInfo size={18} />
            </button>
            {memory !== 0 && (
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${dark ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/20' : 'bg-emerald-100 text-emerald-700'}`}
                title={`Memory: ${memory}`}>
                M
              </span>
            )}
          </div>

          {/* Deg/Rad Toggle */}
          <div
            className={`absolute top-4 right-4 flex rounded-lg p-0.5 text-xs font-medium ${dark ? 'bg-white/[0.06] border border-white/[0.06]' : 'bg-gray-200'}`}
            role="radiogroup" aria-label="Angle mode"
          >
            <button onClick={() => setIsDegree(true)} role="radio" aria-checked={isDegree} type="button"
              className={`px-2.5 py-1 rounded-md transition-all ${isDegree ? (dark ? 'bg-blue-500/25 text-blue-300 shadow-sm font-bold border border-blue-400/20' : 'bg-white text-blue-800 shadow-sm font-bold') : (dark ? 'text-gray-500 hover:text-gray-400 border border-transparent' : 'text-gray-700')}`}>
              DEG
            </button>
            <button onClick={() => setIsDegree(false)} role="radio" aria-checked={!isDegree} type="button"
              className={`px-2.5 py-1 rounded-md transition-all ${!isDegree ? (dark ? 'bg-blue-500/25 text-blue-300 shadow-sm font-bold border border-blue-400/20' : 'bg-white text-blue-800 shadow-sm font-bold') : (dark ? 'text-gray-500 hover:text-gray-400 border border-transparent' : 'text-gray-700')}`}>
              RAD
            </button>
          </div>

          {/* Expression + Parentheses Counter */}
          <div className="flex items-end gap-1">
            <div ref={inputRef}
              className={`flex-1 text-lg font-medium whitespace-nowrap overflow-x-auto overflow-y-hidden custom-scroll mb-2 min-h-[28px] pb-1 leading-tight ${dark ? 'text-gray-400' : 'text-gray-700'}`}
              role="region" aria-live="polite" aria-label="Expression">
              {input || ''}
            </div>
            {openParens > 0 && (
              <span className={`text-xs mb-2 whitespace-nowrap font-mono ${dark ? 'text-amber-400/80' : 'text-amber-600'}`}>
                {')'}&times;{openParens}
              </span>
            )}
          </div>

          {/* Result + Copy */}
          <div className="flex items-center gap-2">
            <div ref={resultRef}
              className={`flex-1 min-w-0 text-3xl font-bold tracking-tight whitespace-nowrap overflow-x-auto overflow-y-hidden custom-scroll pb-1 leading-tight ${error ? 'text-red-400 text-2xl' : (dark ? 'text-white' : 'text-gray-900')}`}
              aria-label="Result" aria-live="polite">
              {error ? result : formatWithCommas(result)}
            </div>
            {result && result !== '0' && !error && (
              <button
                onClick={() => { navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
                className={`flex-shrink-0 p-1.5 rounded-lg transition-colors ${copied ? (dark ? 'text-emerald-400' : 'text-green-600') : (dark ? 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.08]' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200')}`}
                aria-label="Copy result" title={copied ? 'Copied!' : 'Copy'} type="button">
                {copied ? <LuCheck size={16} /> : <LuCopy size={16} />}
              </button>
            )}
          </div>
        </div>

        {/* Main Body */}
        <div className="flex flex-col md:flex-row relative">

          {/* History Panel */}
          <div className={`
            absolute md:static z-20 top-0 left-0 h-full w-full md:w-64
            transition-all duration-300 ease-in-out transform
            ${showHistory ? 'translate-x-0' : '-translate-x-full md:hidden'}
            flex flex-col
            ${dark ? 'bg-[#0f1420] border-r border-white/[0.06]' : 'bg-white border-r border-gray-200'}
          `}>
            <div className={`flex justify-between items-center p-4 ${dark ? 'border-b border-white/[0.06] bg-[#141b2d]' : 'border-b border-gray-100 bg-gray-50'}`}>
              <span className={`font-semibold flex items-center gap-2 ${dark ? 'text-gray-200' : 'text-gray-800'}`}>
                <LuHistory aria-hidden="true" /> History
              </span>
              <div className="flex gap-2">
                <button onClick={handleClearHistory}
                  className={`p-1.5 rounded ${dark ? 'text-rose-400 hover:bg-rose-500/15' : 'text-red-600 hover:bg-red-50'}`}
                  title="Clear History" aria-label="Clear history" type="button">
                  <LuTrash2 size={18} />
                </button>
                <button onClick={() => setShowHistory(false)}
                  className={`md:hidden p-1.5 rounded ${dark ? 'text-gray-400 hover:bg-white/[0.08]' : 'text-gray-600 hover:bg-gray-200'}`}
                  aria-label="Close history" type="button">
                  <LuX size={18} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2" role={history.length > 0 ? "list" : undefined}>
              {history.length === 0 ? (
                <div className={`text-center mt-10 text-sm ${dark ? 'text-gray-500' : 'text-gray-600'}`}>No history yet</div>
              ) : (
                history.map((item, idx) => (
                  <div key={idx}
                    className={`p-3 mb-2 rounded-lg cursor-pointer border border-transparent transition-all ${dark ? 'hover:bg-white/[0.06] hover:border-white/[0.06]' : 'hover:bg-gray-50 hover:border-gray-100'}`}
                    onClick={() => { setInput(item.expression); setResult(item.result); }}
                    role="listitem" tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setInput(item.expression); setResult(item.result); } }}>
                    <div className={`text-sm text-right font-mono truncate ${dark ? 'text-gray-500' : 'text-gray-600'}`}>{item.expression}</div>
                    <div className={`text-lg text-right font-bold ${dark ? 'text-gray-100' : 'text-gray-900'}`}>= {formatWithCommas(item.result)}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Keyboard Shortcuts Modal */}
          {showKeyboardHelp && (
            <div className="absolute z-30 inset-0 flex items-center justify-center"
              onClick={() => setShowKeyboardHelp(false)}>
              <div className={`mx-4 p-5 rounded-xl shadow-2xl max-w-sm w-full ${dark ? 'bg-[#1a2236] border border-white/[0.08] shadow-black/60' : 'bg-white border border-gray-200'}`}
                onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className={`font-bold text-lg ${dark ? 'text-gray-100' : 'text-gray-900'}`}>
                    Keyboard Shortcuts
                  </h3>
                  <button onClick={() => setShowKeyboardHelp(false)}
                    className={`p-1 rounded ${dark ? 'text-gray-400 hover:bg-white/[0.08]' : 'text-gray-600 hover:bg-gray-200'}`}
                    type="button" aria-label="Close">
                    <LuX size={18} />
                  </button>
                </div>
                <div className="space-y-1.5">
                  {shortcuts.map((s, i) => (
                    <div key={i} className={`flex justify-between items-center py-1.5 px-2 rounded ${dark ? 'even:bg-white/[0.04]' : 'even:bg-gray-50'}`}>
                      <kbd className={`px-2 py-0.5 rounded text-xs font-mono font-bold min-w-[80px] text-center ${dark ? 'bg-white/[0.08] text-gray-200 border border-white/[0.08]' : 'bg-gray-100 text-gray-800 border border-gray-300'}`}>
                        {s.key}
                      </kbd>
                      <span className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-600'}`}>{s.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Keypad - 9 rows × 5 cols */}
          <div className={`flex-1 p-4 ${dark ? 'bg-[#0f1420]' : 'bg-white'}`} data-hide-feedback>
            <div className="grid grid-cols-5 gap-2 sm:gap-3">

              {/* Row 1: Mode Toggle & Trig */}
              <Button dark={dark}
                label={funcModeLabels[funcMode]}
                onClick={() => setFuncMode(prev => (prev + 1) % 4)}
                styleType={funcMode === 0 ? 'function' : (isHyp ? 'hyp' : 'action')}
                ariaLabel="Function mode toggle"
                tooltip="Cycle: 2nd → INV → HYP → H⁻¹"
              />
              {(['sin', 'cos', 'tan'] as const).map(fn => (
                <Button key={fn} dark={dark}
                  label={trigConfig[fn].labels[funcMode]}
                  onClick={() => { addToDisplay(trigConfig[fn].actions[funcMode]); setFuncMode(0); }}
                  styleType="function"
                  ariaLabel={trigConfig[fn].aria[funcMode]}
                  tooltip={tooltips[trigConfig[fn].labels[funcMode]]}
                />
              ))}
              <Button dark={dark} label="AC" onClick={handleClear} styleType="warning" ariaLabel="All Clear" tooltip="Clear all (Esc)" />

              {/* Row 2: Powers & Logs */}
              <Button dark={dark} label={isInverse ? "x³" : "x²"} onClick={() => addToDisplay(isInverse ? '^3' : '^2')} styleType="function" ariaLabel={isInverse ? "Cube" : "Square"} />
              <Button dark={dark} label="n!" onClick={() => addToDisplay('!')} styleType="function" ariaLabel="Factorial" />
              <Button dark={dark} label={isInverse ? "eˣ" : "ln"} onClick={() => { addToDisplay(isInverse ? 'e^(' : 'log('); setFuncMode(0); }} styleType="function" ariaLabel={isInverse ? "e to the power" : "Natural logarithm"} />
              <Button dark={dark} label={isInverse ? "10ˣ" : "log"} onClick={() => { addToDisplay(isInverse ? '10^(' : 'log10('); setFuncMode(0); }} styleType="function" ariaLabel={isInverse ? "10 to the power" : "Logarithm base 10"} />
              <Button dark={dark} label={<LuDelete size={20} />} onClick={handleBackspace} styleType="warning" ariaLabel="Backspace" tooltip="Delete (Backspace)" />

              {/* Row 3: New Functions */}
              <Button dark={dark} label="|x|" onClick={() => addToDisplay('abs(')} styleType="function" ariaLabel="Absolute value" />
              <Button dark={dark} label="EXP" onClick={() => addToDisplay('×10^(')} styleType="function" ariaLabel="Scientific notation" className="text-sm" />
              <Button dark={dark} label="Ans" onClick={() => addToDisplay('Ans')} styleType="function" ariaLabel="Previous answer" />
              <Button dark={dark} label="1/x" onClick={() => addToDisplay('^(-1)')} styleType="function" ariaLabel="Reciprocal" />
              <Button dark={dark} label="+/−" onClick={handlePlusMinus} styleType="function" ariaLabel="Toggle sign" />

              {/* Row 4: Parentheses & Special */}
              <Button dark={dark} label="(" onClick={() => addToDisplay('(')} styleType="function" ariaLabel="Open parenthesis" />
              <Button dark={dark} label=")" onClick={() => addToDisplay(')')} styleType="function" ariaLabel="Close parenthesis" />
              <Button dark={dark} label="," onClick={() => addToDisplay(',')} styleType="function" ariaLabel="Comma" tooltip="Separator for nPr, nCr" />
              <Button dark={dark} label={isInverse ? "nCr" : "nPr"} onClick={() => { addToDisplay(isInverse ? 'nCr(' : 'nPr('); setFuncMode(0); }} styleType="function" ariaLabel={isInverse ? "Combinations" : "Permutations"} />
              <Button dark={dark} label={isInverse ? "mod" : "%"} onClick={() => { if (isInverse) { addToDisplay('mod('); setFuncMode(0); } else { addToDisplay('/100'); } }} styleType="function" ariaLabel={isInverse ? "Modulo" : "Percent"} />

              {/* Row 5: Memory & Random */}
              <Button dark={dark} label="MC" onClick={handleMemoryClear} styleType="memory" ariaLabel="Memory Clear" />
              <Button dark={dark} label="MR" onClick={handleMemoryRecall} styleType="memory" ariaLabel="Memory Recall" />
              <Button dark={dark} label="M+" onClick={handleMemoryAdd} styleType="memory" ariaLabel="Memory Add" />
              <Button dark={dark} label="M−" onClick={handleMemorySubtract} styleType="memory" ariaLabel="Memory Subtract" />
              <Button dark={dark} label="Rand" onClick={handleRandom} styleType="memory" ariaLabel="Random number" />

              {/* Row 6: Numbers */}
              <Button dark={dark} label="π" onClick={() => addToDisplay('π')} styleType="function" ariaLabel="Pi" />
              <Button dark={dark} label="7" onClick={() => addToDisplay('7')} styleType="number" />
              <Button dark={dark} label="8" onClick={() => addToDisplay('8')} styleType="number" />
              <Button dark={dark} label="9" onClick={() => addToDisplay('9')} styleType="number" />
              <Button dark={dark} label="÷" onClick={() => addToDisplay('÷')} styleType="operator" ariaLabel="Divide" />

              {/* Row 7 */}
              <Button dark={dark} label="e" onClick={() => addToDisplay('e')} styleType="function" ariaLabel="Euler's number" />
              <Button dark={dark} label="4" onClick={() => addToDisplay('4')} styleType="number" />
              <Button dark={dark} label="5" onClick={() => addToDisplay('5')} styleType="number" />
              <Button dark={dark} label="6" onClick={() => addToDisplay('6')} styleType="number" />
              <Button dark={dark} label="×" onClick={() => addToDisplay('×')} styleType="operator" ariaLabel="Multiply" />

              {/* Row 8 */}
              <Button dark={dark} label={isInverse ? "³√" : "√"} onClick={() => { addToDisplay(isInverse ? 'cbrt(' : '√('); setFuncMode(0); }} styleType="function" ariaLabel={isInverse ? "Cube root" : "Square root"} />
              <Button dark={dark} label="1" onClick={() => addToDisplay('1')} styleType="number" />
              <Button dark={dark} label="2" onClick={() => addToDisplay('2')} styleType="number" />
              <Button dark={dark} label="3" onClick={() => addToDisplay('3')} styleType="number" />
              <Button dark={dark} label="-" onClick={() => addToDisplay('-')} styleType="operator" ariaLabel="Subtract" />

              {/* Row 9 */}
              <Button dark={dark} label="x^y" onClick={() => addToDisplay('^')} styleType="function" ariaLabel="Power" />
              <Button dark={dark} label="0" onClick={() => addToDisplay('0')} styleType="number" />
              <Button dark={dark} label="." onClick={() => addToDisplay('.')} styleType="number" ariaLabel="Decimal point" />
              <Button dark={dark} label="=" onClick={handleCalculate} styleType="action" ariaLabel="Calculate" tooltip="Calculate (Enter)" />
              <Button dark={dark} label="+" onClick={() => addToDisplay('+')} styleType="operator" ariaLabel="Add" />
            </div>
          </div>
        </div>
      </div>

      {!showHistory && (
        <div className={`md:hidden mt-4 text-center text-sm ${dark ? 'text-gray-500' : 'text-gray-600'}`}>
          Press the history icon <LuHistory className="inline" aria-hidden="true" /> to view past calculations
        </div>
      )}
    </div>
  );
};

export default ScientificCalculator;

"use client";

import React, { useState, useEffect, useRef } from 'react';
import { create, all } from 'mathjs';
import { LuHistory, LuDelete, LuTrash2, LuX, LuCopy, LuCheck } from 'react-icons/lu';
import { useTheme } from '@/contexts/ThemeContext';

// Initialize mathjs
const config = { };
const math = create(all, config);

// Custom degree-output inverse trig functions
math.import({
  asind: (x: number) => Math.asin(x) * (180 / Math.PI),
  acosd: (x: number) => Math.acos(x) * (180 / Math.PI),
  atand: (x: number) => Math.atan(x) * (180 / Math.PI),
}, { override: true });

interface HistoryItem {
  expression: string;
  result: string;
}

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

  // Load history & lastResult on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('calc_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    const savedLast = localStorage.getItem('calc_last_result');
    if (savedLast) setLastResult(savedLast);
  }, []);

  // Save history
  useEffect(() => {
    localStorage.setItem('calc_history', JSON.stringify(history));
  }, [history]);

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

        // Forward trig → degree input (lookbehind avoids asind/sinh etc.)
        ['sin', 'cos', 'tan'].forEach(func => {
          const regex = new RegExp(`(?<![a-zA-Z])${func}\\(([0-9.]+)`, 'g');
          expr = expr.replace(regex, `${func}($1 deg`);
        });
      }

      const res = math.evaluate(expr);
      if (typeof res === 'number' || typeof res === 'object') {
        return math.format(res, { precision: 14 });
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
    try {
      const finalRes = calculateResult(input);
      if (finalRes) {
        setResult(finalRes);
        setError(false);
        setLastResult(finalRes);
        localStorage.setItem('calc_last_result', finalRes);
        setHistory(prev => [{ expression: input, result: finalRes }, ...prev].slice(0, 50));
        setIsFinalResult(true);
      } else {
        setError(true);
        setResult('Error');
      }
    } catch {
      setError(true);
      setResult('Error');
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

  const vibrate = () => { if (navigator.vibrate) navigator.vibrate(10); };

  // Button component
  const Button = ({ label, onClick, className = "", styleType = "default", ariaLabel = "" }: any) => {
    const handleClick = () => { vibrate(); onClick(); };
    const baseStyle = "h-12 sm:h-14 rounded-lg font-medium text-lg transition-all duration-200 active:scale-95 flex items-center justify-center select-none shadow-sm cursor-pointer";
    const styles = dark ? {
      default: "bg-slate-700 text-slate-100 font-bold border border-slate-600 hover:bg-slate-600",
      number: "bg-slate-700 text-slate-100 font-bold border border-slate-600 hover:bg-slate-600",
      operator: "bg-blue-900/50 text-blue-300 border border-blue-800 hover:bg-blue-900/70 font-semibold",
      function: "bg-slate-600 text-slate-200 border border-slate-500 hover:bg-slate-500 text-base font-medium",
      action: "bg-blue-600 text-white hover:bg-blue-500 shadow-md border-transparent",
      warning: "bg-red-900/40 text-red-400 hover:bg-red-900/60 border border-red-800",
      hyp: "bg-indigo-600 text-white hover:bg-indigo-500 shadow-md border-transparent",
    } : {
      default: "bg-white text-gray-900 font-bold border border-gray-300 hover:bg-gray-50",
      number: "bg-white text-gray-900 font-bold border border-gray-300 hover:bg-gray-50",
      operator: "bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 font-semibold",
      function: "bg-slate-100 text-slate-800 border border-slate-300 hover:bg-slate-200 text-base font-medium",
      action: "bg-blue-600 text-white hover:bg-blue-700 shadow-md border-transparent",
      warning: "bg-red-50 text-red-700 hover:bg-red-100 border border-red-300",
      hyp: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md border-transparent",
    };
    // @ts-ignore
    const appliedStyle = styles[styleType] || styles.default;
    return (
      <button onClick={handleClick} className={`${baseStyle} ${appliedStyle} ${className}`}
        aria-label={ariaLabel || (typeof label === 'string' ? label : undefined)} type="button">
        {label}
      </button>
    );
  };

  return (
    <div className="w-full max-w-lg mx-auto p-4">
      <div className={`rounded-2xl shadow-xl overflow-hidden ${dark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'}`}>

        {/* Display Area */}
        <div className={`relative p-6 text-right min-h-[140px] flex flex-col justify-end ${dark ? 'bg-slate-900 border-b border-slate-700' : 'bg-gray-50 border-b border-gray-200'}`}>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`absolute top-4 left-4 p-2 rounded-full transition-colors ${dark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-700' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'}`}
            title="History" aria-label="View history" type="button"
          >
            <LuHistory size={20} />
          </button>

          {/* Deg/Rad Toggle */}
          <div
            className={`absolute top-4 right-4 flex rounded-md p-0.5 text-xs font-medium ${dark ? 'bg-slate-700' : 'bg-gray-200'}`}
            role="radiogroup" aria-label="Angle mode"
          >
            <button onClick={() => setIsDegree(true)} role="radio" aria-checked={isDegree} type="button"
              className={`px-2 py-1 rounded ${isDegree ? (dark ? 'bg-slate-500 text-blue-300 shadow-sm font-bold' : 'bg-white text-blue-800 shadow-sm font-bold') : (dark ? 'text-slate-400' : 'text-gray-700')}`}>
              DEG
            </button>
            <button onClick={() => setIsDegree(false)} role="radio" aria-checked={!isDegree} type="button"
              className={`px-2 py-1 rounded ${!isDegree ? (dark ? 'bg-slate-500 text-blue-300 shadow-sm font-bold' : 'bg-white text-blue-800 shadow-sm font-bold') : (dark ? 'text-slate-400' : 'text-gray-700')}`}>
              RAD
            </button>
          </div>

          {/* Expression + Parentheses Counter */}
          <div className="flex items-end gap-1">
            <div ref={inputRef}
              className={`flex-1 text-lg font-medium whitespace-nowrap overflow-x-auto overflow-y-hidden custom-scroll mb-2 min-h-[28px] pb-1 leading-tight ${dark ? 'text-slate-300' : 'text-gray-700'}`}
              role="region" aria-live="polite" aria-label="Expression">
              {input || ''}
            </div>
            {openParens > 0 && (
              <span className={`text-xs mb-2 whitespace-nowrap font-mono ${dark ? 'text-amber-400' : 'text-amber-600'}`}>
                {')'}&times;{openParens}
              </span>
            )}
          </div>

          {/* Result + Copy */}
          <div className="flex items-center gap-2">
            <div ref={resultRef}
              className={`flex-1 min-w-0 text-3xl font-bold tracking-tight whitespace-nowrap overflow-x-auto overflow-y-hidden custom-scroll pb-1 leading-tight ${error ? 'text-red-500' : (dark ? 'text-slate-100' : 'text-gray-900')}`}
              aria-label="Result" aria-live="polite">
              {result}
            </div>
            {result && result !== '0' && !error && (
              <button
                onClick={() => { navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
                className={`flex-shrink-0 p-1.5 rounded-lg transition-colors ${copied ? (dark ? 'text-green-400' : 'text-green-600') : (dark ? 'text-slate-500 hover:text-slate-300 hover:bg-slate-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200')}`}
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
            ${dark ? 'bg-slate-800 border-r border-slate-700' : 'bg-white border-r border-gray-200'}
          `}>
            <div className={`flex justify-between items-center p-4 ${dark ? 'border-b border-slate-700 bg-slate-900' : 'border-b border-gray-100 bg-gray-50'}`}>
              <span className={`font-semibold flex items-center gap-2 ${dark ? 'text-slate-200' : 'text-gray-800'}`}>
                <LuHistory aria-hidden="true" /> History
              </span>
              <div className="flex gap-2">
                <button onClick={handleClearHistory}
                  className={`p-1.5 rounded ${dark ? 'text-red-400 hover:bg-red-900/40' : 'text-red-600 hover:bg-red-50'}`}
                  title="Clear History" aria-label="Clear history" type="button">
                  <LuTrash2 size={18} />
                </button>
                <button onClick={() => setShowHistory(false)}
                  className={`md:hidden p-1.5 rounded ${dark ? 'text-slate-400 hover:bg-slate-700' : 'text-gray-600 hover:bg-gray-200'}`}
                  aria-label="Close history" type="button">
                  <LuX size={18} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2" role={history.length > 0 ? "list" : undefined}>
              {history.length === 0 ? (
                <div className={`text-center mt-10 text-sm ${dark ? 'text-slate-400' : 'text-gray-600'}`}>No history yet</div>
              ) : (
                history.map((item, idx) => (
                  <div key={idx}
                    className={`p-3 mb-2 rounded-lg cursor-pointer border border-transparent transition-all ${dark ? 'hover:bg-slate-700 hover:border-slate-600' : 'hover:bg-gray-50 hover:border-gray-100'}`}
                    onClick={() => { setInput(item.expression); setResult(item.result); }}
                    role="listitem" tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setInput(item.expression); setResult(item.result); } }}>
                    <div className={`text-sm text-right font-mono truncate ${dark ? 'text-slate-400' : 'text-gray-600'}`}>{item.expression}</div>
                    <div className={`text-lg text-right font-bold ${dark ? 'text-slate-100' : 'text-gray-900'}`}>= {item.result}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Keypad - 8 rows x 5 cols */}
          <div className={`flex-1 p-4 ${dark ? 'bg-slate-800' : 'bg-white'}`}>
            <div className="grid grid-cols-5 gap-2 sm:gap-3">

              {/* Row 1: Mode Toggle & Trig */}
              <Button
                label={funcModeLabels[funcMode]}
                onClick={() => setFuncMode(prev => (prev + 1) % 4)}
                styleType={funcMode === 0 ? 'function' : (isHyp ? 'hyp' : 'action')}
                ariaLabel="Function mode toggle"
              />
              {(['sin', 'cos', 'tan'] as const).map(fn => (
                <Button key={fn}
                  label={trigConfig[fn].labels[funcMode]}
                  onClick={() => { addToDisplay(trigConfig[fn].actions[funcMode]); setFuncMode(0); }}
                  styleType="function"
                  ariaLabel={trigConfig[fn].aria[funcMode]}
                />
              ))}
              <Button label="AC" onClick={handleClear} styleType="warning" ariaLabel="All Clear" />

              {/* Row 2: Powers & Logs */}
              <Button label={isInverse ? "x³" : "x²"} onClick={() => addToDisplay(isInverse ? '^3' : '^2')} styleType="function" ariaLabel={isInverse ? "Cube" : "Square"} />
              <Button label="n!" onClick={() => addToDisplay('!')} styleType="function" ariaLabel="Factorial" />
              <Button label={isInverse ? "eˣ" : "ln"} onClick={() => { addToDisplay(isInverse ? 'e^(' : 'log('); setFuncMode(0); }} styleType="function" ariaLabel={isInverse ? "e to the power" : "Natural logarithm"} />
              <Button label={isInverse ? "10ˣ" : "log"} onClick={() => { addToDisplay(isInverse ? '10^(' : 'log10('); setFuncMode(0); }} styleType="function" ariaLabel={isInverse ? "10 to the power" : "Logarithm base 10"} />
              <Button label={<LuDelete size={20} />} onClick={handleBackspace} styleType="warning" ariaLabel="Backspace" />

              {/* Row 3: New Functions */}
              <Button label="|x|" onClick={() => addToDisplay('abs(')} styleType="function" ariaLabel="Absolute value" />
              <Button label="EXP" onClick={() => addToDisplay('×10^(')} styleType="function" ariaLabel="Scientific notation" className="text-sm" />
              <Button label="Ans" onClick={() => addToDisplay('Ans')} styleType="function" ariaLabel="Previous answer" />
              <Button label="1/x" onClick={() => addToDisplay('^(-1)')} styleType="function" ariaLabel="Reciprocal" />
              <Button label="+/−" onClick={handlePlusMinus} styleType="function" ariaLabel="Toggle sign" />

              {/* Row 4: Parentheses & Special */}
              <Button label="(" onClick={() => addToDisplay('(')} styleType="function" ariaLabel="Open parenthesis" />
              <Button label=")" onClick={() => addToDisplay(')')} styleType="function" ariaLabel="Close parenthesis" />
              <Button label="," onClick={() => addToDisplay(',')} styleType="function" ariaLabel="Comma" />
              <Button label={isInverse ? "nCr" : "nPr"} onClick={() => { addToDisplay(isInverse ? 'nCr(' : 'nPr('); setFuncMode(0); }} styleType="function" ariaLabel={isInverse ? "Combinations" : "Permutations"} />
              <Button label={isInverse ? "mod" : "%"} onClick={() => { if (isInverse) { addToDisplay('mod('); setFuncMode(0); } else { addToDisplay('/100'); } }} styleType="function" ariaLabel={isInverse ? "Modulo" : "Percent"} />

              {/* Row 5: Numbers */}
              <Button label="π" onClick={() => addToDisplay('π')} styleType="function" ariaLabel="Pi" />
              <Button label="7" onClick={() => addToDisplay('7')} styleType="number" />
              <Button label="8" onClick={() => addToDisplay('8')} styleType="number" />
              <Button label="9" onClick={() => addToDisplay('9')} styleType="number" />
              <Button label="÷" onClick={() => addToDisplay('÷')} styleType="operator" ariaLabel="Divide" />

              {/* Row 6 */}
              <Button label="e" onClick={() => addToDisplay('e')} styleType="function" ariaLabel="Euler's number" />
              <Button label="4" onClick={() => addToDisplay('4')} styleType="number" />
              <Button label="5" onClick={() => addToDisplay('5')} styleType="number" />
              <Button label="6" onClick={() => addToDisplay('6')} styleType="number" />
              <Button label="×" onClick={() => addToDisplay('×')} styleType="operator" ariaLabel="Multiply" />

              {/* Row 7 */}
              <Button label={isInverse ? "³√" : "√"} onClick={() => { addToDisplay(isInverse ? 'cbrt(' : '√('); setFuncMode(0); }} styleType="function" ariaLabel={isInverse ? "Cube root" : "Square root"} />
              <Button label="1" onClick={() => addToDisplay('1')} styleType="number" />
              <Button label="2" onClick={() => addToDisplay('2')} styleType="number" />
              <Button label="3" onClick={() => addToDisplay('3')} styleType="number" />
              <Button label="-" onClick={() => addToDisplay('-')} styleType="operator" ariaLabel="Subtract" />

              {/* Row 8 */}
              <Button label="x^y" onClick={() => addToDisplay('^')} styleType="function" ariaLabel="Power" />
              <Button label="0" onClick={() => addToDisplay('0')} styleType="number" />
              <Button label="." onClick={() => addToDisplay('.')} styleType="number" ariaLabel="Decimal point" />
              <Button label="=" onClick={handleCalculate} styleType="action" ariaLabel="Calculate" />
              <Button label="+" onClick={() => addToDisplay('+')} styleType="operator" ariaLabel="Add" />
            </div>
          </div>
        </div>
      </div>

      {!showHistory && (
        <div className={`md:hidden mt-4 text-center text-sm ${dark ? 'text-slate-400' : 'text-gray-600'}`}>
          Press the history icon <LuHistory className="inline" aria-hidden="true" /> to view past calculations
        </div>
      )}
    </div>
  );
};

export default ScientificCalculator;

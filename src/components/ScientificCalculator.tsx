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
  const [input, setInput] = useState('');     // User's formula input (Top line)
  const [result, setResult] = useState('0');  // Calculated result OR Error message (Bottom line)
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isDegree, setIsDegree] = useState(true);
  const [isInverse, setIsInverse] = useState(false);
  const [error, setError] = useState(false);
  
  // Ref for auto-scrolling input
  const inputRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null); // Ref for result scroll as well
  
  // Track if the last action was "=" so we know if next input starts fresh
  const [isFinalResult, setIsFinalResult] = useState(false);
  const [copied, setCopied] = useState(false);

  // Keyboard input support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if focus is on an input/textarea/contenteditable
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable) return;

      const key = e.key;

      if (/^[0-9]$/.test(key)) {
        addToDisplay(key);
      } else if (key === '+') {
        addToDisplay('+');
      } else if (key === '-') {
        addToDisplay('-');
      } else if (key === '*') {
        addToDisplay('×');
      } else if (key === '/') {
        e.preventDefault();
        addToDisplay('÷');
      } else if (key === '.') {
        addToDisplay('.');
      } else if (key === '(' || key === ')') {
        addToDisplay(key);
      } else if (key === 'Enter' || key === '=') {
        e.preventDefault();
        handleCalculate();
      } else if (key === 'Backspace') {
        handleBackspace();
      } else if (key === 'Escape' || key === 'c' || key === 'C') {
        handleClear();
      } else if (key === '%') {
        addToDisplay('/100');
      } else if (key === '^') {
        addToDisplay('^');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Load history from local storage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('calc_history');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Save history to local storage whenever it changes
  useEffect(() => {
    localStorage.setItem('calc_history', JSON.stringify(history));
  }, [history]);

  // Live Calculation Effect
  useEffect(() => {
    if (!input) {
      setResult('0');
      setError(false);
      return;
    }
    
    // Don't live calc if we just hit equals
    if (isFinalResult) return;

    try {
      const liveRes = calculateResult(input);
      if (liveRes !== null) {
        setResult(liveRes);
        setError(false);
      }
    } catch (e) {
      // Incomplete expression, just ignore
    }
  }, [input, isDegree]);

  // Auto-scroll input to the right when it changes
  useEffect(() => {
    if (inputRef.current) {
        // Use requestAnimationFrame to ensure the scroll happens after the DOM update
        requestAnimationFrame(() => {
            if (inputRef.current) {
                inputRef.current.scrollLeft = inputRef.current.scrollWidth;
            }
        });
    }
  }, [input]);

  const calculateResult = (expression: string): string | null => {
    try {
      let expr = expression;

      // Replace visual symbols with math operators
      expr = expr.replace(/×/g, '*')
                 .replace(/÷/g, '/')
                 .replace(/π/g, 'pi')
                 .replace(/√\(/g, 'sqrt(');

      // Replace nPr/nCr with mathjs functions
      expr = expr.replace(/nPr\(/g, 'permutations(')
                 .replace(/nCr\(/g, 'combinations(');

      if (isDegree) {
         // Convert inverse trig to degree-output versions FIRST
         expr = expr.replace(/asin\(/g, 'asind(')
                    .replace(/acos\(/g, 'acosd(')
                    .replace(/atan\(/g, 'atand(');

         // Then convert forward trig input from degrees (with lookbehind to avoid matching asind/acosd/atand)
         const trigFunctions = ['sin', 'cos', 'tan'];
         trigFunctions.forEach(func => {
            const regex = new RegExp(`(?<![a-zA-Z])${func}\\(([0-9.]+)`, 'g');
            expr = expr.replace(regex, `${func}($1 deg`);
         });
      }

      const res = math.evaluate(expr);

      // Format result
      if (typeof res === 'number' || typeof res === 'object') {
          return math.format(res, { precision: 14 });
      }
      return String(res);

    } catch (err) {
      return null;
    }
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem('calc_history');
  };

  const addToDisplay = (val: string) => {
    if (isFinalResult) {
       // Continue with result for operators and postfix operations
       const continueWithResult = ['+', '-', '×', '÷'].includes(val) ||
                                   val.startsWith('^') || val === '!' || val === '/100';
       if (continueWithResult) {
         setInput(result + val);
         setError(false);
         setResult(result);
       } else {
         setInput(val); // Start fresh
         setError(false);
         setResult('0');
       }
       setIsFinalResult(false);
    } else {
       // Normal typing
       if (error) {
         setError(false);
       }
       setInput(prev => prev + val);
    }
  };

  const handleClear = () => {
    setInput('');
    setResult('0');
    setError(false);
    setIsFinalResult(false);
  };

  const handleBackspace = () => {
    if (isFinalResult) {
      handleClear();
      return;
    }
    if (input.length <= 1) {
      setInput('');
      setResult('0');
    } else {
      setInput(prev => prev.slice(0, -1));
    }
    setError(false); 
  };

  const handleCalculate = () => {
    if (!input) return;

    try {
      const finalRes = calculateResult(input);
      
      if (finalRes) {
        setResult(finalRes);
        setError(false);
        
        // Add to history
        const newHistoryItem = { expression: input, result: finalRes };
        setHistory(prev => [newHistoryItem, ...prev].slice(0, 50));
        
        // Mark as final so next input handles correctly
        setIsFinalResult(true);
      } else {
        setError(true);
        setResult('Error');
      }
    } catch (err) {
      setError(true);
      setResult('Error');
    }
  };

  // 진동 피드백 (Android만 지원, iOS는 미지원)
  const vibrate = () => {
    if (navigator.vibrate) {
      navigator.vibrate(10); // 10ms 짧은 진동
    }
  };

  // Button components
  const Button = ({ label, onClick, className = "", styleType = "default", ariaLabel = "" }: any) => {
    const handleClick = () => {
      vibrate();
      onClick();
    };

    const baseStyle = "h-12 sm:h-14 rounded-lg font-medium text-lg transition-all duration-200 active:scale-95 flex items-center justify-center select-none shadow-sm cursor-pointer";

    const styles = dark ? {
      default: "bg-slate-700 text-slate-100 font-bold border border-slate-600 hover:bg-slate-600",
      number: "bg-slate-700 text-slate-100 font-bold border border-slate-600 hover:bg-slate-600",
      operator: "bg-blue-900/50 text-blue-300 border border-blue-800 hover:bg-blue-900/70 font-semibold",
      function: "bg-slate-600 text-slate-200 border border-slate-500 hover:bg-slate-500 text-base font-medium",
      action: "bg-blue-600 text-white hover:bg-blue-500 shadow-md border-transparent",
      warning: "bg-red-900/40 text-red-400 hover:bg-red-900/60 border border-red-800",
    } : {
      default: "bg-white text-gray-900 font-bold border border-gray-300 hover:bg-gray-50",
      number: "bg-white text-gray-900 font-bold border border-gray-300 hover:bg-gray-50",
      operator: "bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 font-semibold",
      function: "bg-slate-100 text-slate-800 border border-slate-300 hover:bg-slate-200 text-base font-medium",
      action: "bg-blue-600 text-white hover:bg-blue-700 shadow-md border-transparent",
      warning: "bg-red-50 text-red-700 hover:bg-red-100 border border-red-300",
    };

    // @ts-ignore
    const appliedStyle = styles[styleType] || styles.default;

    return (
      <button
        onClick={handleClick}
        className={`${baseStyle} ${appliedStyle} ${className}`}
        aria-label={ariaLabel || (typeof label === 'string' ? label : undefined)}
        type="button"
      >
        {label}
      </button>
    );
  };

  return (
    // Max width limited to lg (approx 512px) for better desktop layout
    <div className="w-full max-w-lg mx-auto p-4">
      <div className={`rounded-2xl shadow-xl overflow-hidden ${dark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'}`}>
        
        {/* Display Area: 2-Line Structure */}
        <div className={`relative p-6 text-right min-h-[140px] flex flex-col justify-end ${dark ? 'bg-slate-900 border-b border-slate-700' : 'bg-gray-50 border-b border-gray-200'}`}>
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className={`absolute top-4 left-4 p-2 rounded-full transition-colors ${dark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-700' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'}`}
            title="History"
            aria-label="View history"
            type="button"
          >
            <LuHistory size={20} />
          </button>
          
           {/* Deg/Rad Toggle Indicator */}
           <div 
             className={`absolute top-4 right-4 flex rounded-md p-0.5 text-xs font-medium ${dark ? 'bg-slate-700' : 'bg-gray-200'}`}
             role="radiogroup" 
             aria-label="Angle mode"
           >
            <button 
              onClick={() => setIsDegree(true)}
              className={`px-2 py-1 rounded ${isDegree ? (dark ? 'bg-slate-500 text-blue-300 shadow-sm font-bold' : 'bg-white text-blue-800 shadow-sm font-bold') : (dark ? 'text-slate-400' : 'text-gray-700')}`}
              role="radio"
              aria-checked={isDegree}
              type="button"
            >
              DEG
            </button>
            <button
              onClick={() => setIsDegree(false)}
              className={`px-2 py-1 rounded ${!isDegree ? (dark ? 'bg-slate-500 text-blue-300 shadow-sm font-bold' : 'bg-white text-blue-800 shadow-sm font-bold') : (dark ? 'text-slate-400' : 'text-gray-700')}`}
              role="radio"
              aria-checked={!isDegree}
              type="button"
            >
              RAD
            </button>
          </div>

          {/* Top Line: Input Expression 
              - Smaller text (text-lg) 
              - Custom thin scrollbar (custom-scroll)
              - whitespace-nowrap & overflow-x-auto ensures horizontal scrolling
              - explicit overflow-y-hidden prevents vertical scrollbars
              - leading-tight helps fit text verticall
          */}
          <div 
             ref={inputRef}
             className={`w-full text-lg font-medium whitespace-nowrap overflow-x-auto overflow-y-hidden custom-scroll mb-2 min-h-[28px] pb-1 leading-tight ${dark ? 'text-slate-300' : 'text-gray-700'}`}
             role="region"
             aria-live="polite"
             aria-label="Expression"
          >
            {input || ''}
          </div>
          
          {/* Bottom Line: Result + Copy */}
          <div className="flex items-center gap-2">
            <div
              ref={resultRef}
              className={`flex-1 min-w-0 text-3xl font-bold tracking-tight whitespace-nowrap overflow-x-auto overflow-y-hidden custom-scroll pb-1 leading-tight ${error ? 'text-red-500' : (dark ? 'text-slate-100' : 'text-gray-900')}`}
              aria-label="Result"
              aria-live="polite"
            >
              {result}
            </div>
            {result && result !== '0' && !error && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(result);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                className={`flex-shrink-0 p-1.5 rounded-lg transition-colors ${dark ? 'hover:bg-slate-600 text-slate-400' : 'hover:bg-gray-200 text-gray-400'}`}
                aria-label="Copy result"
                title="Copy"
              >
                {copied ? <LuCheck className="w-4 h-4 text-green-500" /> : <LuCopy className="w-4 h-4" />}
              </button>
            )}
          </div>
          
        </div>

        {/* Main Body */}
        <div className="flex flex-col md:flex-row relative">
          
          {/* History Panel Overlay/Sidebar */}
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
                <button 
                   onClick={handleClearHistory}
                   className={`p-1.5 rounded ${dark ? 'text-red-400 hover:bg-red-900/40' : 'text-red-600 hover:bg-red-50'}`}
                   title="Clear History"
                   aria-label="Clear history"
                   type="button"
                >
                  <LuTrash2 size={18} />
                </button>
                <button 
                  onClick={() => setShowHistory(false)}
                  className={`md:hidden p-1.5 rounded ${dark ? 'text-slate-400 hover:bg-slate-700' : 'text-gray-600 hover:bg-gray-200'}`}
                  aria-label="Close history"
                  type="button"
                >
                  <LuX size={18} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2" role={history.length > 0 ? "list" : undefined}>
              {history.length === 0 ? (
                <div className={`text-center mt-10 text-sm ${dark ? 'text-slate-400' : 'text-gray-600'}`}>No history yet</div>
              ) : (
                history.map((item, idx) => (
                  <div 
                    key={idx} 
                    className={`p-3 mb-2 rounded-lg cursor-pointer border border-transparent transition-all ${dark ? 'hover:bg-slate-700 hover:border-slate-600' : 'hover:bg-gray-50 hover:border-gray-100'}`}
                    onClick={() => {
                        setInput(item.expression);
                        setResult(item.result);
                    }}
                    role="listitem"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setInput(item.expression);
                        setResult(item.result);
                      }
                    }}
                  >
                    <div className={`text-sm text-right font-mono truncate ${dark ? 'text-slate-400' : 'text-gray-600'}`}>{item.expression}</div>
                    <div className={`text-lg text-right font-bold ${dark ? 'text-slate-100' : 'text-gray-900'}`}>= {item.result}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Keypad */}
          <div className={`flex-1 p-4 ${dark ? 'bg-slate-800' : 'bg-white'}`}>
            <div className="grid grid-cols-5 gap-2 sm:gap-3">

              {/* Row 1: 2nd Toggle & Trig */}
              <Button label="2nd" onClick={() => setIsInverse(!isInverse)} styleType={isInverse ? "action" : "function"} ariaLabel="Second function toggle" />
              <Button label={isInverse ? "sin⁻¹" : "sin"} onClick={() => { addToDisplay(isInverse ? 'asin(' : 'sin('); setIsInverse(false); }} styleType="function" ariaLabel={isInverse ? "Arc sine" : "Sine"} />
              <Button label={isInverse ? "cos⁻¹" : "cos"} onClick={() => { addToDisplay(isInverse ? 'acos(' : 'cos('); setIsInverse(false); }} styleType="function" ariaLabel={isInverse ? "Arc cosine" : "Cosine"} />
              <Button label={isInverse ? "tan⁻¹" : "tan"} onClick={() => { addToDisplay(isInverse ? 'atan(' : 'tan('); setIsInverse(false); }} styleType="function" ariaLabel={isInverse ? "Arc tangent" : "Tangent"} />
              <Button label="AC" onClick={handleClear} styleType="warning" ariaLabel="All Clear" />

              {/* Row 2: Advanced Functions */}
              <Button label="x²" onClick={() => addToDisplay('^2')} styleType="function" ariaLabel="Square" />
              <Button label="n!" onClick={() => addToDisplay('!')} styleType="function" ariaLabel="Factorial" />
              <Button label={isInverse ? "eˣ" : "ln"} onClick={() => { addToDisplay(isInverse ? 'e^(' : 'log('); setIsInverse(false); }} styleType="function" ariaLabel={isInverse ? "e to the power" : "Natural logarithm"} />
              <Button label={isInverse ? "10ˣ" : "log"} onClick={() => { addToDisplay(isInverse ? '10^(' : 'log10('); setIsInverse(false); }} styleType="function" ariaLabel={isInverse ? "10 to the power" : "Logarithm base 10"} />
              <Button label={<LuDelete size={20} />} onClick={handleBackspace} styleType="warning" ariaLabel="Backspace" />

              {/* Row 3: Parentheses & Special */}
              <Button label="(" onClick={() => addToDisplay('(')} styleType="function" ariaLabel="Open parenthesis" />
              <Button label=")" onClick={() => addToDisplay(')')} styleType="function" ariaLabel="Close parenthesis" />
              <Button label="," onClick={() => addToDisplay(',')} styleType="function" ariaLabel="Comma" />
              <Button label={isInverse ? "nCr" : "nPr"} onClick={() => { addToDisplay(isInverse ? 'nCr(' : 'nPr('); setIsInverse(false); }} styleType="function" ariaLabel={isInverse ? "Combinations" : "Permutations"} />
              <Button label="%" onClick={() => addToDisplay('/100')} styleType="function" ariaLabel="Percent (divide by 100)" />

              {/* Row 4: Numbers */}
              <Button label="π" onClick={() => addToDisplay('π')} styleType="function" ariaLabel="Pi" />
              <Button label="7" onClick={() => addToDisplay('7')} styleType="number" />
              <Button label="8" onClick={() => addToDisplay('8')} styleType="number" />
              <Button label="9" onClick={() => addToDisplay('9')} styleType="number" />
              <Button label="÷" onClick={() => addToDisplay('÷')} styleType="operator" ariaLabel="Divide" />

              {/* Row 5 */}
              <Button label="e" onClick={() => addToDisplay('e')} styleType="function" ariaLabel="Euler's number" />
              <Button label="4" onClick={() => addToDisplay('4')} styleType="number" />
              <Button label="5" onClick={() => addToDisplay('5')} styleType="number" />
              <Button label="6" onClick={() => addToDisplay('6')} styleType="number" />
              <Button label="×" onClick={() => addToDisplay('×')} styleType="operator" ariaLabel="Multiply" />

              {/* Row 6 */}
              <Button label="√" onClick={() => addToDisplay('√(')} styleType="function" ariaLabel="Square root" />
              <Button label="1" onClick={() => addToDisplay('1')} styleType="number" />
              <Button label="2" onClick={() => addToDisplay('2')} styleType="number" />
              <Button label="3" onClick={() => addToDisplay('3')} styleType="number" />
              <Button label="-" onClick={() => addToDisplay('-')} styleType="operator" ariaLabel="Subtract" />

              {/* Row 7 */}
              <Button label="x^y" onClick={() => addToDisplay('^')} styleType="function" ariaLabel="Power" />
              <Button label="0" onClick={() => addToDisplay('0')} styleType="number" />
              <Button label="." onClick={() => addToDisplay('.')} styleType="number" ariaLabel="Decimal point" />
              <Button label="=" onClick={handleCalculate} styleType="action" ariaLabel="Calculate" />
              <Button label="+" onClick={() => addToDisplay('+')} styleType="operator" ariaLabel="Add" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile History Toggle Overlay Help */}
      {!showHistory && (
         <div className={`md:hidden mt-4 text-center text-sm ${dark ? 'text-slate-400' : 'text-gray-600'}`}>
           Press the history icon <LuHistory className="inline" aria-hidden="true" /> to view past calculations
         </div>
      )}
    </div>
  );
};

export default ScientificCalculator;

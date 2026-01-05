"use client";

import React, { useState, useEffect, useRef } from 'react';
import { create, all } from 'mathjs';
import { LuHistory, LuDelete, LuTrash2, LuX } from 'react-icons/lu';

// Initialize mathjs
const config = { };
const math = create(all, config);

interface HistoryItem {
  expression: string;
  result: string;
}

const ScientificCalculator = () => {
  const [input, setInput] = useState('');     // User's formula input (Top line)
  const [result, setResult] = useState('0');  // Calculated result OR Error message (Bottom line)
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isDegree, setIsDegree] = useState(true);
  const [error, setError] = useState(false);
  
  // Ref for auto-scrolling input
  const inputRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null); // Ref for result scroll as well
  
  // Track if the last action was "=" so we know if next input starts fresh
  const [isFinalResult, setIsFinalResult] = useState(false);

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
                 .replace(/e/g, 'e')
                 .replace(/\^/g, '^') // ensure power works
                 .replace(/√\(/g, 'sqrt(');

      if (isDegree) {
         const trigFunctions = ['sin', 'cos', 'tan'];
         trigFunctions.forEach(func => {
            const regex = new RegExp(`${func}\\(([0-9.]+)`, 'g');
            expr = expr.replace(regex, `${func}($1 deg`); 
         });
      }

      const res = math.evaluate(expr);
      
      // Format result
      if (typeof res === 'number' || typeof res === 'object') { // mathjs returns objects for some types
          return math.format(res, { precision: 14 });
      }
      return String(res);
      
    } catch (err) {
      // Return null on error so we don't update result
      return null;
    }
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem('calc_history');
  };

  const addToDisplay = (val: string) => {
    if (isFinalResult) {
       // If we just finished a calc, start new if it's a number, continue if operator
       if (['+', '-', '×', '÷', '^'].includes(val)) {
         setInput(result + val); // Continue with result
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

  // Button components
  const Button = ({ label, onClick, className = "", styleType = "default", ariaLabel = "" }: any) => {
    const baseStyle = "h-12 sm:h-14 rounded-lg font-medium text-lg transition-all duration-200 active:scale-95 flex items-center justify-center select-none shadow-sm cursor-pointer";
    
    // Increased contrast and better visual separation
    const styles = {
      default: "bg-white text-gray-900 font-bold border border-gray-300 hover:bg-gray-50", // Numbers: White with darker text
      number: "bg-white text-gray-900 font-bold border border-gray-300 hover:bg-gray-50",
      operator: "bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 font-semibold",
      function: "bg-slate-100 text-slate-800 border border-slate-300 hover:bg-slate-200 text-base font-medium", // Darkened text for A11y
      action: "bg-blue-600 text-white hover:bg-blue-700 shadow-md border-transparent",
      warning: "bg-red-50 text-red-700 hover:bg-red-100 border border-red-300", // Darkened red for A11y
    };

    // @ts-ignore
    const appliedStyle = styles[styleType] || styles.default;

    return (
      <button 
        onClick={onClick}
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
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
        
        {/* Display Area: 2-Line Structure */}
        <div className="relative bg-gray-50 p-6 text-right border-b border-gray-200 min-h-[140px] flex flex-col justify-end">
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className="absolute top-4 left-4 p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-full transition-colors" // Darkened for A11y
            title="History"
            aria-label="View history"
            type="button"
          >
            <LuHistory size={20} />
          </button>
          
           {/* Deg/Rad Toggle Indicator */}
           <div 
             className="absolute top-4 right-4 flex bg-gray-200 rounded-md p-0.5 text-xs font-medium"
             role="radiogroup" 
             aria-label="Angle mode"
           >
            <button 
              onClick={() => setIsDegree(true)}
              className={`px-2 py-1 rounded ${isDegree ? 'bg-white text-blue-800 shadow-sm font-bold' : 'text-gray-700'}`} // Darkened for A11y
              role="radio"
              aria-checked={isDegree}
              type="button"
            >
              DEG
            </button>
            <button 
              onClick={() => setIsDegree(false)}
              className={`px-2 py-1 rounded ${!isDegree ? 'bg-white text-blue-800 shadow-sm font-bold' : 'text-gray-700'}`} // Darkened for A11y
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
             className="w-full text-lg text-gray-700 font-medium whitespace-nowrap overflow-x-auto overflow-y-hidden custom-scroll mb-2 min-h-[28px] pb-1 leading-tight" // Darkened text
             role="region"
             aria-live="polite"
             aria-label="Expression"
          >
            {input || ''}
          </div>
          
          {/* Bottom Line: Result
              - Large text (text-3xl)
              - Bold
              - Custom thin scrollbar
              - explicit overflow-y-hidden prevents vertical scrollbars
          */}
          <div 
            ref={resultRef}
            className={`w-full text-3xl font-bold tracking-tight whitespace-nowrap overflow-x-auto overflow-y-hidden custom-scroll pb-1 leading-tight ${error ? 'text-red-600' : 'text-gray-900'}`} // Darkened red
            aria-label="Result"
            aria-live="polite"
          >
            {result}
          </div>
          
        </div>

        {/* Main Body */}
        <div className="flex flex-col md:flex-row relative">
          
          {/* History Panel Overlay/Sidebar */}
          <div className={`
            absolute md:static z-20 top-0 left-0 h-full w-full md:w-64 bg-white border-r border-gray-200 
            transition-all duration-300 ease-in-out transform
            ${showHistory ? 'translate-x-0' : '-translate-x-full md:hidden'}
            flex flex-col
          `}>
            <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
              <span className="font-semibold text-gray-800 flex items-center gap-2">
                <LuHistory aria-hidden="true" /> History
              </span>
              <div className="flex gap-2">
                <button 
                   onClick={handleClearHistory}
                   className="p-1.5 text-red-600 hover:bg-red-50 rounded" // Darkened red
                   title="Clear History"
                   aria-label="Clear history"
                   type="button"
                >
                  <LuTrash2 size={18} />
                </button>
                <button 
                  onClick={() => setShowHistory(false)}
                  className="md:hidden p-1.5 text-gray-600 hover:bg-gray-200 rounded" // Darkened gray
                  aria-label="Close history"
                  type="button"
                >
                  <LuX size={18} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2" role={history.length > 0 ? "list" : undefined}>
              {history.length === 0 ? (
                <div className="text-center text-gray-600 mt-10 text-sm">No history yet</div>
              ) : (
                history.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="p-3 mb-2 hover:bg-gray-50 rounded-lg cursor-pointer border border-transparent hover:border-gray-100 transition-all"
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
                    <div className="text-sm text-gray-600 text-right font-mono truncate">{item.expression}</div>
                    <div className="text-lg text-gray-900 text-right font-bold">= {item.result}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Keypad */}
          <div className="flex-1 p-4 bg-white">
            <div className="grid grid-cols-5 gap-3"> {/* Increased gap for better mobile UX */}
              
              {/* Row 1: Advanced Functions */}
              <Button label={isDegree ? "Rad" : "Deg"} onClick={() => setIsDegree(!isDegree)} styleType="function" ariaLabel={`Switch to ${isDegree ? "Radians" : "Degrees"} mode`} />
              <Button label="sin" onClick={() => addToDisplay('sin(')} styleType="function" ariaLabel="Sine" />
              <Button label="cos" onClick={() => addToDisplay('cos(')} styleType="function" ariaLabel="Cosine" />
              <Button label="tan" onClick={() => addToDisplay('tan(')} styleType="function" ariaLabel="Tangent" />
              <Button label="AC" onClick={handleClear} styleType="warning" ariaLabel="All Clear" />
              
              {/* Row 2 */}
              <Button label="(" onClick={() => addToDisplay('(')} styleType="function" ariaLabel="Open parenthesis" />
              <Button label=")" onClick={() => addToDisplay(')')} styleType="function" ariaLabel="Close parenthesis" />
              <Button label="ln" onClick={() => addToDisplay('log(')} styleType="function" ariaLabel="Natural logarithm" />
              <Button label="log" onClick={() => addToDisplay('log10(')} styleType="function" ariaLabel="Logarithm base 10" />
              <Button label={<LuDelete size={20} />} onClick={handleBackspace} styleType="warning" ariaLabel="Backspace" />

              {/* Row 3 */}
              <Button label="π" onClick={() => addToDisplay('π')} styleType="function" ariaLabel="Pi" />
              <Button label="7" onClick={() => addToDisplay('7')} styleType="number" />
              <Button label="8" onClick={() => addToDisplay('8')} styleType="number" />
              <Button label="9" onClick={() => addToDisplay('9')} styleType="number" />
              <Button label="÷" onClick={() => addToDisplay('÷')} styleType="operator" ariaLabel="Divide" />

              {/* Row 4 */}
              <Button label="e" onClick={() => addToDisplay('e')} styleType="function" ariaLabel="Euler's number" />
              <Button label="4" onClick={() => addToDisplay('4')} styleType="number" />
              <Button label="5" onClick={() => addToDisplay('5')} styleType="number" />
              <Button label="6" onClick={() => addToDisplay('6')} styleType="number" />
              <Button label="×" onClick={() => addToDisplay('×')} styleType="operator" ariaLabel="Multiply" />

              {/* Row 5 */}
              <Button label="√" onClick={() => addToDisplay('√(')} styleType="function" ariaLabel="Square root" />
              <Button label="1" onClick={() => addToDisplay('1')} styleType="number" />
              <Button label="2" onClick={() => addToDisplay('2')} styleType="number" />
              <Button label="3" onClick={() => addToDisplay('3')} styleType="number" />
              <Button label="-" onClick={() => addToDisplay('-')} styleType="operator" ariaLabel="Subtract" />

              {/* Row 6 */}
              <Button label="x^y" onClick={() => addToDisplay('^')} styleType="function" ariaLabel="Power" />
              <Button label="0" onClick={() => addToDisplay('0')} styleType="number" />
              <Button label="." onClick={() => addToDisplay('.')} styleType="number" ariaLabel="Decimal point" />
              <Button label="=" onClick={handleCalculate} styleType="action" className="col-span-1" ariaLabel="Calculate" />
              <Button label="+" onClick={() => addToDisplay('+')} styleType="operator" ariaLabel="Add" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile History Toggle Overlay Help */}
      {!showHistory && (
         <div className="md:hidden mt-4 text-center text-gray-600 text-sm">
           Press the history icon <LuHistory className="inline" aria-hidden="true" /> to view past calculations
         </div>
      )}
    </div>
  );
};

export default ScientificCalculator;

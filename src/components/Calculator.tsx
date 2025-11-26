"use client";

import { useState, useEffect } from "react";
import styles from "@/app/calculator/calculator.module.css";
import { FaChevronUp, FaChevronDown } from "react-icons/fa";

export default function Calculator() {
    const [currentInput, setCurrentInput] = useState("");
    const [history, setHistory] = useState("");
    const [lastResult, setLastResult] = useState<number | null>(null);
    const [isRadians, setIsRadians] = useState(false);

    const handleButtonClick = (action: string) => {
        switch (action) {
            case "clear":
                clear();
                break;
            case "backspace":
                backspace();
                break;
            case "equals":
                calculate();
                break;
            case "add":
            case "subtract":
            case "multiply":
            case "divide":
                handleOperator(action);
                break;
            case "sin":
            case "cos":
            case "tan":
            case "log":
            case "sqrt":
            case "square":
            case "power":
            case "reciprocal":
                handleScientificFunction(action);
                break;
            case "leftParen":
                setCurrentInput(currentInput + "(");
                break;
            case "rightParen":
                setCurrentInput(currentInput + ")");
                break;
            case "decimal":
                if (!currentInput.includes(".")) {
                    setCurrentInput(currentInput + ".");
                }
                break;
            case "ans":
                if (lastResult !== null) {
                    setCurrentInput(lastResult.toString());
                }
                break;
            default:
                if (action >= "0" && action <= "9") {
                    appendNumber(action);
                }
        }
    };

    const clear = () => {
        setCurrentInput("");
        setHistory("");
        setLastResult(null);
    };

    const backspace = () => {
        setCurrentInput(currentInput.slice(0, -1));
    };

    const appendNumber = (number: string) => {
        if (currentInput === "0" && number !== ".") {
            setCurrentInput(number);
        } else {
            setCurrentInput(currentInput + number);
        }
    };

    const handleOperator = (operator: string) => {
        const operators: { [key: string]: string } = {
            add: "+",
            subtract: "-",
            multiply: "×",
            divide: "÷",
        };

        if (currentInput) {
            setHistory(currentInput + " " + operators[operator] + " ");
            setCurrentInput("");
        }
    };

    const handleScientificFunction = (func: string) => {
        if (!currentInput) return;

        const value = parseFloat(currentInput);
        let result: number;

        switch (func) {
            case "sin":
                result = isRadians ? Math.sin(value) : Math.sin((value * Math.PI) / 180);
                break;
            case "cos":
                result = isRadians ? Math.cos(value) : Math.cos((value * Math.PI) / 180);
                break;
            case "tan":
                result = isRadians ? Math.tan(value) : Math.tan((value * Math.PI) / 180);
                break;
            case "log":
                result = Math.log(value);
                break;
            case "sqrt":
                result = Math.sqrt(value);
                break;
            case "square":
                result = value * value;
                break;
            case "power":
                setCurrentInput(currentInput + "^");
                return;
            case "reciprocal":
                result = 1 / value;
                break;
            default:
                return;
        }

        setCurrentInput(result.toString());
        setHistory(func + "(" + value + ") =");
    };

    const calculate = () => {
        if (!currentInput || !history) return;

        const expression = history + currentInput;
        try {
            const result = eval(
                expression.replace(/×/g, "*").replace(/÷/g, "/").replace(/\^/g, "**")
            );
            setCurrentInput(result.toString());
            setHistory(expression + " =");
            setLastResult(result);
        } catch (error) {
            setCurrentInput("Error");
        }
    };

    // Keyboard support
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const key = e.key;
            if ((key >= "0" && key <= "9") || key === ".") {
                handleButtonClick(key);
            } else if (key === "+") {
                handleButtonClick("add");
            } else if (key === "-") {
                handleButtonClick("subtract");
            } else if (key === "*") {
                handleButtonClick("multiply");
            } else if (key === "/") {
                e.preventDefault();
                handleButtonClick("divide");
            } else if (key === "Enter") {
                handleButtonClick("equals");
            } else if (key === "Backspace") {
                handleButtonClick("backspace");
            } else if (key === "Escape") {
                handleButtonClick("clear");
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [currentInput, history]);

    return (
        <div className={styles.calculatorWrapper}>
            <div className={styles.calculator}>
                <div className={styles.display}>
                    <div className={styles.history}>{history}</div>
                    <div className={styles.currentInput}>{currentInput || "0"}</div>
                </div>
                <div className={styles.buttons}>
                    {/* Row 1 */}
                    <button className={`${styles.button} ${styles.btnEmpty}`}>
                        <span className={styles.btnMain} style={{ fontSize: "0.7rem" }}>ON</span>
                    </button>
                    <button className={`${styles.button} ${styles.btnEmpty}`}>
                        <span className={styles.btnMain} style={{ fontSize: "0.7rem" }}>HOME</span>
                    </button>
                    <button className={`${styles.button} ${styles.btnEmpty}`}></button>
                    <button className={`${styles.button} ${styles.btnEmpty}`}></button>
                    <button className={`${styles.button} ${styles.btnEmpty}`}></button>
                    <button className={`${styles.button} ${styles.scrollBtn}`}>
                        <FaChevronUp />
                        <FaChevronDown />
                    </button>

                    {/* Row 2 */}
                    <button className={`${styles.button} ${styles.btnEmpty}`}>
                        <span className={styles.btnMain} style={{ fontSize: "0.65rem" }}>SETTINGS</span>
                    </button>
                    <button className={`${styles.button} ${styles.btnEmpty}`}></button>
                    <button className={`${styles.button} ${styles.btnEmpty}`}></button>
                    <button className={`${styles.button} ${styles.btnEmpty}`}>
                        <span className={styles.btnMain} style={{ fontSize: "0.75rem" }}>OK</span>
                    </button>
                    <button className={`${styles.button} ${styles.btnEmpty}`}></button>

                    {/* Row 3 */}
                    <button className={`${styles.button} ${styles.shiftBtn}`}>
                        <span className={styles.btnMain}>SHIFT</span>
                    </button>
                    <button className={`${styles.button} ${styles.btnEmpty}`}>
                        <span className={styles.btnMain} style={{ fontSize: "0.65rem" }}>VARIABLE</span>
                    </button>
                    <button className={`${styles.button} ${styles.btnEmpty}`}>
                        <span className={styles.btnMain} style={{ fontSize: "0.65rem" }}>FUNCTION</span>
                    </button>
                    <button className={`${styles.button} ${styles.btnEmpty}`}></button>
                    <button className={`${styles.button} ${styles.btnEmpty}`}>
                        <span className={styles.btnMain} style={{ fontSize: "0.65rem" }}>CATALOG</span>
                    </button>
                    <button className={`${styles.button} ${styles.btnEmpty}`}>
                        <span className={styles.btnMain} style={{ fontSize: "0.7rem" }}>TOOLS</span>
                    </button>

                    {/* Row 4 */}
                    <button className={`${styles.button} ${styles.scientific}`}>
                        <span className={`${styles.btnLabelTop} green`}>DR</span>
                        <span className={styles.btnMain}>x</span>
                    </button>
                    <button className={`${styles.button} ${styles.scientific}`} onClick={() => handleButtonClick("reciprocal")}>
                        <span className={`${styles.btnLabelTop} green`}>ⁿ√</span>
                        <span className={styles.btnMain}>=</span>
                    </button>
                    <button className={`${styles.button} ${styles.scientific}`} onClick={() => handleButtonClick("sqrt")}>
                        <span className={`${styles.btnLabelTop} green`}>³√</span>
                        <span className={styles.btnMain}>√</span>
                    </button>
                    <button className={`${styles.button} ${styles.scientific}`} onClick={() => handleButtonClick("square")}>
                        <span className={`${styles.btnLabelTop} green`}>□³</span>
                        <span className={styles.btnMain}>□²</span>
                    </button>
                    <button className={`${styles.button} ${styles.scientific}`} onClick={() => handleButtonClick("power")}>
                        <span className={`${styles.btnLabelTop} green`}>□ˣ</span>
                        <span className={styles.btnMain}>^</span>
                    </button>
                    <button className={`${styles.button} ${styles.scientific}`} onClick={() => handleButtonClick("log")}>
                        <span className={`${styles.btnLabelTop} green`}>log₁₀</span>
                        <span className={styles.btnMain}>ln</span>
                    </button>

                    {/* Row 5 */}
                    <button className={`${styles.button}`} onClick={() => handleButtonClick("ans")}>
                        <span className={styles.btnMain}>Ans</span>
                    </button>
                    <button className={`${styles.button} ${styles.scientific}`} onClick={() => handleButtonClick("sin")}>
                        <span className={`${styles.btnLabelTop} green`}>sin⁻¹</span>
                        <span className={styles.btnMain}>sin</span>
                    </button>
                    <button className={`${styles.button} ${styles.scientific}`} onClick={() => handleButtonClick("cos")}>
                        <span className={`${styles.btnLabelTop} green`}>cos⁻¹</span>
                        <span className={styles.btnMain}>cos</span>
                    </button>
                    <button className={`${styles.button} ${styles.scientific}`} onClick={() => handleButtonClick("tan")}>
                        <span className={`${styles.btnLabelTop} green`}>tan⁻¹</span>
                        <span className={styles.btnMain}>tan</span>
                    </button>
                    <button className={`${styles.button} ${styles.scientific}`} onClick={() => handleButtonClick("leftParen")}>
                        <span className={styles.btnMain}>(</span>
                    </button>
                    <button className={`${styles.button} ${styles.scientific}`} onClick={() => handleButtonClick("rightParen")}>
                        <span className={styles.btnMain}>)</span>
                    </button>

                    {/* Row 6 */}
                    <button className={`${styles.button} ${styles.number}`} onClick={() => handleButtonClick("7")}>
                        <span className={`${styles.btnLabelTop} green`}>π</span>
                        <span className={styles.btnMain}>7</span>
                    </button>
                    <button className={`${styles.button} ${styles.number}`} onClick={() => handleButtonClick("8")}>
                        <span className={`${styles.btnLabelTop} green`}>e</span>
                        <span className={styles.btnMain}>8</span>
                    </button>
                    <button className={`${styles.button} ${styles.number}`} onClick={() => handleButtonClick("9")}>
                        <span className={`${styles.btnLabelTop} green`}>EE</span>
                        <span className={styles.btnMain}>9</span>
                    </button>
                    <button className={`${styles.button} ${styles.operator}`} onClick={() => handleButtonClick("multiply")}>
                        <span className={`${styles.btnLabelTop} green`}>INS</span>
                        <span className={styles.btnMain}>×</span>
                    </button>
                    <button className={`${styles.button} ${styles.clearBtn}`} onClick={() => handleButtonClick("clear")}>
                        <span className={`${styles.btnLabelTop} green`}>DEL</span>
                        <span className={styles.btnMain}>AC</span>
                    </button>

                    {/* Row 7 */}
                    <button className={`${styles.button} ${styles.number}`} onClick={() => handleButtonClick("4")}>
                        <span className={`${styles.btnLabelTop} green`}>A</span>
                        <span className={styles.btnMain}>4</span>
                    </button>
                    <button className={`${styles.button} ${styles.number}`} onClick={() => handleButtonClick("5")}>
                        <span className={`${styles.btnLabelTop} green`}>B</span>
                        <span className={styles.btnMain}>5</span>
                    </button>
                    <button className={`${styles.button} ${styles.number}`} onClick={() => handleButtonClick("6")}>
                        <span className={`${styles.btnLabelTop} green`}>C</span>
                        <span className={styles.btnMain}>6</span>
                    </button>
                    <button className={`${styles.button} ${styles.operator}`} onClick={() => handleButtonClick("multiply")}>
                        <span className={styles.btnMain}>×</span>
                    </button>
                    <button className={`${styles.button} ${styles.operator}`} onClick={() => handleButtonClick("divide")}>
                        <span className={styles.btnMain}>÷</span>
                    </button>

                    {/* Row 8 */}
                    <button className={`${styles.button} ${styles.number}`} onClick={() => handleButtonClick("1")}>
                        <span className={`${styles.btnLabelTop} green`}>D</span>
                        <span className={styles.btnMain}>1</span>
                    </button>
                    <button className={`${styles.button} ${styles.number}`} onClick={() => handleButtonClick("2")}>
                        <span className={`${styles.btnLabelTop} green`}>E</span>
                        <span className={styles.btnMain}>2</span>
                    </button>
                    <button className={`${styles.button} ${styles.number}`} onClick={() => handleButtonClick("3")}>
                        <span className={`${styles.btnLabelTop} green`}>F</span>
                        <span className={styles.btnMain}>3</span>
                    </button>
                    <button className={`${styles.button} ${styles.operator}`} onClick={() => handleButtonClick("add")}>
                        <span className={styles.btnMain}>+</span>
                    </button>
                    <button className={`${styles.button} ${styles.operator}`} onClick={() => handleButtonClick("subtract")}>
                        <span className={styles.btnMain}>−</span>
                    </button>

                    {/* Row 9 */}
                    <button className={`${styles.button} ${styles.number}`} onClick={() => handleButtonClick("0")}>
                        <span className={`${styles.btnLabelTop} green`}>X</span>
                        <span className={styles.btnMain}>0</span>
                    </button>
                    <button className={`${styles.button} ${styles.number}`} onClick={() => handleButtonClick("decimal")}>
                        <span className={`${styles.btnLabelTop} green`}>Y</span>
                        <span className={styles.btnMain}>.</span>
                    </button>
                    <button className={`${styles.button} ${styles.scientific}`}>
                        <span className={`${styles.btnLabelTop} green`}>Z</span>
                        <span className={styles.btnMain} style={{ fontSize: "0.8rem" }}>×10ˣ</span>
                    </button>
                    <button className={`${styles.button} ${styles.btnEmpty}`}>
                        <span className={styles.btnMain} style={{ fontSize: "0.6rem" }}>FORMAT</span>
                    </button>
                    <button className={`${styles.button} ${styles.exeBtn}`} onClick={() => handleButtonClick("equals")}>
                        <span className={styles.btnMain}>EXE</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

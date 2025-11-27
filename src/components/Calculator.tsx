"use client";

import { useState, useEffect } from "react";
import styles from "@/app/calculator/calculator.module.css";

export default function Calculator() {
    const [currentInput, setCurrentInput] = useState("");
    const [history, setHistory] = useState("");
    const [lastResult, setLastResult] = useState<number | null>(null);

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
            case "pi":
                setCurrentInput(currentInput + Math.PI.toString());
                break;
            case "e":
                setCurrentInput(currentInput + Math.E.toString());
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
                result = Math.sin((value * Math.PI) / 180);
                break;
            case "cos":
                result = Math.cos((value * Math.PI) / 180);
                break;
            case "tan":
                result = Math.tan((value * Math.PI) / 180);
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
                    {/* Row 1 - Scientific Functions */}
                    <button className={`${styles.button} ${styles.function}`} onClick={() => handleButtonClick("sin")}>
                        sin
                    </button>
                    <button className={`${styles.button} ${styles.function}`} onClick={() => handleButtonClick("cos")}>
                        cos
                    </button>
                    <button className={`${styles.button} ${styles.function}`} onClick={() => handleButtonClick("tan")}>
                        tan
                    </button>
                    <button className={`${styles.button} ${styles.function}`} onClick={() => handleButtonClick("log")}>
                        ln
                    </button>
                    <button className={`${styles.button} ${styles.function}`} onClick={() => handleButtonClick("sqrt")}>
                        √
                    </button>

                    {/* Row 2 - More Functions */}
                    <button className={`${styles.button} ${styles.function}`} onClick={() => handleButtonClick("square")}>
                        x²
                    </button>
                    <button className={`${styles.button} ${styles.function}`} onClick={() => handleButtonClick("power")}>
                        x^y
                    </button>
                    <button className={`${styles.button} ${styles.function}`} onClick={() => handleButtonClick("reciprocal")}>
                        1/x
                    </button>
                    <button className={`${styles.button} ${styles.function}`} onClick={() => handleButtonClick("pi")}>
                        π
                    </button>
                    <button className={`${styles.button} ${styles.function}`} onClick={() => handleButtonClick("e")}>
                        e
                    </button>

                    {/* Row 3 - Parentheses and Clear */}
                    <button className={`${styles.button} ${styles.function}`} onClick={() => handleButtonClick("leftParen")}>
                        (
                    </button>
                    <button className={`${styles.button} ${styles.function}`} onClick={() => handleButtonClick("rightParen")}>
                        )
                    </button>
                    <button className={`${styles.button} ${styles.function}`} onClick={() => handleButtonClick("ans")}>
                        Ans
                    </button>
                    <button className={`${styles.button} ${styles.delete}`} onClick={() => handleButtonClick("backspace")}>
                        DEL
                    </button>
                    <button className={`${styles.button} ${styles.clear}`} onClick={() => handleButtonClick("clear")}>
                        AC
                    </button>

                    {/* Row 4 - Numbers 7-9 */}
                    <button className={`${styles.button} ${styles.number}`} onClick={() => handleButtonClick("7")}>
                        7
                    </button>
                    <button className={`${styles.button} ${styles.number}`} onClick={() => handleButtonClick("8")}>
                        8
                    </button>
                    <button className={`${styles.button} ${styles.number}`} onClick={() => handleButtonClick("9")}>
                        9
                    </button>
                    <button className={`${styles.button} ${styles.operator}`} onClick={() => handleButtonClick("divide")}>
                        ÷
                    </button>
                    <button className={`${styles.button} ${styles.operator}`} onClick={() => handleButtonClick("multiply")}>
                        ×
                    </button>

                    {/* Row 5 - Numbers 4-6 */}
                    <button className={`${styles.button} ${styles.number}`} onClick={() => handleButtonClick("4")}>
                        4
                    </button>
                    <button className={`${styles.button} ${styles.number}`} onClick={() => handleButtonClick("5")}>
                        5
                    </button>
                    <button className={`${styles.button} ${styles.number}`} onClick={() => handleButtonClick("6")}>
                        6
                    </button>
                    <button className={`${styles.button} ${styles.operator}`} onClick={() => handleButtonClick("add")}>
                        +
                    </button>
                    <button className={`${styles.button} ${styles.operator}`} onClick={() => handleButtonClick("subtract")}>
                        −
                    </button>

                    {/* Row 6 - Numbers 1-3 */}
                    <button className={`${styles.button} ${styles.number}`} onClick={() => handleButtonClick("1")}>
                        1
                    </button>
                    <button className={`${styles.button} ${styles.number}`} onClick={() => handleButtonClick("2")}>
                        2
                    </button>
                    <button className={`${styles.button} ${styles.number}`} onClick={() => handleButtonClick("3")}>
                        3
                    </button>
                    <button className={`${styles.button} ${styles.equals}`} onClick={() => handleButtonClick("equals")} style={{ gridRow: "span 2" }}>
                        =
                    </button>

                    {/* Row 7 - Zero and Decimal */}
                    <button className={`${styles.button} ${styles.number}`} onClick={() => handleButtonClick("0")} style={{ gridColumn: "span 2" }}>
                        0
                    </button>
                    <button className={`${styles.button} ${styles.number}`} onClick={() => handleButtonClick("decimal")}>
                        .
                    </button>
                </div>
            </div>
        </div>
    );
}

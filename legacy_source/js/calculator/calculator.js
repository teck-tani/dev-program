class Calculator {
    constructor() {
        this.currentInput = '';
        this.history = '';
        this.lastResult = null;
        this.isRadians = false;
        this.initialize();
    }

    initialize() {
        this.display = document.querySelector('.current-input');
        this.historyDisplay = document.querySelector('.history');
        this.buttons = document.querySelectorAll('button');
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.buttons.forEach(button => {
            button.addEventListener('click', () => {
                const action = button.dataset.action;
                this.handleButtonClick(action);
            });
        });

        // 키보드 지원
        document.addEventListener('keydown', (e) => {
            const key = e.key;
            if (key >= '0' && key <= '9' || key === '.') {
                this.handleButtonClick(key);
            } else if (key === '+') {
                this.handleButtonClick('add');
            } else if (key === '-') {
                this.handleButtonClick('subtract');
            } else if (key === '*') {
                this.handleButtonClick('multiply');
            } else if (key === '/') {
                this.handleButtonClick('divide');
            } else if (key === 'Enter') {
                this.handleButtonClick('equals');
            } else if (key === 'Backspace') {
                this.handleButtonClick('backspace');
            } else if (key === 'Escape') {
                this.handleButtonClick('clear');
            }
        });
    }

    handleButtonClick(action) {
        switch (action) {
            case 'clear':
                this.clear();
                break;
            case 'backspace':
                this.backspace();
                break;
            case 'equals':
                this.calculate();
                break;
            case 'add':
            case 'subtract':
            case 'multiply':
            case 'divide':
                this.handleOperator(action);
                break;
            case 'percent':
                this.handlePercent();
                break;
            case 'sin':
            case 'cos':
            case 'tan':
            case 'asin':
            case 'acos':
            case 'atan':
            case 'log':
            case 'ln':
            case 'sqrt':
            case 'factorial':
            case 'abs':
            case 'exp':
                this.handleScientificFunction(action);
                break;
            case 'pi':
                this.handleConstant('π', Math.PI);
                break;
            case 'e':
                this.handleConstant('e', Math.E);
                break;
            case 'rad':
                this.toggleRadians();
                break;
            default:
                if (action >= '0' && action <= '9' || action === '.') {
                    this.appendNumber(action);
                }
        }
        this.updateDisplay();
    }

    clear() {
        this.currentInput = '';
        this.history = '';
        this.lastResult = null;
    }

    backspace() {
        this.currentInput = this.currentInput.slice(0, -1);
    }

    appendNumber(number) {
        if (this.currentInput === '0' && number !== '.') {
            this.currentInput = number;
        } else {
            this.currentInput += number;
        }
    }

    handleOperator(operator) {
        const operators = {
            'add': '+',
            'subtract': '-',
            'multiply': '×',
            'divide': '÷'
        };
        
        if (this.currentInput) {
            this.history = this.currentInput + ' ' + operators[operator] + ' ';
            this.currentInput = '';
        }
    }

    handlePercent() {
        if (this.currentInput) {
            this.currentInput = (parseFloat(this.currentInput) / 100).toString();
        }
    }

    handleScientificFunction(func) {
        if (!this.currentInput) return;
        
        const value = parseFloat(this.currentInput);
        let result;
        
        switch (func) {
            case 'sin':
                result = this.isRadians ? Math.sin(value) : Math.sin(value * Math.PI / 180);
                break;
            case 'cos':
                result = this.isRadians ? Math.cos(value) : Math.cos(value * Math.PI / 180);
                break;
            case 'tan':
                result = this.isRadians ? Math.tan(value) : Math.tan(value * Math.PI / 180);
                break;
            case 'asin':
                result = this.isRadians ? Math.asin(value) : Math.asin(value) * 180 / Math.PI;
                break;
            case 'acos':
                result = this.isRadians ? Math.acos(value) : Math.acos(value) * 180 / Math.PI;
                break;
            case 'atan':
                result = this.isRadians ? Math.atan(value) : Math.atan(value) * 180 / Math.PI;
                break;
            case 'log':
                result = Math.log10(value);
                break;
            case 'ln':
                result = Math.log(value);
                break;
            case 'sqrt':
                result = Math.sqrt(value);
                break;
            case 'factorial':
                result = this.factorial(value);
                break;
            case 'abs':
                result = Math.abs(value);
                break;
            case 'exp':
                result = Math.exp(value);
                break;
        }
        
        this.currentInput = result.toString();
        this.history = func + '(' + value + ') =';
    }

    handleConstant(symbol, value) {
        this.currentInput = value.toString();
        this.history = symbol + ' =';
    }

    toggleRadians() {
        this.isRadians = !this.isRadians;
        const radButton = document.querySelector('[data-action="rad"]');
        radButton.textContent = this.isRadians ? 'DEG' : 'RAD';
    }

    factorial(n) {
        if (n < 0) return NaN;
        if (n === 0 || n === 1) return 1;
        let result = 1;
        for (let i = 2; i <= n; i++) {
            result *= i;
        }
        return result;
    }

    calculate() {
        if (!this.currentInput || !this.history) return;
        
        const expression = this.history + this.currentInput;
        try {
            // 수학 표현식 평가
            const result = eval(expression.replace(/×/g, '*').replace(/÷/g, '/'));
            this.currentInput = result.toString();
            this.history = expression + ' =';
            this.lastResult = result;
        } catch (error) {
            this.currentInput = 'Error';
        }
    }

    updateDisplay() {
        this.display.textContent = this.currentInput || '0';
        this.historyDisplay.textContent = this.history;
    }
}

// 계산기 인스턴스 생성
document.addEventListener('DOMContentLoaded', () => {
    new Calculator();
}); 
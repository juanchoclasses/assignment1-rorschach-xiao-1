import Cell from "./Cell"
import SheetMemory from "./SheetMemory"
import { ErrorMessages } from "./GlobalDefinitions";



export class FormulaEvaluator {
  // Define a function called update that takes a string parameter and returns a number
  private _errorOccured: boolean = false;
  private _errorMessage: string = "";
  private _currentFormula: FormulaType = [];
  private _lastResult: number = 0;
  private _sheetMemory: SheetMemory;
  private _result: number = 0;


  constructor(memory: SheetMemory) {
    this._sheetMemory = memory;
  }

  /**
    * place holder for the evaluator.   I am not sure what the type of the formula is yet 
    * I do know that there will be a list of tokens so i will return the length of the array
    * 
    * I also need to test the error display in the front end so i will set the error message to
    * the error messages found In GlobalDefinitions.ts
    * 
    * according to this formula.
    * 
    7 tokens partial: "#ERR",
    8 tokens divideByZero: "#DIV/0!",
    9 tokens invalidCell: "#REF!",
  10 tokens invalidFormula: "#ERR",
  11 tokens invalidNumber: "#ERR",
  12 tokens invalidOperator: "#ERR",
  13 missingParentheses: "#ERR",
  0 tokens emptyFormula: "#EMPTY!",

                    When i get back from my quest to save the world from the evil thing i will fix.
                      (if you are in a hurry you can fix it yourself)
                               Sincerely 
                               Bilbo
    * 
   */

  evaluate(formula: FormulaType) {

    this._result = 0;
    this._errorMessage = ErrorMessages.emptyFormula;

    if (formula.length === 0) {
      return;
    }
    // create two stacks to store numbers and 
    const numStack : number[] = [];
    const opStack : string[] = [];
    let errorMessage = "";

    // define the priority of the operators
    const precedence: { [key: string]: number } = {
      '+': 1,
      '-': 1,
      '*': 2,
      '/': 2,
    };

    // helper function: apply top operator to the top two numbers on the stack
    function applyOperator() {
      if (numStack.length < 2) {
        errorMessage = ErrorMessages.invalidNumber;
        opStack.pop();
        return;
      }
      const b = numStack.pop() as number;
      const a = numStack.pop() as number;
      const operator = opStack.pop() as string;
  
      switch (operator) {
        case '+':
          numStack.push(a + b);
          break;
        case '-':
          numStack.push(a - b);
          break;
        case '*':
          numStack.push(a * b);
          break;
        case '/':
          numStack.push(a / b);
          if (b === 0) {
            errorMessage = ErrorMessages.divideByZero;
          }
          break;
        default:
          throw new Error('Invalid operator: ' + operator);
      }
    }

    // traverse the formula
    for (const token of formula) {
      if (this.isNumber(token)) {
        // if it's a number, push it to numStack
        numStack.push(Number(token));
        // if it's a cell reference
      } else if (this.isCellReference(token)) {
        numStack.push(this._sheetMemory.getCellByLabel(token).getValue());
      }
      else {
        if (token === '(') {
          // if it's left parenthesis
          opStack.push(token);
        } else if (token === ')') {
          // if it's right parenthesis, apply the operators utill we meet left paranthesis
          while (opStack.length > 0 && opStack[opStack.length - 1] !== '(') {
            applyOperator();
          }
          // if left parenthese does not exist, throw an error
          if (opStack.length === 0) {
            errorMessage = ErrorMessages.missingParentheses
          } else {
            opStack.pop(); // pop left parenthesis
          }
          
          
        } else {
          // if it's operator, apply operator according to the priority
          while (
            opStack.length > 0 &&
            opStack[opStack.length - 1] !== '(' &&
            precedence[opStack[opStack.length - 1]] >= precedence[token]
          ) {
            applyOperator();
          }
          
          opStack.push(token);
        }
      }
    }


    // process the left operators
    while (opStack.length > 0) {
      applyOperator();
    }
    this._errorMessage = errorMessage;
    if (numStack.length === 1){
      this._result = numStack[0];
    }
    else {
      this._result = 0;
      this._errorMessage = ErrorMessages.missingParentheses;
    }
  }

  public get error(): string {
    return this._errorMessage
  }

  public get result(): number {
    return this._result;
  }




  /**
   * 
   * @param token 
   * @returns true if the toke can be parsed to a number
   */
  isNumber(token: TokenType): boolean {
    return !isNaN(Number(token));
  }

  /**
   * 
   * @param token
   * @returns true if the token is a cell reference
   * 
   */
  isCellReference(token: TokenType): boolean {

    return Cell.isValidCellLabel(token);
  }

  /**
   * 
   * @param token
   * @returns [value, ""] if the cell formula is not empty and has no error
   * @returns [0, error] if the cell has an error
   * @returns [0, ErrorMessages.invalidCell] if the cell formula is empty
   * 
   */
  getCellValue(token: TokenType): [number, string] {

    let cell = this._sheetMemory.getCellByLabel(token);
    let formula = cell.getFormula();
    let error = cell.getError();

    // if the cell has an error return 0
    if (error !== "" && error !== ErrorMessages.emptyFormula) {
      return [0, error];
    }

    // if the cell formula is empty return 0
    if (formula.length === 0) {
      return [0, ErrorMessages.invalidCell];
    }


    let value = cell.getValue();
    return [value, ""];

  }


}

export default FormulaEvaluator;
import type { Plugin, PluginResult } from '../../types/index.js';
import { logger } from '../../utils/logger.js';

export class MathPlugin implements Plugin {
  name = 'math';
  description = 'Evaluate mathematical expressions safely';

  async run(input: string): Promise<PluginResult | null> {
    // Multiple patterns to catch different mathematical expressions
    const patterns = [
      /calculate\s+(.+?)(?:\?|$|\.)/i,
      /what\s+(?:is|equals)\s+(.+?)(?:\?|$|\.)/i,
      /solve\s+(.+?)(?:\?|$|\.)/i,
      /compute\s+(.+?)(?:\?|$|\.)/i,
      /evaluate\s+(.+?)(?:\?|$|\.)/i,
    ];

    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match && match[1]) {
        const expression = match[1]?.trim() || '';
        if (!expression) continue;
        
        try {
          const result = this.evaluateExpression(expression);
          return {
            name: 'math',
            result: `The result of ${expression} is ${result}`,
            success: true,
            metadata: { expression, result },
          };
        } catch (error) {
          logger.error('Math plugin error', { error, expression });
          return {
            name: 'math',
            result: `Sorry, I couldn't evaluate the expression "${expression}". Please check if it's a valid mathematical expression.`,
            success: false,
            metadata: { expression, error: error instanceof Error ? error.message : 'Unknown error' },
          };
        }
      }
    }

    return null;
  }

  private extractExpression(input: string): string | null {
    // Multiple patterns to catch different ways users might ask for math
    const patterns = [
      /what\s+(?:is|equals)\s+([\d\s\+\-\*\/\(\)\.\^]+)\??/i,
      /calculate\s+([\d\s\+\-\*\/\(\)\.\^]+)/i,
      /evaluate\s+([\d\s\+\-\*\/\(\)\.\^]+)/i,
      /compute\s+([\d\s\+\-\*\/\(\)\.\^]+)/i,
      /solve\s+([\d\s\+\-\*\/\(\)\.\^]+)/i,
    ];

    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match && match[1]) {
        const expr = match[1].trim();
        if (this.isValidExpression(expr)) {
          return expr;
        }
      }
    }

    return null;
  }

  private isValidExpression(expr: string): boolean {
    // Check for valid characters only
    const validChars = /^[\d\s\+\-\*\/\(\)\.\^]+$/;
    if (!validChars.test(expr)) {
      return false;
    }

    // Check for balanced parentheses
    let parenCount = 0;
    for (const char of expr) {
      if (char === '(') parenCount++;
      if (char === ')') parenCount--;
      if (parenCount < 0) return false; // Unbalanced closing parenthesis
    }
    if (parenCount !== 0) return false; // Unbalanced opening parenthesis

    // Check for consecutive operators
    const consecutiveOps = /[\+\-\*\/\^]{2,}/;
    if (consecutiveOps.test(expr)) {
      return false;
    }

    // Check for division by zero patterns
    const divisionByZero = /\/\s*0(?!\.\d)/;
    if (divisionByZero.test(expr)) {
      return false;
    }

    return true;
  }

  private evaluateExpression(expr: string): number {
    // Clean the expression
    const cleanExpr = expr.replace(/\s+/g, ''); // Remove all whitespace

    // Replace ^ with ** for exponentiation
    const withExponents = cleanExpr.replace(/\^/g, '**');

    // Validate the expression again after cleaning
    if (!this.isValidExpression(cleanExpr)) {
      throw new Error('Invalid expression format');
    }

    try {
      // Use Function constructor for safer evaluation
      const result = new Function(`return ${withExponents}`)();
      
      if (typeof result !== 'number' || !isFinite(result)) {
        throw new Error('Result is not a finite number');
      }

      // Round to reasonable precision to avoid floating point issues
      return Math.round(result * 1000000) / 1000000;
    } catch (error) {
      throw new Error(`Evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

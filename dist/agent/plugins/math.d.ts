import type { Plugin, PluginResult } from '../../types/index.js';
export declare class MathPlugin implements Plugin {
    name: string;
    description: string;
    run(input: string): Promise<PluginResult | null>;
    private extractExpression;
    private isValidExpression;
    private evaluateExpression;
}
//# sourceMappingURL=math.d.ts.map
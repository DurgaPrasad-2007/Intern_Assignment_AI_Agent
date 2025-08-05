import type { Plugin, PluginResult } from '../../types/index.js';
export declare class WeatherPlugin implements Plugin {
    name: string;
    description: string;
    run(input: string): Promise<PluginResult | null>;
    private extractCity;
    private getWeather;
    private getWeatherDescription;
}
//# sourceMappingURL=weather.d.ts.map
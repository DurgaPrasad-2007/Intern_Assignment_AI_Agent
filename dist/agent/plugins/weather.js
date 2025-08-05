import { logger } from '../../utils/logger.js';
export class WeatherPlugin {
    name = 'weather';
    description = 'Get current weather information for a city';
    async run(input) {
        // Multiple patterns to catch different ways users might ask for weather
        const patterns = [
            /weather\s+(?:in\s+)?([a-zA-Z\s,]+?)(?:\?|$|\.)/i,
            /(?:what's|what is|how's|how is)\s+(?:the\s+)?weather\s+(?:in\s+)?([a-zA-Z\s,]+?)(?:\?|$|\.)/i,
            /temperature\s+(?:in\s+)?([a-zA-Z\s,]+?)(?:\?|$|\.)/i,
        ];
        for (const pattern of patterns) {
            const match = input.match(pattern);
            if (match && match[1]) {
                const city = match[1]?.trim().replace(/,.*$/, '') || ''; // Remove trailing commas and text
                if (!city)
                    continue;
                try {
                    const weather = await this.getWeather(city);
                    return {
                        name: 'weather',
                        result: weather,
                        success: true,
                        metadata: { city },
                    };
                }
                catch (error) {
                    logger.error('Weather plugin error', { error, city });
                    return {
                        name: 'weather',
                        result: `Sorry, I couldn't get weather information for ${city}.`,
                        success: false,
                        metadata: { city, error: error instanceof Error ? error.message : 'Unknown error' },
                    };
                }
            }
        }
        return null;
    }
    extractCity(input) {
        // Multiple patterns to catch different ways users might ask for weather
        const patterns = [
            /weather\s+(?:in|for|at)\s+([a-zA-Z\s,]+?)(?:\?|$|\.)/i,
            /what's?\s+(?:the\s+)?weather\s+(?:like\s+)?(?:in|for|at)\s+([a-zA-Z\s,]+?)(?:\?|$|\.)/i,
            /how's?\s+(?:the\s+)?weather\s+(?:in|for|at)\s+([a-zA-Z\s,]+?)(?:\?|$|\.)/i,
        ];
        for (const pattern of patterns) {
            const match = input.match(pattern);
            if (match && match[1]) {
                const city = match[1].trim().replace(/,.*$/, ''); // Remove trailing commas and text
                if (city.length > 0 && city.length < 100) {
                    return city;
                }
            }
        }
        return null;
    }
    async getWeather(city) {
        try {
            // Using Open-Meteo API (free, no API key required)
            const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=0&longitude=0&current=temperature_2m,relative_humidity_2m,weather_code&timezone=auto&city=${encodeURIComponent(city)}`);
            if (!response.ok) {
                throw new Error(`Weather API responded with status: ${response.status}`);
            }
            const data = await response.json();
            if (data.error) {
                throw new Error(data.reason || 'City not found');
            }
            const current = data.current;
            const temp = current.temperature_2m;
            const humidity = current.relative_humidity_2m;
            const weatherCode = current.weather_code;
            const weatherDescription = this.getWeatherDescription(weatherCode);
            const tempUnit = data.current_units?.temperature_2m || '°C';
            return `Current weather in ${city}: ${temp}${tempUnit}, ${weatherDescription}, Humidity: ${humidity}%`;
        }
        catch (error) {
            // Fallback to mock data if API fails
            logger.warn('Weather API failed, using mock data', { error, city });
            return `The current weather in ${city} is 22°C with partly cloudy skies (mock data).`;
        }
    }
    getWeatherDescription(code) {
        const descriptions = {
            0: 'Clear sky',
            1: 'Mainly clear',
            2: 'Partly cloudy',
            3: 'Overcast',
            45: 'Foggy',
            48: 'Depositing rime fog',
            51: 'Light drizzle',
            53: 'Moderate drizzle',
            55: 'Dense drizzle',
            61: 'Slight rain',
            63: 'Moderate rain',
            65: 'Heavy rain',
            71: 'Slight snow',
            73: 'Moderate snow',
            75: 'Heavy snow',
            95: 'Thunderstorm',
        };
        return descriptions[code] || 'Unknown weather condition';
    }
}
//# sourceMappingURL=weather.js.map
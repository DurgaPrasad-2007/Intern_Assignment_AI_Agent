import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { PluginManager } from '../agent/plugins/index.js';
import { MathPlugin } from '../agent/plugins/math.js';
import { WeatherPlugin } from '../agent/plugins/weather.js';
import type { Plugin } from '../types/index.js';

// Mock performance monitor
jest.mock('../utils/performanceMonitor.js', () => ({
  performanceMonitor: {
    recordPluginExecution: jest.fn(),
  }
}));

describe('PluginManager', () => {
  let pluginManager: PluginManager;

  beforeEach(() => {
    pluginManager = new PluginManager();
    jest.clearAllMocks();
  });

  describe('plugin registration', () => {
    it('should register default plugins', () => {
      expect(pluginManager.getPluginCount()).toBe(2); // Math and Weather
      expect(pluginManager.list()).toContain('math');
      expect(pluginManager.list()).toContain('weather');
    });

    it('should register custom plugin', () => {
      const mockPlugin: Plugin = {
        name: 'test',
        description: 'Test plugin',
        run: jest.fn().mockResolvedValue({
          name: 'test',
          result: 'Test result',
          success: true
        })
      };

      pluginManager.registerPlugin(mockPlugin);

      expect(pluginManager.getPluginCount()).toBe(3);
      expect(pluginManager.list()).toContain('test');
    });

    it('should unregister plugin', () => {
      const result = pluginManager.unregisterPlugin('math');

      expect(result).toBe(true);
      expect(pluginManager.getPluginCount()).toBe(1);
      expect(pluginManager.list()).not.toContain('math');
    });

    it('should return false when unregistering non-existent plugin', () => {
      const result = pluginManager.unregisterPlugin('nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('plugin execution', () => {
    it('should execute math plugin for mathematical expressions', async () => {
      const results = await pluginManager.run('What is 2 + 2?');

      expect(results).toHaveLength(1);
      expect(results[0]?.name).toBe('math');
      expect(results[0]?.success).toBe(true);
      expect(results[0]?.result).toContain('4');
    });

    it('should execute weather plugin for weather queries', async () => {
      const results = await pluginManager.run('What\'s the weather in London?');

      expect(results).toHaveLength(1);
      expect(results[0]?.name).toBe('weather');
      expect(results[0]?.success).toBe(true);
    });

    it('should execute multiple plugins if they match', async () => {
      // Create a custom plugin that always triggers
      const alwaysTriggerPlugin: Plugin = {
        name: 'always',
        description: 'Always triggers',
        run: jest.fn().mockResolvedValue({
          name: 'always',
          result: 'Always triggered',
          success: true
        })
      };

      pluginManager.registerPlugin(alwaysTriggerPlugin);

      const results = await pluginManager.run('What is 2 + 2?');

      expect(results.length).toBeGreaterThan(1);
      expect(results.some(r => r.name === 'math')).toBe(true);
      expect(results.some(r => r.name === 'always')).toBe(true);
    });

    it('should handle plugin errors gracefully', async () => {
      const errorPlugin: Plugin = {
        name: 'error',
        description: 'Error plugin',
        run: jest.fn().mockRejectedValue(new Error('Plugin error'))
      };

      pluginManager.registerPlugin(errorPlugin);

      const results = await pluginManager.run('trigger error');

      const errorResult = results.find(r => r.name === 'error');
      expect(errorResult).toBeDefined();
      expect(errorResult!.success).toBe(false);
      expect(errorResult!.result).toContain('error');
    });

    it('should include execution time in results', async () => {
      const results = await pluginManager.run('What is 1 + 1?');

      expect(results).toHaveLength(1);
      expect(results[0]?.executionTime).toBeDefined();
      expect(typeof results[0]?.executionTime).toBe('number');
      expect(results[0]?.executionTime!).toBeGreaterThan(0);
    });

    it('should include confidence scores', async () => {
      const results = await pluginManager.run('What is 2 + 2?');

      expect(results).toHaveLength(1);
      expect(results[0]?.confidence).toBeDefined();
      expect(typeof results[0]?.confidence).toBe('number');
      expect(results[0]?.confidence!).toBeGreaterThan(0);
      expect(results[0]?.confidence!).toBeLessThanOrEqual(1);
    });

    it('should sort results by success and confidence', async () => {
      const lowConfidencePlugin: Plugin = {
        name: 'low',
        description: 'Low confidence plugin',
        run: jest.fn().mockResolvedValue({
          name: 'low',
          result: 'Low confidence result',
          success: true,
          metadata: {} // Empty metadata = lower confidence
        })
      };

      const highConfidencePlugin: Plugin = {
        name: 'high',
        description: 'High confidence plugin',
        run: jest.fn().mockResolvedValue({
          name: 'high',
          result: 'High confidence result',
          success: true,
          metadata: { key: 'value', extra: 'data' } // More metadata = higher confidence
        })
      };

      pluginManager.registerPlugin(lowConfidencePlugin);
      pluginManager.registerPlugin(highConfidencePlugin);

      const results = await pluginManager.run('trigger both');

      expect(results.length).toBeGreaterThanOrEqual(2);
      
      // Successful results should come first
      const successfulResults = results.filter(r => r.success);
      expect(successfulResults.length).toBeGreaterThan(0);
      
      // Higher confidence should come first among successful results
      if (successfulResults.length > 1) {
        for (let i = 0; i < successfulResults.length - 1; i++) {
          const current = successfulResults[i]!.confidence || 0;
          const next = successfulResults[i + 1]!.confidence || 0;
          expect(current).toBeGreaterThanOrEqual(next);
        }
      }
    });
  });

  describe('plugin information', () => {
    it('should list plugins with descriptions', () => {
      const plugins = pluginManager.listWithDescriptions();

      expect(plugins).toHaveLength(2);
      expect(plugins.find(p => p.name === 'math')).toBeDefined();
      expect(plugins.find(p => p.name === 'weather')).toBeDefined();
      
      plugins.forEach(plugin => {
        expect(plugin.name).toBeDefined();
        expect(plugin.description).toBeDefined();
        expect(typeof plugin.description).toBe('string');
      });
    });

    it('should get specific plugin', () => {
      const mathPlugin = pluginManager.getPlugin('math');
      expect(mathPlugin).toBeDefined();
      expect(mathPlugin!.name).toBe('math');

      const nonExistent = pluginManager.getPlugin('nonexistent');
      expect(nonExistent).toBeUndefined();
    });

    it('should clear all plugins', () => {
      pluginManager.clear();
      expect(pluginManager.getPluginCount()).toBe(0);
      expect(pluginManager.list()).toHaveLength(0);
    });
  });
});

describe('MathPlugin', () => {
  let mathPlugin: MathPlugin;

  beforeEach(() => {
    mathPlugin = new MathPlugin();
  });

  it('should evaluate simple arithmetic', async () => {
    const result = await mathPlugin.run('What is 2 + 2?');

    expect(result).toBeDefined();
    expect(result!.success).toBe(true);
    expect(result!.result).toContain('4');
  });

  it('should handle complex expressions', async () => {
    const result = await mathPlugin.run('Calculate (10 + 5) * 2');

    expect(result).toBeDefined();
    expect(result!.success).toBe(true);
    expect(result!.result).toContain('30');
  });

  it('should reject non-math queries', async () => {
    const result = await mathPlugin.run('What is the weather like?');
    expect(result).toBeNull();
  });

  it('should handle invalid expressions safely', async () => {
    const result = await mathPlugin.run('Calculate invalid expression');

    expect(result).toBeDefined();
    expect(result!.success).toBe(false);
    expect(result!.result).toContain('couldn\'t evaluate');
  });
});

describe('WeatherPlugin', () => {
  let weatherPlugin: WeatherPlugin;

  beforeEach(() => {
    weatherPlugin = new WeatherPlugin();
  });

  it('should trigger on weather queries', async () => {
    const result = await weatherPlugin.run('What\'s the weather in London?');

    expect(result).toBeDefined();
    expect(result!.name).toBe('weather');
    expect(result!.success).toBe(true);
  });

  it('should extract city names correctly', async () => {
    const result = await weatherPlugin.run('How is the weather in New York?');

    expect(result).toBeDefined();
    expect(result!.metadata?.city).toBe('New York');
  });

  it('should reject non-weather queries', async () => {
    const result = await weatherPlugin.run('What is 2 + 2?');
    expect(result).toBeNull();
  });

  it('should handle various weather query formats', async () => {
    const queries = [
      'weather in Paris',
      'What\'s the weather like in Tokyo?',
      'How\'s the weather in Berlin?',
      'temperature in Mumbai'
    ];

    for (const query of queries) {
      const result = await weatherPlugin.run(query);
      expect(result).toBeDefined();
      expect(result!.name).toBe('weather');
    }
  });
});
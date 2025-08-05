import dotenv from 'dotenv';
import Joi from 'joi';
dotenv.config();
const envSchema = Joi.object({
    NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
    PORT: Joi.number().default(3000),
    OPENAI_API_KEY: Joi.string().required().custom((value, helpers) => {
        if (value === 'your_openai_api_key_here' || !value || value.trim() === '') {
            return helpers.error('any.invalid', {
                message: 'OPENAI_API_KEY is required. Please set it in your .env file. Get your API key from: https://platform.openai.com/api-keys'
            });
        }
        return value;
    }),
    OPENAI_MODEL: Joi.string().default('gpt-4o-mini'),
    OPENAI_EMBEDDING_MODEL: Joi.string().default('text-embedding-3-large'),
    LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
    RATE_LIMIT_WINDOW_MS: Joi.number().default(15 * 60 * 1000), // 15 minutes
    RATE_LIMIT_MAX_REQUESTS: Joi.number().default(100),
    CACHE_TTL: Joi.number().default(300), // 5 minutes
    MAX_MEMORY_SIZE: Joi.number().default(1000), // max messages per session
}).unknown();
const { error, value: envVars } = envSchema.validate(process.env);
if (error) {
    throw new Error(`Config validation error: ${error.message}`);
}
export const config = {
    env: envVars.NODE_ENV,
    port: envVars.PORT,
    openai: {
        apiKey: envVars.OPENAI_API_KEY,
        model: envVars.OPENAI_MODEL,
        embeddingModel: envVars.OPENAI_EMBEDDING_MODEL,
    },
    logging: {
        level: envVars.LOG_LEVEL,
    },
    rateLimit: {
        windowMs: envVars.RATE_LIMIT_WINDOW_MS,
        max: envVars.RATE_LIMIT_MAX_REQUESTS,
    },
    cache: {
        ttl: envVars.CACHE_TTL,
    },
    memory: {
        maxSize: envVars.MAX_MEMORY_SIZE,
    },
};
//# sourceMappingURL=index.js.map
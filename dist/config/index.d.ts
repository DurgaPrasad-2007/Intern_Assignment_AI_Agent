export declare const config: {
    readonly env: any;
    readonly port: any;
    readonly openai: {
        readonly apiKey: any;
        readonly model: any;
        readonly embeddingModel: any;
    };
    readonly logging: {
        readonly level: any;
    };
    readonly rateLimit: {
        readonly windowMs: any;
        readonly max: any;
    };
    readonly cache: {
        readonly ttl: any;
    };
    readonly memory: {
        readonly maxSize: any;
    };
};
export type Config = typeof config;
//# sourceMappingURL=index.d.ts.map
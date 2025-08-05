export declare enum LogLevel {
    ERROR = "error",
    WARN = "warn",
    INFO = "info",
    DEBUG = "debug"
}
declare class Logger {
    private getTimestamp;
    private formatMessage;
    error(message: string, meta?: Record<string, unknown>): void;
    warn(message: string, meta?: Record<string, unknown>): void;
    info(message: string, meta?: Record<string, unknown>): void;
    debug(message: string, meta?: Record<string, unknown>): void;
}
export declare const logger: Logger;
export type LoggerInstance = typeof logger;
export {};
//# sourceMappingURL=logger.d.ts.map
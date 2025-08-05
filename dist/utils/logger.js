import { config } from '../config/index.js';
export var LogLevel;
(function (LogLevel) {
    LogLevel["ERROR"] = "error";
    LogLevel["WARN"] = "warn";
    LogLevel["INFO"] = "info";
    LogLevel["DEBUG"] = "debug";
})(LogLevel || (LogLevel = {}));
class Logger {
    getTimestamp() {
        return new Date().toISOString();
    }
    formatMessage(level, message, meta) {
        const timestamp = this.getTimestamp();
        const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
        return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
    }
    error(message, meta) {
        console.error(this.formatMessage(LogLevel.ERROR, message, meta));
    }
    warn(message, meta) {
        console.warn(this.formatMessage(LogLevel.WARN, message, meta));
    }
    info(message, meta) {
        console.info(this.formatMessage(LogLevel.INFO, message, meta));
    }
    debug(message, meta) {
        if (config.logging.level === LogLevel.DEBUG) {
            console.debug(this.formatMessage(LogLevel.DEBUG, message, meta));
        }
    }
}
export const logger = new Logger();
//# sourceMappingURL=logger.js.map
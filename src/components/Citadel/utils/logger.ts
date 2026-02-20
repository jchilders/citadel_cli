export enum LogLevel {
  NONE = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4,
  TRACE = 5
}

const isProduction = import.meta.env.PROD;

export class Logger {
  private static level: LogLevel = LogLevel.NONE;
  private static prefix = '';

  static configure(config: { level: LogLevel; prefix?: string }) {
    this.level = config.level;
    this.prefix = config.prefix || '[Citadel]';
  }

  static trace(...args: unknown[]) {
    if (this.level >= LogLevel.TRACE && !isProduction) {
      console.trace(this.prefix, ...args);
    }
  }

  static debug(...args: unknown[]) {
    if (this.level >= LogLevel.DEBUG && !isProduction) {
      console.debug(this.prefix, ...args);
    }
  }

  static info(...args: unknown[]) {
    if (this.level >= LogLevel.INFO) {
      console.info(this.prefix, ...args);
    }
  }

  static warn(...args: unknown[]) {
    if (this.level >= LogLevel.WARN) {
      console.warn(this.prefix, ...args);
    }
  }

  static error(...args: unknown[]) {
    if (this.level >= LogLevel.ERROR) {
      console.error(this.prefix, ...args);
    }
  }
}

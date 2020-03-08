
import * as winston from 'winston';
import DailyRotateFile = require('winston-daily-rotate-file');
export abstract class LogUtil {
    static createLogger(label: string): winston.Logger {
        const logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.label({ label: label }),
                winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                winston.format.splat(),
                winston.format.json()
            ),
            transports: [
                new DailyRotateFile({
                    filename: 'app.log.%DATE%',
                    datePattern: 'YYYY-MM-DD',
                    zippedArchive: true,
                })
            ]
        });
        if (process.env.NODE_ENV !== 'production') {
            logger.add(new winston.transports.Console({
                consoleWarnLevels: ['debug']
            }));
        }
        return logger;
    }
}
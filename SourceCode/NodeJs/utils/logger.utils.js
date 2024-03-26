
// Utility for creating logs
const { createLogger, format, transports } = require('winston');
require('winston-daily-rotate-file');
const fileRotateTransportEvent = new transports.DailyRotateFile({
    filename: 'log_files/events/event-%DATE%.log',
    datePattern: 'DD-MM-YYYY',
    maxFiles: '30d',
});
const fileRotateTransportApi = new transports.DailyRotateFile({
    filename: 'log_files/apiLogs/server-%DATE%.log',
    datePattern: 'DD-MM-YYYY',
    maxFiles: '30d',
});

const timezoned = () => {
    return new Date().toLocaleString('en-US', {
        timeZone: 'Asia/Calcutta'
    });
}

const logger = createLogger({
    // level: process.env.LOG_LEVEL || 'info',
    format: format.combine(
        format.timestamp({ format: timezoned }),
        format.align(),
        format.printf(info => `${info.level}: ${[info.timestamp]}: ${info.message}`),
    ),
    transports: [fileRotateTransportEvent],
});

const apiLogger = createLogger({
    // level: process.env.LOG_LEVEL || 'info',
    format: format.combine(
        format.timestamp({ format: timezoned }),
        format.align(),
        format.printf(info => `${info.level}: ${[info.timestamp]}: ${info.message}`),
    ),
    transports: [fileRotateTransportApi],
});

module.exports = { logger, apiLogger }
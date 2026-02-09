import pinoHttp from 'pino-http';
import pino from 'pino';

export const logger = pinoHttp({
  transport: process.env.NODE_ENV !== 'production' ? {
    target: 'pino-pretty',
    options: { colorize: true }
  } : undefined,
});
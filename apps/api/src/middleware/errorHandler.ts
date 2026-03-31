import { Request, Response, NextFunction } from 'express'
import { logger } from '../lib/logger'

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.name,
      message: err.message,
      statusCode: err.statusCode,
    })
    return
  }

  logger.error('Unhandled error', err)

  res.status(500).json({
    error: 'InternalServerError',
    message: 'Error interno del servidor',
    statusCode: 500,
  })
}

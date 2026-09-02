import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from './authMiddleware';

const prisma = new PrismaClient();

export const auditLogger = (actionName: string, resourceName: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    // Intercept response finish
    res.on('finish', async () => {
      // Only log if request was successful (2xx) and user is authenticated
      if (req.user && res.statusCode >= 200 && res.statusCode < 300) {
        try {
          await prisma.actionLog.create({
            data: {
              userId: req.user.id,
              action: actionName,
              resource: resourceName,
              details: JSON.stringify({
                method: req.method,
                url: req.originalUrl,
                params: req.params,
                query: req.query,
                body: req.method !== 'GET' ? req.body : undefined
              })
            }
          });
        } catch (error) {
          console.error('Audit Log Error:', error);
        }
      }
    });
    next();
  };
};

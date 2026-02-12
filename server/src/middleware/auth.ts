import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/jwt';
import fs from 'fs';
import path from 'path';

const debugLog = (msg: string) => {
    // Using absolute path to be sure
    const logPath = 'e:/department-portal-2/server/debug.log';
    const timestamp = new Date().toISOString();
    try {
        fs.appendFileSync(logPath, `[${timestamp}] ${msg}\n`);
    } catch (e) {
        // Fallback to console if file write fails
        console.log(`[DEBUG LOG ERROR] ${e}`);
        console.log(`[${timestamp}] ${msg}`);
    }
};

// Extend Express Request type to include user
declare global {
    namespace Express {
        interface Request {
            user?: TokenPayload;
        }
    }
}

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'No token provided' });
            return;
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        const decoded = verifyAccessToken(token);

        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
};

// Role-based authorization middleware
export const authorize = (...allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            debugLog('[AUTH] No user in request');
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        debugLog(`[AUTH] Checking roles. User role: "${req.user.role}", Allowed roles: ${JSON.stringify(allowedRoles)}`);

        const userRoleUpper = req.user.role.toUpperCase();
        const allowedRolesUpper = allowedRoles.map(r => r.toUpperCase());

        if (!allowedRolesUpper.includes(userRoleUpper)) {
            debugLog(`[AUTH] Role mismatch: "${userRoleUpper}" not in ${JSON.stringify(allowedRolesUpper)}`);
            res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
            return;
        }

        next();
    };
};

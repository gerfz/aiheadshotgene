import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../services/supabase';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userEmail?: string;
  guestDeviceId?: string;
  isGuest?: boolean;
}

/**
 * Middleware that requires a valid auth token
 */
export async function verifyToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.split(' ')[1];

    // Verify the JWT token with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.userId = user.id;
    req.userEmail = user.email;
    req.isGuest = false;
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
}

/**
 * Middleware that accepts either auth token OR guest device ID
 * Use this for endpoints that should work for both authenticated users and guests
 */
export async function verifyGuestOrToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    const guestDeviceId = req.headers['x-guest-device-id'] as string;

    // Try auth token first
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

      if (!error && user) {
        req.userId = user.id;
        req.userEmail = user.email;
        req.isGuest = false;
        return next();
      }
    }

    // Fall back to guest device ID
    if (guestDeviceId) {
      req.guestDeviceId = guestDeviceId;
      req.isGuest = true;
      return next();
    }

    return res.status(401).json({ 
      error: 'Authentication required',
      message: 'Please provide either a valid auth token or guest device ID'
    });
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
}

/**
 * Middleware that only requires guest device ID (no auth)
 */
export async function verifyGuestOnly(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const guestDeviceId = req.headers['x-guest-device-id'] as string;

    if (!guestDeviceId) {
      return res.status(401).json({ error: 'Guest device ID required' });
    }

    req.guestDeviceId = guestDeviceId;
    req.isGuest = true;
    next();
  } catch (error) {
    console.error('Guest auth middleware error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
}

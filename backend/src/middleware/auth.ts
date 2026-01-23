import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../services/supabase';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userEmail?: string;
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
    const guestDeviceId = req.headers['x-guest-device-id'] as string;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log(`❌ [AUTH FAILED] Device: ${guestDeviceId} | Reason: Missing authorization header`);
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.split(' ')[1];

    // Verify the JWT token with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      console.log(`❌ [AUTH FAILED] Device: ${guestDeviceId} | Reason: Invalid or expired token - ${error?.message || 'No user found'}`);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.userId = user.id;
    req.userEmail = user.email;
    
    next();
  } catch (error: any) {
    console.log(`❌ [AUTH FAILED] Device: ${guestDeviceId} | Reason: Exception - ${error.message}`);
    return res.status(401).json({ error: 'Authentication failed' });
  }
}

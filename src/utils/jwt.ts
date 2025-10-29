import jwt from 'jsonwebtoken';
import { IUser } from '../models/User';

export const generateTokens = (userId: string) => {
  const jwtSecret = process.env.JWT_SECRET;
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
  
  if (!jwtSecret || !jwtRefreshSecret) {
    throw new Error('JWT secrets not configured');
  }

  const accessToken = jwt.sign(
    { id: userId },
    jwtSecret as jwt.Secret,
    { expiresIn: process.env.JWT_EXPIRE || '7d' } as jwt.SignOptions
  );

  const refreshToken = jwt.sign(
    { id: userId },
    jwtRefreshSecret as jwt.Secret,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' } as jwt.SignOptions
  );

  return { accessToken, refreshToken };
};

export const verifyRefreshToken = (token: string): { id: string } => {
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
  if (!jwtRefreshSecret) {
    throw new Error('JWT refresh secret not configured');
  }
  return jwt.verify(token, jwtRefreshSecret as jwt.Secret) as { id: string };
};

export const generateEmailVerificationToken = (userId: string): string => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT secret not configured');
  }
  return jwt.sign(
    { id: userId, type: 'email_verification' },
    jwtSecret as jwt.Secret,
    { expiresIn: '24h' } as jwt.SignOptions
  );
};

export const generatePasswordResetToken = (userId: string): string => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT secret not configured');
  }
  return jwt.sign(
    { id: userId, type: 'password_reset' },
    jwtSecret as jwt.Secret,
    { expiresIn: '1h' } as jwt.SignOptions
  );
};

export const verifyEmailToken = (token: string): { id: string; type: string } => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT secret not configured');
  }
  return jwt.verify(token, jwtSecret as jwt.Secret) as { id: string; type: string };
};
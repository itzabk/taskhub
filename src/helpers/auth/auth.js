import fs from 'node:fs';

import jwt from 'jsonwebtoken';

import { serverConfigs } from '../../configs/serverConfigs.js';

const { JWT } = serverConfigs;

const JWT_PRIVATE_KEY = fs.readFileSync(JWT.PRIVATE_KEY_PATH, { encoding: 'utf-8' });

export function signAccessToken(payload) {
  return jwt.sign(payload, JWT_PRIVATE_KEY, { expiresIn: '15min', algorithm: JWT.ALGORITHM });
}

// TODO: Frankly speaking having different JWT PRIVATE KEYS for access and refresh tokens signing is a good practice. For now i am using a single key for both access and refresh token signing
export function signRefreshToken(payload) {
  return jwt.sign(payload, JWT_PRIVATE_KEY, { expiresIn: '7d', algorithm: JWT.ALGORITHM });
}

export function extractAccessTokenFromCookie(req) {
  return req.signedCookies['access-token'];
}

export function extractRefreshTokenFromCookie(req) {
  return req.signedCookies['refresh-token'];
}

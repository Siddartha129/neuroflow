import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { repository } from '../data/repository.js';
import { httpError } from '../utils/httpError.js';

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';

    if (!token) {
      throw httpError(401, 'Authentication required');
    }

    const payload = jwt.verify(token, config.jwtSecret);
    const user = await repository.getById('users', payload.sub);

    if (!user) {
      throw httpError(401, 'Invalid token');
    }

    req.user = { id: user.id, name: user.name, email: user.email };
    next();
  } catch (error) {
    next(error.status ? error : httpError(401, 'Invalid token'));
  }
}

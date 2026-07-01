import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { repository } from '../data/repository.js';
import { httpError } from '../utils/httpError.js';

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email
  };
}

function signToken(user) {
  return jwt.sign({ sub: user.id }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

export async function registerUser({ name, email, password }) {
  if (!name || !email || !password) {
    throw httpError(400, 'Name, email, and password are required');
  }

  if (password.length < 6) {
    throw httpError(400, 'Password must be at least 6 characters');
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existing = await repository.getOne('users', { email: normalizedEmail });
  if (existing) {
    throw httpError(409, 'Email is already registered');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await repository.create('users', {
    name: name.trim(),
    email: normalizedEmail,
    password: hashedPassword
  });

  return {
    user: publicUser(user),
    token: signToken(user)
  };
}

export async function loginUser({ email, password }) {
  const normalizedEmail = String(email || '').toLowerCase().trim();
  const user = await repository.getOne('users', { email: normalizedEmail });

  if (!user || !(await bcrypt.compare(String(password || ''), user.password))) {
    throw httpError(401, 'Invalid email or password');
  }

  return {
    user: publicUser(user),
    token: signToken(user)
  };
}

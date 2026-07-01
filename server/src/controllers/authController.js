import { loginUser, registerUser } from '../services/authService.js';

export async function register(req, res) {
  const session = await registerUser(req.body);
  res.status(201).json(session);
}

export async function login(req, res) {
  const session = await loginUser(req.body);
  res.json(session);
}

export async function me(req, res) {
  res.json({ user: req.user });
}

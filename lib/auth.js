import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
import connectDB from './mongodb';
import User from './models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export async function authenticateUser(request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return { authenticated: false, error: 'No token provided' };
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return { authenticated: false, error: 'Invalid token' };
    }

    await connectDB();
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return { authenticated: false, error: 'User not found' };
    }

    return { authenticated: true, user };
  } catch (error) {
    return { authenticated: false, error: error.message };
  }
}

export function unauthorizedResponse(message = 'Unauthorized') {
  return NextResponse.json({ error: message }, { status: 401 });
}

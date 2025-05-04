import dotenv from 'dotenv';
dotenv.config();

import jwt from 'jsonwebtoken';
const { sign, verify } = jwt;

import User from '../models/User.js';
import { compare, genSalt, hash } from 'bcryptjs';


// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '30d';

// Create JWT Token
const createToken = (userId) => {
  return sign({ userId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
};

// Login user
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Create token
    const token = createToken(user._id);

    // Set HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    // Return user data (excluding password)
    const { _id, name } = user;
    res.status(200).json({
      message: 'Login successful',
      user: { _id, name, email }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

// Validate session
export async function validateSession(req, res) {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ message: 'No token found' });
    }

    // Verify token
    const decoded = verify(token, JWT_SECRET);

    // Check if user still exists
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'Session is valid', user });
  } catch (error) {
    console.error('Session validation error:', error);
    res.status(401).json({ message: 'Invalid session' });
  }
}

// Logout user
export async function logout(req, res) {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

// Signup user
export async function signup(req, res) {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await genSalt(10);
    const hashedPassword = await hash(password, salt);

    // Create new user
    user = new User({
      name,
      email,
      password: hashedPassword
    });

    await user.save();

    // Create token
    const token = createToken(user._id);

    // Set HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    // Return user data (excluding password)
    const { _id } = user;
    res.status(201).json({
      message: 'User created successfully',
      user: { _id, name, email }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

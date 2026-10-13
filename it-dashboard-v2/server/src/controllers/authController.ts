import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username/email and password are required.' });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: username.toLowerCase().trim() },
          { email: username.toLowerCase().trim() },
        ],
      },
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    if (user.employmentStatus !== 'Active') {
      return res.status(403).json({ success: false, message: 'Account is deactivated or former employee.' });
    }

    const secret = process.env.JWT_SECRET || 'fallback-secret';
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        employeeId: user.employeeId,
      },
      secret,
      { expiresIn: '7d' }
    );

    // Record login activity
    await prisma.activityLog.create({
      data: {
        user: user.name,
        action: 'LOGIN',
        module: 'AUTH',
        recordId: user.id,
        ipAddress: req.ip || req.socket.remoteAddress || '',
      },
    });

    const { password: _, ...userSafe } = user;

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: userSafe,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'An internal error occurred during login.' });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        computers: true,
        extensions: true,
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { password: _, ...userSafe } = user;
    return res.json({ success: true, user: userSafe });
  } catch (error: any) {
    console.error('getMe error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve user profile.' });
  }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user?.id } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect current password.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    await prisma.activityLog.create({
      data: {
        user: user.name,
        action: 'CHANGE_PASSWORD',
        module: 'AUTH',
        recordId: user.id,
      },
    });

    return res.json({ success: true, message: 'Password changed successfully.' });
  } catch (error: any) {
    console.error('changePassword error:', error);
    return res.status(500).json({ success: false, message: 'Failed to change password.' });
  }
};

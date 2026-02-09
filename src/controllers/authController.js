import createHttpError from 'http-errors';
import { User } from '../models/user.js';
import bcrypt from 'bcrypt';
import { Session } from '../models/session.js';
import { createSession, setSessionCookies } from '../services/auth.js';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import handlebars from 'handlebars';
import { sendEmail } from '../utils/sendMail.js';
// --------------------- Реєстрація користувача ---------------------
export const registerUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(createHttpError(400, 'Email in use'));
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ email, password: hashedPassword });

    const newSession = await createSession(newUser._id);
    setSessionCookies(res, newSession);

    res.status(201).json(newUser);
  } catch (error) {
    next(error);
  }
};

// --------------------- Логін користувача ---------------------
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return next(createHttpError(401, 'Invalid credentials'));
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return next(createHttpError(401, 'Invalid credentials'));
    }

    await Session.deleteOne({ userId: user._id });

    const newSession = await createSession(user._id);
    setSessionCookies(res, newSession);

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

// --------------------- Логаут користувача ---------------------
export const logoutUser = async (req, res, next) => {
  try {
    const { sessionId } = req.cookies;

    if (sessionId) {
      await Session.deleteOne({ _id: sessionId });
    }

    res.clearCookie('sessionId');
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

// --------------------- Запит на скидання пароля ---------------------
export const requestResetEmail = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    // Завжди повертаємо 200, щоб не розкривати наявність email
    if (!user) return res.status(200).json({ message: 'If the email exists, a reset link has been sent.' });

    // Генерація JWT токена (15 хв)
    const token = jwt.sign(
      { sub: user._id.toString(), email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    // Зчитування та компіляція шаблону
    const templatePath = path.join(process.cwd(), 'src', 'templates', 'reset-password-email.html');
    const templateSource = fs.readFileSync(templatePath, 'utf-8');
    const template = handlebars.compile(templateSource);

    const resetLink = `${process.env.FRONTEND_DOMAIN}/reset-password?token=${token}`;
    const html = template({ resetLink, userName: user.email });

    await sendEmail({
      to: user.email,
      subject: 'Reset your password',
      html,
      from: process.env.SMTP_FROM
    });

    res.status(200).json({ message: 'If the email exists, a reset link has been sent.' });
  } catch (err) {
    next(err); // глобальний errorHandler обробить помилку
  }
};

// --------------------- Скидання пароля ---------------------
export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

  if (!token || !password) return next(createHttpError(400, 'Token and password are required.'));

let payload;
try {
  payload = jwt.verify(token, process.env.JWT_SECRET);
} catch (err) {
  return next(createHttpError(401, 'Invalid or expired token.'));
}

const user = await User.findOne({ _id: payload.sub, email: payload.email });
if (!user) return next(createHttpError(404, 'User not found.'));

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: 'Password has been reset successfully.' });
  } catch (err) {
    next(err);
  }
};

// --------------------- Оновлення сесії користувача ---------------------
export const refreshUserSession = async (req, res, next) => {
  try {
    const session = await Session.findOne({
      _id: req.cookies.sessionId,
      refreshToken: req.cookies.refreshToken,
    });

    if (!session) {
      return next(createHttpError(401, 'Session not found'));
    }

    const isSessionTokenExpired =
      new Date() > new Date(session.refreshTokenValidUntil);

    if (isSessionTokenExpired) {
      return next(createHttpError(401, 'Session token expired'));
    }

    await Session.deleteOne({
      _id: req.cookies.sessionId,
      refreshToken: req.cookies.refreshToken,
    });

    const newSession = await createSession(session.userId);
    setSessionCookies(res, newSession);

    res.status(200).json({ message: 'Session refreshed' });
  } catch (error) {
    next(error);
  }
};
import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import { errors } from 'celebrate';
import cookieParser from 'cookie-parser';
console.log('MongoDB URL:', process.env.MONGODB_URL);
import { connectMongoDB } from './db/connectMongoDB.js';
import { logger } from './middleware/logger.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { errorHandler } from './middleware/errorHandler.js';

import notesRoutes from './routes/notesRoutes.js';
import authRoutes from './routes/authRoutes.js';

const app = express();
const PORT = process.env.PORT ?? 3000;

// Middleware
app.use(logger);
app.use(express.json());
app.use(cors());
app.use(cookieParser());

// Роутери
app.use('/auth', authRoutes);
app.use('/notes', notesRoutes);

// 404 та обробка помилок
app.use(notFoundHandler);
app.use(errors());
app.use(errorHandler);

// Запуск сервера після підключення до MongoDB
const startServer = async () => {
  try {
    await connectMongoDB();
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

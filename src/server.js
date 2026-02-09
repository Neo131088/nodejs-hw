import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { logger } from './middleware/logger.js';
import 'dotenv/config';
import { connectMongoDB } from './db/connectMongoDB.js';
import userRoutes from './routes/userRoutes.js';
import notesRoutes from './routes/notesRoutes.js';
import authRoutes from './routes/authRoutes.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { errorHandler } from './middleware/errorHandler.js';
import { errors as celebrateErrors } from 'celebrate';

const app = express();

// Middleware
app.use(logger);
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Роутери (без префіксу шляху)
app.use(userRoutes);
app.use(notesRoutes);
app.use(authRoutes);

// Обробка помилок
app.use(notFoundHandler);
app.use(celebrateErrors());
app.use(errorHandler);

// Підключення до MongoDB і старт сервера
const PORT = process.env.PORT || 3000;

(async () => {
  try {
    await connectMongoDB(); // ✅ підключення до MongoDB
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  }
})();
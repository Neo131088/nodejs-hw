import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';

import { errors } from 'celebrate';
import { connectMongoDB } from './db/connectMongoDB.js';
import { logger } from './middleware/logger.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { errorHandler } from './middleware/errorHandler.js';

import notesRouter from './routes/notesRoutes.js';
import 'dotenv/config'; // або dotenv.config();

console.log('MONGODB_URL:', process.env.MONGODB_URL);
mongoose.connect(process.env.MONGODB_URL)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('❌ Failed to connect to MongoDB:', err));
const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(logger);
app.use(express.json({ limit: '5mb' }));
app.use(cors({ methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'] }));
app.use(helmet());

app.use(notesRouter);

app.use(notFoundHandler);

app.use(errors());

app.use(errorHandler);

await connectMongoDB();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
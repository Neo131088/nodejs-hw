import mongoose from 'mongoose';
const { Schema, model, models } = mongoose;
import { TAGS } from '../constants/tags.js';

const notesSchema = new Schema({
  title: { type: String, required: true, trim: true },
  content: { type: String, default: '', trim: true },
  tag: { type: String, enum: TAGS, default: 'Todo' },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, {
  timestamps: true,
  versionKey: false,
});

notesSchema.index({ title: 'text', content: 'text' });

// Щоб Nodemon не падав при перезавантаженні
export const Note = models.Note || model('Note', notesSchema);
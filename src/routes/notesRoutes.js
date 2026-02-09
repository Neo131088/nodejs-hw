import { Router } from 'express';
import { Note } from '../models/note.js';

const router = Router();

// CREATE — створення нотатки
router.post('/', async (req, res) => {
  try {
    const { title, content, tag, userId } = req.body;
    const newNote = await Note.create({ title, content, tag, userId });
    res.status(201).json(newNote);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create note', error: error.message });
  }
});

// READ — всі нотатки користувача
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query; // передаємо userId як query
    const notes = await Note.find({ userId });
    res.status(200).json(notes);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch notes', error: error.message });
  }
});

// READ — конкретна нотатка по id
router.get('/:id', async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Note not found' });
    res.status(200).json(note);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch note', error: error.message });
  }
});

// UPDATE — оновлення нотатки
router.put('/:id', async (req, res) => {
  try {
    const updatedNote = await Note.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedNote) return res.status(404).json({ message: 'Note not found' });
    res.status(200).json(updatedNote);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update note', error: error.message });
  }
});

// DELETE — видалення нотатки
router.delete('/:id', async (req, res) => {
  try {
    const deletedNote = await Note.findByIdAndDelete(req.params.id);
    if (!deletedNote) return res.status(404).json({ message: 'Note not found' });
    res.status(200).json({ message: 'Note deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete note', error: error.message });
  }
});

export default router;
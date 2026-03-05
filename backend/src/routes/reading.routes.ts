
import { Router } from 'express';
import { getReadings, createReading, createReadingsBatch, deleteReading } from '../controllers/reading.controller.js';

const router = Router();

router.get('/', getReadings);
router.post('/', createReading);
router.post('/batch', createReadingsBatch);
router.delete('/:id', deleteReading);

export default router;

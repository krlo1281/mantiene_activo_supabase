
import { Router } from 'express';
import { getWorkers, createWorker, updateWorker, deleteWorker, getWorkerDoseHistory } from '../controllers/worker.controller.js';

const router = Router();

router.get('/', getWorkers);
router.post('/', createWorker);
router.get('/:id/dose-history', getWorkerDoseHistory); // New endpoint
router.put('/:id', updateWorker);
router.delete('/:id', deleteWorker);

export default router;

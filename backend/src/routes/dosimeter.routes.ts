
import { Router } from 'express';
import { getDosimeters, createDosimeter, updateDosimeter, deleteDosimeter, createDosimetersBatch } from '../controllers/dosimeter.controller.js';

const router = Router();

router.get('/', getDosimeters);
router.post('/', createDosimeter);
router.post('/batch', createDosimetersBatch);
router.put('/:id', updateDosimeter);
router.delete('/:id', deleteDosimeter);

export default router;

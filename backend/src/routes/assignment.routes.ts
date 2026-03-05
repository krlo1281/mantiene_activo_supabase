
import { Router } from 'express';
import { getAssignments, createAssignment, deleteAssignment } from '../controllers/assignment.controller.js';

const router = Router();

router.get('/', getAssignments);
router.post('/', createAssignment);
router.delete('/:id', deleteAssignment);

export default router;

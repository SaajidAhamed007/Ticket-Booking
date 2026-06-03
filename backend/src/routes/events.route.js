import express from 'express';
import { getEvents, getEventById } from '../controller/events.controller.js';

const router = express.Router();

router.get('/',getEvents);
router.get('/:id',getEventById);

export default router;
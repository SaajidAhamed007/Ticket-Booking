import express from 'express';
import { getSeats,lockSeats } from '../controller/seats.controller.js';

const router = express.Router();

router.get("/:eventId",getSeats);
router.post("/lock",lockSeats);

export default router;

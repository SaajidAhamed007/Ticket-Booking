import express from 'express';
import { confirmBooking } from '../controller/bookings.controller.js';

const router = express.Router();

router.post("/confirm",confirmBooking);

export default router;
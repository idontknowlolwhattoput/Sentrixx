import express from 'express';
import {
  addConsultationController,
} from '../controller/consultationController.js'

const router = express.Router();

// Create a new consultation
router.post('/add-consultations', addConsultationController);

export default router;
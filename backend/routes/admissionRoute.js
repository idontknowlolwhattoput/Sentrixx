// routes/admissionRoutes.js
import express from 'express';
import {
  createAdmissionController,
  getAdmissionByIdController,
  getAdmissionsByPatientIdController,
  getAllAdmissionsController,
  updateAdmissionController,
  dischargePatientController,
  getAdmissionStatisticsController,
  getCurrentAdmissionsController,
  getAdmissionsByWardController
} from '../controller/admissionController.js';

const router = express.Router();

// Create new admission
router.post('/admissions', createAdmissionController);

// Get all admissions (with optional filters)
router.get('/admissions', getAllAdmissionsController);

// Get current admissions
router.get('/admissions/current', getCurrentAdmissionsController);

// Get admission statistics
router.get('/admissions/statistics', getAdmissionStatisticsController);

// Get admission by ID
router.get('/admissions/:id', getAdmissionByIdController);

// Get admissions by patient ID
router.get('/patients/:patient_id/admissions', getAdmissionsByPatientIdController);

// Get admissions by ward
router.get('/wards/:ward_id/admissions', getAdmissionsByWardController);

// Update admission
router.put('/admissions/:id', updateAdmissionController);

// Discharge patient
router.put('/admissions/:id/discharge', dischargePatientController);

export default router;
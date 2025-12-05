// routes/patientVisitRoutes.js
import express from 'express';
import { 
  getPatientVisits, 
  getFilteredVisits,
  getVisitStatistics,
  getVisitById
} from '../controller/fetchVisitController.js';

import { getCurrentQueueVisits, getDoctorQueueVisits } from '../controller/queueController.js';

const router = express.Router();

// Get all visits for a specific patient with optional filters
router.get('/patient/:patientId', getPatientVisits);

// Get visits with multiple filters (patient_id, employee_id, visit_status, visit_type)
router.get('/filtered', getFilteredVisits);

// Get visit statistics for a patient
router.get('/statistics/:patientId', getVisitStatistics);

// Get single visit by record number
router.get('/:recordNo', getVisitById);

router.get('/queue/current', getCurrentQueueVisits);
router.get('/queue/current/:employee_id', getDoctorQueueVisits)

export default router;
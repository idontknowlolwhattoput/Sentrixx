// routes/analyticsRoutes.js
import express from 'express';
import {
  getPatientAnalytics,
  getAdmissionAnalytics,
  getMedicalAnalytics,
  getLaboratoryAnalytics,
  getConsultationAnalytics,
  getDashboardData,
  getRealTimeAlerts
} from '../controller/analyticsController.js';

const router = express.Router();

// Patient analytics
router.get('/patients', getPatientAnalytics);

// Admission analytics
router.get('/admissions', getAdmissionAnalytics);

// Medical analytics
router.get('/medical', getMedicalAnalytics);

// Laboratory analytics
router.get('/laboratory', getLaboratoryAnalytics);

// Consultation analytics
router.get('/consultations', getConsultationAnalytics);

// Dashboard comprehensive data
router.get('/dashboard', getDashboardData);

// Real-time alerts
router.get('/alerts', getRealTimeAlerts);

// Time-based analytics
router.get('/trends/:timeframe', (req, res) => {
  // Handle different timeframes
  const { timeframe } = req.params;
  // Return appropriate analytics for timeframe
});

export default router;
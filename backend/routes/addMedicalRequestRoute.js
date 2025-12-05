import { Router } from "express";
import { 
  createLabRequest,
  getAllCBCTests,
  getAllXRayTests,
  getLabTestsByPatientId,
  updateXRayResultsController,
} from "../controller/addMedicalRequest.js";

const router = Router();

// POST /lab/create
router.post("/create", createLabRequest);

// GET /lab/patient/:patient_id
router.get("/patient/:patient_id", getLabTestsByPatientId);

// GET /lab/xray
router.get("/xray", getAllXRayTests);

// GET /lab/cbc
router.get("/cbc", getAllCBCTests);

// Update X-Ray findings, impression, and image
router.put('/xray/:record_no/update', updateXRayResultsController);

export default router;

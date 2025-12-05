import { getAppointmentByCodeController } from "../controller/scanAppointmentCode.js";
import express from "express"

const router = express.Router();
router.post("/appointment", getAppointmentByCodeController)

export default router;
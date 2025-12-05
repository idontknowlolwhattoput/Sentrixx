import { updateVisitStatus } from "../controller/updateVisitController.js";
import express from "express"
const router = express.Router();

router.put('/update-status', updateVisitStatus);

export default router;
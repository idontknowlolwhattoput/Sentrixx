import { AddPatientVisit } from "../controller/addPatientVisit.js";
import express from "express"

const router = express.Router()

router.post("/add-visit", AddPatientVisit)

export default router;
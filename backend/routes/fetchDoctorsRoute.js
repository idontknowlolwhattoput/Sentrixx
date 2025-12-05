import { FetchDoctors, FetchDoctorByID } from "../controller/fetchDoctors.js";
import express from "express"

const router = express.Router()
router.get('/fetch-doctors', FetchDoctors)
router.get('/fetch-doctor/:employee_id', FetchDoctorByID)

export default router;
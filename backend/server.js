import express from "express";
import cors from "cors"
import helmet from "helmet";

import dbroute from "./routes/dbroute.js";
import employeeRoutes from "./routes/employeeRoutes.js"
import patientRoutes from "./routes/patientRoutes.js"
import getAllPatientsRoute from "./routes/getAllPatientsRoute.js"
import signinRoute from "./routes/signinRoutes.js"
import fetchDoctorRoute from "./routes/fetchDoctorsRoute.js"
import addPatientVisitRoute from "./routes/addPatientVisitRoute.js"
import timesheetRoute from "./routes/timesheet.js"
import patientVisitRoutes from './routes/fetchVisitRoute.js';
import updateStatusRoute from "./routes/updateVisitRoute.js"
import scanAppointmentCodeRoute from "./routes/scanAppointmentCodeRoute.js"
import addConsultation from "./routes/consultationRoute.js"
import addLabResult from "./routes/addMedicalRequestRoute.js"
import admissionRoute from "./routes/admissionRoute.js"
const app = express();
const port = 5000;

app.use(cors())
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));
app.use(
  helmet({
    contentSecurityPolicy: false, // temporarily disable CSP
  })
);
 
app.use("/users", dbroute);
app.use("/employees", employeeRoutes)
app.use('/api', patientRoutes);
app.use('/patient', getAllPatientsRoute)
app.use('/patient/visit', addPatientVisitRoute )
app.use('/hello', signinRoute)
app.use('/api', fetchDoctorRoute)
app.use('/time', timesheetRoute)
app.use('/api/patient/visits', patientVisitRoutes);
app.use('/patient/update', updateStatusRoute)
app.use('/receptionist', scanAppointmentCodeRoute)
app.use('/patient/consultation', addConsultation)
app.use('/lab', addLabResult)
app.use('/api', admissionRoute)

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});

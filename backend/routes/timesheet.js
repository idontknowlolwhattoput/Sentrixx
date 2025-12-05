import express from "express"
import timesheetController from "../controller/timesheetController.js"
const router = express.Router();

// POST routes
router.post('/timesheet', timesheetController.createTimesheet);
router.post('/timesheet/bulk', timesheetController.createBulkTimesheets);

// GET routes
router.get('/timesheet', timesheetController.getAllTimesheets);
router.get('/timesheet/employee/:employee_id', timesheetController.getTimesheetsByEmployee);
router.get('/timesheet/date-range', timesheetController.getTimesheetsByDateRange);

export default router;

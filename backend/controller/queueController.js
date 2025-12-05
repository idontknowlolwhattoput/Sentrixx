import { connection } from "../config/db.js";

// Get current and queued visits for today
export const getCurrentQueueVisits = async (req, res) => {
  try {
    const { employee_id, department } = req.query;

    let query = `
      SELECT 
        pvr.record_no,
        pi.first_name as patient_first_name,
        pi.last_name as patient_last_name,
        pvr.visit_purpose_title,
        pvr.visit_chief_complaint,
        pvr.date_scheduled,
        pvr.time_scheduled,
        ei.first_name as doctor_first_name,
        ei.last_name as doctor_last_name,
        ea.position as doctor_department,
        pvr.visit_type,
        pvr.visit_status,
        pvr.date_created,
        pvr.appointment_code,
        pvr.patient_id,
        pvr.employee_id
      FROM patient_visit_record pvr
      INNER JOIN patient_info pi ON pvr.patient_id = pi.patient_id
      INNER JOIN employee_info ei ON pvr.employee_id = ei.employee_id
      INNER JOIN employee_account ea ON ea.employee_id = ei.employee_id
      WHERE DATE(pvr.date_scheduled) = CURDATE()
      AND (pvr.visit_status = 'Current' OR pvr.visit_status = 'Queued')
    `;

    const queryParams = [];

    if (employee_id) {
      query += ` AND pvr.employee_id = ?`;
      queryParams.push(employee_id);
    }

    if (department) {
      query += ` AND ea.position = ?`;
      queryParams.push(department);
    }

    // Add ordering by scheduled time
    query += ` ORDER BY pvr.time_scheduled ASC`;

    connection.query(query, queryParams, (err, results) => {
      if (err) {
        console.error("Error fetching current queue visits:", err);
        return res.status(500).json({
          success: false,
          message: "Database error",
          error: err.message
        });
      }

      const visits = results.map(visit => ({
        record_no: visit.record_no,
        patient_id: visit.patient_id,
        employee_id: visit.employee_id,
        patient_name: `${visit.patient_first_name} ${visit.patient_last_name}`,
        doctor_name: `Dr. ${visit.doctor_first_name} ${visit.doctor_last_name}`,
        doctor_department: visit.doctor_department,
        visit_purpose_title: visit.visit_purpose_title,
        visit_chief_complaint: visit.visit_chief_complaint,
        date_scheduled: visit.date_scheduled,
        time_scheduled: visit.time_scheduled,
        visit_type: visit.visit_type,
        visit_status: visit.visit_status,
        date_created: visit.date_created,
        appointment_code: visit.appointment_code,
        status: visit.visit_status // Use actual status from database
      }));

      return res.status(200).json({
        success: true,
        message: "Current and queued visits fetched successfully",
        data: visits,
        count: visits.length
      });
    });

  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get current and queued visits for specific doctor using route parameter
export const getDoctorQueueVisits = async (req, res) => {
  try {
    const { employee_id } = req.params;
    const { department } = req.query;

    if (!employee_id) {
      return res.status(400).json({
        success: false,
        message: "Employee ID is required"
      });
    }

    let query = `
      SELECT 
        pvr.record_no,
        pi.first_name as patient_first_name,
        pi.last_name as patient_last_name,
        pvr.visit_purpose_title,
        pvr.visit_chief_complaint,
        pvr.date_scheduled,
        pvr.time_scheduled,
        ei.first_name as doctor_first_name,
        ei.last_name as doctor_last_name,
        ea.position as doctor_department,
        pvr.visit_type,
        pvr.visit_status,
        pvr.date_created,
        pvr.appointment_code,
        pvr.patient_id,
        pvr.employee_id
      FROM patient_visit_record pvr
      INNER JOIN patient_info pi ON pvr.patient_id = pi.patient_id
      INNER JOIN employee_info ei ON pvr.employee_id = ei.employee_id
      INNER JOIN employee_account ea ON ea.employee_id = ei.employee_id
      WHERE DATE(pvr.date_scheduled) = CURDATE()
      AND (pvr.visit_status = 'Current' OR pvr.visit_status = 'Queued')
      AND pvr.employee_id = ?
    `;

    const queryParams = [employee_id];

    if (department) {
      query += ` AND ea.position = ?`;
      queryParams.push(department);
    }

    // Add ordering by scheduled time
    query += ` ORDER BY pvr.time_scheduled ASC`;

    connection.query(query, queryParams, (err, results) => {
      if (err) {
        console.error("Error fetching doctor queue visits:", err);
        return res.status(500).json({
          success: false,
          message: "Database error",
          error: err.message
        });
      }

      const visits = results.map(visit => ({
        record_no: visit.record_no,
        patient_id: visit.patient_id,
        employee_id: visit.employee_id,
        patient_name: `${visit.patient_first_name} ${visit.patient_last_name}`,
        doctor_name: `Dr. ${visit.doctor_first_name} ${visit.doctor_last_name}`,
        doctor_department: visit.doctor_department,
        visit_purpose_title: visit.visit_purpose_title,
        visit_chief_complaint: visit.visit_chief_complaint,
        date_scheduled: visit.date_scheduled,
        time_scheduled: visit.time_scheduled,
        visit_type: visit.visit_type,
        visit_status: visit.visit_status,
        date_created: visit.date_created,
        appointment_code: visit.appointment_code,
        status: visit.visit_status
      }));

      return res.status(200).json({
        success: true,
        message: "Doctor queue visits fetched successfully",
        data: visits,
        count: visits.length,
        doctor_info: results.length > 0 ? {
          doctor_name: `Dr. ${results[0].doctor_first_name} ${results[0].doctor_last_name}`,
          department: results[0].doctor_department,
          employee_id: employee_id
        } : null
      });
    });

  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};
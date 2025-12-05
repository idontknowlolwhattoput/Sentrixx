// controllers/patientVisitController.js
import { connection } from "../config/db.js";

export const getPatientVisits = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { employee_id, visit_status, visit_type } = req.query;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: "Patient ID is required"
      });
    }

    // Build the base query
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
      FROM patient_info pi
      INNER JOIN patient_visit_record pvr ON pvr.patient_id = pi.patient_id
      INNER JOIN employee_info ei ON pvr.employee_id = ei.employee_id
      INNER JOIN employee_account ea ON ea.employee_id = ei.employee_id
      WHERE pi.patient_id = ?
    `;

    const queryParams = [patientId];

    // Add filters based on query parameters
    if (employee_id) {
      query += ` AND pvr.employee_id = ?`;
      queryParams.push(employee_id);
    }

    if (visit_status) {
      query += ` AND pvr.visit_status = ?`;
      queryParams.push(visit_status);
    }

    if (visit_type) {
      query += ` AND pvr.visit_type = ?`;
      queryParams.push(visit_type);
    }

    // Add ordering
    query += ` ORDER BY pvr.date_scheduled DESC, pvr.time_scheduled DESC`;

    connection.query(query, queryParams, (err, results) => {
      if (err) {
        console.error("Error fetching patient visits:", err);
        return res.status(500).json({
          success: false,
          message: "Database error",
          error: err.message
        });
      }

      // Transform the results to a more frontend-friendly format
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
        appointment_code: visit.appointment_code
      }));

      return res.status(200).json({
        success: true,
        message: "Patient visits fetched successfully",
        data: visits,
        filters: {
          employee_id,
          visit_status,
          visit_type
        }
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

// Get visits with multiple filters (for more complex filtering)
export const getFilteredVisits = async (req, res) => {
  try {
    const { patient_id, employee_id, visit_status, visit_type, date_from, date_to } = req.query;

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
      FROM patient_info pi
      INNER JOIN patient_visit_record pvr ON pvr.patient_id = pi.patient_id
      INNER JOIN employee_info ei ON pvr.employee_id = ei.employee_id
      INNER JOIN employee_account ea ON ea.employee_id = ei.employee_id
      WHERE 1=1
    `;

    const queryParams = [];

    // Add filters based on query parameters
    if (patient_id) {
      query += ` AND pvr.patient_id = ?`;
      queryParams.push(patient_id);
    }

    if (employee_id) {
      query += ` AND pvr.employee_id = ?`;
      queryParams.push(employee_id);
    }

    if (visit_status) {
      query += ` AND pvr.visit_status = ?`;
      queryParams.push(visit_status);
    }

    if (visit_type) {
      query += ` AND pvr.visit_type = ?`;
      queryParams.push(visit_type);
    }

    if (date_from) {
      query += ` AND pvr.date_scheduled >= ?`;
      queryParams.push(date_from);
    }

    if (date_to) {
      query += ` AND pvr.date_scheduled <= ?`;
      queryParams.push(date_to);
    }

    // Add ordering
    query += ` ORDER BY pvr.date_scheduled DESC, pvr.time_scheduled DESC`;

    connection.query(query, queryParams, (err, results) => {
      if (err) {
        console.error("Error fetching filtered visits:", err);
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
        appointment_code: visit.appointment_code
      }));

      return res.status(200).json({
        success: true,
        message: "Filtered visits fetched successfully",
        data: visits,
        count: visits.length,
        filters: {
          patient_id,
          employee_id,
          visit_status,
          visit_type,
          date_from,
          date_to
        }
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

// Get visit statistics for a patient
export const getVisitStatistics = async (req, res) => {
  try {
    const { patientId } = req.params;

    const query = `
      SELECT 
        visit_status,
        visit_type,
        COUNT(*) as count
      FROM patient_visit_record 
      WHERE patient_id = ?
      GROUP BY visit_status, visit_type
      ORDER BY visit_status, visit_type
    `;

    connection.query(query, [patientId], (err, results) => {
      if (err) {
        console.error("Error fetching visit statistics:", err);
        return res.status(500).json({
          success: false,
          message: "Database error",
          error: err.message
        });
      }

      const statistics = {
        total: results.reduce((sum, row) => sum + row.count, 0),
        by_status: {},
        by_type: {},
        detailed: results
      };

      // Organize by status and type
      results.forEach(row => {
        statistics.by_status[row.visit_status] = (statistics.by_status[row.visit_status] || 0) + row.count;
        statistics.by_type[row.visit_type] = (statistics.by_type[row.visit_type] || 0) + row.count;
      });

      return res.status(200).json({
        success: true,
        message: "Visit statistics fetched successfully",
        data: statistics
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

// Get single visit by record_no
export const getVisitById = async (req, res) => {
  try {
    const { recordNo } = req.params;

    const query = `
      SELECT 
        pvr.record_no,
        pi.patient_id,
        pi.first_name as patient_first_name,
        pi.last_name as patient_last_name,
        pi.email as patient_email,
        pi.date_of_birth,
        pi.gender,
        pvr.visit_purpose_title,
        pvr.visit_chief_complaint,
        pvr.date_scheduled,
        pvr.time_scheduled,
        ei.employee_id,
        ei.first_name as doctor_first_name,
        ei.last_name as doctor_last_name,
        ea.position as doctor_department,
        pvr.visit_type,
        pvr.visit_status,
        pvr.date_created,
        pvr.appointment_code
      FROM patient_info pi
      INNER JOIN patient_visit_record pvr ON pvr.patient_id = pi.patient_id
      INNER JOIN employee_info ei ON pvr.employee_id = ei.employee_id
      INNER JOIN employee_account ea ON ea.employee_id = ei.employee_id
      WHERE pvr.record_no = ?
    `;

    connection.query(query, [recordNo], (err, results) => {
      if (err) {
        console.error("Error fetching visit:", err);
        return res.status(500).json({
          success: false,
          message: "Database error",
          error: err.message
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Visit not found"
        });
      }

      const visit = results[0];
      const formattedVisit = {
        record_no: visit.record_no,
        patient: {
          patient_id: visit.patient_id,
          full_name: `${visit.patient_first_name} ${visit.patient_last_name}`,
          email: visit.patient_email,
          date_of_birth: visit.date_of_birth,
          gender: visit.gender
        },
        doctor: {
          employee_id: visit.employee_id,
          full_name: `Dr. ${visit.doctor_first_name} ${visit.doctor_last_name}`,
          department: visit.doctor_department
        },
        visit_details: {
          purpose_title: visit.visit_purpose_title,
          chief_complaint: visit.visit_chief_complaint,
          date_scheduled: visit.date_scheduled,
          time_scheduled: visit.time_scheduled,
          visit_type: visit.visit_type,
          visit_status: visit.visit_status,
          date_created: visit.date_created,
          appointment_code: visit.appointment_code
        }
      };

      return res.status(200).json({
        success: true,
        message: "Visit fetched successfully",
        data: formattedVisit
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
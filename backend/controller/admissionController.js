// controllers/admissionController.js
import { connection } from "../config/db.js";

export const createAdmissionController = (req, res) => {
  const {
    patient_id,
    admission_type,
    admission_date,
    admission_time,
    mode_of_arrival,
    triage_category,
    insurance_provider,
    chief_complaint,
    pain_score,
    pain_location,
    fall_risk_score,
    general_appearance,
    mobility_status,
    special_needs,
    patient_diagnosis,
    dietary_orders,
    activity_orders,
    isolation_precautions,
    ward_id,
    bed_number
  } = req.body;

  // Validate required fields
  if (!patient_id || !admission_type || !triage_category || !chief_complaint || !patient_diagnosis || !ward_id || !bed_number) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: patient_id, admission_type, triage_category, chief_complaint, patient_diagnosis, ward_id, bed_number'
    });
  }

  // Helper function to convert 12-hour time to 24-hour format for MySQL
  const convertTimeToMySQLFormat = (timeStr) => {
    if (!timeStr) {
      // Default to current time in 24-hour format
      const now = new Date();
      return now.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    }

    // If already in 24-hour format with seconds (HH:MM:SS), return as is
    if (timeStr.match(/^\d{1,2}:\d{2}:\d{2}$/)) {
      return timeStr;
    }

    // If in 24-hour format without seconds (HH:MM), add seconds
    if (timeStr.match(/^\d{1,2}:\d{2}$/) && !timeStr.includes('AM') && !timeStr.includes('PM')) {
      return `${timeStr}:00`;
    }

    // Convert 12-hour format (HH:MM AM/PM) to 24-hour format
    if (timeStr.includes('AM') || timeStr.includes('PM')) {
      const [time, modifier] = timeStr.split(' ');
      let [hours, minutes] = time.split(':');
      
      if (hours === '12') {
        hours = modifier === 'AM' ? '00' : '12';
      } else if (modifier === 'PM') {
        hours = parseInt(hours, 10) + 12;
      }
      
      // Ensure hours are 2 digits
      hours = hours.toString().padStart(2, '0');
      return `${hours}:${minutes}:00`;
    }

    // If we can't parse it, return current time
    const now = new Date();
    return now.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Use MySQL's STR_TO_DATE function to handle time conversion from 12-hour to 24-hour format
  const query = `
    INSERT INTO admissions (
      patient_id, admission_type, admission_date, admission_time, 
      mode_of_arrival, triage_category, insurance_provider,
      chief_complaint, pain_score, pain_location, fall_risk_score,
      general_appearance, mobility_status, special_needs, patient_diagnosis,
      dietary_orders, activity_orders, isolation_precautions,
      ward_id, bed_number, admission_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'admitted')
  `;

  const values = [
    patient_id, 
    admission_type, 
    admission_date || new Date().toISOString().split('T')[0], 
    convertTimeToMySQLFormat(admission_time),
    mode_of_arrival, 
    triage_category, 
    insurance_provider,
    chief_complaint, 
    pain_score || null, 
    pain_location || null, 
    fall_risk_score || null,
    general_appearance || null, 
    mobility_status || null, 
    special_needs || null, 
    patient_diagnosis,
    dietary_orders || null, 
    activity_orders || null, 
    isolation_precautions || null,
    ward_id, 
    bed_number
  ];

  console.log('Creating admission with values:', {
    patient_id: values[0],
    admission_type: values[1],
    admission_date: values[2],
    admission_time: values[3],
    mode_of_arrival: values[4],
    triage_category: values[5],
    insurance_provider: values[6],
    chief_complaint: values[7],
    pain_score: values[8],
    pain_location: values[9],
    fall_risk_score: values[10],
    general_appearance: values[11],
    mobility_status: values[12],
    special_needs: values[13],
    patient_diagnosis: values[14],
    dietary_orders: values[15],
    activity_orders: values[16],
    isolation_precautions: values[17],
    ward_id: values[18],
    bed_number: values[19]
  });

  connection.query(query, values, (err, result) => {
    if (err) {
      console.error('Database error creating admission:', err.message);
      console.error('Full error details:', err);
      return res.status(500).json({
        success: false,
        message: 'Database error',
        error: err.message,
        sqlMessage: err.sqlMessage
      });
    }

    res.status(201).json({
      success: true,
      message: 'Admission created successfully',
      admission_id: result.insertId,
      data: {
        admission_id: result.insertId,
        patient_id,
        admission_type,
        admission_date: values[2],
        admission_time: values[3],
        ward_id,
        bed_number,
        patient_diagnosis
      }
    });
  });
};

export const getAdmissionByIdController = (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT a.*, 
           p.first_name, p.middle_name, p.last_name,
           p.date_of_birth, p.gender, p.mobile_number, p.email
    FROM admissions a
    JOIN patient_info p ON a.patient_id = p.patient_id
    WHERE a.admission_id = ?
  `;

  connection.query(query, [id], (err, results) => {
    if (err) {
      console.error('Database error fetching admission:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Database error'
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Admission not found'
      });
    }

    res.json({
      success: true,
      admission: results[0]
    });
  });
};

export const getAdmissionsByPatientIdController = (req, res) => {
  const { patient_id } = req.params;

  const query = `
    SELECT * FROM admissions 
    WHERE patient_id = ? 
    ORDER BY admission_date DESC, admission_time DESC
  `;

  connection.query(query, [patient_id], (err, results) => {
    if (err) {
      console.error('Database error fetching admissions:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Database error'
      });
    }

    res.json({
      success: true,
      admissions: results
    });
  });
};

export const getAllAdmissionsController = (req, res) => {
  const { status, ward_id, date } = req.query;
  
  let query = `
    SELECT a.*, 
           p.first_name, p.middle_name, p.last_name,
           p.date_of_birth, p.gender
    FROM admissions a
    JOIN patient_info p ON a.patient_id = p.patient_id
    WHERE 1=1
  `;
  
  const params = [];
  
  if (status) {
    query += ' AND a.admission_status = ?';
    params.push(status);
  }
  
  if (ward_id) {
    query += ' AND a.ward_id = ?';
    params.push(ward_id);
  }
  
  if (date) {
    query += ' AND DATE(a.admission_date) = ?';
    params.push(date);
  }
  
  query += ' ORDER BY a.admission_date DESC, a.admission_time DESC';
  
  connection.query(query, params, (err, results) => {
    if (err) {
      console.error('Database error fetching admissions:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Database error'
      });
    }

    res.json({
      success: true,
      admissions: results
    });
  });
};

export const updateAdmissionController = (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  // Remove fields that shouldn't be updated
  delete updates.patient_id;
  delete updates.admission_id;
  delete updates.created_at;
  
  // Build dynamic update query
  const fields = Object.keys(updates);
  const values = Object.values(updates);
  
  if (fields.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No fields to update'
    });
  }
  
  const setClause = fields.map(field => `${field} = ?`).join(', ');
  const query = `UPDATE admissions SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE admission_id = ?`;
  
  values.push(id);
  
  connection.query(query, values, (err, result) => {
    if (err) {
      console.error('Database error updating admission:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Database error'
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Admission not found'
      });
    }

    res.json({
      success: true,
      message: 'Admission updated successfully'
    });
  });
};

export const dischargePatientController = (req, res) => {
  const { id } = req.params;
  const { discharge_date, discharge_time, discharge_summary } = req.body;

  // Helper function to convert time format for discharge
  const convertTimeToMySQLFormat = (timeStr) => {
    if (!timeStr) {
      const now = new Date();
      return now.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    }

    if (timeStr.match(/^\d{1,2}:\d{2}:\d{2}$/)) {
      return timeStr;
    }

    if (timeStr.match(/^\d{1,2}:\d{2}$/) && !timeStr.includes('AM') && !timeStr.includes('PM')) {
      return `${timeStr}:00`;
    }

    if (timeStr.includes('AM') || timeStr.includes('PM')) {
      const [time, modifier] = timeStr.split(' ');
      let [hours, minutes] = time.split(':');
      
      if (hours === '12') {
        hours = modifier === 'AM' ? '00' : '12';
      } else if (modifier === 'PM') {
        hours = parseInt(hours, 10) + 12;
      }
      
      hours = hours.toString().padStart(2, '0');
      return `${hours}:${minutes}:00`;
    }

    const now = new Date();
    return now.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const query = `
    UPDATE admissions 
    SET admission_status = 'discharged',
        discharge_date = ?,
        discharge_time = ?,
        discharge_summary = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE admission_id = ? AND admission_status = 'admitted'
  `;

  const formattedDischargeTime = convertTimeToMySQLFormat(discharge_time);

  connection.query(query, [discharge_date, formattedDischargeTime, discharge_summary, id], (err, result) => {
    if (err) {
      console.error('Database error discharging patient:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Database error'
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Admission not found or already discharged'
      });
    }

    res.json({
      success: true,
      message: 'Patient discharged successfully'
    });
  });
};

export const getAdmissionStatisticsController = (req, res) => {
  const query = `
    SELECT 
      COUNT(*) as total_admissions,
      SUM(CASE WHEN admission_status = 'admitted' THEN 1 ELSE 0 END) as current_admissions,
      SUM(CASE WHEN admission_status = 'discharged' THEN 1 ELSE 0 END) as discharged_patients,
      COUNT(DISTINCT ward_id) as wards_occupied,
      admission_type,
      COUNT(*) as count_by_type
    FROM admissions
    GROUP BY admission_type
  `;

  connection.query(query, (err, results) => {
    if (err) {
      console.error('Database error fetching statistics:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Database error'
      });
    }

    res.json({
      success: true,
      statistics: results
    });
  });
};

export const getCurrentAdmissionsController = (req, res) => {
  const query = `
    SELECT a.*, 
           p.first_name, p.middle_name, p.last_name,
           p.date_of_birth, p.gender, p.mobile_number
    FROM admissions a
    JOIN patient_info p ON a.patient_id = p.patient_id
    WHERE a.admission_status = 'admitted'
    ORDER BY a.admission_date DESC, a.admission_time DESC
  `;

  connection.query(query, (err, results) => {
    if (err) {
      console.error('Database error fetching current admissions:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Database error'
      });
    }

    res.json({
      success: true,
      admissions: results
    });
  });
};

export const getAdmissionsByWardController = (req, res) => {
  const { ward_id } = req.params;

  const query = `
    SELECT a.*, 
           p.first_name, p.middle_name, p.last_name,
           p.date_of_birth, p.gender
    FROM admissions a
    JOIN patient_info p ON a.patient_id = p.patient_id
    WHERE a.ward_id = ? AND a.admission_status = 'admitted'
    ORDER BY a.bed_number ASC
  `;

  connection.query(query, [ward_id], (err, results) => {
    if (err) {
      console.error('Database error fetching ward admissions:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Database error'
      });
    }

    res.json({
      success: true,
      admissions: results
    });
  });
};

export const getBedOccupancyController = (req, res) => {
  const query = `
    SELECT 
      ward_id,
      bed_number,
      COUNT(*) as occupied_count,
      MAX(CASE WHEN admission_status = 'admitted' THEN 1 ELSE 0 END) as is_occupied
    FROM admissions
    WHERE admission_status = 'admitted'
    GROUP BY ward_id, bed_number
  `;

  connection.query(query, (err, results) => {
    if (err) {
      console.error('Database error fetching bed occupancy:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Database error'
      });
    }

    res.json({
      success: true,
      bed_occupancy: results
    });
  });
};

// Helper function to format time for display (convert 24-hour to 12-hour)
export const formatTimeForDisplay = (time24) => {
  if (!time24) return '';
  
  // If already in 12-hour format, return as is
  if (time24.includes('AM') || time24.includes('PM')) {
    return time24;
  }
  
  // Convert HH:MM:SS to 12-hour format
  const [hours, minutes, seconds] = time24.split(':');
  let hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  hour = hour ? hour : 12; // the hour '0' should be '12'
  
  return `${hour.toString().padStart(2, '0')}:${minutes} ${ampm}`;
};
// controllers/analyticsController.js
import { connection } from "../config/db.js";

// 1. PATIENT ANALYTICS
export const getPatientAnalytics = (req, res) => {
  const { startDate, endDate, department } = req.query;
  
  const queries = {
    // Basic Counts
    patientCounts: `
      SELECT 
        COUNT(*) as total_patients,
        SUM(CASE WHEN gender = 'Male' THEN 1 ELSE 0 END) as male_count,
        SUM(CASE WHEN gender = 'Female' THEN 1 ELSE 0 END) as female_count,
        AVG(YEAR(CURDATE()) - YEAR(date_of_birth)) as avg_age,
        MIN(YEAR(CURDATE()) - YEAR(date_of_birth)) as min_age,
        MAX(YEAR(CURDATE()) - YEAR(date_of_birth)) as max_age
      FROM patient_info
    `,
    
    // Age Distribution
    ageDistribution: `
      SELECT 
        CASE 
          WHEN TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) BETWEEN 0 AND 18 THEN '0-18'
          WHEN TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) BETWEEN 19 AND 35 THEN '19-35'
          WHEN TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) BETWEEN 36 AND 50 THEN '36-50'
          ELSE '51+'
        END as age_group,
        COUNT(*) as count
      FROM patient_info
      GROUP BY age_group
      ORDER BY FIELD(age_group, '0-18', '19-35', '36-50', '51+')
    `,
    
    // Patient Demographics
    demographics: `
      SELECT 
        gender,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM patient_info), 2) as percentage
      FROM patient_info
      GROUP BY gender
    `,
    
    // Geographic Distribution
    geographicDistribution: `
      SELECT 
        city_municipality,
        COUNT(*) as patient_count
      FROM patient_info
      GROUP BY city_municipality
      ORDER BY patient_count DESC
      LIMIT 10
    `,
    
    // Blood Type Distribution
    bloodTypeDistribution: `
      SELECT 
        pm.blood_type,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM patient_medical_info), 2) as percentage
      FROM patient_medical_info pm
      JOIN patient_info p ON pm.patient_id = p.patient_id
      WHERE pm.blood_type IS NOT NULL
      GROUP BY pm.blood_type
      ORDER BY count DESC
    `
  };

  // Execute all queries
  const results = {};
  const promises = Object.entries(queries).map(([key, query]) => {
    return new Promise((resolve, reject) => {
      connection.query(query, (err, data) => {
        if (err) {
          console.error(`Error in ${key} query:`, err);
          resolve({ [key]: null });
        } else {
          resolve({ [key]: data });
        }
      });
    });
  });

  Promise.all(promises)
    .then(data => {
      data.forEach(item => {
        Object.assign(results, item);
      });
      res.json(results);
    })
    .catch(err => {
      console.error("Error in analytics query:", err);
      res.status(500).json({ error: "Failed to fetch analytics data" });
    });
};

// 2. ADMISSION ANALYTICS
export const getAdmissionAnalytics = (req, res) => {
  const { timeframe = 'month' } = req.query;
  
  let dateFilter = '';
  switch(timeframe) {
    case 'week':
      dateFilter = "AND admission_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)";
      break;
    case 'month':
      dateFilter = "AND admission_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)";
      break;
    case 'year':
      dateFilter = "AND admission_date >= DATE_SUB(CURDATE(), INTERVAL 365 DAY)";
      break;
  }

  const queries = {
    // Admission Statistics
    admissionStats: `
      SELECT 
        admission_type,
        COUNT(*) as count,
        AVG(pain_score) as avg_pain_score,
        AVG(TIMESTAMPDIFF(HOUR, 
            CONCAT(admission_date, ' ', admission_time),
            IF(discharge_date IS NULL, NOW(), CONCAT(discharge_date, ' ', discharge_time))
        )) as avg_stay_hours
      FROM admissions
      WHERE 1=1 ${dateFilter}
      GROUP BY admission_type
    `,
    
    // Triage Category Distribution
    triageDistribution: `
      SELECT 
        triage_category,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM admissions WHERE 1=1 ${dateFilter}), 2) as percentage
      FROM admissions
      WHERE 1=1 ${dateFilter}
      GROUP BY triage_category
      ORDER BY 
        FIELD(triage_category, 'resuscitation', 'emergency', 'urgent', 'standard')
    `,
    
    // Daily Admission Trends
    admissionTrends: `
      SELECT 
        DATE(admission_date) as date,
        COUNT(*) as admission_count,
        SUM(CASE WHEN admission_type = 'emergency' THEN 1 ELSE 0 END) as emergency_count,
        SUM(CASE WHEN admission_type = 'elective' THEN 1 ELSE 0 END) as elective_count
      FROM admissions
      WHERE admission_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY DATE(admission_date)
      ORDER BY date DESC
      LIMIT 30
    `,
    
    // Bed Occupancy
    bedOccupancy: `
      SELECT 
        ward_id,
        COUNT(*) as occupied_beds,
        (SELECT COUNT(DISTINCT bed_number) FROM admissions WHERE ward_id = a.ward_id) as total_beds,
        ROUND(COUNT(*) * 100.0 / 
          (SELECT COUNT(DISTINCT bed_number) FROM admissions WHERE ward_id = a.ward_id), 2) as occupancy_rate
      FROM admissions a
      WHERE admission_status = 'admitted'
      GROUP BY ward_id
      ORDER BY occupancy_rate DESC
    `,
    
    // Discharge Patterns
    dischargePatterns: `
      SELECT 
        HOUR(discharge_time) as hour_of_day,
        COUNT(*) as discharge_count,
        DAYNAME(discharge_date) as day_of_week
      FROM admissions
      WHERE discharge_date IS NOT NULL
        AND discharge_date >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
      GROUP BY HOUR(discharge_time), DAYNAME(discharge_date)
      ORDER BY discharge_count DESC
    `
  };

  executeMultipleQueries(queries)
    .then(results => res.json(results))
    .catch(err => {
      console.error("Admission analytics error:", err);
      res.status(500).json({ error: "Failed to fetch admission analytics" });
    });
};

// 3. MEDICAL ANALYTICS
export const getMedicalAnalytics = (req, res) => {
  const queries = {
    // Vital Signs Statistics
    vitalSignsStats: `
      SELECT 
        AVG(CAST(SUBSTRING_INDEX(blood_pressure, '/', 1) AS UNSIGNED)) as avg_systolic,
        AVG(CAST(SUBSTRING_INDEX(blood_pressure, '/', -1) AS UNSIGNED)) as avg_diastolic,
        AVG(heart_rate) as avg_heart_rate,
        AVG(temperature) as avg_temperature,
        AVG(respiratory_rate) as avg_respiratory_rate,
        AVG(oxygen_saturation) as avg_oxygen_saturation
      FROM patient_vital_signs
      WHERE blood_pressure IS NOT NULL
    `,
    
    // Common Allergies
    commonAllergies: `
      SELECT 
        allergen,
        COUNT(*) as frequency,
        GROUP_CONCAT(DISTINCT reaction) as common_reactions,
        AVG(CASE severity 
          WHEN 'Severe' THEN 3 
          WHEN 'Moderate' THEN 2 
          WHEN 'Mild' THEN 1 
          ELSE 1 END) as avg_severity
      FROM patient_allergy
      GROUP BY allergen
      ORDER BY frequency DESC
      LIMIT 10
    `,
    
    // Medical History Analysis
    medicalHistory: `
      SELECT 
        medical_history,
        COUNT(*) as patient_count
      FROM patient_medical_info
      WHERE medical_history IS NOT NULL AND medical_history != ''
      GROUP BY medical_history
      ORDER BY patient_count DESC
      LIMIT 15
    `,
    
    // Medication Usage
    medicationUsage: `
      SELECT 
        current_medications as medication,
        COUNT(*) as patient_count
      FROM patient_medical_info
      WHERE current_medications IS NOT NULL AND current_medications != ''
      GROUP BY current_medications
      ORDER BY patient_count DESC
      LIMIT 10
    `,
    
    // BMI Analysis
    bmiAnalysis: `
      SELECT 
        p.patient_id,
        p.first_name,
        p.last_name,
        p.gender,
        pm.height,
        pm.weight,
        ROUND(pm.weight / ((pm.height/100) * (pm.height/100)), 2) as bmi,
        CASE 
          WHEN pm.weight / ((pm.height/100) * (pm.height/100)) < 18.5 THEN 'Underweight'
          WHEN pm.weight / ((pm.height/100) * (pm.height/100)) BETWEEN 18.5 AND 24.9 THEN 'Normal'
          WHEN pm.weight / ((pm.height/100) * (pm.height/100)) BETWEEN 25 AND 29.9 THEN 'Overweight'
          ELSE 'Obese'
        END as bmi_category
      FROM patient_medical_info pm
      JOIN patient_info p ON pm.patient_id = p.patient_id
      WHERE pm.height IS NOT NULL AND pm.weight IS NOT NULL
      ORDER BY bmi DESC
    `
  };

  executeMultipleQueries(queries)
    .then(results => res.json(results))
    .catch(err => {
      console.error("Medical analytics error:", err);
      res.status(500).json({ error: "Failed to fetch medical analytics" });
    });
};

// 4. LABORATORY ANALYTICS
export const getLaboratoryAnalytics = (req, res) => {
  const { timeframe = 'month' } = req.query;
  
  let dateFilter = '';
  switch(timeframe) {
    case 'week': dateFilter = "AND date_requested >= DATE_SUB(NOW(), INTERVAL 7 DAY)"; break;
    case 'month': dateFilter = "AND date_requested >= DATE_SUB(NOW(), INTERVAL 30 DAY)"; break;
    case 'year': dateFilter = "AND date_requested >= DATE_SUB(NOW(), INTERVAL 365 DAY)"; break;
  }

  const queries = {
    // Test Statistics
    testStats: `
      SELECT 
        test_name,
        COUNT(*) as total_tests,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed_tests,
        SUM(CASE WHEN status = 'In-Progress' THEN 1 ELSE 0 END) as in_progress_tests,
        SUM(CASE WHEN status = 'Requested' THEN 1 ELSE 0 END) as pending_tests,
        AVG(TIMESTAMPDIFF(HOUR, date_requested, NOW())) as avg_processing_time_hours
      FROM patient_laboratory_test
      WHERE 1=1 ${dateFilter}
      GROUP BY test_name
      ORDER BY total_tests DESC
    `,
    
    // Test Volume Trends
    testVolumeTrends: `
      SELECT 
        DATE(date_requested) as request_date,
        COUNT(*) as test_count,
        SUM(CASE WHEN test_name LIKE '%X-Ray%' THEN 1 ELSE 0 END) as xray_count,
        SUM(CASE WHEN test_name LIKE '%Blood%' THEN 1 ELSE 0 END) as blood_test_count
      FROM patient_laboratory_test
      WHERE date_requested >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(date_requested)
      ORDER BY request_date
    `,
    
    // Physician Request Analysis
    physicianRequests: `
      SELECT 
        e.employee_id,
        CONCAT(ei.first_name, ' ', ei.last_name) as physician_name,
        ei.position,
        COUNT(plt.record_no) as tests_requested,
        GROUP_CONCAT(DISTINCT plt.test_name) as test_types
      FROM patient_laboratory_test plt
      JOIN employee_account e ON plt.employee_id = e.employee_id
      JOIN employee_info ei ON e.employee_id = ei.employee_id
      WHERE plt.date_requested >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY e.employee_id, ei.first_name, ei.last_name, ei.position
      ORDER BY tests_requested DESC
    `,
    
    // Test Status Distribution
    testStatus: `
      SELECT 
        status,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM patient_laboratory_test WHERE 1=1 ${dateFilter}), 2) as percentage
      FROM patient_laboratory_test
      WHERE 1=1 ${dateFilter}
      GROUP BY status
      ORDER BY 
        FIELD(status, 'Requested', 'In-Progress', 'Completed')
    `,
    
    // Patient Test Frequency
    patientTestFrequency: `
      SELECT 
        p.patient_id,
        CONCAT(p.first_name, ' ', p.last_name) as patient_name,
        COUNT(plt.record_no) as test_count,
        GROUP_CONCAT(DISTINCT plt.test_name) as tests_taken
      FROM patient_laboratory_test plt
      JOIN patient_info p ON plt.patient_id = p.patient_id
      WHERE plt.date_requested >= DATE_SUB(NOW(), INTERVAL 90 DAY)
      GROUP BY p.patient_id, p.first_name, p.last_name
      HAVING test_count > 1
      ORDER BY test_count DESC
      LIMIT 10
    `
  };

  executeMultipleQueries(queries)
    .then(results => res.json(results))
    .catch(err => {
      console.error("Laboratory analytics error:", err);
      res.status(500).json({ error: "Failed to fetch laboratory analytics" });
    });
};

// 5. CONSULTATION ANALYTICS
export const getConsultationAnalytics = (req, res) => {
  const queries = {
    // Consultation Statistics
    consultationStats: `
      SELECT 
        DATE(date_taken) as consultation_date,
        COUNT(*) as total_consultations,
        AVG(LENGTH(symptoms)) as avg_symptom_length,
        COUNT(DISTINCT patient_id) as unique_patients,
        COUNT(DISTINCT employee_id) as consulting_physicians
      FROM consultations
      WHERE date_taken >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(date_taken)
      ORDER BY consultation_date DESC
    `,
    
    // Severity Analysis
    severityAnalysis: `
      SELECT 
        severity,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM consultations), 2) as percentage,
        AVG(LENGTH(symptoms)) as avg_symptom_length
      FROM consultations
      GROUP BY severity
      ORDER BY 
        FIELD(severity, 'mild', 'moderate', 'severe')
    `,
    
    // Physician Performance
    physicianPerformance: `
      SELECT 
        ei.employee_id,
        CONCAT(ei.first_name, ' ', ei.last_name) as physician_name,
        ei.position,
        COUNT(c.consultation_id) as total_consultations,
        AVG(LENGTH(c.assessment)) as avg_assessment_length,
        COUNT(DISTINCT c.patient_id) as unique_patients,
        GROUP_CONCAT(DISTINCT c.diagnosis) as common_diagnoses
      FROM consultations c
      JOIN employee_info ei ON c.employee_id = ei.employee_id
      WHERE c.date_taken >= DATE_SUB(NOW(), INTERVAL 90 DAY)
      GROUP BY ei.employee_id, ei.first_name, ei.last_name, ei.position
      ORDER BY total_consultations DESC
    `,
    
    // Common Diagnoses
    commonDiagnoses: `
      SELECT 
        diagnosis,
        COUNT(*) as frequency,
        GROUP_CONCAT(DISTINCT severity) as severities,
        AVG(LENGTH(symptoms)) as avg_symptom_length
      FROM consultations
      WHERE diagnosis IS NOT NULL AND diagnosis != ''
      GROUP BY diagnosis
      HAVING frequency > 1
      ORDER BY frequency DESC
      LIMIT 15
    `,
    
    // Follow-up Analysis
    followUpAnalysis: `
      SELECT 
        follow_up,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM consultations), 2) as percentage
      FROM consultations
      WHERE follow_up IS NOT NULL
      GROUP BY follow_up
      ORDER BY count DESC
    `
  };

  executeMultipleQueries(queries)
    .then(results => res.json(results))
    .catch(err => {
      console.error("Consultation analytics error:", err);
      res.status(500).json({ error: "Failed to fetch consultation analytics" });
    });
};

// 6. COMPREHENSIVE DASHBOARD DATA
export const getDashboardData = (req, res) => {
  const queries = {
    // Key Metrics
    keyMetrics: `
      SELECT 
        (SELECT COUNT(*) FROM patient_info) as total_patients,
        (SELECT COUNT(*) FROM admissions WHERE admission_status = 'admitted') as active_admissions,
        (SELECT COUNT(*) FROM patient_laboratory_test WHERE status != 'Completed') as pending_tests,
        (SELECT COUNT(*) FROM consultations WHERE DATE(date_taken) = CURDATE()) as today_consultations,
        (SELECT COUNT(*) FROM employee_account) as total_staff,
        (SELECT COUNT(DISTINCT ward_id) FROM admissions) as active_wards
    `,
    
    // Recent Activity
    recentActivity: `
      (SELECT 'Admission' as type, CONCAT('Patient #', patient_id) as description, admission_date as date
       FROM admissions ORDER BY admission_date DESC LIMIT 5)
      UNION ALL
      (SELECT 'Consultation' as type, CONCAT('Consultation #', consultation_id) as description, date_taken as date
       FROM consultations ORDER BY date_taken DESC LIMIT 5)
      UNION ALL
      (SELECT 'Lab Test' as type, CONCAT(test_name, ' for Patient #', patient_id) as description, date_requested as date
       FROM patient_laboratory_test ORDER BY date_requested DESC LIMIT 5)
      ORDER BY date DESC
      LIMIT 10
    `,
    
    // System Health
    systemHealth: `
      SELECT 
        'Patient Records' as metric, COUNT(*) as value FROM patient_info
      UNION ALL
      SELECT 'Active Admissions', COUNT(*) FROM admissions WHERE admission_status = 'admitted'
      UNION ALL
      SELECT 'Pending Tests', COUNT(*) FROM patient_laboratory_test WHERE status != 'Completed'
      UNION ALL
      SELECT 'Today\'s Consultations', COUNT(*) FROM consultations WHERE DATE(date_taken) = CURDATE()
      UNION ALL
      SELECT 'Staff Online', (SELECT COUNT(*) FROM employee_account) * 0.7
    `
  };

  executeMultipleQueries(queries)
    .then(results => res.json(results))
    .catch(err => {
      console.error("Dashboard data error:", err);
      res.status(500).json({ error: "Failed to fetch dashboard data" });
    });
};

// Helper function to execute multiple queries
const executeMultipleQueries = (queries) => {
  return new Promise((resolve, reject) => {
    const results = {};
    const queryEntries = Object.entries(queries);
    let completed = 0;

    queryEntries.forEach(([key, query]) => {
      connection.query(query, (err, data) => {
        if (err) {
          console.error(`Error in ${key} query:`, err);
          results[key] = { error: err.message };
        } else {
          results[key] = data;
        }

        completed++;
        if (completed === queryEntries.length) {
          resolve(results);
        }
      });
    });
  });
};

// 7. REAL-TIME ALERTS
export const getRealTimeAlerts = (req, res) => {
  const queries = {
    criticalPatients: `
      SELECT 
        p.patient_id,
        CONCAT(p.first_name, ' ', p.last_name) as patient_name,
        a.triage_category,
        vs.heart_rate,
        vs.blood_pressure,
        vs.oxygen_saturation,
        a.pain_score
      FROM admissions a
      JOIN patient_info p ON a.patient_id = p.patient_id
      LEFT JOIN patient_vital_signs vs ON p.patient_id = vs.patient_id
      WHERE a.admission_status = 'admitted'
        AND (a.triage_category = 'resuscitation' 
             OR a.pain_score >= 8 
             OR vs.oxygen_saturation < 90)
      ORDER BY a.triage_category, a.pain_score DESC
    `,
    
    overdueTests: `
      SELECT 
        plt.record_no,
        plt.test_name,
        p.first_name,
        p.last_name,
        TIMESTAMPDIFF(HOUR, plt.date_requested, NOW()) as hours_pending,
        ei.first_name as physician_first,
        ei.last_name as physician_last
      FROM patient_laboratory_test plt
      JOIN patient_info p ON plt.patient_id = p.patient_id
      JOIN employee_info ei ON plt.employee_id = ei.employee_id
      WHERE plt.status IN ('Requested', 'In-Progress')
        AND plt.date_requested < DATE_SUB(NOW(), INTERVAL 24 HOUR)
      ORDER BY hours_pending DESC
    `,
    
    bedShortage: `
      SELECT 
        ward_id,
        COUNT(*) as occupied_beds,
        (SELECT COUNT(DISTINCT bed_number) FROM admissions WHERE ward_id = a.ward_id) as total_beds,
        ROUND(COUNT(*) * 100.0 / 
          (SELECT COUNT(DISTINCT bed_number) FROM admissions WHERE ward_id = a.ward_id), 2) as occupancy_rate
      FROM admissions a
      WHERE admission_status = 'admitted'
      GROUP BY ward_id
      HAVING occupancy_rate > 85
      ORDER BY occupancy_rate DESC
    `,
    
    medicationAlerts: `
      SELECT 
        p.patient_id,
        CONCAT(p.first_name, ' ', p.last_name) as patient_name,
        pa.allergen,
        pa.severity,
        pm.current_medications
      FROM patient_allergy pa
      JOIN patient_info p ON pa.patient_id = p.patient_id
      LEFT JOIN patient_medical_info pm ON p.patient_id = pm.patient_id
      WHERE pa.severity = 'Severe'
        AND pm.current_medications IS NOT NULL
        AND pm.current_medications != ''
    `
  };

  executeMultipleQueries(queries)
    .then(results => res.json(results))
    .catch(err => {
      console.error("Alerts data error:", err);
      res.status(500).json({ error: "Failed to fetch alerts data" });
    });
};
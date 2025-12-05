import { connection } from '../config/db.js';

export const addConsultationController = (req, res) => {
  console.log('Consultation request received:', req.body);
  
  // Extract all fields including appointmentCode
  const {
    patientId,
    employeeId,
    appointment_code, 
    reason = '',
    symptoms = '',
    duration = '',
    severity = 'moderate',
    generalAppearance = '',
    cardiovascular = '',
    respiratory = '',
    abdominal = '',
    neurological = '',
    assessment = '',
    diagnosis = '',
    plan = '',
    follow_up = '',
    notes = '',
    bloodPressure = '',
    heartRate = '',
    temperature = '',
    respiratoryRate = '',
    oxygenSaturation = ''
  } = req.body;

  // Validate
  if (!patientId || !employeeId || !appointment_code) {
    return res.status(400).json({
      success: false,
      message: 'Patient ID, Employee ID, and Appointment Code are required'
    });
  }

  // Start a transaction to ensure data consistency
  connection.beginTransaction((beginErr) => {
    if (beginErr) {
      console.error('Transaction begin error:', beginErr);
      return res.status(500).json({
        success: false,
        message: 'Failed to start transaction',
        error: beginErr.message
      });
    }

    // Step 1: Insert consultation record
    const consultationQuery = `
      INSERT INTO consultations (
        patient_id, employee_id, reason, symptoms, duration, severity,
        general_appearance, cardiovascular, respiratory, abdominal, neurological,
        assessment, diagnosis, plan, follow_up, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const consultationValues = [
      parseInt(patientId),
      parseInt(employeeId),
      reason,
      symptoms,
      duration,
      severity,
      generalAppearance,
      cardiovascular,
      respiratory,
      abdominal,
      neurological,
      assessment,
      diagnosis,
      plan,
      follow_up,
      notes
    ];

    console.log('Executing consultation query...');
    
    connection.query(consultationQuery, consultationValues, (consultErr, consultResult) => {
      if (consultErr) {
        console.error('Consultation insert error:', consultErr);
        return connection.rollback(() => {
          res.status(500).json({
            success: false,
            message: 'Failed to save consultation',
            error: consultErr.message,
            sql: consultErr.sql
          });
        });
      }

      console.log('Consultation saved with ID:', consultResult.insertId);

      // Step 2: Update visit status to "Completed"
      const updateStatusQuery = `
        UPDATE patient_visit_record 
        SET visit_status = "Completed"
        WHERE appointment_code = ?
      `;

      console.log('Updating visit status for appointment code:',  appointment_code, );
      
      connection.query(updateStatusQuery, [appointment_code], (statusErr, statusResult) => {
        if (statusErr) {
          console.error('Status update error:', statusErr);
          return connection.rollback(() => {
            res.status(500).json({
              success: false,
              message: 'Consultation saved but failed to update visit status',
              error: statusErr.message
            });
          });
        }

        console.log('Visit status updated. Affected rows:', statusResult.affectedRows);

        // Step 3: Insert vital signs (optional - can fail without rolling back)
        if (bloodPressure || heartRate || temperature || respiratoryRate || oxygenSaturation) {
          const vitalsQuery = `
            INSERT INTO patient_vital_signs (
              patient_id, blood_pressure, heart_rate, temperature,
              respiratory_rate, oxygen_saturation
            ) VALUES (?, ?, ?, ?, ?, ?)
          `;
          
          const vitalsValues = [
            patientId,
            bloodPressure,
            heartRate ? parseInt(heartRate) : null,
            temperature ? parseFloat(temperature) : null,
            respiratoryRate ? parseInt(respiratoryRate) : null,
            oxygenSaturation ? parseInt(oxygenSaturation) : null
          ];
          
          connection.query(vitalsQuery, vitalsValues, (vitalsErr, vitalsResult) => {
            if (vitalsErr) {
              console.error('Vital signs error (non-critical):', vitalsErr);
              // Don't rollback for vital signs failure, just log it
            }

            // Commit the transaction
            connection.commit((commitErr) => {
              if (commitErr) {
                console.error('Commit error:', commitErr);
                return connection.rollback(() => {
                  res.status(500).json({
                    success: false,
                    message: 'Failed to commit transaction',
                    error: commitErr.message
                  });
                });
              }

              console.log('Transaction committed successfully');
              
              res.status(201).json({
                success: true,
                message: 'Consultation completed and visit status updated',
                consultationId: consultResult.insertId,
                statusUpdated: true,
                affectedRows: statusResult.affectedRows,
                vitalSignsId: vitalsResult ? vitalsResult.insertId : null
              });
            });
          });
        } else {
          // No vital signs to insert, just commit
          connection.commit((commitErr) => {
            if (commitErr) {
              console.error('Commit error:', commitErr);
              return connection.rollback(() => {
                res.status(500).json({
                  success: false,
                  message: 'Failed to commit transaction',
                  error: commitErr.message
                });
              });
            }

            console.log('Transaction committed successfully (no vital signs)');
            
            res.status(201).json({
              success: true,
              message: 'Consultation completed and visit status updated',
              consultationId: consultResult.insertId,
              statusUpdated: true,
              affectedRows: statusResult.affectedRows
            });
          });
        }
      });
    });
  });
};
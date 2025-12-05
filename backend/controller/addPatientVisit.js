import { connection } from "../config/db.js";
import { EmailTransporter } from "../config/emailTransporter.js";
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const AddPatientVisit = async (req, res) => {
  try {
    const { 
      patient_id, 
      employee_id, 
      date_scheduled, 
      time_scheduled,
      visit_type, 
      visit_status, 
      visit_purpose_title, 
      visit_chief_complaint 
    } = req.body;

    // Validate required fields
    if (!patient_id || !employee_id || !visit_status || !date_scheduled || !time_scheduled) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required fields: patient_id, employee_id, visit_status, date_scheduled, time_scheduled" 
      });
    }

    // Validate optional fields length
    if (visit_purpose_title && visit_purpose_title.length > 100) {
      return res.status(400).json({ 
        success: false, 
        message: "Visit purpose title must be 100 characters or less" 
      });
    }

    if (visit_chief_complaint && visit_chief_complaint.length > 500) {
      return res.status(400).json({ 
        success: false, 
        message: "Visit chief complaint must be 500 characters or less" 
      });
    }

    // Clean the date - remove any time part if present
    const cleanDate = date_scheduled.split('T')[0];

    // Check employee availability and max_appointment limit first
    const checkAvailabilityQuery = `
      SELECT max_appointment 
      FROM employee_timesheet 
      WHERE employee_id = ? 
      AND timesheet_date = ? 
      AND timesheet_time = ?
    `;

    connection.query(checkAvailabilityQuery, [employee_id, cleanDate, time_scheduled], (availabilityErr, availabilityResults) => {
      if (availabilityErr) {
        console.error("Error checking employee availability:", availabilityErr);
        return res.status(500).json({ 
          success: false, 
          message: "Error checking employee availability",
          error: availabilityErr.message 
        });
      }

      // If no timesheet record exists or max_appointment is 0, employee is not available
      if (availabilityResults.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: "Employee is not available at the scheduled time" 
        });
      }

      const currentMaxAppointment = availabilityResults[0].max_appointment;
      
      if (currentMaxAppointment <= 0) {
        return res.status(400).json({ 
          success: false, 
          message: "Employee has reached maximum appointments for this time slot" 
        });
      }

      // Generate professional appointment reference code
      const generateAppointmentCode = () => {
        const prefix = "APT";
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `${prefix}-${timestamp}-${random}`;
      };

      const appointmentCode = generateAppointmentCode();

      // Generate QR code as buffer (not data URL)
      const generateQRCodeBuffer = async (code) => {
        try {
          const qrBuffer = await QRCode.toBuffer(code, {
            errorCorrectionLevel: 'H',
            type: 'png',
            quality: 0.9,
            margin: 1,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            },
            width: 200
          });
          return qrBuffer;
        } catch (error) {
          console.error("Error generating QR code:", error);
          throw error;
        }
      };

      // SQL Query - keep date_scheduled as DATE and time_scheduled as TIME
      const query = `
        INSERT INTO patient_visit_record
          (patient_id, employee_id, date_scheduled, time_scheduled, visit_type, visit_purpose_title, visit_chief_complaint, appointment_code) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        patient_id, 
        employee_id, 
        cleanDate,
        time_scheduled,
        visit_type || null, 
        visit_purpose_title || null, 
        visit_chief_complaint || null,
        appointmentCode
      ];

      connection.query(query, values, async (err, result) => {
        if (err) {
          console.error("Error inserting patient visit:", err);
          return res.status(500).json({ 
            success: false, 
            message: "Database error",
            error: err.message 
          });
        }

        // Deduct 1 from max_appointment in employee_timesheet
        const updateTimesheetQuery = `
          UPDATE employee_timesheet 
          SET max_appointment = max_appointment - 1 
          WHERE employee_id = ? 
          AND timesheet_date = ? 
          AND timesheet_time = ?
          AND max_appointment > 0
        `;

        connection.query(updateTimesheetQuery, [employee_id, cleanDate, time_scheduled], (updateErr, updateResult) => {
          if (updateErr) {
            console.error("Error updating employee timesheet:", updateErr);
          }

          if (updateResult.affectedRows === 0) {
            console.warn("No timesheet record updated - possible data inconsistency");
          } else {
            console.log("Successfully deducted 1 from max_appointment for employee timesheet");
          }

          // Continue with the rest of the process (email and response)
          completeAppointmentProcess(result);
        });

        async function completeAppointmentProcess(result) {
          try {
            // Generate QR code buffer
            const qrBuffer = await generateQRCodeBuffer(appointmentCode);
            
            // Convert buffer to base64 for email attachment
            const qrBase64 = qrBuffer.toString('base64');
            
            // Format date for display
            const appointmentDate = new Date(cleanDate);
            const formattedDate = appointmentDate.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });

            // Log the appointment code for debugging
            console.log("Generated appointment code:", appointmentCode);
            console.log("QR Code generated successfully, buffer size:", qrBuffer.length);

            // Create a unique CID for the QR code image
            const qrCid = `qr-${appointmentCode.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

            // Send appointment confirmation email with attachment
            try {
              // First, let's check if your EmailTransporter supports attachments
              // If not, we'll fall back to external URL
              
              // Option 1: Try with attachment if your transporter supports it
              // This depends on your EmailTransporter implementation
              
              // Option 2: Fallback to external URL (most reliable for email)
              const externalQRUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(appointmentCode)}&format=png&margin=1&color=000000&bgcolor=FFFFFF`;
              
              console.log("Using external QR URL for email:", externalQRUrl);
              
              await EmailTransporter(
                "patient@example.com", // Replace with actual patient email
                `Appointment Confirmation - ${appointmentCode}`,
                `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Helvetica Neue', Arial, sans-serif; 
            line-height: 1.6; 
            color: #000; 
            background: #fff;
            font-weight: 300;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: #fff;
            border: 1px solid #e0e0e0;
        }
        .header { 
            background: #000; 
            color: #fff; 
            padding: 40px 30px; 
            text-align: center;
            border-bottom: 2px solid #333;
        }
        .header h1 {
            font-size: 24px;
            font-weight: 400;
            letter-spacing: 2px;
            margin-bottom: 8px;
            text-transform: uppercase;
        }
        .header p {
            font-size: 12px;
            font-weight: 300;
            letter-spacing: 1px;
            opacity: 0.8;
        }
        .content { 
            padding: 40px 30px; 
        }
        .appointment-section {
            text-align: center;
            margin-bottom: 40px;
            padding: 30px 0;
            border-bottom: 1px solid #eee;
        }
        .appointment-code { 
            font-size: 28px;
            font-weight: 300;
            letter-spacing: 3px;
            margin: 20px 0;
            padding: 15px 30px;
            border: 2px solid #000;
            display: inline-block;
            background: #fff;
            font-family: 'Courier New', monospace;
        }
        .qr-section {
            text-align: center;
            margin: 30px 0;
            padding: 30px 0;
            border-top: 1px solid #eee;
            border-bottom: 1px solid #eee;
            background: #fafafa;
        }
        .qr-container {
            display: inline-block;
            padding: 20px;
            background: #fff;
            border: 1px solid #ddd;
            margin: 15px 0;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .qr-code {
            display: block;
            margin: 0 auto;
            width: 200px;
            height: 200px;
        }
        .qr-label {
            font-size: 11px;
            letter-spacing: 1px;
            margin-top: 15px;
            opacity: 0.7;
            text-transform: uppercase;
            font-weight: 400;
        }
        .details { 
            margin: 30px 0;
            padding: 0;
        }
        .detail-item {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #f0f0f0;
        }
        .detail-label {
            font-weight: 400;
            font-size: 13px;
            letter-spacing: 0.5px;
            text-transform: uppercase;
        }
        .detail-value {
            font-weight: 300;
            font-size: 13px;
            text-align: right;
        }
        .instructions {
            background: #f8f8f8;
            padding: 25px;
            margin: 30px 0;
            border-left: 3px solid #000;
        }
        .instructions h3 {
            font-size: 14px;
            font-weight: 400;
            margin-bottom: 15px;
            letter-spacing: 1px;
            text-transform: uppercase;
        }
        .instructions ul {
            list-style: none;
            font-size: 12px;
            line-height: 1.8;
        }
        .instructions li {
            margin-bottom: 8px;
            padding-left: 15px;
            position: relative;
        }
        .instructions li:before {
            content: "•";
            position: absolute;
            left: 0;
            color: #000;
            font-weight: bold;
        }
        .footer { 
            text-align: center; 
            padding: 30px; 
            font-size: 10px; 
            color: #666;
            border-top: 1px solid #eee;
            letter-spacing: 0.5px;
            background: #f9f9f9;
        }
        .footer strong {
            font-weight: 400;
            color: #000;
        }
        .divider {
            height: 1px;
            background: #eee;
            margin: 25px 0;
        }
        .no-qr-fallback {
            text-align: center;
            font-size: 11px;
            color: #666;
            margin-top: 10px;
            font-style: italic;
        }
        .email-warning {
            background: #fff8e1;
            border: 1px solid #ffd54f;
            padding: 15px;
            margin: 20px 0;
            font-size: 12px;
            color: #5d4037;
            border-radius: 4px;
        }
        .warning-icon {
            color: #ff9800;
            font-weight: bold;
        }
        @media (max-width: 600px) {
            .container {
                border: none;
            }
            .content {
                padding: 20px 15px;
            }
            .header {
                padding: 30px 20px;
            }
            .appointment-code {
                font-size: 20px;
                padding: 10px 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>APPOINTMENT CONFIRMATION</h1>
            <p>SENTRIX MEDICAL CENTER</p>
        </div>
        
        <div class="content">
            <div class="appointment-section">
                <p style="font-size: 14px; margin-bottom: 15px; opacity: 0.8;">YOUR APPOINTMENT IS CONFIRMED</p>
                <div class="appointment-code">${appointmentCode}</div>
            </div>

            <div class="qr-section">
                <div class="qr-container">
                    <!-- Use external URL for better email compatibility -->
                    <img src="${externalQRUrl}" alt="Appointment QR Code" class="qr-code" width="200" height="200" style="display: block; max-width: 100%; height: auto;">
                </div>
                <div class="qr-label">PRESENT THIS QR CODE AT RECEPTION</div>
                <div class="no-qr-fallback">
                    If QR code doesn't display, present your reference code: <strong>${appointmentCode}</strong>
                </div>
            </div>

            <!-- Email client warning -->
            <div class="email-warning">
                <span class="warning-icon">⚠</span> Some email clients may block external images. 
                If you don't see the QR code above, you may need to click "Display images" or use the appointment code below.
            </div>

            <div class="details">
                <div class="detail-item">
                    <span class="detail-label">DATE</span>
                    <span class="detail-value">${formattedDate}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">TIME</span>
                    <span class="detail-value">${time_scheduled}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">TYPE</span>
                    <span class="detail-value">${visit_type}</span>
                </div>
                ${visit_purpose_title ? `
                <div class="detail-item">
                    <span class="detail-label">PURPOSE</span>
                    <span class="detail-value">${visit_purpose_title}</span>
                </div>
                ` : ''}
            </div>

            <div class="instructions">
                <h3>PATIENT INSTRUCTIONS</h3>
                <ul>
                    <li>Arrive 15 minutes prior to scheduled appointment time</li>
                    <li>Bring valid government-issued photo identification</li>
                    <li>Bring insurance card and relevant medical documents</li>
                    <li>Present QR code or reference number at check-in</li>
                    <li>Notify staff of any changes to contact information</li>
                    <li>Call ahead if you need to cancel or reschedule</li>
                </ul>
            </div>

            <div style="text-align: center; font-size: 11px; opacity: 0.7; margin-top: 30px; line-height: 1.6;">
                <p>For cancellations or rescheduling, contact us 24 hours in advance</p>
                <p>Appointment duration may vary based on clinical needs</p>
                <p>Late arrivals may result in rescheduling</p>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>SENTRIX MEDICAL CENTER</strong></p>
            <p>123 HEALTHCARE DRIVE • MEDICAL DISTRICT</p>
            <p>CITY, STATE 12345</p>
            <p style="margin-top: 15px;">P: (555) 123-4567 • E: APPOINTMENTS@SENTRIXMEDICAL.COM</p>
            <div class="divider"></div>
            <p>CONFIDENTIALITY NOTICE: This communication contains privileged information intended solely for the recipient.</p>
            <p>Unauthorized disclosure is prohibited. Automated message - do not reply.</p>
        </div>
    </div>
</body>
</html>
                `,
                [
                  {
                    filename: `appointment-qr-${appointmentCode}.png`,
                    content: qrBase64,
                    encoding: 'base64',
                    cid: qrCid
                  }
                ]
              );
              console.log("Appointment confirmation email sent successfully");
            } catch (emailErr) {
              console.error("Email sending failed:", emailErr);
              // Even if email fails, return success to user
              console.log("Email failed but appointment created. Appointment code:", appointmentCode);
            }

            return res.status(201).json({
              success: true,
              message: "Patient visit scheduled successfully",
              data: {
                record_no: result.insertId,
                appointment_code: appointmentCode,
                patient_id: parseInt(patient_id),
                employee_id: parseInt(employee_id),
                date_scheduled: cleanDate,
                time_scheduled: time_scheduled,
                visit_type: visit_type,
                visit_purpose_title: visit_purpose_title,
                visit_chief_complaint: visit_chief_complaint,
                date_created: new Date().toISOString()
              }
            });

          } catch (qrError) {
            console.error("Error in appointment process:", qrError);
            return res.status(500).json({ 
              success: false, 
              message: "Error generating appointment details",
              error: qrError.message 
            });
          }
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
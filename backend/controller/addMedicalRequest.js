
import { connection } from "../config/db.js";

export const createLabRequest = (req, res) => {
  const {
    employee_id,
    patient_id,
    test_name,
    special_instruction,
    additional_notes,
    status
  } = req.body;

  if (!employee_id || !patient_id || !test_name) {
    return res.status(400).json({
      success: false,
      message: "employee_id, patient_id, and test_name are required.",
    });
  }

  // First, get patient info for the receipt
  const getPatientInfoQuery = `SELECT first_name, last_name FROM patient_info WHERE patient_id = ?`;
  
  connection.query(getPatientInfoQuery, [patient_id], (patientErr, patientResult) => {
    if (patientErr || patientResult.length === 0) {
      console.error("❌ Error fetching patient info:", patientErr);
      return res.status(500).json({
        success: false,
        message: "Error fetching patient information.",
      });
    }

    const patient = patientResult[0];
    
    // Generate a random lab test code: 3 letters + 5 numbers
    const generateLabTestCode = () => {
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      let letterPart = '';
      for (let i = 0; i < 3; i++) {
        letterPart += letters.charAt(Math.floor(Math.random() * letters.length));
      }
      const numberPart = Math.floor(10000 + Math.random() * 90000).toString();
      return letterPart + numberPart;
    };

    const lab_test_code = generateLabTestCode();
    
    // FORMAT DATE PROPERLY FOR MYSQL (YYYY-MM-DD HH:MM:SS)
    const now = new Date();
    const date_requested = now.toISOString().slice(0, 19).replace('T', ' '); // Converts to: 2025-12-05 13:57:30
    // OR use: now.toLocaleString('en-US', { timeZone: 'UTC' }).replace(',', '');
    
    const receipt_number = 'LAB-' + Date.now().toString().slice(-8);

    const query = `
      INSERT INTO patient_laboratory_test 
      (employee_id, patient_id, test_name, special_instruction, additional_notes, status, lab_test_code, date_requested)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      employee_id,
      patient_id,
      test_name,
      special_instruction || null,
      additional_notes || null,
      status || "Requested",
      lab_test_code,
      date_requested  // Use the properly formatted date
    ];

    console.log('Inserting with values:', values); // Debug log

    connection.query(query, values, (err, result) => {
      if (err) {
        console.error("❌ Error creating test request:", err);
        return res.status(500).json({
          success: false,
          message: "Database error while saving laboratory test request.",
          error: err.message,
        });
      }

      // Create HTML receipt with properly formatted date for display
      const formattedDateForDisplay = now.toLocaleString();
      
     // In your backend createLabRequest function, update the receiptHTML to include FULL CSS:
const receiptHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Laboratory Test Receipt</title>
   <style>
    body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        max-width: 520px;
        margin: 0 auto;
        padding: 24px;
        background-color: #ffffff;
        color: #111111;
        line-height: 1.4;
    }
    
    .receipt {
        padding: 0;
        background-color: white;
    }
    
    .header {
        text-align: center;
        padding-bottom: 24px;
        margin-bottom: 24px;
        border-bottom: 1px solid #000000;
    }
    
    .header h1 {
        margin: 0 0 8px 0;
        font-size: 20px;
        font-weight: 600;
        letter-spacing: 0.5px;
        text-transform: uppercase;
    }
    
    .header h2 {
        margin: 4px 0;
        font-size: 12px;
        font-weight: 400;
        color: #666666;
        letter-spacing: 0.3px;
    }
    
    .receipt-info {
        margin-bottom: 24px;
        font-size: 13px;
    }
    
    .receipt-info div {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
        padding-bottom: 8px;
        border-bottom: 1px solid #f0f0f0;
    }
    
    .patient-details {
        padding: 16px;
        margin: 24px 0;
        border: 1px solid #e0e0e0;
        background-color: #fafafa;
    }
    
    .patient-details h3 {
        margin: 0 0 12px 0;
        font-size: 14px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: #333333;
    }
    
    .patient-details div {
        display: flex;
        justify-content: space-between;
        margin-bottom: 6px;
        font-size: 13px;
    }
    
    .test-details {
        margin: 24px 0;
    }
    
    .test-details h3 {
        margin: 0 0 12px 0;
        font-size: 14px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: #333333;
    }
    
    .test-details table {
        width: 100%;
        border-collapse: collapse;
        font-size: 13px;
    }
    
    .test-details th {
        text-align: left;
        padding: 10px 8px;
        font-weight: 500;
        border-bottom: 2px solid #000000;
        color: #333333;
    }
    
    .test-details td {
        padding: 10px 8px;
        border-bottom: 1px solid #f0f0f0;
        color: #555555;
    }
    
    .instructions {
        margin: 24px 0;
        padding: 16px;
        border: 1px solid #e0e0e0;
        background-color: #f9f9f9;
    }
    
    .instructions h3 {
        margin: 0 0 8px 0;
        font-size: 14px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: #333333;
    }
    
    .instructions p {
        margin: 8px 0;
        font-size: 13px;
        color: #555555;
    }
    
    .footer {
        text-align: center;
        margin-top: 32px;
        padding-top: 24px;
        border-top: 1px solid #000000;
        font-size: 11px;
        color: #777777;
        letter-spacing: 0.5px;
    }
    
    .important {
        font-weight: 600;
        color: #000000;
    }
    
    .barcode {
        text-align: center;
        margin: 32px 0;
        padding: 20px 0;
        font-family: 'Libre Barcode 128', cursive;
        font-size: 48px;
        color: #000000;
        border-top: 1px solid #f0f0f0;
        border-bottom: 1px solid #f0f0f0;
    }
    
    .timestamp {
        text-align: right;
        font-size: 11px;
        color: #888888;
        margin-bottom: 16px;
        letter-spacing: 0.5px;
    }
    
    @media print {
        body { 
            padding: 0; 
            max-width: 100%;
        }
        .no-print { 
            display: none; 
        }
        .receipt { 
            border: none; 
        }
        .print-button { 
            display: none; 
        }
        .instructions {
            page-break-inside: avoid;
        }
    }
    
    .print-button {
        text-align: center;
        margin-top: 24px;
    }
    
    button {
        background-color: #000000;
        color: white;
        padding: 10px 24px;
        border: 1px solid #000000;
        border-radius: 2px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 500;
        letter-spacing: 0.5px;
        text-transform: uppercase;
        transition: all 0.2s ease;
    }
    
    button:hover {
        background-color: #333333;
        border-color: #333333;
    }
    
    button.print-close {
        background-color: #ffffff;
        color: #000000;
        margin-left: 12px;
        border: 1px solid #cccccc;
    }
    
    button.print-close:hover {
        background-color: #f5f5f5;
        border-color: #999999;
    }
</style>
    <link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+128&display=swap" rel="stylesheet">
</head>
<body>
    <div class="receipt">
        <div class="timestamp">Generated: ${formattedDateForDisplay}</div>
        
        <div class="header">
            <h1>Sentrix</h1>
            <h2>Pasig City</h2>
            <h2>Tel: (123) 456-7890 | Email: valdez_johnpaul@plpasig.edu.ph</h2>
        </div>

        <div class="receipt-info">
            <div><strong>Receipt No:</strong> <span>${receipt_number}</span></div>
            <div><strong>Lab Test Code:</strong> <span class="important">${lab_test_code}</span></div>
            <div><strong>Date:</strong> <span>${now.toLocaleDateString()}</span></div>
            <div><strong>Time:</strong> <span>${now.toLocaleTimeString()}</span></div>
        </div>

        <div class="patient-details">
            <h3>PATIENT INFORMATION</h3>
            <div><strong>Patient ID:</strong> <span>${patient_id}</span></div>
            <div><strong>Name:</strong> <span>${patient.first_name} ${patient.last_name}</span></div>
            <div><strong>Age:</strong> <span>${patient.age || 'N/A'}</span></div>
            <div><strong>Employee ID:</strong> <span>${employee_id}</span></div>
        </div>

        <div class="test-details">
            <h3>TEST REQUEST DETAILS</h3>
            <table>
                <tr>
                    <th>Test Name</th>
                    <td><strong>${test_name}</strong></td>
                </tr>
                <tr>
                    <th>Record No</th>
                    <td>${result.insertId}</td>
                </tr>
                <tr>
                    <th>Status</th>
                    <td><span class="important">${status || "Requested"}</span></td>
                </tr>
                <tr>
                    <th>Date Requested</th>
                    <td>${formattedDateForDisplay}</td>
                </tr>
            </table>
        </div>

        ${special_instruction ? `
        <div class="instructions">
            <h3>SPECIAL INSTRUCTIONS</h3>
            <p>${special_instruction}</p>
            ${additional_notes ? `<p><strong>Additional Notes:</strong> ${additional_notes}</p>` : ''}
        </div>
        ` : ''}

        <div class="barcode">
            ${lab_test_code}
        </div>

        <div class="footer">
            <p><strong>IMPORTANT:</strong> Please bring this receipt when collecting test results.</p>
            <p>Results are typically available within 24-48 hours.</p>
            <p>For inquiries, contact: (123) 456-7890</p>
            <p>Thank you for choosing our laboratory services!</p>
        </div>

        <div class="print-button no-print">
            <button onclick="window.print()">🖨️ Print Receipt</button>
            <button onclick="window.close()" style="background-color: #666; margin-left: 10px;">Close</button>
        </div>
    </div>
</body>
</html>
`;

      // Send JSON response with receipt HTML included
      return res.status(201).json({
        success: true,
        message: "Laboratory test request created successfully.",
        record_no: result.insertId,
        lab_test_code: lab_test_code,
        receipt: {
          html: receiptHTML,
          receipt_number: receipt_number,
          patient_name: `${patient.first_name} ${patient.last_name}`,
          test_name: test_name,
          date_created: now.toISOString() // Keep ISO string for frontend
        }
      });
    });
  });
};

// GET laboratory tests by patient ID
// GET all lab tests by patient ID (including X-Ray specific fields)
export const getLabTestsByPatientId = (req, res) => {
  const { patient_id } = req.params;

  if (!patient_id) {
    return res.status(400).json({
      success: false,
      message: "patient_id is required in the URL.",
    });
  }

  const query = `
    SELECT 
      plt.record_no,
      plt.employee_id,
      plt.patient_id,
      plt.test_name,
      plt.special_instruction,
      plt.additional_notes,
      plt.status,
      plt.lab_test_code,
      plt.date_requested,
      plt.findings,
      plt.impression,
      plt.primary_image_path,
      pi.first_name,
      pi.last_name
    FROM patient_laboratory_test plt
    LEFT JOIN patient_info pi 
      ON plt.patient_id = pi.patient_id
    WHERE plt.patient_id = ?
    ORDER BY plt.date_requested DESC
  `;

  connection.query(query, [patient_id], (err, results) => {
    if (err) {
      console.error("❌ Error fetching tests by patient_id:", err);
      return res.status(500).json({
        success: false,
        message: "Database error while retrieving tests.",
        error: err.message,
      });
    }

    return res.status(200).json({
      success: true,
      count: results.length,
      tests: results,
    });
  });
};

// GET all X-Ray tests
export const getAllXRayTests = (req, res) => {
  const query = `
 SELECT 
    plt.record_no, 
    pi.first_name, 
    pi.last_name, 
    plt.patient_id, 
    plt.test_name, 
    plt.special_instruction, 
    plt.additional_notes, 
    plt.lab_test_code, 
    plt.status,
    plt.findings,
    plt.impression,
    plt.primary_image_path,
    plt.date_requested
FROM patient_laboratory_test plt
INNER JOIN patient_info pi
    ON plt.patient_id = pi.patient_id 
WHERE plt.test_name = 'X-Ray'
ORDER BY plt.date_requested DESC;
  `;

  connection.query(query, (err, results) => {
    if (err) {
      console.error("❌ Error fetching X-Ray tests:", err);
      return res.status(500).json({
        success: false,
        message: "Database error while retrieving X-Ray tests.",
        error: err.message,
      });
    }

    return res.status(200).json({
      success: true,
      count: results.length,
      tests: results,
    });
  });
};

// GET all CBC tests
export const getAllCBCTests = (req, res) => {
  const query = `
    SELECT * 
    FROM patient_laboratory_test
    WHERE test_name = 'CBC'
    ORDER BY date_requested DESC
  `;

  connection.query(query, (err, results) => {
    if (err) {
      console.error("❌ Error fetching CBC tests:", err);
      return res.status(500).json({
        success: false,
        message: "Database error while retrieving CBC tests.",
        error: err.message,
      });
    }

    return res.status(200).json({
      success: true,
      count: results.length,
      tests: results,
    });
  });
};

import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const recordNo = req.params.record_no;
    const uploadPath = path.join(process.cwd(), 'uploads', 'xray', recordNo.toString());
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueName = `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Accept only image files
    const allowedTypes = /jpeg|jpg|png|gif|bmp|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, bmp, webp)'));
    }
  }
}).single('image');

// Update X-Ray findings, impression, and image
// Update X-Ray findings, impression, and image - SIMPLIFIED
export const updateXRayResultsController = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ 
        success: false, 
        message: err.message 
      });
    }

    const { record_no } = req.params;
    const { findings, impression, } = req.body;
    
    console.log("Received request:", { record_no, findings, impression });
    console.log("File received:", req.file ? "YES" : "NO");
    
    try {
      // 1. Check if record exists
      const checkQuery = `SELECT record_no FROM patient_laboratory_test WHERE record_no = ?`;
      
      connection.query(checkQuery, [record_no], (checkErr, results) => {
        if (checkErr) {
          console.error("❌ Check error:", checkErr);
          return res.status(500).json({
            success: false,
            message: "Database error",
            error: checkErr.message
          });
        }

        if (results.length === 0) {
          return res.status(404).json({
            success: false,
            message: "Record not found",
            record_no: record_no
          });
        }

        // 2. Handle image path
        let imagePath = null;
        if (req.file) {
          imagePath = `uploads/xray/${record_no}/${req.file.filename}`;
          console.log("✅ Image will be saved to:", imagePath);
        }

        // 3. Build update query
        const updates = [];
        const values = [];

        if (findings !== undefined) {
          updates.push("findings = ?");
          values.push(findings);
        }

        if (impression !== undefined) {
          updates.push("impression = ?");
          values.push(impression);
        }

        if (imagePath) {
          updates.push("primary_image_path = ?");
          values.push(imagePath);
        }

        // Update status only if findings are provided
        if (findings !== undefined) {
          updates.push("status = ?");
          values.push("Completed");
        }

        if (updates.length === 0) {
          return res.status(400).json({
            success: false,
            message: "Nothing to update"
          });
        }

        values.push(record_no); // WHERE clause

        const updateQuery = `UPDATE patient_laboratory_test SET ${updates.join(", ")} WHERE record_no = ?`;
        console.log("📝 Update query:", updateQuery);
        console.log("📝 Update values:", values);

        // 4. Execute update
        connection.query(updateQuery, values, (updateErr, result) => {
          if (updateErr) {
            console.error("❌ Update error:", updateErr);
            return res.status(500).json({
              success: false,
              message: "Failed to update database",
              error: updateErr.message
            });
          }

          console.log("✅ Database update successful. Affected rows:", result.affectedRows);

          // 5. Prepare response
          const response = {
            success: true,
            message: "Record updated successfully",
            record_no: record_no,
            updated_fields: {
              findings: findings !== undefined,
              impression: impression !== undefined,
              image: !!imagePath
            }
          };

          if (req.file) {
            const imageUrl = `${req.protocol}://${req.get('host')}/${imagePath}`;
            response.image = {
              filename: req.file.filename,
              path: imagePath,
              url: imageUrl,
              size: req.file.size,
              mimetype: req.file.mimetype
            };
          }

          res.status(200).json(response);
        });
      });
    } catch (error) {
      console.error("❌ Unexpected error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message
      });
    }
  });
};

// Get X-Ray results (for viewing)
export const getXRayResultsController = (req, res) => {
  const { record_no } = req.params;

  const query = `
    SELECT 
      record_no,
      employee_id,
      patient_id,
      test_name,
      special_instruction,
      additional_notes,
      status,
      date_requested,
      findings,
      impression,
      primary_image_path,
      CASE 
        WHEN primary_image_path IS NOT NULL THEN CONCAT(?, primary_image_path)
        ELSE NULL
      END as image_url
    FROM patient_laboratory_test 
    WHERE record_no = ?
  `;

  // Get base URL for image links
  const baseUrl = `${req.protocol}://${req.get('host')}/`;

  connection.query(query, [baseUrl, record_no], (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database error",
        error: err.message
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Record not found"
      });
    }

    res.status(200).json({
      success: true,
      test: results[0]
    });
  });
};
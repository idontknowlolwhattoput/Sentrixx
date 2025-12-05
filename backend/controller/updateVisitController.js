import { connection } from "../config/db.js";

export const updateVisitStatus = async (req, res) => {
  try {
    const { record_no, visit_status } = req.body;

    if (!record_no || !visit_status) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: record_no and visit_status"
      });
    }

    const validStatuses = ['In-progress', 'Completed', 'Cancelled', 'Current', 'Queued'];
    if (!validStatuses.includes(visit_status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid visit status"
      });
    }

    const query = `
      UPDATE patient_visit_record 
      SET visit_status = ? 
      WHERE record_no = ?
    `;

    connection.query(query, [visit_status, record_no], (err, result) => {
      if (err) {
        console.error("Error updating visit status:", err);
        return res.status(500).json({
          success: false,
          message: "Database error",
          error: err.message
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Visit record not found"
        });
      }

      return res.status(200).json({
        success: true,
        message: "Visit status updated successfully",
        data: {
          record_no: record_no,
          visit_status: visit_status
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
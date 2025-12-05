import { connection } from "../config/db.js";

export const FetchDoctors = async (req, res) => {

  const query = `select ea.employee_id, ea.position, ei.first_name, ei.middle_name, ei.last_name from employee_info ei inner join employee_account ea on ei.employee_id = ea.employee_id`
  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching patients:', err);
      return res.status(500).json({
        success: false,
        message: 'Error fetching patients',
        error: err.message
      });
    }
    res.json({
      success: true,
      result: results
    });
  });
}

export const FetchDoctorByID = async (req, res) => {
  const { employee_id } = req.params;

  if (!employee_id) {
    return res.status(400).json({
      success: false,
      message: "employee_id is required"
    });
  }

  const query = `
    SELECT ea.employee_id, ea.position, ei.first_name, ei.middle_name, ei.last_name 
    FROM employee_info ei 
    INNER JOIN employee_account ea 
      ON ei.employee_id = ea.employee_id
    WHERE ea.employee_id = ?
  `;

  connection.query(query, [employee_id], (err, results) => {
    if (err) {
      console.error("Error fetching doctor:", err);
      return res.status(500).json({
        success: false,
        message: "Error fetching doctor",
        error: err.message,
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    res.json({
      success: true,
      result: results[0],
    });
  });
};
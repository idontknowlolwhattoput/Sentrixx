import { connection } from "../config/db.js";

const timesheetController = {
    // Bulk insert timesheet records
    createBulkTimesheets: (req, res) => {
        const timesheetData = req.body;

        if (!Array.isArray(timesheetData)) {
            return res.status(400).json({
                success: false,
                message: "Request body must be an array of timesheet records"
            });
        }

        if (timesheetData.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Timesheet data array cannot be empty"
            });
        }

        const results = [];
        const errors = [];

        let processedCount = 0;

        timesheetData.forEach((timesheet, index) => {
            const { employee_id, timesheet_date, timesheet_time } = timesheet;

            if (!employee_id || !timesheet_date || !timesheet_time) {
                errors.push({
                    index,
                    error: "Missing required fields",
                    data: timesheet
                });
                processedCount++;
                if (processedCount === timesheetData.length) finish();
                return;
            }

            const mysqlDate = new Date(timesheet_date).toLocaleDateString('en-CA');

            const query = `
                INSERT INTO employee_timesheet
                (employee_id, timesheet_date, timesheet_time)
                VALUES (?, ?, ?)
            `;

            connection.query(
                query,
                [parseInt(employee_id), mysqlDate, timesheet_time],
                (err, result) => {
                    if (err) {
                        errors.push({
                            index,
                            error: err.message,
                            data: timesheet
                        });
                    } else {
                        results.push({
                            record_id: result.insertId,
                            employee_id: parseInt(employee_id),
                            timesheet_date,
                            timesheet_time,
                            status: "success"
                        });
                    }

                    processedCount++;
                    if (processedCount === timesheetData.length) finish();
                }
            );
        });

        function finish() {
            if (results.length === 0 && errors.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: "All records failed to insert",
                    errors
                });
            }

            const response = {
                success: true,
                message: `Processed ${timesheetData.length} timesheet records`,
                inserted: results.length,
                failed: errors.length,
                data: results
            };

            if (errors.length > 0) response.errors = errors;

            res.status(201).json(response);
        }
    },

    // Single timesheet insert
    createTimesheet: (req, res) => {
        const { employee_id, timesheet_date, timesheet_time } = req.body;

        if (!employee_id || !timesheet_date || !timesheet_time) {
            return res.status(400).json({
                success: false,
                message: "All fields (employee_id, timesheet_date, timesheet_time) are required"
            });
        }

        const mysqlDate = new Date(timesheet_date).toISOString().split("T")[0];

        const query = `
            INSERT INTO employee_timesheet
            (employee_id, timesheet_date, timesheet_time)
            VALUES (?, ?, ?)
        `;

        connection.query(
            query,
            [parseInt(employee_id), mysqlDate, timesheet_time],
            (err, result) => {
                if (err) {
                    return res.status(500).json({
                        success: false,
                        message: "Internal server error",
                        error: err.message
                    });
                }

                res.status(201).json({
                    success: true,
                    message: "Timesheet record created successfully",
                    data: {
                        record_id: result.insertId,
                        employee_id: parseInt(employee_id),
                        timesheet_date,
                        timesheet_time
                    }
                });
            }
        );
    },

    // GET all timesheets
    getAllTimesheets: (req, res) => {
        const query = `
            SELECT
                record_id,
                employee_id,
                DATE_FORMAT(timesheet_date, '%b %e, %Y') as timesheet_date,
                timesheet_time
            FROM employee_timesheet
            ORDER BY timesheet_date DESC, record_id DESC
        `;

        connection.query(query, (err, rows) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Internal server error",
                    error: err.message
                });
            }

            res.status(200).json({
                success: true,
                data: rows,
                count: rows.length
            });
        });
    },

    // GET timesheets by employee
    getTimesheetsByEmployee: (req, res) => {
        const { employee_id } = req.params;

        const query = `
            SELECT
                record_id,
                employee_id,
                DATE_FORMAT(timesheet_date, '%b %e, %Y') as timesheet_date,
                timesheet_time
            FROM employee_timesheet
            WHERE employee_id = ?
            ORDER BY timesheet_date DESC, timesheet_time ASC
        `;

        connection.query(query, [parseInt(employee_id)], (err, rows) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Internal server error",
                    error: err.message
                });
            }

            res.status(200).json({
                success: true,
                data: rows,
                count: rows.length
            });
        });
    },

    // GET timesheets by date range
    getTimesheetsByDateRange: (req, res) => {
        const { start_date, end_date, employee_id } = req.query;

        let query = `
            SELECT
                record_id,
                employee_id,
                DATE_FORMAT(timesheet_date, '%b %e, %Y') as timesheet_date,
                timesheet_time
            FROM employee_timesheet
            WHERE 1=1
        `;

        const params = [];

        if (start_date) {
            query += " AND timesheet_date >= ?";
            params.push(new Date(start_date).toISOString().split("T")[0]);
        }

        if (end_date) {
            query += " AND timesheet_date <= ?";
            params.push(new Date(end_date).toISOString().split("T")[0]);
        }

        if (employee_id) {
            query += " AND employee_id = ?";
            params.push(parseInt(employee_id));
        }

        query += " ORDER BY timesheet_date DESC, timesheet_time ASC";

        connection.query(query, params, (err, rows) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Internal server error",
                    error: err.message
                });
            }

            res.status(200).json({
                success: true,
                data: rows,
                count: rows.length
            });
        });
    }
};

export default timesheetController;

import { connection } from "../config/db.js";

export const getAppointmentByCodeController = (req, res) => {
  const { appointmentCode } = req.body;

  // Validate request
  if (!appointmentCode) {
    return res.status(400).json({
      message: "appointmentCode is required",
    });
  }

  const selectQuery = `
    SELECT 
      pi.first_name, 
      pi.last_name, 
      pi.middle_name, 
      pvr.date_scheduled, 
      pvr.time_scheduled, 
      pvr.appointment_code,
      pvr.visit_status,
      pvr.patient_id,
      pvr.record_no,
      ei.first_name AS doctor_first_name,
      ei.last_name AS doctor_last_name,
      ei.employee_id
    FROM patient_visit_record pvr
    INNER JOIN patient_info pi
      ON pvr.patient_id = pi.patient_id
    INNER JOIN employee_info ei
      ON pvr.employee_id = ei.employee_id
    WHERE pvr.appointment_code = ?
  `;

  // Function to get current hour in 12-hour format (e.g., "10:00 AM", "02:00 PM")
  const getCurrentHourFormatted = () => {
    const now = new Date();
    let hours = now.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    // Convert to 12-hour format
    hours = hours % 12;
    hours = hours ? hours : 12; // Convert 0 to 12
    
    return `${hours}:00 ${ampm}`;
  };

  // Function to get NEXT hour in 12-hour format from a given time
  const getNextHourFormatted = (time12h) => {
    // Parse the time (assumes format like "10:00 AM")
    const match = time12h.match(/(\d+):00\s*(AM|PM)/i);
    if (!match) {
      throw new Error(`Invalid time format: ${time12h}`);
    }
    
    let [, hours, modifier] = match;
    hours = parseInt(hours);
    
    // Calculate next hour
    let nextHour = hours + 1;
    let nextModifier = modifier;
    
    // Handle AM/PM transitions
    if (nextHour === 12) {
      // 11 AM → 12 PM, 11 PM → 12 AM
      nextModifier = modifier === 'AM' ? 'PM' : 'AM';
    } else if (nextHour > 12) {
      nextHour = 1;
      nextModifier = modifier === 'AM' ? 'PM' : 'AM';
    }
    
    return `${nextHour}:00 ${nextModifier}`;
  };

  // Function to parse 12-hour time and create proper datetime
  const createAppointmentDateTime = (dateString, time12h) => {
    // Parse the date (handles ISO format with timezone)
    const date = new Date(dateString);
    
    // Parse 12-hour time format (e.g., "10:00 AM", "2:00 PM")
    const match = time12h.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) {
      throw new Error(`Invalid time format: ${time12h}`);
    }
    
    let [, hours, minutes, modifier] = match;
    hours = parseInt(hours);
    minutes = parseInt(minutes);
    
    // Convert to 24-hour format
    if (modifier.toUpperCase() === 'PM' && hours !== 12) {
      hours += 12;
    } else if (modifier.toUpperCase() === 'AM' && hours === 12) {
      hours = 0;
    }
    
    // Create new date with the time
    const appointmentDateTime = new Date(date);
    appointmentDateTime.setHours(hours, minutes, 0, 0);
    
    return appointmentDateTime;
  };

  // Function to check if it's exactly the appointment date (ignoring time)
  const isAppointmentDateToday = (appointmentDate, currentDate) => {
    const appointmentDateOnly = new Date(appointmentDate);
    appointmentDateOnly.setHours(0, 0, 0, 0);
    
    const currentDateOnly = new Date(currentDate);
    currentDateOnly.setHours(0, 0, 0, 0);
    
    return appointmentDateOnly.getTime() === currentDateOnly.getTime();
  };

  // Function to determine new appointment time based on lateness
  const determineNewAppointmentTime = (scheduledTime, currentTime) => {
    // Parse scheduled time (assumes format like "10:00 AM")
    const match = scheduledTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) {
      throw new Error(`Invalid time format: ${scheduledTime}`);
    }
    
    let [, hours, minutes, modifier] = match;
    hours = parseInt(hours);
    minutes = parseInt(minutes);
    
    // Convert scheduled time to 24-hour format for comparison
    let scheduledHour24 = hours;
    if (modifier.toUpperCase() === 'PM' && hours !== 12) {
      scheduledHour24 = hours + 12;
    } else if (modifier.toUpperCase() === 'AM' && hours === 12) {
      scheduledHour24 = 0;
    }
    
    // Get current time in 24-hour format
    const currentHour24 = currentTime.getHours();
    const currentMinutes = currentTime.getMinutes();
    
    // Calculate total minutes difference
    const totalScheduledMinutes = scheduledHour24 * 60 + minutes;
    const totalCurrentMinutes = currentHour24 * 60 + currentMinutes;
    const minutesDifference = totalCurrentMinutes - totalScheduledMinutes;
    
    // Determine new appointment time
    if (minutesDifference <= 30) {
      // ≤ 30 minutes late: keep original time
      return {
        newTime: scheduledTime,
        reason: "on_time",
        minutesLate: minutesDifference
      };
    } else if (minutesDifference <= 90) {
      // 31-90 minutes late: reschedule to next hour
      const nextHourTime = getNextHourFormatted(scheduledTime);
      return {
        newTime: nextHourTime,
        reason: "late_30_to_90_minutes",
        minutesLate: minutesDifference
      };
    } else {
      // > 90 minutes late: reschedule to current hour
      const currentHourTime = getCurrentHourFormatted();
      return {
        newTime: currentHourTime,
        reason: "late_over_90_minutes",
        minutesLate: minutesDifference
      };
    }
  };

  // First get the appointment details to check the schedule
  connection.query(selectQuery, [appointmentCode], (selectErr, results) => {
    if (selectErr) {
      console.error("Query error:", selectErr.message);
      return res.status(500).json({
        message: "Database error",
        error: selectErr.message,
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        message: "Appointment not found",
      });
    }

    const appointment = results[0];
    const now = new Date();

    try {
      // Create proper datetime object from date_scheduled and time_scheduled
      const appointmentDateTime = createAppointmentDateTime(
        appointment.date_scheduled, 
        appointment.time_scheduled
      );

      // Check date only (ignore time for validation)
      const appointmentDateOnly = new Date(appointmentDateTime);
      appointmentDateOnly.setHours(0, 0, 0, 0);
      
      const todayDateOnly = new Date(now);
      todayDateOnly.setHours(0, 0, 0, 0);
      
      const isToday = isAppointmentDateToday(appointmentDateTime, now);
      const isPastDate = appointmentDateOnly < todayDateOnly;
      const isFutureDate = appointmentDateOnly > todayDateOnly;

      // Date-based validation
      if (isPastDate) {
        return res.status(400).json({
          message: "Appointment date has already passed",
          details: {
            scheduledDate: appointment.date_scheduled,
            scheduledTime: appointment.time_scheduled,
            currentDate: now.toISOString().split('T')[0],
            reason: "appointment_passed"
          }
        });
      }

      if (isFutureDate) {
        return res.status(400).json({
          message: "Appointment is scheduled for a future date",
          details: {
            scheduledDate: appointment.date_scheduled,
            scheduledTime: appointment.time_scheduled,
            currentDate: now.toISOString().split('T')[0],
            reason: "future_appointment"
          }
        });
      }

      // If we reach here, it's today's date
      // Determine if we need to reschedule based on lateness
      const rescheduleInfo = determineNewAppointmentTime(appointment.time_scheduled, now);
      const { newTime, reason, minutesLate } = rescheduleInfo;
      
      let message = "Appointment found and status updated to Queued";
      let timeUpdated = false;

      if (newTime !== appointment.time_scheduled) {
        timeUpdated = true;
        
        if (reason === "late_30_to_90_minutes") {
          message = `Appointment rescheduled to ${newTime} (30+ minutes late from ${appointment.time_scheduled})`;
        } else if (reason === "late_over_90_minutes") {
          message = `Appointment rescheduled to ${newTime} (significantly late from ${appointment.time_scheduled})`;
        }
        
        // Update with new time - ONLY update time_scheduled and visit_status
        const updateQuery = `
          UPDATE patient_visit_record 
          SET time_scheduled = ?, 
              visit_status = "Queued"
          WHERE appointment_code = ?
        `;

        connection.query(updateQuery, [newTime, appointmentCode], (updateErr, updateResults) => {
          if (updateErr) {
            console.error("Update error:", updateErr.message);
            return res.status(500).json({
              message: "Database update error",
              error: updateErr.message,
            });
          }

          // Return the appointment record with updated time
          return res.status(200).json({
            message: message,
            appointment: {
              ...appointment,
              time_scheduled: newTime,
              // Store original time in response, not in database
              original_time_scheduled: appointment.time_scheduled
            },
            timing: {
              isToday: isToday,
              timeUpdated: timeUpdated,
              reason: reason,
              minutesLate: Math.round(minutesLate),
              currentTime: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
              newAppointmentTime: newTime,
              originalAppointmentTime: appointment.time_scheduled,
              currentDate: now.toISOString().split('T')[0],
              appointmentDate: appointment.date_scheduled
            }
          });
        });
      } else {
        // No time change needed, just update status
        const updateQuery = `
          UPDATE patient_visit_record 
          SET visit_status = "Queued" 
          WHERE appointment_code = ?
        `;

        connection.query(updateQuery, [appointmentCode], (updateErr, updateResults) => {
          if (updateErr) {
            console.error("Update error:", updateErr.message);
            return res.status(500).json({
              message: "Database update error",
              error: updateErr.message,
            });
          }

          // Return the appointment record
          return res.status(200).json({
            message: message,
            appointment: appointment,
            timing: {
              isToday: isToday,
              timeUpdated: timeUpdated,
              reason: reason,
              minutesLate: Math.round(minutesLate),
              currentTime: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
              appointmentTime: appointment.time_scheduled,
              currentDate: now.toISOString().split('T')[0],
              appointmentDate: appointment.date_scheduled
            }
          });
        });
      }

    } catch (error) {
      console.error("Time parsing error:", error.message);
      return res.status(400).json({
        message: "Invalid time format in appointment",
        error: error.message
      });
    }
  });
};
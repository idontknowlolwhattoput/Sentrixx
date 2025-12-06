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

  // Function to format date to YYYY-MM-DD (handle both string and Date object)
  const formatDateToYYYYMMDD = (dateValue) => {
    // If it's already a string
    if (typeof dateValue === 'string') {
      // If it's DATETIME like "2025-12-06 00:00:00", extract date part
      if (dateValue.includes(' ')) {
        return dateValue.split(' ')[0];
      }
      // If it's already DATE like "2025-12-06", return as is
      return dateValue;
    }
    
    // If it's a Date object (from MySQL)
    if (dateValue instanceof Date) {
      const year = dateValue.getFullYear();
      const month = String(dateValue.getMonth() + 1).padStart(2, '0');
      const day = String(dateValue.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    // If it's something else, convert to string first
    const dateStr = String(dateValue);
    if (dateStr.includes(' ')) {
      return dateStr.split(' ')[0];
    }
    return dateStr;
  };

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

  // Function to parse 12-hour time and create proper datetime
  const createAppointmentDateTime = (dateValue, time12h) => {
    // First extract date part
    const dateOnly = formatDateToYYYYMMDD(dateValue);
    
    // Parse the date
    const date = new Date(dateOnly);
    
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

  // Function to convert 12-hour time to 24-hour for comparison
  const time12hTo24h = (time12h) => {
    if (!time12h) return null;
    
    const match = time12h.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) {
      console.warn(`Invalid time format for conversion: ${time12h}`);
      return null;
    }
    
    let [, hours, minutes, modifier] = match;
    hours = parseInt(hours);
    minutes = parseInt(minutes || 0);
    
    if (modifier.toUpperCase() === 'PM' && hours !== 12) {
      hours += 12;
    } else if (modifier.toUpperCase() === 'AM' && hours === 12) {
      hours = 0;
    }
    
    return hours * 60 + minutes; // Return total minutes for easy comparison
  };

  // Function to get doctor's available time slots for today
  const getDoctorAvailableSlots = (employeeId, dateValue, currentTime24h) => {
    return new Promise((resolve, reject) => {
      // Extract date part from whatever format it is
      const dateOnly = formatDateToYYYYMMDD(dateValue);
      
      console.log(`Checking availability for doctor ${employeeId} on ${dateOnly}, currentTime24h: ${currentTime24h}`);
      
      const query = `
        SELECT timesheet_time, max_appointment 
        FROM employee_timesheet 
        WHERE employee_id = ? 
          AND timesheet_date = ? 
          AND max_appointment > 0
        ORDER BY timesheet_time
      `;
      
      connection.query(query, [employeeId, dateOnly], (err, results) => {
        if (err) {
          console.error("Database error in getDoctorAvailableSlots:", err);
          reject(err);
          return;
        }
        
        console.log(`Found ${results.length} slots with capacity for doctor ${employeeId}:`, results);
        
        // Filter out past time slots (only future slots from current time)
        const availableSlots = results.filter(slot => {
          const slotTime24h = time12hTo24h(slot.timesheet_time);
          const isValid = slotTime24h !== null && slotTime24h >= currentTime24h;
          if (!isValid) {
            console.log(`Filtered out slot ${slot.timesheet_time} (slotTime24h: ${slotTime24h}, currentTime24h: ${currentTime24h})`);
          }
          return isValid;
        });
        
        console.log(`After filtering, ${availableSlots.length} future slots available`);
        resolve(availableSlots);
      });
    });
  };

  // Function to find the best available time slot
  const findBestAvailableSlot = (originalTime, availableSlots, currentTime24h, minutesLate) => {
    if (availableSlots.length === 0) {
      console.log("No available slots to choose from");
      return null; // No slots available
    }
    
    const originalTime24h = time12hTo24h(originalTime);
    console.log(`Finding best slot. Original time: ${originalTime} (${originalTime24h} minutes), Minutes late: ${minutesLate}`);
    
    // Strategy based on how late they are
    if (minutesLate <= 30) {
      // Try to keep original time slot if still available
      const originalSlot = availableSlots.find(slot => {
        const slotTime24h = time12hTo24h(slot.timesheet_time);
        return slotTime24h === originalTime24h;
      });
      
      if (originalSlot) {
        console.log(`Patient on time or slightly late. Keeping original slot: ${originalSlot.timesheet_time}`);
        return {
          timesheet_time: originalSlot.timesheet_time,
          reason: "on_time",
          is_original_slot: true
        };
      }
    }
    
    // Find closest available slot to original time
    let bestSlot = null;
    let minTimeDifference = Infinity;
    
    for (const slot of availableSlots) {
      const slotTime24h = time12hTo24h(slot.timesheet_time);
      const timeDifference = Math.abs(slotTime24h - originalTime24h);
      
      console.log(`Evaluating slot ${slot.timesheet_time} (${slotTime24h} min): difference ${timeDifference} min`);
      
      // Prefer slots that are closest to original time
      if (timeDifference < minTimeDifference) {
        minTimeDifference = timeDifference;
        bestSlot = slot;
      }
    }
    
    if (bestSlot) {
      console.log(`Selected best slot: ${bestSlot.timesheet_time} (difference: ${minTimeDifference} minutes)`);
      return {
        timesheet_time: bestSlot.timesheet_time,
        reason: minutesLate <= 90 ? "late_30_to_90_minutes" : "late_over_90_minutes",
        is_original_slot: false,
        time_difference: minTimeDifference
      };
    }
    
    console.log("No suitable slot found");
    return null;
  };

  // Main logic
  connection.query(selectQuery, [appointmentCode], async (selectErr, results) => {
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

    console.log(`Appointment found:`, {
      date_scheduled: appointment.date_scheduled,
      date_scheduled_type: typeof appointment.date_scheduled,
      date_scheduled_constructor: appointment.date_scheduled?.constructor?.name,
      time_scheduled: appointment.time_scheduled,
      employee_id: appointment.employee_id
    });

    try {
      // Format the appointment date for display and queries
      const formattedAppointmentDate = formatDateToYYYYMMDD(appointment.date_scheduled);
      console.log(`Formatted appointment date: ${formattedAppointmentDate}`);

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

      console.log(`Date check:`, {
        appointmentDate: appointmentDateOnly.toISOString(),
        todayDate: todayDateOnly.toISOString(),
        isToday,
        isPastDate,
        isFutureDate
      });

      // Date-based validation
      if (isPastDate) {
        return res.status(400).json({
          message: "Appointment date has already passed",
          details: {
            scheduledDate: formattedAppointmentDate,
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
            scheduledDate: formattedAppointmentDate,
            scheduledTime: appointment.time_scheduled,
            currentDate: now.toISOString().split('T')[0],
            reason: "future_appointment"
          }
        });
      }

      // If we reach here, it's today's appointment
      // Calculate how late they are
      const appointmentTime24h = time12hTo24h(appointment.time_scheduled);
      const currentTime24h = now.getHours() * 60 + now.getMinutes();
      const minutesLate = currentTime24h - appointmentTime24h;
      
      console.log(`Timing check:`, {
        appointmentTime12h: appointment.time_scheduled,
        appointmentTime24h,
        currentTime24h,
        minutesLate,
        currentTime: now.toLocaleTimeString()
      });
      
      // Check if they're too early (more than 1 hour early)
      if (minutesLate < -60) {
        return res.status(400).json({
          message: "You are too early. Please arrive closer to your appointment time.",
          details: {
            scheduledTime: appointment.time_scheduled,
            currentTime: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            minutesEarly: Math.abs(minutesLate),
            reason: "too_early"
          }
        });
      }

      // Determine if we need to reschedule based on lateness AND availability
      let newTime = appointment.time_scheduled;
      let timeUpdated = false;
      let reason = "on_time";
      let doctorAvailability = null;

      // If they're more than 30 minutes late, check for available slots
      if (minutesLate > 30) {
        console.log(`Patient is ${minutesLate} minutes late. Checking for available slots...`);
        
        try {
          // Get doctor's available time slots for today
          const availableSlots = await getDoctorAvailableSlots(
            appointment.employee_id,
            appointment.date_scheduled,
            currentTime24h
          );
          
          console.log(`Available slots:`, availableSlots);
          
          // Find the best available slot
          const bestSlot = findBestAvailableSlot(
            appointment.time_scheduled,
            availableSlots,
            currentTime24h,
            minutesLate
          );
          
          if (bestSlot) {
            newTime = bestSlot.timesheet_time;
            timeUpdated = newTime !== appointment.time_scheduled;
            reason = bestSlot.reason;
            doctorAvailability = {
              available_slots: availableSlots.map(s => ({
                time: s.timesheet_time,
                capacity: s.max_appointment
              })),
              selected_slot: bestSlot.timesheet_time,
              was_original_available: bestSlot.is_original_slot
            };
            
            console.log(`Rescheduling decision:`, {
              originalTime: appointment.time_scheduled,
              newTime,
              timeUpdated,
              reason
            });
            
            if (timeUpdated) {
              // Use the formatted date for queries
              const appointmentDate = formattedAppointmentDate;
              
              console.log(`Updating timesheet capacity:`, {
                doctorId: appointment.employee_id,
                date: appointmentDate,
                oldTime: appointment.time_scheduled,
                newTime
              });
              
              // We need to update the timesheet capacity for both old and new slots
              // 1. Add back capacity to old time slot
              const addBackQuery = `
                UPDATE employee_timesheet 
                SET max_appointment = max_appointment + 1 
                WHERE employee_id = ? 
                  AND timesheet_date = ? 
                  AND timesheet_time = ?
              `;
              
              await new Promise((resolve, reject) => {
                connection.query(addBackQuery, 
                  [appointment.employee_id, appointmentDate, appointment.time_scheduled],
                  (err, result) => {
                    if (err) {
                      console.error("Error adding back capacity:", err);
                      reject(err);
                    } else {
                      console.log(`Added back capacity to old slot: ${appointment.time_scheduled}, affected rows: ${result.affectedRows}`);
                      resolve();
                    }
                  }
                );
              });
              
              // 2. Deduct capacity from new time slot
              const deductQuery = `
                UPDATE employee_timesheet 
                SET max_appointment = max_appointment - 1 
                WHERE employee_id = ? 
                  AND timesheet_date = ? 
                  AND timesheet_time = ?
                  AND max_appointment > 0
              `;
              
              await new Promise((resolve, reject) => {
                connection.query(deductQuery, 
                  [appointment.employee_id, appointmentDate, newTime],
                  (err, result) => {
                    if (err) {
                      console.error("Error deducting capacity:", err);
                      reject(err);
                    } else {
                      if (result.affectedRows === 0) {
                        console.error(`No capacity available in selected time slot: ${newTime}`);
                        reject(new Error("No capacity available in selected time slot"));
                      } else {
                        console.log(`Deducted capacity from new slot: ${newTime}, affected rows: ${result.affectedRows}`);
                        resolve();
                      }
                    }
                  }
                );
              });
            }
          } else {
            // No available slots for today
            console.log(`No available slots found for doctor ${appointment.employee_id} on ${formattedAppointmentDate}`);
            return res.status(400).json({
              message: "No available time slots for today. Please reschedule for another day.",
              details: {
                doctorId: appointment.employee_id,
                doctorName: `${appointment.doctor_first_name} ${appointment.doctor_last_name}`,
                date: formattedAppointmentDate,
                reason: "no_available_slots"
              }
            });
          }
        } catch (error) {
          console.error("Error checking availability:", error.message);
          return res.status(500).json({
            message: "Error checking doctor availability",
            error: error.message
          });
        }
      } else {
        console.log(`Patient is on time or slightly late (${minutesLate} minutes). No rescheduling needed.`);
      }

      // Update appointment with new time (if changed) and status
      const updateQuery = timeUpdated ? `
        UPDATE patient_visit_record 
        SET time_scheduled = ?, 
            visit_status = "Queued"
        WHERE appointment_code = ?
      ` : `
        UPDATE patient_visit_record 
        SET visit_status = "Queued" 
        WHERE appointment_code = ?
      `;
      
      const updateValues = timeUpdated ? [newTime, appointmentCode] : [appointmentCode];

      console.log(`Updating appointment:`, {
        query: updateQuery,
        values: updateValues,
        timeUpdated
      });

      connection.query(updateQuery, updateValues, (updateErr, updateResults) => {
        if (updateErr) {
          console.error("Update error:", updateErr.message);
          return res.status(500).json({
            message: "Database update error",
            error: updateErr.message,
          });
        }

        console.log(`Appointment updated successfully. Affected rows: ${updateResults.affectedRows}`);

        // Return the appointment record
        const response = {
          message: timeUpdated 
            ? `Appointment rescheduled to ${newTime}` 
            : "Appointment found and status updated to Queued",
          appointment: {
            ...appointment,
            time_scheduled: newTime,
            visit_status: "Queued"
          },
          timing: {
            isToday: isToday,
            timeUpdated: timeUpdated,
            reason: reason,
            minutesLate: Math.max(0, Math.round(minutesLate)),
            currentTime: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            appointmentTime: newTime,
            originalAppointmentTime: timeUpdated ? appointment.time_scheduled : null,
            currentDate: now.toISOString().split('T')[0],
            appointmentDate: formattedAppointmentDate
          }
        };

        // Add doctor availability info if we checked it
        if (doctorAvailability) {
          response.doctorAvailability = doctorAvailability;
        }

        console.log(`Returning response:`, {
          message: response.message,
          timeUpdated: response.timing.timeUpdated
        });

        return res.status(200).json(response);
      });

    } catch (error) {
      console.error("Time parsing error:", error.message);
      return res.status(400).json({
        message: "Invalid time format in appointment",
        error: error.message
      });
    }
  });
};
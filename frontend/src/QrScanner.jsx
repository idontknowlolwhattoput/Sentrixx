import { useRef, useState } from "react";
import QrReader from "./QrReader";

export default function QRScanner() {
  const [scanStatus, setScanStatus] = useState("ready");
  const [manualCode, setManualCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [appointmentData, setAppointmentData] = useState(null);
  const [appointmentStatus, setAppointmentStatus] = useState(""); // "success", "expired", "future", "too_early", "too_late"
  const [scanCooldown, setScanCooldown] = useState(false);
  const [scanTimer, setScanTimer] = useState(0);

  const lastScannedRef = useRef("");
  const manualDebounceRef = useRef(null);
  const scanCooldownRef = useRef(null);

  const sanitizeCode = (raw) => {
    return raw
      .trim()
      .replace(/\s+/g, "")
      .replace(/\uFEFF/g, "");
  };

  // Start cooldown timer
  const startCooldown = () => {
    setScanCooldown(true);
    setScanTimer(3); // 3 second cooldown

    if (scanCooldownRef.current) {
      clearInterval(scanCooldownRef.current);
    }

    scanCooldownRef.current = setInterval(() => {
      setScanTimer((prev) => {
        if (prev <= 1) {
          setScanCooldown(false);
          clearInterval(scanCooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // -------------------------------
  // Fetch Appointment Data (POST)
  // -------------------------------
  const fetchAppointmentData = async (appointmentCode) => {
    if (scanCooldown) return;

    setLoading(true);
    setError("");
    setAppointmentStatus("");
    setAppointmentData(null);

    try {
      const response = await fetch(
        `http://localhost:5000/receptionist/appointment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            appointmentCode: appointmentCode,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("No appointment found with that code");
        } else if (response.status === 400) {
          // Handle different types of timing errors
          const reason = data.details?.reason;
          let errorMessage = data.message;

          switch (reason) {
            case "future_appointment":
              setAppointmentStatus("future");
              break;
            case "too_early":
              setAppointmentStatus("too_early");
              break;
            case "too_late":
              setAppointmentStatus("too_late");
              break;
            case "appointment_passed":
              setAppointmentStatus("expired");
              break;
            default:
              setAppointmentStatus("error");
          }

          throw new Error(errorMessage);
        } else {
          throw new Error(data.message || "Failed to fetch appointment data");
        }
      }

      // Success case
      setAppointmentData(data.appointment);
      setAppointmentStatus("success");

      // Start cooldown after successful scan
      startCooldown();
    } catch (error) {
      console.error("Error fetching appointment:", error);
      setError(error.message);
      setAppointmentData(null);

      // Start cooldown even on error to prevent spam
      startCooldown();
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------
  // Handle Manual Code Input (Debounced)
  // -------------------------------
  const handleManualCodeChange = (e) => {
    const value = e.target.value;
    setManualCode(value);

    if (manualDebounceRef.current) {
      clearTimeout(manualDebounceRef.current);
    }

    manualDebounceRef.current = setTimeout(async () => {
      const clean = sanitizeCode(value);
      if (clean.length > 0) {
        await fetchAppointmentData(clean);
      }
    }, 500);
  };

  const getStatusColor = () => {
    switch (scanStatus) {
      case "success":
        return "bg-green-100 border-green-400 text-green-700";
      case "error":
        return "bg-red-100 border-red-400 text-red-700";
      case "ready":
        return "bg-blue-100 border-blue-400 text-blue-700";
      default:
        return "bg-gray-100 border-gray-400 text-gray-700";
    }
  };

  const getStatusMessage = () => {
    if (scanCooldown) return `Cooldown: ${scanTimer}s`;

    switch (scanStatus) {
      case "success":
        return "Appointment verified!";
      case "error":
        return "Camera error";
      case "ready":
        return "Ready to scan";
      default:
        return "Initializing...";
    }
  };

  // Get appointment status color and message
  const getAppointmentStatusInfo = () => {
    switch (appointmentStatus) {
      case "success":
        return {
          color: "bg-green-100 border-green-400 text-green-700",
          headerColor: "bg-gradient-to-r from-green-600 to-green-700",
          buttonColor: "bg-green-500",
          message: "Added to Queue",
          description: "Patient has been added to the waiting queue.",
          icon: "✅",
        };
      case "expired":
        return {
          color: "bg-red-100 border-red-400 text-red-700",
          headerColor: "bg-gradient-to-r from-red-600 to-red-700",
          buttonColor: "bg-red-500",
          message: "Appointment Expired",
          description: "The scheduled date and time has already passed.",
          icon: "❌",
        };
      case "future":
        return {
          color: "bg-blue-100 border-blue-400 text-blue-700",
          headerColor: "bg-gradient-to-r from-blue-600 to-blue-700",
          buttonColor: "bg-blue-500",
          message: "Future Appointment",
          description: "This appointment is scheduled for a future date.",
          icon: "📅",
        };
      case "too_early":
        return {
          color: "bg-yellow-100 border-yellow-400 text-yellow-700",
          headerColor: "bg-gradient-to-r from-yellow-600 to-yellow-700",
          buttonColor: "bg-yellow-500",
          message: "Too Early",
          description: "Please come within 30 minutes of your scheduled time.",
          icon: "⏰",
        };
      case "too_late":
        return {
          color: "bg-orange-100 border-orange-400 text-orange-700",
          headerColor: "bg-gradient-to-r from-orange-600 to-orange-700",
          buttonColor: "bg-orange-500",
          message: "Too Late",
          description: "Appointment time has passed. Please contact reception.",
          icon: "⚠️",
        };
      default:
        return {
          color: "bg-gray-100 border-gray-400 text-gray-700",
          headerColor: "bg-gradient-to-r from-gray-600 to-gray-700",
          buttonColor: "bg-gray-500",
          message: "Not Verified",
          description: "Appointment not yet verified.",
          icon: "⏳",
        };
    }
  };

  // Format patient full name
  const getPatientFullName = () => {
    if (!appointmentData) return "";
    const { first_name, last_name, middle_name } = appointmentData;
    return `${first_name} ${
      middle_name ? middle_name + " " : ""
    }${last_name}`.trim();
  };

  // Format doctor full name
  const getDoctorFullName = () => {
    if (!appointmentData) return "";
    const { doctor_first_name, doctor_last_name } = appointmentData;
    return `Dr. ${doctor_first_name} ${doctor_last_name}`;
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  // Format time for display
  const formatTime = (timeString) => {
    if (!timeString) return "N/A";
    try {
      return new Date(`1970-01-01T${timeString}`).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return timeString;
    }
  };

  const statusInfo = getAppointmentStatusInfo();

  const onNewScanResult = async (data) => {
    const clean = sanitizeCode(data);
    if (lastScannedRef.current === clean || scanCooldown) return;
    lastScannedRef.current = clean;

    setScanStatus("success");
    await fetchAppointmentData(clean);

    setTimeout(() => {
      setScanStatus("ready");
      lastScannedRef.current = "";
    }, 3500);
  };

  return (
    <div className="max-h-screen overflow-auto bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto py-8 px-6">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Appointment Verification
          </h1>
          <p className="text-gray-600">
            Scan QR codes or manually enter appointment codes to verify patient
            appointments
          </p>
        </div>

        {/* Horizontal Layout */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Scanner & Manual Input */}
          <div className="space-y-6">
            {/* Scanner Card */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  QR Code Scanner
                </h2>
                <div
                  className={`px-3 py-1 rounded-full text-sm font-medium border ${
                    scanCooldown
                      ? "bg-purple-100 border-purple-400 text-purple-700"
                      : getStatusColor()
                  }`}
                >
                  {getStatusMessage()}
                </div>
              </div>

              <div className="relative">
                <QrReader
                  onScan={onNewScanResult}
                  onError={(err) => console.log("Error:", err)}
                />

                {/* Cooldown Overlay */}
                {scanCooldown && (
                  <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center rounded-lg">
                    <div className="text-center text-white">
                      <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <p className="text-lg font-semibold">Scan Cooldown</p>
                      <p className="text-2xl font-bold mt-1">{scanTimer}s</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 text-center">
                <p className="text-sm text-gray-500">
                  {scanCooldown
                    ? "Please wait before scanning next code"
                    : "Position QR code within the square frame"}
                </p>
                {scanCooldown && (
                  <p className="text-xs text-purple-600 mt-1">
                    Prevents duplicate requests and spam
                  </p>
                )}
              </div>
            </div>

            {/* Manual Input Card */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Manual Entry
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Appointment Code
                  </label>
                  <input
                    type="text"
                    value={manualCode}
                    onChange={handleManualCodeChange}
                    placeholder="Enter appointment code"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200"
                    disabled={loading}
                  />
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-gray-500">
                      Auto-searches as you type (500ms delay)
                    </p>
                    {loading && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    )}
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-blue-800 font-medium">
                        Auto-search Feature
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Automatically searches for appointments as you type with
                        debouncing
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Results */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 h-fit sticky top-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Appointment Details
            </h2>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
                <p className="text-gray-600">Fetching appointment data...</p>
              </div>
            ) : appointmentData ? (
              <div className="space-y-6">
                {/* Header Card with Status */}
                <div
                  className={`rounded-xl p-6 text-white ${statusInfo.headerColor}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white text-opacity-90 text-sm font-medium">
                        Appointment Code
                      </p>
                      <p className="text-2xl font-bold font-mono">
                        {appointmentData.appointment_code}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-white text-opacity-90 text-sm font-medium">
                        Status
                      </p>
                      <div
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${statusInfo.buttonColor} bg-opacity-90 text-white`}
                      >
                        <span className="text-sm font-medium">
                          {statusInfo.message}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Message */}
                <div className={`p-4 rounded-lg border ${statusInfo.color}`}>
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{statusInfo.icon}</div>
                    <div>
                      <p
                        className={`font-medium ${
                          appointmentStatus === "success"
                            ? "text-green-800"
                            : appointmentStatus === "expired"
                            ? "text-red-800"
                            : appointmentStatus === "future"
                            ? "text-blue-800"
                            : appointmentStatus === "too_early"
                            ? "text-yellow-800"
                            : "text-orange-800"
                        }`}
                      >
                        {error || statusInfo.message}
                      </p>
                      <p
                        className={`text-sm mt-1 ${
                          appointmentStatus === "success"
                            ? "text-green-600"
                            : appointmentStatus === "expired"
                            ? "text-red-600"
                            : appointmentStatus === "future"
                            ? "text-blue-600"
                            : appointmentStatus === "too_early"
                            ? "text-yellow-600"
                            : "text-orange-600"
                        }`}
                      >
                        {statusInfo.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid gap-4">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-sm text-gray-500 font-medium mb-1">
                      Patient Information
                    </p>
                    <p className="text-lg font-semibold text-gray-900">
                      {getPatientFullName()}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-sm text-gray-500 font-medium mb-1">
                      Assigned Doctor
                    </p>
                    <p className="text-lg font-semibold text-gray-900">
                      {getDoctorFullName()}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <p className="text-sm text-gray-500 font-medium mb-1">
                        Date
                      </p>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatDate(appointmentData.date_scheduled)}
                      </p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <p className="text-sm text-gray-500 font-medium mb-1">
                        Time
                      </p>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatTime(appointmentData.time_scheduled)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons - Only show for successful appointments */}
                {appointmentStatus === "success" && (
                  <div className="flex gap-3 pt-4">
                    <button className="flex-1 bg-black text-white py-3 px-6 rounded-xl font-semibold hover:bg-gray-800 transition-colors duration-200">
                      Confirm Check-in
                    </button>
                    <button className="flex-1 border border-gray-300 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-50 transition-colors duration-200">
                      Reschedule
                    </button>
                  </div>
                )}

                {/* Action buttons for other statuses */}
                {(appointmentStatus === "expired" ||
                  appointmentStatus === "too_late") && (
                  <div className="flex gap-3 pt-4">
                    <button className="flex-1 bg-red-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-red-700 transition-colors duration-200">
                      Contact Patient
                    </button>
                    <button className="flex-1 border border-gray-300 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-50 transition-colors duration-200">
                      Create New Appointment
                    </button>
                  </div>
                )}

                {appointmentStatus === "future" && (
                  <div className="flex gap-3 pt-4">
                    <button className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-colors duration-200">
                      Send Reminder
                    </button>
                    <button className="flex-1 border border-gray-300 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-50 transition-colors duration-200">
                      Reschedule
                    </button>
                  </div>
                )}

                {appointmentStatus === "too_early" && (
                  <div className="flex gap-3 pt-4">
                    <button className="flex-1 bg-yellow-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-yellow-700 transition-colors duration-200">
                      Notify Patient
                    </button>
                    <button className="flex-1 border border-gray-300 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-50 transition-colors duration-200">
                      Waitlist
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Appointment Data
                </h3>
                <p className="text-gray-500 text-sm">
                  Scan a QR code or enter an appointment code to view details
                </p>
                {error && (
                  <div
                    className={`mt-4 p-3 rounded-lg ${
                      appointmentStatus === "expired" ||
                      appointmentStatus === "too_late"
                        ? "bg-red-50 border border-red-200 text-red-700"
                        : appointmentStatus === "future"
                        ? "bg-blue-50 border border-blue-200 text-blue-700"
                        : appointmentStatus === "too_early"
                        ? "bg-yellow-50 border border-yellow-200 text-yellow-700"
                        : "bg-yellow-50 border border-yellow-200 text-yellow-700"
                    }`}
                  >
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add custom CSS for scanning animation */}
      <style jsx>{`
        @keyframes scan {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(256px);
          }
        }
        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

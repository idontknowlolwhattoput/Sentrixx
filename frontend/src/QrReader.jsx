// QRScanner.jsx
import { Html5Qrcode } from "html5-qrcode";
import { useEffect, useRef, useState } from "react";

const QrReader = ({ onScan, onError }) => {
  const scannerRef = useRef(null);
  const [hasScanned, setHasScanned] = useState(false);

  useEffect(() => {
    const html5Qr = new Html5Qrcode("reader");
    scannerRef.current = html5Qr;

    html5Qr
      .start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          if (!hasScanned) {
            console.log("Scanned:", decodedText);

            // setHasScanned(true); // ✔ prevent multiple scans

            if (onScan) onScan(decodedText);

            // ❗ OPTIONAL auto-stop after success
            // html5Qr.stop().then(() => html5Qr.clear());
          }
        },
        (errorMessage) => {
          // ✔ prevent error spamming
          // console.log("Scan error:", errorMessage);  // Remove spam
        }
      )
      .catch((err) => console.error("Camera start error:", err));

    return () => {};
  }, []);

  return (
    <>
      <div className="relative">
        <div
          id="reader"
          className="w-full h-64 mx-auto rounded-lg border-2 border-gray-300 overflow-hidden bg-black transition-all duration-300"
        ></div>

        {/* Scanner Overlay with Square Box */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          {/* Square Scanning Box */}
          <div className="w-64 h-64 border-2 border-white rounded-lg relative">
            {/* Animated scanning line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-green-400 animate-scan rounded-full shadow-lg shadow-green-400/50"></div>

            {/* Corner markers */}
            <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-green-400"></div>
            <div className="absolute -top-1 -right-1 w-6 h-6 border-t-2 border-r-2 border-green-400"></div>
            <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-2 border-l-2 border-green-400"></div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-green-400"></div>
          </div>
        </div>
      </div>
    </>
  );
};

export default QrReader;

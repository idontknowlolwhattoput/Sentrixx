import { useRef } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas-pro";

export default function usePDF() {
  const ref = useRef();

  const generatePDF = async (fileName = "document.pdf") => {
    if (!ref.current) return;

    document.querySelectorAll('.hide').forEach((el) => {
      el.classList.add("hidden");
    });

    const canvas = await html2canvas(ref.current, {
      scale: 2,
      useCORS: true,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");

    const width = pdf.internal.pageSize.getWidth();
    const height = (canvas.height * width) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, width, height);
    pdf.save(fileName);

  };

  return { ref, generatePDF };
}

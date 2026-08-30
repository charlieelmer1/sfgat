/**
 * Generates a valid standard PDF 1.4 data URL directly in the browser
 * for clinical procedures, SOPs, and emergency documentation.
 */

export function generateProcedurePdf(doc: {
  title: string;
  category?: string;
  type?: string;
  content: string;
  updatedAt?: string;
}): string {
  const title = doc.title || "Emergency Medical Procedure";
  const category = doc.category || "Clinical Protocol";
  const typeStr = doc.type === "direction" ? "Medical Direction Directive" : "Standard Operating Procedure";
  const dateStr = doc.updatedAt || new Date().toISOString().split("T")[0];

  // Sanitize text for PDF string literals (escape parentheses and backslashes)
  const escapePdf = (str: string) => {
    return str.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  };

  const lines = doc.content.split("\n");
  const contentStreamLines: string[] = [];

  // PDF stream setup
  contentStreamLines.push("BT"); // Begin text
  
  // Header / Title background banner and text
  contentStreamLines.push("/F1 16 Tf"); // Font Helvetica-Bold 16pt
  contentStreamLines.push("50 740 Td");
  contentStreamLines.push(`(${escapePdf(title)}) Tj`);

  // Subheader
  contentStreamLines.push("/F2 10 Tf"); // Font Helvetica 10pt
  contentStreamLines.push("0 -20 Td");
  contentStreamLines.push(`(SIX FLAGS GREAT ADVENTURE EMS | ${escapePdf(category.toUpperCase())} | ${escapePdf(typeStr.toUpperCase())}) Tj`);

  // Date and Authority
  contentStreamLines.push("/F2 9 Tf");
  contentStreamLines.push("0 -16 Td");
  contentStreamLines.push(`(Effective Date: ${escapePdf(dateStr)} | Medical Command Approved) Tj`);

  // Horizontal divider separator
  contentStreamLines.push("0 -15 Td");
  contentStreamLines.push("(_________________________________________________________________________________) Tj");

  // Content body
  contentStreamLines.push("/F2 10 Tf");
  contentStreamLines.push("0 -20 Td");

  let yOffset = 0;
  for (const line of lines) {
    if (yOffset > 38) break; // Keep on single page for simple procedure sheets
    const trimmed = line.trim();
    if (!trimmed) {
      contentStreamLines.push("0 -12 Td");
      contentStreamLines.push("() Tj");
      yOffset += 1;
      continue;
    }

    // Bold section headers
    if (trimmed.endsWith(":") || trimmed.startsWith("1.") || trimmed.startsWith("2.") || trimmed.startsWith("3.") || trimmed.startsWith("4.") || trimmed.startsWith("5.") || trimmed.startsWith("6.") || trimmed.startsWith("7.")) {
      contentStreamLines.push("/F1 10 Tf");
    } else {
      contentStreamLines.push("/F2 10 Tf");
    }

    // Wrap long lines if necessary
    if (trimmed.length > 78) {
      const part1 = trimmed.slice(0, 75);
      const part2 = trimmed.slice(75);
      contentStreamLines.push(`(${escapePdf(part1)}) Tj`);
      contentStreamLines.push("0 -13 Td");
      contentStreamLines.push(`(${escapePdf(part2)}) Tj`);
      contentStreamLines.push("0 -13 Td");
      yOffset += 2;
    } else {
      contentStreamLines.push(`(${escapePdf(trimmed)}) Tj`);
      contentStreamLines.push("0 -13 Td");
      yOffset += 1;
    }
  }

  // Footer
  contentStreamLines.push("0 -20 Td");
  contentStreamLines.push("/F2 8 Tf");
  contentStreamLines.push("(CONFIDENTIAL & PROPRIETARY - SFGA EMS FIRST AID DIVISION - OFFICIAL USE ONLY) Tj");

  contentStreamLines.push("ET"); // End text

  const streamContent = contentStreamLines.join("\n");
  const streamLength = streamContent.length;

  const pdfObjects = [
    `%PDF-1.4`,
    `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj`,
    `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj`,
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>\nendobj`,
    `4 0 obj\n<< /Length ${streamLength} >>\nstream\n${streamContent}\nendstream\nendobj`,
    `5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj`,
    `6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj`,
  ];

  // Calculate xref offsets
  let offset = 0;
  const offsets: number[] = [];
  let pdfString = "";

  for (let i = 0; i < pdfObjects.length; i++) {
    offsets.push(offset);
    const objStr = pdfObjects[i] + "\n";
    pdfString += objStr;
    offset += objStr.length;
  }

  const xrefOffset = offset;
  let xref = `xref\n0 ${pdfObjects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 0; i < pdfObjects.length; i++) {
    const padded = String(offsets[i]).padStart(10, "0");
    xref += `${padded} 00000 n \n`;
  }

  const trailer = `trailer\n<< /Size ${pdfObjects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  const fullPdf = pdfString + xref + trailer;

  return `data:application/pdf;base64,${btoa(unescape(encodeURIComponent(fullPdf)))}`;
}

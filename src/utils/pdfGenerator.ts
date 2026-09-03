/**
 * Generates a valid standard multi-page PDF 1.4 data URL directly in the browser
 * for clinical procedures, SOPs, and emergency documentation.
 */

export function generateProcedurePdf(doc: {
  title: string;
  category?: string;
  type?: string;
  content: string;
  updatedAt?: string;
}): string {
  const title = doc.title || "Emergency Medical Protocol";
  const dateStr = doc.updatedAt || new Date().toISOString().split("T")[0];

  // Sanitize text for PDF string literals (escape parentheses and backslashes)
  const escapePdf = (str: string) => {
    return str.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  };

  // Word wrap function to prevent lines from running off the page
  const wrapLine = (text: string, maxLen = 78): string[] => {
    if (text.length <= maxLen) return [text];
    const words = text.split(" ");
    const wrapped: string[] = [];
    let current = "";

    for (const word of words) {
      if (!current) {
        current = word;
      } else if ((current + " " + word).length <= maxLen) {
        current += " " + word;
      } else {
        wrapped.push(current);
        current = word;
      }
    }
    if (current) wrapped.push(current);
    return wrapped;
  };

  // Process all lines of content
  const rawLines = doc.content.split("\n");
  const processedLines: { text: string; isHeader: boolean }[] = [];

  for (const raw of rawLines) {
    const trimmed = raw.trim();
    if (!trimmed) {
      processedLines.push({ text: "", isHeader: false });
      continue;
    }

    const isHeader =
      trimmed.endsWith(":") ||
      /^[0-9]+\./.test(trimmed) ||
      trimmed.startsWith("Immediate Actions") ||
      trimmed.startsWith("Clinical Presentation") ||
      trimmed.startsWith("Treatment:");

    const wrapped = wrapLine(trimmed, 78);
    for (let i = 0; i < wrapped.length; i++) {
      processedLines.push({
        text: wrapped[i],
        isHeader: isHeader && i === 0,
      });
    }
  }

  // Paginate lines: Page 1 gets up to 38 lines; Page 2+ gets up to 46 lines
  const pagesLines: { text: string; isHeader: boolean }[][] = [];
  let currentLineIndex = 0;

  // Page 1
  const page1Capacity = 36;
  const page1Chunk = processedLines.slice(0, page1Capacity);
  pagesLines.push(page1Chunk.length > 0 ? page1Chunk : [{ text: "No content provided.", isHeader: false }]);
  currentLineIndex = page1Capacity;

  // Subsequent pages
  const subPageCapacity = 44;
  while (currentLineIndex < processedLines.length) {
    const chunk = processedLines.slice(currentLineIndex, currentLineIndex + subPageCapacity);
    pagesLines.push(chunk);
    currentLineIndex += subPageCapacity;
  }

  const totalPages = pagesLines.length;

  // Construct PDF streams for each page
  const pageStreamContents: string[] = [];

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const pageLines = pagesLines[pageNum - 1];
    const streamCmds: string[] = [];

    streamCmds.push("BT"); // Begin text

    if (pageNum === 1) {
      // Top Document Title Banner
      streamCmds.push("/F1 15 Tf"); // Font Helvetica-Bold 15pt
      streamCmds.push("50 742 Td");
      streamCmds.push(`(${escapePdf(title)}) Tj`);

      // Subheader
      streamCmds.push("/F2 9 Tf");
      streamCmds.push("0 -18 Td");
      streamCmds.push(`(SIX FLAGS GREAT ADVENTURE EMS | MEDICAL & OPERATIONAL DIRECTIVE) Tj`);

      // Effective Date
      streamCmds.push("/F2 8.5 Tf");
      streamCmds.push("0 -14 Td");
      streamCmds.push(`(Effective Date: ${escapePdf(dateStr)} | Medical Command Approved) Tj`);

      // Divider rule
      streamCmds.push("0 -12 Td");
      streamCmds.push("(_________________________________________________________________________________) Tj");

      // Content starting point
      streamCmds.push("/F2 9.5 Tf");
      streamCmds.push("0 -18 Td");
    } else {
      // Subsequent page running header
      streamCmds.push("/F1 9 Tf");
      streamCmds.push("50 750 Td");
      streamCmds.push(`(${escapePdf(title)} - Continued) Tj`);

      streamCmds.push("/F2 8 Tf");
      streamCmds.push("0 -12 Td");
      streamCmds.push(`(SIX FLAGS GREAT ADVENTURE EMS DIRECTIVES) Tj`);

      // Divider rule
      streamCmds.push("0 -10 Td");
      streamCmds.push("(_________________________________________________________________________________) Tj");

      streamCmds.push("/F2 9.5 Tf");
      streamCmds.push("0 -18 Td");
    }

    // Render body lines
    for (const lineObj of pageLines) {
      if (!lineObj.text) {
        streamCmds.push("0 -10 Td");
        streamCmds.push("() Tj");
        continue;
      }

      if (lineObj.isHeader) {
        streamCmds.push("/F1 9.5 Tf");
      } else {
        streamCmds.push("/F2 9.5 Tf");
      }

      streamCmds.push(`(${escapePdf(lineObj.text)}) Tj`);
      streamCmds.push("0 -13 Td");
    }

    streamCmds.push("ET"); // End text

    // Page Footer (independent text block positioned at bottom)
    streamCmds.push("BT");
    streamCmds.push("/F2 8 Tf");
    streamCmds.push("50 36 Td");
    streamCmds.push("(_________________________________________________________________________________) Tj");
    streamCmds.push("0 -12 Td");
    streamCmds.push(`(CONFIDENTIAL & PROPRIETARY - SFGA EMS - Page ${pageNum} of ${totalPages}) Tj`);
    streamCmds.push("ET");

    pageStreamContents.push(streamCmds.join("\n"));
  }

  // Assemble PDF Objects
  // Object IDs:
  // 1: Catalog
  // 2: Pages Parent
  // 3: Font F1 (Helvetica-Bold)
  // 4: Font F2 (Helvetica)
  // 5 + 2*(i-1): Page i
  // 6 + 2*(i-1): Stream i
  const F1_ID = 3;
  const F2_ID = 4;
  const pageObjIds: number[] = [];
  const pdfObjects: { id: number; content: string }[] = [];

  // Font Objects
  pdfObjects.push({
    id: F1_ID,
    content: `${F1_ID} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj`,
  });
  pdfObjects.push({
    id: F2_ID,
    content: `${F2_ID} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj`,
  });

  for (let i = 0; i < totalPages; i++) {
    const pageId = 5 + i * 2;
    const streamId = 6 + i * 2;
    pageObjIds.push(pageId);

    const streamStr = pageStreamContents[i];
    const streamLength = streamStr.length;

    pdfObjects.push({
      id: pageId,
      content: `${pageId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${streamId} 0 R /Resources << /Font << /F1 ${F1_ID} 0 R /F2 ${F2_ID} 0 R >> >> >>\nendobj`,
    });

    pdfObjects.push({
      id: streamId,
      content: `${streamId} 0 obj\n<< /Length ${streamLength} >>\nstream\n${streamStr}\nendstream\nendobj`,
    });
  }

  // Pages Parent Object
  const kidsStr = pageObjIds.map((id) => `${id} 0 R`).join(" ");
  pdfObjects.unshift({
    id: 2,
    content: `2 0 obj\n<< /Type /Pages /Kids [${kidsStr}] /Count ${totalPages} >>\nendobj`,
  });

  // Catalog Object
  pdfObjects.unshift({
    id: 1,
    content: `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj`,
  });

  // Sort objects by ID
  pdfObjects.sort((a, b) => a.id - b.id);

  // Build PDF string with xref table
  let pdfString = "%PDF-1.4\n";
  let offset = pdfString.length;
  const offsets: { [id: number]: number } = {};

  for (const obj of pdfObjects) {
    offsets[obj.id] = offset;
    const objStr = obj.content + "\n";
    pdfString += objStr;
    offset += objStr.length;
  }

  const xrefOffset = offset;
  const maxId = Math.max(...pdfObjects.map((o) => o.id));
  let xref = `xref\n0 ${maxId + 1}\n0000000000 65535 f \n`;

  for (let i = 1; i <= maxId; i++) {
    const byteOffset = offsets[i] || 0;
    const padded = String(byteOffset).padStart(10, "0");
    xref += `${padded} 00000 n \n`;
  }

  const trailer = `trailer\n<< /Size ${maxId + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  const fullPdf = pdfString + xref + trailer;

  return `data:application/pdf;base64,${btoa(unescape(encodeURIComponent(fullPdf)))}`;
}


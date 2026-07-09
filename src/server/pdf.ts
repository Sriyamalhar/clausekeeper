import pdfParse from "pdf-parse";

const MAX_CHARS_FOR_EXTRACTION = 15000; // keep prompt cost/latency bounded

export interface ExtractedPdf {
  text: string;
  pageCount: number;
  truncated: boolean;
}

export async function extractTextFromPdf(buffer: Buffer): Promise<ExtractedPdf> {
  const result = await pdfParse(buffer);
  const truncated = result.text.length > MAX_CHARS_FOR_EXTRACTION;

  return {
    text: truncated ? result.text.slice(0, MAX_CHARS_FOR_EXTRACTION) : result.text,
    pageCount: result.numpages,
    truncated,
  };
}

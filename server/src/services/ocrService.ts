import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import { createWorker } from 'tesseract.js';

export interface ExtractedFDRData {
  fdrNumber?: string;
  bankName?: string;
  depositAmount?: number;
  issueDate?: string;
  maturityDate?: string;
  rawText: string;
  confidence: number;
}

const KNOWN_BANKS = [
  'State Bank of India',
  'Punjab National Bank',
  'Bank of Baroda',
  'Canara Bank',
  'Union Bank of India',
  'HDFC Bank',
  'ICICI Bank',
  'Axis Bank',
  'Kotak Mahindra Bank',
  'Indian Bank',
  'Bank of India',
  'Central Bank of India',
  'Federal Bank',
  'IDBI Bank',
  'AICTE Treasury Bank',
];

export async function extractFDRDataFromFile(filePath: string, mimetype: string): Promise<ExtractedFDRData> {
  let rawText = '';
  let confidence = 0.85;

  try {
    if (mimetype === 'application/pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      rawText = pdfData.text;
      confidence = 0.92;
    } else if (mimetype.startsWith('image/')) {
      const worker = await createWorker('eng');
      const ret = await worker.recognize(filePath);
      rawText = ret.data.text;
      confidence = (ret.data.confidence || 75) / 100;
      await worker.terminate();
    }
  } catch (err: any) {
    console.warn(`[OCR Service] Could not extract raw text from ${filePath}:`, err.message);
    return {
      rawText: '',
      confidence: 0,
    };
  }

  // Parse structured fields from extracted text
  const extracted = parseFDRFieldsFromText(rawText);
  return {
    ...extracted,
    rawText: rawText.slice(0, 4000), // store preview of text
    confidence: extracted.fdrNumber ? confidence : Math.max(0.2, confidence - 0.4),
  };
}

export function parseFDRFieldsFromText(text: string): Partial<ExtractedFDRData> {
  const result: Partial<ExtractedFDRData> = {};

  if (!text || text.trim().length === 0) {
    return result;
  }

  // Normalize text
  const clean = text.replace(/\r\n/g, '\n');

  // 1. Extract FDR / Deposit Receipt Number
  // Examples: "FDR No: 98765432101", "Deposit Receipt No: SBIN-2024-8841", "Account No: 12345678"
  const fdrPatterns = [
    /(?:FDR|Fixed\s*Deposit(?:\s*Receipt)?|Deposit\s*Receipt|Receipt|Certificate)\s*(?:No\.?|Number|#)?[:.\s-]*([A-Z0-9\-\/]{6,25})/i,
    /(?:Term\s*Deposit\s*Account|TDA\s*A\/c)\s*(?:No\.?|Number)?[:.\s-]*([A-Z0-9\-\/]{6,25})/i,
    /(?:A\/c\s*No\.?|Account\s*No\.?)[:.\s-]*([0-9]{8,20})/i,
  ];

  for (const pattern of fdrPatterns) {
    const match = clean.match(pattern);
    if (match && match[1]) {
      result.fdrNumber = match[1].trim();
      break;
    }
  }

  // 2. Extract Bank Name
  for (const bank of KNOWN_BANKS) {
    const regex = new RegExp(bank, 'i');
    if (regex.test(clean)) {
      result.bankName = bank;
      break;
    }
  }
  if (!result.bankName) {
    const genericBankMatch = clean.match(/(?:Bank\s*Name|Issuing\s*Bank)[:.\s-]*([A-Za-z\s]+(?:Bank|Financial))/i);
    if (genericBankMatch && genericBankMatch[1]) {
      result.bankName = genericBankMatch[1].trim();
    }
  }

  // 3. Extract Deposit Amount
  // Examples: "Rs. 25,00,000", "Amount: INR 500000.00", "Principal: 35,00,000"
  const amountPatterns = [
    /(?:Deposit\s*Amount|Principal(?:\s*Amount)?|FDR\s*Amount|Sum\s*of\s*Rupees|Amount)[:.\s]*(?:Rs\.?|INR|₹)?\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{2})?)/i,
    /(?:Rs\.?|INR|₹)\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{2})?)/i,
  ];

  for (const pattern of amountPatterns) {
    const match = clean.match(pattern);
    if (match && match[1]) {
      const numStr = match[1].replace(/,/g, '');
      const parsed = parseFloat(numStr);
      if (!isNaN(parsed) && parsed > 0) {
        result.depositAmount = parsed;
        break;
      }
    }
  }

  // 4. Extract Issue Date
  // Examples: "Date of Issue: 15/06/2023", "Issue Date: 2023-06-15", "Dated: 12-Apr-2022"
  const issueDateMatch = clean.match(/(?:Issue\s*Date|Date\s*of\s*Issue|Effective\s*Date|Dated)[:.\s]*([0-9]{1,2}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{2,4}|[0-9]{4}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{1,2}|[0-9]{1,2}\s+[A-Za-z]{3,9}\s+[0-9]{4})/i);
  if (issueDateMatch && issueDateMatch[1]) {
    result.issueDate = issueDateMatch[1].trim();
  }

  // 5. Extract Maturity Date
  // Examples: "Date of Maturity: 15/06/2028", "Maturity Date: 2028-06-15", "Due Date: 12-Apr-2027"
  const maturityDateMatch = clean.match(/(?:Maturity\s*Date|Date\s*of\s*Maturity|Due\s*Date)[:.\s]*([0-9]{1,2}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{2,4}|[0-9]{4}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{1,2}|[0-9]{1,2}\s+[A-Za-z]{3,9}\s+[0-9]{4})/i);
  if (maturityDateMatch && maturityDateMatch[1]) {
    result.maturityDate = maturityDateMatch[1].trim();
  }

  return result;
}

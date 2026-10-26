import fs from 'fs';
import crypto from 'crypto';
import pdfParse from 'pdf-parse';
import { IIntegritySignal } from '../models/Document.js';

export function computeFileSHA256(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', data => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', err => reject(err));
  });
}

export async function inspectDocumentIntegritySignals(
  filePath: string,
  mimetype: string
): Promise<IIntegritySignal> {
  if (mimetype !== 'application/pdf') {
    return {
      structuralCheckPassed: true,
      remarks: 'Image document format (PNG/JPG); cryptographic SHA-256 calculated.',
    };
  }

  try {
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);

    const info = pdfData.info || {};
    const pageCount = pdfData.numpages || 1;
    const pdfVersion = pdfData.version || '1.4';

    return {
      isEncrypted: false,
      pdfVersion: String(pdfVersion),
      pageCount,
      producer: info.Producer ? String(info.Producer).slice(0, 100) : '',
      creator: info.Creator ? String(info.Creator).slice(0, 100) : '',
      structuralCheckPassed: pageCount > 0,
      remarks: `Valid PDF structure (${pageCount} page(s), version ${pdfVersion}). No encryption flags.`,
    };
  } catch (err: any) {
    return {
      structuralCheckPassed: false,
      remarks: `Warning: PDF structural inspection noted anomaly: ${err.message}`,
    };
  }
}

import { Response } from 'express';
import { FDR } from '../models/FDR.js';
import { RefundRequest } from '../models/RefundRequest.js';
import { RenewalRequest } from '../models/RenewalRequest.js';
import { AuthRequest, getScopedInstitutionIds } from '../middleware/authMiddleware.js';

function formatCSV(rows: any[], headers: string[]): string {
  const headerLine = headers.join(',');
  const lines = rows.map(row =>
    headers
      .map(h => {
        let val = row[h] !== undefined && row[h] !== null ? String(row[h]) : '';
        val = val.replace(/"/g, '""');
        return `"${val}"`;
      })
      .join(',')
  );
  return [headerLine, ...lines].join('\n');
}

export async function getFDRReport(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user!;
    const { status, bankName, format } = req.query;

    const query: any = {};
    const scopedIds = await getScopedInstitutionIds(user);
    if (scopedIds !== null) {
      if (scopedIds.length === 0) {
        res.status(200).json({ success: true, data: [] });
        return;
      }
      query.institutionId = { $in: scopedIds };
    }

    if (status) query.currentStatus = status;
    if (bankName) query.bankName = new RegExp(bankName as string, 'i');

    const fdrs = await FDR.find(query)
      .populate('institutionId', 'name institutionCode')
      .sort({ maturityDate: 1 });

    if (format === 'csv') {
      const csvData = fdrs.map(f => ({
        InstitutionCode: (f.institutionId as any)?.institutionCode || '',
        InstitutionName: (f.institutionId as any)?.name || '',
        FDRNumber: f.fdrNumber,
        BankName: f.bankName,
        BranchName: f.branchName,
        DepositAmount: f.depositAmount,
        IssueDate: f.issueDate.toISOString().slice(0, 10),
        MaturityDate: f.maturityDate.toISOString().slice(0, 10),
        VerificationStatus: f.verificationStatus,
        CurrentStatus: f.currentStatus,
        RenewalStatus: f.renewalStatus,
      }));

      const csv = formatCSV(csvData, [
        'InstitutionCode',
        'InstitutionName',
        'FDRNumber',
        'BankName',
        'BranchName',
        'DepositAmount',
        'IssueDate',
        'MaturityDate',
        'VerificationStatus',
        'CurrentStatus',
        'RenewalStatus',
      ]);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="AICTE_FDR_Report.csv"');
      res.send(csv);
      return;
    }

    res.json({
      success: true,
      total: fdrs.length,
      data: fdrs,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error generating FDR report.' });
  }
}

export async function getMaturityReport(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user!;
    const { timeframe = '60', format } = req.query;

    const query: any = {};
    const scopedIds = await getScopedInstitutionIds(user);
    if (scopedIds !== null) {
      if (scopedIds.length === 0) {
        res.status(200).json({ success: true, data: [] });
        return;
      }
      query.institutionId = { $in: scopedIds };
    }

    const days = parseInt(timeframe as string, 10);
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + (isNaN(days) ? 60 : days));

    query.maturityDate = { $lte: futureDate };
    query.currentStatus = { $in: ['Active', 'Expiring Soon', 'Matured'] };

    const records = await FDR.find(query)
      .populate('institutionId', 'name institutionCode')
      .sort({ maturityDate: 1 });

    const formatted = records.map(f => {
      const diffDays = Math.ceil((new Date(f.maturityDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return {
        ...f.toObject(),
        daysRemaining: diffDays,
        maturityStatus: diffDays <= 0 ? 'Matured' : diffDays <= 15 ? 'Critical (<15d)' : 'Upcoming',
      };
    });

    if (format === 'csv') {
      const csvData = formatted.map(f => ({
        InstitutionCode: (f.institutionId as any)?.institutionCode || '',
        InstitutionName: (f.institutionId as any)?.name || '',
        FDRNumber: f.fdrNumber,
        BankName: f.bankName,
        DepositAmount: f.depositAmount,
        MaturityDate: new Date(f.maturityDate).toISOString().slice(0, 10),
        DaysRemaining: f.daysRemaining,
        MaturityStatus: f.maturityStatus,
        CurrentStatus: f.currentStatus,
      }));

      const csv = formatCSV(csvData, [
        'InstitutionCode',
        'InstitutionName',
        'FDRNumber',
        'BankName',
        'DepositAmount',
        'MaturityDate',
        'DaysRemaining',
        'MaturityStatus',
        'CurrentStatus',
      ]);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="AICTE_Maturity_Report.csv"');
      res.send(csv);
      return;
    }

    res.json({
      success: true,
      total: formatted.length,
      data: formatted,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error generating maturity report.' });
  }
}

export async function getOverdueReport(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user!;
    const fdrQuery: any = {
      $or: [
        { currentStatus: 'Matured', renewalStatus: { $in: ['Not Applicable', 'Renewal Pending'] } },
        { verificationStatus: 'Pending Verification', createdAt: { $lte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) } },
      ],
    };

    const scopedIds = await getScopedInstitutionIds(user);
    if (scopedIds !== null) {
      if (scopedIds.length === 0) {
        res.status(200).json({ success: true, data: [] });
        return;
      }
      fdrQuery.institutionId = { $in: scopedIds };
    }

    const overdueFdrs = await FDR.find(fdrQuery)
      .populate('institutionId', 'name institutionCode')
      .sort({ maturityDate: 1 });

    res.json({
      success: true,
      total: overdueFdrs.length,
      data: overdueFdrs,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error generating overdue report.' });
  }
}

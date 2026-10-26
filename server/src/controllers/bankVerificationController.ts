import { Response } from 'express';
import { BankVerificationRequest } from '../models/BankVerificationRequest.js';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { logAudit } from '../middleware/auditMiddleware.js';
import {
  validateIFSCSyntax,
  lookupBankMetadata,
  createBankVerificationTicket,
  updateBankVerificationStatus,
} from '../services/bankVerificationService.js';

export async function validateIFSC(req: AuthRequest, res: Response): Promise<void> {
  try {
    const ifsc = Array.isArray(req.params.ifsc) ? req.params.ifsc[0] : req.params.ifsc;
    const lookup = lookupBankMetadata(ifsc);
    res.json({ success: true, lookup });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error validating IFSC code.' });
  }
}

export async function getVerificationTickets(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user!;
    const { status, search } = req.query;

    const query: any = {};
    if (user.role === 'institution') {
      if (!user.institutionId) {
        res.status(200).json({ success: true, tickets: [] });
        return;
      }
      query.institutionId = user.institutionId;
    }

    if (status) query.status = status;
    if (search) {
      const searchRegex = new RegExp(search as string, 'i');
      query.$or = [{ fdrNumber: searchRegex }, { requestReference: searchRegex }, { bankName: searchRegex }];
    }

    const tickets = await BankVerificationRequest.find(query)
      .populate('institutionId', 'name institutionCode')
      .populate('requestedBy', 'name role')
      .sort({ createdAt: -1 });

    res.json({ success: true, tickets });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching verification tickets.' });
  }
}

export async function createTicket(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user!;
    const { fdrId, verificationMethod } = req.body;

    if (!fdrId) {
      res.status(400).json({ success: false, message: 'FDR ID is required.' });
      return;
    }

    const ticket = await createBankVerificationTicket({
      fdrId,
      requestedBy: user._id,
      verificationMethod,
    });

    await logAudit({
      req,
      action: 'CREATE_BANK_VERIFICATION_TICKET',
      entityType: 'BankVerification',
      entityId: ticket._id.toString(),
      institutionId: ticket.institutionId,
      newValues: { requestReference: ticket.requestReference, fdrNumber: ticket.fdrNumber },
    });

    res.status(201).json({
      success: true,
      message: 'Bank verification inquiry ticket created (Simulated Bank Liaison Mode).',
      ticket,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error initiating bank verification.' });
  }
}

export async function updateTicketStatus(req: AuthRequest, res: Response): Promise<void> {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const user = req.user!;
    const { status, bankOfficerName, bankOfficerDesignation, responseNotes, lienConfirmed, amountConfirmed } = req.body;

    const ticket = await updateBankVerificationStatus({
      ticketId: id,
      status,
      bankOfficerName,
      bankOfficerDesignation,
      responseNotes,
      lienConfirmed,
      amountConfirmed,
      actor: user,
    });

    await logAudit({
      req,
      action: 'UPDATE_BANK_VERIFICATION_STATUS',
      entityType: 'BankVerification',
      entityId: ticket._id.toString(),
      institutionId: ticket.institutionId,
      newValues: { status, lienConfirmed, amountConfirmed },
    });

    res.json({
      success: true,
      message: `Bank verification ticket updated to ${status}.`,
      ticket,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error updating verification ticket.' });
  }
}

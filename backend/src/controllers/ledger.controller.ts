import { Request, Response, NextFunction } from 'express';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { prisma } from '../lib/prisma';
import { reportRange } from '../lib/salesReport';
export class LedgerController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const range = reportRange(req.query);
      const createdAt = { gte: range.start, lt: range.end };
      const [payments, refunds] = await Promise.all([
        prisma.payment.findMany({ where: { createdAt, status: { in: ['COMPLETED', 'REFUNDED'] } }, include: { order: { select: { orderNumber: true } } } }),
        prisma.refund.findMany({ where: { createdAt }, include: { order: { select: { orderNumber: true } } } }),
      ]);
      const rows = [
        ...payments.map(p => ({ date: p.createdAt.toISOString(), order: p.order.orderNumber, type: 'PAYMENT', method: p.method, status: p.status, credit: p.amount, debit: 0 })),
        ...refunds.map(r => ({ date: r.createdAt.toISOString(), order: r.order.orderNumber, type: 'REFUND', method: r.refundId ? 'GATEWAY' : 'WALLET / MANUAL', status: r.status, credit: 0, debit: r.amount })),
      ].sort((a, b) => a.date.localeCompare(b.date));
      if (req.query.format === 'xlsx') {
        const book = new ExcelJS.Workbook(), sheet = book.addWorksheet('Ledger');
        sheet.columns = ['date', 'order', 'type', 'method', 'status', 'credit', 'debit'].map(key => ({ key, header: key, width: key === 'order' ? 40 : 25 }));
        rows.forEach(row => sheet.addRow(row));
        res.type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet').attachment('pick2buy-ledger.xlsx');
        return res.send(Buffer.from(await book.xlsx.writeBuffer()));
      }
      if (req.query.format === 'pdf') {
        const doc = new PDFDocument({ margin: 40 }); res.type('application/pdf').attachment('pick2buy-ledger.pdf'); doc.pipe(res);
        doc.fontSize(18).text('Pick2Buy transaction ledger').fontSize(10).text(`${range.from} to ${range.to} (IST filter; timestamps UTC). Amounts in INR.`).text('Pending refunds represent obligations, not confirmed payouts.').moveDown();
        rows.forEach(row => doc.text(`${row.date} | ${row.order}\n${row.type} | ${row.method} | ${row.status} | Credit ${row.credit.toFixed(2)} | Debit ${row.debit.toFixed(2)}`).moveDown());
        doc.end(); return;
      }
      res.json({ success: true, data: { range, rows } });
    } catch (error) { next(error); }
  }
}

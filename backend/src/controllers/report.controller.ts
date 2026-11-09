import { Request, Response, NextFunction } from 'express';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { prisma } from '../lib/prisma';
import { salesReport } from '../lib/salesReport';

export class ReportController {
  static async sales(req: Request, res: Response, next: NextFunction) {
    try {
      const report = await salesReport(req.query);
      const format = String(req.query.format || 'json');
      if (format === 'json') return res.json({ success: true, data: report });
      const title = `Pick2Buy Sales: ${report.range.from} to ${report.range.to} (IST)`;
      if (format === 'xlsx') {
        const workbook = new ExcelJS.Workbook();
        const summary = workbook.addWorksheet('Summary');
        summary.addRow([title]);
        Object.entries(report.summary).forEach(([key, value]) => summary.addRow([key, value]));
        summary.columns = [{ width: 40 }, { width: 24 }];
        const sheet = workbook.addWorksheet('Sales');
        sheet.columns = Object.keys(report.rows[0] || { orderNumber: '', date: '', customer: '', status: '', paymentStatus: '', productDiscount: 0, couponDiscount: 0, gross: 0, refunds: 0, net: 0 }).map(key => ({ header: key, key, width: key === 'orderNumber' ? 40 : 22 }));
        report.rows.forEach(row => sheet.addRow(row));
        sheet.getRow(1).font = { bold: true };
        res.type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet').attachment('pick2buy-sales.xlsx');
        return res.send(Buffer.from(await workbook.xlsx.writeBuffer()));
      }
      if (format !== 'pdf') return res.status(400).json({ success: false, message: 'Use PDF or Excel format' });
      const doc = new PDFDocument({ margin: 40 });
      res.type('application/pdf').attachment('pick2buy-sales.pdf');
      doc.pipe(res); doc.fontSize(16).text(title).moveDown();
      doc.fontSize(10).text('Paid/refunded orders placed in the selected period. Refunds include pending obligations. All amounts in INR.').moveDown();
      Object.entries(report.summary).forEach(([key, value]) => doc.text(`${key}: ${value.toFixed(2)}`));
      doc.moveDown();
      for (const row of report.rows) {
        doc.fontSize(11).text(row.orderNumber);
        doc.fontSize(9).text(`${row.date} | ${row.customer} | ${row.status}`);
        doc.text(`Gross ${row.gross.toFixed(2)} | Product discount ${row.productDiscount.toFixed(2)} | Coupon ${row.couponDiscount.toFixed(2)} | Refund ${row.refunds.toFixed(2)} | Net ${row.net.toFixed(2)}`).moveDown();
      }
      doc.end();
    } catch (error) { next(error); }
  }
  static async invoice(req: Request, res: Response, next: NextFunction) {
    try {
      const staff = ['ADMIN', 'MANAGER', 'STAFF'].includes(req.user!.role);
      const order = await prisma.order.findFirst({ where: { orderNumber: req.params.orderNumber, ...(staff ? {} : { userId: req.user!.id }) }, include: { items: true, refunds: true } });
      if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
      const doc = new PDFDocument({ margin: 45 });
      res.type('application/pdf').attachment(`${order.orderNumber}.pdf`);
      doc.pipe(res);
      doc.fontSize(24).text('Pick2Buy').fontSize(15).text('Order invoice').moveDown();
      doc.fontSize(10).text(order.orderNumber).text(new Date(order.createdAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }));
      doc.text(`${order.customerName} | ${order.customerEmail}`).text(`Payment: ${order.paymentStatus} | ${order.paymentMethod}`).moveDown();
      const address = JSON.parse(order.shippingAddressJson);
      doc.text([address.addressLine, address.apartment, address.city, address.state, address.pincode].filter(Boolean).join(', ')).moveDown();
      for (const item of order.items) doc.text(`${item.productName}${item.cancelled ? ' (Cancelled)' : ''}`).text(`SKU ${item.sku} | Qty ${item.quantity} | INR ${item.total.toFixed(2)}`).moveDown(0.5);
      doc.moveDown().text(`Subtotal: INR ${order.subtotal.toFixed(2)}`).text(`Coupon deduction: INR ${order.discountAmount.toFixed(2)}`).text(`Shipping: INR ${order.shippingFee.toFixed(2)} | COD fee: INR ${order.codFee.toFixed(2)}`);
      doc.fontSize(14).text(`Order total: INR ${order.grandTotal.toFixed(2)}`);
      doc.fontSize(10).text(`Refunds: INR ${order.refunds.reduce((s, r) => s + r.amount, 0).toFixed(2)}`);
      doc.moveDown().text('Thank you for shopping with Pick2Buy. Payment status is shown above.');
      doc.end();
    } catch (error) { next(error); }
  }
}

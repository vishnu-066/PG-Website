import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { Resend } from 'resend';

function resendDevPlugin() {
  return {
    name: 'resend-dev-server',
    configureServer(server) {
      server.middlewares.use('/api/send-receipt', async (req, res, next) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              const parsed = JSON.parse(body || '{}');
              const env = loadEnv('', process.cwd(), '');
              const apiKey = env.RESEND_API_KEY || process.env.RESEND_API_KEY;
              
              if (!apiKey) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ 
                  success: false, 
                  message: 'RESEND_API_KEY is not set in your .env file. Please add your Resend API key to .env' 
                }));
              }

              const resend = new Resend(apiKey);
              const fromAddress = env.RESEND_FROM_EMAIL || process.env.RESEND_FROM_EMAIL || 'Sri Venkateswara PG <onboarding@resend.dev>';
              
              const { to, tenantName, receiptNumber, amount, paymentDate, dueDate, roomNumber, bedNumber, paymentMode, transactionId, pdfBase64 } = parsed;
              
              if (!to || !to.includes('@')) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ success: false, message: 'Valid recipient email required' }));
              }

              const formattedAmount = Number(amount || 0).toLocaleString('en-IN');
              const safeReceiptNum = receiptNumber || 'REC-101';
              const cleanFileName = `Payment_Receipt_${safeReceiptNum.replace(/[^0-9a-zA-Z]/g, '')}_${(tenantName || 'Resident').replace(/\s+/g, '_')}.pdf`;

              const htmlContent = `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
                  <div style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 24px; text-align: center; color: #ffffff; border-radius: 8px;">
                    <h2 style="margin: 0; font-size: 20px; font-weight: 800;">SRI VENKATESWARA GENTS PG</h2>
                    <p style="margin: 4px 0 0; font-size: 12px; opacity: 0.9;">Premium Co-Living Accommodation &amp; Homestyle Food</p>
                    <span style="display: inline-block; background: #dcfce7; color: #15803d; font-weight: 700; font-size: 11px; padding: 4px 12px; border-radius: 16px; margin-top: 10px;">
                      &#10003; PAYMENT RECEIVED &amp; CLEARED
                    </span>
                  </div>
                  <div style="padding: 20px 4px;">
                    <p style="font-size: 14px; color: #1e293b;">Dear <strong>${tenantName || 'Resident'}</strong>,</p>
                    <p style="font-size: 13.5px; line-height: 1.5; color: #475569;">
                      Thank you for your rent payment to Sri Venkateswara Gents PG! Below are the summary details of your payment:
                    </p>
                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; font-size: 13px; line-height: 1.8;">
                      <div><span style="color: #64748b;">Receipt Number:</span> <strong>${safeReceiptNum}</strong></div>
                      <div><span style="color: #64748b;">Room Allocation:</span> <strong>Room ${roomNumber || '-'} (Bed ${bedNumber || '-'})</strong></div>
                      <div><span style="color: #64748b;">Payment Date:</span> <strong>${paymentDate || '-'}</strong></div>
                      <div><span style="color: #64748b;">Billing Cycle:</span> <strong>${dueDate || '-'}</strong></div>
                      <div><span style="color: #64748b;">Payment Mode:</span> <strong>${paymentMode || 'UPI'}</strong></div>
                      <div><span style="color: #64748b;">Transaction / UTR ID:</span> <strong style="font-family: monospace;">${transactionId || 'CASH-SETTLED'}</strong></div>
                      <div style="border-top: 1px dashed #cbd5e1; margin-top: 6px; padding-top: 6px; font-size: 14px;">
                        <span style="color: #64748b;">Total Amount Paid:</span> <strong style="color: #15803d; font-size: 15px;">&#8377;${formattedAmount}</strong>
                      </div>
                    </div>
                    <div style="background: #eff6ff; border-left: 4px solid #2563eb; padding: 10px 14px; border-radius: 6px; font-size: 12.5px; color: #1e40af; margin-top: 16px;">
                      &#128206; <strong>Official Receipt Attached:</strong> Your printable PDF rent receipt (<code>${cleanFileName}</code>) is attached to this email for your records and tax/HRA filing.
                    </div>
                  </div>
                  <div style="border-top: 1px solid #e2e8f0; padding-top: 14px; text-align: center; font-size: 11.5px; color: #64748b;">
                    <strong>Sri Venkateswara Gents PG</strong><br />
                    Behind Hanuman Arch, Sarjapur Road, Bengaluru 560035<br />
                    Phone: +91 91107 52349 &bull; Email: contact@svpg.in
                  </div>
                </div>
              `;

              const attachments = [];
              if (pdfBase64) {
                const cleanBase64 = pdfBase64.includes(',') ? pdfBase64.split(',')[1] : pdfBase64;
                attachments.push({
                  filename: cleanFileName,
                  content: Buffer.from(cleanBase64, 'base64')
                });
              }

              const { data, error } = await resend.emails.send({
                from: fromAddress,
                to: [to],
                subject: `Official Rent Payment Receipt ${safeReceiptNum} - Sri Venkateswara Gents PG`,
                html: htmlContent,
                attachments: attachments.length > 0 ? attachments : undefined
              });

              if (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ success: false, message: error.message }));
              }

              res.writeHead(200, { 'Content-Type': 'application/json' });
              return res.end(JSON.stringify({ success: true, message: `Receipt sent to ${to}`, id: data?.id }));
            } catch (err) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              return res.end(JSON.stringify({ success: false, message: err.message }));
            }
          });
          return;
        }
        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), resendDevPlugin()],
  server: {
    host: '0.0.0.0',
    port: 5175
  }
});


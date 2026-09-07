import { Resend } from 'resend';

export default async function handler(req, res) {
  // Set CORS headers for local development & cross-origin safety
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const {
      to,
      tenantName,
      receiptNumber,
      amount,
      paymentDate,
      dueDate,
      roomNumber,
      bedNumber,
      paymentMode,
      transactionId,
      pdfBase64
    } = req.body || {};

    if (!to || !to.includes('@')) {
      return res.status(400).json({ success: false, message: 'Valid recipient email is required' });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: 'RESEND_API_KEY is not configured in environment variables. Please add your Resend API key to .env'
      });
    }

    const resend = new Resend(apiKey);
    const fromAddress = process.env.RESEND_FROM_EMAIL || 'Sri Venkateswara PG <onboarding@resend.dev>';

    const formattedAmount = Number(amount || 0).toLocaleString('en-IN');
    const safeReceiptNum = receiptNumber || 'REC-101';
    const cleanFileName = `Payment_Receipt_${safeReceiptNum.replace(/[^0-9a-zA-Z]/g, '')}_${(tenantName || 'Resident').replace(/\s+/g, '_')}.pdf`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; color: #0f172a; }
          .container { max-width: 600px; margin: 24px auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.04); }
          .header { background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 32px 28px; text-align: center; color: #ffffff; }
          .header h1 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.3px; }
          .header p { margin: 6px 0 0; font-size: 13px; opacity: 0.9; }
          .badge { display: inline-block; background: #dcfce7; color: #15803d; font-weight: 700; font-size: 12px; padding: 6px 14px; border-radius: 20px; margin-top: 14px; border: 1px solid #86efac; }
          .content { padding: 28px; }
          .greeting { font-size: 16px; font-weight: 600; color: #1e293b; margin-bottom: 12px; }
          .message { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 20px; }
          .summary-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px 20px; margin-bottom: 22px; }
          .summary-title { font-size: 12px; font-weight: 800; color: #2563eb; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
          .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
          .row span { color: #64748b; }
          .row strong { color: #0f172a; }
          .total-row { border-top: 1px dashed #cbd5e1; margin-top: 8px; padding-top: 10px; font-size: 15px; }
          .total-row strong { color: #15803d; font-size: 16px; }
          .attachment-note { background: #eff6ff; border-left: 4px solid #2563eb; padding: 12px 16px; border-radius: 6px; font-size: 13px; color: #1e40af; margin-bottom: 24px; }
          .footer { background: #f1f5f9; padding: 20px 28px; font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; line-height: 1.5; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>SRI VENKATESWARA GENTS PG</h1>
            <p>Premium Co-Living Accommodation &amp; Homestyle Food</p>
            <div class="badge">&#10003; PAYMENT RECEIVED &amp; CLEARED</div>
          </div>
          <div class="content">
            <div class="greeting">Dear ${tenantName || 'Resident'},</div>
            <p class="message">
              Thank you for staying with us! Your rent payment has been successfully recorded. Below are the summary details of your payment:
            </p>
            <div class="summary-card">
              <div class="summary-title">Payment Receipt Summary</div>
              <div class="row"><span>Receipt Number:</span><strong>${safeReceiptNum}</strong></div>
              <div class="row"><span>Room &amp; Bed:</span><strong>Room ${roomNumber || '-'} (Bed ${bedNumber || '-'})</strong></div>
              <div class="row"><span>Payment Date:</span><strong>${paymentDate || new Date().toISOString().split('T')[0]}</strong></div>
              <div class="row"><span>Billing Period:</span><strong>${dueDate || '-'}</strong></div>
              <div class="row"><span>Payment Mode:</span><strong>${paymentMode || 'UPI'}</strong></div>
              <div class="row"><span>Transaction / UTR ID:</span><strong style="font-family: monospace;">${transactionId || 'CASH-SETTLED'}</strong></div>
              <div class="row total-row"><span>Total Amount Paid:</span><strong>&#8377;${formattedAmount}</strong></div>
            </div>
            <div class="attachment-note">
              &#128206; <strong>Official Receipt Attached:</strong> Your printable PDF rent receipt (<code>${cleanFileName}</code>) is attached to this email. You can download or print it for HRA tax exemption claims and corporate expense reimbursements.
            </div>
          </div>
          <div class="footer">
            <strong>Sri Venkateswara Gents PG</strong><br />
            Behind Hanuman Arch, Sarjapur Road, Bengaluru, Karnataka 560035<br />
            Phone: +91 91107 52349 &bull; Email: contact@svpg.in
          </div>
        </div>
      </body>
      </html>
    `;

    // Prepare attachments if PDF base64 is provided
    const attachments = [];
    if (pdfBase64) {
      // Strip any data URI prefix if present (e.g. data:application/pdf;base64,)
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
      console.error('Resend send error:', error);
      return res.status(400).json({ success: false, message: error.message || 'Failed to send email' });
    }

    return res.status(200).json({
      success: true,
      message: `Receipt sent successfully to ${to}`,
      id: data?.id
    });
  } catch (err) {
    console.error('Server error in /api/send-receipt:', err);
    return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
  }
}

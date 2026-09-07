import React, { useState } from 'react';
import { useAdmin } from './AdminContext';
import { pgLogo } from '../logoData';
import html2pdf from 'html2pdf.js';

export default function RentView() {
  const { 
    transactions, 
    rooms, 
    tenants, 
    recordPayment, 
    updateRentStatus 
  } = useAdmin();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [breakdownView, setBreakdownView] = useState('room'); // 'room' or 'person'
  const [selectedPerson, setSelectedPerson] = useState(null); // tenant object for person ledger modal
  const [personSearchTerm, setPersonSearchTerm] = useState('');
  const [personStatusFilter, setPersonStatusFilter] = useState('All');
  const [receiptTx, setReceiptTx] = useState(null); // transaction object for PDF receipt preview & export
  const [bgReceiptTx, setBgReceiptTx] = useState(null); // background transaction object for silent PDF generation without opening modal
  const [sendingEmailId, setSendingEmailId] = useState(null); // tracking active Resend email sending state
  
  // Payment Modal controls
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [activeTx, setActiveTx] = useState(null);
  
  // Form fields
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [transactionId, setTransactionId] = useState('');
  const [paymentRemarks, setPaymentRemarks] = useState('');

  // WhatsApp Rent Reminder Generator
  const sendWhatsAppReminder = (tenant, tx) => {
    const cleanPhone = tenant.phone ? tenant.phone.replace(/[^0-9]/g, '') : '';
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    
    const amountStr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(tx ? tx.amount : tenant.monthlyRent);
    const dueDateStr = tx ? tx.dueDate : 'July 2026';
    
    const message = `Hello ${tenant.name}! 👋\nThis is a friendly rent reminder from Sri Venkateswara Gents PG.\n\n*Billing Details:*\n• Room: Room ${tenant.roomNumber} (Bed ${tenant.bedNumber})\n• Amount Due: ${amountStr}\n• Billing Cycle: ${dueDateStr}\n\nPlease clear the rent at your earliest convenience via GPay/PhonePe/Paytm or Cash to the PG Manager.\n\nThank you! 🙏`;
    
    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // WhatsApp Rent Receipt Generator
  const sendWhatsAppReceipt = (tenant, tx) => {
    const cleanPhone = tenant.phone ? tenant.phone.replace(/[^0-9]/g, '') : '';
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    
    const amountStr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(tx.amount);
    
    const message = `Hello ${tenant.name}! ✅\nThank you for your rent payment to Sri Venkateswara Gents PG!\n\n*Payment Receipt:*\n• Room: Room ${tenant.roomNumber} (Bed ${tenant.bedNumber})\n• Paid Amount: ${amountStr}\n• Payment Date: ${tx.paymentDate}\n• Mode: ${tx.paymentMode}\n• TXID: ${tx.transactionId || 'CASH'}\n\nYour rent for ${tx.dueDate} has been successfully cleared. Have a great stay! 🏠`;
    
    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // 1. Calculate General Month Revenue (July 2026)
  const currentMonthStr = '2026-07';
  const currentMonthTx = transactions.filter(tx => tx.dueDate.startsWith(currentMonthStr));
  
  let expectedRevenue = 0;
  let collectedRevenue = 0;
  let pendingRevenue = 0;

  currentMonthTx.forEach(tx => {
    expectedRevenue += tx.amount;
    if (tx.status === 'Paid') {
      collectedRevenue += tx.amount;
    } else {
      pendingRevenue += tx.amount;
    }
  });

  // Open Record Payment Modal
  const openRecordPayment = (tx) => {
    setActiveTx(tx);
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentMode('UPI');
    setTransactionId('');
    setPaymentRemarks('');
    setShowPaymentModal(true);
  };

  // Submit Payment Record
  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    if (!activeTx) return;

    recordPayment(activeTx.id, {
      paymentDate,
      paymentMode,
      transactionId,
      remarks: paymentRemarks
    });

    setShowPaymentModal(false);
    setActiveTx(null);
  };

  // Reset status to Pending/Late
  const handleResetStatus = (txId, status) => {
    if (window.confirm(`Are you sure you want to change this payment status to ${status}?`)) {
      updateRentStatus(txId, status);
    }
  };

  // Helpers
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Convert numbers to Words in Indian Rupees
  const numberToWordsINR = (num) => {
    if (!num || isNaN(num)) return 'Rupees Zero Only';
    const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const inWords = (n) => {
      if (n < 20) return a[n];
      if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : '');
      if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + inWords(n % 100) : '');
      if (n < 100000) return inWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + inWords(n % 1000) : '');
      if (n < 10000000) return inWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + inWords(n % 100000) : '');
      return inWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + inWords(n % 10000000) : '');
    };
    return 'Rupees ' + inWords(Math.floor(num)) + ' Only';
  };

  // Calculate rental period range (e.g. 01 Jul 2026 to 31 Jul 2026)
  const formatRentalPeriod = (dateStr) => {
    if (!dateStr) return 'Current Month';
    try {
      const d = new Date(dateStr);
      const year = d.getFullYear();
      const month = d.getMonth();
      const monthName = d.toLocaleString('en-IN', { month: 'short' });
      const lastDay = new Date(year, month + 1, 0).getDate();
      return `01 ${monthName} ${year} to ${lastDay} ${monthName} ${year}`;
    } catch (e) {
      return dateStr;
    }
  };

  // Format date to DD / MM / YYYY
  const formatDisplayDate = (dStr) => {
    if (!dStr) return '20 / 07 / 2026';
    try {
      const parts = dStr.split('-');
      if (parts.length === 3) return `${parts[2]} / ${parts[1]} / ${parts[0]}`;
      const d = new Date(dStr);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day} / ${month} / ${year}`;
    } catch {
      return dStr;
    }
  };

  // Format month to MONTH YYYY
  const formatBillingMonth = (dStr) => {
    if (!dStr) return 'JULY 2026';
    try {
      const d = new Date(dStr);
      return d.toLocaleString('en-IN', { month: 'long', year: 'numeric' }).toUpperCase();
    } catch {
      return 'JULY 2026';
    }
  };

  // Helper to generate & download actual vector PDF file directly
  const handleDownloadPDF = () => {
    const element = document.getElementById('receipt-printable-doc');
    if (!element) return;

    // Reset scroll position to top so Header is ALWAYS captured and NEVER missing
    const savedScrollTop = element.scrollTop;
    element.scrollTop = 0;

    const rawNum = receiptTx ? receiptTx.id.replace(/[^0-9]/g, '') : '000001';
    const receiptNo = `PG-${rawNum ? rawNum.padStart(6, '0') : '000001'}`;
    const fileName = `Payment_Receipt_${receiptNo}_${receiptTx ? receiptTx.tenantName.replace(/\s+/g, '_') : 'Resident'}.pdf`;

    const opt = {
      margin:       [3, 3, 3, 3],
      filename:     fileName,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { 
        scale: 2, 
        useCORS: true, 
        letterRendering: true,
        backgroundColor: '#ffffff',
        scrollY: 0,
        scrollX: 0
      },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak:    { mode: 'avoid-all' }
    };

    html2pdf().set(opt).from(element).save().then(() => {
      element.scrollTop = savedScrollTop;
    }).catch(() => {
      element.scrollTop = savedScrollTop;
    });
  };

  // Render Official Receipt Document JSX (Using the custom Blue & Navy template requested by user with PG Logo)
  const renderReceiptDocument = (tx, targetTenant, elementId = 'receipt-printable-doc') => {
    if (!tx) return null;
    const currentTenant = targetTenant || tenants.find(t => t.id === tx.tenantId);

    const rawNum = tx.id ? tx.id.replace(/[^0-9]/g, '') : '000001';
    const receiptNo = `PG-${rawNum ? rawNum.padStart(6, '0') : '000001'}`;
    const receiptDate = tx.paymentDate ? formatDisplayDate(tx.paymentDate) : '20 / 07 / 2026';
    const billingMonth = formatBillingMonth(tx.dueDate);
    const checkinDate = currentTenant?.joiningDate ? formatDisplayDate(currentTenant.joiningDate) : '01 / 07 / 2026';
    const cleanWords = numberToWordsINR(tx.amount).replace(/^Rupees\s+/i, '').replace(/\s+Only$/i, '');

    return (
      <div 
        id={elementId} 
        className="receipt print-ready-view" 
        style={{ 
          maxWidth: '640px', 
          width: '100%',
          margin: '0 auto', 
          background: '#ffffff', 
          borderRadius: '10px', 
          overflow: 'hidden', 
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          fontFamily: "'Segoe UI', Arial, sans-serif",
          color: '#1c2333',
          position: 'relative',
          padding: 0,
          boxSizing: 'border-box'
        }}
      >
        <style dangerouslySetInnerHTML={{ __html: `
          #${elementId} {
            --navy: #0f1f3d;
            --blue: #2b5fd9;
            --light-blue-bg: #eef2fb;
            --border: #e2e6ee;
            --text-dark: #1c2333;
            --text-muted: #6b7280;
            box-sizing: border-box;
          }
          #${elementId} * {
            box-sizing: border-box;
          }
          #${elementId} .top-bar {
            height: 6px;
            background: linear-gradient(90deg, #2b5fd9, #0f1f3d);
          }
          #${elementId} .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding: 28px 32px 20px;
          }
          #${elementId} .header-left {
            display: flex;
            gap: 14px;
            align-items: flex-start;
          }
          #${elementId} .logo-box {
            width: 60px;
            height: 60px;
            border: 2px solid #2b5fd9;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            overflow: hidden;
            background: #ffffff;
          }
          #${elementId} .pg-name {
            font-size: 22px;
            font-weight: 800;
            color: #0f1f3d;
            margin: 0 0 4px;
            letter-spacing: 0.3px;
            line-height: 1.2;
          }
          #${elementId} .pg-sub {
            font-size: 12.5px;
            color: #6b7280;
            margin: 0 0 2px;
            line-height: 1.4;
          }
          #${elementId} .header-right {
            text-align: right;
          }
          #${elementId} .receipt-label {
            color: #2b5fd9;
            font-weight: 700;
            font-size: 13px;
            letter-spacing: 0.5px;
          }
          #${elementId} .receipt-no-label {
            font-size: 11px;
            color: #6b7280;
            margin-top: 10px;
          }
          #${elementId} .receipt-no {
            font-weight: 700;
            color: #0f1f3d;
            font-size: 14px;
          }
          #${elementId} .meta-strip {
            display: flex;
            justify-content: space-between;
            background: #eef2fb;
            margin: 0 32px;
            border-radius: 8px;
            padding: 14px 20px;
          }
          #${elementId} .meta-item {
            flex: 1;
          }
          #${elementId} .meta-label {
            font-size: 11px;
            color: #6b7280;
            margin-bottom: 4px;
          }
          #${elementId} .meta-value {
            font-size: 13px;
            font-weight: 700;
            color: #0f1f3d;
          }
          #${elementId} .section {
            padding: 24px 32px 0;
          }
          #${elementId} .section-title {
            font-size: 12.5px;
            font-weight: 800;
            letter-spacing: 0.5px;
            color: #0f1f3d;
            margin-bottom: 12px;
          }
          #${elementId} .tenant-box {
            border: 1px solid #e2e6ee;
            border-radius: 8px;
            padding: 18px 24px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            row-gap: 16px;
            column-gap: 24px;
          }
          #${elementId} .field-label {
            font-size: 10.5px;
            color: #6b7280;
            margin-bottom: 4px;
          }
          #${elementId} .field-value {
            font-size: 13.5px;
            font-weight: 600;
            color: #1c2333;
          }
          #${elementId} table.payment {
            width: 100%;
            border-collapse: collapse;
            margin-top: 4px;
            font-size: 13px;
          }
          #${elementId} table.payment thead tr {
            background: #0f1f3d;
            color: #ffffff;
          }
          #${elementId} table.payment th {
            text-align: left;
            padding: 10px 16px;
            font-weight: 600;
            font-size: 12px;
          }
          #${elementId} table.payment th.amt, #${elementId} table.payment td.amt {
            text-align: right;
          }
          #${elementId} table.payment th.status, #${elementId} table.payment td.status {
            text-align: right;
          }
          #${elementId} table.payment td {
            padding: 12px 16px;
            border-bottom: 1px solid #e2e6ee;
          }
          #${elementId} .status-paid {
            color: #2b5fd9;
            font-weight: 700;
            font-size: 11.5px;
            letter-spacing: 0.3px;
          }
          #${elementId} .total-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #eef2fb;
            margin: 20px 32px 0;
            padding: 14px 20px;
            border-radius: 6px;
            font-weight: 700;
          }
          #${elementId} .total-label {
            font-size: 12.5px;
            color: #0f1f3d;
            letter-spacing: 0.3px;
          }
          #${elementId} .total-amount {
            font-size: 18px;
            color: #0f1f3d;
            font-weight: 800;
          }
          #${elementId} .words-box {
            background: #eef2fb;
            border-radius: 6px;
            padding: 14px 20px;
            font-size: 13px;
            color: #1c2333;
          }
          #${elementId} .words-box .line {
            display: inline-block;
            border-bottom: 1px solid #aab3c5;
            min-width: 260px;
            padding: 0 4px;
            font-weight: 700;
            color: #0f1f3d;
          }
          #${elementId} .notes {
            font-size: 12px;
            color: #6b7280;
            line-height: 1.5;
            margin: 0;
          }
          #${elementId} .signatures {
            display: flex;
            justify-content: space-between;
            padding: 40px 32px 0;
          }
          #${elementId} .sig {
            width: 42%;
            text-align: center;
            border-top: 1px solid #e2e6ee;
            padding-top: 8px;
            font-size: 11.5px;
            color: #6b7280;
          }
          #${elementId} .footer {
            text-align: center;
            padding: 26px 20px 30px;
            font-size: 11.5px;
            color: #6b7280;
          }
          #${elementId} .footer .thanks {
            margin-bottom: 6px;
            color: #1c2333;
            font-weight: 600;
          }
        ` }} />

        <div className="top-bar"></div>

        {/* Header */}
        <div className="header">
          <div className="header-left">
            <div className="logo-box">
              <img 
                src={pgLogo} 
                alt="PG Logo" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            </div>
            <div>
              <p className="pg-name">Sri Venkateswara Gents PG</p>
              <p className="pg-sub">Paying Guest Accommodation</p>
              <p className="pg-sub">Kodathi Gate, behind Hanuman Archi, Bangalore, Karnataka 560035</p>
            </div>
          </div>
          <div className="header-right">
            <div className="receipt-label">RENT RECEIPT</div>
            <div className="receipt-no-label">Receipt No.</div>
            <div className="receipt-no">{receiptNo}</div>
          </div>
        </div>

        {/* Meta Strip */}
        <div className="meta-strip">
          <div className="meta-item">
            <div className="meta-label">Receipt Date</div>
            <div className="meta-value">{receiptDate}</div>
          </div>
          <div className="meta-item">
            <div className="meta-label">Billing Month</div>
            <div className="meta-value">{billingMonth}</div>
          </div>
          <div className="meta-item">
            <div className="meta-label">Payment Mode</div>
            <div className="meta-value">{tx.paymentMode || 'UPI'}</div>
          </div>
        </div>

        {/* Tenant Details */}
        <div className="section">
          <div className="section-title">TENANT DETAILS</div>
          <div className="tenant-box">
            <div>
              <div className="field-label">Tenant Name</div>
              <div className="field-value">{tx.tenantName}</div>
            </div>
            <div>
              <div className="field-label">Room / Bed No.</div>
              <div className="field-value">Room {tx.roomNumber} / Bed {tx.bedNumber}</div>
            </div>
            <div>
              <div className="field-label">Phone Number</div>
              <div className="field-value">{currentTenant?.phone || '+91 91107 52349'}</div>
            </div>
            <div>
              <div className="field-label">Check-in Date</div>
              <div className="field-value">{checkinDate}</div>
            </div>
            <div>
              <div className="field-label">Rent Period</div>
              <div className="field-value">{formatRentalPeriod(tx.dueDate)}</div>
            </div>
            <div>
              <div className="field-label">Aadhaar Number</div>
              <div className="field-value">{currentTenant?.aadhaar || (currentTenant?.customerId ? `ID: ${currentTenant.customerId}` : 'XXXX XXXX 5234')}</div>
            </div>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="section">
          <div className="section-title">PAYMENT SUMMARY</div>
          <table className="payment">
            <thead>
              <tr>
                <th>Description</th>
                <th className="amt">Amount</th>
                <th className="status">Status</th>
              </tr>
            </thead>
            <tbody>
              {tx.advanceAmount && Number(tx.advanceAmount) > 0 ? (
                <tr>
                  <td>Advance</td>
                  <td className="amt">{formatCurrency(tx.advanceAmount)}</td>
                  <td className="status"><span className="status-paid">PAID</span></td>
                </tr>
              ) : null}
              <tr>
                <td>Monthly Rent</td>
                <td className="amt">{formatCurrency(tx.amount)}</td>
                <td className="status"><span className="status-paid">PAID</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Total Amount Row */}
        <div className="total-row">
          <div className="total-label">TOTAL AMOUNT RECEIVED</div>
          <div className="total-amount">{formatCurrency(tx.amount)}</div>
        </div>

        {/* Amount in Words */}
        <div className="section">
          <div className="section-title">AMOUNT IN WORDS</div>
          <div className="words-box">
            Rupees <span className="line">{cleanWords}</span> only
          </div>
        </div>

        {/* Notes */}
        <div className="section">
          <div className="section-title">NOTES</div>
          <p className="notes">This receipt acknowledges payment received for the stated rental period. Please retain this receipt for your records.</p>
          <p className="notes" style={{ marginTop: '8px', fontStyle: 'italic' }}>This is a system-generated receipt and does not require a stamp.</p>
        </div>

        {/* Signatures */}
        <div className="signatures">
          <div className="sig">Tenant Signature</div>
          <div className="sig">Authorized Signature / Stamp</div>
        </div>

        {/* Footer */}
        <div className="footer">
          <div className="thanks">Thank you for staying with us.</div>
          <div>Contact: 9441682869 &nbsp;&bull;&nbsp; Email: somulavishnu6@gmail.com</div>
        </div>
      </div>
    );
  };

  // Generate a File object from a receipt element for native Web Share API
  const generatePDFFile = async (targetElement, txObj) => {
    const element = targetElement || document.getElementById('receipt-printable-doc');
    if (!element) return null;

    const savedScrollTop = element.scrollTop;
    element.scrollTop = 0;

    const currentTx = txObj || receiptTx;
    const rawNum = currentTx ? currentTx.id.replace(/[^0-9]/g, '') : '000001';
    const receiptNo = `PG-${rawNum ? rawNum.padStart(6, '0') : '000001'}`;
    const fileName = `Payment_Receipt_${receiptNo}_${currentTx ? currentTx.tenantName.replace(/\s+/g, '_') : 'Resident'}.pdf`;

    const opt = {
      margin:       [3, 3, 3, 3],
      filename:     fileName,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { 
        scale: 2, 
        useCORS: true, 
        letterRendering: true,
        backgroundColor: '#ffffff',
        scrollY: 0,
        scrollX: 0
      },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak:    { mode: 'avoid-all' }
    };

    try {
      const pdfBlob = await html2pdf().set(opt).from(element).output('blob');
      element.scrollTop = savedScrollTop;
      return new File([pdfBlob], fileName, { type: 'application/pdf' });
    } catch (err) {
      element.scrollTop = savedScrollTop;
      return null;
    }
  };

  // Direct WhatsApp Share to Tenant Contact Number with in-memory PDF attachment (No auto-download onto disk)
  const shareWhatsAppWithPDF = async (tenant, tx) => {
    if (!tx) return;
    const cleanPhone = tenant && tenant.phone ? tenant.phone.replace(/[^0-9]/g, '') : '';
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    
    const text = `Hello ${tx.tenantName}! ✅\nThank you for your rent payment to Sri Venkateswara Gents PG!\n\n*Official Payment Receipt Details:*\n• Receipt #: REC-${tx.id.replace(/[^0-9]/g, '') || '202607'}\n• Tenant Name: ${tx.tenantName}\n• Room/Bed: Room ${tx.roomNumber} (Bed ${tx.bedNumber})\n• Paid Amount: ₹${tx.amount}\n• Payment Date: ${tx.paymentDate || '2026-07-20'}\n• Payment Mode: ${tx.paymentMode || 'UPI'}\n• Transaction ID: ${tx.transactionId || 'CASH'}\n• Billing Cycle: ${tx.dueDate}\n\nYour rent for ${tx.dueDate} has been successfully cleared. Have a great stay! 🏠`;

    // 1. Generate PDF file in memory (using visible modal element or silent off-screen element)
    let element = null;
    if (receiptTx && receiptTx.id === tx.id) {
      element = document.getElementById('receipt-printable-doc');
    } else {
      setBgReceiptTx(tx);
      await new Promise(resolve => setTimeout(resolve, 200));
      element = document.getElementById('receipt-printable-doc-bg');
    }

    const file = await generatePDFFile(element, tx);
    setBgReceiptTx(null);

    // 2. If browser supports native Web Share API with files (Mobile devices & supporting modern browsers)
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: `Payment Receipt - ${tx.tenantName}`,
          text: text
        });
        return;
      } catch (e) {
        // User cancelled share
      }
    }

    // 3. Fallback: Open WhatsApp directly to that specific tenant contact number with receipt text
    const message = encodeURIComponent(text);
    if (formattedPhone) {
      window.open(`https://wa.me/${formattedPhone}?text=${message}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${message}`, '_blank');
    }
  };

  // Generate Base64 string from receipt element for Resend API attachments
  const generatePDFBase64 = async (targetElement) => {
    const element = targetElement || document.getElementById('receipt-printable-doc');
    if (!element) return null;

    const savedScrollTop = element.scrollTop;
    element.scrollTop = 0;

    const opt = {
      margin:       [3, 3, 3, 3],
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { 
        scale: 2, 
        useCORS: true, 
        letterRendering: true,
        backgroundColor: '#ffffff',
        scrollY: 0,
        scrollX: 0
      },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak:    { mode: 'avoid-all' }
    };

    try {
      const dataUri = await html2pdf().set(opt).from(element).outputPdf('datauristring');
      element.scrollTop = savedScrollTop;
      return dataUri;
    } catch (err) {
      element.scrollTop = savedScrollTop;
      return null;
    }
  };

  // Direct Email Share via Resend with PDF Attachment (Silent background execution, NO popup modal page)
  const shareEmailWithPDF = async (tenant, tx) => {
    if (!tx) return;
    let mailEmail = (tenant && tenant.email ? tenant.email : '').trim();
    if (!mailEmail) {
      const inputEmail = window.prompt(
        `No email address is registered for ${tx.tenantName}.\n\nPlease enter the customer's email address to send the receipt:`
      );
      if (!inputEmail || !inputEmail.trim()) return;
      mailEmail = inputEmail.trim();
    }

    const rawNum = tx.id ? tx.id.replace(/[^0-9]/g, '') : '000001';
    const receiptNum = `PG-${rawNum ? rawNum.padStart(6, '0') : '000001'}`;

    setSendingEmailId(tx.id);

    try {
      // If the receipt preview modal is already open for this transaction, use that DOM element.
      // Otherwise, mount the off-screen background element so NO modal opens on screen!
      let element = null;
      if (receiptTx && receiptTx.id === tx.id) {
        element = document.getElementById('receipt-printable-doc');
      } else {
        setBgReceiptTx(tx);
        await new Promise(resolve => setTimeout(resolve, 200));
        element = document.getElementById('receipt-printable-doc-bg');
      }

      // 1. Generate PDF Base64 string
      const pdfBase64 = await generatePDFBase64(element);

      // Clean up off-screen element
      setBgReceiptTx(null);

      // 2. Call /api/send-receipt (powered by Resend)
      const res = await fetch('/api/send-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: mailEmail,
          tenantName: tx.tenantName,
          receiptNumber: receiptNum,
          amount: tx.amount,
          paymentDate: tx.paymentDate || new Date().toISOString().split('T')[0],
          dueDate: tx.dueDate,
          roomNumber: tx.roomNumber,
          bedNumber: tx.bedNumber,
          paymentMode: tx.paymentMode || 'UPI',
          transactionId: tx.transactionId || 'CASH',
          pdfBase64
        })
      });

      const data = await res.json();

      if (data.success) {
        alert(`✅ Receipt with PDF attachment has been sent to ${mailEmail} via Resend!`);
      } else {
        // If Resend API key is not configured or failed, offer helpful guidance and Gmail draft fallback
        const useFallback = window.confirm(
          `Resend Notice: ${data.message}\n\nWould you like to auto-download the PDF and open a draft in Gmail instead?`
        );
        if (useFallback) {
          handleDownloadPDF();
          const subject = `Official Payment Receipt ${receiptNum} - Sri Venkateswara Gents PG`;
          const bodyText = `Dear ${tx.tenantName},\n\nThank you for your rent payment to Sri Venkateswara Gents PG!\n\nOfficial Payment Receipt Details:\n• Receipt #: ${receiptNum}\n• Room/Bed: Room ${tx.roomNumber} - Bed ${tx.bedNumber}\n• Amount: ₹${tx.amount.toLocaleString('en-IN')}\n• Payment Date: ${tx.paymentDate || '2026-07-20'}\n\nBest Regards,\nSri Venkateswara Gents PG`;
          const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(mailEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
          window.open(gmailUrl, '_blank');
        }
      }
    } catch (err) {
      console.error('Error sending receipt via Resend:', err);
      alert(`Could not send email: ${err.message}.`);
      setBgReceiptTx(null);
    } finally {
      setSendingEmailId(null);
    }
  };

  // 2. Filter transactions list (supports Customer ID search)
  const filteredTransactions = transactions.filter(tx => {
    const tenant = tenants.find(t => t.id === tx.tenantId);
    const custIdStr = tenant ? (tenant.customerId || tenant.id) : (tx.tenantId || '');
    const matchesSearch = custIdStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          tx.tenantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          tx.roomNumber.includes(searchTerm) ||
                          (tx.transactionId && tx.transactionId.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'All' ? true : tx.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // 3. Filter person list for Person-to-Person view (supports Customer ID search)
  const filteredPersonList = tenants.filter(tenant => {
    const personTxList = transactions.filter(t => t.tenantId === tenant.id);
    const currentTx = personTxList.find(t => t.dueDate.startsWith(currentMonthStr));
    const currentStatus = currentTx ? currentTx.status : 'Pending';

    const custIdStr = tenant.customerId || tenant.id || '';
    const matchesSearch = custIdStr.toLowerCase().includes(personSearchTerm.toLowerCase()) ||
                          tenant.name.toLowerCase().includes(personSearchTerm.toLowerCase()) ||
                          tenant.phone.includes(personSearchTerm) ||
                          tenant.roomNumber.includes(personSearchTerm);

    const matchesStatus = personStatusFilter === 'All' ? true : currentStatus === personStatusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="admin-view-container">
      <div className="view-header">
        <div>
          <h1>Rent Management</h1>
          <p>Track bills, record invoices, review ledger accounts, and audit rooms.</p>
        </div>
      </div>

      {/* Revenue Dashboard */}
      <div className="revenue-metrics-row" style={{ marginBottom: '32px' }}>
        <div className="rev-card exp">
          <span className="rev-label">Expected Revenue</span>
          <h2 className="rev-value">{formatCurrency(expectedRevenue)}</h2>
        </div>
        <div className="rev-card rec">
          <span className="rev-label">Collected Revenue</span>
          <h2 className="rev-value">{formatCurrency(collectedRevenue)}</h2>
        </div>
        <div className="rev-card pend">
          <span className="rev-label">Pending Revenue</span>
          <h2 className="rev-value">{formatCurrency(pendingRevenue)}</h2>
        </div>
      </div>

      {/* View Mode Selector Tabs */}
      <div className="reports-selector-tabs glass-card" style={{ marginBottom: '24px' }}>
        <button 
          className={`report-tab-btn ${breakdownView === 'room' ? 'active' : ''}`}
          onClick={() => setBreakdownView('room')}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.2" fill="none" style={{ marginRight: '6px' }}>
            <rect x="3" y="3" width="7" height="9" />
            <rect x="14" y="3" width="7" height="5" />
            <rect x="14" y="12" width="7" height="9" />
            <rect x="3" y="16" width="7" height="5" />
          </svg>
          Room-wise Rent Breakdown
        </button>
        <button 
          className={`report-tab-btn ${breakdownView === 'person' ? 'active' : ''}`}
          onClick={() => setBreakdownView('person')}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.2" fill="none" style={{ marginRight: '6px' }}>
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          Person-to-Person Ledger ({tenants.length} Residents)
        </button>
      </div>

      {/* Room-wise Revenue Audit Table */}
      {breakdownView === 'room' && (
        <div className="table-responsive-wrapper glass-card" style={{ marginBottom: '40px' }}>
          <div className="table-title-area">
            <h3>Room-wise Rent Breakdown</h3>
            <p>Current billing cycle expected vs collected revenue audits per room.</p>
          </div>
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Room Details</th>
                <th>Room Type</th>
                <th>Total Beds</th>
                <th>Expected Rent</th>
                <th>Collected Rent</th>
                <th>Pending Rent</th>
                <th>Performance</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map(room => {
                let roomExpected = 0;
                let roomCollected = 0;
                let roomPending = 0;

                room.beds.forEach(bed => {
                  if (bed.status === 'Occupied') {
                    const tenant = tenants.find(t => t.id === bed.tenantId);
                    if (tenant) {
                      // Check current month transaction for rent
                      const tx = transactions.find(t => t.tenantId === tenant.id && t.dueDate.startsWith(currentMonthStr));
                      if (tx) {
                        roomExpected += tx.amount;
                        if (tx.status === 'Paid') {
                          roomCollected += tx.amount;
                        } else {
                          roomPending += tx.amount;
                        }
                      } else {
                        roomExpected += tenant.monthlyRent;
                        roomPending += tenant.monthlyRent;
                      }
                    }
                  }
                });

                const collectRate = roomExpected > 0 ? Math.round((roomCollected / roomExpected) * 100) : 100;

                return (
                  <tr key={room.id}>
                    <td data-label="Room Details"><strong>Room {room.number}</strong></td>
                    <td data-label="Room Type">{room.type}</td>
                    <td data-label="Total Beds">{room.beds.length} Bed(s)</td>
                    <td data-label="Expected"><strong>{formatCurrency(roomExpected)}</strong></td>
                    <td data-label="Collected" style={{ color: '#27ae60' }}>{formatCurrency(roomCollected)}</td>
                    <td data-label="Pending" style={{ color: roomPending > 0 ? '#e67e22' : 'inherit' }}>{formatCurrency(roomPending)}</td>
                    <td data-label="Performance">
                      <div className="progress-bar-cell">
                        <span className="progress-pct">{collectRate}%</span>
                        <div className="progress-track">
                          <div className="progress-fill" style={{ width: `${collectRate}%`, backgroundColor: collectRate === 100 ? '#27ae60' : 'var(--primary)' }}></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Person-to-Person Rent Audit Table */}
      {breakdownView === 'person' && (
        <div style={{ marginBottom: '40px' }}>
          {/* Person Breakdown Filter Controls */}
          <div className="filter-search-container glass-card" style={{ marginBottom: '20px' }}>
            <div className="search-bar-input">
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search resident by name, phone, room number..."
                value={personSearchTerm}
                onChange={(e) => setPersonSearchTerm(e.target.value)}
              />
            </div>
            <div className="filter-selects-row">
              <div className="filter-group">
                <label>July Status</label>
                <select value={personStatusFilter} onChange={(e) => setPersonStatusFilter(e.target.value)}>
                  <option value="All">All Residents ({tenants.length})</option>
                  <option value="Paid">Paid Only</option>
                  <option value="Pending">Pending Rent Only</option>
                  <option value="Late">Late / Overdue Only</option>
                </select>
              </div>
            </div>
          </div>

          <div className="table-responsive-wrapper glass-card">
            <div className="table-title-area" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3>Person-to-Person Payment Breakdown</h3>
                <p>Individual tenant payment status, lifetime collections, and direct reminder actions.</p>
              </div>
              <span className="scroll-hint-badge" style={{ fontSize: '12px', padding: '6px 12px' }}>
                Showing {filteredPersonList.length} of {tenants.length} Residents
              </span>
            </div>

            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Customer ID</th>
                  <th>Resident / Person</th>
                  <th>Room & Bed</th>
                  <th>Monthly Rate</th>
                  <th>July Status</th>
                  <th>Last Payment</th>
                  <th>Lifetime Paid</th>
                  <th className="actions-header" style={{ textAlign: 'right' }}>Actions & Statement</th>
                </tr>
              </thead>
              <tbody>
                {filteredPersonList.length > 0 ? (
                  filteredPersonList.map(tenant => {
                    const personTxList = transactions.filter(t => t.tenantId === tenant.id);
                    const currentTx = personTxList.find(t => t.dueDate.startsWith(currentMonthStr));
                    const totalPaid = personTxList.filter(t => t.status === 'Paid').reduce((sum, t) => sum + t.amount, 0);
                    
                    const paidTxList = personTxList.filter(t => t.status === 'Paid').sort((a,b) => new Date(b.paymentDate || b.dueDate) - new Date(a.paymentDate || a.dueDate));
                    const lastPayment = paidTxList.length > 0 ? paidTxList[0] : null;

                    const initials = tenant.name ? tenant.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'TN';
                    const isPaid = currentTx && currentTx.status === 'Paid';

                    return (
                      <tr key={tenant.id}>
                        <td data-label="Customer ID">
                          <span style={{ display: 'inline-block', padding: '3px 8px', background: 'rgba(37, 99, 235, 0.1)', color: '#2563EB', border: '1px solid rgba(37, 99, 235, 0.2)', borderRadius: '6px', fontSize: '11px', fontWeight: '800', letterSpacing: '0.4px', fontFamily: 'monospace' }}>
                            {tenant.customerId || tenant.id}
                          </span>
                        </td>
                        <td data-label="Resident">
                          <div className="person-row-profile" onClick={() => setSelectedPerson(tenant)} title="Click to view full person ledger statement">
                            <div className="person-avatar-circle">
                              {initials}
                            </div>
                            <div className="person-name-group">
                              <span className="person-name-title">{tenant.name}</span>
                              <span className="person-phone-sub">📞 {tenant.phone}</span>
                            </div>
                          </div>
                        </td>
                        <td data-label="Room & Bed">
                          <strong>Room {tenant.roomNumber}</strong> &bull; Bed {tenant.bedNumber}
                        </td>
                        <td data-label="Monthly Rate">
                          <strong>{formatCurrency(tenant.monthlyRent)}</strong>
                        </td>
                        <td data-label="July Status">
                          {currentTx ? (
                            currentTx.status === 'Paid' ? (
                              <span className="status-badge green">Paid</span>
                            ) : currentTx.status === 'Late' ? (
                              <span className="status-badge red">Late</span>
                            ) : (
                              <span className="status-badge orange">Pending</span>
                            )
                          ) : (
                            <span className="status-badge gray">No Invoice</span>
                          )}
                        </td>
                        <td data-label="Last Payment">
                          {lastPayment ? (
                            <div>
                              <div style={{ fontSize: '12px', fontWeight: '600' }}>{lastPayment.paymentDate}</div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{lastPayment.paymentMode} ({lastPayment.transactionId})</div>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>No record</span>
                          )}
                        </td>
                        <td data-label="Lifetime Paid">
                          <strong style={{ color: '#27ae60' }}>{formatCurrency(totalPaid)}</strong>
                        </td>
                        <td data-label="Actions" className="actions-cell">
                          <div className="person-actions-flex">
                            {!isPaid && currentTx && (
                              <button 
                                className="primary table-action-btn" 
                                onClick={() => openRecordPayment(currentTx)}
                                style={{ fontSize: '12px', padding: '6px 12px' }}
                              >
                                Collect Rent
                              </button>
                            )}

                            {!isPaid && (
                              <button
                                className="whatsapp-reminder-btn"
                                onClick={() => sendWhatsAppReminder(tenant, currentTx)}
                                title="Send WhatsApp Rent Reminder"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  background: '#25D366',
                                  color: '#fff',
                                  border: 'none',
                                  padding: '6px 10px',
                                  borderRadius: '10px',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  cursor: 'pointer'
                                }}
                              >
                                📲 Reminder
                              </button>
                            )}

                            {isPaid && currentTx && (
                              <>
                                <button
                                  className="secondary table-action-btn"
                                  onClick={() => setReceiptTx(currentTx)}
                                  title="View & Export Official PDF Receipt"
                                  style={{ fontSize: '11px', padding: '6px 10px', background: 'rgba(var(--primary-rgb), 0.1)', color: 'var(--primary)', border: '1px solid rgba(var(--primary-rgb), 0.2)' }}
                                >
                                  📄 PDF
                                </button>
                                <button
                                  className="secondary table-action-btn"
                                  onClick={() => sendWhatsAppReceipt(tenant, currentTx)}
                                  title="Share Rent Receipt via WhatsApp"
                                  style={{ fontSize: '11px', padding: '6px 10px', background: 'rgba(37, 211, 102, 0.1)', color: '#27ae60', border: '1px solid rgba(37, 211, 102, 0.2)' }}
                                >
                                  📲 WhatsApp
                                </button>
                                <button
                                  className="secondary table-action-btn"
                                  onClick={() => shareEmailWithPDF(tenant, currentTx)}
                                  title={`Email Rent Receipt to ${tenant.email || 'customer'}`}
                                  style={{ fontSize: '11px', padding: '6px 10px', background: 'rgba(37, 99, 235, 0.1)', color: '#2563EB', border: '1px solid rgba(37, 99, 235, 0.2)' }}
                                >
                                  ✉️ Email
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="empty-table-placeholder">
                      No residents match your search or status filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}



      {/* Transaction List filter */}
      <div className="filter-search-container glass-card">
        <div className="search-bar-input">
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search transactions by tenant, room, TXID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-selects-row">
          <div className="filter-group">
            <label>Payment Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="All">All Transactions</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Late">Late</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ledger Registry Table */}
      <div className="table-responsive-wrapper glass-card">
        <div className="table-title-area">
          <h3>Rent Receipts & Transactions Ledger</h3>
        </div>
        <table className="admin-data-table">
          <thead>
            <tr>
              <th>Customer ID</th>
              <th>Tenant / Bed</th>
              <th>Amount</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Payment Date</th>
              <th>Mode</th>
              <th>Transaction ID</th>
              <th className="actions-header">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map(tx => {
                const tenant = tenants.find(t => t.id === tx.tenantId);
                const displayCustId = tenant ? (tenant.customerId || tenant.id) : (tx.tenantId || 'N/A');
                return (
                  <tr key={tx.id}>
                    <td data-label="Customer ID">
                      <span style={{ display: 'inline-block', padding: '3px 8px', background: 'rgba(37, 99, 235, 0.1)', color: '#2563EB', border: '1px solid rgba(37, 99, 235, 0.2)', borderRadius: '6px', fontSize: '11px', fontWeight: '800', letterSpacing: '0.4px', fontFamily: 'monospace' }}>
                        {displayCustId}
                      </span>
                    </td>
                    <td data-label="Tenant">
                      <div className="tenant-meta-td">
                        <span className="tenant-name-span">{tx.tenantName}</span>
                        <span className="tenant-sub-remarks">Room {tx.roomNumber} &bull; Bed {tx.bedNumber}</span>
                      </div>
                    </td>
                  <td data-label="Amount"><strong>{formatCurrency(tx.amount)}</strong></td>
                  <td data-label="Due Date" className="monospace-text">{tx.dueDate}</td>
                  <td data-label="Status">
                    {tx.status === 'Paid' ? (
                      <span className="status-badge green">Paid</span>
                    ) : tx.status === 'Late' ? (
                      <span className="status-badge red">Late</span>
                    ) : (
                      <span className="status-badge orange">Pending</span>
                    )}
                  </td>
                  <td data-label="Payment Date" className="monospace-text">{tx.paymentDate || '-'}</td>
                  <td data-label="Mode">{tx.paymentMode || '-'}</td>
                  <td data-label="Transaction ID" className="monospace-text font-small">{tx.transactionId || '-'}</td>
                  <td data-label="Actions" className="actions-cell">
                    {tx.status !== 'Paid' ? (
                      <button className="primary table-action-btn" onClick={() => openRecordPayment(tx)}>
                        Record Payment
                      </button>
                    ) : (
                      <div className="rent-actions-group" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <button className="secondary table-action-btn" onClick={() => setReceiptTx(tx)} title="View & Export PDF Receipt" style={{ fontSize: '11px', padding: '4px 8px', background: 'rgba(var(--primary-rgb), 0.08)', color: 'var(--primary)', border: '1px solid rgba(var(--primary-rgb), 0.15)' }}>
                          📄 PDF
                        </button>
                        <button 
                          className="secondary table-action-btn" 
                          disabled={sendingEmailId === tx.id}
                          onClick={() => {
                            const tenant = tenants.find(t => t.id === tx.tenantId);
                            shareEmailWithPDF(tenant, tx);
                          }} 
                          title="Send Receipt via Email" 
                          style={{ fontSize: '11px', padding: '4px 8px', background: 'rgba(37, 99, 235, 0.08)', color: '#2563EB', border: '1px solid rgba(37, 99, 235, 0.15)', opacity: sendingEmailId === tx.id ? 0.6 : 1, cursor: sendingEmailId === tx.id ? 'wait' : 'pointer' }}
                        >
                          {sendingEmailId === tx.id ? '⏳ Sending...' : '✉️ Email'}
                        </button>
                        <button className="icon-btn-edit" onClick={() => openRecordPayment(tx)} title="Edit Details">
                          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button className="icon-btn-delete" onClick={() => handleResetStatus(tx.id, 'Pending')} title="Reset Status to Pending">
                          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none">
                            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })
          ) : (
              <tr>
                <td colSpan="8" className="empty-table-placeholder">
                  No rent transactions match your search filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Record Payment Modal */}
      {showPaymentModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card animate-fade-in">
            <div className="modal-header">
              <h2>Record Payment for {activeTx?.tenantName}</h2>
              <button className="close-modal-btn" onClick={() => setShowPaymentModal(false)}>&times;</button>
            </div>
            <form onSubmit={handlePaymentSubmit} className="modal-form">
              <div className="form-group">
                <input
                  type="date"
                  placeholder=" "
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  required
                />
                <label>Payment Date</label>
              </div>

              <div className="form-group-select">
                <label>Payment Mode</label>
                <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} required>
                  <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                  <option value="Cash">Cash</option>
                  <option value="Net Banking">Net Banking</option>
                  <option value="Credit / Debit Card">Credit / Debit Card</option>
                </select>
              </div>

              <div className="form-group">
                <input
                  type="text"
                  placeholder=" "
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  required={paymentMode !== 'Cash'}
                />
                <label>Transaction ID / Reference Number</label>
              </div>

              <div className="form-group">
                <input
                  type="text"
                  placeholder=" "
                  value={paymentRemarks}
                  onChange={(e) => setPaymentRemarks(e.target.value)}
                />
                <label>Remarks / Payment Notes</label>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowPaymentModal(false)}>Cancel</button>
                <button type="submit" className="primary">Record Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Person-to-Person Statement Modal */}
      {selectedPerson && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card animate-fade-in" style={{ maxWidth: '750px', width: '92%' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(var(--primary-rgb), 0.1)', color: 'var(--primary)', display: 'grid', placeItems: 'center', fontWeight: '700', fontSize: '15px' }}>
                  {selectedPerson.name ? selectedPerson.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'TN'}
                </div>
                <div>
                  <h2 style={{ fontSize: '18px', margin: 0 }}>Person Statement: {selectedPerson.name}</h2>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                    Room {selectedPerson.roomNumber} &bull; Bed {selectedPerson.bedNumber} &bull; 📞 {selectedPerson.phone}
                  </p>
                </div>
              </div>
              <button className="close-modal-btn" onClick={() => setSelectedPerson(null)}>&times;</button>
            </div>

            <div style={{ padding: '20px 24px', maxHeight: '70vh', overflowY: 'auto' }}>
              {/* Tenant Personal Info Badges */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                <div style={{ background: 'var(--bg)', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Monthly Rent</span>
                  <div style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text)', marginTop: '2px' }}>{formatCurrency(selectedPerson.monthlyRent)}</div>
                </div>
                <div style={{ background: 'var(--bg)', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Security Deposit</span>
                  <div style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text)', marginTop: '2px' }}>{formatCurrency(selectedPerson.deposit)}</div>
                </div>
                <div style={{ background: 'var(--bg)', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Joining Date</span>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text)', marginTop: '4px' }}>{selectedPerson.joiningDate}</div>
                </div>
              </div>

              {/* Emergency & Notes */}
              <div style={{ background: 'rgba(var(--primary-rgb), 0.04)', padding: '12px 16px', borderRadius: '12px', marginBottom: '20px', fontSize: '12.5px', border: '1px solid rgba(var(--primary-rgb), 0.08)' }}>
                <div><strong>Emergency Contact:</strong> {selectedPerson.emergencyContact || 'N/A'}</div>
                {selectedPerson.remarks && <div style={{ marginTop: '4px' }}><strong>Tenant Notes:</strong> {selectedPerson.remarks}</div>}
              </div>

              {/* Historical Receipts Table for this Person */}
              <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px' }}>Payment Transactions Trajectory</h4>
              <table className="admin-data-table" style={{ fontSize: '12px' }}>
                <thead>
                  <tr>
                    <th>Due Date</th>
                    <th>Invoiced Amount</th>
                    <th>Status</th>
                    <th>Paid Date</th>
                    <th>Mode</th>
                    <th>TXID</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.filter(t => t.tenantId === selectedPerson.id).map(tx => (
                    <tr key={tx.id}>
                      <td data-label="Due Date"><strong>{tx.dueDate}</strong></td>
                      <td data-label="Invoiced"><strong>{formatCurrency(tx.amount)}</strong></td>
                      <td data-label="Status">
                        {tx.status === 'Paid' ? (
                          <span className="status-badge green">Paid</span>
                        ) : tx.status === 'Late' ? (
                          <span className="status-badge red">Late</span>
                        ) : (
                          <span className="status-badge orange">Pending</span>
                        )}
                      </td>
                      <td data-label="Paid Date">{tx.paymentDate || '-'}</td>
                      <td data-label="Mode">{tx.paymentMode || '-'}</td>
                      <td data-label="TXID" className="monospace-text">{tx.transactionId || '-'}</td>
                      <td data-label="Action">
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          {tx.status !== 'Paid' ? (
                            <>
                              <button className="primary" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={() => { setSelectedPerson(null); openRecordPayment(tx); }}>
                                Collect
                              </button>
                              <button className="whatsapp-reminder-btn" style={{ padding: '4px 8px', fontSize: '11px', background: '#25D366', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }} onClick={() => sendWhatsAppReminder(selectedPerson, tx)} title="Send WhatsApp Reminder">
                                📲
                              </button>
                            </>
                          ) : (
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button className="secondary" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => setReceiptTx(tx)} title="View & Export PDF Receipt">
                                📄 PDF
                              </button>
                              <button className="secondary" style={{ padding: '4px 8px', fontSize: '11px', color: '#27ae60', background: 'rgba(37, 211, 102, 0.1)', border: '1px solid rgba(37, 211, 102, 0.2)' }} onClick={() => sendWhatsAppReceipt(selectedPerson, tx)} title="Share Receipt on WhatsApp">
                                📲
                              </button>
                              <button className="secondary" style={{ padding: '4px 8px', fontSize: '11px', color: '#2563EB', background: 'rgba(37, 99, 235, 0.1)', border: '1px solid rgba(37, 99, 235, 0.2)' }} onClick={() => shareEmailWithPDF(selectedPerson, tx)} title="Share Receipt on Email">
                                ✉️
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="modal-actions" style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button className="btn-cancel" onClick={() => setSelectedPerson(null)}>Close Statement</button>
              <button className="secondary" onClick={() => window.print()} style={{ fontSize: '13px' }}>🖨 Print Statement</button>
            </div>
          </div>
        </div>
      )}

      {/* Off-screen background container for silent PDF generation (Emailing / WhatsApp without opening modal) */}
      {bgReceiptTx && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: '-9999px',
            width: '794px',
            background: '#ffffff',
            zIndex: -9999,
            pointerEvents: 'none'
          }}
          aria-hidden="true"
        >
          {renderReceiptDocument(bgReceiptTx, tenants.find(t => t.id === bgReceiptTx.tenantId), 'receipt-printable-doc-bg')}
        </div>
      )}

      {receiptTx && (
        <div className="admin-modal-overlay" style={{ overflowY: 'auto', padding: '20px 10px' }}>
          <div className="admin-modal-card animate-fade-in" style={{ maxWidth: '850px', width: '98%', maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: '16px', border: '1px solid var(--border)' }}>
            
            {/* Top Action Bar (No-Print) */}
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', background: 'var(--surface)', borderBottom: '1px solid var(--border)', flexWrap: 'wrap', gap: '12px', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '18px' }}>📄</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: 'var(--text)' }}>Payment Receipt Preview</h3>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>PG-{(receiptTx.id.replace(/[^0-9]/g, '') || '000001').padStart(6, '0')} &bull; {receiptTx.tenantName}</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button className="primary" onClick={handleDownloadPDF} style={{ fontSize: '13px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px', background: '#10B981', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '600' }} title="Directly Download PDF File">
                  <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" strokeWidth="2.2" fill="none">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  📥 Download PDF
                </button>
                {(() => {
                  const tenant = tenants.find(t => t.id === receiptTx.tenantId);
                  return (
                    <button className="secondary" onClick={() => shareWhatsAppWithPDF(tenant, receiptTx)} style={{ fontSize: '13px', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px', background: '#25D366', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '600' }} title="Share Receipt & PDF via WhatsApp">
                      📲 Share WhatsApp + PDF
                    </button>
                  );
                })()}
                {(() => {
                  const tenant = tenants.find(t => t.id === receiptTx.tenantId);
                  return (
                    <button 
                      className="secondary" 
                      onClick={() => shareEmailWithPDF(tenant, receiptTx)} 
                      disabled={sendingEmailId === receiptTx.id}
                      style={{ fontSize: '13px', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(37, 99, 235, 0.08)', color: '#2563EB', border: '1px solid rgba(37, 99, 235, 0.2)', borderRadius: '10px', fontWeight: '600', opacity: sendingEmailId === receiptTx.id ? 0.7 : 1, cursor: sendingEmailId === receiptTx.id ? 'wait' : 'pointer' }} 
                      title={tenant?.email ? `Email receipt directly to ${tenant.email}` : 'Enter email to send receipt'}
                    >
                      {sendingEmailId === receiptTx.id ? '⏳ Sending PDF via Resend...' : `✉️ Email Receipt ${tenant?.email ? `(${tenant.email})` : ''}`}
                    </button>
                  );
                })()}
                <button className="close-modal-btn" onClick={() => setReceiptTx(null)} style={{ fontSize: '20px', width: '36px', height: '36px', borderRadius: '10px' }}>&times;</button>
              </div>
            </div>

            {/* Printable PDF Document Container */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px 16px', background: '#f2f4f8' }}>
              {renderReceiptDocument(receiptTx, tenants.find(t => t.id === receiptTx.tenantId), 'receipt-printable-doc')}
            </div>

            {/* Bottom Actions Bar (No-Print) */}
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', background: 'var(--surface)', borderTop: '1px solid var(--border)', flexShrink: 0, flexWrap: 'wrap', gap: '10px' }}>
              <button className="btn-cancel" onClick={() => setReceiptTx(null)}>Close Preview</button>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {(() => {
                  const tenant = tenants.find(t => t.id === receiptTx.tenantId);
                  return (
                    <button className="secondary" onClick={() => shareWhatsAppWithPDF(tenant, receiptTx)} style={{ fontSize: '13px', padding: '8px 14px', background: '#25D366', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '600' }}>
                      📲 WhatsApp + PDF
                    </button>
                  );
                })()}
                {(() => {
                  const tenant = tenants.find(t => t.id === receiptTx.tenantId);
                  return (
                    <button className="secondary" onClick={() => shareEmailWithPDF(tenant, receiptTx)} style={{ fontSize: '13px', padding: '8px 14px', background: 'rgba(37, 99, 235, 0.08)', color: '#2563EB', border: '1px solid rgba(37, 99, 235, 0.2)', borderRadius: '10px', fontWeight: '600' }}>
                      ✉️ Email + PDF
                    </button>
                  );
                })()}
                <button className="primary" onClick={handleDownloadPDF} style={{ fontSize: '13px', padding: '8px 18px', background: '#10B981', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '600' }}>
                  📥 Download PDF File
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}


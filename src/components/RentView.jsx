import React, { useState } from 'react';
import { useAdmin } from './AdminContext';
import logo from '../logo.jpg';
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

  // Helper to generate & download actual vector PDF file directly
  const handleDownloadPDF = () => {
    const element = document.getElementById('receipt-printable-doc');
    if (!element) return;

    // Reset scroll position to top so Header is ALWAYS captured and NEVER missing
    const savedScrollTop = element.scrollTop;
    element.scrollTop = 0;

    const fileName = `Payment_Receipt_${receiptTx ? receiptTx.id.replace(/[^0-9]/g, '') : '202607'}_${receiptTx ? receiptTx.tenantName.replace(/\s+/g, '_') : 'Resident'}.pdf`;

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

  // Generate a File object from receipt-printable-doc for native Web Share API
  const generatePDFFile = async () => {
    const element = document.getElementById('receipt-printable-doc');
    if (!element) return null;

    const savedScrollTop = element.scrollTop;
    element.scrollTop = 0;

    const fileName = `Payment_Receipt_${receiptTx ? receiptTx.id.replace(/[^0-9]/g, '') : '202607'}_${receiptTx ? receiptTx.tenantName.replace(/\s+/g, '_') : 'Resident'}.pdf`;

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

    // 1. Generate PDF file in memory
    const file = await generatePDFFile();

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

  // Generate Base64 string from receipt-printable-doc for Resend API attachments
  const generatePDFBase64 = async () => {
    const element = document.getElementById('receipt-printable-doc');
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

  // Direct Email Share via Resend with PDF Attachment
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

    const receiptNum = `REC-${tx.id.replace(/[^0-9]/g, '') || '101'}`;

    // Ensure the printable document DOM is mounted
    if (!receiptTx || receiptTx.id !== tx.id) {
      setReceiptTx(tx);
      await new Promise(resolve => setTimeout(resolve, 250));
    }

    setSendingEmailId(tx.id);

    try {
      // 1. Generate PDF Base64 string
      const pdfBase64 = await generatePDFBase64();

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
      alert(`Could not send email: ${err.message}. Triggering manual PDF download.`);
      handleDownloadPDF();
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

      {receiptTx && (
        <div className="admin-modal-overlay" style={{ overflowY: 'auto', padding: '20px 10px' }}>
          <div className="admin-modal-card animate-fade-in" style={{ maxWidth: '850px', width: '98%', maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: '16px', border: '1px solid var(--border)' }}>
            
            {/* Top Action Bar (No-Print) */}
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', background: 'var(--surface)', borderBottom: '1px solid var(--border)', flexWrap: 'wrap', gap: '12px', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '18px' }}>📄</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: 'var(--text)' }}>Payment Receipt Preview</h3>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>REC-{receiptTx.id.replace(/[^0-9]/g, '') || '202607-101'} &bull; {receiptTx.tenantName}</p>
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

            {/* Printable PDF Document Container (Clean & Simple Layout) */}
            <div id="receipt-printable-doc" className="print-ready-view" style={{ padding: '32px 36px', background: '#ffffff', color: '#0f172a', fontFamily: "'Inter', 'Poppins', system-ui, sans-serif", position: 'relative', overflowY: 'auto', flex: 1, WebkitOverflowScrolling: 'touch' }}>
              
              {/* 1. Header Section with Logo */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '16px', borderBottom: '2px solid #E2E8F0', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <img 
                    src={logo} 
                    alt="Sri Venkateswara Gents PG Logo" 
                    style={{ 
                      width: '64px', 
                      height: '64px', 
                      borderRadius: '10px', 
                      objectFit: 'cover', 
                      objectPosition: '50% 22%', 
                      border: '1px solid #E2E8F0', 
                      boxShadow: '0 2px 6px rgba(0,0,0,0.06)' 
                    }} 
                  />
                  <div>
                    <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: '#0F172A', letterSpacing: '-0.3px' }}>SRI VENKATESWARA GENTS PG</h2>
                    <p style={{ fontSize: '11.5px', color: '#64748B', margin: '3px 0 0', lineHeight: '1.4' }}>
                      Kodathi Gate, Behind Hanuman Arch, Sarjapur Road, Bengaluru 560035<br />
                      Phone: +91 91107 52349 &bull; Email: contact@svpg.in
                    </p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h1 style={{ fontSize: '18px', fontWeight: '900', color: '#2563EB', margin: 0, letterSpacing: '0.5px' }}>RENT RECEIPT</h1>
                  <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px', fontWeight: '600' }}>
                    Receipt #: <strong style={{ color: '#0F172A' }}>REC-{receiptTx.id.replace(/[^0-9]/g, '') || '101'}</strong>
                  </div>
                  <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>
                    Date: <strong>{receiptTx.paymentDate || '2026-07-20'}</strong>
                  </div>
                  <div style={{ marginTop: '6px' }}>
                    <span style={{ display: 'inline-block', background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC', padding: '3px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: '800', letterSpacing: '0.4px' }}>
                      ✓ PAID
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Simple Details Grid (Tenant & Payment Info) */}
              {(() => {
                const tenant = tenants.find(t => t.id === receiptTx.tenantId);

                return (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                    {/* Tenant Box */}
                    <div style={{ background: '#F8FAFC', padding: '14px 16px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '12.5px' }}>
                      <div style={{ fontSize: '11px', color: '#2563EB', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                        Tenant Details
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div>
                          <span style={{ color: '#64748B' }}>Name: </span>
                          <strong style={{ color: '#0F172A', fontSize: '13.5px' }}>{receiptTx.tenantName}</strong>
                        </div>
                        <div>
                          <span style={{ color: '#64748B' }}>Room / Bed: </span>
                          <strong style={{ color: '#0F172A' }}>Room {receiptTx.roomNumber} &bull; Bed {receiptTx.bedNumber}</strong>
                        </div>
                        <div>
                          <span style={{ color: '#64748B' }}>Contact Phone: </span>
                          <span style={{ color: '#334155' }}>{tenant ? tenant.phone : '+91 91107 52349'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Payment Info Box */}
                    <div style={{ background: '#F8FAFC', padding: '14px 16px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '12.5px' }}>
                      <div style={{ fontSize: '11px', color: '#059669', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                        Payment Details
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div>
                          <span style={{ color: '#64748B' }}>Rental Period: </span>
                          <strong style={{ color: '#0F172A' }}>{formatRentalPeriod(receiptTx.dueDate)}</strong>
                        </div>
                        <div>
                          <span style={{ color: '#64748B' }}>Payment Mode: </span>
                          <strong style={{ color: '#0F172A' }}>{receiptTx.paymentMode || 'UPI'}</strong>
                        </div>
                        <div>
                          <span style={{ color: '#64748B' }}>Transaction ID: </span>
                          <span style={{ fontFamily: 'monospace', color: '#334155' }}>{receiptTx.transactionId || 'CASH-SETTLED'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* 3. Simple Itemized Rent Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '18px', fontSize: '12.5px' }}>
                <thead>
                  <tr style={{ background: '#F1F5F9', borderBottom: '2px solid #CBD5E1', textAlign: 'left', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    <th style={{ padding: '10px 14px', borderRadius: '6px 0 0 0' }}>Description</th>
                    <th style={{ padding: '10px 14px', textAlign: 'center', width: '120px' }}>Period</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right', borderRadius: '0 6px 0 0', width: '140px' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '12px 14px', fontWeight: '600', color: '#0F172A' }}>
                      Monthly PG Rent &amp; Homestyle Food
                      <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 'normal', marginTop: '2px' }}>
                        Includes 3 Times Meals, Wi-Fi &amp; Accommodation
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center', color: '#475569' }}>
                      1 Month
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '700', color: '#0F172A' }}>
                      {formatCurrency(receiptTx.amount)}
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr style={{ background: '#F8FAFC' }}>
                    <td colSpan="2" style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '700', fontSize: '13px', color: '#0F172A' }}>
                      Total Amount Paid:
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '900', fontSize: '16px', color: '#059669' }}>
                      {formatCurrency(receiptTx.amount)}
                    </td>
                  </tr>
                </tfoot>
              </table>

              {/* 4. Amount in Words */}
              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', padding: '10px 14px', marginBottom: '24px', fontSize: '12px', color: '#166534' }}>
                <span style={{ fontWeight: '700', color: '#15803D' }}>Amount in Words: </span>
                <strong style={{ color: '#0F172A' }}>{numberToWordsINR(receiptTx.amount)}</strong>
              </div>

              {/* 5. Footer & Simple Sign-off */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '16px', borderTop: '1px solid #E2E8F0', flexWrap: 'wrap', gap: '14px' }}>
                <div style={{ fontSize: '11.5px', color: '#64748B' }}>
                  <div style={{ fontWeight: '600', color: '#0F172A', marginBottom: '2px' }}>Thank you for staying with us!</div>
                  <div>Sri Venkateswara Gents PG &bull; Phone: +91 91107 52349</div>
                  <div style={{ fontSize: '10.5px', color: '#94A3B8', marginTop: '2px' }}>Computer-generated official receipt.</div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: "'Brush Script MT', 'Dancing Script', cursive, sans-serif", fontSize: '22px', color: '#1E3A8A', marginBottom: '2px' }}>
                    M. Venkatesh
                  </div>
                  <div style={{ borderTop: '1px solid #94A3B8', paddingTop: '4px', minWidth: '160px', display: 'inline-block' }}>
                    <strong style={{ fontSize: '12px', color: '#0F172A', display: 'block' }}>Authorized Signatory</strong>
                    <span style={{ fontSize: '10.5px', color: '#64748B' }}>Sri Venkateswara Gents PG</span>
                  </div>
                </div>
              </div>

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
              filteredTransactions.map(tx => (
                <tr key={tx.id}>
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
                      <div className="rent-actions-group">
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
              ))
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
                            <button className="secondary" style={{ padding: '4px 8px', fontSize: '11px', color: '#27ae60', background: 'rgba(37, 211, 102, 0.1)', border: '1px solid rgba(37, 211, 102, 0.2)' }} onClick={() => sendWhatsAppReceipt(selectedPerson, tx)} title="Share Receipt on WhatsApp">
                              📲 Receipt
                            </button>
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
    </div>
  );
}

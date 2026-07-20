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

  // Direct Email Share to Tenant Email Address with in-memory PDF attachment (No auto-download onto disk)
  const shareEmailWithPDF = async (tenant, tx) => {
    if (!tx) return;
    const mailEmail = tenant && tenant.email ? tenant.email : '';
    const subject = `Official Payment Receipt REC-${tx.id.replace(/[^0-9]/g, '') || '202607'} - Sri Venkateswara Gents PG`;
    const bodyText = `Dear ${tx.tenantName},\n\nThank you for your rent payment to Sri Venkateswara Gents PG.\n\nPayment Receipt Details:\n• Receipt #: REC-${tx.id.replace(/[^0-9]/g, '') || '202607'}\n• Tenant Name: ${tx.tenantName}\n• Room/Bed: Room ${tx.roomNumber} - Bed ${tx.bedNumber}\n• Paid Amount: ₹${tx.amount}\n• Date: ${tx.paymentDate || '2026-07-20'}\n• Payment Mode: ${tx.paymentMode || 'UPI'}\n• Transaction ID: ${tx.transactionId || 'CASH'}\n• Billing Period: ${tx.dueDate}\n\nThank you for choosing Sri Venkateswara Gents PG!\n\nBest Regards,\nManagement, Sri Venkateswara Gents PG`;

    // 1. Generate PDF file in memory
    const file = await generatePDFFile();

    // 2. If browser supports native Web Share API with files
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: subject,
          text: bodyText
        });
        return;
      } catch (e) {
        // User cancelled share
      }
    }

    // 3. Fallback: Launch mail app directly to that specific tenant email address
    const mailSubject = encodeURIComponent(subject);
    const mailBody = encodeURIComponent(bodyText);
    window.location.href = `mailto:${mailEmail}?subject=${mailSubject}&body=${mailBody}`;
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
                    <button className="secondary" onClick={() => shareEmailWithPDF(tenant, receiptTx)} style={{ fontSize: '13px', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(37, 99, 235, 0.08)', color: '#2563EB', border: '1px solid rgba(37, 99, 235, 0.2)', borderRadius: '10px', fontWeight: '600' }} title="Share Receipt & PDF via Email">
                      ✉️ Email Receipt + PDF
                    </button>
                  );
                })()}
                <button className="close-modal-btn" onClick={() => setReceiptTx(null)} style={{ fontSize: '20px', width: '36px', height: '36px', borderRadius: '10px' }}>&times;</button>
              </div>
            </div>

            {/* Printable PDF Document Container (A4 Centered Layout with 5-8% Watermark) */}
            <div id="receipt-printable-doc" className="print-ready-view" style={{ padding: '24px 28px', background: '#ffffff', color: '#0f172a', fontFamily: "'Inter', 'Poppins', system-ui, sans-serif", position: 'relative', overflowY: 'auto', flex: 1, WebkitOverflowScrolling: 'touch' }}>
              
              {/* Centered Semi-Transparent Logo Watermark (5-8% opacity behind all content) */}
              <div 
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '280px',
                  height: '280px',
                  opacity: '0.07',
                  pointerEvents: 'none',
                  zIndex: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <img 
                  src={logo} 
                  alt="Watermark Logo" 
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    filter: 'grayscale(20%)'
                  }} 
                />
              </div>

              {/* Document Content Layer */}
              <div style={{ position: 'relative', zIndex: 1 }}>
                
                {/* 1. Header Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '16px', borderBottom: '2px solid #E2E8F0', marginBottom: '16px', flexWrap: 'wrap', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <img src={logo} alt="Sri Venkateswara Gents PG Logo" style={{ width: '50px', height: '50px', borderRadius: '10px', objectFit: 'cover', border: '1px solid #E2E8F0', boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }} />
                    <div>
                      <h2 style={{ fontSize: '19px', fontWeight: '800', margin: 0, color: '#0F172A', letterSpacing: '-0.3px' }}>SRI VENKATESWARA GENTS PG</h2>
                      <p style={{ fontSize: '11.5px', color: '#64748B', margin: '2px 0 0', lineHeight: '1.35' }}>
                        #124, 15th Main Rd, HSR Layout, Sector 2, Bengaluru, Karnataka 560102<br />
                        Email: contact@svgentspg.com &bull; Phone: +91 98765 43210 &bull; GSTIN: 29ABCDE1234F1Z5
                      </p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <h1 style={{ fontSize: '18px', fontWeight: '900', color: '#2563EB', margin: 0, letterSpacing: '0.5px' }}>PAYMENT RECEIPT</h1>
                    <div style={{ fontSize: '11.5px', color: '#475569', marginTop: '4px', fontWeight: '600' }}>
                      Receipt #: <strong style={{ color: '#0F172A' }}>REC-{receiptTx.id.replace(/[^0-9]/g, '') || '202607-101'}</strong>
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#475569', marginTop: '2px' }}>
                      Date: <strong>{receiptTx.paymentDate || '2026-07-20'}</strong>
                    </div>
                    <div style={{ marginTop: '6px' }}>
                      {receiptTx.status === 'Paid' ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#DCFCE7', color: '#059669', border: '1px solid #A7F3D0', padding: '4px 12px', borderRadius: '16px', fontSize: '11px', fontWeight: '800', letterSpacing: '0.4px' }}>
                          ● PAID & CLEARED
                        </span>
                      ) : receiptTx.status === 'Late' ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#FEE2E2', color: '#DC2626', border: '1px solid #FCA5A5', padding: '4px 12px', borderRadius: '16px', fontSize: '11px', fontWeight: '800', letterSpacing: '0.4px' }}>
                          ● OVERDUE / LATE
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#FEF3C7', color: '#D97706', border: '1px solid #FDE68A', padding: '4px 12px', borderRadius: '16px', fontSize: '11px', fontWeight: '800', letterSpacing: '0.4px' }}>
                          ● PENDING
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Customer Information Card */}
                {(() => {
                  const tenant = tenants.find(t => t.id === receiptTx.tenantId);
                  return (
                    <div style={{ background: '#F8FAFC', padding: '14px 18px', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '16px' }}>
                      <div style={{ fontSize: '10.5px', color: '#2563EB', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>
                        Customer / Resident Information
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', fontSize: '12.5px' }}>
                        <div>
                          <span style={{ fontSize: '10.5px', color: '#64748B', display: 'block' }}>Customer Name</span>
                          <strong style={{ fontSize: '14px', color: '#0F172A' }}>{receiptTx.tenantName}</strong>
                        </div>
                        <div>
                          <span style={{ fontSize: '10.5px', color: '#64748B', display: 'block' }}>Customer ID</span>
                          <strong style={{ color: '#334155' }}>CUST-{tenant ? tenant.id.slice(-4) : '101'}</strong>
                        </div>
                        <div>
                          <span style={{ fontSize: '10.5px', color: '#64748B', display: 'block' }}>Phone Number</span>
                          <strong style={{ color: '#334155' }}>{tenant ? tenant.phone : '+91 98765 43210'}</strong>
                        </div>
                        <div>
                          <span style={{ fontSize: '10.5px', color: '#64748B', display: 'block' }}>Email Address</span>
                          <strong style={{ color: '#334155' }}>{tenant && tenant.email ? tenant.email : 'resident@svgentspg.com'}</strong>
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                          <span style={{ fontSize: '10.5px', color: '#64748B', display: 'block' }}>Billing Address & Room Allocation</span>
                          <strong style={{ color: '#334155' }}>Room {receiptTx.roomNumber} &bull; Bed {receiptTx.bedNumber}, Sri Venkateswara Gents PG, HSR Layout, Sector 2, Bengaluru - 560102</strong>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* 3. Payment Details Grid (2 Columns) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: '#FFFFFF', padding: '12px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '16px', fontSize: '12.5px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dashed #E2E8F0' }}>
                      <span style={{ color: '#64748B' }}>Transaction ID:</span>
                      <strong style={{ color: '#0F172A' }}>{receiptTx.transactionId || 'TXN9876543210'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dashed #E2E8F0' }}>
                      <span style={{ color: '#64748B' }}>Invoice Number:</span>
                      <strong style={{ color: '#0F172A' }}>INV-{receiptTx.dueDate.replace('-', '')}-{receiptTx.roomNumber}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                      <span style={{ color: '#64748B' }}>Currency:</span>
                      <strong style={{ color: '#0F172A' }}>INR (₹)</strong>
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dashed #E2E8F0' }}>
                      <span style={{ color: '#64748B' }}>Payment Method:</span>
                      <strong style={{ color: '#0F172A' }}>{receiptTx.paymentMode || 'UPI (GPay/PhonePe)'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dashed #E2E8F0' }}>
                      <span style={{ color: '#64748B' }}>Payment Date:</span>
                      <strong style={{ color: '#0F172A' }}>{receiptTx.paymentDate || '2026-07-20'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                      <span style={{ color: '#64748B' }}>Reference Number:</span>
                      <strong style={{ color: '#0F172A' }}>REF-{receiptTx.id.toUpperCase()}</strong>
                    </div>
                  </div>
                </div>

                {/* 4. Amount Summary Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px', fontSize: '12.5px' }}>
                  <thead>
                    <tr style={{ background: '#F1F5F9', textTransform: 'uppercase', fontSize: '10.5px', color: '#475569', textAlign: 'left', letterSpacing: '0.4px' }}>
                      <th style={{ padding: '8px 12px', borderBottom: '2px solid #CBD5E1', borderRadius: '6px 0 0 0' }}>Description</th>
                      <th style={{ padding: '8px 12px', borderBottom: '2px solid #CBD5E1', textAlign: 'center' }}>Qty</th>
                      <th style={{ padding: '8px 12px', borderBottom: '2px solid #CBD5E1', textAlign: 'right' }}>Unit Price</th>
                      <th style={{ padding: '8px 12px', borderBottom: '2px solid #CBD5E1', textAlign: 'right' }}>Tax (GST)</th>
                      <th style={{ padding: '8px 12px', borderBottom: '2px solid #CBD5E1', textAlign: 'right' }}>Discount</th>
                      <th style={{ padding: '8px 12px', borderBottom: '2px solid #CBD5E1', textAlign: 'right', borderRadius: '0 6px 0 0' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid #E2E8F0', fontWeight: '600', color: '#0F172A' }}>
                        Monthly Accommodation, Food & Facility Maintenance ({receiptTx.dueDate})
                      </td>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid #E2E8F0', textAlign: 'center', color: '#475569' }}>1 Month</td>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid #E2E8F0', textAlign: 'right', color: '#475569' }}>{formatCurrency(receiptTx.amount)}</td>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid #E2E8F0', textAlign: 'right', color: '#475569' }}>₹0.00 (0%)</td>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid #E2E8F0', textAlign: 'right', color: '#475569' }}>₹0.00</td>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid #E2E8F0', textAlign: 'right', fontWeight: '700', color: '#0F172A' }}>{formatCurrency(receiptTx.amount)}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Subtotal, GST & Grand Total Callout */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                  <div style={{ width: '260px', fontSize: '12.5px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', color: '#475569' }}>
                      <span>Subtotal:</span>
                      <strong>{formatCurrency(receiptTx.amount)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', color: '#475569' }}>
                      <span>GST / Tax (0% Residential):</span>
                      <strong>₹0.00</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', color: '#475569', borderBottom: '1px dashed #CBD5E1', paddingBottom: '6px' }}>
                      <span>Discount:</span>
                      <strong>₹0.00</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '10px', marginTop: '6px', color: '#047857' }}>
                      <span style={{ fontSize: '13px', fontWeight: '800' }}>Grand Total Paid:</span>
                      <strong style={{ fontSize: '16px', fontWeight: '900' }}>{formatCurrency(receiptTx.amount)}</strong>
                    </div>
                  </div>
                </div>

                {/* 5. Notes & Terms Callout Box */}
                <div style={{ background: '#F0F9FF', padding: '10px 14px', borderRadius: '10px', border: '1px solid #BAE6FD', marginBottom: '16px', fontSize: '11.5px', color: '#0369A1' }}>
                  <div style={{ fontWeight: '700', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>✓ Notes & Acknowledgement</span>
                  </div>
                  <div>&bull; Thank you for your payment to Sri Venkateswara Gents PG.</div>
                  <div>&bull; This is an official computer-generated receipt document. No physical signature is required.</div>
                </div>

                {/* 6. Footer & Verification QR Code Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '2px solid #E2E8F0', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '11.5px', fontWeight: '700', color: '#0F172A' }}>Sri Venkateswara Gents PG</div>
                    <div style={{ fontSize: '10.5px', color: '#64748B', marginTop: '2px' }}>
                      Website: www.svgentspg.com &bull; Support: support@svgentspg.com
                    </div>
                    <div style={{ fontSize: '9.5px', color: '#94A3B8', marginTop: '2px' }}>
                      © 2026 Sri Venkateswara Gents PG. All rights reserved.
                    </div>
                  </div>

                  {/* Payment Verification QR Code */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#F8FAFC', padding: '6px 10px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <svg viewBox="0 0 24 24" width="36" height="36" fill="#0F172A">
                      <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm1 1h2v2H5V5zm9-3h8v8h-8V2zm2 2v4h4V4h-4zm1 1h2v2h-2V5zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm1 1h2v2H5v-2zm13-3h4v2h-4v-2zm-4 2h2v2h-2v-2zm2 2h4v4h-4v-4zm-4 2h2v2h-2v-2zm2-6h2v2h-2v-2z" />
                    </svg>
                    <div>
                      <div style={{ fontSize: '9.5px', fontWeight: '800', color: '#0F172A', textTransform: 'uppercase' }}>Scan to Verify</div>
                      <div style={{ fontSize: '8.5px', color: '#64748B' }}>Digital Audit Stamp</div>
                    </div>
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

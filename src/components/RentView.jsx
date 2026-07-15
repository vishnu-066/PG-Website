import React, { useState } from 'react';
import { useAdmin } from './AdminContext';

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
  
  // Payment Modal controls
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [activeTx, setActiveTx] = useState(null);
  
  // Form fields
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [transactionId, setTransactionId] = useState('');
  const [paymentRemarks, setPaymentRemarks] = useState('');

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

  // 2. Filter transactions list
  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.tenantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          tx.roomNumber.includes(searchTerm) ||
                          (tx.transactionId && tx.transactionId.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'All' ? true : tx.status === statusFilter;
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

      {/* Room-wise Revenue Audit Table */}
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
    </div>
  );
}

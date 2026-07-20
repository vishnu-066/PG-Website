import React, { useState } from 'react';
import { useAdmin } from './AdminContext';

export default function ReportsView() {
  const { rooms, tenants, transactions } = useAdmin();
  const [reportType, setReportType] = useState('revenue'); // revenue, occupancy, collection, vacant, pending

  // Helper currency formatter
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Compile active report data based on selection
  const getReportData = () => {
    const currentMonthStr = '2026-07';
    
    switch (reportType) {
      case 'revenue':
        return rooms.map(room => {
          let expected = 0;
          let collected = 0;
          let pending = 0;
          room.beds.forEach(bed => {
            if (bed.status === 'Occupied') {
              const tenant = tenants.find(t => t.id === bed.tenantId);
              if (tenant) {
                const tx = transactions.find(t => t.tenantId === tenant.id && t.dueDate.startsWith(currentMonthStr));
                if (tx) {
                  expected += tx.amount;
                  if (tx.status === 'Paid') collected += tx.amount;
                  else pending += tx.amount;
                } else {
                  expected += tenant.monthlyRent;
                  pending += tenant.monthlyRent;
                }
              }
            }
          });
          return {
            'Room Number': room.number,
            'Room Type': room.type,
            'Price Per Bed': room.price,
            'Beds Capacity': room.beds.length,
            'Expected Rent': expected,
            'Collected Rent': collected,
            'Pending Rent': pending
          };
        });

      case 'occupancy':
        return rooms.map(room => {
          const total = room.beds.length;
          const occupied = room.beds.filter(b => b.status === 'Occupied').length;
          const available = room.beds.filter(b => b.status === 'Available').length;
          const rate = total > 0 ? Math.round((occupied / total) * 100) : 0;
          
          return {
            'Room Number': room.number,
            'Room Type': room.type,
            'Total Beds': total,
            'Occupied Beds': occupied,
            'Available Beds': available,
            'Occupancy Rate (%)': `${rate}%`
          };
        });

      case 'collection':
        return transactions.map(tx => {
          const tenant = tenants.find(t => t.id === tx.tenantId);
          return {
            'Customer ID': tenant ? (tenant.customerId || tenant.id) : tx.tenantId,
            'Tenant Name': tx.tenantName,
            'Room': tx.roomNumber,
            'Bed': tx.bedNumber,
            'Rent Amount': tx.amount,
            'Due Date': tx.dueDate,
            'Status': tx.status,
            'Payment Date': tx.paymentDate || '-',
            'Payment Mode': tx.paymentMode || '-',
            'Transaction ID': tx.transactionId || '-'
          };
        });

      case 'vacant':
        const vacantBeds = [];
        rooms.forEach(room => {
          room.beds.forEach(bed => {
            if (bed.status === 'Available') {
              vacantBeds.push({
                'Room Number': room.number,
                'Room Type': room.type,
                'Bed Number': bed.number,
                'Price Per Bed': room.price
              });
            }
          });
        });
        return vacantBeds;

      case 'pending':
        const pendingList = [];
        const currentMonthPendingTx = transactions.filter(tx => 
          tx.dueDate.startsWith(currentMonthStr) && (tx.status === 'Pending' || tx.status === 'Late')
        );
        
        currentMonthPendingTx.forEach(tx => {
          const tenant = tenants.find(t => t.id === tx.tenantId);
          pendingList.push({
            'Customer ID': tenant ? (tenant.customerId || tenant.id) : tx.tenantId,
            'Tenant Name': tx.tenantName,
            'Phone Number': tenant ? tenant.phone : '-',
            'Room Number': tx.roomNumber,
            'Bed Number': tx.bedNumber,
            'Rent Amount': tx.amount,
            'Due Date': tx.dueDate,
            'Payment Status': tx.status,
            'Aadhaar Number': tenant ? tenant.aadhaar : '-'
          });
        });
        return pendingList;

      default:
        return [];
    }
  };

  const reportData = getReportData();

  // Export to CSV
  const exportToCSV = () => {
    if (reportData.length === 0) return;
    
    const headers = Object.keys(reportData[0]);
    const csvRows = [];
    
    // Header row
    csvRows.push(headers.join(','));
    
    // Data rows
    for (const row of reportData) {
      const values = headers.map(header => {
        const val = row[header];
        // Handle numbers and commas
        const escaped = ('' + val).replace(/"/g, '\\"');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }
    
    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${reportType}_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to PDF (Triggers Print Stylesheet layout)
  const triggerPrint = () => {
    window.print();
  };

  return (
    <div className="admin-view-container print-ready-view">
      <div className="view-header no-print">
        <div>
          <h1>Reports & Downloads</h1>
          <p>Generate, review, audit, and export operational statistics.</p>
        </div>
        <div className="reports-action-row">
          <button className="primary" style={{ backgroundColor: '#27ae60' }} onClick={exportToCSV} disabled={reportData.length === 0}>
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>Export CSV / Excel</span>
          </button>
          <button className="primary" onClick={triggerPrint} disabled={reportData.length === 0}>
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none">
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            <span>Print PDF Report</span>
          </button>
        </div>
      </div>

      {/* Report Type Selector Tabs (No-Print) */}
      <div className="reports-selector-tabs no-print glass-card">
        <button 
          className={`report-tab-btn ${reportType === 'revenue' ? 'active' : ''}`}
          onClick={() => setReportType('revenue')}
        >
          Room-wise Revenue
        </button>
        <button 
          className={`report-tab-btn ${reportType === 'occupancy' ? 'active' : ''}`}
          onClick={() => setReportType('occupancy')}
        >
          Occupancy Levels
        </button>
        <button 
          className={`report-tab-btn ${reportType === 'collection' ? 'active' : ''}`}
          onClick={() => setReportType('collection')}
        >
          Rent Collections
        </button>
        <button 
          className={`report-tab-btn ${reportType === 'vacant' ? 'active' : ''}`}
          onClick={() => setReportType('vacant')}
        >
          Vacant Beds
        </button>
        <button 
          className={`report-tab-btn ${reportType === 'pending' ? 'active' : ''}`}
          onClick={() => setReportType('pending')}
        >
          Pending Rent List
        </button>
      </div>

      {/* Printable Report Document Header (visible only on print) */}
      <div className="printable-report-header only-print">
        <h2>Sri Venkateswara Gents PG</h2>
        <h3>OPERATIONAL MANAGEMENT AUDIT REPORT</h3>
        <p>Report Type: {reportType.toUpperCase()} | Generated: {new Date().toLocaleString()}</p>
        <hr />
      </div>

      {/* Reports Table Display */}
      <div className="table-responsive-wrapper glass-card">
        {reportData.length > 0 ? (
          <table className="admin-data-table reports-printable-table">
            <thead>
              <tr>
                {Object.keys(reportData[0]).map((header, idx) => (
                  <th key={idx}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reportData.map((row, rowIdx) => (
                <tr key={rowIdx}>
                  {Object.keys(row).map((header, colIdx) => {
                    const value = row[header];
                    // Format columns with currency symbol if they represent prices/rents
                    const isCurrencyField = header.includes('Expected') || 
                                           header.includes('Collected') || 
                                           header.includes('Pending') || 
                                           header.includes('Amount') || 
                                           header.includes('Price');
                    
                    return (
                      <td key={colIdx}>
                        {isCurrencyField && typeof value === 'number' ? (
                          <strong>{formatCurrency(value)}</strong>
                        ) : (
                          value
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-table-placeholder">
            No records found for this report filter.
          </div>
        )}
      </div>

      {/* Print Page Footer (Print only) */}
      <div className="printable-report-footer only-print">
        <p>&copy; {new Date().getFullYear()} Sri Venkateswara Gents PG. Internal Auditing Document.</p>
      </div>
    </div>
  );
}

import React from 'react';
import { useAdmin } from './AdminContext';

export default function DashboardView() {
  const { rooms, tenants, transactions } = useAdmin();

  // 1. Calculate Metrics
  const totalRooms = rooms.length;
  
  let totalBeds = 0;
  let occupiedBeds = 0;
  let emptyBeds = 0;
  
  rooms.forEach(room => {
    totalBeds += room.beds.length;
    room.beds.forEach(bed => {
      if (bed.status === 'Occupied') occupiedBeds++;
      else if (bed.status === 'Available') emptyBeds++;
    });
  });

  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
  const numTenants = tenants.length;
  
  const availableRoomsCount = rooms.filter(room => 
    room.beds.some(bed => bed.status === 'Available')
  ).length;

  // Monthly Revenue calculations (for current month, e.g. July 2026)
  const currentMonthStr = '2026-07';
  const currentMonthTx = transactions.filter(tx => tx.dueDate.startsWith(currentMonthStr));

  let expectedRevenue = 0;
  let receivedRevenue = 0;
  let pendingRent = 0;

  currentMonthTx.forEach(tx => {
    expectedRevenue += tx.amount;
    if (tx.status === 'Paid') {
      receivedRevenue += tx.amount;
    } else {
      pendingRent += tx.amount;
    }
  });

  // 2. Generate Notifications/Alerts
  const alerts = [];
  
  // Rent Due Alerts
  const pendingTx = transactions.filter(tx => tx.status === 'Pending' || tx.status === 'Late');
  const lateTx = transactions.filter(tx => tx.status === 'Late');
  
  if (pendingTx.length > 0) {
    alerts.push({
      type: 'warning',
      message: `${pendingTx.length} Rent payment(s) are pending for this billing cycle.`,
      icon: (
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      )
    });
  }
  if (lateTx.length > 0) {
    alerts.push({
      type: 'danger',
      message: `${lateTx.length} Tenant(s) have late rent status (overdue).`,
      icon: (
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none">
          <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
          <line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      )
    });
  }

  // Room Full alerts & Empty beds alerts
  const fullRooms = rooms.filter(r => r.beds.every(b => b.status === 'Occupied'));
  if (fullRooms.length > 0) {
    alerts.push({
      type: 'info',
      message: `${fullRooms.length} room(s) (Room ${fullRooms.map(r => r.number).join(', ')}) are completely occupied.`,
      icon: (
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      )
    });
  }

  if (emptyBeds > 0) {
    alerts.push({
      type: 'success',
      message: `${emptyBeds} bed(s) are empty and ready for immediate onboarding.`,
      icon: (
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none">
          <path d="M2 20h20M5 17V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v12M2 17h20" />
        </svg>
      )
    });
  }

  // Helper formatting for currency
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="admin-view-container">
      <div className="view-header">
        <div>
          <h1>Dashboard Overview</h1>
          <p>Real-time analytics and updates of your PG property.</p>
        </div>
        <div className="header-date-badge">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="19" y2="10" />
          </svg>
          <span>July 2026</span>
        </div>
      </div>

      {/* Alerts Board */}
      {alerts.length > 0 && (
        <div className="dashboard-alerts-grid">
          {alerts.map((alert, idx) => (
            <div key={idx} className={`dashboard-alert-card status-${alert.type}`}>
              <div className="alert-icon-container">{alert.icon}</div>
              <div className="alert-message">{alert.message}</div>
            </div>
          ))}
        </div>
      )}

      {/* Metrics Grid */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon bg-soft-blue">
            <svg viewBox="0 0 24 24" width="22" height="22" stroke="#4b7cf3" strokeWidth="2" fill="none">
              <rect x="3" y="3" width="7" height="9" />
              <rect x="14" y="3" width="7" height="5" />
              <rect x="14" y="12" width="7" height="9" />
              <rect x="3" y="16" width="7" height="5" />
            </svg>
          </div>
          <div className="metric-data">
            <span className="metric-label">Total Rooms</span>
            <h3 className="metric-value">{totalRooms}</h3>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon bg-soft-purple">
            <svg viewBox="0 0 24 24" width="22" height="22" stroke="#9b51e0" strokeWidth="2" fill="none">
              <path d="M3 20h18M5 17v-8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v8M2 17h20" />
            </svg>
          </div>
          <div className="metric-data">
            <span className="metric-label">Total Beds</span>
            <h3 className="metric-value">{totalBeds}</h3>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon bg-soft-green">
            <svg viewBox="0 0 24 24" width="22" height="22" stroke="#27ae60" strokeWidth="2" fill="none">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div className="metric-data">
            <span className="metric-label">Occupied Beds</span>
            <h3 className="metric-value">{occupiedBeds}</h3>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon bg-soft-yellow">
            <svg viewBox="0 0 24 24" width="22" height="22" stroke="#f1c40f" strokeWidth="2" fill="none">
              <circle cx="12" cy="12" r="10" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          </div>
          <div className="metric-data">
            <span className="metric-label">Empty Beds</span>
            <h3 className="metric-value">{emptyBeds}</h3>
          </div>
        </div>



        <div className="metric-card">
          <div className="metric-icon bg-soft-red">
            <svg viewBox="0 0 24 24" width="22" height="22" stroke="#e74c3c" strokeWidth="2" fill="none">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="metric-data">
            <span className="metric-label">Total Tenants</span>
            <h3 className="metric-value">{numTenants}</h3>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon bg-soft-teal">
            <svg viewBox="0 0 24 24" width="22" height="22" stroke="#1abc9c" strokeWidth="2" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <div className="metric-data">
            <span className="metric-label">Available Rooms</span>
            <h3 className="metric-value">{availableRoomsCount}</h3>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon bg-soft-indigo">
            <svg viewBox="0 0 24 24" width="22" height="22" stroke="#3f51b5" strokeWidth="2" fill="none">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
              <path d="M12 14c-2.2 0-4 1.8-4 4h8c0-2.2-1.8-4-4-4z" />
            </svg>
          </div>
          <div className="metric-data">
            <span className="metric-label">Occupancy Rate</span>
            <h3 className="metric-value">{occupancyRate}%</h3>
          </div>
        </div>
      </div>

      {/* Revenue Metrics Row */}
      <div className="revenue-metrics-row">
        <div className="rev-card exp">
          <span className="rev-label">Expected Revenue</span>
          <h2 className="rev-value">{formatCurrency(expectedRevenue)}</h2>
        </div>
        <div className="rev-card rec">
          <span className="rev-label">Received Revenue</span>
          <h2 className="rev-value">{formatCurrency(receivedRevenue)}</h2>
        </div>
        <div className="rev-card pend">
          <span className="rev-label">Pending Rent</span>
          <h2 className="rev-value">{formatCurrency(pendingRent)}</h2>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="charts-grid">
        {/* Occupancy Rate Circle Progress */}
        <div className="chart-card glass-card">
          <h3>Occupancy Distribution</h3>
          <div className="occupancy-donut-wrapper">
            <svg width="180" height="180" viewBox="0 0 36 36" className="circular-chart">
              {/* Background Circle */}
              <path className="circle-bg"
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="var(--border)"
                strokeWidth="2.8"
              />
              {/* Foreground Circle representing occupancy */}
              <path className="circle"
                strokeDasharray={`${occupancyRate}, 100`}
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="var(--primary)"
                strokeWidth="2.8"
                strokeLinecap="round"
              />
              <text x="18" y="20.35" className="percentage">{occupancyRate}%</text>
            </svg>
            <div className="donut-legend">
              <div>
                <span className="legend-dot" style={{ backgroundColor: 'var(--primary)' }}></span>
                <span>Occupied ({occupiedBeds})</span>
              </div>
              <div>
                <span className="legend-dot" style={{ backgroundColor: 'var(--border)' }}></span>
                <span>Empty ({emptyBeds})</span>
              </div>

            </div>
          </div>
        </div>

        {/* Paid vs Pending Rent Ring Chart */}
        <div className="chart-card glass-card">
          <h3>Rent Status Share</h3>
          <div className="occupancy-donut-wrapper">
            <svg width="180" height="180" viewBox="0 0 36 36" className="circular-chart">
              <path className="circle-bg"
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="var(--border)"
                strokeWidth="2.8"
              />
              <path className="circle"
                strokeDasharray={`${expectedRevenue > 0 ? Math.round((receivedRevenue / expectedRevenue) * 100) : 0}, 100`}
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#27ae60"
                strokeWidth="2.8"
                strokeLinecap="round"
              />
              <text x="18" y="20.35" className="percentage" style={{ fill: '#27ae60' }}>
                {expectedRevenue > 0 ? Math.round((receivedRevenue / expectedRevenue) * 100) : 0}%
              </text>
            </svg>
            <div className="donut-legend">
              <div>
                <span className="legend-dot" style={{ backgroundColor: '#27ae60' }}></span>
                <span>Received ({formatCurrency(receivedRevenue)})</span>
              </div>
              <div>
                <span className="legend-dot" style={{ backgroundColor: 'var(--border)' }}></span>
                <span>Pending ({formatCurrency(pendingRent)})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Room-wise Income Bar Chart */}
        <div className="chart-card glass-card full-width">
          <h3>Room-wise Expected Income</h3>
          <div className="bar-chart-container">
            {rooms.map(room => {
              // Calculate expected income for this room
              let roomExpected = 0;
              room.beds.forEach(bed => {
                if (bed.status === 'Occupied') {
                  const tenant = tenants.find(t => t.id === bed.tenantId);
                  if (tenant) roomExpected += tenant.monthlyRent;
                } else {
                  // If bed is empty, show potential income at room base rate
                  roomExpected += 0; 
                }
              });
              
              // Max scale setting (e.g. ₹20,000 max)
              const maxVal = 20000;
              const barHeight = Math.min((roomExpected / maxVal) * 100, 100);
              
              return (
                <div key={room.id} className="bar-item">
                  <div className="bar-graphic-wrapper">
                    <span className="bar-value-hover">{formatCurrency(roomExpected)}</span>
                    <div className="bar-graphic" style={{ height: `${barHeight}%` }}></div>
                  </div>
                  <span className="bar-label">Room {room.number}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

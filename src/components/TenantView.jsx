import React, { useState } from 'react';
import { useAdmin } from './AdminContext';

export default function TenantView() {
  const { 
    tenants, 
    rooms, 
    transactions,
    addTenant, 
    editTenant, 
    deleteTenant 
  } = useAdmin();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [roomFilter, setRoomFilter] = useState('');
  const [rentFilter, setRentFilter] = useState('All'); // All, Paid, Pending, Late

  // Modal controls
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeTenant, setActiveTenant] = useState(null);

  // Form states
  const [tenantName, setTenantName] = useState('');
  const [tenantPhone, setTenantPhone] = useState('');
  const [tenantAadhaar, setTenantAadhaar] = useState('');
  const [tenantRoomId, setTenantRoomId] = useState('');
  const [tenantBedId, setTenantBedId] = useState('');
  const [tenantBedNum, setTenantBedNum] = useState('');
  const [tenantJoiningDate, setTenantJoiningDate] = useState(new Date().toISOString().split('T')[0]);
  const [tenantAdvance, setTenantAdvance] = useState('');
  const [tenantRent, setTenantRent] = useState('');
  const [tenantDeposit, setTenantDeposit] = useState('2000');
  const [tenantEmergency, setTenantEmergency] = useState('');
  const [tenantRemarks, setTenantRemarks] = useState('');

  // Handle Room Selection in Add Tenant form (auto-fill monthly price)
  const handleRoomChange = (roomId) => {
    setTenantRoomId(roomId);
    setTenantBedId('');
    setTenantBedNum('');
    const room = rooms.find(r => r.id === roomId);
    if (room) {
      setTenantRent(room.price.toString());
    }
  };

  // Handle Submit New Tenant
  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!tenantName || !tenantRoomId || !tenantBedId) return;

    addTenant({
      name: tenantName,
      phone: tenantPhone,
      aadhaar: tenantAadhaar,
      roomId: tenantRoomId,
      bedId: tenantBedId,
      bedNumber: tenantBedNum,
      joiningDate: tenantJoiningDate,
      advancePaid: tenantAdvance,
      monthlyRent: tenantRent,
      deposit: tenantDeposit,
      emergencyContact: tenantEmergency,
      remarks: tenantRemarks
    });

    // Reset Form
    setTenantName('');
    setTenantPhone('');
    setTenantAadhaar('');
    setTenantRoomId('');
    setTenantBedId('');
    setTenantBedNum('');
    setTenantJoiningDate(new Date().toISOString().split('T')[0]);
    setTenantAdvance('');
    setTenantRent('');
    setTenantDeposit('2000');
    setTenantEmergency('');
    setTenantRemarks('');
    setShowAddModal(false);
  };

  // Open Edit Modal
  const openEdit = (tenant) => {
    setActiveTenant(tenant);
    setTenantName(tenant.name);
    setTenantPhone(tenant.phone);
    setTenantAadhaar(tenant.aadhaar);
    setTenantRent(tenant.monthlyRent.toString());
    setTenantDeposit(tenant.deposit.toString());
    setTenantAdvance(tenant.advancePaid.toString());
    setTenantEmergency(tenant.emergencyContact);
    setTenantRemarks(tenant.remarks);
    setShowEditModal(true);
  };

  // Handle Edit Submit
  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!activeTenant || !tenantName) return;

    editTenant(activeTenant.id, {
      name: tenantName,
      phone: tenantPhone,
      aadhaar: tenantAadhaar,
      monthlyRent: tenantRent,
      deposit: tenantDeposit,
      advancePaid: tenantAdvance,
      emergencyContact: tenantEmergency,
      remarks: tenantRemarks
    });

    setShowEditModal(false);
    setActiveTenant(null);
  };

  // Helpers
  const getRentStatusBadge = (tenantId) => {
    // Check current month (July 2026) payment status
    const currentMonthStr = '2026-07';
    const tx = transactions.find(t => t.tenantId === tenantId && t.dueDate.startsWith(currentMonthStr));
    
    if (!tx) return <span className="status-badge grey">No Bill</span>;
    if (tx.status === 'Paid') return <span className="status-badge green">Paid</span>;
    if (tx.status === 'Late') return <span className="status-badge red">Late</span>;
    return <span className="status-badge orange">Pending</span>;
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // 3. Search & Filter calculation
  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          tenant.phone.includes(searchTerm) ||
                          tenant.aadhaar.includes(searchTerm);
    const matchesRoom = roomFilter ? tenant.roomNumber === roomFilter : true;
    
    // Check current month rent status for rent filtering
    const currentMonthStr = '2026-07';
    const tx = transactions.find(t => t.tenantId === tenant.id && t.dueDate.startsWith(currentMonthStr));
    const txStatus = tx ? tx.status : 'Pending';
    
    const matchesRent = rentFilter === 'All' || 
                        (rentFilter === 'Paid' && txStatus === 'Paid') ||
                        (rentFilter === 'Pending' && txStatus === 'Pending') ||
                        (rentFilter === 'Late' && txStatus === 'Late');

    return matchesSearch && matchesRoom && matchesRent;
  });

  return (
    <div className="admin-view-container">
      <div className="view-header">
        <div>
          <h1>Tenant Registry</h1>
          <p>Register new boarders, track paperwork, and manage contacts.</p>
        </div>
        <button className="primary" onClick={() => setShowAddModal(true)}>
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Add Tenant</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-search-container glass-card">
        <div className="search-bar-input">
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search tenant by name, phone, Aadhaar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-selects-row">
          <div className="filter-group">
            <label>Room No.</label>
            <select value={roomFilter} onChange={(e) => setRoomFilter(e.target.value)}>
              <option value="">All Rooms</option>
              {rooms.map(r => (
                <option key={r.id} value={r.number}>Room {r.number}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Rent Status</label>
            <select value={rentFilter} onChange={(e) => setRentFilter(e.target.value)}>
              <option value="All">All Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Late">Late</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tenant Table Container */}
      <div className="table-responsive-wrapper glass-card">
        <table className="admin-data-table">
          <thead>
            <tr>
              <th>Tenant Name</th>
              <th>Room / Bed</th>
              <th>Phone Number</th>
              <th>Aadhaar Number</th>
              <th>Joining Date</th>
              <th>Monthly Rent</th>
              <th>Rent Status</th>
              <th className="actions-header">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTenants.length > 0 ? (
              filteredTenants.map(tenant => (
                <tr key={tenant.id}>
                  <td data-label="Tenant">
                    <div className="tenant-profile-td">
                      <div className="avatar-placeholder">
                        {tenant.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="tenant-meta-td">
                        <span className="tenant-name-span">{tenant.name}</span>
                        <span className="tenant-sub-remarks" title={tenant.remarks || 'No remarks'}>
                          {tenant.remarks || 'No remarks'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td data-label="Room / Bed">
                    <div className="room-bed-badge">
                      Room {tenant.roomNumber} &bull; Bed {tenant.bedNumber}
                    </div>
                  </td>
                  <td data-label="Phone">{tenant.phone}</td>
                  <td data-label="Aadhaar" className="monospace-text">{tenant.aadhaar}</td>
                  <td data-label="Joined">{tenant.joiningDate}</td>
                  <td data-label="Rent"><strong>{formatCurrency(tenant.monthlyRent)}</strong></td>
                  <td data-label="Status">{getRentStatusBadge(tenant.id)}</td>
                  <td data-label="Actions" className="actions-cell">
                    <button className="icon-btn-edit" onClick={() => openEdit(tenant)} title="Edit Profile">
                      <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button className="icon-btn-delete" onClick={() => deleteTenant(tenant.id)} title="Remove Tenant">
                      <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        <line x1="10" y1="11" x2="10" y2="17" />
                        <line x1="14" y1="11" x2="14" y2="17" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="empty-table-placeholder">
                  No tenant matches your search criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* -------------------- MODALS -------------------- */}

      {/* Add Tenant Modal */}
      {showAddModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card large-modal animate-fade-in">
            <div className="modal-header">
              <h2>Register New Tenant</h2>
              <button className="close-modal-btn" onClick={() => setShowAddModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleAddSubmit} className="modal-form grid-form">
              <div className="form-group">
                <input
                  type="text"
                  placeholder=" "
                  value={tenantName}
                  onChange={(e) => setTenantName(e.target.value)}
                  required
                />
                <label>Full Name</label>
              </div>

              <div className="form-group">
                <input
                  type="tel"
                  placeholder=" "
                  value={tenantPhone}
                  onChange={(e) => setTenantPhone(e.target.value)}
                  required
                />
                <label>Phone Number</label>
              </div>

              <div className="form-group">
                <input
                  type="text"
                  placeholder=" "
                  value={tenantAadhaar}
                  onChange={(e) => setTenantAadhaar(e.target.value)}
                  required
                />
                <label>Aadhaar Number (xxxx-xxxx-xxxx)</label>
              </div>

              <div className="form-group-select">
                <label>Room Allocation</label>
                <select value={tenantRoomId} onChange={(e) => handleRoomChange(e.target.value)} required>
                  <option value="">Select Room</option>
                  {rooms.map(room => {
                    const availBedsCount = room.beds.filter(b => b.status === 'Available').length;
                    return (
                      <option key={room.id} value={room.id} disabled={availBedsCount === 0}>
                        Room {room.number} ({room.type} - {availBedsCount} available)
                      </option>
                    );
                  })}
                </select>
              </div>

              {tenantRoomId && (
                <div className="form-group-select">
                  <label>Bed Number</label>
                  <select 
                    value={tenantBedId} 
                    onChange={(e) => {
                      setTenantBedId(e.target.value);
                      const bed = rooms.find(r => r.id === tenantRoomId)?.beds.find(b => b.id === e.target.value);
                      if (bed) setTenantBedNum(bed.number);
                    }}
                    required
                  >
                    <option value="">Select Bed</option>
                    {rooms.find(r => r.id === tenantRoomId)?.beds
                      .filter(b => b.status === 'Available')
                      .map(b => (
                        <option key={b.id} value={b.id}>Bed {b.number}</option>
                      ))
                    }
                  </select>
                </div>
              )}

              <div className="form-group">
                <input
                  type="date"
                  placeholder=" "
                  value={tenantJoiningDate}
                  onChange={(e) => setTenantJoiningDate(e.target.value)}
                  required
                />
                <label>Joining Date</label>
              </div>

              <div className="form-group">
                <input
                  type="number"
                  placeholder=" "
                  value={tenantRent}
                  onChange={(e) => setTenantRent(e.target.value)}
                  required
                />
                <label>Monthly Rent (₹)</label>
              </div>

              <div className="form-group">
                <input
                  type="number"
                  placeholder=" "
                  value={tenantDeposit}
                  onChange={(e) => setTenantDeposit(e.target.value)}
                  required
                />
                <label>Security Deposit (₹)</label>
              </div>

              <div className="form-group">
                <input
                  type="number"
                  placeholder=" "
                  value={tenantAdvance}
                  onChange={(e) => setTenantAdvance(e.target.value)}
                />
                <label>Advance Paid (₹)</label>
              </div>

              <div className="form-group full-width">
                <input
                  type="text"
                  placeholder=" "
                  value={tenantEmergency}
                  onChange={(e) => setTenantEmergency(e.target.value)}
                  required
                />
                <label>Emergency Contact (Name - Relationship - Phone)</label>
              </div>

              <div className="form-group full-width">
                <textarea
                  placeholder="Remarks/Notes (e.g. key details, special requirements)"
                  value={tenantRemarks}
                  onChange={(e) => setTenantRemarks(e.target.value)}
                  rows="3"
                />
              </div>

              <div className="modal-actions full-width">
                <button type="button" className="btn-cancel" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="primary">Register Tenant</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Tenant Modal */}
      {showEditModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card large-modal animate-fade-in">
            <div className="modal-header">
              <h2>Edit Profile: {activeTenant?.name}</h2>
              <button className="close-modal-btn" onClick={() => setShowEditModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleEditSubmit} className="modal-form grid-form">
              <div className="form-group">
                <input
                  type="text"
                  placeholder=" "
                  value={tenantName}
                  onChange={(e) => setTenantName(e.target.value)}
                  required
                />
                <label>Full Name</label>
              </div>

              <div className="form-group">
                <input
                  type="tel"
                  placeholder=" "
                  value={tenantPhone}
                  onChange={(e) => setTenantPhone(e.target.value)}
                  required
                />
                <label>Phone Number</label>
              </div>

              <div className="form-group">
                <input
                  type="text"
                  placeholder=" "
                  value={tenantAadhaar}
                  onChange={(e) => setTenantAadhaar(e.target.value)}
                  required
                />
                <label>Aadhaar Number</label>
              </div>

              <div className="form-group">
                <input
                  type="number"
                  placeholder=" "
                  value={tenantRent}
                  onChange={(e) => setTenantRent(e.target.value)}
                  required
                />
                <label>Monthly Rent (₹)</label>
              </div>

              <div className="form-group">
                <input
                  type="number"
                  placeholder=" "
                  value={tenantDeposit}
                  onChange={(e) => setTenantDeposit(e.target.value)}
                  required
                />
                <label>Security Deposit (₹)</label>
              </div>

              <div className="form-group">
                <input
                  type="number"
                  placeholder=" "
                  value={tenantAdvance}
                  onChange={(e) => setTenantAdvance(e.target.value)}
                />
                <label>Advance Paid (₹)</label>
              </div>

              <div className="form-group full-width">
                <input
                  type="text"
                  placeholder=" "
                  value={tenantEmergency}
                  onChange={(e) => setTenantEmergency(e.target.value)}
                  required
                />
                <label>Emergency Contact</label>
              </div>

              <div className="form-group full-width">
                <textarea
                  placeholder="Remarks/Notes"
                  value={tenantRemarks}
                  onChange={(e) => setTenantRemarks(e.target.value)}
                  rows="3"
                />
              </div>

              <div className="modal-actions full-width">
                <button type="button" className="btn-cancel" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button type="submit" className="primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

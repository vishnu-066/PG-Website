import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { useAdmin } from './AdminContext';

const WEB_FIELDS = [
  { key: 'name', label: 'Tenant Name (Required)', keywords: ['name', 'fullname', 'full name', 'tenant', 'customer', 'guest', 'boarder', 'boarder name', 'resident', 'resident name'] },
  { key: 'phone', label: 'Phone Number', keywords: ['phone', 'mobile', 'contact', 'number', 'cell', 'phone number', 'phone no', 'mobile no', 'mobile number', 'contact number', 'contact no'] },
  { key: 'aadhaar', label: 'Aadhaar Card', keywords: ['aadhar', 'aadhaar', 'id', 'identity', 'card', 'aadhaar card', 'aadhar card', 'national id', 'uid', 'uidai'] },
  { key: 'roomNumber', label: 'Room Number (Required)', keywords: ['room', 'roomno', 'room number', 'room_no', 'room_number', 'room no'] },
  { key: 'bedNumber', label: 'Bed Number (Required)', keywords: ['bed', 'bedno', 'bed number', 'bed_no', 'bed_number', 'bed no'] },
  { key: 'monthlyRent', label: 'Monthly Rent', keywords: ['rent', 'monthly', 'price', 'amount', 'monthly rent', 'monthly_rent', 'rent amount', 'rent price'] },
  { key: 'deposit', label: 'Security Deposit', keywords: ['deposit', 'security', 'advance', 'security deposit', 'deposit amount', 'caution deposit'] },
  { key: 'joiningDate', label: 'Joining Date', keywords: ['date', 'joining', 'join', 'checkin', 'start', 'joining date', 'date of joining', 'date_of_joining', 'check-in', 'admission date'] },
  { key: 'emergencyContact', label: 'Emergency Contact', keywords: ['emergency', 'parent', 'father', 'guardian', 'next of kin', 'emergency contact', 'emergency no', 'emergency number'] },
  { key: 'remarks', label: 'Remarks', keywords: ['remarks', 'notes', 'comment', 'remark', 'description'] }
];

export default function TenantView() {
  const { 
    tenants, 
    rooms, 
    transactions,
    addTenant, 
    editTenant, 
    deleteTenant,
    bulkImportTenants
  } = useAdmin();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [roomFilter, setRoomFilter] = useState('');
  const [rentFilter, setRentFilter] = useState('All'); // All, Paid, Pending, Late

  // Modal controls
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeTenant, setActiveTenant] = useState(null);

  // Bulk import states
  const [showImportModal, setShowImportModal] = useState(false);
  const [importStep, setImportStep] = useState(1); // 1: upload, 2: mapping, 3: preview, 4: complete
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [mapping, setMapping] = useState({});
  const [autoAssignOccupiedBeds, setAutoAssignOccupiedBeds] = useState(true);
  const [parsedRecords, setParsedRecords] = useState([]);
  const [importSummary, setImportSummary] = useState(null);

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

  // Bulk Import Handlers
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
        
        if (data.length === 0) {
          alert('The uploaded sheet is empty!');
          return;
        }

        // Clean headers and rows (filter out fully empty rows)
        const fileHeaders = data[0].map(h => (h || '').toString().trim());
        const fileRows = data.slice(1).filter(row => row && row.some(val => val !== null && val !== undefined && val !== ''));

        setHeaders(fileHeaders);
        setRows(fileRows);
        
        // Auto-mapping logic
        const initialMap = {};
        WEB_FIELDS.forEach(field => {
          const matchedHeader = fileHeaders.find(h => 
            field.keywords.some(k => h.toLowerCase().includes(k.toLowerCase()))
          );
          initialMap[field.key] = matchedHeader || '';
        });
        setMapping(initialMap);
        setImportStep(2); // Move to Mapping Step
      } catch (err) {
        console.error('Error parsing sheet:', err);
        alert('Failed to parse file. Please upload a valid Excel or CSV file.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleMapSubmit = () => {
    const parsed = [];
    const nameIdx = headers.indexOf(mapping.name);
    const phoneIdx = headers.indexOf(mapping.phone);
    const aadhaarIdx = headers.indexOf(mapping.aadhaar);
    const roomIdx = headers.indexOf(mapping.roomNumber);
    const bedIdx = headers.indexOf(mapping.bedNumber);
    const rentIdx = headers.indexOf(mapping.monthlyRent);
    const depositIdx = headers.indexOf(mapping.deposit);
    const dateIdx = headers.indexOf(mapping.joiningDate);
    const emergencyIdx = headers.indexOf(mapping.emergencyContact);
    const remarksIdx = headers.indexOf(mapping.remarks);

    rows.forEach((row, idx) => {
      if (row.length === 0 || !row[nameIdx]) return;

      const tenantName = row[nameIdx]?.toString().trim();
      let rawRoomNum = row[roomIdx]?.toString().trim();
      let rawBedNum = row[bedIdx]?.toString().trim();

      // Find matching room
      let matchedRoom = rooms.find(r => r.number.toString().trim() === rawRoomNum);
      let matchedBed = null;
      let status = 'Ready';
      let error = '';

      if (!rawRoomNum) {
        status = 'Error';
        error = 'Missing Room Number';
      } else if (!matchedRoom) {
        status = 'Error';
        error = `Room ${rawRoomNum} not found`;
      } else if (!rawBedNum) {
        status = 'Error';
        error = 'Missing Bed Number';
      } else {
        // Find matching bed
        matchedBed = matchedRoom.beds.find(b => b.number.toString().trim() === rawBedNum);
        if (!matchedBed) {
          status = 'Error';
          error = `Bed ${rawBedNum} not found in Room ${rawRoomNum}`;
        } else if (matchedBed.status === 'Occupied') {
          if (autoAssignOccupiedBeds) {
            // Find another available bed in the SAME room
            let altBed = matchedRoom.beds.find(b => b.status === 'Available');
            
            // If not in the same room, find an available bed on the SAME floor (matching first digit)
            if (!altBed) {
              const floorPrefix = rawRoomNum[0];
              const floorRooms = rooms.filter(r => r.number.startsWith(floorPrefix));
              for (let fr of floorRooms) {
                altBed = fr.beds.find(b => b.status === 'Available');
                if (altBed) {
                  matchedBed = altBed;
                  rawRoomNum = fr.number;
                  matchedRoom = fr;
                  status = 'Auto-Assigning';
                  error = `Bed occupied; allocated to Room ${fr.number} Bed ${altBed.number}`;
                  break;
                }
              }
            } else {
              matchedBed = altBed;
              status = 'Auto-Assigning';
              error = `Bed occupied; allocated to Bed ${altBed.number}`;
            }

            if (status !== 'Auto-Assigning') {
              status = 'Error';
              error = `Room ${rawRoomNum} is full; no other beds available on Floor ${rawRoomNum[0]}`;
            }
          } else {
            status = 'Error';
            error = `Bed ${rawBedNum} is occupied`;
          }
        }
      }

      parsed.push({
        rowIdx: idx + 2, // 1-indexed spreadsheet row offset (headers are row 1)
        name: tenantName,
        phone: phoneIdx !== -1 && row[phoneIdx] ? row[phoneIdx].toString().trim() : 'N/A',
        aadhaar: aadhaarIdx !== -1 && row[aadhaarIdx] ? row[aadhaarIdx].toString().trim() : 'N/A',
        roomNumber: rawRoomNum,
        roomId: matchedRoom ? matchedRoom.id : '',
        bedNumber: matchedBed ? matchedBed.number : rawBedNum,
        bedId: matchedBed ? matchedBed.id : '',
        monthlyRent: rentIdx !== -1 && row[rentIdx] ? parseInt(row[rentIdx]) : (matchedRoom ? matchedRoom.price : 8000),
        deposit: depositIdx !== -1 && row[depositIdx] ? parseInt(row[depositIdx]) : 2000,
        joiningDate: dateIdx !== -1 && row[dateIdx] ? row[dateIdx].toString().trim() : new Date().toISOString().split('T')[0],
        emergencyContact: emergencyIdx !== -1 && row[emergencyIdx] ? row[emergencyIdx].toString().trim() : 'N/A',
        remarks: remarksIdx !== -1 && row[remarksIdx] ? row[remarksIdx].toString().trim() : 'Imported via Excel',
        status,
        error
      });
    });

    setParsedRecords(parsed);
    setImportStep(3); // Move to Preview Step
  };

  const handleExecuteImport = () => {
    const importable = parsedRecords.filter(r => r.status === 'Ready' || r.status === 'Auto-Assigning');
    
    if (importable.length === 0) {
      alert('No valid records to import! Please fix mapping or validation errors.');
      return;
    }

    const res = bulkImportTenants(importable);
    if (res.success) {
      setImportSummary({
        successCount: res.count,
        totalTried: parsedRecords.length,
        skippedCount: parsedRecords.length - res.count
      });
      setImportStep(4); // Move to Summary Step
    } else {
      alert('Import failed: ' + res.message);
    }
  };

  const resetImportWizard = () => {
    setShowImportModal(false);
    setImportStep(1);
    setHeaders([]);
    setRows([]);
    setMapping({});
    setParsedRecords([]);
    setImportSummary(null);
    
    // Force reload page to ensure all views (Dashboard, Rooms, Tenants) sync up cleanly
    window.location.reload();
  };

  const getAvatarInitials = (name) => {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '??';
    return parts.slice(0, 2).map(n => n[0].toUpperCase()).join('');
  };

  const downloadImportTemplate = () => {
    const headers = [
      'Tenant Name',
      'Phone Number',
      'Aadhaar Card',
      'Room Number',
      'Bed Number',
      'Monthly Rent',
      'Security Deposit',
      'Joining Date',
      'Emergency Contact',
      'Remarks'
    ];

    const wsData = [headers];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // Bold the headers by setting cell styles metadata (r: 0 is first row)
    headers.forEach((h, i) => {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: i });
      if (ws[cellRef]) {
        ws[cellRef].s = {
          font: {
            bold: true,
            name: 'Calibri',
            sz: 11
          }
        };
      }
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Tenants Template');
    XLSX.writeFile(wb, 'tenant_import_template.xlsx');
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
    const custIdStr = tenant.customerId || tenant.id || '';
    const matchesSearch = custIdStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
        <div className="view-header-actions" style={{ display: 'flex', gap: '10px' }}>
          <button className="primary" onClick={() => setShowImportModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2 2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span>Bulk Import</span>
          </button>
          <button className="primary" onClick={() => setShowAddModal(true)}>
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Add Tenant</span>
          </button>
        </div>
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
            placeholder="Search tenant by Customer ID, name, phone, Aadhaar..."
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
            <label>Rent Payment</label>
            <select value={rentFilter} onChange={(e) => setRentFilter(e.target.value)}>
              <option value="All">All Statuses</option>
              <option value="Paid">Cleared / Paid</option>
              <option value="Pending">Pending</option>
              <option value="Late">Overdue / Late</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tenant Table Container */}
      <div className="table-responsive-wrapper glass-card">
        <table className="admin-data-table">
          <thead>
            <tr>
              <th>Customer ID</th>
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
                  <td data-label="Customer ID">
                    <span style={{ display: 'inline-block', padding: '3px 8px', background: 'rgba(37, 99, 235, 0.1)', color: '#2563EB', border: '1px solid rgba(37, 99, 235, 0.2)', borderRadius: '6px', fontSize: '11px', fontWeight: '800', letterSpacing: '0.4px', fontFamily: 'monospace' }}>
                      {tenant.customerId || tenant.id}
                    </span>
                  </td>
                  <td data-label="Tenant" onClick={() => openEdit(tenant)} style={{ cursor: 'pointer' }} className="clickable-tenant-cell">
                    <div className="tenant-profile-td">
                      <div className="avatar-placeholder">
                        {getAvatarInitials(tenant.name)}
                      </div>
                      <div className="tenant-meta-td">
                        <span className="tenant-name-span" style={{ color: 'var(--primary)', fontWeight: '600' }}>{tenant.name}</span>
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
              <h2>Edit Profile: {activeTenant?.name} <span style={{ fontSize: '14px', color: '#2563EB', background: 'rgba(37, 99, 235, 0.1)', padding: '2px 8px', borderRadius: '6px', marginLeft: '6px', fontFamily: 'monospace' }}>{activeTenant?.customerId || activeTenant?.id}</span></h2>
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

      {/* Bulk Import Modal */}
      {showImportModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card large-modal animate-fade-in bulk-import-modal">
            <div className="modal-header">
              <h2>Bulk Import Tenants</h2>
              <button className="close-modal-btn" onClick={resetImportWizard}>&times;</button>
            </div>
            
            {/* Step Indicators */}
            <div className="wizard-progress-bar">
              <div className={`step-dot ${importStep >= 1 ? 'active' : ''}`}>1<span>Upload</span></div>
              <div className="step-line"></div>
              <div className={`step-dot ${importStep >= 2 ? 'active' : ''}`}>2<span>Map Columns</span></div>
              <div className="step-line"></div>
              <div className={`step-dot ${importStep >= 3 ? 'active' : ''}`}>3<span>Validate</span></div>
              <div className="step-line"></div>
              <div className={`step-dot ${importStep >= 4 ? 'active' : ''}`}>4<span>Done</span></div>
            </div>

            {/* STEP 1: UPLOAD FILE */}
            {importStep === 1 && (
              <div className="wizard-step-content upload-step">
                <p className="step-desc text-muted">Upload an Excel (.xlsx, .xls) or CSV sheet. Ensure it contains details of guests like their name, room number, and bed number.</p>
                <div className="file-dropzone glass-card">
                  <svg viewBox="0 0 24 24" width="48" height="48" stroke="var(--primary)" strokeWidth="1.5" fill="none" className="upload-icon">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <label htmlFor="xlsx-file-input" className="file-input-label">
                    <span>Choose Excel/CSV File</span>
                    <input 
                      id="xlsx-file-input" 
                      type="file" 
                      accept=".xlsx, .xls, .csv" 
                      onChange={handleFileUpload} 
                      style={{ display: 'none' }}
                    />
                  </label>
                  <span className="file-formats-text">Supports .xlsx, .xls, .csv files</span>
                  <div className="template-download-divider" style={{ width: '60%', height: '1px', background: 'var(--border)', margin: '12px 0' }}></div>
                  <button type="button" className="btn-secondary" onClick={downloadImportTemplate} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '12.5px', borderRadius: '10px' }}>
                    <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    <span>Download Excel Template</span>
                  </button>
                </div>
                <div className="sample-template-box glass-card">
                  <h4>💡 Suggested Columns for Import:</h4>
                  <ul>
                    <li><code>Tenant Name</code> (Required)</li>
                    <li><code>Room No</code> (Required, matching room number)</li>
                    <li><code>Bed No</code> (Required, matching bed number)</li>
                    <li><code>Phone Number</code>, <code>Aadhaar Card</code>, <code>Rent</code>, <code>Deposit</code>, <code>Joining Date</code></li>
                  </ul>
                </div>
              </div>
            )}

            {/* STEP 2: COLUMN MAPPING */}
            {importStep === 2 && (
              <div className="wizard-step-content mapping-step">
                <p className="step-desc text-muted">Map Sri Venkateswara website fields (left) with the headers from your Excel columns (right).</p>
                <div className="mapping-grid glass-card">
                  {WEB_FIELDS.map(field => {
                    const isRequired = field.key === 'name' || field.key === 'roomNumber' || field.key === 'bedNumber';
                    return (
                      <div className="mapping-row" key={field.key}>
                        <label className="mapping-label">
                          {field.label}
                          {isRequired && <span className="req-star">*</span>}
                        </label>
                        <div className="mapping-select-wrapper">
                          <select
                            value={mapping[field.key] || ''}
                            onChange={(e) => setMapping(prev => ({ ...prev, [field.key]: e.target.value }))}
                            required={isRequired}
                            className="mapping-select"
                          >
                            <option value="">-- Do Not Map --</option>
                            {headers.map(h => (
                              <option key={h} value={h}>{h}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Mapping Live Preview (First 3 Rows) */}
                <div className="mapping-preview-container">
                  <h4>Sheet Preview (First 3 Rows)</h4>
                  <div className="table-responsive-wrapper mini-table">
                    <table className="admin-data-table">
                      <thead>
                        <tr>
                          {headers.map(h => <th key={h}>{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.slice(0, 3).map((row, rIdx) => (
                          <tr key={rIdx}>
                            {headers.map((h, cIdx) => (
                              <td key={cIdx}>{row[cIdx]?.toString() || '-'}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn-cancel" onClick={() => setImportStep(1)}>Back</button>
                  <button 
                    type="button" 
                    className="primary"
                    onClick={handleMapSubmit}
                    disabled={!mapping.name || !mapping.roomNumber || !mapping.bedNumber}
                  >
                    Next to Preview & Validate
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: PREVIEW & VALIDATION */}
            {importStep === 3 && (
              <div className="wizard-step-content preview-step">
                <p className="step-desc text-muted">Verify the parsed customer list. Any rows containing errors (red) will be skipped. Rows marked with "Auto-Assigning" (orange) will occupy alternative vacant beds.</p>
                
                <div className="import-options-row glass-card">
                  <label className="checkbox-option" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={autoAssignOccupiedBeds} 
                      onChange={(e) => {
                        setAutoAssignOccupiedBeds(e.target.checked);
                        // Re-trigger map submit validation with updated checkbox state
                        setTimeout(handleMapSubmit, 50);
                      }}
                    />
                    <span>Auto-assign occupied beds to alternative vacant beds on the same room/floor</span>
                  </label>
                </div>

                <div className="validation-records-container table-responsive-wrapper mini-table" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                  <table className="admin-data-table">
                    <thead>
                      <tr>
                        <th>Row</th>
                        <th>Name</th>
                        <th>Room No</th>
                        <th>Bed No</th>
                        <th>Rent</th>
                        <th>Deposit</th>
                        <th>Status</th>
                        <th>Log/Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedRecords.map((rec, idx) => (
                        <tr key={idx} className={`validation-row ${rec.status.toLowerCase()}`}>
                          <td>{rec.rowIdx}</td>
                          <td><strong>{rec.name}</strong></td>
                          <td>Room {rec.roomNumber}</td>
                          <td>Bed {rec.bedNumber}</td>
                          <td>{formatCurrency(rec.monthlyRent)}</td>
                          <td>{formatCurrency(rec.deposit)}</td>
                          <td>
                            <span className={`status-badge ${
                              rec.status === 'Ready' ? 'green' : 
                              rec.status === 'Auto-Assigning' ? 'orange' : 'red'
                            }`}>{rec.status}</span>
                          </td>
                          <td className="error-log-td text-muted">{rec.error || 'Looks good!'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn-cancel" onClick={() => setImportStep(2)}>Back to Map</button>
                  <button 
                    type="button" 
                    className="primary"
                    onClick={handleExecuteImport}
                  >
                    Start Import ({parsedRecords.filter(r => r.status === 'Ready' || r.status === 'Auto-Assigning').length} records)
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: SUMMARY & COMPLETE */}
            {importStep === 4 && (
              <div className="wizard-step-content summary-step">
                <div className="summary-success-box glass-card" style={{ textAlign: 'center', padding: '30px 10px' }}>
                  <div className="success-icon-circle" style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(var(--primary-rgb), 0.1)', color: 'var(--primary)', display: 'grid', placeItems: 'center', fontSize: '24px', margin: '0 auto 16px auto', fontWeight: 'bold' }}>✓</div>
                  <h3>Bulk Import Completed!</h3>
                  <div className="summary-stats-grid" style={{ display: 'flex', justifyContent: 'center', gap: '24px', margin: '24px 0' }}>
                    <div className="stat-item" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span className="stat-val" style={{ fontSize: '24px', fontWeight: '800', color: 'var(--primary)' }}>{importSummary?.successCount}</span>
                      <span className="stat-label text-muted" style={{ fontSize: '12px' }}>Imported</span>
                    </div>
                    <div className="stat-item" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span className="stat-val skipped" style={{ fontSize: '24px', fontWeight: '800', color: '#e74c3c' }}>{importSummary?.skippedCount}</span>
                      <span className="stat-label text-muted" style={{ fontSize: '12px' }}>Skipped</span>
                    </div>
                    <div className="stat-item" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span className="stat-val" style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text)' }}>{importSummary?.totalTried}</span>
                      <span className="stat-label text-muted" style={{ fontSize: '12px' }}>Total Evaluated</span>
                    </div>
                  </div>
                </div>
                <div className="modal-actions" style={{ justifyContent: 'center' }}>
                  <button type="button" className="primary large" onClick={resetImportWizard}>Finish & View Registry</button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}

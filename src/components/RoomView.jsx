import React, { useState } from 'react';
import { useAdmin } from './AdminContext';

export default function RoomView() {
  const { 
    rooms, 
    addRoom, 
    editRoom, 
    deleteRoom, 
    addBed, 
    removeBed, 
    updateBedStatus,
    tenants,
    moveTenant
  } = useAdmin();

  // Modal control states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [activeRoom, setActiveRoom] = useState(null);
  const [activeBed, setActiveBed] = useState(null);
  
  // Form fields
  const [roomNumber, setRoomNumber] = useState('');
  const [roomType, setRoomType] = useState('Double Sharing');
  const [roomPrice, setRoomPrice] = useState('');
  const [roomBeds, setRoomBeds] = useState('2');

  // Move tenant states
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [targetRoomId, setTargetRoomId] = useState('');
  const [targetBedId, setTargetBedId] = useState('');
  const [activeFloor, setActiveFloor] = useState('1');
  const [expandedRooms, setExpandedRooms] = useState({});

  const toggleRoomExpand = (roomId) => {
    setExpandedRooms(prev => ({ ...prev, [roomId]: !prev[roomId] }));
  };

  // Handle Add Room Submit
  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!roomNumber) return;
    
    addRoom({
      number: roomNumber,
      type: roomType,
      price: roomPrice,
      numberOfBeds: roomBeds
    });

    // Reset & Close
    setRoomNumber('');
    setRoomType('Double Sharing');
    setRoomPrice('');
    setRoomBeds('2');
    setShowAddModal(false);
  };

  // Open Edit Modal
  const openEdit = (room) => {
    setActiveRoom(room);
    setRoomNumber(room.number);
    setRoomType(room.type);
    setRoomPrice(room.price.toString());
    setRoomBeds(room.beds.length.toString());
    setShowEditModal(true);
  };

  // Handle Edit Submit
  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!activeRoom || !roomNumber) return;
    
    editRoom(activeRoom.id, {
      number: roomNumber,
      type: roomType,
      price: roomPrice,
      numberOfBeds: roomBeds
    });

    setShowEditModal(false);
    setActiveRoom(null);
  };

  // Open Move Tenant Modal
  const openMoveTenant = (room, bed) => {
    setActiveRoom(room);
    setActiveBed(bed);
    
    // Find tenant currently in this bed
    const currentTenant = tenants.find(t => t.roomId === room.id && t.bedId === bed.id);
    if (currentTenant) {
      setSelectedTenantId(currentTenant.id);
    } else {
      setSelectedTenantId('');
    }
    
    setTargetRoomId('');
    setTargetBedId('');
    setShowMoveModal(true);
  };

  // Handle Move Submit
  const handleMoveSubmit = (e) => {
    e.preventDefault();
    if (!selectedTenantId || !targetRoomId || !targetBedId) return;

    moveTenant(selectedTenantId, targetRoomId, targetBedId);
    
    setShowMoveModal(false);
    setSelectedTenantId('');
    setTargetRoomId('');
    setTargetBedId('');
  };

  // Helpers
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
          <h1>Rooms Management</h1>
          <p>Create, manage rooms, configure bed allotments, and track occupancy.</p>
        </div>
        <button className="primary" onClick={() => setShowAddModal(true)}>
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Add Room</span>
        </button>
      </div>

      {/* Floor Filter Tabs */}
      <div className="reports-selector-tabs glass-card" style={{ marginBottom: '28px' }}>
        {['1', '2', '3', '4', '5', '6'].map(floorNum => (
          <button
            key={floorNum}
            className={`report-tab-btn ${activeFloor === floorNum ? 'active' : ''}`}
            onClick={() => setActiveFloor(floorNum)}
          >
            {floorNum === '1' ? '1st Floor' : 
             floorNum === '2' ? '2nd Floor' : 
             floorNum === '3' ? '3rd Floor' : 
             floorNum === '4' ? '4th Floor' : 
             floorNum === '5' ? '5th Floor' : '6th Floor'}
          </button>
        ))}
      </div>

      {/* Rooms Grid */}
      <div className="rooms-management-grid">
        {rooms
          .filter(room => {
            const floorChar = room.number.charAt(0);
            return floorChar === activeFloor;
          })
          .map(room => {
            const totalBeds = room.beds.length;
          const occupiedCount = room.beds.filter(b => b.status === 'Occupied').length;
          const availableCount = room.beds.filter(b => b.status === 'Available').length;
          
          // Calculate monthly income from active tenants in this room
          let roomIncome = 0;
          room.beds.forEach(bed => {
            if (bed.status === 'Occupied') {
              const tenant = tenants.find(t => t.id === bed.tenantId);
              if (tenant) roomIncome += tenant.monthlyRent;
            }
          });

          return (
            <div key={room.id} className="room-mgmt-card glass-card">
              <div className="room-mgmt-header">
                <div>
                  <span className="room-mgmt-number">Room {room.number}</span>
                  <span className="room-mgmt-type">{room.type}</span>
                </div>
                <div className="room-actions-dropdown">
                  <button 
                    className="room-expand-toggle-btn" 
                    onClick={() => toggleRoomExpand(room.id)}
                    title={expandedRooms[room.id] ? "Collapse Bed Details" : "Expand Bed Details"}
                  >
                    <svg 
                      viewBox="0 0 24 24" 
                      width="16" 
                      height="16" 
                      stroke="currentColor" 
                      strokeWidth="2.5" 
                      fill="none"
                      style={{ transform: expandedRooms[room.id] ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  <button className="icon-btn-edit" onClick={() => openEdit(room)} title="Edit Room">
                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button className="icon-btn-delete" onClick={() => deleteRoom(room.id)} title="Delete Room">
                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="room-mgmt-details">
                <div className="detail-row">
                  <span>Price per bed:</span>
                  <strong>{formatCurrency(room.price)}</strong>
                </div>
                <div className="detail-row">
                  <span>Monthly Revenue:</span>
                  <strong style={{ color: '#27ae60' }}>{formatCurrency(roomIncome)}</strong>
                </div>
                <div className="detail-row">
                  <span>Total Beds:</span>
                  <strong>{totalBeds}</strong>
                </div>
                <div className="detail-row">
                  <span>allotment:</span>
                  <div className="badge-row">
                    <span className="count-badge occupied">{occupiedCount} Occ</span>
                    <span className="count-badge available">{availableCount} Avail</span>
                  </div>
                </div>
              </div>

              {/* Visual Bed Layout Grid */}
              <div className={`bed-layout-section ${expandedRooms[room.id] ? 'mobile-expanded' : 'mobile-collapsed'}`}>
                <h4>Beds Layout</h4>
                <div className="bed-icon-grid">
                  {room.beds.map(bed => {
                    const tenant = tenants.find(t => t.id === bed.tenantId);
                    let bedClass = 'bed-avail';
                    let bedStatusText = 'Available';
                    if (bed.status === 'Occupied') {
                      bedClass = 'bed-occ';
                      bedStatusText = tenant ? tenant.name : 'Occupied';
                    }

                    return (
                      <div key={bed.id} className={`bed-item-wrapper ${bedClass}`}>
                        <div className="bed-card-main">
                          <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
                            <path d="M2 22V14M22 22V12M2 14h20M2 18h20M6 10h12M6 6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4H6V6z" />
                          </svg>
                          <div className="bed-card-info">
                            <span className="bed-label-num">Bed {bed.number}</span>
                            <span className="bed-tenant-name" title={bedStatusText}>{bedStatusText}</span>
                          </div>
                        </div>
                        
                        {/* Bed Quick Actions */}
                        <div className="bed-quick-actions">
                          {bed.status === 'Available' && (
                            <button 
                              className="bed-action-btn fill" 
                              onClick={() => updateBedStatus(room.id, bed.id, 'Occupied')}
                              title="Mark Occupied"
                            >
                              Fill
                            </button>
                          )}
                          {bed.status === 'Occupied' && (
                            <>
                              <button 
                                className="bed-action-btn empty" 
                                onClick={() => updateBedStatus(room.id, bed.id, 'Available')}
                                title="Mark Empty"
                              >
                                Empty
                              </button>
                              <button 
                                className="bed-action-btn move" 
                                onClick={() => openMoveTenant(room, bed)}
                                title="Move Tenant"
                              >
                                Move
                              </button>
                            </>
                          )}

                          <button 
                            className="bed-action-btn remove" 
                            onClick={() => removeBed(room.id, bed.id)}
                            title="Remove Bed"
                          >
                            &times;
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Plus Bed Button */}
                  <button className="add-bed-dash-btn" onClick={() => addBed(room.id)} title="Add Bed to Room">
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.5" fill="none">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    <span>Add Bed</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* -------------------- MODALS -------------------- */}

      {/* Add Room Modal */}
      {showAddModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card animate-fade-in">
            <div className="modal-header">
              <h2>Add New Room</h2>
              <button className="close-modal-btn" onClick={() => setShowAddModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleAddSubmit} className="modal-form">
              <div className="form-group">
                <input
                  type="text"
                  placeholder=" "
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  required
                />
                <label>Room Number (e.g. 106)</label>
              </div>
              <div className="form-group-select">
                <label>Room Type</label>
                <select value={roomType} onChange={(e) => setRoomType(e.target.value)}>
                  <option value="Single Sharing">Single Sharing</option>
                  <option value="Double Sharing">Double Sharing</option>
                  <option value="Triple Sharing">Triple Sharing</option>
                </select>
              </div>
              <div className="form-group">
                <input
                  type="number"
                  placeholder=" "
                  value={roomPrice}
                  onChange={(e) => setRoomPrice(e.target.value)}
                  required
                />
                <label>Monthly Price Per Bed (₹)</label>
              </div>
              <div className="form-group">
                <input
                  type="number"
                  placeholder=" "
                  min="1"
                  max="6"
                  value={roomBeds}
                  onChange={(e) => setRoomBeds(e.target.value)}
                  required
                />
                <label>Initial Number of Beds</label>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="primary">Create Room</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Room Modal */}
      {showEditModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card animate-fade-in">
            <div className="modal-header">
              <h2>Edit Room {activeRoom?.number}</h2>
              <button className="close-modal-btn" onClick={() => setShowEditModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleEditSubmit} className="modal-form">
              <div className="form-group">
                <input
                  type="text"
                  placeholder=" "
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  required
                />
                <label>Room Number</label>
              </div>
              <div className="form-group-select">
                <label>Room Type</label>
                <select value={roomType} onChange={(e) => setRoomType(e.target.value)}>
                  <option value="Single Sharing">Single Sharing</option>
                  <option value="Double Sharing">Double Sharing</option>
                  <option value="Triple Sharing">Triple Sharing</option>
                </select>
              </div>
              <div className="form-group">
                <input
                  type="number"
                  placeholder=" "
                  value={roomPrice}
                  onChange={(e) => setRoomPrice(e.target.value)}
                  required
                />
                <label>Monthly Price Per Bed (₹)</label>
              </div>
              <div className="form-group">
                <input
                  type="number"
                  placeholder=" "
                  min="1"
                  value={roomBeds}
                  onChange={(e) => setRoomBeds(e.target.value)}
                  required
                />
                <label>Configured Bed Count</label>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button type="submit" className="primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Move Tenant Modal */}
      {showMoveModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card animate-fade-in">
            <div className="modal-header">
              <h2>Move Tenant</h2>
              <button className="close-modal-btn" onClick={() => setShowMoveModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleMoveSubmit} className="modal-form">
              <div className="form-group-select">
                <label>Tenant to Transfer</label>
                <select 
                  value={selectedTenantId} 
                  onChange={(e) => setSelectedTenantId(e.target.value)}
                  disabled={true}
                >
                  <option value="">Select Tenant</option>
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>{t.name} (Room {t.roomNumber})</option>
                  ))}
                </select>
              </div>

              <div className="form-group-select">
                <label>Target Room</label>
                <select 
                  value={targetRoomId} 
                  onChange={(e) => {
                    setTargetRoomId(e.target.value);
                    setTargetBedId('');
                  }}
                  required
                >
                  <option value="">Select Target Room</option>
                  {rooms.map(r => (
                    <option key={r.id} value={r.id}>Room {r.number} ({r.type})</option>
                  ))}
                </select>
              </div>

              {targetRoomId && (
                <div className="form-group-select">
                  <label>Target Bed</label>
                  <select 
                    value={targetBedId} 
                    onChange={(e) => setTargetBedId(e.target.value)}
                    required
                  >
                    <option value="">Select Target Bed</option>
                    {rooms.find(r => r.id === targetRoomId)?.beds
                      .filter(b => b.status === 'Available')
                      .map(b => (
                        <option key={b.id} value={b.id}>Bed {b.number} (Available)</option>
                      ))
                    }
                  </select>
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowMoveModal(false)}>Cancel</button>
                <button 
                  type="submit" 
                  className="primary" 
                  disabled={!selectedTenantId || !targetRoomId || !targetBedId}
                >
                  Transfer Tenant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { createContext, useContext, useState, useEffect } from 'react';

const AdminContext = createContext();

// Default Mock Data
const generateDefaultRooms = () => {
  const generated = [];
  
  // Floor 1 to 5 (each has 6 rooms)
  for (let floor = 1; floor <= 5; floor++) {
    for (let r = 1; r <= 6; r++) {
      const roomNum = `${floor}0${r}`;
      generated.push(createRoomTemplate(roomNum));
    }
  }
  
  // Floor 6 (has 2 rooms)
  generated.push(createRoomTemplate('601'));
  generated.push(createRoomTemplate('602'));
  
  return generated;
};

const createRoomTemplate = (roomNum) => {
  const lastDigit = parseInt(roomNum[2]);
  let type = 'Double Sharing';
  let price = 8000;
  let bedCount = 2;
  
  if (lastDigit === 1) {
    type = 'Single Sharing';
    price = 15000;
    bedCount = 1;
  } else if (lastDigit === 5 || lastDigit === 6) {
    type = 'Triple Sharing';
    price = 6000;
    bedCount = 3;
  }
  
  const beds = [];
  for (let b = 1; b <= bedCount; b++) {
    let status = 'Available';
    let tenantId = null;
    
    if (roomNum === '101' && b === 1) {
      status = 'Occupied';
      tenantId = 'tenant-1';
    } else if (roomNum === '102' && b === 1) {
      status = 'Occupied';
      tenantId = 'tenant-2';
    } else if (roomNum === '102' && b === 2) {
      status = 'Occupied';
      tenantId = 'tenant-3';
    } else if (roomNum === '103' && b === 1) {
      status = 'Occupied';
      tenantId = 'tenant-4';
    } else if (roomNum === '104' && b === 1) {
      status = 'Occupied';
      tenantId = 'tenant-5';
    }
    
    beds.push({
      id: `bed-${roomNum}-${b}`,
      number: `${b}`,
      status,
      tenantId
    });
  }
  
  return {
    id: `room-${roomNum}`,
    number: roomNum,
    type,
    price,
    beds
  };
};

const defaultRooms = generateDefaultRooms();

const defaultTenants = [
  {
    id: 'tenant-1',
    name: 'Aaditya Sharma',
    phone: '9876543210',
    aadhaar: '1234-5678-9012',
    roomId: 'room-101',
    roomNumber: '101',
    bedId: 'bed-101-1',
    bedNumber: '1',
    joiningDate: '2026-01-10',
    advancePaid: 5000,
    monthlyRent: 15000,
    deposit: 2000,
    emergencyContact: 'Ramesh Sharma (Father) - 9876543211',
    remarks: 'Quiet tenant, working professional.'
  },
  {
    id: 'tenant-2',
    name: 'Rahul Verma',
    phone: '8765432109',
    aadhaar: '2345-6789-0123',
    roomId: 'room-102',
    roomNumber: '102',
    bedId: 'bed-102-1',
    bedNumber: '1',
    joiningDate: '2026-02-15',
    advancePaid: 3000,
    monthlyRent: 8000,
    deposit: 2000,
    emergencyContact: 'Suman Verma (Mother) - 8765432100',
    remarks: 'Student at local college.'
  },
  {
    id: 'tenant-3',
    name: 'Amit Patel',
    phone: '7654321098',
    aadhaar: '3456-7890-1234',
    roomId: 'room-102',
    roomNumber: '102',
    bedId: 'bed-102-2',
    bedNumber: '2',
    joiningDate: '2026-03-01',
    advancePaid: 3000,
    monthlyRent: 8000,
    deposit: 2000,
    emergencyContact: 'Dinesh Patel (Uncle) - 7654321000',
    remarks: 'IT professional.'
  },
  {
    id: 'tenant-4',
    name: 'Sandeep Kumar',
    phone: '6543210987',
    aadhaar: '4567-8901-2345',
    roomId: 'room-103',
    roomNumber: '103',
    bedId: 'bed-103-1',
    bedNumber: '1',
    joiningDate: '2026-04-20',
    advancePaid: 2000,
    monthlyRent: 6000,
    deposit: 2000,
    emergencyContact: 'Sunita Devi (Mother) - 6543210900',
    remarks: 'Prepares for civil services.'
  },
  {
    id: 'tenant-5',
    name: 'Manoj Bajpayee',
    phone: '9988776655',
    aadhaar: '5678-9012-3456',
    roomId: 'room-104',
    roomNumber: '104',
    bedId: 'bed-104-1',
    bedNumber: '1',
    joiningDate: '2026-05-05',
    advancePaid: 4000,
    monthlyRent: 8000,
    deposit: 2000,
    emergencyContact: 'Gopal Bajpayee (Father) - 9988776600',
    remarks: 'Enjoys cooking, very friendly.'
  }
];

const defaultTransactions = [
  // June Payments (all paid)
  {
    id: 'tx-1-june',
    tenantId: 'tenant-1',
    tenantName: 'Aaditya Sharma',
    roomNumber: '101',
    bedNumber: '1',
    amount: 15000,
    dueDate: '2026-06-05',
    status: 'Paid',
    paymentDate: '2026-06-04',
    paymentMode: 'UPI',
    transactionId: 'TXN67123901',
    remarks: 'Paid on time.'
  },
  {
    id: 'tx-2-june',
    tenantId: 'tenant-2',
    tenantName: 'Rahul Verma',
    roomNumber: '102',
    bedNumber: '1',
    amount: 8000,
    dueDate: '2026-06-05',
    status: 'Paid',
    paymentDate: '2026-06-05',
    paymentMode: 'Cash',
    transactionId: 'CASH-JUNE-02',
    remarks: ''
  },
  {
    id: 'tx-3-june',
    tenantId: 'tenant-3',
    tenantName: 'Amit Patel',
    roomNumber: '102',
    bedNumber: '2',
    amount: 8000,
    dueDate: '2026-06-05',
    status: 'Paid',
    paymentDate: '2026-06-03',
    paymentMode: 'Net Banking',
    transactionId: 'NBTXN8812903',
    remarks: ''
  },
  {
    id: 'tx-4-june',
    tenantId: 'tenant-4',
    tenantName: 'Sandeep Kumar',
    roomNumber: '103',
    bedNumber: '1',
    amount: 6000,
    dueDate: '2026-06-05',
    status: 'Paid',
    paymentDate: '2026-06-07',
    paymentMode: 'UPI',
    transactionId: 'TXN67128892',
    remarks: 'Paid late with warning.'
  },
  {
    id: 'tx-5-june',
    tenantId: 'tenant-5',
    tenantName: 'Manoj Bajpayee',
    roomNumber: '104',
    bedNumber: '1',
    amount: 8000,
    dueDate: '2026-06-05',
    status: 'Paid',
    paymentDate: '2026-06-04',
    paymentMode: 'UPI',
    transactionId: 'TXN67129001',
    remarks: ''
  },
  // July Payments (mix of Paid, Pending, Late)
  {
    id: 'tx-1-july',
    tenantId: 'tenant-1',
    tenantName: 'Aaditya Sharma',
    roomNumber: '101',
    bedNumber: '1',
    amount: 15000,
    dueDate: '2026-07-05',
    status: 'Paid',
    paymentDate: '2026-07-04',
    paymentMode: 'UPI',
    transactionId: 'TXN77890123',
    remarks: 'Paid early.'
  },
  {
    id: 'tx-2-july',
    tenantId: 'tenant-2',
    tenantName: 'Rahul Verma',
    roomNumber: '102',
    bedNumber: '1',
    amount: 8000,
    dueDate: '2026-07-05',
    status: 'Pending',
    paymentDate: '',
    paymentMode: '',
    transactionId: '',
    remarks: 'Asked for extension till 10th.'
  },
  {
    id: 'tx-3-july',
    tenantId: 'tenant-3',
    tenantName: 'Amit Patel',
    roomNumber: '102',
    bedNumber: '2',
    amount: 8000,
    dueDate: '2026-07-05',
    status: 'Paid',
    paymentDate: '2026-07-05',
    paymentMode: 'Net Banking',
    transactionId: 'NBTXN990182',
    remarks: ''
  },
  {
    id: 'tx-4-july',
    tenantId: 'tenant-4',
    tenantName: 'Sandeep Kumar',
    roomNumber: '103',
    bedNumber: '1',
    amount: 6000,
    dueDate: '2026-07-05',
    status: 'Late',
    paymentDate: '',
    paymentMode: '',
    transactionId: '',
    remarks: 'No response to reminder.'
  },
  {
    id: 'tx-5-july',
    tenantId: 'tenant-5',
    tenantName: 'Manoj Bajpayee',
    roomNumber: '104',
    bedNumber: '1',
    amount: 8000,
    dueDate: '2026-07-05',
    status: 'Paid',
    paymentDate: '2026-07-06',
    paymentMode: 'UPI',
    transactionId: 'TXN77890456',
    remarks: '1 day late payment.'
  }
];

export const AdminProvider = ({ children }) => {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('admin_authenticated') === 'true';
  });

  const [adminProfile, setAdminProfile] = useState(() => {
    const saved = localStorage.getItem('admin_profile');
    return saved ? JSON.parse(saved) : { name: 'Owner Manager', username: 'admin' };
  });

  // DB States
  const [rooms, setRooms] = useState(() => {
    const saved = localStorage.getItem('db_rooms_v2');
    return saved ? JSON.parse(saved) : defaultRooms;
  });

  const [tenants, setTenants] = useState(() => {
    const saved = localStorage.getItem('db_tenants_v2');
    return saved ? JSON.parse(saved) : defaultTenants;
  });

  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem('db_transactions_v2');
    return saved ? JSON.parse(saved) : defaultTransactions;
  });

  // Persist states
  useEffect(() => {
    localStorage.setItem('admin_authenticated', isAuthenticated.toString());
  }, [isAuthenticated]);

  useEffect(() => {
    localStorage.setItem('admin_profile', JSON.stringify(adminProfile));
  }, [adminProfile]);

  useEffect(() => {
    localStorage.setItem('db_rooms_v2', JSON.stringify(rooms));
  }, [rooms]);

  useEffect(() => {
    localStorage.setItem('db_tenants_v2', JSON.stringify(tenants));
  }, [tenants]);

  useEffect(() => {
    localStorage.setItem('db_transactions_v2', JSON.stringify(transactions));
  }, [transactions]);

  // Auth Operations
  const login = (username, password) => {
    // Check credentials (stored in localStorage or default admin/admin123)
    const storedPassword = localStorage.getItem('admin_password') || 'admin123';
    if (username === adminProfile.username && password === storedPassword) {
      setIsAuthenticated(true);
      return { success: true };
    }
    return { success: false, message: 'Invalid username or password' };
  };

  const logout = () => {
    setIsAuthenticated(false);
  };

  const changePassword = (currentPassword, newPassword) => {
    const storedPassword = localStorage.getItem('admin_password') || 'admin123';
    if (currentPassword === storedPassword) {
      localStorage.setItem('admin_password', newPassword);
      return { success: true };
    }
    return { success: false, message: 'Current password is incorrect' };
  };

  const updateProfile = (name, username) => {
    setAdminProfile({ name, username });
    return { success: true };
  };

  // Rooms Operations
  const addRoom = (roomData) => {
    const newRoomId = `room-${Date.now()}`;
    const generatedBeds = [];
    for (let i = 1; i <= parseInt(roomData.numberOfBeds || 0); i++) {
      generatedBeds.push({
        id: `bed-${Date.now()}-${i}`,
        number: `${i}`,
        status: 'Available',
        tenantId: null
      });
    }
    const newRoom = {
      id: newRoomId,
      number: roomData.number,
      type: roomData.type,
      price: parseInt(roomData.price || 0),
      beds: generatedBeds
    };
    setRooms(prev => [...prev, newRoom]);
    return { success: true };
  };

  const editRoom = (roomId, roomData) => {
    setRooms(prev => prev.map(room => {
      if (room.id !== roomId) return room;
      
      // If number of beds changed, modify the beds array
      const targetBedsCount = parseInt(roomData.numberOfBeds || 0);
      let updatedBeds = [...room.beds];
      
      if (targetBedsCount > updatedBeds.length) {
        // Add beds
        for (let i = updatedBeds.length + 1; i <= targetBedsCount; i++) {
          updatedBeds.push({
            id: `bed-${roomId}-${i}-${Date.now()}`,
            number: `${i}`,
            status: 'Available',
            tenantId: null
          });
        }
      } else if (targetBedsCount < updatedBeds.length) {
        // Remove extra beds if not occupied
        const occupiedCount = updatedBeds.filter(b => b.status === 'Occupied').length;
        if (occupiedCount > targetBedsCount) {
          // Can't reduce beyond occupied count
          updatedBeds = updatedBeds.slice(0, occupiedCount);
        } else {
          updatedBeds = updatedBeds.slice(0, targetBedsCount);
        }
      }

      return {
        ...room,
        number: roomData.number,
        type: roomData.type,
        price: parseInt(roomData.price || 0),
        beds: updatedBeds
      };
    }));
    return { success: true };
  };

  const deleteRoom = (roomId) => {
    // Clear tenants inside this room
    setTenants(prev => prev.filter(t => t.roomId !== roomId));
    // Clear transactions associated with tenants of this room
    const roomTenantIds = tenants.filter(t => t.roomId === roomId).map(t => t.id);
    setTransactions(prev => prev.filter(tx => !roomTenantIds.includes(tx.tenantId)));
    // Delete room
    setRooms(prev => prev.filter(r => r.id !== roomId));
    return { success: true };
  };

  const addBed = (roomId) => {
    setRooms(prev => prev.map(room => {
      if (room.id !== roomId) return room;
      const nextNumber = room.beds.length + 1;
      const newBed = {
        id: `bed-${roomId}-${nextNumber}-${Date.now()}`,
        number: `${nextNumber}`,
        status: 'Available',
        tenantId: null
      };
      return {
        ...room,
        beds: [...room.beds, newBed]
      };
    }));
  };

  const removeBed = (roomId, bedId) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return { success: false, message: 'Room not found' };
    const bed = room.beds.find(b => b.id === bedId);
    if (bed && bed.status === 'Occupied') {
      return { success: false, message: 'Cannot remove an occupied bed' };
    }
    setRooms(prev => prev.map(r => {
      if (r.id !== roomId) return r;
      return {
        ...r,
        beds: r.beds.filter(b => b.id !== bedId)
      };
    }));
    return { success: true };
  };

  const updateBedStatus = (roomId, bedId, status) => {
    setRooms(prev => prev.map(room => {
      if (room.id !== roomId) return room;
      return {
        ...room,
        beds: room.beds.map(bed => {
          if (bed.id !== bedId) return bed;
          // Clear tenantId if marked Empty or Maintenance
          const clearTenant = status !== 'Occupied';
          return {
            ...bed,
            status,
            tenantId: clearTenant ? null : bed.tenantId
          };
        })
      };
    }));
    return { success: true };
  };

  // Tenants Operations
  const addTenant = (tenantData) => {
    const newTenantId = `tenant-${Date.now()}`;
    const room = rooms.find(r => r.id === tenantData.roomId);
    
    const newTenant = {
      id: newTenantId,
      name: tenantData.name,
      phone: tenantData.phone,
      aadhaar: tenantData.aadhaar,
      roomId: tenantData.roomId,
      roomNumber: room ? room.number : '',
      bedId: tenantData.bedId,
      bedNumber: tenantData.bedNumber,
      joiningDate: tenantData.joiningDate,
      advancePaid: parseInt(tenantData.advancePaid || 0),
      monthlyRent: parseInt(tenantData.monthlyRent || 0),
      deposit: parseInt(tenantData.deposit || 0),
      emergencyContact: tenantData.emergencyContact,
      remarks: tenantData.remarks
    };

    // Update bed status in rooms list
    setRooms(prev => prev.map(r => {
      if (r.id !== tenantData.roomId) return r;
      return {
        ...r,
        beds: r.beds.map(b => {
          if (b.id !== tenantData.bedId) return b;
          return { ...b, status: 'Occupied', tenantId: newTenantId };
        })
      };
    }));

    setTenants(prev => [...prev, newTenant]);

    // Create current month transaction automatically
    const currentMonthStr = new Date().toISOString().slice(0, 7); // e.g. "2026-07"
    const newTransaction = {
      id: `tx-${newTenantId}-${currentMonthStr}`,
      tenantId: newTenantId,
      tenantName: tenantData.name,
      roomNumber: room ? room.number : '',
      bedNumber: tenantData.bedNumber,
      amount: parseInt(tenantData.monthlyRent || 0),
      dueDate: `${currentMonthStr}-05`,
      status: 'Pending',
      paymentDate: '',
      paymentMode: '',
      transactionId: '',
      remarks: ''
    };
    setTransactions(prev => [newTransaction, ...prev]);

    return { success: true };
  };

  const editTenant = (tenantId, tenantData) => {
    setTenants(prev => prev.map(tenant => {
      if (tenant.id !== tenantId) return tenant;
      return {
        ...tenant,
        name: tenantData.name,
        phone: tenantData.phone,
        aadhaar: tenantData.aadhaar,
        emergencyContact: tenantData.emergencyContact,
        remarks: tenantData.remarks,
        monthlyRent: parseInt(tenantData.monthlyRent || 0),
        deposit: parseInt(tenantData.deposit || 0),
        advancePaid: parseInt(tenantData.advancePaid || 0)
      };
    }));

    // Update transactions associated with this tenant for name changes
    setTransactions(prev => prev.map(tx => {
      if (tx.tenantId !== tenantId) return tx;
      return {
        ...tx,
        tenantName: tenantData.name,
        amount: tx.status === 'Paid' ? tx.amount : parseInt(tenantData.monthlyRent || 0)
      };
    }));

    return { success: true };
  };

  const deleteTenant = (tenantId) => {
    const tenant = tenants.find(t => t.id === tenantId);
    if (!tenant) return { success: false, message: 'Tenant not found' };

    // Set assigned bed back to Available
    setRooms(prev => prev.map(r => {
      if (r.id !== tenant.roomId) return r;
      return {
        ...r,
        beds: r.beds.map(b => {
          if (b.id !== tenant.bedId) return b;
          return { ...b, status: 'Available', tenantId: null };
        })
      };
    }));

    // Remove transactions & tenant record
    setTransactions(prev => prev.filter(tx => tx.tenantId !== tenantId));
    setTenants(prev => prev.filter(t => t.id !== tenantId));

    return { success: true };
  };

  const moveTenant = (tenantId, newRoomId, newBedId) => {
    const tenant = tenants.find(t => t.id === tenantId);
    const oldRoomId = tenant.roomId;
    const oldBedId = tenant.bedId;

    const newRoom = rooms.find(r => r.id === newRoomId);
    const newBed = newRoom.beds.find(b => b.id === newBedId);

    // 1. Release old bed
    setRooms(prev => prev.map(r => {
      if (r.id === oldRoomId) {
        return {
          ...r,
          beds: r.beds.map(b => (b.id === oldBedId ? { ...b, status: 'Available', tenantId: null } : b))
        };
      }
      if (r.id === newRoomId) {
        return {
          ...r,
          beds: r.beds.map(b => (b.id === newBedId ? { ...b, status: 'Occupied', tenantId: tenantId } : b))
        };
      }
      return r;
    }));

    // 2. Update tenant record
    setTenants(prev => prev.map(t => {
      if (t.id !== tenantId) return t;
      return {
        ...t,
        roomId: newRoomId,
        roomNumber: newRoom.number,
        bedId: newBedId,
        bedNumber: newBed.number
      };
    }));

    // 3. Update active transactions
    setTransactions(prev => prev.map(tx => {
      if (tx.tenantId !== tenantId) return tx;
      return {
        ...tx,
        roomNumber: newRoom.number,
        bedNumber: newBed.number
      };
    }));

    return { success: true };
  };

  // Payments Operations
  const recordPayment = (txId, paymentDetails) => {
    setTransactions(prev => prev.map(tx => {
      if (tx.id !== txId) return tx;
      return {
        ...tx,
        status: 'Paid',
        paymentDate: paymentDetails.paymentDate,
        paymentMode: paymentDetails.paymentMode,
        transactionId: paymentDetails.transactionId,
        remarks: paymentDetails.remarks
      };
    }));
    return { success: true };
  };

  const updateRentStatus = (txId, status) => {
    setTransactions(prev => prev.map(tx => {
      if (tx.id !== txId) return tx;
      return {
        ...tx,
        status,
        // Reset details if moving to Pending/Late
        paymentDate: status === 'Paid' ? tx.paymentDate : '',
        paymentMode: status === 'Paid' ? tx.paymentMode : '',
        transactionId: status === 'Paid' ? tx.transactionId : ''
      };
    }));
  };

  // System Backup/Restore
  const backupData = () => {
    const data = {
      rooms,
      tenants,
      transactions,
      adminProfile
    };
    return JSON.stringify(data, null, 2);
  };

  const restoreData = (jsonData) => {
    try {
      const data = JSON.parse(jsonData);
      if (data.rooms && data.tenants && data.transactions) {
        setRooms(data.rooms);
        setTenants(data.tenants);
        setTransactions(data.transactions);
        if (data.adminProfile) setAdminProfile(data.adminProfile);
        return { success: true };
      }
      return { success: false, message: 'Invalid data format' };
    } catch (e) {
      return { success: false, message: 'JSON Parse Error' };
    }
  };

  return (
    <AdminContext.Provider value={{
      isAuthenticated,
      adminProfile,
      rooms,
      tenants,
      transactions,
      login,
      logout,
      changePassword,
      updateProfile,
      addRoom,
      editRoom,
      deleteRoom,
      addBed,
      removeBed,
      updateBedStatus,
      addTenant,
      editTenant,
      deleteTenant,
      moveTenant,
      recordPayment,
      updateRentStatus,
      backupData,
      restoreData
    }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => useContext(AdminContext);

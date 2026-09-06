import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';

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

const getRoomTypeAndPrice = (bedCount) => {
  if (bedCount === 1) {
    return { type: 'Single Sharing', price: 15000 };
  } else if (bedCount === 2) {
    return { type: 'Double Sharing', price: 8000 };
  } else if (bedCount === 3) {
    return { type: 'Triple Sharing', price: 6000 };
  } else if (bedCount >= 4) {
    return { type: 'Four Sharing', price: 5000 };
  }
  return { type: 'Unknown', price: 0 };
};

const createRoomTemplate = (roomNum) => {
  const lastDigit = parseInt(roomNum[2]);
  let bedCount = 2;
  
  if (lastDigit === 1) {
    bedCount = 1;
  } else if (lastDigit === 5 || lastDigit === 6) {
    bedCount = 3;
  }
  
  const { type, price } = getRoomTypeAndPrice(bedCount);
  
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
    customerId: 'CUST-1001',
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
    customerId: 'CUST-1002',
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
    customerId: 'CUST-1003',
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
    customerId: 'CUST-1004',
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
    customerId: 'CUST-1005',
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
    transactionId: 'CASH-REC-01',
    remarks: 'Handed over in person.'
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
    paymentMode: 'UPI',
    transactionId: 'UPI90812344',
    remarks: 'Google Pay transfer.'
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
    paymentDate: '2026-06-06',
    paymentMode: 'UPI',
    transactionId: 'TXN11223344',
    remarks: 'Paid via PhonePe.'
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
    paymentDate: '2026-06-05',
    paymentMode: 'NetBanking',
    transactionId: 'IMPS44556677',
    remarks: 'IMPS transfer from HDFC.'
  },

  // July Payments (Mixed status)
  {
    id: 'tx-1-july',
    tenantId: 'tenant-1',
    tenantName: 'Aaditya Sharma',
    roomNumber: '101',
    bedNumber: '1',
    amount: 15000,
    dueDate: '2026-07-05',
    status: 'Paid',
    paymentDate: '2026-07-03',
    paymentMode: 'UPI',
    transactionId: 'UPI88997711',
    remarks: 'Early payment discount applicable if any.'
  },
  {
    id: 'tx-2-july',
    tenantId: 'tenant-2',
    tenantName: 'Rahul Verma',
    roomNumber: '102',
    bedNumber: '1',
    amount: 8000,
    dueDate: '2026-07-05',
    status: 'Late',
    paymentDate: '',
    paymentMode: '',
    transactionId: '',
    remarks: 'Follow up required; phone was switched off.'
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
    paymentMode: 'UPI',
    transactionId: 'UPI44332211',
    remarks: 'Cleared dues on due date.'
  },
  {
    id: 'tx-4-july',
    tenantId: 'tenant-4',
    tenantName: 'Sandeep Kumar',
    roomNumber: '103',
    bedNumber: '1',
    amount: 6000,
    dueDate: '2026-07-05',
    status: 'Pending',
    paymentDate: '',
    paymentMode: '',
    transactionId: '',
    remarks: 'Promised to pay by 12th July.'
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
    paymentDate: '2026-07-04',
    paymentMode: 'Cash',
    transactionId: 'CASH-REC-02',
    remarks: 'Received in cash at PG office.'
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
    const loaded = saved ? JSON.parse(saved) : defaultTenants;
    return loaded.map((t, idx) => ({
      ...t,
      customerId: t.customerId || `CUST-${1001 + idx}`
    }));
  });

  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem('db_transactions_v2');
    return saved ? JSON.parse(saved) : defaultTransactions;
  });

  // Cloud Sync states
  const [cloudStatus, setCloudStatus] = useState('initializing'); // 'connected' | 'empty' | 'rls_restricted' | 'offline'
  const [cloudMessage, setCloudMessage] = useState('');
  const [isSeeding, setIsSeeding] = useState(false);

  // Persist states locally as cache
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

  // Load from Supabase
  const loadDataFromSupabase = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setCloudStatus('offline');
      setCloudMessage('Supabase client not configured.');
      return;
    }

    try {
      // 1. Fetch rooms and beds
      const { data: roomsData, error: roomsErr } = await supabase
        .from('rooms')
        .select('*, beds(*)');

      if (roomsErr) {
        if (roomsErr.code === '42501') {
          setCloudStatus('rls_restricted');
          setCloudMessage('RLS policy is blocking access. Please allow anon access in Supabase SQL editor.');
        } else {
          setCloudStatus('offline');
          setCloudMessage(`Supabase error: ${roomsErr.message}`);
        }
        return;
      }

      // If database has 0 rooms, it is newly created and empty
      if (!roomsData || roomsData.length === 0) {
        setCloudStatus('empty');
        setCloudMessage('Connected to Supabase! Database is currently empty.');
        return;
      }

      // 2. Fetch tenants
      const { data: tenantsData, error: tenantsErr } = await supabase
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false });

      if (tenantsErr) {
        console.warn('Error loading tenants from Supabase:', tenantsErr);
      }

      // 3. Fetch transactions
      const { data: txData, error: txErr } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (txErr) {
        console.warn('Error loading transactions from Supabase:', txErr);
      }

      // Map Supabase rooms to application format
      const mappedRooms = (roomsData || []).map(r => ({
        id: r.id,
        number: r.room_number,
        type: r.room_type,
        price: Number(r.price),
        beds: (r.beds || [])
          .sort((a, b) => Number(a.bed_number) - Number(b.bed_number))
          .map(b => ({
            id: b.id,
            number: String(b.bed_number),
            status: b.status || 'Available',
            tenantId: null
          }))
      }));

      // Map Supabase tenants to application format
      const mappedTenants = (tenantsData || []).map(t => {
        const room = mappedRooms.find(r => r.id === t.room_id);
        const bed = room ? room.beds.find(b => b.id === t.bed_id) : null;
        return {
          id: t.id,
          customerId: t.customer_id,
          name: t.name,
          phone: t.phone,
          aadhaar: t.aadhaar || '',
          roomId: t.room_id,
          roomNumber: room ? room.number : '',
          bedId: t.bed_id,
          bedNumber: bed ? bed.number : '',
          joiningDate: t.joining_date,
          advancePaid: Number(t.advance_paid || 0),
          monthlyRent: Number(t.monthly_rent || 0),
          deposit: Number(t.deposit || 0),
          emergencyContact: t.emergency_contact || '',
          remarks: t.remarks || '',
          status: t.status || 'Active'
        };
      });

      // Update bed occupants in mappedRooms
      mappedTenants.forEach(t => {
        if (t.status === 'Active' && t.roomId && t.bedId) {
          const r = mappedRooms.find(rm => rm.id === t.roomId);
          if (r) {
            const b = r.beds.find(bd => bd.id === t.bedId);
            if (b) {
              b.status = 'Occupied';
              b.tenantId = t.id;
            }
          }
        }
      });

      // Map Supabase transactions to application format
      const mappedTx = (txData || []).map(tx => {
        const tenant = mappedTenants.find(t => t.id === tx.tenant_id);
        return {
          id: tx.id,
          tenantId: tx.tenant_id,
          tenantName: tenant ? tenant.name : 'Unknown Tenant',
          roomNumber: tenant ? tenant.roomNumber : '',
          bedNumber: tenant ? tenant.bedNumber : '',
          amount: Number(tx.amount || 0),
          dueDate: tx.due_date,
          status: tx.status,
          paymentDate: tx.payment_date || '',
          paymentMode: tx.payment_mode || '',
          transactionId: tx.transaction_id || '',
          remarks: tx.remarks || ''
        };
      });

      // Update state with cloud data
      setRooms(mappedRooms);
      setTenants(mappedTenants);
      setTransactions(mappedTx);
      setCloudStatus('connected');
      setCloudMessage('Live connected to Supabase.');
    } catch (err) {
      console.error('Error connecting to Supabase:', err);
      setCloudStatus('offline');
      setCloudMessage(err.message || 'Failed to connect to Supabase.');
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadDataFromSupabase();
  }, [loadDataFromSupabase]);

  // One-click Seed Initial PG Data into Supabase
  const seedDatabaseToSupabase = async () => {
    if (!supabase) return { success: false, message: 'Supabase client unavailable' };
    setIsSeeding(true);

    try {
      // 1. Insert Rooms
      const roomInsertPayload = defaultRooms.map(r => ({
        room_number: r.number,
        room_type: r.type,
        price: r.price
      }));

      const { data: insertedRooms, error: roomErr } = await supabase
        .from('rooms')
        .insert(roomInsertPayload)
        .select();

      if (roomErr) throw roomErr;

      // 2. Insert Beds
      const bedInsertPayload = [];
      const roomMap = new Map(); // room_number -> inserted room object

      insertedRooms.forEach(r => {
        roomMap.set(r.room_number, r);
        const original = defaultRooms.find(dr => dr.number === r.room_number);
        if (original) {
          original.beds.forEach(b => {
            bedInsertPayload.push({
              room_id: r.id,
              bed_number: String(b.number),
              status: 'Available'
            });
          });
        }
      });

      const { data: insertedBeds, error: bedErr } = await supabase
        .from('beds')
        .insert(bedInsertPayload)
        .select();

      if (bedErr) throw bedErr;

      // Helper map for (room_id + bed_number) -> bed.id
      const bedMap = new Map();
      insertedBeds.forEach(b => {
        bedMap.set(`${b.room_id}_${b.bed_number}`, b.id);
      });

      // 3. Insert Default Tenants
      const tenantInsertPayload = defaultTenants.map(t => {
        const roomObj = roomMap.get(t.roomNumber);
        const roomId = roomObj ? roomObj.id : null;
        const bedId = roomId ? bedMap.get(`${roomId}_${t.bedNumber}`) : null;

        return {
          customer_id: t.customerId,
          name: t.name,
          phone: t.phone,
          aadhaar: t.aadhaar,
          room_id: roomId,
          bed_id: bedId,
          joining_date: t.joiningDate,
          advance_paid: t.advancePaid,
          monthly_rent: t.monthlyRent,
          deposit: t.deposit,
          emergency_contact: t.emergencyContact,
          remarks: t.remarks,
          status: 'Active'
        };
      });

      const { data: insertedTenants, error: tenantErr } = await supabase
        .from('tenants')
        .insert(tenantInsertPayload)
        .select();

      if (tenantErr) throw tenantErr;

      // Map original tenant ID (e.g. 'tenant-1') to inserted tenant ID
      const tenantIdMap = new Map();
      insertedTenants.forEach(it => {
        const orig = defaultTenants.find(dt => dt.customerId === it.customer_id);
        if (orig) tenantIdMap.set(orig.id, it.id);
      });

      // 4. Insert Default Transactions
      const txInsertPayload = defaultTransactions.map(tx => ({
        tenant_id: tenantIdMap.get(tx.tenantId) || insertedTenants[0].id,
        amount: tx.amount,
        due_date: tx.dueDate,
        status: tx.status,
        payment_date: tx.paymentDate || null,
        payment_mode: tx.paymentMode || null,
        transaction_id: tx.transactionId || null,
        remarks: tx.remarks
      }));

      const { error: txErr } = await supabase
        .from('transactions')
        .insert(txInsertPayload);

      if (txErr) throw txErr;

      // Reload fresh data from Supabase
      await loadDataFromSupabase();
      setIsSeeding(false);
      return { success: true, message: 'All rooms, beds, tenants, and transactions successfully seeded to Supabase!' };
    } catch (err) {
      console.error('Seed error:', err);
      setIsSeeding(false);
      return { success: false, message: err.message || 'Failed to seed data' };
    }
  };

  // Auth Operations
  const login = (username, password) => {
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
  const addRoom = async (roomData) => {
    const bedCount = parseInt(roomData.numberOfBeds || 0);
    const { type, price } = getRoomTypeAndPrice(bedCount);

    if (supabase && cloudStatus === 'connected') {
      try {
        const { data: newRoom, error: roomErr } = await supabase
          .from('rooms')
          .insert([{ room_number: roomData.number, room_type: type, price }])
          .select()
          .single();

        if (roomErr) throw roomErr;

        const bedsPayload = [];
        for (let i = 1; i <= bedCount; i++) {
          bedsPayload.push({
            room_id: newRoom.id,
            bed_number: String(i),
            status: 'Available'
          });
        }

        const { data: createdBeds, error: bedErr } = await supabase
          .from('beds')
          .insert(bedsPayload)
          .select();

        if (bedErr) throw bedErr;

        const completeRoom = {
          id: newRoom.id,
          number: newRoom.room_number,
          type: newRoom.room_type,
          price: Number(newRoom.price),
          beds: (createdBeds || []).map(b => ({
            id: b.id,
            number: String(b.bed_number),
            status: b.status,
            tenantId: null
          }))
        };

        setRooms(prev => [...prev, completeRoom]);
        return { success: true };
      } catch (err) {
        console.error('Supabase addRoom error:', err);
      }
    }

    // Local fallback
    const newRoomId = `room-${Date.now()}`;
    const generatedBeds = [];
    for (let i = 1; i <= bedCount; i++) {
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
      type: type,
      price: price,
      beds: generatedBeds
    };
    setRooms(prev => [...prev, newRoom]);
    return { success: true };
  };

  const editRoom = async (roomId, roomData) => {
    const targetBedsCount = parseInt(roomData.numberOfBeds || 0);
    const { type, price } = getRoomTypeAndPrice(targetBedsCount);

    if (supabase && cloudStatus === 'connected') {
      try {
        await supabase
          .from('rooms')
          .update({ room_number: roomData.number, room_type: type, price })
          .eq('id', roomId);
      } catch (err) {
        console.error('Supabase editRoom error:', err);
      }
    }

    setRooms(prev => prev.map(room => {
      if (room.id !== roomId) return room;
      let updatedBeds = [...room.beds];
      
      if (targetBedsCount > updatedBeds.length) {
        for (let i = updatedBeds.length + 1; i <= targetBedsCount; i++) {
          updatedBeds.push({
            id: `bed-${roomId}-${i}-${Date.now()}`,
            number: `${i}`,
            status: 'Available',
            tenantId: null
          });
        }
      } else if (targetBedsCount < updatedBeds.length) {
        const occupiedCount = updatedBeds.filter(b => b.status === 'Occupied').length;
        if (occupiedCount > targetBedsCount) {
          updatedBeds = updatedBeds.slice(0, occupiedCount);
        } else {
          updatedBeds = updatedBeds.slice(0, targetBedsCount);
        }
      }

      return {
        ...room,
        number: roomData.number,
        type: type,
        price: price,
        beds: updatedBeds
      };
    }));
    return { success: true };
  };

  const deleteRoom = async (roomId) => {
    if (supabase && cloudStatus === 'connected') {
      try {
        await supabase.from('rooms').delete().eq('id', roomId);
      } catch (err) {
        console.error('Supabase deleteRoom error:', err);
      }
    }

    setTenants(prev => prev.filter(t => t.roomId !== roomId));
    const roomTenantIds = tenants.filter(t => t.roomId === roomId).map(t => t.id);
    setTransactions(prev => prev.filter(tx => !roomTenantIds.includes(tx.tenantId)));
    setRooms(prev => prev.filter(r => r.id !== roomId));
    return { success: true };
  };

  const addBed = async (roomId) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;
    const nextNumber = String(room.beds.length + 1);

    let createdBedId = `bed-${roomId}-${nextNumber}-${Date.now()}`;
    if (supabase && cloudStatus === 'connected') {
      try {
        const { data: newBed } = await supabase
          .from('beds')
          .insert([{ room_id: roomId, bed_number: nextNumber, status: 'Available' }])
          .select()
          .single();
        if (newBed) createdBedId = newBed.id;
      } catch (err) {
        console.error('Supabase addBed error:', err);
      }
    }

    setRooms(prev => prev.map(r => {
      if (r.id !== roomId) return r;
      const updatedBeds = [...r.beds, { id: createdBedId, number: nextNumber, status: 'Available', tenantId: null }];
      const { type, price } = getRoomTypeAndPrice(updatedBeds.length);
      return { ...r, beds: updatedBeds, type, price };
    }));
  };

  const removeBed = async (roomId, bedId) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return { success: false, message: 'Room not found' };
    const bed = room.beds.find(b => b.id === bedId);
    if (bed && bed.status === 'Occupied') {
      return { success: false, message: 'Cannot remove an occupied bed' };
    }

    if (supabase && cloudStatus === 'connected') {
      try {
        await supabase.from('beds').delete().eq('id', bedId);
      } catch (err) {
        console.error('Supabase removeBed error:', err);
      }
    }

    setRooms(prev => prev.map(r => {
      if (r.id !== roomId) return r;
      const updatedBeds = r.beds.filter(b => b.id !== bedId);
      const renumberedBeds = updatedBeds.map((b, idx) => ({ ...b, number: `${idx + 1}` }));
      const { type, price } = getRoomTypeAndPrice(renumberedBeds.length);
      return { ...r, beds: renumberedBeds, type, price };
    }));
    return { success: true };
  };

  const updateBedStatus = async (roomId, bedId, status) => {
    if (supabase && cloudStatus === 'connected') {
      try {
        await supabase.from('beds').update({ status }).eq('id', bedId);
      } catch (err) {
        console.error('Supabase updateBedStatus error:', err);
      }
    }

    setRooms(prev => prev.map(room => {
      if (room.id !== roomId) return room;
      return {
        ...room,
        beds: room.beds.map(bed => {
          if (bed.id !== bedId) return bed;
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

  const generateNextCustomerId = () => {
    let maxNum = 1000;
    tenants.forEach(t => {
      const raw = t.customerId || t.id || '';
      const match = raw.match(/\d+/);
      if (match) {
        const val = parseInt(match[0], 10);
        if (val > maxNum) maxNum = val;
      }
    });
    return `CUST-${maxNum + 1}`;
  };

  // Helper to check if string is valid UUID
  const isUUID = (val) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

  // Helper to resolve Supabase room and bed UUIDs even if caller passes mock 'room-101'
  const resolveRoomAndBed = async (roomId, bedId, roomNumber, bedNumber) => {
    let targetRoomId = roomId;
    let targetBedId = bedId;

    if (supabase && (!isUUID(targetRoomId) || !isUUID(targetBedId))) {
      try {
        const rNum = roomNumber || (typeof roomId === 'string' ? roomId.replace('room-', '') : '');
        if (rNum) {
          const { data: dbRoom } = await supabase.from('rooms').select('id').eq('room_number', rNum).maybeSingle();
          if (dbRoom) {
            targetRoomId = dbRoom.id;
            const bNum = bedNumber ? String(bedNumber) : (typeof bedId === 'string' ? bedId.split('-').pop() : '1');
            const { data: dbBed } = await supabase.from('beds').select('id').eq('room_id', dbRoom.id).eq('bed_number', bNum).maybeSingle();
            if (dbBed) targetBedId = dbBed.id;
          }
        }
      } catch (err) {
        console.warn('UUID resolution fallback error:', err);
      }
    }

    return {
      roomId: isUUID(targetRoomId) ? targetRoomId : null,
      bedId: isUUID(targetBedId) ? targetBedId : null
    };
  };

  // Tenants Operations
  const addTenant = async (tenantData) => {
    const custId = generateNextCustomerId();
    let newTenantId = `tenant-${Date.now()}`;
    const room = rooms.find(r => r.id === tenantData.roomId);
    const roomNum = room ? room.number : tenantData.roomNumber;

    if (supabase) {
      try {
        const { roomId: resolvedRoomId, bedId: resolvedBedId } = await resolveRoomAndBed(
          tenantData.roomId,
          tenantData.bedId,
          roomNum,
          tenantData.bedNumber
        );

        const { data: createdTenant, error: tErr } = await supabase
          .from('tenants')
          .insert([{
            customer_id: custId,
            name: tenantData.name,
            phone: tenantData.phone,
            aadhaar: tenantData.aadhaar,
            room_id: resolvedRoomId,
            bed_id: resolvedBedId,
            joining_date: tenantData.joiningDate,
            advance_paid: parseInt(tenantData.advancePaid || 0),
            monthly_rent: parseInt(tenantData.monthlyRent || 0),
            deposit: parseInt(tenantData.deposit || 0),
            emergency_contact: tenantData.emergencyContact,
            remarks: tenantData.remarks,
            status: 'Active'
          }])
          .select()
          .single();

        if (tErr) {
          console.error('Supabase addTenant error:', tErr);
          alert('Could not save to Supabase: ' + tErr.message);
        } else if (createdTenant) {
          newTenantId = createdTenant.id;
          if (resolvedBedId) {
            await supabase.from('beds').update({ status: 'Occupied' }).eq('id', resolvedBedId);
          }
        }
      } catch (err) {
        console.error('Supabase addTenant exception:', err);
      }
    }

    const newTenant = {
      id: newTenantId,
      customerId: custId,
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
      remarks: tenantData.remarks,
      status: 'Active'
    };

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

    // Create current month transaction
    const currentMonthStr = new Date().toISOString().slice(0, 7);
    let newTxId = `tx-${newTenantId}-${currentMonthStr}`;

    if (supabase && isUUID(newTenantId)) {
      try {
        const { data: createdTx } = await supabase
          .from('transactions')
          .insert([{
            tenant_id: newTenantId,
            amount: parseInt(tenantData.monthlyRent || 0),
            due_date: `${currentMonthStr}-05`,
            status: 'Pending',
            remarks: ''
          }])
          .select()
          .single();

        if (createdTx) newTxId = createdTx.id;
      } catch (err) {
        console.error('Supabase add transaction error:', err);
      }
    }

    const newTransaction = {
      id: newTxId,
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

  const editTenant = async (tenantId, tenantData) => {
    if (supabase && cloudStatus === 'connected') {
      try {
        await supabase
          .from('tenants')
          .update({
            name: tenantData.name,
            phone: tenantData.phone,
            aadhaar: tenantData.aadhaar,
            emergency_contact: tenantData.emergencyContact,
            remarks: tenantData.remarks,
            monthly_rent: parseInt(tenantData.monthlyRent || 0),
            deposit: parseInt(tenantData.deposit || 0),
            advance_paid: parseInt(tenantData.advancePaid || 0)
          })
          .eq('id', tenantId);
      } catch (err) {
        console.error('Supabase editTenant error:', err);
      }
    }

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

  const deleteTenant = async (tenantId) => {
    const tenant = tenants.find(t => t.id === tenantId);
    if (!tenant) return { success: false, message: 'Tenant not found' };

    if (supabase && cloudStatus === 'connected') {
      try {
        await supabase.from('tenants').delete().eq('id', tenantId);
        if (tenant.bedId) {
          await supabase.from('beds').update({ status: 'Available' }).eq('id', tenant.bedId);
        }
      } catch (err) {
        console.error('Supabase deleteTenant error:', err);
      }
    }

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

    setTransactions(prev => prev.filter(tx => tx.tenantId !== tenantId));
    setTenants(prev => prev.filter(t => t.id !== tenantId));

    return { success: true };
  };

  const ensureTenantForBed = (roomId, bedId) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return null;
    const bed = room.beds.find(b => b.id === bedId);
    if (!bed) return null;

    let tenant = tenants.find(t => t.roomId === roomId && t.bedId === bedId);
    if (!tenant && bed.status === 'Occupied') {
      const placeholderId = `tenant-temp-${Date.now()}`;
      const placeholderName = `Guest Room ${room.number} Bed ${bed.number}`;
      
      const newTenantObj = {
        id: placeholderId,
        name: placeholderName,
        phone: 'N/A',
        aadhaar: 'N/A',
        roomId: roomId,
        roomNumber: room.number,
        bedId: bedId,
        bedNumber: bed.number,
        joiningDate: new Date().toISOString().split('T')[0],
        advancePaid: 0,
        monthlyRent: room.price,
        deposit: 0,
        emergencyContact: 'N/A',
        remarks: 'Auto-created placeholder for transfer'
      };

      setTenants(prev => [...prev, newTenantObj]);
      setRooms(prev => prev.map(r => {
        if (r.id !== roomId) return r;
        return {
          ...r,
          beds: r.beds.map(b => (b.id === bedId ? { ...b, tenantId: placeholderId } : b))
        };
      }));

      return placeholderId;
    }
    return tenant ? tenant.id : null;
  };

  const moveTenant = async (tenantId, newRoomId, newBedId) => {
    const tenant = tenants.find(t => t.id === tenantId);
    if (!tenant) return { success: false, message: 'Tenant not found' };
    
    const oldRoomId = tenant.roomId;
    const oldBedId = tenant.bedId;
    const newRoom = rooms.find(r => r.id === newRoomId);
    if (!newRoom) return { success: false, message: 'Target room not found' };
    const newBed = newRoom.beds.find(b => b.id === newBedId);
    if (!newBed) return { success: false, message: 'Target bed not found' };

    if (supabase && cloudStatus === 'connected') {
      try {
        await supabase
          .from('tenants')
          .update({ room_id: newRoomId, bed_id: newBedId })
          .eq('id', tenantId);
        if (oldBedId) {
          await supabase.from('beds').update({ status: 'Available' }).eq('id', oldBedId);
        }
        await supabase.from('beds').update({ status: 'Occupied' }).eq('id', newBedId);
      } catch (err) {
        console.error('Supabase moveTenant error:', err);
      }
    }

    setRooms(prev => prev.map(r => {
      if (oldRoomId === newRoomId && r.id === oldRoomId) {
        return {
          ...r,
          beds: r.beds.map(b => {
            if (b.id === oldBedId) return { ...b, status: 'Available', tenantId: null };
            if (b.id === newBedId) return { ...b, status: 'Occupied', tenantId: tenantId };
            return b;
          })
        };
      }
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

  const bulkImportTenants = async (tenantsList) => {
    const newTenants = [];
    const newTransactions = [];
    const roomsToUpdate = new Map();

    tenantsList.forEach((tenantData, index) => {
      const tenantId = `tenant-bulk-${Date.now()}-${index}`;
      const newTenant = {
        id: tenantId,
        name: tenantData.name || 'Anonymous',
        phone: tenantData.phone || 'N/A',
        aadhaar: tenantData.aadhaar || 'N/A',
        roomId: tenantData.roomId,
        roomNumber: tenantData.roomNumber,
        bedId: tenantData.bedId,
        bedNumber: tenantData.bedNumber,
        joiningDate: tenantData.joiningDate || new Date().toISOString().split('T')[0],
        advancePaid: 0,
        monthlyRent: parseInt(tenantData.monthlyRent || 0),
        deposit: parseInt(tenantData.deposit || 2000),
        emergencyContact: tenantData.emergencyContact || 'N/A',
        remarks: tenantData.remarks || 'Imported via Excel'
      };
      newTenants.push(newTenant);

      const currentMonthStr = new Date().toISOString().slice(0, 7);
      const newTransaction = {
        id: `tx-${tenantId}-${currentMonthStr}`,
        tenantId: tenantId,
        tenantName: newTenant.name,
        roomNumber: newTenant.roomNumber,
        bedNumber: newTenant.bedNumber,
        amount: newTenant.monthlyRent,
        dueDate: `${currentMonthStr}-05`,
        status: 'Pending',
        paymentDate: '',
        paymentMode: '',
        transactionId: '',
        remarks: ''
      };
      newTransactions.push(newTransaction);

      const key = tenantData.roomId;
      if (!roomsToUpdate.has(key)) {
        roomsToUpdate.set(key, []);
      }
      roomsToUpdate.get(key).push({ bedId: tenantData.bedId, tenantId });
    });

    setRooms(prev => prev.map(room => {
      if (!roomsToUpdate.has(room.id)) return room;
      const updates = roomsToUpdate.get(room.id);
      return {
        ...room,
        beds: room.beds.map(bed => {
          const match = updates.find(u => u.bedId === bed.id);
          if (match) {
            return { ...bed, status: 'Occupied', tenantId: match.tenantId };
          }
          return bed;
        })
      };
    }));

    setTenants(prev => [...prev, ...newTenants]);
    setTransactions(prev => [...newTransactions, ...prev]);

    return { success: true, count: newTenants.length };
  };

  // Payments Operations
  const recordPayment = async (txId, paymentDetails) => {
    if (supabase && cloudStatus === 'connected') {
      try {
        await supabase
          .from('transactions')
          .update({
            status: 'Paid',
            payment_date: paymentDetails.paymentDate,
            payment_mode: paymentDetails.paymentMode,
            transaction_id: paymentDetails.transactionId,
            remarks: paymentDetails.remarks
          })
          .eq('id', txId);
      } catch (err) {
        console.error('Supabase recordPayment error:', err);
      }
    }

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

  const updateRentStatus = async (txId, status) => {
    if (supabase && cloudStatus === 'connected') {
      try {
        await supabase
          .from('transactions')
          .update({
            status,
            payment_date: status === 'Paid' ? undefined : null,
            payment_mode: status === 'Paid' ? undefined : null,
            transaction_id: status === 'Paid' ? undefined : null
          })
          .eq('id', txId);
      } catch (err) {
        console.error('Supabase updateRentStatus error:', err);
      }
    }

    setTransactions(prev => prev.map(tx => {
      if (tx.id !== txId) return tx;
      return {
        ...tx,
        status,
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
      cloudStatus,
      cloudMessage,
      isSeeding,
      seedDatabaseToSupabase,
      refreshFromSupabase: loadDataFromSupabase,
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
      ensureTenantForBed,
      addTenant,
      editTenant,
      deleteTenant,
      moveTenant,
      bulkImportTenants,
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

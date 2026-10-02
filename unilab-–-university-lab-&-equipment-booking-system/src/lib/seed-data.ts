/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Department,
  Lab,
  EquipmentCategory,
  Equipment,
  Booking,
  Issue,
  Notification,
  MaintenanceRecord,
  AuditLog,
  SystemSetting,
  UserProfile
} from '../types';

export const SEED_DEPARTMENTS: Department[] = [
  {
    id: 'dept-cs',
    name: 'Computer Science',
    code: 'CS',
    headName: 'Dr. Robert Martinez',
    email: 'cs.head@unilab.edu',
    createdAt: '2026-01-10T08:00:00Z'
  },
  {
    id: 'dept-ee',
    name: 'Electrical Engineering',
    code: 'EE',
    headName: 'Dr. Angela Davis',
    email: 'ee.head@unilab.edu',
    createdAt: '2026-01-10T08:00:00Z'
  },
  {
    id: 'dept-ec',
    name: 'Electronics & Communication',
    code: 'EC',
    headName: 'Dr. Vikram Patel',
    email: 'ec.head@unilab.edu',
    createdAt: '2026-01-10T08:00:00Z'
  },
  {
    id: 'dept-me',
    name: 'Mechanical Engineering',
    code: 'ME',
    headName: 'Dr. Gregory House',
    email: 'me.head@unilab.edu',
    createdAt: '2026-01-10T08:00:00Z'
  }
];

export const SEED_CATEGORIES: EquipmentCategory[] = [
  {
    id: 'cat-micro',
    name: 'Microcontrollers & Development Kits',
    description: 'Arduino, Raspberry Pi, ESP32, STM32 and developer board toolkits',
    icon: 'Cpu'
  },
  {
    id: 'cat-test',
    name: 'Test & Measurement',
    description: 'Oscilloscopes, multimeters, logic analyzers, power supplies',
    icon: 'Activity'
  },
  {
    id: 'cat-network',
    name: 'Networking & Infrastructure',
    description: 'Cisco switches, routers, fiber transceivers, network analyzers',
    icon: 'Network'
  },
  {
    id: 'cat-compute',
    name: 'High-Performance Workstations',
    description: 'GPU workstations, render nodes, VR headsets',
    icon: 'Monitor'
  },
  {
    id: 'cat-av',
    name: 'Audio/Visual & Presentation',
    description: 'Projectors, display screens, document cameras, smart pointers',
    icon: 'Tv'
  },
  {
    id: 'cat-sensors',
    name: 'Sensors & Actuators',
    description: 'IoT sensor modules, servos, lidar, ultrasonic and environmental modules',
    icon: 'Radio'
  }
];

export const SEED_LABS: Lab[] = [
  {
    id: 'lab-embedded',
    labId: 'LAB-EC-201',
    name: 'Embedded Systems Lab',
    departmentId: 'dept-ec',
    departmentName: 'Electronics & Communication',
    capacity: 35,
    location: 'Engineering Block B, Room 204',
    facilities: ['Digital Storage Oscilloscopes', 'Soldering Stations', 'Function Generators', 'Logic Analyzers', 'Interactive Projector'],
    status: 'AVAILABLE',
    description: 'Equipped for micro-controller prototyping, PCB assembly, FPGA development, and hardware-software co-design experiments.',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    equipmentIds: ['eq-arduino', 'eq-esp32', 'eq-oscilloscope'],
    createdAt: '2026-01-15T09:00:00Z'
  },
  {
    id: 'lab-networks',
    labId: 'LAB-CS-104',
    name: 'Computer Networks Lab',
    departmentId: 'dept-cs',
    departmentName: 'Computer Science',
    capacity: 40,
    location: 'Turing Hall, Room 104',
    facilities: ['Cisco Enterprise Routers & Switches', 'Structured Cat6 Racks', 'Wireshark Protocol Analyzers', 'Dual-NIC Workstations'],
    status: 'AVAILABLE',
    description: 'Specialized lab designed for routing protocols, network topologies, cyber defense simulations, and subnetting practices.',
    imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
    equipmentIds: ['eq-cisco-network'],
    createdAt: '2026-01-15T09:00:00Z'
  },
  {
    id: 'lab-database',
    labId: 'LAB-CS-202',
    name: 'Database Lab',
    departmentId: 'dept-cs',
    departmentName: 'Computer Science',
    capacity: 45,
    location: 'Turing Hall, Room 202',
    facilities: ['Xeon Multi-Core Terminals', 'High-Speed SSD Storage', 'PostgreSQL Clusters', 'Dedicated DB Servers'],
    status: 'AVAILABLE',
    description: 'Designed for relational schema design, query optimization benchmarks, big data warehousing, and distributed database testing.',
    imageUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80',
    equipmentIds: ['eq-workstation'],
    createdAt: '2026-01-15T09:00:00Z'
  },
  {
    id: 'lab-ai-ml',
    labId: 'LAB-CS-301',
    name: 'AI & Machine Learning Lab',
    departmentId: 'dept-cs',
    departmentName: 'Computer Science',
    capacity: 30,
    location: 'Ada Lovelace Center, Room 301',
    facilities: ['NVIDIA RTX 4090 Workstations', 'PyTorch & CUDA Acceleration', 'Dual 4K Displays', 'Ultra HD Laser Projector'],
    status: 'AVAILABLE',
    description: 'Premier computing lab for deep neural network training, computer vision models, generative AI experiments, and robotics research.',
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    equipmentIds: ['eq-workstation', 'eq-projector'],
    createdAt: '2026-01-15T09:00:00Z'
  },
  {
    id: 'lab-software',
    labId: 'LAB-CS-102',
    name: 'Software Engineering Lab',
    departmentId: 'dept-cs',
    departmentName: 'Computer Science',
    capacity: 50,
    location: 'Turing Hall, Room 102',
    facilities: ['Ergonomic Pod Desks', 'Agile Scrum Boards', 'Dual-Monitor Setups', 'Integrated CI/CD Dev Nodes'],
    status: 'AVAILABLE',
    description: 'Collaborative development space engineered for capstone group projects, code reviews, automated testing, and sprint hackathons.',
    imageUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80',
    equipmentIds: ['eq-workstation'],
    createdAt: '2026-01-15T09:00:00Z'
  }
];

export const SEED_EQUIPMENT: Equipment[] = [
  {
    id: 'eq-arduino',
    equipmentId: 'EQ-ARD-001',
    name: 'Arduino Uno Kits',
    category: 'Microcontrollers & Development Kits',
    labId: 'lab-embedded',
    labName: 'Embedded Systems Lab',
    departmentId: 'dept-ec',
    totalQuantity: 20,
    reservedQuantity: 8,
    inUseQuantity: 5,
    availableQuantity: 7, // Exactly matches prompt: Total 20, Reserved 8, In Use 5, Available 7
    condition: 'EXCELLENT',
    maintenanceStatus: 'OPERATIONAL',
    description: 'Complete Arduino Uno Rev3 starter kits including breadboards, jumper wires, resistors, LEDs, and USB interface cables.',
    imageUrl: 'https://images.unsplash.com/photo-1553406830-ef2513450d76?auto=format&fit=crop&w=600&q=80',
    createdAt: '2026-01-18T10:00:00Z'
  },
  {
    id: 'eq-raspi',
    equipmentId: 'EQ-RPI-002',
    name: 'Raspberry Pi 4 Model B (4GB)',
    category: 'Microcontrollers & Development Kits',
    labId: 'lab-embedded',
    labName: 'Embedded Systems Lab',
    departmentId: 'dept-ec',
    totalQuantity: 15,
    reservedQuantity: 4,
    inUseQuantity: 3,
    availableQuantity: 8,
    condition: 'GOOD',
    maintenanceStatus: 'OPERATIONAL',
    description: 'Single-board computers equipped with 4GB LPDDR4 RAM, 64GB MicroSD cards flashed with Raspberry Pi OS, official power supplies and micro-HDMI cables.',
    imageUrl: 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?auto=format&fit=crop&w=600&q=80',
    createdAt: '2026-01-18T10:00:00Z'
  },
  {
    id: 'eq-esp32',
    equipmentId: 'EQ-ESP-003',
    name: 'ESP32 Development Boards',
    category: 'Microcontrollers & Development Kits',
    labId: 'lab-embedded',
    labName: 'Embedded Systems Lab',
    departmentId: 'dept-ec',
    totalQuantity: 25,
    reservedQuantity: 5,
    inUseQuantity: 6,
    availableQuantity: 14,
    condition: 'EXCELLENT',
    maintenanceStatus: 'OPERATIONAL',
    description: 'Dual-core ESP32 microcontrollers featuring integrated 2.4 GHz Wi-Fi and Bluetooth BLE, suitable for IoT sensor nodes.',
    imageUrl: 'https://images.unsplash.com/photo-1580927752452-89d86da3fa0a?auto=format&fit=crop&w=600&q=80',
    createdAt: '2026-01-18T10:00:00Z'
  },
  {
    id: 'eq-oscilloscope',
    equipmentId: 'EQ-OSC-004',
    name: 'Digital Storage Oscilloscopes (100MHz)',
    category: 'Test & Measurement',
    labId: 'lab-embedded',
    labName: 'Embedded Systems Lab',
    departmentId: 'dept-ec',
    totalQuantity: 12,
    reservedQuantity: 2,
    inUseQuantity: 4,
    availableQuantity: 6,
    condition: 'EXCELLENT',
    maintenanceStatus: 'OPERATIONAL',
    description: '100MHz 2-channel digital storage oscilloscopes with 1GSa/s real-time sample rate, color TFT display, and USB waveform capture.',
    imageUrl: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80',
    createdAt: '2026-01-18T10:00:00Z'
  },
  {
    id: 'eq-multimeter',
    equipmentId: 'EQ-DMM-005',
    name: 'Digital Multimeters (True RMS)',
    category: 'Test & Measurement',
    labId: 'lab-embedded',
    labName: 'Embedded Systems Lab',
    departmentId: 'dept-ec',
    totalQuantity: 30,
    reservedQuantity: 6,
    inUseQuantity: 8,
    availableQuantity: 16,
    condition: 'GOOD',
    maintenanceStatus: 'OPERATIONAL',
    description: 'Precision True-RMS handheld digital multimeters measuring AC/DC voltage, current, resistance, capacitance, and continuity.',
    imageUrl: 'https://images.unsplash.com/photo-1581092162384-8987c1d64718?auto=format&fit=crop&w=600&q=80',
    createdAt: '2026-01-18T10:00:00Z'
  },
  {
    id: 'eq-cisco-network',
    equipmentId: 'EQ-NET-006',
    name: 'Cisco Networking Kits',
    category: 'Networking & Infrastructure',
    labId: 'lab-networks',
    labName: 'Computer Networks Lab',
    departmentId: 'dept-cs',
    totalQuantity: 8,
    reservedQuantity: 2,
    inUseQuantity: 2,
    availableQuantity: 4,
    condition: 'GOOD',
    maintenanceStatus: 'OPERATIONAL',
    description: 'Modular CCNA/CCNP practice racks with Cisco Catalyst switches and ISR routers with console rollover cables.',
    imageUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=600&q=80',
    createdAt: '2026-01-18T10:00:00Z'
  },
  {
    id: 'eq-sensors',
    equipmentId: 'EQ-SEN-007',
    name: 'IoT Sensor Packs (37-in-1)',
    category: 'Sensors & Actuators',
    labId: 'lab-embedded',
    labName: 'Embedded Systems Lab',
    departmentId: 'dept-ec',
    totalQuantity: 18,
    reservedQuantity: 3,
    inUseQuantity: 5,
    availableQuantity: 10,
    condition: 'EXCELLENT',
    maintenanceStatus: 'OPERATIONAL',
    description: 'Comprehensive sensor module kits including temperature/humidity DHT22, ultrasonic, gas, infrared, relay, and sound sensors.',
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
    createdAt: '2026-01-18T10:00:00Z'
  },
  {
    id: 'eq-projector',
    equipmentId: 'EQ-PRJ-008',
    name: 'Ultra HD Laser Projector',
    category: 'Audio/Visual & Presentation',
    labId: 'lab-ai-ml',
    labName: 'AI & Machine Learning Lab',
    departmentId: 'dept-cs',
    totalQuantity: 5,
    reservedQuantity: 1,
    inUseQuantity: 1,
    availableQuantity: 3,
    condition: 'EXCELLENT',
    maintenanceStatus: 'OPERATIONAL',
    description: '5000-lumen 4K laser projector with wireless screen mirroring, HDMI 2.1 inputs, and ultra-short throw capability.',
    imageUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=600&q=80',
    createdAt: '2026-01-18T10:00:00Z'
  },
  {
    id: 'eq-workstation',
    equipmentId: 'EQ-WS-009',
    name: 'High-Performance Workstations (RTX 4090)',
    category: 'High-Performance Workstations',
    labId: 'lab-ai-ml',
    labName: 'AI & Machine Learning Lab',
    departmentId: 'dept-cs',
    totalQuantity: 25,
    reservedQuantity: 5,
    inUseQuantity: 10,
    availableQuantity: 10,
    condition: 'EXCELLENT',
    maintenanceStatus: 'OPERATIONAL',
    description: 'Workstations powered by Intel Core i9-14900K, 64GB DDR5, NVIDIA RTX 4090 24GB, 2TB NVMe PCIe 4.0 storage.',
    imageUrl: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80',
    createdAt: '2026-01-18T10:00:00Z'
  }
];

export const SEED_SETTINGS: SystemSetting = {
  id: 'global-rules',
  maxBookingDurationHours: 4,
  maxActiveBookingsPerUser: 3,
  maxEquipmentQuantityPerBooking: 10,
  minAdvanceBookingHours: 2,
  cancellationDeadlineHours: 1,
  allowCrossDepartmentBooking: true,
  autoApprovalForFaculty: true,
  updatedAt: '2026-02-01T12:00:00Z',
  updatedBy: 'admin-1'
};

export const DEMO_USERS: UserProfile[] = [
  {
    id: 'user-student-alex',
    name: 'Alex Rivera',
    email: 'alex.student@unilab.edu',
    role: 'STUDENT',
    departmentId: 'dept-cs',
    departmentName: 'Computer Science',
    studentId: 'CS-2024-8841',
    phone: '+1 (555) 234-5678',
    active: true,
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    createdAt: '2026-01-12T10:00:00Z'
  },
  {
    id: 'user-faculty-sarah',
    name: 'Dr. Sarah Vance',
    email: 'dr.vance@unilab.edu',
    role: 'FACULTY',
    departmentId: 'dept-cs',
    departmentName: 'Computer Science',
    employeeId: 'FAC-CS-104',
    phone: '+1 (555) 345-6789',
    active: true,
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    createdAt: '2026-01-12T10:00:00Z'
  },
  {
    id: 'user-staff-marcus',
    name: 'Marcus Chen',
    email: 'marcus.chen@unilab.edu',
    role: 'LAB_STAFF',
    departmentId: 'dept-ec',
    departmentName: 'Electronics & Communication',
    employeeId: 'STF-ENG-089',
    phone: '+1 (555) 456-7890',
    active: true,
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    createdAt: '2026-01-12T10:00:00Z'
  },
  {
    id: 'user-coord-elena',
    name: 'Prof. Elena Rostova',
    email: 'elena.coord@unilab.edu',
    role: 'COORDINATOR',
    departmentId: 'dept-cs',
    departmentName: 'Computer Science',
    employeeId: 'CRD-CS-002',
    phone: '+1 (555) 567-8901',
    active: true,
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80',
    createdAt: '2026-01-12T10:00:00Z'
  },
  {
    id: 'user-admin-root',
    name: 'University Super Admin',
    email: 'aqsaturk66@gmail.com', // Admin matches runtime email
    role: 'ADMIN',
    departmentId: 'dept-cs',
    departmentName: 'Computer Science',
    employeeId: 'ADM-SYS-001',
    phone: '+1 (555) 999-0000',
    active: true,
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
    createdAt: '2026-01-10T08:00:00Z'
  }
];

export const SEED_BOOKINGS: Booking[] = [
  {
    id: 'bkg-101',
    bookingId: 'BKG-2026-1001',
    userId: 'user-student-alex',
    userName: 'Alex Rivera',
    userEmail: 'alex.student@unilab.edu',
    userRole: 'STUDENT',
    departmentId: 'dept-cs',
    resourceType: 'LAB',
    resourceId: 'lab-ai-ml',
    resourceName: 'AI & Machine Learning Lab',
    quantity: 1,
    bookingDate: '2026-10-03',
    startTime: '14:00',
    endTime: '16:00',
    purpose: 'Senior Capstone: Training multi-modal vision models for autonomous robot navigation.',
    status: 'APPROVED',
    approvalStatus: 'APPROVED',
    approvedBy: 'user-staff-marcus',
    approvedByName: 'Marcus Chen',
    approvedAt: '2026-10-01T15:30:00Z',
    createdAt: '2026-10-01T14:15:00Z',
    updatedAt: '2026-10-01T15:30:00Z'
  },
  {
    id: 'bkg-102',
    bookingId: 'BKG-2026-1002',
    userId: 'user-student-alex',
    userName: 'Alex Rivera',
    userEmail: 'alex.student@unilab.edu',
    userRole: 'STUDENT',
    departmentId: 'dept-ec',
    resourceType: 'EQUIPMENT',
    resourceId: 'eq-arduino',
    resourceName: 'Arduino Uno Kits',
    quantity: 5,
    bookingDate: '2026-10-04',
    startTime: '10:00',
    endTime: '13:00',
    purpose: 'Embedded IoT sensor interfacing lab assignment with ultrasonic ranging modules.',
    status: 'PENDING_APPROVAL',
    approvalStatus: 'PENDING',
    createdAt: '2026-10-02T08:30:00Z',
    updatedAt: '2026-10-02T08:30:00Z'
  },
  {
    id: 'bkg-103',
    bookingId: 'BKG-2026-1003',
    userId: 'user-faculty-sarah',
    userName: 'Dr. Sarah Vance',
    userEmail: 'dr.vance@unilab.edu',
    userRole: 'FACULTY',
    departmentId: 'dept-cs',
    resourceType: 'LAB',
    resourceId: 'lab-networks',
    resourceName: 'Computer Networks Lab',
    quantity: 1,
    bookingDate: '2026-10-05',
    startTime: '09:00',
    endTime: '12:00',
    purpose: 'CS452 Advanced Networking practical exam: BGP routing and VLAN configuration.',
    status: 'APPROVED',
    approvalStatus: 'APPROVED',
    approvedBy: 'user-coord-elena',
    approvedByName: 'Prof. Elena Rostova',
    approvedAt: '2026-10-01T16:00:00Z',
    createdAt: '2026-10-01T11:20:00Z',
    updatedAt: '2026-10-01T16:00:00Z'
  },
  {
    id: 'bkg-104',
    bookingId: 'BKG-2026-1004',
    userId: 'user-student-alex',
    userName: 'Alex Rivera',
    userEmail: 'alex.student@unilab.edu',
    userRole: 'STUDENT',
    departmentId: 'dept-ec',
    resourceType: 'EQUIPMENT',
    resourceId: 'eq-oscilloscope',
    resourceName: 'Digital Storage Oscilloscopes (100MHz)',
    quantity: 1,
    bookingDate: '2026-09-28',
    startTime: '13:00',
    endTime: '15:00',
    purpose: 'Measuring PWM duty cycle waveform output from timer circuit.',
    status: 'COMPLETED',
    approvalStatus: 'APPROVED',
    approvedBy: 'user-staff-marcus',
    approvedByName: 'Marcus Chen',
    approvedAt: '2026-09-27T10:00:00Z',
    createdAt: '2026-09-26T14:00:00Z',
    updatedAt: '2026-09-28T15:30:00Z'
  },
  {
    id: 'bkg-105',
    bookingId: 'BKG-2026-1005',
    userId: 'user-faculty-sarah',
    userName: 'Dr. Sarah Vance',
    userEmail: 'dr.vance@unilab.edu',
    userRole: 'FACULTY',
    departmentId: 'dept-cs',
    resourceType: 'EQUIPMENT',
    resourceId: 'eq-projector',
    resourceName: 'Ultra HD Laser Projector',
    quantity: 1,
    bookingDate: '2026-10-06',
    startTime: '15:00',
    endTime: '17:00',
    purpose: 'Graduate colloquium guest lecture on Transformer Architecture scaling laws.',
    status: 'PENDING_APPROVAL',
    approvalStatus: 'PENDING',
    createdAt: '2026-10-02T09:15:00Z',
    updatedAt: '2026-10-02T09:15:00Z'
  }
];

export const SEED_ISSUES: Issue[] = [
  {
    id: 'iss-201',
    issueId: 'ISS-2026-0041',
    bookingId: 'bkg-104',
    equipmentId: 'eq-oscilloscope',
    equipmentName: 'Digital Storage Oscilloscopes (100MHz)',
    userId: 'user-student-alex',
    userName: 'Alex Rivera',
    issuedBy: 'user-staff-marcus',
    issuedByName: 'Marcus Chen',
    quantity: 1,
    issuedAt: '2026-09-28T13:05:00Z',
    expectedReturnAt: '2026-09-28T15:00:00Z',
    actualReturnAt: '2026-09-28T15:10:00Z',
    returnCondition: 'EXCELLENT',
    remarks: 'Returned in pristine condition with both BNC probe cables intact.',
    status: 'RETURNED'
  },
  {
    id: 'iss-202',
    issueId: 'ISS-2026-0042',
    bookingId: 'bkg-active-55',
    equipmentId: 'eq-arduino',
    equipmentName: 'Arduino Uno Kits',
    userId: 'user-student-alex',
    userName: 'Alex Rivera',
    issuedBy: 'user-staff-marcus',
    issuedByName: 'Marcus Chen',
    quantity: 3,
    issuedAt: '2026-10-02T09:00:00Z',
    expectedReturnAt: '2026-10-02T17:00:00Z',
    status: 'ISSUED'
  }
];

export const SEED_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-1',
    userId: 'user-student-alex',
    title: 'Booking Approved',
    message: 'Your reservation for AI & Machine Learning Lab on Oct 03 (14:00 - 16:00) has been approved.',
    type: 'SUCCESS',
    read: false,
    relatedBookingId: 'bkg-101',
    createdAt: '2026-10-01T15:30:00Z'
  },
  {
    id: 'notif-2',
    userId: 'user-student-alex',
    title: 'Equipment Issued',
    message: '3 units of Arduino Uno Kits have been checked out to you. Expected return today by 17:00.',
    type: 'INFO',
    read: false,
    relatedBookingId: 'bkg-102',
    createdAt: '2026-10-02T09:02:00Z'
  },
  {
    id: 'notif-3',
    userId: 'user-staff-marcus',
    title: 'New Booking Request',
    message: 'Alex Rivera requested 5 Arduino Uno Kits for Oct 04 (10:00 - 13:00). Approval pending.',
    type: 'WARNING',
    read: false,
    relatedBookingId: 'bkg-102',
    createdAt: '2026-10-02T08:30:00Z'
  },
  {
    id: 'notif-4',
    userId: 'user-coord-elena',
    title: 'High Resource Demand Alert',
    message: 'AI & Machine Learning Lab reached 85% occupancy for the upcoming week.',
    type: 'ALERT',
    read: true,
    createdAt: '2026-10-01T18:00:00Z'
  }
];

export const SEED_MAINTENANCE: MaintenanceRecord[] = [
  {
    id: 'maint-1',
    resourceType: 'EQUIPMENT',
    resourceId: 'eq-oscilloscope',
    resourceName: 'Digital Storage Oscilloscopes (100MHz)',
    type: 'CALIBRATION',
    description: 'Annual ISO/IEC calibration verification for probe impedance and timebase precision.',
    scheduledDate: '2026-10-15',
    status: 'SCHEDULED',
    createdBy: 'user-staff-marcus',
    createdByName: 'Marcus Chen',
    createdAt: '2026-09-30T10:00:00Z'
  },
  {
    id: 'maint-2',
    resourceType: 'LAB',
    resourceId: 'lab-software',
    resourceName: 'Software Engineering Lab',
    type: 'ROUTINE',
    description: 'Network switch firmware upgrades and power backup inverter testing.',
    scheduledDate: '2026-10-20',
    status: 'SCHEDULED',
    createdBy: 'user-staff-marcus',
    createdByName: 'Marcus Chen',
    createdAt: '2026-10-01T11:00:00Z'
  }
];

export const SEED_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'audit-1',
    userId: 'user-staff-marcus',
    userName: 'Marcus Chen',
    userRole: 'LAB_STAFF',
    action: 'APPROVE_BOOKING',
    entityType: 'BOOKING',
    entityId: 'bkg-101',
    details: 'Approved lab booking request for AI & Machine Learning Lab after verifying availability.',
    timestamp: '2026-10-01T15:30:00Z'
  },
  {
    id: 'audit-2',
    userId: 'user-staff-marcus',
    userName: 'Marcus Chen',
    userRole: 'LAB_STAFF',
    action: 'ISSUE_EQUIPMENT',
    entityType: 'ISSUE',
    entityId: 'iss-202',
    details: 'Issued 3 Arduino Uno Kits to Alex Rivera under booking BKG-2026-1002.',
    timestamp: '2026-10-02T09:00:00Z'
  },
  {
    id: 'audit-3',
    userId: 'user-coord-elena',
    userName: 'Prof. Elena Rostova',
    userRole: 'COORDINATOR',
    action: 'UPDATE_BOOKING_RULES',
    entityType: 'SETTING',
    entityId: 'global-rules',
    details: 'Modified maximum booking duration to 4 hours and active bookings limit to 3 per student.',
    timestamp: '2026-09-29T16:00:00Z'
  }
];

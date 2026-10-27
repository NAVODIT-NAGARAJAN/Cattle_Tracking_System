// ═══════════════════════════════════════════════════════
// Centralized Mock Data — CattleTrack
// All 17 buffalo breeds as specified in requirements
// ═══════════════════════════════════════════════════════

export const ML_SUPPORTED_BREEDS = [
  'banni', 'bargur', 'bhadawari', 'jaffrabadi', 'mehsana',
  'murrah', 'nagpuri', 'nili_ravi', 'toda'
];

export const OTHER_BREEDS = [
  'chhattisgarhi', 'chilika', 'gojri', 'kalahandi',
  'luit', 'marathwada', 'pandharpuri', 'surti'
];

export const BREEDS = [...ML_SUPPORTED_BREEDS, ...OTHER_BREEDS].sort();

export const DISTRICTS = ['Nagpur','Mumbai','Pune','Amravati','Aurangabad','Nashik','Kolhapur','Solapur','Akola','Latur','Jalgaon','Sangli'];
export const STATES = ['Maharashtra','Gujarat','Rajasthan','Punjab','Haryana','Uttar Pradesh','Madhya Pradesh','Karnataka'];

export const mockAnimals = [
  { animalId:'BUF-21:39:05:6E', rfidUid:'21:39:05:6E', breed:'murrah', breedConfidence:94.2, sex:'Female', ageMonths:36, ownerName:'Ramesh Patil', village:'Wardha', district:'Nagpur', state:'Maharashtra', status:'online', gpsFix:true, latitude:21.1458, longitude:79.0882, satellites:8, lastSeen:'2026-10-08T14:30:00Z', latestImage:null, deviceId:'ESP32-DEVKIT-01', weight:420, healthStatus:'healthy' },
  { animalId:'BUF-A3:7B:2C:1D', rfidUid:'A3:7B:2C:1D', breed:'nagpuri', breedConfidence:87.5, sex:'Male', ageMonths:48, ownerName:'Sunita Deshpande', village:'Katol', district:'Nagpur', state:'Maharashtra', status:'online', gpsFix:true, latitude:21.2856, longitude:78.5642, satellites:6, lastSeen:'2026-10-08T14:28:00Z', latestImage:null, deviceId:'ESP32-DEVKIT-02', weight:510, healthStatus:'healthy' },
  { animalId:'BUF-F8:4E:9A:3C', rfidUid:'F8:4E:9A:3C', breed:'mehsana', breedConfidence:91.8, sex:'Female', ageMonths:24, ownerName:'Vijay Kumar', village:'Dindori', district:'Nashik', state:'Maharashtra', status:'offline', gpsFix:false, latitude:19.9241, longitude:73.8301, satellites:0, lastSeen:'2026-10-08T11:15:00Z', latestImage:null, deviceId:'ESP32-DEVKIT-03', weight:380, healthStatus:'healthy' },
  { animalId:'BUF-2D:1F:8B:7A', rfidUid:'2D:1F:8B:7A', breed:'surti', breedConfidence:89.3, sex:'Female', ageMonths:30, ownerName:'Anita Shah', village:'Surat Rural', district:'Surat', state:'Gujarat', status:'online', gpsFix:true, latitude:21.1702, longitude:72.8311, satellites:9, lastSeen:'2026-10-08T14:25:00Z', latestImage:null, deviceId:'ESP32-CAM-01', weight:350, healthStatus:'healthy' },
  { animalId:'BUF-9E:3C:5D:2F', rfidUid:'9E:3C:5D:2F', breed:'murrah', breedConfidence:96.1, sex:'Male', ageMonths:60, ownerName:'Harjinder Singh', village:'Rohtak', district:'Rohtak', state:'Haryana', status:'online', gpsFix:true, latitude:28.8955, longitude:76.6066, satellites:7, lastSeen:'2026-10-08T14:31:00Z', latestImage:null, deviceId:'ESP32-DEVKIT-04', weight:550, healthStatus:'healthy' },
  { animalId:'BUF-4B:8A:1E:6D', rfidUid:'4B:8A:1E:6D', breed:'jaffrabadi', breedConfidence:82.7, sex:'Female', ageMonths:42, ownerName:'Pratap Verma', village:'Junagadh', district:'Junagadh', state:'Gujarat', status:'online', gpsFix:false, latitude:21.5222, longitude:70.4579, satellites:0, lastSeen:'2026-10-08T14:20:00Z', latestImage:null, deviceId:'ESP32-CAM-02', weight:480, healthStatus:'monitoring' },
  { animalId:'BUF-C7:2E:4F:9B', rfidUid:'C7:2E:4F:9B', breed:'banni', breedConfidence:78.4, sex:'Female', ageMonths:18, ownerName:'Meena Bhatt', village:'Kutch', district:'Kutch', state:'Gujarat', status:'offline', gpsFix:false, latitude:23.7337, longitude:69.8597, satellites:0, lastSeen:'2026-10-08T09:45:00Z', latestImage:null, deviceId:'ESP32-DEVKIT-05', weight:310, healthStatus:'healthy' },
  { animalId:'BUF-3A:5C:7E:8B', rfidUid:'3A:5C:7E:8B', breed:'toda', breedConfidence:73.9, sex:'Male', ageMonths:54, ownerName:'Ravi Krishnan', village:'Ooty', district:'Nilgiris', state:'Tamil Nadu', status:'online', gpsFix:true, latitude:11.4064, longitude:76.6932, satellites:5, lastSeen:'2026-10-08T14:10:00Z', latestImage:null, deviceId:'ESP32-DEVKIT-06', weight:430, healthStatus:'healthy' },
  { animalId:'BUF-6F:1A:3D:4E', rfidUid:'6F:1A:3D:4E', breed:'nili_ravi', breedConfidence:88.6, sex:'Female', ageMonths:36, ownerName:'Gurpreet Kaur', village:'Ferozepur', district:'Ferozepur', state:'Punjab', status:'online', gpsFix:true, latitude:30.9254, longitude:74.6131, satellites:8, lastSeen:'2026-10-08T14:33:00Z', latestImage:null, deviceId:'ESP32-CAM-03', weight:440, healthStatus:'healthy' },
  { animalId:'BUF-8C:4B:2A:5F', rfidUid:'8C:4B:2A:5F', breed:'marathwada', breedConfidence:85.2, sex:'Female', ageMonths:28, ownerName:'Balkrushna Gaikwad', village:'Latur', district:'Latur', state:'Maharashtra', status:'offline', gpsFix:false, latitude:18.4088, longitude:76.5604, satellites:0, lastSeen:'2026-10-08T12:20:00Z', latestImage:null, deviceId:'ESP32-DEVKIT-07', weight:360, healthStatus:'monitoring' },
  { animalId:'BUF-7D:9E:6B:1C', rfidUid:'7D:9E:6B:1C', breed:'gojri', breedConfidence:79.8, sex:'Male', ageMonths:72, ownerName:'Dhruv Mehta', village:'Palanpur', district:'Banaskantha', state:'Gujarat', status:'online', gpsFix:true, latitude:24.1742, longitude:72.4379, satellites:6, lastSeen:'2026-10-08T14:22:00Z', latestImage:null, deviceId:'ESP32-DEVKIT-08', weight:520, healthStatus:'healthy' },
  { animalId:'BUF-5E:8F:3A:2D', rfidUid:'5E:8F:3A:2D', breed:'luit', breedConfidence:70.5, sex:'Female', ageMonths:22, ownerName:'Dipanjali Borah', village:'Kaziranga', district:'Golaghat', state:'Assam', status:'online', gpsFix:false, latitude:26.5775, longitude:93.3733, satellites:0, lastSeen:'2026-10-08T14:05:00Z', latestImage:null, deviceId:'ESP32-CAM-04', weight:280, healthStatus:'healthy' },
];

export const mockDevices = [
  { deviceId:'ESP32-DEVKIT-01', name:'Field Unit Alpha', deviceType:'ESP32 DevKit', ipAddress:'192.168.1.101', status:'online', firmware:'2.4.1', lastSeen:'2026-10-08T14:30:00Z', location:'Nagpur Field Station', assignedAnimal:'BUF-21:39:05:6E', uptime:'14d 6h', batteryLevel:82 },
  { deviceId:'ESP32-DEVKIT-02', name:'Field Unit Beta', deviceType:'ESP32 DevKit', ipAddress:'192.168.1.102', status:'online', firmware:'2.4.1', lastSeen:'2026-10-08T14:28:00Z', location:'Nagpur Field Station', assignedAnimal:'BUF-A3:7B:2C:1D', uptime:'9d 12h', batteryLevel:67 },
  { deviceId:'ESP32-DEVKIT-03', name:'Field Unit Gamma', deviceType:'ESP32 DevKit', ipAddress:'192.168.1.103', status:'offline', firmware:'2.3.8', lastSeen:'2026-10-08T11:15:00Z', location:'Nashik Station', assignedAnimal:'BUF-F8:4E:9A:3C', uptime:'0d 0h', batteryLevel:14 },
  { deviceId:'ESP32-CAM-01', name:'Vision Unit 1', deviceType:'ESP32-CAM', ipAddress:'192.168.1.104', status:'online', firmware:'1.9.2', lastSeen:'2026-10-08T14:25:00Z', location:'Surat Hub', assignedAnimal:'BUF-2D:1F:8B:7A', uptime:'5d 3h', batteryLevel:91 },
  { deviceId:'ESP32-CAM-02', name:'Vision Unit 2', deviceType:'ESP32-CAM', ipAddress:'192.168.1.105', status:'online', firmware:'1.9.2', lastSeen:'2026-10-08T14:20:00Z', location:'Junagadh Station', assignedAnimal:'BUF-4B:8A:1E:6D', uptime:'2d 18h', batteryLevel:75 },
  { deviceId:'ESP32-DEVKIT-04', name:'Field Unit Delta', deviceType:'ESP32 DevKit', ipAddress:'192.168.1.106', status:'online', firmware:'2.4.1', lastSeen:'2026-10-08T14:31:00Z', location:'Haryana Hub', assignedAnimal:'BUF-9E:3C:5D:2F', uptime:'21d 1h', batteryLevel:55 },
  { deviceId:'GATEWAY-01', name:'Central Gateway', deviceType:'Gateway', ipAddress:'192.168.1.1', status:'online', firmware:'3.1.0', lastSeen:'2026-10-08T14:33:00Z', location:'Data Center', assignedAnimal:null, uptime:'62d 4h', batteryLevel:null },
  { deviceId:'ESP32-CAM-03', name:'Vision Unit 3', deviceType:'ESP32-CAM', ipAddress:'192.168.1.107', status:'online', firmware:'1.9.2', lastSeen:'2026-10-08T14:33:00Z', location:'Punjab Hub', assignedAnimal:'BUF-6F:1A:3D:4E', uptime:'7d 9h', batteryLevel:88 },
];

export const mockDetections = [
  { id:'det-001', animalId:'BUF-21:39:05:6E', rfidUid:'21:39:05:6E', breed:'murrah', confidence:94.2, topPredictions:[{breed:'murrah',confidence:94.2},{breed:'nagpuri',confidence:4.1},{breed:'mehsana',confidence:1.7}], timestamp:'2026-10-08T14:30:22Z', deviceId:'ESP32-CAM-01', location:'Nagpur Field', processingMs:312 },
  { id:'det-002', animalId:'BUF-A3:7B:2C:1D', rfidUid:'A3:7B:2C:1D', breed:'nagpuri', confidence:87.5, topPredictions:[{breed:'nagpuri',confidence:87.5},{breed:'murrah',confidence:8.3},{breed:'mehsana',confidence:4.2}], timestamp:'2026-10-08T14:12:05Z', deviceId:'ESP32-CAM-01', location:'Nagpur Field', processingMs:298 },
  { id:'det-003', animalId:'BUF-2D:1F:8B:7A', rfidUid:'2D:1F:8B:7A', breed:'surti', confidence:89.3, topPredictions:[{breed:'surti',confidence:89.3},{breed:'mehsana',confidence:7.4},{breed:'banni',confidence:3.3}], timestamp:'2026-10-08T13:55:40Z', deviceId:'ESP32-CAM-02', location:'Surat Hub', processingMs:325 },
  { id:'det-004', animalId:'BUF-9E:3C:5D:2F', rfidUid:'9E:3C:5D:2F', breed:'murrah', confidence:96.1, topPredictions:[{breed:'murrah',confidence:96.1},{breed:'nagpuri',confidence:2.8},{breed:'surti',confidence:1.1}], timestamp:'2026-10-08T13:40:18Z', deviceId:'ESP32-CAM-03', location:'Haryana Hub', processingMs:287 },
  { id:'det-005', animalId:'BUF-6F:1A:3D:4E', rfidUid:'6F:1A:3D:4E', breed:'nili_ravi', confidence:88.6, topPredictions:[{breed:'nili_ravi',confidence:88.6},{breed:'murrah',confidence:7.9},{breed:'surti',confidence:3.5}], timestamp:'2026-10-08T13:25:33Z', deviceId:'ESP32-CAM-03', location:'Punjab Hub', processingMs:341 },
  { id:'det-006', animalId:'BUF-F8:4E:9A:3C', rfidUid:'F8:4E:9A:3C', breed:'mehsana', confidence:91.8, topPredictions:[{breed:'mehsana',confidence:91.8},{breed:'surti',confidence:5.6},{breed:'gojri',confidence:2.6}], timestamp:'2026-10-08T11:10:14Z', deviceId:'ESP32-CAM-02', location:'Nashik Station', processingMs:302 },
  { id:'det-007', animalId:'BUF-3A:5C:7E:8B', rfidUid:'3A:5C:7E:8B', breed:'toda', confidence:73.9, topPredictions:[{breed:'toda',confidence:73.9},{breed:'chilika',confidence:15.2},{breed:'kalahandi',confidence:10.9}], timestamp:'2026-10-08T10:44:59Z', deviceId:'ESP32-CAM-04', location:'Nilgiris Station', processingMs:358 },
  { id:'det-008', animalId:'BUF-4B:8A:1E:6D', rfidUid:'4B:8A:1E:6D', breed:'jaffrabadi', confidence:82.7, topPredictions:[{breed:'jaffrabadi',confidence:82.7},{breed:'nagpuri',confidence:11.4},{breed:'mehsana',confidence:5.9}], timestamp:'2026-10-08T09:30:07Z', deviceId:'ESP32-CAM-02', location:'Junagadh Station', processingMs:315 },
];

export const mockTrackingHistory = [
  { id:'trk-001', animalId:'BUF-21:39:05:6E', rfidUid:'21:39:05:6E', latitude:21.1458, longitude:79.0882, gpsFix:true, satellites:8, timestamp:'2026-10-08T14:30:00Z', speed:0.2 },
  { id:'trk-002', animalId:'BUF-21:39:05:6E', rfidUid:'21:39:05:6E', latitude:21.1445, longitude:79.0870, gpsFix:true, satellites:7, timestamp:'2026-10-08T13:30:00Z', speed:0.5 },
  { id:'trk-003', animalId:'BUF-21:39:05:6E', rfidUid:'21:39:05:6E', latitude:21.1431, longitude:79.0855, gpsFix:true, satellites:8, timestamp:'2026-10-08T12:30:00Z', speed:0.8 },
  { id:'trk-004', animalId:'BUF-21:39:05:6E', rfidUid:'21:39:05:6E', latitude:21.1420, longitude:79.0843, gpsFix:true, satellites:6, timestamp:'2026-10-08T11:30:00Z', speed:0.3 },
  { id:'trk-005', animalId:'BUF-21:39:05:6E', rfidUid:'21:39:05:6E', latitude:21.1412, longitude:79.0838, gpsFix:true, satellites:7, timestamp:'2026-10-08T10:30:00Z', speed:0.1 },
];

export const mockDashboardStats = {
  totalAnimals: 12,
  onlineAnimals: 9,
  offlineAnimals: 3,
  gpsFixedAnimals: 8,
  todayDetections: 8,
  activeDevices: 7,
  totalDevices: 8,
  alerts: 2,
  avgConfidence: 86.4,
  onlinePercentage: 75,
};

export const mockBreedDistribution = [
  { breed:'murrah', count:3, percentage:25 },
  { breed:'nagpuri', count:2, percentage:16.7 },
  { breed:'mehsana', count:1, percentage:8.3 },
  { breed:'surti', count:1, percentage:8.3 },
  { breed:'nili_ravi', count:1, percentage:8.3 },
  { breed:'jaffrabadi', count:1, percentage:8.3 },
  { breed:'toda', count:1, percentage:8.3 },
  { breed:'others', count:2, percentage:16.7 },
];

export const mockAlerts = [
  { id:'alert-001', type:'warning', title:'Low Battery', message:'ESP32-DEVKIT-03 battery at 14% — field station Nashik', time:'2026-10-08T11:20:00Z', read:false },
  { id:'alert-002', type:'danger', title:'Device Offline', message:'ESP32-DEVKIT-03 went offline unexpectedly', time:'2026-10-08T11:15:00Z', read:false },
  { id:'alert-003', type:'info', title:'New Detection', message:'Breed detected: Murrah (94.2%) — BUF-21:39:05:6E', time:'2026-10-08T14:30:00Z', read:true },
  { id:'alert-004', type:'warning', title:'Low GPS Signal', message:'BUF-4B:8A:1E:6D — GPS fix lost in Junagadh', time:'2026-10-08T14:05:00Z', read:true },
];

export const mockWeeklyActivity = [
  { day:'Mon', detections:12, animals:8 },
  { day:'Tue', detections:18, animals:10 },
  { day:'Wed', detections:15, animals:9 },
  { day:'Thu', detections:22, animals:11 },
  { day:'Fri', detections:19, animals:10 },
  { day:'Sat', detections:9, animals:7 },
  { day:'Sun', detections:8, animals:6 },
];

export const mockMonthlyStats = [
  { month:'Apr', detections:124, newAnimals:3 },
  { month:'May', detections:178, newAnimals:5 },
  { month:'Jun', detections:152, newAnimals:2 },
  { month:'Jul', detections:203, newAnimals:4 },
  { month:'Aug', detections:189, newAnimals:6 },
  { month:'Sep', detections:217, newAnimals:3 },
  { month:'Oct', detections:94, newAnimals:2 },
];

export const mockUser = {
  name: 'Dr. Arjun Sharma',
  email: 'arjun.sharma@nlms.gov.in',
  role: 'Administrator',
  department: 'National Livestock Management',
  avatar: 'AS',
  phone: '+91-98765-43210',
  joinedDate: '2024-03-15',
};

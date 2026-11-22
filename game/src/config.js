// Cala Solara — Master Game Configuration & World Catalog

export const WORLD_CONFIG = {
  bounds: { minX: -390, maxX: 520, minZ: -330, maxZ: 280 },
  seaLevel: 0,
  bridgeStart: { x: 120, z: 96 },
  bridgeEnd: { x: 350, z: 132 },
  bridgeWidth: 18,
  bridgePeakY: 14.5,
  safehousePos: { x: 162, z: 24 },
  garagePos: { x: 146, z: 16 },
  plazaCenter: { x: -220, z: -20 },
  lighthousePos: { x: 432, z: 152 },
  marinaBoatPos: { x: 242, z: 24 },
};

export const DISTRICTS = [
  { id: 'palmera', name: 'Palmera Strip', color: '#ff6b9d', center: { x: -80, z: 120 }, radius: 135, income: 650, control: 35 },
  { id: 'core', name: 'Solara Financial Core', color: '#45d9ff', center: { x: 0, z: -70 }, radius: 140, income: 950, control: 20 },
  { id: 'barrio', name: 'Barrio Viejo', color: '#ffae42', center: { x: -220, z: -20 }, radius: 125, income: 550, control: 45 },
  { id: 'puerto', name: 'Puerto Caldera', color: '#5bf59c', center: { x: 168, z: -45 }, radius: 110, income: 800, control: 60 },
  { id: 'puente', name: 'Puente del Sol', color: '#ff5f57', center: { x: 235, z: 114 }, radius: 95, income: 500, control: 25 },
  { id: 'faro', name: 'Monte Faro', color: '#c48bff', center: { x: 405, z: 145 }, radius: 125, income: 1100, control: 15 },
];

export const VEHICLE_CATALOG = {
  supercar: {
    name: 'Solara GT-R',
    category: 'supercar',
    width: 2.26, height: 1.24, length: 4.95,
    maxSpeed: 54, reverseSpeed: 15, accel: 31, brake: 46,
    steerRate: 2.5, grip: 8.6, driftGrip: 2.6, maxHp: 135, mass: 1.45,
    colors: [0x00d9e8, 0xff496e, 0xffb338, 0xf2f6ff, 0x7b4dff, 0x26e896],
  },
  muscle: {
    name: 'Caldera V8 Coupe',
    category: 'muscle',
    width: 2.22, height: 1.36, length: 4.88,
    maxSpeed: 46, reverseSpeed: 14, accel: 26, brake: 40,
    steerRate: 2.35, grip: 7.4, driftGrip: 2.2, maxHp: 155, mass: 1.65,
    colors: [0xff6b35, 0xe83b4a, 0xffcf40, 0x2a6bff, 0x1d232f, 0x35c97a],
  },
  convertible: {
    name: 'Palmera Spyder',
    category: 'convertible',
    width: 2.12, height: 1.18, length: 4.65,
    maxSpeed: 45, reverseSpeed: 13, accel: 25, brake: 40,
    steerRate: 2.6, grip: 8.2, driftGrip: 2.7, maxHp: 115, mass: 1.3,
    colors: [0xff5a87, 0x45e8e0, 0xffd166, 0xfff5e4, 0x78c6ff],
  },
  suv: {
    name: 'Vanguard LX',
    category: 'suv',
    width: 2.34, height: 1.78, length: 5.05,
    maxSpeed: 37, reverseSpeed: 12, accel: 19, brake: 34,
    steerRate: 2.05, grip: 7.8, driftGrip: 3.1, maxHp: 195, mass: 2.2,
    colors: [0x222938, 0xdbe2ec, 0x3b6e8c, 0x7a4236, 0x45594a],
  },
  van: {
    name: 'Harbor Cargo Van',
    category: 'van',
    width: 2.32, height: 2.15, length: 5.35,
    maxSpeed: 32, reverseSpeed: 10, accel: 15, brake: 30,
    steerRate: 1.85, grip: 7.2, driftGrip: 3.5, maxHp: 210, mass: 2.5,
    colors: [0xebeef2, 0xd8a84e, 0x3d6d99, 0xb85240],
  },
  moto: {
    name: 'Veloce 900R',
    category: 'moto',
    width: 0.96, height: 1.18, length: 2.38,
    maxSpeed: 52, reverseSpeed: 6, accel: 34, brake: 48,
    steerRate: 3.2, grip: 9.8, driftGrip: 3.4, maxHp: 80, mass: 0.55,
    colors: [0xff3355, 0x00e0ff, 0xffbe2e, 0xf2f4f8],
  },
  police: {
    name: 'CSPD Interceptor',
    category: 'police',
    width: 2.26, height: 1.44, length: 5.02,
    maxSpeed: 49, reverseSpeed: 14, accel: 29, brake: 44,
    steerRate: 2.45, grip: 8.4, driftGrip: 2.8, maxHp: 175, mass: 1.85,
    colors: [0x141a24],
  },
  swat: {
    name: 'CSPD Enforcer BearCat',
    category: 'swat',
    width: 2.58, height: 2.45, length: 6.15,
    maxSpeed: 38, reverseSpeed: 11, accel: 19, brake: 35,
    steerRate: 1.75, grip: 8.2, driftGrip: 3.8, maxHp: 340, mass: 3.6,
    colors: [0x181f2b],
  },
  boat: {
    name: 'Cala WaveRunner',
    category: 'boat',
    width: 2.6, height: 1.35, length: 6.4,
    maxSpeed: 38, reverseSpeed: 10, accel: 20, brake: 18,
    steerRate: 2.2, grip: 3.6, driftGrip: 2.0, maxHp: 180, mass: 1.7,
    colors: [0xf7fafc, 0x00d9e8],
  },
};

export const WEAPON_CATALOG = [
  { id: 'pistol', slot: 1, name: '9mm Solara', damage: 24, fireRate: 0.24, range: 62, spread: 0.016, pellets: 1, mag: 15, reserve: 120, color: 0xffe49e, explosive: false },
  { id: 'smg', slot: 2, name: 'Viper SMG', damage: 17, fireRate: 0.088, range: 58, spread: 0.032, pellets: 1, mag: 32, reserve: 240, color: 0xffd07a, explosive: false },
  { id: 'shotgun', slot: 3, name: '12G Breacher', damage: 15, fireRate: 0.72, range: 36, spread: 0.095, pellets: 6, mag: 8, reserve: 56, color: 0xff9f45, explosive: false },
  { id: 'carbine', slot: 4, name: 'Caldera Carbine', damage: 28, fireRate: 0.125, range: 86, spread: 0.02, pellets: 1, mag: 30, reserve: 210, color: 0xfff0b3, explosive: false },
  { id: 'launcher', slot: 5, name: 'M40 Grenadier', damage: 110, fireRate: 1.25, range: 78, spread: 0.014, pellets: 1, mag: 4, reserve: 18, color: 0xff6b35, explosive: true },
];

export const WANTED_TIERS = [
  { stars: 0, code: 'CLEAR', label: 'No Heat', maxUnits: 0, tactic: 'NONE' },
  { stars: 1, code: 'PATROL', label: '1★ CSPD Patrol Pursuit', maxUnits: 2, tactic: 'PATROL' },
  { stars: 2, code: 'PIT / FLANK', label: '2★ PIT & Flank Interceptors', maxUnits: 3, tactic: 'PIT' },
  { stars: 3, code: 'ROADBLOCK', label: '3★ Avenue Roadblocks & Spikes', maxUnits: 4, tactic: 'ROADBLOCK' },
  { stars: 4, code: 'SWAT', label: '4★ BearCat SWAT Dismount', maxUnits: 5, tactic: 'SWAT' },
  { stars: 5, code: 'AIR-1 LOCKDOWN', label: '5★ Air-1 Chopper Lockdown', maxUnits: 6, tactic: 'LOCKDOWN' },
];

export const CREW_ROSTER = [
  {
    id: 'mateo',
    name: 'Mateo "Hammer" Cruz',
    role: 'Enforcer',
    initials: 'MC',
    color: '#ff6b4a',
    ability: 'Heavy Cover & Armor Drop',
    cooldown: 22,
    upgradeCost: 2200,
    desc: 'Deploys alongside Camila with carbine suppressing fire and restores +55 tactical armor.',
  },
  {
    id: 'nadia',
    name: 'Nadia "Cipher" Reyes',
    role: 'Signal Hacker',
    initials: 'NR',
    color: '#45d9ff',
    ability: 'CSPD Radar Scramble',
    cooldown: 26,
    upgradeCost: 2500,
    desc: 'Jams police dispatch cones for 12s, drops 1 wanted star, and disables nearby road spikes.',
  },
  {
    id: 'tomas',
    name: 'Tomas "Apex" Delgado',
    role: 'Wheelman',
    initials: 'TD',
    color: '#ffcf40',
    ability: 'GT-R Drop & Nitro Tune',
    cooldown: 20,
    upgradeCost: 2000,
    desc: 'Delivers a freshly tuned Solara GT-R nearby or repairs current vehicle and refills 100% nitro.',
  },
];

export const RADIO_STATIONS = [
  { id: 'synth', name: 'SOLARA SYNTH 98.4', bpm: 112, style: 'synthwave' },
  { id: 'funk', name: 'CALA FUNK 104.2', bpm: 104, style: 'funk' },
  { id: 'chill', name: 'PALMERA CHILL 89.7', bpm: 88, style: 'chill' },
  { id: 'off', name: 'RADIO OFF', bpm: 0, style: 'off' },
];

export const GARAGE_PAINTS = [
  { name: 'Lagoon Cyan', hex: 0x00d9e8, css: '#00d9e8' },
  { name: 'Coral Sunset', hex: 0xff496e, css: '#ff496e' },
  { name: 'Solar Gold', hex: 0xffb338, css: '#ffb338' },
  { name: 'Pearl White', hex: 0xf4f7fc, css: '#f4f7fc' },
  { name: 'Caldera Violet', hex: 0x7b4dff, css: '#7b4dff' },
  { name: 'Emerald Bay', hex: 0x22e38f, css: '#22e38f' },
  { name: 'Obsidian Matte', hex: 0x1a202c, css: '#1a202c' },
];

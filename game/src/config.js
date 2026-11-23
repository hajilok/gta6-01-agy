// Cala Solara — Master World Configuration, 9-Class Vehicle Specs, Weapons & Crew Catalog
export const WORLD_CONFIG={bounds:{minX:-390,maxX:520,minZ:-330,maxZ:280},seaLevel:0,bridgeStart:{x:120,z:96},bridgeEnd:{x:350,z:132},bridgeWidth:18.5,bridgePeakY:14.8,safehousePos:{x:162,z:24},garagePos:{x:154,z:14},plazaCenter:{x:-220,z:-20},lighthousePos:{x:432,z:152},marinaBoatPos:{x:242,z:24}};

export const DISTRICTS=[['palmera','Palmera Strip','#ff6b9d',-80,120,135,650,35],['core','Solara Financial Core','#45d9ff',0,-70,140,950,20],['barrio','Barrio Viejo','#ffae42',-220,-20,125,550,45],['puerto','Puerto Caldera','#5bf59c',168,-45,110,800,60],['puente','Puente del Sol','#ff5f57',235,114,95,500,25],['faro','Monte Faro','#c48bff',405,145,125,1100,15]].map(([id,name,color,x,z,radius,income,control])=>({id,name,color,center:{x,z},radius,income,control}));

export const VEHICLE_CATALOG={
  supercar:S('Solara Apex V12',2.28,1.24,4.96,55,15,32,46,2.55,8.8,2.6,140,1.45,[0x00d4e6,0xff4068,0xffb030,0xf2f6ff,0x7648ff,0x22e492]),
  muscle:S('Caldera V8 Coupe',2.24,1.38,4.88,47,14,27,40,2.38,7.5,2.2,160,1.65,[0xff642e,0xe63242,0xffcc38,0x2466ff,0x1b222e,0x2ec474]),
  convertible:S('Palmera Spyder',2.14,1.18,4.66,46,13,26,40,2.62,8.3,2.7,120,1.3,[0xff4f82,0x3ce6de,0xffcf5e,0xfff5e4,0x6ec2ff]),
  suv:S('Vanguard LX',2.36,1.8,5.06,38,12,20,34,2.08,7.9,3.1,200,2.2,[0x202836,0xdce4ee,0x366988,0x7c4034,0x405647]),
  van:S('Harbor Cargo Van',2.34,2.16,5.36,33,10,16,30,1.88,7.3,3.5,215,2.5,[0xedf0f4,0xd8a648,0x386996,0xb64e3c]),
  moto:S('Veloce 900R',.98,1.2,2.4,53,6,35,48,3.25,9.8,3.4,85,.55,[0xff2e50,0x00dcff,0xffbc28,0xf2f4f8]),
  police:S('CSPD Interceptor',2.28,1.46,5.04,50,14,30,45,2.48,8.6,2.8,180,1.85,[0x141b26]),
  swat:S('CSPD Enforcer APC',2.6,2.48,6.18,39,11,20,35,1.78,8.2,3.8,350,3.6,[0x18202d]),
  boat:S('Cala WaveRunner',2.65,1.38,6.45,39,10,21,18,2.25,3.7,2,185,1.7,[0xf7fafc,0x00d9e8]),
};

export const WEAPON_CATALOG=[['pistol',1,'9mm Solara',24,.24,64,.015,1,15,120,0xffe49e,false],['smg',2,'Viper SMG',17,.088,60,.03,1,32,240,0xffd07a,false],['shotgun',3,'12G Breacher',16,.72,38,.085,6,8,56,0xff9f45,false],['carbine',4,'Caldera Carbine',28,.125,88,.019,1,30,210,0xfff0b3,false],['launcher',5,'M40 Grenadier',115,1.25,80,.014,1,4,18,0xff6b35,true]].map(([id,slot,name,damage,fireRate,range,spread,pellets,mag,reserve,color,explosive])=>({id,slot,name,damage,fireRate,range,spread,pellets,mag,reserve,color,explosive}));

export const WANTED_TIERS=[[0,'CLEAR','No Heat',0],[1,'PATROL','1★ CSPD Patrol Pursuit',2],[2,'RAM / PIT','2★ RAM & PIT Flank Interceptors',3],[3,'ROADBLOCK','3★ Avenue Roadblocks & Spike Strips',4],[4,'SWAT','4★ SWAT APC Dismount',5],[5,'AIR-1 LOCKDOWN','5★ Air-1 Chopper Lockdown',6]].map(([stars,code,label,maxUnits])=>({stars,code,label,maxUnits}));

export const CREW_ROSTER=[['mateo','Mateo "Hammer" Cruz','Enforcer','MC','#ff6b4a',22,2200,'Carbine covering fire + restores +55 tactical armor.'],['nadia','Nadia "Cipher" Reyes','Signal Hacker','NR','#45d9ff',26,2500,'Jams police dispatch 12s, drops 1★ & disables spikes.'],['tomas','Tomas "Apex" Delgado','Wheelman','TD','#ffcf40',20,2000,'Delivers tuned Solara Apex V12 or repairs chassis & nitro.']].map(([id,name,role,initials,color,cooldown,upgradeCost,desc])=>({id,name,role,initials,color,cooldown,upgradeCost,desc}));

export const RADIO_STATIONS=[['synth','SOLARA SYNTH 98.4',114,'synthwave'],['funk','CALA FUNK 104.2',106,'funk'],['chill','PALMERA CHILL 89.7',90,'chill'],['off','RADIO OFF',0,'off']].map(([id,name,bpm,style])=>({id,name,bpm,style}));

export const GARAGE_PAINTS=[['Lagoon Cyan',0x00d4e6,'#00d4e6'],['Coral Sunset',0xff4068,'#ff4068'],['Solar Gold',0xffb030,'#ffb030'],['Pearl White',0xf4f7fc,'#f4f7fc'],['Caldera Violet',0x7648ff,'#7648ff'],['Emerald Bay',0x22e492,'#22e492'],['Obsidian Matte',0x1a202c,'#1a202c']].map(([name,hex,css])=>({name,hex,css}));

function S(name,width,height,length,maxSpeed,reverseSpeed,accel,brake,steerRate,grip,driftGrip,maxHp,mass,colors){return{name,width,height,length,maxSpeed,reverseSpeed,accel,brake,steerRate,grip,driftGrip,maxHp,mass,colors};}

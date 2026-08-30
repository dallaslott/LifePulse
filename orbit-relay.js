(() => {
'use strict';

const VERSION='5.146.0';
const SCORE_KEY='lifepulse-orbit-relay-high-score';
const VIEW_KEY='lifepulse-orbit-relay-view';
const PLANETS=[
  {name:'Mercury',base:'#7e7770',light:'#cbc2b8',size:3.2,bands:10},
  {name:'Venus',base:'#a9682f',light:'#ffd08c',size:4.4,bands:18},
  {name:'Earth',base:'#1557a0',light:'#65d6ff',size:4.6,earth:true},
  {name:'Mars',base:'#8f2f20',light:'#ef8158',size:3.8,bands:8},
  {name:'Jupiter',base:'#8f6548',light:'#f4c292',size:9.6,bands:34,storm:true},
  {name:'Saturn',base:'#a98a4d',light:'#ffe2a0',size:8.2,bands:25,rings:true},
  {name:'Uranus',base:'#55aeb8',light:'#b8ffff',size:6.2,bands:6,rings:true},
  {name:'Neptune',base:'#264cbd',light:'#759bff',size:6,bands:12}
];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const rand=(a,b)=>a+Math.random()*(b-a);
const choose=a=>a[Math.floor(Math.random()*a.length)];

let ui={},renderer,scene,camera,world,ship,planetMesh,planetHalo,planetRings,gate,stars,speedLines,graphicsReady=false,bound=false;
let wormhole=null,nebulae=null,nebulaTextures=[];
let state=null,lastFocus=null,pointerId=null;
const keys=new Set(),obstacles=[],particles=[],courseRings=[];
const WORMHOLE_LEGS=new Set([1,3,5,7]);
const OBJECTIVES=[
  {label:'Thread the orbital gate',type:'gate',target:1},
  {label:'Collect 2 relay bonuses',type:'pickup',target:2},
  {label:'Score 2 close-call flybys',type:'near',target:2},
  {label:'Hold a x2 flight streak',type:'combo',target:2}
];

function sound(name){try{window.playInterfaceSound?.(name);}catch{}}
function bestScore(){try{return Number(localStorage.getItem(SCORE_KEY)||0);}catch{return 0;}}
function saveScore(value){try{localStorage.setItem(SCORE_KEY,String(Math.max(value,bestScore())));}catch{}}
function savedView(){try{return localStorage.getItem(VIEW_KEY)==='cockpit'?'cockpit':'chase';}catch{return'chase';}}
function saveView(value){try{localStorage.setItem(VIEW_KEY,value);}catch{}}

function resetState(){
  state={version:VERSION,running:false,raf:0,last:0,view:savedView(),x:0,y:0,targetX:0,targetY:0,
    leg:0,progress:0,gateChecked:false,score:0,shields:3,boost:100,boosting:false,spawn:0,elapsed:0,
    checkpointCount:0,invulnerable:0,shake:0,flash:0,width:900,height:560,combo:0,multiplier:1,
    bestMultiplier:1,nearMisses:0,pickups:0,timeDilation:0,timeWarp:0,phase:0,warpFlash:0,
    wormholeSpawned:false,wormholes:0,objective:null,objectiveValue:0,objectiveComplete:false,
    hudClock:0,sectorBonus:0,surge:0,surgeTriggered:false};
}

function disposeObject(object){
  if(!object)return;
  object.traverse?.(node=>{node.geometry?.dispose?.();if(node.material){(Array.isArray(node.material)?node.material:[node.material]).forEach(material=>{material.map?.dispose?.();material.dispose?.();});}});
}

function comboStep(amount=1){
  state.combo=Math.max(0,state.combo+amount);
  state.multiplier=clamp(1+Math.floor(state.combo/3),1,5);
  state.bestMultiplier=Math.max(state.bestMultiplier,state.multiplier);
  if(state.objective?.type==='combo'){state.objectiveValue=Math.max(state.objectiveValue,state.multiplier);checkObjective();}
}

function breakCombo(){state.combo=0;state.multiplier=1;}
function award(points){const total=Math.round(points*state.multiplier);state.score+=total;return total;}

function setObjective(){
  const source=OBJECTIVES[(state.leg+Math.floor(Math.random()*OBJECTIVES.length))%OBJECTIVES.length];
  state.objective={...source};state.objectiveValue=source.type==='combo'?state.multiplier:0;state.objectiveComplete=false;
  updateObjective();
}

function checkObjective(){
  if(!state.objective||state.objectiveComplete||state.objectiveValue<state.objective.target)return;
  state.objectiveComplete=true;state.sectorBonus+=750;const points=award(750);
  showWarning(`Sector Bonus +${points.toLocaleString()}`,'bonus');createBurst(new THREE.Vector3(state.x,state.y,-2),0xb99cff,28);sound('detail-open');
  updateObjective();
}

function updateObjective(){
  if(!ui.objective||!state?.objective)return;
  const value=Math.min(state.objectiveValue,state.objective.target);
  ui.objective.innerHTML=`<span>Sector ${state.leg+1}</span><strong>${state.objective.label}</strong><em>${state.objectiveComplete?'COMPLETE':`${value} / ${state.objective.target}`}</em>`;
  ui.objective.classList.toggle('is-complete',state.objectiveComplete);
}

function planetTexture(config){
  const canvas=document.createElement('canvas');canvas.width=768;canvas.height=384;const c=canvas.getContext('2d');
  const g=c.createLinearGradient(0,0,0,384);g.addColorStop(0,config.light);g.addColorStop(.48,config.base);g.addColorStop(1,'#17131b');c.fillStyle=g;c.fillRect(0,0,768,384);
  const bands=config.bands||8;
  for(let i=0;i<bands;i+=1){const y=rand(8,376),h=rand(2,18);c.fillStyle=`rgba(${rand(120,255)|0},${rand(100,210)|0},${rand(70,180)|0},${rand(.035,.16)})`;c.fillRect(0,y,768,h);}
  if(config.earth){
    c.fillStyle='rgba(45,145,80,.9)';for(let i=0;i<24;i+=1){c.beginPath();c.ellipse(rand(0,768),rand(45,338),rand(16,70),rand(7,28),rand(-1,1),0,Math.PI*2);c.fill();}
    c.strokeStyle='rgba(255,255,255,.55)';c.lineWidth=5;for(let i=0;i<18;i+=1){c.beginPath();c.moveTo(rand(0,650),rand(30,350));c.bezierCurveTo(rand(150,300),rand(20,360),rand(400,600),rand(20,360),rand(600,768),rand(20,360));c.stroke();}
  }
  if(config.storm){c.fillStyle='rgba(175,74,45,.72)';c.beginPath();c.ellipse(560,245,64,24,-.08,0,Math.PI*2);c.fill();}
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=renderer?.capabilities.getMaxAnisotropy?.()||1;return texture;
}

function glowMaterial(color,opacity=.45){return new THREE.MeshBasicMaterial({color,transparent:true,opacity,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide});}

function createShip(){
  const group=new THREE.Group();
  const hullMat=new THREE.MeshStandardMaterial({color:0xb9d9e7,metalness:.82,roughness:.22});
  const darkMat=new THREE.MeshStandardMaterial({color:0x151d2c,metalness:.72,roughness:.3});
  const blueMat=new THREE.MeshStandardMaterial({color:0x2c73b9,metalness:.55,roughness:.18,emissive:0x082848,emissiveIntensity:.8});
  const body=new THREE.Mesh(new THREE.CylinderGeometry(.62,.92,4.9,16),hullMat);body.rotation.x=Math.PI/2;body.position.z=-.1;group.add(body);
  const nose=new THREE.Mesh(new THREE.ConeGeometry(.62,2.25,16),hullMat);nose.rotation.x=-Math.PI/2;nose.position.z=-3.55;group.add(nose);
  const canopy=new THREE.Mesh(new THREE.SphereGeometry(.56,18,10,0,Math.PI*2,0,Math.PI*.56),blueMat);canopy.scale.set(1,.48,1.5);canopy.position.set(0,.55,-1.2);group.add(canopy);
  const wingShape=new THREE.Shape();wingShape.moveTo(0,0);wingShape.lineTo(3.25,1.7);wingShape.lineTo(2.75,-.8);wingShape.lineTo(.25,-1.45);wingShape.closePath();
  const wingGeo=new THREE.ShapeGeometry(wingShape);
  const rightWing=new THREE.Mesh(wingGeo,hullMat);rightWing.rotation.x=-Math.PI/2;rightWing.position.set(.35,-.18,.65);group.add(rightWing);
  const leftWing=rightWing.clone();leftWing.scale.x=-1;leftWing.position.x=-.35;group.add(leftWing);
  [-.52,.52].forEach(x=>{
    const engine=new THREE.Mesh(new THREE.CylinderGeometry(.27,.38,1.7,14),darkMat);engine.rotation.x=Math.PI/2;engine.position.set(x,-.18,2.12);group.add(engine);
    const flame=new THREE.Mesh(new THREE.ConeGeometry(.23,2.8,12,1,true),glowMaterial(0x55dfff,.78));flame.rotation.x=-Math.PI/2;flame.position.set(x,-.18,3.75);flame.name='engineFlame';group.add(flame);
    const light=new THREE.PointLight(0x4bcfff,2.5,8);light.position.set(x,-.18,3.15);group.add(light);
  });
  const fin=new THREE.Mesh(new THREE.BoxGeometry(.14,1.65,2.2),darkMat);fin.position.set(0,.68,1.35);fin.rotation.x=.2;group.add(fin);
  group.scale.setScalar(.72);return group;
}

function createStars(){
  const count=2200,positions=new Float32Array(count*3),colors=new Float32Array(count*3);
  const color=new THREE.Color();
  for(let i=0;i<count;i+=1){positions[i*3]=rand(-85,85);positions[i*3+1]=rand(-48,48);positions[i*3+2]=rand(-180,8);color.setHSL(rand(.52,.72),rand(.25,.75),rand(.65,1));colors.set([color.r,color.g,color.b],i*3);}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(positions,3));geo.setAttribute('color',new THREE.BufferAttribute(colors,3));
  stars=new THREE.Points(geo,new THREE.PointsMaterial({size:.22,vertexColors:true,transparent:true,opacity:.9,sizeAttenuation:true,depthWrite:false}));scene.add(stars);
  const lineCount=360,linePositions=new Float32Array(lineCount*6);
  for(let i=0;i<lineCount;i+=1){const x=rand(-55,55),y=rand(-32,32),z=rand(-170,4);linePositions.set([x,y,z,x,y,z-2],i*6);}
  const lineGeo=new THREE.BufferGeometry();lineGeo.setAttribute('position',new THREE.BufferAttribute(linePositions,3));
  speedLines=new THREE.LineSegments(lineGeo,new THREE.LineBasicMaterial({color:0x89dfff,transparent:true,opacity:.16,blending:THREE.AdditiveBlending,depthWrite:false}));scene.add(speedLines);
}

function makeNebulaTexture(color){
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;const c=canvas.getContext('2d');
  const gradient=c.createRadialGradient(128,128,4,128,128,126);gradient.addColorStop(0,`rgba(${color.r},${color.g},${color.b},.72)`);gradient.addColorStop(.34,`rgba(${color.r},${color.g},${color.b},.26)`);gradient.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=gradient;c.fillRect(0,0,256,256);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}

function createNebulae(){
  nebulae=new THREE.Group();scene.add(nebulae);
  nebulaTextures=[makeNebulaTexture({r:36,g:95,b:180}),makeNebulaTexture({r:102,g:50,b:184}),makeNebulaTexture({r:18,g:142,b:156})];
  for(let i=0;i<18;i+=1){
    const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:nebulaTextures[i%nebulaTextures.length],transparent:true,opacity:rand(.1,.26),blending:THREE.AdditiveBlending,depthWrite:false}));
    sprite.position.set(rand(-55,55),rand(-30,30),rand(-178,-25));const scale=rand(18,44);sprite.scale.set(scale,scale*.62,1);sprite.userData.drift=rand(.55,1.5);nebulae.add(sprite);
  }
}

function makeWormhole(){
  const group=new THREE.Group();
  const colors=[0x57efff,0x816cff,0xe989ff,0x5bdeff];
  for(let i=0;i<9;i+=1){
    const ring=new THREE.Mesh(new THREE.TorusGeometry(3.2+i*.34,.085+i*.012,10,64),glowMaterial(colors[i%colors.length],.72-i*.045));ring.position.z=i*.32;ring.rotation.z=i*.36;ring.userData.spin=(i%2?1:-1)*(.8+i*.12);group.add(ring);
  }
  const core=new THREE.Mesh(new THREE.CircleGeometry(5.7,64),new THREE.MeshBasicMaterial({color:0x1a1148,transparent:true,opacity:.5,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));core.position.z=3.2;group.add(core);
  const light=new THREE.PointLight(0x8e71ff,16,35);light.position.z=3;group.add(light);return group;
}

function spawnWormhole(){
  if(wormhole||state.wormholeSpawned)return;
  const mesh=makeWormhole(),target=gateTarget();mesh.position.set(clamp(target.x+rand(-4.5,4.5),-8,8),clamp(target.y+rand(-3,3),-5,5),-112);world.add(mesh);
  wormhole={mesh,checked:false};state.wormholeSpawned=true;showWarning('Wormhole Vector Detected','warp');
}

function clearWormhole(){if(!wormhole)return;world.remove(wormhole.mesh);disposeObject(wormhole.mesh);wormhole=null;}

function activateWormhole(){
  if(!wormhole)return;const position=wormhole.mesh.position.clone();clearWormhole();state.wormholes+=1;state.timeWarp=2.4;state.phase=2.8;state.invulnerable=Math.max(state.invulnerable,2.8);state.warpFlash=1;state.boost=100;state.progress=Math.min(.9,state.progress+.075);comboStep(2);const points=award(1250);
  createBurst(position,0xa27dff,52);showWarning(`Time Warp +${points.toLocaleString()}`,'warp');ui.overlay?.classList.add('is-warping');sound('drawer-open');navigator.vibrate?.([28,30,55]);
}

function updateWormhole(delta,speed){
  if(!wormhole)return;const mesh=wormhole.mesh;mesh.position.z+=speed*delta*1.08;mesh.children.forEach(child=>{if(child.userData.spin)child.rotation.z+=child.userData.spin*delta;});mesh.rotation.z+=delta*.18;const swell=1+Math.sin(state.elapsed*8)*.035;mesh.scale.setScalar(swell);
  if(!wormhole.checked&&mesh.position.z>-1.5){wormhole.checked=true;const distance=Math.hypot(mesh.position.x-state.x,mesh.position.y-state.y);if(distance<4.1){activateWormhole();return;}showWarning('Wormhole Bypassed');}
  if(wormhole&&mesh.position.z>14)clearWormhole();
}

function makePlanet(index){
  if(planetMesh){world.remove(planetMesh);planetMesh.geometry.dispose();planetMesh.material.map?.dispose();planetMesh.material.dispose();}
  if(planetHalo){world.remove(planetHalo);planetHalo.geometry.dispose();planetHalo.material.dispose();}
  if(planetRings){world.remove(planetRings);planetRings.geometry.dispose();planetRings.material.dispose();planetRings=null;}
  const config=PLANETS[index];
  const material=new THREE.MeshStandardMaterial({map:planetTexture(config),roughness:.78,metalness:0});
  planetMesh=new THREE.Mesh(new THREE.SphereGeometry(config.size,48,32),material);planetMesh.position.set(0,3,-116);world.add(planetMesh);
  planetHalo=new THREE.Mesh(new THREE.SphereGeometry(config.size*1.045,40,24),glowMaterial(config.light,.13));planetHalo.position.copy(planetMesh.position);world.add(planetHalo);
  if(config.rings){planetRings=new THREE.Mesh(new THREE.RingGeometry(config.size*1.25,config.size*2.05,96),new THREE.MeshBasicMaterial({color:config.light,transparent:true,opacity:.42,side:THREE.DoubleSide,depthWrite:false}));planetRings.rotation.x=Math.PI*.42;planetRings.position.copy(planetMesh.position);world.add(planetRings);}
}

function createGate(){
  gate=new THREE.Group();
  const torus=new THREE.Mesh(new THREE.TorusGeometry(5.4,.16,12,72),new THREE.MeshStandardMaterial({color:0x7deaff,emissive:0x179dc4,emissiveIntensity:5,metalness:.6,roughness:.18}));gate.add(torus);
  const outer=new THREE.Mesh(new THREE.TorusGeometry(6.05,.055,8,72),glowMaterial(0xa081ff,.8));gate.add(outer);
  for(let i=0;i<8;i+=1){const marker=new THREE.Mesh(new THREE.BoxGeometry(.18,.62,.18),glowMaterial(i%2?0x73eaff:0xb88cff,.9));const angle=i*Math.PI/4;marker.position.set(Math.cos(angle)*5.7,Math.sin(angle)*5.7,0);marker.rotation.z=angle;gate.add(marker);}
  world.add(gate);
}

function createCourseRings(){
  for(let i=0;i<6;i+=1){const mesh=new THREE.Mesh(new THREE.TorusGeometry(8.5,.035,6,64),glowMaterial(i%2?0x315c9d:0x5145a7,.22));mesh.position.z=-18-i*18;world.add(mesh);courseRings.push(mesh);}
}

function setupThree(){
  renderer=new THREE.WebGLRenderer({canvas:ui.canvas,antialias:true,alpha:false,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
  scene=new THREE.Scene();scene.background=new THREE.Color(0x01030a);scene.fog=new THREE.FogExp2(0x020611,.011);
  camera=new THREE.PerspectiveCamera(68,1,.1,300);scene.add(camera);
  world=new THREE.Group();scene.add(world);
  scene.add(new THREE.HemisphereLight(0x679bd7,0x10081d,1.15));
  const key=new THREE.DirectionalLight(0xd8efff,3.2);key.position.set(-7,11,8);scene.add(key);
  const rim=new THREE.PointLight(0x7755ff,18,80);rim.position.set(12,-5,-25);scene.add(rim);
  createStars();createNebulae();ship=createShip();world.add(ship);createGate();createCourseRings();makePlanet(0);
}

function fit(){if(!renderer||!ui.stage)return;const rect=ui.stage.getBoundingClientRect();state.width=rect.width;state.height=rect.height;renderer.setSize(Math.max(1,rect.width),Math.max(1,rect.height),false);camera.aspect=Math.max(.1,rect.width/Math.max(1,rect.height));camera.updateProjectionMatrix();}
function gateTarget(){const phase=state.leg*1.71;return{x:Math.sin(phase)*6.4,y:Math.cos(phase*.82)*3.8};}

function makeAsteroid(){
  const geo=new THREE.IcosahedronGeometry(rand(.65,1.7),2);const attr=geo.attributes.position;
  for(let i=0;i<attr.count;i+=1){const scale=rand(.78,1.22);attr.setXYZ(i,attr.getX(i)*scale,attr.getY(i)*scale,attr.getZ(i)*scale);}geo.computeVertexNormals();
  return new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:choose([0x4d4541,0x68554a,0x363a43]),roughness:.93,metalness:.08}));
}
function makeSatellite(){
  const group=new THREE.Group(),metal=new THREE.MeshStandardMaterial({color:0x9eabb7,metalness:.82,roughness:.28}),panel=new THREE.MeshStandardMaterial({color:0x17386c,emissive:0x07142e,emissiveIntensity:1.2,metalness:.35,roughness:.25});
  const body=new THREE.Mesh(new THREE.CylinderGeometry(.45,.45,1.7,10),metal);body.rotation.z=Math.PI/2;group.add(body);
  [-1,1].forEach(side=>{const wing=new THREE.Mesh(new THREE.BoxGeometry(2.4,.08,1.15),panel);wing.position.x=side*1.65;group.add(wing);});return group;
}
function makePanel(){const group=new THREE.Group(),frame=new THREE.Mesh(new THREE.BoxGeometry(3.8,.13,1.7),new THREE.MeshStandardMaterial({color:0x183c70,metalness:.45,roughness:.3,emissive:0x061229,emissiveIntensity:1.4}));group.add(frame);for(let i=-2;i<=2;i+=1){const bar=new THREE.Mesh(new THREE.BoxGeometry(.035,.15,1.72),new THREE.MeshBasicMaterial({color:0x7fc7e7}));bar.position.x=i*.72;group.add(bar);}return group;}
function makeEnergy(){const group=new THREE.Group();group.add(new THREE.Mesh(new THREE.TorusGeometry(1.05,.14,12,36),glowMaterial(0x5eeaff,.95)));group.add(new THREE.Mesh(new THREE.OctahedronGeometry(.32),glowMaterial(0xd5ffff,.95)));const light=new THREE.PointLight(0x5eeaff,5,12);group.add(light);return group;}

function makeShield(){
  const group=new THREE.Group(),material=glowMaterial(0x66ffb8,.9);group.add(new THREE.Mesh(new THREE.IcosahedronGeometry(.92,1),material));
  const ring=new THREE.Mesh(new THREE.TorusGeometry(1.35,.08,10,36),glowMaterial(0xb8ffe1,.82));ring.rotation.x=Math.PI/2.8;group.add(ring);group.add(new THREE.PointLight(0x61ffb4,4,10));return group;
}

function makeChronon(){
  const group=new THREE.Group();const outer=new THREE.Mesh(new THREE.TorusKnotGeometry(.72,.16,72,10,2,3),glowMaterial(0xc88cff,.92));group.add(outer);
  const core=new THREE.Mesh(new THREE.OctahedronGeometry(.42),glowMaterial(0xf6dcff,.95));group.add(core);group.add(new THREE.PointLight(0xc07cff,5,12));return group;
}

function makeMultiplier(){
  const group=new THREE.Group();for(let i=0;i<3;i+=1){const shard=new THREE.Mesh(new THREE.TetrahedronGeometry(.7),glowMaterial(0xffd76d,.95));const angle=i*Math.PI*2/3;shard.position.set(Math.cos(angle)*.85,Math.sin(angle)*.85,0);shard.rotation.z=angle;group.add(shard);}group.add(new THREE.PointLight(0xffc857,5,12));return group;
}

function makeMine(){
  const group=new THREE.Group(),core=new THREE.Mesh(new THREE.DodecahedronGeometry(.82,0),new THREE.MeshStandardMaterial({color:0x33101a,emissive:0xff284f,emissiveIntensity:1.8,metalness:.55,roughness:.3}));group.add(core);
  for(let i=0;i<8;i+=1){const spike=new THREE.Mesh(new THREE.ConeGeometry(.13,.85,7),new THREE.MeshStandardMaterial({color:0xaeb5c4,metalness:.8,roughness:.24}));const angle=i*Math.PI/4;spike.rotation.z=angle-Math.PI/2;spike.position.set(Math.cos(angle)*.9,Math.sin(angle)*.9,0);group.add(spike);}group.add(new THREE.PointLight(0xff355c,4,9));return group;
}

function spawnObstacle(){
  const roll=Math.random();let type;
  if(roll<.16)type='energy';else if(roll<.215)type='shield';else if(roll<.285)type='chronon';else if(roll<.34)type='multiplier';else type=choose(state.leg>2?['asteroid','asteroid','satellite','panel','mine']:['asteroid','asteroid','satellite','panel']);
  const object=type==='energy'?makeEnergy():type==='shield'?makeShield():type==='chronon'?makeChronon():type==='multiplier'?makeMultiplier():type==='satellite'?makeSatellite():type==='panel'?makePanel():type==='mine'?makeMine():makeAsteroid();
  object.position.set(rand(-10,10),rand(-6.5,6.5),-105);object.rotation.set(rand(0,6),rand(0,6),rand(0,6));world.add(object);
  const bonus=['energy','shield','chronon','multiplier'].includes(type);
  obstacles.push({mesh:object,type,bonus,radius:bonus?1.15:type==='asteroid'?1.4:type==='mine'?1.25:1.8,spin:new THREE.Vector3(rand(-1.6,1.6),rand(-1.6,1.6),rand(-1.6,1.6)),driftX:rand(-.8,.8),driftY:rand(-.55,.55),checked:false,nearChecked:false});
}
function clearObjects(){while(obstacles.length){const item=obstacles.pop();world.remove(item.mesh);disposeObject(item.mesh);}clearWormhole();}

function createBurst(position,color,count=24){
  for(let i=0;i<count;i+=1){const mesh=new THREE.Mesh(new THREE.TetrahedronGeometry(rand(.06,.18)),glowMaterial(color,1));mesh.position.copy(position);world.add(mesh);particles.push({mesh,velocity:new THREE.Vector3(rand(-7,7),rand(-7,7),rand(-3,8)),life:rand(.35,.9)});}
}
function showWarning(text){if(!ui.warning)return;ui.warning.textContent=text;ui.warning.classList.remove('is-visible');void ui.warning.offsetWidth;ui.warning.classList.add('is-visible');setTimeout(()=>ui.warning?.classList.remove('is-visible'),700);}
function impact(position){if(state.invulnerable>0)return;state.shields-=1;state.score=Math.max(0,state.score-350);state.invulnerable=1.1;state.shake=.5;state.flash=.65;createBurst(position,0xff3d60,32);showWarning('Collision • Shield Damaged');sound('detail-close');navigator.vibrate?.([90,35,130]);}

function showWarning(text,tone='danger'){
  if(!ui.warning)return;ui.warning.textContent=text;ui.warning.dataset.tone=tone;ui.warning.classList.remove('is-visible');void ui.warning.offsetWidth;ui.warning.classList.add('is-visible');setTimeout(()=>ui.warning?.classList.remove('is-visible'),850);
}
function impact(position){
  if(state.invulnerable>0)return;state.shields-=1;state.score=Math.max(0,state.score-350);state.invulnerable=1.15;state.shake=.55;state.flash=.7;breakCombo();createBurst(position,0xff3d60,32);showWarning('Collision - Shield Damaged');sound('detail-close');navigator.vibrate?.([90,35,130]);
}

function collectBonus(item,position){
  state.pickups+=1;if(state.objective?.type==='pickup')state.objectiveValue+=1;comboStep(1);let points=0,color=0x65eaff,label='Relay Bonus';
  if(item.type==='energy'){state.boost=clamp(state.boost+34,0,100);points=award(300);label=`Boost Cell +${points.toLocaleString()}`;color=0x65eaff;}
  if(item.type==='shield'){state.shields=clamp(state.shields+1,0,4);state.phase=Math.max(state.phase,1.3);points=award(450);label=`Shield Restored +${points.toLocaleString()}`;color=0x66ffb8;}
  if(item.type==='chronon'){state.timeDilation=5;state.phase=Math.max(state.phase,1.6);points=award(600);label=`Time Dilation +${points.toLocaleString()}`;color=0xc88cff;ui.overlay?.classList.add('is-time-dilated');}
  if(item.type==='multiplier'){comboStep(3);points=award(500);label=`Streak Amplified x${state.multiplier}`;color=0xffd76d;}
  checkObjective();createBurst(position,color,26);showWarning(label,'bonus');sound('detail-open');navigator.vibrate?.(22);
}

function updateObjects(delta,speed){
  const motionScale=state.timeDilation>0?.48:1;
  for(let i=obstacles.length-1;i>=0;i-=1){const item=obstacles[i],mesh=item.mesh;mesh.position.z+=speed*delta*motionScale;mesh.position.x+=item.driftX*delta*motionScale;mesh.position.y+=item.driftY*delta*motionScale;mesh.rotation.x+=item.spin.x*delta;mesh.rotation.y+=item.spin.y*delta;mesh.rotation.z+=item.spin.z*delta;
    const distance=Math.hypot(mesh.position.x-state.x,mesh.position.y-state.y);
    if(!item.checked&&mesh.position.z>-1.4){item.checked=true;if(distance<item.radius+1){if(item.bonus)collectBonus(item,mesh.position);else impact(mesh.position);world.remove(mesh);disposeObject(mesh);obstacles.splice(i,1);continue;}}
    if(!item.bonus&&!item.nearChecked&&mesh.position.z>1.5){item.nearChecked=true;if(distance>=item.radius+1&&distance<item.radius+3.1){state.nearMisses+=1;if(state.objective?.type==='near')state.objectiveValue+=1;comboStep(1);const points=award(180);showWarning(`Close Call +${points.toLocaleString()}`,'bonus');checkObjective();}}
    if(mesh.position.z>15){world.remove(mesh);disposeObject(mesh);obstacles.splice(i,1);}
  }
  particles.forEach(p=>{p.mesh.position.addScaledVector(p.velocity,delta);p.mesh.rotation.x+=delta*4;p.mesh.rotation.y+=delta*3;p.life-=delta;p.mesh.material.opacity=clamp(p.life*1.8,0,1);});
  for(let i=particles.length-1;i>=0;i-=1)if(particles[i].life<=0){world.remove(particles[i].mesh);particles[i].mesh.geometry.dispose();particles[i].mesh.material.dispose();particles.splice(i,1);}
}

function updateStars(delta,speed){
  const warpScale=state.timeWarp>0?2.35:1;
  const pos=stars.geometry.attributes.position;
  for(let i=0;i<pos.count;i+=1){let z=pos.getZ(i)+speed*delta*warpScale;if(z>10){z=rand(-190,-150);pos.setX(i,rand(-85,85));pos.setY(i,rand(-48,48));}pos.setZ(i,z);}pos.needsUpdate=true;
  const lines=speedLines.geometry.attributes.position;
  const length=state.timeWarp>0?rand(18,36):state.boosting?rand(7,14):rand(1.2,3.4);
  for(let i=0;i<lines.count;i+=2){let z=lines.getZ(i)+speed*delta*warpScale;if(z>10){z=rand(-180,-130);const x=rand(-58,58),y=rand(-34,34);lines.setX(i,x);lines.setY(i,y);lines.setX(i+1,x);lines.setY(i+1,y);}lines.setZ(i,z);lines.setZ(i+1,z-length);}lines.needsUpdate=true;
  speedLines.material.opacity=state.timeWarp>0?.84:state.boosting?.58:.11;
  nebulae?.children.forEach(sprite=>{sprite.position.z+=speed*delta*.08*sprite.userData.drift;if(sprite.position.z>2){sprite.position.z=rand(-180,-135);sprite.position.x=rand(-55,55);sprite.position.y=rand(-30,30);}});
}

function setBoost(active){if(!state||(active&&!state.running))return;state.boosting=Boolean(active)&&state.boost>1;ui.boost?.classList.toggle('is-active',state.boosting);}
function switchView(){if(!state)return;state.view=state.view==='cockpit'?'chase':'cockpit';saveView(state.view);updateHud();sound('detail-open');}

function checkGate(){if(state.gateChecked||gate.position.z<-1.8)return;state.gateChecked=true;const target=gateTarget(),distance=Math.hypot(state.x-target.x,state.y-target.y);
  if(distance<4.2){const precision=distance<1.35?'Perfect Vector':distance<2.7?'Precision Gate':'Orbit Cleared';const base=distance<1.35?1550:distance<2.7?1250:1000;comboStep(distance<2.7?2:1);const points=award(base+state.leg*175);state.checkpointCount+=1;state.boost=clamp(state.boost+24,0,100);if(state.objective?.type==='gate')state.objectiveValue=1;checkObjective();createBurst(new THREE.Vector3(target.x,target.y,0),distance<1.35?0xffdc7a:0x72efff,42);showWarning(`${precision} +${points.toLocaleString()}`,'bonus');sound('detail-open');navigator.vibrate?.([25,25,25]);}
  else{impact(new THREE.Vector3(state.x,state.y,0));showWarning(`${PLANETS[state.leg].name} Gate Missed`);}}
function nextLeg(){if(state.leg>=PLANETS.length-1){finish(true);return;}state.leg+=1;state.progress=0;state.gateChecked=false;state.wormholeSpawned=false;state.surgeTriggered=false;clearObjects();makePlanet(state.leg);setObjective();buildRoute();showWarning(`Entering ${PLANETS[state.leg].name} Sector`,'warp');updateHud(true);}

function update(delta){
  state.elapsed+=delta;state.invulnerable=Math.max(0,state.invulnerable-delta);state.flash=Math.max(0,state.flash-delta);state.shake*=Math.pow(.02,delta);state.timeDilation=Math.max(0,state.timeDilation-delta);state.timeWarp=Math.max(0,state.timeWarp-delta);state.phase=Math.max(0,state.phase-delta);state.warpFlash=Math.max(0,state.warpFlash-delta*1.8);state.surge=Math.max(0,state.surge-delta);
  ui.overlay?.classList.toggle('is-warping',state.timeWarp>0);ui.overlay?.classList.toggle('is-time-dilated',state.timeDilation>0);ui.overlay?.classList.toggle('is-phased',state.phase>0);
  const steer=14;if(keys.has('arrowleft')||keys.has('a'))state.targetX-=steer*delta;if(keys.has('arrowright')||keys.has('d'))state.targetX+=steer*delta;if(keys.has('arrowup')||keys.has('w'))state.targetY+=steer*delta;if(keys.has('arrowdown')||keys.has('s'))state.targetY-=steer*delta;
  state.targetX=clamp(state.targetX,-11,11);state.targetY=clamp(state.targetY,-7,7);state.x+=(state.targetX-state.x)*Math.min(1,delta*7.5);state.y+=(state.targetY-state.y)*Math.min(1,delta*7.5);
  const boosting=state.boosting&&state.boost>0,cruiseSpeed=33+state.leg*1.35,speed=(boosting?cruiseSpeed*1.52:cruiseSpeed)*(state.timeWarp>0?1.32:1);if(boosting){state.boost=clamp(state.boost-delta*23,0,100);state.score+=Math.round(delta*30*state.multiplier);}else state.boost=clamp(state.boost+delta*(4.5+state.leg*.2),0,100);if(state.boost<=0)setBoost(false);
  state.progress+=delta*(boosting?.137:.09)*(state.timeWarp>0?1.32:1);if(state.leg>=4&&!state.surgeTriggered&&state.progress>.6){state.surgeTriggered=true;state.surge=3.8;showWarning('Debris Surge - Hold Your Line','danger');navigator.vibrate?.([35,30,35]);}state.spawn-=delta;if(state.spawn<=0&&state.progress<.86&&obstacles.length<18){spawnObstacle();const pressure=clamp(1-state.leg*.045,.68,1);state.spawn=rand(.3,.62)*pressure*(boosting?.78:1)*(state.surge>0?.48:1);}
  if(WORMHOLE_LEGS.has(state.leg)&&!state.wormholeSpawned&&state.progress>.27)spawnWormhole();
  const target=gateTarget();gate.position.set(target.x,target.y,-108+state.progress*113);gate.rotation.z+=delta*.7;const gatePulse=1+Math.sin(state.elapsed*5)*.025;gate.scale.setScalar(gatePulse);
  planetMesh.position.set(target.x*1.35,target.y*.9+2,-125+state.progress*96);planetMesh.rotation.y+=delta*.12;planetHalo.position.copy(planetMesh.position);planetHalo.rotation.y+=delta*.08;if(planetRings){planetRings.position.copy(planetMesh.position);planetRings.rotation.z+=delta*.025;}
  courseRings.forEach((ring,index)=>{ring.position.z+=speed*delta;if(ring.position.z>8)ring.position.z=-100-index*9;ring.position.x=target.x*(1-clamp(Math.abs(ring.position.z)/100,0,1));ring.position.y=target.y*(1-clamp(Math.abs(ring.position.z)/100,0,1));});
  updateObjects(delta,speed);updateWormhole(delta,speed);updateStars(delta,speed);checkGate();if(state.progress>=1)nextLeg();
  if(state.shields<=0)finish(false);state.hudClock-=delta;if(state.hudClock<=0){state.hudClock=.075;updateHud();}
}

function updateCamera(delta){
  ship.position.x+=(state.x-ship.position.x)*Math.min(1,delta*9);ship.position.y+=(state.y-1.2-ship.position.y)*Math.min(1,delta*9);ship.rotation.z+=(clamp(-(state.targetX-state.x)*.06,-.6,.6)-ship.rotation.z)*Math.min(1,delta*7);ship.rotation.x+=(clamp((state.targetY-state.y)*.025,-.25,.25)-ship.rotation.x)*Math.min(1,delta*7);
  ship.visible=state.view==='chase';ship.traverse(node=>{if(node.name==='engineFlame')node.scale.y=state.boosting?2.4:1+Math.sin(state.elapsed*22)*.12;});
  if(state.view==='cockpit'){camera.position.x+=(state.x-camera.position.x)*Math.min(1,delta*10);camera.position.y+=(state.y-camera.position.y)*Math.min(1,delta*10);camera.position.z=5.4;camera.lookAt(state.x*.45,state.y*.45,-45);}
  else{camera.position.x+=(state.x*.28-camera.position.x)*Math.min(1,delta*6);camera.position.y+=(3.7+state.y*.16-camera.position.y)*Math.min(1,delta*6);camera.position.z=13.8;camera.lookAt(state.x*.38,state.y*.25-1,-24);}
  const targetFov=state.timeWarp>0?86:state.boosting?74:68;if(Math.abs(camera.fov-targetFov)>.08){camera.fov+=(targetFov-camera.fov)*Math.min(1,delta*5.5);camera.updateProjectionMatrix();}
  if(state.shake>0){camera.position.x+=rand(-state.shake,state.shake);camera.position.y+=rand(-state.shake,state.shake);}
}

function updateHud(){if(!state)return;const p=PLANETS[state.leg];ui.leg.textContent=`${p.name} • Leg ${state.leg+1} of 8`;ui.score.textContent=`Score ${state.score.toLocaleString()}`;ui.shields.textContent=`Shields ${'●'.repeat(state.shields)}${'○'.repeat(Math.max(0,3-state.shields))}`;ui.boostFill.style.transform=`scaleX(${state.boost/100})`;ui.view.textContent=state.view==='cockpit'?'Chase View':'Cockpit View';ui.cockpit?.classList.toggle('is-visible',state.view==='cockpit');if(ui.speed)ui.speed.textContent=`${Math.round((state.boosting?48500:28400)+state.progress*8200).toLocaleString()} KM/S`;}
function updateHud(){
  if(!state)return;const p=PLANETS[state.leg];ui.leg.textContent=`${p.name} - Leg ${state.leg+1} of 8`;ui.score.textContent=`Score ${state.score.toLocaleString()}`;ui.shields.textContent=`Shields ${'◆'.repeat(state.shields)}${'◇'.repeat(Math.max(0,4-state.shields))}`;ui.boostFill.style.transform=`scaleX(${state.boost/100})`;ui.view.textContent=state.view==='cockpit'?'Chase View':'Cockpit View';ui.cockpit?.classList.toggle('is-visible',state.view==='cockpit');
  if(ui.speed)ui.speed.textContent=`${Math.round((state.timeWarp>0?74200:state.boosting?48500:28400)+state.leg*1900+state.progress*8200).toLocaleString()} KM/S`;
  if(ui.combo){ui.combo.textContent=`x${state.multiplier} STREAK`;ui.combo.classList.toggle('is-hot',state.multiplier>1);}
  if(ui.effect){ui.effect.textContent=state.timeWarp>0?'WORMHOLE SURGE':state.timeDilation>0?`TIME DILATION ${state.timeDilation.toFixed(1)}s`:state.phase>0?'PHASE SHIELD':state.surge>0?'DEBRIS SURGE':'FLIGHT STABLE';ui.effect.dataset.effect=state.timeWarp>0?'warp':state.timeDilation>0?'time':state.phase>0?'phase':state.surge>0?'danger':'stable';}
}
function buildRoute(){ui.route.innerHTML=PLANETS.map((p,i)=>`<span class="orbit-relay-route-stop ${i<state.leg?'is-complete':i===state.leg?'is-current':''}"><span class="orbit-relay-route-dot" style="color:${p.light}"></span><span>${p.name}</span></span>`).join('');}

function render(){renderer.render(scene,camera);}
function frame(time){if(!state?.running)return;const delta=state.last?Math.min(.033,(time-state.last)/1000):0;state.last=time;update(delta);updateCamera(delta);render();if(state.running)state.raf=requestAnimationFrame(frame);}
function start(){if(!graphicsReady)throw new Error('The 3D flight scene has not initialized.');cancelAnimationFrame(state?.raf||0);const view=state?.view||savedView();resetState();state.view=view;clearObjects();particles.splice(0).forEach(p=>{world.remove(p.mesh);disposeObject(p.mesh);});makePlanet(0);gate.position.z=-108;fit();state.running=true;state.spawn=.7;ui.message.hidden=true;setObjective();buildRoute();updateHud(true);sound('drawer-open');state.raf=requestAnimationFrame(frame);}
function finish(completed){if(!state?.running)return;state.running=false;cancelAnimationFrame(state.raf);setBoost(false);clearWormhole();ui.overlay?.classList.remove('is-warping','is-time-dilated','is-phased');saveScore(state.score);ui.message.hidden=false;ui.message.innerHTML=`<span class="orbit-relay-kicker">${completed?'Neptune Relay Complete':'Mission Ended'}</span><h2>${state.score.toLocaleString()} Points</h2><p>You cleared <strong>${state.checkpointCount} of 8</strong> orbital gates, entered <strong>${state.wormholes} wormhole${state.wormholes===1?'':'s'}</strong>, and scored <strong>${state.nearMisses} close call${state.nearMisses===1?'':'s'}</strong>.</p><div class="orbit-relay-instructions"><span>Best ${bestScore().toLocaleString()}</span><span>Peak x${state.bestMultiplier}</span><span>${state.pickups} Bonuses</span><span>${Math.round(state.elapsed)} Seconds</span></div><button class="orbit-relay-primary" id="orbit-relay-replay" type="button">Race Again</button>`;sound(completed?'detail-open':'detail-close');document.getElementById('orbit-relay-replay')?.focus({preventScroll:true});}
function intro(){const best=bestScore();ui.message.innerHTML=`<span class="orbit-relay-kicker">3D Solar-System Racing - Expanded Flight</span><h2>Orbit Relay</h2><p>Thread precision gates, skim past debris for streak points, collect chronon and shield bonuses, and dive into unstable wormholes from Mercury to Neptune.</p><div class="orbit-relay-instructions"><span>Drag / Swipe</span><span>Arrows or WASD</span><span>Hold Boost</span><span>V Changes View</span><span>Close Calls Build Streaks</span>${best?`<span>Best ${best.toLocaleString()}</span>`:''}</div><button class="orbit-relay-primary" id="orbit-relay-start" type="button">Launch Expanded Relay</button>`;}
function open(){
  if(!bound)bind();
  if(!ui.overlay)return;lastFocus=document.activeElement;document.body.classList.add('orbit-relay-open');ui.overlay.classList.add('is-open');ui.overlay.setAttribute('aria-hidden','false');resetState();intro();ui.message.hidden=false;
  try{
    if(!graphicsReady){setupThree();graphicsReady=true;}
    fit();makePlanet(0);buildRoute();updateHud();updateCamera(.016);render();sound('drawer-open');setTimeout(()=>document.getElementById('orbit-relay-start')?.focus({preventScroll:true}),50);
  }catch(error){graphicsReady=false;showFatal(error);}
}
function close(){if(!ui.overlay?.classList.contains('is-open'))return;if(state)state.running=false;cancelAnimationFrame(state?.raf||0);setBoost(false);clearWormhole();keys.clear();ui.overlay.classList.remove('is-open','is-warping','is-time-dilated','is-phased');ui.overlay.setAttribute('aria-hidden','true');document.body.classList.remove('orbit-relay-open');sound('drawer-close');(lastFocus||document.getElementById('orbit-relay-launch-btn'))?.focus?.({preventScroll:true});}
function steer(event){if(!state?.running)return;const rect=ui.stage.getBoundingClientRect();state.targetX=clamp(((event.clientX-rect.left)/rect.width-.5)*22,-11,11);state.targetY=clamp(-((event.clientY-rect.top)/rect.height-.5)*14,-7,7);}

function showFatal(error){
  console.error('Orbit Relay stopped:',error);if(state)state.running=false;cancelAnimationFrame(state?.raf||0);
  if(!ui.message)return;ui.message.hidden=false;ui.message.innerHTML='<span class="orbit-relay-kicker">Flight Computer Interrupted</span><h2>Orbit Relay Could Not Continue</h2><p>The graphics engine reported an error on this device. Close the game, reload LifePulse, and try once more. Diagnostic Mode will retain the browser error.</p><button class="orbit-relay-primary" id="orbit-relay-retry" type="button">Retry Launch</button>';
}
function safeStart(){try{start();}catch(error){showFatal(error);}}
function safeRetry(){if(!graphicsReady)open();else safeStart();}

function bind(){
  if(bound)return;
  ui={overlay:document.getElementById('orbit-relay-overlay'),stage:document.getElementById('orbit-relay-stage'),canvas:document.getElementById('orbit-relay-canvas'),message:document.getElementById('orbit-relay-message'),view:document.getElementById('orbit-relay-view-toggle'),leg:document.getElementById('orbit-relay-leg'),score:document.getElementById('orbit-relay-score'),shields:document.getElementById('orbit-relay-shields'),boost:document.getElementById('orbit-relay-boost'),boostFill:document.getElementById('orbit-relay-boost-fill'),route:document.getElementById('orbit-relay-route'),cockpit:document.getElementById('orbit-relay-cockpit-frame'),speed:document.getElementById('orbit-relay-speed-readout'),warning:document.getElementById('orbit-relay-impact-warning')};
  if(!ui.overlay||!ui.canvas)return;resetState();
  const hud=document.querySelector('.orbit-relay-hud');
  if(hud&&!document.getElementById('orbit-relay-combo'))hud.insertAdjacentHTML('beforeend','<span class="orbit-relay-combo" id="orbit-relay-combo">x1 STREAK</span>');
  if(ui.stage&&!document.getElementById('orbit-relay-objective'))ui.stage.insertAdjacentHTML('beforeend','<div class="orbit-relay-objective" id="orbit-relay-objective" aria-live="polite"></div><div class="orbit-relay-effect" id="orbit-relay-effect" data-effect="stable">FLIGHT STABLE</div><div class="orbit-relay-warp-flash" aria-hidden="true"></div>');
  ui.combo=document.getElementById('orbit-relay-combo');ui.objective=document.getElementById('orbit-relay-objective');ui.effect=document.getElementById('orbit-relay-effect');
  bound=true;
  window.LifePulseOrbitRelay={open,close,start:safeStart};
  window.addEventListener('lifepulse:orbit-relay-open',open);
  document.getElementById('orbit-relay-close')?.addEventListener('click',close);ui.view?.addEventListener('click',switchView);
  ui.overlay.addEventListener('click',event=>{if(event.target===ui.overlay)close();if(event.target.closest('#orbit-relay-start,#orbit-relay-replay'))safeStart();if(event.target.closest('#orbit-relay-retry'))safeRetry();});
  ui.message.addEventListener('click',event=>{if(event.target.closest('#orbit-relay-start,#orbit-relay-replay')){event.stopPropagation();safeStart();return;}if(event.target.closest('#orbit-relay-retry')){event.stopPropagation();safeRetry();}});
  ui.stage.addEventListener('pointerdown',event=>{if(event.target.closest?.('button,.orbit-relay-message'))return;pointerId=event.pointerId;ui.stage.setPointerCapture?.(event.pointerId);steer(event);});ui.stage.addEventListener('pointermove',event=>{if(pointerId===event.pointerId)steer(event);});ui.stage.addEventListener('pointerup',event=>{if(pointerId===event.pointerId)pointerId=null;});ui.stage.addEventListener('pointercancel',()=>{pointerId=null;});
  const boostOn=e=>{e.preventDefault();setBoost(true);},boostOff=e=>{e.preventDefault();setBoost(false);};ui.boost?.addEventListener('pointerdown',boostOn);ui.boost?.addEventListener('pointerup',boostOff);ui.boost?.addEventListener('pointercancel',boostOff);
  document.addEventListener('keydown',event=>{if(!ui.overlay.classList.contains('is-open'))return;const key=event.key.toLowerCase();if(event.key==='Escape'){close();return;}if(key==='v'){switchView();return;}if(key===' '){event.preventDefault();setBoost(true);}if(['arrowleft','arrowright','arrowup','arrowdown','w','a','s','d'].includes(key)){event.preventDefault();keys.add(key);}});document.addEventListener('keyup',event=>{const key=event.key.toLowerCase();keys.delete(key);if(key===' ')setBoost(false);});window.addEventListener('resize',fit,{passive:true});
  window.addEventListener('error',event=>{if(ui.overlay.classList.contains('is-open')&&state?.running)showFatal(event.error||event.message);});
  window.addEventListener('unhandledrejection',event=>{if(ui.overlay.classList.contains('is-open')&&state?.running)showFatal(event.reason);});
  document.addEventListener('visibilitychange',()=>{if(!state?.running)return;state.last=0;if(document.hidden)setBoost(false);});
}

window.LifePulseOrbitRelay={open,close,start:safeStart};
if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',bind,{once:true});
  if(document.getElementById('orbit-relay-overlay'))bind();
}else bind();

})();

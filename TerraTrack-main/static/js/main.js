// ═══════════════════════════════════════════════════════════════
// DEFORESTATION FACTS FOR LOADING SCREEN
// ═══════════════════════════════════════════════════════════════
var FACTS = [
  {
    text: "The world loses approximately 10 million hectares of forest every year — an area roughly the size of Iceland.",
    source: "Source: FAO, Global Forest Resources Assessment"
  },
  {
    text: "Tropical forests are home to more than half of the world's plant and animal species, despite covering only 6% of Earth's surface.",
    source: "Source: WWF Living Planet Report"
  },
  {
    text: "Deforestation accounts for up to 15% of global greenhouse gas emissions — more than the entire transportation sector.",
    source: "Source: Union of Concerned Scientists"
  },
  {
    text: "The Amazon rainforest produces about 20% of the world's oxygen and is often called the 'lungs of the Earth'.",
    source: "Source: National Geographic"
  },
  {
    text: "Since 1990, the world has lost over 420 million hectares of forest — an area larger than the entire European Union.",
    source: "Source: FAO, State of the World's Forests"
  },
  {
    text: "Forests cover about 31% of the Earth's land area, but this share has been declining steadily for centuries.",
    source: "Source: World Bank"
  },
  {
    text: "It is estimated that 136 million acres of rainforest are cleared each year for agriculture, logging, and development.",
    source: "Source: Rainforest Action Network"
  },
  {
    text: "A single mature tree can absorb up to 22 kg of CO₂ per year. Losing a large tree is like putting several cars back on the road.",
    source: "Source: US Forest Service"
  },
  {
    text: "More than 1.6 billion people — over 25% of the world's population — depend on forests for their livelihoods, food, and fresh water.",
    source: "Source: FAO"
  },
  {
    text: "Indonesia and Brazil together account for nearly 40% of all tropical deforestation on Earth.",
    source: "Source: Global Forest Watch"
  },
  {
    text: "At current deforestation rates, tropical rainforests could vanish entirely within 100 years.",
    source: "Source: NASA Earth Observatory"
  },
  {
    text: "Forests are home to 80% of terrestrial biodiversity. Every minute of deforestation puts thousands of species at risk.",
    source: "Source: WWF"
  },
  {
    text: "Sentinel-2 satellites orbit Earth every 5 days, providing 10-metre resolution imagery used to track forest cover changes in near real time.",
    source: "Source: European Space Agency"
  },
  {
    text: "Reforestation and afforestation could sequester up to 10 billion tonnes of CO₂ per year — about 25% of current global emissions.",
    source: "Source: Science, Bastin et al. 2019"
  },
  {
    text: "The Congo Basin is the world's second largest tropical forest and acts as a critical carbon sink for the African continent.",
    source: "Source: CIFOR"
  }
];

var factTimer = null;
var currentFactIndex = 0;
var FACT_DURATION = 9000;   // ms each fact is shown
var FADE_DURATION = 500;    // ms for opacity crossfade (matches CSS transition)

function shuffleFacts() {
  for (var i = FACTS.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = FACTS[i]; FACTS[i] = FACTS[j]; FACTS[j] = tmp;
  }
  currentFactIndex = 0;
}

function buildDots() {
  var container = document.getElementById('factDots');
  container.innerHTML = '';
  for (var i = 0; i < FACTS.length; i++) {
    var dot = document.createElement('div');
    dot.className = 'fact-dot';
    dot.id = 'fdot-' + i;
    container.appendChild(dot);
  }
}

function updateDots(index) {
  var dots = document.querySelectorAll('.fact-dot');
  dots.forEach(function(d, i) {
    d.classList.toggle('active', i === index);
  });
}

function showNextFact() {
  if (currentFactIndex >= FACTS.length) {
    shuffleFacts();
  }
  var fact = FACTS[currentFactIndex];
  var inner = document.getElementById('factInner');
  var textEl = document.getElementById('factText');
  var srcEl  = document.getElementById('factSource');

  inner.classList.add('fading');

  setTimeout(function() {
    textEl.textContent = fact.text;
    srcEl.textContent  = fact.source;
    updateDots(currentFactIndex % FACTS.length);
    currentFactIndex++;
    inner.classList.remove('fading');
  }, FADE_DURATION);
}

function startFactRotation() {
  shuffleFacts();
  buildDots();
  var fact = FACTS[currentFactIndex];
  document.getElementById('factText').textContent    = fact.text;
  document.getElementById('factSource').textContent  = fact.source;
  updateDots(0);
  currentFactIndex++;
  factTimer = setInterval(showNextFact, FACT_DURATION);
}

function stopFactRotation() {
  if (factTimer) { clearInterval(factTimer); factTimer = null; }
}

// ═══════════════════════════════════════════════════════════════
// 3D EARTH WITH THREE.JS (WELCOME PAGE)
// ═══════════════════════════════════════════════════════════════
var scene, camera, renderer, earth, earthRotationSpeed = 0.001;

function initEarth() {
  var canvas = document.getElementById('earthCanvas');
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 2.4;

  renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);

  var geometry = new THREE.SphereGeometry(1, 64, 64);
  var textureLoader = new THREE.TextureLoader();
  var earthTexture = textureLoader.load('https://unpkg.com/three-globe@2.24.8/example/img/earth-blue-marble.jpg');
  var bumpMap = textureLoader.load('https://unpkg.com/three-globe@2.24.8/example/img/earth-topology.png');

  var material = new THREE.MeshPhongMaterial({
    map: earthTexture,
    bumpMap: bumpMap,
    bumpScale: 0.02,
  });

  earth = new THREE.Mesh(geometry, material);
  scene.add(earth);

  var atmosphereGeometry = new THREE.SphereGeometry(1.015, 64, 64);
  var atmosphereMaterial = new THREE.MeshBasicMaterial({
    color: 0x10b981,
    transparent: true,
    opacity: 0.12,
    side: THREE.BackSide
  });
  var atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
  scene.add(atmosphere);

  var ambientLight = new THREE.AmbientLight(0x404040, 0.6);
  scene.add(ambientLight);

  var directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
  directionalLight.position.set(5, 3, 5);
  scene.add(directionalLight);

  animate();
}

function animate() {
  requestAnimationFrame(animate);
  if (earth) { earth.rotation.y += earthRotationSpeed; }
  renderer.render(scene, camera);
}

window.addEventListener('resize', function() {
  if (camera && renderer) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
});

initEarth();

// ═══════════════════════════════════════════════════════════════
// WELCOME PAGE TRANSITION
// ═══════════════════════════════════════════════════════════════
function enterDashboard() {
  earthRotationSpeed = 0.04;
  var welcome = document.getElementById('welcomePage');
  var dashboard = document.getElementById('dashboard');
  welcome.classList.add('transitioning');
  setTimeout(function() {
    dashboard.classList.add('visible');
    setTimeout(function() { map.invalidateSize(); }, 200);
  }, 1000);
}

// ═══════════════════════════════════════════════════════════════
// MAP & LEAFLET FUNCTIONALITY
// ═══════════════════════════════════════════════════════════════
var map, layers = {}, activeLayer = 'street';
var pinMarker = null, boxRect = null;
var pinLat = null, pinLon = null;
var geeOverlays = {};
var activeOverlay = 'y1';
var lastData = null;

map = L.map('map', { center: [-3.4359, -62.2159], zoom: 6 }); // Default center: Amazon basin

layers.street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { 
  attribution: '&copy; OpenStreetMap', maxZoom: 19 
});
layers.sat = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { 
  attribution: 'Esri', maxZoom: 19 
});
layers.hybrid = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', { 
  attribution: 'Google', maxZoom: 20 
});

layers.street.addTo(map);

window.addEventListener('load', function() { syncYears(); });

map.on('click', function(e) { dropPin(e.latlng.lat, e.latlng.lng); });

function setLayer(name, btn) {
  if (!layers[name]) return;
  map.removeLayer(layers[activeLayer]);
  layers[name].addTo(map);
  activeLayer = name;
  document.querySelectorAll('.map-controls .layer-btn').forEach(function(b){ b.classList.remove('on'); });
  btn.classList.add('on');
}

function setOverlay(name, btn) {
  activeOverlay = name;
  document.querySelectorAll('#overlayRow .layer-btn').forEach(function(b){ b.classList.remove('on'); });
  btn.classList.add('on');
  if (geeOverlays.y1) map.removeLayer(geeOverlays.y1);
  if (geeOverlays.y2) map.removeLayer(geeOverlays.y2);
  if (name === 'y1' && geeOverlays.y1) geeOverlays.y1.addTo(map);
  if (name === 'y2' && geeOverlays.y2) geeOverlays.y2.addTo(map);
}

function applyGeeOverlays(tileUrl1, tileUrl2, bbox) {
  if (geeOverlays.y1) { map.removeLayer(geeOverlays.y1); }
  if (geeOverlays.y2) { map.removeLayer(geeOverlays.y2); }
  geeOverlays.y1 = L.tileLayer(tileUrl1, { opacity: 0.95, maxZoom: 20, tileSize: 256 });
  geeOverlays.y2 = L.tileLayer(tileUrl2, { opacity: 0.95, maxZoom: 20, tileSize: 256 });
  geeOverlays.y1.addTo(map);
  activeOverlay = 'y1';
  document.querySelectorAll('#overlayRow .layer-btn').forEach(function(b){ b.classList.remove('on'); });
  document.getElementById('ovY1').classList.add('on');
  map.fitBounds([bbox.sw, bbox.ne], { padding: [20, 20] });
  document.getElementById('overlayRow').style.display = 'flex';
}

function dropPin(lat, lon) {
  pinLat = lat; pinLon = lon;
  document.getElementById('latIn').value = lat.toFixed(5);
  document.getElementById('lonIn').value = lon.toFixed(5);
  var icon = L.divIcon({ 
    className:'', 
    html:'<div style="width:14px;height:14px;border-radius:50%;background:#10b981;border:3px solid #090d16;box-shadow:0 0 10px rgba(16,185,129,0.7)"></div>', 
    iconSize:[14,14], 
    iconAnchor:[7,7] 
  });
  if (pinMarker) map.removeLayer(pinMarker);
  pinMarker = L.marker([lat,lon], {icon:icon}).addTo(map);
  
  var hLat = 5.0/111.32, hLon = 5.0/(111.32*Math.cos(lat*Math.PI/180));
  if (boxRect) map.removeLayer(boxRect);
  boxRect = L.rectangle([[lat-hLat,lon-hLon],[lat+hLat,lon+hLon]], {
    color:'#10b981',
    weight:2,
    dashArray:'6 4',
    fill:true,
    fillColor:'#10b981',
    fillOpacity:0.06
  }).addTo(map);
  boxRect.bindTooltip('10 x 10 km', {permanent:true, direction:'center', className:'box-tip'}).openTooltip();
  setChip('pinChip', lat.toFixed(4)+', '+lon.toFixed(4), 'ok');
  document.getElementById('analyzeBtn').disabled = false;
  refreshSummary();
}

function useCoords() {
  var lat=parseFloat(document.getElementById('latIn').value), lon=parseFloat(document.getElementById('lonIn').value);
  if (isNaN(lat)||isNaN(lon)||lat<-90||lat>90||lon<-180||lon>180) { setChip('pinChip','Invalid coordinates','er'); return; }
  dropPin(lat,lon); map.setView([lat,lon],11);
}

function syncYears() {
  var y1=parseInt(document.getElementById('y1').value), y2=parseInt(document.getElementById('y2').value);
  if (y2<=y1) { document.getElementById('y2').value=y1+1; y2=y1+1; }
  document.getElementById('y1v').textContent=y1; document.getElementById('y2v').textContent=y2;
  refreshSummary();
}

function refreshSummary() {
  var y1=document.getElementById('y1').value, y2=document.getElementById('y2').value;
  var loc=(pinLat!==null)?pinLat.toFixed(4)+', '+pinLon.toFixed(4):'no location selected';
  document.getElementById('selSum').textContent=loc+' | '+y1+' vs '+y2;
}

function setChip(id,msg,cls) { document.getElementById(id).innerHTML='<span class="chip '+cls+'">'+msg+'</span>'; }

// ═══════════════════════════════════════════════════════════════
// RUN ANALYSIS
// ═══════════════════════════════════════════════════════════════
function runAnalysis() {
  if (pinLat===null) { document.getElementById('statusMsg').textContent='Drop a pin first.'; return; }
  var y1=parseInt(document.getElementById('y1').value), y2=parseInt(document.getElementById('y2').value);
  document.getElementById('spinner').classList.add('on');
  document.getElementById('spintxt').textContent = 'Fetching Sentinel-2 imagery...';
  document.getElementById('spintxt2').textContent = 'Building composites & downloading bands...';
  document.getElementById('statusMsg').textContent='Connecting...';
  startFactRotation();
  
  fetch('/analyze', {
    method:'POST', 
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({lat:pinLat,lon:pinLon,y1:y1,y2:y2})
  })
  .then(function(r){return r.json();})
  .then(function(data){
    stopFactRotation();
    document.getElementById('spinner').classList.remove('on');
    if (data.error) { 
      document.getElementById('statusMsg').textContent='Error: '+data.error; 
      alert('Analysis error: ' + data.error);
      return; 
    }
    showResults(data);
  })
  .catch(function(err){
    stopFactRotation();
    document.getElementById('spinner').classList.remove('on');
    document.getElementById('statusMsg').textContent='Failed: '+err.message;
  });
}

function showResults(d) {
  document.getElementById('statusMsg').textContent = 'Done';
  document.getElementById('mDef').textContent = d.def_km2.toFixed(2)+' km²';
  document.getElementById('mAff').textContent = d.aff_km2.toFixed(2)+' km²';
  document.getElementById('mDefP').textContent = '-'+d.def_pct.toFixed(1)+'%';
  document.getElementById('mAffP').textContent = '+'+d.aff_pct.toFixed(1)+'%';
  var net=d.aff_km2-d.def_km2;
  document.getElementById('mNet').textContent = (net>=0?'+':'')+net.toFixed(2)+' km²';
  document.getElementById('mNetC').className = 'sub '+(net>=0?'pos':'neg');
  document.getElementById('mNetC').textContent = net>=0?'net gain':'net loss';
  document.getElementById('resLbl').textContent = d.label;
  document.getElementById('infoBox').textContent = d.info;
  document.getElementById('cap1').textContent = d.y1+' Baseline';
  document.getElementById('cap2').textContent = d.y2+' Current';
  document.getElementById('capm1').textContent = 'Forest Mask '+d.y1;
  document.getElementById('capm2').textContent = 'Forest Mask '+d.y2;



  // Set GEE imagery thumbnails
  var img1 = document.getElementById('geeImg1');
  var img2 = document.getElementById('geeImg2');
  if (d.thumb1) {
    img1.src = d.thumb1;
    img1.alt = 'Sentinel-2 ' + d.y1;
  } else {
    img1.src = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/13/'
      + latToTileY(d.lat, 13) + '/' + lonToTileX(d.lon, 13);
    img1.alt = d.y1 + ' (satellite fallback)';
  }
  if (d.thumb2) {
    img2.src = d.thumb2;
    img2.alt = 'Sentinel-2 ' + d.y2;
  } else {
    img2.src = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/13/'
      + latToTileY(d.lat, 13) + '/' + lonToTileX(d.lon, 13);
    img2.alt = d.y2 + ' (satellite fallback)';
  }

  paintMask('cm1', d.mask1, d.mw, d.mh);
  paintMask('cm2', d.mask2, d.mw, d.mh);
  paintChange('cmc', d.mask1, d.mask2, d.mw, d.mh);
  document.getElementById('resultsOverlay').classList.add('visible');
  document.getElementById('reportBtn').style.display = 'block';
  lastData = d;
}

function lonToTileX(lon, zoom) {
  return Math.floor((lon + 180) / 360 * Math.pow(2, zoom));
}
function latToTileY(lat, zoom) {
  var sinLat = Math.sin(lat * Math.PI / 180);
  return Math.floor((0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * Math.pow(2, zoom));
}

function closeResults() {
  document.getElementById('resultsOverlay').classList.remove('visible');
}

function paintMask(id,mask,mw,mh) {
  var c=document.getElementById(id),ctx=c.getContext('2d'),W=c.width,H=c.height,img=ctx.createImageData(W,H);
  for(var py=0;py<H;py++) for(var px=0;px<W;px++){
    var v=mask[Math.floor(py*mh/H)*mw+Math.floor(px*mw/W)],i=(py*W+px)*4;
    img.data[i+3]=255;
    if(v===1){img.data[i]=16;img.data[i+1]=185;img.data[i+2]=129;} // Emerald green for forest
    else if(v===-1){img.data[i]=59;img.data[i+1]=130;img.data[i+2]=246;} // Blue for water
    else{img.data[i]=120;img.data[i+1]=113;img.data[i+2]=108;} // Grey for bare ground
  }
  ctx.putImageData(img,0,0);
}

function paintChange(id,m1,m2,mw,mh) {
  var c=document.getElementById(id),ctx=c.getContext('2d'),W=c.width,H=c.height,img=ctx.createImageData(W,H);
  for(var py=0;py<H;py++) for(var px=0;px<W;px++){
    var idx=Math.floor(py*mh/H)*mw+Math.floor(px*mw/W),v1=m1[idx],v2=m2[idx],i=(py*W+px)*4;
    img.data[i+3]=255;
    if(v1===-1||v2===-1){img.data[i]=59;img.data[i+1]=130;img.data[i+2]=246;}
    else if(v1===1&&v2===0){img.data[i]=239;img.data[i+1]=68;img.data[i+2]=68;} // Deforestation (Red)
    else if(v1===0&&v2===1){img.data[i]=16;img.data[i+1]=185;img.data[i+2]=129;} // Afforestation (Green)
    else if(v1===1&&v2===1){img.data[i]=6;img.data[i+1]=95;img.data[i+2]=70;} // Stable Forest (Dark Green)
    else{img.data[i]=41;img.data[i+1]=37;img.data[i+2]=36;} // Stable Non-forest (Dark Grey)
  }
  ctx.putImageData(img,0,0);
}

// ═══════════════════════════════════════════════════════════════
// PDF REPORT GENERATION
// ═══════════════════════════════════════════════════════════════
function generateReport() {
  if (!lastData) return;
  var d = lastData;
  var net = d.aff_km2 - d.def_km2;
  var netSign = net >= 0 ? '+' : '';
  var severity = 'Low';
  var sevColor = '#10b981';
  if (d.def_pct > 20) { severity = 'Critical'; sevColor = '#ef4444'; }
  else if (d.def_pct > 10) { severity = 'High'; sevColor = '#f59e0b'; }
  else if (d.def_pct > 5) { severity = 'Moderate'; sevColor = '#3b82f6'; }

  var totalPx = d.mw * d.mh;
  var f1px = d.mask1.filter(function(v){ return v === 1; }).length;
  var f2px = d.mask2.filter(function(v){ return v === 1; }).length;
  var defPx = d.mask1.filter(function(v,i){ return v === 1 && d.mask2[i] === 0; }).length;
  var affPx = d.mask1.filter(function(v,i){ return v === 0 && d.mask2[i] === 1; }).length;

  var maskImg1 = document.getElementById('cm1').toDataURL('image/png');
  var maskImg2 = document.getElementById('cm2').toDataURL('image/png');
  var changeImg = document.getElementById('cmc').toDataURL('image/png');

  var satImg1 = '';
  var satImg2 = '';
  try {
    var el1 = document.getElementById('geeImg1');
    var el2 = document.getElementById('geeImg2');
    if (el1.src && el1.src.startsWith('data:')) satImg1 = el1.src;
    if (el2.src && el2.src.startsWith('data:')) satImg2 = el2.src;
  } catch(e) {}

  var insights = [];
  var defRate = d.def_km2;
  var years = d.y2 - d.y1;

  if (defRate > 0.5) {
    var annualRate = (defRate / years).toFixed(2);
    insights.push({
      icon: '⚠️',
      title: 'Significant Forest Loss Detected',
      body: 'This region lost ' + defRate.toFixed(2) + ' km² of forest cover over ' + years +
            ' year(s) — approximately ' + annualRate +
            ' km² per year. At this rate, remaining forest cover could decline substantially within a decade. Immediate intervention is recommended.'
    });
  }

  if (severity === 'Critical' || severity === 'High') {
    insights.push({
      icon: '🚨',
      title: 'Urgent Conservation Action Required',
      body: 'The deforestation rate in this zone classifies as <b>' + severity + '</b>. ' +
            'Recommended actions: (1) Notify regional forest authorities and initiate on-ground verification. ' +
            '(2) Establish Protected Area buffer zones. (3) Deploy community forest monitoring programs. ' +
            '(4) Coordinate with law enforcement to investigate illegal land clearing.'
    });
  } else if (severity === 'Moderate') {
    insights.push({
      icon: '🔶',
      title: 'Moderate Degradation — Early Intervention Advised',
      body: 'Forest loss is measurable but not yet critical. This is the optimal window for preventive action: ' +
            '(1) Begin agroforestry promotion in surrounding areas. (2) Implement Payment for Ecosystem Services (PES) schemes for local landowners. ' +
            '(3) Establish continuous Sentinel-2 monitoring alerts.'
    });
  } else {
    insights.push({
      icon: '✅',
      title: 'Forest Cover Relatively Stable',
      body: 'Forest loss in this region is below critical thresholds. Continue monitoring at the current cadence. ' +
            'Consider reporting this area as a baseline reference for regional studies.'
    });
  }

  if (d.aff_km2 > 0.3) {
    insights.push({
      icon: '🌱',
      title: 'Afforestation / Regrowth Signal Detected',
      body: 'A gain of ' + d.aff_km2.toFixed(2) + ' km² was detected. This may indicate natural regrowth, ' +
            'reforestation activity, or seasonal vegetation changes. Cross-reference with ground truth.'
    });
  }

  if (net < 0) {
    insights.push({
      icon: '🔴',
      title: 'Carbon Stock & Biodiversity Impact',
      body: 'A net loss of ' + Math.abs(net).toFixed(2) + ' km² of forest corresponds to an estimated ' +
            (Math.abs(net) * 150).toFixed(0) + '–' + (Math.abs(net) * 250).toFixed(0) +
            ' tonnes of CO₂ released. This region should be flagged for carbon accounting.'
    });
  } else {
    insights.push({
      icon: '🟢',
      title: 'Positive Carbon Balance',
      body: 'Net forest gain of ' + net.toFixed(2) + ' km² represents a potential sequestration of ' +
            (net * 150).toFixed(0) + '–' + (net * 250).toFixed(0) +
            ' tonnes of CO₂. This positive signal can contribute to carbon credit programmes.'
    });
  }

  var insightHTML = insights.map(function(ins) {
    return '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px;margin-bottom:14px;">' +
           '<div style="font-size:.8rem;font-weight:700;color:#1e293b;margin-bottom:6px;">' + ins.icon + '&nbsp;&nbsp;' + ins.title + '</div>' +
           '<div style="font-size:.73rem;color:#475569;line-height:1.75;">' + ins.body + '</div>' +
           '</div>';
  }).join('');

  function imgBlock(src, label) {
    if (!src) {
      return '<div style="background:#f1f5f9;border-radius:8px;aspect-ratio:1/1;display:flex;align-items:center;' +
             'justify-content:center;color:#94a3b8;font-size:.7rem;text-align:center;">Satellite preview<br>not available<br>(cross-origin tile)</div>' +
             '<div style="font-size:.65rem;color:#64748b;text-align:center;margin-top:6px;">' + label + '</div>';
    }
    return '<img src="' + src + '" style="width:100%;border-radius:8px;display:block;" alt="' + label + '">' +
           '<div style="font-size:.65rem;color:#64748b;text-align:center;margin-top:6px;">' + label + '</div>';
  }

  var now = new Date();
  var dateStr = now.getDate().toString().padStart(2,'0') + '/' + (now.getMonth()+1).toString().padStart(2,'0') + '/' + now.getFullYear();

  var w = window.open('', '_blank');
  w.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>TerraTrack Report – ${d.y1} vs ${d.y2}</title>
<style>
  body { font-family: 'Plus Jakarta Sans', Arial, sans-serif; background: #f8fafc; color: #1e293b; margin: 0; padding: 0; }
  .page { max-width: 820px; margin: 40px auto; background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
  .hdr { background: #090d16; padding: 32px 36px; }
  .hdr h1 { color: #10b981; margin: 0 0 4px; font-size: 1.4rem; font-weight: 700; }
  .hdr p { color: #94a3b8; margin: 0; font-size: .8rem; }
  .badge { display: inline-block; background: #1e293b; color: #10b981; border: 1px solid #10b981; border-radius: 4px; padding: 2px 12px; font-size: .65rem; margin-top: 10px; }
  .body { padding: 32px 36px; }
  .section { margin-bottom: 32px; }
  .sec-title { font-size: .65rem; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: #64748b; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 16px; }
  .grid4 { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .grid3 { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }
  .card { background: #f8fafc; border-radius: 8px; padding: 14px 16px; }
  .card .label { font-size: .6rem; color: #64748b; text-transform: uppercase; letter-spacing: .08em; }
  .card .value { font-size: 1.4rem; font-weight: 700; margin: 4px 0 2px; }
  .card .sub { font-size: .65rem; color: #64748b; }
  .red { color: #ef4444; } .green { color: #10b981; } .blue { color: #3b82f6; }
  .info-box { background: #f0fdf4; border-left: 4px solid #10b981; border-radius: 0 6px 6px 0; padding: 14px 16px; font-family: monospace; font-size: .72rem; line-height: 1.9; color: #1e293b; white-space: pre-wrap; }
  .sev-box { border-radius: 8px; padding: 14px 18px; display: flex; align-items: center; gap: 14px; }
  .sev-dot { width: 16px; height: 16px; border-radius: 50%; flex-shrink: 0; }
  .sev-text { font-size: .85rem; font-weight: 700; }
  .sev-sub { font-size: .7rem; color: #64748b; margin-top: 2px; }
  .px-table { width: 100%; border-collapse: collapse; font-size: .73rem; }
  .px-table th { text-align: left; color: #64748b; font-weight: 700; font-size: .58rem; text-transform: uppercase; letter-spacing: .08em; padding: 6px 10px; border-bottom: 1px solid #e2e8f0; }
  .px-table td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; }
  .legend { display: flex; flex-wrap: wrap; gap: 18px; padding: 12px 0; }
  .legend-item { display: flex; align-items: center; gap: 7px; font-size: .7rem; color: #475569; }
  .legend-dot { width: 11px; height: 11px; border-radius: 3px; }
  .img-label { font-size: .65rem; color: #64748b; text-align: center; margin-top: 6px; }
  .footer { text-align: center; padding: 24px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: .7rem; }
  @media print { body { background: #fff; } .page { box-shadow: none; margin: 0; } .print-hide { display: none !important; } }
</style>
</head>
<body>
<div class="page">
  <div class="hdr">
    <h1>TerraTrack — Deforestation Analysis Report</h1>
    <p>${d.label}</p>
  </div>
  <div class="body">

    <!-- 1. SUMMARY METRICS -->
    <div class="section">
      <div class="sec-title">Executive Summary</div>
      <div class="grid4">
        <div class="card"><div class="label">Analysis Area</div><div class="value blue">100</div><div class="sub">km² (10×10)</div></div>
        <div class="card"><div class="label">Forest Loss</div><div class="value red">${d.def_km2.toFixed(2)}</div><div class="sub">km²</div></div>
        <div class="card"><div class="label">Forest Gain</div><div class="value green">${d.aff_km2.toFixed(2)}</div><div class="sub">km²</div></div>
        <div class="card"><div class="label">Net Change</div><div class="value ${net >= 0 ? 'green' : 'red'}">${netSign}${net.toFixed(2)}</div><div class="sub">km²</div></div>
      </div>
    </div>

    <!-- 2. SEVERITY -->
    <div class="section">
      <div class="sec-title">Alert Level</div>
      <div class="sev-box" style="background:${sevColor}18;border:1px solid ${sevColor}">
        <div class="sev-dot" style="background:${sevColor}"></div>
        <div>
          <div class="sev-text" style="color:${sevColor}">${severity} Severity</div>
          <div class="sev-sub">Based on ${d.def_pct.toFixed(1)}% forest loss in the analysed region</div>
        </div>
      </div>
    </div>

    <!-- 3. SATELLITE IMAGERY -->
    <div class="section">
      <div class="sec-title">Sentinel-2 True-Colour Imagery (Google Earth Engine)</div>
      <div class="grid2">
        <div>${imgBlock(satImg1, 'Baseline — ' + d.y1)}</div>
        <div>${imgBlock(satImg2, 'Current — ' + d.y2)}</div>
      </div>
    </div>

    <!-- 4. SEGMENTATION MASKS -->
    <div class="section">
      <div class="sec-title">UNet Forest Segmentation Masks &amp; Change Map</div>
      <div class="grid3">
        <div>
          <img src="${maskImg1}" style="width:100%;border-radius:8px;display:block;" alt="Mask Y1">
          <div class="img-label">Forest Mask — ${d.y1}</div>
        </div>
        <div>
          <img src="${maskImg2}" style="width:100%;border-radius:8px;display:block;" alt="Mask Y2">
          <div class="img-label">Forest Mask — ${d.y2}</div>
        </div>
        <div>
          <img src="${changeImg}" style="width:100%;border-radius:8px;display:block;" alt="Change Map">
          <div class="img-label">Change Detection Map</div>
        </div>
      </div>
      <div class="legend">
        <div class="legend-item"><div class="legend-dot" style="background:#10b981"></div>Stable Forest</div>
        <div class="legend-item"><div class="legend-dot" style="background:#78716c"></div>Non-forest / Bare</div>
        <div class="legend-item"><div class="legend-dot" style="background:#ef4444"></div>Deforestation (loss)</div>
        <div class="legend-item"><div class="legend-dot" style="background:#10b981"></div>Afforestation (gain)</div>
      </div>
    </div>

    <!-- 5. TECHNICAL DETAILS -->
    <div class="section">
      <div class="sec-title">Technical Details</div>
      <div class="info-box">${d.info}</div>
    </div>

    <!-- 6. PIXEL STATISTICS -->
    <div class="section">
      <div class="sec-title">Pixel-Level Statistics</div>
      <table class="px-table">
        <tr><th>Metric</th><th>Pixels</th><th>Area (km²)</th><th>Coverage (%)</th></tr>
        <tr><td>Total pixels</td><td>${totalPx.toLocaleString()}</td><td>100.00</td><td>100%</td></tr>
        <tr><td>Forest cover — ${d.y1}</td><td>${f1px.toLocaleString()}</td><td>${(f1px/totalPx*100).toFixed(1)}</td><td>${(f1px/totalPx*100).toFixed(1)}%</td></tr>
        <tr><td>Forest cover — ${d.y2}</td><td>${f2px.toLocaleString()}</td><td>${(f2px/totalPx*100).toFixed(1)}</td><td>${(f2px/totalPx*100).toFixed(1)}%</td></tr>
        <tr><td style="color:#ef4444">Deforested pixels</td><td>${defPx.toLocaleString()}</td><td>${(defPx/totalPx*100).toFixed(1)}</td><td>${(defPx/totalPx*100).toFixed(1)}%</td></tr>
        <tr><td style="color:#10b981">Afforested pixels</td><td>${affPx.toLocaleString()}</td><td>${(affPx/totalPx*100).toFixed(1)}</td><td>${(affPx/totalPx*100).toFixed(1)}%</td></tr>
      </table>
    </div>

    <!-- 7. INSIGHTS & RECOMMENDATIONS -->
    <div class="section">
      <div class="sec-title">Insights &amp; Recommendations</div>
      ${insightHTML}
    </div>

  </div>
  <div class="footer">
    <button class="print-hide" onclick="window.print()" style="margin-bottom:16px;padding:12px 36px;background:#090d16;color:#10b981;border:1px solid #10b981;border-radius:8px;font-family:'Outfit';font-size:.8rem;font-weight:700;letter-spacing:.08em;cursor:pointer;transition:all 0.2s ease;">
      ⬇ DOWNLOAD AS PDF
    </button>
    <br>Generated by TerraTrack &nbsp;|&nbsp; ${dateStr}
  </div>
</div>
</body>
</html>`);
  w.document.close();
}

// ═══════════════════════════════════════════════════════════════
// PLACE SEARCH (OSM NOMINATIM GEOLOCATION)
// ═══════════════════════════════════════════════════════════════
var searchTimer = null;

function onSearchInput() {
  var q = document.getElementById('placeSearch').value.trim();
  var dd = document.getElementById('searchDropdown');
  if (q.length < 3) { dd.style.display = 'none'; return; }
  clearTimeout(searchTimer);
  searchTimer = setTimeout(function() {
    fetch('https://nominatim.openstreetmap.org/search?format=json&limit=5&q=' + encodeURIComponent(q), {
      headers: { 'Accept-Language': 'en' }
    })
    .then(function(r) { return r.json(); })
    .then(function(results) {
      dd.innerHTML = '';
      if (!results.length) {
        dd.innerHTML = '<div style="padding:12px 16px;font-size:.78rem;color:#94a3b8;text-align:center;">No results found</div>';
        dd.style.display = 'block';
        return;
      }
      results.forEach(function(item) {
        var div = document.createElement('div');
        div.textContent = item.display_name;
        div.style.cssText = 'padding:12px 16px;font-size:.8rem;color:#f8fafc;cursor:pointer;border-bottom:1px solid rgba(255,255,255,0.06);line-height:1.5;transition:background 0.2s;';
        div.onmouseover = function() { this.style.background = 'rgba(255,255,255,0.05)'; };
        div.onmouseout  = function() { this.style.background = ''; };
        div.onclick = function() {
          var lat = parseFloat(item.lat);
          var lon = parseFloat(item.lon);
          dropPin(lat, lon);
          if (item.boundingbox) {
            var bb = item.boundingbox;
            map.fitBounds([
              [parseFloat(bb[0]), parseFloat(bb[2])],
              [parseFloat(bb[1]), parseFloat(bb[3])]
            ]);
          } else {
            map.setView([lat, lon], 12);
          }
          document.getElementById('placeSearch').value = item.display_name;
          dd.style.display = 'none';
        };
        dd.appendChild(div);
      });
      dd.style.display = 'block';
    })
    .catch(function() { dd.style.display = 'none'; });
  }, 400);
}

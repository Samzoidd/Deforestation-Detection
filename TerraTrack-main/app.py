import os
import math
import base64
import random
import time
import json
import traceback
from flask import Flask, request, jsonify, render_template

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F

app = Flask(__name__)

# ── 1. UNet Architecture ──────────────────────────────────────────────────────
class ConvBlock(nn.Module):
    def __init__(self, in_ch, out_ch):
        super().__init__()
        self.conv = nn.Sequential(
            nn.Conv2d(in_ch, out_ch, 3, padding=1, bias=False),
            nn.BatchNorm2d(out_ch),
            nn.ReLU(inplace=True),
            nn.Conv2d(out_ch, out_ch, 3, padding=1, bias=False),
            nn.BatchNorm2d(out_ch),
            nn.ReLU(inplace=True),
        )
    def forward(self, x):
        return self.conv(x)

class UNet(nn.Module):
    def __init__(self, in_channels=5, num_classes=2):
        super().__init__()
        self.enc1 = ConvBlock(in_channels, 32)
        self.enc2 = ConvBlock(32, 64)
        self.enc3 = ConvBlock(64, 128)
        self.pool = nn.MaxPool2d(2)

        self.bottleneck = ConvBlock(128, 256)

        self.up3   = nn.ConvTranspose2d(256, 128, 2, stride=2)
        self.dec3  = ConvBlock(256, 128)
        self.up2   = nn.ConvTranspose2d(128, 64,  2, stride=2)
        self.dec2  = ConvBlock(128, 64)
        self.up1   = nn.ConvTranspose2d(64,  32,  2, stride=2)
        self.dec1  = ConvBlock(64,  32)

        self.final = nn.Conv2d(32, num_classes, 1)

    def forward(self, x):
        e1 = self.enc1(x)
        e2 = self.enc2(self.pool(e1))
        e3 = self.enc3(self.pool(e2))
        b  = self.bottleneck(self.pool(e3))

        d3 = self.dec3(torch.cat([self.up3(b),  e3], dim=1))
        d2 = self.dec2(torch.cat([self.up2(d3), e2], dim=1))
        d1 = self.dec1(torch.cat([self.up1(d2), e1], dim=1))

        return self.final(d1)

# ── 2. Load Model Weights ─────────────────────────────────────────────────────
MODEL_PATH = os.environ.get("MODEL_PATH")
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

model = None
MODEL_OK = False

# Try to find a valid .pth file in the model/ directory
if not MODEL_PATH:
    possible_paths = [
        "model/model.pth",
        "model/unet_deforestation_binary_10_epoch.pth"
    ]
    # Scan model/ directory for any .pth file as a fallback
    if os.path.exists("model"):
        for f in os.listdir("model"):
            if f.endswith(".pth"):
                possible_paths.insert(0, os.path.join("model", f))
    
    for path in possible_paths:
        if os.path.exists(path):
            MODEL_PATH = path
            break

try:
    if MODEL_PATH and os.path.exists(MODEL_PATH):
        model = UNet(in_channels=5, num_classes=2)
        state_dict = torch.load(MODEL_PATH, map_location=device)
        model.load_state_dict(state_dict)
        model.eval()
        model.to(device)
        MODEL_OK = True
        print(f"✅ UNet loaded successfully on {device} from {MODEL_PATH}")
    else:
        print(f"⚠️  Model weights not found. Searched in 'model/'. Running in DEMO-fallback mode.")
except Exception as e:
    print(f"❌ Error loading model weights: {e}. Running in DEMO-fallback mode.")
    traceback.print_exc()

# ── 3. Google Earth Engine Setup ──────────────────────────────────────────────
GEE_OK = False
PROJECT_ID = os.environ.get("GEE_PROJECT", "savio-gee-deforestation")

try:
    import ee
    
    # Try different auth methods for cloud / headless / local environments
    service_account_key = os.environ.get("EE_SERVICE_ACCOUNT_KEY")
    local_key_path = "gee_credentials.json"
    
    if service_account_key:
        # Load from environment variable (JSON string)
        info = json.loads(service_account_key)
        credentials = ee.ServiceAccountCredentials(info.get('client_email'), key_data=service_account_key)
        ee.Initialize(credentials, project=PROJECT_ID)
        GEE_OK = True
        print(f"✅ GEE initialized using Service Account environment key (Project: {PROJECT_ID})")
    elif os.path.exists(local_key_path):
        # Load from local JSON credentials file
        with open(local_key_path, "r") as f:
            info = json.load(f)
        ee.Initialize(ee.ServiceAccountCredentials(info['client_email'], local_key_path), project=PROJECT_ID)
        GEE_OK = True
        print(f"✅ GEE initialized using local service account key file '{local_key_path}' (Project: {PROJECT_ID})")
    else:
        # Fallback to default user credentials
        ee.Initialize(project=PROJECT_ID)
        GEE_OK = True
        print(f"✅ GEE initialized using default developer credentials (Project: {PROJECT_ID})")
except Exception as e:
    print(f"⚠️  GEE not available – running in DEMO mode ({e})")

# ── 4. Image Fetching (GEE → numpy) ──────────────────────────────────────────
BANDS = ['B2', 'B3', 'B4', 'B8']
IMG_SIZE = 256

def fetch_sentinel_numpy(lat, lon, year):
    """
    Fetch a Sentinel-2 composite and preprocess exactly as the training code did:
      1. Export bands: B4 (red), B3 (green), B2 (blue), B8 (nir) — divided by 10000
      2. Compute NDVI = (nir - red) / (nir + red + 1e-6)
      3. Stack as [blue, green, red, nir, ndvi]  → shape (H, W, 5)
      4. Transpose to (5, H, W) for PyTorch
      5. Resize to (5, 256, 256)
    """
    import requests
    import rasterio
    from rasterio.io import MemoryFile
    from rasterio.enums import Resampling

    half_lat = 5.0 / 111.32
    half_lon = 5.0 / (111.32 * math.cos(math.radians(lat)))
    geom = ee.Geometry.Rectangle([
        lon - half_lon, lat - half_lat,
        lon + half_lon, lat + half_lat
    ])

    col = (ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
           .filterDate(f'{year}-01-01', f'{year}-12-31')
           .filterBounds(geom)
           .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20)))

    if col.size().getInfo() == 0:
        col = (ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
               .filterDate(f'{year}-01-01', f'{year}-12-31')
               .filterBounds(geom))

    composite = col.median()

    red   = composite.select('B4').divide(10000).rename('B4')
    green = composite.select('B3').divide(10000).rename('B3')
    blue  = composite.select('B2').divide(10000).rename('B2')
    nir   = composite.select('B8').divide(10000).rename('B8')
    ndvi  = nir.subtract(red).divide(nir.add(red)).rename('NDVI')

    final_img = blue.addBands([green, red, nir, ndvi]).toFloat().clip(geom)

    url = final_img.getDownloadURL({
        'bands':  ['B2', 'B3', 'B4', 'B8', 'NDVI'],
        'scale':  10,
        'region': geom,
        'format': 'GEO_TIFF',
        'crs':    'EPSG:4326',
    })
    resp = requests.get(url, timeout=300)
    resp.raise_for_status()

    raw = resp.content

    if raw[:2] == b'PK':
        import zipfile
        import io as _io
        zf    = zipfile.ZipFile(_io.BytesIO(raw))
        names = [n for n in zf.namelist() if n.endswith('.tif')]
        if not names:
            raise ValueError(f"ZIP from GEE contains no .tif files: {zf.namelist()}")
        tif_bytes = zf.read(names[0])
    elif raw[:4] in (b'II\x2a\x00', b'MM\x00\x2a', b'II\x2b\x00', b'MM\x00\x2b'):
        tif_bytes = raw
    else:
        raise ValueError(
            f"GEE returned unrecognised format.\n"
            f"Magic: {raw[:4].hex()}\n"
            f"Preview: {raw[:200]}"
        )

    with MemoryFile(tif_bytes) as memfile:
        with memfile.open() as src:
            arr = src.read(
                out_shape=(src.count, IMG_SIZE, IMG_SIZE),
                resampling=Resampling.bilinear
            ).astype(np.float32)

    red_ch  = arr[0].copy()
    grn_ch  = arr[1].copy()
    blu_ch  = arr[2].copy()
    nir_ch  = arr[3].copy()
    ndv_ch  = arr[4].copy()

    arr = np.stack([blu_ch, grn_ch, red_ch, nir_ch, ndv_ch], axis=0)
    arr[:4] /= 10000.0

    return arr


# ── 4b. Fetch GEE RGB thumbnail as base64 PNG ─────────────────────────────────
def fetch_gee_thumbnail_b64(lat, lon, year):
    """Returns a base64-encoded PNG of the true-colour Sentinel-2 composite."""
    import requests
    try:
        half_lat = 5.0 / 111.32
        half_lon = 5.0 / (111.32 * math.cos(math.radians(lat)))
        geom = ee.Geometry.Rectangle([
            lon - half_lon, lat - half_lat,
            lon + half_lon, lat + half_lat
        ])

        col = (ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
               .filterDate(f'{year}-01-01', f'{year}-12-31')
               .filterBounds(geom)
               .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20)))

        if col.size().getInfo() == 0:
            col = (ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
                   .filterDate(f'{year}-01-01', f'{year}-12-31')
                   .filterBounds(geom))

        composite = col.median().select(['B4', 'B3', 'B2'])

        thumb_url = composite.getThumbURL({
            'bands':      ['B4', 'B3', 'B2'],
            'min':        200,
            'max':        3000,
            'region':     geom,
            'dimensions': 512,
            'format':     'png',
        })

        resp = requests.get(thumb_url, timeout=120)
        resp.raise_for_status()

        b64 = base64.b64encode(resp.content).decode('ascii')
        return f'data:image/png;base64,{b64}'

    except Exception as ex:
        print(f"[thumbnail] year={year} error: {ex}")
        return ''


# ── 5. Run UNet inference ─────────────────────────────────────────────────────
def run_model(img_np):
    if not MODEL_OK:
        raise RuntimeError("Model is not loaded.")
    tensor = torch.from_numpy(img_np).unsqueeze(0).to(device)
    with torch.no_grad():
        output = model(tensor)
        pred   = torch.argmax(output, dim=1)
    return pred.squeeze().cpu().numpy().astype(np.int8)


# ── 6. Helpers ────────────────────────────────────────────────────────────────
def mask_2d_to_flat(mask_2d):
    return mask_2d.flatten().tolist()


def compute_stats(mask1, mask2, area_km2=100.0):
    total = mask1.size
    deforested  = np.sum((mask1 == 1) & (mask2 == 0))
    afforested  = np.sum((mask1 == 0) & (mask2 == 1))
    forest1     = np.sum(mask1 == 1)
    forest2     = np.sum(mask2 == 1)

    def_km2 = area_km2 * deforested / total
    aff_km2 = area_km2 * afforested / total
    f1p     = 100.0 * forest1 / total
    f2p     = 100.0 * forest2 / total
    return def_km2, aff_km2, f1p, f2p


# ── 7. Dummy fallback (used only when GEE is offline or model is missing) ──────
def make_demo_mask(w, h, forest_ratio, seed):
    random.seed(seed)
    arr = np.zeros(h * w, dtype=np.int8)
    for i in range(h * w):
        r = random.random()
        if r < 0.07 + forest_ratio:
            arr[i] = 1 if r >= 0.07 else -1
    return arr.reshape(h, w)


# ── 8. Flask Routes ───────────────────────────────────────────────────────────
@app.route('/')
def home():
    return render_template('index.html', gee_status=GEE_OK, model_status=MODEL_OK)

@app.route('/analyze', methods=['POST'])
def analyze():
    try:
        d   = request.json
        lat = float(d['lat'])
        lon = float(d['lon'])
        y1  = int(d['y1'])
        y2  = int(d['y2'])

        MW = MH = IMG_SIZE

        # Check if we should run in ML/Real mode or fallback to Demo mode
        use_ml_mode = GEE_OK and MODEL_OK

        if use_ml_mode:
            img1_np = fetch_sentinel_numpy(lat, lon, y1)
            img2_np = fetch_sentinel_numpy(lat, lon, y2)

            mask1_2d = run_model(img1_np)
            mask2_2d = run_model(img2_np)

            def_km2, aff_km2, f1p, f2p = compute_stats(mask1_2d, mask2_2d)

            mask1_flat = mask_2d_to_flat(mask1_2d)
            mask2_flat = mask_2d_to_flat(mask2_2d)
            mode_label = 'ML'

            thumb1 = fetch_gee_thumbnail_b64(lat, lon, y1)
            thumb2 = fetch_gee_thumbnail_b64(lat, lon, y2)
        else:
            # DEMO mode fallback
            random.seed(int(abs(lat * 1000)) + int(abs(lon * 1000)) + y1)
            f1r = 0.40 + random.random() * 0.38
            f2r = max(0.05, f1r - 0.04 - random.random() * 0.22)

            mask1_2d = make_demo_mask(MW, MH, f1r, y1 * 31 + 7)
            mask2_2d = make_demo_mask(MW, MH, f2r, y2 * 31 + 13)

            def_km2, aff_km2, f1p, f2p = compute_stats(
                (mask1_2d == 1).astype(np.int8),
                (mask2_2d == 1).astype(np.int8)
            )

            mask1_flat = mask1_2d.flatten().tolist()
            mask2_flat = mask2_2d.flatten().tolist()
            mode_label = 'demo'

            thumb1 = ''
            thumb2 = ''

        # Build custom warnings/info details if running in demo fallback
        mode_detail = mode_label.upper()
        if not use_ml_mode:
            reasons = []
            if not GEE_OK: reasons.append("Google Earth Engine not connected")
            if not MODEL_OK: reasons.append(f"Model weights not found at '{MODEL_PATH}'")
            mode_detail += f" (Fallback: {', '.join(reasons)})"

        return jsonify({
            'mode':     mode_label,
            'mode_detail': mode_detail,
            'y1': y1,   'y2': y2,
            'lat': lat, 'lon': lon,
            'area_km2': 100.0,
            'def_km2':  round(float(def_km2), 2),
            'aff_km2':  round(float(aff_km2), 2),
            'def_pct':  round(float(def_km2), 2),
            'aff_pct':  round(float(aff_km2), 2),
            'mask1': mask1_flat,
            'mask2': mask2_flat,
            'mw': MW, 'mh': MH,
            'thumb1': thumb1,
            'thumb2': thumb2,
            'label': f'{y1} vs {y2} | ({lat:.4f},{lon:.4f})',
            'info': (
                f'Centre  : {lat:.5f}, {lon:.5f}\n'
                f'Mode    : {mode_detail}\n'
                f'Forest {y1}: {f1p:.1f}%  →  {y2}: {f2p:.1f}%\n'
                f'Loss    : {def_km2:.2f} km²\n'
                f'Gain    : {aff_km2:.2f} km²\n'
                f'Net     : {aff_km2 - def_km2:+.2f} km²'
            )
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e), 'trace': traceback.format_exc()})

# ── Launch ────────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    port = int(os.environ.get("PORT", 8766))
    app.run(host='0.0.0.0', port=port, debug=False)

# TerraTrack — Global Deforestation Monitor

TerraTrack is a web-based global deforestation monitoring application that uses a deep learning UNet model (5 input channels: Blue, Green, Red, NIR, NDVI) trained on Sentinel-2 Harmonized satellite imagery to detect changes in forest cover over custom time spans.

---

## Features

- **Interactive Map Dashboard**: Powered by Leaflet, search for any location globally or click on the map to set a 10x10 km analysis region.
- **Deep Learning Predictions**: Employs a UNet model in PyTorch to output binary forest/non-forest segmentation masks for baseline and target years.
- **Change Detection**: Computes pixel-level statistics to calculate exact forest loss, forest gain, and net change in square kilometers.
- **True-Color Composites**: Displays natural-color Sentinel-2 composites fetched directly via Google Earth Engine (GEE).
- **PDF Report Generator**: Generates comprehensive PDF-exportable environmental reports complete with metrics, maps, charts, and recommendations.
- **Demo Mode Fallback**: Automatically falls back to a procedural demo mode with a warning banner if GEE credentials or model weights are missing, allowing the application interface to be tested instantly.

---

## Directory Structure

```text
TerraTrack/
├── model/
│   └── unet_deforestation_binary_10_epoch.pth  # <-- Place your PyTorch weights here
├── templates/
│   └── index.html                             # <-- HTML template
├── static/
│   ├── css/
│   │   └── style.css                          # <-- UI stylesheet (dark glassmorphism)
│   └── js/
│       └── main.js                            # <-- Frontend application script
├── app.py                                     # <-- Flask server & backend API
├── requirements.txt                           # <-- Python package dependencies
├── Dockerfile                                 # <-- Container deployment file
├── .dockerignore                              # <-- Files ignored during Docker build
└── README.md                                  # <-- Setup guide
```

---

## Local Setup

1. **Clone or Move to Project Folder**:
   ```bash
   cd TerraTrack
   ```

2. **Add Model Weights**:
   - Download your trained model weights file `unet_deforestation_binary_10_epoch.pth` (usually from your Google Drive mount in Colab).
   - Create a directory named `model` in the root of the project.
   - Place the `.pth` weights file inside that folder.

3. **Create and Activate a Virtual Environment**:
   - **Windows**:
     ```bash
     python -m venv venv
     venv\Scripts\activate
     ```
   - **macOS / Linux**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

4. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

5. **Run the Application**:
   ```bash
   python app.py
   ```
   Open your browser and navigate to `http://localhost:8766`.

---

## Google Earth Engine (GEE) Authentication

For local development, the application can use your developer credentials automatically if you have run `earthengine authenticate` on your machine.

For headless servers or cloud deployments, you must use a **Google Cloud Service Account**:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Enable the **Google Earth Engine API** for your project.
3. Go to **IAM & Admin > Service Accounts** and create a new Service Account.
4. Grant the Service Account the role of **Earth Engine Resource Viewer** (or general access to Earth Engine).
5. Go to the **Keys** tab of the created Service Account and click **Add Key > Create New Key** (select JSON).
6. Save the downloaded JSON file as `gee_credentials.json` in the root of the project folder. The application will automatically detect and use it.

---

## Cloud Deployment

You can deploy this application to several free or low-cost cloud hosting providers.

### Option 1: Hugging Face Spaces (Highly Recommended)
Hugging Face Spaces is completely free, stable, and offers an easy Git-based workflow.

1. Sign up on [Hugging Face](https://huggingface.co/) and click **New Space**.
2. Give it a name and select **Docker** as the SDK.
3. Select **Blank** template (or any basic Docker template).
4. Clone the space repository locally:
   ```bash
   git clone https://huggingface.co/spaces/YOUR_USERNAME/YOUR_SPACE_NAME
   ```
5. Copy all files from the `TerraTrack/` directory into the cloned Space directory.
6. Commit and push the files:
   ```bash
   git add .
   git commit -m "Deploy TerraTrack app"
   git push
   ```
7. **Set Secret Variables (Optional)**:
   - In your Hugging Face Space settings, you can add a secret called `EE_SERVICE_ACCOUNT_KEY` and paste the entire content of your Google Cloud Service Account JSON key file. The app will load it at runtime.

### Option 2: Render or Railway
Render and Railway can deploy directly from your GitHub repository using the provided `Dockerfile`.

1. Push your code to a GitHub repository.
2. Link your GitHub account to Render or Railway.
3. Create a **Web Service** on Render or a **New Service** on Railway.
4. Point to the repository. The platform will automatically read the `Dockerfile` and start the server.
5. In the service settings, define:
   - `PORT`: `8766`
   - `EE_SERVICE_ACCOUNT_KEY`: Paste the service account JSON key string (optional, for GEE access).

import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));

const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'hospital_central_db.json');
const DRIVE_STATUS_FILE = path.join(DATA_DIR, 'drive_status.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// Central Database: Get all data
app.get('/api/central-db', (_req, res) => {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const data = JSON.parse(content);
      return res.json({ success: true, data });
    }
    return res.json({ success: true, data: null });
  } catch (err: any) {
    console.error('Error reading central database:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Central Database: Save/Sync all data
app.post('/api/central-db', (req, res) => {
  try {
    const { data } = req.body;
    if (!data) {
      return res.status(400).json({ success: false, error: 'No data supplied' });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return res.json({ success: true, savedAt: new Date().toISOString() });
  } catch (err: any) {
    console.error('Error writing central database:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Central Google Drive connection metadata
app.get('/api/drive-status', (_req, res) => {
  try {
    if (fs.existsSync(DRIVE_STATUS_FILE)) {
      const content = fs.readFileSync(DRIVE_STATUS_FILE, 'utf-8');
      return res.json({ success: true, status: JSON.parse(content) });
    }
    // Default persistent central drive status for Hospital Tha Khan Tho
    const defaultStatus = {
      isPermanentlyLinked: true,
      userEmail: 'hmlr11082@gmail.com',
      userName: 'โรงพยาบาลท่าคันโท (ศูนย์ข้อมูล สปสช.)',
      folderName: 'โรงพยาบาลท่าคันโท_สปสช_2570',
      fileName: 'nhso_cloud_database_2570.json',
      lastSyncedAt: new Date().toISOString(),
    };
    return res.json({ success: true, status: defaultStatus });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/drive-status', (req, res) => {
  try {
    const { status } = req.body;
    fs.writeFileSync(DRIVE_STATUS_FILE, JSON.stringify(status, null, 2), 'utf-8');
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT} in ${isProd ? 'production' : 'development'} mode`);
  });
}

startServer();

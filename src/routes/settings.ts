import { Router } from 'express';
import { db } from '../db/index.js';

const router = Router();

// Get all settings
router.get('/', (req, res) => {
  try {
    const settings = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
    const settingsMap = settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, string>);
    
    res.json({ status: 'success', data: settingsMap });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Update settings
router.post('/', (req, res) => {
  try {
    const settings = req.body;
    const update = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    
    const transaction = db.transaction((data) => {
      for (const [key, value] of Object.entries(data)) {
        update.run(key, String(value));
      }
    });

    transaction(settings);
    
    res.json({ status: 'success', message: 'Settings updated successfully' });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

export { router as settingsRouter };

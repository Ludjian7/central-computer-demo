import { Router } from 'express';
import { db } from '../db/index.js';

const router = Router();

// Get all settings
router.get('/', async (req, res) => {
  try {
    const settings = await db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
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
router.post('/', async (req, res) => {
  try {
    const settings = req.body;
    const transaction = db.transaction(async (data: any) => {
      for (const [key, value] of Object.entries(data)) {
        await db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value').run(key, String(value));
      }
    });

    await transaction(settings);
    
    res.json({ status: 'success', message: 'Settings updated successfully' });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

export { router as settingsRouter };


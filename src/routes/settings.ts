import { Router } from 'express';
import { prisma } from '../db/index.js';

const router = Router();

// Get all settings
router.get('/', async (req, res) => {
  try {
    const settings = await prisma.setting.findMany();
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
    
    await prisma.$transaction(
      Object.entries(settings).map(([key, value]) => 
        prisma.setting.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) }
        })
      )
    );
    
    res.json({ status: 'success', message: 'Settings updated successfully' });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

export { router as settingsRouter };

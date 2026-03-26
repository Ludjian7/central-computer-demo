import express from 'express';
import jwt from 'jsonwebtoken';
import { shiftsRouter } from '../src/routes/shifts.js';
import { prisma } from '../src/db/index.js';

const app = express();
app.use(express.json());
app.use('/shifts', shiftsRouter);

const JWT_SECRET = process.env.JWT_SECRET || 'central-computer-secret-key';

async function testCurrentShift() {
  const token = jwt.sign({ id: 2, username: 'karyawan.demo', role: 'karyawan' }, JWT_SECRET);

  const server = app.listen(0, async () => {
    const port = (server.address() as any).port;
    console.log(`Test server running on port ${port}`);

    try {
      const response = await fetch(`http://localhost:${port}/shifts/current`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      console.log('Status code:', response.status);
      console.log('Response body:', data);
    } catch (e) {
      console.error('Fetch error:', e);
    } finally {
      server.close();
      await prisma.$disconnect();
    }
  });
}

testCurrentShift();

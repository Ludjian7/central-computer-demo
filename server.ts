import 'dotenv/config';
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import { fileURLToPath } from "url";
import { initDb } from "./src/db/init.js";
import { activityLogger } from "./src/middleware/logger.js";
import { authRouter } from "./src/routes/auth.js";
import { suppliersRouter } from "./src/routes/suppliers.js";
import { productsRouter } from "./src/routes/products.js";
import { salesRouter } from "./src/routes/sales.js";
import { servicesRouter } from "./src/routes/services.js";
import { reportsRouter } from "./src/routes/reports.js";
import { returnsRouter } from "./src/routes/returns.js";
import { purchaseOrdersRouter } from "./src/routes/purchaseOrders.js";
import { stockOpnameRouter } from "./src/routes/stockOpname.js";
import { discountsRouter } from './src/routes/discounts.js';
import { shiftsRouter } from './src/routes/shifts.js';
import { settingsRouter } from './src/routes/settings.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000');

  app.use(cors());
  app.use(express.json());

  // Initialize Database
  initDb();

  // Activity Logger Middleware
  app.use(activityLogger);

  // API routes FIRST
  app.use("/api/auth", authRouter);
  app.use("/api/suppliers", suppliersRouter);
  app.use("/api/products", productsRouter);
  app.use("/api/sales", salesRouter);
  app.use("/api/services", servicesRouter);
  app.use("/api/reports", reportsRouter);
  app.use("/api/returns", returnsRouter);
  app.use("/api/purchase-orders", purchaseOrdersRouter);
  app.use("/api/stock-opname", stockOpnameRouter);
  app.use('/api/discounts', discountsRouter);
  app.use('/api/shifts', shiftsRouter);
  app.use('/api/settings', settingsRouter);
  
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

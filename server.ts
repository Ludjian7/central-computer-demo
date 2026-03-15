import 'dotenv/config';
import express from "express";
import cors from "cors";
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

const app = express();

app.use(cors());
app.use(express.json());

// Note: initDb() is removed as Prisma handles schema via migrations/db push

app.use(activityLogger);

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

export default app;

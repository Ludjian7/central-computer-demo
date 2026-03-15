import { db } from "./index.js";
import bcrypt from "bcryptjs";

export function initDb() {
  console.log("Initializing database...");

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username VARCHAR(50) NOT NULL UNIQUE,
      email VARCHAR(100) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL CHECK(role IN ('admin', 'owner', 'karyawan')),
      is_active BOOLEAN NOT NULL DEFAULT 1,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(150) NOT NULL,
      contact_person VARCHAR(100) NOT NULL,
      email VARCHAR(100),
      phone VARCHAR(20) NOT NULL,
      address TEXT,
      city VARCHAR(80) NOT NULL,
      postal_code VARCHAR(10),
      notes TEXT,
      is_active BOOLEAN NOT NULL DEFAULT 1,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(200) NOT NULL,
      description TEXT,
      type VARCHAR(20) NOT NULL CHECK(type IN ('physical', 'service')),
      sku VARCHAR(50) NOT NULL UNIQUE,
      barcode VARCHAR(50),
      price INTEGER NOT NULL,
      cost INTEGER NOT NULL DEFAULT 0,
      quantity INTEGER NOT NULL DEFAULT 0,
      min_quantity INTEGER NOT NULL DEFAULT 2,
      category VARCHAR(80) NOT NULL,
      brand VARCHAR(80),
      location VARCHAR(80),
      duration_minutes INTEGER,
      service_details TEXT,
      supplier_id INTEGER,
      is_active BOOLEAN NOT NULL DEFAULT 1,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number VARCHAR(25) NOT NULL UNIQUE,
      customer_name VARCHAR(200) NOT NULL,
      customer_phone VARCHAR(20),
      customer_email VARCHAR(100),
      subtotal INTEGER NOT NULL,
      tax INTEGER NOT NULL DEFAULT 0,
      discount INTEGER NOT NULL DEFAULT 0,
      total INTEGER NOT NULL,
      payment_method VARCHAR(20) NOT NULL CHECK(payment_method IN ('cash', 'transfer', 'qris', 'debit', 'credit')),
      payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK(payment_status IN ('pending', 'paid', 'partial', 'cancelled', 'refunded')),
      notes TEXT,
      user_id INTEGER NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      price INTEGER NOT NULL,
      discount INTEGER NOT NULL DEFAULT 0,
      subtotal INTEGER NOT NULL,
      product_name VARCHAR(200) NOT NULL,
      product_sku VARCHAR(50) NOT NULL,
      service_schedule DATETIME,
      service_status VARCHAR(20) CHECK(service_status IN ('scheduled', 'in_progress', 'done', 'cancelled')),
      service_technician INTEGER,
      notes TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
      FOREIGN KEY (service_technician) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS stock_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      type VARCHAR(10) NOT NULL CHECK(type IN ('in', 'out')),
      quantity INTEGER NOT NULL,
      balance INTEGER NOT NULL,
      sale_id INTEGER,
      supplier_id INTEGER,
      notes TEXT,
      user_id INTEGER NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (sale_id) REFERENCES sales(id),
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS holiday_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date DATE NOT NULL UNIQUE,
      name VARCHAR(100) NOT NULL,
      type VARCHAR(20) NOT NULL CHECK(type IN ('national', 'store', 'lebaran_cuti')),
      is_active BOOLEAN NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS returns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL,
      sale_item_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      reason TEXT NOT NULL,
      refund_amount INTEGER NOT NULL DEFAULT 0,
      refund_method VARCHAR(20) CHECK(refund_method IN ('cash','transfer','store_credit')),
      status VARCHAR(20) NOT NULL DEFAULT 'approved' CHECK(status IN ('pending','approved','rejected')),
      processed_by INTEGER NOT NULL,
      notes TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sale_id) REFERENCES sales(id),
      FOREIGN KEY (sale_item_id) REFERENCES sale_items(id),
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (processed_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      method VARCHAR(10) NOT NULL,
      endpoint VARCHAR(200) NOT NULL,
      summary TEXT,
      ip_address VARCHAR(45),
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS purchase_orders (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      po_number    VARCHAR(25) NOT NULL UNIQUE,
      supplier_id  INTEGER NOT NULL,
      status       VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','sent','partial','received','cancelled')),
      notes        TEXT,
      total_amount INTEGER NOT NULL DEFAULT 0,
      expected_date DATE,
      received_date DATE,
      created_by   INTEGER NOT NULL,
      created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
      FOREIGN KEY (created_by)  REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS purchase_order_items (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      po_id      INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity   INTEGER NOT NULL,
      unit_cost  INTEGER NOT NULL,
      subtotal   INTEGER NOT NULL,
      received_qty INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (po_id)      REFERENCES purchase_orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS stock_opname (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      opname_date  DATE NOT NULL,
      status       VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','in_progress','completed')),
      notes        TEXT,
      created_by   INTEGER NOT NULL,
      completed_at DATETIME,
      created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS stock_opname_items (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      opname_id        INTEGER NOT NULL,
      product_id       INTEGER NOT NULL,
      system_qty       INTEGER NOT NULL,
      physical_qty     INTEGER,
      difference       INTEGER,
      adjustment_notes TEXT,
      FOREIGN KEY (opname_id)  REFERENCES stock_opname(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS discounts (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      code         VARCHAR(20) NOT NULL UNIQUE,
      name         VARCHAR(100) NOT NULL,
      type         VARCHAR(10) NOT NULL CHECK(type IN ('percent','fixed')),
      value        INTEGER NOT NULL,
      min_purchase INTEGER NOT NULL DEFAULT 0,
      max_discount INTEGER,
      usage_limit  INTEGER,
      used_count   INTEGER NOT NULL DEFAULT 0,
      valid_from   DATE NOT NULL,
      valid_until  DATE NOT NULL,
      is_active    BOOLEAN NOT NULL DEFAULT 1,
      created_by   INTEGER NOT NULL,
      created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS cash_shifts (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id       INTEGER NOT NULL,
      opened_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      closed_at     DATETIME,
      opening_cash  INTEGER NOT NULL DEFAULT 0,
      closing_cash  INTEGER,
      system_cash   INTEGER,
      notes         TEXT,
      status        VARCHAR(10) NOT NULL DEFAULT 'open' CHECK(status IN ('open','closed')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- Performance indexes
    CREATE INDEX IF NOT EXISTS idx_sales_created ON sales(created_at);
    CREATE INDEX IF NOT EXISTS idx_sales_user ON sales(user_id);
    CREATE INDEX IF NOT EXISTS idx_sales_method ON sales(payment_method);
    CREATE INDEX IF NOT EXISTS idx_items_sale ON sale_items(sale_id);
    CREATE INDEX IF NOT EXISTS idx_items_product ON sale_items(product_id);
    CREATE INDEX IF NOT EXISTS idx_items_schedule ON sale_items(service_schedule);
    CREATE INDEX IF NOT EXISTS idx_items_status ON sale_items(service_status);
    CREATE INDEX IF NOT EXISTS idx_products_type ON products(type);
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
    CREATE INDEX IF NOT EXISTS idx_products_supplier ON products(supplier_id);
    CREATE INDEX IF NOT EXISTS idx_discounts_code ON discounts(code);
    CREATE INDEX IF NOT EXISTS idx_shifts_user ON cash_shifts(user_id);

    CREATE TABLE IF NOT EXISTS settings (
      key VARCHAR(50) PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Sprint 4: Seed settings if empty
  const settingCount = db.prepare("SELECT COUNT(*) as count FROM settings").get() as { count: number };
  if (settingCount.count === 0) {
    console.log("Seeding settings...");
    const insertSetting = db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)");
    insertSetting.run("store_name", "Central Computer");
    insertSetting.run("store_address", "Jl. Raya Teknologi No. 404, Cyber City");
    insertSetting.run("store_phone", "0812-3456-7890");
    insertSetting.run("tax_ppn", "11");
    insertSetting.run("currency_symbol", "Rp");
  }

  // Sprint 3 & 4: Add columns to existing tables
  try {
    const saleItemsCols = db.prepare("PRAGMA table_info(sale_items)").all() as any[];
    if (!saleItemsCols.some(c => c.name === 'unit_cost')) {
      db.exec("ALTER TABLE sale_items ADD COLUMN unit_cost INTEGER NOT NULL DEFAULT 0");
      console.log("Added unit_cost column to sale_items");
    }

    const salesCols = db.prepare("PRAGMA table_info(sales)").all() as any[];
    if (!salesCols.some(c => c.name === 'discount_id')) {
      db.exec("ALTER TABLE sales ADD COLUMN discount_id INTEGER REFERENCES discounts(id)");
      console.log("Added discount_id column to sales");
    }
    if (!salesCols.some(c => c.name === 'shift_id')) {
      db.exec("ALTER TABLE sales ADD COLUMN shift_id INTEGER REFERENCES cash_shifts(id)");
      console.log("Added shift_id column to sales");
    }

    const logCols = db.prepare("PRAGMA table_info(activity_logs)").all() as any[];
    if (!logCols.some(c => c.name === 'ip_address')) {
      db.exec("ALTER TABLE activity_logs ADD COLUMN ip_address VARCHAR(45)");
      console.log("Added ip_address column to activity_logs");
    }
  } catch (error) {
    console.warn("Could not alter tables:", error);
  }

  // Seed data
  seedData();
}

function seedData() {
  const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
  if (userCount.count === 0) {
    console.log("Seeding users...");
    const insertUser = db.prepare("INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)");
    const hash = bcrypt.hashSync("password123", 10);
    insertUser.run("admin", "admin@centralcomputer.com", hash, "admin");
    insertUser.run("owner", "owner@centralcomputer.com", hash, "owner");
    insertUser.run("zulfikar", "zulfikar@centralcomputer.com", hash, "karyawan");
    insertUser.run("rahimah", "rahimah@centralcomputer.com", hash, "karyawan");
  }

  const supplierCount = db.prepare("SELECT COUNT(*) as count FROM suppliers").get() as { count: number };
  if (supplierCount.count === 0) {
    console.log("Seeding suppliers...");
    const insertSupplier = db.prepare("INSERT INTO suppliers (name, contact_person, email, phone, address, city) VALUES (?, ?, ?, ?, ?, ?)");
    insertSupplier.run("PT Asus Indonesia", "Budi", "budi@asus.com", "08111111111", "Jl. Sudirman", "Jakarta");
    insertSupplier.run("PT Lenovo Indonesia", "Andi", "andi@lenovo.com", "08222222222", "Jl. Thamrin", "Jakarta");
    insertSupplier.run("CV Sparepart Komputer", "Citra", "citra@sparepart.com", "08333333333", "Jl. Merdeka", "Medan");
  }

  const productCount = db.prepare("SELECT COUNT(*) as count FROM products").get() as { count: number };
  if (productCount.count === 0) {
    console.log("Seeding products...");
    const insertProduct = db.prepare(`
      INSERT INTO products (name, description, type, sku, price, cost, quantity, min_quantity, category, brand, supplier_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertProduct.run("Asus ROG Zephyrus", "Laptop Gaming", "physical", "LAP-ASU-001", 25000000, 20000000, 5, 2, "Laptop", "Asus", 1);
    insertProduct.run("Lenovo ThinkPad X1", "Laptop Bisnis", "physical", "LAP-LEN-001", 20000000, 16000000, 3, 2, "Laptop", "Lenovo", 2);
    insertProduct.run("RAM DDR4 8GB", "Memori", "physical", "ACC-RAM-001", 500000, 300000, 20, 5, "Aksesori", "Corsair", 3);
    
    const insertService = db.prepare(`
      INSERT INTO products (name, description, type, sku, price, category, duration_minutes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertService.run("Install Ulang Windows", "Instalasi OS", "service", "SRV-OS-001", 150000, "Servis", 120);
    insertService.run("Pembersihan Laptop", "Cleaning debu dan ganti pasta", "service", "SRV-CLN-001", 100000, "Servis", 60);
  }

  const holidayCount = db.prepare("SELECT COUNT(*) as count FROM holiday_config").get() as { count: number };
  if (holidayCount.count === 0) {
    console.log("Seeding holidays...");
    const insertHoliday = db.prepare("INSERT INTO holiday_config (date, name, type) VALUES (?, ?, ?)");
    insertHoliday.run("2025-03-31", "Idul Fitri", "national");
    insertHoliday.run("2025-04-01", "Idul Fitri", "national");
  }
}

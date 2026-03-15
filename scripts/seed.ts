import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/id_ID';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Memulai proses seeding data simulasi Central Computer...');

  // --- 1. SETTINGS ---
  console.log('Sedang membuat pengaturan dasar...');
  await prisma.setting.upsert({
    where: { key: 'monthly_target' },
    update: { value: '150000000' },
    create: { key: 'monthly_target', value: '150000000' }
  });

  // --- 2. USERS (Roles) ---
  console.log('Sedang membuat pengguna (Admin, Teknisi, Kasir)...');
  
  // Create 3 Technicians
  const technicians = [];
  for (let i = 1; i <= 3; i++) {
    const tech = await prisma.user.upsert({
      where: { username: `Teknisi ${i}` },
      update: {},
      create: {
        username: `Teknisi ${i}`,
        email: `teknisi${i}@demo.com`,
        passwordHash: '$2b$10$X1j7bYlY.Z5t9.uY6/Jv7.P.2pYv.P.2pYv.P.2pYv.P.2pYv', // hashed 'password'
        role: 'technician'
      }
    });
    technicians.push(tech);
  }

  // Fallback user for sales & POs
  let admin = await prisma.user.findFirst({ where: { role: 'admin' } });
  if (!admin) {
    admin = await prisma.user.create({
      data: {
        username: 'Admin Demo',
        email: 'admin@demo.com',
        passwordHash: 'xx',
        role: 'admin'
      }
    });
  }

  // --- 3. CATEGORIES & SUPPLIERS ---
  console.log('Sedang membuat kategori dan supplier...');
  const categories = ['Laptop', 'Desktop PC', 'Komponen PC', 'Aksesoris', 'Networking'];
  const brands = ['Asus', 'Acer', 'Lenovo', 'HP', 'MSI', 'Intel', 'AMD', 'Logitech', 'Razer'];
  
  const suppliers = [];
  for (let i = 0; i < 3; i++) {
    const sup = await prisma.supplier.create({
      data: {
        name: faker.company.name() + ' Distributor',
        contactPerson: faker.person.fullName(),
        phone: faker.phone.number(),
        city: faker.location.city(),
        address: faker.location.streetAddress()
      }
    });
    suppliers.push(sup);
  }

  // --- 4. DATA PRODUK (FISIK) ---
  console.log('Sedang menyusun inventaris produk fisik...');
  const physicalProducts = [];
  for (let i = 0; i < 25; i++) {
    const minQty = faker.number.int({ min: 2, max: 10 });
    // Sengaja buat beberapa stok menipis (< minQty)
    const qty = faker.number.int({ min: 0, max: 5 }) < 2 
      ? faker.number.int({ min: 0, max: minQty }) 
      : faker.number.int({ min: minQty + 1, max: 50 });
      
    const p = await prisma.product.create({
      data: {
        name: `${faker.helpers.arrayElement(brands)} ${faker.commerce.productName()}`,
        sku: `PRD-${faker.string.alphanumeric(6).toUpperCase()}`,
        type: 'physical',
        category: faker.helpers.arrayElement(categories),
        brand: faker.helpers.arrayElement(brands),
        cost: faker.number.int({ min: 100000, max: 5000000, multipleOf: 50000 }),
        price: faker.number.int({ min: 150000, max: 7000000, multipleOf: 50000 }),
        quantity: qty,
        minQuantity: minQty,
        isActive: true,
      }
    });
    physicalProducts.push(p);
  }

  // --- 5. DATA PRODUK (JASA SERVIS) ---
  console.log('Sedang menyusun daftar layanan jasa servis...');
  const serviceNames = [
    'Instalasi Windows 11', 'Cleaning & Re-pasta', 'Servis Motherboard Mati Total',
    'Rakit PC Custom', 'Recovery Data Harddisk', 'Ganti LCD Laptop',
    'Ganti Baterai Tanam', 'Upgrade RAM & SSD (Jasa)'
  ];
  const serviceProducts = [];
  for (const name of serviceNames) {
    const s = await prisma.product.create({
      data: {
        name: name,
        sku: `SRV-${faker.string.alphanumeric(4).toUpperCase()}`,
        type: 'service',
        category: 'Jasa Servis',
        price: faker.number.int({ min: 100000, max: 1500000, multipleOf: 50000 }),
        isActive: true,
      }
    });
    serviceProducts.push(s);
  }

  // --- 6. TRANSAKSI (SALES & SERVICES) SEPANJANG 45 HARI TERAKHIR ---
  console.log('Sedang mengisi riwayat transaksi, laporan keuangan, & penjadwalan servis teknisi (proses ini memakan waktu beberapa detik)...');
  
  for (let i = 0; i < 60; i++) {
    // Tanggal acak dalam 45 hari terakhir
    const pastDate = faker.date.recent({ days: 45 });
    
    // Status Pembayaran Acak. Bikin beberapa pending/partial
    const paymentRand = Math.random();
    let paymentStatus = 'paid';
    if (paymentRand > 0.85) paymentStatus = 'pending';
    else if (paymentRand > 0.7) paymentStatus = 'partial';

    // Buat Sale Header
    const sale = await prisma.sale.create({
      data: {
        invoiceNumber: `INV-${faker.string.numeric(6)}`,
        customerName: faker.person.fullName(),
        customerPhone: faker.phone.number(),
        total: 0, // Akan diupdate nanti
        subtotal: 0,
        paymentStatus,
        paymentMethod: faker.helpers.arrayElement(['cash', 'transfer', 'debit']),
        userId: admin.id,
        createdAt: pastDate,
        updatedAt: pastDate
      }
    });

    let saleTotal = 0;
    
    // Mix antara Beli Barang (Fisik) dan Beli Jasa (Service)
    const isPhysicalOnly = Math.random() > 0.4;
    const isServiceOnly = Math.random() < 0.2;
    // sisanya campur

    // Helper: Tambah item fisik
    if (!isServiceOnly) {
      const itemsCount = faker.number.int({ min: 1, max: 4 });
      for (let j = 0; j < itemsCount; j++) {
        const prod = faker.helpers.arrayElement(physicalProducts);
        const qty = faker.number.int({ min: 1, max: 3 });
        const subtotal = prod.price * qty;
        saleTotal += subtotal;

        await prisma.saleItem.create({
          data: {
            saleId: sale.id,
            productId: prod.id,
            productName: prod.name,
            productSku: prod.sku,
            unitCost: prod.cost,
            price: prod.price,
            quantity: qty,
            subtotal: subtotal
          }
        });
      }
    }

    // Helper: Tambah Jasa Servis (dengan status & teknisi)
    if (!isPhysicalOnly) {
      const srvProd = faker.helpers.arrayElement(serviceProducts);
      const subtotal = srvProd.price * 1; // qty slalu 1 utk jasa
      saleTotal += subtotal;

      // Logic "Aging Service" (jika diauthor lebih dari 2 hari lalu & belum selesai)
      const isPast = pastDate.getTime() < Date.now() - (2 * 24 * 60 * 60 * 1000); // 2 hari lalu
      let servStatus = faker.helpers.arrayElement(['scheduled', 'in_progress', 'completed', 'cancelled']);
      
      // Paksa beberapa supaya jadi aging
      if (isPast && Math.random() > 0.5) servStatus = 'in_progress';

      const technicianId = faker.helpers.arrayElement(technicians).id;

      await prisma.saleItem.create({
        data: {
          saleId: sale.id,
          productId: srvProd.id,
          productName: srvProd.name,
          productSku: srvProd.sku,
          price: srvProd.price,
          quantity: 1,
          subtotal: subtotal,
          serviceStatus: servStatus, // 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
          serviceTechnician: technicianId,
          serviceSchedule: pastDate, // Mulai dikerjakan di waktu transaksi
          notes: faker.lorem.sentence()
        }
      });
    }

    // Update Header
    await prisma.sale.update({
      where: { id: sale.id },
      data: {
        subtotal: saleTotal,
        total: saleTotal,
      }
    });
  }

  // --- 7. PURCHASE ORDERS (RESTOCK BARANG) ---
  console.log('Sedang merekam histori Purchase Order & log persediaan...');
  for (let i = 0; i < 10; i++) {
    const poDate = faker.date.recent({ days: 30 });
    const po = await prisma.purchaseOrder.create({
      data: {
        poNumber: `PO-${faker.string.numeric(5)}`,
        supplierId: faker.helpers.arrayElement(suppliers).id,
        status: faker.helpers.arrayElement(['draft', 'sent', 'received']),
        totalAmount: 0,
        createdBy: admin.id,
        createdAt: poDate,
        updatedAt: poDate
      }
    });

    let poTotal = 0;
    const itemsCount = faker.number.int({ min: 1, max: 5 });
    for (let j = 0; j < itemsCount; j++) {
      const prod = faker.helpers.arrayElement(physicalProducts);
      const qty = faker.number.int({ min: 5, max: 20 });
      poTotal += (prod.cost || 0) * qty;

      await prisma.purchaseOrderItem.create({
        data: {
          poId: po.id,
          productId: prod.id,
          unitCost: prod.cost || 0,
          quantity: qty,
          subtotal: (prod.cost || 0) * qty
        }
      });
    }
    await prisma.purchaseOrder.update({
      where: { id: po.id },
      data: { totalAmount: poTotal }
    });
  }

  console.log('✅ SELESAI! Data simulasi Central Computer berhasil di-generate.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

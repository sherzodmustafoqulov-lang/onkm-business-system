const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('--- SEEDING ONKM BUSINESS SYSTEM DATABASE ---');

  // 1. Roles
  const rolesData = [
    {
      name: 'ADMIN',
      displayName: 'Administrator / Rahbar',
      description: 'Barcha tizim funksiyalari, moliya, xodimlar va sozlamalarga to\'liq huquq',
      isSystem: true,
    },
    {
      name: 'MANAGER',
      displayName: 'Menejer',
      description: 'Mijozlar, savdo, buyurtmalar, takliflar va o\'rnatish vazifalari berish',
      isSystem: true,
    },
    {
      name: 'TECHNICIAN',
      displayName: 'Texnik xodim',
      description: 'Biriktirilgan o\'rnatish va servis vazifalari, texnik aktlar',
      isSystem: true,
    },
    {
      name: 'WAREHOUSE',
      displayName: 'Omborchi',
      description: 'Ombor, mahsulotlar, qoldiqlar, seriya raqamlari va fiskal modullar',
      isSystem: true,
    },
    {
      name: 'ACCOUNTANT',
      displayName: 'Kassir / Buxgalter',
      description: 'To\'lovlar, hisob-fakturalar, kassa, bank va moliyaviy hisobotlar',
      isSystem: true,
    },
    {
      name: 'SUPPORT',
      displayName: 'Support Operator',
      description: 'Mijoz murojaatlari, nosozliklar, Telegram ticketlar va konsultatsiya',
      isSystem: true,
    },
  ];

  const roles = {};
  for (const r of rolesData) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: r,
      create: r,
    });
    roles[r.name] = role;
  }
  console.log('✅ Rollar yaratildi (6 ta)');

  // 2. Permissions (RBAC)
  const resources = [
    'CUSTOMERS', 'SALES', 'WAREHOUSE', 'INSTALLATIONS', 
    'SUPPORT', 'FINANCE', 'REPORTS', 'SETTINGS', 'USERS', 'AUDIT'
  ];

  for (const res of resources) {
    // Admin: Full access everywhere
    await prisma.permission.upsert({
      where: { roleId_resource: { roleId: roles.ADMIN.id, resource: res } },
      update: {
        canView: true, canCreate: true, canEdit: true, canDelete: true,
        canApprove: true, canExport: true, canFinanceView: true, canSensitiveDataView: true,
      },
      create: {
        roleId: roles.ADMIN.id, resource: res,
        canView: true, canCreate: true, canEdit: true, canDelete: true,
        canApprove: true, canExport: true, canFinanceView: true, canSensitiveDataView: true,
      },
    });

    // Manager
    const isMgrAllowed = ['CUSTOMERS', 'SALES', 'INSTALLATIONS', 'SUPPORT', 'WAREHOUSE'].includes(res);
    await prisma.permission.upsert({
      where: { roleId_resource: { roleId: roles.MANAGER.id, resource: res } },
      update: {
        canView: isMgrAllowed, canCreate: isMgrAllowed, canEdit: isMgrAllowed, canDelete: false,
        canApprove: false, canExport: true, canFinanceView: false, canSensitiveDataView: false,
      },
      create: {
        roleId: roles.MANAGER.id, resource: res,
        canView: isMgrAllowed, canCreate: isMgrAllowed, canEdit: isMgrAllowed, canDelete: false,
        canApprove: false, canExport: true, canFinanceView: false, canSensitiveDataView: false,
      },
    });

    // Technician
    const isTechAllowed = ['INSTALLATIONS', 'CUSTOMERS', 'SUPPORT'].includes(res);
    await prisma.permission.upsert({
      where: { roleId_resource: { roleId: roles.TECHNICIAN.id, resource: res } },
      update: {
        canView: isTechAllowed, canCreate: false, canEdit: res === 'INSTALLATIONS', canDelete: false,
        canApprove: false, canExport: false, canFinanceView: false, canSensitiveDataView: false,
      },
      create: {
        roleId: roles.TECHNICIAN.id, resource: res,
        canView: isTechAllowed, canCreate: false, canEdit: res === 'INSTALLATIONS', canDelete: false,
        canApprove: false, canExport: false, canFinanceView: false, canSensitiveDataView: false,
      },
    });

    // Warehouse
    const isWhAllowed = ['WAREHOUSE', 'CUSTOMERS'].includes(res);
    await prisma.permission.upsert({
      where: { roleId_resource: { roleId: roles.WAREHOUSE.id, resource: res } },
      update: {
        canView: isWhAllowed, canCreate: isWhAllowed, canEdit: isWhAllowed, canDelete: false,
        canApprove: true, canExport: true, canFinanceView: false, canSensitiveDataView: false,
      },
      create: {
        roleId: roles.WAREHOUSE.id, resource: res,
        canView: isWhAllowed, canCreate: isWhAllowed, canEdit: isWhAllowed, canDelete: false,
        canApprove: true, canExport: true, canFinanceView: false, canSensitiveDataView: false,
      },
    });

    // Accountant
    const isAccAllowed = ['FINANCE', 'SALES', 'CUSTOMERS', 'REPORTS'].includes(res);
    await prisma.permission.upsert({
      where: { roleId_resource: { roleId: roles.ACCOUNTANT.id, resource: res } },
      update: {
        canView: isAccAllowed, canCreate: isAccAllowed, canEdit: isAccAllowed, canDelete: false,
        canApprove: true, canExport: true, canFinanceView: true, canSensitiveDataView: true,
      },
      create: {
        roleId: roles.ACCOUNTANT.id, resource: res,
        canView: isAccAllowed, canCreate: isAccAllowed, canEdit: isAccAllowed, canDelete: false,
        canApprove: true, canExport: true, canFinanceView: true, canSensitiveDataView: true,
      },
    });

    // Support
    const isSupAllowed = ['SUPPORT', 'CUSTOMERS', 'INSTALLATIONS'].includes(res);
    await prisma.permission.upsert({
      where: { roleId_resource: { roleId: roles.SUPPORT.id, resource: res } },
      update: {
        canView: isSupAllowed, canCreate: isSupAllowed, canEdit: isSupAllowed, canDelete: false,
        canApprove: false, canExport: false, canFinanceView: false, canSensitiveDataView: false,
      },
      create: {
        roleId: roles.SUPPORT.id, resource: res,
        canView: isSupAllowed, canCreate: isSupAllowed, canEdit: isSupAllowed, canDelete: false,
        canApprove: false, canExport: false, canFinanceView: false, canSensitiveDataView: false,
      },
    });
  }
  console.log('✅ RBAC Permissionlar yuklandi');

  // 3. Branches
  const branchesData = [
    { name: 'Sirdaryo filiali', code: 'SIRDARYO', address: 'Guliston sh., O\'zbekiston shox ko\'chasi, 42-uy', phone: '+998 67 225-11-22' },
    { name: 'Andijon filiali', code: 'ANDIJON', address: 'Andijon sh., Bobur shox ko\'chasi, 18-uy', phone: '+998 74 223-44-55' },
    { name: 'Namangan filiali', code: 'NAMANGAN', address: 'Namangan sh., Navoiy ko\'chasi, 5-uy', phone: '+998 69 234-88-99' },
    { name: 'Jizzax filiali', code: 'JIZZAX', address: 'Jizzax sh., Sh. Rashidov shox ko\'chasi, 12-uy', phone: '+998 72 226-77-88' },
    { name: 'Bo\'ka filiali', code: 'BOKA', address: 'Toshkent vil., Bo\'ka tumani, Markaziy ko\'cha, 1-uy', phone: '+998 70 562-33-44' },
    { name: 'Farg\'ona filiali', code: 'FARGONA', address: 'Farg\'ona sh., Al-Farg\'oniy ko\'chasi, 74-uy', phone: '+998 73 244-12-34' },
  ];

  const branches = {};
  for (const b of branchesData) {
    const branch = await prisma.branch.upsert({
      where: { code: b.code },
      update: b,
      create: b,
    });
    branches[b.code] = branch;
  }
  console.log('✅ Filiallar yaratildi (6 ta)');

  // 4. Test Users
  const defaultPassword = await bcrypt.hash('admin123', 10);
  const usersData = [
    {
      email: 'admin@onkm.uz',
      name: 'Alisher Qodirov (Bosh direktor)',
      roleId: roles.ADMIN.id,
      branchId: branches.SIRDARYO.id,
      phone: '+998 90 123-45-67',
    },
    {
      email: 'manager@onkm.uz',
      name: 'Bobur Mirzayev (Yetakchi menejer)',
      roleId: roles.MANAGER.id,
      branchId: branches.ANDIJON.id,
      phone: '+998 91 234-56-78',
    },
    {
      email: 'tech@onkm.uz',
      name: 'Jamshid Karimov (Bosh servis texnik)',
      roleId: roles.TECHNICIAN.id,
      branchId: branches.SIRDARYO.id,
      phone: '+998 93 345-67-89',
    },
    {
      email: 'warehouse@onkm.uz',
      name: 'Sardor Nurmatov (Bosh ombor mudiri)',
      roleId: roles.WAREHOUSE.id,
      branchId: branches.SIRDARYO.id,
      phone: '+998 94 456-78-90',
    },
    {
      email: 'accountant@onkm.uz',
      name: 'Nilufar Rahimova (Bosh buxgalter)',
      roleId: roles.ACCOUNTANT.id,
      branchId: branches.SIRDARYO.id,
      phone: '+998 97 567-89-01',
    },
    {
      email: 'support@onkm.uz',
      name: 'Madina Umarova (Support operatori)',
      roleId: roles.SUPPORT.id,
      branchId: branches.SIRDARYO.id,
      phone: '+998 99 678-90-12',
    },
  ];

  const users = {};
  for (const u of usersData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { ...u, passwordHash: defaultPassword },
      create: { ...u, passwordHash: defaultPassword },
    });
    users[u.email] = user;
  }
  console.log('✅ Test foydalanuvchilar yaratildi (6 ta)');

  // 5. Product Categories
  const categoriesData = [
    { name: 'Online Kassa (ONKM)', code: 'ONKM', description: 'Fiskal xotirali online nazorat kassa apparatlari' },
    { name: 'POS Tizimlar', code: 'POS', description: 'Sensorli POS monobloklar va terminal kompyuterlar' },
    { name: 'Fiskal Modullar', code: 'FM', description: 'Davlat soliq qo\'mitasi sertifikatlangan fiskal modullar' },
    { name: 'Bank Terminallari', code: 'TERMINAL', description: 'HUMO, UZCARD, Visa va Mastercard to\'lov terminallari' },
    { name: 'Chek Printerlar', code: 'PRINTER', description: 'Issiqlik orqali chop etuvchi 58mm va 80mm printerlar' },
    { name: '2D & Shtrix Skanerlar', code: 'SCANNER', description: 'Asl Belgisi va DataMatrix markirovka skanerlari' },
    { name: 'Pul Qutilari', code: 'DRAWER', description: 'Avtomatik ochiluvchi metall kassa qutilari' },
    { name: 'Dasturiy Ta\'minot', code: 'SOFTWARE', description: 'Savdo va restoran avtomatlashtirish litsenziyalari' },
  ];

  const categories = {};
  for (const c of categoriesData) {
    const cat = await prisma.productCategory.upsert({
      where: { code: c.code },
      update: c,
      create: c,
    });
    categories[c.code] = cat;
  }
  console.log('✅ Mahsulot kategoriyalari yaratildi (8 ta)');

  // 6. Products (20 products)
  const productsData = [
    { name: 'Aclas CRV-100 Online Kassa', sku: 'ONKM-ACLAS-100', categoryId: categories.ONKM.id, manufacturer: 'Aclas', model: 'CRV-100', purchasePrice: 1900000, sellingPrice: 2450000, minStock: 5, unit: 'dona', hasSerial: true, warrantyMonths: 12 },
    { name: 'Mercury 185F ONKM', sku: 'ONKM-MERCURY-185', categoryId: categories.ONKM.id, manufacturer: 'Incotex', model: 'Mercury 185F', purchasePrice: 1650000, sellingPrice: 2150000, minStock: 5, unit: 'dona', hasSerial: true, warrantyMonths: 12 },
    { name: 'SmartOne Smart Kassa & POS', sku: 'ONKM-SMART-ONE', categoryId: categories.ONKM.id, manufacturer: 'SmartOne', model: 'S1-PRO', purchasePrice: 2800000, sellingPrice: 3600000, minStock: 3, unit: 'dona', hasSerial: true, warrantyMonths: 12 },
    { name: 'Sunmi V2s Smart Kassa', sku: 'ONKM-SUNMI-V2S', categoryId: categories.ONKM.id, manufacturer: 'Sunmi', model: 'V2s Plus', purchasePrice: 2500000, sellingPrice: 3200000, minStock: 4, unit: 'dona', hasSerial: true, warrantyMonths: 12 },
    
    { name: 'POS Monoblok 15.6" i5/8GB/128SSD', sku: 'POS-MONO-I5', categoryId: categories.POS.id, manufacturer: 'PosBank', model: 'Apex Pro', purchasePrice: 4200000, sellingPrice: 5300000, minStock: 2, unit: 'dona', hasSerial: true, warrantyMonths: 12 },
    { name: 'Sunmi D2s Plus Stolustu POS', sku: 'POS-SUNMI-D2S', categoryId: categories.POS.id, manufacturer: 'Sunmi', model: 'D2s Plus', purchasePrice: 3600000, sellingPrice: 4500000, minStock: 3, unit: 'dona', hasSerial: true, warrantyMonths: 12 },
    { name: 'POS Monoblok J1900 15" Sensor', sku: 'POS-J1900', categoryId: categories.POS.id, manufacturer: 'Ocom', model: 'POS-8815', purchasePrice: 3100000, sellingPrice: 3900000, minStock: 2, unit: 'dona', hasSerial: true, warrantyMonths: 12 },

    { name: 'Fiskal Modul 2.0 (Yangi avlod)', sku: 'FM-DSQ-V2', categoryId: categories.FM.id, manufacturer: 'Davlat Belgisi', model: 'FM-UZ-2024', purchasePrice: 650000, sellingPrice: 850000, minStock: 10, unit: 'dona', hasSerial: true, warrantyMonths: 12 },
    { name: 'Fiskal Modul Micro-FM', sku: 'FM-DSQ-MICRO', categoryId: categories.FM.id, manufacturer: 'Davlat Belgisi', model: 'MFM-2023', purchasePrice: 600000, sellingPrice: 800000, minStock: 8, unit: 'dona', hasSerial: true, warrantyMonths: 12 },

    { name: 'PAX D210 To\'lov Terminali', sku: 'TERM-PAX-D210', categoryId: categories.TERMINAL.id, manufacturer: 'PAX', model: 'D210', purchasePrice: 1800000, sellingPrice: 2300000, minStock: 5, unit: 'dona', hasSerial: true, warrantyMonths: 12 },
    { name: 'Verifone VX520 Dual Terminal', sku: 'TERM-VERIFONE-VX', categoryId: categories.TERMINAL.id, manufacturer: 'Verifone', model: 'VX520', purchasePrice: 1600000, sellingPrice: 2100000, minStock: 4, unit: 'dona', hasSerial: true, warrantyMonths: 12 },

    { name: 'Xprinter XP-Q800 80mm Chek Printer', sku: 'PRINT-XP-Q800', categoryId: categories.PRINTER.id, manufacturer: 'Xprinter', model: 'XP-Q800 USB+LAN', purchasePrice: 650000, sellingPrice: 890000, minStock: 6, unit: 'dona', hasSerial: true, warrantyMonths: 12 },
    { name: 'Xprinter XP-58IIH 58mm Chek Printer', sku: 'PRINT-XP-58', categoryId: categories.PRINTER.id, manufacturer: 'Xprinter', model: 'XP-58IIH', purchasePrice: 320000, sellingPrice: 470000, minStock: 8, unit: 'dona', hasSerial: true, warrantyMonths: 6 },

    { name: 'Zebra DS2208 2D DataMatrix Skaner', sku: 'SCAN-ZEBRA-2208', categoryId: categories.SCANNER.id, manufacturer: 'Zebra', model: 'DS2208', purchasePrice: 950000, sellingPrice: 1350000, minStock: 5, unit: 'dona', hasSerial: true, warrantyMonths: 24 },
    { name: 'Honeywell HF680 2D Stolustu Skaner', sku: 'SCAN-HONEYWELL-680', categoryId: categories.SCANNER.id, manufacturer: 'Honeywell', model: 'HF680', purchasePrice: 1100000, sellingPrice: 1550000, minStock: 4, unit: 'dona', hasSerial: true, warrantyMonths: 12 },
    { name: 'Netum C750 Simsiz Shtrix Skaner', sku: 'SCAN-NETUM-C750', categoryId: categories.SCANNER.id, manufacturer: 'Netum', model: 'C750 Wireless', purchasePrice: 520000, sellingPrice: 750000, minStock: 4, unit: 'dona', hasSerial: true, warrantyMonths: 12 },

    { name: 'Metall Pul Qutisi 410A (5 bo\'lma)', sku: 'DRAWER-410A', categoryId: categories.DRAWER.id, manufacturer: 'PosBank', model: 'CR-410A', purchasePrice: 420000, sellingPrice: 590000, minStock: 5, unit: 'dona', hasSerial: false, warrantyMonths: 6 },
    
    { name: 'ONKM Savdo Avtomatlashtirish Dasturi (1 yillik)', sku: 'SOFT-ONKM-RETAIL', categoryId: categories.SOFTWARE.id, manufacturer: 'ONKM Soft', model: 'v4.5', purchasePrice: 800000, sellingPrice: 1400000, minStock: 100, unit: 'litsenziya', hasSerial: false, warrantyMonths: 12 },
    { name: 'Restoran & Kafe POS Tizim Litsenziyasi', sku: 'SOFT-REST-CAFE', categoryId: categories.SOFTWARE.id, manufacturer: 'ONKM Soft', model: 'RestoPro 2025', purchasePrice: 1200000, sellingPrice: 1900000, minStock: 100, unit: 'litsenziya', hasSerial: false, warrantyMonths: 12 },
    { name: 'OFD Yillik Abonent Xizmati', sku: 'SERV-OFD-YEAR', categoryId: categories.SOFTWARE.id, manufacturer: 'Soliq Servis', model: 'OFD-2025', purchasePrice: 380000, sellingPrice: 480000, minStock: 200, unit: 'obuna', hasSerial: false, warrantyMonths: 12 },
  ];

  const products = [];
  for (const p of productsData) {
    const product = await prisma.product.upsert({
      where: { sku: p.sku },
      update: p,
      create: p,
    });
    products.push(product);
  }
  console.log('✅ Mahsulotlar yaratildi (20 ta)');

  // 6.1 Warehouse Stock & Movements for each branch
  const branchList = Object.values(branches);
  for (const prod of products) {
    for (let bIndex = 0; bIndex < branchList.length; bIndex++) {
      const br = branchList[bIndex];
      // Generate realistic quantities (head branch has more)
      const baseQty = bIndex === 0 ? 25 : (12 - bIndex * 2);
      const qty = Math.max(2, baseQty);
      const resv = bIndex === 0 ? 3 : 1;

      await prisma.warehouseStock.upsert({
        where: {
          productId_branchId: {
            productId: prod.id,
            branchId: br.id,
          },
        },
        update: { quantity: qty, reserved: resv, minStock: prod.minStock },
        create: {
          productId: prod.id,
          branchId: br.id,
          quantity: qty,
          reserved: resv,
          minStock: prod.minStock,
        },
      });
    }

    // Create Initial Stock Movement (KIRIM)
    await prisma.stockMovement.create({
      data: {
        productId: prod.id,
        branchId: branchList[0].id,
        movementType: 'KIRIM',
        quantity: 50,
        price: prod.purchasePrice,
        reason: 'Markaziy omborga yetkazib beruvchidan partiya qabuli',
        docNumber: `KIR-2025-${prod.sku}`,
        userName: 'Sardor Nurmatov (Ombor mudiri)',
      },
    });
  }
  console.log('✅ Barcha filiallar bo\'yicha ombor qoldiqlari va kirim harakatlari kiritildi');

  // 7. Customers (10 enterprises)
  const customersData = [
    {
      companyName: 'MARQAND TRADE MCHJ',
      inn: '307123456',
      companyType: 'MCHJ',
      legalStatus: 'Faol',
      tradeMark: 'Marqand Supermarket',
      activityType: 'Oziq-ovqat chakana savdosi',
      oked: '47110',
      address: 'Sirdaryo vil., Guliston sh., Birlashgan k., 14',
      phone: '+998 90 333-22-11',
      email: 'info@marqand.uz',
      bank: 'Ipak Yo\'li Bank',
      accountNumber: '20208000900123456001',
      mfo: '00444',
      director: 'Rustam Karimov',
      contactPerson: 'Sardor aka (Bosh buxgalter)',
      branchId: branches.SIRDARYO.id,
      managerId: users['manager@onkm.uz'].id,
      status: 'FAOL',
      ofdStatus: 'ULANGAN',
      debt: 1250000,
    },
    {
      companyName: 'ANDIJON NON INVEST XK',
      inn: '308987654',
      companyType: 'XK',
      legalStatus: 'Faol',
      tradeMark: 'Andijon Shirinliklari',
      activityType: 'Non va qandolat mahsulotlari savdosi',
      oked: '10710',
      address: 'Andijon sh., Fitrat ko\'chasi, 25-uy',
      phone: '+998 74 228-99-00',
      email: 'andijon_non@mail.uz',
      bank: 'Agrobank ATB',
      accountNumber: '20208000400543210001',
      mfo: '00321',
      director: 'Muxammadali Zokirov',
      contactPerson: 'Muxammadali (Rahbar)',
      branchId: branches.ANDIJON.id,
      managerId: users['manager@onkm.uz'].id,
      status: 'FAOL',
      ofdStatus: 'ULANGAN',
      debt: 0,
    },
    {
      companyName: 'CHUST MILLIY TAOMLAR YaTT',
      inn: '567890123',
      companyType: 'YaTT',
      legalStatus: 'Faol',
      tradeMark: 'Chust Somsa & Osh',
      activityType: 'Restoran va umumiy ovqatlanish',
      oked: '56100',
      address: 'Namangan vil., Chust sh., Mustaqillik shox k., 9',
      phone: '+998 91 665-44-33',
      email: 'chust_taom@inbox.uz',
      bank: 'Xalq Banki',
      accountNumber: '20208000100789123001',
      mfo: '00112',
      director: 'Akmalxon Chustiy',
      contactPerson: 'Akmalxon aka',
      branchId: branches.NAMANGAN.id,
      managerId: users['manager@onkm.uz'].id,
      status: 'FAOL',
      ofdStatus: 'ULANGAN',
      debt: 0,
    },
    {
      companyName: 'JIZZAX GAVHARI MCHJ',
      inn: '302345678',
      companyType: 'MCHJ',
      legalStatus: 'Faol',
      tradeMark: 'Gavhar Market',
      activityType: 'Universal do\'konlar tarmog\'i',
      oked: '47190',
      address: 'Jizzax sh., Zargarlik mahallasi, 88-uy',
      phone: '+998 72 222-15-15',
      email: 'gavhar_jizzax@gmail.com',
      bank: 'SQB (O\'zsanoatqurilishbank)',
      accountNumber: '20208000300998877001',
      mfo: '00234',
      director: 'Dilshod Normatov',
      contactPerson: 'Zokir (Menejer)',
      branchId: branches.JIZZAX.id,
      managerId: users['manager@onkm.uz'].id,
      status: 'FAOL',
      ofdStatus: 'ULANGAN',
      debt: 2400000,
    },
    {
      companyName: 'BOKA DEHQON BAZOR SAVDO MCHJ',
      inn: '305678912',
      companyType: 'MCHJ',
      legalStatus: 'Faol',
      tradeMark: 'Bo\'ka Agro Savdo',
      activityType: 'Qishloq xo\'jalik mahsulotlari savdosi',
      oked: '46310',
      address: 'Toshkent vil., Bo\'ka t., Bozor ko\'chasi, 2-uy',
      phone: '+998 90 777-88-99',
      email: 'boka_bozor@uz',
      bank: 'Mikrokreditbank',
      accountNumber: '20208000500443322001',
      mfo: '00567',
      director: 'Otabek G\'aniyev',
      contactPerson: 'Otabek aka',
      branchId: branches.BOKA.id,
      managerId: users['manager@onkm.uz'].id,
      status: 'FAOL',
      ofdStatus: 'ULANGAN',
      debt: 0,
    },
    {
      companyName: 'FARGONA NUR APTEKA XK',
      inn: '309112233',
      companyType: 'XK',
      legalStatus: 'Faol',
      tradeMark: 'Nur Farmatsiya',
      activityType: 'Farmatsevtika va dorixona',
      oked: '47730',
      address: 'Farg\'ona sh., Sayilgoh ko\'chasi, 19-uy',
      phone: '+998 73 224-88-00',
      email: 'nurfarm@fargona.uz',
      bank: 'Orient Finans Bank',
      accountNumber: '20208000700112233001',
      mfo: '00678',
      director: 'Nodira Mahmudova',
      contactPerson: 'Farhod (IT mutaxassis)',
      branchId: branches.FARGONA.id,
      managerId: users['manager@onkm.uz'].id,
      status: 'FAOL',
      ofdStatus: 'ULANGAN',
      debt: 450000,
    },
    {
      companyName: 'SAFIA SWEET CAFE MCHJ',
      inn: '304556677',
      companyType: 'MCHJ',
      legalStatus: 'Faol',
      tradeMark: 'Safia Kafe Guliston',
      activityType: 'Konditer va kafe xizmatlari',
      oked: '56100',
      address: 'Guliston sh., Sayqal ko\'chasi, 5-uy',
      phone: '+998 90 999-00-11',
      email: 'safia_guliston@safia.uz',
      bank: 'Kapitalbank ATB',
      accountNumber: '20208000800998811001',
      mfo: '00890',
      director: 'Umida Jalilova',
      contactPerson: 'Behzod (Administrator)',
      branchId: branches.SIRDARYO.id,
      managerId: users['manager@onkm.uz'].id,
      status: 'FAOL',
      ofdStatus: 'ULANGAN',
      debt: 0,
    },
    {
      companyName: 'ANDIJON SMART BUILDING MCHJ',
      inn: '306778899',
      companyType: 'MCHJ',
      legalStatus: 'Faol',
      tradeMark: 'Smart Stroy Materiallar',
      activityType: 'Qurilish mollari do\'koni',
      oked: '47520',
      address: 'Andijon sh., Mashrab ko\'chasi, 104-uy',
      phone: '+998 93 444-55-66',
      email: 'smartstroy@andijon.uz',
      bank: 'Hamkorbank ATB',
      accountNumber: '20208000200334455001',
      mfo: '00083',
      director: 'Ravshanbek Tursunov',
      contactPerson: 'Ravshanbek',
      branchId: branches.ANDIJON.id,
      managerId: users['manager@onkm.uz'].id,
      status: 'FAOL',
      ofdStatus: 'ULANGAN',
      debt: 3800000,
    },
    {
      companyName: 'NAMANGAN TEXTILE FASHION MCHJ',
      inn: '303221144',
      companyType: 'MCHJ',
      legalStatus: 'Faol',
      tradeMark: 'NamTextile Shop',
      activityType: 'Kiyim-kechak chakana savdosi',
      oked: '47710',
      address: 'Namangan sh., G\'alaba shox ko\'chasi, 31-uy',
      phone: '+998 69 227-11-00',
      email: 'namtextile@inbox.uz',
      bank: 'Asakabank',
      accountNumber: '20208000600667788001',
      mfo: '00123',
      director: 'Ibrohim Yo\'ldoshev',
      contactPerson: 'Ibrohim aka',
      branchId: branches.NAMANGAN.id,
      managerId: users['manager@onkm.uz'].id,
      status: 'FAOL',
      ofdStatus: 'ULANGAN',
      debt: 0,
    },
    {
      companyName: 'OASIS BURGER FAST FOOD YaTT',
      inn: '561234987',
      companyType: 'YaTT',
      legalStatus: 'Faol',
      tradeMark: 'Oasis Burger Fast Food',
      activityType: 'Fast-food va tezkor taomlar',
      oked: '56100',
      address: 'Farg\'ona sh., Marhamat ko\'chasi, 12-uy',
      phone: '+998 90 111-33-55',
      email: 'oasisburger@fargona.uz',
      bank: 'Ipoteka Bank',
      accountNumber: '20208000300112244001',
      mfo: '00456',
      director: 'Jasurbek Usmonov',
      contactPerson: 'Jasurbek',
      branchId: branches.FARGONA.id,
      managerId: users['manager@onkm.uz'].id,
      status: 'FAOL',
      ofdStatus: 'ULANGAN',
      debt: 600000,
    },
  ];

  const customers = [];
  for (const c of customersData) {
    const cust = await prisma.customer.upsert({
      where: { inn: c.inn },
      update: c,
      create: c,
    });
    customers.push(cust);
  }
  console.log('✅ Mijozlar yaratildi (10 ta)');

  // 8. Fiscal Modules (10 FM)
  const fmStatuses = ['FAOL', 'FAOL', 'FAOL', 'FAOL', 'OMBORDA', 'OMBORDA', 'FILIALDA', 'REZERV', 'O\'RNATILDI', 'NOSOZ'];
  for (let i = 1; i <= 10; i++) {
    const serial = `FM99800${1000 + i}`;
    const cust = i <= 6 ? customers[i - 1] : null;
    const branch = i % 2 === 0 ? branches.SIRDARYO : branches.ANDIJON;
    await prisma.fiscalModule.upsert({
      where: { serialNumber: serial },
      update: {},
      create: {
        serialNumber: serial,
        branchId: branch.id,
        status: fmStatuses[i - 1],
        customerId: cust ? cust.id : null,
        kkmSerialNumber: cust ? `ACLAS-CRV-${2000 + i}` : null,
        installedAt: cust ? new Date('2024-05-10') : null,
        registeredAt: cust ? new Date('2024-05-11') : null,
        warrantyEndDate: new Date('2025-05-11'),
        notes: `DSQ ruxsatnomasi bilan ro'yxatdan o'tgan FM #${i}`,
      },
    });
  }
  console.log('✅ Fiskal modullar yaratildi (10 ta)');

  // 9. ONKM Serials (10 devices)
  const aclasProduct = products.find(p => p.sku === 'ONKM-ACLAS-100');
  for (let i = 1; i <= 10; i++) {
    const serial = `ACLAS-CRV-${2000 + i}`;
    const cust = i <= 6 ? customers[i - 1] : null;
    const branch = i % 2 === 0 ? branches.SIRDARYO : branches.ANDIJON;
    await prisma.productSerial.upsert({
      where: { serialNumber: serial },
      update: {},
      create: {
        productId: aclasProduct.id,
        serialNumber: serial,
        branchId: branch.id,
        status: cust ? 'O\'RNATILDI' : 'OMBORDA',
        customerId: cust ? cust.id : null,
        installedAt: cust ? new Date('2024-05-10') : null,
        warrantyEndDate: new Date('2025-05-10'),
        notes: `CRV-100 Onlayn Kassa Qurilmasi #${i}`,
      },
    });
  }
  console.log('✅ ONKM seriyalari yaratildi (10 ta)');

  // 10. Orders & Payments (10 orders, 10 payments)
  const orderStatuses = ['YAKUNLANDI', 'YAKUNLANDI', 'YETKAZILMOQDA', 'TASDIQLANDI', 'YANGI', 'YAKUNLANDI', 'YAKUNLANDI', 'YETKAZILMOQDA', 'TASDIQLANDI', 'YAKUNLANDI'];
  const payStatuses = ['TO\'LIQ_TO\'LANGAN', 'TO\'LIQ_TO\'LANGAN', 'QISMAN_TO\'LANGAN', 'KUTILMOQDA', 'KUTILMOQDA', 'TO\'LIQ_TO\'LANGAN', 'TO\'LIQ_TO\'LANGAN', 'QISMAN_TO\'LANGAN', 'KUTILMOQDA', 'TO\'LIQ_TO\'LANGAN'];
  const paymentMethods = ['BANK', 'CLICK', 'NAQD', 'PAYME', 'HUMO', 'UZCARD', 'BANK', 'CLICK', 'PAYNET', 'BANK'];

  const orders = [];
  for (let i = 1; i <= 10; i++) {
    const orderNum = `ORD-2025-${String(100 + i).padStart(4, '0')}`;
    const cust = customers[i - 1];
    const total = 3900000 + i * 200000;
    const discount = i % 3 === 0 ? 200000 : 0;
    const finalAmount = total - discount;
    const isPaid = payStatuses[i - 1] === 'TO\'LIQ_TO\'LANGAN';
    const isPartial = payStatuses[i - 1] === 'QISMAN_TO\'LANGAN';
    const paidAmount = isPaid ? finalAmount : (isPartial ? Math.round(finalAmount / 2) : 0);
    const debtAmount = finalAmount - paidAmount;

    const order = await prisma.order.upsert({
      where: { orderNumber: orderNum },
      update: {},
      create: {
        orderNumber: orderNum,
        customerId: cust.id,
        branchId: cust.branchId,
        managerId: users['manager@onkm.uz'].id,
        totalAmount: total,
        discountAmount: discount,
        finalAmount: finalAmount,
        paidAmount: paidAmount,
        debtAmount: debtAmount,
        status: orderStatuses[i - 1],
        paymentStatus: payStatuses[i - 1],
        deliveryRequired: true,
        installationRequired: true,
        notes: `Mijoz ${cust.companyName} uchun avtomatlashtirish to'plami`,
      },
    });
    orders.push(order);

    // Order Item
    await prisma.orderItem.create({
      data: {
        orderId: order.id,
        productId: aclasProduct.id,
        quantity: 1,
        unitPrice: aclasProduct.sellingPrice,
        discount: discount,
        totalPrice: aclasProduct.sellingPrice - discount,
      },
    });

    // Payment if paid/partial
    if (paidAmount > 0) {
      await prisma.payment.upsert({
        where: { paymentNumber: `PAY-2025-${String(100 + i).padStart(4, '0')}` },
        update: {},
        create: {
          paymentNumber: `PAY-2025-${String(100 + i).padStart(4, '0')}`,
          orderId: order.id,
          customerId: cust.id,
          amount: paidAmount,
          method: paymentMethods[i - 1],
          status: 'TO\'LIQ_TO\'LANGAN',
          receivedById: users['accountant@onkm.uz'].id,
          notes: `${orderNum} bo'yicha to'lov qabul qilindi`,
        },
      });
    }
  }
  console.log('✅ Buyurtmalar va to\'lovlar yaratildi (10 ta)');

  // 11. Installations (5 tasks)
  const installTasks = [
    { serviceType: 'ONKM_ORNATISH', deviceName: 'Aclas CRV-100 Kassa', status: 'YAKUNLANDI', notes: 'Kassa apparat o\'rnatildi, fiskallashtirildi va chek chiqarib test qilindi.' },
    { serviceType: 'POS_ORNATISH', deviceName: 'PosBank Apex Pro Monoblok', status: 'YAKUNLANDI', notes: 'POS monoblok o\'rnatildi, chek printer va skaner ulandi.' },
    { serviceType: 'FM_ALMASHTIRISH', deviceName: 'Fiskal Modul V2', status: 'JARAYONDA', notes: 'Eski FM muddat tugadi, yangisi soliq portalida aktivatsiya qilinmoqda.' },
    { serviceType: 'ONKM_ORNATISH', deviceName: 'Sunmi V2s Smart Kassa', status: 'YOLDA', notes: 'Mijoz manziliga yetkazib berish va o\'rgatish jarayonida.' },
    { serviceType: 'SERVIS', deviceName: 'Xprinter Chek Printer', status: 'QABUL_QILINDI', notes: 'Printer termo-boshi tozalanishi va pichoq sozlanishi kerak.' },
  ];

  for (let i = 0; i < 5; i++) {
    const taskNum = `TASK-2025-00${i + 1}`;
    const cust = customers[i];
    await prisma.installation.upsert({
      where: { taskNumber: taskNum },
      update: {},
      create: {
        taskNumber: taskNum,
        orderId: orders[i].id,
        customerId: cust.id,
        branchId: cust.branchId,
        technicianId: users['tech@onkm.uz'].id,
        serviceType: installTasks[i].serviceType,
        deviceName: installTasks[i].deviceName,
        serialNumber: `SN-DEV-${3000 + i}`,
        scheduledDate: new Date(),
        scheduledTime: '11:00',
        status: installTasks[i].status,
        notes: installTasks[i].notes,
      },
    });
  }
  console.log('✅ O\'rnatish vazifalari yaratildi (5 ta)');

  // 12. Support Tickets (10 tickets)
  const ticketIssues = [
    { cat: 'KKM', issue: 'Chek chop etishda xatolik: "Fiskal xotira to\'lgan" xabari chiqmoqda', priority: 'SHOSHILINCH', status: 'JARAYONDA' },
    { cat: 'OFD', issue: 'Cheklar OFD Soliq serveriga uzatilmayapti, Wi-Fi aloqasi yo\'qolgan', priority: 'YUQORI', status: 'YANGI' },
    { cat: 'TERMINAL', issue: 'HUMO karta to\'lovida "Aloqa xatosi 96" xatosi berib o\'tmayapti', priority: 'YUQORI', status: 'TEXNIKKA_BERILDI' },
    { cat: 'DASTUR', issue: 'Kassir yangi mahsulot shtrix kodini kiritish bo\'yicha tushunmayapti', priority: 'ODDIY', status: 'YECHILDI' },
    { cat: 'FISKAL_MODUL', issue: 'FM muddatini tekshirib berish so\'ralmoqda', priority: 'PAST', status: 'YOPILDI' },
    { cat: 'PRINTER', issue: 'Chek qog\'ozi tiqilib qolgan, pichoq orqaga qaytmayapti', priority: 'YUQORI', status: 'JARAYONDA' },
    { cat: 'SCANNER', issue: 'Asl Belgisi DataMatrix sigaret kodlarini skaner o\'qimayapti', priority: 'SHOSHILINCH', status: 'JARAYONDA' },
    { cat: 'CLICK', issue: 'Click QR to\'lov qabul qilinganda kassa avtomatik chek chiqarmadi', priority: 'ODDIY', status: 'YECHILDI' },
    { cat: 'POS', issue: 'Sensorli ekran bosilganda boshqa tugma bosilib ketyapti (kalibratsiya)', priority: 'ODDIY', status: 'TEXNIKKA_BERILDI' },
    { cat: 'INTERNET', issue: 'Kassa SIM-kartasi internet trafigi tugaganligi sababli oflayn qoldi', priority: 'ODDIY', status: 'YOPILDI' },
  ];

  for (let i = 1; i <= 10; i++) {
    const tNum = `TCK-2025-${String(200 + i).padStart(4, '0')}`;
    const cust = customers[i - 1];
    const item = ticketIssues[i - 1];
    const ticket = await prisma.supportTicket.upsert({
      where: { ticketNumber: tNum },
      update: {},
      create: {
        ticketNumber: tNum,
        customerId: cust.id,
        branchId: cust.branchId,
        deviceName: 'Kassa / POS qurilmasi',
        category: item.cat,
        issue: item.issue,
        priority: item.priority,
        status: item.status,
        assignedToId: users['support@onkm.uz'].id,
        technicianId: item.status === 'TEXNIKKA_BERILDI' ? users['tech@onkm.uz'].id : null,
      },
    });

    // Add first chat message
    await prisma.supportMessage.create({
      data: {
        ticketId: ticket.id,
        senderType: 'CUSTOMER',
        senderName: cust.contactPerson || cust.companyName,
        message: item.issue,
      },
    });
  }
  console.log('✅ Support ticketlar va xabarlar yaratildi (10 ta)');

  // 13. Customer Outlets, Contracts, Documents, Invoices, Services, Cases, Terminals, POS
  for (let i = 0; i < customers.length; i++) {
    const cust = customers[i];

    // Outlets (Savdo nuqtalari)
    await prisma.customerOutlet.createMany({
      data: [
        {
          customerId: cust.id,
          name: `${cust.tradeMark || cust.companyName} — Asosiy Do'kon`,
          address: cust.address,
          landmark: 'Markaziy chorraha yaqinida',
          phone: cust.phone,
          status: 'FAOL',
        },
        {
          customerId: cust.id,
          name: `${cust.tradeMark || cust.companyName} — Filial #2`,
          address: `${cust.address}, 2-bino`,
          landmark: 'Bozor hududi',
          phone: cust.phone,
          status: 'FAOL',
        },
      ],
    });

    // Contracts (Shartnomalar)
    const contractNum = `SH-2024-${String(500 + i).padStart(4, '0')}`;
    await prisma.customerContract.upsert({
      where: { contractNumber: contractNum },
      update: {},
      create: {
        customerId: cust.id,
        contractNumber: contractNum,
        contractType: 'ONKM va POS Servis Xizmati',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2025-01-15'),
        amount: 3600000,
        status: 'FAOL',
        notes: 'Yillik kafolatli texnik ko\'mak va OFD hisoboti',
      },
    });

    // Invoices (Hisob-fakturalar)
    const invNum = `INV-2025-${String(300 + i).padStart(4, '0')}`;
    await prisma.customerInvoice.upsert({
      where: { invoiceNumber: invNum },
      update: {},
      create: {
        customerId: cust.id,
        invoiceNumber: invNum,
        invoiceDate: new Date('2025-02-01'),
        amount: 2450000,
        vatAmount: 294000,
        status: 'TO\'LANGAN',
        notes: 'Aclas CRV-100 va fiskal modul o\'rnatish to\'lovi',
      },
    });

    // Terminals (Bank terminallari)
    const termSerial = `TERM-SN-${4000 + i}`;
    await prisma.customerTerminal.upsert({
      where: { serialNumber: termSerial },
      update: {},
      create: {
        customerId: cust.id,
        tid: `9980${2000 + i}`,
        mid: `100200${3000 + i}`,
        model: 'PAX D210 Simsiz Terminal',
        serialNumber: termSerial,
        bankName: cust.bank || 'Ipak Yo\'li Bank',
        paymentType: 'HUMO_UZCARD',
        status: 'FAOL',
      },
    });

    // POS Systems
    const posSerial = `POS-SN-${5000 + i}`;
    await prisma.customerPOS.upsert({
      where: { serialNumber: posSerial },
      update: {},
      create: {
        customerId: cust.id,
        modelName: 'PosBank Apex Pro 15.6" Sensor Monoblok',
        serialNumber: posSerial,
        osType: 'Windows 10 Pro',
        ramRom: '8GB RAM / 128GB SSD',
        softwareName: 'ONKM Retail v4.5 Savdo Dasturi',
        status: 'FAOL',
      },
    });

    // Cases (Keyslar)
    const caseNum = `CASE-2025-${String(100 + i).padStart(4, '0')}`;
    await prisma.customerCase.upsert({
      where: { caseNumber: caseNum },
      update: {},
      create: {
        customerId: cust.id,
        caseNumber: caseNum,
        title: 'Savdo nuqtasi uchun ikkinchi kassa liniyasini ochish',
        description: 'Mijoz 2-filiali uchun qo\'shimcha Aclas CRV-100 va shtrix kod skaner so\'radi.',
        priority: 'YUQORI',
        status: 'JARAYONDA',
        solution: 'Menejer Bobur Mirzayev tomonidan tijorat taklifi yuborildi.',
      },
    });
  }
  console.log('✅ Savdo nuqtalari, Shartnomalar, Hujjatlar, Fakturalar, Xizmatlar, Terminallar, POS va Keyslar yaratildi!');

  // 14. Audit Log (initial entries)
  await prisma.auditLog.create({
    data: {
      userId: users['admin@onkm.uz'].id,
      userName: users['admin@onkm.uz'].name,
      action: 'LOGIN',
      entity: 'System',
      entityId: 'SYSTEM_BOOT',
      newValue: 'ONKM Business System database initialized & seeded successfully with all sub-modules',
      ipAddress: '127.0.0.1',
    },
  });
  console.log('✅ Audit log yozildi');

  console.log('--- BARCHA DEMO MA\'LUMOTLAR MUVAFFAQIYATLI YUKLANDI! ---');
}

main()
  .catch((e) => {
    console.error('Seed Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

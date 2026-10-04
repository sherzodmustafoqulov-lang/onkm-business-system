import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Initial default services to seed if database is empty
const INITIAL_SERVICES = [
  {
    name: 'OFD Yillik Abonent Integratsiyasi',
    price: 480000,
    category: 'ABONENT',
    billingType: 'YILLIK',
    description: 'Soliq qo\'mitasi axborot tizimi bilan 24/7 sinxronizatsiya va ma\'lumotlar uzatish',
    isActive: true,
  },
  {
    name: '24/7 Tezkor Texnik Servis va Qo\'llab-quvvatlash',
    price: 150000,
    category: 'SERVIS',
    billingType: 'OYLIK',
    description: 'Kassa apparati nosoz bo\'lganda 1 soat ichida mutaxassis yetib kelishi va muammoni bartaraf etish',
    isActive: true,
  },
  {
    name: 'ONKM Dasturiy Yangilanish va Soliq Moslashtiruvi',
    price: 80000,
    category: 'DASTURIY',
    billingType: 'BIR_MARTALIK',
    description: 'Yangi soliq talablari, QQS stavkalari va MXIK kodlari bo\'yicha dasturiy ta\'minotni yangilash',
    isActive: true,
  },
  {
    name: 'Markirovka va 2D Skaner Integratsiya Xizmati',
    price: 120000,
    category: 'KONSULTATSIYA',
    billingType: 'BIR_MARTALIK',
    description: 'Asl Belgisi milliy axborot tizimi va 2D skanerlarni kassa apparatiga ulash va sozlash',
    isActive: true,
  },
  {
    name: 'Bulutli Zaxira Nusxalash (Cloud Backup) Xizmati',
    price: 60000,
    category: 'DASTURIY',
    billingType: 'OYLIK',
    description: 'Har kuni savdo va kassa ma\'lumotlarini xavfsiz bulut serveriga avtomatik nusxalash',
    isActive: true,
  },
  {
    name: 'KKM Kassa Apparati O\'rnatish & Fiskallashtirish',
    price: 250000,
    category: 'ORNATISH',
    billingType: 'BIR_MARTALIK',
    description: 'Yangi kassa apparatini savdo nuqtasiga o\'rnatish, tarmoqqa ulash va DSQ ro\'yxatidan o\'tkazish',
    isActive: true,
  },
  {
    name: 'Fiskal Modul Almashtirish & Qayta Ro\'yxatdan O\'tkazish',
    price: 300000,
    category: 'SERVIS',
    billingType: 'BIR_MARTALIK',
    description: 'Muddati tugagan yoki xotirasi to\'lgan fiskal modulni yangisiga almashtirish va ro\'yxatdan o\'tkazish',
    isActive: true,
  },
];

// GET: Fetch all services (All authenticated roles can view and use)
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Avtorizatsiyadan o\'tilmagan' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q') || '';
    const category = searchParams.get('category') || 'ALL';

    // Check count and seed if empty
    const count = await prisma.service.count();
    if (count === 0) {
      for (const s of INITIAL_SERVICES) {
        await prisma.service.create({
          data: {
            ...s,
            createdById: user.id,
          },
        });
      }
    }

    const whereCondition: any = {};
    if (search.trim()) {
      whereCondition.OR = [
        { name: { contains: search.trim() } },
        { description: { contains: search.trim() } },
      ];
    }
    if (category !== 'ALL') {
      whereCondition.category = category;
    }

    const services = await prisma.service.findMany({
      where: whereCondition,
      include: {
        createdBy: { select: { id: true, name: true, role: { select: { name: true, displayName: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const isAdmin = user.role === 'ADMIN';

    return NextResponse.json({
      success: true,
      services,
      isAdmin,
      userRole: user.role,
      userRoleName: user.roleDisplayName || user.role,
    });
  } catch (error: any) {
    console.error('Fetch services error:', error);
    return NextResponse.json(
      { error: error.message || 'Xizmatlar ro\'yxatini olishda xatolik yuz berdi' },
      { status: 500 }
    );
  }
}

// POST: Create a new service (Only ADMINISTRATOR can create)
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Avtorizatsiyadan o\'tilmagan' }, { status: 401 });
    }

    // Role-based access control: Only ADMIN can create services
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        {
          error: 'Ruxsat berilmagan! Yangi xizmat yaratish huquqi faqat Administratorga tegishli.',
          code: 'FORBIDDEN_NOT_ADMIN',
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      price,
      category = 'ABONENT',
      billingType = 'OYLIK',
      description,
      isActive = true,
    } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Xizmat nomi kiritilishi shart' },
        { status: 400 }
      );
    }

    const numericPrice = Number(price);
    if (isNaN(numericPrice) || numericPrice < 0) {
      return NextResponse.json(
        { error: 'Xizmat narxi to\'g\'ri formatda (0 yoki undan yuqori) kiritilishi shart' },
        { status: 400 }
      );
    }

    const newService = await prisma.service.create({
      data: {
        name: name.trim(),
        price: numericPrice,
        category: category || 'ABONENT',
        billingType: billingType || 'OYLIK',
        description: description?.trim() || null,
        isActive: Boolean(isActive),
        createdById: user.id,
      },
      include: {
        createdBy: { select: { id: true, name: true } },
      },
    });

    // Write audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          userName: user.name,
          action: 'CREATE_SERVICE',
          entity: 'Service',
          entityId: newService.id,
          newValue: `Yangi xizmat: ${newService.name} (${newService.price.toLocaleString()} so'm, ${newService.category})`,
        },
      });
    } catch (e) {}

    return NextResponse.json({
      success: true,
      service: newService,
      message: 'Yangi xizmat muvaffaqiyatli yaratildi',
    });
  } catch (error: any) {
    console.error('Create service error:', error);
    return NextResponse.json(
      { error: error.message || 'Xizmat yaratishda xatolik yuz berdi' },
      { status: 500 }
    );
  }
}

// PUT: Update an existing service (Only ADMINISTRATOR can update)
export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Avtorizatsiyadan o\'tilmagan' }, { status: 401 });
    }

    // Role-based access control: Only ADMIN can edit services
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        {
          error: 'Ruxsat berilmagan! Xizmatni tahrirlash huquqi faqat Administratorga tegishli.',
          code: 'FORBIDDEN_NOT_ADMIN',
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      id,
      name,
      price,
      category,
      billingType,
      description,
      isActive,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Xizmat IDsi ko\'rsatilmadi' }, { status: 400 });
    }

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Xizmat nomi bo\'sh bo\'lishi mumkin emas' }, { status: 400 });
    }

    const numericPrice = Number(price);
    if (isNaN(numericPrice) || numericPrice < 0) {
      return NextResponse.json({ error: 'Xizmat narxi noto\'g\'ri kiritildi' }, { status: 400 });
    }

    const updatedService = await prisma.service.update({
      where: { id },
      data: {
        name: name.trim(),
        price: numericPrice,
        category: category !== undefined ? category : undefined,
        billingType: billingType !== undefined ? billingType : undefined,
        description: description !== undefined ? description.trim() : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
      },
      include: {
        createdBy: { select: { id: true, name: true } },
      },
    });

    // Write audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          userName: user.name,
          action: 'UPDATE_SERVICE',
          entity: 'Service',
          entityId: updatedService.id,
          newValue: `Xizmat tahrirlandi: ${updatedService.name} (${updatedService.price.toLocaleString()} so'm)`,
        },
      });
    } catch (e) {}

    return NextResponse.json({
      success: true,
      service: updatedService,
      message: 'Xizmat ma\'lumotlari muvaffaqiyatli yangilandi',
    });
  } catch (error: any) {
    console.error('Update service error:', error);
    return NextResponse.json(
      { error: error.message || 'Xizmatni yangilashda xatolik yuz berdi' },
      { status: 500 }
    );
  }
}

// DELETE: Delete a service (Only ADMINISTRATOR can delete)
export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Avtorizatsiyadan o\'tilmagan' }, { status: 401 });
    }

    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        {
          error: 'Ruxsat berilmagan! Xizmatni o\'chirish huquqi faqat Administratorga tegishli.',
          code: 'FORBIDDEN_NOT_ADMIN',
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('id');

    if (!serviceId) {
      return NextResponse.json({ error: 'Xizmat IDsi ko\'rsatilmadi' }, { status: 400 });
    }

    const deleted = await prisma.service.delete({
      where: { id: serviceId },
    });

    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          userName: user.name,
          action: 'DELETE_SERVICE',
          entity: 'Service',
          entityId: serviceId,
          newValue: `Xizmat o'chirildi: ${deleted.name}`,
        },
      });
    } catch (e) {}

    return NextResponse.json({
      success: true,
      message: 'Xizmat muvaffaqiyatli o\'chirildi',
    });
  } catch (error: any) {
    console.error('Delete service error:', error);
    return NextResponse.json(
      { error: error.message || 'Xizmatni o\'chirishda xatolik yuz berdi' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET: Fetch available ONKM serials and Fiscal Modules to choose from
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Avtorizatsiyadan o\'tilmagan' }, { status: 401 });
    }

    const customerId = params.id;

    // Available or OMBORDA ONKM serials
    const availableSerials = await prisma.productSerial.findMany({
      where: {
        OR: [
          { customerId: null },
          { status: 'OMBORDA' },
        ],
      },
      include: {
        product: { select: { id: true, name: true, model: true } },
        branch: { select: { id: true, name: true } },
      },
      orderBy: { serialNumber: 'asc' },
    });

    // Available or OMBORDA Fiscal Modules
    const availableFiscalModules = await prisma.fiscalModule.findMany({
      where: {
        OR: [
          { customerId: null },
          { status: 'OMBORDA' },
        ],
      },
      include: {
        branch: { select: { id: true, name: true } },
      },
      orderBy: { serialNumber: 'asc' },
      take: 50,
    });

    // Customer outlets to attach to
    const outlets = await prisma.customerOutlet.findMany({
      where: { customerId },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      success: true,
      availableSerials,
      availableFiscalModules,
      outlets,
    });
  } catch (error: any) {
    console.error('Fetch available devices error:', error);
    return NextResponse.json(
      { error: error.message || 'Qurilmalar ro\'yxatini olishda xatolik' },
      { status: 500 }
    );
  }
}

// POST: Attach device and FM to customer and outlet
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Avtorizatsiyadan o\'tilmagan' }, { status: 401 });
    }

    const customerId = params.id;
    const body = await request.json();

    const {
      onkmSerialId, // ID of selected existing ProductSerial
      customOnkmSerial, // If user typed a new serial
      productName = 'ONKM Smart Kassa',
      fmModuleId, // ID of selected existing FiscalModule
      customFmSerial, // If user typed a new FM serial
      outletName, // Selected outlet name or string
      userName, // Biriktirgan foydalanuvchi / static user nomi
      installedAt,
      warrantyMonths = 12,
      notes,
    } = body;

    const installDate = installedAt ? new Date(installedAt) : new Date();
    const warrantyEnd = new Date(installDate);
    warrantyEnd.setMonth(warrantyEnd.getMonth() + Number(warrantyMonths));

    const attachedUser = userName?.trim() || user.name || 'Admin';
    const outletNote = outletName ? `Savdo nuqtasi: ${outletName}` : '';
    const userNote = `Biriktirdi: ${attachedUser}`;
    const fullNotes = [outletNote, userNote, notes].filter(Boolean).join(' | ');

    let linkedKkmSerial = '';

    // 1. Process ONKM Serial attachment
    if (onkmSerialId) {
      const serial = await prisma.productSerial.update({
        where: { id: onkmSerialId },
        data: {
          customerId,
          status: "O'RNATILDI",
          installedAt: installDate,
          warrantyEndDate: warrantyEnd,
          notes: fullNotes,
        },
      });
      linkedKkmSerial = serial.serialNumber;

      // History
      try {
        await prisma.productSerialHistory.create({
          data: {
            productSerialId: serial.id,
            fromStatus: 'OMBORDA',
            toStatus: "O'RNATILDI",
            action: 'ORNATILDI',
            userName: attachedUser,
            notes: `Savdo nuqtasi: ${outletName || 'Asosiy'}`,
          },
        });
      } catch (hErr) {}
    } else if (customOnkmSerial?.trim()) {
      // Find default product or first product
      let product = await prisma.product.findFirst();
      let branch = await prisma.branch.findFirst();

      if (product && branch) {
        const serial = await prisma.productSerial.upsert({
          where: { serialNumber: customOnkmSerial.trim() },
          update: {
            customerId,
            status: "O'RNATILDI",
            installedAt: installDate,
            warrantyEndDate: warrantyEnd,
            notes: fullNotes,
          },
          create: {
            serialNumber: customOnkmSerial.trim(),
            productId: product.id,
            branchId: branch.id,
            customerId,
            status: "O'RNATILDI",
            installedAt: installDate,
            warrantyEndDate: warrantyEnd,
            notes: fullNotes,
          },
        });
        linkedKkmSerial = serial.serialNumber;

        try {
          await prisma.productSerialHistory.create({
            data: {
              productSerialId: serial.id,
              fromStatus: 'OMBORDA',
              toStatus: "O'RNATILDI",
              action: 'ORNATILDI',
              userName: attachedUser,
              notes: `Savdo nuqtasi: ${outletName || 'Asosiy'}`,
            },
          });
        } catch (hErr) {}
      }
    }

    // 2. Process Fiscal Module attachment
    if (fmModuleId) {
      const fm = await prisma.fiscalModule.update({
        where: { id: fmModuleId },
        data: {
          customerId,
          status: 'FAOL',
          registeredAt: installDate,
          warrantyEndDate: warrantyEnd,
          kkmSerialNumber: linkedKkmSerial || undefined,
          notes: fullNotes,
        },
      });

      try {
        await prisma.fiscalModuleHistory.create({
          data: {
            fiscalModuleId: fm.id,
            fromLocation: 'Ombor',
            toLocation: outletName || 'Mijoz filiali',
            action: 'ORNATILDI',
            userId: user.id,
            notes: `Biriktirdi: ${attachedUser}`,
          },
        });
      } catch (hErr) {}
    } else if (customFmSerial?.trim()) {
      let branch = await prisma.branch.findFirst();
      if (branch) {
        const fm = await prisma.fiscalModule.upsert({
          where: { serialNumber: customFmSerial.trim() },
          update: {
            customerId,
            status: 'FAOL',
            registeredAt: installDate,
            warrantyEndDate: warrantyEnd,
            kkmSerialNumber: linkedKkmSerial || undefined,
            notes: fullNotes,
          },
          create: {
            serialNumber: customFmSerial.trim(),
            branchId: branch.id,
            customerId,
            status: 'FAOL',
            registeredAt: installDate,
            warrantyEndDate: warrantyEnd,
            kkmSerialNumber: linkedKkmSerial || undefined,
            notes: fullNotes,
          },
        });

        try {
          await prisma.fiscalModuleHistory.create({
            data: {
              fiscalModuleId: fm.id,
              fromLocation: 'Ombor',
              toLocation: outletName || 'Mijoz filiali',
              action: 'ORNATILDI',
              userId: user.id,
              notes: `Biriktirdi: ${attachedUser}`,
            },
          });
        } catch (hErr) {}
      }
    }

    // Write audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          userName: attachedUser,
          action: 'ATTACH_DEVICE',
          entity: 'Customer',
          entityId: customerId,
          newValue: `Qurilma biriktirildi: KKM (${linkedKkmSerial || '—'}), FM (${fmModuleId || customFmSerial || '—'}) [${outletName || 'Asosiy nuqta'}] — Mas'ul: ${attachedUser}`,
        },
      });
    } catch (e) {}

    return NextResponse.json({
      success: true,
      message: 'Qurilma va Fiskal modul savdo nuqtasiga muvaffaqiyatli biriktirildi',
    });
  } catch (error: any) {
    console.error('Attach device error:', error);
    return NextResponse.json(
      { error: error.message || 'Qurilmani biriktirishda xatolik yuz berdi' },
      { status: 500 }
    );
  }
}

// PUT: Update an existing ONKM or FM device
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Avtorizatsiyadan o\'tilmagan' }, { status: 401 });
    }

    const customerId = params.id;
    const body = await request.json();

    const {
      deviceType, // 'ONKM' | 'FM'
      id, // ProductSerial.id or FiscalModule.id
      serialNumber,
      kkmSerialNumber, // for FM
      outletName,
      userName,
      status,
      installedAt,
      registeredAt, // for FM
      warrantyEndDate,
      customNotes,
    } = body;

    if (!id || !deviceType) {
      return NextResponse.json(
        { error: 'Qurilma IDsi yoki turi ko\'rsatilmadi' },
        { status: 400 }
      );
    }

    const outletPart = outletName ? `Savdo nuqtasi: ${outletName.trim()}` : '';
    const userPart = userName ? `Biriktirdi: ${userName.trim()}` : '';
    const fullNotes = [outletPart, userPart, customNotes?.trim()].filter(Boolean).join(' | ');

    if (deviceType === 'ONKM') {
      const updatedSerial = await prisma.productSerial.update({
        where: { id },
        data: {
          serialNumber: serialNumber ? serialNumber.trim() : undefined,
          status: status || undefined,
          installedAt: installedAt ? new Date(installedAt) : undefined,
          warrantyEndDate: warrantyEndDate ? new Date(warrantyEndDate) : undefined,
          notes: fullNotes || undefined,
        },
      });

      try {
        await prisma.productSerialHistory.create({
          data: {
            productSerialId: updatedSerial.id,
            fromStatus: updatedSerial.status,
            toStatus: status || updatedSerial.status,
            action: 'TAHRIRLANDI',
            userName: userName || user.name,
            notes: `Qurilma tahrirlandi: ${outletName || ''}`,
          },
        });
      } catch (hErr) {}

      try {
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            userName: user.name,
            action: 'UPDATE_DEVICE',
            entity: 'Customer',
            entityId: customerId,
            newValue: `ONKM seriya tahrirlandi: ${updatedSerial.serialNumber} (${status})`,
          },
        });
      } catch (e) {}

      return NextResponse.json({
        success: true,
        message: 'ONKM qurilmasi ma\'lumotlari muvaffaqiyatli yangilandi',
        device: updatedSerial,
      });
    } else {
      // FM (Fiscal Module)
      const updatedFm = await prisma.fiscalModule.update({
        where: { id },
        data: {
          serialNumber: serialNumber ? serialNumber.trim() : undefined,
          kkmSerialNumber: kkmSerialNumber ? kkmSerialNumber.trim() : undefined,
          status: status || undefined,
          registeredAt: registeredAt ? new Date(registeredAt) : undefined,
          warrantyEndDate: warrantyEndDate ? new Date(warrantyEndDate) : undefined,
          notes: fullNotes || undefined,
        },
      });

      try {
        await prisma.fiscalModuleHistory.create({
          data: {
            fiscalModuleId: updatedFm.id,
            fromLocation: 'MIJOZ',
            toLocation: 'MIJOZ',
            action: 'TAHRIRLANDI',
            userId: user.id,
            notes: `FM tahrirlandi: ${outletName || ''}`,
          },
        });
      } catch (hErr) {}

      try {
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            userName: user.name,
            action: 'UPDATE_FM',
            entity: 'Customer',
            entityId: customerId,
            newValue: `Fiskal modul tahrirlandi: ${updatedFm.serialNumber} (${status})`,
          },
        });
      } catch (e) {}

      return NextResponse.json({
        success: true,
        message: 'Fiskal modul ma\'lumotlari muvaffaqiyatli yangilandi',
        device: updatedFm,
      });
    }
  } catch (error: any) {
    console.error('Update device error:', error);
    return NextResponse.json(
      { error: error.message || 'Qurilmani yangilashda xatolik yuz berdi' },
      { status: 500 }
    );
  }
}

// DELETE: Detach device from customer (return to OMBORDA)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Avtorizatsiyadan o\'tilmagan' }, { status: 401 });
    }

    const customerId = params.id;
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('deviceId');
    const deviceType = searchParams.get('type') || 'ONKM';

    if (!deviceId) {
      return NextResponse.json({ error: 'Qurilma IDsi ko\'rsatilmadi' }, { status: 400 });
    }

    if (deviceType === 'ONKM') {
      await prisma.productSerial.update({
        where: { id: deviceId },
        data: {
          customerId: null,
          status: 'OMBORDA',
        },
      });
    } else {
      await prisma.fiscalModule.update({
        where: { id: deviceId },
        data: {
          customerId: null,
          status: 'OMBORDA',
          kkmSerialNumber: null,
        },
      });
    }

    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          userName: user.name,
          action: 'DETACH_DEVICE',
          entity: 'Customer',
          entityId: customerId,
          newValue: `Qurilma mijozdan ajratildi (ID: ${deviceId}, Tur: ${deviceType})`,
        },
      });
    } catch (e) {}

    return NextResponse.json({
      success: true,
      message: 'Qurilma mijozdan muvaffaqiyatli ajratildi',
    });
  } catch (error: any) {
    console.error('Detach device error:', error);
    return NextResponse.json(
      { error: error.message || 'Qurilmani ajratishda xatolik yuz berdi' },
      { status: 500 }
    );
  }
}


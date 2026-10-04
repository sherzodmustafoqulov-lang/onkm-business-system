import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/customers/[id]/services: List linked services, available catalog, outlets, balance
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
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        companyName: true,
        balance: true,
        debt: true,
        services: {
          orderBy: { createdAt: 'desc' },
        },
        outlets: {
          where: { status: 'FAOL' },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Mijoz topilmadi' }, { status: 404 });
    }

    // Get active services from catalog
    const catalogServices = await prisma.service.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });

    return NextResponse.json({
      success: true,
      services: customer.services,
      catalog: catalogServices,
      outlets: customer.outlets,
      balance: customer.balance || 0,
      debt: customer.debt || 0,
    });
  } catch (error: any) {
    console.error('Fetch customer services error:', error);
    return NextResponse.json(
      { error: error.message || 'Xizmatlarni yuklashda xatolik' },
      { status: 500 }
    );
  }
}

// POST /api/customers/[id]/services: Add/assign service to customer & outlet, deduct price from balance
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
      serviceId,
      outletId,
      customServiceName,
      customPrice,
      startDate,
      notes,
    } = body;

    // Fetch customer
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: { outlets: true },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Mijoz topilmadi' }, { status: 404 });
    }

    // Determine service details
    let finalServiceName = '';
    let finalServiceType = 'ABONENT';
    let finalPrice = 0;
    let selectedService = null;

    if (serviceId) {
      selectedService = await prisma.service.findUnique({
        where: { id: serviceId },
      });
      if (selectedService) {
        finalServiceName = selectedService.name;
        finalServiceType = selectedService.category || 'ABONENT';
        finalPrice = selectedService.price;
      }
    }

    // Fallback or custom service name
    if (!finalServiceName && customServiceName?.trim()) {
      finalServiceName = customServiceName.trim();
      finalPrice = Number(customPrice) || 0;
    }

    if (!finalServiceName) {
      return NextResponse.json(
        { error: 'Xizmat turi tanlanishi yoki nomi kiritilishi shart' },
        { status: 400 }
      );
    }

    // Determine outlet details
    let finalOutletName = 'Barcha savdo nuqtalari uchun';
    let finalOutletId: string | null = null;

    if (outletId && outletId !== 'ALL') {
      const outlet = customer.outlets.find((o) => o.id === outletId);
      if (outlet) {
        finalOutletId = outlet.id;
        finalOutletName = outlet.name;
      }
    } else if (customer.outlets.length > 0) {
      finalOutletId = customer.outlets[0].id;
      finalOutletName = customer.outlets[0].name;
    }

    // Balance & Debt deduction calculation
    const currentBalance = customer.balance || 0;
    const currentDebt = customer.debt || 0;

    let newBalance = currentBalance;
    let newDebt = currentDebt;

    if (finalPrice > 0) {
      if (currentBalance >= finalPrice) {
        // Full price covered by balance
        newBalance = currentBalance - finalPrice;
      } else {
        // Partial or no balance: balance becomes 0 and remainder goes to debt
        const shortfall = finalPrice - currentBalance;
        newBalance = 0;
        newDebt = currentDebt + shortfall;
      }
    }

    // Generate unique payment receipt number for this service charge
    const receiptNumber = `XIZ-${Date.now().toString().slice(-6)}`;

    // Execute in transaction: create service link, update customer balance/debt, and record payment/charge
    const [serviceLink, updatedCustomer] = await prisma.$transaction([
      prisma.customerServiceLink.create({
        data: {
          customerId,
          serviceId: selectedService?.id || null,
          serviceName: finalServiceName,
          serviceType: finalServiceType,
          price: finalPrice,
          monthlyFee: selectedService?.billingType === 'OYLIK' ? finalPrice : 0,
          outletId: finalOutletId,
          outletName: finalOutletName,
          startDate: startDate ? new Date(startDate) : new Date(),
          status: 'FAOL',
          notes: notes?.trim() || null,
          createdByName: `${user.name} (${user.role})`,
        },
      }),
      prisma.customer.update({
        where: { id: customerId },
        data: {
          balance: newBalance,
          debt: newDebt,
        },
      }),
      prisma.payment.create({
        data: {
          customerId,
          paymentNumber: receiptNumber,
          amount: finalPrice,
          method: 'BALANSDAN_YECHILDI',
          status: "TO'LIQ_TO'LANGAN",
          receivedById: user.id,
          paidAt: startDate ? new Date(startDate) : new Date(),
          notes: `Xizmat haqi: "${finalServiceName}" (${finalOutletName})`,
        },
      }),
    ]);

    // Create Audit Log
    try {
      const priceFormatted = new Intl.NumberFormat('uz-UZ').format(finalPrice);
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          userName: user.name,
          action: 'ASSIGN_SERVICE',
          entity: 'Customer',
          entityId: customerId,
          newValue: `"${finalServiceName}" xizmati (${priceFormatted} so'm) "${finalOutletName}" filialiga biriktirildi. Balansdan yechildi (Qoldiq balans: ${new Intl.NumberFormat('uz-UZ').format(newBalance)} so'm, Qarz: ${new Intl.NumberFormat('uz-UZ').format(newDebt)} so'm)`,
        },
      });
    } catch (e) {
      console.warn('Audit log write error:', e);
    }

    return NextResponse.json({
      success: true,
      service: serviceLink,
      balance: updatedCustomer.balance,
      debt: updatedCustomer.debt,
      message: `"${finalServiceName}" xizmati muvaffaqiyatli biriktirildi va ${new Intl.NumberFormat('uz-UZ').format(finalPrice)} so'm balansdan yechildi!`,
    });
  } catch (error: any) {
    console.error('Assign customer service error:', error);
    return NextResponse.json(
      { error: error.message || 'Xizmatni biriktirishda xatolik yuz berdi' },
      { status: 500 }
    );
  }
}

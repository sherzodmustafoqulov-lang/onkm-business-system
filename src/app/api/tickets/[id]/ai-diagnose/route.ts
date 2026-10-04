import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { id: string };
}

// POST /api/tickets/[id]/ai-diagnose: Aggregates full 360° context & generates AI diagnostic suggestions
export async function POST(request: Request, { params }: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Avtorizatsiyadan o\'tilmagan' }, { status: 401 });
    }

    const { id } = params;

    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      include: {
        customer: true,
        branch: true,
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Chipta topilmadi' }, { status: 404 });
    }

    // 1. Gather historical context for AI inference
    const [devices, pastTickets, installations] = await Promise.all([
      prisma.productSerial.findMany({
        where: { customerId: ticket.customerId },
        include: { product: true },
      }),
      prisma.supportTicket.findMany({
        where: {
          customerId: ticket.customerId,
          id: { not: ticket.id },
          solution: { not: null },
        },
        take: 5,
        select: { category: true, issue: true, solution: true },
      }),
      prisma.installation.findMany({
        where: { customerId: ticket.customerId },
        take: 3,
        select: { deviceName: true, serviceType: true, completionNotes: true, completedAt: true },
      }),
    ]);

    // 2. Structured Knowledge Engine (Domain Knowledge for Uzbekistan Fiscal/POS systems)
    let aiDiagnosis = '';
    let suggestedAction = '';
    const issueLower = (ticket.issue + ' ' + (ticket.deviceName || '')).toLowerCase();
    const cat = ticket.category;

    if (cat === 'OFD' || issueLower.includes('ofd') || issueLower.includes('soliq') || issueLower.includes('chek bormayapti')) {
      aiDiagnosis = `🔍 [AI Tahlil: OFD & Soliq Serveri Aloqasi]
- Ehtimoliy sabab: Kassa apparatining Soliq Qo'mitasi (OFD) serveriga ulanish muddati (72 soatlik chek to'planishi) o'tgan yoki internet provayder porti yopiq.
- Qurilma holati: ${ticket.deviceName} (${ticket.serialNumber || 'Seriya ko\'rsatilmagan'}).
- Filial: ${ticket.branch?.name}.`;
      suggestedAction = `1. Kassada "Z-hisobot" yopilganligini tekshiring.
2. Kassani tarmoq kabeli (Ethernet) yoki SIM-karta balansini tekshirib qayta yoqing.
3. Soliq portalida (my.soliq.uz) abonent to'lovi muddati faolligini tasdiqlang.`;
    } else if (cat === 'Fiskal modul' || issueLower.includes('fm') || issueLower.includes('fiskal')) {
      aiDiagnosis = `🔍 [AI Tahlil: Fiskal Modul (FM) Diagnostikasi]
- Ehtimoliy sabab: Fiskal modulning 1 yillik amal qilish muddati tugagan yoki xotira bloki to'lgan.
- Mijozning oldingi o'rnatish sanasi: ${installations[0]?.completedAt ? new Date(installations[0].completedAt).toLocaleDateString('uz') : 'Yozuv yo\'q'}.`;
      suggestedAction = `1. Yangi Fiskal Modul V2 rezerv qiling.
2. Servis texnikiga "FM_ALMASHTIRISH" topshirig'ini yo'naltiring.
3. Yangi modul soliq tizimida ro'yxatdan o'tkazilishi shart.`;
    } else if (cat === 'Printer' || issueLower.includes('printer') || issueLower.includes('lent') || issueLower.includes('qog\'oz')) {
      aiDiagnosis = `🔍 [AI Tahlil: Chek Printer / Mexanik Nosozlik]
- Ehtimoliy sabab: Termo-qog'oz lentasi noto'g'ri o'rnatilgan, sensor changlangan yoki pichoq mexanizmi tiqilib qolgan.`;
      suggestedAction = `1. Mijozga qog'oz lentasini tekis o'rnatishni va qopqoqni qattiq yopishni maslahat bering.
2. FEED tugmasini bosib test chekini chiqarishni so'rang.
3. Agar pichoq ochilmasa, apparat tagidagi mexanik sozlagichni burash kerak.`;
    } else if (cat === 'Click' || cat === 'Payme' || cat === 'HUMO' || cat === 'Terminal') {
      aiDiagnosis = `🔍 [AI Tahlil: To'lov Tizimlari & Bank Integratsiyasi]
- Ehtimoliy sabab: Terminal bank xosti bilan aloqani yo'qotgan (SSL/TLS cert muddati yoki SIM-karta trafigi).`;
      suggestedAction = `1. Terminalda "Sверка итогов" (Kun yakuni) amalini bajaring.
2. Terminalni o'chirib 30 soniyadan so'ng qayta yoqing.
3. Bank protsessing markazi (Humo/Uzcard) serveri holatini tekshiring.`;
    } else {
      aiDiagnosis = `🔍 [AI Tahlil: Tizimli Diagnostika (${cat})]
- Murojaat tahlil qilindi: "${ticket.issue}"
- Mijoz tarixi: Jami ${pastTickets.length} ta oldingi murojaatlar ko'rib chiqildi.
- Qurilmalar zaxirasi: ${devices.map((d) => d.product?.name).join(', ') || 'Faol uskunalar'}.`;
      suggestedAction = `1. Qurilma quvvat va internet kabelini tekshirish.
2. Kassa dasturini qayta ishga tushirish (Restart).
3. Zarurat bo'lsa, servis texnikini joyiga yuborish.`;
    }

    const fullAiOutput = `${aiDiagnosis}\n\n💡 [Tavsiya etilgan harakatlar]:\n${suggestedAction}`;

    // 3. Save AI Diagnosis on ticket
    await prisma.supportTicket.update({
      where: { id },
      data: {
        aiDiagnosis: fullAiOutput,
      },
    });

    // 4. Return structured JSON payload (ready for external LLM inference or Telegram Bot)
    return NextResponse.json({
      success: true,
      aiDiagnosis: fullAiOutput,
      contextPayload: {
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
        category: ticket.category,
        issue: ticket.issue,
        customerName: ticket.customer.companyName,
        customerInn: ticket.customer.inn,
        devicesCount: devices.length,
        pastTicketsCount: pastTickets.length,
        installationsCount: installations.length,
        aiDiagnosis: fullAiOutput,
      },
    });
  } catch (error: any) {
    console.error('POST /api/tickets/[id]/ai-diagnose error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

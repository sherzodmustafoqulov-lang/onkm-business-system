import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const DEFAULT_STAGES = [
  {
    id: 'MIJOZ_TOLANMAGAN',
    name: 'Мижоз To\'lanmagan',
    color: '#00a2e8',
    accentColor: '#008ecc',
    order: 0,
  },
  {
    id: 'POSTUPLENIE_TOLANDI',
    name: 'Поступление To\'landi',
    color: '#17c0e8',
    accentColor: '#11a9cd',
    order: 1,
  },
  {
    id: 'OFD_REGISTRATSIYA',
    name: 'OFD registratsiya (ФМ тўланди)',
    color: '#22c55e',
    accentColor: '#16a34a',
    order: 2,
  },
  {
    id: 'ICHKI_RESTOR',
    name: 'ICHKI RESTOR',
    color: '#00c0f0',
    accentColor: '#00a6d1',
    order: 3,
  },
  {
    id: 'PODGOTOVKA',
    name: 'Подготовка (Shuxrat)',
    color: '#2dd4bf',
    accentColor: '#14b8a6',
    order: 4,
  },
  {
    id: 'DOSTAVKA_YAKUNLANDI',
    name: 'Доставка OFD o\'zimizga qaytarish',
    color: '#84cc16',
    accentColor: '#65a30d',
    order: 5,
  },
];

// GET /api/orders/stages: Fetch pipeline stage definitions (seeded if not present)
export async function GET() {
  try {
    let stages = await prisma.pipelineStageConfig.findMany({
      orderBy: { order: 'asc' },
    });

    if (stages.length === 0) {
      // Seed default stages
      for (const def of DEFAULT_STAGES) {
        await prisma.pipelineStageConfig.create({
          data: def,
        });
      }
      stages = await prisma.pipelineStageConfig.findMany({
        orderBy: { order: 'asc' },
      });
    }

    return NextResponse.json({ stages });
  } catch (error: any) {
    console.error('GET /api/orders/stages error:', error);
    return NextResponse.json(
      { error: 'Bosqichlarni yuklashda xatolik: ' + error.message, stages: DEFAULT_STAGES },
      { status: 500 }
    );
  }
}

// PATCH /api/orders/stages: Rename or update a stage
export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Avtorizatsiyadan o\'tilmagan' }, { status: 401 });
    }

    const body = await request.json();
    const { stageId, name, color, accentColor } = body;

    if (!stageId) {
      return NextResponse.json({ error: 'stageId ko\'rsatilmagan' }, { status: 400 });
    }

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Status nomi bo\'sh bo\'lishi mumkin emas' }, { status: 400 });
    }

    const trimmedName = name.trim();

    // Find default config if creating
    const defaultDef = DEFAULT_STAGES.find((s) => s.id === stageId);

    const updated = await prisma.pipelineStageConfig.upsert({
      where: { id: stageId },
      update: {
        name: trimmedName,
        ...(color ? { color } : {}),
        ...(accentColor ? { accentColor } : {}),
      },
      create: {
        id: stageId,
        name: trimmedName,
        color: color || defaultDef?.color || '#00a2e8',
        accentColor: accentColor || defaultDef?.accentColor || '#008ecc',
        order: defaultDef?.order ?? 0,
      },
    });

    return NextResponse.json({ success: true, stage: updated });
  } catch (error: any) {
    console.error('PATCH /api/orders/stages error:', error);
    return NextResponse.json(
      { error: 'Status nomini saqlashda xatolik: ' + error.message },
      { status: 500 }
    );
  }
}

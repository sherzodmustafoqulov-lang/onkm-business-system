import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { processAiQuery } from '@/lib/ai/aiEngine';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Ruxsat berilmagan (Unauthorized)' }, { status: 401 });
    }

    const body = await req.json();
    const { message, history } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Xabar matni kiritilmadi' }, { status: 400 });
    }

    const aiResult = await processAiQuery(user, message, history || []);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        roleDisplayName: user.roleDisplayName,
      },
      ...aiResult,
    });
  } catch (error: any) {
    console.error('AI chat endpoint error:', error);
    return NextResponse.json(
      { error: 'AI so\'rovini qayta ishlashda xatolik yuz berdi', details: error?.message },
      { status: 500 }
    );
  }
}

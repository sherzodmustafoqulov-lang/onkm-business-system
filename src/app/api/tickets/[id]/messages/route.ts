import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { id: string };
}

// POST /api/tickets/[id]/messages: Send chat message inside ticket
export async function POST(request: Request, { params }: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Avtorizatsiyadan o\'tilmagan' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { message, attachmentUrl, senderType = 'USER', targetStatus } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Xabar matni bo\'sh bo\'lishi mumkin emas' }, { status: 400 });
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      include: { customer: true },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Chipta topilmadi' }, { status: 404 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Message
      const newMsg = await tx.supportMessage.create({
        data: {
          ticketId: id,
          senderType,
          senderId: user.id,
          senderName: user.name,
          message: message.trim(),
          attachmentUrl: attachmentUrl || null,
        },
      });

      // 2. Adjust ticket status if needed
      let nextStatus = ticket.status;
      if (targetStatus) {
        nextStatus = targetStatus;
      } else if (ticket.status === 'YANGI') {
        nextStatus = 'JARAYONDA';
      }

      await tx.supportTicket.update({
        where: { id },
        data: {
          status: nextStatus,
          updatedAt: new Date(),
        },
      });

      return newMsg;
    });

    return NextResponse.json({
      success: true,
      message: result,
    }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/tickets/[id]/messages error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { checkPermission } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { id: string };
}

// POST /api/orders/[id]/flow: State machine & Action workflow with ACID DB transactions
export async function POST(request: Request, { params }: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Avtorizatsiyadan o\'tilmagan' }, { status: 401 });
    }

    if (!checkPermission(user.role, user.permissions, 'SALES', 'canEdit')) {
      return NextResponse.json({ error: 'Buyurtma holatini o\'zgartirish huquqi yo\'q' }, { status: 403 });
    }

    const { id } = params;
    const body = await request.json();
    const { action, note, targetStatus, targetPipelineStage } = body;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        branch: true,
        items: {
          include: {
            product: true,
          },
        },
        installations: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Buyurtma topilmadi' }, { status: 404 });
    }

    const result = await prisma.$transaction(async (tx) => {
      let updatedStatus = order.status;
      let updatedPipeline = order.pipelineStage;
      let actionLog = '';

      switch (action) {
        case 'MOVE_TO_PROPOSAL': {
          updatedPipeline = 'TAKLIF';
          actionLog = 'Buyurtma tijoriy taklif bosqichiga o\'tkazildi';
          break;
        }

        case 'CONFIRM': {
          // Confirm order and auto-reserve stock
          updatedStatus = 'TASDIQLANGAN';
          updatedPipeline = 'BUYURTMA';

          // Reserve stock for items
          for (const item of order.items) {
            const stock = await tx.warehouseStock.findUnique({
              where: {
                productId_branchId: {
                  productId: item.productId,
                  branchId: order.branchId,
                },
              },
            });

            const available = (stock?.quantity || 0) - (stock?.reserved || 0);
            if (available < item.quantity) {
              throw new Error(
                `"${item.product.name}" uchun omborda yetarli qoldiq yo'q! (Mavjud: ${available}, Talab: ${item.quantity})`
              );
            }

            await tx.warehouseStock.upsert({
              where: {
                productId_branchId: {
                  productId: item.productId,
                  branchId: order.branchId,
                },
              },
              create: {
                productId: item.productId,
                branchId: order.branchId,
                quantity: 0,
                reserved: item.quantity,
              },
              update: {
                reserved: { increment: item.quantity },
              },
            });

            await tx.stockMovement.create({
              data: {
                productId: item.productId,
                branchId: order.branchId,
                movementType: 'REZERV',
                quantity: item.quantity,
                price: item.unitPrice,
                docNumber: order.orderNumber,
                reason: `Buyurtma ${order.orderNumber} tasdiqlanishi munosabati bilan rezerv qilindi`,
                userName: user.name,
              },
            });
          }

          // If was lead or proposal, update customer debt
          if (order.pipelineStage === 'LEAD' || order.pipelineStage === 'TAKLIF') {
            await tx.customer.update({
              where: { id: order.customerId },
              data: { debt: { increment: order.finalAmount } },
            });
          }

          actionLog = `Buyurtma ${order.orderNumber} tasdiqlandi va ombordan rezerv qilindi`;
          break;
        }

        case 'RESERVE': {
          updatedStatus = 'REZERV';
          updatedPipeline = 'REZERV';

          // Check if already reserved in stock movements
          const alreadyReserved = await tx.stockMovement.findFirst({
            where: {
              docNumber: order.orderNumber,
              movementType: 'REZERV',
            },
          });

          if (!alreadyReserved) {
            for (const item of order.items) {
              const stock = await tx.warehouseStock.findUnique({
                where: {
                  productId_branchId: {
                    productId: item.productId,
                    branchId: order.branchId,
                  },
                },
              });

              const available = (stock?.quantity || 0) - (stock?.reserved || 0);
              if (available < item.quantity) {
                throw new Error(
                  `"${item.product.name}" uchun omborda yetarli qoldiq yo'q! (Mavjud: ${available}, Talab: ${item.quantity})`
                );
              }

              await tx.warehouseStock.upsert({
                where: {
                  productId_branchId: {
                    productId: item.productId,
                    branchId: order.branchId,
                  },
                },
                create: {
                  productId: item.productId,
                  branchId: order.branchId,
                  quantity: 0,
                  reserved: item.quantity,
                },
                update: {
                  reserved: { increment: item.quantity },
                },
              });

              await tx.stockMovement.create({
                data: {
                  productId: item.productId,
                  branchId: order.branchId,
                  movementType: 'REZERV',
                  quantity: item.quantity,
                  price: item.unitPrice,
                  docNumber: order.orderNumber,
                  reason: `Buyurtma ${order.orderNumber} uchun rezervatsiya`,
                  userName: user.name,
                },
              });
            }
          }

          actionLog = `Buyurtma ${order.orderNumber} uchun tovarlar zaxiraga (rezerv) olindi`;
          break;
        }

        case 'DISPATCH': {
          // Ombordan chiqarish (Physical dispatch from warehouse)
          updatedPipeline = 'CHIQARISH';
          if (order.deliveryRequired) {
            updatedStatus = 'YETKAZILMOQDA';
          } else if (order.installationRequired) {
            updatedStatus = 'ORNATILMOQDA';
          } else {
            updatedStatus = 'TASDIQLANGAN';
          }

          // Check if already dispatched
          const alreadyDispatched = await tx.stockMovement.findFirst({
            where: {
              docNumber: order.orderNumber,
              movementType: 'CHIQIM',
            },
          });

          if (!alreadyDispatched) {
            for (const item of order.items) {
              const stock = await tx.warehouseStock.findUnique({
                where: {
                  productId_branchId: {
                    productId: item.productId,
                    branchId: order.branchId,
                  },
                },
              });

              // Deduct stock quantity and release reserved
              const currentReserved = stock?.reserved || 0;
              const reserveRelease = Math.min(currentReserved, item.quantity);

              await tx.warehouseStock.update({
                where: {
                  productId_branchId: {
                    productId: item.productId,
                    branchId: order.branchId,
                  },
                },
                data: {
                  quantity: { decrement: item.quantity },
                  reserved: { decrement: reserveRelease },
                },
              });

              await tx.stockMovement.create({
                data: {
                  productId: item.productId,
                  branchId: order.branchId,
                  movementType: 'CHIQIM',
                  quantity: item.quantity,
                  price: item.unitPrice,
                  docNumber: order.orderNumber,
                  reason: `Buyurtma ${order.orderNumber} bo'yicha mijozga chiqarildi`,
                  userName: user.name,
                },
              });
            }
          }

          actionLog = `Buyurtma ${order.orderNumber} ombordan chiqarildi va yetkazishga jo'natildi`;
          break;
        }

        case 'DELIVER': {
          updatedPipeline = 'YETKAZISH';
          updatedStatus = 'YETKAZILMOQDA';
          actionLog = `Buyurtma ${order.orderNumber} mijozga yetkazilmoqda`;
          break;
        }

        case 'INSTALL': {
          updatedPipeline = 'ORNATISH';
          updatedStatus = 'ORNATILMOQDA';

          // Ensure installation task exists
          if (order.installations.length === 0 && order.installationRequired) {
            const taskNumber = `TASK-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;
            await tx.installation.create({
              data: {
                taskNumber,
                orderId: order.id,
                customerId: order.customerId,
                branchId: order.branchId,
                deviceName: order.items.map((i) => i.product.name).join(', '),
                serviceType: 'ONKM_ORNATISH',
                status: 'YANGI',
                notes: `Buyurtma ${order.orderNumber} bo'yicha texnik servis va o'rnatish`,
              },
            });
          }

          actionLog = `Buyurtma ${order.orderNumber} o'rnatish xizmatiga topshirildi`;
          break;
        }

        case 'COMPLETE': {
          updatedPipeline = 'YAKUNLANDI';
          updatedStatus = 'YAKUNLANDI';

          // Mark installation completed if exists and still open
          if (order.installations.length > 0) {
            for (const inst of order.installations) {
              if (inst.status !== 'YAKUNLANDI') {
                await tx.installation.update({
                  where: { id: inst.id },
                  data: {
                    status: 'YAKUNLANDI',
                    completedAt: new Date(),
                    completionNotes: 'Buyurtma to\'liq yakunlandi',
                  },
                });
              }
            }
          }

          actionLog = `Buyurtma ${order.orderNumber} to'liq yakunlandi`;
          break;
        }

        case 'CANCEL': {
          updatedStatus = 'BEKOR_QILINDI';

          // If stock was reserved but not yet dispatched, rollback reservation
          const hasDispatched = await tx.stockMovement.findFirst({
            where: { docNumber: order.orderNumber, movementType: 'CHIQIM' },
          });

          if (!hasDispatched) {
            for (const item of order.items) {
              const stock = await tx.warehouseStock.findUnique({
                where: {
                  productId_branchId: {
                    productId: item.productId,
                    branchId: order.branchId,
                  },
                },
              });

              if (stock && stock.reserved > 0) {
                const releaseQty = Math.min(stock.reserved, item.quantity);
                await tx.warehouseStock.update({
                  where: {
                    productId_branchId: {
                      productId: item.productId,
                      branchId: order.branchId,
                    },
                  },
                  data: {
                    reserved: { decrement: releaseQty },
                  },
                });

                await tx.stockMovement.create({
                  data: {
                    productId: item.productId,
                    branchId: order.branchId,
                    movementType: 'UNRESERVE',
                    quantity: releaseQty,
                    docNumber: order.orderNumber,
                    reason: `Buyurtma ${order.orderNumber} bekor qilinishi munosabati bilan zaxira bekor qilindi`,
                    userName: user.name,
                  },
                });
              }
            }
          }

          // Revert customer debt
          if (order.debtAmount > 0) {
            await tx.customer.update({
              where: { id: order.customerId },
              data: {
                debt: { decrement: Math.min(order.customer.debt, order.debtAmount) },
              },
            });
          }

          actionLog = `Buyurtma ${order.orderNumber} bekor qilindi va zaxiralar bo'shatildi`;
          break;
        }

        case 'SET_STATUS': {
          if (targetStatus) updatedStatus = targetStatus;
          if (targetPipelineStage) updatedPipeline = targetPipelineStage;
          actionLog = `Holat o'zgartirildi: ${updatedStatus} (${updatedPipeline})`;
          break;
        }

        default:
          throw new Error(`Noma'lum amal: ${action}`);
      }

      // Update order in database
      const updatedOrder = await tx.order.update({
        where: { id },
        data: {
          status: updatedStatus,
          pipelineStage: updatedPipeline,
          notes: note ? `${order.notes || ''}\n[${new Date().toLocaleDateString('uz')}] ${note}`.trim() : order.notes,
        },
        include: {
          customer: true,
          branch: true,
          items: { include: { product: true } },
          payments: true,
          installations: true,
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          userName: user.name,
          action: 'UPDATE',
          entity: 'OrderFlow',
          entityId: id,
          oldValue: JSON.stringify({ status: order.status, pipeline: order.pipelineStage }),
          newValue: JSON.stringify({ status: updatedStatus, pipeline: updatedPipeline, actionLog }),
        },
      });

      return { updatedOrder, actionLog };
    });

    return NextResponse.json({
      success: true,
      message: result.actionLog,
      order: result.updatedOrder,
    });
  } catch (error: any) {
    console.error('POST /api/orders/[id]/flow error:', error);
    return NextResponse.json({ error: error.message || 'Flow operatsiyasida xatolik yuz berdi' }, { status: 400 });
  }
}

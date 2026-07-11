import { PrismaClient, Prisma } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

/**
 * Soft delete helper — marks a record as deleted instead of physically removing it.
 * Only for models that have isDeleted/deletedAt/deletedBy fields.
 */
export async function softDelete(
  model: 'document' | 'user' | 'department' | 'workflow' | 'organization',
  where: Record<string, any>,
  deletedBy?: string
) {
  const data: Record<string, any> = {
    isDeleted: true,
    deletedAt: new Date(),
  }
  if (deletedBy) data.deletedBy = deletedBy

  return (db as any)[model].update({ where, data })
}

/**
 * Restore a soft-deleted record.
 */
export async function restoreDeleted(
  model: 'document' | 'user' | 'department' | 'workflow' | 'organization',
  where: Record<string, any>
) {
  return (db as any)[model].update({
    where,
    data: {
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
    },
  })
}

/**
 * Physical purge — actually deletes a record from the database.
 * Use with extreme caution.
 */
export async function physicalDelete(
  model: string,
  where: Record<string, any>
) {
  return (db as any)[model].delete({ where })
}

/**
 * Execute operations inside a database transaction.
 * If any operation fails, all changes are rolled back.
 *
 * Usage:
 *   const result = await dbTransaction(async (tx) => {
 *     const doc = await tx.document.create({ ... })
 *     await tx.auditLog.create({ ... })
 *     return doc
 *   })
 */
export async function dbTransaction<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return db.$transaction(fn)
}

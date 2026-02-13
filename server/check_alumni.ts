
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const alumni = await prisma.student.findMany({
        where: { isAlumni: true },
        select: { id: true, name: true, year: true, passedOutYear: true, updatedAt: true }
    })
    console.log('Alumni:', JSON.stringify(alumni, null, 2))
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

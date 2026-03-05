
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import 'dotenv/config'

const { Pool } = pg
const connectionString = `${process.env.DATABASE_URL}`
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
    try {
        console.log('Creating admin user...')
        const user = await prisma.user.upsert({
            where: { username: 'admin' },
            update: {
                password: 'admin', // Reset password if user exists
                role: 'ADMIN'
            },
            create: {
                username: 'admin',
                password: 'admin', // Storing as plain text for now based on auth.controller.ts logic
                email: 'admin@calidose.com',
                role: 'ADMIN'
            }
        })
        console.log('Admin user created/updated:', user)
    } catch (e) {
        console.error('Error creating admin:', e)
    } finally {
        await prisma.$disconnect()
    }
}
main()

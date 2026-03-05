import 'dotenv/config';
import { prisma } from './src/lib/prisma.js';

async function main() {
    console.log("DB URL (desde Server):", process.env.DATABASE_URL);
    const user = await prisma.user.findFirst();
    console.log("FIRST USER FOUND:", user);

    if (user) {
        // Test bcrypt logic as in controller
        const bcrypt = await import('bcryptjs');
        // Let's test the password 'admin' vs the hash
        const match = await bcrypt.default.compare('admin', user.password);
        console.log("Does BCrypt hash match 'admin'?:", match);
        console.log("Is plain 'admin'? :", user.password === 'admin');
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());

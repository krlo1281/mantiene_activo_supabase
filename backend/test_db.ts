import { prisma } from './src/lib/prisma.js';

async function test() {
    try {
        console.log("Probando conexión a Base Local...");
        const count = await prisma.user.count();
        console.log(`[OK] Usuarios en la BD local: ${count}`);

        const admin = await prisma.user.findUnique({ where: { username: 'admin' } });
        if (admin) {
            console.log(`[OK] Admin encontrado. Hash: ${admin.password.substring(0, 15)}...`);
        } else {
            console.log(`[FAIL] Admin NO existe.`);
        }
    } catch (e) {
        console.error("[CRASH FORMAT:]", e);
    } finally {
        await prisma.$disconnect();
    }
}
test();

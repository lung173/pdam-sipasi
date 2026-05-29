import { prisma } from './lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  console.log("Checking DB connection...");
  const user = await prisma.user.findUnique({
    where: { email: 'agendaris@pdam.go.id' }
  });
  console.log('User found:', !!user);
  if (user) {
    const valid = await bcrypt.compare('Agendaris@12345', user.passwordHash);
    console.log('Password valid:', valid);
    console.log('User isActive:', user.isActive);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());

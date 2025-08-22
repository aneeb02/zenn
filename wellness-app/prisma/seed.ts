import { seedAffirmations } from '../src/lib/affirmations/seed';
import { prisma } from '../src/lib/db/prisma';

async function main() {
  console.log('Starting database seed...');
  
  await seedAffirmations();
  
  console.log('Database seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

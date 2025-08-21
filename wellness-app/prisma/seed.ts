import { seedAffirmations } from '../lib/affirmations/seed';

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
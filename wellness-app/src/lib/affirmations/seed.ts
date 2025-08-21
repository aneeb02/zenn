import { prisma } from '@/lib/db/prisma';

export async function seedAffirmations() {
  const affirmations = AFFIRMATION_TEMPLATES.map(template => ({
    text: template.text,
    category: template.category,
    tone: template.tone,
    healthCondition: template.healthCondition || null,
    isCustom: false,
  }));

  await prisma.affirmation.createMany({
    data: affirmations,
    skipDuplicates: true,
  });

  console.log(`Seeded ${affirmations.length} affirmations`);
}

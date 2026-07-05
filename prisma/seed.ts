import 'dotenv/config';
import { PrismaClient } from '../lib/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const SEED_PASSWORD = '$2a$10$8K1p/a0dL1LXMIgoEDFrwOfMQkfAjkMBcGm0xOVqJHlxP2qFmEfly';

async function main() {
  console.log('Seeding database...');

  const adminUser = await prisma.user.upsert({
    where: { phone: '9175498572' },
    update: {},
    create: {
      name: 'Kaushiki Admin',
      phone: '9175498572',
      email: 'kaushikiclasses@klnbs.in',
      passwordHash: SEED_PASSWORD,
      role: 'ADMIN',
      status: 'ACTIVE',
      phoneVerified: true,
    },
  });
  console.log('  Admin user created:', adminUser.id);

  const tracks = [
    {
      name: 'CLASSES_1_5' as const,
      boardCoverage: 'CBSE | ICSE | State Board',
      displayOrder: 1,
      subjects: ['All Subjects'],
    },
    {
      name: 'CLASSES_6_10' as const,
      boardCoverage: 'CBSE | ICSE | State Board',
      displayOrder: 2,
      subjects: ['Mathematics', 'Science', 'English', 'Social Studies'],
    },
    {
      name: 'CLASSES_11_12_COMMERCE' as const,
      boardCoverage: null,
      displayOrder: 3,
      subjects: ['Accountancy', 'Business Studies', 'Economics', 'Mathematics/SP/IP'],
    },
    {
      name: 'CA_FOUNDATION_INTERMEDIATE' as const,
      boardCoverage: null,
      displayOrder: 4,
      subjects: ['CA Foundation Module', 'CA Intermediate Module'],
    },
  ];

  for (const trackData of tracks) {
    const { subjects, ...trackInfo } = trackData;

    const track = await prisma.track.upsert({
      where: { name: trackInfo.name },
      update: { boardCoverage: trackInfo.boardCoverage, displayOrder: trackInfo.displayOrder },
      create: trackInfo,
    });

    console.log(`  Track: ${track.name} (${track.id})`);

    for (const subjectName of subjects) {
      const subject = await prisma.subject.upsert({
        where: { trackId_name: { trackId: track.id, name: subjectName } },
        update: {},
        create: {
          trackId: track.id,
          name: subjectName,
        },
      });
      console.log(`    Subject: ${subject.name} (${subject.id})`);
    }
  }

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Seed QueueSettings
  const settings = await prisma.queueSettings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      averageConsultationTime: 15,
    },
  });
  console.log('Settings seeded:', settings);

  // 2. Seed default receptionist user
  const hashedPassword = await bcrypt.hash('password123', 10);
  const user = await prisma.user.upsert({
    where: { username: 'receptionist' },
    update: {},
    create: {
      username: 'receptionist',
      password: hashedPassword,
      name: 'Sarah Jenkins',
      role: 'Receptionist',
      room: 'Examination Room 1',
    },
  });
  console.log('Receptionist user seeded:', {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    room: user.room,
  });

  // 3. Seed some initial patients to populate the queue
  const initialPatients = [
    { name: 'John Doe', purpose: 'General Checkup', priority: 'normal', status: 'waiting' },
    { name: 'Jane Smith', purpose: 'Vaccination', priority: 'normal', status: 'waiting' },
    { name: 'Robert Johnson', purpose: 'Cardiology Review', priority: 'urgent', status: 'waiting' },
    { name: 'Emily Davis', purpose: 'Pediatric Checkup', priority: 'normal', status: 'completed' },
  ];

  console.log('Seeding initial patients...');
  for (const patient of initialPatients) {
    const pt = await prisma.patient.create({
      data: {
        name: patient.name,
        purpose: patient.purpose,
        priority: patient.priority,
        status: patient.status,
      },
    });
    console.log(`Patient created: ${pt.name} (Token: QC-${pt.token}, Status: ${pt.status})`);
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

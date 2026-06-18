import { PrismaClient, TokenStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with new schema...');

  const today = new Date().toISOString().split('T')[0];

  // 1. Seed default Department
  const department = await prisma.department.upsert({
    where: { code: 'GEN' },
    update: {},
    create: {
      name: 'General Medicine',
      code: 'GEN',
    },
  });
  console.log('Default department seeded:', department);

  // 2. Seed QueueSettings for the department
  const settings = await prisma.queueSettings.upsert({
    where: { departmentId: department.id },
    update: {},
    create: {
      currentToken: 0,
      lastIssuedToken: 0,
      resetDate: today,
      departmentId: department.id,
    },
  });
  console.log('Queue settings seeded:', settings);

  // 3. Seed Receptionist user
  const hashedPassword = await bcrypt.hash('password123', 10);
  const receptionist = await prisma.receptionist.upsert({
    where: { username: 'receptionist' },
    update: {},
    create: {
      username: 'receptionist',
      passwordHash: hashedPassword,
      name: 'Sarah Jenkins',
    },
  });
  console.log('Receptionist seeded:', {
    id: receptionist.id,
    username: receptionist.username,
    name: receptionist.name,
  });

  // 4. Seed initial QueueTokens for today
  const mockTokens = [
    { patientName: 'John Doe', patientPhone: '1234567890', tokenNumber: 1, status: TokenStatus.WAITING },
    { patientName: 'Jane Smith', patientPhone: '0987654321', tokenNumber: 2, status: TokenStatus.WAITING },
    { patientName: 'Robert Johnson', patientPhone: '5556667777', tokenNumber: 3, status: TokenStatus.WAITING },
    { patientName: 'Emily Davis', patientPhone: '1112223333', tokenNumber: 4, status: TokenStatus.COMPLETED },
  ];

  console.log('Seeding initial queue tokens...');
  for (const tokenData of mockTokens) {
    const token = await prisma.queueToken.create({
      data: {
        tokenNumber: tokenData.tokenNumber,
        patientName: tokenData.patientName,
        patientPhone: tokenData.patientPhone,
        status: tokenData.status,
        date: today,
        departmentId: department.id,
      },
    });
    console.log(`Token created: QC-${token.tokenNumber} for ${token.patientName}`);
  }

  // Update last issued token to 4
  await prisma.queueSettings.update({
    where: { departmentId: department.id },
    data: { lastIssuedToken: 4 },
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

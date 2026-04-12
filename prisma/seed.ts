import 'dotenv/config';
import { PrismaClient, UserRoleCode } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const roles = [
    {
      code: UserRoleCode.SUPER_ADMIN,
      name: 'Super Admin',
      description: 'Full system access',
      isSystem: true,
    },
    {
      code: UserRoleCode.ADMIN,
      name: 'Admin',
      description: 'Administrative access',
      isSystem: true,
    },
    {
      code: UserRoleCode.EDITOR,
      name: 'Editor',
      description: 'Content management access',
      isSystem: true,
    },
    {
      code: UserRoleCode.SUPPORT,
      name: 'Support',
      description: 'Inquiry and support access',
      isSystem: true,
    },
    {
      code: UserRoleCode.USER,
      name: 'User',
      description: 'Regular authenticated user',
      isSystem: true,
    },
    {
      code: UserRoleCode.SUBSCRIBER,
      name: 'Subscriber',
      description: 'Premium subscriber access',
      isSystem: true,
    },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { code: role.code },
      update: {
        name: role.name,
        description: role.description,
        isSystem: role.isSystem,
      },
      create: role,
    });
  }

  console.log('Roles seeded successfully');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
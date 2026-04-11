import { PrismaClient, UserRoleCode } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const roles = [
    {
      code: UserRoleCode.SUPER_ADMIN,
      name: 'Super Admin',
      description: 'Full system access',
    },
    {
      code: UserRoleCode.ADMIN,
      name: 'Admin',
      description: 'Administrative access',
    },
    {
      code: UserRoleCode.EDITOR,
      name: 'Editor',
      description: 'Content management access',
    },
    {
      code: UserRoleCode.SUPPORT,
      name: 'Support',
      description: 'Inquiry and support access',
    },
    {
      code: UserRoleCode.USER,
      name: 'User',
      description: 'Regular authenticated user',
    },
    {
      code: UserRoleCode.SUBSCRIBER,
      name: 'Subscriber',
      description: 'Premium subscriber access',
    },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { code: role.code },
      update: {
        name: role.name,
        description: role.description,
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
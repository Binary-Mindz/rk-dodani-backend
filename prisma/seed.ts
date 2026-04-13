import 'dotenv/config';
import {
  PrismaClient,
  ContentTypeCode,
  UserRoleCode,
} from '@prisma/client';
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

async function seedContentTypes() {
  const contentTypes = [
    {
      code: ContentTypeCode.ARTICLE,
      name: 'Article',
      description: 'Standard article or blog content',
    },
    {
      code: ContentTypeCode.WHITE_PAPER,
      name: 'White Paper',
      description: 'Long-form premium or public white paper',
    },
    {
      code: ContentTypeCode.CASE_STUDY,
      name: 'Case Study',
      description: 'Customer or business case study content',
    },
    {
      code: ContentTypeCode.REPORT,
      name: 'Report',
      description: 'Research and analytical reports',
    },
    {
      code: ContentTypeCode.PODCAST,
      name: 'Podcast',
      description: 'Podcast content and episodes',
    },
    {
      code: ContentTypeCode.VIDEO,
      name: 'Video',
      description: 'Video-based media content',
    },
    {
      code: ContentTypeCode.RESEARCH_NOTE,
      name: 'Research Note',
      description: 'Short-form research insight content',
    },
    {
      code: ContentTypeCode.MEDIA_POST,
      name: 'Media Post',
      description: 'Media and thought leadership snippets',
    },
  ];

  for (const item of contentTypes) {
    await prisma.contentType.upsert({
      where: { code: item.code },
      update: {
        name: item.name,
        description: item.description,
      },
      create: item,
    });
  }

  console.log('Content types seeded successfully');
}

async function seedRoles() {
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

async function main() {
  await seedRoles();
  await seedContentTypes();
  console.log('All seeds completed successfully');
}

main()
  .catch(async (error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
import 'dotenv/config';
import {
  PrismaClient,
  ContentTypeCode,
  UserRoleCode,
  UserStatus,
  AuthProviderType,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

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

/**
 * ✅ Seed Roles (RUN ONLY ONCE)
 */
async function seedRoles() {
  const count = await prisma.role.count();

  if (count > 0) {
    console.log('Roles already seeded. Skipping...');
    return;
  }

  await prisma.role.createMany({
    data: [
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
    ],
    skipDuplicates: true,
  });

  console.log('Roles seeded successfully');
}

/**
 * ✅ Seed Content Types (RUN ONLY ONCE)
 */
async function seedContentTypes() {
  const count = await prisma.contentType.count();

  if (count > 0) {
    console.log('Content types already seeded. Skipping...');
    return;
  }

  await prisma.contentType.createMany({
    data: [
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
    ],
    skipDuplicates: true,
  });

  console.log('Content types seeded successfully');
}

/**
 * ✅ Seed Super Admin (ONLY FIRST TIME)
 */
async function seedSuperAdmin() {
  const email =
    process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase() ||
    'superadmin@gmail.com';

  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    console.log('Super Admin already exists. Skipping...');
    return;
  }

  const password =
    process.env.SUPER_ADMIN_PASSWORD || 'Admin@123456';

  const passwordHash = await bcrypt.hash(password, 10);

  const role = await prisma.role.findUnique({
    where: { code: UserRoleCode.SUPER_ADMIN },
  });

  if (!role) {
    throw new Error('SUPER_ADMIN role not found');
  }

  const user = await prisma.user.create({
    data: {
      email,
      firstName: process.env.SUPER_ADMIN_FIRST_NAME || 'Super',
      lastName: process.env.SUPER_ADMIN_LAST_NAME || 'Admin',
      fullName: `${process.env.SUPER_ADMIN_FIRST_NAME || 'Super'} ${
        process.env.SUPER_ADMIN_LAST_NAME || 'Admin'
      }`,
      passwordHash,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      status: UserStatus.ACTIVE,
      signupSource: AuthProviderType.LOCAL,
    },
  });

  await prisma.userRole.create({
    data: {
      userId: user.id,
      roleId: role.id,
      isActive: true,
    },
  });

  console.log('Super Admin created successfully');
}

/**
 * 🚀 MAIN
 */
async function main() {
  await seedRoles();
  await seedContentTypes();
  await seedSuperAdmin();

  console.log('✅ All seeds completed successfully');
}

main()
  .catch(async (error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
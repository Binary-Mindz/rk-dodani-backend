import 'dotenv/config';
import {
  PrismaClient,
  ContentTypeCode,
  UserRoleCode,
  UserStatus,
  AuthProviderType,
  BillingProvider,
  BillingInterval,
  PlanAudience,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import { Pool } from 'pg'; // Client এর পরিবর্তে Pool ব্যবহার করা প্রোডাকশন ও লোকাল উভয়ের জন্য নিরাপদ

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('❌ DATABASE_URL is not set in environment variables');
}

// pg Pool ব্যবহার করা হচ্ছে যা ইন্টারনালি কানেকশন ম্যানেজ করে
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

/**
 * ✅ Seed Roles
 */
async function seedRoles() {
  const count = await prisma.role.count();
  if (count > 0) {
    console.log('ℹ️ Roles already seeded. Skipping...');
    return;
  }

  await prisma.role.createMany({
    data: [
      { code: UserRoleCode.SUPER_ADMIN, name: 'Super Admin', description: 'Full system access', isSystem: true },
      { code: UserRoleCode.ADMIN, name: 'Admin', description: 'Administrative access', isSystem: true },
      { code: UserRoleCode.EDITOR, name: 'Editor', description: 'Content management access', isSystem: true },
      { code: UserRoleCode.SUPPORT, name: 'Support', description: 'Inquiry and support access', isSystem: true },
      { code: UserRoleCode.USER, name: 'User', description: 'Regular authenticated user', isSystem: true },
      { code: UserRoleCode.SUBSCRIBER, name: 'Subscriber', description: 'Premium subscriber access', isSystem: true },
    ],
    skipDuplicates: true,
  });
  console.log('🚀 Roles seeded successfully');
}

/**
 * ✅ Seed Content Types
 */
async function seedContentTypes() {
  const count = await prisma.contentType.count();
  if (count > 0) {
    console.log('ℹ️ Content types already seeded. Skipping...');
    return;
  }

  await prisma.contentType.createMany({
    data: [
      { code: ContentTypeCode.ARTICLE, name: 'Article', description: 'Standard article or blog content' },
      { code: ContentTypeCode.WHITE_PAPER, name: 'White Paper', description: 'Long-form premium or public white paper' },
      { code: ContentTypeCode.CASE_STUDY, name: 'Case Study', description: 'Customer or business case study content' },
      { code: ContentTypeCode.REPORT, name: 'Report', description: 'Research and analytical reports' },
      { code: ContentTypeCode.PODCAST, name: 'Podcast', description: 'Podcast content and episodes' },
      { code: ContentTypeCode.VIDEO, name: 'Video', description: 'Video-based media content' },
      { code: ContentTypeCode.RESEARCH_NOTE, name: 'Research Note', description: 'Short-form research insight content' },
      { code: ContentTypeCode.MEDIA_POST, name: 'Media Post', description: 'Media and thought leadership snippets' },
    ],
    skipDuplicates: true,
  });
  console.log('🚀 Content types seeded successfully');
}

/**
 * ✅ Seed Super Admin
 */
async function seedSuperAdmin() {
  const email = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase() || 'superadmin@gmail.com';
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    console.log('ℹ️ Super Admin already exists. Skipping...');
    return;
  }

  const password = process.env.SUPER_ADMIN_PASSWORD || 'Admin@123456';
  const passwordHash = await bcrypt.hash(password, 10);

  const role = await prisma.role.findUnique({ where: { code: UserRoleCode.SUPER_ADMIN } });
  if (!role) {
    throw new Error('❌ SUPER_ADMIN role not found in database');
  }

  const user = await prisma.user.create({
    data: {
      email,
      firstName: process.env.SUPER_ADMIN_FIRST_NAME || 'Super',
      lastName: process.env.SUPER_ADMIN_LAST_NAME || 'Admin',
      fullName: `${process.env.SUPER_ADMIN_FIRST_NAME || 'Super'} ${process.env.SUPER_ADMIN_LAST_NAME || 'Admin'}`,
      passwordHash,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      status: UserStatus.ACTIVE,
      signupSource: AuthProviderType.LOCAL,
    },
  });

  await prisma.userRole.create({
    data: { userId: user.id, roleId: role.id, isActive: true },
  });

  console.log('🚀 Super Admin created successfully');
}


/**
 * 🚀 MAIN RUNNER
 */
async function main() {
  // এখানে ম্যানুয়াল client.connect() করার দরকার নেই, Prisma নিজেই হ্যান্ডেল করবে
  await seedRoles();
  await seedContentTypes();
  await seedSuperAdmin();

  console.log('✅ All seeds completed successfully!');
}

main()
  .catch(async (error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
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
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('❌ DATABASE_URL is not set in environment variables');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

/**
 * ✅ Seed Clean Meaningful Roles (Independent of billing intervals)
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
      { code: 'STUDENT' as UserRoleCode, name: 'Student', description: 'Student tier access core role', isSystem: true },
      { code: 'SOLO_PROF' as UserRoleCode, name: 'Solo Professional', description: 'Independent professional tier core role', isSystem: true },
      { code: 'SMB' as UserRoleCode, name: 'SMB', description: 'Small & medium business tier core role', isSystem: true },
      { code: 'ENTERPRISE' as UserRoleCode, name: 'Enterprise', description: 'Corporate enterprise tier core role', isSystem: true },
    ],
    skipDuplicates: true,
  });
  console.log('🚀 Meaningful roles seeded successfully');
}

/**
 * ✅ Seed Plans (Superadmin can modify these via Admin endpoints later)
 */
async function seedPlans() {
  const count = await prisma.plan.count();
  if (count > 0) {
    console.log('ℹ️ Plans already seeded. Skipping...');
    return;
  }

  const plansData = [
    {
      code: 'STUDENT_MONTHLY',
      name: 'Student Plan',
      description: 'For Learners & Future AI Professionals',
      targetAudience: PlanAudience.B2C,
      billingProvider: BillingProvider.STRIPE,
      billingInterval: BillingInterval.MONTHLY,
      currency: 'USD',
      priceAmount: '9.99',
      isPerUser: false,
      trialDays: 14,
      isFeatured: false,
      sortOrder: 1,
      features: ['AI Learning Paths', 'Beginner-Friendly Whitepapers', 'AI Fundamentals', 'Community Access'],
    },
    {
      code: 'SOLO_PROF_MONTHLY',
      name: 'Solo Professional Plan',
      description: 'For Independent Professionals & Researchers',
      targetAudience: PlanAudience.B2C,
      billingProvider: BillingProvider.STRIPE,
      billingInterval: BillingInterval.MONTHLY,
      currency: 'USD',
      priceAmount: '29.99',
      isPerUser: false,
      trialDays: 14,
      isFeatured: true,
      sortOrder: 2,
      features: ['Premium Whitepapers', 'Research Library Access', 'Personal Analytics Dashboard'],
    },
    {
      code: 'SMB_MONTHLY',
      name: 'SMB Plan',
      description: 'For Startups, Agencies & Growing Teams',
      targetAudience: PlanAudience.B2B,
      billingProvider: BillingProvider.STRIPE,
      billingInterval: BillingInterval.MONTHLY,
      currency: 'USD',
      priceAmount: '29.99',
      isPerUser: true,
      trialDays: 14,
      isFeatured: true,
      sortOrder: 3,
      features: ['Everything in Solo', 'Shared Team Workspace', 'Team Collaboration Tools', 'Team Size 100'],
    },
    {
      code: 'ENTERPRISE_MONTHLY',
      name: 'Enterprise Plan',
      description: 'For Large Organizations & Enterprise Teams',
      targetAudience: PlanAudience.B2B,
      billingProvider: BillingProvider.STRIPE,
      billingInterval: BillingInterval.MONTHLY,
      currency: 'USD',
      priceAmount: '19.99',
      isPerUser: true,
      trialDays: 14,
      isFeatured: false,
      sortOrder: 4,
      features: ['Everything in SMB', 'Unlimited Team Members', 'SSO & Access Management', 'Dedicated Success Manager'],
    },
  ];

  for (const plan of plansData) {
    await prisma.plan.create({
      data: {
        ...plan,
        features: plan.features,
      },
    });
  }
  console.log('🚀 Initial pricing plans seeded successfully');
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
  await seedRoles();
  await seedPlans();
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
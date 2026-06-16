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

async function seedPlans() {
  const count = await prisma.plan.count();
  if (count > 0) {
    console.log('Plans already seeded. Skipping...');
    return;
  }

  const plansData = [
    // ==== B2C PLANS ====
    {
      code: 'STUDENT_MONTHLY',
      name: 'Student Plan',
      description: 'For Learners & Future AI Professionals',
      targetAudience: PlanAudience.B2C,
      billingProvider: BillingProvider.STRIPE,
      billingInterval: BillingInterval.MONTHLY,
      currency: 'USD',
      priceAmount: 9.99,
      isPerUser: false,
      trialDays: 14,
      isFeatured: false,
      sortOrder: 1,
      features: [
        'AI Learning Paths',
        'Beginner-Friendly Whitepapers',
        'AI Fundamentals & Tutorials',
        'Prompt Writing Practice',
        'AI Chat Assistant',
        'Resource Downloads',
        'Learning Progress Tracking',
        'Community Access',
        'Career Growth Resources',
        'Monthly Content Updates',
      ],
    },
    {
      code: 'SOLO_PROF_MONTHLY',
      name: 'Solo Professional Plan',
      description: 'For Independent Professionals & Researchers',
      targetAudience: PlanAudience.B2C,
      billingProvider: BillingProvider.STRIPE,
      billingInterval: BillingInterval.MONTHLY,
      currency: 'USD',
      priceAmount: 29.99,
      isPerUser: false,
      trialDays: 14,
      isFeatured: true, // Most Popular
      sortOrder: 2,
      features: [
        'Premium Whitepapers & Reports',
        'Research Library Access',
        'Compliance Frameworks',
        'Security & Governance Resources',
        'Industry Podcasts & Insights',
        'Advanced Downloads',
        'AI-Powered Content Recommendations',
        'Personal Analytics Dashboard',
        'Professional Resource Collections',
        'Priority Access to New Content',
      ],
    },
    // ==== B2B PLANS ====
    {
      code: 'SMB_MONTHLY',
      name: 'SMB Plan',
      description: 'For Startups, Agencies & Growing Teams',
      targetAudience: PlanAudience.B2B,
      billingProvider: BillingProvider.STRIPE,
      billingInterval: BillingInterval.MONTHLY,
      currency: 'USD',
      priceAmount: 29.99,
      isPerUser: true, // Per User pricing
      trialDays: 14,
      isFeatured: true, // Most Popular
      sortOrder: 3,
      features: [
        'Everything in Solo Professional',
        'AI Workflow Learning Resources',
        'Prompt Engineering Guides',
        'API Integration Tutorials',
        'AI Automation Frameworks',
        'Shared Team Workspace',
        'Team Collaboration Tools',
        'Team Usage Analytics',
        'Advanced Templates & Playbooks',
        'Up to 10 Team Seats',
        'Small Business AI Adoption Resources',
        'Team Size 100',
      ],
    },
    {
      code: 'ENTERPRISE_MONTHLY',
      name: 'Enterprise Plan',
      description: 'For Large Organizations & Enterprise Teams',
      targetAudience: PlanAudience.B2B,
      billingProvider: BillingProvider.STRIPE,
      billingInterval: BillingInterval.MONTHLY,
      currency: 'USD',
      priceAmount: 19.99,
      isPerUser: true, // Per User pricing
      trialDays: 14,
      isFeatured: false,
      sortOrder: 4,
      features: [
        'Everything in SMB',
        'Unlimited Team Members',
        'Team Onboarding Management',
        'Admin & Delegate Roles',
        'Enterprise Knowledge Hub',
        'Team Activity Monitoring',
        'Advanced Reporting & Insights',
        'Enterprise Security Controls',
        'Governance & Compliance Resources',
        'SSO & Access Management',
        'Custom Integrations',
        'Dedicated Success Manager',
        'Team Size 500 +',
      ],
    },
  ];

  for (const plan of plansData) {
  await prisma.plan.create({
    data: {
      ...plan,
      priceAmount: plan.priceAmount.toString(), 
      features: plan.features,
    },
  });
}

  console.log('Plans seeded successfully from image data.');
}

/**
 * 🚀 MAIN
 */
async function main() {
  await seedRoles();
  await seedContentTypes();
  await seedSuperAdmin();
  await seedPlans();

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
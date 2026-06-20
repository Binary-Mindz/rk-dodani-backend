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
  Prisma,
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

async function seedRoles() {
  const count = await prisma.role.count();
  if (count > 0) {
    console.log('ℹ️ Roles already seeded. Skipping...');
    return;
  }

  await prisma.role.createMany({
    data: [
      { code: UserRoleCode.SUPER_ADMIN, name: 'Super Admin', description: 'Full system access', isSystem: true },
      { code: UserRoleCode.STUDENT, name: 'Student Access', description: 'B2C Core Tier Student Access Role', isSystem: true },
      { code: UserRoleCode.ENTERPRISE, name: 'Enterprise Access', description: 'B2B Core Corporate Access Role', isSystem: true },
    ],
    skipDuplicates: true,
  });
  console.log('🚀 3 Main roles seeded successfully');
}

async function seedPlans() {
  const count = await prisma.plan.count();
  if (count > 0) {
    console.log('ℹ️ Plans already seeded. Skipping...');
    return;
  }

  const plansData = [
    // === B2C PLANS ===
    {
      code: 'FREE_MONTHLY',
      name: 'FREE Plan',
      description: 'Level 1 — For Curious Beginners',
      targetAudience: PlanAudience.B2C,
      billingProvider: BillingProvider.STRIPE,
      billingInterval: BillingInterval.MONTHLY,
      currency: 'USD',
      priceAmount: new Prisma.Decimal('0.00'),
      isPerUser: false,
      trialDays: 0,
      isFeatured: false,
      sortOrder: 1,
      features: ['Weekly newsletter', '1 teaser post/month', 'White paper previews (watermarked)', 'Podcast clips', 'Infographic teasers'],
    },
    {
      code: 'CURIOUS_MONTHLY',
      name: 'Curious Plan',
      description: 'Level 2 — For Learners & Future AI Professionals',
      targetAudience: PlanAudience.B2C,
      billingProvider: BillingProvider.STRIPE,
      billingInterval: BillingInterval.MONTHLY,
      currency: 'USD',
      priceAmount: new Prisma.Decimal('9.99'),
      isPerUser: false,
      trialDays: 14,
      isFeatured: false,
      sortOrder: 2,
      features: ['5 downloads/month', 'Full Discord access', '1 full white paper/month', '2 Executive Decks/month', '1 Full audio podcast', 'Templates', 'Vulnerability checklists', '3 infographics/month', 'Tips/Tricks including code snippet'],
    },
    {
      code: 'NOVICE_MONTHLY',
      name: 'Novice Plan',
      description: 'Level 3 — For Independent Professionals & Researchers',
      targetAudience: PlanAudience.B2C,
      billingProvider: BillingProvider.STRIPE,
      billingInterval: BillingInterval.MONTHLY,
      currency: 'USD',
      priceAmount: new Prisma.Decimal('14.99'),
      isPerUser: false,
      trialDays: 14,
      isFeatured: true,
      sortOrder: 3,
      features: ['Unlimited library', 'Monthly webinar', '5 complete white papers', '2 Executive Decks/month', '2 Full video podcasts', 'All templates', 'Starter dashboards (Excel/Notion)', 'Audit frameworks', 'All infographics', 'Tips/Tricks incl. advanced code snippets & how-to\'s'],
    },
    {
      code: 'PRO_MONTHLY',
      name: 'PRO Plan',
      description: 'Level 4 — For Teams & Enterprise',
      targetAudience: PlanAudience.B2C,
      billingProvider: BillingProvider.STRIPE,
      billingInterval: BillingInterval.MONTHLY,
      currency: 'USD',
      priceAmount: new Prisma.Decimal('29.99'),
      isPerUser: false,
      trialDays: 14,
      isFeatured: false,
      sortOrder: 4,
      features: ['Everything above', 'Custom audits', '1:1 office hours', 'Custom tool builds', 'Request for white paper/research', 'Priority white papers', 'Private podcast AMAs', 'Enterprise templates', 'Custom dashboards', '1:1 code reviews'],
    },
    // === B2B PLANS ===
    {
      code: 'TEAM_MONTHLY',
      name: 'TEAM Plan',
      description: 'For Teams of 25–100 Users',
      targetAudience: PlanAudience.B2B,
      billingProvider: BillingProvider.STRIPE,
      billingInterval: BillingInterval.MONTHLY,
      currency: 'USD',
      priceAmount: new Prisma.Decimal('39.99'),
      isPerUser: true,
      trialDays: 14,
      isFeatured: false,
      sortOrder: 5,
      features: ['25–100 team members', 'Self-Serve sales channel', 'Stripe Checkout payment', 'Annual contract available', 'Full platform access', 'Priority support'],
    },
    {
      code: 'SMB_MONTHLY',
      name: 'SMB Plan',
      description: 'For Growing Businesses of 100–500 Users',
      targetAudience: PlanAudience.B2B,
      billingProvider: BillingProvider.STRIPE,
      billingInterval: BillingInterval.MONTHLY,
      currency: 'USD',
      priceAmount: new Prisma.Decimal('29.99'),
      isPerUser: true,
      trialDays: 14,
      isFeatured: true,
      sortOrder: 6,
      features: ['100–500 users', 'Sales + Self-Serve channel', 'Stripe Billing payment', 'Annual contract', 'Advanced analytics', 'Dedicated account manager', 'Custom integrations', 'Priority white papers'],
    },
    {
      code: 'ENTERPRISE_MONTHLY',
      name: 'ENTERPRISE Plan',
      description: 'For Large Enterprises of 500+ Users',
      targetAudience: PlanAudience.B2B,
      billingProvider: BillingProvider.STRIPE,
      billingInterval: BillingInterval.MONTHLY,
      currency: 'USD',
      priceAmount: new Prisma.Decimal('19.99'),
      isPerUser: true,
      trialDays: 14,
      isFeatured: false,
      sortOrder: 7,
      features: ['500+ users', 'Dedicated Sales Team', 'Stripe Billing + Client Procurement', 'Custom annual contracts', 'Custom tool builds', '1:1 dedicated support', 'Enterprise templates', 'Custom dashboards', 'Custom audits', 'SLA guarantees'],
    },
  ];

  for (const plan of plansData) {
    await prisma.plan.create({ data: plan });
  }
  console.log('🚀 Screenshot layout tailored plans seeded successfully');
}

async function main() {
  await seedRoles();
  await seedPlans();
  console.log('✅ Seeds completed.');
}

main()
  .catch(async (e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); await pool.end(); });
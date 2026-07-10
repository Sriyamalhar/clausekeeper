import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password";

const db = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const passwordHash = await hashPassword("demo1234");

  const org = await db.organization.create({
    data: { name: "Rivera Films" },
  });

  const user = await db.user.upsert({
    where: { email: "demo@demo.com" },
    update: {},
    create: {
      email: "demo@demo.com",
      name: "Alex Rivera",
      passwordHash,
      emailVerified: new Date(),
    },
  });

  await db.membership.create({
    data: { userId: user.id, orgId: org.id, role: "owner" },
  });

  const acme = await db.client.create({
    data: {
      orgId: org.id,
      name: "Acme Beverages",
      contactName: "Jordan Lee",
      contactEmail: "jordan@acmebeverages.com",
    },
  });
  const northwind = await db.client.create({
    data: {
      orgId: org.id,
      name: "Northwind Studios",
      contactName: "Sam Patel",
      contactEmail: "sam@northwindstudios.com",
    },
  });

  const now = new Date();
  const daysFromNow = (n: number) => new Date(now.getTime() + n * 24 * 60 * 60 * 1000);

  const contract1 = await db.contract.create({
    data: {
      orgId: org.id,
      clientId: acme.id,
      title: "Q3 product launch video",
      status: "active",
      startDate: daysFromNow(-60),
      endDate: daysFromNow(20), // expiring soon
      autoRenews: false,
      valueAmount: 8500,
      valueCurrency: "USD",
      createdById: user.id,
    },
  });

  const contract2 = await db.contract.create({
    data: {
      orgId: org.id,
      clientId: northwind.id,
      title: "Ongoing social content retainer",
      status: "active",
      startDate: daysFromNow(-180),
      endDate: daysFromNow(365),
      autoRenews: true,
      renewalNoticeDays: 30,
      valueAmount: 3000,
      valueCurrency: "USD",
      createdById: user.id,
    },
  });

  await db.milestone.createMany({
    data: [
      {
        contractId: contract1.id,
        title: "First cut delivered",
        dueDate: daysFromNow(-10),
        status: "done",
        amount: 3000,
      },
      {
        contractId: contract1.id,
        title: "Final delivery + invoice",
        dueDate: daysFromNow(-2), // overdue
        status: "pending",
        amount: 5500,
      },
      {
        contractId: contract2.id,
        title: "Monthly retainer invoice",
        dueDate: daysFromNow(5),
        status: "pending",
        amount: 3000,
      },
    ],
  });

  await db.clauseFlag.createMany({
    data: [
      {
        contractId: contract1.id,
        clauseType: "usage_rights",
        extractedText:
          "Client is granted perpetual, worldwide usage rights across all media for a one-time fee.",
        riskLevel: "high",
        aiConfidence: 0.91,
      },
      {
        contractId: contract1.id,
        clauseType: "payment_terms",
        extractedText: "Net-30 payment terms with a 2% late fee after 15 days past due.",
        riskLevel: "low",
        aiConfidence: 0.95,
      },
      {
        contractId: contract2.id,
        clauseType: "exclusivity",
        extractedText:
          "Freelancer may not provide similar services to any direct competitor for the contract term.",
        riskLevel: "medium",
        aiConfidence: 0.83,
      },
      {
        contractId: contract2.id,
        clauseType: "licensing_renewal",
        extractedText:
          "Licensing terms auto-renew annually unless written notice is given 30 days prior.",
        riskLevel: "medium",
        aiConfidence: 0.88,
      },
    ],
  });

  console.log("Seed complete.");
  console.log("Demo login: demo@demo.com / demo1234");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });

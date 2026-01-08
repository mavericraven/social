import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting database seeding...')

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@socialmv.com' },
    update: {},
    create: {
      email: 'admin@socialmv.com',
      name: 'Admin User',
      role: 'ADMIN',
    },
  })

  console.log('Ensured admin user exists')

  const resorts = [
    { name: 'Soneva Jani', instagramHandle: 'sonevajani', region: 'Noonu Atoll' },
    { name: 'Gili Lankanfushi', instagramHandle: 'gililankanfushi', region: 'North Male Atoll' },
    { name: 'Hurawalhi Island Resort', instagramHandle: 'hurawalhi', region: 'Lhaviyani Atoll' },
    { name: 'JOALI Maldives', instagramHandle: 'joalimaldives', region: 'Raa Atoll' },
    { name: 'W Maldives', instagramHandle: 'wmaldives', region: 'North Ari Atoll' },
    { name: 'Four Seasons Maldives', instagramHandle: 'fsmaldives', region: 'Baa Atoll' },
    { name: 'Conrad Maldives', instagramHandle: 'conradmaldives', region: 'Raa Atoll' },
    { name: 'St. Regis Maldives', instagramHandle: 'stregismaldives', region: 'Gaafu Alif Atoll' },
    { name: 'One&Only Reethi Rah', instagramHandle: 'oneandonlyreethirah', region: 'North Male Atoll' },
    { name: 'Anantara Kihavah', instagramHandle: 'anantara.kihavah', region: 'Baa Atoll' },
    { name: 'Baros Maldives', instagramHandle: 'barosmaldives', region: 'North Male Atoll' },
    { name: 'Coco Bodu Hithi', instagramHandle: 'cocoboduhithi', region: 'North Male Atoll' },
    { name: 'Dhiggiri Resort', instagramHandle: 'dhigglirimdhoo', region: 'Gaafu Alif Atoll' },
    { name: 'Furaveri Island Resort', instagramHandle: 'furaveri', region: 'Raa Atoll' },
    { name: 'Grand Park Kodhipparu', instagramHandle: 'grandparkkodhipparu', region: 'North Male Atoll' },
  ]

  for (const resort of resorts) {
    await prisma.resort.upsert({
      where: { instagramHandle: resort.instagramHandle },
      update: {},
      create: resort,
    })
  }

  console.log(`Ensured ${resorts.length} resorts exist`)

  const existingAccount = await prisma.instagramAccount.findFirst({
    where: { metaAccountId: 'test_account_id' },
  })

  let account = existingAccount

  if (!account) {
    account = await prisma.instagramAccount.create({
      data: {
        userId: adminUser.id,
        metaAccountId: 'test_account_id',
        metaUsername: 'socialmv_admin',
        accessToken: 'test_token',
        tokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      },
    })

    console.log('Created test Instagram account')
  } else {
    console.log('Test Instagram account already exists')
  }

  await prisma.settings.upsert({
    where: { instagramAccountId: account.id },
    update: {},
    create: {
      instagramAccountId: account.id,
      postingSchedule: {
        slots: [
          '09:00',
          '12:00',
          '15:00',
          '18:00',
          '21:00',
        ],
      },
      captionTemplate: 'Discover paradise in Maldives! 🏝️✨\n\nExperience the luxury of {resort_name}\n\n#Maldives #Travel #Luxury #IslandLife #Paradise',
      dailyReelCount: 5,
      minReelGapMinutes: 90,
      viralScoreThreshold: 70,
    },
  })

  console.log('Ensured settings exist')

  console.log('Database seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

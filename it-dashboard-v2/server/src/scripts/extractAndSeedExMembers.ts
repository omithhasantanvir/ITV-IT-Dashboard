import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';

interface ExMemberConfig {
  name: string;
  designation: string;
  slug: string;
  imageSource?: {
    imagePath: string;
    centerX: number;
    centerY: number;
    radius: number;
  };
}

const IMG_DIR = 'C:/Users/OH Tanvir/.gemini/antigravity-ide/brain/aa13fa27-efa1-49f3-96c6-fc3544ab94fb/.user_uploaded';
const IMG1 = path.join(IMG_DIR, 'media_1791896675859.png');
const IMG2 = path.join(IMG_DIR, 'media_1791896702134.png');
const IMG3 = path.join(IMG_DIR, 'media_1791896731313.png');
const IMG4 = path.join(IMG_DIR, 'media_1791896757046.png');

const TARGET_AVATAR_DIR = path.resolve(__dirname, '../../../client/public/avatars/ex-members');

const EX_MEMBERS: ExMemberConfig[] = [
  // Image 1 (8 members)
  {
    name: 'Mahbub Al Hasan',
    designation: 'Junior Broadcast Engineer',
    slug: 'mahbub-al-hasan',
    imageSource: { imagePath: IMG1, centerX: 57, centerY: 122, radius: 28 },
  },
  {
    name: 'Mahmudul Hasan',
    designation: 'Senior Broadcast Engineer',
    slug: 'mahmudul-hasan',
    imageSource: { imagePath: IMG1, centerX: 57, centerY: 192, radius: 28 },
  },
  {
    name: 'Preetom Mozumder',
    designation: 'Broadcast Engineer',
    slug: 'preetom-mozumder',
    imageSource: { imagePath: IMG1, centerX: 57, centerY: 263, radius: 28 },
  },
  {
    name: 'Md. Shaon Ahmed Opu',
    designation: 'Junior Broadcast Engineer',
    slug: 'md-shaon-ahmed-opu',
    imageSource: { imagePath: IMG1, centerX: 57, centerY: 333, radius: 28 },
  },
  {
    name: 'Abu Sayeed',
    designation: 'Junior Broadcast Engineer',
    slug: 'abu-sayeed',
    imageSource: { imagePath: IMG1, centerX: 57, centerY: 404, radius: 28 },
  },
  {
    name: 'Md. Ashif Ali',
    designation: 'Manager',
    slug: 'md-ashif-ali',
    imageSource: { imagePath: IMG1, centerX: 57, centerY: 474, radius: 28 },
  },
  {
    name: 'Shakib Arifin',
    designation: 'Senior Manager',
    slug: 'shakib-arifin',
    imageSource: { imagePath: IMG1, centerX: 57, centerY: 544, radius: 28 },
  },
  {
    name: 'Ridwan Raju',
    designation: 'Assistant Manager',
    slug: 'ridwan-raju',
    imageSource: { imagePath: IMG1, centerX: 57, centerY: 615, radius: 28 },
  },

  // Image 2 (10 members)
  {
    name: 'Khasruzzaman Omar',
    designation: 'Broadcast Engineer',
    slug: 'khasruzzaman-omar',
    imageSource: { imagePath: IMG2, centerX: 118, centerY: 30, radius: 28 },
  },
  {
    name: 'Mufid Islam',
    designation: 'Broadcast Engineer',
    slug: 'mufid-islam',
    imageSource: { imagePath: IMG2, centerX: 118, centerY: 94, radius: 28 },
  },
  {
    name: 'Md. Shamim Akter',
    designation: 'Junior Broadcast Engineer',
    slug: 'md-shamim-akter',
    imageSource: { imagePath: IMG2, centerX: 118, centerY: 160, radius: 28 },
  },
  {
    name: 'Khoandoker Md. Tanvir Rayhan',
    designation: 'Senior Broadcast Engineer',
    slug: 'khoandoker-md-tanvir-rayhan',
    imageSource: { imagePath: IMG2, centerX: 118, centerY: 223, radius: 28 },
  },
  {
    name: 'Mahmudul Amin (Shibly)',
    designation: 'Broadcast Engineer',
    slug: 'mahmudul-amin-shibly',
    imageSource: { imagePath: IMG2, centerX: 118, centerY: 288, radius: 28 },
  },
  {
    name: 'Golam Mahmud',
    designation: 'Broadcast Engineer',
    slug: 'golam-mahmud',
    imageSource: { imagePath: IMG2, centerX: 118, centerY: 353, radius: 28 },
  },
  {
    name: 'Tapon Mahmud Jony',
    designation: 'Broadcast Engineer',
    slug: 'tapon-mahmud-jony',
    imageSource: { imagePath: IMG2, centerX: 118, centerY: 417, radius: 28 },
  },
  {
    name: 'Ashish Banik',
    designation: 'Junior Broadcast Engineer',
    slug: 'ashish-banik',
    imageSource: { imagePath: IMG2, centerX: 118, centerY: 482, radius: 28 },
  },
  {
    name: 'Md. Omar Faruk',
    designation: 'Junior Broadcast Engineer',
    slug: 'md-omar-faruk',
    imageSource: { imagePath: IMG2, centerX: 118, centerY: 547, radius: 28 },
  },
  {
    name: 'Khaled Mahmud Thuhin',
    designation: 'Junior Broadcast Engineer',
    slug: 'khaled-mahmud-thuhin',
    imageSource: { imagePath: IMG2, centerX: 118, centerY: 611, radius: 28 },
  },

  // Image 3 (8 members)
  {
    name: 'Md. Motiur Rahman',
    designation: 'Broadcast Engineer',
    slug: 'md-motiur-rahman',
    imageSource: { imagePath: IMG3, centerX: 57, centerY: 107, radius: 28 },
  },
  {
    name: 'Md. Abu Ashraf',
    designation: 'Broadcast Engineer',
    slug: 'md-abu-ashraf',
    // No image available
  },
  {
    name: 'Hironmoy Tarafder',
    designation: 'Junior Broadcast Engineer',
    slug: 'hironmoy-tarafder',
    imageSource: { imagePath: IMG3, centerX: 57, centerY: 246, radius: 28 },
  },
  {
    name: 'Kowshik Saha',
    designation: 'Junior Broadcast Engineer',
    slug: 'kowshik-saha',
    // No image available
  },
  {
    name: 'Rafi Khan Lodi',
    designation: 'Junior Broadcast Engineer',
    slug: 'rafi-khan-lodi',
    imageSource: { imagePath: IMG3, centerX: 57, centerY: 386, radius: 28 },
  },
  {
    name: 'Muhtasim Billah',
    designation: 'Developer',
    slug: 'muhtasim-billah',
    imageSource: { imagePath: IMG3, centerX: 57, centerY: 455, radius: 28 },
  },
  {
    name: 'Md. Muhaimenur Rahman',
    designation: 'Junior Broadcast Engineer',
    slug: 'md-muhaimenur-rahman',
    imageSource: { imagePath: IMG3, centerX: 57, centerY: 525, radius: 28 },
  },
  {
    name: 'Deboprio Mani',
    designation: 'Junior Broadcast Engineer',
    slug: 'deboprio-mani',
    imageSource: { imagePath: IMG3, centerX: 57, centerY: 594, radius: 28 },
  },

  // Image 4 (10 members)
  {
    name: 'Md. Shahidul Mostafa',
    designation: 'Web Developer',
    slug: 'md-shahidul-mostafa',
    imageSource: { imagePath: IMG4, centerX: 53, centerY: 38, radius: 28 },
  },
  {
    name: 'Arif Ahamed Sajoy',
    designation: 'Junior Broadcast Engineer',
    slug: 'arif-ahamed-sajoy',
    imageSource: { imagePath: IMG4, centerX: 53, centerY: 110, radius: 28 },
  },
  {
    name: 'Md. Kamrul Islam',
    designation: 'Junior Broadcast Engineer',
    slug: 'md-kamrul-islam',
    imageSource: { imagePath: IMG4, centerX: 53, centerY: 181, radius: 28 },
  },
  {
    name: 'Tanmoy Kumar Ray',
    designation: 'Junior Broadcast Engineer',
    slug: 'tanmoy-kumar-ray',
    imageSource: { imagePath: IMG4, centerX: 53, centerY: 252, radius: 28 },
  },
  {
    name: 'Mohammad Farhad Uddin',
    designation: 'Web Developer',
    slug: 'mohammad-farhad-uddin',
    imageSource: { imagePath: IMG4, centerX: 53, centerY: 324, radius: 28 },
  },
  {
    name: 'Junayed Kader',
    designation: 'Junior Broadcast Engineer',
    slug: 'junayed-kader',
    imageSource: { imagePath: IMG4, centerX: 53, centerY: 395, radius: 28 },
  },
  {
    name: 'Adison Gomes',
    designation: 'Junior Broadcast Engineer',
    slug: 'adison-gomes',
    imageSource: { imagePath: IMG4, centerX: 53, centerY: 466, radius: 28 },
  },
  {
    name: 'Md Riad Hasan',
    designation: 'Junior Broadcast Engineer',
    slug: 'md-riad-hasan',
    imageSource: { imagePath: IMG4, centerX: 53, centerY: 538, radius: 28 },
  },
  {
    name: 'Kazi Md. Al Amin Hossain',
    designation: 'Junior Broadcast Engineer',
    slug: 'kazi-md-al-amin-hossain',
    imageSource: { imagePath: IMG4, centerX: 53, centerY: 609, radius: 28 },
  },
  {
    name: 'Abir Ahmed',
    designation: 'Junior Broadcast Engineer',
    slug: 'abir-ahmed',
    imageSource: { imagePath: IMG4, centerX: 53, centerY: 681, radius: 28 },
  },
];

async function main() {
  console.log(`Starting extraction and database seeding for ${EX_MEMBERS.length} ex-members...`);

  if (!fs.existsSync(TARGET_AVATAR_DIR)) {
    fs.mkdirSync(TARGET_AVATAR_DIR, { recursive: true });
  }

  // 1. Crop and save avatar images
  let imagesSaved = 0;
  for (const member of EX_MEMBERS) {
    if (member.imageSource) {
      const { imagePath, centerX, centerY, radius } = member.imageSource;
      const size = radius * 2;
      const left = Math.max(0, centerX - radius);
      const top = Math.max(0, centerY - radius);
      const outPath = path.join(TARGET_AVATAR_DIR, `${member.slug}.png`);

      await sharp(imagePath)
        .extract({ left, top, width: size, height: size })
        .resize(120, 120, { kernel: sharp.kernel.lanczos3 })
        .png()
        .toFile(outPath);

      imagesSaved++;
      console.log(`[Avatar ${imagesSaved}/34] Extracted & saved: ${member.slug}.png`);
    } else {
      console.log(`[Avatar -/-] No image for ${member.name} (Placeholder used)`);
    }
  }

  // 2. Hash default password
  const defaultPassword = await bcrypt.hash('ExMember@123', 10);

  // 3. Insert or update users in database
  let seededCount = 0;
  for (let i = 0; i < EX_MEMBERS.length; i++) {
    const member = EX_MEMBERS[i];
    const employeeId = `EX-${1001 + i}`;
    const username = member.slug.replace(/[^a-z0-9]/g, '.');
    const email = `${username}@ex.independent24.tv`;
    const profilePhoto = member.imageSource ? `/avatars/ex-members/${member.slug}.png` : '';

    let department = 'Broadcast Operations & IT';
    if (member.designation.toLowerCase().includes('developer')) {
      department = 'Information Technology';
    } else if (member.designation.toLowerCase().includes('manager')) {
      department = 'Broadcast & IT Operations';
    }

    // Check if user already exists by employeeId or username or name
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { employeeId },
          { username },
          { email },
          { name: member.name },
        ],
      },
    });

    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          name: member.name,
          designation: member.designation,
          department,
          profilePhoto: profilePhoto || existing.profilePhoto,
          employmentStatus: 'Former',
          isITTeam: true,
          itStatus: 'OFFLINE',
          remarks: 'Former IT Employee',
        },
      });
      console.log(`[DB ${i + 1}/${EX_MEMBERS.length}] Updated: ${member.name} (${employeeId})`);
    } else {
      await prisma.user.create({
        data: {
          employeeId,
          name: member.name,
          username,
          password: defaultPassword,
          email,
          department,
          designation: member.designation,
          profilePhoto,
          employmentStatus: 'Former',
          role: 'VIEWER',
          isITTeam: true,
          itStatus: 'OFFLINE',
          remarks: 'Former IT Employee',
        },
      });
      console.log(`[DB ${i + 1}/${EX_MEMBERS.length}] Created: ${member.name} (${employeeId})`);
    }
    seededCount++;
  }

  console.log(`\nSuccessfully processed ${seededCount} ex-members (${imagesSaved} avatar photos saved)!`);
}

main()
  .catch((err) => {
    console.error('Error in main:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { count, like } from 'drizzle-orm';
import { db } from '@/libs/DB';
import { profileSchema } from '@/models/Schema';

const P = (id: number, w: number) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;

// Demo educators so the Agora is not empty on first run. All photos are
// free-licensed Pexels portraits shared with the marketing site.
const SEED_EDUCATORS = [
  {
    userId: 'seed-emma-karuri',
    firstName: 'Emma',
    lastName: 'Karuri',
    county: 'Mombasa',
    subjects: 'Mathematics, Geometry',
    gradeLevels: 'Grades 4-8',
    philosophy: 'CBC-aligned',
    hourlyRateKsh: 1500,
    bio: 'Maths tutor with 8 years of experience turning number-shy learners into confident problem solvers. I plan every lesson around the CBC strands and send parents a short progress note after each session.',
    photo: P(6311269, 600),
  },
  {
    userId: 'seed-simon-mwangi',
    firstName: 'Simon',
    lastName: 'Mwangi',
    county: 'Nairobi',
    subjects: 'Biology, Chemistry',
    gradeLevels: 'Grades 7-9',
    philosophy: 'Inquiry-based',
    hourlyRateKsh: 1800,
    bio: 'Former high school science teacher. My homeschool sessions are built around safe, low-cost experiments so learners discover the concept before we name it.',
    photo: P(3907762, 600),
  },
  {
    userId: 'seed-sarah-maina',
    firstName: 'Sarah',
    lastName: 'Maina',
    county: 'Nairobi',
    subjects: 'Literacy, STEAM',
    gradeLevels: 'Grades 1-3',
    philosophy: 'Montessori',
    hourlyRateKsh: 1200,
    bio: 'Early-years specialist. I mix Montessori practical life work with CBC literacy targets, and parents sit in on the first lesson so we align on routines from day one.',
    photo: P(11440539, 600),
  },
  {
    userId: 'seed-david-omondi',
    firstName: 'David',
    lastName: 'Omondi',
    county: 'Kisumu',
    subjects: 'Mathematics, Physics',
    gradeLevels: 'Grades 10-12',
    philosophy: 'Classical',
    hourlyRateKsh: 2000,
    bio: 'I prepare senior learners for KCSE and international exams with a classical drill-then-apply structure: strong fundamentals first, past papers second, speed last.',
    photo: P(30544173, 600),
  },
  {
    userId: 'seed-brian-kip',
    firstName: 'Brian',
    lastName: 'Kip',
    county: 'Eldoret',
    subjects: 'Coding, ICT',
    gradeLevels: 'Grades 6-9',
    philosophy: 'Project-based',
    hourlyRateKsh: 1600,
    bio: 'Software developer turned tutor. Learners build a real game or website across the term; Scratch for beginners, Python once the logic clicks.',
    photo: P(6146927, 600),
  },
  {
    userId: 'seed-achieng-odera',
    firstName: 'Achieng',
    lastName: 'Odera',
    county: 'Kisumu',
    subjects: 'Kiswahili, English',
    gradeLevels: 'Grades 4-8',
    philosophy: 'CBC-aligned',
    hourlyRateKsh: 1300,
    bio: 'Languages teacher focused on composition and comprehension. I use storytelling and set books your child actually enjoys, with a reading list agreed with parents.',
    photo: P(5905838, 600),
  },
];

// Idempotent: inserts demo educators if they are not present.
export async function ensureSeed() {
  const [row] = await db.select({ n: count() }).from(profileSchema)
    .where(like(profileSchema.userId, 'seed-%'));
  if (row && row.n === 0) {
    await db.insert(profileSchema).values(
      SEED_EDUCATORS.map(e => ({
        ...e,
        role: 'educator',
        email: `${e.userId}@demo.edubridge.local`,
        tscNumber: '',
        status: 'verified',
        verifiedAt: new Date(),
      })),
    ).onConflictDoNothing();
  }
}

// Test setup file
import { prisma } from '../lib/prisma';

// Clean up database after each test
afterEach(async () => {
  // Clean up test data in reverse order of dependencies
  await prisma.platformConnection.deleteMany({});
  await prisma.candidateScore.deleteMany({});
  await prisma.platformData.deleteMany({});
  await prisma.savedSearch.deleteMany({});
  await prisma.candidateProfile.deleteMany({});
  await prisma.recruiterProfile.deleteMany({});
  await prisma.user.deleteMany({});
});

// Close database connection after all tests
afterAll(async () => {
  await prisma.$disconnect();
});
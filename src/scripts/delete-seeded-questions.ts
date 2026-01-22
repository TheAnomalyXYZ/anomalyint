import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteSeededQuestions() {
  console.log('🗑️  Deleting seeded Bitcoin questions...');

  try {
    // Delete the seeded Bitcoin questions by their IDs
    const questionIds = ['q-btc-1', 'q-btc-2', 'q-btc-3', 'q-btc-4', 'q-btc-5'];
    let deletedCount = 0;
    let notFoundCount = 0;

    for (const id of questionIds) {
      try {
        const deleted = await prisma.question.delete({
          where: { id },
        });
        console.log(`✅ Deleted question: ${deleted.title}`);
        deletedCount++;
      } catch (error: any) {
        if (error.code === 'P2025') {
          console.log(`⚠️  Question ${id} not found (already deleted or never existed)`);
          notFoundCount++;
        } else {
          throw error;
        }
      }
    }

    console.log(`\n🎉 Completed! Deleted ${deletedCount} questions, ${notFoundCount} not found.`);

  } catch (error) {
    console.error('❌ Error deleting questions:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the delete function
deleteSeededQuestions()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

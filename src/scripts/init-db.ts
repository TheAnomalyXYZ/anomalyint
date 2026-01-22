import { testConnection, query } from '../lib/database';
import { mockAgents, mockProposedQuestions } from '../lib/mock-data';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

// Initialize database with schema and seed data
async function initializeDatabase() {
  console.log('🔗 Testing database connection...');

  const isConnected = await testConnection();
  if (!isConnected) {
    console.error('❌ Database connection failed. Check your .env configuration.');
    process.exit(1);
  }

  console.log('✅ Database connection successful!');

  try {
    // Create categories from mock data
    console.log('📂 Creating categories...');
    const categories = new Set<string>();

    mockProposedQuestions.forEach(q => {
      q.categories.forEach(cat => categories.add(cat));
    });

    for (const category of categories) {
      await query(`
        INSERT IGNORE INTO categories (id, name, created_at)
        VALUES (UUID(), ?, NOW())
      `, [category]);
    }

    console.log(`✅ Created ${categories.size} categories`);

    // Insert agents
    console.log('🤖 Creating agents...');
    for (const agent of mockAgents) {
      if (!agent.isTemplate) {
        await query(`
          INSERT INTO agents (
            id, name, description, question_prompt, resolution_prompt,
            frequency, status, is_template, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, NOW(), NOW())
          ON DUPLICATE KEY UPDATE updated_at = NOW()
        `, [
          agent.id,
          agent.name,
          agent.description,
          agent.questionPrompt,
          agent.resolutionPrompt,
          agent.frequency,
          agent.status
        ]);
      }
    }

    console.log(`✅ Created ${mockAgents.filter(a => !a.isTemplate).length} agents`);

    // Insert proposed questions
    console.log('❓ Creating proposed questions...');
    for (const question of mockProposedQuestions) {
      await query(`
        INSERT INTO proposed_questions (
          id, title, description, live_date, proposed_answer_end_at,
          proposed_settlement_at, resolution_criteria, agent_id, ai_score,
          risk_flags, type, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE updated_at = NOW()
      `, [
        question.id,
        question.title,
        question.description,
        question.liveDate,
        question.answerEndAt,
        question.settlementAt,
        question.resolutionCriteria,
        question.agentId,
        question.aiScore,
        JSON.stringify(question.riskFlags || []),
        question.type,
        question.createdAt
      ]);

      // Insert categories for each question
      for (const category of question.categories) {
        const categoryRows = await query(
          'SELECT id FROM categories WHERE name = ?',
          [category]
        );

        if (categoryRows.length > 0) {
          const categoryId = (categoryRows[0] as any).id;
          await query(`
            INSERT IGNORE INTO proposed_question_categories (proposed_question_id, category_id)
            VALUES (?, ?)
          `, [question.id, categoryId]);
        }
      }
    }

    console.log(`✅ Created ${mockProposedQuestions.length} proposed questions`);

    // Verify data
    const questionCount = await query('SELECT COUNT(*) as count FROM proposed_questions');
    const agentCount = await query('SELECT COUNT(*) as count FROM agents WHERE is_template = 0');
    const categoryCount = await query('SELECT COUNT(*) as count FROM categories');

    console.log('\n📊 Database initialized successfully!');
    console.log(`- ${(questionCount[0] as any).count} proposed questions`);
    console.log(`- ${(agentCount[0] as any).count} agents`);
    console.log(`- ${(categoryCount[0] as any).count} categories`);

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (process.argv[1] === __filename) {
  initializeDatabase()
    .then(() => {
      console.log('🎉 Database initialization complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Initialization error:', error);
      process.exit(1);
    });
}

export { initializeDatabase };
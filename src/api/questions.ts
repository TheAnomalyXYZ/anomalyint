import { query, transaction } from '../lib/database';
import { Question, ProposedQuestion, Agent } from '../lib/types';

// Questions API
export const questionsApi = {
  // Get all questions with filters
  async getQuestions(filters: {
    state?: string;
    category?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<Question[]> {
    let sql = `
      SELECT q.*,
        GROUP_CONCAT(DISTINCT c.name) as categories,
        GROUP_CONCAT(DISTINCT t.name) as tags,
        a.name as agent_name
      FROM questions q
      LEFT JOIN question_categories qc ON q.id = qc.question_id
      LEFT JOIN categories c ON qc.category_id = c.id
      LEFT JOIN question_tags qt ON q.id = qt.question_id
      LEFT JOIN tags t ON qt.tag_id = t.id
      LEFT JOIN agents a ON q.agent_id = a.id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (filters.state) {
      sql += ' AND q.state = ?';
      params.push(filters.state);
    }

    if (filters.category) {
      sql += ' AND c.name = ?';
      params.push(filters.category);
    }

    sql += ' GROUP BY q.id ORDER BY q.created_at DESC';

    if (filters.limit) {
      sql += ' LIMIT ?';
      params.push(filters.limit);

      if (filters.offset) {
        sql += ' OFFSET ?';
        params.push(filters.offset);
      }
    }

    const rows = await query(sql, params);

    return rows.map((row: any) => ({
      ...row,
      categories: row.categories ? row.categories.split(',') : [],
      tags: row.tags ? row.tags.split(',') : [],
      liveDate: row.live_date,
      answerEndAt: row.answer_end_at,
      settlementAt: row.settlement_at,
      resolutionCriteria: row.resolution_criteria,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      type: row.type === 'binary' ? 'Binary' : 'Multiple Choice'
    }));
  },

  // Create new question
  async createQuestion(question: Omit<Question, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    return transaction(async (connection) => {
      const questionId = crypto.randomUUID();

      // Insert question
      await connection.execute(`
        INSERT INTO questions (
          id, title, description, state, live_date, answer_end_at,
          settlement_at, resolution_criteria, agent_id, type, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        questionId,
        question.title,
        question.description,
        question.state,
        question.liveDate,
        question.answerEndAt,
        question.settlementAt,
        question.resolutionCriteria,
        question.agentId,
        question.type.toLowerCase(),
      ]);

      // Insert categories
      if (question.categories?.length) {
        for (const category of question.categories) {
          await connection.execute(`
            INSERT IGNORE INTO categories (id, name, created_at)
            VALUES (UUID(), ?, NOW())
          `, [category]);

          const [categoryRows] = await connection.execute(
            'SELECT id FROM categories WHERE name = ?',
            [category]
          );

          if (Array.isArray(categoryRows) && categoryRows.length > 0) {
            const categoryId = (categoryRows[0] as any).id;
            await connection.execute(`
              INSERT INTO question_categories (question_id, category_id)
              VALUES (?, ?)
            `, [questionId, categoryId]);
          }
        }
      }

      return questionId;
    });
  },

  // Update question
  async updateQuestion(id: string, updates: Partial<Question>): Promise<void> {
    const setClause = [];
    const params = [];

    if (updates.title) {
      setClause.push('title = ?');
      params.push(updates.title);
    }
    if (updates.description) {
      setClause.push('description = ?');
      params.push(updates.description);
    }
    if (updates.state) {
      setClause.push('state = ?');
      params.push(updates.state);
    }
    if (updates.liveDate) {
      setClause.push('live_date = ?');
      params.push(updates.liveDate);
    }
    if (updates.answerEndAt) {
      setClause.push('answer_end_at = ?');
      params.push(updates.answerEndAt);
    }
    if (updates.settlementAt) {
      setClause.push('settlement_at = ?');
      params.push(updates.settlementAt);
    }
    if (updates.resolutionCriteria) {
      setClause.push('resolution_criteria = ?');
      params.push(updates.resolutionCriteria);
    }

    setClause.push('updated_at = NOW()');
    params.push(id);

    await query(`
      UPDATE questions
      SET ${setClause.join(', ')}
      WHERE id = ?
    `, params);
  },

  // Delete question
  async deleteQuestion(id: string): Promise<void> {
    await query('DELETE FROM questions WHERE id = ?', [id]);
  }
};

// Proposed Questions API
export const proposedQuestionsApi = {
  // Get proposed questions
  async getProposedQuestions(limit = 50): Promise<ProposedQuestion[]> {
    const rows = await query(`
      SELECT pq.*,
        GROUP_CONCAT(DISTINCT c.name) as categories,
        a.name as agent_name
      FROM proposed_questions pq
      LEFT JOIN proposed_question_categories pqc ON pq.id = pqc.proposed_question_id
      LEFT JOIN categories c ON pqc.category_id = c.id
      LEFT JOIN agents a ON pq.agent_id = a.id
      GROUP BY pq.id
      ORDER BY pq.ai_score DESC, pq.created_at DESC
      LIMIT ?
    `, [limit]);

    return rows.map((row: any) => ({
      ...row,
      categories: row.categories ? row.categories.split(',') : [],
      liveDate: row.live_date,
      proposedAnswerEndAt: row.proposed_answer_end_at,
      proposedSettlementAt: row.proposed_settlement_at,
      resolutionCriteria: row.resolution_criteria,
      aiScore: row.ai_score,
      riskFlags: row.risk_flags ? JSON.parse(row.risk_flags) : [],
      createdAt: row.created_at,
      agentId: row.agent_id
    }));
  },

  // Create proposed question
  async createProposedQuestion(question: Omit<ProposedQuestion, 'id' | 'createdAt'>): Promise<string> {
    const questionId = crypto.randomUUID();

    await query(`
      INSERT INTO proposed_questions (
        id, title, description, live_date, proposed_answer_end_at,
        proposed_settlement_at, resolution_criteria, agent_id, ai_score,
        risk_flags, type, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      questionId,
      question.title,
      question.description,
      question.liveDate,
      question.proposedAnswerEndAt,
      question.proposedSettlementAt,
      question.resolutionCriteria,
      question.agentId,
      question.aiScore,
      JSON.stringify(question.riskFlags || []),
      question.type
    ]);

    return questionId;
  },

  // Approve proposed question (move to questions table)
  async approveProposedQuestion(id: string): Promise<string> {
    return transaction(async (connection) => {
      // Get proposed question
      const [proposedRows] = await connection.execute(
        'SELECT * FROM proposed_questions WHERE id = ?',
        [id]
      );

      if (!Array.isArray(proposedRows) || proposedRows.length === 0) {
        throw new Error('Proposed question not found');
      }

      const proposed = proposedRows[0] as any;
      const questionId = crypto.randomUUID();

      // Insert into questions table
      await connection.execute(`
        INSERT INTO questions (
          id, title, description, state, live_date, answer_end_at,
          settlement_at, resolution_criteria, agent_id, type, created_at, updated_at
        ) VALUES (?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        questionId,
        proposed.title,
        proposed.description,
        proposed.live_date,
        proposed.proposed_answer_end_at,
        proposed.proposed_settlement_at,
        proposed.resolution_criteria,
        proposed.agent_id,
        proposed.type
      ]);

      // Copy categories
      await connection.execute(`
        INSERT INTO question_categories (question_id, category_id)
        SELECT ?, pqc.category_id
        FROM proposed_question_categories pqc
        WHERE pqc.proposed_question_id = ?
      `, [questionId, id]);

      // Delete from proposed questions
      await connection.execute('DELETE FROM proposed_questions WHERE id = ?', [id]);

      return questionId;
    });
  },

  // Reject proposed question
  async rejectProposedQuestion(id: string): Promise<void> {
    await query('DELETE FROM proposed_questions WHERE id = ?', [id]);
  }
};

// Agents API
export const agentsApi = {
  // Get all agents
  async getAgents(): Promise<Agent[]> {
    const rows = await query(`
      SELECT a.*,
        COUNT(DISTINCT pq.id) as questions_created,
        MAX(pq.created_at) as last_run
      FROM agents a
      LEFT JOIN proposed_questions pq ON a.id = pq.agent_id
      WHERE a.is_template = 0
      GROUP BY a.id
      ORDER BY a.created_at DESC
    `);

    return rows.map((row: any) => ({
      ...row,
      sources: [], // Will be populated separately if needed
      frequency: row.frequency,
      status: row.status,
      isTemplate: Boolean(row.is_template),
      questionPrompt: row.question_prompt,
      resolutionPrompt: row.resolution_prompt,
      questionsCreated: row.questions_created || 0,
      lastRun: row.last_run,
      nextRun: row.next_run,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }
};
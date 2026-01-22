import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Agent, Question } from '../lib/types';

const prisma = new PrismaClient();

// Convert Prisma Agent to our Agent type
function convertPrismaAgent(prismaAgent: any): Agent {
  return {
    id: prismaAgent.id,
    name: prismaAgent.name,
    description: prismaAgent.description || '',
    category: prismaAgent.category || undefined,
    sources: prismaAgent.agentSources?.map((source: any) => ({
      type: source.type,
      config: {
        url: source.configUrl,
        subreddit: source.configSubreddit,
        apiEndpoint: source.configApiEndpoint,
        feedUrl: source.configFeedUrl,
      },
    })) || [],
    questionPrompt: prismaAgent.questionPrompt,
    resolutionPrompt: prismaAgent.resolutionPrompt,
    baseModel: prismaAgent.baseModel,
    frequency: prismaAgent.frequency,
    status: prismaAgent.status,
    questionsCreated: prismaAgent.questionsCreated,
    lastRun: prismaAgent.lastRun,
    nextRun: prismaAgent.nextRun,
    createdAt: prismaAgent.createdAt,
    updatedAt: prismaAgent.updatedAt,
  };
}

// Convert Prisma Question to our Question type
function convertPrismaQuestion(prismaQuestion: any): Question {
  return {
    id: prismaQuestion.id,
    title: prismaQuestion.title,
    description: prismaQuestion.description || '',
    state: prismaQuestion.state,
    liveDate: prismaQuestion.liveDate,
    answerEndAt: prismaQuestion.answerEndAt,
    settlementAt: prismaQuestion.settlementAt,
    resolutionCriteria: prismaQuestion.resolutionCriteria,
    agentId: prismaQuestion.agentId,
    reviewStatus: prismaQuestion.reviewStatus,
    outcome: prismaQuestion.outcome,
    aiScore: prismaQuestion.aiScore ? parseFloat(prismaQuestion.aiScore.toString()) : undefined,
    riskFlags: [],
    categories: [],
    type: prismaQuestion.type || 'binary',
    poolTotal: prismaQuestion.poolTotal ? parseFloat(prismaQuestion.poolTotal.toString()) : 0,
    poolYes: prismaQuestion.poolYes ? parseFloat(prismaQuestion.poolYes.toString()) : 0,
    poolNo: prismaQuestion.poolNo ? parseFloat(prismaQuestion.poolNo.toString()) : 0,
    answerCount: prismaQuestion.answerCount || 0,
    createdAt: prismaQuestion.createdAt,
    updatedAt: prismaQuestion.updatedAt,
  };
}

export const agentsApi = {
  async getAgents(): Promise<Agent[]> {
    try {
      const agents = await prisma.agent.findMany({
        include: {
          agentSources: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return agents.map(convertPrismaAgent);
    } catch (error) {
      console.error('Error fetching agents:', error);
      return [];
    }
  },

  async getAgent(id: string): Promise<Agent | null> {
    try {
      const agent = await prisma.agent.findUnique({
        where: { id },
        include: {
          agentSources: true,
        },
      });

      return agent ? convertPrismaAgent(agent) : null;
    } catch (error) {
      console.error('Error fetching agent:', error);
      return null;
    }
  },
};

export const questionsApi = {
  async getQuestions(): Promise<Question[]> {
    try {
      const questions = await prisma.question.findMany({
        orderBy: {
          createdAt: 'desc',
        },
      });

      return questions.map(convertPrismaQuestion);
    } catch (error) {
      console.error('Error fetching questions:', error);
      return [];
    }
  },

  async getQuestionsByAgent(agentId: string): Promise<Question[]> {
    try {
      const questions = await prisma.question.findMany({
        where: { agentId },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return questions.map(convertPrismaQuestion);
    } catch (error) {
      console.error('Error fetching questions by agent:', error);
      return [];
    }
  },

  async getQuestion(id: string): Promise<Question | null> {
    try {
      const question = await prisma.question.findUnique({
        where: { id },
      });

      return question ? convertPrismaQuestion(question) : null;
    } catch (error) {
      console.error('Error fetching question:', error);
      return null;
    }
  },
};

// Export prisma client for direct use if needed
export { prisma };

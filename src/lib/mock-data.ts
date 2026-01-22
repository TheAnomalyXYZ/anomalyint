// Mock data for the dashboard
import { Question, Answer, KPIStat, AuditEvent, Agent, AIResolutionProposal } from './types';

// Unified mock questions covering all lifecycle states
export const mockQuestions: Question[] = [
  // AI Suggestions (pending state)
  {
    id: 'q-pending-1',
    title: 'Will OpenAI release GPT-5 before the end of 2025?',
    description: 'This question asks whether OpenAI will officially announce and release GPT-5 to the public before December 31, 2025. The resolution will be based on official announcements from OpenAI and verified release documentation.',
    state: 'pending',
    liveDate: new Date('2025-10-28T15:00:00Z'),
    answerEndAt: new Date('2025-12-15T23:59:59Z'),
    settlementAt: new Date('2026-01-05T23:59:59Z'),
    resolutionCriteria: 'Resolves YES if OpenAI publicly announces GPT-5 with general availability before Dec 31, 2025. Resolves NO otherwise.',
    agentId: 'agent2',
    aiScore: 0.95,
    riskFlags: [],
    createdAt: new Date('2025-10-09T08:00:00Z'),
    updatedAt: new Date('2025-10-09T08:00:00Z'),
    categories: ['Technology', 'AI'],
    type: 'binary',
  },
  {
    id: 'q-pending-2',
    title: 'Will Bitcoin exceed $100,000 in October 2025?',
    description: 'This question asks whether Bitcoin\'s price will reach or exceed $100,000 USD at any point during October 2025. The price will be determined based on major cryptocurrency exchanges including Coinbase, Binance, and Kraken.',
    state: 'pending',
    liveDate: new Date('2025-10-28T16:00:00Z'),
    answerEndAt: new Date('2025-10-25T23:59:59Z'),
    settlementAt: new Date('2025-11-01T23:59:59Z'),
    resolutionCriteria: 'Resolves YES if Bitcoin trades at or above $100,000 on any major exchange during October 2025.',
    agentId: 'agent4',
    aiScore: 0.92,
    riskFlags: [],
    createdAt: new Date('2025-10-08T14:30:00Z'),
    updatedAt: new Date('2025-10-08T14:30:00Z'),
    categories: ['Cryptocurrency', 'Finance'],
    type: 'binary',
  },
  {
    id: 'q-pending-3',
    title: 'Will the S&P 500 close above 6000 by year end?',
    description: 'This question asks whether the S&P 500 index will close above 6000 points by December 31, 2025. Resolution will be based on the official closing price on the last trading day of 2025 as reported by major financial data providers.',
    state: 'pending',
    liveDate: new Date('2025-10-29T14:00:00Z'),
    answerEndAt: new Date('2025-12-20T23:59:59Z'),
    settlementAt: new Date('2026-01-02T23:59:59Z'),
    resolutionCriteria: 'Resolves YES if the S&P 500 closes above 6000 on its last trading day of 2025.',
    agentId: 'agent3',
    aiScore: 0.88,
    riskFlags: [],
    createdAt: new Date('2025-10-07T11:00:00Z'),
    updatedAt: new Date('2025-10-07T11:00:00Z'),
    categories: ['Finance', 'Markets'],
    type: 'multi-option',
  },
  {
    id: 'q-pending-4',
    title: 'Will Apple Vision Pro 2 launch before June 2026?',
    description: 'This question asks whether Apple will officially launch the second generation of Vision Pro headset before June 30, 2026. The resolution will be based on official Apple announcements and product availability.',
    state: 'pending',
    liveDate: new Date('2025-10-30T13:00:00Z'),
    answerEndAt: new Date('2026-05-31T23:59:59Z'),
    settlementAt: new Date('2026-06-15T23:59:59Z'),
    resolutionCriteria: 'Resolves YES if Apple officially launches Vision Pro 2 with general availability before June 30, 2026.',
    agentId: 'agent1',
    aiScore: 0.84,
    riskFlags: [],
    createdAt: new Date('2025-10-07T09:00:00Z'),
    updatedAt: new Date('2025-10-07T09:00:00Z'),
    categories: ['Technology', 'Apple'],
    type: 'binary',
  },
  {
    id: 'q-pending-5',
    title: 'Will Ethereum implement EIP-7691 before Q2 2026?',
    description: 'This question asks whether the Ethereum network will successfully implement Ethereum Improvement Proposal 7691 before the end of Q2 2026. The resolution will be based on official Ethereum Foundation announcements and on-chain verification.',
    state: 'pending',
    liveDate: new Date('2025-10-28T17:00:00Z'),
    answerEndAt: new Date('2026-06-15T23:59:59Z'),
    settlementAt: new Date('2026-06-30T23:59:59Z'),
    resolutionCriteria: 'Resolves YES if EIP-7691 is successfully implemented on Ethereum mainnet before June 30, 2026.',
    agentId: 'agent2',
    aiScore: 0.79,
    riskFlags: [],
    createdAt: new Date('2025-10-06T16:00:00Z'),
    updatedAt: new Date('2025-10-06T16:00:00Z'),
    categories: ['Cryptocurrency', 'Technology'],
    type: 'multi-option',
  },
];

export const mockAnswers: Answer[] = [];

export const mockKPIs: KPIStat[] = [
  { label: 'Drafts', value: 12, trend: 'up', change: 3 },
  { label: 'Awaiting Review', value: 5, trend: 'neutral' },
  { label: 'Published Open', value: 23, trend: 'up', change: 5 },
  { label: 'Awaiting Resolution', value: 8, trend: 'down', change: -2 },
  { label: 'Overdue', value: 2, trend: 'down', change: -1 },
  { label: 'Scored This Week', value: 15, trend: 'up', change: 7 },
];

// Connector health removed - no longer needed without sources

export const mockAuditEvents: AuditEvent[] = [
  {
    id: 'ae2',
    timestamp: new Date('2025-10-09T09:15:00Z'),
    actor: 'moderator@example.com',
    action: 'suggestion.approved',
    entityType: 'suggestion',
    entityId: 'pq1',
  },
];

export const mockAgents: Agent[] = [
  {
    id: 'agent1',
    name: 'Elon Market Agent',
    description: 'Creates prediction markets based on Elon Musk\'s latest tweets',
    category: 'Technology',
    sources: [
      {
        type: 'x',
        config: {
          url: 'https://x.com/elonmusk',
        },
      },
    ],
    questionPrompt: 'Create a question based on Elon Musk\'s latest tweet',
    resolutionPrompt: 'Answer the question by researching the web and finding the answer.',
    baseModel: 'chatgpt-4o-latest',
    frequency: 'on_update',
    status: 'active',
    questionsCreated: 47,
    lastRun: new Date('2025-10-28T08:30:00Z'),
    nextRun: new Date('2025-10-28T12:00:00Z'),
    createdAt: new Date('2025-09-15T10:00:00Z'),
    updatedAt: new Date('2025-10-28T08:30:00Z'),
    isTemplate: false,
  },
  {
    id: 'agent2',
    name: 'r/Futurology Agent',
    description: 'Creates statistical questions about trending posts from r/Futurology',
    category: 'AI',
    sources: [
      {
        type: 'reddit',
        config: {
          subreddit: 'Futurology',
        },
      },
    ],
    questionPrompt: 'Create a statistical question about the latest posts from the subreddit',
    resolutionPrompt: 'Answer the question by researching the web and finding the answer.',
    baseModel: 'chatgpt-4o-latest',
    frequency: 'on_update',
    status: 'active',
    questionsCreated: 23,
    lastRun: new Date('2025-10-28T06:00:00Z'),
    nextRun: new Date('2025-10-29T06:00:00Z'),
    createdAt: new Date('2025-09-20T14:00:00Z'),
    updatedAt: new Date('2025-10-28T06:00:00Z'),
    isTemplate: false,
  },
  {
    id: 'agent3',
    name: 'Price Feed Agent',
    description: 'Creates price prediction markets for tokens using real-time data feeds',
    category: 'Finance',
    sources: [
      {
        type: 'feed',
        config: {
          feedUrl: 'https://feed.com/api/123/token',
        },
      },
    ],
    questionPrompt: 'Create a question about this token\'s price within the next month. For example: Will $TOKEN reach $X in November?',
    resolutionPrompt: 'Determine the answer by viewing the historical numbers from this feed https://feed.com/api/123/token',
    baseModel: 'chatgpt-4o-latest',
    frequency: 'weekly',
    status: 'active',
    questionsCreated: 12,
    lastRun: new Date('2025-10-27T10:00:00Z'),
    nextRun: new Date('2025-11-03T10:00:00Z'),
    createdAt: new Date('2025-10-01T09:00:00Z'),
    updatedAt: new Date('2025-10-27T10:00:00Z'),
    isTemplate: true,
  },
  {
    id: 'agent4',
    name: 'Bitcoin Price Agent',
    description: 'Creates daily YES/NO prediction markets about Bitcoin closing prices',
    category: 'Cryptocurrency',
    sources: [
      {
        type: 'api',
        config: {
          apiEndpoint: 'https://theanomaly.app.n8n.cloud/webhook/getbtcdata?ticker=btc',
        },
      },
    ],
    questionPrompt: "Generate a question YES/NO Prediction: One asking whether the asset will close **above** today's price. Keep the questions simple and direct for a prediction market betting app. Only return the text of the questions, no preamble or explanation.",
    resolutionPrompt: 'Answer the question by researching the web and finding the answer.',
    baseModel: 'chatgpt-4o-latest',
    frequency: 'on_update',
    status: 'active',
    questionsCreated: 34,
    lastRun: new Date('2025-10-28T07:00:00Z'),
    nextRun: new Date('2025-10-29T07:00:00Z'),
    createdAt: new Date('2025-09-10T11:00:00Z'),
    updatedAt: new Date('2025-10-28T07:00:00Z'),
  },
  {
    id: 'agent5',
    name: 'AIXBT News',
    description: 'Monitors AIXBT news and creates relevant prediction markets',
    category: 'AI',
    sources: [
      {
        type: 'x',
        config: {
          url: 'https://x.com/aixbt_agent',
        },
      },
    ],
    questionPrompt: 'Create a question about AIXBT latest tweets',
    resolutionPrompt: 'Answer the question by researching the web and finding the answer.',
    baseModel: 'chatgpt-4o-latest',
    frequency: 'on_update',
    status: 'active',
    questionsCreated: 21,
    lastRun: new Date('2025-10-28T07:00:00Z'),
    nextRun: new Date('2025-10-29T07:00:00Z'),
    createdAt: new Date('2025-09-10T11:00:00Z'),
    updatedAt: new Date('2025-10-28T07:00:00Z'),
  },
];

// Mock AI Resolution Proposals
export const mockAIResolutionProposals: AIResolutionProposal[] = [
  {
    id: 'proposal-4',
    questionId: 'q-pending-1', // "Will OpenAI release GPT-5 before the end of 2025?"
    resolution: 'NO',
    confidenceScore: 0.6800,
    reasoning: 'As of October 31, 2025, OpenAI has not made any official announcements regarding GPT-5 release. While CEO Sam Altman mentioned in various interviews that GPT-5 development is underway, no concrete release timeline has been provided. Industry analysts and leaked reports suggest a potential 2026 release is more likely. With only 2 months remaining in 2025 and typical OpenAI release patterns requiring several months of preview/beta testing before general availability, a 2025 release appears increasingly unlikely.',
    evidence: {
      sources: [
        'OpenAI Official Blog',
        'Sam Altman Twitter/X Posts',
        'TechCrunch OpenAI Coverage',
        'The Information Industry Reports',
      ],
      dataPoints: [
        {
          metric: 'Official GPT-5 Announcements',
          value: 0,
          timestamp: new Date('2025-10-31T00:00:00Z'),
        },
        {
          metric: 'Days Remaining in 2025',
          value: 61,
          timestamp: new Date('2025-10-31T00:00:00Z'),
        },
        {
          metric: 'Typical OpenAI Beta Period',
          value: '90-120 days',
        },
      ],
      urls: [
        'https://openai.com/blog',
        'https://twitter.com/sama',
        'https://techcrunch.com/tag/openai/',
      ],
    },
    status: 'pending',
    createdBy: 'agent2',
    createdAt: new Date('2025-10-31T08:00:00Z'),
    updatedAt: new Date('2025-10-31T08:00:00Z'),
  },
  {
    id: 'proposal-5',
    questionId: 'q-pending-2', // "Will Bitcoin exceed $100,000 in October 2025?"
    resolution: 'YES',
    confidenceScore: 0.9850,
    reasoning: 'Bitcoin definitively exceeded $100,000 USD during October 2025. On October 24, 2025, at approximately 14:32 UTC, Bitcoin reached $103,250 on Coinbase, $103,180 on Binance, and $103,420 on Kraken. The price breakthrough was sustained for over 48 hours and was widely covered by financial media. Multiple independent data sources confirm this event occurred within the specified timeframe.',
    evidence: {
      sources: [
        'Coinbase Historical Price Data',
        'Binance Market Archives',
        'Kraken Trading History',
        'CoinMarketCap Historical Data',
        'Bloomberg Crypto Coverage',
      ],
      dataPoints: [
        {
          metric: 'Peak Price (Coinbase)',
          value: '$103,250',
          timestamp: new Date('2025-10-24T14:32:00Z'),
        },
        {
          metric: 'Peak Price (Binance)',
          value: '$103,180',
          timestamp: new Date('2025-10-24T14:35:00Z'),
        },
        {
          metric: 'Peak Price (Kraken)',
          value: '$103,420',
          timestamp: new Date('2025-10-24T14:30:00Z'),
        },
        {
          metric: 'Duration Above $100k',
          value: '52 hours',
          timestamp: new Date('2025-10-26T18:00:00Z'),
        },
      ],
      urls: [
        'https://www.coinbase.com/price/bitcoin/history?date=2025-10-24',
        'https://www.binance.com/en/trade/BTC_USDT?type=spot',
        'https://www.bloomberg.com/news/articles/2025-10-24/bitcoin-surpasses-100k',
      ],
    },
    status: 'approved',
    createdBy: 'agent4',
    reviewedBy: 'user-456',
    reviewedAt: new Date('2025-10-31T10:30:00Z'),
    createdAt: new Date('2025-10-31T09:00:00Z'),
    updatedAt: new Date('2025-10-31T10:30:00Z'),
  },
];
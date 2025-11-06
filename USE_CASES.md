# 用 Daydreams 可以构建什么？完整应用指南

## 一、快速上手：5 分钟能做什么

### 1. 个人 AI 助手（记住你的一切）

```typescript
import { createDreams, context, action } from "@daydreamsai/core";
import { openai } from "@ai-sdk/openai";

const assistantContext = context({
  type: "personal-assistant",
  schema: z.object({ userId: z.string() }),

  // 初始化记忆
  create: () => ({
    userName: "",
    preferences: {},
    conversationHistory: [],
    todos: []
  }),

  instructions: `你是一个个人助手，记住用户的所有信息、偏好和待办事项。`
});

// 添加功能
assistantContext.setActions([
  action({
    name: "rememberPreference",
    schema: z.object({
      key: z.string(),
      value: z.string()
    }),
    handler: async ({ key, value }, ctx) => {
      ctx.memory.preferences[key] = value;
      return { saved: true, message: `记住了：${key} = ${value}` };
    }
  }),

  action({
    name: "addTodo",
    schema: z.object({ task: z.string() }),
    handler: async ({ task }, ctx) => {
      ctx.memory.todos.push({ task, done: false, createdAt: Date.now() });
      return { added: true };
    }
  })
]);

const agent = createDreams({
  model: openai("gpt-4o-mini"),
  contexts: [assistantContext]
});

// 使用
await agent.start();
await agent.send({
  context: assistantContext,
  args: { userId: "me" },
  input: "我喜欢喝咖啡"
});

// 下次对话会记住！
await agent.send({
  context: assistantContext,
  args: { userId: "me" },
  input: "我喜欢喝什么？"
});
// 回复：你喜欢喝咖啡！
```

**用途：**
- ✅ 个人日程管理
- ✅ 笔记和待办事项
- ✅ 个性化推荐
- ✅ 学习助手

---

## 二、社交平台机器人

### 2. Discord 服务器管理 Bot

```typescript
import { createDreams, context } from "@daydreamsai/core";
import { discordExtension } from "@daydreamsai/discord";
import { openai } from "@ai-sdk/openai";

const serverContext = context({
  type: "discord-server",
  schema: z.object({
    serverId: z.string(),
    channelId: z.string()
  }),

  create: () => ({
    members: new Map(),
    warnings: new Map(),
    rules: [],
    serverStats: { messageCount: 0 }
  }),

  instructions: `你是 Discord 服务器管理员助手。
  - 欢迎新成员
  - 回答服务器规则问题
  - 监控违规行为
  - 提供帮助`
});

serverContext.setActions([
  action({
    name: "warnUser",
    schema: z.object({
      userId: z.string(),
      reason: z.string()
    }),
    handler: async ({ userId, reason }, ctx) => {
      const warnings = ctx.memory.warnings.get(userId) || [];
      warnings.push({ reason, timestamp: Date.now() });
      ctx.memory.warnings.set(userId, warnings);

      if (warnings.length >= 3) {
        return { action: "ban", message: "用户已被禁言（3次警告）" };
      }
      return { action: "warn", message: `警告 ${warnings.length}/3` };
    }
  }),

  action({
    name: "getServerStats",
    handler: async (_, ctx) => {
      return {
        totalMembers: ctx.memory.members.size,
        totalMessages: ctx.memory.serverStats.messageCount,
        activeWarnings: ctx.memory.warnings.size
      };
    }
  })
]);

const bot = createDreams({
  model: openai("gpt-4o"),
  extensions: [
    discordExtension({
      token: process.env.DISCORD_TOKEN,
      intents: ["GUILDS", "GUILD_MESSAGES"]
    })
  ],
  contexts: [serverContext]
});

await bot.start();
```

**功能：**
- ✅ 自动欢迎新成员
- ✅ 回答常见问题
- ✅ 内容审核
- ✅ 统计分析
- ✅ 游戏活动组织

**其他平台：**
- Twitter/X Bot (`@daydreamsai/twitter`)
- Telegram Bot (`@daydreamsai/telegram`)

---

### 3. 客户服务系统

```typescript
const supportContext = context({
  type: "customer-support",
  schema: z.object({
    customerId: z.string(),
    tier: z.enum(["free", "premium", "enterprise"])
  }),

  create: () => ({
    tickets: [],
    satisfaction: 0,
    resolvedIssues: 0
  })
})
  // 🌟 组合多个上下文
  .use((state) => [
    // 分析用户行为
    { context: analyticsContext, args: { userId: state.args.customerId } },

    // 加载用户资料
    { context: profileContext, args: { userId: state.args.customerId } },

    // 高级用户获得 VIP 支持
    ...(state.args.tier === "enterprise"
      ? [{ context: vipSupportContext }]
      : [])
  ])

  .setActions([
    action({
      name: "createTicket",
      schema: z.object({
        title: z.string(),
        description: z.string(),
        priority: z.enum(["low", "medium", "high"])
      }),
      handler: async ({ title, description, priority }, ctx) => {
        const ticket = {
          id: randomUUID(),
          title,
          description,
          priority,
          status: "open",
          createdAt: Date.now()
        };

        ctx.memory.tickets.push(ticket);

        // 高优先级自动通知
        if (priority === "high") {
          await ctx.callAction("notifySupport", { ticketId: ticket.id });
        }

        return { ticketId: ticket.id };
      }
    }),

    action({
      name: "searchKnowledgeBase",
      schema: z.object({ query: z.string() }),
      handler: async ({ query }, ctx) => {
        // 使用向量搜索
        const results = await ctx.agent.memory.vector.search({
          query,
          limit: 5,
          filter: { type: "knowledge_base" }
        });

        return { articles: results };
      }
    })
  ]);

const supportAgent = createDreams({
  model: openai("gpt-4o"),
  contexts: [supportContext],
  memory: supabaseMemory // 持久化到 Supabase
});

// 多用户同时使用
await supportAgent.send({
  context: supportContext,
  args: { customerId: "alice", tier: "enterprise" },
  input: "我的订单有问题"
});

await supportAgent.send({
  context: supportContext,
  args: { customerId: "bob", tier: "free" },
  input: "如何升级账户？"
});

// ✅ 完全隔离，各自的工单和历史
```

**功能：**
- ✅ 7x24 自动回复
- ✅ 多语言支持
- ✅ 工单系统
- ✅ 知识库搜索
- ✅ 自动升级紧急问题
- ✅ 客户满意度追踪

---

## 三、游戏和娱乐

### 4. 游戏 NPC（有记忆的角色）

```typescript
const npcContext = context({
  type: "game-npc",
  schema: z.object({
    npcId: z.string(),
    playerId: z.string()
  }),

  create: () => ({
    personality: "friendly",
    relationships: new Map(), // 玩家关系
    inventory: [],
    questsGiven: [],
    conversationHistory: []
  }),

  render: (state) => {
    const relationship = state.memory.relationships.get(state.args.playerId) || 0;
    return `
NPC: ${state.args.npcId}
性格: ${state.memory.personality}
与玩家关系: ${relationship}/100
已给任务: ${state.memory.questsGiven.length}
    `;
  },

  instructions: (state) => {
    const relationship = state.memory.relationships.get(state.args.playerId) || 0;

    if (relationship > 70) {
      return "你是玩家的好友，热情帮助，分享秘密。";
    } else if (relationship < 30) {
      return "你对玩家有戒心，回答简短，不愿帮忙。";
    } else {
      return "你是中立的 NPC，礼貌但保持距离。";
    }
  }
});

npcContext.setActions([
  action({
    name: "giveQuest",
    schema: z.object({
      questName: z.string(),
      description: z.string(),
      reward: z.string()
    }),
    handler: async ({ questName, description, reward }, ctx) => {
      ctx.memory.questsGiven.push({
        name: questName,
        description,
        reward,
        givenAt: Date.now(),
        completed: false
      });

      return {
        quest: questName,
        message: `接受任务：${questName}`
      };
    }
  }),

  action({
    name: "changeRelationship",
    schema: z.object({
      playerId: z.string(),
      change: z.number()
    }),
    handler: async ({ playerId, change }, ctx) => {
      const current = ctx.memory.relationships.get(playerId) || 50;
      const newValue = Math.max(0, Math.min(100, current + change));
      ctx.memory.relationships.set(playerId, newValue);

      return {
        relationship: newValue,
        message: newValue > current ? "关系变好了" : "关系变差了"
      };
    }
  }),

  action({
    name: "rememberEvent",
    schema: z.object({
      event: z.string(),
      importance: z.number()
    }),
    handler: async ({ event, importance }, ctx) => {
      ctx.memory.conversationHistory.push({
        event,
        importance,
        timestamp: Date.now()
      });

      return { remembered: true };
    }
  })
]);

const npc = createDreams({
  model: openai("gpt-4o"),
  contexts: [npcContext]
});

// 玩家互动
await npc.send({
  context: npcContext,
  args: { npcId: "tavern-keeper", playerId: "player-1" },
  input: "你好，有什么任务吗？"
});

// NPC 记住玩家的行为
await npc.send({
  context: npcContext,
  args: { npcId: "tavern-keeper", playerId: "player-1" },
  input: "我完成了你的任务"
});
// NPC: "太好了！我就知道你能做到！" （关系 +10）
```

**功能：**
- ✅ 动态对话（每次不同）
- ✅ 记住玩家行为
- ✅ 关系系统
- ✅ 个性化任务
- ✅ 动态故事线

**游戏类型：**
- RPG 游戏 NPC
- 文字冒险游戏
- 社交模拟游戏
- 教育游戏

---

### 5. 交互式故事游戏

```typescript
const storyContext = context({
  type: "interactive-story",
  schema: z.object({ playerId: z.string() }),

  create: () => ({
    currentChapter: 1,
    choices: [],
    inventory: [],
    stats: { health: 100, gold: 50 },
    storyline: "neutral"
  }),

  // 根据玩家选择动态生成故事
  instructions: (state) => `
你是一个互动小说的叙述者。
当前章节：${state.memory.currentChapter}
故事线：${state.memory.storyline}
玩家状态：生命 ${state.memory.stats.health}，金币 ${state.memory.stats.gold}

根据玩家的选择推进剧情，记住所有决定，影响后续故事发展。
  `
});

// Episode Hooks - 自动保存剧情章节
storyContext.episodeHooks = {
  shouldStartEpisode: (ref) => ref.ref === "input",
  shouldEndEpisode: (ref) =>
    ref.ref === "output" && ref.data?.includes("章节结束"),

  createEpisode: (logs, ctx) => ({
    chapter: ctx.memory.currentChapter,
    choices: logs.filter(l => l.ref === "action_call").map(l => l.name),
    outcome: logs[logs.length - 1].content
  })
};

const story = createDreams({
  model: anthropic("claude-3-5-sonnet-20241022"), // Claude 擅长创意写作
  contexts: [storyContext]
});
```

---

## 四、商业应用

### 6. 内容创作助手

```typescript
const contentContext = context({
  type: "content-creator",
  schema: z.object({
    userId: z.string(),
    platform: z.enum(["blog", "twitter", "linkedin", "youtube"])
  }),

  create: () => ({
    writingStyle: {},
    topics: [],
    previousContent: [],
    brandVoice: ""
  })
})
  .use((state) => [
    // SEO 优化上下文
    { context: seoContext },

    // 平台特定上下文
    state.args.platform === "twitter"
      ? { context: twitterContext }
      : { context: blogContext }
  ])

  .setActions([
    action({
      name: "analyzeStyle",
      schema: z.object({ sampleText: z.string() }),
      handler: async ({ sampleText }, ctx) => {
        // 分析用户的写作风格
        const style = await analyzeWritingStyle(sampleText);
        ctx.memory.writingStyle = style;
        return { analyzed: true, style };
      }
    }),

    action({
      name: "generateContent",
      schema: z.object({
        topic: z.string(),
        length: z.number(),
        tone: z.enum(["professional", "casual", "humorous"])
      }),
      handler: async ({ topic, length, tone }, ctx) => {
        const content = {
          topic,
          length,
          tone,
          style: ctx.memory.writingStyle,
          platform: ctx.args.platform
        };

        // 生成内容
        const result = await generateWithStyle(content);

        // 记录以便学习
        ctx.memory.previousContent.push({
          content: result,
          timestamp: Date.now(),
          engagement: 0 // 稍后更新
        });

        return { content: result };
      }
    }),

    action({
      name: "schedulePost",
      schema: z.object({
        content: z.string(),
        scheduledTime: z.string()
      }),
      handler: async ({ content, scheduledTime }, ctx) => {
        // 集成到社交媒体 API
        await scheduleToTwitter(content, scheduledTime);
        return { scheduled: true };
      }
    })
  ]);

const contentAssistant = createDreams({
  model: openai("gpt-4o"),
  contexts: [contentContext],
  extensions: [
    twitterExtension({ apiKey: process.env.TWITTER_API_KEY })
  ]
});
```

**功能：**
- ✅ 学习你的写作风格
- ✅ 多平台内容生成
- ✅ SEO 优化
- ✅ 自动发布和调度
- ✅ 内容效果分析

---

### 7. 数据分析助手

```typescript
const analyticsContext = context({
  type: "data-analyst",
  schema: z.object({ userId: z.string() }),

  create: () => ({
    datasets: [],
    insights: [],
    reports: []
  })
})
  .setActions([
    action({
      name: "analyzeDataset",
      schema: z.object({
        datasetUrl: z.string(),
        analysisType: z.enum(["descriptive", "predictive", "diagnostic"])
      }),
      handler: async ({ datasetUrl, analysisType }, ctx) => {
        // 读取数据
        const data = await fetch(datasetUrl).then(r => r.json());

        // 执行分析
        const insights = await performAnalysis(data, analysisType);

        ctx.memory.insights.push({
          type: analysisType,
          findings: insights,
          timestamp: Date.now()
        });

        return { insights };
      }
    }),

    action({
      name: "generateVisualization",
      schema: z.object({
        data: z.array(z.any()),
        chartType: z.enum(["line", "bar", "pie", "scatter"])
      }),
      handler: async ({ data, chartType }, ctx) => {
        const chartUrl = await generateChart(data, chartType);
        return { chartUrl };
      }
    }),

    action({
      name: "createReport",
      schema: z.object({
        title: z.string(),
        sections: z.array(z.string())
      }),
      handler: async ({ title, sections }, ctx) => {
        const report = {
          title,
          sections,
          insights: ctx.memory.insights,
          generatedAt: Date.now()
        };

        ctx.memory.reports.push(report);

        return { reportId: report.generatedAt, report };
      }
    })
  ]);
```

**用途：**
- ✅ 自动化数据分析
- ✅ 生成报告
- ✅ 趋势预测
- ✅ 异常检测

---

## 五、高级应用

### 8. AI Agent Marketplace（付费服务）

```typescript
import { createDreamsRouterAuth } from "@daydreamsai/ai-sdk-provider";
import { createServer } from "h3";

// x402 微支付的 AI 服务
const account = privateKeyToAccount(process.env.PRIVATE_KEY);

const { dreamsRouter } = await createDreamsRouterAuth(account, {
  payments: {
    amount: "100000", // $0.10 per request
    network: "base-sepolia"
  }
});

const premiumAgent = createDreams({
  model: dreamsRouter("anthropic/claude-3-5-sonnet-20241022"),
  contexts: [expertContext]
});

// HTTP API
const app = createServer();

app.use("/api/consult", async (event) => {
  const { question } = await readBody(event);

  // 验证 x402 支付
  const paymentHeader = getHeader(event, "X-Payment");
  if (!paymentHeader) {
    return { error: "Payment required" };
  }

  // 处理请求
  const result = await premiumAgent.send({
    context: expertContext,
    input: question
  });

  return result;
});
```

**应用场景：**
- ✅ 专业咨询服务
- ✅ AI API marketplace
- ✅ 按次付费的 AI 助手
- ✅ Web3 AI 服务

---

### 9. 知识库问答系统（RAG）

```typescript
import { createChromaMemory } from "@daydreamsai/chroma";

const knowledgeContext = context({
  type: "knowledge-base",
  create: () => ({
    documentsIndexed: 0,
    queriesCount: 0
  })
})
  .setActions([
    action({
      name: "indexDocument",
      schema: z.object({
        url: z.string(),
        title: z.string()
      }),
      handler: async ({ url, title }, ctx) => {
        // 读取文档
        const content = await fetch(url).then(r => r.text());

        // 分块
        const chunks = splitIntoChunks(content, 500);

        // 存储到向量数据库
        for (const chunk of chunks) {
          await ctx.agent.memory.remember(chunk, {
            contextId: ctx.id,
            metadata: {
              source: url,
              title,
              type: "document"
            }
          });
        }

        ctx.memory.documentsIndexed++;
        return { indexed: chunks.length };
      }
    }),

    action({
      name: "searchKnowledge",
      schema: z.object({ query: z.string() }),
      handler: async ({ query }, ctx) => {
        // 向量搜索
        const results = await ctx.agent.memory.recall(query, {
          topK: 5,
          filters: { contextId: ctx.id }
        });

        ctx.memory.queriesCount++;
        return { results };
      }
    })
  ]);

const kb = createDreams({
  model: openai("gpt-4o"),
  contexts: [knowledgeContext],
  memory: createChromaMemory({
    url: "http://localhost:8000"
  })
});

// 索引文档
await kb.send({
  context: knowledgeContext,
  input: "索引这个文档：https://docs.example.com"
});

// 查询
await kb.send({
  context: knowledgeContext,
  input: "如何配置 API？"
});
// 自动从文档中找到答案！
```

**功能：**
- ✅ 文档自动索引
- ✅ 语义搜索
- ✅ 上下文感知回答
- ✅ 多文档源

---

### 10. MCP 集成（连接外部工具）

```typescript
import { createMcpExtension } from "@daydreamsai/mcp";

const agent = createDreams({
  model: openai("gpt-4o"),
  extensions: [
    createMcpExtension([
      // 文件系统访问
      {
        id: "filesystem",
        transport: {
          type: "stdio",
          command: "npx",
          args: ["@modelcontextprotocol/server-filesystem", "./docs"]
        }
      },

      // 数据库访问
      {
        id: "database",
        transport: {
          type: "stdio",
          command: "npx",
          args: ["@modelcontextprotocol/server-sqlite", "./data.db"]
        }
      },

      // GitHub 集成
      {
        id: "github",
        transport: {
          type: "stdio",
          command: "npx",
          args: ["@modelcontextprotocol/server-github"]
        },
        env: {
          GITHUB_TOKEN: process.env.GITHUB_TOKEN
        }
      }
    ])
  ],
  contexts: [devAssistantContext]
});

// Agent 自动获得所有 MCP 工具的访问权限
await agent.send({
  context: devAssistantContext,
  input: "读取 docs/README.md 文件，总结内容，然后创建一个 GitHub issue"
});

// Agent 会：
// 1. 使用 filesystem MCP 读取文件
// 2. 总结内容
// 3. 使用 github MCP 创建 issue
```

**可用的 MCP 服务器：**
- ✅ 文件系统
- ✅ 数据库（SQLite, PostgreSQL, MySQL）
- ✅ GitHub, GitLab
- ✅ Google Drive, Dropbox
- ✅ Slack, Discord
- ✅ 浏览器自动化
- ✅ 3D 渲染
- ✅ 更多...

---

## 六、实际案例灵感

### 11. 电商客服机器人

```typescript
const ecommerceContext = context({
  type: "ecommerce-support",
  schema: z.object({
    customerId: z.string(),
    sessionId: z.string()
  }),

  create: () => ({
    cart: [],
    orderHistory: [],
    preferences: {}
  })
})
  .use((state) => [
    { context: productCatalogContext },
    { context: orderManagementContext },
    { context: paymentContext }
  ])

  .setActions([
    action({
      name: "searchProducts",
      schema: z.object({ query: z.string() }),
      handler: async ({ query }, ctx) => {
        const products = await searchProductDatabase(query);
        return { products };
      }
    }),

    action({
      name: "trackOrder",
      schema: z.object({ orderId: z.string() }),
      handler: async ({ orderId }, ctx) => {
        const status = await getOrderStatus(orderId);
        return { status };
      }
    }),

    action({
      name: "recommendProducts",
      handler: async (_, ctx) => {
        // 基于购买历史推荐
        const recommendations = await getRecommendations(
          ctx.memory.orderHistory,
          ctx.memory.preferences
        );
        return { recommendations };
      }
    })
  ]);
```

**功能：**
- ✅ 商品搜索和推荐
- ✅ 订单追踪
- ✅ 退换货处理
- ✅ 个性化服务
- ✅ 多语言支持

---

### 12. 健身教练 AI

```typescript
const fitnessContext = context({
  type: "fitness-coach",
  schema: z.object({ userId: z.string() }),

  create: () => ({
    profile: {
      age: 0,
      weight: 0,
      height: 0,
      goals: []
    },
    workoutHistory: [],
    nutrition: [],
    progress: []
  }),

  instructions: `你是专业的健身教练。
  - 制定个性化训练计划
  - 追踪进度
  - 提供饮食建议
  - 保持动力`
});

fitnessContext.setActions([
  action({
    name: "createWorkoutPlan",
    schema: z.object({
      goal: z.enum(["weight-loss", "muscle-gain", "endurance"]),
      daysPerWeek: z.number(),
      experienceLevel: z.enum(["beginner", "intermediate", "advanced"])
    }),
    handler: async ({ goal, daysPerWeek, experienceLevel }, ctx) => {
      const plan = generateWorkoutPlan({
        goal,
        daysPerWeek,
        experienceLevel,
        profile: ctx.memory.profile
      });

      return { plan };
    }
  }),

  action({
    name: "logWorkout",
    schema: z.object({
      exercises: z.array(z.object({
        name: z.string(),
        sets: z.number(),
        reps: z.number(),
        weight: z.number()
      }))
    }),
    handler: async ({ exercises }, ctx) => {
      ctx.memory.workoutHistory.push({
        exercises,
        date: Date.now()
      });

      // 分析进度
      const progress = analyzeProgress(ctx.memory.workoutHistory);
      ctx.memory.progress.push(progress);

      return { logged: true, progress };
    }
  })
]);
```

---

### 13. 教育导师

```typescript
const tutorContext = context({
  type: "tutor",
  schema: z.object({
    studentId: z.string(),
    subject: z.string()
  }),

  create: () => ({
    learningStyle: "",
    knowledgeLevel: {},
    completedLessons: [],
    strugglingTopics: []
  }),

  // 根据学生水平调整教学
  instructions: (state) => {
    const level = state.memory.knowledgeLevel[state.args.subject] || "beginner";
    return `
你是 ${state.args.subject} 老师。
学生水平：${level}
教学风格：${state.memory.learningStyle}

根据学生水平调整解释难度，使用适合的例子。
    `;
  }
});

tutorContext.setActions([
  action({
    name: "assessKnowledge",
    schema: z.object({
      topic: z.string(),
      questions: z.array(z.string())
    }),
    handler: async ({ topic, questions }, ctx) => {
      // 评估学生对主题的理解
      const assessment = await evaluateAnswers(questions);
      ctx.memory.knowledgeLevel[topic] = assessment.level;

      return { level: assessment.level, feedback: assessment.feedback };
    }
  }),

  action({
    name: "generatePracticeProblems",
    schema: z.object({
      topic: z.string(),
      difficulty: z.enum(["easy", "medium", "hard"]),
      count: z.number()
    }),
    handler: async ({ topic, difficulty, count }, ctx) => {
      const problems = generateProblems(topic, difficulty, count);
      return { problems };
    }
  })
]);
```

---

## 七、技术组合应用

### 14. 全栈 AI 应用架构

```typescript
// 后端 Agent
const backendAgent = createDreams({
  model: openai("gpt-4o"),
  contexts: [apiContext, databaseContext],
  memory: supabaseMemory,
  extensions: [
    createMcpExtension([
      { id: "database", transport: { type: "stdio", ... } },
      { id: "redis", transport: { type: "stdio", ... } }
    ])
  ]
});

// 前端集成
import { useChat } from "@ai-sdk/react";

function ChatComponent() {
  const { messages, input, handleSubmit } = useChat({
    api: "/api/chat",
    body: {
      userId: currentUser.id,
      contextType: "support"
    }
  });

  return (
    <form onSubmit={handleSubmit}>
      {messages.map(m => (
        <div key={m.id}>{m.content}</div>
      ))}
      <input value={input} onChange={handleInputChange} />
    </form>
  );
}

// API 端点
export async function POST(req: Request) {
  const { messages, userId, contextType } = await req.json();

  const result = await backendAgent.send({
    context: supportContext,
    args: { userId },
    input: messages[messages.length - 1].content
  });

  return new Response(JSON.stringify(result));
}
```

---

## 八、总结：你可以用 Daydreams 构建...

### 🎯 个人应用
- ✅ AI 个人助手
- ✅ 学习伴侣
- ✅ 日程管理
- ✅ 笔记系统

### 💼 商业应用
- ✅ 客户服务系统
- ✅ 销售助手
- ✅ 内容创作工具
- ✅ 数据分析助手

### 🎮 游戏和娱乐
- ✅ 游戏 NPC
- ✅ 交互式故事
- ✅ 聊天机器人
- ✅ 角色扮演游戏

### 🌐 社交平台
- ✅ Discord bot
- ✅ Twitter bot
- ✅ Telegram bot
- ✅ 社区管理

### 🔬 技术应用
- ✅ 知识库 RAG
- ✅ 代码助手
- ✅ DevOps 自动化
- ✅ API 网关

### 💰 Web3 应用
- ✅ 付费 AI 服务（x402）
- ✅ DeFi agent
- ✅ NFT 交互
- ✅ 链上 agent

---

## 九、快速开始模板

### 最小化示例（5 分钟）

```typescript
import { createDreams, context } from "@daydreamsai/core";
import { openai } from "@ai-sdk/openai";

const myContext = context({
  type: "my-app",
  instructions: "你是一个有帮助的助手"
});

const agent = createDreams({
  model: openai("gpt-4o-mini"),
  contexts: [myContext]
});

await agent.start();
await agent.send({
  context: myContext,
  input: "你好！"
});
```

### 生产就绪模板

```bash
# 使用脚手架
npx create-daydreams-agent my-app

cd my-app
npm install
npm run dev
```

---

## 十、学习路径

### 初学者（1-2 天）
1. 运行基础示例
2. 理解 Context 和 Action
3. 构建简单聊天 bot

### 中级（1 周）
4. 多上下文组合
5. 添加内存持久化
6. 集成一个平台（Discord/Twitter）

### 高级（2-4 周）
7. MCP 集成
8. 自定义 Prompt Builder
9. x402 支付集成
10. 构建完整应用

---

**立即开始：**
```bash
npm install @daydreamsai/core @ai-sdk/openai zod
```

**文档：** [docs.dreams.fun](https://docs.dreams.fun)
**示例：** [github.com/daydreamsai/daydreams/tree/main/examples](https://github.com/daydreamsai/daydreams/tree/main/examples)
**Discord：** [discord.gg/rt8ajxQvXh](https://discord.gg/rt8ajxQvXh)

你想构建什么？🚀

# Daydreams AI 路由支持详解

## 一、支持的 AI 提供商

Daydreams 通过两种方式支持多种 AI 模型：

### 1. **直接集成（Vercel AI SDK）**

通过 Vercel AI SDK，Daydreams 直接支持以下提供商：

#### **OpenAI** (`@ai-sdk/openai` v2.0.56)
```typescript
import { openai } from "@ai-sdk/openai";

const agent = createDreams({
  model: openai("gpt-4o"),           // 最强大
  // model: openai("gpt-4o-mini"),    // 快速且便宜
  // model: openai("gpt-3.5-turbo"),  // 最便宜
})
```

**支持的模型：**
- `gpt-4o` - GPT-4 Omni，最新最强大
- `gpt-4o-mini` - GPT-4 Omni 精简版，快速且便宜
- `gpt-4-turbo` - GPT-4 Turbo
- `gpt-4` - GPT-4 标准版
- `gpt-3.5-turbo` - GPT-3.5，最便宜

**API Key：** [platform.openai.com](https://platform.openai.com/api-keys)

---

#### **Anthropic** (`@ai-sdk/anthropic` v2.0.38)
```typescript
import { anthropic } from "@ai-sdk/anthropic";

const agent = createDreams({
  model: anthropic("claude-3-5-sonnet-20241022"),  // 最新 Sonnet
  // model: anthropic("claude-3-opus-20240229"),    // 最强大
  // model: anthropic("claude-3-haiku-20240307"),   // 最快最便宜
})
```

**支持的模型：**
- `claude-3-5-sonnet-20241022` - Claude 3.5 Sonnet（最新）
- `claude-3-opus-20240229` - Claude 3 Opus，最强大
- `claude-3-sonnet-20240229` - Claude 3 Sonnet，平衡性能
- `claude-3-haiku-20240307` - Claude 3 Haiku，最快最便宜

**API Key：** [console.anthropic.com](https://console.anthropic.com/)

---

#### **Google** (`@ai-sdk/google` v2.0.24)
```typescript
import { google } from "@ai-sdk/google";

const agent = createDreams({
  model: google("gemini-2.5-flash"),     // 最新 Flash
  // model: google("gemini-1.5-pro"),    // Pro 版本
  // model: google("gemini-1.5-flash"),  // 上一代 Flash
})
```

**支持的模型：**
- `gemini-2.5-flash` - Gemini 2.5 Flash（最新）
- `gemini-1.5-pro` - Gemini 1.5 Pro
- `gemini-1.5-flash` - Gemini 1.5 Flash

**API Key：** [aistudio.google.com](https://aistudio.google.com/app/apikey)

---

#### **Groq** (`@ai-sdk/groq` v2.0.25)
```typescript
import { createGroq } from "@ai-sdk/groq";

const groq = createGroq();

const agent = createDreams({
  model: groq("llama3-70b-8192"),        // Llama 3 70B，高质量
  // model: groq("llama3-8b-8192"),      // Llama 3 8B，极快
  // model: groq("mixtral-8x7b-32768"),  // Mixtral，长上下文
})
```

**支持的模型：**
- `llama3-70b-8192` - Meta Llama 3 70B（8K 上下文）
- `llama3-8b-8192` - Meta Llama 3 8B（超快）
- `mixtral-8x7b-32768` - Mixtral 8x7B（32K 上下文）
- `gemma-7b-it` - Google Gemma 7B

**特点：** 极快的推理速度（可达 500+ tokens/s）

**API Key：** [console.groq.com](https://console.groq.com/keys)

---

#### **OpenRouter** (`@openrouter/ai-sdk-provider` v0.4.5)

> **这是 OpenRouter 官方为 Vercel AI SDK 提供的 Provider**，支持数百个模型！

```typescript
import { openrouter } from "@openrouter/ai-sdk-provider";

const agent = createDreams({
  model: openrouter("anthropic/claude-3-opus"),
  // model: openrouter("google/gemini-pro"),
  // model: openrouter("meta-llama/llama-3-70b"),
  // model: openrouter("mistralai/mixtral-8x7b-instruct"),
  // model: openrouter("deepseek/deepseek-chat"),
  // 数百个其他模型！
})
```

**支持的模型类别（200+ 模型）：**
- ✅ **所有主流闭源模型**：
  - OpenAI (GPT-4, GPT-4 Turbo, GPT-3.5)
  - Anthropic (Claude 3.5, Claude 3 系列)
  - Google (Gemini Pro, Gemini Flash)
  - xAI (Grok)
  - Perplexity (Sonar 系列)

- ✅ **开源模型**：
  - Meta Llama 系列 (Llama 3.1, Llama 3, Llama 2)
  - Mistral 系列 (Mixtral, Mistral 7B/8x7B/8x22B)
  - Qwen 系列 (通义千问)
  - DeepSeek 系列
  - Yi 系列
  - Nous Hermes 系列

- ✅ **专业模型**：
  - 代码生成模型 (CodeLlama, WizardCoder)
  - 图像生成模型 (DALL-E, Stable Diffusion)
  - 视觉模型 (GPT-4 Vision, LLaVA)

**核心特点：**
- 🌐 **一个 API 访问所有模型** - 无需多个 API Key
- 💰 **智能路由** - 自动选择最便宜/最快的提供商
- 🔄 **自动故障转移** - 主模型不可用时自动切换
- 📊 **统一计费** - 一个账户管理所有模型费用
- 🆓 **免费额度** - 新用户有免费试用额度

**模型命名格式：** `provider/model-name`
- `openai/gpt-4`
- `anthropic/claude-3-opus`
- `meta-llama/llama-3-70b-instruct`
- `google/gemini-pro`

**获取 API Key：** [openrouter.ai/keys](https://openrouter.ai/keys)

**查看所有可用模型：** [openrouter.ai/models](https://openrouter.ai/models)

---

### 2. **Dreams Router（统一网关）**

Dreams Router 是 Daydreams 自己的 AI 网关，提供统一接口访问多个提供商。

#### **安装**
```bash
npm install @daydreamsai/ai-sdk-provider
```

#### **使用方式**

**方式 1：API Key 认证**
```typescript
import { dreamsrouter } from "@daydreamsai/ai-sdk-provider";

const agent = createDreams({
  model: dreamsrouter("openai/gpt-4o"),
  // model: dreamsrouter("anthropic/claude-3-5-sonnet-20241022"),
  // model: dreamsrouter("google-vertex/gemini-2.5-flash"),
  // model: dreamsrouter("groq/llama-3.1-405b-reasoning"),
})

// 需要设置环境变量：
// DREAMS_ROUTER_API_KEY=your_key
```

**方式 2：x402 微支付（无需 API Key）**
```typescript
import { createDreamsRouterAuth } from "@daydreamsai/ai-sdk-provider";
import { privateKeyToAccount } from "viem/accounts";

const account = privateKeyToAccount("0x...your-private-key");

const { dreamsRouter } = await createDreamsRouterAuth(account, {
  payments: {
    amount: "100000",         // $0.10 USDC per request
    network: "base-sepolia",  // or "base" for mainnet
  },
});

const agent = createDreams({
  model: dreamsRouter("google-vertex/gemini-2.5-flash"),
})
```

---

#### **Dreams Router 支持的模型**

**格式：** `provider/model-name`

##### **OpenAI 系列**
```typescript
dreamsrouter("openai/gpt-4o")
dreamsrouter("openai/gpt-4o-mini")
dreamsrouter("openai/gpt-4-turbo")
dreamsrouter("openai/gpt-3.5-turbo")
```

##### **Anthropic 系列**
```typescript
dreamsrouter("anthropic/claude-3-5-sonnet-20241022")
dreamsrouter("anthropic/claude-3-opus-20240229")
dreamsrouter("anthropic/claude-3-sonnet-20240229")
dreamsrouter("anthropic/claude-3-haiku-20240307")
```

##### **Google 系列**
```typescript
dreamsrouter("google/gemini-pro")
dreamsrouter("google/gemini-flash")

// Google Vertex AI
dreamsrouter("google-vertex/gemini-2.5-flash")
dreamsrouter("google-vertex/gemini-1.5-pro")
```

##### **Groq 系列**
```typescript
dreamsrouter("groq/llama-3.1-405b-reasoning")
dreamsrouter("groq/llama3-70b-8192")
dreamsrouter("groq/llama3-8b-8192")
dreamsrouter("groq/mixtral-8x7b-32768")
```

##### **xAI (Grok)**
```typescript
dreamsrouter("xai/grok-beta")
```

---

## 二、功能对比

### 三种路由方式对比

| 特性 | 直接集成 (AI SDK) | OpenRouter | Dreams Router |
|------|-------------------|-----------|---------------|
| **模型数量** | 单一提供商 | 200+ 模型 | 100+ 模型 |
| **API Key** | 需要每个提供商的 Key | 只需一个 OpenRouter Key | 只需一个 Key 或支付 |
| **切换模型** | 改代码 + 换 Key | 只改模型名 | 只改模型名 |
| **支付方式** | 各提供商单独付费 | 统一计费 | API Key 或 x402 微支付 |
| **故障转移** | 需自己实现 | ✅ 智能路由 | ✅ 自动转移 |
| **成本追踪** | 需自己实现 | ✅ 统一账单 | ✅ 内置追踪 |
| **免费额度** | 各提供商单独 | ✅ 新用户有额度 | 看具体提供商 |
| **OpenAI 兼容** | ✅ 原生 | ✅ 完全兼容 | ✅ 完全兼容 |
| **智能选择** | ❌ 无 | ✅ 自动选最优 | ⚠️ 手动选择 |
| **开源模型** | ❌ 有限 | ✅ 大量支持 | ⚠️ 部分支持 |

**使用建议：**
- **直接集成** - 只用 1-2 个特定模型，需要最低延迟
- **OpenRouter** - 想试用多种模型，包括大量开源模型，自动优化成本
- **Dreams Router** - 使用 x402 微支付，或需要 Daydreams 官方支持

---

## 三、模型选择建议

### 按场景选择

#### **开发/测试**
- ✅ **Groq Llama3-8B** - 极快，免费额度大
- ✅ **OpenAI GPT-4o-mini** - 快速且便宜（$0.15/1M tokens）
- ✅ **Google Gemini Flash** - 非常便宜

```typescript
const devAgent = createDreams({
  model: groq("llama3-8b-8192"),  // 超快迭代
})
```

#### **生产环境**
- ✅ **OpenAI GPT-4o** - 最佳综合能力
- ✅ **Anthropic Claude-3.5-Sonnet** - 优秀的推理能力
- ✅ **Google Gemini 2.5 Flash** - 性价比高

```typescript
const prodAgent = createDreams({
  model: openai("gpt-4o"),  // 高质量
})
```

#### **成本优化**
- ✅ **OpenAI GPT-3.5-turbo** - $0.50/1M tokens
- ✅ **Anthropic Claude-3-Haiku** - $0.25/1M tokens
- ✅ **Google Gemini Flash** - 免费额度 + 便宜

```typescript
const budgetAgent = createDreams({
  model: google("gemini-2.5-flash"),  // 极低成本
})
```

#### **复杂推理**
- ✅ **Anthropic Claude-3-Opus** - 最强推理
- ✅ **OpenAI GPT-4o** - 综合能力强
- ✅ **Groq Llama-3.1-405B** - 开源最强推理

```typescript
const reasoningAgent = createDreams({
  model: anthropic("claude-3-opus-20240229"),  // 深度思考
})
```

#### **长上下文**
- ✅ **Anthropic Claude-3** - 200K tokens
- ✅ **Google Gemini 1.5 Pro** - 2M tokens
- ✅ **Groq Mixtral** - 32K tokens（极快）

```typescript
const longContextAgent = createDreams({
  model: google("gemini-1.5-pro"),  // 超长上下文
})
```

---

## 四、环境变量配置

### 直接集成方式

```bash title=".env"
# OpenAI
OPENAI_API_KEY=sk-...

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Google
GOOGLE_GENERATIVE_AI_API_KEY=AI...

# Groq
GROQ_API_KEY=gsk_...

# OpenRouter
OPENROUTER_API_KEY=sk-or-...
```

### Dreams Router 方式

```bash title=".env"
# Dreams Router API Key
DREAMS_ROUTER_API_KEY=your_key_here

# 或者使用 x402 支付（不需要 API Key）
# 使用钱包私钥进行微支付
```

---

## 五、高级用法

### 动态切换模型

```typescript
// 根据用户等级使用不同模型
const getModel = (userTier: string) => {
  switch (userTier) {
    case "premium":
      return openai("gpt-4o");
    case "standard":
      return openai("gpt-4o-mini");
    default:
      return google("gemini-2.5-flash");
  }
}

const agent = createDreams({
  model: getModel(user.tier),
})
```

### 自定义配置

```typescript
import { createOpenAI } from "@ai-sdk/openai";

// 自定义 OpenAI 配置
const customOpenAI = createOpenAI({
  apiKey: process.env.CUSTOM_OPENAI_KEY,
  baseURL: "https://your-proxy.com/v1",  // 使用代理
  headers: {
    "Custom-Header": "value"
  }
});

const agent = createDreams({
  model: customOpenAI("gpt-4o"),
})
```

### 故障转移

```typescript
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";

const createAgentWithFallback = async () => {
  try {
    return createDreams({
      model: openai("gpt-4o"),  // 首选
    });
  } catch (error) {
    console.log("OpenAI 失败，切换到 Anthropic");
    return createDreams({
      model: anthropic("claude-3-5-sonnet-20241022"),  // 备选
    });
  }
}
```

---

## 六、价格对比（每百万 tokens）

### Input Tokens

| 模型 | Input 价格 |
|------|-----------|
| GPT-4o | $2.50 |
| GPT-4o-mini | $0.15 |
| GPT-3.5-turbo | $0.50 |
| Claude-3-Opus | $15.00 |
| Claude-3-Sonnet | $3.00 |
| Claude-3-Haiku | $0.25 |
| Gemini 1.5 Pro | $1.25 |
| Gemini 2.5 Flash | 免费额度 + $0.075 |
| Groq (所有模型) | 免费（有限额） |

### Output Tokens

| 模型 | Output 价格 |
|------|-----------|
| GPT-4o | $10.00 |
| GPT-4o-mini | $0.60 |
| GPT-3.5-turbo | $1.50 |
| Claude-3-Opus | $75.00 |
| Claude-3-Sonnet | $15.00 |
| Claude-3-Haiku | $1.25 |
| Gemini 1.5 Pro | $5.00 |
| Gemini 2.5 Flash | 免费额度 + $0.30 |
| Groq (所有模型) | 免费（有限额） |

---

## 七、详细使用示例

### 示例 1：使用 OpenRouter（推荐新手）

OpenRouter 让你可以用一个 API Key 访问数百个模型，非常适合实验和对比不同模型。

```typescript
import { createDreams, context } from "@daydreamsai/core";
import { openrouter } from "@openrouter/ai-sdk-provider";

const chatContext = context({
  type: "chat",
  instructions: "你是一个友好的助手"
});

// ✅ OpenRouter 的优势：轻松切换不同模型
const agent = createDreams({
  // 尝试不同模型只需改一行！

  // 闭源模型
  model: openrouter("anthropic/claude-3-5-sonnet"),
  // model: openrouter("openai/gpt-4"),
  // model: openrouter("google/gemini-pro"),

  // 开源模型
  // model: openrouter("meta-llama/llama-3-70b-instruct"),
  // model: openrouter("mistralai/mixtral-8x7b-instruct"),
  // model: openrouter("qwen/qwen-2-72b-instruct"),  // 通义千问

  contexts: [chatContext]
});

await agent.start();
await agent.send({
  context: chatContext,
  input: "用中文介绍一下你自己"
});
```

**环境变量：**
```bash
OPENROUTER_API_KEY=sk-or-v1-xxxxx
```

**获取 API Key：**
1. 访问 [openrouter.ai](https://openrouter.ai)
2. 注册账号（有免费额度）
3. 前往 [Keys 页面](https://openrouter.ai/keys) 创建 API Key

**查看所有模型：** [openrouter.ai/models](https://openrouter.ai/models)

---

### 示例 2：简单聊天 Bot（直接集成）

```typescript
import { createDreams, context } from "@daydreamsai/core";
import { openai } from "@ai-sdk/openai";

const chatContext = context({
  type: "chat",
  instructions: "你是一个友好的助手"
});

const agent = createDreams({
  model: openai("gpt-4o-mini"),  // 快速且便宜
  contexts: [chatContext]
});

await agent.start();
await agent.send({
  context: chatContext,
  input: "你好！"
});
```

### 示例 2：使用 Dreams Router

```typescript
import { createDreams, context } from "@daydreamsai/core";
import { dreamsrouter } from "@daydreamsai/ai-sdk-provider";

const agent = createDreams({
  // ✅ 一行代码切换任何模型
  model: dreamsrouter("google-vertex/gemini-2.5-flash"),
  contexts: [chatContext]
});
```

### 示例 3：x402 微支付

```typescript
import { createDreamsRouterAuth } from "@daydreamsai/ai-sdk-provider";
import { privateKeyToAccount } from "viem/accounts";

const account = privateKeyToAccount(process.env.PRIVATE_KEY);

const { dreamsRouter } = await createDreamsRouterAuth(account, {
  payments: {
    amount: "100000",         // $0.10 per request
    network: "base-sepolia"
  }
});

const agent = createDreams({
  model: dreamsRouter("anthropic/claude-3-5-sonnet-20241022"),
  contexts: [assistantContext]
});

// ✅ 无需 API Key，按使用付费！
```

---

## 八、FAQ

### Q: OpenRouter 和 Dreams Router 有什么区别？

**OpenRouter** (`@openrouter/ai-sdk-provider`)：
- 🌐 第三方服务（OpenRouter 公司提供）
- 🎯 200+ 模型，包括大量开源模型
- 💰 统一计费，自动选择最优提供商
- 🆓 新用户有免费额度
- 📖 官网：[openrouter.ai](https://openrouter.ai)

**Dreams Router** (`@daydreamsai/ai-sdk-provider`)：
- 🏠 Daydreams 官方网关
- 🎯 100+ 主流模型
- 💳 支持 x402 微支付（USDC，无需订阅）
- 🔧 Daydreams 官方维护和支持
- 📖 官网：[router.daydreams.systems](https://router.daydreams.systems)

### Q: 应该选择哪个路由？

**选择 OpenRouter 如果：**
- ✅ 想尝试**数百个不同模型**
- ✅ 想用**开源模型**（Llama, Mistral, Qwen 等）
- ✅ 需要**智能路由**（自动选最优提供商）
- ✅ 想要**统一账单**，不想管理多个 API Key
- ✅ 是新手，想**免费试用**各种模型

**选择 Dreams Router 如果：**
- ✅ 想用 **x402 微支付**（USDC，按使用付费）
- ✅ 需要 **Daydreams 官方支持**
- ✅ 只关注主流闭源模型

**选择直接集成如果：**
- ✅ 已有某个提供商的 API Key
- ✅ 只使用 1-2 个特定模型
- ✅ 需要最低延迟

### Q: Groq 为什么这么快？

Groq 使用专用的 LPU（Language Processing Unit）硬件加速，推理速度可达 500+ tokens/秒，是普通 GPU 的 10 倍以上。

### Q: 如何获得免费额度？

- **Groq** - 注册即有免费额度
- **Google Gemini** - 慷慨的免费额度
- **OpenAI** - 新账户有 $5 免费额度
- **Anthropic** - 新账户有少量免费额度

### Q: Dreams Router 收费吗？

- API Key 方式：按提供商原价 + 小额服务费
- x402 支付：按实际使用的 USDC 支付，无月费

---

## 九、总结

### Daydreams 支持三种方式访问 AI 模型

#### **1️⃣ 直接集成（适合固定使用 1-2 个模型）**
✅ **OpenAI** (GPT-4o, GPT-4o-mini, GPT-3.5-turbo)
✅ **Anthropic** (Claude 3.5, Claude 3 Opus/Sonnet/Haiku)
✅ **Google** (Gemini 2.5 Flash, Gemini 1.5 Pro)
✅ **Groq** (Llama 3, Mixtral, Gemma - 极快免费)

#### **2️⃣ OpenRouter（推荐新手和实验）**
✅ **200+ 模型** - 一个 API Key 访问所有模型
✅ **智能路由** - 自动选择最优提供商
✅ **开源模型丰富** - Llama, Mistral, Qwen, DeepSeek 等
✅ **免费额度** - 新用户可免费试用
✅ **统一计费** - 无需管理多个账户

#### **3️⃣ Dreams Router（适合 x402 支付）**
✅ **100+ 主流模型** - OpenAI, Anthropic, Google, xAI 等
✅ **x402 微支付** - USDC 支付，无需订阅
✅ **官方支持** - Daydreams 团队维护

### 推荐组合

**最佳性价比：**
```typescript
开发：Groq Llama3-8B（免费 + 极快）
生产：Google Gemini 2.5 Flash（便宜 + 好用）
```

**最佳质量：**
```typescript
开发：OpenAI GPT-4o-mini
生产：OpenAI GPT-4o 或 Claude-3.5-Sonnet
```

**最灵活：**
```typescript
使用 Dreams Router，随时切换任何模型
```

---

**相关资源：**
- [AI SDK 文档](https://sdk.vercel.ai/docs)
- [Dreams Router 文档](https://router.daydreams.systems/docs)
- [模型价格对比](https://artificialanalysis.ai/)
- [x402 协议](https://www.x402.org/)

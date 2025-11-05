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
```typescript
import { openrouter } from "@openrouter/ai-sdk-provider";

const agent = createDreams({
  model: openrouter("anthropic/claude-3-opus"),
  // model: openrouter("google/gemini-pro"),
  // model: openrouter("meta-llama/llama-3-70b"),
  // 100+ 其他模型！
})
```

**支持 100+ 模型，包括：**
- 所有 OpenAI 模型（GPT-4, GPT-3.5 等）
- 所有 Anthropic 模型（Claude 系列）
- 所有 Google 模型（Gemini 系列）
- Meta Llama 系列
- Mistral 系列
- 以及更多开源模型

**特点：** 一个 API 访问所有模型，自动选择最便宜/最快的提供商

**API Key：** [openrouter.ai](https://openrouter.ai/keys)

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

### 直接集成 vs Dreams Router

| 特性 | 直接集成 (AI SDK) | Dreams Router |
|------|-------------------|---------------|
| **模型数量** | 依赖具体提供商 | 100+ 模型 |
| **API Key** | 需要每个提供商的 Key | 只需一个 Key 或支付 |
| **切换模型** | 改代码 + 换 Key | 只改模型名 |
| **支付方式** | 月订阅/预付费 | API Key 或 x402 微支付 |
| **故障转移** | 需自己实现 | ✅ 自动 |
| **成本追踪** | 需自己实现 | ✅ 内置 |
| **OpenAI 兼容** | 部分兼容 | ✅ 完全兼容 |

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

## 七、使用示例

### 示例 1：简单聊天 Bot

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

### Q: 应该选择直接集成还是 Dreams Router？

**直接集成：**
- ✅ 已有某个提供商的 API Key
- ✅ 只使用 1-2 个模型
- ✅ 需要最低延迟

**Dreams Router：**
- ✅ 想尝试多个模型
- ✅ 需要自动故障转移
- ✅ 想用 x402 微支付
- ✅ 需要统一的成本追踪

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

### 支持的提供商总览

✅ **OpenAI** (GPT-4o, GPT-4o-mini, GPT-3.5-turbo)
✅ **Anthropic** (Claude 3.5, Claude 3 Opus/Sonnet/Haiku)
✅ **Google** (Gemini 2.5 Flash, Gemini 1.5 Pro)
✅ **Groq** (Llama 3, Mixtral, Gemma)
✅ **OpenRouter** (100+ 模型)
✅ **xAI** (Grok, 通过 Dreams Router)

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

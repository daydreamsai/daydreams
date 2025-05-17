# Using `@daydreamsai/genai` alongside `@daydreamsai/discord`

Daydreams GenAI depends on `@ai-sdk/google`'s `createGoogleGenerativeAI`

---

    model: createGoogleGenerativeAI({
        apiKey: env.GEMINI_API_KEY,
    })("gemini-2.5-flash-preview-04-17"),

---

## **Setup**

**1.** Install dependencies from root:

```bash
bun install
```

**2.** For obvious reasons:

```bash
bun i @ai-sdk/google
```

**3.** Add your google and discord keys to your root `.env`:

```bash
GEMINI_API_KEY=
DISCORD_TOKEN=
DISCORD_BOT_NAME=
```

**4.** Spin up

```bash
bun run examples/genai/example-genai.ts
```

---

### **Notes**

**_Discord extension use is optional, just remove discord from the extensions
array in createDreams_**

```ts
const agent = createDreams({
  model: createGoogleGenerativeAI({
    apiKey: env.GEMINI_API_KEY,
  })("gemini-2.5-flash-preview-04-17"),
  logger: new Logger({ level: LogLevel.DEBUG }),
  extensions: [genai],
});
```

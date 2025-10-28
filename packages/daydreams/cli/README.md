# @daydreamsai/cli

Command-line interface context and utilities for Daydreams agents, enabling interactive terminal-based conversations.

## Installation

```bash
npm install @daydreamsai/cli
```

## Quick Start

```typescript
import { createDreams } from '@daydreamsai/core';
import { cliExtension } from '@daydreamsai/cli';
import { openai } from '@ai-sdk/openai';

// Create an agent with CLI support
const agent = createDreams({
  model: openai('gpt-4'),
  extensions: [cliExtension()]
});

await agent.start();

// The CLI will automatically start an interactive session
// Type messages and get responses in the terminal
// Type "exit" to quit
```

## Features

- 🖥️ **Interactive Terminal Interface**: Built-in readline interface for conversations
- 📥 **CLI Input Handler**: Automatic message handling from terminal input
- 📤 **CLI Output Handler**: Formatted responses to terminal
- 🔄 **Session Management**: Persistent CLI sessions with context
- 🛠️ **Service Integration**: Readline service for input management

## Components

### CLI Context

The CLI context provides a terminal-based conversation interface:

```typescript
import { cli } from '@daydreamsai/cli';

// Use directly with an agent
const agent = createDreams({
  contexts: [cli],
  // ... other config
});
```

### CLI Extension

Bundles everything needed for CLI interactions:

```typescript
import { cliExtension } from '@daydreamsai/cli';

const extension = cliExtension();
// Includes: CLI context, readline service, input/output handlers
```

### Readline Service

Manages terminal I/O operations:

```typescript
import { readlineService } from '@daydreamsai/cli';

// Registered automatically with cliExtension
// Provides readline interface to other components
```

## Usage Examples

### Basic CLI Agent

```typescript
import { createDreams, action } from '@daydreamsai/core';
import { cliExtension } from '@daydreamsai/cli';
import { openai } from '@ai-sdk/openai';
import * as z from 'zod';

// Define actions for the CLI agent
const calculateAction = action({
  name: 'calculate',
  description: 'Perform calculations',
  schema: z.object({
    expression: z.string()
  }),
  handler: async ({ call }) => {
    // Simple eval for demo (use math library in production)
    const result = eval(call.data.expression);
    return { result };
  }
});

const agent = createDreams({
  model: openai('gpt-4'),
  extensions: [cliExtension()],
  actions: [calculateAction]
});

await agent.start();
console.log('CLI Agent started. Type "exit" to quit.');
```

### Custom CLI Context

```typescript
import { context, input, output } from '@daydreamsai/core';
import * as z from 'zod';

const customCli = context({
  type: 'custom-cli',
  schema: z.object({
    username: z.string(),
    sessionId: z.string()
  }),
  inputs: {
    'terminal:input': input({
      async subscribe(send, { args }) {
        // Custom input handling
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
          prompt: `${args.username}> `
        });
        
        // ... handle input
      }
    })
  },
  outputs: {
    'terminal:output': output({
      schema: z.object({
        message: z.string(),
        formatting: z.enum(['plain', 'markdown', 'code'])
      }),
      handler({ data }) {
        // Custom output formatting
        switch(data.formatting) {
          case 'code':
            console.log('```\n' + data.message + '\n```');
            break;
          default:
            console.log(data.message);
        }
      }
    })
  }
});
```

## API Reference

### `cli`

Pre-configured CLI context with:
- **Type**: `'cli'`
- **Schema**: `{ user: z.string() }`
- **Max Steps**: 100
- **Inputs**: `cli:message` - Handles terminal input
- **Outputs**: `cli:message` - Sends responses to terminal

### `cliExtension()`

Creates a CLI extension bundle containing:
- CLI context
- Readline service
- Input/output handlers

### `readlineService`

Service that provides readline interface for terminal I/O.

## Integration with Other Packages

Works seamlessly with other Daydreams packages:

```typescript
import { createDreams } from '@daydreamsai/core';
import { cliExtension } from '@daydreamsai/cli';
import { browserExtension } from '@daydreamsai/browser';

const agent = createDreams({
  extensions: [
    cliExtension(),     // Terminal interface
    browserExtension()  // Web automation
  ]
});

// Agent can now interact via CLI and control browser
```

## Examples

- [Basic CLI](../../examples/basic) - Simple CLI conversation
- [CLI with Actions](../../examples/cli-actions) - Using actions in CLI
- [Multi-Mode](../../examples/multi-mode) - CLI + other interfaces

## Best Practices

1. **Exit Handling**: Always provide a way to exit (default: type "exit")
2. **Error Display**: Format errors clearly in terminal output
3. **Input Validation**: Validate user input before processing
4. **Session State**: Use context args to maintain session info
5. **Output Formatting**: Use appropriate formatting for readability

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for development guidelines.

## License

MIT
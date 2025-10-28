# AI Assistant Nano Service

This example demonstrates how to create a paid AI assistant service using
Daydreams and x402 payment middleware. Users pay $0.1 per request to interact
with the AI assistant.

## Features

- 💰 **Micropayments**: $0.1 per AI request using x402
- 🧠 **Stateful Sessions**: Maintains conversation history per session
- 🔧 **Context-Aware**: Remembers previous queries and interactions
- 🚀 **Production Ready**: Built with Hono for high performance

## Setup

1. Install dependencies:

```bash
bun install
```

2. Create a `.env` file with your configuration:

```env
# x402 Payment Configuration
FACILITATOR_URL=
ADDRESS=0xYourWalletAddressHere
NETWORK=base-sepolia

// For payments
PRIVATE_KEY=
```

3. Run the server:

```bash
bun run dev
```

The server will start on port 4021.

## API Endpoints

### GET `/` - Service Info (Free)

Returns information about the service and available endpoints.

### GET `/health` - Health Check (Free)

Returns the service status.

### POST `/assistant` - AI Assistant ($0.01 per request)

Send a query to the AI assistant.

**Request Body:**

```json
{
  "query": "Your question here",
  "sessionId": "optional-session-id"
}
```

**Response:**

```json
{
  "response": "AI assistant's response",
  "sessionId": "session-id",
  "requestCount": 5
}
```

## Example Usage

### Using the x402 Client

The included client demonstrates automatic payment handling using `x402-fetch`:

```javascript
import { wrapFetchWithPayment } from "x402-fetch";
import { privateKeyToAccount } from "viem/accounts";

// Create payment-enabled fetch
const account = privateKeyToAccount(privateKey);
const fetchWithPayment = wrapFetchWithPayment(fetch, account);

// Make a paid request - payment is handled automatically
const response = await fetchWithPayment("http://localhost:4021/assistant", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ query: "Hello AI!" }),
});

// Get payment details
const paymentInfo = decodeXPaymentResponse(
  response.headers.get("x-payment-response")
);
console.log("Payment:", paymentInfo);
```

## How It Works

1. **Payment Middleware**: The x402 middleware handles micropayments before
   requests reach the AI
2. **Context Management**: Each session maintains its own context and
   conversation history
3. **Memory Persistence**: The agent remembers previous interactions within a
   session
4. **Rate Limiting**: Built-in through the payment requirement

## Architecture

```
Client Request → x402 Payment → Daydreams Agent → Response
                     ↓
                  Payment
                 Processing
```

## Customization

You can customize:

- **Pricing**: Change the price in the middleware configuration
- **Model**: Switch to different AI models (gpt-4, claude, etc.)
- **Context**: Modify the assistant's behavior and memory structure
- **Actions**: Add custom actions for specific functionality

## Client Examples

The `client.ts` file shows how to interact with the nano service:

```bash
# Run example requests
bun run client:examples

```

## Deployment to Google Cloud Run

### Quick Deploy

1. Set up your environment:

```bash
# Create production environment file
cp .env .env.production

# Edit .env.production with your production keys
vim .env.production
```

2. Deploy to Cloud Run:

```bash
# Deploy with default settings (daydreams-labs-staging project)
bun run deploy

# Or deploy to your own GCP project
GCP_PROJECT_ID=your-project-id ./deploy.sh
```

3. Your service will be available at:
   - `https://ai-assistant.agent.daydreams.systems`

### Manual Deployment Steps

If you prefer to deploy manually:

```bash
# Install the Daydreams deploy CLI
pnpm add -g @daydreamsai/deploy

# Deploy the service
daydreams-deploy deploy \
  --name ai-assistant \
  --project your-gcp-project \
  --region us-central1 \
  --file server.ts \
  --env .env.production \
  --memory 512Mi \
  --max-instances 10
```

### Testing Your Deployment

```bash
# Health check (free)
curl https://ai-assistant.agent.daydreams.systems/health

# Service info (free)
curl https://ai-assistant.agent.daydreams.systems/

# AI request with payment (using the client)
bun run client.ts --url https://ai-assistant.agent.daydreams.systems
```

### Monitoring

View logs and metrics:

```bash
# View logs
daydreams-deploy logs ai-assistant --project your-project

# Follow logs in real-time
daydreams-deploy logs ai-assistant --project your-project --follow

# List all deployments
daydreams-deploy list --project your-project
```

### Update or Remove

```bash
# Update deployment (redeploy)
bun run deploy

# Remove deployment
daydreams-deploy delete ai-assistant --project your-project
```

## Production Considerations

- Use environment variables for all sensitive data
- Consider adding rate limiting beyond payments
- Implement proper error handling and logging
- Add monitoring and analytics
- Consider using a database for persistent storage
- Add authentication for user-specific data
- Implement proper CORS handling for web clients
- Set up alerts for service health and usage
- Configure auto-scaling based on traffic patterns
- Use Cloud Secret Manager for sensitive keys

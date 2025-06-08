import { createClient } from "@daydreamsai/transport/client";
import { createHttpClientTransport } from "@daydreamsai/transport/http/client";

const client = createClient(
  createHttpClientTransport({ url: "http://localhost:8888" })
);

const res = await client.getContext({
  context: "test",
  args: { id: "foo" },
});

console.log({ res });

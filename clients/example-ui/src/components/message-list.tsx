export interface MessageType {
  id: string;
  type:
    | "user"
    | "assistant"
    | "thought"
    | "system"
    | "error"
    | "other"
    | "welcome"
    | "info";
  message?: string;
  error?: string;
}

interface MessagesListProps {
  messages: MessageType[];
}

export function MessagesList({ messages }: MessagesListProps) {
  console.log("messages", messages);
  return (
    <div className="flex flex-col space-y-4 w-1/2 mx-auto">
      {messages.map((msg, i) => {
        const baseBubble = `relative p-4 text-sm shadow-md transition-all duration-200 w-[80%] whitespace-pre-wrap break-words border-opacity-50`;

        let containerClass = "flex items-start";
        let bubbleClass = baseBubble;

        switch (msg.type) {
          case "user":
            containerClass += " justify-end";
            bubbleClass += `
              bg-card text-foreground mr-2
              self-end hover:brightness-110
              border 
            `;
            break;

          case "assistant":
            containerClass += " justify-start";
            bubbleClass += `
              bg-card text-foreground
              border
              hover:brightness-105
            `;
            break;

          case "thought":
            containerClass += " justify-start";
            bubbleClass += `
              bg-card text-muted-foreground
              border
              hover:brightness-105
            `;
            break;

          case "error":
            containerClass += " justify-center";
            bubbleClass += `
              bg-card text-destructive font-semibold
              border
              hover:brightness-105
            `;
            break;

          case "welcome":
            containerClass += " justify-center";
            bubbleClass += `
              bg-card text-accent-foreground
              border
              hover:brightness-105
            `;
            break;

          case "info":
            containerClass += " justify-center";
            bubbleClass += `
              bg-card text-secondary-foreground
              border
              hover:brightness-105
            `;
            break;

          default:
            containerClass += " justify-start";
            bubbleClass += `
              bg-card text-card-foreground
              border
              hover:brightness-105
            `;
        }

        return (
          <div key={i} className={containerClass}>
            <div className={bubbleClass}>
              {msg.type !== "user" && msg.type !== "assistant" && (
                <div className="mb-1 text-xs font-medium uppercase tracking-wider opacity-80">
                  {msg.type}
                </div>
              )}

              {msg.message && <div className="text-base">{msg.message}</div>}

              {msg.error && (
                <div className="text-sm font-medium text-destructive mt-1">
                  {msg.error}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

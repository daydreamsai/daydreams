import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { MessagesList, MessageType } from "@/components/message-list";
import { getWorkingMemoryLogs, Log } from "@daydreamsai/core";
import { SidebarRight } from "@/components/sidebar-right";
import { useAgent } from "@/hooks/use-agent";
import { chat } from "@/agent/chat";
import { v7 as randomUUIDv7 } from "uuid";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/chats/$chatId")({
  component: RouteComponent,
  context() {
    return {
      SideBar: SidebarRight,
      sidebarProps: {
        className:
          "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      },
    };
  },
  loader({ params }) {
    if (params.chatId === "new") {
      return redirect({
        to: "/chats/$chatId",
        params: {
          chatId: randomUUIDv7(),
        },
      });
    }
  },
});

function RouteComponent() {
  const { chatId } = Route.useParams();
  const [messages, setMessages] = useState<MessageType[]>([]);

  const dreams = useAgent();

  const contextId = dreams.getContextId({
    context: chat.contexts!.chat,
    args: {
      chatId,
    },
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  function handleLog(log: Log) {
    if (log.ref === "input") {
      setMessages((msgs) => [
        ...msgs.filter((msg) => msg.id !== log.id),
        {
          id: log.id,
          type: "user",
          message: log.data.content,
        },
      ]);
    }
    if (log.ref === "thought") {
      setMessages((msgs) => [
        ...msgs.filter((msg) => msg.id !== log.id),
        {
          id: log.id,
          type: "thought",
          message: log.content + "\n",
        },
      ]);
    }

    if (log.ref === "output" && log.type === "message") {
      setMessages((msgs) => [
        ...msgs.filter((msg) => msg.id !== log.id),
        {
          id: log.id,
          type: "assistant",
          message: log.data.content,
        },
      ]);
    }
    if (log.ref === "action_call") {
      setMessages((msgs) => [
        ...msgs.filter((msg) => msg.id !== log.id),
        {
          id: log.id,
          type: "system",
          message: `Action call\nAction:${log.name}\nId:${log.id}\nData:${JSON.stringify(log.data)}`,
        },
      ]);
    }
    if (log.ref === "action_result") {
      setMessages((msgs) => [
        ...msgs.filter((msg) => msg.id !== log.id),
        {
          id: log.id,
          type: "system",
          message: `Action Result\nAction:${log.name}\nId:${log.id}\nData:${JSON.stringify(log.data)}`,
        },
      ]);
    }
  }

  useEffect(() => {
    dreams.start().then(async () => {
      const workingMemory = await dreams.getWorkingMemory(contextId);
      setMessages([]);
      getWorkingMemoryLogs(workingMemory).map((log) => handleLog(log));
    });
  }, [dreams, chatId]);

  const queryClient = useQueryClient();

  useEffect(() => {
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  return (
    <>
      <div className="flex flex-col flex-1 relative">
        <div className=" flex flex-col rounded-lg">
          <div className="flex-1 p-4 pb-36" ref={scrollRef}>
            <MessagesList messages={messages} />
          </div>
        </div>
      </div>
      <form
        className="border-t bg-background flex items-center mt-auto sticky bottom-0 left-0 right-0"
        onSubmit={async (e) => {
          e.preventDefault();

          const msg = new FormData(e.currentTarget).get("message") as string;

          const isNew = messages.length === 0;

          setMessages((msgs) => [
            ...msgs,
            {
              id: Date.now().toString(),
              type: "user",
              message: msg,
            },
          ]);

          e.currentTarget.reset();

          const res = await dreams.send({
            context: chat.contexts!.chat,
            args: {
              chatId,
            },
            input: {
              type: "message",
              data: {
                user: "galego",
                content: msg,
              },
            },
            handlers: {
              onLogStream(log, done) {
                handleLog(log);
              },
              onThinking(thought) {
                handleLog(thought);
              },
            },
          });

          if (isNew) {
            queryClient.invalidateQueries({
              queryKey: ["agent:chats"],
            });
          }

          for (const log of res) {
            handleLog(log);
          }
        }}
      >
        <input
          type="text"
          name="message"
          placeholder="Type your message..."
          className="flex-1 px-8 py-8 rounded-lg bg-background text-foreground placeholder:text-primary
                       focus:outline-none focus:ring-2 focus:ring-primary"
          disabled={false} // Disable input while loading history
        />
        <button
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 
                       focus:outline-none focus:ring-2 focus:ring-primary h-full w-64
                       disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </form>
    </>
  );
}

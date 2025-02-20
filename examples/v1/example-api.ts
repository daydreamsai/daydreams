/**
 * Basic example demonstrating a simple chat interface using Dreams
 * with a command line interface and Groq's LLM.
 */
import { createGroq } from "@ai-sdk/groq";
import {
  createDreams,
  cli,
  context,
  LogLevel,
  formatXml,
  action,
  memory,
  input,
  formatMsg,
  createContainer,
  output,
} from "@daydreamsai/core/v1";
import { z } from "zod";
import type { XMLElement } from "../../packages/core/dist";
import type { Server } from "bun";
import type { Children } from "react";
import { parse } from "../../packages/core/src/core/v1/prompts/main";

// Initialize Groq client
const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY!,
});

function xml(
  tag: string,
  params: Record<string, any>,
  children: string | (string | XMLElement)[]
): XMLElement {
  return {
    tag,
    params,
    content: children,
  };
}

const marchafyMemory = memory({
  key: "marchay",
  create() {
    return {
      currentSong: data[0] as { id: string; Group: { id: string } },
      queue: data.slice(1, 10),
    };
  },
});

const container = createContainer();

type MyAgent = typeof agent;

const eventSchemas = {
  message: z.object({
    user: z.string(),
    text: z.string(),
  }),
} as const;

const eventSchema = z.object({
  type: z.string(),
  data: z.any(),
});

// Example usage with the Bun WebSocket server
const server = Bun.serve({
  port: 3333,

  fetch(req, server) {
    if (server.upgrade(req)) {
      return;
    }

    const url = new URL(req.url);

    // Serve HTML for root path
    if (url.pathname === "/") {
      const html = Bun.file("./player.html");
      return new Response(html);
    }

    return new Response("Not Found", { status: 404 });
  },
  websocket: {
    open(ws) {
      console.log("Client connected");
      // Send current playback state if exists
      // const currentTime = marchafyMemory.get('currentPlaybackTime');
      // const currentSong = marchafyMemory.get('currentSong');

      // if (currentSong) {
      //   const message: PlayMessage = {
      //     type: 'play',
      //     url: currentSong,
      //     currentTime
      //   };
      //   ws.send(JSON.stringify(message));
      // }

      ws.subscribe("chat");
      ws.subscribe("radio");

      ws.send(
        JSON.stringify({
          type: "play",
          url:
            "https://marchafy-eu.b-cdn.net/marchas/" + data[0].SongFile[0].url,
          currentTime: 0,
        })
      );
    },
    async message(ws, message) {
      const agent = container.resolve<MyAgent>("agent");

      try {
        const { type, data } = eventSchema.parse(
          JSON.parse(
            typeof message === "string" ? message : message.toString("utf8")
          )
        );

        console.log({ type, data });

        switch (type) {
          case "message":
            const { user, text } = eventSchemas.message.parse(data);
            console.log({ user, text });

            server.publish("chat", message);

            agent.send(
              marchafyChatContext,
              {},
              {
                type: "marchafy:chat-room",
                data: {
                  user,
                  text,
                },
              }
            );

            break;

          default:
            break;
        }

        // // if (data.type === 'timeUpdate') {
        // //   // Handle time updates through the action
        // //   actions.handleTimeUpdate.handler(
        // //     { input: { clientId: ws.id, currentTime: data.currentTime } },
        // //     { wsServer: server, memory: marchafyMemory },
        // //     {}
        // //   );
        // // }
      } catch (err) {
        console.error("Error processing message:", err);
      }
    },
    close(ws) {
      console.log("Client disconnected");
    },
  },
});

container.instance("server", server);

console.log(`Server running at http://localhost:${server.port}`);

type Song = (typeof data)[number];

function formatSong(song: Song, tag: string = "song") {
  return xml(tag, { id: song.id }, [
    JSON.stringify({
      id: song.id,
      group: {
        id: song.Group.id,
        name: song.Group.name,
      },
      year: song.year,
      title: song.title,
      lyrics: song.lyrics,
    }),
  ]);
}

const marchafyContext = context({
  type: "app",
  schema: z.object({}),

  // instructions(params, ctx) {
  //   return "";
  // },
  key(args) {
    return "marchafy:live-radio";
  },

  setup() {
    return {
      yes: true,
    };
  },

  create({ args }) {
    return {
      test: true,
    };
  },

  render({ memory, options }) {
    return formatXml(
      xml("state", {}, [
        formatSong(data[0], "current-song"),
        xml(
          "queue",
          {},
          data.slice(1, 10).map((s) => formatSong(s))
        ),
      ])
    );
  },
});

const marchafyChatContext = context({
  type: "chat-room",
  schema: z.object({}),
  instructions: [
    "This is a group chat you dont always have to respond to the users messages you are mostly moderating the chat and controling the radio",
  ],
  // instructions(params, ctx) {
  //   return "";
  // },
  key(args) {
    return "marchafy:live-radio-chat";
  },

  setup() {
    return {
      yes: true,
    };
  },

  create({ args }) {
    return {
      test: true,
    };
  },
});

const marchafyApiContext = context({
  type: "api",
  schema: z.object({}),

  instructions: [
    "This is a group chat you dont always have to respond to the users messages you are mostly moderating the chat and controling the radio",
  ],
  // instructions(params, ctx) {
  //   return "";
  // },
  key(args) {
    return "marchafy:live-radio-chat";
  },

  setup() {
    return {
      yes: true,
    };
  },

  create({ args }) {
    return {
      test: true,
    };
  },
});

// Create Dreams agent instance
const agent = createDreams({
  logger: LogLevel.DEBUG,
  context: marchafyContext,
  debugger: async (contextId, keys, data) => {
    console.log("here");
    const [type, id] = keys;
    await Bun.write(`./logs/marchafy/${contextId}/${id}-${type}.md`, data);
  },
  model: groq("deepseek-r1-distill-llama-70b"),
  extensions: [cli],
  container,
  inputs: {
    "marchafy:chat-room": input({
      schema: z.object({ user: z.string(), text: z.string() }),
      format(params) {
        return formatMsg({
          role: "user",
          user: params.user,
          content: params.text,
        });
      },
    }),
  },
  outputs: {
    "marchafy:chat-room": output({
      description: "Send message to chat room",
      instructions: `Use this to reply or to send a message to the chat room, when a user sends a message from chat-room reply using this output.
      You must always reply in portuguese from portugal try to avoid brazilian words using this ouput, even if the user talked in another language`,
      schema: z.object({ text: z.string() }),
      async handler(params, {}, { container }) {
        const server = container.resolve<Server>("server");

        server.publish(
          "chat",
          JSON.stringify({
            type: "message",
            data: {
              user: "agent",
              text: params.text,
            },
          })
        );

        return {
          data: params.text,
          timestamp: Date.now(),
        };
      },
      format({ data }) {
        return formatMsg({
          role: "assistant",
          content: data,
        });
      },
    }),
    "marchafy:chat-room-react": output({
      description: "Render react components in the chat room",
      instructions: `Use this to complement your response with react components here is a list of the components available and their params:
- Song { songId: string }    
- SongList { songIds: string[] }     
- Group { groupId: string }    
- GroupList { groupIds: string[] }
Only use available components, if no components needed to render do use this output.
`,
      schema: z.object({
        components: z.array(
          z.object({ component: z.string(), params: z.any() })
        ),
      }),
      async handler(params, {}, { container }) {
        console.log();
        server.publish(
          "chat",
          JSON.stringify({
            type: "component",
            data: params.components,
          })
        );
        return {
          data: params.components,
          timestamp: Date.now(),
        };
      },
    }),
  },
  actions: [
    action({
      name: "marchafy:selectSong",
      schema: z.object({ songId: z.string() }),
      memory: marchafyMemory,
      handler(call, ctx, agent) {
        const song = data.find((s) => s.id === call.data.songId)!;
        if (song) {
          ctx.actionMemory.currentSong = song;
          return {
            currentSong: song,
          };
        }

        throw new Error("invalid song");
      },
      format(result) {
        console.log({ result });
        return formatXml(
          xml("current-song", {}, [JSON.stringify(result.data.currentSong)])
        );
      },
    }),
    action({
      name: "marchafy:searchSongs",
      schema: z.object({
        where: z
          .object({
            group: z.object({ id: z.string(), name: z.string() }).partial(),
            artists: z.array(
              z.object({ id: z.string(), name: z.string() }).partial()
            ),
            year: z.number(),
            title: z.string(),
            lyrics: z.string(),
          })
          .partial(),

        limit: z.number().optional().default(10),
      }),

      memory: marchafyMemory,
      handler(call, ctx, agent) {
        // const song = data.find((s) => s.id === call.data.songId)!;
        // if (song) {
        //   ctx.actionMemory.currentSong = song;
        //   return {
        //     currentSong: song,
        //   };
        // }

        console.log({ query: call.data });

        return {
          songs: [] as Song[],
        };

        throw new Error("invalid song");
      },
      format(result) {
        console.log({ result });
        return formatXml({
          tag: "songs",
          params: {},
          content: result.data.songs.map((song) => formatSong(song)),
        });
      },
    }),
  ],
});

await agent
  .start({
    agent: {
      name: "test",
    },
  })
  .catch((err) => console.log(err));

console.log("started");

const data = [
  {
    artistId: null,
    id: "cjs5xg4fp0yzb0799ffib0j2s",
    title: "",
    year: 2004,
    youtubeID: null,
    Artist: null,
    updatedAt: "2019-02-15T10:45:33.684Z",
    duration: 195,
    Image: [],
    SongFile: [
      { url: "cjc1d87a1m3xk01875h6855oo.2004.cjs5xg4fp0yzb0799ffib0j2s.mp3" },
    ],
    createdAt: "2019-02-15T10:45:33.684Z",
    Group: {
      Image: [
        {
          height: 600,
          url: "https://firebasestorage.googleapis.com/v0/b/marchafy.appspot.com/o/images%2Fmar-alto-2020.jpg?alt=media&token=167169c2-d11b-4db3-9f6d-02fa21b131d6",
          width: 600,
        },
      ],
      id: "cjc1d87a1m3xk01875h6855oo",
      name: "Mar Alto",
      slug: "mar-alto",
    },
    lyrics: null,
    public: true,
    groupId: "cjc1d87a1m3xk01875h6855oo",
  },
  {
    duration: 198,
    youtubeID: null,
    Artist: null,
    Group: {
      id: "cjcdwrc9u7vzh0128gzg41bv4",
      name: "Aroles",
      slug: "aroles",
      Image: [],
    },
    artistId: null,
    createdAt: "2018-01-13T22:23:12.000Z",
    SongFile: [
      { url: "cjcdwrc9u7vzh0128gzg41bv4.2010.cjcdx49ozrtnd0178wfgb8wzy.mp3" },
    ],
    title: "",
    year: 2010,
    Image: [],
    groupId: "cjcdwrc9u7vzh0128gzg41bv4",
    id: "cjcdx49ozrtnd0178wfgb8wzy",
    lyrics: null,
    public: true,
    updatedAt: "2019-01-06T23:16:54.746Z",
  },
  {
    createdAt: "2019-02-13T19:21:40.759Z",
    duration: 248,
    year: 2006,
    Group: {
      Image: [],
      id: "cjc1d9jujt2az0196u6y6cwrt",
      name: "Marcha Geral",
      slug: "marcha-geral",
    },
    groupId: "cjc1d9jujt2az0196u6y6cwrt",
    id: "cjs3l05g70p9z0799belb3hoo",
    public: true,
    title: "Inté faz gosto",
    Artist: null,
    Image: [],
    SongFile: [
      { url: "cjc1d9jujt2az0196u6y6cwrt.2006.cjs3l05g70p9z0799belb3hoo.mp3" },
    ],
    youtubeID: null,
    artistId: null,
    lyrics: null,
    updatedAt: "2019-02-13T19:21:40.759Z",
  },
  {
    duration: 179,
    title: "",
    youtubeID: null,
    createdAt: "2018-01-06T18:15:09.000Z",
    Image: [],
    SongFile: [
      { url: "cjc2mygbz6wpf0106boye9159.2013.cjc3o6av0nyb70147os1ck0ki.mp3" },
    ],
    artistId: null,
    groupId: "cjc2mygbz6wpf0106boye9159",
    lyrics: null,
    updatedAt: "2019-01-06T23:16:54.746Z",
    year: 2013,
    Group: {
      Image: [],
      id: "cjc2mygbz6wpf0106boye9159",
      name: "O Bailariquedo Ze",
      slug: "bailariquedo-ze",
    },
    Artist: null,
    public: true,
    id: "cjc3o6av0nyb70147os1ck0ki",
  },
  {
    Artist: null,
    Image: [],
    createdAt: "2023-01-19T19:04:03.812Z",
    duration: 139,
    public: true,
    SongFile: [
      { url: "cld3gor8k0004tkyoykzzteg3-wklbttrago5otjttt22nmldr.mp3" },
    ],
    updatedAt: "2023-02-01T21:31:00.048Z",
    year: 1998,
    Group: {
      Image: [
        {
          height: 627,
          url: "https://firebasestorage.googleapis.com/v0/b/marchafy.appspot.com/o/images%2Fjoao-tavares.jpg?alt=media&token=5ffe4e01-8f3d-4260-95f3-3dc484cca31b",
          width: 640,
        },
      ],
      id: "cjc1da5mrm4n30187adt40g6h",
      name: "Tavares",
      slug: "tavares",
    },
    artistId: null,
    groupId: "cjc1da5mrm4n30187adt40g6h",
    id: "cld3gor8k0004tkyoykzzteg3",
    lyrics: "",
    title: "É Todo Nu",
    youtubeID: null,
  },
  {
    lyrics: null,
    youtubeID: null,
    Artist: null,
    artistId: null,
    year: 2025,
    duration: 138,
    updatedAt: "2025-02-05T19:26:06.787Z",
    createdAt: "2025-02-05T19:23:49.854Z",
    groupId: "cm6sapn2n0000lb0cs0bkssfn",
    id: "cm6sard260001lb0c8fqi92my",
    title: "Influencer do Camarcão",
    Group: {
      id: "cm6sapn2n0000lb0cs0bkssfn",
      name: "Lesádes do Carna",
      slug: "lesades-do-carna",
      Image: [],
    },
    Image: [],
    SongFile: [
      { url: "cm6sard260001lb0c8fqi92my-r1hus5tzj82oheb2i1pwamzc.mp3" },
    ],
    public: true,
  },
  {
    public: true,
    artistId: null,
    duration: 157,
    id: "cjr6i5auc0w340799wv4w6bv5",
    groupId: "cjr6hsajp0vnf0799fauncgny",
    Group: {
      slug: "vicks",
      Image: [],
      id: "cjr6hsajp0vnf0799fauncgny",
      name: "Vicks",
    },
    Image: [],
    createdAt: "2019-01-21T15:45:18.372Z",
    title: "Espaço",
    year: 2000,
    Artist: null,
    SongFile: [
      { url: "cjr6hsajp0vnf0799fauncgny.2000.cjr6i5auc0w340799wv4w6bv5.mp3" },
    ],
    lyrics: "",
    updatedAt: "2025-01-19T22:16:21.288Z",
    youtubeID: null,
  },
  {
    Image: [],
    youtubeID: null,
    duration: 283,
    groupId: "cjc1da5jhm4mf0187xcgut6pw",
    id: "cjrnvili102w80799d0i5se6z",
    updatedAt: "2019-02-14T17:46:38.610Z",
    SongFile: [
      { url: "cjc1da5jhm4mf0187xcgut6pw.2019.cjrnvili102w80799d0i5se6z.mp3" },
    ],
    artistId: null,
    createdAt: "2019-02-02T19:31:38.586Z",
    lyrics:
      "Fui de férias toda ardida\nPu booking é num repente\nO mê namorade, o Chico\nAquele lête estragade\nNão me pede em casamente\n\nOuvi falar duma lenda\nÀ môr uma maravilha\nSe incontrar um passarinho\nNaquela tela tão linda\nHei-de casar em Sevilha\n\nBalhê, Balhê\nJá nem sentia o mês pés\nEstala-me essas castanholas\nPõe as costas bem dirêtas\nCabeça a olhar de revés\n\nToda improada\nSem pataco, nem vintém\nÀ miga quer lá saber\nVou linda, sequérabel\nNa sô menes c’a ninguém",
    title: "Tou uma linda...Sequérabel!!!!",
    year: 2019,
    Artist: null,
    Group: {
      id: "cjc1da5jhm4mf0187xcgut6pw",
      name: "Maltezas",
      slug: "maltezas",
      Image: [
        {
          height: 639,
          url: "https://firebasestorage.googleapis.com/v0/b/marchafy.appspot.com/o/images%2Fmaltezas.jpg?alt=media&token=48269093-88e8-4bf0-9d8d-de6e4096c3d3",
          width: 960,
        },
      ],
    },
    public: true,
  },
  {
    Artist: null,
    lyrics: null,
    year: 2009,
    Group: {
      Image: [],
      id: "cjc3p6s07oflp01065o06pdtc",
      name: "Renhecas",
      slug: "renhecas",
    },
    duration: 242,
    title: "",
    SongFile: [
      { url: "cjc3p6s07oflp01065o06pdtc.2009.cjra7ghgz1ihb0799tia0jbcc.mp3" },
    ],
    id: "cjra7ghgz1ihb0799tia0jbcc",
    public: true,
    groupId: "cjc3p6s07oflp01065o06pdtc",
    updatedAt: "2019-01-24T05:57:09.107Z",
    youtubeID: null,
    Image: [],
    artistId: null,
    createdAt: "2019-01-24T05:57:09.107Z",
  },
  {
    groupId: "cjc2mwtrm3kkk0173thtxgm3h",
    lyrics: null,
    artistId: null,
    createdAt: "2018-01-06T18:22:12.000Z",
    SongFile: [
      { url: "cjc2mwtrm3kkk0173thtxgm3h.2013.cjc3ofds7o4hc0133zi96ahvs.mp3" },
    ],
    duration: 147,
    updatedAt: "2019-01-06T23:16:54.746Z",
    youtubeID: null,
    Group: {
      Image: [],
      id: "cjc2mwtrm3kkk0173thtxgm3h",
      name: "Micros Pa Boca",
      slug: "micros-pa-boca",
    },
    Image: [],
    id: "cjc3ofds7o4hc0133zi96ahvs",
    public: true,
    title: "",
    year: 2013,
    Artist: null,
  },
  {
    lyrics: null,
    title: "Dás-me cabo da Cabeça",
    updatedAt: "2020-01-22T17:05:05.820Z",
    youtubeID: null,
    Artist: null,
    SongFile: [
      { url: "cjcdv4rk3rdx80149n38o3ay6.2018.ck5pk5ov00bzp07990ryye2fu.mp3" },
    ],
    duration: 276,
    groupId: "cjcdv4rk3rdx80149n38o3ay6",
    public: true,
    year: 2018,
    Group: {
      Image: [],
      id: "cjcdv4rk3rdx80149n38o3ay6",
      name: "Banda do Selo",
      slug: "banda-do-selo",
    },
    Image: [],
    artistId: null,
    id: "ck5pk5ov00bzp07990ryye2fu",
    createdAt: "2020-01-22T17:05:05.820Z",
  },
  {
    updatedAt: "2020-01-23T04:50:55.360Z",
    youtubeID: null,
    Group: {
      slug: "blabla",
      Image: [
        {
          height: 960,
          url: "https://firebasestorage.googleapis.com/v0/b/marchafy.appspot.com/o/images%2Fblabla.png?alt=media&token=f91a5204-dd49-4157-99b9-b61c9f37b87b",
          width: 960,
        },
      ],
      id: "cjc1da5lsm4mv01872h8iqbq1",
      name: "Blá Blá",
    },
    Image: [],
    groupId: "cjc1da5lsm4mv01872h8iqbq1",
    createdAt: "2018-01-13T20:28:24.000Z",
    year: 2015,
    title: "Jogo do Mata Mata",
    artistId: null,
    duration: 181,
    public: true,
    lyrics:
      "Quere sambar a nha carcaça!\nNa sabes aquile qu’ele diz,\nDiz que no BláBlá é que se passa\nE fui la meter o nariz.\nJogo do mata-mata,\nGanha quem maltrata,\nSou um acrobata,\nEIA QUE BATATA!\n\nVieste pó blá-blá\nJá na tou-te a ver pá\nUm creme de argilá\nAmanhã tou a chá\n\nRefrão\nNa vou embora, daqui sem ela\nNa vou, na vou, na vou, na vou, na vou naaaaao!\nAté ficar cuma afegadela\nNa vou, na vou, na vou, na vou, na vou, na vou!",
    Artist: null,
    SongFile: [
      { url: "cjc1da5lsm4mv01872h8iqbq1.2015.cjcdt0mkd6x9a0167z0q960e1.mp3" },
    ],
    id: "cjcdt0mkd6x9a0167z0q960e1",
  },
  {
    duration: 158,
    public: true,
    Artist: null,
    Group: {
      Image: [],
      id: "ck5jsiuh802og0799w5u3yhj0",
      name: "Mijaretas",
      slug: "mijaretas",
    },
    artistId: null,
    lyrics: "",
    SongFile: [
      { url: "ck5jsiuh802og0799w5u3yhj0.1993.ck5jskxhp02rf0799qx07yu7q.mp3" },
    ],
    groupId: "ck5jsiuh802og0799w5u3yhj0",
    id: "ck5jskxhp02rf0799qx07yu7q",
    title: "Rapiuca paparuca",
    updatedAt: "2023-01-28T04:19:01.770Z",
    year: 1993,
    youtubeID: null,
    Image: [],
    createdAt: "2020-01-18T16:14:16.716Z",
  },
  {
    id: "cjcdv72q07c5j0128lle81yyx",
    Artist: null,
    Group: {
      name: "Alberquêras",
      slug: "alberqueras",
      Image: [
        {
          height: 792,
          url: "https://firebasestorage.googleapis.com/v0/b/marchafy.appspot.com/o/images%2Falberqueras.jpg?alt=media&token=5e5ebb5f-5f2e-4270-9160-948c8d5d2453",
          width: 1188,
        },
      ],
      id: "cjc1da5o9m4nf0187xid3y91k",
    },
    artistId: null,
    duration: 238,
    updatedAt: "2019-01-06T23:16:54.746Z",
    Image: [],
    SongFile: [
      { url: "cjc1da5o9m4nf0187xid3y91k.2017.cjcdv72q07c5j0128lle81yyx.mp3" },
    ],
    createdAt: "2018-01-13T21:29:24.000Z",
    groupId: "cjc1da5o9m4nf0187xid3y91k",
    lyrics: null,
    public: true,
    year: 2017,
    youtubeID: null,
    title: "",
  },
  {
    Image: [],
    createdAt: "2018-01-13T21:31:54.000Z",
    id: "cjcdvaa93rgoz0149f5qd9ulp",
    lyrics: null,
    updatedAt: "2019-01-06T23:16:54.746Z",
    youtubeID: null,
    Artist: null,
    duration: 174,
    title: "",
    year: 2017,
    groupId: "cjc1da5nam4n701879i5a7vrc",
    public: true,
    Group: {
      Image: [
        {
          height: 375,
          url: "https://firebasestorage.googleapis.com/v0/b/marchafy.appspot.com/o/images%2Fplanalto.jpg?alt=media&token=404a69fd-97c6-4a93-8d50-c701b9014885",
          width: 375,
        },
      ],
      id: "cjc1da5nam4n701879i5a7vrc",
      name: "Planalto",
      slug: "planalto",
    },
    SongFile: [
      { url: "cjc1da5nam4n701879i5a7vrc.2017.cjcdvaa93rgoz0149f5qd9ulp.mp3" },
    ],
    artistId: null,
  },
  {
    youtubeID: null,
    Artist: null,
    Group: {
      id: "cjr6hsajp0vnf0799fauncgny",
      name: "Vicks",
      slug: "vicks",
      Image: [],
    },
    lyrics: null,
    createdAt: "2023-02-16T21:10:41.475Z",
    id: "cle7ljgaq0000mp095p95tqfv",
    year: 2013,
    Image: [],
    SongFile: [
      { url: "cle7ljgaq0000mp095p95tqfv-q0tkgg9zrawnnt4pha9mp4v1.mp3" },
    ],
    artistId: null,
    title: "Russia",
    updatedAt: "2023-02-16T21:11:03.171Z",
    duration: 126,
    groupId: "cjr6hsajp0vnf0799fauncgny",
    public: true,
  },
  {
    groupId: "ck5jsizpj02ol0799xv5clmzs",
    artistId: null,
    SongFile: [
      { url: "ck5jsizpj02ol0799xv5clmzs.2000.ck5jsl39402s90799268n2yqs.mp3" },
    ],
    id: "ck5jsl39402s90799268n2yqs",
    updatedAt: "2020-01-18T16:14:24.183Z",
    youtubeID: null,
    Artist: null,
    createdAt: "2020-01-18T16:14:24.183Z",
    Image: [],
    duration: 183,
    lyrics: null,
    public: true,
    title: "",
    year: 2000,
    Group: {
      name: "Mazartes",
      slug: "mazartes",
      Image: [],
      id: "ck5jsizpj02ol0799xv5clmzs",
    },
  },
  {
    groupId: "cjc1d9jvit2b701962fhmfp2d",
    artistId: null,
    id: "cjc3pdrddonnt0147u3vc4a7b",
    updatedAt: "2020-01-23T03:33:59.187Z",
    lyrics: null,
    public: true,
    Artist: null,
    Group: {
      id: "cjc1d9jvit2b701962fhmfp2d",
      name: "Gramesindas",
      slug: "gramesindas",
      Image: [],
    },
    duration: 242,
    title: "Aluga-me os panêres",
    year: 2012,
    youtubeID: null,
    Image: [],
    SongFile: [
      { url: "cjc3p3nj0oi880166cykh8jo3.2012.cjc3pdrddonnt0147u3vc4a7b.mp3" },
    ],
    createdAt: "2018-01-06T18:48:56.000Z",
  },
  {
    Image: [],
    SongFile: [
      { url: "cld2cpnwv000ctk90n209v2l6-d5quk6h5ef8ff0wt9ailhxjx.mp3" },
    ],
    createdAt: "2023-01-19T00:25:01.468Z",
    groupId: "cjc3qzzdiphdj0166ixkbpjhw",
    lyrics:
      "Quando a saudade chegava\nE no meu rosto provava\nO sabor desta ternura\nForte mais forte batia\nUm coração que dizia\nComo era ser Doçura\n\nDos carnavais se lembrava\nSabendo que m’ inliava\nAi o que ele m’ implorou\nNem que seja por um dia\nQuero ter essa alegria\nO sonho não acabou\n\nEu já aqui estou, pois estou\nP’ra ti voltei…\nAndei tão longe de ti\nCarnaval o que eu passei\nFaz do teu brilho a minha cor\nAi, na me rala!\nSerei o teu grande amor\nDoçura seja o que for\nQue vem lá da Guatemala\n\nLetra: António Lopes\nMúsica: Mário João Estrelinha\nCantam: Mário João, Guilherme Azevedo e Nuno Estrelinha",
    Group: {
      id: "cjc3qzzdiphdj0166ixkbpjhw",
      name: "Doçuras",
      slug: "docuras",
      Image: [],
    },
    title: "",
    artistId: null,
    id: "cld2cpnwv000ctk90n209v2l6",
    public: true,
    year: 2023,
    Artist: null,
    duration: 182,
    updatedAt: "2023-02-08T15:21:24.432Z",
    youtubeID: null,
  },
  {
    duration: 231,
    createdAt: "2018-01-06T18:19:03.000Z",
    public: true,
    Artist: null,
    Image: [],
    updatedAt: "2019-01-06T23:16:54.746Z",
    Group: {
      id: "cjc1d9w0vmxkr0173534b6mel",
      name: "Diolinde",
      slug: "diolinde",
      Image: [],
    },
    artistId: null,
    groupId: "cjc1d9w0vmxkr0173534b6mel",
    id: "cjc3obbbeo27o013318a3q7bl",
    lyrics: null,
    title: "Where's mai Cao",
    year: 2013,
    youtubeID: null,
    SongFile: [
      { url: "cjc1d9w0vmxkr0173534b6mel.2013.cjc3obbbeo27o013318a3q7bl.mp3" },
    ],
  },
  {
    lyrics: null,
    youtubeID: null,
    SongFile: [
      { url: "cjc1d8ryigod00197zn42or5u.2018.cjd76rv7na0yz0196bytrhpoy.mp3" },
    ],
    duration: 196,
    id: "cjd76rv7na0yz0196bytrhpoy",
    public: true,
    Image: [],
    Group: {
      Image: [],
      id: "cjc1d8ryigod00197zn42or5u",
      name: "Blékutes",
      slug: "blekutes",
    },
    artistId: null,
    createdAt: "2018-02-03T09:58:49.000Z",
    groupId: "cjc1d8ryigod00197zn42or5u",
    title: "",
    year: 2018,
    Artist: null,
    updatedAt: "2019-01-06T23:16:54.746Z",
  },
  {
    Group: {
      slug: "kalhas",
      Image: [],
      id: "cjs21tz450ilv07996n1bqlm0",
      name: "Kalhas",
    },
    duration: 145,
    Artist: null,
    artistId: null,
    createdAt: "2019-02-20T20:00:51.498Z",
    id: "cjsdmhhyj040p0799q4fd5qak",
    lyrics: null,
    updatedAt: "2019-02-20T20:00:51.498Z",
    Image: [],
    year: 2003,
    youtubeID: null,
    title: "Estrunfe",
    groupId: "cjs21tz450ilv07996n1bqlm0",
    public: true,
    SongFile: [
      { url: "cjs21tz450ilv07996n1bqlm0.2003.cjsdmhhyj040p0799q4fd5qak.mp3" },
    ],
  },
  {
    createdAt: "2018-01-06T18:22:06.000Z",
    groupId: "cjc2mw8yo70fi01332ntkgfjt",
    id: "cjc3of8hmo4et01332xctymt1",
    lyrics: null,
    Group: {
      Image: [],
      id: "cjc2mw8yo70fi01332ntkgfjt",
      name: "Melgas",
      slug: "melgas",
    },
    Image: [],
    title: "",
    updatedAt: "2019-01-06T23:16:54.746Z",
    Artist: null,
    artistId: null,
    duration: 237,
    public: true,
    SongFile: [
      { url: "cjc2mw8yo70fi01332ntkgfjt.2013.cjc3of8hmo4et01332xctymt1.mp3" },
    ],
    year: 2013,
    youtubeID: null,
  },
  {
    artistId: null,
    duration: 152,
    groupId: "cjrmh7lw606470799dp84se32",
    year: 2009,
    Image: [],
    lyrics: null,
    youtubeID: null,
    Group: {
      name: "Marchas de Autor",
      slug: "marchas-de-autor",
      Image: [],
      id: "cjrmh7lw606470799dp84se32",
    },
    createdAt: "2023-01-27T18:50:19.637Z",
    updatedAt: "2023-01-27T18:51:29.755Z",
    Artist: null,
    SongFile: [
      { url: "cldevpwob004etkgkqn47yyp4-xevcj71bkm4xq1iyjybvn11t.mp3" },
    ],
    id: "cldevpwob004etkgkqn47yyp4",
    public: true,
    title: "Seja Velho ou seja Novo",
  },
  {
    SongFile: [
      { url: "cjc1da5jhm4mf0187xcgut6pw.2006.cjr9asbk51b960799h2347qxv.mp3" },
    ],
    id: "cjr9asbk51b960799h2347qxv",
    public: true,
    year: 2006,
    Artist: null,
    title: "Tou árrasca dum artelhe",
    updatedAt: "2019-01-23T14:56:17.516Z",
    Group: {
      Image: [
        {
          height: 639,
          url: "https://firebasestorage.googleapis.com/v0/b/marchafy.appspot.com/o/images%2Fmaltezas.jpg?alt=media&token=48269093-88e8-4bf0-9d8d-de6e4096c3d3",
          width: 960,
        },
      ],
      id: "cjc1da5jhm4mf0187xcgut6pw",
      name: "Maltezas",
      slug: "maltezas",
    },
    Image: [],
    artistId: null,
    duration: 212,
    youtubeID: null,
    createdAt: "2019-01-23T14:42:33.989Z",
    groupId: "cjc1da5jhm4mf0187xcgut6pw",
    lyrics: null,
  },
  {
    groupId: "cjc3qzzbyphd90166zmn7u494",
    updatedAt: "2019-01-06T23:16:54.746Z",
    year: 2011,
    createdAt: "2018-01-06T19:37:24.000Z",
    artistId: null,
    id: "cjc3r43a0pjiz0166fk7h9j13",
    title: "",
    youtubeID: null,
    SongFile: [
      { url: "cjc3qzzbyphd90166zmn7u494.2011.cjc3r43a0pjiz0166fk7h9j13.mp3" },
    ],
    Group: {
      Image: [],
      id: "cjc3qzzbyphd90166zmn7u494",
      name: "Bombeiros",
      slug: "bombeiros",
    },
    Artist: null,
    duration: 183,
    lyrics: null,
    public: true,
    Image: [],
  },
  {
    title: "",
    Artist: null,
    id: "cjc3r7zvzpk9f01474emz74kw",
    artistId: null,
    duration: 165,
    public: true,
    Image: [],
    SongFile: [
      { url: "cjc1d878rm3xc0187qvbqlu98.2011.cjc3r7zvzpk9f01474emz74kw.mp3" },
    ],
    Group: {
      name: "Sunset",
      slug: "sunset",
      Image: [],
      id: "cjc1d878rm3xc0187qvbqlu98",
    },
    groupId: "cjc1d878rm3xc0187qvbqlu98",
    updatedAt: "2019-01-06T23:16:54.746Z",
    year: 2011,
    youtubeID: null,
    createdAt: "2018-01-06T19:40:27.000Z",
    lyrics: null,
  },
  {
    Image: [],
    SongFile: [
      { url: "clrldmlhb000atkxwkzxpbib8-gklobz7ylkdj7fc35w165atr.mp3" },
    ],
    updatedAt: "2024-01-20T01:15:12.967Z",
    Artist: null,
    Group: {
      Image: [
        {
          height: 280,
          url: "https://storage.googleapis.com/marchafy.appspot.com/images/taful.jpg",
          width: 420,
        },
      ],
      id: "cjc1d9vv1mxjp01732b8xo1lt",
      name: "Os Taful",
      slug: "taful",
    },
    id: "clrldmlhb000atkxwkzxpbib8",
    youtubeID: null,
    createdAt: "2024-01-20T01:14:07.908Z",
    duration: 205,
    groupId: "cjc1d9vv1mxjp01732b8xo1lt",
    year: 2010,
    artistId: null,
    lyrics: null,
    public: true,
    title: "Mundo da Magia",
  },
  {
    Artist: null,
    youtubeID: null,
    updatedAt: "2020-01-23T05:10:52.511Z",
    SongFile: [
      { url: "cjc1da5o9m4nf0187xid3y91k.2012.cjc3pb3teomds01662cpy2a8k.mp3" },
    ],
    artistId: null,
    duration: 246,
    groupId: "cjc1da5o9m4nf0187xid3y91k",
    lyrics:
      "Numa sebida, a sebir pa cima\nDê de cáras ca Jôquina\nA escomungar mêia munde\nAndas sempre arrenegáda\nAté vens inviusáda\nPéra ai respira funde\nô tô aqui destemida\nPerdi-me e tô perdida\nSó á espera da nha mãe\nÉ qu’elas já ali vão prontas\nAluádas, todas tontas\nE eu já me lá quer tamém\nLeváda cas Alberqueras\nAquelas cantelhêras\nSó querem é carnaval\nLevo o questal á cabeça\nE antes c’anoitêça\nJá na sê do avental\nTá árronca ápitar\nE já me quer a bálhar\nA sablancár as maminhas\nUmas magras, outras cheias\nA gente somos tão feias\nMas ficamos benitinhas",
    Image: [],
    id: "cjc3pb3teomds01662cpy2a8k",
    title: "",
    Group: {
      Image: [
        {
          height: 792,
          url: "https://firebasestorage.googleapis.com/v0/b/marchafy.appspot.com/o/images%2Falberqueras.jpg?alt=media&token=5e5ebb5f-5f2e-4270-9160-948c8d5d2453",
          width: 1188,
        },
      ],
      id: "cjc1da5o9m4nf0187xid3y91k",
      name: "Alberquêras",
      slug: "alberqueras",
    },
    createdAt: "2018-01-06T18:46:52.000Z",
    public: true,
    year: 2012,
  },
  {
    SongFile: [
      { url: "cjs4e8bhq0tm207995zythjn4.2005.cjs4e9fzy0ton0799t7tof8gy.mp3" },
    ],
    artistId: null,
    lyrics: null,
    public: true,
    Image: [],
    id: "cjs4e9fzy0ton0799t7tof8gy",
    title: "",
    updatedAt: "2019-02-14T09:00:43.198Z",
    year: 2005,
    Artist: null,
    createdAt: "2019-02-14T09:00:43.198Z",
    duration: 156,
    groupId: "cjs4e8bhq0tm207995zythjn4",
    youtubeID: null,
    Group: {
      Image: [],
      id: "cjs4e8bhq0tm207995zythjn4",
      name: "Fracassos",
      slug: "fracassos",
    },
  },
  {
    Group: {
      Image: [
        {
          width: 600,
          height: 600,
          url: "https://storage.googleapis.com/marchafy.appspot.com/images/tssantsas2023.jpeg",
        },
      ],
      id: "cjskuytbz0mfe07994a3fzspl",
      name: "Os Tssantsas",
      slug: "os-tssantsas",
    },
    artistId: null,
    groupId: "cjskuytbz0mfe07994a3fzspl",
    title: "Cowboys",
    SongFile: [
      { url: "cjskuytbz0mfe07994a3fzspl.2020.ck6e74gwm4lid07992z2oifcx.mp3" },
    ],
    createdAt: "2020-02-08T22:54:28.245Z",
    public: true,
    duration: 170,
    id: "ck6e74gwm4lid07992z2oifcx",
    lyrics:
      "Já tanhe a bota e o clête\nMandê vir do desertê\nO chapéu vê lá de longe\nNa sê d’onde mas faz-te espérte\n\nÁ pois ganda cowboy\nC’uma ganda bubadêra\nXê de Tssantsas lá ao norte\nÓs tires na moitêra\n\nJá tou Tssantsa, olha o mê tóque\nSou o cowboy, dou head shot\nSó se tá névoa, um becadinhe\nTou p’us pêtes, sou piquenin\nE pa Tssantsa, tssantsa e mê\n2020 já tinrelê\nUma pistola c’môm caval\nSou Tssantsa\nSou Carnaval \n\nA pé na marginal\nC’uma garrafa bates mal\nFui parar ao faroeste\nSó eu e o mê cavale\n\nE o cavale tá a bufar\nBebe mais kêl já amansa\nEste ane tens que cá tár\nSó é d’agente quem é Tssantsa\n\nJá tou Tssantsa, olha o mê tóque\nSou o cowboy, dou head shot\nSó se tá névoa, um becadinhe\nTou p’us pêtes, sou piquenin\nE pa Tssantsa, tssantsa e mê\n2020 já tinrelê\nUma pistola c’môm caval\nSou Tssantsa\nSou Carnaval",
    Artist: null,
    Image: [],
    updatedAt: "2020-02-08T22:55:04.792Z",
    year: 2020,
    youtubeID: null,
  },
  {
    Artist: null,
    Group: {
      Image: [
        {
          height: 1203,
          url: "https://firebasestorage.googleapis.com/v0/b/marchafy.appspot.com/o/images%2Fkerrimoes.jpg?alt=media&token=4ba4dcf5-eced-4abc-bbcb-74653d7e5117",
          width: 1236,
        },
      ],
      id: "cjc1da5mjm4n10187jm6cpik4",
      name: "Kerrimões",
      slug: "kerrimoes",
    },
    SongFile: [
      { url: "cjc1da5mjm4n10187jm6cpik4.2019.cjs6kyc6j12ti0799vz8n03yd.mp3" },
    ],
    year: 2019,
    youtubeID: null,
    Image: [],
    artistId: null,
    public: true,
    updatedAt: "2019-02-19T14:45:59.319Z",
    groupId: "cjc1da5mjm4n10187jm6cpik4",
    id: "cjs6kyc6j12ti0799vz8n03yd",
    title: "O Poeta Kerrimão",
    createdAt: "2019-02-15T21:43:34.699Z",
    duration: 275,
    lyrics:
      "Bocage ou Camões\nNo Entrude dos Kerrimões\nNinguém põe a mão niste\nAinda assim eu na desiste\n\nÉs meme o mê estile\nMas nem assim s’sséga\nSempre soube qu’éras a tal\nEla quer…\nEla quer…\nEla quer é esfrega esfrega\n\nNa vou lá à má dum mês\nTenh’u membre chê de blór\nPózinhe mágique na dá\nTem que ser c’ú vigor\n\nJá vi que tás em ânsias\nDe gatas na tenhe altura\nNa querias tu mai nada\nEm primêre…\nEm primêre…\nEm primêre a lêtura\n\nPós Kerrimões\nNão há Camões\nA gente quer é Bocage\nNão há Camões\nA gente quer é Bocage\nNão há Camões\nA gente quer é Bocage",
  },
  {
    createdAt: "2018-01-13T20:14:13.000Z",
    title: "",
    updatedAt: "2019-01-06T23:16:54.746Z",
    SongFile: [
      { url: "cjc1d9jt2t2ap0196vhsdfjzy.2016.cjcdsie9x6fei01289zlgh2if.mp3" },
    ],
    groupId: "cjc1d9jt2t2ap0196vhsdfjzy",
    Group: {
      Image: [
        {
          height: 600,
          url: "https://storage.googleapis.com/marchafy.appspot.com/images/Enxemaces-2023.png",
          width: 445,
        },
      ],
      id: "cjc1d9jt2t2ap0196vhsdfjzy",
      name: "Enxemaces",
      slug: "enxemaces",
    },
    id: "cjcdsie9x6fei01289zlgh2if",
    youtubeID: null,
    Artist: null,
    Image: [],
    artistId: null,
    duration: 216,
    lyrics: null,
    public: true,
    year: 2016,
  },
  {
    Group: {
      Image: [],
      id: "cjs21s1ek0ih60799uhz53nne",
      name: "Berlim",
      slug: "berlim",
    },
    groupId: "cjs21s1ek0ih60799uhz53nne",
    updatedAt: "2019-02-15T10:39:53.597Z",
    Artist: null,
    artistId: null,
    Image: [],
    createdAt: "2019-02-15T10:39:53.597Z",
    duration: 144,
    id: "cjs5x8u0t0ype0799be9ki3u3",
    public: true,
    year: 2004,
    SongFile: [
      { url: "cjs21s1ek0ih60799uhz53nne.2004.cjs5x8u0t0ype0799be9ki3u3.mp3" },
    ],
    lyrics: null,
    title: "",
    youtubeID: null,
  },
  {
    Group: {
      id: "cjcdwr3z08amq0179m7fcdt5l",
      name: "Ai Vem Elas",
      slug: "ai-vem-elas",
      Image: [
        {
          height: 960,
          url: "https://firebasestorage.googleapis.com/v0/b/marchafy.appspot.com/o/images%2Fai-vem-elas.jpg?alt=media&token=3906cce1-f83b-4514-b9ff-64cc140b99b2",
          width: 1302,
        },
      ],
    },
    SongFile: [
      { url: "cjcdwr3z08amq0179m7fcdt5l.2000.cjr3op55z066d0799qoww1o8x.mp3" },
    ],
    duration: 203,
    id: "cjr3op55z066d0799qoww1o8x",
    year: 2000,
    Artist: null,
    artistId: null,
    createdAt: "2019-01-19T16:25:23.303Z",
    lyrics: null,
    title: "Fugi de casa",
    youtubeID: null,
    updatedAt: "2019-01-21T04:00:20.561Z",
    Image: [],
    groupId: "cjcdwr3z08amq0179m7fcdt5l",
    public: true,
  },
  {
    Group: {
      name: "Tranbalanzanas",
      slug: "tranbalanzanas",
      Image: [],
      id: "cldejcmov000ctkgk3pkpobf5",
    },
    id: "cldejps9t000gtkgk2k5pq0i2",
    lyrics: null,
    youtubeID: null,
    Artist: null,
    createdAt: "2023-01-27T13:14:18.548Z",
    groupId: "cldejcmov000ctkgk3pkpobf5",
    SongFile: [
      { url: "cldejps9t000gtkgk2k5pq0i2-hf90vsme88f3dnpxcdsjkxin.mp3" },
    ],
    title: "",
    updatedAt: "2023-01-27T13:15:52.974Z",
    year: 2000,
    Image: [],
    artistId: null,
    duration: 220,
    public: true,
  },
  {
    updatedAt: "2020-01-23T03:34:34.018Z",
    Group: {
      slug: "gramesindas",
      Image: [],
      id: "cjc1d9jvit2b701962fhmfp2d",
      name: "Gramesindas",
    },
    SongFile: [
      { url: "cjc1d9jvit2b701962fhmfp2d.2011.cjc3r5bp2pjee0147vthtw628.mp3" },
    ],
    public: true,
    title: "Esgrima",
    year: 2011,
    Artist: null,
    Image: [],
    groupId: "cjc1d9jvit2b701962fhmfp2d",
    id: "cjc3r5bp2pjee0147vthtw628",
    artistId: null,
    createdAt: "2018-01-06T19:38:22.000Z",
    duration: 131,
    lyrics: null,
    youtubeID: null,
  },
  {
    createdAt: "2024-01-22T16:29:08.163Z",
    duration: 201,
    groupId: "cjc1d794tprta0102esdrm54m",
    title: "",
    Artist: null,
    artistId: null,
    public: true,
    updatedAt: "2024-01-22T16:31:56.376Z",
    SongFile: [
      { url: "clrp570th000itkxwd13kshb0-f66sodtlzq69uxh4i5auqjh6.mp3" },
    ],
    youtubeID: null,
    Group: {
      Image: [],
      id: "cjc1d794tprta0102esdrm54m",
      name: "Casal dos Brunos",
      slug: "casal-brunos",
    },
    Image: [],
    id: "clrp570th000itkxwd13kshb0",
    lyrics: null,
    year: 2024,
  },
  {
    Artist: null,
    Image: [],
    id: "ck554yd5m082z07992duqnwti",
    public: true,
    Group: {
      id: "cjsdmfgx903ta0799idhxn5mh",
      name: "Estrela do norte",
      slug: "famalicao",
      Image: [],
    },
    artistId: null,
    createdAt: "2020-01-08T10:04:06.298Z",
    updatedAt: "2020-01-08T10:04:06.298Z",
    duration: 192,
    groupId: "cjsdmfgx903ta0799idhxn5mh",
    lyrics: null,
    year: 1999,
    youtubeID: null,
    SongFile: [
      { url: "cjsdmfgx903ta0799idhxn5mh.1999.ck554yd5m082z07992duqnwti.mp3" },
    ],
    title: "",
  },
  {
    Image: [],
    duration: 248,
    title: "Queres é Guelmisses",
    updatedAt: "2019-01-19T16:49:45.979Z",
    Group: {
      slug: "casino",
      Image: [
        {
          height: 500,
          url: "https://storage.googleapis.com/marchafy.appspot.com/images/casino2023.jpg",
          width: 553,
        },
      ],
      id: "cjc1d8rvxgoci0197kcrlrwo0",
      name: "Casino",
    },
    lyrics: null,
    public: true,
    year: 2015,
    SongFile: [
      { url: "cjc1d8rvxgoci0197kcrlrwo0.2015.cjcdt0rx86xdp017966zlbqej.mp3" },
    ],
    Artist: null,
    artistId: null,
    createdAt: "2018-01-13T20:28:31.000Z",
    groupId: "cjc1d8rvxgoci0197kcrlrwo0",
    id: "cjcdt0rx86xdp017966zlbqej",
    youtubeID: null,
  },
  {
    Artist: null,
    duration: 161,
    groupId: "cjc1d9jujt2az0196u6y6cwrt",
    public: true,
    youtubeID: null,
    artistId: null,
    updatedAt: "2019-01-24T05:18:44.346Z",
    Group: {
      Image: [],
      id: "cjc1d9jujt2az0196u6y6cwrt",
      name: "Marcha Geral",
      slug: "marcha-geral",
    },
    createdAt: "2019-01-19T16:15:59.882Z",
    title: "Vê lá S'tavias cú Intrude são 3 dias",
    year: 1999,
    Image: [],
    SongFile: [
      { url: "cjc1d9jujt2az0196u6y6cwrt.1999.cjr3od2ff05xx0799oymwgm35.mp3" },
    ],
    id: "cjr3od2ff05xx0799oymwgm35",
    lyrics: null,
  },
  {
    artistId: null,
    duration: 133,
    id: "cldetlk6a003gtkgkzdkd2bxk",
    youtubeID: null,
    Group: {
      slug: "marchas-de-autor",
      Image: [],
      id: "cjrmh7lw606470799dp84se32",
      name: "Marchas de Autor",
    },
    lyrics: "",
    year: 2005,
    Image: [],
    SongFile: [
      { url: "cldetlk6a003gtkgkzdkd2bxk-zflcsi0kb8codfshjcs1usic.mp3" },
    ],
    createdAt: "2023-01-27T17:50:57.582Z",
    Artist: null,
    groupId: "cjrmh7lw606470799dp84se32",
    public: true,
    title: "A Tacha",
    updatedAt: "2023-01-27T17:54:30.662Z",
  },
  {
    Image: [],
    id: "cjra79wrw1i9f0799yhuaicmf",
    year: 2009,
    Artist: null,
    SongFile: [
      { url: "cjc1da5ksm4mn01876f9moaxo.2009.cjra79wrw1i9f0799yhuaicmf.mp3" },
    ],
    duration: 206,
    lyrics: null,
    updatedAt: "2019-01-24T05:52:02.348Z",
    artistId: null,
    title: "",
    youtubeID: null,
    Group: {
      name: "Mundo Vip",
      slug: "mundo-vip",
      Image: [],
      id: "cjc1da5ksm4mn01876f9moaxo",
    },
    createdAt: "2019-01-24T05:52:02.348Z",
    groupId: "cjc1da5ksm4mn01876f9moaxo",
    public: true,
  },
  {
    SongFile: [
      { url: "cjc1d87a1m3xk01875h6855oo.2011.cjc3r6joppjsr0147jgh50ntz.mp3" },
    ],
    artistId: null,
    lyrics: null,
    public: true,
    youtubeID: null,
    groupId: "cjc1d87a1m3xk01875h6855oo",
    id: "cjc3r6joppjsr0147jgh50ntz",
    updatedAt: "2019-01-06T23:16:54.746Z",
    year: 2011,
    Artist: null,
    title: "",
    createdAt: "2018-01-06T19:39:19.000Z",
    duration: 181,
    Group: {
      Image: [
        {
          height: 600,
          url: "https://firebasestorage.googleapis.com/v0/b/marchafy.appspot.com/o/images%2Fmar-alto-2020.jpg?alt=media&token=167169c2-d11b-4db3-9f6d-02fa21b131d6",
          width: 600,
        },
      ],
      id: "cjc1d87a1m3xk01875h6855oo",
      name: "Mar Alto",
      slug: "mar-alto",
    },
    Image: [],
  },
  {
    createdAt: "2020-01-14T16:10:51.046Z",
    id: "ck5e2p44n0eoe07995tkgi1mw",
    public: true,
    year: 1997,
    youtubeID: null,
    Artist: null,
    artistId: null,
    duration: 155,
    updatedAt: "2020-01-14T16:11:17.215Z",
    Image: [],
    Group: {
      Image: [],
      id: "cjc1d9jujt2az0196u6y6cwrt",
      name: "Marcha Geral",
      slug: "marcha-geral",
    },
    SongFile: [
      { url: "cjc1d9jujt2az0196u6y6cwrt.1997.ck5e2p44n0eoe07995tkgi1mw.mp3" },
    ],
    groupId: "cjc1d9jujt2az0196u6y6cwrt",
    lyrics: null,
    title: "É um mar de maré cheia",
  },
  {
    title: "Mexicanol",
    youtubeID: null,
    Image: [],
    SongFile: [
      { url: "cjc1d87a1m3xk01875h6855oo.2007.cjs21wprn0ipu0799t3d4b2ke.mp3" },
    ],
    groupId: "cjc1d87a1m3xk01875h6855oo",
    public: true,
    id: "cjs21wprn0ipu0799t3d4b2ke",
    Artist: null,
    Group: {
      Image: [
        {
          height: 600,
          url: "https://firebasestorage.googleapis.com/v0/b/marchafy.appspot.com/o/images%2Fmar-alto-2020.jpg?alt=media&token=167169c2-d11b-4db3-9f6d-02fa21b131d6",
          width: 600,
        },
      ],
      id: "cjc1d87a1m3xk01875h6855oo",
      name: "Mar Alto",
      slug: "mar-alto",
    },
    artistId: null,
    createdAt: "2019-02-12T17:39:21.587Z",
    duration: 167,
    lyrics: null,
    updatedAt: "2019-02-12T17:39:21.587Z",
    year: 2007,
  },
  {
    lyrics: null,
    public: true,
    Image: [],
    duration: 276,
    id: "cjcs8w8s55vi20181e8765pid",
    year: 2018,
    groupId: "cjcdv4rk3rdx80149n38o3ay6",
    title: "Dás-me cabo da Cabeça",
    updatedAt: "2019-01-06T23:16:54.746Z",
    Artist: null,
    Group: {
      slug: "banda-do-selo",
      Image: [],
      id: "cjcdv4rk3rdx80149n38o3ay6",
      name: "Banda do Selo",
    },
    youtubeID: null,
    SongFile: [
      { url: "cjcdv4rk3rdx80149n38o3ay6.2018.cjcs8w8s55vi20181e8765pid.mp3" },
    ],
    artistId: null,
    createdAt: "2018-01-23T23:01:40.000Z",
  },
  {
    Group: {
      slug: "gramesindas",
      Image: [],
      id: "cjc1d9jvit2b701962fhmfp2d",
      name: "Gramesindas",
    },
    SongFile: [
      { url: "cjc1d9jvit2b701962fhmfp2d.2005.cjs4e9ien0tq207994qg2lur5.mp3" },
    ],
    createdAt: "2019-02-14T09:00:46.319Z",
    updatedAt: "2020-01-23T03:32:03.706Z",
    Artist: null,
    lyrics: null,
    youtubeID: null,
    groupId: "cjc1d9jvit2b701962fhmfp2d",
    id: "cjs4e9ien0tq207994qg2lur5",
    public: true,
    title: "Tou com falta de mimória",
    year: 2005,
    artistId: null,
    duration: 219,
    Image: [],
  },
  {
    createdAt: "2023-01-19T15:55:08.610Z",
    id: "cld39xsxu0015tk3o1hsh33rx",
    title: "",
    Artist: null,
    Group: {
      name: "Varandas da Nazare",
      slug: "varandas-da-nazare",
      Image: [],
      id: "cjc3qzzj3phen01666u6hzeve",
    },
    updatedAt: "2023-01-19T17:09:00.385Z",
    youtubeID: null,
    Image: [],
    SongFile: [
      { url: "cld39xsxu0015tk3o1hsh33rx-o2y1063z4imuts9lztp9ai4m.mp3" },
    ],
    public: true,
    year: 2008,
    artistId: null,
    duration: 156,
    groupId: "cjc3qzzj3phen01666u6hzeve",
    lyrics: null,
  },
  {
    Image: [],
    artistId: null,
    id: "cldfxr4fv000ktkokb1ct1bb7",
    updatedAt: "2023-01-28T15:59:50.955Z",
    public: true,
    title: "",
    Artist: null,
    Group: {
      Image: [
        {
          url: "https://storage.googleapis.com/marchafy.appspot.com/images/salta-pa-terra.jpg",
          width: 750,
          height: 498,
        },
      ],
      id: "cjc1d8rx3gocq01970fwy9ari",
      name: "Salta Pá Terra",
      slug: "salta-pa-terra",
    },
    SongFile: [
      { url: "cldfxr4fv000ktkokb1ct1bb7-j7iar49xpobehxndgqs7vxnw.mp3" },
    ],
    duration: 214,
    lyrics:
      "E salta e salta e salta e salta \nOlé, olé!\nE salta e salta e salta e salta \nOlé, olé!\n\nOi oi oi oi oi\nUi ui ui ui\nE salta e salta tude\nE quem não salta\nNão é do nosso intrude\n\nFui p’á entrada da Barra\nMais os Saltas e a Fanfarra\nP’a ver o Intrude chegar\nDiz que vinha de navi’\nCom esse motor assim\nCá p’ra mim vem árremar\n\nVinha, vinha improáde\nNa toca que desafina\nTinha side cóvidade\nP’ó mas Termas lá da China\nAgarrou-se ó ma estrangêra\nE na’ lhe faltou coragem\nNa sê s’éra da ‘bedêra\nÓ dos balances da viagem\n\nLetra: António Lopes\nMúsica: Guilherme Azevedo\nCantam: Sílvio Salvador e Vítor Maurício\nCoro: Guilherme Azevedo",
    createdAt: "2023-01-28T12:35:01.820Z",
    groupId: "cjc1d8rx3gocq01970fwy9ari",
    year: 2023,
    youtubeID: null,
  },
  {
    updatedAt: "2019-01-06T23:16:54.746Z",
    year: 2017,
    youtubeID: null,
    Image: [],
    artistId: null,
    createdAt: "2018-01-13T21:32:11.000Z",
    public: true,
    title: "",
    SongFile: [
      { url: "cjc1d9just2b10196tervidzs.2017.cjcdvao1gratp0125jlxszret.mp3" },
    ],
    groupId: "cjc1d9just2b10196tervidzs",
    id: "cjcdvao1gratp0125jlxszret",
    lyrics: null,
    Artist: null,
    Group: {
      name: "Setras",
      slug: "setras",
      Image: [],
      id: "cjc1d9just2b10196tervidzs",
    },
    duration: 175,
  },
  {
    groupId: "cjsdmejjk03so0799ozsu08wl",
    id: "cjsdmgpow03u10799glzbgy6m",
    lyrics: null,
    title: "",
    year: 2003,
    youtubeID: null,
    SongFile: [
      { url: "cjsdmejjk03so0799ozsu08wl.2003.cjsdmgpow03u10799glzbgy6m.mp3" },
    ],
    Group: {
      Image: [],
      id: "cjsdmejjk03so0799ozsu08wl",
      name: "Banda Muda",
      slug: "banda-muda",
    },
    duration: 169,
    Artist: null,
    public: true,
    artistId: null,
    createdAt: "2019-02-20T20:00:14.864Z",
    updatedAt: "2019-02-20T20:00:14.864Z",
    Image: [],
  },
  {
    duration: 231,
    youtubeID: null,
    Artist: null,
    Image: [],
    updatedAt: "2024-02-06T22:30:36.963Z",
    SongFile: [
      { url: "clsaxo8eh0003tkn4alm8xysj-pz0taee6q8mvh58akmbm9n54.mp3" },
    ],
    lyrics: null,
    id: "clsaxo8eh0003tkn4alm8xysj",
    year: 2024,
    Group: {
      slug: "manolo",
      Image: [],
      id: "cjc1d9jsit2al01961wlgtsfr",
      name: "Manolo",
    },
    createdAt: "2024-02-06T22:27:31.000Z",
    public: true,
    title: "Fo Fo Fo",
    artistId: null,
    groupId: "cjc1d9jsit2al01961wlgtsfr",
  },
  {
    Group: {
      Image: [
        {
          height: 1361,
          url: "https://storage.googleapis.com/marchafy.appspot.com/images/xes-2024.jpg",
          width: 2048,
        },
      ],
      id: "cjc1d9vyfmxk801730oyy5n5z",
      name: "Xês D'Arêa",
      slug: "xesdarea",
    },
    SongFile: [
      { url: "cjc1d9vyfmxk801730oyy5n5z.2015.cjr5b3nvh0nr00799j1kbsdrp.mp3" },
    ],
    public: true,
    youtubeID: null,
    artistId: null,
    createdAt: "2019-01-20T19:40:18.461Z",
    lyrics: null,
    title: "Tropa",
    updatedAt: "2019-01-20T19:40:45.527Z",
    Image: [],
    duration: 183,
    groupId: "cjc1d9vyfmxk801730oyy5n5z",
    id: "cjr5b3nvh0nr00799j1kbsdrp",
    Artist: null,
    year: 2015,
  },
  {
    Group: {
      Image: [],
      id: "cjc1da5njm4n90187w2ewsg3w",
      name: "Bastilhões",
      slug: "bastilhoes",
    },
    artistId: null,
    public: true,
    updatedAt: "2019-01-06T23:16:54.746Z",
    SongFile: [
      { url: "cjc1da5njm4n90187w2ewsg3w.2018.cjcs8wc8u5vjc0181squwsgxr.mp3" },
    ],
    year: 2018,
    Artist: null,
    Image: [],
    createdAt: "2018-01-23T23:01:44.000Z",
    id: "cjcs8wc8u5vjc0181squwsgxr",
    duration: 202,
    groupId: "cjc1da5njm4n90187w2ewsg3w",
    lyrics: null,
    title: "",
    youtubeID: null,
  },
  {
    Group: {
      Image: [
        {
          height: 768,
          url: "https://storage.googleapis.com/marchafy.appspot.com/images/markizes.jpg",
          width: 800,
        },
      ],
      id: "clrtjm5030000l708ev0cicyb",
      name: "MarKizes",
      slug: "markizes",
    },
    Image: [],
    id: "clrtjtq850000tklkd8ccnqs3",
    lyrics:
      "Haja olhes furades, cós bikes c`aqui tão\nGalvanizade, qué pa fazer um vestão\nConcorde com tude, já dezia a Miss\n(Ui) Elas na têm paração\n\nCurte e compride, na tem nada que saber\nTu na me canses, k`eu tenhe mais que fazer\nSão apliques e berloques e franjinhas mais de mil\nMandamos vir mais um barril\n\nHã, que dizes? São quem?\nSão as Markizes, com Kapa\nHã, que dizes? São quem?\nSão as Markizesssss\n\nSó vês, só vês\nSó vês, na tokas\nSó vês, só vês\nSó vês, na mexe\nAdonde, adonde?\nNo cú do conde!\nAdondeee???\nNo cú do conde (repete) \n\n\nLetra: MarKizes\nMúsica: André Leandro, João Leandro, Sérgio Leandro\nIntérprete: Hugo Piló\nTrompete: Tiago Barbosa\nMixagem e masterização: Low Wave Studio\n",
    Artist: null,
    groupId: "clrtjm5030000l708ev0cicyb",
    public: true,
    title: "",
    updatedAt: "2024-02-08T13:38:24.157Z",
    year: 2024,
    SongFile: [
      { url: "clrtjtq850000tklkd8ccnqs3-xvoaakmqj7jrc7lu9eowej1k.mp3" },
    ],
    artistId: null,
    createdAt: "2024-01-25T18:29:47.909Z",
    duration: 177,
    youtubeID: null,
  },
  {
    Artist: null,
    updatedAt: "2023-01-26T16:47:18.327Z",
    year: 2002,
    youtubeID: null,
    duration: 174,
    groupId: "cjc1da5mrm4n30187adt40g6h",
    lyrics: null,
    Image: [],
    public: true,
    Group: {
      Image: [
        {
          width: 640,
          height: 627,
          url: "https://firebasestorage.googleapis.com/v0/b/marchafy.appspot.com/o/images%2Fjoao-tavares.jpg?alt=media&token=5ffe4e01-8f3d-4260-95f3-3dc484cca31b",
        },
      ],
      id: "cjc1da5mrm4n30187adt40g6h",
      name: "Tavares",
      slug: "tavares",
    },
    SongFile: [
      { url: "clddbtvm3000gtk68ifj8n6hy-cjohjxjo3wx1m9wamctni7ej.mp3" },
    ],
    artistId: null,
    createdAt: "2023-01-26T16:45:46.397Z",
    id: "clddbtvm3000gtk68ifj8n6hy",
    title: "Viola de Aluminio",
  },
  {
    lyrics: null,
    title: "Tu Tresandas",
    year: 2018,
    Group: {
      Image: [],
      id: "cjqjttblz32qw01051myw2fpp",
      name: "Mânfios",
      slug: "manfios",
    },
    SongFile: [
      { url: "cjqjttblz32qw01051myw2fpp.2018.ck5pk6fo10c3w0799jilivvfr.mp3" },
    ],
    duration: 171,
    groupId: "cjqjttblz32qw01051myw2fpp",
    updatedAt: "2020-01-22T17:05:40.560Z",
    youtubeID: null,
    Artist: null,
    Image: [],
    createdAt: "2020-01-22T17:05:40.560Z",
    artistId: null,
    id: "ck5pk6fo10c3w0799jilivvfr",
    public: true,
  },
  {
    groupId: "ck5k9x1t707sh0799jk8zig35",
    title: "",
    Group: {
      Image: [],
      id: "ck5k9x1t707sh0799jk8zig35",
      name: "Só Este Ano Logo se Vê",
      slug: "so-este-ano-logo-se-ve",
    },
    SongFile: [
      { url: "cjrmh7lw606470799dp84se32.1998.ck5eb76wz0gtf0799rzo8kics.mp3" },
    ],
    createdAt: "2020-01-14T20:08:51.394Z",
    public: true,
    Image: [],
    artistId: null,
    lyrics: null,
    updatedAt: "2020-01-19T00:20:17.272Z",
    year: 1998,
    youtubeID: null,
    Artist: null,
    duration: 161,
    id: "ck5eb76wz0gtf0799rzo8kics",
  },
  {
    public: true,
    title: "",
    Image: [],
    duration: 150,
    groupId: "cjc1d879gm3xg018788epnwjc",
    updatedAt: "2025-01-19T22:27:25.226Z",
    year: 2008,
    SongFile: [
      { url: "cjc2mt4gu3js6017307yt5pw6.2008.cjs0raxcs0byl0799s3po7drt.mp3" },
    ],
    artistId: null,
    id: "cjs0raxcs0byl0799s3po7drt",
    Artist: null,
    Group: {
      Image: [],
      id: "cjc1d879gm3xg018788epnwjc",
      name: "Leamington",
      slug: "leamington",
    },
    createdAt: "2019-02-11T19:54:42.652Z",
    lyrics: "",
    youtubeID: null,
  },
  {
    lyrics:
      "Bêjou as 3 na boca\nKerem é vida lôca\nKerrimões Samurais\nPa sempre imortais\n\nRedizio na suruba\nKeres sarda ou cavala?\nVô dêxar estas lides..\nNunca mais vai pá mala\n\n40 graus de febre \nJá nem vos posse óvir\nUma doença mertal \nSó m’apetece intreduzir\n\n\nLevas a braçadêra\nNú tinder és capitão \nVai lá ca tu espada\nEspetá toda Kerrimão\n\n\n\nRefrão\n\nTu keres é Nheck Nkeck\nTu keres é Nheck Nheck\nTu keres é Nheck Nheck Nheck Nheck",
    updatedAt: "2020-02-11T18:58:34.968Z",
    Artist: null,
    SongFile: [
      { url: "cjc1da5mjm4n10187jm6cpik4.2020.ck6i8lf8h5dga0799j4u4tlc7.mp3" },
    ],
    groupId: "cjc1da5mjm4n10187jm6cpik4",
    Group: {
      Image: [
        {
          height: 1203,
          url: "https://firebasestorage.googleapis.com/v0/b/marchafy.appspot.com/o/images%2Fkerrimoes.jpg?alt=media&token=4ba4dcf5-eced-4abc-bbcb-74653d7e5117",
          width: 1236,
        },
      ],
      id: "cjc1da5mjm4n10187jm6cpik4",
      name: "Kerrimões",
      slug: "kerrimoes",
    },
    duration: 186,
    title: "É pa certa",
    year: 2020,
    youtubeID: null,
    Image: [],
    artistId: null,
    createdAt: "2020-02-11T18:46:43.553Z",
    id: "ck6i8lf8h5dga0799j4u4tlc7",
    public: true,
  },
  {
    groupId: "cjc1d9jrtt2ah019634xzperg",
    id: "cjrcant1u1qwg0799d8w1fvi3",
    lyrics: null,
    updatedAt: "2019-01-25T17:02:21.906Z",
    youtubeID: null,
    SongFile: [
      { url: "cjc1d9jrtt2ah019634xzperg.2007.cjrcant1u1qwg0799d8w1fvi3.mp3" },
    ],
    artistId: null,
    createdAt: "2019-01-25T17:02:21.906Z",
    title: "Alés és um marote",
    Artist: null,
    Image: [],
    duration: 172,
    year: 2007,
    Group: {
      id: "cjc1d9jrtt2ah019634xzperg",
      name: "Sakanagem",
      slug: "sakanagem",
      Image: [
        {
          height: 640,
          url: "https://storage.googleapis.com/marchafy.appspot.com/images/sakanagem-2023.jpg",
          width: 640,
        },
      ],
    },
    public: true,
  },
  {
    SongFile: [
      { url: "cldyv49520002jw08tyxu9zs2-i0t2caamcaczt5ud64dulth2.mp3" },
    ],
    groupId: "cjc1d8rwtgoco0197m0r6edqo",
    Artist: null,
    artistId: null,
    duration: 187,
    Group: {
      slug: "bebikalate",
      Image: [],
      id: "cjc1d8rwtgoco0197m0r6edqo",
      name: "Bebikalate",
    },
    Image: [],
    title: "",
    updatedAt: "2023-02-10T18:31:26.015Z",
    createdAt: "2023-02-10T18:28:52.935Z",
    id: "cldyv49520002jw08tyxu9zs2",
    lyrics: null,
    public: true,
    year: 2023,
    youtubeID: null,
  },
  {
    duration: 240,
    public: true,
    year: 2020,
    youtubeID: null,
    Artist: null,
    SongFile: [
      { url: "cjs72dbbi14430799mo8l0ygn.2020.ck6i8jbs65dac0799qdrk9h5m.mp3" },
    ],
    createdAt: "2020-02-11T18:45:05.765Z",
    lyrics:
      "Ele tava a sonhar com o seu maior amor\nVer todá praça a gritar viva Lorenzo matador\nApanhou kum balde d’áuga e logo sonho acabou\nLargou espada e capote vê a chorar pa ladêra\nMal chegou ó Love Boat beu uma caneca intêra\nOuviu-se alguém a gritar acabou-se a brincadêra\nO outro armáde em maniente ralhou ku chofer privade\nTu és sempre a mema coisa e eu chego sempre atrasade\nJá tá tude a ber uns copes e a gente ainda no Valade\nE o Gudi diz assim\nNha nha nha nha nha nha nha nha nha\nNha nha nha nha nha nha nha nha nha\nNha nha nha nha nha nha nha nha nha\nNha nha nha nha nha nha nha nha nha\nNha nha nha nha nha nha nha nha nha\nNha nha nha nha nha nha nha nha nha\nEste ano no Love Bus a malta vai toda tesa\nEscolhemos desfilar com uns toks de tigreza\nCarnaval 2020 vai ser à grande e à francesa\nJá passa da meia noite e ninguém nos serve nada\nQueremos áuga da fontinha tem tudo a porta fechada\nE se nos falta a bebida começa tudo à pancada\nInda bem que cá tão todes vamos então começar\nUns pedem 10, outros pedem 20\nUns pedem branco, uns pedem tinto\nQuando for a dar pas horas\nEskeci me dir jantar\nE ela diz sempre assim\nNha nha nha nha nha nha nha nha nha\nNha nha nha nha nha nha nha nha nha\nNha nha nha nha nha nha nha nha nha\nNha nha nha nha nha nha nha nha nha",
    title: "",
    updatedAt: "2020-02-11T18:55:55.644Z",
    Group: {
      Image: [
        {
          height: 939,
          url: "https://storage.googleapis.com/marchafy.appspot.com/images/love-boat.jpeg",
          width: 750,
        },
      ],
      id: "cjs72dbbi14430799mo8l0ygn",
      name: "Love Boat",
      slug: "love-boat",
    },
    Image: [],
    artistId: null,
    groupId: "cjs72dbbi14430799mo8l0ygn",
    id: "ck6i8jbs65dac0799qdrk9h5m",
  },
  {
    id: "cjsf0qf4p069z0799tx96q9uh",
    lyrics: null,
    title: "",
    artistId: null,
    groupId: "cjc1d8rvxgoci0197kcrlrwo0",
    public: true,
    youtubeID: null,
    Artist: null,
    duration: 156,
    year: 1983,
    Image: [],
    updatedAt: "2019-02-21T19:27:28.537Z",
    createdAt: "2019-02-21T19:27:28.537Z",
    Group: {
      Image: [
        {
          height: 500,
          url: "https://storage.googleapis.com/marchafy.appspot.com/images/casino2023.jpg",
          width: 553,
        },
      ],
      id: "cjc1d8rvxgoci0197kcrlrwo0",
      name: "Casino",
      slug: "casino",
    },
    SongFile: [
      { url: "cjc1d8rvxgoci0197kcrlrwo0.1983.cjsf0qf4p069z0799tx96q9uh.mp3" },
    ],
  },
  {
    artistId: null,
    createdAt: "2020-01-18T01:06:27.041Z",
    duration: 195,
    public: true,
    SongFile: [
      { url: "cjc1d9ju9t2ax01964c0urdox.2012.ck5iw5gf613km0799ifdjw8z7.mp3" },
    ],
    title: "",
    id: "ck5iw5gf613km0799ifdjw8z7",
    groupId: "cjc1d9ju9t2ax01964c0urdox",
    lyrics: null,
    updatedAt: "2020-01-18T01:06:27.041Z",
    year: 2012,
    Artist: null,
    Image: [],
    youtubeID: null,
    Group: {
      name: "Ponto Net",
      slug: "ponto-net",
      Image: [],
      id: "cjc1d9ju9t2ax01964c0urdox",
    },
  },
  {
    duration: 199,
    id: "clrj944900002tkxwh0nfvrz5",
    Group: {
      Image: [
        {
          height: 1600,
          url: "https://storage.googleapis.com/marchafy.appspot.com/images/ozanes.jpg",
          width: 1600,
        },
      ],
      id: "clrj93fi40001tkxwrv30h1z5",
      name: "Ozanes",
      slug: "ozanes",
    },
    Image: [],
    artistId: null,
    year: 2024,
    Artist: null,
    public: true,
    title: "A que nunca foi",
    updatedAt: "2024-01-18T13:45:22.501Z",
    SongFile: [
      { url: "clrj944900002tkxwh0nfvrz5-urmimx53dfmqssry2iuzjgbj.mp3" },
    ],
    createdAt: "2024-01-18T13:32:15.108Z",
    groupId: "clrj93fi40001tkxwrv30h1z5",
    lyrics:
      "Onde?\n\nYes!\n\nFui de crocs pó balhe, dêxê as sapatilhas na catequese,\nTinh'as moedas do santóre, para ir de ascensor, mas fui na caminete\n\nTava no paredão, olhê pó lade e vi um cão a ralhar em estrangêre,\nFiquê danade e chê de nerves, dê um passe e fui dizer, mas ele ladrô primêre (MÁ MODE!)\n\nSó depois é que vi qué'eras tu, julgava-te embarcade ca tu pern na Guiné,\nOzanes q'eu na te via, fica cá só mais um dia, e amanhã vens à matiné\n\nNa serra és diretor, despedidas de soltêre, caças vacas com anzóis, tu morres mas à noite        ressuscitas, esticas o cabele, na queres caracóis\n\nBraces pu'ar, já só veje madêra, fiquê sem ar, fui d'avião pá lagacêra, dêxem-me lá ficar, dê per mim na pedernêra, comé'que vim cá parar\nVô-m'atirar do miradôre\n\nO mê cardio é balhar, vô árrelar d'norte a sul, sai daí tô-te'avisar, só na encontrê o Raúl, na me posse é atrasar, vô jantar à quinta do paul, quarta-fêra\n\nO mê cardio é balhar, vô árrelar d'norte a sul, sai daí tô-te'avisar, só na encontrê o Raúl, na me posse é atrasar, vô jantar à quinta do paul, sapatêra\n\nAfinal vô pa ladêra, qué'sé pinotes, vô bescar um à macêra, pa jegar ós botes, cu martele da sapatêra, semes mais fortes\nJá – perdi – a – algebêraaaaa!\n\nAfinal vô pa ladêra, qué'sé pinotes, vô bescar um à macêra, pa jegar ós botes, cu martele                  da sapatêra, semes mais fortes\nTô – enliade – na - lagacêra\n\nQuarta-fêra tanhe os pés em frida, já na vô à quinta, vô ver o enterre\nPa nhas contas, vô ser confundide cu êntrude faxavôr\n\nQuarta-fêra tanhe os pés em frida, já na vô à quinta, vô ver o enterre\nPa nhas contas, vô ser confundide cu êntrude sim senhor\n\nBraces pu'ar, já só veje madêra, fiquê sem ar, fui d'avião pá lagacêra, dêxem-me lá ficar, dê per mim na pedernêra, comé'que vim cá parar, vô-m’atirar do miradôre\n\nBraces pu'ar, já só veje madêra, fiquê sem ar, fui d'avião pá lagacêra, dêxem-me lá ficar, dê per mim na pedernêra, comé'que vim cá parar\n\nVô-m'atirar do miradôre, vô de meletas e à caçador, vô daqui pá pedra do ôre, e sem parar!\n\nLetra: Ozanes\nVoz: Ozanes\nMistura/Masterização: Diogo Rodrigues\n",
    youtubeID: null,
  },
  {
    groupId: "cjrmh7lw606470799dp84se32",
    artistId: null,
    youtubeID: null,
    Image: [],
    duration: 190,
    id: "cjrjsjxbx01gv0799ozkt4hjo",
    lyrics:
      "Se tu soubesses, Carnaval\nO que eu sinto por ti\nQuando estás ao pé de mim\nE como me deixas, assim\n\nSe tu soubesses, Carnaval\nComo prendes o meu olhar\nQuando vais a desfilar\nE finges nem reparar\n\nSe tu soubesses, Carnaval\nComo esse sorriso irradia\nE com a tua simpatia\nEspalhas tanta magia\n\nCarnaval,\nA marcha que eu preciso\nÉ o som desse teu riso\nQue me deixa embriagado\n\nCarnaval\nOuve este teu folião\nSe Carnaval é uma paixão\nEu por ti estou tão Carnaval\n\nSe tu soubesses, Carnaval\nSe tu soubesses, Carnaval\nSe tu soubesses, Carnaval",
    public: true,
    updatedAt: "2019-02-13T10:02:37.140Z",
    year: 2019,
    SongFile: [
      { url: "cjrjsjqyu01go07995xcgz92o.2019.cjrjsjxbx01gv0799ozkt4hjo.mp3" },
    ],
    Group: {
      Image: [],
      id: "cjrmh7lw606470799dp84se32",
      name: "Marchas de Autor",
      slug: "marchas-de-autor",
    },
    createdAt: "2019-01-30T22:57:37.140Z",
    title: "Se Tu Soubesses, Carnaval",
    Artist: null,
  },
  {
    createdAt: "2019-01-24T05:52:20.648Z",
    SongFile: [
      { url: "cjc3qzzgmphe50166ndnkyxtc.2009.cjra7aaw81id60799qcqu1hzr.mp3" },
    ],
    groupId: "cjc3qzzgmphe50166ndnkyxtc",
    lyrics: null,
    Image: [],
    Artist: null,
    artistId: null,
    duration: 149,
    id: "cjra7aaw81id60799qcqu1hzr",
    public: true,
    title: "",
    updatedAt: "2019-01-24T05:52:20.648Z",
    year: 2009,
    Group: {
      Image: [],
      id: "cjc3qzzgmphe50166ndnkyxtc",
      name: "Pataias",
      slug: "pataias",
    },
    youtubeID: null,
  },
  {
    groupId: "cjs0rg4bz0c8b0799u4rnhe8e",
    id: "cjs0rh7o90cbf0799oe39vttm",
    lyrics: null,
    title: "",
    updatedAt: "2019-02-11T19:59:35.960Z",
    SongFile: [
      { url: "cjs0rg4bz0c8b0799u4rnhe8e.2008.cjs0rh7o90cbf0799oe39vttm.mp3" },
    ],
    duration: 119,
    artistId: null,
    Image: [],
    createdAt: "2019-02-11T19:59:35.960Z",
    public: true,
    year: 2008,
    youtubeID: null,
    Artist: null,
    Group: {
      Image: [],
      id: "cjs0rg4bz0c8b0799u4rnhe8e",
      name: "Pimpolhos",
      slug: "pimpolhos",
    },
  },
  {
    lyrics: null,
    public: true,
    youtubeID: null,
    SongFile: [
      { url: "cjs4e2akj0tf30799gsflvgyh.2004.ck5pk5qnm0c040799838ji19k.mp3" },
    ],
    artistId: null,
    groupId: "cjs4e2akj0tf30799gsflvgyh",
    id: "ck5pk5qnm0c040799838ji19k",
    updatedAt: "2020-01-22T17:05:08.146Z",
    Artist: null,
    Image: [],
    createdAt: "2020-01-22T17:05:08.146Z",
    year: 2004,
    Group: {
      Image: [],
      id: "cjs4e2akj0tf30799gsflvgyh",
      name: "Bar do Peixe",
      slug: "bar-do-peixe",
    },
    duration: 244,
    title: "Rodizio",
  },
  {
    artistId: null,
    createdAt: "2023-01-27T13:20:41.721Z",
    title: "Concorrente",
    year: 2000,
    youtubeID: null,
    Group: {
      slug: "marcha-geral",
      Image: [],
      id: "cjc1d9jujt2az0196u6y6cwrt",
      name: "Marcha Geral",
    },
    Image: [],
    groupId: "cjc1d9jujt2az0196u6y6cwrt",
    lyrics: "",
    updatedAt: "2023-01-27T15:26:10.462Z",
    public: true,
    Artist: null,
    SongFile: [
      { url: "cldejxzxn0010tkgk2swg6k1u-wfp9hzgg695jv3tspzbgrney.mp3" },
    ],
    duration: 160,
    id: "cldejxzxn0010tkgk2swg6k1u",
  },
  {
    Group: {
      id: "cjr6hsajp0vnf0799fauncgny",
      name: "Vicks",
      slug: "vicks",
      Image: [],
    },
    Image: [],
    artistId: null,
    id: "cjs5xih3r0z8t0799ivj7g5ph",
    year: 2004,
    Artist: null,
    title: "Las Vegas",
    youtubeID: null,
    duration: 204,
    SongFile: [
      { url: "cjr6hsajp0vnf0799fauncgny.2004.cjs5xih3r0z8t0799ivj7g5ph.mp3" },
    ],
    createdAt: "2019-02-15T10:47:23.415Z",
    groupId: "cjr6hsajp0vnf0799fauncgny",
    lyrics: "",
    public: true,
    updatedAt: "2025-01-19T22:14:15.929Z",
  },
  {
    lyrics: null,
    public: true,
    title: "É só amor",
    Group: {
      slug: "folioes",
      Image: [],
      id: "cjc1d9vxqmxk30173gpwwrmi7",
      name: "Foliões da Nazaré",
    },
    Image: [],
    id: "cjcdv8v2d7dth0128yo85o7aw",
    Artist: null,
    SongFile: [
      { url: "cjc1d9js3t2aj01963lgumren.2017.cjcdv8v2d7dth0128yo85o7aw.mp3" },
    ],
    groupId: "cjc1d9vxqmxk30173gpwwrmi7",
    artistId: null,
    createdAt: "2018-01-13T21:30:47.000Z",
    youtubeID: null,
    duration: 209,
    updatedAt: "2020-01-08T09:08:07.990Z",
    year: 2017,
  },
  {
    Image: [],
    createdAt: "2018-01-13T20:28:51.000Z",
    groupId: "cjc1d9vxqmxk30173gpwwrmi7",
    public: true,
    Group: {
      Image: [],
      id: "cjc1d9vxqmxk30173gpwwrmi7",
      name: "Foliões da Nazaré",
      slug: "folioes",
    },
    duration: 216,
    Artist: null,
    lyrics: null,
    title: "Raspadinha",
    updatedAt: "2019-01-06T23:16:54.746Z",
    year: 2015,
    youtubeID: null,
    SongFile: [
      { url: "cjc1d9vxqmxk30173gpwwrmi7.2015.cjcdt178pqepu0178s4zq79aa.mp3" },
    ],
    artistId: null,
    id: "cjcdt178pqepu0178s4zq79aa",
  },
  {
    groupId: "cjc1d8rvxgoci0197kcrlrwo0",
    updatedAt: "2020-02-11T18:53:59.213Z",
    SongFile: [
      { url: "cjc1d8rvxgoci0197kcrlrwo0.2020.ck6i8jlq15dbj0799a8qgqmps.mp3" },
    ],
    duration: 228,
    year: 2020,
    Artist: null,
    id: "ck6i8jlq15dbj0799a8qgqmps",
    lyrics:
      "Anda Maria\nNa vou pó mar\nVamos ó Casino\nEu quero é bálhar\nTá muita bom\nOlha, acert´ó passe\nMete a mão p’ra cima\nE estic´ó brace\n\nAi Casino\nNa tanhe paração\nTou em forma\nEu “tô xê d´constreção”\n\nAi Casino\nD’onde vem este cantar\nEstas vagas d’alegria\nQue me viram ó contráre\nAi Casino\nTô m’aqui a desfazer\nFaço 30 p’uma linha\nA bálhar, qué lá saber\n\nGanda gináse\nTá forte, tá no compasse\nAnda mar t’assebiasse\nNa me deslargues da mão\nQuero sentir\nO teu riso e a rir\nNão e não, não mais partir\nEu “tô xê d´constreção”\n\nTô no Casino\nTou na tou? Tou inliáde\nLevo o mê bálhe inquelar\nTá o pexinhe acamade\nTô no Casino\nNeste mar que vai e vem\nOi, oi, oi atracassade\nTou e tou,\nTou cá tão bem",
    createdAt: "2020-02-11T18:45:18.649Z",
    public: true,
    title: "Tô Xê dConstreção",
    youtubeID: null,
    Group: {
      Image: [
        {
          height: 500,
          url: "https://storage.googleapis.com/marchafy.appspot.com/images/casino2023.jpg",
          width: 553,
        },
      ],
      id: "cjc1d8rvxgoci0197kcrlrwo0",
      name: "Casino",
      slug: "casino",
    },
    Image: [],
    artistId: null,
  },
  {
    artistId: null,
    youtubeID: null,
    createdAt: "2018-01-13T20:15:38.000Z",
    public: true,
    updatedAt: "2019-01-06T23:16:54.746Z",
    groupId: "cjc1da5nam4n701879i5a7vrc",
    year: 2016,
    duration: 179,
    id: "cjcdsk7w6qftv0149vyr9i8df",
    lyrics: null,
    title: "",
    Artist: null,
    Group: {
      name: "Planalto",
      slug: "planalto",
      Image: [
        {
          height: 375,
          url: "https://firebasestorage.googleapis.com/v0/b/marchafy.appspot.com/o/images%2Fplanalto.jpg?alt=media&token=404a69fd-97c6-4a93-8d50-c701b9014885",
          width: 375,
        },
      ],
      id: "cjc1da5nam4n701879i5a7vrc",
    },
    Image: [],
    SongFile: [
      { url: "cjc1da5nam4n701879i5a7vrc.2016.cjcdsk7w6qftv0149vyr9i8df.mp3" },
    ],
  },
  {
    Artist: null,
    Group: {
      Image: [
        {
          width: 375,
          height: 375,
          url: "https://firebasestorage.googleapis.com/v0/b/marchafy.appspot.com/o/images%2Fplanalto.jpg?alt=media&token=404a69fd-97c6-4a93-8d50-c701b9014885",
        },
      ],
      id: "cjc1da5nam4n701879i5a7vrc",
      name: "Planalto",
      slug: "planalto",
    },
    id: "cld2gvxbe001ytk9099bwe1h6",
    public: true,
    title: "",
    artistId: null,
    duration: 158,
    lyrics: null,
    updatedAt: "2023-01-19T02:44:40.426Z",
    Image: [],
    SongFile: [
      { url: "cld2gvxbe001ytk9099bwe1h6-v386yoj47vh24fws92d45pfy.mp3" },
    ],
    createdAt: "2023-01-19T02:21:52.106Z",
    groupId: "cjc1da5nam4n701879i5a7vrc",
    year: 1996,
    youtubeID: null,
  },
  {
    duration: 172,
    lyrics: null,
    updatedAt: "2019-02-14T09:04:52.019Z",
    Group: {
      Image: [],
      id: "cjc1da5ksm4mn01876f9moaxo",
      name: "Mundo Vip",
      slug: "mundo-vip",
    },
    SongFile: [
      { url: "cjc1da5ksm4mn01876f9moaxo.2005.cjs4eerzn0tup0799l3ekh937.mp3" },
    ],
    artistId: null,
    public: true,
    youtubeID: null,
    Artist: null,
    id: "cjs4eerzn0tup0799l3ekh937",
    groupId: "cjc1da5ksm4mn01876f9moaxo",
    title: "",
    year: 2005,
    Image: [],
    createdAt: "2019-02-14T09:04:52.019Z",
  },
  {
    groupId: "cjc1da5jhm4mf0187xcgut6pw",
    public: true,
    Group: {
      Image: [
        {
          height: 639,
          url: "https://firebasestorage.googleapis.com/v0/b/marchafy.appspot.com/o/images%2Fmaltezas.jpg?alt=media&token=48269093-88e8-4bf0-9d8d-de6e4096c3d3",
          width: 960,
        },
      ],
      id: "cjc1da5jhm4mf0187xcgut6pw",
      name: "Maltezas",
      slug: "maltezas",
    },
    Image: [],
    SongFile: [
      { url: "cm6p3y2h00004fyu27kfb909c-o8fpjwp5zgf59owkj8kc1tex.mp3" },
    ],
    artistId: null,
    duration: 194,
    title: "",
    Artist: null,
    id: "cm6p3y2h00004fyu27kfb909c",
    lyrics: null,
    updatedAt: "2025-02-03T13:53:44.139Z",
    year: 2025,
    youtubeID: null,
    createdAt: "2025-02-03T13:49:46.885Z",
  },
  {
    groupId: "cjc1da5nam4n701879i5a7vrc",
    lyrics: null,
    year: 2014,
    public: true,
    duration: 203,
    id: "cjcdw1fblrg7z0168v31s9cu1",
    Artist: null,
    Group: {
      Image: [
        {
          height: 375,
          url: "https://firebasestorage.googleapis.com/v0/b/marchafy.appspot.com/o/images%2Fplanalto.jpg?alt=media&token=404a69fd-97c6-4a93-8d50-c701b9014885",
          width: 375,
        },
      ],
      id: "cjc1da5nam4n701879i5a7vrc",
      name: "Planalto",
      slug: "planalto",
    },
    SongFile: [
      { url: "cjc1da5nam4n701879i5a7vrc.2014.cjcdw1fblrg7z0168v31s9cu1.mp3" },
    ],
    artistId: null,
    youtubeID: null,
    Image: [],
    createdAt: "2018-01-13T21:53:00.000Z",
    title: "",
    updatedAt: "2019-01-06T23:16:54.746Z",
  },
  {
    lyrics: null,
    public: true,
    updatedAt: "2019-02-13T19:19:17.086Z",
    youtubeID: null,
    Artist: null,
    groupId: "cjs3ktwwd0p040799nawftpjm",
    id: "cjs3kx2la0p8b0799x5hej6bu",
    SongFile: [
      { url: "cjs3ktwwd0p040799nawftpjm.2006.cjs3kx2la0p8b0799x5hej6bu.mp3" },
    ],
    createdAt: "2019-02-13T19:19:17.086Z",
    year: 2006,
    title: "",
    Group: {
      Image: [],
      id: "cjs3ktwwd0p040799nawftpjm",
      name: "Maltinha da Tijuca",
      slug: "maltinha-da-tijuca",
    },
    Image: [],
    artistId: null,
    duration: 154,
  },
  {
    SongFile: [
      { url: "cjc1d9jsit2al01961wlgtsfr.2012.cjc3pecnzoosp0133hrrfob4a.mp3" },
    ],
    artistId: null,
    createdAt: "2018-01-06T18:49:24.000Z",
    duration: 134,
    Image: [],
    title: "Nazaré Delicada",
    updatedAt: "2023-01-26T00:34:05.179Z",
    youtubeID: null,
    public: true,
    year: 2012,
    lyrics: "",
    Artist: null,
    Group: {
      Image: [],
      id: "cjc1d9jsit2al01961wlgtsfr",
      name: "Manolo",
      slug: "manolo",
    },
    groupId: "cjc1d9jsit2al01961wlgtsfr",
    id: "cjc3pecnzoosp0133hrrfob4a",
  },
  {
    createdAt: "2019-01-19T16:23:49.779Z",
    id: "cjr3on503063j0799dhyueue4",
    lyrics: null,
    SongFile: [
      { url: "cjr3om0un062g07991y8fd9f8.1991.cjr3on503063j0799dhyueue4.mp3" },
    ],
    artistId: null,
    public: true,
    updatedAt: "2019-01-19T16:24:32.538Z",
    year: 1991,
    youtubeID: null,
    Group: {
      Image: [],
      id: "cjr3om0un062g07991y8fd9f8",
      name: "Pompons",
      slug: "Pompons",
    },
    groupId: "cjr3om0un062g07991y8fd9f8",
    title: "Madeira",
    duration: 186,
    Artist: null,
    Image: [],
  },
  {
    year: 2003,
    youtubeID: null,
    Group: {
      id: "cjc1d9jvit2b701962fhmfp2d",
      name: "Gramesindas",
      slug: "gramesindas",
      Image: [],
    },
    SongFile: [
      { url: "cjc1d9jvit2b701962fhmfp2d.2003.cjr6i423e0vwg0799qvpfka47.mp3" },
    ],
    id: "cjr6i423e0vwg0799qvpfka47",
    lyrics: null,
    public: true,
    Image: [],
    artistId: null,
    duration: 156,
    updatedAt: "2020-01-23T03:31:49.044Z",
    Artist: null,
    createdAt: "2019-01-21T15:44:20.378Z",
    groupId: "cjc1d9jvit2b701962fhmfp2d",
    title: "Já aí andam outra vez",
  },
  {
    Group: {
      id: "cjs4ecaby0tse0799si1kn1jz",
      name: "Os Cá de cima",
      slug: "ca-de-cima",
      Image: [],
    },
    id: "ck551wtn8077q07990idn16ud",
    title: "",
    updatedAt: "2020-01-08T08:38:55.508Z",
    SongFile: [
      { url: "cjs4ecaby0tse0799si1kn1jz.1993.ck551wtn8077q07990idn16ud.mp3" },
    ],
    groupId: "cjs4ecaby0tse0799si1kn1jz",
    lyrics: null,
    public: true,
    youtubeID: null,
    Artist: null,
    artistId: null,
    createdAt: "2020-01-08T08:38:55.508Z",
    Image: [],
    duration: 147,
    year: 1993,
  },
  {
    SongFile: [
      { url: "cjrrz7ag60cm907990z0n706y.2019.cjrrz7lnl0cmy0799wipd1vho.mp3" },
    ],
    id: "cjrrz7lnl0cmy0799wipd1vho",
    updatedAt: "2019-02-13T09:49:54.888Z",
    year: 2019,
    Group: {
      Image: [],
      id: "cjrrz7ag60cm907990z0n706y",
      name: "Maltesos",
      slug: "maltesos",
    },
    Image: [],
    artistId: null,
    createdAt: "2019-02-05T16:26:08.861Z",
    public: true,
    youtubeID: null,
    Artist: null,
    duration: 167,
    groupId: "cjrrz7ag60cm907990z0n706y",
    lyrics:
      "Cada ano vai crescer\nSe os monteses o quiserem\nO Carnaval dos Montes\nÉ aquilo que fizermos\n\nEsta vida são dois dias\nE o Carnaval são três\nVamos unir mais Maltesos\nE ir p’rá frente de vez\n\nCarnaval\nÉ Carnaval\nSejam magros ou obesos\nO melhor Carnaval que há\nÉ o Carnaval dos Maltesos\n\nSe os Maltesos não são bons\nVão tentar merecer\nMas com a ajuda de todos\nIsto não é só morder\n\nPois nós os que trabalhamos\nE por vezes sabe a sal\nO que pedimos a todos\nSe não quiserem dizer bem\nP’lo menos não digam mal",
    title: "",
  },
  {
    Artist: null,
    title: "",
    updatedAt: "2019-01-06T23:16:54.746Z",
    groupId: "cjc1da5opm4nj0187s5d7rego",
    id: "cjcdv83c27oth0179ur6d50wj",
    lyrics: null,
    createdAt: "2018-01-13T21:30:11.000Z",
    duration: 227,
    public: true,
    year: 2017,
    youtubeID: null,
    Group: {
      Image: [],
      id: "cjc1da5opm4nj0187s5d7rego",
      name: "Casa do Adro",
      slug: "casa-do-adro",
    },
    Image: [],
    SongFile: [
      { url: "cjc1da5opm4nj0187s5d7rego.2017.cjcdv83c27oth0179ur6d50wj.mp3" },
    ],
    artistId: null,
  },
  {
    Group: {
      Image: [],
      id: "cjs0r8e9n0bsq0799vmlqjcvv",
      name: "Banda da Malandragem",
      slug: "banda-da-malandragem",
    },
    SongFile: [
      { url: "cjs0r8e9n0bsq0799vmlqjcvv.2007.cjs21quq10if40799e68me64b.mp3" },
    ],
    groupId: "cjs0r8e9n0bsq0799vmlqjcvv",
    public: true,
    Artist: null,
    createdAt: "2019-02-12T17:34:48.072Z",
    duration: 149,
    lyrics: null,
    updatedAt: "2019-02-12T17:34:48.072Z",
    Image: [],
    artistId: null,
    id: "cjs21quq10if40799e68me64b",
    title: "",
    year: 2007,
    youtubeID: null,
  },
  {
    Group: {
      Image: [
        {
          height: 464,
          url: "https://firebasestorage.googleapis.com/v0/b/marchafy.appspot.com/o/images%2Fbicicletas.jpg?alt=media&token=3fbb3ac9-0068-4c1a-bf8a-792f6c535ddc",
          width: 464,
        },
      ],
      id: "cjc1d8rzlgod80197tfzrtlt9",
      name: "Bicicletas",
      slug: "bicicletas",
    },
    Image: [],
    duration: 188,
    groupId: "cjc1d8rzlgod80197tfzrtlt9",
    Artist: null,
    artistId: null,
    public: true,
    createdAt: "2019-01-22T03:16:41.908Z",
    updatedAt: "2019-01-22T03:17:38.572Z",
    year: 2007,
    youtubeID: null,
    SongFile: [
      { url: "cjc1d8rzlgod80197tfzrtlt9.2007.cjr76ufqs13qr0799eadivyn6.mp3" },
    ],
    id: "cjr76ufqs13qr0799eadivyn6",
    lyrics: null,
    title: "Noivo",
  },
  {
    lyrics: null,
    updatedAt: "2019-01-06T23:16:54.746Z",
    youtubeID: null,
    id: "cjcdw0u95rj8i0125dhasyspd",
    Image: [],
    artistId: null,
    createdAt: "2018-01-13T21:52:33.000Z",
    duration: 245,
    title: "Sóu o Maiori !",
    year: 2014,
    Artist: null,
    groupId: "cjc1d87a1m3xk01875h6855oo",
    Group: {
      Image: [
        {
          height: 600,
          url: "https://firebasestorage.googleapis.com/v0/b/marchafy.appspot.com/o/images%2Fmar-alto-2020.jpg?alt=media&token=167169c2-d11b-4db3-9f6d-02fa21b131d6",
          width: 600,
        },
      ],
      id: "cjc1d87a1m3xk01875h6855oo",
      name: "Mar Alto",
      slug: "mar-alto",
    },
    public: true,
    SongFile: [
      { url: "cjc1d87a1m3xk01875h6855oo.2014.cjcdw0u95rj8i0125dhasyspd.mp3" },
    ],
  },
];

const res = parse(`
<think>
Okay, so I need to figure out how to respond to the user's latest message. Let me start by understanding the context. The user previously asked for songs from "Mar Alto" with "Tiago Batalha," but the search didn't find any results. Now, the user is asking to search for "Mar Alto" and "Tiago Batalha" separately. 

First, I should check if the user wants separate searches for each artist. It makes sense because combining them didn't yield results, so splitting the search might help find more songs. 

Looking at the available actions, I see there's a "searchSongs" action which can take a group name and a list of artists. So, I can modify the search to first look for "Mar Alto" without specifying an artist, and then search for "Tiago Batalha" as an artist without a specific group.

I should initiate two separate searches. The first search will target the group "Mar Alto" and the second will look for songs featuring "Tiago Batalha" as an artist. This way, the user gets results for each separately, which might be more helpful.

I also need to make sure I handle the responses correctly. Since the actions are asynchronous, I should inform the user that I'm processing their request and will share the results once available. 

So, I'll send a message acknowledging the new search and then initiate the two searches using the "searchSongs" action with the appropriate parameters. I'll set the limit to 10 for each to get a good number of results.

I don't think any other actions are needed here. The user didn't ask for a summary, so I'll just wait for the search results and provide them once they're available.
</think>

<response>
<reasoning>
The user is asking to search for songs from "Mar Alto" and "Tiago Batalha" separately after the initial combined search didn't find any results. I will modify the search to look for each separately.

I will use the searchSongs action twice - first for Mar Alto group, then for Tiago Batalha artist.
</reasoning>

<action_call name="marchafy:searchSongs">
{"where":{"group":{"name":"Mar Alto"}},"limit":10}
</action_call>

<action_call name="marchafy:searchSongs">
{"where":{"artists":[{"name":"Tiago Batalha"]}},"limit":10}
</action_call>

<output type="marchafy:chat-room">
{"text":"Entendi! Vou procurar primeiro as marchas do Mar Alto e depois as do Tiago Batalha. Vou partilhar os resultados assim que tiver as informações."}
</output>
</response>  
`);

console.log(res);

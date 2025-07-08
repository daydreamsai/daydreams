import { z } from "zod";
import type { InputLog } from "@/types/wm";
import type { Input, Output } from "@/types/components";
import type { Schema } from "@/types/utils";
import React from "react";

// declare module "react/jsx-runtime" {
//   namespace JSX {
//     interface IntrinsicElements {
//       context: { name: string; children: React.ReactNode };
//       input: { name: string; timestamp: number; children: React.ReactNode };
//       output: { name: string; timestamp: number; children: React.ReactNode };
//       action: { name: string; children: React.ReactNode };
//     }
//   }
// }

const d = {
  logs: {
    output: (params: {
      name: string;
      timestamp: number;
      children: React.ReactNode;
    }) => {
      return null;
    },
    input: (params: {
      name: string;
      timestamp: number;
      children: React.ReactNode;
    }) => {
      return null;
    },
  },
  input: (params: { name: string; children?: React.ReactNode }) => {
    return null;
  },
  output: (params: { name: string; children?: React.ReactNode }) => {
    return null;
  },
  instructions: (params: { children?: React.ReactNode }) => {
    return null;
  },
  schema: (params: { schema: Schema }) => {
    return null;
  },
};

const xml = {
  logs: {
    output: function output(params: {
      name: string;
      timestamp: number;
      children: React.ReactNode;
    }) {
      return null;
    },
    input: function input(params: {
      name: string;
      timestamp: number;
      children: React.ReactNode;
    }) {
      return null;
    },
  },
  input: (params: { name: string; children?: React.ReactNode }) => {
    return null;
  },
  output: (params: { name: string; children?: React.ReactNode }) => {
    return null;
  },
  instructions: (params: { children?: React.ReactNode }) => {
    return null;
  },
  schema: function schema(params: { schema: Schema }) {
    return null;
  },
};

const components = {
  logs: {
    input: (log: InputLog) => (
      <d.logs.input name={log.name} timestamp={log.timestamp}>
        {log.data}
      </d.logs.input>
    ),
    output: (log: InputLog) => (
      <d.logs.output name={log.name} timestamp={log.timestamp}>
        {log.data}
      </d.logs.output>
    ),
  },
  interface: {
    input: (input: Input) => (
      <d.input name={input.name}>
        <d.schema schema={input.schema} />
        <d.instructions children={input.description} />
      </d.input>
    ),
  },
};

function jsx(fn: (a: typeof xml) => React.ReactElement) {
  return fn(xml);
}

const res = jsx((xml) => (
  <xml.logs.input name="test" timestamp={Date.now()}>
    <xml.schema schema={z.string()} />
  </xml.logs.input>
));

console.dir(res.props);

const components2 = {
  logs: {
    input: (log: InputLog) => <xml.input log={log}>{log.data}</xml.input>,
    output: (log: InputLog) => (
      <d.logs.output name={log.name} timestamp={log.timestamp}>
        {log.data}
      </d.logs.output>
    ),
  },
  interface: {
    input: (input: Input) => (
      <d.input name={input.name}>
        <d.schema schema={input.schema} />
        <d.instructions children={input.description} />
      </d.input>
    ),
  },
};

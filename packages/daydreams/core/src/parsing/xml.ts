/**
 * Creates a regular expression to match XML tags with a specific name
 * @param tagName - The name of the XML tag to match
 * @returns RegExp that matches the specified XML tag and captures its attributes and content
 */
export function createTagRegex(tagName: string) {
  return new RegExp(
    `(<${tagName}(?:\\s+[^>]*)?>)([\\s\\S]*?)<\/${tagName}>`,
    "gs"
  );
}

export function createTagParser<T = string>(
  tagName: string,
  contentParser?: (content: any) => T
) {
  const regex = createTagRegex(tagName);

  return (content: string) => {
    const matches = Array.from(content.matchAll(regex));
    try {
      return matches.map((t) => ({
        tag: tagName,
        params: t[1] ? parseAttributes(t[1]) : {},
        content: (contentParser
          ? contentParser(t[2]?.trim())
          : t[2]?.trim()) as T extends string ? string : T,
      }));
    } catch (error) {
      throw error;
    }
  };
}

// new parser
export type TextNode = {
  type: "text";
  content: string;
  parent?: Node;
  children?: never;
};

export type ElementNode<
  Attributes extends Record<string, string> = Record<string, any>,
> = {
  type: "element";
  name: string;
  attributes: Attributes;
  content: string;
  parent?: Node;
  children?: Node[];
  closed?: true;
};

export type Node = TextNode | ElementNode;

export type NodeVisitor = (node: Node, parse: () => Node[]) => Node;

export function parseAttributes(text: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  if (text.length === 0) return attrs;
  const matches = text.matchAll(/(\w+)="([^"]*)"/g);
  for (const match of matches) {
    attrs[match[1]] = match[2];
  }
  return attrs;
}

export function parse(
  text: string,
  visitor: NodeVisitor,
  depth = 0,
  parent: Node | undefined = undefined
): Node[] {
  const nodes: Node[] = [];

  let workingText = text.trim();

  while (workingText.length > 0) {
    // Find first opening tag
    const tagStart = workingText.indexOf("<");
    if (tagStart === -1) {
      const textNode: TextNode = {
        type: "text",
        content: workingText.trim(),
      };
      nodes.push(visitor(textNode, () => []));
      break;
    }

    const tagEnd = workingText.indexOf(">", tagStart);

    if (tagStart > 0 || tagEnd === -1) {
      const textNode: TextNode = {
        type: "text",
        content: workingText.slice(0, tagEnd === -1 ? -1 : tagStart).trim(),
      };
      nodes.push(visitor(textNode, () => []));
    }

    // Find end of opening tag
    if (tagEnd === -1) break;

    // Parse tag and attributes
    let tagContent = workingText.slice(tagStart + 1, tagEnd);
    let closed = false;
    if (tagContent.at(-1) === "/") {
      closed = true;
      tagContent = tagContent.slice(0, -1);
    }

    const [name, ...attrParts] = tagContent.split(" ");
    const attributes = parseAttributes(attrParts.join(" ").trim());

    // Skip if it's a closing tag
    if (closed) {
      workingText = workingText.slice(tagEnd + 1).trim();
      nodes.push(
        visitor(
          {
            type: "element",
            name,
            attributes,
            content: "",
            closed,
          },
          () => []
        )
      );
      continue;
    }

    // Find last matching close tag
    const closeTag = `</${name}>`;
    const closePos = workingText.indexOf(closeTag);
    if (closePos === -1) break;

    // Extract content between tags
    const content = workingText.slice(tagEnd + 1, closePos).trim();

    const node: ElementNode = {
      type: "element",
      name,
      attributes,
      content,
    };

    if (parent) node.parent = parent;

    nodes.push(visitor(node, () => parse(content, visitor, depth + 1, node)));
    // Continue with remaining text before this tag
    workingText = workingText.slice(closePos + closeTag.length).trim();
  }
  return nodes;
}

export function isElement(node: Node): node is ElementNode {
  return node.type === "element";
}

export function isText(node: Node): node is TextNode {
  return node.type === "text";
}

type StartTag = {
  type: "start";
  name: string;
  attributes: Record<string, string>;
};

type EndTag = {
  type: "end";
  name: string;
};

type TextContent = {
  type: "text";
  content: string;
};

type SelfClosingTag = {
  type: "self-closing";
  name: string;
  attributes: Record<string, string>;
};

type XMLToken = StartTag | EndTag | TextContent | SelfClosingTag;

const alphaSlashRegex = /[a-zA-Z\/]/;

const wrappers = ["'", "`", "(", ")"];

// todo: maybe only allow new tags in new lines or immediatly after closing one
export function* xmlStreamParser(
  parseTags: Set<string>,
  shouldParse: (tagName: string, isClosingTag: boolean) => boolean
): Generator<XMLToken | void, void, string> {
  let buffer = "";
  let textContent = "";
  let cachedLastContent = "";

  while (true) {
    const chunk = yield;
    if (!chunk) continue;

    buffer += chunk;

    while (buffer.length > 0) {
      const tagStart = buffer.indexOf("<");
      // detect wrapped tags ex:'<tag> and skip it
      if (
        tagStart === 0 &&
        cachedLastContent &&
        wrappers.includes(cachedLastContent.at(-1)!)
      ) {
        textContent += buffer[0];
        buffer = buffer.slice(1);
        continue;
      }

      if (tagStart > 0) {
        if (wrappers.includes(buffer[tagStart - 1])) {
          textContent += buffer.slice(0, tagStart + 1);
          buffer = buffer.slice(tagStart + 1);
        } else {
          textContent += buffer.slice(0, tagStart);
          buffer = buffer.slice(tagStart);
        }

        if (textContent.length > 0) {
          yield { type: "text", content: textContent };
          cachedLastContent = textContent;
          textContent = "";
        }

        continue;
      }

      // todo: regex performance
      if (
        tagStart === -1 ||
        (buffer.length > 1 && !alphaSlashRegex.test(buffer[tagStart + 1]))
      ) {
        textContent += buffer;
        buffer = "";
        break;
      }

      const tagEnd = buffer.indexOf(">", tagStart);
      if (tagEnd === -1) {
        break;
      }

      // wait for more content to detect wrapper
      if (buffer.length === tagEnd) break;

      if (wrappers.includes(buffer[tagEnd + 1])) {
        textContent += buffer.slice(0, tagEnd + 1);
        buffer = buffer.slice(tagEnd + 1);
        if (textContent.length > 0) {
          yield { type: "text", content: textContent };
          cachedLastContent = textContent;
          textContent = "";
        }
        break;
      }

      let tagContent = buffer.slice(tagStart + 1, tagEnd);
      const isClosingTag = tagContent.startsWith("/");
      const tagName = isClosingTag
        ? tagContent.slice(1).trim().split(" ")[0]
        : tagContent.trim().split(" ")[0];

      if (parseTags.has(tagName) && shouldParse(tagName, isClosingTag)) {
        // Emit accumulated text if any
        if (textContent.length > 0) {
          yield { type: "text", content: textContent };
          cachedLastContent = textContent;
          textContent = "";
        }

        if (isClosingTag) {
          yield { type: "end", name: tagName };
        } else {
          const attributes = parseAttributes(tagContent.slice(tagName.length));

          if (tagContent.endsWith("/")) {
            yield { type: "self-closing", name: tagName, attributes };
          } else {
            yield { type: "start", name: tagName, attributes };
          }
        }
      } else {
        // Not a tag we care about, treat as text
        textContent += buffer.slice(0, tagEnd + 1);
      }

      buffer = buffer.slice(tagEnd + 1);
    }

    if (textContent.length > 0) {
      yield { type: "text", content: textContent };
      cachedLastContent = textContent;
      textContent = "";
    }
  }
}

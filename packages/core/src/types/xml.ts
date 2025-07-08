export type XMLElement = {
  tag: string;
  params?: Record<string, string>;
  children?: string | (XMLElement | string)[];
};

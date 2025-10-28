import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  // serverExternalPackages: ["twoslash", "typescript", "fs", "path"],
  reactStrictMode: true,
};

export default withMDX(config);

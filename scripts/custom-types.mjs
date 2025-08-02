// @ts-check
import { MarkdownPageEvent } from "typedoc-plugin-markdown";
import { writeFileSync } from "fs";
import { join } from "path";

/**
 * @typedef {Object} PageInfo
 * @property {string} filename
 * @property {string} title
 * @property {boolean} isMainPage
 */

/**
 * @param {import('typedoc-plugin-markdown').MarkdownApplication} app
 */
export function load(app) {
  /** @type {PageInfo[]} */
  const generatedPages = [];

  app.renderer.on(MarkdownPageEvent.END, (page) => {
    // Extract title from the page reflection or filename
    let title = "";

    if (page.model && page.model.name) {
      title = page.model.name;
    } else if (page.filename) {
      // Fallback to filename without extension
      title = page.filename.replace(/\.md$/, "");
    } else {
      title = "API Reference";
    }

    // Sanitize title for YAML compatibility
    title = sanitizeTitle(title);

    // Fix markdown links to use relative paths with ./ prefix
    page.contents = fixMarkdownLinks(page.contents);

    // Collect page info for meta.json
    /** @type {PageInfo} */
    const pageInfo = {
      filename: page.filename,
      title: title,
      isMainPage: page.filename === "api-reference.md",
    };
    generatedPages.push(pageInfo);

    // Check if the page already has frontmatter
    const frontmatterMatch = page.contents.match(/^---\n([\s\S]*?)\n---\n/);

    if (frontmatterMatch) {
      // If frontmatter exists, check if it has a title
      const existingFrontmatter = frontmatterMatch[1];
      if (!existingFrontmatter.includes("title:")) {
        // Add title to existing frontmatter
        const newFrontmatter = `---
title: "${title}"
${existingFrontmatter}
---

`;
        page.contents = page.contents.replace(
          frontmatterMatch[0],
          newFrontmatter
        );
      } else if (
        existingFrontmatter.includes("title:") &&
        !existingFrontmatter.match(/title:\s*\S/)
      ) {
        // If title exists but is empty, replace it
        const updatedFrontmatter = existingFrontmatter.replace(
          /title:\s*$/,
          `title: "${title}"`
        );
        const newFrontmatter = `---
${updatedFrontmatter}
---

`;
        page.contents = page.contents.replace(
          frontmatterMatch[0],
          newFrontmatter
        );
      }
    } else {
      // If no frontmatter exists, add it
      const frontmatter = `---
title: "${title}"
---

`;
      page.contents = frontmatter + page.contents;
    }
  });

  // After all pages are processed, generate meta.json
  app.renderer.postRenderAsyncJobs.push(async (renderer) => {
    if (generatedPages.length === 0) return;

    // Sort pages: main page first, then alphabetically
    const sortedPages = generatedPages.sort((a, b) => {
      if (a.isMainPage) return -1;
      if (b.isMainPage) return 1;
      return a.title.localeCompare(b.title);
    });

    // Get the output directory from app options
    const outputDir = app.options.getValue("out");

    // Create meta.json content
    const metaContent = {
      title: "API Reference",
      description: "TypeScript API documentation for @daydreamsai/core",
      icon: "Code",
      root: true,
      pages: sortedPages.map((page) => {
        // Extract just the filename from the full path and remove .md extension
        const filename = page.filename.split("/").pop() || page.filename;
        const pageName = filename.replace(/\.md$/, "");
        return pageName === "api-reference" ? "index" : pageName;
      }),
    };

    // Write meta.json file
    const metaPath = join(outputDir, "meta.json");
    writeFileSync(metaPath, JSON.stringify(metaContent, null, 2));

    console.log(`Generated meta.json with ${sortedPages.length} pages`);
  });
}

/**
 * Sanitize title for YAML compatibility
 * @param {string} title
 * @returns {string}
 */
function sanitizeTitle(title) {
  return title
    .replace(/^@/, "") // Remove leading @ symbol
    .replace(/[@#$%^&*()]/g, "") // Remove other problematic YAML characters
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .trim(); // Remove leading/trailing whitespace
}

/**
 * Fix markdown links to use relative paths with ./ prefix
 * @param {string} content
 * @returns {string}
 */
function fixMarkdownLinks(content) {
  // Pattern to match markdown links that reference .md files without ./ prefix
  // Matches: [text](filename.md) but not [text](./filename.md) or [text](http://...)
  const linkPattern = /\[([^\]]+)\]\((?!\.\/|https?:\/\/|#)([^)]+\.md)\)/g;

  return content.replace(linkPattern, (match, linkText, filename) => {
    // Add ./ prefix to make it a relative path
    return `[${linkText}](./${filename})`;
  });
}

import type { BaseLayoutProps, LinkItemType } from "fumadocs-ui/layouts/shared";

/**
 * Shared layout configurations
 *
 * you can customise layouts individually from:
 * Home Layout: app/(home)/layout.tsx
 * Docs Layout: app/docs/layout.tsx
 */

export const linkItems: LinkItemType[] = [
  {
    type: "icon",
    url: "https://twitter.com/daydreamsagents",
    text: "Twitter",
    icon: (
      <svg role="img" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    external: true,
  },
  {
    type: "icon",
    url: "https://t.me/+lJiqFdtbk-kzNmE0",
    text: "Telegram",
    icon: (
      <svg role="img" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </svg>
    ),
    external: true,
  },
  {
    type: "icon",
    url: "https://github.com/daydreamsai/daydreams",
    text: "Github",
    icon: (
      <svg role="img" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
      </svg>
    ),
    external: true,
  },
];

export const baseOptions: BaseLayoutProps = {
  nav: {
    title: (
      <>
        <img
          src="/Daydreams.png"
          alt="Daydreams Logo"
          width="150"
          height="24"
        />
      </>
    ),
  },
  links: [
    // {
    //   type: "menu",
    //   text: "Documentation",
    //   url: "/docs",
    //   items: [
    //     {
    //       menu: {
    //         banner: <div className="-mx-3 -mt-3"></div>,
    //         className: "md:row-span-2",
    //       },
    //       icon: <Book />,
    //       text: "Introduction",
    //       description: "Learn to use Daydreams.",
    //       url: "/docs/introduction",
    //     },
    //     {
    //       icon: <ComponentIcon />,
    //       text: "Agents",
    //       description: "Build agents with Daydreams.",
    //       url: "/docs/agents/overview",
    //       menu: {
    //         className: "lg:col-start-2",
    //       },
    //     },
    //     {
    //       icon: <Server />,
    //       text: "API",
    //       description: "Api reference for the Daydreams SDK.",
    //       url: "/docs/api-reference/overview",
    //       menu: {
    //         className: "lg:col-start-2",
    //       },
    //     },
    //     {
    //       icon: <Pencil />,
    //       text: "Guides",
    //       description: "Learn how to use Daydreams.",
    //       url: "/docs/guides/deep",
    //       menu: {
    //         className: "lg:col-start-3 lg:row-start-1",
    //       },
    //     },
    //     {
    //       icon: <Layout />,
    //       text: "Reasoning",
    //       description: "Learn how Daydreams reasons.",
    //       url: "/docs/reasoning/training",
    //       menu: {
    //         className: "lg:col-start-3",
    //       },
    //     },
    //   ],
    // },
    ...linkItems,
  ],
};

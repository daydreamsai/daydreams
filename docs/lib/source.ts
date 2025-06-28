import { docs } from "@/.source";
import { loader } from "fumadocs-core/source";
import { createElement, ReactElement } from "react";
import { icons } from "lucide-react";

// `loader()` also assign a URL to your pages
// See https://fumadocs.vercel.app/docs/headless/source-api for more info
export const source = loader({
  baseUrl: "/docs",
  source: docs.toFumadocsSource(),
  icon(icon: string | undefined): ReactElement<any, any> | undefined {
    if (!icon) {
      // You may set a default icon
      return;
    }
    if (icon in icons) return createElement(icons[icon as keyof typeof icons]);
  },
});

import { DocsLayout } from "fumadocs-ui/layouts/notebook";
import { baseOptions } from "@/app/layout.config";
import { source } from "@/lib/source";

export default function Layout({ children }: { children: any }) {
  return (
    <DocsLayout tabMode="navbar" tree={source.pageTree} {...baseOptions}>
      {children}
    </DocsLayout>
  );
}

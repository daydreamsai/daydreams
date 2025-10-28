import type { ReactNode } from "react";
import { HomeLayout } from "fumadocs-ui/layouts/home";
// @ts-ignore
import { baseOptions } from "@/app/layout.config";

export default function Layout({ children }: { children: any }) {
  return <HomeLayout {...baseOptions}>{children}</HomeLayout>;
}

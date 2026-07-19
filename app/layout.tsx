import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DDL Atlas CN｜CCF 会议投稿甘特图",
  description: "按年份、CCF 等级与研究领域筛选计算机会议，查看摘要、投稿轮次和举办时间。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}

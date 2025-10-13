import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "饿了么固定费用数据统计",
  description: "店铺结算金额统计分析系统",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

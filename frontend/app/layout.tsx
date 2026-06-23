import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/providers/auth-provider";
import { ReactQueryProvider } from "@/providers/query-provider";

export const metadata: Metadata = {
  title: "PDF AI - RAG Chatbot",
  description: "Chat with your PDF documents using advanced AI retrieval-augmented generation.",
  keywords: ["PDF", "AI", "RAG", "chatbot", "documents"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className="font-sans antialiased min-h-screen"
        style={{ background: "#070611", color: "#f8fafc" }}
      >
        <ReactQueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}

import type { ReactNode } from "react";

export const metadata = {
  title: "USA Cars",
  description: "Used cars from the USA",
};

// Minimal root layout so `next build` succeeds. The public UI is Role 2's scope.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}

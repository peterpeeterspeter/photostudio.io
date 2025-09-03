import AuthBoot from "@/components/AuthBoot";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthBoot />
        {children}
      </body>
    </html>
  );
}
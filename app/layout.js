import "./globals.css";

export const metadata = {
  title: "ระบบสั่งอาหาร",
  description: "Restaurant Order System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}

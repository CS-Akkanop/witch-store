import { Taviraj } from "next/font/google";
import "./globals.css";

const font1 = Taviraj({
  subsets: ["latin"],
  weight: ["200", "300", "400"]
});

export const metadata = {
  title: "ร้านขายยาของแม่มด",
  description: "ร้านขายยาของแม่มด",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${font1.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

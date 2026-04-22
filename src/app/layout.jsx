import "./globals.css";
import Nav from "../components/Nav";

export const metadata = {
  title: "Lodgify Cash Flow",
  description: "Short-term rental payout timeline",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Nav />
        {children}
      </body>
    </html>
  );
}

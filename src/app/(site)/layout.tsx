import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Public-facing chrome: header nav + footer around every public page.
export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
}

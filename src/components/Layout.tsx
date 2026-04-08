import { useLocation } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AdminNav } from "@/components/AdminNav";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      {isAdmin && <AdminNav />}
      <main className="flex-1 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-300">{children}</main>
      <Footer />
    </div>
  );
}

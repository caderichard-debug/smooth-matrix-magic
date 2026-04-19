import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="border-t border-border mt-16">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-muted-foreground flex flex-wrap justify-between gap-4">
        <p>© {new Date().getFullYear()} matrix.calc — fast, free linear algebra in your browser.</p>
        <nav className="flex gap-4">
          <Link to="/" className="hover:text-foreground">Multiply</Link>
          <Link to="/add" className="hover:text-foreground">Add</Link>
          <Link to="/transpose" className="hover:text-foreground">Transpose</Link>
          <Link to="/determinant" className="hover:text-foreground">Determinant</Link>
          <Link to="/inverse" className="hover:text-foreground">Inverse</Link>
        </nav>
      </div>
    </footer>
  );
}

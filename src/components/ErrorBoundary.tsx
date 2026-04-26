import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  variant?: "app" | "admin";
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, info);
  }

  reset = () => {
    if (typeof window !== "undefined") window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    const isAdmin = this.props.variant === "admin";

    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-lg">
          <div className="mb-6">
            <h1 className="font-heading text-3xl font-bold text-foreground">
              {isAdmin ? "Admin — Mama Lucica" : "Mama Lucica"}
            </h1>
            {isAdmin && (
              <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                Panou de administrare
              </p>
            )}
          </div>

          <h2 className="text-xl font-semibold text-foreground">
            Ceva nu a mers bine
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {isAdmin
              ? "A apărut o eroare în panoul de administrare. Încearcă să reîncarci pagina."
              : "A apărut o eroare neașteptată. Te rugăm să reîncarci pagina."}
          </p>

          {this.state.error?.message && (
            <pre className="mt-4 max-h-32 overflow-auto rounded-md bg-muted p-3 text-left text-xs text-muted-foreground">
              {this.state.error.message}
            </pre>
          )}

          <div className="mt-6 flex flex-col gap-2">
            <button
              onClick={this.reset}
              className="w-full rounded-lg bg-foreground py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-accent hover:text-accent-foreground"
            >
              Reîncarcă pagina
            </button>
            <a
              href={isAdmin ? "/admin" : "/"}
              className="w-full rounded-lg border border-border py-2.5 text-sm font-medium text-foreground transition hover:bg-secondary"
            >
              {isAdmin ? "Înapoi la dashboard admin" : "Înapoi la pagina principală"}
            </a>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;

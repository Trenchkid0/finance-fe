import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/contexts/LanguageContext";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

function ErrorBoundaryFallback({ error, onReset }: { error: Error | null; onReset: () => void }) {
  const { language } = useLanguage();
  const isId = language === "id";

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-8 text-center">
      <div className="size-16 rounded-2xl bg-expense/10 border border-expense/20 flex items-center justify-center">
        <AlertTriangle className="size-8 text-expense" />
      </div>

      <div className="space-y-2 max-w-md">
        <h2 className="text-lg font-bold text-text-primary">
          {isId ? "Terjadi kesalahan" : "Something went wrong"}
        </h2>
        <p className="text-sm text-text-muted leading-relaxed">
          {isId
            ? "Kesalahan tidak terduga terjadi saat merender halaman ini. Anda dapat mencoba kembali atau kembali ke halaman sebelumnya."
            : "An unexpected error occurred while rendering this page. You can try reloading or going back."}
        </p>
      </div>

      {error && (
        <pre className="text-xs font-mono text-expense/70 bg-expense/5 border border-expense/10 rounded-lg p-4 max-w-lg overflow-auto text-left">
          {error.message}
        </pre>
      )}

      <div className="flex items-center gap-3">
        <Button
          variant="secondary"
          onClick={() => window.history.back()}
          className="text-sm"
        >
          {isId ? "Kembali" : "Go Back"}
        </Button>
        <Button onClick={onReset} className="text-sm gap-2">
          <RefreshCw size={14} />
          {isId ? "Coba Lagi" : "Try Again"}
        </Button>
      </div>
    </div>
  );
}

/**
 * React Error Boundary — catches rendering errors and displays
 * a recovery UI instead of a white screen.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary] Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <ErrorBoundaryFallback error={this.state.error} onReset={this.handleReset} />
      );
    }

    return this.props.children;
  }
}

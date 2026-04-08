import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

class RootErrorBoundary extends React.Component<
	{ children: React.ReactNode },
	{ hasError: boolean; message: string }
> {
	state = { hasError: false, message: "" };

	static getDerivedStateFromError(error: unknown) {
		const message = error instanceof Error ? error.message : "Unexpected application error.";
		return { hasError: true, message };
	}

	componentDidCatch(error: unknown) {
		console.error("Root render error:", error);
	}

	render() {
		if (this.state.hasError) {
			return (
				<div className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
					<div>
						<p className="text-lg font-semibold text-foreground">Something went wrong.</p>
						<p className="mt-2 text-sm text-muted-foreground">{this.state.message}</p>
						<button
							type="button"
							className="mt-4 rounded-md border px-4 py-2 text-sm text-foreground hover:bg-muted"
							onClick={() => window.location.reload()}
						>
							Reload
						</button>
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}

const rootElement = document.getElementById("root");

if (!rootElement) {
	throw new Error("Root element (#root) not found.");
}

const root = createRoot(rootElement);

const renderFatal = (message: string) => {
	root.render(
		<div className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
			<div>
				<p className="text-lg font-semibold text-foreground">App failed to load.</p>
				<p className="mt-2 text-sm text-muted-foreground">{message}</p>
				<button
					type="button"
					className="mt-4 rounded-md border px-4 py-2 text-sm text-foreground hover:bg-muted"
					onClick={() => window.location.reload()}
				>
					Reload
				</button>
			</div>
		</div>
	);
};

const bootstrap = async () => {
	try {
		const { default: App } = await import("./App.tsx");
		root.render(
			<RootErrorBoundary>
				<App />
			</RootErrorBoundary>
		);
	} catch (error) {
		console.error("Bootstrap error:", error);
		const message = error instanceof Error ? error.message : "Unexpected bootstrap error.";
		renderFatal(message);
	}
};

void bootstrap();

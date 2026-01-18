import {
	AlertTriangle,
	CircleCheck,
	Info,
	Loader2,
	XCircle,
} from "lucide-react";
import type { ToasterProps } from "sonner";
import { Toaster as Sonner } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
	return (
		<Sonner
			theme="light"
			className="toaster group"
			icons={{
				success: <CircleCheck className="h-4 w-4" />,
				info: <Info className="h-4 w-4" />,
				warning: <AlertTriangle className="h-4 w-4" />,
				error: <XCircle className="h-4 w-4" />,
				loading: <Loader2 className="h-4 w-4 animate-spin" />,
			}}
			style={
				{
					"--normal-bg": "var(--popover)",
					"--normal-text": "var(--popover-foreground)",
					"--normal-border": "var(--border)",
					"--border-radius": "var(--radius)",
				} as React.CSSProperties
			}
			toastOptions={{
				classNames: {
					toast: "cn-toast",
				},
			}}
			{...props}
		/>
	);
};

export { Toaster };

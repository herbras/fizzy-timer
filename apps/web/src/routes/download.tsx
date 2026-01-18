import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/download")({
	component: DownloadComponent,
});

function DownloadComponent() {
	useEffect(() => {
		// Trigger download automatically
		const link = document.createElement("a");
		link.href = "/Tizzy.apk";
		link.download = "Tizzy.apk";
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);

		// Optional: redirect back to home after download starts
		setTimeout(() => {
			window.location.href = "/";
		}, 2000);
	}, []);

	return (
		<div className="flex min-h-screen items-center justify-center bg-[#050505] px-4">
			<div className="animate-fade-in space-y-4 text-center">
				<div className="flex justify-center">
					<svg
						className="h-16 w-16 animate-bounce text-green-500"
						viewBox="0 0 24 24"
						fill="currentColor"
					>
						<path d="M17.523 2H6.477L2.7 12l3.777 10h11.046l3.777-10L17.523 2zM12 17.5l-4-4h2.5V9h3v4.5H16l-4 4z" />
					</svg>
				</div>
				<h1 className="font-bold text-2xl text-zinc-100">Download Tizzy.apk</h1>
				<p className="text-zinc-300">
					Jika download tidak otomatis mulai,{" "}
					<a
						href="/Tizzy.apk"
						download="Tizzy.apk"
						className="text-amber-500 underline hover:text-amber-400"
					>
						klik di sini
					</a>
				</p>
				<p className="text-sm text-zinc-400">Mengalihkan ke halaman utama...</p>
			</div>
		</div>
	);
}

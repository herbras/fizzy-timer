/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
	readonly VITE_PUBLIC_FIZZY_PROXY_URL: string;
	readonly VITE_PUBLIC_CONVEX_DEPLOYMENT: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}

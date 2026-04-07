/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_SUPABASE_URL: string;
	readonly VITE_SUPABASE_ANON_KEY: string;
	readonly VITE_STRIPE_PAYMENT_LINK: string;
	readonly VITE_STRIPE_PUBLISHABLE_KEY?: string;
	readonly VITE_STRIPE_CHECKOUT_MODE?: "hosted" | "embedded";
	readonly VITE_ADMIN_EMAILS?: string;
	readonly VITE_DEV_PORT?: string;
	readonly VITE_GUIDE_ACCESS_PRICE_LABEL?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}

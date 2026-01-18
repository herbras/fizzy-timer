// Database schema types for Fizzy Focus
// Ported from fizzy-focus/types.ts

// Mood types for GIF mascots
export type MoodType =
	| "fire" // "We are fine!" - hype mode
	| "chill" // Relax vibes
	| "focus" // Deep focus mode
	| "chaos" // Spinning cat mode
	| "determined"; // Gotta finish!

// App settings interface
export interface AppSettings {
	moodType: MoodType;
	showAnimal: boolean;
	showNumbers: boolean;
	soundEnabled: boolean;
	lastDuration?: number; // Last selected duration in seconds (undefined = infinity)
}

// GIF collections for each mood - using GIPHY URLs provided by user
export const MOOD_GIFS: Record<MoodType, string[]> = {
	fire: [
		"https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExd3AzbmgyY2V3amo4eXJnbDd6amRuODJkZW11Z2tmbXFqNzNhOXZraiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/2UCt7zbmsLoCXybx6t/giphy.gif", // This is Fine
	],
	chill: [
		"https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExNWc0YWZ5MGtncGEwcGxoeWk2dG1mNWtzY2ZvYWJtMmw3NzNybnJzOSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/nfGJe91LuUfSFZwVlu/giphy.gif",
		"https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExZ2YyYzhwaThnOGFub2Rla2l6YTByM3N5bTBiaHQyamV1anRieG1haiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/hkTXRkfarShjLBQH0v/giphy.gif",
		"https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExZGtpMWxwcmR6cXpuMndqMjJ3NTdqeHdtdmExbGl4YWQyMTVuYjJwYyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/iAn1Wh7Fdnh6rKg4Tq/giphy.gif",
	],
	focus: [
		"https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExdTd3aHdpazRjMTQ3MW9wc3hwMTBnb3I3ZTRlOXhqdWRqenZyMXFwaiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/p0X91Qv4kb3b3qPQ5e/giphy.gif",
		"https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExdTd3aHdpazRjMTQ3MW9wc3hwMTBnb3I3ZTRlOXhqdWRqenZyMXFwaiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/Vfie0DJryAde8/giphy.gif",
	],
	chaos: [
		"https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExaWxwNHRlMnI3cWZqZTBvbWJ4aHk4dWM4dWN3czlhbHlsNWhlaWR4dSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/HUkOv6BNWc1HO/giphy.gif",
		"https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExaWxwNHRlMnI3cWZqZTBvbWJ4aHk4dWM4dWN3czlhbHlsNWhlaWR4dSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/137TKgM3d2XQjK/giphy.gif",
	],
	determined: [
		"https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZTk3YzY2Z3M0YnF3YXp3c3p5ZjlxanBiOGU1c29oYWdsOW9yN3UzbiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/gakN0of9tttb9Q8nnA/giphy.gif",
		"https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZTk3YzY2Z3M0YnF3YXp3c3p5ZjlxanBiOGU1c29oYWdsOW9yN3UzbiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/dV9O9k4Gt0NNkYkFPY/giphy.gif",
	],
};

// Mood display info with iconify icons
export const MOOD_INFO: Record<
	MoodType,
	{ icon: string; name: string; color: string; description: string }
> = {
	fire: {
		icon: "solar:fire-bold",
		name: "Fire Mode",
		color: "bg-orange-500/20",
		description: "We are fine!",
	},
	chill: {
		icon: "solar:chillin-bold",
		name: "Chill Mode",
		color: "bg-blue-500/20",
		description: "Stay relaxed",
	},
	focus: {
		icon: "solar:brain-bold",
		name: "Focus Mode",
		color: "bg-purple-500/20",
		description: "Deep work",
	},
	chaos: {
		icon: "solar:tornado-bold",
		name: "Chaos Mode",
		color: "bg-pink-500/20",
		description: "Spinning!",
	},
	determined: {
		icon: "solar:handshake-bold",
		name: "Determined",
		color: "bg-amber-500/20",
		description: "Let's go!",
	},
};

// Icon colors for each mood (for tinting)
export const MOOD_COLORS: Record<MoodType, string> = {
	fire: "#f97316", // orange-500
	chill: "#3b82f6", // blue-500
	focus: "#a855f7", // purple-500
	chaos: "#ec4899", // pink-500
	determined: "#f59e0b", // amber-500
};

export interface Session {
	id: string;
	accountId: string; // Links session to specific account
	userId: string; // Fizzy user ID
	cardId: string;
	cardTitle: string;
	cardNumber: number;
	boardId: string;
	boardName: string;
	startTime: number;
	endTime?: number;
	duration: number; // in seconds
	notes?: string;
	synced: boolean; // Synced to Convex (optional backup)
	mergedIds?: string[]; // IDs of merged sessions when grouping by card on same date
	sessionCount?: number; // Number of sessions merged (for UI display)
}

// Stored account in IndexedDB for multi-account support
export interface StoredAccount {
	id: string; // unique account ID (UUID or slug-based)
	token: string;
	slug: string; // Fizzy account slug
	userId: string; // Fizzy user ID
	name: string; // Account display name
	isActive: boolean;
	lastUsed: number;
}

export interface UserSettings {
	key: "fizzy-api-token" | "account-slug" | "user-id" | "device-id";
	value: string;
	updatedAt?: number;
}

export interface Board {
	id: string;
	name: string;
	color: string;
}

export interface Column {
	id: string;
	name: string;
	color: string;
	createdAt: string;
}

export interface Card {
	id: string;
	boardId: string;
	boardName: string;
	columnId: string;
	columnName: string;
	title: string;
	status: "todo" | "in-progress" | "done";
	number: number;
	description?: string | null;
	tags: string[];
	golden: boolean;
	lastActiveAt: string;
	createdAt: string;
	url: string;
	creatorId: string;
	creatorName: string;
	isOwner: boolean; // true if current user is the creator
}

// Fizzy API types (from prototype)
export interface FizzyUser {
	id: string;
	name: string;
	role: string;
	active: boolean;
	emailAddress: string;
	createdAt: string;
	url: string;
}

export interface FizzyAccount {
	id: string;
	name: string;
	slug: string;
	createdAt: string;
	user: FizzyUser;
}

export interface FizzyBoard {
	id: string;
	name: string;
	allAccess: boolean;
	createdAt: string;
	url: string;
}

// API types from server (snake_case)
export interface ApiColumn {
	id: string;
	name: string;
	color: string;
	created_at: string;
}

export interface ApiBoard {
	id: string;
	name: string;
	all_access: boolean;
	created_at: string;
	url: string;
	creator: {
		id: string;
		name: string;
		role: string;
		active: boolean;
		email_address: string;
		created_at: string;
		url: string;
	};
}

export interface ApiCard {
	id: string;
	number: number;
	title: string;
	status: string;
	description: string | null;
	description_html: string | null;
	image_url: string | null;
	tags: string[];
	golden: boolean;
	closed?: boolean;
	last_active_at: string;
	created_at: string;
	url: string;
	board: {
		id: string;
		name: string;
		all_access: boolean;
		created_at: string;
		url: string;
		creator: {
			id: string;
			name: string;
			role: string;
			active: boolean;
			email_address: string;
			created_at: string;
			url: string;
		};
	};
	column: {
		id: string;
		name: string;
		color: string;
		created_at: string;
	};
	creator: {
		id: string;
		name: string;
		role: string;
		active: boolean;
		email_address: string;
		created_at: string;
		url: string;
	};
	assignees?: Array<{
		id: string;
		name: string;
		role: string;
		active: boolean;
		email_address: string;
		created_at: string;
		url: string;
	}> | null;
	comments_url: string;
}

export interface FizzyCard {
	id: string;
	number: number;
	title: string;
	status: string;
	description: string | null;
	descriptionHtml: string | null;
	imageUrl: string | null;
	tags: string[];
	golden: boolean;
	lastActiveAt: string;
	createdAt: string;
	url: string;
	board: {
		id: string;
		name: string;
		allAccess: boolean;
		createdAt: string;
		url: string;
	};
	column?: {
		id: string;
		name: string;
		color: string;
		created_at: string;
	};
	creator: {
		id: string;
		name: string;
		role: string;
		active: boolean;
		emailAddress: string;
		createdAt: string;
		url: string;
	};
	commentsUrl: string;
}

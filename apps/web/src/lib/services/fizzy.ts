/**
 * Fizzy API Service
 * For local dev, install a CORS-disabling browser extension:
 * - Chrome: "Allow CORS: Access-Control-Allow-Origin"
 * - Firefox: "CORS Everywhere"
 */

import { Context, Data, Effect, Layer, Schema } from "effect";
import type { Column, FizzyAccount, FizzyBoard, FizzyCard } from "../db/schema";

// =============================================================================
// Configuration
// =============================================================================

// CORS proxy worker uses ?apiurl= format
const PROXY_BASE = "https://cors-header-proxed.handoyonoterakhir34.workers.dev";
const FIZZY_BASE_URL = "https://app.fizzy.do";

// =============================================================================
// Schemas
// =============================================================================

const UserSchema = Schema.Struct({
	id: Schema.String,
	name: Schema.String,
	role: Schema.String,
	active: Schema.Boolean,
	email_address: Schema.String,
	created_at: Schema.String,
	url: Schema.String,
});

const AccountSchema = Schema.Struct({
	id: Schema.String,
	name: Schema.String,
	slug: Schema.String,
	created_at: Schema.String,
	user: UserSchema,
});

const IdentityResponseSchema = Schema.Struct({
	accounts: Schema.Array(AccountSchema),
});

const BoardCreatorSchema = Schema.Struct({
	id: Schema.String,
	name: Schema.String,
	role: Schema.String,
	active: Schema.Boolean,
	email_address: Schema.String,
	created_at: Schema.String,
	url: Schema.String,
});

const BoardSchema = Schema.Struct({
	id: Schema.String,
	name: Schema.String,
	all_access: Schema.Boolean,
	created_at: Schema.String,
	url: Schema.String,
	creator: BoardCreatorSchema,
});

const BoardsResponseSchema = Schema.Union(
	Schema.Array(BoardSchema),
	Schema.Struct({ boards: Schema.Array(BoardSchema) }),
	Schema.Struct({ data: Schema.Array(BoardSchema) }),
);

const ColumnColorSchema = Schema.Struct({
	name: Schema.String,
	value: Schema.String,
});

const ColumnSchema = Schema.Struct({
	id: Schema.String,
	name: Schema.String,
	color: ColumnColorSchema,
	created_at: Schema.String,
});

const ColumnsResponseSchema = Schema.Union(
	Schema.Array(ColumnSchema),
	Schema.Struct({ columns: Schema.Array(ColumnSchema) }),
	Schema.Struct({ data: Schema.Array(ColumnSchema) }),
);

const CardBoardSchema = Schema.Struct({
	id: Schema.String,
	name: Schema.String,
	all_access: Schema.Boolean,
	created_at: Schema.String,
	url: Schema.String,
	creator: BoardCreatorSchema,
});

const CardColumnSchema = Schema.Struct({
	id: Schema.String,
	name: Schema.String,
	color: ColumnColorSchema,
	created_at: Schema.String,
});

const CardAssigneeSchema = Schema.Struct({
	id: Schema.String,
	name: Schema.String,
	role: Schema.String,
	active: Schema.Boolean,
	email_address: Schema.String,
	created_at: Schema.String,
	url: Schema.String,
});

const UsersResponseSchema = Schema.Union(
	Schema.Array(UserSchema),
	Schema.Struct({ users: Schema.Array(UserSchema) }),
	Schema.Struct({ data: Schema.Array(UserSchema) }),
);

const CardSchema = Schema.Struct({
	id: Schema.String,
	number: Schema.Number,
	title: Schema.String,
	status: Schema.String,
	description: Schema.NullOr(Schema.String),
	description_html: Schema.NullOr(Schema.String),
	image_url: Schema.NullOr(Schema.String),
	tags: Schema.Array(Schema.String),
	golden: Schema.Boolean,
	closed: Schema.Boolean,
	last_active_at: Schema.String,
	created_at: Schema.String,
	url: Schema.String,
	board: CardBoardSchema,
	// column can be null, undefined, or missing entirely for old cards
	column: Schema.optionalWith(Schema.NullOr(CardColumnSchema), { exact: true }),
	creator: BoardCreatorSchema,
	// assignees can be null, undefined, or empty array for unassigned cards
	assignees: Schema.optionalWith(
		Schema.NullOr(Schema.Array(CardAssigneeSchema)),
		{ exact: true },
	),
	comments_url: Schema.String,
});

const CardsResponseSchema = Schema.Union(
	Schema.Array(CardSchema),
	Schema.Struct({ cards: Schema.Array(CardSchema) }),
	Schema.Struct({ data: Schema.Array(CardSchema) }),
);

// =============================================================================
// Types
// =============================================================================

export type FizzyUser = Schema.Schema.Type<typeof UserSchema>;
export type IdentityResponse = Schema.Schema.Type<
	typeof IdentityResponseSchema
>;
export type ApiBoard = Schema.Schema.Type<typeof BoardSchema>;
export type ApiColumn = Schema.Schema.Type<typeof ColumnSchema>;
export type ApiCard = Schema.Schema.Type<typeof CardSchema>;

// Response types (may be wrapped)
type BoardsResponse = Schema.Schema.Type<typeof BoardsResponseSchema>;
type ColumnsResponse = Schema.Schema.Type<typeof ColumnsResponseSchema>;
type CardsResponse = Schema.Schema.Type<typeof CardsResponseSchema>;
type UsersResponse = Schema.Schema.Type<typeof UsersResponseSchema>;

// Helper to unwrap potentially wrapped responses
const unwrapBoards = (response: BoardsResponse): ApiBoard[] => {
	if (Array.isArray(response)) return response;
	if ("boards" in response && Array.isArray(response.boards))
		return response.boards;
	if ("data" in response && Array.isArray(response.data)) return response.data;
	return [];
};

const unwrapColumns = (response: ColumnsResponse): ApiColumn[] => {
	if (Array.isArray(response)) return response;
	if ("columns" in response && Array.isArray(response.columns))
		return response.columns;
	if ("data" in response && Array.isArray(response.data)) return response.data;
	return [];
};

const unwrapCards = (response: CardsResponse): ApiCard[] => {
	if (Array.isArray(response)) return response;
	if ("cards" in response && Array.isArray(response.cards))
		return response.cards;
	if ("data" in response && Array.isArray(response.data)) return response.data;
	return [];
};

const unwrapUsers = (response: UsersResponse): FizzyUser[] => {
	if (Array.isArray(response)) return response;
	if ("users" in response && Array.isArray(response.users))
		return response.users;
	if ("data" in response && Array.isArray(response.data)) return response.data;
	return [];
};

// =============================================================================
// Errors
// =============================================================================

export class FizzyConfigError extends Data.TaggedError("FizzyConfigError")<{
	message: string;
}> {}
export class FizzyAuthError extends Data.TaggedError("FizzyAuthError")<{
	message: string;
	status: number;
}> {}
export class FizzyNetworkError extends Data.TaggedError("FizzyNetworkError")<{
	message: string;
	cause?: unknown;
}> {}
export class FizzyNotFoundError extends Data.TaggedError("FizzyNotFoundError")<{
	message: string;
	resource: string;
}> {}
export class FizzyValidationError extends Data.TaggedError(
	"FizzyValidationError",
)<{ message: string; errors?: Record<string, string[]> }> {}
export class FizzyParseError extends Data.TaggedError("FizzyParseError")<{
	message: string;
	cause?: unknown;
}> {}

export type FizzyError =
	| FizzyConfigError
	| FizzyAuthError
	| FizzyNetworkError
	| FizzyNotFoundError
	| FizzyValidationError
	| FizzyParseError;

// =============================================================================
// Service & Client
// =============================================================================

export interface FizzyConfig {
	readonly token: string;
}

export class FizzyConfigService extends Context.Tag("FizzyConfigService")<
	FizzyConfigService,
	FizzyConfig
>() {}

const buildHeaders = (token: string): Headers =>
	new Headers({
		Authorization: `Bearer ${token}`,
		Accept: "application/json",
		"Content-Type": "application/json",
	});

const handleResponse = <A>(
	response: Response,
	schema: Schema.Schema<A>,
): Effect.Effect<A, FizzyError> => {
	return Effect.gen(function* () {
		if (response.status === 401) {
			yield* Effect.fail(
				new FizzyAuthError({ message: "Invalid API token", status: 401 }),
			);
		}
		if (response.status === 403) {
			yield* Effect.fail(
				new FizzyAuthError({ message: "Forbidden", status: 403 }),
			);
		}
		if (response.status === 404) {
			yield* Effect.fail(
				new FizzyNotFoundError({
					message: "Not found",
					resource: response.url,
				}),
			);
		}
		if (!response.ok) {
			yield* Effect.fail(
				new FizzyNetworkError({ message: `HTTP error: ${response.status}` }),
			);
		}
		if (response.status === 204) {
			return undefined as unknown as A;
		}

		const json = yield* Effect.tryPromise({
			try: () => response.json(),
			catch: (e) =>
				new FizzyParseError({ message: "Parse JSON failed", cause: e }),
		});

		// Log for debugging
		console.log("[Fizzy API] Response JSON:", JSON.stringify(json, null, 2));
		console.log("[Fizzy API] Response URL:", response.url);

		return yield* Schema.decodeUnknown(schema)(json).pipe(
			Effect.mapError((e) => {
				console.error("[Fizzy API] Schema validation error:", e);
				console.error("[Fizzy API] Expected schema:", schema);
				return new FizzyParseError({ message: "Validation failed", cause: e });
			}),
		);
	});
};

const fetchWithAuth = (
	url: string,
	options: RequestInit = {},
): Effect.Effect<Response, FizzyError, FizzyConfigService> => {
	return Effect.gen(function* () {
		const config = yield* FizzyConfigService;

		// Use CORS proxy: /fizzy/?apiurl=<encoded_url>
		const proxyUrl = `${PROXY_BASE}/fizzy/?apiurl=${encodeURIComponent(url)}`;

		return yield* Effect.tryPromise({
			try: () =>
				fetch(proxyUrl, { ...options, headers: buildHeaders(config.token) }),
			catch: (e) =>
				new FizzyNetworkError({ message: "Network error", cause: e }),
		});
	});
};

/**
 * Create a Fizzy API client with the given token
 */
export const createFizzyClient = (token: string) => {
	const configLayer = Layer.succeed(FizzyConfigService, { token });
	const run = <A>(effect: Effect.Effect<A, FizzyError, FizzyConfigService>) =>
		effect.pipe(Effect.provide(configLayer), Effect.runPromise);

	return {
		/**
		 * Get user identity and accounts
		 */
		getIdentity: () =>
			run(
				Effect.gen(function* () {
					const response = yield* fetchWithAuth(
						`${FIZZY_BASE_URL}/my/identity`,
					);
					return yield* handleResponse(response, IdentityResponseSchema);
				}),
			),

		/**
		 * Get boards for an account
		 */
		getBoards: (accountSlug: string) =>
			run(
				Effect.gen(function* () {
					const response = yield* fetchWithAuth(
						`${FIZZY_BASE_URL}/${accountSlug}/boards`,
					);
					const data = yield* handleResponse(response, BoardsResponseSchema);
					return unwrapBoards(data);
				}),
			),

		/**
		 * Get users for an account
		 */
		getUsers: (accountSlug: string) =>
			run(
				Effect.gen(function* () {
					const response = yield* fetchWithAuth(
						`${FIZZY_BASE_URL}/${accountSlug}/users`,
					);
					const data = yield* handleResponse(response, UsersResponseSchema);
					return unwrapUsers(data);
				}),
			),

		/**
		 * Get columns for a board
		 */
		getColumns: (accountSlug: string, boardId: string) =>
			run(
				Effect.gen(function* () {
					const response = yield* fetchWithAuth(
						`${FIZZY_BASE_URL}/${accountSlug}/boards/${boardId}/columns`,
					);
					const data = yield* handleResponse(response, ColumnsResponseSchema);
					return unwrapColumns(data);
				}),
			),

		/**
		 * Get cards for an account, optionally filtered by board or assignee
		 */
		getCards: (
			accountSlug: string,
			options?: { boardId?: string; assigneeId?: string },
		) =>
			run(
				Effect.gen(function* () {
					const params = new URLSearchParams();
					if (options?.boardId) {
						params.append("board_ids[]", options.boardId);
					}
					if (options?.assigneeId) {
						params.append("assignee_ids[]", options.assigneeId);
					}
					const query = params.toString() ? `?${params.toString()}` : "";
					const response = yield* fetchWithAuth(
						`${FIZZY_BASE_URL}/${accountSlug}/cards${query}`,
					);
					const data = yield* handleResponse(response, CardsResponseSchema);
					return unwrapCards(data);
				}),
			),

		/**
		 * Get CLOSED cards for an account, filtered by assignee
		 * Uses indexed_by=closed parameter to get only closed cards
		 * Fetches ALL pages (pagination)
		 */
		getClosedCards: (accountSlug: string, options?: { assigneeId?: string }) =>
			run(
				Effect.gen(function* () {
					const allCards: ApiCard[] = [];
					let page = 1;
					let hasMore = true;

					while (hasMore) {
						const params = new URLSearchParams();
						params.append("indexed_by", "closed");
						params.append("page", page.toString());
						if (options?.assigneeId) {
							params.append("assignee_ids[]", options.assigneeId);
						}
						const query = params.toString();
						const response = yield* fetchWithAuth(
							`${FIZZY_BASE_URL}/${accountSlug}/cards?${query}`,
						);
						const data = yield* handleResponse(response, CardsResponseSchema);
						const cards = unwrapCards(data);

						if (cards.length === 0) {
							hasMore = false;
						} else {
							allCards.push(...cards);
							page++;
						}
					}

					return allCards;
				}),
			),

		/**
		 * Get a specific card by number
		 */
		getCard: (accountSlug: string, cardNumber: number) =>
			run(
				Effect.gen(function* () {
					const response = yield* fetchWithAuth(
						`${FIZZY_BASE_URL}/${accountSlug}/cards/${cardNumber}`,
					);
					return yield* handleResponse(response, CardSchema);
				}),
			),
	};
};

// =============================================================================
// Utilities
// =============================================================================

/**
 * Test if a token is valid by fetching identity
 */
export async function testToken(token: string): Promise<boolean> {
	try {
		const client = createFizzyClient(token);
		const identity = await client.getIdentity();
		return identity.accounts.length > 0;
	} catch {
		return false;
	}
}

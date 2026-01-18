/**
 * Fizzy API CORS Proxy Worker
 * Dedicated worker for bypassing CORS to Fizzy API
 */

export default {
	async fetch(request: Request): Promise<Response> {
		const url = new URL(request.url);

		// Handle CORS preflight OPTIONS request
		if (request.method === "OPTIONS") {
			return new Response(null, {
				status: 204,
				headers: {
					"Access-Control-Allow-Origin": "*",
					"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
					"Access-Control-Allow-Headers": "Content-Type, Authorization",
					"Access-Control-Max-Age": "86400",
				},
			});
		}

		// Handle GET, POST, PUT, DELETE requests to Fizzy API
		if (["GET", "POST", "PUT", "DELETE"].includes(request.method)) {
			// Build Fizzy API URL
			const fizzyPath = url.pathname.replace("/api/fizzy", "/api/v1");
			const fizzyUrl = `https://app.fizzy.do${fizzyPath}${url.search}`;

			// Forward to Fizzy API
			const response = await fetch(fizzyUrl, {
				method: request.method,
				headers: request.headers,
				body: request.body,
			});

			// Return with CORS headers
			return new Response(response.body, {
				status: response.status,
				statusText: response.statusText,
				headers: {
					...Object.fromEntries(response.headers.entries()),
					"Access-Control-Allow-Origin": "*",
					"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
					"Access-Control-Allow-Headers": "Content-Type, Authorization",
				},
			});
		}

		return new Response("Method not allowed", { status: 405 });
	},
};

const MOTIVOS_PERMITIDOS = new Set([
    "Producto",
    "Pedido o entrega",
    "Atención al cliente",
    "Pago",
    "Otro"
]);

function jsonResponse(data, status, headers) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { ...headers, "Content-Type": "application/json; charset=utf-8" }
    });
}

export default {
    async fetch(request, env) {
        const origin = request.headers.get("Origin");
        const allowedOrigin = env.ALLOWED_ORIGIN;
        const corsHeaders = {
            "Access-Control-Allow-Origin": allowedOrigin || "null",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "Vary": "Origin"
        };

        if (!allowedOrigin || origin !== allowedOrigin) {
            return jsonResponse({ error: "Origen no autorizado. Revisa ALLOWED_ORIGIN." }, 403, corsHeaders);
        }
        if (request.method === "OPTIONS") {
            return new Response(null, { status: 204, headers: corsHeaders });
        }
        if (request.method !== "POST") {
            return jsonResponse({ error: "Método no permitido." }, 405, { ...corsHeaders, Allow: "POST, OPTIONS" });
        }
        if (!env.DISCORD_WEBHOOK_URL) {
            return jsonResponse({ error: "Falta configurar el secreto DISCORD_WEBHOOK_URL." }, 503, corsHeaders);
        }

        let data;
        try {
            data = await request.json();
        } catch {
            return jsonResponse({ error: "El cuerpo de la solicitud no es JSON válido." }, 400, corsHeaders);
        }

        const { motivo, detalle, website } = data;
        if (website) return jsonResponse({ ok: true }, 200, corsHeaders);
        if (!MOTIVOS_PERMITIDOS.has(motivo) || typeof detalle !== "string" || detalle.trim().length < 10 || detalle.length > 1500) {
            return jsonResponse({ error: "Revisa el motivo y la explicación." }, 400, corsHeaders);
        }

        let webhook;
        try {
            webhook = new URL(env.DISCORD_WEBHOOK_URL);
        } catch {
            return jsonResponse({ error: "DISCORD_WEBHOOK_URL no es una URL válida." }, 500, corsHeaders);
        }
        if (!/^(discord\.com|discordapp\.com)$/.test(webhook.hostname) || !webhook.pathname.startsWith("/api/webhooks/")) {
            return jsonResponse({ error: "DISCORD_WEBHOOK_URL no apunta a un webhook de Discord válido." }, 500, corsHeaders);
        }
        webhook.searchParams.set("wait", "true");

        try {
            const discordResponse = await fetch(webhook, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    embeds: [{
                        title: "Nueva queja · Los Caporales",
                        color: 0xA93630,
                        fields: [
                            { name: "Motivo", value: motivo },
                            { name: "Explicación", value: detalle.trim() }
                        ],
                        timestamp: new Date().toISOString()
                    }],
                    allowed_mentions: { parse: [] }
                })
            });
            if (!discordResponse.ok) {
                return jsonResponse({ error: `Discord rechazó la queja (HTTP ${discordResponse.status}).` }, 502, corsHeaders);
            }
            return jsonResponse({ ok: true }, 200, corsHeaders);
        } catch {
            return jsonResponse({ error: "Cloudflare no pudo conectar con Discord." }, 502, corsHeaders);
        }
    }
};
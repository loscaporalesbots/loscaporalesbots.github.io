const MOTIVOS_PERMITIDOS = new Set([
    "Producto",
    "Pedido o entrega",
    "Atención al cliente",
    "Pago",
    "Otro"
]);

module.exports = async function handler(req, res) {
    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        return res.status(405).json({ error: "Método no permitido." });
    }

    const origin = req.headers.origin;
    const host = req.headers.host;
    if (!origin || !host || new URL(origin).host !== host) {
        return res.status(403).json({ error: "Origen no permitido." });
    }

    const { motivo, detalle, website } = req.body || {};
    if (website) return res.status(200).json({ ok: true });
    if (!MOTIVOS_PERMITIDOS.has(motivo) || typeof detalle !== "string" || detalle.trim().length < 10 || detalle.length > 1500) {
        return res.status(400).json({ error: "Revisa el motivo y la explicación." });
    }

    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) return res.status(503).json({ error: "El servicio de quejas no está configurado." });

    let webhook;
    try {
        webhook = new URL(webhookUrl);
    } catch {
        return res.status(500).json({ error: "La configuración del servicio no es válida." });
    }
    if (!/^(discord\.com|discordapp\.com)$/.test(webhook.hostname) || !webhook.pathname.startsWith("/api/webhooks/")) {
        return res.status(500).json({ error: "La configuración del servicio no es válida." });
    }

    try {
        const respuesta = await fetch(webhook, {
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
        if (!respuesta.ok) return res.status(502).json({ error: "Discord no pudo recibir el mensaje." });
        return res.status(200).json({ ok: true });
    } catch {
        return res.status(502).json({ error: "No se pudo conectar con el servicio de quejas." });
    }
};
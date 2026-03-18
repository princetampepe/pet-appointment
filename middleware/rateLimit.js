function getClientIp(req) {
    // When trust proxy is enabled, req.ip will use X-Forwarded-For.
    if (req.ip) return req.ip;
    return req.connection?.remoteAddress || 'unknown';
}

function createRateLimiter({ windowMs, max }) {
    const hits = new Map(); // ip -> { count, resetAt }

    // periodic cleanup to avoid unbounded growth
    const cleanupInterval = setInterval(() => {
        const now = Date.now();
        for (const [ip, entry] of hits.entries()) {
            if (entry.resetAt <= now) hits.delete(ip);
        }
    }, Math.min(windowMs, 60_000));

    // don't keep node process alive just for cleanup
    cleanupInterval.unref?.();

    return (req, res, next) => {
        const now = Date.now();
        const ip = getClientIp(req);
        const entry = hits.get(ip);

        if (!entry || entry.resetAt <= now) {
            hits.set(ip, { count: 1, resetAt: now + windowMs });
            return next();
        }

        entry.count += 1;
        if (entry.count <= max) return next();

        const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
        res.setHeader('Retry-After', String(retryAfterSeconds));

        // Render a user-friendly page for browsers, otherwise JSON.
        if (req.accepts(['html', 'json']) === 'html') {
            return res.status(429).render('error', {
                title: 'Too many requests',
                error: `Too many requests. Please try again in ${retryAfterSeconds} seconds.`
            });
        }

        return res.status(429).json({
            error: 'Too many requests',
            retry_after_seconds: retryAfterSeconds
        });
    };
}

module.exports = { createRateLimiter };


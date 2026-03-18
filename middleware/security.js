function basicSecurityHeaders() {
    return (req, res, next) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('Referrer-Policy', 'no-referrer');
        res.setHeader(
            'Permissions-Policy',
            'camera=(), microphone=(), geolocation=(), payment=()'
        );

        // Minimal CSP that keeps Bootstrap CDN working (tighten further if you self-host assets).
        res.setHeader(
            'Content-Security-Policy',
            [
                "default-src 'self'",
                "base-uri 'self'",
                "frame-ancestors 'none'",
                "img-src 'self' data: https:",
                "style-src 'self' https://cdn.jsdelivr.net 'unsafe-inline'",
                "script-src 'self' https://cdn.jsdelivr.net",
                "font-src 'self' https://cdn.jsdelivr.net data:",
                "connect-src 'self'",
                "object-src 'none'"
            ].join('; ')
        );

        next();
    };
}

module.exports = { basicSecurityHeaders };


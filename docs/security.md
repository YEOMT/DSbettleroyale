# Security boundary

Production requires server-side HOST_AUTH_SECRET and exact HTTPS ALLOWED_ORIGINS. The development teacher password `local-teacher` is usable only in the default loopback development configuration; never use it in production. No host credential is injected into Vite or static assets.

Transport limits: 256 KiB ws maxPayload (TXT configuration), strict per-message schemas, four input samples per batch, 90 messages/s per connection with bounded burst, bounded request and event ledgers, five-second authentication deadline. Student state mutations such as coordinates, HP and score are not valid commands. Shared-school-IP clients are limited individually.

Further production hardening and acceptance are recorded separately. Origin is an additional browser boundary, not authentication. Caddy is the public TLS endpoint. /admin endpoints require a bearer secret and are not published by the example proxy.

"""FastAPI application for the Pharmacy Risk Prediction Platform."""

from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles

from .config import settings
from .public_rate_limit import PublicRateLimiter, request_cost
from .routes import auth, health, signals
from . import signal_store


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    signal_store.initialize()
    auth.initialize()
    yield
    # Shutdown


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title="Pharmacy Demand Planner",
        description="Account-scoped demand forecasts and medication inventory planning",
        version="0.2.0",
        lifespan=lifespan,
        docs_url=None,
        redoc_url=None,
    )
    app.mount("/api-doc-assets", StaticFiles(directory=Path(__file__).parent / "docs_assets"),
              name="api-doc-assets")
    public_limiter = PublicRateLimiter()

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.middleware("http")
    async def limit_public_signals(request: Request, call_next):
        if request.url.path.startswith("/api/v1/signals/") and request.method != "OPTIONS":
            retry_after = public_limiter.reserve(
                auth._client_ip(request), request_cost(request.url.path))
            if retry_after:
                return JSONResponse({"detail": "Public API request limit reached"},
                                    status_code=429, headers={"Retry-After": str(retry_after)})
        return await call_next(request)

    @app.middleware("http")
    async def security_headers(request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        if request.url.path.startswith("/api/auth/"):
            response.headers["Cache-Control"] = "no-store"
        if request.url.path == "/docs":
            response.headers["Content-Security-Policy"] = (
                "default-src 'none'; script-src 'self'; style-src 'self'; "
                "connect-src 'self'; img-src 'self' data:; font-src 'self'; "
                "base-uri 'none'; frame-ancestors 'none'"
            )
        if settings.ENVIRONMENT == "production":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response

    # Routes
    app.include_router(health.router, tags=["Health"])
    app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
    if settings.ENABLE_LEGACY_SERVER_TRAINING:
        from .routes import demand
        app.include_router(demand.router, prefix="/api/demand", tags=["Legacy server training"])
    app.include_router(signals.router, prefix="/api/v1/signals", tags=["Public signals"])

    @app.get("/docs", include_in_schema=False)
    def local_api_docs():
        return HTMLResponse("""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>PULSE API documentation</title>
<link rel="icon" href="/api-doc-assets/favicon-32x32.png">
<link rel="stylesheet" href="/api-doc-assets/swagger-ui.css">
<link rel="stylesheet" href="/api-doc-assets/swagger-custom.css">
</head><body>
<header class="pulse-docs-topbar">
  <div class="pulse-docs-topbar-inner">
    <div class="pulse-docs-brand-wrap">
      <a href="/" class="pulse-docs-brand">PULSE</a>
      <span class="pulse-docs-badge">API docs</span>
    </div>
    <nav class="pulse-docs-nav" aria-label="Documentation navigation">
      <a href="/api-guide">API guide</a>
      <a href="/signals">Signals</a>
      <a href="/dashboard">Dashboard</a>
    </nav>
  </div>
</header>
<div id="swagger-ui"></div>
<script src="/api-doc-assets/swagger-ui-bundle.js" defer></script>
<script src="/api-doc-assets/swagger-init.js" defer></script>
</body></html>""")

    @app.get("/redoc", include_in_schema=False)
    def legacy_redoc_url():
        return RedirectResponse("/docs", status_code=307)

    return app

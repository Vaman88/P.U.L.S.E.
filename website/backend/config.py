"""Configuration settings for the backend."""

from pathlib import Path
import os
import secrets
import tempfile
from urllib.parse import urlparse

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)

    # API
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    DEBUG: bool = False
    ENVIRONMENT: str = "development"

    # Security
    SECRET_KEY: str = ""
    SECRET_KEY_FILE: str = ""
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    COOKIE_SECURE: bool = False
    ENABLE_LEGACY_SERVER_TRAINING: bool = False
    TRUSTED_PROXY_IPS: list[str] = []
    TRUSTED_PROXY_HOSTNAMES: list[str] = []
    PUBLIC_ORIGIN: str = ""

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:3141",
                               "http://localhost:5173", "http://localhost:4173", "http://127.0.0.1:3141",
                               "http://127.0.0.1:5173", "http://127.0.0.1:4173"]

    # Model
    MODEL_PATH: str = "./ml/models"
    MODEL_VERSION: str = "v1"

    # Data storage
    DATA_PATH: str = str(Path(__file__).resolve().parents[1] / "data")
    CMS_PARTD_SOURCE_PATH: str = str(Path(__file__).resolve().parents[2] /
                                     "data/targeted_additions/cms_partd_geography_drug/data/arkansas_partd_geography_drug_by_year.csv.gz")
    CMS_PARTD_SOURCE_MANIFEST_PATH: str = str(Path(__file__).resolve().parents[2] /
                                             "data/targeted_additions/cms_partd_geography_drug/source_manifest.json")

    # Prediction
    RISK_THRESHOLD: float = 0.5

settings = Settings()


def _load_configured_secret_file(config: Settings) -> None:
    if not config.SECRET_KEY_FILE:
        return
    if config.SECRET_KEY:
        raise RuntimeError("Set either SECRET_KEY or SECRET_KEY_FILE, not both")
    path = Path(config.SECRET_KEY_FILE)
    try:
        if path.stat().st_size > 4096:
            raise RuntimeError("Signing key file is too large")
        config.SECRET_KEY = path.read_text(encoding="utf-8").strip()
    except OSError as exc:
        raise RuntimeError("Could not read signing key file") from exc
    if not config.SECRET_KEY:
        raise RuntimeError("Signing key file is empty")


def _validate_production_configuration(config: Settings) -> None:
    if config.ENVIRONMENT != "production":
        return
    if (len(config.SECRET_KEY.encode("utf-8")) < 32
            or len(set(config.SECRET_KEY)) < 8 or not config.COOKIE_SECURE):
        raise RuntimeError("Production requires a signing key of at least 32 bytes and COOKIE_SECURE=true")
    if config.ENABLE_LEGACY_SERVER_TRAINING:
        raise RuntimeError("Legacy server-side CSV training cannot be enabled in production")
    if config.DEBUG or not 1 <= config.ACCESS_TOKEN_EXPIRE_MINUTES <= 1440:
        raise RuntimeError("Production requires DEBUG=false and a session lifetime of 1–1440 minutes")
    if not config.PUBLIC_ORIGIN:
        raise RuntimeError("Production requires the exact public HTTPS origin")
    for origin in [config.PUBLIC_ORIGIN, *config.CORS_ORIGINS]:
        parsed = urlparse(origin)
        try:
            port = parsed.port
        except ValueError as exc:
            raise RuntimeError("Production origins must have a valid HTTPS port") from exc
        if (parsed.scheme != "https" or not parsed.hostname
                or parsed.hostname in {"localhost", "127.0.0.1", "::1"}
                or port == 0
                or parsed.username or parsed.password or parsed.path
                or parsed.query or parsed.fragment or "*" in origin):
            raise RuntimeError("Production origins must be explicit HTTPS origins; use CORS_ORIGINS=[] for same-origin only")


_load_configured_secret_file(settings)
_validate_production_configuration(settings)


def _load_local_secret(path: Path) -> str:
    """Create a local signing key once, even if API and worker start together."""
    path.parent.mkdir(parents=True, exist_ok=True)
    if not path.exists():
        descriptor, staged_name = tempfile.mkstemp(prefix=".jwt_secret.", dir=path.parent)
        staged = Path(staged_name)
        try:
            with os.fdopen(descriptor, "w", encoding="utf-8") as output:
                output.write(secrets.token_urlsafe(48))
                output.flush()
                os.fsync(output.fileno())
            try:
                os.link(staged, path)
            except FileExistsError:
                pass
        finally:
            staged.unlink(missing_ok=True)
    path.chmod(0o600)
    value = path.read_text(encoding="utf-8").strip()
    if not value:
        raise RuntimeError("Local signing key is empty")
    return value


if not settings.SECRET_KEY:
    secret_file = Path(settings.DATA_PATH) / ".jwt_secret"
    settings.SECRET_KEY = _load_local_secret(secret_file)

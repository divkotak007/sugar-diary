from firebase_functions import https_fn, options
from firebase_admin import initialize_app
from app.main import app as fastapi_app
from a2wsgi import ASGIMiddleware
from flask import Response

# Initialize Firebase Admin
initialize_app()

# Convert FastAPI (ASGI) to WSGI
wsgi_app = ASGIMiddleware(fastapi_app)

@https_fn.on_request(
    region="us-central1",
    timeout_sec=300,
    memory=options.MemoryOption.GB_1,
)
def api(req: https_fn.Request) -> Response:
    # Use Werkzeug/Flask helper to invoke the WSGI app with the request environment
    return Response.from_app(wsgi_app, req.environ)

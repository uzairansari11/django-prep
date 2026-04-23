export const djangoInternalsTopics = [
  // ─── DJANGO PROJECT FLOW ─────────────────────────────────────────────────────
  {
    id: "django-project-flow",
    title: "Django Project Flow — Request to Response in Depth",
    slug: "django-project-flow",
    category: "django",
    subcategory: "internals",
    difficulty: "intermediate",
    description: "Exactly what happens from the moment a browser sends an HTTP request to when Django sends a response — WSGI, URL routing, middleware stack, view, template, and every hook in between.",
    content: {
      explanation: `Every Django request passes through a strict, deterministic pipeline. Understanding this pipeline tells you WHERE to put your code, WHY middleware runs in a specific order, and HOW to debug unexpected behavior.

FULL LIFECYCLE (top to bottom on request, bottom to top on response):

1. WSGI / ASGI Server (Gunicorn, Uvicorn)
   The OS accepts a TCP connection. The WSGI server reads the HTTP bytes and builds a WSGI environ dict. It calls Django's WSGIHandler.

2. WSGIHandler.__call__(environ, start_response)
   Django's entry point. Builds an HttpRequest object from environ. Populates: request.method, request.path, request.META, request.GET, request.POST, request.FILES, request.body (raw bytes).

3. Middleware Stack — process_request phase (top to bottom)
   Django iterates MIDDLEWARE from top (index 0) to bottom. Each middleware's __call__ is invoked. The middleware can:
   - Short-circuit and return a response (e.g. SecurityMiddleware redirects HTTP→HTTPS)
   - Attach data to the request (SessionMiddleware loads request.session, AuthMiddleware sets request.user)
   - Modify request headers
   If any middleware returns a response here, the pipeline STOPS and that response bubbles back up through the already-executed middleware.

4. URL Resolver (django.urls.resolve)
   Django reads ROOT_URLCONF from settings. It tries to match request.path against urlpatterns using a regex/path engine. On match: extracts URL kwargs (e.g. pk from <int:pk>), identifies the view callable, and stores the result in request.resolver_match.
   On no match: raises Resolver404 → caught → returns 404 response.

5. View (function or class-based)
   The resolved view is called: view(request, **kwargs). The view is responsible for business logic. It accesses request.user, request.GET, request.POST, calls the ORM, and returns an HttpResponse (or a subclass like JsonResponse, StreamingHttpResponse, FileResponse).

   Class-Based Views (CBV): Django calls View.as_view() which returns a function. That function calls dispatch() which routes to get(), post(), put(), etc. based on request.method.

6. Template Rendering (optional)
   If the view calls render(request, 'template.html', context), Django's template engine:
   - Loads the template from TEMPLATES dirs
   - Evaluates all {{ variable }} and {% tag %} expressions
   - Returns an HttpResponse with the rendered HTML as body

7. Middleware Stack — process_response phase (bottom to top)
   The response travels back through middleware in REVERSE order. Each middleware can:
   - Modify response headers (SecurityMiddleware adds CSP headers)
   - Compress the response body (GZipMiddleware)
   - Set cookies (SessionMiddleware saves session to DB and sets the cookie)

8. WSGI Response
   WSGIHandler calls start_response(status, headers) and returns the response body iterable. The WSGI server sends bytes back over the TCP socket.

EXCEPTION HANDLING (parallel path):
   If ANY exception occurs in step 4–6, Django's exception middleware runs (process_exception). If no middleware handles it, Django's DEBUG=True shows the debug page; in production it calls handler500.`,

      realExample: `You open https://shop.example.com/products/42/ in a browser.

1. Gunicorn accepts the TCP connection on port 8000.
2. WSGIHandler builds HttpRequest: method='GET', path='/products/42/', META contains HTTP_HOST, HTTP_ACCEPT, etc.
3. SecurityMiddleware checks HTTPS — OK. Passes request down.
   SessionMiddleware reads the session cookie → loads session data from DB/cache → attaches dict to request.session.
   AuthenticationMiddleware reads request.session['_auth_user_id'] → loads User object → sets request.user.
4. URL resolver matches /products/<int:pk>/ → pk=42, view=ProductDetailView.
5. ProductDetailView.get(request, pk=42) runs:
   - product = Product.objects.select_related('category').get(pk=42)
   - Returns render(request, 'products/detail.html', {'product': product})
6. Template engine renders the HTML with the product's fields.
7. On the way back: SessionMiddleware updates the session record in the DB. SecurityMiddleware adds X-Content-Type-Options header.
8. Gunicorn sends the 200 response with the HTML body.`,

      codeExample: `# ── PROJECT STRUCTURE ───────────────────────────────────────────────────────
myproject/
├── manage.py
├── myproject/
│   ├── __init__.py
│   ├── settings.py          # All configuration
│   ├── urls.py              # ROOT_URLCONF — root URL patterns
│   ├── wsgi.py              # WSGI entry point
│   └── asgi.py              # ASGI entry point (for async / WebSocket)
├── myapp/
│   ├── __init__.py
│   ├── models.py            # ORM models
│   ├── views.py             # View functions / CBVs
│   ├── urls.py              # App-level URL patterns
│   ├── forms.py             # Django forms
│   ├── serializers.py       # DRF serializers (if using REST)
│   ├── admin.py             # Admin registration
│   ├── apps.py              # AppConfig
│   ├── signals.py           # Signals
│   ├── middleware.py        # Custom middleware
│   ├── managers.py          # Custom managers
│   ├── tasks.py             # Celery tasks
│   ├── tests/
│   │   ├── test_models.py
│   │   ├── test_views.py
│   │   └── test_api.py
│   └── migrations/
│       ├── 0001_initial.py
│       └── 0002_add_slug.py
└── templates/
    └── myapp/
        └── detail.html


# ── SETTINGS.PY — key settings explained ────────────────────────────────────
# settings.py

DEBUG = False                     # ALWAYS False in production
ALLOWED_HOSTS = ['shop.example.com']

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',        # User model, permissions, groups
    'django.contrib.contenttypes',# Generic FK support
    'django.contrib.sessions',    # Session framework
    'django.contrib.messages',    # Flash messages
    'django.contrib.staticfiles', # Static file serving
    'myapp',                      # Your app — must be here for migrations, templates, signals
]

# Order matters: each middleware runs top→down on request, bottom→up on response
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',            # HTTPS redirect, HSTS
    'django.contrib.sessions.middleware.SessionMiddleware',     # loads request.session
    'django.middleware.common.CommonMiddleware',                # APPEND_SLASH, PREPEND_WWW
    'django.middleware.csrf.CsrfViewMiddleware',               # CSRF token validation
    'django.contrib.auth.middleware.AuthenticationMiddleware', # sets request.user
    'django.contrib.messages.middleware.MessageMiddleware',    # flash messages
    'django.middleware.clickjacking.XFrameOptionsMiddleware',  # X-Frame-Options header
]

ROOT_URLCONF = 'myproject.urls'   # Django's URL resolver starts here

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'mydb',
        'USER': 'myuser',
        'PASSWORD': 'secret',
        'HOST': 'localhost',
        'PORT': '5432',
        'CONN_MAX_AGE': 60,       # reuse DB connections for 60 seconds
    }
}

TEMPLATES = [{
    'BACKEND': 'django.template.backends.django.DjangoTemplates',
    'DIRS': [BASE_DIR / 'templates'],   # project-wide template dirs
    'APP_DIRS': True,                    # also look in each app's templates/ folder
    'OPTIONS': {
        'context_processors': [
            'django.template.context_processors.request',  # injects request into context
            'django.contrib.auth.context_processors.auth', # injects user, perms
            'django.contrib.messages.context_processors.messages',
        ],
    },
}]


# ── ROOT URLS ────────────────────────────────────────────────────────────────
# myproject/urls.py

from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('products/', include('myapp.urls', namespace='myapp')),  # delegate to app URLs
    path('api/', include('api.urls')),
]


# ── APP URLS ─────────────────────────────────────────────────────────────────
# myapp/urls.py

from django.urls import path
from . import views

app_name = 'myapp'

urlpatterns = [
    path('', views.ProductListView.as_view(), name='list'),
    path('<int:pk>/', views.ProductDetailView.as_view(), name='detail'),
    path('create/', views.ProductCreateView.as_view(), name='create'),
]


# ── VIEWS ────────────────────────────────────────────────────────────────────
# myapp/views.py

from django.views.generic import ListView, DetailView, CreateView
from django.contrib.auth.mixins import LoginRequiredMixin
from django.urls import reverse_lazy
from .models import Product
from .forms import ProductForm

class ProductListView(ListView):
    model = Product
    template_name = 'myapp/product_list.html'
    context_object_name = 'products'
    paginate_by = 20

    def get_queryset(self):
        # Called by ListView.get() — returns the QS for the page
        return Product.objects.filter(is_active=True).select_related('category')

class ProductDetailView(DetailView):
    model = Product
    template_name = 'myapp/product_detail.html'
    # Django automatically calls get_object() → Product.objects.get(pk=kwargs['pk'])

class ProductCreateView(LoginRequiredMixin, CreateView):
    model = Product
    form_class = ProductForm
    template_name = 'myapp/product_form.html'
    success_url = reverse_lazy('myapp:list')

    def form_valid(self, form):
        form.instance.created_by = self.request.user  # attach user before save
        return super().form_valid(form)


# ── WSGI ENTRY POINT ─────────────────────────────────────────────────────────
# myproject/wsgi.py

import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'myproject.settings')
application = get_wsgi_application()

# Gunicorn runs: gunicorn myproject.wsgi:application
# Gunicorn calls application(environ, start_response) for every HTTP request


# ── APPS.PY — AppConfig ──────────────────────────────────────────────────────
# myapp/apps.py

from django.apps import AppConfig

class MyAppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'myapp'

    def ready(self):
        # Called once when Django starts — import signals here
        import myapp.signals  # noqa: F401


# ── MANAGE.PY COMMANDS ───────────────────────────────────────────────────────
# python manage.py runserver         → development server
# python manage.py makemigrations   → detect model changes, create migration files
# python manage.py migrate           → apply migration files to database
# python manage.py createsuperuser  → create admin user
# python manage.py shell             → interactive Python shell with Django loaded
# python manage.py test              → run test suite
# python manage.py collectstatic     → copy static files to STATIC_ROOT for production
# python manage.py check             → system check for common configuration problems`,

      outputExplanation: `The request pipeline is strictly top-down through MIDDLEWARE on the way in and strictly bottom-up on the way out. This is why SecurityMiddleware (index 0) is first — it can redirect HTTP to HTTPS before any other middleware runs. SessionMiddleware must be before AuthenticationMiddleware because Auth reads from the session that Session sets up. The URL resolver runs once, after all request-phase middleware. The view runs once. Then the response propagates back through middleware in reverse. Any exception short-circuits to the exception handling path.`,

      commonMistakes: [
        "Putting custom middleware AFTER AuthenticationMiddleware — if your middleware needs request.user, it must come after AuthMiddleware in the list.",
        "Returning a response from middleware without calling self.get_response(request) — the view never runs and the rest of the middleware stack is bypassed.",
        "Importing models at module level in apps.py — models aren't ready until after AppConfig.ready(). Import inside ready() or a function.",
        "Not including your app in INSTALLED_APPS — migrations, template loading, and signal registration all fail silently.",
        "Mutating request.GET or request.POST directly — they are QueryDicts and immutable by default. Use request.GET.copy() to get a mutable copy.",
        "Running blocking I/O (API calls, file reads) in middleware synchronously with ASGI — use async middleware or sync_to_async."
      ],

      interviewNotes: [
        "WSGI server (Gunicorn) receives the TCP request and calls Django's WSGIHandler with environ + start_response.",
        "Middleware runs top→down on request, bottom→up on response. Any middleware can short-circuit by returning a response early.",
        "SessionMiddleware must be BEFORE AuthenticationMiddleware — Auth reads the session Session sets up.",
        "URL resolver uses ROOT_URLCONF. It matches against urlpatterns from top to bottom, stopping at first match.",
        "CBVs: as_view() returns a function. dispatch() routes to get()/post() etc. based on request.method.",
        "Template rendering: load → parse → render with context. Result is a string inserted into HttpResponse.",
        "AppConfig.ready() is the correct place to import signals — it runs once after all apps are loaded.",
        "manage.py migrate applies migration files in order. makemigrations only creates files — does NOT touch the DB.",
        "WSGI is synchronous (one thread per request). ASGI is async (one event loop handles many requests concurrently)."
      ],

      whenToUse: "Understanding the project flow is essential for knowing WHERE to add authentication checks (middleware vs. decorator), WHERE to attach request-scoped data (middleware), and WHY certain settings must appear before others.",

      whenNotToUse: "You don't write the project flow — you work within it. Understanding it guides architectural decisions rather than being directly implemented."
    },
    tags: ["django", "request", "response", "middleware", "wsgi", "url-routing", "views", "internals", "project-structure"],
    order: 1,
    estimatedMinutes: 30
  },

  // ─── CUSTOM MIDDLEWARE ────────────────────────────────────────────────────────
  {
    id: "custom-middleware",
    title: "Custom Django Middleware — Complete Guide",
    slug: "custom-middleware",
    category: "django",
    subcategory: "middleware",
    difficulty: "intermediate",
    description: "How Django middleware works internally, how to write synchronous and asynchronous middleware, all hook points (process_request, process_response, process_exception, process_view), ordering rules, and real patterns.",
    content: {
      explanation: `Middleware is a lightweight plugin system that sits between the WSGI server and your views. Every HTTP request passes through the entire middleware stack before reaching the view, and every response passes back through it in reverse order.

ANATOMY OF MIDDLEWARE:
Django middleware is any callable that:
  1. Takes get_response as its constructor argument
  2. Returns a callable (the middleware itself)
  3. That callable accepts a request and returns a response

Modern style (class-based, recommended):
  __init__(self, get_response): Store get_response. Called ONCE at startup.
  __call__(self, request): Called on EVERY request. Must call self.get_response(request).

Old-style hook methods (still work, Django converts them):
  process_request(request): runs before URL resolution. Return None to continue, HttpResponse to short-circuit.
  process_view(request, view_func, view_args, view_kwargs): runs after URL resolution, before view. Same return rules.
  process_exception(request, exception): runs if the view raises an exception. Return None to let it propagate.
  process_response(request, response): runs on every response. Must return a response.

EXECUTION ORDER (for 3 middleware A, B, C):
  Request:   A.__call__ → B.__call__ → C.__call__ → view
  Response:  C.__call__ returns → B.__call__ returns → A.__call__ returns

MIDDLEWARE LIFECYCLE WITH HOOKS:
  A.process_request   → B.process_request   → C.process_request
  A.process_view      → B.process_view      → C.process_view
  → VIEW RUNS →
  C.process_exception → B.process_exception → A.process_exception  (only if exception)
  C.process_response  → B.process_response  → A.process_response`,

      realExample: `A SaaS application needs:
1. Request ID middleware — attaches a unique UUID to every request for distributed tracing
2. Tenant middleware — reads the subdomain from the request, looks up the tenant in the DB, and stores it as request.tenant
3. Rate limiting middleware — counts requests per IP using Redis and returns 429 if over limit
4. Timing middleware — records how long each request takes and adds X-Request-Duration header to the response

All of these are cross-cutting concerns that apply to every view without modifying any view code.`,

      codeExample: `# ── BASIC MIDDLEWARE STRUCTURE ───────────────────────────────────────────────
# myapp/middleware.py

class SimpleMiddleware:
    """Minimal middleware — the required pattern."""

    def __init__(self, get_response):
        # Called ONCE when Django starts up.
        # get_response is the next layer: next middleware or the view itself.
        self.get_response = get_response
        # One-time setup: load config, compile regexes, open connections

    def __call__(self, request):
        # ── BEFORE the view (process_request phase) ──────────────────────────
        # Runs for every request BEFORE the view is called.
        # Return a response HERE to short-circuit: view never runs.
        # Return None-equivalent (fall through) to continue to the view.

        response = self.get_response(request)  # calls the next middleware or view

        # ── AFTER the view (process_response phase) ──────────────────────────
        # Runs for every request AFTER the view has returned a response.
        # MUST return a response.

        return response


# ── PATTERN 1 — REQUEST ID MIDDLEWARE ────────────────────────────────────────
import uuid
import threading

_local = threading.local()

def get_request_id():
    return getattr(_local, 'request_id', None)

class RequestIDMiddleware:
    """Attach a UUID to every request. Store in thread-local for log injection."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Honour an upstream X-Request-ID if present (from load balancer)
        request_id = request.META.get('HTTP_X_REQUEST_ID') or str(uuid.uuid4())
        request.request_id = request_id
        _local.request_id = request_id

        response = self.get_response(request)

        response['X-Request-ID'] = request_id
        _local.request_id = None   # clean up after response so thread can be reused
        return response


# ── PATTERN 2 — TIMING MIDDLEWARE ────────────────────────────────────────────
import time

class TimingMiddleware:
    """Add X-Request-Duration-Ms header to every response."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        start = time.monotonic()
        response = self.get_response(request)
        duration_ms = round((time.monotonic() - start) * 1000, 2)
        response['X-Request-Duration-Ms'] = str(duration_ms)
        return response


# ── PATTERN 3 — AUTHENTICATION GUARD MIDDLEWARE ───────────────────────────────
from django.http import JsonResponse

class APIKeyMiddleware:
    """Require X-API-Key header for all /api/ paths."""
    VALID_KEYS = {'my-secret-key-1', 'my-secret-key-2'}  # in prod: load from DB/cache

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.path.startswith('/api/'):
            api_key = request.META.get('HTTP_X_API_KEY', '')
            if api_key not in self.VALID_KEYS:
                # Short-circuit — view never runs
                return JsonResponse({'error': 'Invalid or missing API key.'}, status=401)
        return self.get_response(request)


# ── PATTERN 4 — TENANT MIDDLEWARE ────────────────────────────────────────────
from django.http import Http404
from myapp.models import Tenant

class TenantMiddleware:
    """Resolve tenant from subdomain and attach to request."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        host = request.get_host()            # e.g. 'acme.example.com'
        subdomain = host.split('.')[0]       # e.g. 'acme'

        try:
            tenant = Tenant.objects.get(subdomain=subdomain, is_active=True)
        except Tenant.DoesNotExist:
            raise Http404(f"Tenant '{subdomain}' not found")

        request.tenant = tenant
        return self.get_response(request)


# ── PATTERN 5 — PROCESS_VIEW HOOK ────────────────────────────────────────────
# process_view runs AFTER URL resolution, BEFORE the view function executes.
# Gives access to view_func and its kwargs.

class AuditMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        return self.get_response(request)

    def process_view(self, request, view_func, view_args, view_kwargs):
        # view_func = the actual view callable
        # view_args = positional URL args (rare)
        # view_kwargs = {'pk': 42} from URL patterns
        view_name = getattr(view_func, '__name__', str(view_func))
        request._audit_view = view_name
        return None  # MUST return None to continue, or HttpResponse to short-circuit


# ── PATTERN 6 — EXCEPTION HANDLER MIDDLEWARE ─────────────────────────────────
import logging
from django.http import JsonResponse

logger = logging.getLogger('errors')

class ExceptionMiddleware:
    """Catch unhandled exceptions, log them, return clean JSON error."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        return self.get_response(request)

    def process_exception(self, request, exception):
        # Called when the view raises an unhandled exception.
        # Return None → exception propagates (Django's default handler runs)
        # Return HttpResponse → suppresses exception and uses this response
        logger.exception(
            "Unhandled exception in %s %s",
            request.method,
            request.path,
            exc_info=exception,
        )
        return JsonResponse(
            {'error': 'An unexpected error occurred.', 'request_id': getattr(request, 'request_id', None)},
            status=500
        )


# ── PATTERN 7 — ASYNC MIDDLEWARE (for ASGI / Django Channels) ────────────────
import asyncio

class AsyncTimingMiddleware:
    """Async-compatible middleware for ASGI deployments."""
    async_capable = True
    sync_capable = False

    def __init__(self, get_response):
        self.get_response = get_response
        # Django detects async_capable flag and uses the async path

    async def __call__(self, request):
        start = time.monotonic()
        response = await self.get_response(request)  # MUST await for async
        duration_ms = round((time.monotonic() - start) * 1000, 2)
        response['X-Duration-Ms'] = str(duration_ms)
        return response


# ── SETTINGS: MIDDLEWARE ORDER ────────────────────────────────────────────────
# settings.py

MIDDLEWARE = [
    # Index 0: runs FIRST on request, LAST on response
    'django.middleware.security.SecurityMiddleware',         # HTTPS, HSTS
    'myapp.middleware.RequestIDMiddleware',                  # attach request_id early
    'myapp.middleware.TimingMiddleware',                     # start timer early
    'django.contrib.sessions.middleware.SessionMiddleware', # request.session
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',  # request.user (needs session)
    'myapp.middleware.TenantMiddleware',                     # needs request.user available
    'myapp.middleware.AuditMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'myapp.middleware.ExceptionMiddleware',                  # catch exceptions from views
    # Index -1: runs LAST on request, FIRST on response
]


# ── FUNCTION-BASED MIDDLEWARE (alternative style) ─────────────────────────────
def simple_middleware(get_response):
    """Function-based middleware — called once at startup."""

    def middleware(request):
        # Before view
        print(f"Request: {request.method} {request.path}")
        response = get_response(request)
        # After view
        response['X-Processed'] = 'true'
        return response

    return middleware


# ── HOW DJANGO CHAINS MIDDLEWARE ──────────────────────────────────────────────
# Conceptually, Django builds a chain like this at startup:

def build_middleware_chain(middleware_classes, view):
    handler = view
    for middleware_class in reversed(middleware_classes):
        handler = middleware_class(handler)
    return handler

# handler = MW_A(MW_B(MW_C(view)))
# Calling handler(request) invokes:
# MW_A.__call__(request)
#   → response = MW_B.__call__(request)
#       → response = MW_C.__call__(request)
#           → response = view(request)
#       → return response  # MW_C post-processing
#   → return response      # MW_B post-processing
# → return response        # MW_A post-processing`,

      outputExplanation: `__init__(get_response) is called ONCE when Django starts. The middleware class is instantiated once and reused for every request. __call__(request) is called on EVERY request. Inside it: code before self.get_response(request) is the request-phase (top to bottom in MIDDLEWARE list). Code after self.get_response(request) is the response-phase (bottom to top). process_view runs between URL resolution and the view call. process_exception runs when the view raises an exception. Short-circuiting (returning a response before calling get_response) is how SecurityMiddleware implements HTTPS redirects — the view is never reached.`,

      commonMistakes: [
        "Doing expensive operations (DB queries, HTTP calls) in __init__ — __init__ runs once at startup but the data may be stale. Do per-request work in __call__.",
        "Forgetting to return self.get_response(request) — the response will be None, causing a TypeError downstream.",
        "Returning HttpResponse directly from __call__ without calling get_response — all subsequent middleware and the view are skipped. This is intentional for short-circuiting (e.g. auth check) but a common accidental bug.",
        "Writing synchronous blocking middleware in an ASGI application — database calls, HTTP requests in sync middleware block the async event loop. Use sync_to_async or write async middleware.",
        "Mutating the response after it has been streamed (StreamingHttpResponse) — the body is a generator, modifying headers is fine but modifying content is not possible.",
        "Not cleaning up thread-local data after the response — thread-locals persist for the lifetime of the thread (Gunicorn worker). Always clean up in the response phase.",
        "Placing custom middleware before SecurityMiddleware — security checks should run first."
      ],

      interviewNotes: [
        "Middleware is a class (or function) that wraps the view call. __init__ runs once at startup; __call__ runs on every request.",
        "Middleware order in MIDDLEWARE list: top=first on request, last on response. Bottom=last on request, first on response.",
        "process_request: before URL resolution. process_view: after URL resolution, before view. process_exception: if view raises. process_response: always.",
        "Short-circuit: return HttpResponse from __call__ (or process_request) WITHOUT calling get_response — view never runs.",
        "Async middleware: set async_capable = True and use async def __call__ with await self.get_response(request).",
        "Thread-locals are commonly used to store per-request data (request_id, current user) accessible outside the request context (e.g. in model signals).",
        "Django builds the middleware chain once at startup using reversed(MIDDLEWARE) so index 0 is the outermost wrapper."
      ],

      whenToUse: "Middleware is the right layer for cross-cutting concerns that apply to ALL (or almost all) requests: authentication checks, logging, request ID injection, compression, CORS headers, rate limiting, tenant resolution, timing. If a concern applies to a specific view, use a decorator instead.",

      whenNotToUse: "Do not use middleware for per-endpoint business logic — that belongs in the view or service layer. Do not make database queries or external API calls in middleware unless absolutely necessary — middleware cost is paid on every request."
    },
    tags: ["middleware", "django", "request", "response", "async", "process_request", "process_view", "process_exception", "thread-local", "wsgi"],
    order: 2,
    estimatedMinutes: 35
  },

  // ─── FILE HANDLING ────────────────────────────────────────────────────────────
  {
    id: "django-file-handling",
    title: "File Handling in Django — Uploads, Storage & Multipart Forms",
    slug: "django-file-handling",
    category: "django",
    subcategory: "files",
    difficulty: "intermediate",
    description: "How Django parses multipart form data, FileField and ImageField on models, file validation, serving files, custom storage backends, and production S3 setup with django-storages.",
    content: {
      explanation: `Django handles file uploads through a well-defined pipeline that spans the HTTP layer, the form layer, the model layer, and the storage layer.

HOW MULTIPART UPLOADS WORK:
  1. Browser sends POST with Content-Type: multipart/form-data
  2. Django's MultiPartParser reads the request body in chunks
  3. Small files → stored in memory (InMemoryUploadedFile)
     Large files (> FILE_UPLOAD_MAX_MEMORY_SIZE, default 2.5 MB) → streamed to a temp file (TemporaryUploadedFile)
  4. request.FILES is a dict-like MultiValueDict: {'avatar': <InMemoryUploadedFile>}
  5. The file object provides: name, size, content_type, chunks(), read()

STORAGE BACKENDS:
  FileSystemStorage (default) — saves to MEDIA_ROOT on disk
  S3Boto3Storage (django-storages) — saves to AWS S3
  Custom — implement _save(), _open(), exists(), url(), delete()

KEY SETTINGS:
  MEDIA_ROOT  — absolute filesystem path where uploads are stored (local dev)
  MEDIA_URL   — URL prefix for serving uploaded files (e.g. /media/)
  FILE_UPLOAD_MAX_MEMORY_SIZE — threshold above which files go to disk (default 2.5 MB)
  DEFAULT_FILE_STORAGE — storage class to use (default: FileSystemStorage)`,

      realExample: `A profile photo upload flow:
1. User submits a form with enctype="multipart/form-data" containing a JPEG file.
2. Django's MultiPartParser reads the file. If it's under 2.5 MB it's in memory; otherwise it's a temp file.
3. UserProfileForm validates: file size < 5 MB, content_type must be image/jpeg or image/png.
4. If valid, form.save() calls model.save() which calls storage.save() to write to S3 via django-storages.
5. The URL returned by profile.avatar.url points to an S3 pre-signed URL or CloudFront URL for serving.`,

      codeExample: `# ── SETTINGS ─────────────────────────────────────────────────────────────────
# settings.py

import os
BASE_DIR = Path(__file__).resolve().parent.parent

# Local development file storage
MEDIA_ROOT = BASE_DIR / 'media'        # absolute path to uploads directory
MEDIA_URL  = '/media/'                 # URL prefix — must end with /

FILE_UPLOAD_MAX_MEMORY_SIZE = 2_621_440  # 2.5 MB — above this, files go to temp disk
DATA_UPLOAD_MAX_MEMORY_SIZE = 2_621_440  # limit for non-file POST data
FILE_UPLOAD_TEMP_DIR = '/tmp/django-uploads'  # dir for temp files (default: system temp)

# Production: switch to S3
# DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
# AWS_STORAGE_BUCKET_NAME = 'my-uploads-bucket'
# AWS_S3_REGION_NAME = 'us-east-1'
# AWS_S3_FILE_OVERWRITE = False   # don't overwrite existing files


# ── MODEL WITH FILE FIELDS ────────────────────────────────────────────────────
# myapp/models.py

from django.db import models
from django.core.validators import FileExtensionValidator
import os

def avatar_upload_path(instance, filename):
    """Generate a unique upload path per user."""
    ext = filename.rsplit('.', 1)[-1].lower()
    return f"avatars/user_{instance.user.pk}/{uuid.uuid4().hex}.{ext}"

def document_upload_path(instance, filename):
    return f"documents/{instance.category}/{filename}"

class UserProfile(models.Model):
    user = models.OneToOneField('auth.User', on_delete=models.CASCADE)

    # FileField: stores the file in storage, saves the path string in DB
    avatar = models.ImageField(
        upload_to=avatar_upload_path,   # callable: (instance, filename) → path
        null=True,
        blank=True,
        validators=[
            FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png', 'webp'])
        ],
    )

    # FileField for non-image files
    resume = models.FileField(
        upload_to='resumes/',
        null=True,
        blank=True,
        validators=[FileExtensionValidator(allowed_extensions=['pdf', 'doc', 'docx'])],
    )

    def delete_avatar(self):
        """Delete the file from storage when removing from model."""
        if self.avatar:
            storage = self.avatar.storage
            if storage.exists(self.avatar.name):
                storage.delete(self.avatar.name)
            self.avatar = None
            self.save(update_fields=['avatar'])

    class Meta:
        verbose_name = 'User Profile'


class Document(models.Model):
    title    = models.CharField(max_length=200)
    category = models.CharField(max_length=50)
    file     = models.FileField(upload_to=document_upload_path)
    size     = models.PositiveIntegerField(editable=False)  # stored at upload time
    mime_type = models.CharField(max_length=100, editable=False)

    def save(self, *args, **kwargs):
        if self.file and not self.pk:  # only on create
            self.size = self.file.size
            self.mime_type = self.file.file.content_type
        super().save(*args, **kwargs)


# ── FORM WITH FILE UPLOAD ─────────────────────────────────────────────────────
# myapp/forms.py

from django import forms
from django.core.exceptions import ValidationError
from .models import UserProfile

MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB

class AvatarUploadForm(forms.ModelForm):
    class Meta:
        model = UserProfile
        fields = ['avatar']
        widgets = {
            'avatar': forms.FileInput(attrs={'accept': 'image/jpeg,image/png,image/webp'}),
        }

    def clean_avatar(self):
        file = self.cleaned_data.get('avatar')
        if not file:
            return file

        # Size check
        if file.size > MAX_FILE_SIZE_BYTES:
            raise ValidationError(
                f"File too large. Maximum size is {MAX_FILE_SIZE_BYTES // 1024 // 1024} MB."
            )

        # Content-type check (don't trust the extension alone)
        allowed_types = {'image/jpeg', 'image/png', 'image/webp'}
        if file.content_type not in allowed_types:
            raise ValidationError("Unsupported file type. Upload JPEG, PNG, or WebP.")

        # Verify it's a real image (requires Pillow)
        try:
            from PIL import Image
            img = Image.open(file)
            img.verify()         # raises if file is corrupt or not an image
            file.seek(0)         # verify() consumes the file pointer — reset it
        except Exception:
            raise ValidationError("Uploaded file is not a valid image.")

        return file


class DocumentUploadForm(forms.Form):
    title    = forms.CharField(max_length=200)
    category = forms.ChoiceField(choices=[('contract', 'Contract'), ('invoice', 'Invoice')])
    file     = forms.FileField(
        allow_empty_file=False,
        max_length=255,          # max filename length
    )

    def clean_file(self):
        file = self.cleaned_data['file']
        allowed_extensions = ['.pdf', '.doc', '.docx']
        ext = os.path.splitext(file.name)[1].lower()
        if ext not in allowed_extensions:
            raise ValidationError(f"Only PDF, DOC, and DOCX files are allowed.")
        if file.size > 20 * 1024 * 1024:  # 20 MB
            raise ValidationError("File size must be under 20 MB.")
        return file


# ── VIEW — handling file upload ───────────────────────────────────────────────
# myapp/views.py

from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from .forms import AvatarUploadForm, DocumentUploadForm
from .models import Document

@login_required
def upload_avatar(request):
    profile = request.user.userprofile

    if request.method == 'POST':
        # IMPORTANT: Pass request.FILES as the second argument to the form
        form = AvatarUploadForm(request.POST, request.FILES, instance=profile)
        if form.is_valid():
            # Delete old avatar from storage before saving the new one
            if profile.avatar:
                profile.avatar.storage.delete(profile.avatar.name)
            form.save()
            messages.success(request, 'Avatar updated successfully.')
            return redirect('profile')
    else:
        form = AvatarUploadForm(instance=profile)

    return render(request, 'myapp/upload_avatar.html', {'form': form})


@login_required
def upload_document(request):
    if request.method == 'POST':
        form = DocumentUploadForm(request.POST, request.FILES)
        if form.is_valid():
            file = request.FILES['file']   # InMemoryUploadedFile or TemporaryUploadedFile
            # Manually save using the storage backend
            from django.core.files.storage import default_storage
            from django.core.files.base import ContentFile

            # Read file content (works for both in-memory and temp file)
            content = file.read()

            # Save to storage — returns the actual saved name (may differ if duplicate)
            saved_path = default_storage.save(
                f"documents/{form.cleaned_data['category']}/{file.name}",
                ContentFile(content)
            )
            saved_url = default_storage.url(saved_path)

            Document.objects.create(
                title=form.cleaned_data['title'],
                category=form.cleaned_data['category'],
                file=saved_path,
                size=file.size,
                mime_type=file.content_type,
            )
            messages.success(request, f'Document uploaded: {saved_url}')
            return redirect('documents:list')
    else:
        form = DocumentUploadForm()
    return render(request, 'myapp/upload_document.html', {'form': form})


# ── TEMPLATE — file upload form ───────────────────────────────────────────────
# templates/myapp/upload_avatar.html

"""
<form method="post" enctype="multipart/form-data">
  {% csrf_token %}
  {{ form.as_p }}
  <button type="submit">Upload</button>
</form>

<!-- CRITICAL: enctype="multipart/form-data" — without this, request.FILES is empty -->
"""


# ── SERVING FILES IN DEVELOPMENT ──────────────────────────────────────────────
# myproject/urls.py (DEV ONLY — never use in production)

from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # ... your url patterns ...
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# In production: serve via nginx (X-Accel-Redirect) or directly from S3/CloudFront


# ── ACCESSING FILE PROPERTIES ─────────────────────────────────────────────────

profile = UserProfile.objects.get(user=request.user)

if profile.avatar:
    profile.avatar.name    # 'avatars/user_42/abc123.jpg' — path in storage
    profile.avatar.url     # '/media/avatars/user_42/abc123.jpg' — public URL
    profile.avatar.path    # '/var/www/media/avatars/user_42/abc123.jpg' — filesystem path
    profile.avatar.size    # file size in bytes
    profile.avatar.open()  # open file for reading → file-like object
    profile.avatar.read()  # read file content → bytes


# ── PRODUCTION: CUSTOM S3 STORAGE BACKEND ────────────────────────────────────
# pip install django-storages boto3

# myapp/storage_backends.py

from storages.backends.s3boto3 import S3Boto3Storage

class PublicMediaStorage(S3Boto3Storage):
    """Public-readable files (profile photos, product images)."""
    location = 'media/public'
    default_acl = 'public-read'
    file_overwrite = False

class PrivateMediaStorage(S3Boto3Storage):
    """Private files (contracts, invoices) — accessible only via pre-signed URLs."""
    location = 'media/private'
    default_acl = 'private'
    file_overwrite = False
    custom_domain = False   # don't use CloudFront for private files

# settings.py
# DEFAULT_FILE_STORAGE = 'myapp.storage_backends.PublicMediaStorage'

# Per-field storage override on the model:
class Document(models.Model):
    file = models.FileField(
        storage=PrivateMediaStorage(),  # this field uses private storage
        upload_to='contracts/',
    )


# ── DELETING FILES — signal to clean up storage ───────────────────────────────
from django.db.models.signals import post_delete
from django.dispatch import receiver

@receiver(post_delete, sender=UserProfile)
def delete_avatar_on_profile_delete(sender, instance, **kwargs):
    """When a UserProfile is deleted, delete the avatar from storage too."""
    if instance.avatar:
        storage = instance.avatar.storage
        if storage.exists(instance.avatar.name):
            storage.delete(instance.avatar.name)


# ── PROCESSING UPLOADED FILES (resize, convert) ───────────────────────────────
from PIL import Image
from io import BytesIO
from django.core.files.uploadedfile import InMemoryUploadedFile

def resize_image(image_field, max_width=800, max_height=800):
    """Resize image to fit within max dimensions, preserving aspect ratio."""
    img = Image.open(image_field)

    if img.mode not in ('RGB', 'RGBA'):
        img = img.convert('RGB')

    img.thumbnail((max_width, max_height), Image.LANCZOS)

    output = BytesIO()
    img.save(output, format='JPEG', quality=85, optimize=True)
    output.seek(0)

    return InMemoryUploadedFile(
        file=output,
        field_name=image_field.field.name,
        name=image_field.name.rsplit('.', 1)[0] + '.jpg',
        content_type='image/jpeg',
        size=output.getbuffer().nbytes,
        charset=None,
    )

# In a form's clean_avatar():
# file = self.cleaned_data['avatar']
# self.cleaned_data['avatar'] = resize_image(file)`,

      outputExplanation: `When a file is uploaded Django creates either an InMemoryUploadedFile (for small files under FILE_UPLOAD_MAX_MEMORY_SIZE) or a TemporaryUploadedFile (large files written to a temp directory). Both implement the same file interface: read(), chunks(), name, size, content_type. When form.save() calls model.save(), the FileField descriptor detects the uploaded file object and calls storage.save(name, content) to persist it. The field then stores only the file path (string) in the database column, not the file content. The FieldFile descriptor on the model instance wraps this path and provides .url, .path, .open(), .size as computed properties that delegate to the storage backend.`,

      commonMistakes: [
        "Forgetting enctype='multipart/form-data' on the HTML form — request.FILES will be empty and the file will never arrive.",
        "Not passing request.FILES to the form constructor — MyForm(request.POST) — the file upload will be ignored silently.",
        "Trusting file.content_type or the file extension alone — both can be spoofed. Use python-magic or Pillow.verify() to actually inspect the file bytes.",
        "Not deleting old files from storage when updating a FileField — Django replaces the path in the DB but leaves the old file on disk/S3, causing storage leakage.",
        "Serving MEDIA files via Django in production (DEBUG=False) without nginx — Django's static file serving is single-threaded and not meant for production file serving.",
        "Using upload_to as a static string without a callable — two users uploading avatar.jpg overwrite each other. Use a callable that generates unique paths (UUID-based).",
        "Not setting FILE_UPLOAD_MAX_MEMORY_SIZE — default is 2.5 MB. Very large files will be buffered in memory, causing OOM on a busy server.",
        "Calling file.read() before form validation — the file pointer is at the end. You must call file.seek(0) after reading in validation before Django stores it."
      ],

      interviewNotes: [
        "request.FILES is populated only for POST/PUT/PATCH requests with Content-Type: multipart/form-data.",
        "Small files are InMemoryUploadedFile; large files are TemporaryUploadedFile. Both have the same interface.",
        "FileField stores a path string in the DB, not file content. The file lives in the storage backend.",
        "upload_to can be a string ('avatars/') or callable (instance, filename) → path. Use callable for unique paths.",
        "The storage backend is pluggable: FileSystemStorage (default), S3Boto3Storage, AzureStorage, GCSStorage.",
        "Serving files in development: add static(MEDIA_URL, document_root=MEDIA_ROOT) to urlpatterns when DEBUG=True.",
        "In production: serve via nginx with X-Accel-Redirect (private files) or directly from S3/CloudFront (public files).",
        "Always validate file size AND content type AND actual file bytes — never trust client-sent metadata.",
        "Use django-storages for S3. Set DEFAULT_FILE_STORAGE for all fields, or per-field with storage= parameter.",
        "FILE_UPLOAD_MAX_MEMORY_SIZE controls the threshold between in-memory and temp-file buffering."
      ],

      whenToUse: "Use FileField/ImageField for any user-uploaded content. Use upload_to callables for unique path generation. Use django-storages in production to offload file serving to S3/CloudFront. Add signal handlers (post_delete) to clean up files when model instances are deleted.",

      whenNotToUse: "Do not store file content in a database column (BinaryField) for large files — it bloats the database and prevents CDN serving. Do not serve uploaded files directly from Django in production — use a reverse proxy (nginx) or CDN."
    },
    tags: ["files", "upload", "multipart", "FileField", "ImageField", "S3", "storage", "django-storages", "forms"],
    order: 3,
    estimatedMinutes: 30
  },

  // ─── NEW INTERNALS TOPICS ─────────────────────────────────────────────────────
  {
    id: "django-signals",
    title: "Django Signals — Decoupled Event Hooks",
    slug: "django-signals",
    category: "django",
    subcategory: "signals",
    difficulty: "intermediate",
    description: "How Django's signal dispatcher works internally, when to use pre_save/post_save/pre_delete/post_delete/m2m_changed, and the hidden dangers of signals in production.",
    content: {
      explanation: `Django signals let decoupled components react to events that happen elsewhere in the framework. A signal is a dispatcher: senders fire it, receivers listen for it.

INTERNAL ARCHITECTURE

Django's signal system lives in django.dispatch. The core class is Signal, defined in django/dispatch/dispatcher.py. Each built-in signal (pre_save, post_save, etc.) is a module-level singleton instance of Signal.

Internally, Signal maintains a list of receivers — tuples of (lookup_key, weakref_to_receiver_function). When Signal.send() is called, it iterates that list, dereferences each weakref, and calls the function with keyword arguments.

WEAK REFERENCES BY DEFAULT

By default, Signal.connect() stores a weak reference to the receiver function. This means if your receiver is a local function that goes out of scope, Django silently drops it — the signal fires but nothing happens. This is a common gotcha with lambdas and methods. To force a strong reference, pass weak=False to connect().

THE BUILT-IN SIGNALS

1. pre_save(sender, instance, raw, using, update_fields)
   Fired by Model.save() BEFORE the SQL INSERT or UPDATE. 'raw' is True during loaddata. 'update_fields' is a frozenset if save(update_fields=[...]) was called.

2. post_save(sender, instance, created, raw, using, update_fields)
   Fired AFTER a successful save. 'created' is True for INSERT, False for UPDATE. This is where you commonly trigger side effects like sending a welcome email.

3. pre_delete(sender, instance, using)
   Fired BEFORE the DELETE SQL. The instance still exists in the database at this point.

4. post_delete(sender, instance, using)
   Fired AFTER deletion. The instance.pk is still set even though the row is gone.

5. m2m_changed(sender, instance, action, reverse, model, pk_set, using)
   Fired when a ManyToManyField is modified. 'action' is one of: pre_add, post_add, pre_remove, post_remove, pre_clear, post_clear. 'sender' is the through model, NOT the model with the M2M field.

SIGNAL DISPATCH INTERNALS

Signal.send(sender, **kwargs) calls ALL receivers synchronously, in registration order, in the same thread and transaction. There is no async dispatch, no retry, no error isolation by default. If one receiver raises an exception, subsequent receivers may not run (though Signal.send_robust() catches exceptions per-receiver and returns them).

THE @receiver DECORATOR

from django.dispatch import receiver
@receiver(post_save, sender=MyModel)
def my_handler(sender, instance, created, **kwargs):
    ...

This is syntactic sugar for post_save.connect(my_handler, sender=MyModel). The sender= filter means the receiver only fires for that specific model. Without sender=, the receiver fires for EVERY model save across the entire app — a performance and correctness hazard.

APPCONFIG.READY() IMPORT PATTERN

Signals registered at module import time can cause AppRegistryNotReady errors if the signals module is imported before apps are fully loaded. The canonical solution is to import your signals in AppConfig.ready():

class MyAppConfig(AppConfig):
    name = 'myapp'
    def ready(self):
        import myapp.signals  # noqa: F401 — import triggers @receiver decorators

SIGNALS VS OVERRIDING save()

Override save() when: the logic is intrinsic to the model, you need access to the old values, you want to control the behavior within the same transaction cleanly.

Use signals when: the logic belongs in a different app that should not import the sending app, you need to react to third-party model saves you cannot modify.

TRANSACTION DANGER

post_save fires INSIDE the database transaction that wraps the save. If your receiver does external work (sends an email, calls an API), that work happens before the transaction commits. If the transaction later rolls back, your side effect is NOT rolled back. Use transaction.on_commit() inside the receiver to defer side effects until after commit.

HIDDEN COUPLING AND ORDERING

Signals create implicit dependencies. When debugging why something unexpected happens on save, signals are invisible to the call stack. Multiple receivers registered for the same signal run in an undefined order (the order they were connected). This makes reasoning about execution order difficult in large codebases.`,

      realExample: `You are building a SaaS platform. When a new User registers, you need to: (1) create a UserProfile record, (2) send a welcome email, (3) notify your analytics service.

Without signals, all three happen inside your registration view — tightly coupled. With signals:

post_save on User fires after User.objects.create_user(). Three receivers handle the three concerns independently. The UserProfile app does not need to import the Email app; the Email app does not need to import Analytics.

But here is where it gets dangerous: your welcome email receiver calls sendgrid_client.send(). This call happens INSIDE the database transaction that created the User row. If something else in that transaction fails and rolls back, the user row is gone but the email was already sent.

The fix: wrap the email send in transaction.on_commit(lambda: send_welcome_email(user.pk)). Now the email only sends if the transaction actually commits. The user.pk is captured by closure — do not capture the instance itself because after on_commit fires the instance may be stale.

Another real scenario: m2m_changed on a User's groups field. Every time a user is added to a permission group, you want to invalidate their permissions cache in Redis. The m2m_changed signal with action='post_add' fires after the through-table INSERT, giving you the pk_set of newly added group PKs to target for cache deletion.`,

      codeExample: `# ── SIGNALS SETUP ───────────────────────────────────────────────────────────
# myapp/apps.py
from django.apps import AppConfig

class MyAppConfig(AppConfig):
    name = 'myapp'
    default_auto_field = 'django.db.models.BigAutoField'

    def ready(self):
        # Import signals module to register all @receiver decorators.
        # This runs once after all apps are loaded — safe to import models here.
        import myapp.signals  # noqa: F401


# ── SIGNAL RECEIVERS ────────────────────────────────────────────────────────
# myapp/signals.py
from django.db import transaction
from django.db.models.signals import post_save, pre_delete, post_delete, m2m_changed
from django.dispatch import receiver
from django.contrib.auth import get_user_model

from myapp.models import UserProfile, AuditLog

User = get_user_model()


# BASIC: create a related record when a User is created.
# sender=User means this ONLY fires for User saves, not every model.
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        # Only on INSERT, not UPDATE
        UserProfile.objects.create(user=instance)


# SAFE SIDE EFFECTS: defer external calls until after transaction commits.
@receiver(post_save, sender=User)
def send_welcome_email(sender, instance, created, **kwargs):
    if created:
        # BAD (runs inside transaction, email sent even if transaction rolls back):
        # send_email(instance.email)

        # GOOD: on_commit defers until the DB transaction commits successfully.
        transaction.on_commit(
            lambda: _dispatch_welcome_email(instance.pk)
        )
        # Capture pk (int), not the instance object — instance may be stale later.


def _dispatch_welcome_email(user_pk):
    # Called after commit. Re-fetch from DB to get fresh data.
    user = User.objects.get(pk=user_pk)
    print(f'Sending welcome email to {user.email}')
    # email_service.send_welcome(user.email)


# PRE_DELETE: capture state before the row is gone.
@receiver(pre_delete, sender=User)
def log_user_deletion(sender, instance, **kwargs):
    # instance still exists in DB here — safe to read relationships.
    AuditLog.objects.create(
        action='user_deleted',
        metadata={'email': instance.email, 'pk': instance.pk}
    )


# M2M_CHANGED: react to group membership changes.
@receiver(m2m_changed, sender=User.groups.through)
def invalidate_permission_cache(sender, instance, action, pk_set, **kwargs):
    # sender is the through model (User_groups), not User itself.
    # instance is the User whose groups changed.
    if action in ('post_add', 'post_remove', 'post_clear'):
        cache_key = f'user_perms_{instance.pk}'
        # cache.delete(cache_key)
        print(f'Invalidated permission cache for user {instance.pk}')


# ── MANUAL CONNECT / DISCONNECT ─────────────────────────────────────────────
# For cases where @receiver is not appropriate (e.g. testing, dynamic handlers).
from django.db.models.signals import post_save

def temporary_handler(sender, instance, **kwargs):
    print('fired')

# Strong reference — will not be garbage collected
post_save.connect(temporary_handler, sender=User, weak=False)

# Disconnect by passing the exact same function reference
post_save.disconnect(temporary_handler, sender=User)


# ── SEND_ROBUST EXAMPLE ─────────────────────────────────────────────────────
# Signal.send() stops at first exception.
# Signal.send_robust() catches exceptions per-receiver and returns them.
from django.db.models.signals import post_save as ps

responses = ps.send_robust(sender=User, instance=None, created=False)
for receiver_func, response in responses:
    if isinstance(response, Exception):
        print(f'Receiver {receiver_func} raised: {response}')


# ── TESTING SIGNALS ─────────────────────────────────────────────────────────
# tests/test_signals.py
from unittest.mock import patch, call
from django.test import TestCase
from django.contrib.auth import get_user_model

User = get_user_model()

class SignalTests(TestCase):
    def test_profile_created_on_user_save(self):
        from myapp.models import UserProfile
        user = User.objects.create_user('alice', 'alice@example.com', 'pass')
        self.assertTrue(UserProfile.objects.filter(user=user).exists())

    @patch('myapp.signals._dispatch_welcome_email')
    def test_welcome_email_sent_after_commit(self, mock_send):
        # on_commit fires immediately in TestCase (wraps each test in a transaction
        # that is rolled back, so on_commit callbacks run at end of test block).
        User.objects.create_user('bob', 'bob@example.com', 'pass')
        mock_send.assert_called_once()


# ── DISCONNECTING SIGNALS IN TESTS ─────────────────────────────────────────
# Isolate unit tests from signal side effects.
from django.db.models.signals import post_save
from django.test.utils import isolate_apps

class IsolatedTest(TestCase):
    def setUp(self):
        post_save.disconnect(create_user_profile, sender=User)

    def tearDown(self):
        post_save.connect(create_user_profile, sender=User)

    def test_user_without_profile(self):
        user = User.objects.create_user('carol', 'carol@example.com', 'pass')
        # Profile was NOT created — signal was disconnected
        from myapp.models import UserProfile
        self.assertFalse(UserProfile.objects.filter(user=user).exists())
`,

      outputExplanation: `Signals work because Signal.send() iterates a list of weakrefs. When the User model's save() method calls pre_save.send(sender=self.__class__, instance=self, ...), Django looks up all receivers registered for that sender (or all senders) and calls them synchronously. The @receiver decorator is pure syntactic sugar — it calls signal.connect(func, sender=sender) at import time, which appends (lookup_key, weakref(func)) to signal.receivers. The lookup_key includes the id of the dispatch_uid or the function identity so duplicate connections are prevented. transaction.on_commit() works by appending the callback to the current atomic block's on_commit list; when the outermost SAVEPOINT or transaction commits, Django iterates that list. In tests, Django's TestCase wraps each test in a transaction that is never committed — Django handles this by running on_commit callbacks at the end of the test anyway so tests behave realistically.`,

      commonMistakes: [
        "Importing models at module level in signals.py — causes AppRegistryNotReady. Always import inside the function body or use get_user_model().",
        "Forgetting sender= filter — your receiver fires for EVERY model save in the entire app, causing subtle bugs and performance hits.",
        "Doing external I/O (email, HTTP calls) directly in post_save without transaction.on_commit() — side effects fire even if the transaction rolls back.",
        "Registering signals outside AppConfig.ready() (e.g. at the top of models.py) — signals can be registered multiple times if the module is imported more than once, causing receivers to fire multiple times.",
        "Using a lambda as a receiver with the default weak=True — the lambda has no other reference, gets garbage collected immediately, and silently stops firing.",
        "Capturing the model instance in an on_commit closure — the instance object may be stale by the time on_commit fires. Capture the pk and re-fetch.",
        "Using Signal.send() in critical paths without send_robust() — a single misbehaving receiver can break the entire request by raising an unhandled exception."
      ],

      interviewNotes: [
        "Django signals are synchronous — receivers run in the same thread and database transaction as the sender.",
        "Signal.send() stops on first exception; Signal.send_robust() catches per-receiver exceptions and continues.",
        "By default, Signal.connect() stores a weak reference; pass weak=False to keep a strong reference.",
        "The canonical pattern for registering signals is importing the signals module in AppConfig.ready().",
        "m2m_changed sender is the through model (e.g. User.groups.through), not the model that declares the M2M field.",
        "post_save fires inside the DB transaction; use transaction.on_commit() to defer side effects until after commit.",
        "Signals create hidden coupling — prefer overriding save() when logic is intrinsic to the model.",
        "In Django TestCase, on_commit callbacks are run at the end of each test even though no real commit happens.",
        "Signal receivers run in registration order, which is not guaranteed across restarts unless you use dispatch_uid."
      ],

      whenToUse: "Use signals when a component in app B needs to react to an event in app A and you cannot or should not create a direct import dependency from A to B — classic decoupled plugin-style architecture.",
      whenNotToUse: "Avoid signals for logic that is intrinsic to a single model (override save() instead), for anything performance-critical in tight loops, or when you need guaranteed ordering and error isolation between handlers."
    },
    tags: ["signals", "post_save", "pre_save", "m2m_changed", "dispatch", "transaction", "on_commit", "receivers"],
    order: 4,
    estimatedMinutes: 25
  },

  {
    id: "custom-managers-querysets",
    title: "Custom Managers & QuerySets — Encapsulating ORM Logic",
    slug: "custom-managers-querysets",
    category: "django",
    subcategory: "managers",
    difficulty: "intermediate",
    description: "How to build reusable, chainable ORM logic with custom Managers and QuerySets, when to subclass each, and how they power the fat-models pattern.",
    content: {
      explanation: `Django's ORM exposes data access through two layers: Manager and QuerySet. Understanding both — and when to extend each — is essential for keeping ORM logic out of views and making it reusable across the codebase.

MANAGER VS QUERYSET: THE DISTINCTION

A Manager is the entry point attached to the model class (e.g. Article.objects). It provides the initial interface. Internally, Manager.get_queryset() returns a QuerySet. Every chained call on that QuerySet (filter(), exclude(), annotate(), etc.) returns a new QuerySet — they are immutable and lazy. The SQL is only executed when you iterate, call len(), bool(), or list() on the QuerySet.

A QuerySet method like .filter() returns another QuerySet. A Manager is not a QuerySet — it cannot be chained directly, but it can RETURN a QuerySet.

WHEN TO SUBCLASS QuerySet

Subclass QuerySet when you want methods that can be CHAINED with other QuerySet methods. Example: Article.objects.published().recent().with_author() — each step narrows the queryset further. If published() is defined on a custom QuerySet, it can be followed by .filter(), .order_by(), or any other QuerySet method because it returns a QuerySet.

class ArticleQuerySet(models.QuerySet):
    def published(self):
        return self.filter(status='published')
    def recent(self):
        return self.order_by('-created_at')

WHEN TO SUBCLASS Manager

Subclass Manager when you need to control the INITIAL queryset (e.g. global soft-delete filter), add class-level methods that do not return querysets, or change the default queryset for all queries on a model.

class PublishedManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(status='published')

Article.published.all()  # Only published articles

AS_MANAGER() — BRIDGING BOTH

QuerySet.as_manager() creates a Manager from a QuerySet class, making all QuerySet methods available directly on the manager AND preserving chainability. This is the modern preferred pattern — write your logic once in a QuerySet, get a Manager for free.

class ArticleQuerySet(models.QuerySet):
    def published(self):
        return self.filter(status='published')

class Article(models.Model):
    objects = ArticleQuerySet.as_manager()

Article.objects.published().filter(author=user)  # fully chainable

DEFAULT MANAGER AND MIGRATIONS

Django uses the first manager defined on the model as the default manager for certain internal operations (e.g. loading related objects). If your default manager filters rows (like a soft-delete manager), Django's internal joins may miss rows. Set Meta.default_manager_name or add a separate unfiltered manager and put it first. The use_in_migrations = True attribute on a Manager tells Django to include it in migration files — required if makemigrations needs to use the manager to inspect data.

FAT MODELS, THIN VIEWS PATTERN

Put all ORM logic in the model layer (Manager/QuerySet methods). Views should call high-level methods like Article.objects.for_homepage() rather than building complex filter chains inline. This keeps views thin, makes ORM logic testable in isolation, and prevents duplication across multiple views.

ANNOTATE INSIDE MANAGERS

You can push annotate() calls into managers to avoid repeating them. This is powerful for derived fields:

class OrderQuerySet(models.QuerySet):
    def with_total(self):
        from django.db.models import Sum
        return self.annotate(line_total=Sum('items__price'))

Order.objects.with_total().filter(line_total__gt=100)

The annotation becomes a computed column in the SQL SELECT — no Python-level aggregation.

CHAINING MULTIPLE CUSTOM METHODS

Because as_manager() / custom QuerySet methods return self.__class__.filter(...), chaining works naturally:

Product.objects.active().in_stock().order_by_price()

Each method receives the already-filtered queryset as self and further narrows it. The final SQL is a single optimized query with all WHERE clauses combined.

MANAGER INHERITANCE

When you subclass a model, managers are inherited. If your abstract base model defines a manager, all child models inherit it. This is the right place to put common filtering logic shared across many models (e.g. SoftDeleteManager, TenantManager).`,

      realExample: `You are building a blog platform. Articles have status ('draft', 'published', 'archived'), a publish_at datetime, and a soft-delete flag is_deleted. Views need: homepage feed (published, not deleted, ordered by date), draft list for authors (draft, not deleted), admin view (all including deleted).

Without custom managers, every view repeats:
Article.objects.filter(status='published', is_deleted=False, publish_at__lte=now()).order_by('-publish_at')

With a custom QuerySet you define published(), not_deleted(), and available() once. The homepage view calls Article.objects.available(). The author dashboard calls Article.objects.not_deleted().filter(status='draft', author=request.user). The admin uses Article.all_objects.all() — a second unfiltered manager.

The annotate pattern comes in for the sidebar showing article counts per tag: Article.objects.available().values('tags__name').annotate(count=Count('id')).order_by('-count') — this lives inside a manager method tag_counts() and is called from the template context processor once, cached, and reused everywhere.`,

      codeExample: `# ── CUSTOM QUERYSET ─────────────────────────────────────────────────────────
# models.py
from django.db import models
from django.db.models import Count, Avg, Q
from django.utils import timezone


class ArticleQuerySet(models.QuerySet):
    """All reusable query logic lives here. Methods return QuerySet — chainable."""

    def published(self):
        """Articles with status=published."""
        return self.filter(status='published')

    def not_deleted(self):
        """Exclude soft-deleted rows."""
        return self.filter(is_deleted=False)

    def available(self):
        """Public-facing feed: published, not deleted, publish date in the past."""
        return (
            self.not_deleted()
                .published()
                .filter(publish_at__lte=timezone.now())
        )

    def for_author(self, user):
        """All non-deleted articles for a specific author."""
        return self.not_deleted().filter(author=user)

    def recent(self, n=10):
        """Most recently published, limit n."""
        return self.order_by('-publish_at')[:n]

    def with_comment_count(self):
        """Annotate each article with its comment count — single SQL query."""
        return self.annotate(comment_count=Count('comments'))

    def with_avg_rating(self):
        """Annotate with average review rating."""
        return self.annotate(avg_rating=Avg('reviews__score'))

    def search(self, query):
        """Full-text search across title and body."""
        return self.filter(
            Q(title__icontains=query) | Q(body__icontains=query)
        )


# ── CUSTOM MANAGER VIA as_manager() ─────────────────────────────────────────
class Article(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Published'),
        ('archived', 'Archived'),
    ]
    title = models.CharField(max_length=200)
    body = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    author = models.ForeignKey('auth.User', on_delete=models.CASCADE)
    publish_at = models.DateTimeField(null=True, blank=True)
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    # objects uses ArticleQuerySet — all methods available AND chainable
    objects = ArticleQuerySet.as_manager()

    # all_objects is an unfiltered manager — used by admin, migrations, internal joins
    all_objects = models.Manager()

    class Meta:
        # Tell Django which manager to use for internal lookups (related objects, etc.)
        # Without this, if objects filters rows, Django may miss related objects.
        default_manager_name = 'all_objects'

    def __str__(self):
        return self.title


# ── USAGE IN VIEWS ───────────────────────────────────────────────────────────
# views.py — thin, no ORM logic here

def homepage(request):
    # Single clean call — no filter/exclude chain in the view
    articles = Article.objects.available().with_comment_count()
    return render(request, 'home.html', {'articles': articles})

def author_dashboard(request):
    articles = Article.objects.for_author(request.user).with_comment_count()
    return render(request, 'dashboard.html', {'articles': articles})

def search_view(request):
    q = request.GET.get('q', '')
    results = Article.objects.available().search(q).with_avg_rating()
    return render(request, 'search.html', {'results': results, 'query': q})


# ── SUBCLASSING Manager DIRECTLY ────────────────────────────────────────────
# Use this when you need to override get_queryset() (default filter).

class SoftDeleteManager(models.Manager):
    """Filters out soft-deleted rows automatically for all queries."""

    # use_in_migrations tells Django to serialize this manager in migration files.
    # Required if makemigrations needs to use the manager to inspect existing data.
    use_in_migrations = True

    def get_queryset(self):
        return super().get_queryset().filter(is_deleted=False)


class Comment(models.Model):
    article = models.ForeignKey(Article, on_delete=models.CASCADE, related_name='comments')
    body = models.TextField()
    is_deleted = models.BooleanField(default=False)

    # Default manager hides deleted rows
    objects = SoftDeleteManager()
    # Unfiltered manager for admin / recovery
    unfiltered = models.Manager()

    def soft_delete(self):
        self.is_deleted = True
        self.save(update_fields=['is_deleted'])


# ── MANAGER INHERITANCE ON ABSTRACT MODELS ──────────────────────────────────
class TimeStampedQuerySet(models.QuerySet):
    def recent(self):
        return self.order_by('-created_at')

    def older_than(self, days):
        from datetime import timedelta
        cutoff = timezone.now() - timedelta(days=days)
        return self.filter(created_at__lt=cutoff)

class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # All models that inherit TimeStampedModel get .recent() and .older_than()
    objects = TimeStampedQuerySet.as_manager()

    class Meta:
        abstract = True  # No DB table created for this model


class Product(TimeStampedModel):
    name = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    # Inherits objects = TimeStampedQuerySet.as_manager()

# Product.objects.recent()           -- works, inherited
# Product.objects.older_than(30)     -- works, inherited


# ── TESTING CUSTOM MANAGERS ──────────────────────────────────────────────────
# tests/test_managers.py
from django.test import TestCase
from django.contrib.auth import get_user_model
from myapp.models import Article

User = get_user_model()

class ArticleManagerTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user('alice', 'alice@example.com', 'pass')
        Article.all_objects.create(
            title='Draft', status='draft', author=self.user, is_deleted=False
        )
        Article.all_objects.create(
            title='Published', status='published', author=self.user,
            is_deleted=False, publish_at=timezone.now()
        )
        Article.all_objects.create(
            title='Deleted', status='published', author=self.user,
            is_deleted=True, publish_at=timezone.now()
        )

    def test_available_excludes_deleted_and_draft(self):
        qs = Article.objects.available()
        self.assertEqual(qs.count(), 1)
        self.assertEqual(qs.first().title, 'Published')

    def test_chaining_available_with_search(self):
        qs = Article.objects.available().search('Published')
        self.assertEqual(qs.count(), 1)

    def test_with_comment_count_annotation(self):
        qs = Article.objects.available().with_comment_count()
        article = qs.first()
        self.assertEqual(article.comment_count, 0)
`,

      outputExplanation: `QuerySet methods work because each method returns self.filter(...) — that is, a new QuerySet instance of the same class (self.__class__) with the additional filter applied. The SQL is never executed until evaluation. as_manager() creates a ManagerFromArticleQuerySet class at runtime that proxies all QuerySet methods onto an initial get_queryset() call. This means Article.objects.published() is equivalent to Article.objects.get_queryset().published() — both produce SELECT ... WHERE status = 'published'. Annotations (annotate()) add expressions to the SQL SELECT clause, not Python-level loops. COUNT(*) in with_comment_count() becomes a SQL GROUP BY under the hood. Django's ORM merges all chained filters into a single WHERE clause with AND conditions, so Article.objects.available().search('python') produces one SQL query with all three conditions.`,

      commonMistakes: [
        "Defining custom methods on Manager instead of QuerySet — they cannot be chained with .filter(), .order_by(), etc. because Manager is not a QuerySet.",
        "Using a filtering default manager without also defining an unfiltered manager — Django's internal related-object lookups use the default manager and will silently miss rows.",
        "Forgetting use_in_migrations = True on a custom Manager that is used by data migrations — makemigrations will fail or produce broken migration files.",
        "Calling list() or len() on a QuerySet inside a manager method — this evaluates the SQL immediately and returns Python objects, breaking chaining and negating laziness.",
        "Slicing a QuerySet inside a manager method and then trying to chain further filters — sliced QuerySets cannot be filtered (raises TypeError).",
        "Defining managers on non-abstract base models expecting child models to inherit them — only abstract model managers are inherited automatically.",
        "Shadowing the built-in objects manager without adding it back — this removes access to User.objects.create_user() and similar manager methods on auth models."
      ],

      interviewNotes: [
        "QuerySet methods are chainable because each returns a new QuerySet instance — SQL is not executed until evaluation.",
        "Manager.get_queryset() is called every time you access Model.objects — override it to apply a global default filter (e.g. soft-delete).",
        "QuerySet.as_manager() is the preferred pattern — write logic once in QuerySet, get a Manager for free, keep methods chainable.",
        "Django uses the default manager for internal operations like loading related objects — a filtering default manager can break FK lookups.",
        "use_in_migrations = True is required if a custom manager is used in data migrations.",
        "Annotations inside QuerySet methods push computation to the database — more efficient than Python-level aggregation.",
        "Fat models / thin views: ORM logic belongs on the model layer (managers/querysets), not in views or serializers.",
        "Abstract model managers are inherited by all child models; concrete model managers are not.",
        "Chaining works by AND-ing all filter conditions into a single SQL WHERE clause — no N+1 from chaining."
      ],

      whenToUse: "Use custom QuerySets and Managers whenever the same filter or annotation logic appears in more than one place, to keep views thin, and to make ORM logic unit-testable in isolation from HTTP concerns.",
      whenNotToUse: "Do not push extremely complex business logic that requires Python-level state or external service calls into managers — keep managers focused on database query construction only."
    },
    tags: ["managers", "queryset", "orm", "as_manager", "annotations", "fat-models", "chaining", "soft-delete"],
    order: 5,
    estimatedMinutes: 25
  },

  {
    id: "django-admin-customization",
    title: "Django Admin — Deep Customization",
    slug: "django-admin-customization",
    category: "django",
    subcategory: "admin",
    difficulty: "intermediate",
    description: "How to customize Django Admin with ModelAdmin options, inlines, custom actions, permission overrides, and custom views — and how the admin uses the ORM internally.",
    content: {
      explanation: `Django's admin is a full Django application mounted at /admin/. It introspects your models and generates CRUD interfaces automatically. Understanding its internals lets you customize it far beyond the defaults.

HOW ADMIN USES THE ORM

AdminSite registers ModelAdmin instances. When you visit the changelist (list view), Django calls ModelAdmin.get_queryset(request), which by default returns Model._default_manager.get_queryset(). Every filter, search, and sort you configure in list_filter, search_fields, and ordering modifies this queryset. The admin then paginates it using Django's Paginator class.

For the change form (edit view), the admin fetches a single object with Model._default_manager.get(pk=pk). If your default manager filters rows, you can make objects unreachable in the admin. Always ensure the admin uses an unfiltered manager or override get_queryset() on the ModelAdmin.

LIST_DISPLAY

list_display is a tuple of field names OR callables. A callable receives the object instance and returns a string. You can return HTML using mark_safe() from django.utils.html — but you must sanitize any user-controlled content first. Each callable can have attributes: .short_description (column header), .admin_order_field (ORM field to sort by), .boolean (renders True/False as icons).

SEARCH_FIELDS

search_fields generates SQL LIKE (ILIKE on Postgres) queries joined with OR. The prefix ^ means startswith, = means exact, @ means full-text search (Postgres only), no prefix means contains. Searching across FK relationships works: search_fields = ['author__email'] joins the author table and filters on email.

LIST_FILTER

list_filter accepts field names (Django generates simple boolean/choice/date filters automatically) or custom SimpleListFilter subclasses. A SimpleListFilter defines lookups() (returns (value, label) pairs) and queryset() (filters the queryset based on the selected value).

INLINES

TabularInline renders related objects in a compact table format. StackedInline renders each related object in a full form layout. Both take the related model class and a set of ModelAdmin-like options (fields, readonly_fields, extra, max_num, can_delete). The parent form and all inline forms are saved inside a single database transaction.

CUSTOM ACTIONS

Actions are functions with signature action(modeladmin, request, queryset). Register them in ModelAdmin.actions. The queryset is the set of checked rows. Good for bulk operations: bulk approve, bulk export to CSV, bulk soft-delete.

Calling update() on the queryset in an action bypasses model.save() and signals — intentional for performance but be aware of the tradeoff.

READONLY_FIELDS AND FIELDSETS

readonly_fields can include field names OR callables that take (obj) and return HTML. fieldsets organizes fields into collapsible sections: a list of (heading, {'fields': [...]}) tuples. 'collapse' in classes makes a section collapsed by default.

GET_QUERYSET AND HAS_PERMISSION METHODS

Override get_queryset(request) to restrict which objects a user can see. Filter by request.user for row-level visibility. Override has_add_permission(), has_change_permission(), has_delete_permission(), has_view_permission() to return True/False based on request.user. These methods receive the request and optionally the obj for object-level control.

CUSTOM ADMIN VIEWS

You can add completely custom URLs to a ModelAdmin by overriding get_urls(). These URLs are mounted under /admin/appname/modelname/custom-action/. Your custom view function has access to the AdminSite and can use admin templates for consistent styling by calling self.admin_site.each_context(request) to get the admin template context.

ADMIN SITE CUSTOMIZATION

You can subclass AdminSite to create a completely separate admin instance with different branding, a different URL prefix, and a different set of registered models — useful for separating staff-facing and superuser-facing interfaces.`,

      realExample: `You are building an e-commerce backend. The Order model has status (pending/paid/shipped/cancelled), a customer FK, and line items via an OrderItem M2M. The admin needs to: (1) show order total and item count in the list, (2) let staff filter by status and date, (3) edit line items inline, (4) bulk-export selected orders to CSV, (5) prevent staff from deleting paid orders.

list_display includes a calculated order_total callable that annotates with Sum. list_filter uses status and a DateFieldListFilter on created_at. OrderItemInline (TabularInline) shows items on the change form. The export_to_csv action builds a CSV response from the queryset. has_delete_permission(request, obj) returns False if obj.status == 'paid'. get_queryset() annotates with item_count so the list column can sort by it without a second query.`,

      codeExample: `# ── BASIC MODELADMIN ────────────────────────────────────────────────────────
# myapp/admin.py
from django.contrib import admin
from django.utils.html import mark_safe, format_html
from django.db.models import Sum, Count
from django.http import HttpResponse
from django.urls import path
import csv

from myapp.models import Order, OrderItem, Product, Category


# ── INLINE: related model edited on parent form ──────────────────────────────
class OrderItemInline(admin.TabularInline):
    model = OrderItem
    fields = ('product', 'quantity', 'unit_price', 'line_total_display')
    readonly_fields = ('line_total_display',)
    extra = 0        # no blank extra rows by default
    max_num = 50
    can_delete = True

    def line_total_display(self, obj):
        if obj.pk:
            return f'\${obj.quantity * obj.unit_price:.2f}'
        return '-'
    line_total_display.short_description = 'Line Total'


# ── CUSTOM LIST FILTER ───────────────────────────────────────────────────────
from django.contrib.admin import SimpleListFilter

class HighValueFilter(SimpleListFilter):
    title = 'order value'
    parameter_name = 'value_tier'

    def lookups(self, request, model_admin):
        # Returns (url_value, display_label) pairs shown in the filter sidebar.
        return [
            ('high', 'High (> $500)'),
            ('medium', '$100 – $500'),
            ('low', '< $100'),
        ]

    def queryset(self, request, queryset):
        # Called with the selected value from lookups().
        queryset = queryset.annotate(total=Sum('items__unit_price'))
        if self.value() == 'high':
            return queryset.filter(total__gt=500)
        if self.value() == 'medium':
            return queryset.filter(total__gte=100, total__lte=500)
        if self.value() == 'low':
            return queryset.filter(total__lt=100)
        return queryset


# ── CUSTOM ACTION ────────────────────────────────────────────────────────────
def export_orders_csv(modeladmin, request, queryset):
    """Bulk action: export selected orders as CSV download."""
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="orders.csv"'
    writer = csv.writer(response)
    writer.writerow(['ID', 'Customer', 'Status', 'Created'])
    for order in queryset.select_related('customer'):
        writer.writerow([
            order.pk,
            order.customer.email,
            order.status,
            order.created_at.strftime('%Y-%m-%d'),
        ])
    return response

export_orders_csv.short_description = 'Export selected orders to CSV'


# ── MAIN MODELADMIN ─────────────────────────────────────────────────────────
@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    # ── List view ──────────────────────────────────────────────────────────
    list_display = (
        'id', 'customer_email', 'status', 'item_count', 'order_total_display',
        'created_at', 'status_badge'
    )
    list_filter = ('status', HighValueFilter, 'created_at')
    search_fields = ('customer__email', 'customer__first_name', 'id')
    # ^ prefix = startswith; no prefix = contains; = means exact
    ordering = ('-created_at',)
    date_hierarchy = 'created_at'   # drill-down by year/month/day at top
    list_per_page = 50
    list_select_related = ('customer',)  # avoids N+1 for customer FK

    # ── Detail / change form ───────────────────────────────────────────────
    inlines = [OrderItemInline]
    readonly_fields = ('created_at', 'updated_at', 'order_total_display')
    fieldsets = [
        ('Order Info', {
            'fields': ('customer', 'status', 'order_total_display')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),  # collapsed by default
        }),
    ]
    actions = [export_orders_csv]
    save_on_top = True  # show Save buttons at the top of the form too

    # ── Custom list_display callables ──────────────────────────────────────
    def customer_email(self, obj):
        return obj.customer.email
    customer_email.short_description = 'Customer'
    customer_email.admin_order_field = 'customer__email'  # enable column sorting

    def order_total_display(self, obj):
        # Uses annotation set in get_queryset below — no extra query.
        total = getattr(obj, 'total', None)
        if total is not None:
            return f'\${total:.2f}'
        return 'N/A'
    order_total_display.short_description = 'Total'
    order_total_display.admin_order_field = 'total'

    def item_count(self, obj):
        return getattr(obj, 'num_items', 0)
    item_count.short_description = 'Items'
    item_count.admin_order_field = 'num_items'

    def status_badge(self, obj):
        # mark_safe allows raw HTML. Only use with trusted/sanitized data.
        colors = {
            'pending': '#f59e0b',
            'paid': '#10b981',
            'shipped': '#3b82f6',
            'cancelled': '#ef4444',
        }
        color = colors.get(obj.status, '#6b7280')
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 8px;border-radius:4px">{}</span>',
            color,
            obj.get_status_display()
        )
        # format_html auto-escapes arguments — safer than mark_safe + string concat.
    status_badge.short_description = 'Status'

    # ── Custom queryset: annotate for list columns ─────────────────────────
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.annotate(
            total=Sum('items__unit_price'),
            num_items=Count('items')
        )

    # ── Permission overrides ───────────────────────────────────────────────
    def has_delete_permission(self, request, obj=None):
        # Prevent deletion of paid or shipped orders.
        if obj is not None and obj.status in ('paid', 'shipped'):
            return False
        return super().has_delete_permission(request, obj)

    def has_change_permission(self, request, obj=None):
        # Read-only for cancelled orders.
        if obj is not None and obj.status == 'cancelled':
            return False
        return super().has_change_permission(request, obj)

    # ── Custom admin URL ───────────────────────────────────────────────────
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                '<int:order_id>/resend-confirmation/',
                self.admin_site.admin_view(self.resend_confirmation_view),
                name='order-resend-confirmation',
            ),
        ]
        return custom_urls + urls  # custom URLs must come BEFORE the default catch-all

    def resend_confirmation_view(self, request, order_id):
        from django.contrib import messages
        from django.shortcuts import redirect
        order = Order.objects.get(pk=order_id)
        # send_confirmation_email(order)
        messages.success(request, f'Confirmation email resent for order #{order_id}')
        return redirect('admin:myapp_order_change', order_id)


# ── STACKED INLINE (for comparison) ─────────────────────────────────────────
class ProductImageInline(admin.StackedInline):
    # StackedInline renders each related object as a full form with labels.
    # Good when each related object has many fields.
    model = Product.images.through if hasattr(Product, 'images') else OrderItem
    extra = 1


# ── REGISTERING WITHOUT DECORATOR ───────────────────────────────────────────
# Equivalent to @admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'price', 'is_active')
    list_filter = ('is_active', 'category')
    search_fields = ('name', 'sku')
    list_editable = ('price', 'is_active')  # editable directly in the list view

admin.site.register(Product, ProductAdmin)
`,

      outputExplanation: `The admin's changelist view calls get_queryset() once, applies list_filter and search_fields as additional .filter() calls on that queryset, then paginates with Paginator(qs, list_per_page). For each row, list_display callables receive the annotated object — which is why order_total_display works without extra queries: the total annotation was added in get_queryset(). format_html() uses Python's str.format() but marks the result as safe only after escaping all arguments, preventing XSS from user-controlled data. mark_safe() marks a string as unconditionally safe — never pass user input through it. Custom admin URLs must be prepended (not appended) to the url list because Django's default catch-all pattern <pk>/change/ would otherwise consume your custom URL first. admin_site.admin_view() wraps your view to enforce admin login and CSRF protection.`,

      commonMistakes: [
        "Using mark_safe() with user-controlled content — always use format_html() which auto-escapes arguments to prevent XSS in the admin.",
        "Overriding get_queryset() to add annotations but forgetting to handle None in the list_display callable — if an annotation is missing (e.g. when the admin calls get_object()), the callable crashes.",
        "Adding custom URLs after the default URL patterns in get_urls() — Django's default <pk>/change/ catch-all matches first and raises a 404 for your custom path.",
        "Using list_editable with a field that is also in list_display as a callable — list_editable requires the field to be a raw model field name, not a callable.",
        "Setting a filtering default manager on a model without overriding ModelAdmin.get_queryset() — objects that are filtered by the manager become invisible and unreachable in the admin.",
        "Calling queryset.update() in a custom action without understanding it bypasses model.save() and all signals — intentional for bulk ops but dangerous if save() has critical side effects.",
        "Forgetting admin.site.admin_view() wrapper on custom views added via get_urls() — the view becomes publicly accessible without login."
      ],

      interviewNotes: [
        "The admin changelist calls ModelAdmin.get_queryset() once and applies filters, search, and ordering as queryset modifications — it runs one SQL query for the list.",
        "format_html() auto-escapes arguments and is safe for HTML in list_display; mark_safe() is unconditional and must never wrap user input.",
        "TabularInline renders related objects as table rows; StackedInline renders them as full forms — both save in one transaction with the parent.",
        "Custom admin actions receive (modeladmin, request, queryset) — queryset.update() in actions bypasses save() and signals.",
        "get_urls() custom patterns must be prepended, not appended, to avoid being swallowed by the default pk catch-all.",
        "has_delete_permission(request, obj=None) — obj is None when called for the list-level permission check, non-None for object-level.",
        "admin_site.admin_view() enforces login_required and CSRF on custom views added to the admin.",
        "list_select_related on ModelAdmin controls select_related() on the changelist queryset, preventing N+1 for FK fields in list_display.",
        "The admin uses Model._default_manager, not Model.objects — be careful with custom default managers that filter rows."
      ],

      whenToUse: "Use Django Admin for internal staff tooling, content management, and data management workflows where rapid CRUD UI matters more than custom UX — it is not suitable as a public-facing user interface.",
      whenNotToUse: "Do not use the default admin for customer-facing interfaces, complex multi-step workflows requiring custom UI, or high-traffic public endpoints — the admin is optimized for trusted internal staff, not scale or custom UX."
    },
    tags: ["admin", "ModelAdmin", "inlines", "list_display", "custom-actions", "permissions", "TabularInline", "mark_safe"],
    order: 6,
    estimatedMinutes: 25
  },

  {
    id: "management-commands",
    title: "Custom Management Commands — BaseCommand Deep Dive",
    slug: "management-commands",
    category: "django",
    subcategory: "commands",
    difficulty: "intermediate",
    description: "How to build production-grade Django management commands with BaseCommand, argument parsing, verbosity, idempotency, and testing via call_command().",
    content: {
      explanation: `Django management commands are Python scripts run via manage.py that have full access to the Django ORM, settings, and app ecosystem. They are the canonical way to write one-off scripts, scheduled jobs, data migrations, and maintenance tasks.

DIRECTORY STRUCTURE

Django discovers commands by scanning each installed app for management/commands/*.py. The file name becomes the command name. The structure must be exact:

myapp/
  management/
    __init__.py
    commands/
      __init__.py
      sync_inventory.py   # -> python manage.py sync_inventory

BASECOMMAND INTERNALS

BaseCommand defines execute(), which calls handle() after setting up output streams, verbosity, and color support. Your command subclasses BaseCommand and implements:

1. help: class attribute — shown by manage.py sync_inventory --help
2. add_arguments(parser): receives an argparse.ArgumentParser — add positional args and options here
3. handle(*args, **options): main logic — receives parsed options dict

OUTPUT STREAMS

BaseCommand provides self.stdout and self.stderr — instances of OutputWrapper that respect the --no-color flag and the configured verbosity. Always write to self.stdout.write() instead of print() so output can be captured in tests and suppressed in cron jobs.

Use self.style.SUCCESS(), self.style.WARNING(), self.style.ERROR() for colored terminal output. These are ANSI color codes — automatically disabled when output is not a TTY.

VERBOSITY LEVELS

All management commands accept --verbosity 0/1/2/3. Standard convention:
- 0: silent (no output)
- 1: normal output (default)
- 2: verbose output (extra detail)
- 3: very verbose (debug-level)

Check options['verbosity'] inside handle() and conditionally write detailed output.

ARGUMENT PARSING

add_arguments uses argparse. Positional arguments use parser.add_argument('name'). Optional flags use parser.add_argument('--flag', ...). Useful patterns: nargs='+' for multiple values, type=int for integer conversion, default= for fallbacks, action='store_true' for boolean flags.

CALLING FROM CODE (call_command)

from django.core.management import call_command
call_command('sync_inventory', '--dry-run', verbosity=0)
# or with kwargs
call_command('sync_inventory', dry_run=True, verbosity=0)

call_command() is the preferred way to invoke management commands from tests or other commands. Output goes to sys.stdout unless you redirect it with stdout= kwarg.

IDEMPOTENCY PATTERNS

A well-written management command should be safe to run multiple times. Use get_or_create() instead of create(), check existence before inserting, track processed rows in a separate table or with a processed_at field.

TESTING MANAGEMENT COMMANDS

from io import StringIO
from django.core.management import call_command
from django.test import TestCase

class CommandTest(TestCase):
    def test_command_output(self):
        out = StringIO()
        call_command('sync_inventory', stdout=out)
        self.assertIn('Synced', out.getvalue())

SCHEDULING WITH CRON AND CELERY

For cron: add an entry to crontab calling manage.py with the full Python path. For Celery: wrap call_command() inside a @shared_task. Management commands are NOT async — wrap async logic with asyncio.run() if needed.

TRANSACTION HANDLING

Wrap your handle() logic in transaction.atomic() for data integrity. But be careful with very large datasets — a single transaction locking millions of rows can cause deadlocks. Use chunked processing with explicit commits for large data operations.

REQUIRED PATTERN FOR LARGE DATASETS

Process in batches using .iterator() with chunk_size to avoid loading all rows into memory. Commit after each batch. Log progress every N batches for observability.`,

      realExample: `You are running an e-commerce platform. Every night at 2 AM, you need to sync product inventory from a third-party warehouse API. The sync must: (1) update existing products, (2) create new ones, (3) mark unavailable products, (4) be idempotent (safe to re-run if it fails midway), (5) support --dry-run for testing, (6) report counts at the end.

The command fetch_inventory queries the warehouse API, iterates the response, and calls Product.objects.update_or_create() for each SKU. A --dry-run flag skips the writes and shows what would change. A --sku argument lets you sync a single product during debugging. Verbosity 2 logs each product processed; verbosity 1 shows only the summary. The command is scheduled via Celery beat to run nightly, wrapped in a shared_task that calls call_command('fetch_inventory').`,

      codeExample: `# ── DIRECTORY STRUCTURE ─────────────────────────────────────────────────────
# myapp/
#   management/
#     __init__.py           <- required, can be empty
#     commands/
#       __init__.py         <- required, can be empty
#       sync_inventory.py   <- command name: sync_inventory


# ── THE COMMAND ──────────────────────────────────────────────────────────────
# myapp/management/commands/sync_inventory.py
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone


class Command(BaseCommand):
    help = 'Sync product inventory from warehouse API. Safe to re-run (idempotent).'

    def add_arguments(self, parser):
        # Positional argument — zero or more SKUs to sync specifically
        parser.add_argument(
            'skus',
            nargs='*',          # 0 or more; '*' makes it optional
            help='Specific SKU(s) to sync. If omitted, syncs all.'
        )
        # Optional flag
        parser.add_argument(
            '--dry-run',
            action='store_true',
            default=False,
            help='Show what would change without writing to the database.',
        )
        # Optional with value
        parser.add_argument(
            '--batch-size',
            type=int,
            default=500,
            help='Number of products to process per DB transaction (default: 500).',
        )
        parser.add_argument(
            '--source',
            choices=['warehouse_a', 'warehouse_b'],
            default='warehouse_a',
            help='Which warehouse API to use.',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        batch_size = options['batch_size']
        verbosity = options['verbosity']
        skus = options['skus']
        source = options['source']

        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN — no changes will be written.'))

        # Fetch data from external source (simplified for example)
        try:
            inventory_data = self._fetch_from_api(source, skus)
        except Exception as exc:
            # CommandError prints a clean error message and exits with code 1
            raise CommandError(f'Failed to fetch inventory from {source}: {exc}') from exc

        created_count = 0
        updated_count = 0
        skipped_count = 0

        # Process in batches for memory efficiency and transactional safety
        batch = []
        for item in inventory_data:
            batch.append(item)
            if len(batch) >= batch_size:
                c, u, s = self._process_batch(batch, dry_run, verbosity)
                created_count += c
                updated_count += u
                skipped_count += s
                batch = []

        # Process remaining items
        if batch:
            c, u, s = self._process_batch(batch, dry_run, verbosity)
            created_count += c
            updated_count += u
            skipped_count += s

        # Summary — always shown at verbosity >= 1 (default)
        if verbosity >= 1:
            self.stdout.write(
                self.style.SUCCESS(
                    f'Sync complete: {created_count} created, '
                    f'{updated_count} updated, {skipped_count} skipped.'
                )
            )

    def _fetch_from_api(self, source, skus):
        """Simulate fetching inventory data. Replace with real API call."""
        # In production: requests.get(WAREHOUSE_URL, params={'skus': skus})
        return [
            {'sku': 'SKU-001', 'name': 'Widget', 'stock': 100, 'price': '9.99'},
            {'sku': 'SKU-002', 'name': 'Gadget', 'stock': 0,   'price': '49.99'},
        ]

    @transaction.atomic
    def _process_batch(self, batch, dry_run, verbosity):
        """Process a batch of inventory items in a single transaction."""
        from myapp.models import Product  # import inside method to avoid circular import
        created = updated = skipped = 0

        for item in batch:
            if verbosity >= 2:
                # Verbose mode: show each item being processed
                self.stdout.write(f"  Processing SKU {item['sku']} ...")

            if dry_run:
                exists = Product.objects.filter(sku=item['sku']).exists()
                if exists:
                    updated += 1
                else:
                    created += 1
                continue

            # IDEMPOTENT: update_or_create is safe to re-run
            product, was_created = Product.objects.update_or_create(
                sku=item['sku'],
                defaults={
                    'name': item['name'],
                    'stock': item['stock'],
                    'price': item['price'],
                    'synced_at': timezone.now(),
                    'is_available': item['stock'] > 0,
                }
            )

            if was_created:
                created += 1
            else:
                updated += 1

        return created, updated, skipped


# ── CALLING FROM CODE ─────────────────────────────────────────────────────────
# Anywhere in Django code (other commands, Celery tasks, etc.)
from django.core.management import call_command

# Simple call — output goes to stdout
call_command('sync_inventory')

# With arguments and suppressed output
call_command('sync_inventory', 'SKU-001', 'SKU-002', verbosity=0)

# With keyword arguments matching add_arguments names (dashes become underscores)
call_command('sync_inventory', dry_run=True, batch_size=100, verbosity=2)

# Capture output for inspection
from io import StringIO
out = StringIO()
call_command('sync_inventory', stdout=out, verbosity=1)
print(out.getvalue())


# ── CELERY TASK WRAPPER ───────────────────────────────────────────────────────
# myapp/tasks.py
from celery import shared_task
from django.core.management import call_command

@shared_task(name='myapp.tasks.nightly_inventory_sync')
def nightly_inventory_sync():
    """Celery task that runs the management command nightly."""
    call_command('sync_inventory', verbosity=1)


# ── TESTS ─────────────────────────────────────────────────────────────────────
# tests/test_management_commands.py
from io import StringIO
from unittest.mock import patch
from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import TestCase
from myapp.models import Product


class SyncInventoryCommandTests(TestCase):
    def test_creates_new_products(self):
        out = StringIO()
        call_command('sync_inventory', stdout=out, verbosity=1)
        self.assertTrue(Product.objects.filter(sku='SKU-001').exists())
        self.assertIn('created', out.getvalue())

    def test_dry_run_does_not_write(self):
        call_command('sync_inventory', dry_run=True, verbosity=0)
        self.assertEqual(Product.objects.count(), 0)  # nothing written

    def test_idempotent_second_run(self):
        call_command('sync_inventory', verbosity=0)
        call_command('sync_inventory', verbosity=0)
        # Should not create duplicates
        self.assertEqual(Product.objects.filter(sku='SKU-001').count(), 1)

    @patch('myapp.management.commands.sync_inventory.Command._fetch_from_api')
    def test_api_failure_raises_command_error(self, mock_fetch):
        mock_fetch.side_effect = ConnectionError('timeout')
        with self.assertRaises(CommandError):
            call_command('sync_inventory', verbosity=0)

    def test_verbosity_2_shows_per_item_output(self):
        out = StringIO()
        call_command('sync_inventory', stdout=out, verbosity=2)
        self.assertIn('Processing SKU', out.getvalue())
`,

      outputExplanation: `BaseCommand.execute() wraps handle() with setup for color, verbosity, and output stream configuration. When called via call_command(), Django instantiates the Command class, calls create_parser() to build an argparse.ArgumentParser, parses the provided arguments (converting kwargs to argv-style arguments internally), and calls execute(). The stdout= kwarg is injected into the command's self.stdout before handle() runs, which is why capturing output with StringIO works. CommandError is caught by execute() which writes the message to self.stderr and exits with code 1 — this is the correct way to signal failure rather than raising sys.exit(). transaction.atomic() on _process_batch creates a SAVEPOINT for each batch; if one batch fails, only that batch rolls back, not the entire run — enabling partial progress on large syncs.`,

      commonMistakes: [
        "Using print() instead of self.stdout.write() — print() cannot be captured by call_command(stdout=out) in tests and ignores --no-color.",
        "Missing __init__.py files in management/ or management/commands/ directories — Django silently fails to discover the command.",
        "Raising Exception instead of CommandError on known errors — CommandError is caught cleanly by Django; plain exceptions print a full traceback and may crash cron wrappers.",
        "Not wrapping large operations in batched transactions — a single transaction on millions of rows holds locks for minutes, causing deadlocks.",
        "Making commands non-idempotent — cron jobs sometimes run twice (clock drift, manual re-run). Use update_or_create and existence checks.",
        "Hardcoding option names with dashes in call_command() kwargs — Django converts dashes to underscores for kwargs (--dry-run becomes dry_run=True).",
        "Importing models at the module level in the command file — if the command file is imported before Django's app registry is ready, you get an AppRegistryNotReady error. Import inside handle() or _process_batch()."
      ],

      interviewNotes: [
        "Django discovers management commands by scanning each app's management/commands/ directory — both __init__.py files are required.",
        "BaseCommand.handle() receives parsed options as a dict; add_arguments() receives a standard argparse.ArgumentParser.",
        "call_command() accepts both positional args (as strings) and kwargs matching the argument names with dashes replaced by underscores.",
        "CommandError exits with code 1 and a clean message — always use it over raw exceptions for expected error conditions.",
        "self.stdout.write() and self.stderr.write() respect --no-color and can be captured in tests with stdout=StringIO().",
        "Verbosity 0=silent, 1=normal (default), 2=verbose, 3=very verbose — all management commands support this convention.",
        "Idempotency is critical for scheduled commands — use update_or_create, existence checks, and processed_at timestamps.",
        "Wrap large data operations in batched transactions (transaction.atomic() per batch) to avoid long-running locks.",
        "Celery tasks should call call_command() to avoid duplicating management command logic in task functions."
      ],

      whenToUse: "Use management commands for scheduled jobs, data migrations that cannot be done in schema migrations, one-off maintenance scripts, bulk data imports/exports, and any operation that needs full Django ORM access but runs outside the HTTP request cycle.",
      whenNotToUse: "Do not use management commands for real-time operations triggered by user actions (use Celery tasks or async views instead) or for logic that needs to return structured data to a caller (use a service function and call it from the command)."
    },
    tags: ["management-commands", "BaseCommand", "call_command", "idempotency", "celery", "testing", "argparse", "verbosity"],
    order: 7,
    estimatedMinutes: 25
  },

  {
    id: "django-migrations-internals",
    title: "Django Migrations — Internals, Data Migrations & Squashing",
    slug: "django-migrations-internals",
    category: "django",
    subcategory: "migrations",
    difficulty: "advanced",
    description: "How Django migrations work internally — MigrationExecutor, dependency graphs, ModelState detection, data migrations with RunPython, squashing, and multi-DB routing.",
    content: {
      explanation: `Django migrations are Python files that describe database schema changes. They are not just SQL scripts — they are a versioned graph of operations that can be applied forward (migrate) or backward (migrate <app> <prev>).

THE django_migrations TABLE

Django tracks which migrations have been applied by inserting rows into the django_migrations table: (app, name, applied). When you run migrate, Django queries this table to determine which migrations are already applied. This is the single source of truth — if you delete a row from this table, Django thinks the migration has not been applied and will try to run it again.

MIGRATION EXECUTOR INTERNALS

django.db.migrations.executor.MigrationExecutor is the orchestrator. On migrate:
1. It calls MigrationLoader to load all migration files from each app's migrations/ directory.
2. It builds a MigrationGraph — a directed acyclic graph where nodes are (app, migration_name) and edges are dependencies.
3. It queries django_migrations to find applied nodes.
4. It computes the plan: the ordered list of unapplied migrations that need to run to reach the target state.
5. For each migration in the plan, it calls migration.apply(project_state, schema_editor).

PROJECT STATE AND MODELSTATE

Django does not look at your actual database when computing migrations. Instead, it maintains a ProjectState — an in-memory representation of all models built by replaying all applied migrations in order. Each migration operates on a ProjectState by adding, removing, or modifying ModelState objects. ModelState is a lightweight representation of a model: field names, types, options, and managers.

When you run makemigrations, Django builds the current ProjectState from all existing migrations, then builds a second state from your current models.py. It diffs the two states and generates the minimal set of operations to get from one to the other.

MIGRATION OPERATIONS

Operations are the atomic units:
- CreateModel, DeleteModel, RenameModel
- AddField, RemoveField, AlterField, RenameField
- AddIndex, RemoveIndex, AddConstraint, RemoveConstraint
- RunSQL: execute raw SQL
- RunPython: execute a Python function with access to apps (the frozen ProjectState) and schema_editor

SCHEMA EDITOR

SchemaEditor is the abstraction over database-specific DDL. DatabaseSchemaEditor (one per database backend) translates operations into SQL. You never call SchemaEditor directly — the migration framework calls it. This is why the same migration file works on PostgreSQL, MySQL, and SQLite.

DATA MIGRATIONS

A data migration transforms existing data without changing the schema. Use RunPython with a forward function and a reverse function. Inside the forward function, use apps.get_model() to access the frozen model class (not the real model) — this ensures the migration is not coupled to future model changes.

def populate_slugs(apps, schema_editor):
    Article = apps.get_model('myapp', 'Article')
    for article in Article.objects.all():
        article.slug = slugify(article.title)
        article.save()

ATOMIC = FALSE FOR LARGE TABLES

By default, each migration runs inside a database transaction. For large tables, this can be a problem: adding a column or migrating millions of rows inside a transaction holds locks that block production traffic. Set atomic = False on the Migration class to disable the transaction. Then manage transactions manually in your RunPython function.

SQUASHING MIGRATIONS

As migrations accumulate, the startup time for migrate and the complexity of the dependency graph increase. squashmigrations <app> <from> <to> creates a new squashed migration that replaces a range of migrations with a single file. The squashed migration contains replaces = [...] listing the migrations it replaces. Old installations use the original migrations until they catch up past the squash range; new installations use the squashed migration directly.

DEPENDENCY GRAPH AND ORDERING

Each migration declares dependencies = [('app', 'migration_name')] to enforce ordering. Cross-app dependencies (e.g. a FK to auth.User) require an explicit dependency on the auth migration that creates the User table. makemigrations adds these automatically but manual data migrations need them explicitly.

MULTI-DB ROUTING

If you have multiple databases, a database router's allow_migrate(db, app_label, model_name) method controls which migrations run on which database. Return False for a given db/app combination to skip that migration on that database. This is how you partition tables across multiple databases.

FAKE MIGRATIONS

manage.py migrate --fake marks migrations as applied without running the SQL. Used when manually setting up a database that already has the schema. manage.py migrate --fake-initial skips CreateModel migrations when the table already exists.`,

      realExample: `You are adding a full_name field to the User model. You already have first_name and last_name. The migration process: (1) makemigrations generates AddField(model_name='user', name='full_name', field=CharField(...)). (2) A data migration populates full_name = first_name + ' ' + last_name for all existing rows. (3) A subsequent schema migration makes full_name NOT NULL after the data is populated.

The data migration uses apps.get_model('myapp', 'User') inside RunPython — NOT from myapp.models import User. This is critical: the real User model at the time you run this migration in 2 years may have completely different fields. The frozen apps object returns a ModelState snapshot of User as it existed when this migration was written.

For a table with 10 million users, atomic = False is set and the RunPython function processes rows in batches of 10,000, committing after each batch to avoid long-running locks on the users table.`,

      codeExample: `# ── HOW MAKEMIGRATIONS DETECTS CHANGES ─────────────────────────────────────
# Django builds two ProjectState objects:
# 1. "from" state: replay all existing migration files
# 2. "to" state: introspect current models.py
# Then diffs them. The diff produces Operation objects.

# models.py — you add a new field:
from django.db import models

class Article(models.Model):
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, blank=True)  # NEW FIELD
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)


# ── GENERATED SCHEMA MIGRATION ───────────────────────────────────────────────
# myapp/migrations/0002_article_slug.py
from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('myapp', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='article',
            name='slug',
            field=models.SlugField(blank=True, max_length=200),
        ),
    ]


# ── DATA MIGRATION ────────────────────────────────────────────────────────────
# myapp/migrations/0003_populate_slugs.py
from django.db import migrations
from django.utils.text import slugify


def populate_slugs(apps, schema_editor):
    """
    Forward: populate slug from title for all existing articles.
    Uses apps.get_model() — NOT the real model — so this migration
    is safe to run even after the Article model changes in the future.
    """
    # apps is a frozen StateApps snapshot — get_model returns a historical model class
    Article = apps.get_model('myapp', 'Article')
    db_alias = schema_editor.connection.alias  # respect multi-DB routing

    for article in Article.objects.using(db_alias).filter(slug=''):
        article.slug = slugify(article.title) or f'article-{article.pk}'
        article.save()


def reverse_populate_slugs(apps, schema_editor):
    """Reverse: clear all slugs (migration can be unapplied)."""
    Article = apps.get_model('myapp', 'Article')
    Article.objects.using(schema_editor.connection.alias).update(slug='')


class Migration(migrations.Migration):
    dependencies = [
        ('myapp', '0002_article_slug'),
    ]

    operations = [
        migrations.RunPython(
            populate_slugs,
            reverse_code=reverse_populate_slugs,
        ),
    ]


# ── DATA MIGRATION FOR LARGE TABLE (atomic = False) ──────────────────────────
# myapp/migrations/0004_populate_full_names.py
from django.db import migrations, transaction


def populate_full_names_in_batches(apps, schema_editor):
    """Process 10M rows in batches of 10k to avoid long-running locks."""
    User = apps.get_model('auth', 'User')
    db_alias = schema_editor.connection.alias

    batch_size = 10_000
    last_pk = 0

    while True:
        # Fetch next batch
        batch = list(
            User.objects.using(db_alias)
                .filter(pk__gt=last_pk, full_name='')
                .order_by('pk')
                .values('pk', 'first_name', 'last_name')[:batch_size]
        )
        if not batch:
            break

        pks = [row['pk'] for row in batch]
        # Commit after each batch — requires atomic = False on Migration
        with transaction.atomic(using=db_alias):
            for row in batch:
                User.objects.using(db_alias).filter(pk=row['pk']).update(
                    full_name=f"{row['first_name']} {row['last_name']}".strip()
                )

        last_pk = pks[-1]


class Migration(migrations.Migration):
    # Disable the wrapping transaction — we manage commits ourselves per batch.
    # Without this, all 10M updates would be in one giant transaction.
    atomic = False

    dependencies = [
        ('myapp', '0003_add_full_name_field'),
    ]

    operations = [
        migrations.RunPython(
            populate_full_names_in_batches,
            reverse_code=migrations.RunPython.noop,  # irreversible
        ),
    ]


# ── SQUASHING MIGRATIONS ─────────────────────────────────────────────────────
# Command: python manage.py squashmigrations myapp 0001 0005
# Produces: myapp/migrations/0001_0005_squashed.py

# Generated squashed migration (simplified):
class Migration(migrations.Migration):
    # Tells Django this replaces these migrations on databases that already applied them.
    replaces = [
        ('myapp', '0001_initial'),
        ('myapp', '0002_article_slug'),
        ('myapp', '0003_populate_slugs'),
        ('myapp', '0004_add_full_name_field'),
        ('myapp', '0005_populate_full_names'),
    ]

    dependencies = []  # squashed migrations have no internal dependencies

    operations = [
        # All operations from 0001-0005 combined and optimized
        migrations.CreateModel(
            name='Article',
            fields=[
                ('id', ...),
                ('title', ...),
                ('slug', ...),   # included from 0002 — no ADD needed on fresh install
                ('body', ...),
            ]
        ),
        # RunPython from 0003 is KEPT — data still needs to be populated on fresh installs
        migrations.RunPython(populate_slugs, reverse_populate_slugs),
    ]


# ── MULTI-DB ROUTER ──────────────────────────────────────────────────────────
# myproject/routers.py
class AnalyticsRouter:
    """Route analytics app models to the 'analytics' database."""

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        if app_label == 'analytics':
            # Only run analytics app migrations on the 'analytics' DB
            return db == 'analytics'
        # All other apps: only on 'default' DB
        if db == 'analytics':
            return False
        return None  # no opinion — let other routers decide


# settings.py
DATABASES = {
    'default': {'ENGINE': 'django.db.backends.postgresql', 'NAME': 'main'},
    'analytics': {'ENGINE': 'django.db.backends.postgresql', 'NAME': 'analytics'},
}
DATABASE_ROUTERS = ['myproject.routers.AnalyticsRouter']

# Run migrations for specific DB:
# python manage.py migrate --database=analytics


# ── USEFUL MIGRATION COMMANDS ────────────────────────────────────────────────
# Check migration status
# python manage.py showmigrations myapp

# Show SQL a migration would run without applying it
# python manage.py sqlmigrate myapp 0002

# Mark migrations as applied without running SQL (e.g. existing DB)
# python manage.py migrate myapp --fake

# Roll back to a specific migration
# python manage.py migrate myapp 0002
`,

      outputExplanation: `MigrationExecutor applies each migration by calling migration.apply(project_state, schema_editor). The project_state starts as the initial empty state and is mutated forward by each migration's state_forwards() method. state_forwards() updates the in-memory ProjectState (no SQL). Then the actual operations (CreateModel, AddField, RunPython, etc.) are executed against schema_editor which generates and runs DDL SQL. RunPython operations call the Python function with a StateApps object built from the current ProjectState snapshot — this is why apps.get_model() inside RunPython returns a historical model that exactly matches the schema at that point in migration history. After each migration completes, Django inserts a row into django_migrations. If the process is interrupted mid-migration and atomic=True (default), the transaction rolls back and no row is inserted — the migration can be retried safely.`,

      commonMistakes: [
        "Importing real models (from myapp.models import Article) inside RunPython — use apps.get_model() instead. The real model may have changed by the time this migration runs in the future.",
        "Forgetting atomic = False on large-table data migrations — wrapping millions of UPDATE statements in one transaction holds table locks for minutes and causes production outages.",
        "Editing migration files manually after they have been applied in production — the django_migrations table no longer matches the files, causing migrate to fail or apply wrong operations.",
        "Adding a NOT NULL field without a default in a single migration — this fails on tables with existing data. Split into: add nullable field, populate data, then make NOT NULL.",
        "Squashing migrations but not deleting the originals after all environments have migrated past the squash range — Django keeps trying to apply both the originals and the squash.",
        "Using schema_editor.execute() raw SQL in RunPython without respecting db_alias — on a multi-DB setup the SQL runs on the wrong database.",
        "Running makemigrations in production — always run it locally, commit the files, and deploy. Running it on a production server can generate inconsistent migrations."
      ],

      interviewNotes: [
        "Django tracks applied migrations in the django_migrations table — deleting a row causes Django to re-apply that migration.",
        "MigrationExecutor builds a DAG from all migration dependencies and replays operations on a ProjectState to compute the diff.",
        "makemigrations diffs two ProjectState objects — it never looks at the actual database schema.",
        "Inside RunPython, always use apps.get_model() not the real model class — this gives you a frozen historical model safe for future model changes.",
        "atomic = False on a Migration class is required for large-table migrations to avoid long-running transaction locks.",
        "squashmigrations combines a range of migrations into one; replaces = [...] tells Django which migrations it supersedes.",
        "A data migration has both forward and reverse functions — the reverse enables unapplying the migration (migrate app prev_number).",
        "Cross-app FK dependencies must be listed explicitly in dependencies = [] — makemigrations adds them automatically for schema migrations.",
        "schema_editor.connection.alias gives you the database alias inside RunPython — always pass it to .using() for multi-DB correctness."
      ],

      whenToUse: "Use data migrations (RunPython) whenever you need to transform existing data as part of a schema change — never do it in a management command that must be run separately, because migrations guarantee ordered execution with dependency tracking.",
      whenNotToUse: "Do not use migrations for recurring data updates, business logic, or one-off scripts — migrations run once and are not designed for repeated execution. Use management commands or Celery tasks for those."
    },
    tags: ["migrations", "RunPython", "data-migration", "squash", "MigrationExecutor", "atomic", "multi-db", "ModelState"],
    order: 8,
    estimatedMinutes: 25
  },

  {
    id: "django-caching",
    title: "Django Cache Framework — Backends, Levels & Stampede Prevention",
    slug: "django-caching",
    category: "django",
    subcategory: "caching",
    difficulty: "intermediate",
    description: "How Django's cache framework works across backends (Redis, Memcached, DB, local-mem), all cache API levels, versioning, and preventing cache stampede in production.",
    content: {
      explanation: `Django's cache framework is a unified API across multiple storage backends. The same cache.get()/cache.set() code works whether the backend is Redis, Memcached, the database, or an in-process dict.

CACHE BACKENDS

Django ships five backends:

1. django.core.cache.backends.memcached.PyMemcacheCache — Memcached via pymemcache. Distributed, fast, volatile. Ideal for session data and short-lived caches.

2. django.core.cache.backends.redis.RedisCache — Redis (added in Django 4.0). Supports key expiry, persistence, pub/sub. Best general-purpose cache for most production apps.

3. django.core.cache.backends.db.DatabaseCache — stores cache entries in a DB table. Slower than Redis/Memcached but useful when you have no separate cache server. Requires python manage.py createcachetable.

4. django.core.cache.backends.locmem.LocMemCache — in-process Python dict. Each process has its own cache — not shared across Gunicorn workers. Useful for development and single-process testing only.

5. django.core.cache.backends.dummy.DummyCache — no-op. All operations succeed but nothing is stored. Use in testing to disable caching without changing code.

6. django.core.cache.backends.filebased.FileBasedCache — stores serialized objects as files on disk. Slow but persistent across restarts. Rarely used in production.

CACHES SETTING

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
        'KEY_PREFIX': 'myapp',    # prepended to all keys — prevents collisions across apps
        'VERSION': 1,             # incremented to invalidate all keys at once
        'TIMEOUT': 300,           # default TTL in seconds; None = infinite
        'OPTIONS': {
            'pool_class': 'redis.BlockingConnectionPool',
            'max_connections': 50,
        }
    },
    'sessions': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/2',
    }
}

CACHE API LEVELS (LOW TO HIGH)

LEVEL 1 — LOW-LEVEL API (most flexible):
from django.core.cache import cache
cache.set('key', value, timeout=300)
value = cache.get('key', default=None)
cache.delete('key')
cache.get_or_set('key', callable_or_value, timeout=300)
cache.get_many(['k1', 'k2'])   # single round-trip for multiple keys
cache.set_many({'k1': v1, 'k2': v2}, timeout=300)
cache.delete_many(['k1', 'k2'])
cache.clear()                  # delete ALL keys with this cache's prefix
cache.incr('counter')          # atomic increment (Redis/Memcached only)

LEVEL 2 — PER-VIEW CACHE (cache entire view response):
from django.views.decorators.cache import cache_page
from django.views.decorators.vary import vary_on_headers, vary_on_cookie

@cache_page(60 * 15)  # 15 minutes
@vary_on_headers('Accept-Language')
def my_view(request):
    ...

cache_page uses the full URL as the cache key. vary_on_headers adds Vary headers and makes the cache key include the specified headers — critical for serving different cached responses to different languages or authenticated vs anonymous users.

LEVEL 3 — TEMPLATE FRAGMENT CACHE:
{% load cache %}
{% cache 500 sidebar request.user.id %}
    ... expensive template code ...
{% endcache %}

The second argument is the timeout. Third and subsequent arguments are added to the cache key — always include user-specific identifiers to avoid serving one user's sidebar to another.

PER-SITE CACHE (highest level):
Add UpdateCacheMiddleware at the top of MIDDLEWARE and FetchFromCacheMiddleware at the bottom. This caches every GET/HEAD response that has no session/auth data. Only appropriate for fully public sites.

KEY PREFIXES AND VERSIONING

KEY_PREFIX is a string prepended to all keys to prevent collisions between multiple Django apps sharing the same cache server. VERSION is an integer; incrementing it effectively invalidates all cached data without deleting individual keys — a fast global cache bust. You can also pass version= to individual get/set calls for fine-grained versioning.

CACHE STAMPEDE (THUNDERING HERD)

When a popular cached item expires, multiple concurrent requests all find a cache miss simultaneously. Each fires the expensive computation (DB query, API call) at the same time — overloading the backend. Solutions:

1. get_or_set() with a lock: not built-in, but you can implement it with cache.add() (atomic set-if-not-exists) as a distributed lock.
2. Stale-while-revalidate: serve the old value while recomputing in the background.
3. Probabilistic early expiration: start recomputing before the key expires based on a probability that increases as TTL decreases.
4. Cache warming: pre-populate the cache before the key expires via a background job.

CACHE INVALIDATION STRATEGIES

Time-based (TTL): simplest. Stale data served until expiry. Appropriate for non-critical data.
Event-based: call cache.delete() or cache.delete_many() when the underlying data changes — in a post_save signal or after model.save().
Version bumping: increment VERSION in CACHES to invalidate all keys atomically.
Key tagging: a pattern (not built-in) where you store sets of keys per tag and delete by tag — requires Redis sorted sets or a separate index.

NAMED CACHES

Access a non-default cache with: from django.core.cache import caches; c = caches['sessions']. This lets you use different backends for different data types — e.g., Redis for sessions with a longer TTL, LocMemCache for per-request request-scoped computation.`,

      realExample: `You are building a news site. The homepage renders the top 20 articles with author names, tag counts, and comment counts — five SQL queries. Under load, 1000 requests/second would hammer the database. You cache the rendered queryset for 5 minutes with cache.get_or_set('homepage_articles', lambda: list(Article.objects.homepage_feed()), 300).

When an editor publishes a new article, post_save fires and calls cache.delete('homepage_articles') to invalidate immediately. But you also add cache versioning: KEY_PREFIX = 'newssite', VERSION = 1. When you deploy a change to the article structure, you increment VERSION in settings — all cached data is instantly stale without running a cache flush script.

For authenticated users, the sidebar shows their reading history — this must NOT be shared across users. The template fragment {% cache 600 sidebar request.user.id %} creates per-user keys like myapp:1:sidebar:42 and myapp:1:sidebar:43 — completely isolated.

Cache stampede: at midnight the homepage cache expires and 500 concurrent requests all miss. You fix this by using cache.add('homepage_lock', 1, 30) as a distributed lock — add() returns True only for the first caller. The winner recomputes and sets the cache; losers return a fallback or wait briefly.`,

      codeExample: `# ── CACHES SETTING ───────────────────────────────────────────────────────────
# settings.py
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
        'KEY_PREFIX': 'myapp',
        'VERSION': 1,
        'TIMEOUT': 300,
        'OPTIONS': {
            'pool_class': 'redis.BlockingConnectionPool',
            'max_connections': 50,
        }
    },
    # Separate cache for heavyweight computations with longer TTL
    'long_term': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/2',
        'TIMEOUT': 3600,
    },
    # In tests, use DummyCache to disable caching
    'test': {
        'BACKEND': 'django.core.cache.backends.dummy.DummyCache',
    }
}


# ── LOW-LEVEL CACHE API ───────────────────────────────────────────────────────
from django.core.cache import cache, caches

# Basic operations
cache.set('user_profile_42', {'name': 'Alice', 'role': 'admin'}, timeout=600)
profile = cache.get('user_profile_42')            # returns None if missing
profile = cache.get('user_profile_42', default={}) # return default on miss

# Atomic get-or-set: sets the value if key is missing, always returns value.
# Second arg can be a value OR a zero-arg callable (evaluated lazily on miss).
articles = cache.get_or_set(
    'homepage_articles',
    lambda: list(Article.objects.available().with_comment_count()[:20]),
    timeout=300
)

# Batch operations — single round-trip to cache server
cache.set_many({
    'key1': 'value1',
    'key2': 'value2',
    'key3': 'value3',
}, timeout=300)
results = cache.get_many(['key1', 'key2', 'key3'])
# returns {'key1': 'value1', 'key2': 'value2'} — missing keys are omitted

# Delete
cache.delete('homepage_articles')
cache.delete_many(['key1', 'key2', 'key3'])

# Atomic increment/decrement (Redis/Memcached only)
cache.set('page_views', 0, timeout=None)    # timeout=None = never expires
cache.incr('page_views')                    # atomic, returns new value
cache.decr('page_views')

# Versioned get/set — override the global VERSION for a specific key
cache.set('config', {'theme': 'dark'}, version=2)
cache.get('config', version=2)  # only matches version=2 keys

# Access a non-default cache by name
long_cache = caches['long_term']
long_cache.set('annual_report', report_data, timeout=86400)


# ── CACHE INVALIDATION IN SIGNALS ────────────────────────────────────────────
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from myapp.models import Article

@receiver(post_save, sender=Article)
@receiver(post_delete, sender=Article)
def invalidate_article_caches(sender, instance, **kwargs):
    # Invalidate the homepage feed whenever any article changes.
    cache.delete('homepage_articles')
    # Also invalidate the specific article cache.
    cache.delete(f'article_{instance.pk}')
    # Invalidate tag-based caches
    for tag in instance.tags.all():
        cache.delete(f'tag_articles_{tag.pk}')


# ── PER-VIEW CACHE ────────────────────────────────────────────────────────────
from django.views.decorators.cache import cache_page
from django.views.decorators.vary import vary_on_headers, vary_on_cookie

# Cache for 15 minutes. Different responses for different Accept-Language headers.
@cache_page(60 * 15)
@vary_on_headers('Accept-Language')
def public_homepage(request):
    articles = Article.objects.available()[:20]
    return render(request, 'home.html', {'articles': articles})

# Never cache authenticated views with cache_page — it will leak user data.
# Use the low-level API inside the view for partial caching instead.


# ── CACHE STAMPEDE PREVENTION ─────────────────────────────────────────────────
import time

def get_homepage_articles():
    """
    Stampede-safe cache fetch using cache.add() as a distributed lock.
    cache.add() is atomic set-if-not-exists — returns True only for the first caller.
    """
    CACHE_KEY = 'homepage_articles'
    LOCK_KEY = 'homepage_articles_lock'
    LOCK_TTL = 10    # seconds
    CACHE_TTL = 300  # seconds

    # Try to get from cache first
    result = cache.get(CACHE_KEY)
    if result is not None:
        return result

    # Try to acquire the lock (atomic — only one process wins)
    acquired = cache.add(LOCK_KEY, 1, LOCK_TTL)
    if acquired:
        # We won the lock — compute the expensive result
        try:
            result = list(Article.objects.available().with_comment_count()[:20])
            cache.set(CACHE_KEY, result, CACHE_TTL)
        finally:
            cache.delete(LOCK_KEY)  # always release the lock
        return result
    else:
        # Another process is computing. Wait briefly and retry.
        time.sleep(0.1)
        return cache.get(CACHE_KEY) or []  # fallback to empty list if still not ready


# ── TEMPLATE FRAGMENT CACHE ───────────────────────────────────────────────────
# templates/homepage.html
TEMPLATE_FRAGMENT_EXAMPLE = """
{% load cache %}

{# Public fragment — same for all users #}
{% cache 300 featured_articles %}
    {% for article in featured_articles %}
        <h2>{{ article.title }}</h2>
    {% endfor %}
{% endcache %}

{# Per-user fragment — MUST include user id in cache key #}
{% cache 600 user_sidebar request.user.id %}
    <p>Welcome, {{ request.user.first_name }}</p>
    <ul>{% for item in reading_history %}<li>{{ item }}</li>{% endfor %}</ul>
{% endcache %}

{# Invalidate template fragments from Python: #}
{# from django.core.cache import cache #}
{# from django.utils.cache import make_template_fragment_key #}
{# key = make_template_fragment_key('user_sidebar', [user.id]) #}
{# cache.delete(key) #}
"""


# ── TESTING WITH CACHE ────────────────────────────────────────────────────────
from django.test import TestCase, override_settings

# Override to use LocMemCache in tests (isolated per test, no Redis needed)
@override_settings(CACHES={
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
    }
})
class CacheTests(TestCase):
    def setUp(self):
        cache.clear()  # ensure clean state for each test

    def test_homepage_cache_set_on_first_request(self):
        self.client.get('/')
        self.assertIsNotNone(cache.get('homepage_articles'))

    def test_cache_invalidated_on_article_save(self):
        cache.set('homepage_articles', ['stale'], timeout=300)
        Article.objects.create(title='New', status='published', ...)
        # post_save signal should have deleted the cache key
        self.assertIsNone(cache.get('homepage_articles'))
`,

      outputExplanation: `cache.get() and cache.set() go through BaseCache which prepends KEY_PREFIX:VERSION: to every key before writing to the backend. Redis stores these as plain string keys with TTL set via EXPIRE. When VERSION is incremented, the prefix changes from myapp:1:key to myapp:2:key — old keys still exist in Redis but are never accessed again (they expire naturally). cache.add() maps to Redis SETNX (set if not exists), which is atomic — this is what makes it viable as a distributed lock. get_or_set() is NOT atomic: it calls get(), and if None, calls set() — a race condition exists between the get and set. For stampede prevention, cache.add() is the correct atomic primitive. Template fragment caching uses make_template_fragment_key() which hashes the vary arguments to build a stable key like cache_fragment.user_sidebar.42.`,

      commonMistakes: [
        "Using cache_page on authenticated views — Django's cache_page does not automatically vary on the authenticated user, so one user's response gets served to another user.",
        "Not including user-specific identifiers in template fragment cache keys — {% cache 600 sidebar %} serves the same sidebar to all users.",
        "Assuming get_or_set() is atomic and stampede-safe — it is not; use cache.add() as a lock for stampede-sensitive keys.",
        "Setting timeout=0 thinking it means 'infinite TTL' — timeout=0 means 'expire immediately' in Django. Use timeout=None for infinite TTL.",
        "Calling cache.clear() in production code — it deletes ALL keys in the cache including sessions, CSRF tokens, and other app data sharing the same Redis database.",
        "Using LocMemCache in multi-process production deployments — each Gunicorn worker has an independent in-process cache; one worker's set() is invisible to other workers.",
        "Caching mutable objects (lists, dicts) and then mutating the returned object — you may mutate the cached object directly in LocMemCache (same reference); with Redis the object is serialized on set and deserialized on get, so mutation does not affect the cache, causing inconsistency."
      ],

      interviewNotes: [
        "Django's cache API is backend-agnostic — the same code works with Redis, Memcached, DB, or the dummy no-op backend.",
        "KEY_PREFIX prevents key collisions between multiple apps on the same cache server; VERSION enables global cache invalidation without deleting keys.",
        "timeout=None means infinite TTL; timeout=0 means expire immediately — a common gotcha.",
        "cache.add() is atomic set-if-not-exists (Redis SETNX) — the correct primitive for implementing distributed locks.",
        "get_or_set() is NOT atomic — a race condition between get and set means multiple processes can compute the value simultaneously on a cold cache.",
        "Template fragment caching: always include user-specific vary arguments in the cache tag to avoid leaking one user's content to another.",
        "Cache stampede (thundering herd): multiple concurrent requests all miss simultaneously on expiry. Prevent with locking via cache.add() or early cache warming.",
        "LocMemCache is per-process — not suitable for multi-worker production environments like Gunicorn with multiple workers.",
        "For complete cache invalidation, increment VERSION in CACHES settings — all old keys become unreachable without needing to explicitly delete them.",
        "make_template_fragment_key() generates the key used by {% cache %} — import it to delete fragment caches from Python code."
      ],

      whenToUse: "Use caching for expensive computations that are read far more often than they change — database aggregations, rendered template fragments, third-party API responses, and computed model properties that do not need to be perfectly fresh.",
      whenNotToUse: "Do not cache user-specific sensitive data without proper key isolation, do not cache data that must be real-time accurate (financial balances, inventory counts), and do not use cache as a primary data store — it is volatile and may be evicted."
    },
    tags: ["caching", "Redis", "cache-stampede", "cache_page", "get_or_set", "template-cache", "versioning", "thundering-herd"],
    order: 9,
    estimatedMinutes: 25
  },

  {
    id: "django-auth-permissions",
    title: "Django Authentication & Permissions — Deep Internals",
    slug: "django-auth-permissions",
    category: "django",
    subcategory: "auth",
    difficulty: "advanced",
    description: "How Django's auth system works internally — custom user models, authenticate()/login() flow, session-based auth, the permissions system, auth backends, and object-level permissions.",
    content: {
      explanation: `Django's authentication and authorization system is built on three pillars: a flexible User model, a pluggable authentication backend system, and a permission model with model-level and object-level checks.

AUTH_USER_MODEL — SET IT EARLY

AUTH_USER_MODEL = 'myapp.CustomUser' tells Django which model to use as the user model. This must be set BEFORE the first migration is created. If you change it after creating migrations, all FK references to auth.User in existing migrations must be updated — a painful database migration. Django's get_user_model() and settings.AUTH_USER_MODEL work before the app registry is fully loaded, making them safe to use in migrations and at import time.

ABSTRACTUSER VS ABSTRACTBASEUSER

AbstractUser (the easier path): extends the built-in User with all existing fields (username, email, first_name, password, groups, permissions) intact. You add fields on top. Use this when you want the full auth feature set and just need extra profile fields.

AbstractBaseUser (the hard path): provides only password hashing and the is_active field. You define all fields from scratch including USERNAME_FIELD and REQUIRED_FIELDS. You must also implement a custom UserManager. Use this for radical changes — e.g., email-only login with no username field.

PASSWORD HASHING INTERNALS

Django never stores plain-text passwords. make_password() applies a hasher (PBKDF2SHA256 by default) to produce a hash string like: pbkdf2_sha256$390000$salt$hash. check_password() re-hashes the provided password with the same algorithm and salt and compares the results. PASSWORD_HASHERS in settings controls which hashers are used and their ordering — the first is used for new passwords, all are tried for verification to allow upgrades.

HOW authenticate() WORKS INTERNALLY

django.contrib.auth.authenticate(request, **credentials) iterates AUTHENTICATION_BACKENDS in order. For each backend, it calls backend.authenticate(request, **credentials). The first backend to return a non-None User object wins. If all backends return None, authenticate() returns None. The default backend (ModelBackend) looks up the user by USERNAME_FIELD and calls user.check_password().

HOW login() WORKS INTERNALLY

django.contrib.auth.login(request, user, backend=None):
1. Calls request.session.cycle_key() to rotate the session key (prevents session fixation attacks).
2. Stores _auth_user_id (user PK), _auth_user_backend (dotted path of the backend), and _auth_user_hash (HMAC of the password hash) in request.session.
3. Saves the session.

On subsequent requests, AuthenticationMiddleware reads _auth_user_id from the session, loads the User from the database, and attaches it to request.user. It also checks _auth_user_hash against the current password hash — if the user changes their password, all existing sessions are invalidated automatically.

SESSION-BASED AUTH FLOW

1. User submits credentials.
2. authenticate() verifies credentials, returns User or None.
3. login() stores the user identity in the session (a cookie with the session key is set on the response).
4. On every subsequent request: SessionMiddleware loads the session, AuthenticationMiddleware loads request.user from the session.
5. request.user is a User instance if authenticated, or AnonymousUser if not.

THE PERMISSIONS SYSTEM

Django's permissions are stored in the auth_permission table. Each permission has: codename, content_type (FK to ContentType), name. The codename convention is: action_modelname — e.g. add_article, change_article, delete_article, view_article. These are created automatically by makemigrations for each model.

Permissions are assigned to users directly (user.user_permissions) or via groups (user.groups). Groups are collections of permissions — assigning a user to a group gives them all the group's permissions.

HOW has_perm() WORKS

user.has_perm('myapp.change_article') goes through this lookup chain:
1. If user.is_active is False: return False immediately.
2. If user.is_superuser: return True immediately (bypass everything).
3. For each backend in AUTHENTICATION_BACKENDS: call backend.has_perm(user_obj, perm, obj). The first True result wins.
4. ModelBackend.has_perm() checks user.user_permissions and user.groups.permissions in the database. Results are cached on the user object in _perm_cache and _user_perm_cache to avoid repeated DB hits within the same request.

OBJECT-LEVEL PERMISSIONS

Django's built-in ModelBackend does NOT implement object-level permissions — has_perm(user, perm, obj) always returns False when obj is not None. To add object-level permissions, implement a custom backend:

class ArticleBackend:
    def has_perm(self, user_obj, perm, obj=None):
        if perm == 'myapp.change_article' and isinstance(obj, Article):
            return obj.author == user_obj
        return False

The backend is added to AUTHENTICATION_BACKENDS. Both backends run; if either returns True, the permission is granted (OR logic).

@login_required VS LoginRequiredMixin

@login_required on a function-based view: redirects unauthenticated users to settings.LOGIN_URL. LoginRequiredMixin on a CBV: same behavior, mixed in as the leftmost base class. Both check request.user.is_authenticated.

permission_required('myapp.change_article') and PermissionRequiredMixin perform the same check plus the permission lookup via has_perm().

CUSTOM AUTH BACKEND

A backend must implement authenticate(request, **credentials) and optionally has_perm(), has_module_perms(), get_all_permissions(). It can authenticate via any mechanism — LDAP, API key, OAuth token — and return a User model instance. The backend can also create a User on first login (just-in-time provisioning).`,

      realExample: `You are building a multi-tenant SaaS platform where users log in with email (not username). You need row-level permissions: users can only edit their own projects.

You create a CustomUser model extending AbstractBaseUser with email as USERNAME_FIELD. You create an EmailBackend that authenticates via email + password. You create an ObjectPermissionBackend that implements has_perm() checking project.owner == user for change_project and delete_project. Both backends are added to AUTHENTICATION_BACKENDS.

When a user submits the login form, authenticate(request, email=email, password=password) tries EmailBackend first — it finds the user by email and checks the password. login() stores the user in the session. On the ProjectUpdateView, PermissionRequiredMixin calls has_perm('myapp.change_project', obj=project) which hits ObjectPermissionBackend — it returns True only if project.owner == request.user. A staff user with is_superuser=True bypasses all backends and always gets True.`,

      codeExample: `# ── CUSTOM USER MODEL (AbstractUser — simpler) ───────────────────────────────
# myapp/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models


class CustomUser(AbstractUser):
    """
    Extends AbstractUser — keeps all built-in fields (username, email, etc.)
    and adds custom fields on top.
    """
    bio = models.TextField(blank=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    email_verified = models.BooleanField(default=False)

    # To use email as primary login field, update USERNAME_FIELD.
    # But keep username for compatibility with third-party packages.

    def __str__(self):
        return self.email


# settings.py — MUST be set before first migration
# AUTH_USER_MODEL = 'myapp.CustomUser'
# After changing this, all FKs to user model use settings.AUTH_USER_MODEL.


# ── CUSTOM USER MODEL (AbstractBaseUser — full control) ──────────────────────
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin


class EmailUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)  # hashes the password
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)


class EmailUser(AbstractBaseUser, PermissionsMixin):
    """
    User model using email as the login identifier instead of username.
    AbstractBaseUser provides: password, last_login, is_active.
    PermissionsMixin adds: is_superuser, groups, user_permissions.
    """
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=50, blank=True)
    last_name = models.CharField(max_length=50, blank=True)
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = 'email'         # used by authenticate() and admin login
    REQUIRED_FIELDS = ['first_name'] # prompted by createsuperuser, not USERNAME_FIELD

    objects = EmailUserManager()

    class Meta:
        verbose_name = 'user'
        verbose_name_plural = 'users'

    def get_full_name(self):
        return f'{self.first_name} {self.last_name}'.strip()


# ── CUSTOM AUTHENTICATION BACKEND ────────────────────────────────────────────
# myapp/backends.py

class EmailBackend:
    """
    Authenticate with email + password instead of username + password.
    """
    def authenticate(self, request, email=None, password=None, **kwargs):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Run the default password hasher to mitigate timing attacks
            # that reveal whether an email exists based on response time.
            User().set_password(password)
            return None

        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None

    def user_can_authenticate(self, user):
        """Only allow active users."""
        return getattr(user, 'is_active', True)

    def get_user(self, user_id):
        """
        Required by Django's session auth. Called on every request to reload
        the user from the session's stored user_id.
        """
        from django.contrib.auth import get_user_model
        User = get_user_model()
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None


# ── OBJECT-LEVEL PERMISSION BACKEND ──────────────────────────────────────────
class ProjectOwnerBackend:
    """
    Object-level permissions: users can only change/delete their own projects.
    """
    def authenticate(self, request, **kwargs):
        # This backend does not authenticate users — only handles permissions.
        return None

    def has_perm(self, user_obj, perm, obj=None):
        from myapp.models import Project

        if not user_obj.is_active:
            return False

        if obj is None:
            # Model-level check — defer to ModelBackend
            return False

        if isinstance(obj, Project):
            if perm in ('myapp.change_project', 'myapp.delete_project'):
                return obj.owner == user_obj
            if perm == 'myapp.view_project':
                return obj.owner == user_obj or obj.is_public

        return False


# settings.py
# AUTHENTICATION_BACKENDS = [
#     'myapp.backends.EmailBackend',          # tried first for authenticate()
#     'myapp.backends.ProjectOwnerBackend',   # tried for has_perm() with obj
#     'django.contrib.auth.backends.ModelBackend',  # fallback for model-level perms
# ]


# ── LOGIN / LOGOUT FLOW ───────────────────────────────────────────────────────
# views.py
from django.contrib.auth import authenticate, login, logout
from django.shortcuts import render, redirect
from django.views.decorators.http import require_POST


def login_view(request):
    if request.method == 'POST':
        email = request.POST['email']
        password = request.POST['password']

        # authenticate() iterates AUTHENTICATION_BACKENDS — returns User or None
        user = authenticate(request, email=email, password=password)

        if user is not None:
            # login() rotates session key (session fixation prevention),
            # stores user identity in session, saves session to DB/cache.
            login(request, user)
            next_url = request.GET.get('next', '/')
            return redirect(next_url)
        else:
            return render(request, 'login.html', {'error': 'Invalid credentials'})

    return render(request, 'login.html')


@require_POST
def logout_view(request):
    logout(request)  # clears session data, issues new session key
    return redirect('/login/')


# ── PERMISSIONS DECORATORS AND MIXINS ─────────────────────────────────────────
from django.contrib.auth.decorators import login_required, permission_required
from django.contrib.auth.mixins import LoginRequiredMixin, PermissionRequiredMixin
from django.views.generic import UpdateView
from myapp.models import Project


# Function-based views
@login_required  # redirects to settings.LOGIN_URL if not authenticated
def dashboard(request):
    return render(request, 'dashboard.html')


@permission_required('myapp.change_project', raise_exception=True)
def edit_project_list(request):
    # raise_exception=True → 403 Forbidden (not redirect) for authenticated users
    projects = Project.objects.filter(owner=request.user)
    return render(request, 'projects/list.html', {'projects': projects})


# Class-based views — mixin must be FIRST (leftmost) base class
class ProjectEditView(LoginRequiredMixin, PermissionRequiredMixin, UpdateView):
    model = Project
    fields = ['name', 'description']
    permission_required = 'myapp.change_project'
    # object-level: override has_permission() for per-object check
    raise_exception = True  # 403 instead of redirect for authenticated users

    def has_permission(self):
        obj = self.get_object()
        # Calls all backends including ProjectOwnerBackend
        return self.request.user.has_perm('myapp.change_project', obj)


# ── MANUAL PERMISSION CHECKS ──────────────────────────────────────────────────
def some_view(request):
    user = request.user

    # Model-level permission (no obj)
    if user.has_perm('myapp.add_project'):
        pass  # user can create new projects

    # Object-level permission (with obj) — hits object-level backends
    project = Project.objects.get(pk=1)
    if user.has_perm('myapp.change_project', project):
        pass  # user can edit THIS specific project

    # Check multiple permissions
    if user.has_perms(['myapp.add_project', 'myapp.change_project']):
        pass  # user has BOTH permissions

    # Module-level permission check (any permission in the app)
    if user.has_module_perms('myapp'):
        pass  # user has at least one permission in myapp


# ── CREATING CUSTOM PERMISSIONS ──────────────────────────────────────────────
class Project(models.Model):
    name = models.CharField(max_length=200)
    owner = models.ForeignKey('myapp.CustomUser', on_delete=models.CASCADE)
    is_public = models.BooleanField(default=False)

    class Meta:
        # Custom permissions in addition to auto-generated add/change/delete/view
        permissions = [
            ('publish_project', 'Can publish project to public'),
            ('archive_project', 'Can archive project'),
        ]
        # These generate permissions: myapp.publish_project, myapp.archive_project
        # after running makemigrations + migrate.


# ── GROUPS FOR ROLE-BASED ACCESS CONTROL ─────────────────────────────────────
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType

def setup_roles():
    """Run once to set up roles (in a data migration or management command)."""
    # Create 'Editor' group with article permissions
    editor_group, _ = Group.objects.get_or_create(name='Editor')
    content_type = ContentType.objects.get_for_model(Article)
    permissions = Permission.objects.filter(
        content_type=content_type,
        codename__in=['add_article', 'change_article', 'view_article']
    )
    editor_group.permissions.set(permissions)

    # Assign user to group
    user = CustomUser.objects.get(email='editor@example.com')
    user.groups.add(editor_group)
    # user now has add_article, change_article, view_article via the group
`,

      outputExplanation: `authenticate() returns a User instance with a backend attribute set to the dotted path of the winning backend (e.g. 'myapp.backends.EmailBackend'). login() stores this backend path in the session so that subsequent requests can use the same backend for get_user() — each backend must implement get_user(user_id) to reload the user from the database. The session stores _auth_user_hash, an HMAC over the user's password hash. When the user changes their password, the hash changes, the stored HMAC no longer matches, and AuthenticationMiddleware returns AnonymousUser — all active sessions are automatically invalidated. has_perm() results for model-level permissions are cached in user._perm_cache after the first call; this cache persists for the lifetime of the request but is cleared if the user object is re-fetched from the database. Object-level permissions (has_perm with obj) are NOT cached by ModelBackend — each call hits the backend. Custom backends should implement their own caching if object-level checks are expensive.`,

      commonMistakes: [
        "Not setting AUTH_USER_MODEL before the first migration — changing it later requires rewriting all FK references in existing migrations and is extremely painful.",
        "Extending AbstractBaseUser without implementing get_user() in a custom backend — Django cannot reload the user from the session, causing every request to appear unauthenticated.",
        "Assuming ModelBackend returns True for object-level has_perm(user, perm, obj) — it always returns False when obj is not None. You must add a custom backend for row-level permissions.",
        "Caching request.user's permissions across requests — Django caches permissions on the user object in _perm_cache; if you change permissions mid-session, the old cached permissions remain until the user object is re-fetched.",
        "Using @permission_required without raise_exception=True on authenticated users — it redirects to the login page, confusing users who are already logged in but lack the permission. Use raise_exception=True for 403.",
        "Putting LoginRequiredMixin after the view's base class in the inheritance order — Python's MRO means the mixin must be the LEFTMOST base class to override dispatch() correctly.",
        "Storing sensitive data in the session without marking it for deletion on logout — logout() clears Django's session keys but does not clear data you stored under custom keys unless you call request.session.flush()."
      ],

      interviewNotes: [
        "AUTH_USER_MODEL must be set before the first migration — changing it later breaks all FK references in the migration history.",
        "AbstractUser adds fields on top of the built-in user; AbstractBaseUser lets you define everything from scratch including USERNAME_FIELD.",
        "authenticate() iterates AUTHENTICATION_BACKENDS in order, returning the first non-None User; login() stores user identity and a password HMAC in the session.",
        "Password changes automatically invalidate all active sessions because AuthenticationMiddleware checks the stored HMAC against the current password hash.",
        "ModelBackend.has_perm() returns False for object-level checks (obj is not None) — object-level permissions require a custom backend.",
        "Permission codename convention: action_modelname (e.g. change_article) under app_label (myapp.change_article).",
        "has_perm() results for model-level permissions are cached on the user object for the duration of the request — group/permission changes require re-fetching the user.",
        "Multiple backends use OR logic — if any backend returns True for has_perm(), the permission is granted.",
        "get_user_model() is safe at any import time; from django.contrib.auth.models import User is not safe in migrations or app startup code.",
        "LoginRequiredMixin and PermissionRequiredMixin must be the leftmost base class in CBV inheritance to correctly override dispatch()."
      ],

      whenToUse: "Use Django's auth system for any application requiring user identity, session management, and access control — it is battle-tested, integrates with the entire Django ecosystem, and the custom backend system handles virtually any authentication scheme.",
      whenNotToUse: "Do not use Django's session-based auth for stateless APIs consumed by mobile or SPA clients — use token-based auth (Django REST Framework with JWT or django-allauth tokens) instead, as sessions require cookie support and are not RESTful."
    },
    tags: ["auth", "AbstractUser", "AbstractBaseUser", "permissions", "has_perm", "login", "authenticate", "custom-backend", "object-level-permissions"],
    order: 10,
    estimatedMinutes: 25
  },
];

export const djangoInternalsSubcategories = [
  { key: 'internals', label: 'Project Internals', icon: 'Layers' },
  { key: 'middleware', label: 'Middleware', icon: 'Layers' },
  { key: 'files', label: 'File Handling', icon: 'FileText' },
  { key: 'signals', label: 'Signals', icon: 'Zap' },
  { key: 'managers', label: 'Managers & QuerySets', icon: 'Database' },
  { key: 'admin', label: 'Admin Customization', icon: 'Settings' },
  { key: 'commands', label: 'Management Commands', icon: 'Terminal' },
  { key: 'migrations', label: 'Migrations Internals', icon: 'GitBranch' },
  { key: 'caching', label: 'Cache Framework', icon: 'Zap' },
  { key: 'auth', label: 'Auth & Permissions', icon: 'Shield' },
];

export default djangoInternalsTopics;

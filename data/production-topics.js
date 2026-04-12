export const productionTopics = [
  // ─── AUTHENTICATION (1–7) ───────────────────────────────────────────────
  {
    id: "session-authentication",
    title: "Session Authentication",
    slug: "session-authentication",
    category: "production",
    subcategory: "authentication",
    difficulty: "beginner",
    description: "Django's built-in session authentication: login/logout views, decorators, session settings, and storing custom data in the session.",
    content: {
      explanation: "Django ships with a complete session-based authentication system. When a user logs in, Django creates a session record (by default in the database) and sends the browser a signed cookie containing only the session key. On every subsequent request, Django reads that cookie, looks up the session, and attaches the user to request.user.\n\nThe session engine is configurable: django.contrib.sessions.backends.db (default), cache, cached_db (reads from cache, writes to DB — best for production), or file. Key settings are SESSION_COOKIE_AGE (seconds, default 1209600), SESSION_COOKIE_SECURE (must be True on HTTPS), SESSION_COOKIE_HTTPONLY (prevents JS access, default True), and SESSION_COOKIE_SAMESITE.\n\nYou can store arbitrary JSON-serializable data in request.session like a dictionary. This is useful for multi-step wizards, shopping carts, or 2FA state. The @login_required decorator and LoginRequiredMixin handle redirecting unauthenticated users.",
      realExample: "An e-commerce storefront uses session auth. After login the user's cart (request.session['cart']) persists across page loads. SESSION_COOKIE_SECURE=True ensures the cookie is never sent over plain HTTP, and SESSION_COOKIE_AGE=3600 forces re-login after one idle hour.",
      codeExample: `# settings.py
SESSION_ENGINE = 'django.contrib.sessions.backends.cached_db'
SESSION_COOKIE_AGE = 3600           # 1 hour in seconds
SESSION_COOKIE_SECURE = True        # HTTPS only — must be True in production
SESSION_COOKIE_HTTPONLY = True      # JS cannot access cookie
SESSION_COOKIE_SAMESITE = 'Lax'
SESSION_EXPIRE_AT_BROWSER_CLOSE = False
LOGIN_URL = '/accounts/login/'
LOGIN_REDIRECT_URL = '/dashboard/'
LOGOUT_REDIRECT_URL = '/'

INSTALLED_APPS = [
    'django.contrib.sessions',
    'django.contrib.auth',
    # ...
]
MIDDLEWARE = [
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    # ...
]

# accounts/views.py
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import render, redirect
from django.views import View
from django.conf import settings


def login_view(request):
    if request.method == 'POST':
        username = request.POST['username']
        password = request.POST['password']
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            # Store custom data in session
            request.session['last_login_ip'] = request.META.get('REMOTE_ADDR')
            request.session['preferred_theme'] = 'dark'
            next_url = request.GET.get('next', settings.LOGIN_REDIRECT_URL)
            return redirect(next_url)
        return render(request, 'accounts/login.html', {'error': 'Invalid credentials'})
    return render(request, 'accounts/login.html')


def logout_view(request):
    logout(request)   # flushes entire session and rotates session key
    return redirect(settings.LOGOUT_REDIRECT_URL)


# Function-based view protection
@login_required(login_url='/accounts/login/')
def dashboard(request):
    theme = request.session.get('preferred_theme', 'light')
    return render(request, 'dashboard.html', {'theme': theme})


# Class-based view protection
class ProfileView(LoginRequiredMixin, View):
    login_url = '/accounts/login/'
    redirect_field_name = 'next'

    def get(self, request):
        return render(request, 'profile.html', {'user': request.user})


# Accessing session data
def some_view(request):
    # Read
    ip = request.session.get('last_login_ip', 'unknown')
    # Write
    request.session['cart_items'] = [1, 2, 3]
    # Delete one key
    request.session.pop('preferred_theme', None)
    # Flush entire session (manual logout)
    request.session.flush()
    # Mark session as modified (needed if mutating a nested object)
    request.session['cart'] = {'item1': 2}
    request.session.modified = True

# urls.py
from django.urls import path
urlpatterns = [
    path('accounts/login/',  login_view,            name='login'),
    path('accounts/logout/', logout_view,            name='logout'),
    path('dashboard/',       dashboard,              name='dashboard'),
    path('profile/',         ProfileView.as_view(),  name='profile'),
]`,
      outputExplanation: "login() calls request.session.cycle_key() internally to rotate the session ID and prevent session fixation attacks. logout() calls request.session.flush() which deletes the session from the store and regenerates a blank session. @login_required redirects to LOGIN_URL with ?next= so after login the user is returned to their original page. LoginRequiredMixin does the same for class-based views.",
      commonMistakes: [
        "Setting SESSION_COOKIE_SECURE=True on a non-HTTPS local dev server — the cookie is never sent and login silently breaks.",
        "Storing non-serializable objects (model instances, querysets) in request.session — sessions use JSON serialization by default. Store PKs or primitive types.",
        "Calling authenticate() but not checking for None — passing None to login() raises AttributeError.",
        "Not running clearsessions as a cron job — expired sessions accumulate in the DB. Run: python manage.py clearsessions weekly."
      ],
      interviewNotes: [
        "Django creates a session for every visitor, not just authenticated ones — the session middleware runs regardless.",
        "login() calls session.cycle_key() to prevent session fixation without invalidating session data.",
        "SESSION_COOKIE_HTTPONLY=True (default) is a key XSS mitigation — JS cannot steal the session cookie.",
        "cached_db backend reads from cache (fast path) and writes to DB (durability) — best for production with Redis.",
        "request.user is populated by AuthenticationMiddleware reading session[SESSION_KEY] — it runs before your view."
      ],
      whenToUse: "Traditional server-rendered Django apps, admin interfaces, and any app where the browser is the primary client and cookie storage is natural.",
      whenNotToUse: "Stateless APIs consumed by mobile apps or SPAs where cookies are inconvenient. Use token or JWT authentication for those clients."
    },
    tags: ["authentication", "session", "login", "security", "middleware"],
    order: 1,
    estimatedMinutes: 15
  },

  {
    id: "token-authentication-drf",
    title: "Token Authentication (DRF)",
    slug: "token-authentication-drf",
    category: "production",
    subcategory: "authentication",
    difficulty: "beginner",
    description: "DRF's built-in TokenAuthentication: setup, token generation, Authorization header usage, and per-view authentication overrides.",
    content: {
      explanation: "Django REST Framework ships with a simple token authentication scheme. Each user gets one opaque token stored in the authtoken_token table. The client sends it in every request header: Authorization: Token <key>. The server looks up the token and sets request.user.\n\nTokens are created explicitly with Token.objects.create(user=user) or automatically via a post_save signal on User creation. The obtain_auth_token view accepts username and password in a POST body and returns the token JSON.\n\nAuthentication and permissions are separate concerns: authentication_classes identifies who the user is, while permission_classes decides what they are allowed to do. Both can be set globally in DEFAULT_AUTHENTICATION_CLASSES / DEFAULT_PERMISSION_CLASSES or overridden per view.",
      realExample: "A mobile app authenticates once on first launch with username and password, receives a token, and stores it in the device keychain. Every subsequent API call includes the Authorization header. On logout, the app calls a delete-token endpoint and discards the local copy.",
      codeExample: `# settings.py
INSTALLED_APPS = [
    'rest_framework',
    'rest_framework.authtoken',  # adds authtoken_token table
    # ...
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}

# After adding authtoken, run: python manage.py migrate

# urls.py
from django.urls import path
from rest_framework.authtoken.views import obtain_auth_token
from myapp.views import ProfileView, LogoutView

urlpatterns = [
    path('api/auth/token/',  obtain_auth_token,        name='api_token_auth'),
    path('api/profile/',     ProfileView.as_view(),    name='api_profile'),
    path('api/auth/logout/', LogoutView.as_view(),     name='api_logout'),
]

# myapp/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.authentication import TokenAuthentication, SessionAuthentication
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authtoken.models import Token
from rest_framework import status


class ProfileView(APIView):
    # Explicit per-view override (redundant if set globally, but clear)
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            'id':       request.user.id,
            'username': request.user.username,
            'email':    request.user.email,
        })


class LogoutView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Delete the token — all future requests with this token return 401
        request.user.auth_token.delete()
        return Response({'detail': 'Successfully logged out.'}, status=status.HTTP_200_OK)


class PublicView(APIView):
    # Override global defaults — no auth required
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({'message': 'Public endpoint'})


# Auto-create token on user registration
from django.db.models.signals import post_save
from django.contrib.auth.models import User
from django.dispatch import receiver

@receiver(post_save, sender=User)
def create_auth_token(sender, instance=None, created=False, **kwargs):
    if created:
        Token.objects.create(user=instance)


# Management command for generating tokens for existing users:
# python manage.py drf_create_token <username>

# HTTP request example:
# POST /api/auth/token/
# Content-Type: application/json
# {"username": "alice", "password": "secret"}
#
# Response:
# {"token": "9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b"}
#
# Authenticated request:
# GET /api/profile/
# Authorization: Token 9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b`,
      outputExplanation: "obtain_auth_token validates credentials using Django's authenticate() and returns {token: <key>}. TokenAuthentication splits the Authorization header, looks up the token row in the DB (one query per request), and sets request.user. 401 is returned when the token is missing or invalid. 403 is returned when authenticated but not permitted. Deleting the Token object immediately invalidates all requests using that token.",
      commonMistakes: [
        "Forgetting to run migrate after adding rest_framework.authtoken — the authtoken_token table does not exist and every token lookup fails with a ProgrammingError.",
        "Using HTTP (not HTTPS) in production — tokens in Authorization headers are plaintext and trivially interceptable without TLS.",
        "One token per user means logging out on one device logs out all devices — for multi-device scenarios create a custom per-device token model.",
        "Not deleting the server-side token on logout — even if the client discards the token, the server still accepts it until manually deleted."
      ],
      interviewNotes: [
        "DRF TokenAuthentication is stateless on the client but stateful on the server — the token is stored in the database.",
        "One DB query per authenticated request for the token lookup — add Redis caching or switch to JWT to eliminate this.",
        "authentication_classes and permission_classes are evaluated in order — first class to authenticate wins, all permission classes must pass.",
        "obtain_auth_token uses BasicAuthentication to extract credentials from the POST body by default — you can customize it.",
        "For multi-device tokens, subclass Token and add a device_name field, then allow multiple tokens per User."
      ],
      whenToUse: "Simple internal APIs, CLI scripts, mobile apps, or any non-browser client where cookie-based sessions are impractical.",
      whenNotToUse: "High-traffic APIs where a DB lookup per request becomes a bottleneck. Switch to JWT (stateless) or cache the token lookup in Redis."
    },
    tags: ["authentication", "drf", "token", "rest", "api"],
    order: 2,
    estimatedMinutes: 15
  },

  {
    id: "jwt-authentication",
    title: "JWT Authentication (SimpleJWT)",
    slug: "jwt-authentication",
    category: "production",
    subcategory: "authentication",
    difficulty: "intermediate",
    description: "JSON Web Token auth with djangorestframework-simplejwt: settings, custom claims, token refresh, and blacklisting on logout.",
    content: {
      explanation: "JSON Web Tokens are self-contained, cryptographically signed strings. The server never stores them — it verifies the signature on every request using SECRET_KEY. A JWT payload contains claims: user_id, exp (expiry), iat (issued at), jti (unique ID), plus any custom fields you add.\n\ndjango-restframework-simplejwt provides short-lived access tokens (default 5 minutes) and long-lived refresh tokens (default 1 day). The client uses the refresh token to silently obtain new access tokens. Setting ROTATE_REFRESH_TOKENS=True issues a new refresh token on every refresh call, and BLACKLIST_AFTER_ROTATION=True invalidates the old one — implementing refresh token rotation.\n\nCustom claims embed extra data (username, roles) directly in the token payload, eliminating DB lookups for that data in views. The blacklist app lets you invalidate refresh tokens on logout even though access tokens remain valid until they naturally expire.",
      realExample: "A SPA stores the access token in JavaScript memory (not localStorage) and the refresh token in an HttpOnly cookie. When the access token expires after 15 minutes, a background request uses the cookie to get a new pair. On logout, the refresh token is blacklisted and both tokens are discarded.",
      codeExample: `# pip install djangorestframework-simplejwt

# settings.py
from datetime import timedelta

INSTALLED_APPS = [
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',  # required for logout blacklisting
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME':  timedelta(minutes=15),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS':  True,    # issue new refresh token on every refresh
    'BLACKLIST_AFTER_ROTATION': True,  # old refresh token is blacklisted
    'AUTH_HEADER_TYPES': ('Bearer',),
    'UPDATE_LAST_LOGIN': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,         # use a separate key for extra security
}

# Run: python manage.py migrate  (creates blacklist tables)

# urls.py
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView, TokenBlacklistView
from myapp.views import CustomTokenObtainPairView, LogoutView, MeView

urlpatterns = [
    path('api/token/',           CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/',   TokenRefreshView.as_view(),          name='token_refresh'),
    path('api/token/blacklist/', TokenBlacklistView.as_view(),        name='token_blacklist'),
    path('api/auth/logout/',     LogoutView.as_view(),                name='logout'),
    path('api/me/',              MeView.as_view(),                    name='me'),
]

# myapp/serializers.py
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Embed extra data in the payload — no DB query needed in views
        token['username'] = user.username
        token['email']    = user.email
        token['is_staff'] = user.is_staff
        token['roles']    = list(user.groups.values_list('name', flat=True))
        return token

# myapp/views.py
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import status

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data['refresh']
            token = RefreshToken(refresh_token)
            token.blacklist()    # writes to blacklisted_token table
            return Response({'detail': 'Logged out successfully.'})
        except KeyError:
            return Response({'detail': 'Refresh token required.'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception:
            return Response({'detail': 'Invalid token.'}, status=status.HTTP_400_BAD_REQUEST)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # request.user resolved from JWT payload — no extra DB query
        return Response({
            'id':       request.user.id,
            'username': request.user.username,
        })`,
      outputExplanation: "Token obtain returns {access, refresh}. The access token payload decodes to {user_id, exp, iat, jti, token_type, username, email, is_staff, roles}. JWTAuthentication decodes and verifies the signature without a DB query. On refresh, ROTATE_REFRESH_TOKENS issues a new refresh token and BLACKLIST_AFTER_ROTATION adds the old one to the blacklist table — blacklist checks do require a DB query on every refresh call.",
      commonMistakes: [
        "Storing the access token in localStorage — any XSS script can read it. Use memory (JS variable) for access tokens and HttpOnly cookie for refresh tokens.",
        "Setting ACCESS_TOKEN_LIFETIME too long — a stolen access token cannot be revoked until expiry. Keep it to 5-15 minutes.",
        "Forgetting to migrate after adding token_blacklist — the blacklist tables do not exist and blacklisting raises an OperationalError.",
        "Not rotating refresh tokens — a stolen refresh token can be used indefinitely until its long expiry."
      ],
      interviewNotes: [
        "JWT is stateless: the server holds no session state — great for horizontal scaling but you cannot instantly revoke an access token.",
        "The blacklist app adds a DB query on every refresh — JWT is not 100% stateless once you blacklist.",
        "JWT payload is base64-encoded, not encrypted — never put sensitive data (passwords, PII) in claims.",
        "ROTATE_REFRESH_TOKENS + BLACKLIST_AFTER_ROTATION implements refresh token rotation — a security best practice against token theft.",
        "Custom claims in get_token() are embedded at login time — they reflect the user's state at login, not at request time. Roles added after login won't appear until the user re-authenticates."
      ],
      whenToUse: "Stateless APIs, microservices, SPAs, mobile apps, or any scenario requiring verification across multiple servers without shared session storage.",
      whenNotToUse: "Applications requiring instant revocation (financial systems, medical). Session auth with Redis gives immediate invalidation that JWT cannot match."
    },
    tags: ["jwt", "authentication", "simplejwt", "drf", "tokens"],
    order: 3,
    estimatedMinutes: 20
  },

  {
    id: "custom-auth-backend",
    title: "Custom Authentication Backend",
    slug: "custom-auth-backend",
    category: "production",
    subcategory: "authentication",
    difficulty: "intermediate",
    description: "Write a custom Django auth backend to authenticate by email, API key, or any external credential.",
    content: {
      explanation: "Django's authentication system supports multiple backends. Each must implement authenticate(request, **credentials) returning a user or None, and get_user(user_id) returning a user or None. Django tries each backend in AUTHENTICATION_BACKENDS order until one returns a non-None user.\n\nThe most common customization is email-based login. Another use case is API key authentication for service-to-service calls. You can also delegate to LDAP, OAuth, or any external identity provider.\n\nget_user() is called on every request by the session middleware to reconstruct request.user from the session. It must be fast — no expensive operations. authenticate() is only called at login time.",
      realExample: "An enterprise app needs email-based login (not username) for employees and a separate API key backend for internal microservices. Both backends coexist in AUTHENTICATION_BACKENDS — Django tries them in order.",
      codeExample: `# accounts/backends.py
from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend
from myapp.models import APIKey
import secrets

User = get_user_model()


class EmailBackend(ModelBackend):
    """Authenticate using email address instead of username."""

    def authenticate(self, request, username=None, password=None, **kwargs):
        # Accept 'email' kwarg or treat 'username' as email
        email = kwargs.get('email') or username
        if not email or not password:
            return None

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            # Run the hasher anyway to prevent timing-based user enumeration
            User().set_password(password)
            return None
        except User.MultipleObjectsReturned:
            return None

        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None

    def get_user(self, user_id):
        try:
            user = User.objects.get(pk=user_id)
            return user if self.user_can_authenticate(user) else None
        except User.DoesNotExist:
            return None


class APIKeyBackend:
    """Authenticate service-to-service requests using an API key header."""

    def authenticate(self, request, api_key=None, **kwargs):
        if api_key is None:
            # Try reading from the request header directly
            api_key = request.META.get('HTTP_X_API_KEY') if request else None
        if not api_key:
            return None

        try:
            key_obj = (
                APIKey.objects
                .select_related('user')
                .get(key=api_key, is_active=True)
            )
            return key_obj.user
        except APIKey.DoesNotExist:
            return None

    def get_user(self, user_id):
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None


# myapp/models.py
import secrets
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class APIKey(models.Model):
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='api_keys'
    )
    key      = models.CharField(max_length=64, unique=True, db_index=True)
    name     = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_used_at = models.DateTimeField(null=True, blank=True)

    @classmethod
    def generate(cls, user, name):
        key = secrets.token_hex(32)   # 64-char hex = 256 bits of entropy
        return cls.objects.create(user=user, key=key, name=name)

    def __str__(self):
        return f"{self.user.username} / {self.name}"


# settings.py
AUTHENTICATION_BACKENDS = [
    'accounts.backends.EmailBackend',   # tried first
    'accounts.backends.APIKeyBackend',  # tried second
    # ModelBackend removed — email-only login for users
]

# accounts/views.py usage:
from django.contrib.auth import authenticate, login

def login_view(request):
    if request.method == 'POST':
        email    = request.POST.get('email')
        password = request.POST.get('password')
        user = authenticate(request, username=email, password=password)
        if user:
            login(request, user)
            return redirect('dashboard')
        return render(request, 'login.html', {'error': 'Invalid credentials'})
    return render(request, 'login.html')`,
      outputExplanation: "Django iterates AUTHENTICATION_BACKENDS in order, calling authenticate() on each. The first non-None return wins. The dummy User().set_password(password) call in EmailBackend when the user is not found takes the same time as a real check_password() call, preventing timing-based user enumeration. get_user() is called by AuthenticationMiddleware on every request — keep it to a single indexed DB lookup.",
      commonMistakes: [
        "Not calling User().set_password(password) when the user is not found — creates a measurable timing difference revealing whether an email is registered.",
        "Removing ModelBackend without realizing Django admin uses it — the admin login may break.",
        "Not checking user_can_authenticate() — this checks is_active. Omitting it allows disabled accounts to log in.",
        "Slow get_user() implementation — it runs on every single request. Always look up by primary key (indexed) only."
      ],
      interviewNotes: [
        "AUTHENTICATION_BACKENDS is a list — Django short-circuits after the first non-None authenticate() return.",
        "The backend that authenticated a user is stored in session['_auth_user_backend'] and is used for subsequent get_user() calls.",
        "PermissionsMixin methods also iterate backends — backends can independently contribute permissions via has_perm().",
        "authenticate() returning None means 'I cannot handle this credential' — it does not distinguish between 'wrong password' and 'user not found'.",
        "Custom backends are the correct integration point for LDAP, SAML 2.0, OAuth2 (social login), or biometric auth."
      ],
      whenToUse: "When default username-based auth does not fit: email login, API key auth, OAuth, LDAP, or any external identity provider.",
      whenNotToUse: "If django-allauth is already installed — it handles email login, social auth, and 2FA without a custom backend."
    },
    tags: ["authentication", "backend", "email", "api-key", "custom"],
    order: 4,
    estimatedMinutes: 20
  },

  {
    id: "permission-classes-drf",
    title: "DRF Permission Classes",
    slug: "permission-classes-drf",
    category: "production",
    subcategory: "authentication",
    difficulty: "intermediate",
    description: "DRF's permission system: built-in classes, custom IsOwner, object-level permissions, and AND/OR logic.",
    content: {
      explanation: "DRF permissions answer 'Is this user allowed to perform this action?' They are checked after authentication. Every permission class implements has_permission(request, view) for view-level access and optionally has_object_permission(request, view, obj) for object-level access.\n\nBuilt-in classes: AllowAny, IsAuthenticated, IsAdminUser, IsAuthenticatedOrReadOnly. When permission_classes is a list, all must pass (AND logic). For OR logic, DRF 3.9+ supports the | operator between permission classes.\n\nhas_object_permission is only called when get_object() is invoked in the view — typically for detail (retrieve/update/destroy) endpoints. It is never called automatically for list endpoints. You must explicitly call self.get_object() to trigger object-level checking.",
      realExample: "A blog API: anyone can read posts, authenticated users can create, but only the post's author (or an admin) can edit or delete. This requires per-action permission logic using get_permissions().",
      codeExample: `# myapp/permissions.py
from rest_framework.permissions import BasePermission, IsAuthenticated, SAFE_METHODS


class IsOwner(BasePermission):
    """Object-level: only the resource owner can write."""
    message = 'You do not have permission to modify this resource.'

    def has_permission(self, request, view):
        # Must be authenticated to even reach object-level check
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        # obj must have a 'user' FK to the User model
        return obj.user == request.user


class IsOwnerOrAdmin(BasePermission):
    """Owner can do anything; staff can do anything."""
    message = 'You must be the owner or an admin.'

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if request.user.is_staff:
            return True
        return obj.user == request.user


class ReadOnly(BasePermission):
    def has_permission(self, request, view):
        return request.method in SAFE_METHODS


# myapp/views.py
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from myapp.permissions import IsOwner, IsOwnerOrAdmin
from myapp.models import BlogPost
from myapp.serializers import BlogPostSerializer


class BlogPostViewSet(viewsets.ModelViewSet):
    serializer_class = BlogPostSerializer
    queryset = BlogPost.objects.all()

    def get_permissions(self):
        """Assign permissions dynamically per action."""
        if self.action in ('list', 'retrieve'):
            permission_classes = [AllowAny]
        elif self.action == 'create':
            permission_classes = [IsAuthenticated]
        else:
            # update, partial_update, destroy
            permission_classes = [IsOwnerOrAdmin]
        return [permission() for permission in permission_classes]

    def perform_create(self, serializer):
        # Inject the current user as the owner
        serializer.save(user=self.request.user)


# OR logic with Python operators (DRF 3.9+)
from rest_framework.views import APIView

class ArticleView(APIView):
    # Pass if IsAuthenticated OR IsAdminUser
    permission_classes = [IsAuthenticated | IsOwner]


class SensitiveView(APIView):
    # (Authenticated AND Owner) OR Admin
    permission_classes = [(IsAuthenticated & IsOwner) | IsOwnerOrAdmin]


# Object-level permission in a non-ViewSet view
class BlogPostDetailView(APIView):
    permission_classes = [IsOwner]

    def get_object(self, pk):
        from django.shortcuts import get_object_or_404
        obj = get_object_or_404(BlogPost, pk=pk)
        self.check_object_permissions(self.request, obj)  # <-- must call explicitly
        return obj

    def delete(self, request, pk):
        post = self.get_object(pk)
        post.delete()
        return Response(status=204)


# myapp/models.py
class BlogPost(models.Model):
    user  = models.ForeignKey('auth.User', on_delete=models.CASCADE, related_name='posts')
    title = models.CharField(max_length=200)
    body  = models.TextField()`,
      outputExplanation: "has_permission runs for every request before the view logic. has_object_permission runs only when get_object() is called (detail endpoints). If has_permission returns False for an authenticated user, DRF returns 403. For an anonymous user, it returns 401. get_permissions() returning different classes per action name is the standard pattern for fine-grained control without duplicating views.",
      commonMistakes: [
        "Defining has_object_permission only, without has_permission returning True — has_object_permission is never reached if has_permission fails (or is not defined, which defaults to True only on BasePermission).",
        "Not calling check_object_permissions(request, obj) in custom views — only ViewSet's get_object() does this automatically.",
        "Returning an empty list instead of 403 for forbidden resources — silently hiding results is a different pattern (row-level filtering), not permission denial.",
        "Using IsAdminUser expecting it to check Django permissions — it only checks user.is_staff, not user.has_perm()."
      ],
      interviewNotes: [
        "has_permission runs for every request; has_object_permission only runs when get_object() is explicitly called.",
        "SAFE_METHODS = ('GET', 'HEAD', 'OPTIONS') — these are read-only HTTP verbs.",
        "DRF returns 401 for unauthenticated requests and 403 for authenticated-but-forbidden requests.",
        "get_permissions() is called on every request — return fresh instances (permission()) not classes.",
        "The | and & operators between permission classes were added in DRF 3.9 — earlier versions need manual OR logic in has_permission."
      ],
      whenToUse: "Any DRF API with access control beyond 'is logged in'. Object-level permissions are essential for user-owned resource APIs.",
      whenNotToUse: "Database-level row security (PostgreSQL RLS) is more secure for strict multi-tenant isolation — application-level permissions can have bugs."
    },
    tags: ["permissions", "drf", "authorization", "rest", "security"],
    order: 5,
    estimatedMinutes: 20
  },

  {
    id: "throttling-rate-limiting",
    title: "DRF Throttling & Rate Limiting",
    slug: "throttling-rate-limiting",
    category: "production",
    subcategory: "authentication",
    difficulty: "intermediate",
    description: "DRF throttle classes: AnonRateThrottle, UserRateThrottle, ScopedRateThrottle, custom throttles, and Redis-backed rate limiting.",
    content: {
      explanation: "Throttling limits how often a client can call an API in a given time window. DRF's throttle classes extend SimpleRateThrottle which uses Django's cache backend (must be shared across workers, so use Redis) to track request timestamps.\n\nAnonRateThrottle keys by client IP address. UserRateThrottle keys by authenticated user PK. ScopedRateThrottle allows different rates per endpoint using the throttle_scope attribute on the view.\n\nRates are written as 'N/period' where period is second, minute, hour, or day. Custom throttles override get_cache_key() to change client identification — for example throttling by organization so all users in the same org share a quota.",
      realExample: "A public search API: 100 requests/hour for anonymous users, 1000/hour for authenticated users. The password-reset endpoint has a strict 5/hour limit using ScopedRateThrottle to block email enumeration. All limits backed by Redis so they work across 8 Gunicorn workers.",
      codeExample: `# settings.py
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon':           '100/hour',
        'user':           '1000/hour',
        'password_reset': '5/hour',
        'search':         '30/minute',
        'upload':         '10/day',
    },
}

# Redis cache (shared across all workers — required for throttling to work)
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
        'OPTIONS': {'CLIENT_CLASS': 'django_redis.client.DefaultClient'},
    }
}

# myapp/throttles.py
from rest_framework.throttling import SimpleRateThrottle, UserRateThrottle


class PasswordResetThrottle(SimpleRateThrottle):
    """Strict limit on password reset — always keyed by IP."""
    scope = 'password_reset'

    def get_cache_key(self, request, view):
        ident = self.get_ident(request)   # client IP
        return self.cache_format % {'scope': self.scope, 'ident': ident}


class OrganizationThrottle(SimpleRateThrottle):
    """All users in the same org share a rate limit quota."""
    scope = 'org'

    def get_cache_key(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return None   # skip — let AnonRateThrottle handle it
        org_id = getattr(request.user, 'organization_id', None)
        if not org_id:
            return None
        return self.cache_format % {'scope': self.scope, 'ident': org_id}


class BurstThrottle(UserRateThrottle):
    """Short burst limit — 10/minute — paired with sustained 1000/hour."""
    scope = 'burst'


# myapp/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from myapp.throttles import PasswordResetThrottle, BurstThrottle


class SearchView(APIView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope   = 'search'   # maps to DEFAULT_THROTTLE_RATES['search']

    def get(self, request):
        return Response({'results': []})


class PasswordResetView(APIView):
    # Override global defaults — stricter throttle, no per-user rate
    throttle_classes = [PasswordResetThrottle]

    def post(self, request):
        # ... send reset email ...
        return Response({'detail': 'Reset email sent.'})


class UploadView(APIView):
    # Multiple throttles — ALL must pass
    throttle_classes = [BurstThrottle, ScopedRateThrottle]
    throttle_scope   = 'upload'

    def post(self, request):
        return Response({'detail': 'Upload accepted.'})

# When throttled, DRF returns:
# HTTP 429 Too Many Requests
# Retry-After: 3600
# {"detail": "Request was throttled. Expected available in 3600 seconds."}`,
      outputExplanation: "SimpleRateThrottle stores a list of Unix timestamps in the cache under the key throttle_<scope>_<ident>. On each request it removes timestamps older than the window and counts the remainder. If count >= limit, a Throttled exception is raised (429). Multiple throttle classes are checked in order — all must pass. The Retry-After header tells well-behaved clients when they can retry.",
      commonMistakes: [
        "Using LocMemCache for throttling in production — each worker process has its own cache instance, so limits are per-process not per-server. Use Redis.",
        "Not defining a rate for a scope in DEFAULT_THROTTLE_RATES — DRF raises ImproperlyConfigured at runtime when the scope is first hit.",
        "Applying the same per-user throttle to login endpoints — unauthenticated login attempts should be throttled by IP, not by user (user is unknown before auth).",
        "Forgetting that ScopedRateThrottle requires throttle_scope set on the view — without it, no throttling is applied silently."
      ],
      interviewNotes: [
        "DRF throttling uses a sliding window algorithm storing a list of timestamps in cache.",
        "Cache key format: throttle_<scope>_<ident> — inspectable in Redis with KEYS 'throttle_*'.",
        "429 responses include Retry-After header — clients should honour this before retrying.",
        "For DDoS protection, rate-limit at the infrastructure layer (nginx limit_req, Cloudflare) before requests reach Django.",
        "get_cache_key() returning None exempts that request from the throttle — useful for internal IPs or superusers."
      ],
      whenToUse: "All public-facing APIs. Critical for authentication endpoints (login, OTP, password reset) to prevent brute force and abuse.",
      whenNotToUse: "Internal service-to-service APIs on private networks where clients are trusted and rate limiting adds unnecessary latency."
    },
    tags: ["throttling", "rate-limiting", "drf", "security", "redis"],
    order: 6,
    estimatedMinutes: 15
  },

  {
    id: "two-factor-auth-pattern",
    title: "Two-Factor Authentication (Manual OTP)",
    slug: "two-factor-auth-pattern",
    category: "production",
    subcategory: "authentication",
    difficulty: "advanced",
    description: "Implement 2FA without third-party libraries: secure OTP generation, cache storage with TTL, attempt limiting, and session state.",
    content: {
      explanation: "Two-factor authentication adds a second verification step after password login. The manual OTP pattern: generate a cryptographically secure 6-digit code with secrets.randbelow(), store it in Django's cache with a short TTL (5 minutes), deliver it via email or SMS, and verify it in a second view.\n\nAfter password success, put the user PK in the session under a temporary key — the user is 'half-authenticated'. Only after OTP verification call login() to create the full session. Compare OTPs using secrets.compare_digest() to prevent timing attacks. Delete the OTP from cache immediately after successful verification to prevent reuse. Limit attempts (3) to prevent brute forcing the 1,000,000-combination space within the TTL.",
      realExample: "A financial dashboard requires 2FA for all logins. Users receive a 6-digit code by email. They have 5 minutes and 3 attempts. Failed verification increments a counter stored in cache. Success logs the IP and timestamp for the audit trail.",
      codeExample: `# accounts/views.py
import secrets
from django.contrib.auth import login, get_user_model
from django.contrib.auth import authenticate
from django.core.cache import cache
from django.core.mail import send_mail
from django.shortcuts import render, redirect
from django.views import View
from django.utils import timezone

User = get_user_model()

OTP_KEY      = 'otp_code_{user_id}'
ATTEMPT_KEY  = 'otp_attempts_{user_id}'
OTP_TTL      = 300   # 5 minutes
MAX_ATTEMPTS = 3


def generate_otp() -> str:
    """Return a cryptographically secure 6-digit string."""
    return str(secrets.randbelow(900000) + 100000)   # range 100000-999999


class LoginView(View):
    template_name = 'accounts/login.html'

    def get(self, request):
        return render(request, self.template_name)

    def post(self, request):
        username = request.POST.get('username', '').strip()
        password = request.POST.get('password', '')
        user = authenticate(request, username=username, password=password)

        if user is None or not user.is_active:
            return render(request, self.template_name, {'error': 'Invalid credentials.'})

        # Step 1 passed: store user identity in session without fully logging in
        request.session['_2fa_user_id']      = user.pk
        request.session['_2fa_user_backend'] = 'django.contrib.auth.backends.ModelBackend'
        request.session.modified = True

        # Generate OTP and cache it
        otp = generate_otp()
        cache.set(OTP_KEY.format(user_id=user.pk), otp, timeout=OTP_TTL)
        cache.delete(ATTEMPT_KEY.format(user_id=user.pk))   # reset counter

        send_mail(
            subject='Your login code',
            message=f'Code: {otp}\nExpires in 5 minutes.',
            from_email='no-reply@example.com',
            recipient_list=[user.email],
        )
        return redirect('verify-otp')


class VerifyOTPView(View):
    template_name = 'accounts/verify_otp.html'

    def get(self, request):
        if '_2fa_user_id' not in request.session:
            return redirect('login')
        return render(request, self.template_name)

    def post(self, request):
        user_id = request.session.get('_2fa_user_id')
        if not user_id:
            return redirect('login')

        # Check attempt count first
        attempts = cache.get(ATTEMPT_KEY.format(user_id=user_id), 0)
        if attempts >= MAX_ATTEMPTS:
            cache.delete(OTP_KEY.format(user_id=user_id))
            request.session.pop('_2fa_user_id', None)
            return render(request, self.template_name, {
                'error': 'Too many failed attempts. Please log in again.'
            })

        submitted = request.POST.get('otp', '').strip()
        stored    = cache.get(OTP_KEY.format(user_id=user_id))

        if not stored:
            request.session.pop('_2fa_user_id', None)
            return render(request, self.template_name, {
                'error': 'Code expired. Please log in again.'
            })

        # Constant-time comparison — prevents timing oracle attacks
        if not secrets.compare_digest(submitted, stored):
            cache.set(
                ATTEMPT_KEY.format(user_id=user_id),
                attempts + 1,
                timeout=OTP_TTL
            )
            return render(request, self.template_name, {'error': 'Incorrect code.'})

        # Success — delete OTP immediately to prevent reuse
        cache.delete(OTP_KEY.format(user_id=user_id))
        cache.delete(ATTEMPT_KEY.format(user_id=user_id))

        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return redirect('login')

        # Full login
        backend = request.session.pop('_2fa_user_backend')
        del request.session['_2fa_user_id']
        user.backend = backend
        login(request, user)
        request.session['2fa_verified']    = True
        request.session['2fa_verified_at'] = timezone.now().isoformat()

        return redirect('dashboard')


# Decorator for views requiring confirmed 2FA
from functools import wraps
from django.contrib.auth.decorators import login_required

def require_2fa_verified(view_func):
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return redirect('login')
        if not request.session.get('2fa_verified'):
            return redirect('verify-otp')
        return view_func(request, *args, **kwargs)
    return wrapper

# urls.py
from django.urls import path
urlpatterns = [
    path('login/',      LoginView.as_view(),     name='login'),
    path('verify-otp/', VerifyOTPView.as_view(), name='verify-otp'),
]`,
      outputExplanation: "LoginView authenticates with password, then parks the user PK in the session under a private key. It generates a cryptographically secure OTP using secrets.randbelow() and caches it for 5 minutes. VerifyOTPView checks attempts, retrieves the cached OTP, compares using secrets.compare_digest() (constant time), deletes the OTP on success, and calls login() to finalize the session. The 2fa_verified session flag gates downstream views.",
      commonMistakes: [
        "Using random.randint() instead of secrets.randbelow() — the random module is not cryptographically secure and OTPs are predictable.",
        "Using == for OTP comparison — use secrets.compare_digest() to avoid timing oracle attacks that reveal the correct digits.",
        "Not deleting the OTP from cache after successful verification — the same code can be reused multiple times within the TTL.",
        "Not limiting attempts — a 6-digit OTP has 900,000 combinations. With no limit, 300 requests/second brute forces it in 50 minutes within a 5-minute window."
      ],
      interviewNotes: [
        "The half-authenticated session state (storing user PK without calling login()) is the standard pattern for multi-step auth flows.",
        "TOTP per RFC 6238 uses HMAC-SHA1 over the current 30-second time window — Google Authenticator implements this. Use pyotp for authenticator app integration.",
        "secrets module is stdlib since Python 3.6 — always use it for security tokens, never the random module.",
        "Cache TTL equals OTP lifetime — if Redis is flushed, all pending OTPs are invalidated and users must restart login.",
        "For SMS delivery, integrate Twilio or AWS SNS. Always dispatch asynchronously via Celery to avoid blocking the login response."
      ],
      whenToUse: "Any application with sensitive data: financial, medical, admin panels. Required when users can perform irreversible actions.",
      whenNotToUse: "Low-friction consumer apps where the UX cost outweighs the security gain. In production, prefer django-otp or django-allauth's built-in 2FA which handle edge cases properly."
    },
    tags: ["2fa", "otp", "authentication", "security", "cache"],
    order: 7,
    estimatedMinutes: 25
  },

  // ─── MODEL PATTERNS (8–15) ──────────────────────────────────────────────────
  {
    id: "timestamped-model",
    title: "TimeStamped Abstract Model",
    slug: "timestamped-model",
    category: "production",
    subcategory: "model-patterns",
    difficulty: "beginner",
    description: "An abstract base model providing created_at and updated_at fields inherited by all child models.",
    content: {
      explanation: "An abstract model (abstract = True in Meta) is never turned into its own database table. Its fields are injected directly into every concrete child model's table. This is the standard pattern for sharing common fields without the JOINs required by multi-table inheritance.\n\nauto_now_add=True sets the field to now() only on INSERT and makes it non-editable. auto_now=True sets the field to now() on every save() call. Both prevent the field from being set in ModelForms and the admin.\n\nCritical nuance: auto_now and auto_now_add are bypassed by QuerySet.update() because update() issues a direct SQL UPDATE without calling the model's save(). If you use bulk updates frequently, use default=timezone.now with editable=False instead so you can pass updated_at=timezone.now() explicitly.",
      realExample: "A SaaS platform with 30+ models inherits from TimeStampedModel. Every list view in the admin shows created_at. Background jobs filter Post.objects.filter(updated_at__gte=checkpoint) to process only recently changed records.",
      codeExample: `# core/models.py
from django.db import models
from django.utils import timezone


class TimeStampedModel(models.Model):
    """
    Abstract base providing created_at and updated_at to all child models.
    No database table is created for this class.
    """
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
        ordering = ['-created_at']


# blog/models.py
from django.contrib.auth import get_user_model
from core.models import TimeStampedModel

User = get_user_model()


class Post(TimeStampedModel):
    title  = models.CharField(max_length=200)
    body   = models.TextField()
    author = models.ForeignKey(User, on_delete=models.CASCADE)

    class Meta(TimeStampedModel.Meta):
        # Extend parent Meta — always inherit to keep abstract = True
        verbose_name = 'Post'
        verbose_name_plural = 'Posts'
        # Can override ordering here if needed:
        # ordering = ['-updated_at']


class Comment(TimeStampedModel):
    post   = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    body   = models.TextField()
    # created_at and updated_at are added automatically to this table too


# ---- QUERYSET EXAMPLES ----
from datetime import timedelta

# Posts created in the last 7 days
recent = Post.objects.filter(
    created_at__gte=timezone.now() - timedelta(days=7)
)

# Posts modified today
today = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
modified_today = Post.objects.filter(updated_at__gte=today)

# Order by most recently updated (override default ordering)
fresh = Post.objects.order_by('-updated_at')[:10]


# ---- auto_now LIMITATION — important ----
# QuerySet.update() does NOT trigger auto_now:
Post.objects.filter(pk=1).update(title='New Title')
# updated_at is NOT changed — update() bypasses model.save()

# Correct approach when using update():
Post.objects.filter(pk=1).update(
    title='New Title',
    updated_at=timezone.now()    # set explicitly
)

# bulk_create() also bypasses auto_now_add:
# Pass created_at explicitly or handle it in a post-save step


# ---- ALTERNATIVE: avoid auto_now for testability ----
class TimeStampedModel2(models.Model):
    created_at = models.DateTimeField(default=timezone.now, editable=False, db_index=True)
    updated_at = models.DateTimeField(default=timezone.now, editable=False)

    def save(self, *args, **kwargs):
        self.updated_at = timezone.now()
        super().save(*args, **kwargs)

    class Meta:
        abstract = True
# Advantage: you can override created_at in tests or fixtures`,
      outputExplanation: "Django generates database columns only on concrete (non-abstract) child models. Post gets a table with id, created_at, updated_at, title, body, author_id. Comment gets its own table with the same timestamp columns. No JOIN is ever needed to access these fields. The child's Meta class must extend TimeStampedModel.Meta (class Meta(TimeStampedModel.Meta)) to inherit abstract = True, otherwise Django tries to create a table for the child.",
      commonMistakes: [
        "Omitting abstract = True — without it Django creates a real TimeStampedModel table and uses multi-table inheritance, adding a JOIN to every query.",
        "Using auto_now=True and expecting update() to set updated_at — update() is a SQL UPDATE, it never calls save().",
        "Using auto_now_add=True and trying to set created_at in fixtures or tests — you cannot override it. Use default=timezone.now with editable=False instead.",
        "Not inheriting Meta from parent (class Meta(TimeStampedModel.Meta)) — you lose the abstract=True and the child model gets its own unwanted table."
      ],
      interviewNotes: [
        "Abstract models inject fields into child tables — one table per concrete model, no JOINs.",
        "Multi-table inheritance (no abstract=True) creates a shared parent table linked by OneToOneField — adds a JOIN to every query.",
        "auto_now_add makes the field non-editable and sets default=timezone.now internally.",
        "auto_now is bypassed by update(), bulk_create(), and bulk_update() — all bypass model.save().",
        "db_index=True on created_at is important — filtering by time range on a large table without an index causes full scans."
      ],
      whenToUse: "Every Django project. All models should track creation and modification times — it is a universal pattern.",
      whenNotToUse: "If you need to query across multiple models by created_at in a single query, consider a shared concrete base table. The abstract approach cannot be queried across children in one SQL statement."
    },
    tags: ["models", "abstract", "timestamps", "mixins", "patterns"],
    order: 8,
    estimatedMinutes: 12
  },

  {
    id: "soft-delete-model",
    title: "Soft Delete Pattern",
    slug: "soft-delete-model",
    category: "production",
    subcategory: "model-patterns",
    difficulty: "intermediate",
    description: "Implement soft delete with a custom Manager, restore(), hard_delete(), and automatic filtering of deleted records.",
    content: {
      explanation: "Soft delete marks a record as deleted instead of removing it from the database. This preserves audit history, allows data recovery, and avoids cascading hard deletes that break referential integrity.\n\nThe pattern requires: an is_deleted BooleanField (indexed), a deleted_at DateTimeField (nullable), a custom Manager that filters out deleted records by default, and an AllObjectsManager for admin and recovery. Overriding model.delete() to soft-delete means existing code calling obj.delete() works without changes.\n\nThe trickiest edge case: QuerySet.delete() sends a bulk SQL DELETE without calling model.delete(). To intercept bulk deletes, you must also override delete() on a custom QuerySet attached to the manager.",
      realExample: "A document management system lets users 'delete' files into a trash folder. After 30 days, a nightly Celery task permanently removes any item with deleted_at older than 30 days. Users can restore any trashed item within that window.",
      codeExample: `# core/models.py
from django.db import models
from django.utils import timezone


class SoftDeleteQuerySet(models.QuerySet):
    def delete(self):
        """Override bulk delete to soft-delete instead of SQL DELETE."""
        return self.update(is_deleted=True, deleted_at=timezone.now())

    def hard_delete(self):
        """Bulk permanent delete."""
        return super().delete()

    def restore(self):
        """Bulk restore."""
        return self.update(is_deleted=False, deleted_at=None)


class SoftDeleteManager(models.Manager):
    """Default manager — excludes soft-deleted records."""

    def get_queryset(self):
        return SoftDeleteQuerySet(self.model, using=self._db).filter(is_deleted=False)

    def deleted(self):
        """Return only soft-deleted records."""
        return SoftDeleteQuerySet(self.model, using=self._db).filter(is_deleted=True)


class AllObjectsManager(models.Manager):
    """Manager that includes all records — use in admin and recovery flows."""

    def get_queryset(self):
        return SoftDeleteQuerySet(self.model, using=self._db)


class SoftDeleteModel(models.Model):
    is_deleted = models.BooleanField(default=False, db_index=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    objects     = SoftDeleteManager()   # default — safe
    all_objects = AllObjectsManager()   # includes deleted

    class Meta:
        abstract = True

    def delete(self, using=None, keep_parents=False):
        """Soft-delete a single instance."""
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save(update_fields=['is_deleted', 'deleted_at'])

    def restore(self):
        """Undelete a single instance."""
        self.is_deleted = False
        self.deleted_at = None
        self.save(update_fields=['is_deleted', 'deleted_at'])

    def hard_delete(self):
        """Permanently remove from the database."""
        super().delete()


# documents/models.py
from django.contrib.auth import get_user_model
from core.models import SoftDeleteModel, TimeStampedModel

User = get_user_model()


class Document(SoftDeleteModel, TimeStampedModel):
    title      = models.CharField(max_length=255)
    content    = models.TextField()
    owner      = models.ForeignKey(User, on_delete=models.CASCADE)
    size_bytes = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['-created_at']


# ---- USAGE ----
# Active docs only (is_deleted=False filtered automatically)
docs = Document.objects.filter(owner=request.user)

# Soft delete
doc = Document.objects.get(pk=1)
doc.delete()   # soft deletes — sets is_deleted=True

# Bulk soft delete via QuerySet
Document.objects.filter(owner=old_user).delete()   # soft-deletes all

# Trash view
trash = Document.objects.deleted().filter(owner=request.user)

# Restore
doc = Document.all_objects.get(pk=1)
doc.restore()

# Nightly cleanup task (Celery)
from datetime import timedelta

def purge_old_trash():
    cutoff = timezone.now() - timedelta(days=30)
    count, _ = Document.all_objects.filter(
        is_deleted=True,
        deleted_at__lt=cutoff
    ).hard_delete()
    return count


# Admin — show all records including deleted
from django.contrib import admin

@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ['title', 'owner', 'is_deleted', 'deleted_at', 'created_at']
    list_filter  = ['is_deleted']
    actions      = ['restore_selected']

    def get_queryset(self, request):
        return Document.all_objects.all()

    def restore_selected(self, request, queryset):
        queryset.restore()
    restore_selected.short_description = 'Restore selected documents'`,
      outputExplanation: "SoftDeleteManager.get_queryset() appends WHERE is_deleted = FALSE to every query automatically. All standard ORM operations (.all(), .filter(), .get()) use this safe manager. SoftDeleteQuerySet.delete() issues UPDATE ... SET is_deleted=TRUE instead of DELETE. AllObjectsManager bypasses the filter for admin and recovery. The db_index=True on is_deleted ensures the WHERE clause uses an index on large tables.",
      commonMistakes: [
        "Not indexing is_deleted — every query appends WHERE is_deleted = FALSE. Without an index on a 10M-row table this causes full scans.",
        "Not overriding delete() on the QuerySet — QuerySet.delete() sends SQL DELETE directly without calling model.delete().",
        "Unique constraints on soft-deleted tables — two 'deleted' rows with the same email violate a unique constraint. Add a partial unique index: UniqueConstraint(fields=['email'], condition=Q(is_deleted=False)).",
        "Putting AllObjectsManager first — the first manager defined becomes _default_manager, used by related object lookups. SoftDeleteManager must be first."
      ],
      interviewNotes: [
        "The first Manager defined becomes _default_manager used by ForeignKey lookups — always put the safe manager first.",
        "QuerySet.delete() does not call model.delete() — override delete() on the QuerySet to intercept bulk deletes.",
        "Soft delete breaks unique constraints — use conditional unique constraints (PostgreSQL partial indexes) to handle this.",
        "django-safedelete is a production-grade library implementing this pattern with cascade soft delete support.",
        "GDPR 'right to erasure' may require hard delete of personal data — soft delete is not sufficient for compliance in those cases."
      ],
      whenToUse: "Systems requiring data recovery, audit trails, or 'trash' UX. Multi-tenant systems where accidental deletes are catastrophic.",
      whenNotToUse: "High-frequency insert/delete tables where the WHERE is_deleted=FALSE filter adds measurable overhead, or when personal data must be purged immediately under GDPR."
    },
    tags: ["models", "soft-delete", "manager", "queryset", "patterns"],
    order: 9,
    estimatedMinutes: 18
  },

  {
    id: "uuid-primary-key",
    title: "UUID Primary Key",
    slug: "uuid-primary-key",
    category: "production",
    subcategory: "model-patterns",
    difficulty: "beginner",
    description: "Use UUIDs as primary keys to prevent ID enumeration, support distributed inserts, and mask internal IDs in public URLs.",
    content: {
      explanation: "Default auto-incrementing integer PKs expose internal sequencing: seeing ID 42 reveals that IDs 1–41 exist and can be probed. UUID v4 primary keys are random 128-bit values — no sequential information, no central coordination needed, and safe to generate on multiple servers simultaneously.\n\nThe tradeoff is performance. UUID indexes are 16 bytes (4x an integer), and random UUID v4 values cause B-tree index fragmentation because each insert lands at a random position in the tree rather than appending to the end. On PostgreSQL with large tables this can degrade write performance significantly.\n\nUUID v7 (time-ordered, monotonically increasing) solves fragmentation while remaining globally unique — it is not yet in Python's stdlib but the uuid7 package provides it. For most applications, UUID v4 performance is acceptable.",
      realExample: "A document API uses UUID PKs. The URL /api/documents/a3f1c2d4-e5b6-7890-abcd-ef1234567890/ leaks nothing about how many documents exist. Documents are created by regional servers — no coordination needed for PK generation.",
      codeExample: `# documents/models.py
import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Document(models.Model):
    # Replace Django's default integer PK with UUID
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,   # callable — a new UUID per instance
        editable=False        # hidden from forms and admin
    )
    title      = models.CharField(max_length=255)
    owner      = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title}"


# settings.py — set default PK type globally (Django 3.2+)
# Note: this sets the type for models that do NOT define their own PK.
# To use UUID globally, you'd define a custom AutoField — uncommon.
# More practical: set UUID per model as shown above.
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


# ---- MIGRATION NOTE ----
# First migration for Document generates:
#   id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY  -- PostgreSQL
#   id varchar(32) NOT NULL PRIMARY KEY                     -- SQLite (stored as hex)
#
# Changing an existing integer PK to UUID requires:
# 1. Add a new uuid_id UUIDField (not PK)
# 2. Populate it: MyModel.objects.update(uuid_id=uuid.uuid4())  -- NOT correct, use data migration
# 3. Update all FK columns
# 4. Switch PK in a final migration
# (Better: plan UUIDs before the first migration)


# ---- SERIALIZER USAGE ----
# myapp/serializers.py
from rest_framework import serializers

class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Document
        fields = ['id', 'title', 'created_at']
    # DRF automatically uses UUIDField for 'id'
    # Response: {"id": "550e8400-e29b-41d4-a716-446655440000", ...}


# ---- URL CONFIGURATION ----
# urls.py
from django.urls import path
urlpatterns = [
    # Built-in <uuid:pk> converter validates and converts the path parameter
    path('documents/<uuid:pk>/', DocumentDetailView.as_view(), name='document-detail'),
]


# ---- QUERYING ----
# By string — Django auto-converts to UUID object
doc = Document.objects.get(pk='550e8400-e29b-41d4-a716-446655440000')

# By UUID object
import uuid
doc_id = uuid.UUID('550e8400-e29b-41d4-a716-446655440000')
doc    = Document.objects.get(pk=doc_id)

# Creating — UUID generated automatically by default=uuid.uuid4
new_doc = Document.objects.create(title='Report Q1', owner=request.user)
print(new_doc.pk)       # UUID('a3f1c2d4-...')
print(str(new_doc.pk))  # 'a3f1c2d4-...'

# ---- COMMON MISTAKE: calling uuid.uuid4() instead of passing uuid.uuid4 ----
# Wrong:
id = models.UUIDField(primary_key=True, default=uuid.uuid4(), editable=False)
#                                                          ^^
# This calls uuid4() once at class-definition time — all rows get the SAME UUID!

# Correct:
id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
#                                                       ^^ no parentheses`,
      outputExplanation: "default=uuid.uuid4 is a callable reference — Django calls it without arguments each time a new model instance is instantiated, producing a fresh unique UUID. The editable=False kwarg removes the field from ModelForm and admin change forms. The <uuid:pk> URL converter rejects malformed UUIDs before your view runs, returning 404 automatically. PostgreSQL stores UUID as a native binary type (16 bytes); SQLite stores it as a 32-char hex string.",
      commonMistakes: [
        "Writing default=uuid.uuid4() with parentheses — evaluates once at import time, all rows share the same UUID and the first INSERT succeeds but every subsequent one raises IntegrityError.",
        "Migrating an existing integer PK table to UUID — all FK columns referencing it must also change type, which requires a carefully sequenced set of migrations.",
        "Using UUID PKs on MySQL without a binary UUID type — MySQL stores as CHAR(36) by default (text), 3x larger than PostgreSQL's native UUID type."
      ],
      interviewNotes: [
        "UUID v4 is random — no sequential information, but causes B-tree index fragmentation on high-insert tables.",
        "UUID v7 is time-ordered — sequential like auto-increment but globally unique. Use the uuid7 package until Python stdlib adds it.",
        "PostgreSQL stores UUID as 16-byte binary natively. Django uses this type automatically on PostgreSQL.",
        "editable=False removes the field from forms and admin — not from the model or queries.",
        "The <uuid:pk> URL converter validates the format and calls uuid.UUID() — invalid UUIDs return 404 before the view runs."
      ],
      whenToUse: "Public-facing APIs where sequential ID exposure is a security concern. Distributed systems where multiple nodes generate records. Multi-tenant APIs where ID enumeration is a risk.",
      whenNotToUse: "Internal admin tools where simplicity matters more. High-volume tables on MySQL without binary UUID storage. Tables where you need to sort by insertion order using the PK."
    },
    tags: ["models", "uuid", "primary-key", "security", "distributed"],
    order: 10,
    estimatedMinutes: 12
  },

  {
    id: "status-model-pattern",
    title: "Status Field with Choices",
    slug: "status-model-pattern",
    category: "production",
    subcategory: "model-patterns",
    difficulty: "intermediate",
    description: "Status fields using TextChoices, transition methods, and state validation in save() — a lightweight FSM pattern.",
    content: {
      explanation: "The status field pattern uses Django's TextChoices (or IntegerChoices) enum to define valid states. TextChoices generates both the stored string value and a human-readable label in one definition, and integrates with Django's form validation and admin.\n\nThe real power comes from adding transition methods (publish(), archive()) that enforce valid state changes. By checking the current status before transitioning you get a lightweight finite state machine without a library dependency. For complex workflows with many transitions and guards, django-fsm provides a decorator-based FSM with proper transition enforcement.\n\nValidating transitions in save() is fragile because save() can be called for any reason. It is better to validate in dedicated transition methods and call save() from there.",
      realExample: "A content management system has posts in DRAFT, REVIEW, PUBLISHED, or ARCHIVED state. Only DRAFT posts can move to REVIEW. Only REVIEW posts can be PUBLISHED. PUBLISHED posts can be ARCHIVED. Attempting an invalid transition raises a ValueError caught by the API view and returned as a 400 error.",
      codeExample: `# blog/models.py
from django.db import models
from django.utils import timezone
from django.contrib.auth import get_user_model

User = get_user_model()


class BlogPost(models.Model):

    class Status(models.TextChoices):
        DRAFT     = 'draft',     'Draft'
        REVIEW    = 'review',    'In Review'
        PUBLISHED = 'published', 'Published'
        ARCHIVED  = 'archived',  'Archived'

    title        = models.CharField(max_length=200)
    body         = models.TextField()
    author       = models.ForeignKey(User, on_delete=models.CASCADE)
    status       = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
        db_index=True
    )
    published_at = models.DateTimeField(null=True, blank=True)
    archived_at  = models.DateTimeField(null=True, blank=True)
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    # Valid state transitions map
    VALID_TRANSITIONS = {
        Status.DRAFT:     [Status.REVIEW],
        Status.REVIEW:    [Status.PUBLISHED, Status.DRAFT],
        Status.PUBLISHED: [Status.ARCHIVED],
        Status.ARCHIVED:  [],
    }

    def transition_to(self, new_status: str) -> None:
        """General transition method with guard logic."""
        allowed = self.VALID_TRANSITIONS.get(self.status, [])
        if new_status not in allowed:
            raise ValueError(
                f"Cannot transition from '{self.status}' to '{new_status}'. "
                f"Allowed: {[s.value for s in allowed]}"
            )
        self.status = new_status

    def submit_for_review(self) -> None:
        self.transition_to(self.Status.REVIEW)
        self.save(update_fields=['status', 'updated_at'])

    def publish(self) -> None:
        self.transition_to(self.Status.PUBLISHED)
        self.published_at = timezone.now()
        self.save(update_fields=['status', 'published_at', 'updated_at'])

    def archive(self) -> None:
        self.transition_to(self.Status.ARCHIVED)
        self.archived_at = timezone.now()
        self.save(update_fields=['status', 'archived_at', 'updated_at'])

    def unpublish(self) -> None:
        self.transition_to(self.Status.DRAFT)
        self.published_at = None
        self.save(update_fields=['status', 'published_at', 'updated_at'])

    @property
    def is_published(self) -> bool:
        return self.status == self.Status.PUBLISHED

    def __str__(self):
        return f"{self.title} [{self.status}]"

    class Meta:
        ordering = ['-created_at']


# ---- QUERYSET USAGE ----
# Filter by status using the enum
published = BlogPost.objects.filter(status=BlogPost.Status.PUBLISHED)
drafts    = BlogPost.objects.filter(status=BlogPost.Status.DRAFT)

# Exclude archived from public feed
feed = BlogPost.objects.exclude(status=BlogPost.Status.ARCHIVED)


# ---- API VIEW USAGE ----
# myapp/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

class PublishPostView(APIView):
    def post(self, request, pk):
        try:
            post = BlogPost.objects.get(pk=pk, author=request.user)
        except BlogPost.DoesNotExist:
            return Response({'error': 'Not found.'}, status=404)

        try:
            post.publish()
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'status': post.status, 'published_at': post.published_at})`,
      outputExplanation: "TextChoices generates status.choices (list of (value, label) tuples for Django forms), status.values (list of stored strings), and status.labels (list of human-readable labels). The VALID_TRANSITIONS dict defines a DAG of allowed state changes. transition_to() enforces guards before mutating self.status. Each specific method (publish(), archive()) calls transition_to() then saves only the changed fields with update_fields for efficiency.",
      commonMistakes: [
        "Validating transitions in save() — save() is called for every field update, not just status changes. Transitions should be validated in named methods, not in save().",
        "Not using update_fields in save() calls within transition methods — without it Django saves all fields, causing race conditions with concurrent updates to other fields.",
        "Comparing status strings directly ('draft' == post.status) instead of using the enum (BlogPost.Status.DRAFT == post.status) — if you rename the choice value, string comparisons silently break.",
        "Not indexing the status field — filtering published posts on a large table without an index causes full table scans."
      ],
      interviewNotes: [
        "TextChoices generates a Python enum with .label, .value attributes — use BlogPost.Status.PUBLISHED.label to get the human-readable string.",
        "django-fsm provides @transition decorator with source/target enforcement, conditions, and on_error hooks — use it for complex multi-step workflows.",
        "update_fields=['status', 'updated_at'] generates UPDATE ... SET status=..., updated_at=... WHERE id=... — much more efficient and concurrency-safe than saving all fields.",
        "State machines in save() are an anti-pattern — save() is called by serializers, admin, and fixtures without transition context.",
        "Storing published_at separately (instead of deriving it from status change time) preserves the exact publication timestamp even if the post is unpublished and re-published."
      ],
      whenToUse: "Any model with a lifecycle: orders (pending/paid/shipped/delivered), posts (draft/review/published), tickets (open/in_progress/resolved/closed).",
      whenNotToUse: "If you have more than 5-6 states with complex guard conditions and side effects — use django-fsm or an explicit workflow engine."
    },
    tags: ["models", "status", "choices", "fsm", "patterns"],
    order: 11,
    estimatedMinutes: 18
  },

  {
    id: "audit-model-pattern",
    title: "Audit Trail / CreatedBy-UpdatedBy Pattern",
    slug: "audit-model-pattern",
    category: "production",
    subcategory: "model-patterns",
    difficulty: "intermediate",
    description: "Track who created and last modified a record using thread-local middleware to capture the current request user.",
    content: {
      explanation: "Many production systems need to know not just when a record changed but who changed it. The created_by and updated_by foreign keys capture this. The challenge is that model.save() does not have access to the HTTP request object.\n\nThe thread-local middleware pattern stores the current user on a threading.local() object during the request cycle. The model's save() method reads from this thread-local. This is the simplest approach and works without changing any existing save() call sites.\n\nAlternative approaches: pass the user explicitly to save() (requires all call sites to be updated), use django-simple-history (stores a full history of every field change), or use django-auditlog. The thread-local pattern is pragmatic for simple created_by/updated_by tracking.",
      realExample: "A financial records system audits every change to a Transaction model. The admin and API views both save transactions — the thread-local approach means both paths automatically track the user without any call-site changes.",
      codeExample: `# core/middleware.py
import threading

_thread_locals = threading.local()


def get_current_user():
    """Return the currently logged-in user for this thread, or None."""
    return getattr(_thread_locals, 'user', None)


class CurrentUserMiddleware:
    """
    Stores the current user in thread-local storage so models can access it
    in save() without an explicit request argument.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        _thread_locals.user = getattr(request, 'user', None)
        try:
            response = self.get_response(request)
        finally:
            # Always clean up — avoids thread reuse leaking previous request's user
            _thread_locals.user = None
        return response


# settings.py
MIDDLEWARE = [
    # ... other middleware ...
    'core.middleware.CurrentUserMiddleware',
]


# core/models.py
from django.db import models
from django.conf import settings
from core.middleware import get_current_user


class AuditMixin(models.Model):
    """
    Abstract mixin adding created_by and updated_by FKs.
    Requires CurrentUserMiddleware to be active.
    """
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='%(class)s_created',
        editable=False
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='%(class)s_updated',
        editable=False
    )

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        user = get_current_user()
        # Only set created_by on first save (no PK yet)
        if not self.pk and user and user.is_authenticated:
            self.created_by = user
        if user and user.is_authenticated:
            self.updated_by = user
        super().save(*args, **kwargs)


# finance/models.py
from core.models import AuditMixin, TimeStampedModel


class Transaction(AuditMixin, TimeStampedModel):
    amount      = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.CharField(max_length=255)
    reference   = models.CharField(max_length=100, unique=True)

    class Meta(TimeStampedModel.Meta):
        ordering = ['-created_at']

    def __str__(self):
        return f"#{self.reference} — {self.amount}"


# ---- USAGE — no changes to existing save() calls ----
# In a view:
transaction = Transaction(amount=99.99, description='Payment', reference='TXN001')
transaction.save()
# created_by and updated_by are set automatically from thread-local

# In a serializer:
class TransactionSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model  = Transaction
        fields = ['id', 'amount', 'description', 'created_by_name', 'created_at']

    def get_created_by_name(self, obj):
        return obj.created_by.get_full_name() if obj.created_by else 'System'


# ---- ADMIN DISPLAY ----
from django.contrib import admin

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display  = ['reference', 'amount', 'created_by', 'updated_by', 'created_at']
    readonly_fields = ['created_by', 'updated_by', 'created_at', 'updated_at']`,
      outputExplanation: "CurrentUserMiddleware stores request.user in a thread-local variable at the start of every request and clears it in a finally block after the response. AuditMixin.save() reads from thread-local via get_current_user(). Because it checks not self.pk, created_by is set only on INSERT. updated_by is set on every save(). The finally block prevents user data leaking into other requests when threads are reused by the WSGI server.",
      commonMistakes: [
        "Not clearing thread-locals in a finally block — WSGI servers (Gunicorn, uWSGI) reuse threads. Without cleanup, one request's user leaks into the next request's thread.",
        "Using thread-locals with async views or Celery tasks — thread-locals are per-thread; async views may share threads and Celery workers have no HTTP request context.",
        "Not using related_name='%(class)s_created' — without it, two models inheriting AuditMixin will clash on the reverse accessor name.",
        "Setting created_by on every save() instead of only on INSERT — wrapping in if not self.pk is required."
      ],
      interviewNotes: [
        "Thread-local storage is per-OS-thread — safe for synchronous WSGI but not for async (ASGI) views where coroutines share threads via the event loop.",
        "django-simple-history stores a complete snapshot of every model instance on every change — much richer audit trail than just created_by/updated_by.",
        "SET_NULL on the FK means deleting a user does not delete their transactions — audit trail preserved.",
        "related_name='%(class)s_created' uses Django's app_label/class interpolation for abstract model reverse names — prevents clashes.",
        "For Celery tasks, pass the user PK explicitly to the task and look up the user inside the task function."
      ],
      whenToUse: "Any system requiring accountability: financial records, medical data, compliance-driven applications, admin interfaces with multiple editors.",
      whenNotToUse: "High-throughput write-heavy systems where the thread-local lookup adds latency, or async Django (ASGI) applications where thread-locals are unreliable."
    },
    tags: ["models", "audit", "thread-local", "middleware", "patterns"],
    order: 12,
    estimatedMinutes: 18
  },

  {
    id: "singleton-model",
    title: "Singleton Model Pattern",
    slug: "singleton-model",
    category: "production",
    subcategory: "model-patterns",
    difficulty: "intermediate",
    description: "Ensure only one row exists for site-wide configuration using a singleton model with a load() classmethod and admin-only change view.",
    content: {
      explanation: "Some data should have exactly one database row: site settings, global feature flags, maintenance mode, or SMTP configuration. The singleton pattern enforces this by always saving with pk=1 (overriding save()) and providing a load() classmethod that creates the row with defaults if it doesn't exist.\n\nThe Django admin needs special handling: remove the 'add' view (has_add_permission returns False), redirect the changelist directly to the change form. This makes the admin feel like a settings page rather than a list of objects.",
      realExample: "A SaaS site has a SiteConfiguration model with fields for site_name, maintenance_mode, contact_email, and max_free_users. The marketing team edits this in the admin. The application reads SiteConfiguration.load() on every request (with caching).",
      codeExample: `# config/models.py
from django.db import models
from django.core.cache import cache


class SiteConfiguration(models.Model):
    CACHE_KEY = 'site_configuration'
    CACHE_TTL = 300   # 5 minutes

    site_name        = models.CharField(max_length=100, default='My Site')
    maintenance_mode = models.BooleanField(default=False)
    contact_email    = models.EmailField(default='admin@example.com')
    max_free_users   = models.PositiveIntegerField(default=100)
    banner_message   = models.CharField(max_length=500, blank=True)
    updated_at       = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name        = 'Site Configuration'
        verbose_name_plural = 'Site Configuration'

    def __str__(self):
        return 'Site Configuration'

    def save(self, *args, **kwargs):
        # Always use pk=1 — enforces a single row in the DB
        self.pk = 1
        super().save(*args, **kwargs)
        # Invalidate cache on every save
        cache.delete(self.CACHE_KEY)

    def delete(self, *args, **kwargs):
        # Prevent deletion of the singleton row
        pass

    @classmethod
    def load(cls) -> 'SiteConfiguration':
        """Return the singleton instance, creating it with defaults if needed."""
        obj = cache.get(cls.CACHE_KEY)
        if obj is None:
            obj, _ = cls.objects.get_or_create(pk=1)
            cache.set(cls.CACHE_KEY, obj, timeout=cls.CACHE_TTL)
        return obj


# config/admin.py
from django.contrib import admin
from django.urls import reverse
from django.http import HttpResponseRedirect
from config.models import SiteConfiguration


@admin.register(SiteConfiguration)
class SiteConfigurationAdmin(admin.ModelAdmin):
    # Show all fields on the change form
    fieldsets = [
        ('General', {
            'fields': ['site_name', 'contact_email', 'banner_message']
        }),
        ('Access Control', {
            'fields': ['maintenance_mode', 'max_free_users']
        }),
    ]
    readonly_fields = ['updated_at']

    def has_add_permission(self, request):
        """Prevent creating a second row."""
        return False

    def has_delete_permission(self, request, obj=None):
        """Prevent deleting the row."""
        return False

    def changelist_view(self, request, extra_context=None):
        """Redirect changelist to the single change form."""
        config = SiteConfiguration.load()
        return HttpResponseRedirect(
            reverse('admin:config_siteconfiguration_change', args=[config.pk])
        )


# ---- USAGE IN VIEWS ----
def index(request):
    config = SiteConfiguration.load()   # cached — fast
    if config.maintenance_mode:
        return render(request, 'maintenance.html')
    return render(request, 'index.html', {'site_name': config.site_name})


# ---- MIDDLEWARE APPROACH (alternative) ----
# For very frequently-read config, load once in middleware:
class SiteConfigMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.site_config = SiteConfiguration.load()
        return self.get_response(request)`,
      outputExplanation: "save() sets self.pk = 1 before calling super().save(), which means every save() call either INSERTs pk=1 (first time) or UPDATEs pk=1 (subsequent times). delete() is a no-op — the row cannot be removed. load() uses get_or_create(pk=1) to return the singleton, creating it with field defaults if it does not yet exist. Cache wrapping means most requests never hit the database. The admin changelist redirect makes the UI feel like a settings page.",
      commonMistakes: [
        "Not invalidating the cache in save() — cached stale config serves old values after admin updates.",
        "Not overriding delete() — a careless admin action or ORM call can delete the singleton, causing get() calls to raise DoesNotExist.",
        "Using SiteConfiguration.objects.get(pk=1) instead of load() — raises DoesNotExist if the row has not been created yet.",
        "Not setting verbose_name_plural to the same value as verbose_name — the admin shows 'Site Configurations' in the breadcrumb, implying multiple rows exist."
      ],
      interviewNotes: [
        "Setting self.pk = 1 in save() implements INSERT OR UPDATE (upsert) semantics using Django's PK-existence check.",
        "get_or_create(pk=1) is safe to call concurrently — the unique PK constraint prevents duplicate row creation even under race conditions.",
        "Cache wrapping in load() is essential — reading from DB on every request for configuration data is wasteful.",
        "django-solo is a third-party library implementing this pattern with additional safety checks and admin integration.",
        "For environment-specific config (DB credentials, API keys), use environment variables or django-environ — the singleton model is for user-editable runtime settings."
      ],
      whenToUse: "Site-wide settings that change infrequently and need a UI for non-technical users: maintenance mode, feature flags, branding, SMTP settings.",
      whenNotToUse: "Configuration that changes per-environment (staging vs production) — use environment variables. Configuration that changes per-tenant — use a per-organization model."
    },
    tags: ["models", "singleton", "configuration", "admin", "cache"],
    order: 13,
    estimatedMinutes: 15
  },

  {
    id: "ordered-model",
    title: "Ordered / Sortable Model",
    slug: "ordered-model",
    category: "production",
    subcategory: "model-patterns",
    difficulty: "intermediate",
    description: "Implement user-defined ordering with a position field, swap methods using F expressions, and a custom ordered Manager.",
    content: {
      explanation: "Many UIs need drag-and-drop ordering: menu items, dashboard widgets, FAQ questions, gallery images. The pattern uses a PositiveIntegerField (order or position) and methods to move items up or down by swapping adjacent values.\n\nUsing Django's F expression for the swap is critical — it lets you read and write the position atomically in the database without two round-trips. Without F expressions you need a temporary value to avoid unique constraint violations during the swap.\n\nThe custom Manager orders by the position field by default, so all querysets return records in the correct display order without explicit order_by() calls.",
      realExample: "A navigation menu admin lets editors drag menu items to reorder them. Each drag triggers a PATCH request with the new position. The backend uses move_to(new_position) to shift surrounding items and update the dragged item.",
      codeExample: `# menus/models.py
from django.db import models, transaction
from django.db.models import F


class OrderedManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().order_by('order')


class MenuItem(models.Model):
    label     = models.CharField(max_length=100)
    url       = models.CharField(max_length=200)
    order     = models.PositiveIntegerField(default=0, db_index=True)
    is_active = models.BooleanField(default=True)
    parent    = models.ForeignKey(
        'self', on_delete=models.CASCADE, null=True, blank=True,
        related_name='children'
    )

    objects = OrderedManager()

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.order}. {self.label}"

    def move_up(self):
        """Swap this item with the one above it (lower order value)."""
        try:
            previous = (
                MenuItem.objects
                .filter(order__lt=self.order, parent=self.parent)
                .order_by('-order')
                .first()
            )
        except MenuItem.DoesNotExist:
            return   # already at top

        if previous is None:
            return

        self._swap_order(previous)

    def move_down(self):
        """Swap this item with the one below it (higher order value)."""
        next_item = (
            MenuItem.objects
            .filter(order__gt=self.order, parent=self.parent)
            .order_by('order')
            .first()
        )
        if next_item is None:
            return

        self._swap_order(next_item)

    @transaction.atomic
    def _swap_order(self, other):
        """Atomically swap order values with another item."""
        # Save both current orders
        my_order    = self.order
        other_order = other.order

        # Use a temporary large value to avoid unique constraint violation
        # (if order has unique=True)
        temp = 999999
        MenuItem.objects.filter(pk=self.pk).update(order=temp)
        MenuItem.objects.filter(pk=other.pk).update(order=my_order)
        MenuItem.objects.filter(pk=self.pk).update(order=other_order)

        # Update in-memory
        self.order  = other_order
        other.order = my_order

    def move_to(self, new_position: int):
        """
        Move item to an absolute position, shifting others to make room.
        Uses a gap-based approach — no unique constraint on order required.
        """
        old_position = self.order
        if new_position == old_position:
            return

        with transaction.atomic():
            if new_position < old_position:
                # Moving up: shift items between new and old position DOWN by 1
                MenuItem.objects.filter(
                    order__gte=new_position,
                    order__lt=old_position,
                    parent=self.parent
                ).update(order=F('order') + 1)
            else:
                # Moving down: shift items between old and new position UP by 1
                MenuItem.objects.filter(
                    order__gt=old_position,
                    order__lte=new_position,
                    parent=self.parent
                ).update(order=F('order') - 1)

            self.order = new_position
            self.save(update_fields=['order'])

    @classmethod
    def normalize_order(cls, parent=None):
        """
        Reset order values to 1, 2, 3, ... — call after bulk deletes
        to prevent gaps from growing unbounded.
        """
        items = list(cls.objects.filter(parent=parent))
        for i, item in enumerate(items, start=1):
            if item.order != i:
                cls.objects.filter(pk=item.pk).update(order=i)


# ---- USAGE ----
# Create items with order
MenuItem.objects.create(label='Home',    url='/',        order=1)
MenuItem.objects.create(label='About',   url='/about/',  order=2)
MenuItem.objects.create(label='Contact', url='/contact/', order=3)

# All queries return in order automatically
menu = MenuItem.objects.filter(is_active=True)

# Move 'Contact' to position 1
contact = MenuItem.objects.get(label='Contact')
contact.move_to(1)
# Result: Contact=1, Home=2, About=3`,
      outputExplanation: "F('order') + 1 increments the order column in a single SQL UPDATE without reading the value into Python — both safe for concurrent access and efficient. move_to() uses range-based UPDATEs to shift surrounding items, then sets the new position in a single save(). transaction.atomic() ensures the swap is all-or-nothing. normalize_order() prevents order values from drifting far from 1,2,3,... after many insertions and deletions.",
      commonMistakes: [
        "Not wrapping swap operations in transaction.atomic() — a crash between the two updates leaves the data in an inconsistent state.",
        "Adding unique=True to the order field — makes swaps very complex because two items cannot temporarily share the same order value.",
        "Not filtering by parent when getting the previous/next item — items from different groups get mixed in the ordering.",
        "Not normalizing order values periodically — after many reorders and deletes, values can become large sparse numbers causing integer overflow on repeated increment."
      ],
      interviewNotes: [
        "F('order') + 1 is a single SQL UPDATE without a Python read — safe for concurrent updates.",
        "django-ordered-model is a production-grade library implementing this pattern with additional features like group ordering.",
        "Avoid unique=True on the order field — it makes atomic swaps much harder. Allow duplicates and normalize when needed.",
        "For large reorder operations (drag item from position 1 to 500), the range-based shift updates many rows. Consider a fractional ordering scheme (order as FLOAT, use midpoints) for large lists.",
        "transaction.atomic() with select_for_update() prevents concurrent reorder operations from corrupting the order sequence."
      ],
      whenToUse: "Any UI with user-defined ordering: navigation menus, FAQ lists, gallery images, dashboard widgets, playlist tracks.",
      whenNotToUse: "Very large ordered lists (thousands of items) where range-based shifts are expensive. Use fractional ordering (Jira's approach) or a linked-list model instead."
    },
    tags: ["models", "ordering", "sortable", "F-expression", "patterns"],
    order: 14,
    estimatedMinutes: 18
  },

  {
    id: "slug-model-pattern",
    title: "Auto-Slug Pattern",
    slug: "slug-model-pattern",
    category: "production",
    subcategory: "model-patterns",
    difficulty: "beginner",
    description: "Auto-generate URL slugs from titles with duplicate handling using slugify and a pre_save signal.",
    content: {
      explanation: "URL slugs are human-readable URL segments derived from a title: 'My First Post' becomes 'my-first-post'. Django's slugify() function handles lowercasing, replacing spaces with hyphens, and stripping invalid characters.\n\nDuplicate slugs must be handled. The simplest approach: if 'my-post' exists, try 'my-post-2', then 'my-post-3', and so on. The duplicate check requires a database query per attempt, so keep slugs reasonably unique by including a counter only when needed.\n\nUsing a pre_save signal (instead of overriding save()) keeps the slug logic in one place and works regardless of how save() is called. Using allow_unicode=True in slugify() supports non-ASCII titles in multilingual apps.",
      realExample: "A blog where authors post frequently. Two authors both publish articles titled 'Django Tips'. The slug generator creates 'django-tips' for the first and 'django-tips-2' for the second, both with stable, unique URLs.",
      codeExample: `# blog/models.py
from django.db import models
from django.utils.text import slugify


class Post(models.Model):
    title      = models.CharField(max_length=200)
    slug       = models.SlugField(max_length=220, unique=True, blank=True)
    body       = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

    class Meta:
        ordering = ['-created_at']


# blog/signals.py
from django.db.models.signals import pre_save
from django.dispatch import receiver
from django.utils.text import slugify
from blog.models import Post


def generate_unique_slug(model_class, title: str, instance_pk=None) -> str:
    """
    Generate a unique slug for a model instance.
    If 'my-post' exists, tries 'my-post-2', 'my-post-3', etc.
    Excludes the current instance (for updates).
    """
    base_slug = slugify(title)[:200]   # truncate to leave room for suffix
    slug      = base_slug
    counter   = 2

    qs = model_class.objects.filter(slug=slug)
    if instance_pk:
        qs = qs.exclude(pk=instance_pk)

    while qs.exists():
        slug = f"{base_slug}-{counter}"
        counter += 1
        qs = model_class.objects.filter(slug=slug)
        if instance_pk:
            qs = qs.exclude(pk=instance_pk)

    return slug


@receiver(pre_save, sender=Post)
def set_post_slug(sender, instance, **kwargs):
    """
    Auto-set slug from title before saving.
    Only regenerates if title changed or slug is empty.
    """
    if not instance.slug:
        # New post — always generate slug
        instance.slug = generate_unique_slug(Post, instance.title, instance.pk)
    elif instance.pk:
        # Existing post — only update slug if title changed
        try:
            original = Post.objects.get(pk=instance.pk)
            if original.title != instance.title:
                # Title changed — update slug
                instance.slug = generate_unique_slug(Post, instance.title, instance.pk)
        except Post.DoesNotExist:
            instance.slug = generate_unique_slug(Post, instance.title, instance.pk)


# blog/apps.py
from django.apps import AppConfig

class BlogConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'blog'

    def ready(self):
        import blog.signals   # connect the signal


# ---- USAGE ----
post1 = Post.objects.create(title='Django Tips', body='...')
print(post1.slug)   # 'django-tips'

post2 = Post.objects.create(title='Django Tips', body='...')
print(post2.slug)   # 'django-tips-2'

post3 = Post.objects.create(title='Django Tips', body='...')
print(post3.slug)   # 'django-tips-3'

# URLs
# urls.py
from django.urls import path
urlpatterns = [
    path('posts/<slug:slug>/', PostDetailView.as_view(), name='post-detail'),
]

# View lookup by slug
post = Post.objects.get(slug='django-tips')


# ---- PERFORMANCE NOTE ----
# The while qs.exists() loop hits the DB once per attempt.
# For a blog this is fine — slugs rarely conflict more than 2-3 times.
# For high-collision scenarios (e.g., common titles), append a short UUID:
import uuid
def generate_unique_slug_fast(title: str) -> str:
    base = slugify(title)[:180]
    suffix = uuid.uuid4().hex[:6]   # 6 hex chars = 16M combinations
    return f"{base}-{suffix}"`,
      outputExplanation: "The pre_save signal fires before every INSERT and UPDATE. The signal handler checks whether the slug needs to be generated (empty) or updated (title changed). generate_unique_slug() uses a while loop that checks exists() (a cheap COUNT query) and increments a counter until a unique slug is found. Truncating base_slug to 200 characters leaves room for the '-N' suffix within the SlugField's max_length of 220.",
      commonMistakes: [
        "Not truncating base_slug before appending a counter suffix — 'a-very-long-title...' + '-123' can exceed the SlugField max_length and truncation loses the counter.",
        "Generating the slug in __str__ or a property — this does not persist the slug to the database.",
        "Not connecting the signal in AppConfig.ready() — the signal is never connected if signals.py is never imported.",
        "Using save() override instead of pre_save signal — override save() only if you need the slug during the save transaction (e.g., to set another field from it)."
      ],
      interviewNotes: [
        "pre_save fires for both INSERT and UPDATE — check instance.pk to distinguish new vs existing objects.",
        "slugify('Héllo Wörld') with allow_unicode=True returns 'héllo-wörld'. Without it, non-ASCII characters are dropped.",
        "The uniqueness check loop is N+1 queries in the worst case — avoid in bulk_create scenarios. Pre-compute slugs in Python if creating many records.",
        "django-autoslug is a third-party field that handles this pattern with additional options like populate_from and unique_with.",
        "Never auto-update slugs on title changes in production — existing links and bookmarks break. Only auto-set on creation."
      ],
      whenToUse: "Any model with a title that needs a human-readable URL: blog posts, products, categories, FAQ entries.",
      whenNotToUse: "Models where the slug should never change after creation (SEO permalinks). In those cases, generate the slug only on the first save and prevent subsequent changes."
    },
    tags: ["models", "slug", "url", "slugify", "signal"],
    order: 15,
    estimatedMinutes: 15
  },

  // ─── PAGINATION (16–20) ─────────────────────────────────────────────────────
  {
    id: "page-number-pagination",
    title: "PageNumberPagination (DRF)",
    slug: "page-number-pagination",
    category: "production",
    subcategory: "pagination",
    difficulty: "beginner",
    description: "DRF's PageNumberPagination: page size, dynamic page_size_query_param, max_page_size, and integration with ListAPIView.",
    content: {
      explanation: "PageNumberPagination is the most familiar pagination style: the client requests ?page=2&page_size=20. DRF wraps results in an envelope with count (total rows), next (URL of next page), previous (URL of previous page), and results (the current page data).\n\nConfigure it globally via DEFAULT_PAGINATION_CLASS and PAGE_SIZE in REST_FRAMEWORK settings, or subclass PageNumberPagination to set page_size, page_size_query_param, and max_page_size per endpoint. Allowing the client to control page_size is useful for flexible UIs but requires max_page_size to prevent clients from requesting all rows in one call.",
      realExample: "An admin table shows 50 rows per page by default. The client can request ?page_size=10 for a mobile view or ?page_size=100 for export. The max_page_size=200 cap prevents a client from fetching all 50,000 records in one request.",
      codeExample: `# settings.py
REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

# myapp/pagination.py
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class StandardResultsPagination(PageNumberPagination):
    page_size             = 20
    page_size_query_param = 'page_size'   # ?page_size=50
    max_page_size         = 200
    page_query_param      = 'page'         # ?page=2 (default)

    def get_paginated_response(self, data):
        return Response({
            'count':       self.page.paginator.count,
            'total_pages': self.page.paginator.num_pages,
            'next':        self.get_next_link(),
            'previous':    self.get_previous_link(),
            'results':     data,
        })


class LargeResultsPagination(PageNumberPagination):
    page_size    = 100
    max_page_size = 1000


# myapp/views.py
from rest_framework.generics import ListAPIView
from rest_framework.viewsets import ModelViewSet
from myapp.models import Product
from myapp.serializers import ProductSerializer
from myapp.pagination import StandardResultsPagination, LargeResultsPagination


class ProductListView(ListAPIView):
    queryset         = Product.objects.all().order_by('-created_at')
    serializer_class = ProductSerializer
    pagination_class = StandardResultsPagination


class ProductViewSet(ModelViewSet):
    queryset         = Product.objects.all()
    serializer_class = ProductSerializer
    pagination_class = StandardResultsPagination

    def get_queryset(self):
        qs = super().get_queryset()
        category = self.request.query_params.get('category')
        if category:
            qs = qs.filter(category=category)
        return qs


# Disable pagination for a specific view:
class AllProductsView(ListAPIView):
    queryset         = Product.objects.all()
    serializer_class = ProductSerializer
    pagination_class = None   # no pagination — returns all rows


# ---- EXAMPLE RESPONSE ----
# GET /api/products/?page=2&page_size=5
# {
#   "count": 47,
#   "total_pages": 10,
#   "next": "http://api.example.com/api/products/?page=3&page_size=5",
#   "previous": "http://api.example.com/api/products/?page=1&page_size=5",
#   "results": [
#     {"id": 6, "name": "Widget B", ...},
#     {"id": 7, "name": "Widget C", ...},
#     ...
#   ]
# }

# ---- MANUAL PAGINATION IN A VIEW ----
from rest_framework.views import APIView

class ManualProductListView(APIView):
    def get(self, request):
        queryset   = Product.objects.all().order_by('-created_at')
        paginator  = StandardResultsPagination()
        page       = paginator.paginate_queryset(queryset, request, view=self)
        serializer = ProductSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)`,
      outputExplanation: "paginate_queryset(queryset, request) slices the queryset using Python list slicing based on the page and page_size parameters. It returns None if pagination is not applicable (e.g., no page parameter and PAGE_SIZE is not set). get_paginated_response(data) wraps the serialized data in the envelope. count is retrieved via queryset.count() — a separate SQL COUNT query. Always order the queryset before paginating to ensure consistent page contents.",
      commonMistakes: [
        "Not ordering the queryset before paginating — without ORDER BY, PostgreSQL returns rows in unpredictable order and page 2 may overlap with page 1.",
        "Allowing unlimited page_size without max_page_size — a client requesting ?page_size=1000000 fetches the entire table in one call.",
        "Returning a plain list from a paginated view (bypassing get_paginated_response) — the client gets no count, next, or previous links.",
        "Using PageNumberPagination on large tables — page=500&page_size=20 requires OFFSET 9980, which scans 9980 rows before returning 20. Use CursorPagination for deep pages."
      ],
      interviewNotes: [
        "count triggers a separate SQL COUNT(*) query — on very large tables this can be expensive. Consider caching the count.",
        "OFFSET N scans and discards N rows — for page 1000 this is slow. Switch to CursorPagination for datasets where deep paging is common.",
        "page_size_query_param must be set explicitly on the subclass — the base class has it as None (not configurable by clients).",
        "get_paginated_response returns a Response with the envelope — you must use it (not just Response(serializer.data)) to include count/next/previous.",
        "pagination_class = None disables pagination on a per-view basis regardless of global settings."
      ],
      whenToUse: "Admin tables, search results, any paginated list where the user can navigate to an arbitrary page number.",
      whenNotToUse: "Infinite scroll feeds, real-time data, or very large datasets where OFFSET performance is unacceptable. Use CursorPagination instead."
    },
    tags: ["pagination", "drf", "page-number", "api", "list"],
    order: 16,
    estimatedMinutes: 12
  },

  {
    id: "limit-offset-pagination",
    title: "LimitOffsetPagination (DRF)",
    slug: "limit-offset-pagination",
    category: "production",
    subcategory: "pagination",
    difficulty: "beginner",
    description: "DRF's LimitOffsetPagination: limit and offset query params, default_limit, max_limit, and when to use it over page-number pagination.",
    content: {
      explanation: "LimitOffsetPagination uses ?limit=20&offset=40 — 'return 20 items starting from item 40'. This gives clients exact control over which rows they fetch. It maps directly to SQL LIMIT 20 OFFSET 40.\n\nAdvantage over PageNumberPagination: client can request any arbitrary window without knowing the page size. Disadvantage: same OFFSET performance problem — large offsets require scanning and discarding many rows. Best for small-to-medium datasets or when clients need fine-grained control over the window.",
      realExample: "A REST API for a data pipeline consumer fetches records in variable-size batches depending on available processing capacity. The consumer requests ?limit=500&offset=2000 to skip already-processed records.",
      codeExample: `# settings.py
REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.LimitOffsetPagination',
    'PAGE_SIZE': 20,   # used as default_limit
}

# myapp/pagination.py
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.response import Response


class StandardLimitOffsetPagination(LimitOffsetPagination):
    default_limit = 20      # ?limit= not provided → use 20
    max_limit     = 500     # ?limit=10000 → capped at 500
    limit_query_param  = 'limit'    # default
    offset_query_param = 'offset'   # default

    def get_paginated_response(self, data):
        return Response({
            'count':    self.count,
            'limit':    self.limit,
            'offset':   self.offset,
            'next':     self.get_next_link(),
            'previous': self.get_previous_link(),
            'results':  data,
        })


# myapp/views.py
from rest_framework.generics import ListAPIView
from myapp.models import LogEntry
from myapp.serializers import LogEntrySerializer
from myapp.pagination import StandardLimitOffsetPagination


class LogEntryListView(ListAPIView):
    queryset         = LogEntry.objects.all().order_by('-timestamp')
    serializer_class = LogEntrySerializer
    pagination_class = StandardLimitOffsetPagination


# ---- RESPONSE EXAMPLE ----
# GET /api/logs/?limit=10&offset=20
# {
#   "count": 1543,
#   "limit": 10,
#   "offset": 20,
#   "next": "http://api.example.com/api/logs/?limit=10&offset=30",
#   "previous": "http://api.example.com/api/logs/?limit=10&offset=10",
#   "results": [...]
# }

# ---- COMPARISON: PageNumber vs LimitOffset ----
# PageNumber: ?page=3&page_size=10  → LIMIT 10 OFFSET 20
# LimitOffset: ?limit=10&offset=20  → LIMIT 10 OFFSET 20
# Both generate identical SQL — the difference is the client API, not the DB query.

# ---- WHEN OFFSET IS SLOW ----
# EXPLAIN ANALYZE SELECT * FROM logs ORDER BY timestamp DESC LIMIT 10 OFFSET 50000;
# This scans 50,010 rows and discards the first 50,000 — O(OFFSET) cost.
# Solution: keyset pagination (use WHERE timestamp < :last_seen_timestamp)`,
      outputExplanation: "LimitOffsetPagination slices the queryset with queryset[offset:offset+limit]. The count comes from a separate COUNT(*) query. next and previous links are constructed by adjusting the offset by the limit. If offset=0, previous is None. If offset+limit >= count, next is None.",
      commonMistakes: [
        "Not setting max_limit — a client requesting ?limit=999999 fetches all rows and crashes the server.",
        "Not ordering the queryset — without ORDER BY, rows on page N may overlap with page N-1 as rows are inserted.",
        "Using LimitOffsetPagination for deep pagination on large tables — OFFSET 1000000 is just as slow as PageNumber page=50000.",
        "Confusing offset with page number — offset is the number of rows to skip, not the page number. Page 3 with limit 10 is offset=20."
      ],
      interviewNotes: [
        "LimitOffset and PageNumber generate identical SQL — the difference is only in the URL parameter interface.",
        "OFFSET N causes the DB to read and discard N rows — performance degrades linearly with offset on large tables.",
        "For cursor-based alternatives: WHERE id > :last_id ORDER BY id LIMIT 20 — constant time regardless of position.",
        "max_limit is enforced by DRF but the client can still hit the server with offset=999999999 (scanning all rows). Consider a max_offset cap.",
        "count triggers a separate COUNT query — cache it if the total count is expensive on your table."
      ],
      whenToUse: "APIs where clients need flexible window control, data pipelines, or any case where the client knows exactly which offset to start from.",
      whenNotToUse: "Deep pagination on large tables, real-time feeds, or infinite scroll. Use CursorPagination for those."
    },
    tags: ["pagination", "drf", "limit-offset", "api"],
    order: 17,
    estimatedMinutes: 10
  },

  {
    id: "cursor-pagination",
    title: "CursorPagination (DRF)",
    slug: "cursor-pagination",
    category: "production",
    subcategory: "pagination",
    difficulty: "advanced",
    description: "DRF's CursorPagination: consistent results during inserts, opaque cursor tokens, ordering requirements, and use cases for infinite scroll.",
    content: {
      explanation: "CursorPagination uses an opaque, signed cursor token instead of a page number or offset. The cursor encodes the position in the dataset. Instead of OFFSET N, the query uses WHERE created_at < :cursor_value ORDER BY created_at — this is constant-time regardless of how deep into the dataset you are.\n\nKey property: consistent results. With PageNumberPagination, a new record inserted on page 1 pushes all subsequent records down — a record that was item 20 (page 2, item 0) moves to item 21 (page 2, item 1), and item 20 on the new page 2 is actually the old item 19. This causes missing or duplicate items. CursorPagination prevents this because the cursor anchors to a specific record, not a row count.\n\nTradeoffs: no random access by page number (no 'jump to page 5'), no total count (prohibitively expensive with keyset pagination), and the ordering field must be unique or have a unique secondary sort.",
      realExample: "A Twitter-style feed uses CursorPagination. As new tweets are posted while the user scrolls, cursor pagination ensures they never see a tweet twice or miss a tweet. The opaque cursor in the next URL handles the position.",
      codeExample: `# myapp/pagination.py
from rest_framework.pagination import CursorPagination
from rest_framework.response import Response


class FeedCursorPagination(CursorPagination):
    page_size     = 20
    ordering      = '-created_at'   # must be on an indexed field; reverse chron
    cursor_query_param = 'cursor'

    def get_paginated_response(self, data):
        return Response({
            'next':     self.get_next_link(),
            'previous': self.get_previous_link(),
            'results':  data,
            # Note: no 'count' — COUNT(*) is not performed
        })


class CommentCursorPagination(CursorPagination):
    page_size = 50
    # Multi-field ordering — must be unique in combination
    ordering  = ('-created_at', 'id')   # id breaks ties


# myapp/views.py
from rest_framework.generics import ListAPIView
from myapp.models import Tweet, Comment
from myapp.serializers import TweetSerializer, CommentSerializer
from myapp.pagination import FeedCursorPagination, CommentCursorPagination


class TweetFeedView(ListAPIView):
    serializer_class = TweetSerializer
    pagination_class = FeedCursorPagination

    def get_queryset(self):
        return (
            Tweet.objects
            .filter(user__in=self.request.user.following.all())
            .select_related('user')
            .order_by('-created_at')   # must match pagination ordering
        )


class CommentListView(ListAPIView):
    serializer_class = CommentSerializer
    pagination_class = CommentCursorPagination

    def get_queryset(self):
        return (
            Comment.objects
            .filter(post_id=self.kwargs['post_pk'])
            .select_related('author')
            .order_by('-created_at', 'id')
        )


# ---- HOW THE CURSOR WORKS (internal) ----
# The cursor is a base64-encoded, signed JSON payload:
# {"position": "2024-01-15T10:30:00Z", "reverse": false}
#
# The query becomes:
# SELECT * FROM tweet WHERE created_at < '2024-01-15T10:30:00Z'
# ORDER BY created_at DESC LIMIT 21  (fetches one extra to detect has_next)
#
# This uses an index seek — O(1) regardless of how many records came before.

# ---- RESPONSE EXAMPLE ----
# GET /api/feed/
# {
#   "next": "http://api.example.com/api/feed/?cursor=cD0yMDI0LTAxLTE1...",
#   "previous": null,
#   "results": [{"id": 100, "text": "Hello", ...}, ...]
# }
# GET /api/feed/?cursor=cD0yMDI0LTAxLTE1...
# {
#   "next": "http://api.example.com/api/feed/?cursor=cD0yMDI0LTAxLTE0...",
#   "previous": "http://api.example.com/api/feed/?cursor=cD0yMDI0LTAxLTE2...",
#   "results": [...]
# }`,
      outputExplanation: "The cursor encodes the value of the ordering field at the boundary between pages. On subsequent requests, CursorPagination generates a WHERE clause that filters results after (or before, for previous) that boundary value. DRF fetches page_size + 1 results — if N+1 rows are returned, there is a next page. The cursor is base64-encoded and HMAC-signed to prevent tampering.",
      commonMistakes: [
        "Using a non-unique ordering field — if two records share the same created_at, the cursor is ambiguous and some records are skipped. Always add a unique secondary sort field (id).",
        "Not matching the view's order_by() with the pagination's ordering attribute — the cursor calculation will be wrong and results will be inconsistent.",
        "Expecting a count in the response — CursorPagination intentionally omits count (it would require a full table scan). If you need a count, run it separately and cache it.",
        "Using CursorPagination for admin tables where users jump to page N — cursor pagination has no random access. Use PageNumberPagination for numbered navigation."
      ],
      interviewNotes: [
        "Cursor pagination generates a WHERE clause instead of OFFSET — O(1) at any depth vs O(N) for OFFSET.",
        "The cursor is base64-encoded and HMAC-signed — clients cannot forge or modify it to access arbitrary positions.",
        "No total count means the client cannot calculate the number of pages — pagination is forward/backward only.",
        "ordering must uniquely identify position — use a unique field or a combination that is unique.",
        "Cursor pagination is the correct choice for real-time feeds, infinite scroll, and any dataset that changes while the user is browsing."
      ],
      whenToUse: "Real-time feeds, infinite scroll, notifications, activity logs — any paginated list where consistency during inserts and deep-page performance matter.",
      whenNotToUse: "Admin tables where users navigate by page number, or any UI where you show a total record count or allow jumping to an arbitrary page."
    },
    tags: ["pagination", "cursor", "drf", "infinite-scroll", "performance"],
    order: 18,
    estimatedMinutes: 15
  },

  {
    id: "custom-pagination-drf",
    title: "Custom DRF Pagination",
    slug: "custom-pagination-drf",
    category: "production",
    subcategory: "pagination",
    difficulty: "advanced",
    description: "Subclass BasePagination to build a fully custom paginator with rich metadata: total_pages, has_next, has_prev, and per-page counts.",
    content: {
      explanation: "DRF's BasePagination requires implementing paginate_queryset(queryset, request, view=None) and get_paginated_response(data). Everything else is up to you. This lets you design any envelope shape your frontend or API contract requires.\n\nCommon additions beyond the standard envelope: total_pages, has_next, has_prev, current_page, items_per_page, and links object. You can also add metadata like query execution time or cache hit indicators.\n\nget_paginated_response_schema() defines the OpenAPI schema for your response — important for auto-generated API documentation.",
      realExample: "A mobile app requires a specific JSON shape from the API team's contract: {data: [], meta: {total, page, per_page, total_pages, has_next, has_prev}}. The custom paginator delivers exactly this shape.",
      codeExample: `# myapp/pagination.py
from rest_framework.pagination import BasePagination
from rest_framework.response import Response
from rest_framework.utils.urls import replace_query_param, remove_query_param
from django.core.paginator import Paginator, EmptyPage, InvalidPage
import math


class MetadataPagination(BasePagination):
    """
    Custom pagination returning a rich metadata envelope:
    {
      "data": [...],
      "meta": {
        "total": 150,
        "page": 2,
        "per_page": 20,
        "total_pages": 8,
        "has_next": true,
        "has_prev": true,
        "from": 21,
        "to": 40
      },
      "links": {
        "first": "...",
        "last": "...",
        "next": "...",
        "prev": "..."
      }
    }
    """
    page_size             = 20
    page_query_param      = 'page'
    page_size_query_param = 'per_page'
    max_page_size         = 500

    def paginate_queryset(self, queryset, request, view=None):
        self.request = request

        # Determine per_page from query param or default
        try:
            per_page = int(request.query_params.get(self.page_size_query_param, self.page_size))
            per_page = min(per_page, self.max_page_size)
            per_page = max(per_page, 1)
        except (ValueError, TypeError):
            per_page = self.page_size

        # Determine page number
        try:
            page_number = int(request.query_params.get(self.page_query_param, 1))
            page_number = max(page_number, 1)
        except (ValueError, TypeError):
            page_number = 1

        self.per_page = per_page
        self.paginator = Paginator(queryset, per_page)
        self.total = self.paginator.count

        try:
            self.page = self.paginator.page(page_number)
        except (EmptyPage, InvalidPage):
            # Return last page if page number is out of range
            self.page = self.paginator.page(self.paginator.num_pages)

        self.current_page  = self.page.number
        self.total_pages   = self.paginator.num_pages

        return list(self.page)

    def get_paginated_response(self, data):
        start = (self.current_page - 1) * self.per_page + 1
        end   = min(start + self.per_page - 1, self.total)

        return Response({
            'data': data,
            'meta': {
                'total':       self.total,
                'page':        self.current_page,
                'per_page':    self.per_page,
                'total_pages': self.total_pages,
                'has_next':    self.page.has_next(),
                'has_prev':    self.page.has_previous(),
                'from':        start if self.total > 0 else 0,
                'to':          end   if self.total > 0 else 0,
            },
            'links': {
                'first': self._get_page_link(1),
                'last':  self._get_page_link(self.total_pages),
                'next':  self._get_page_link(self.page.next_page_number()) if self.page.has_next() else None,
                'prev':  self._get_page_link(self.page.previous_page_number()) if self.page.has_previous() else None,
            },
        })

    def _get_page_link(self, page_number: int) -> str:
        request = self.request
        url = request.build_absolute_uri()
        return replace_query_param(url, self.page_query_param, page_number)

    def get_paginated_response_schema(self, schema):
        """OpenAPI schema definition for drf-spectacular / drf-yasg."""
        return {
            'type': 'object',
            'properties': {
                'data': schema,
                'meta': {
                    'type': 'object',
                    'properties': {
                        'total':       {'type': 'integer'},
                        'page':        {'type': 'integer'},
                        'per_page':    {'type': 'integer'},
                        'total_pages': {'type': 'integer'},
                        'has_next':    {'type': 'boolean'},
                        'has_prev':    {'type': 'boolean'},
                        'from':        {'type': 'integer'},
                        'to':          {'type': 'integer'},
                    }
                },
                'links': {
                    'type': 'object',
                    'properties': {
                        'first': {'type': 'string', 'nullable': True},
                        'last':  {'type': 'string', 'nullable': True},
                        'next':  {'type': 'string', 'nullable': True},
                        'prev':  {'type': 'string', 'nullable': True},
                    }
                }
            }
        }


# myapp/views.py
from rest_framework.generics import ListAPIView
from myapp.models import Product
from myapp.serializers import ProductSerializer
from myapp.pagination import MetadataPagination

class ProductListView(ListAPIView):
    queryset         = Product.objects.all().order_by('-created_at')
    serializer_class = ProductSerializer
    pagination_class = MetadataPagination`,
      outputExplanation: "paginate_queryset() is responsible for slicing the queryset and storing state (current_page, total, per_page) on self for use in get_paginated_response(). It must return a list (not a queryset) of the current page's objects. get_paginated_response() builds the Response with whatever envelope structure you need. Django's built-in Paginator handles the math — total count, page slicing, and has_next/has_previous.",
      commonMistakes: [
        "Returning a QuerySet from paginate_queryset() instead of a list — the serializer receives an unevaluated QuerySet for a single page slice, not the full queryset.",
        "Not storing request on self — get_paginated_response() needs access to request to build absolute URLs.",
        "Computing total (COUNT) in get_paginated_response() instead of paginate_queryset() — paginator.count is cached after the first call but recalculating in the wrong place causes an extra query.",
        "Not implementing get_paginated_response_schema() — API documentation tools (drf-spectacular) show the wrong response schema."
      ],
      interviewNotes: [
        "BasePagination has only two required methods: paginate_queryset and get_paginated_response — everything else is yours to define.",
        "Django's Paginator class handles COUNT, slicing, and has_next/has_prev — reuse it rather than reimplementing.",
        "replace_query_param and remove_query_param from rest_framework.utils.urls are utility functions for building paginated links.",
        "paginator.count triggers a COUNT(*) query — on large tables, cache this value.",
        "The meta envelope shape should match your frontend framework's pagination library contract to avoid adaptation code on the client."
      ],
      whenToUse: "When the standard DRF envelopes do not match your API contract, mobile app SDK requirements, or when you need additional metadata (timing, cache hits, etc.).",
      whenNotToUse: "If the standard PageNumberPagination or CursorPagination meets your requirements — prefer the built-in classes to minimize maintenance."
    },
    tags: ["pagination", "custom", "drf", "api", "metadata"],
    order: 19,
    estimatedMinutes: 20
  },

  {
    id: "django-paginator-class",
    title: "Django Built-in Paginator (Non-DRF)",
    slug: "django-paginator-class",
    category: "production",
    subcategory: "pagination",
    difficulty: "beginner",
    description: "Django's core Paginator class for server-rendered views: page objects, navigation helpers, and usage in FBVs and CBVs.",
    content: {
      explanation: "Django's django.core.paginator.Paginator works independently of DRF and is the right tool for server-rendered HTML views. Paginator(queryset, per_page) creates a paginator. paginator.page(n) returns a Page object for page n. The Page object provides has_next(), has_previous(), next_page_number(), previous_page_number(), start_index(), end_index(), and object_list (the sliced queryset).\n\nEmptyPage is raised when the requested page number is beyond the last page. InvalidPage is the parent of both EmptyPage and PageNotAnInteger. Always catch these to handle invalid ?page= parameters gracefully.\n\nClass-based views using MultipleObjectMixin (ListView) handle pagination automatically when paginate_by is set.",
      realExample: "A product catalog with hundreds of pages of results. The server renders HTML with prev/next links and a page number range. The Paginator handles slicing and the template renders the navigation.",
      codeExample: `# ---- FUNCTION-BASED VIEW ----
# blog/views.py
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.shortcuts import render
from blog.models import Post


def post_list(request):
    posts_qs = Post.objects.filter(status='published').order_by('-created_at')
    paginator = Paginator(posts_qs, 10)   # 10 posts per page

    page_number = request.GET.get('page', 1)
    try:
        page_obj = paginator.page(page_number)
    except PageNotAnInteger:
        # ?page=abc — show first page
        page_obj = paginator.page(1)
    except EmptyPage:
        # ?page=9999 — show last page
        page_obj = paginator.page(paginator.num_pages)

    # Build a page range for template navigation (e.g. [1, 2, 3, 4, 5])
    current   = page_obj.number
    num_pages = paginator.num_pages
    page_range = paginator.get_elided_page_range(current, on_each_side=2, on_ends=1)

    context = {
        'page_obj':   page_obj,
        'page_range': page_range,
        'is_paginated': paginator.num_pages > 1,
    }
    return render(request, 'blog/post_list.html', context)


# blog/templates/blog/post_list.html (snippet)
# {% for post in page_obj %}
#   <article>{{ post.title }}</article>
# {% endfor %}
#
# {% if page_obj.has_previous %}
#   <a href="?page={{ page_obj.previous_page_number }}">Previous</a>
# {% endif %}
#
# {% for num in page_range %}
#   {% if num == page_obj.number %}
#     <strong>{{ num }}</strong>
#   {% elif num == paginator.ELLIPSIS %}
#     ...
#   {% else %}
#     <a href="?page={{ num }}">{{ num }}</a>
#   {% endif %}
# {% endfor %}
#
# {% if page_obj.has_next %}
#   <a href="?page={{ page_obj.next_page_number }}">Next</a>
# {% endif %}


# ---- CLASS-BASED VIEW (ListView with MultipleObjectMixin) ----
from django.views.generic import ListView

class PostListView(ListView):
    model         = Post
    template_name = 'blog/post_list.html'
    context_object_name = 'posts'
    paginate_by   = 10          # enables pagination automatically
    ordering      = ['-created_at']

    def get_queryset(self):
        return Post.objects.filter(status='published').order_by('-created_at')

    # ListView adds to context automatically:
    # 'page_obj'    — Page object for current page
    # 'paginator'   — the Paginator instance
    # 'is_paginated' — bool
    # 'object_list' — alias for 'posts' (context_object_name)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        paginator   = context['paginator']
        page_obj    = context['page_obj']
        context['page_range'] = paginator.get_elided_page_range(
            page_obj.number, on_each_side=2, on_ends=1
        )
        return context


# ---- USEFUL PAGE OBJECT ATTRIBUTES ----
# page_obj.object_list        — the sliced queryset/list for this page
# page_obj.number             — current page number (1-indexed)
# page_obj.has_next()         — bool
# page_obj.has_previous()     — bool
# page_obj.next_page_number() — raises EmptyPage if no next page
# page_obj.previous_page_number() — raises EmptyPage if no previous page
# page_obj.start_index()      — 1-indexed position of first object on page
# page_obj.end_index()        — 1-indexed position of last object on page
# paginator.count             — total object count (COUNT query, cached)
# paginator.num_pages         — total number of pages
# paginator.page_range        — range(1, num_pages + 1)`,
      outputExplanation: "Paginator(queryset, 10) stores a reference to the queryset and per_page count. paginator.page(n) triggers queryset[start:end] — a single SQL query with LIMIT and OFFSET. paginator.count triggers a COUNT(*) query and caches the result on paginator._count. get_elided_page_range() (added in Django 3.2) generates a page range with ellipsis for large page counts: [1, ..., 3, 4, 5, ..., 100].",
      commonMistakes: [
        "Not catching PageNotAnInteger — ?page=abc raises PageNotAnInteger before EmptyPage. Catch the parent InvalidPage to handle both.",
        "Not ordering the queryset — without ORDER BY, different pages may return overlapping records on PostgreSQL.",
        "Using len(posts_qs) to get count — this evaluates the full queryset into memory. Use paginator.count which runs COUNT(*).",
        "Forgetting that page_obj.next_page_number() raises EmptyPage if there is no next page — check has_next() first."
      ],
      interviewNotes: [
        "Paginator is lazy — it only hits the DB when page(n) is called, and then only fetches page_size rows.",
        "paginator.count is cached on _count after the first call — multiple accesses do not cause multiple COUNT queries.",
        "get_elided_page_range() is a Django 3.2+ convenience method — returns a generator with ELLIPSIS sentinels for large page counts.",
        "ListView's paginate_by attribute triggers MultipleObjectMixin.paginate_queryset() which wraps Django's Paginator.",
        "The template receives page_obj (not posts or object_list) for pagination controls — use context_object_name for the data list."
      ],
      whenToUse: "Server-rendered Django views with HTML templates. Any non-DRF view that needs to paginate a list of objects.",
      whenNotToUse: "DRF API views — use DRF's pagination classes which integrate with Response, serializers, and the browsable API."
    },
    tags: ["pagination", "paginator", "views", "cbv", "fbv"],
    order: 20,
    estimatedMinutes: 12
  },

  // ─── LOGGING (21–26) ────────────────────────────────────────────────────────
  {
    id: "django-logging-configuration",
    title: "Django Logging Configuration",
    slug: "django-logging-configuration",
    category: "production",
    subcategory: "logging",
    difficulty: "intermediate",
    description: "Configure Django's LOGGING dict in settings: formatters, handlers, loggers, levels, and using getLogger in application code.",
    content: {
      explanation: "Django uses Python's standard logging module. The LOGGING dict in settings.py configures the entire logging pipeline. It has four sections: version (always 1), disable_existing_loggers (set False to preserve Django's own loggers), formatters (define log message formats), handlers (define destinations: console, file, email), and loggers (map logger names to handlers and levels).\n\nLevel hierarchy: DEBUG < INFO < WARNING < ERROR < CRITICAL. A logger at level WARNING only processes WARNING and above. Handlers also have levels — a message must pass both the logger's level and the handler's level.\n\npropagate=True (default) means log records bubble up to parent loggers. The root logger ('') is the final ancestor. Setting propagate=False on an app logger prevents duplicate log entries.",
      realExample: "In production, the application logs INFO and above to a rotating file, WARNING and above to the console, and ERROR and above to email (via mail_admins handler). The django.db.backends logger at DEBUG level logs every SQL query — only enabled in development.",
      codeExample: `# settings.py — complete production logging configuration
import os

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,   # preserve Django's own loggers

    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {asctime} {message}',
            'style': '{',
        },
        'json': {
            '()': 'pythonjsonlogger.jsonlogger.JsonFormatter',
            'format': '%(levelname)s %(asctime)s %(module)s %(message)s',
        },
    },

    'filters': {
        'require_debug_false': {
            '()': 'django.utils.log.RequireDebugFalse',
        },
        'require_debug_true': {
            '()': 'django.utils.log.RequireDebugTrue',
        },
    },

    'handlers': {
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
        'file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': os.path.join(BASE_DIR, 'logs', 'app.log'),
            'maxBytes': 10 * 1024 * 1024,   # 10 MB per file
            'backupCount': 5,                # keep 5 rotated files
            'formatter': 'verbose',
        },
        'mail_admins': {
            'level': 'ERROR',
            'class': 'django.utils.log.AdminEmailHandler',
            'filters': ['require_debug_false'],   # only in production
            'formatter': 'verbose',
        },
    },

    'loggers': {
        # Django's internal logger — request errors, 500s
        'django': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
        # Log 4xx and 5xx HTTP errors
        'django.request': {
            'handlers': ['mail_admins', 'file'],
            'level': 'ERROR',
            'propagate': False,
        },
        # Log all SQL queries (development only — very verbose)
        'django.db.backends': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'filters': ['require_debug_true'],
            'propagate': False,
        },
        # Application logger — your app code
        'myapp': {
            'handlers': ['console', 'file'],
            'level': 'DEBUG',
            'propagate': False,
        },
        # Root logger — catches anything not matched above
        '': {
            'handlers': ['console'],
            'level': 'WARNING',
        },
    },
}

# Ensure log directory exists
os.makedirs(os.path.join(BASE_DIR, 'logs'), exist_ok=True)


# ---- USING LOGGERS IN APPLICATION CODE ----
# myapp/views.py
import logging

# Best practice: use __name__ as logger name
# In myapp/views.py this resolves to 'myapp.views'
# which is a child of the 'myapp' logger defined above
logger = logging.getLogger(__name__)


def payment_view(request):
    logger.debug('Payment view called', extra={'user_id': request.user.id})
    try:
        result = process_payment(request)
        logger.info('Payment processed successfully', extra={
            'user_id': request.user.id,
            'amount': result.amount,
        })
        return Response({'status': 'ok'})
    except PaymentError as e:
        logger.error('Payment failed', exc_info=True, extra={
            'user_id': request.user.id,
            'error': str(e),
        })
        return Response({'error': 'Payment failed'}, status=500)
    except Exception:
        logger.critical('Unexpected payment error', exc_info=True)
        raise


# myapp/models.py
import logging
logger = logging.getLogger(__name__)   # 'myapp.models'

class Order(models.Model):
    def save(self, *args, **kwargs):
        is_new = not self.pk
        super().save(*args, **kwargs)
        if is_new:
            logger.info('Order created: %s', self.pk)`,
      outputExplanation: "The LOGGING dict is processed by Django at startup using logging.config.dictConfig(). Logger names form a hierarchy by dot-notation: 'myapp.views' is a child of 'myapp' which is a child of the root ''. When propagate=True (default), a log record is passed up to parent handlers in addition to the current logger's handlers. RotatingFileHandler creates app.log and automatically renames it to app.log.1, app.log.2, etc. when it exceeds maxBytes.",
      commonMistakes: [
        "Setting disable_existing_loggers=True — this silences Django's own loggers (django.request, django.security) which you still want.",
        "Not creating the logs directory — the RotatingFileHandler raises FileNotFoundError if the parent directory doesn't exist.",
        "Using propagate=True with a specific logger and the root logger both having console handlers — every log message is printed twice.",
        "Enabling django.db.backends DEBUG in production — every SQL query is logged, causing enormous log files and I/O overhead."
      ],
      interviewNotes: [
        "Python logging is hierarchical by dot-notation — 'myapp.views' inherits from 'myapp' inherits from root ''.",
        "propagate=False stops a log record from bubbling up to parent loggers — prevents duplicate entries.",
        "exc_info=True in logger.error() includes the full stack trace in the log message.",
        "mail_admins handler sends emails for 500 errors — filter it with require_debug_false to avoid email storms in development.",
        "RotatingFileHandler is better than FileHandler in production — prevents log files from growing indefinitely."
      ],
      whenToUse: "Every production Django application. Proper logging is non-negotiable for diagnosing issues in production.",
      whenNotToUse: "If you use a centralized logging service (Datadog, ELK), you may simplify to a single console handler writing JSON and let the infrastructure aggregate logs."
    },
    tags: ["logging", "settings", "production", "monitoring", "debugging"],
    order: 21,
    estimatedMinutes: 18
  },

  {
    id: "structured-logging",
    title: "Structured / JSON Logging",
    slug: "structured-logging",
    category: "production",
    subcategory: "logging",
    difficulty: "intermediate",
    description: "Emit JSON logs parseable by ELK/Datadog, add request_id to every log line, and use LoggerAdapter for context-rich logging.",
    content: {
      explanation: "Plain-text log lines are hard to query in production. Structured (JSON) logs let log aggregation tools (ELK Stack, Datadog, Splunk, CloudWatch Logs Insights) filter and aggregate by any field: user_id, request_id, status_code, duration_ms.\n\nThe python-json-logger library provides a JSON formatter compatible with Python's logging module. Adding a request_id to every log line for a given HTTP request lets you trace all log entries for that request in a single query.\n\nLoggingAdapter wraps a logger and adds extra context to every call without changing the logger call sites. Middleware generates a request_id (UUID) at the start of each request and stores it in thread-local storage.",
      realExample: "A production incident: a user reports a 500 error. You search Datadog for request_id=abc-123 and see every log line from that request, including the exact SQL query that timed out, the user_id, and the stack trace — all correlated by the single request_id.",
      codeExample: `# pip install python-json-logger

# settings.py
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'json': {
            '()': 'pythonjsonlogger.jsonlogger.JsonFormatter',
            'format': '%(asctime)s %(name)s %(levelname)s %(message)s',
        },
    },
    'handlers': {
        'json_console': {
            'class': 'logging.StreamHandler',
            'formatter': 'json',
        },
    },
    'root': {
        'handlers': ['json_console'],
        'level': 'INFO',
    },
}


# core/request_id.py — thread-local request ID storage
import threading
import uuid

_thread_locals = threading.local()

def generate_request_id() -> str:
    return str(uuid.uuid4())

def get_request_id() -> str:
    return getattr(_thread_locals, 'request_id', 'no-request-id')

def set_request_id(request_id: str):
    _thread_locals.request_id = request_id

def clear_request_id():
    _thread_locals.request_id = None


# core/middleware.py
import logging
import time
from core.request_id import generate_request_id, set_request_id, clear_request_id, get_request_id

logger = logging.getLogger(__name__)


class RequestIDMiddleware:
    """Generate a unique request_id and attach it to every log line."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request_id = (
            request.headers.get('X-Request-ID') or generate_request_id()
        )
        set_request_id(request_id)
        request.request_id = request_id

        start_time = time.monotonic()
        response = self.get_response(request)
        duration_ms = round((time.monotonic() - start_time) * 1000, 2)

        logger.info('Request completed', extra={
            'request_id':  request_id,
            'method':      request.method,
            'path':        request.path,
            'status_code': response.status_code,
            'duration_ms': duration_ms,
            'user_id':     request.user.id if request.user.is_authenticated else None,
        })

        response['X-Request-ID'] = request_id   # echo back to client
        clear_request_id()
        return response


# core/logging_utils.py — LoggerAdapter for automatic request_id injection
import logging
from core.request_id import get_request_id


class RequestIDAdapter(logging.LoggerAdapter):
    """Automatically adds request_id to every log record."""

    def process(self, msg, kwargs):
        kwargs.setdefault('extra', {})
        kwargs['extra']['request_id'] = get_request_id()
        return msg, kwargs


def get_logger(name: str) -> RequestIDAdapter:
    """Factory — use this instead of logging.getLogger() in your app code."""
    return RequestIDAdapter(logging.getLogger(name), {})


# myapp/views.py
from core.logging_utils import get_logger

logger = get_logger(__name__)

def payment_view(request):
    logger.info('Processing payment', extra={
        'amount': request.data.get('amount'),
        'currency': request.data.get('currency'),
    })
    # JSON output:
    # {"asctime": "2024-01-15 10:30:00", "name": "myapp.views",
    #  "levelname": "INFO", "message": "Processing payment",
    #  "request_id": "abc-123", "amount": 99.99, "currency": "USD"}`,
      outputExplanation: "JsonFormatter serializes the LogRecord into a JSON object. Every field passed via extra= becomes a top-level key in the JSON. RequestIDAdapter.process() injects request_id into extra on every log call without changing the call site. The middleware sets the thread-local at request start and clears it in the response path (after clear_request_id()). Log aggregation tools index these JSON objects and allow field-level filtering.",
      commonMistakes: [
        "Not clearing thread-locals in a finally block — if the view raises an unhandled exception before the response path, the request_id is never cleared and leaks into the next request on that thread.",
        "Using logging.LoggerAdapter but not calling setdefault on kwargs['extra'] — if the caller also passes extra={}, it overwrites the request_id.",
        "Logging sensitive data (passwords, tokens, PII) in structured fields — structured logs are often shipped to third-party services. Redact sensitive fields.",
        "Not propagating X-Request-ID from upstream services — distributed tracing requires the same request_id across all services in a call chain."
      ],
      interviewNotes: [
        "Structured logging enables log-level queries: status_code=500 AND duration_ms>1000 in Datadog/Kibana.",
        "Request tracing: correlating all log lines for one HTTP request by request_id is essential for production debugging.",
        "LoggerAdapter.process() is called on every log call — keep it lightweight, no I/O.",
        "structlog is a popular alternative to python-json-logger — it has a richer pipeline (processors, context variables) and native async support.",
        "X-Request-ID is a de facto standard header for distributed tracing — forward it from the load balancer through every microservice."
      ],
      whenToUse: "Any production Django app shipping logs to a centralized service (ELK, Datadog, CloudWatch, Splunk). Essential for microservices where request tracing spans multiple services.",
      whenNotToUse: "Simple single-process applications where a developer tails a log file directly — JSON is harder to read without tooling."
    },
    tags: ["logging", "structured", "json", "request-id", "monitoring"],
    order: 22,
    estimatedMinutes: 18
  },

  {
    id: "sentry-integration",
    title: "Sentry Error Monitoring",
    slug: "sentry-integration",
    category: "production",
    subcategory: "logging",
    difficulty: "intermediate",
    description: "Integrate Sentry for error monitoring: SDK setup, user context, manual capture, before_send filtering, and performance tracing.",
    content: {
      explanation: "Sentry is the industry-standard error monitoring service. The sentry-sdk Python package integrates with Django via a DjangoIntegration that automatically captures unhandled exceptions, 500 errors, slow database queries, and request context (URL, user, headers).\n\nKey settings: dsn (Data Source Name — your project's ingest URL), environment (production/staging/development), traces_sample_rate (fraction of requests to profile for performance), and profiles_sample_rate (for profiling).\n\nFor privacy and noise reduction: before_send lets you filter, modify, or drop events before they reach Sentry. set_user() adds user context to events. capture_exception() and capture_message() allow manual reporting from caught exceptions.",
      realExample: "Every 500 error in production creates a Sentry issue with full stack trace, request data, and user context. The on-call engineer gets a Slack alert. When the same error happens 10 times, Sentry deduplicates it into one issue with an occurrence count.",
      codeExample: `# pip install sentry-sdk

# settings.py
import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration
from sentry_sdk.integrations.redis import RedisIntegration
from sentry_sdk.integrations.celery import CeleryIntegration
import os


def before_send(event, hint):
    """
    Filter or modify events before sending to Sentry.
    Return None to drop the event, or return the (modified) event.
    """
    # Drop 404 errors — not worth tracking
    if 'exc_info' in hint:
        exc_type, exc_value, tb = hint['exc_info']
        from django.http import Http404
        if isinstance(exc_value, Http404):
            return None

    # Scrub credit card numbers from request data
    if 'request' in event and 'data' in event['request']:
        data = event['request']['data']
        if isinstance(data, dict) and 'card_number' in data:
            data['card_number'] = '[Filtered]'

    # Drop events from health check endpoint (noise)
    request = event.get('request', {})
    if request.get('url', '').endswith('/health/'):
        return None

    return event


sentry_sdk.init(
    dsn=os.environ.get('SENTRY_DSN', ''),
    environment=os.environ.get('DJANGO_ENV', 'development'),
    integrations=[
        DjangoIntegration(
            transaction_style='url',       # group transactions by URL pattern
            middleware_spans=True,          # trace middleware execution
            signals_spans=True,
            cache_spans=True,
        ),
        RedisIntegration(),
        CeleryIntegration(monitor_beat_tasks=True),
    ],
    traces_sample_rate=0.1,       # trace 10% of requests for performance
    profiles_sample_rate=0.05,    # profile 5% of requests
    send_default_pii=False,       # do not auto-capture request bodies (GDPR)
    before_send=before_send,
    release=os.environ.get('GIT_COMMIT_SHA', 'unknown'),
)


# myapp/views.py — manual capture and user context
import sentry_sdk
from sentry_sdk import capture_exception, capture_message, set_user, push_scope

def payment_view(request):
    # Add user context to all events in this scope
    set_user({
        'id':    str(request.user.id),
        'email': request.user.email,
        # Do NOT include passwords, SSNs, or other PII
    })

    try:
        result = process_payment(request.data)
    except PaymentGatewayError as e:
        # Manually capture a caught exception
        with push_scope() as scope:
            scope.set_tag('payment_gateway', 'stripe')
            scope.set_context('payment', {
                'amount':   request.data.get('amount'),
                'currency': request.data.get('currency'),
            })
            capture_exception(e)
        return Response({'error': 'Payment service unavailable'}, status=503)
    except Exception as e:
        capture_exception(e)
        raise   # re-raise to let Django's 500 handler respond

    # Capture an informational message (non-error)
    capture_message(
        f'Large payment processed: {result.amount}',
        level='warning'
    )

    return Response({'status': 'ok', 'charge_id': result.charge_id})


# Sentry breadcrumbs — automatic trail of events leading to an error
def process_order(order_id):
    sentry_sdk.add_breadcrumb(
        category='order',
        message=f'Processing order {order_id}',
        level='info',
    )
    # ... processing ...
    sentry_sdk.add_breadcrumb(
        category='order',
        message=f'Fetching inventory for order {order_id}',
        level='debug',
    )`,
      outputExplanation: "sentry_sdk.init() installs global exception hooks. DjangoIntegration patches Django's request handling to capture exceptions and request context automatically. before_send is called for every event — returning None drops it, returning the event (possibly modified) sends it. set_user() sets user context for all subsequent events in the current scope. push_scope() creates a temporary scope for adding context that applies only to one capture call.",
      commonMistakes: [
        "Setting send_default_pii=True — this sends request bodies, cookies, and potentially PII to Sentry's servers. Requires a DPA with Sentry under GDPR.",
        "Setting traces_sample_rate=1.0 in production — traces every request, generating enormous volume and Sentry costs. Use 0.05-0.1 for production.",
        "Exposing the DSN publicly — the DSN allows submitting events to your project. Keep it in an environment variable, not committed to source code.",
        "Not setting release= — without the release tag, Sentry cannot correlate errors with deployments or show 'first seen in release N'."
      ],
      interviewNotes: [
        "Sentry deduplicates errors by fingerprint — the same exception in the same location becomes one issue regardless of how many times it fires.",
        "before_send is the right place to scrub PII, drop known-harmless errors (404s), and add custom fingerprinting.",
        "DjangoIntegration automatically attaches URL, method, headers, and session data to every error event.",
        "The release= tag combined with Sentry's release tracking shows you exactly which deployment introduced a regression.",
        "Sentry performance monitoring (traces_sample_rate > 0) tracks slow queries, slow views, and N+1 queries detected via DjangoIntegration."
      ],
      whenToUse: "Every production Django application. Sentry is the de facto standard for Python/Django error monitoring.",
      whenNotToUse: "Local development — set environment='development' and traces_sample_rate=0, or check that SENTRY_DSN is empty in dev so events are not sent."
    },
    tags: ["sentry", "monitoring", "errors", "logging", "production"],
    order: 23,
    estimatedMinutes: 18
  },

  {
    id: "custom-exception-handler-drf",
    title: "DRF Custom Exception Handler",
    slug: "custom-exception-handler-drf",
    category: "production",
    subcategory: "logging",
    difficulty: "intermediate",
    description: "Standardize DRF error responses with a custom exception handler that produces consistent JSON error envelopes.",
    content: {
      explanation: "DRF's default exception handler returns different shapes for different errors: validation errors are dicts, 404s are strings, 500s are plain text. This inconsistency forces frontend developers to handle multiple error formats.\n\nA custom exception handler normalizes all errors into one envelope: {error: {code: string, message: string, details: any}}. It receives the exception and the view context, can log the error, capture it in Sentry, and return a Response with the standardized shape.\n\nSet it in REST_FRAMEWORK['EXCEPTION_HANDLER']. It is called for all DRF exceptions (ValidationError, NotFound, PermissionDenied, AuthenticationFailed, etc.). Unhandled exceptions (those that raise non-APIException types) fall through to Django's 500 handler unless you also catch Exception.",
      realExample: "A mobile app team requires all API errors in the format {error: {code: 'VALIDATION_ERROR', message: 'Invalid input', details: {field: ['error']}}}. The custom handler maps DRF's exceptions to this format, and the mobile team codes against one predictable contract.",
      codeExample: `# myapp/exception_handlers.py
import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import (
    ValidationError, NotFound, PermissionDenied,
    AuthenticationFailed, NotAuthenticated, Throttled,
)

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Custom DRF exception handler.
    Returns all errors in the shape:
    {
      "error": {
        "code": "VALIDATION_ERROR",
        "message": "One or more fields failed validation.",
        "details": {"field_name": ["error message"]}
      }
    }
    """
    # First, let DRF handle its own exceptions (sets response.data)
    response = exception_handler(exc, context)

    if response is not None:
        # DRF handled it — standardize the shape
        error_code    = _get_error_code(exc)
        error_message = _get_error_message(exc)
        details       = _get_details(exc)

        response.data = {
            'error': {
                'code':    error_code,
                'message': error_message,
                'details': details,
            }
        }

        # Log 5xx errors with full context
        if response.status_code >= 500:
            request = context.get('request')
            logger.error(
                'Server error: %s',
                str(exc),
                exc_info=True,
                extra={
                    'path':        request.path if request else None,
                    'method':      request.method if request else None,
                    'user_id':     request.user.id if request and request.user.is_authenticated else None,
                    'status_code': response.status_code,
                }
            )
    else:
        # Unhandled exception — catch it, log it, return 500
        logger.critical('Unhandled exception', exc_info=True)

        # Optionally capture in Sentry
        try:
            import sentry_sdk
            sentry_sdk.capture_exception(exc)
        except ImportError:
            pass

        response = Response(
            {
                'error': {
                    'code':    'INTERNAL_SERVER_ERROR',
                    'message': 'An unexpected error occurred.',
                    'details': None,
                }
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return response


def _get_error_code(exc) -> str:
    code_map = {
        ValidationError:     'VALIDATION_ERROR',
        NotFound:            'NOT_FOUND',
        PermissionDenied:    'PERMISSION_DENIED',
        AuthenticationFailed:'AUTHENTICATION_FAILED',
        NotAuthenticated:    'NOT_AUTHENTICATED',
        Throttled:           'RATE_LIMITED',
    }
    for exc_class, code in code_map.items():
        if isinstance(exc, exc_class):
            return code
    return 'API_ERROR'


def _get_error_message(exc) -> str:
    if isinstance(exc, ValidationError):
        return 'One or more fields failed validation.'
    if isinstance(exc, Throttled):
        wait = exc.wait
        return f'Rate limit exceeded. Retry after {int(wait)} seconds.' if wait else 'Rate limit exceeded.'
    if hasattr(exc, 'detail'):
        detail = exc.detail
        if isinstance(detail, str):
            return detail
        if isinstance(detail, list) and detail:
            return str(detail[0])
    return str(exc)


def _get_details(exc) -> dict | list | None:
    if isinstance(exc, ValidationError):
        return exc.detail   # field-level errors dict
    return None


# settings.py
REST_FRAMEWORK = {
    'EXCEPTION_HANDLER': 'myapp.exception_handlers.custom_exception_handler',
    # ... other settings
}

# ---- EXAMPLE RESPONSES ----
# ValidationError:
# {"error": {"code": "VALIDATION_ERROR", "message": "One or more fields failed validation.",
#   "details": {"email": ["Enter a valid email address."], "name": ["This field is required."]}}}

# NotFound:
# {"error": {"code": "NOT_FOUND", "message": "Not found.", "details": null}}

# Throttled:
# {"error": {"code": "RATE_LIMITED", "message": "Rate limit exceeded. Retry after 3600 seconds.", "details": null}}`,
      outputExplanation: "exception_handler(exc, context) is DRF's default handler — calling it first lets DRF translate its own exception types into appropriate HTTP status codes. The custom handler then restructures response.data into the standard envelope. For unhandled exceptions (response is None), the handler returns a 500 with the standard error shape and captures the exception in Sentry. This ensures every API error, regardless of type, returns the same JSON structure.",
      commonMistakes: [
        "Not calling the default exception_handler() first — DRF exceptions have important status code logic. Calling it first gives you the correct status code.",
        "Returning None from the custom handler — returning None causes DRF to propagate the exception to Django's 500 handler, bypassing your error format.",
        "Swallowing exceptions without logging — logging inside the exception handler is critical for visibility. Don't just reshape and return.",
        "Not handling the Throttled wait time — clients need the Retry-After information to back off. Include it in the response body and set the Retry-After header."
      ],
      interviewNotes: [
        "The custom exception handler is called for all DRF exceptions — unhandled Python exceptions bypass it entirely unless you catch Exception.",
        "exc.detail is DRF's standardized error payload — for ValidationError it is a dict of field errors, for others it may be a string or list.",
        "Calling exception_handler(exc, context) first is critical — it sets response.status_code correctly based on the exception type.",
        "The context dict contains {'view': view_instance, 'args': args, 'kwargs': kwargs, 'request': request}.",
        "A consistent error format is one of the most important API design decisions — it affects every client that consumes your API."
      ],
      whenToUse: "Every DRF API with more than one client or where you want consistent error responses.",
      whenNotToUse: "If you are using a third-party package that also defines a custom exception handler — they may conflict. Check documentation for compatibility."
    },
    tags: ["drf", "exceptions", "error-handling", "api", "logging"],
    order: 24,
    estimatedMinutes: 18
  },

  {
    id: "django-middleware-logging",
    title: "Request/Response Logging Middleware",
    slug: "django-middleware-logging",
    category: "production",
    subcategory: "logging",
    difficulty: "intermediate",
    description: "Write request/response logging middleware that records method, path, status, duration, user, and IP for every request.",
    content: {
      explanation: "Access logging captures every HTTP request: method, path, status code, response time, user ID, and client IP. Django does not log this by default — the web server (nginx/Gunicorn) logs it, but at the application layer you have access to the authenticated user and application-specific context that the web server does not.\n\nMiddleware is the right layer for cross-cutting concerns that apply to all requests. The __init__ method receives get_response and stores it. The __call__ method wraps the request/response cycle. Performance-critical middleware should be as thin as possible — avoid database queries or external calls.\n\nAlways exclude noisy endpoints (health checks, static files) to keep logs useful.",
      realExample: "A compliance requirement mandates logging every authenticated API call with user ID, endpoint, and duration for audit purposes. The logging middleware captures this for all views without modifying any view code.",
      codeExample: `# core/middleware.py
import logging
import time

logger = logging.getLogger('access')

# Paths to exclude from access logging (too noisy)
EXCLUDED_PATHS = {
    '/health/',
    '/metrics/',
    '/favicon.ico',
    '/static/',
}


class AccessLogMiddleware:
    """
    Log every request: method, path, status, duration, user, IP.
    Compatible with both sync and async Django.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Skip excluded paths early to minimize overhead
        for excluded in EXCLUDED_PATHS:
            if request.path.startswith(excluded):
                return self.get_response(request)

        start_time = time.monotonic()
        response   = self.get_response(request)
        duration_ms = round((time.monotonic() - start_time) * 1000, 2)

        self._log_request(request, response, duration_ms)
        return response

    def _log_request(self, request, response, duration_ms: float):
        user_id = None
        if hasattr(request, 'user') and request.user.is_authenticated:
            user_id = request.user.id

        # Get real client IP — handles proxies via X-Forwarded-For
        ip = self._get_client_ip(request)

        log_level = logging.WARNING if response.status_code >= 400 else logging.INFO

        logger.log(
            log_level,
            '%s %s %s',
            request.method,
            request.path,
            response.status_code,
            extra={
                'method':      request.method,
                'path':        request.path,
                'query':       request.GET.urlencode(),
                'status_code': response.status_code,
                'duration_ms': duration_ms,
                'user_id':     user_id,
                'ip':          ip,
                'user_agent':  request.META.get('HTTP_USER_AGENT', '')[:200],
                'content_length': response.get('Content-Length', 0),
            }
        )

    @staticmethod
    def _get_client_ip(request) -> str:
        """
        Return the real client IP, respecting X-Forwarded-For.
        IMPORTANT: Only trust X-Forwarded-For if Django is behind a trusted proxy.
        Set USE_X_FORWARDED_HOST = True and configure TRUSTED_PROXIES.
        """
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            # Take the leftmost IP — the original client
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR', '0.0.0.0')


# settings.py
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'core.middleware.AccessLogMiddleware',   # early — measures full request time
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    # ... remaining middleware
]

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'access_file': {
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': 'logs/access.log',
            'maxBytes': 50 * 1024 * 1024,
            'backupCount': 10,
            'formatter': 'json',
        },
    },
    'loggers': {
        'access': {
            'handlers': ['access_file'],
            'level': 'INFO',
            'propagate': False,
        },
    },
    # ... formatters
}`,
      outputExplanation: "The middleware is placed early in the MIDDLEWARE list so it measures total request time including all subsequent middleware. start_time = time.monotonic() is used instead of time.time() because monotonic is not affected by system clock adjustments. _get_client_ip() checks X-Forwarded-For to get the real client IP when Django is behind a load balancer. Excluded paths are checked first with a startswith() loop to short-circuit before any timing or logging overhead.",
      commonMistakes: [
        "Placing the middleware too late in the MIDDLEWARE list — middleware after SessionMiddleware cannot log the user, and timing starts late, missing slow middleware above.",
        "Trusting X-Forwarded-For without a trusted proxy — a malicious client can spoof this header and bypass IP-based rate limiting.",
        "Logging the request body — it may contain passwords, PII, or large payloads. Log only metadata.",
        "Adding a database query in middleware — middleware runs on every request. Even one extra DB query per request is catastrophic under load."
      ],
      interviewNotes: [
        "Middleware order matters — place AccessLogMiddleware before SessionMiddleware and AuthMiddleware to capture auth failures, but after SecurityMiddleware.",
        "time.monotonic() is the correct timer for measuring durations — time.time() can go backward during NTP adjustments.",
        "X-Forwarded-For contains a comma-separated list of IPs: client, proxy1, proxy2. The leftmost is the client.",
        "Django's APPEND_SLASH redirects add a second request log entry — the 301 redirect and the subsequent GET.",
        "For async Django views, middleware __call__ must be async def or use sync_to_async to avoid blocking the event loop."
      ],
      whenToUse: "Every production Django application for operational visibility and compliance audit logs.",
      whenNotToUse: "If you are already using a web server access log (nginx) with user ID extension — there may be acceptable duplication. In serverless environments, use the platform's built-in logging instead."
    },
    tags: ["middleware", "logging", "request", "monitoring", "production"],
    order: 25,
    estimatedMinutes: 15
  },

  {
    id: "error-handling-patterns",
    title: "Production Error Handling Patterns",
    slug: "error-handling-patterns",
    category: "production",
    subcategory: "logging",
    difficulty: "advanced",
    description: "Custom 400/403/404/500 handlers, service-layer exception patterns, transaction savepoints, and custom exceptions.",
    content: {
      explanation: "Production error handling has multiple layers. At the Django level: custom handler400/403/404/500 views return branded error pages or JSON responses. At the service layer: catching IntegrityError and DatabaseError with meaningful messages, using transaction.atomic() with savepoints for partial rollback, and defining custom exception classes for domain errors.\n\nThe service layer should handle expected errors (validation, conflicts) and let unexpected errors (database connection loss, programming errors) propagate up to the global handler. contextlib.suppress is appropriate for truly ignorable errors.",
      realExample: "A user attempts to register with an existing email. The service catches IntegrityError (unique constraint violation), converts it to a DomainError with a human-readable message, and the view catches DomainError and returns a 400 response — the user sees 'Email already registered' instead of a raw 500 with a database error.",
      codeExample: `# myapp/exceptions.py — custom domain exceptions
class DomainError(Exception):
    """Base class for expected business logic errors."""
    default_message = 'An error occurred.'
    default_code    = 'DOMAIN_ERROR'

    def __init__(self, message=None, code=None):
        self.message = message or self.default_message
        self.code    = code    or self.default_code
        super().__init__(self.message)


class UserAlreadyExistsError(DomainError):
    default_message = 'A user with this email already exists.'
    default_code    = 'USER_ALREADY_EXISTS'


class InsufficientFundsError(DomainError):
    default_message = 'Insufficient funds for this transaction.'
    default_code    = 'INSUFFICIENT_FUNDS'


# myapp/services.py — service layer with explicit exception handling
import logging
from contextlib import suppress
from django.db import transaction, IntegrityError, DatabaseError
from myapp.models import User, Account, Transaction
from myapp.exceptions import UserAlreadyExistsError, InsufficientFundsError

logger = logging.getLogger(__name__)


class UserService:
    @staticmethod
    def register(email: str, password: str) -> User:
        try:
            with transaction.atomic():
                user = User.objects.create_user(email=email, password=password)
                # If this fails, the whole atomic block rolls back
                AccountService.create_initial_account(user)
                return user
        except IntegrityError:
            raise UserAlreadyExistsError()
        except DatabaseError as e:
            logger.error('Database error during user registration', exc_info=True)
            raise   # let it propagate — unexpected error


class AccountService:
    @staticmethod
    def transfer(from_account_id: int, to_account_id: int, amount: float):
        with transaction.atomic():
            # select_for_update locks rows for the duration of the transaction
            accounts = Account.objects.select_for_update().filter(
                pk__in=[from_account_id, to_account_id]
            )
            from_account = next(a for a in accounts if a.pk == from_account_id)
            to_account   = next(a for a in accounts if a.pk == to_account_id)

            if from_account.balance < amount:
                raise InsufficientFundsError()

            from_account.balance -= amount
            to_account.balance   += amount
            from_account.save(update_fields=['balance'])
            to_account.save(update_fields=['balance'])

            Transaction.objects.create(
                from_account=from_account,
                to_account=to_account,
                amount=amount,
            )

    @staticmethod
    def create_initial_account(user):
        """Demonstrates nested savepoint — rolls back only this part on failure."""
        try:
            with transaction.atomic():   # nested atomic = savepoint
                Account.objects.create(user=user, balance=0)
        except DatabaseError:
            logger.warning('Could not create initial account for user %s', user.pk)
            # Do NOT re-raise — allow user creation to succeed without account


# myapp/views.py — clean view using service layer
from rest_framework.views import APIView
from rest_framework.response import Response
from myapp.services import UserService
from myapp.exceptions import DomainError

class RegisterView(APIView):
    def post(self, request):
        email    = request.data.get('email')
        password = request.data.get('password')
        try:
            user = UserService.register(email, password)
        except DomainError as e:
            # Expected errors — return 400 with domain error code
            return Response({'error': {'code': e.code, 'message': e.message}}, status=400)
        # Unexpected errors propagate to DRF's exception handler or Django's 500 handler
        return Response({'id': user.pk, 'email': user.email}, status=201)


# myproject/urls.py — custom error pages
handler400 = 'myapp.error_views.bad_request'
handler403 = 'myapp.error_views.forbidden'
handler404 = 'myapp.error_views.not_found'
handler500 = 'myapp.error_views.server_error'

# myapp/error_views.py
from django.http import JsonResponse
from django.shortcuts import render

def bad_request(request, exception=None):
    if request.accepts('application/json'):
        return JsonResponse({'error': 'Bad request'}, status=400)
    return render(request, 'errors/400.html', status=400)

def not_found(request, exception=None):
    if request.accepts('application/json'):
        return JsonResponse({'error': 'Not found'}, status=404)
    return render(request, 'errors/404.html', status=404)

def server_error(request):
    if request.accepts('application/json'):
        return JsonResponse({'error': 'Server error'}, status=500)
    return render(request, 'errors/500.html', status=500)

# Suppress truly ignorable errors:
from contextlib import suppress
with suppress(FileNotFoundError):
    os.remove('/tmp/temp_export.csv')   # OK if already deleted`,
      outputExplanation: "Custom domain exceptions separate expected business errors from unexpected infrastructure errors. The service layer catches IntegrityError (expected — unique constraint violation) and converts it to UserAlreadyExistsError (domain exception). DatabaseError (unexpected) is logged and re-raised. The view only catches DomainError, so unexpected errors propagate to the global 500 handler. Nested transaction.atomic() creates a savepoint — rolling back the inner block does not roll back the outer transaction.",
      commonMistakes: [
        "Catching Exception everywhere in service methods — swallowing unexpected errors prevents the 500 handler from seeing them and hides bugs.",
        "Not using select_for_update() for balance operations — two concurrent transfers can both read the same balance and both succeed, causing negative balances.",
        "Using transaction.atomic() without handling the case where it rolls back — callers must be aware that a rolled-back transaction means no data was written.",
        "Checking if a record exists before creating (check-then-create) instead of using IntegrityError — the check-then-create pattern has a race condition under concurrent requests."
      ],
      interviewNotes: [
        "IntegrityError is the signal for unique constraint violations — always more reliable than a check-then-create pattern.",
        "select_for_update() issues SELECT ... FOR UPDATE — the row is locked until the end of the transaction, preventing concurrent modifications.",
        "Nested transaction.atomic() creates a savepoint — rolling back the inner block releases the savepoint without rolling back the outer transaction.",
        "handler404 and handler500 must be set in the root URLconf (urls.py), not in app URLconfs.",
        "Custom exception classes with a code attribute allow the frontend to show localized error messages by code rather than relying on English message strings."
      ],
      whenToUse: "Every Django application with a service layer (beyond simple CRUD). Essential for any financial, inventory, or multi-step operation that requires transactional integrity.",
      whenNotToUse: "Simple CRUD applications with no business logic — over-engineering with domain exceptions adds complexity without benefit."
    },
    tags: ["error-handling", "exceptions", "transactions", "service-layer", "production"],
    order: 26,
    estimatedMinutes: 22
  },

  // ─── SETTINGS (27–31) ───────────────────────────────────────────────────────
  {
    id: "settings-management",
    title: "Settings Management (django-environ + Split Settings)",
    slug: "settings-management",
    category: "production",
    subcategory: "settings",
    difficulty: "intermediate",
    description: "Split settings into base/local/production/test modules using django-environ for secret management and .env files.",
    content: {
      explanation: "Hardcoding secrets in settings.py and committing it to version control is a critical security failure. The standard solution: store secrets in environment variables, read them with django-environ or python-decouple, and split settings into environment-specific modules.\n\nThe split settings pattern: settings/base.py contains shared settings, settings/local.py inherits base.py and overrides for development, settings/production.py inherits base.py with production-specific values. DJANGO_SETTINGS_MODULE controls which module is loaded. The .env file (never committed) stores local secrets. An .env.example (committed) documents required variables.\n\ndjango-environ provides env() which reads from environment variables with type coercion and default values. env.db() parses DATABASE_URL into Django's DATABASES format.",
      realExample: "A team of 5 developers each has a local PostgreSQL database. They all share base.py from git. Each developer has a local .env file pointing to their local DB. The production server has environment variables set by the infrastructure team — no .env file needed.",
      codeExample: `# pip install django-environ

# Directory structure:
# myproject/
#   settings/
#     __init__.py   (empty)
#     base.py
#     local.py
#     production.py
#     test.py
#   .env            (never commit)
#   .env.example    (commit this)

# .env.example — document all required variables
# SECRET_KEY=change-me-to-a-real-50-char-random-string
# DEBUG=False
# DATABASE_URL=postgres://user:password@localhost:5432/mydb
# REDIS_URL=redis://localhost:6379/0
# ALLOWED_HOSTS=localhost,127.0.0.1
# SENTRY_DSN=
# EMAIL_URL=smtp://user:password@smtp.example.com:587
# AWS_ACCESS_KEY_ID=
# AWS_SECRET_ACCESS_KEY=
# AWS_STORAGE_BUCKET_NAME=

# settings/base.py
import environ
import os

env = environ.Env(
    # (type, default_value)
    DEBUG=(bool, False),
    ALLOWED_HOSTS=(list, []),
)

# Read .env file from project root (two levels up from this file)
BASE_DIR = environ.Path(__file__) - 3   # points to project root
environ.Env.read_env(os.path.join(str(BASE_DIR), '.env'))

SECRET_KEY = env('SECRET_KEY')   # no default — raises ImproperlyConfigured if missing

DEBUG = env('DEBUG')

ALLOWED_HOSTS = env('ALLOWED_HOSTS')

DATABASES = {
    'default': env.db('DATABASE_URL')
    # env.db parses: postgres://user:pass@host:5432/dbname
    # into: {'ENGINE': 'django.db.backends.postgresql', 'NAME': 'dbname', ...}
}

CACHES = {
    'default': env.cache('REDIS_URL')
    # env.cache parses: redis://localhost:6379/0
    # into: {'BACKEND': 'django_redis.cache.RedisCache', ...}
}

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'myapp',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    # ...
]

ROOT_URLCONF = 'myproject.urls'

STATIC_URL  = '/static/'
STATIC_ROOT = str(BASE_DIR.path('staticfiles'))

MEDIA_URL  = '/media/'
MEDIA_ROOT = str(BASE_DIR.path('media'))

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

EMAIL_CONFIG = env.email('EMAIL_URL', default='smtp://localhost:1025')
vars().update(EMAIL_CONFIG)   # sets EMAIL_BACKEND, EMAIL_HOST, etc.


# settings/local.py
from .base import *

DEBUG = True
ALLOWED_HOSTS = ['*']

# Override INSTALLED_APPS to add dev tools
INSTALLED_APPS += ['debug_toolbar', 'django_extensions']

MIDDLEWARE += ['debug_toolbar.middleware.DebugToolbarMiddleware']

INTERNAL_IPS = ['127.0.0.1']

# Use console email backend in development
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'


# settings/production.py
from .base import *

DEBUG = False

# All production security settings (see security-settings topic)
SECURE_HSTS_SECONDS        = 31536000
SECURE_SSL_REDIRECT        = True
SESSION_COOKIE_SECURE      = True
CSRF_COOKIE_SECURE         = True
SECURE_BROWSER_XSS_FILTER  = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS             = 'DENY'

# Sentry (only in production)
import sentry_sdk
SENTRY_DSN = env('SENTRY_DSN', default='')
if SENTRY_DSN:
    sentry_sdk.init(dsn=SENTRY_DSN, environment='production')


# settings/test.py
from .base import *

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

# Fast password hashing in tests
PASSWORD_HASHERS = ['django.contrib.auth.hashers.MD5PasswordHasher']

EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'


# manage.py / wsgi.py / asgi.py
# os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'myproject.settings.local')

# To run with specific settings:
# DJANGO_SETTINGS_MODULE=myproject.settings.production python manage.py check`,
      outputExplanation: "environ.Env.read_env() reads the .env file into os.environ. env('SECRET_KEY') reads SECRET_KEY from the environment — it raises ImproperlyConfigured if the variable is not set and no default is provided. env.db() and env.cache() parse connection URLs (12-factor app pattern) into Django's dict format. Split settings use from .base import * to inherit base settings, then override specific values.",
      commonMistakes: [
        "Committing the .env file to version control — this exposes all secrets. Add .env to .gitignore immediately.",
        "Using env('DATABASE_URL', default='sqlite:///db.sqlite3') — a default DB URL makes it easy to accidentally run production code against SQLite.",
        "Not documenting required variables in .env.example — new developers cannot set up the project without knowing what variables exist.",
        "Reading env() at import time before environ.Env.read_env() is called — variables not yet loaded, causing KeyError."
      ],
      interviewNotes: [
        "The 12-factor app methodology mandates storing config in environment variables — django-environ implements this pattern.",
        "DJANGO_SETTINGS_MODULE is how Django knows which settings module to load — set it in manage.py, wsgi.py, and asgi.py.",
        "env() with no default raises ImproperlyConfigured — this is intentional for required secrets like SECRET_KEY.",
        "python manage.py check --deploy runs Django's deployment checklist against your settings — run this in your CI pipeline.",
        "Never use eval() or exec() to load settings dynamically — it is a code injection risk."
      ],
      whenToUse: "Every production Django project. Split settings and environment-based secret management is non-negotiable for any serious deployment.",
      whenNotToUse: "Toy projects or personal scripts where a single settings.py is acceptable and there are no secrets to protect."
    },
    tags: ["settings", "environ", "secrets", "configuration", "production"],
    order: 27,
    estimatedMinutes: 18
  },

  {
    id: "database-connection-pooling",
    title: "Database Connection Pooling",
    slug: "database-connection-pooling",
    category: "production",
    subcategory: "settings",
    difficulty: "intermediate",
    description: "Django's CONN_MAX_AGE for persistent connections, PgBouncer for external pooling, and the interaction between workers and DB connections.",
    content: {
      explanation: "Every Django process opens a new database connection for each request by default (CONN_MAX_AGE=0). With 8 Gunicorn workers and 100 requests/second, that is 100 new connections per second. PostgreSQL has a hard limit on concurrent connections (typically 100-500) and each connection costs 5-10 MB of RAM.\n\nCONN_MAX_AGE=60 keeps the connection open for 60 seconds after the request ends, reusing it for subsequent requests on the same worker. This reduces connection overhead dramatically for high-traffic apps.\n\nFor very high concurrency, PgBouncer at the infrastructure level pools connections more aggressively — all Django workers share a small pool of actual PostgreSQL connections. PgBouncer in transaction mode is most efficient but incompatible with Django's advisory locks and LISTEN/NOTIFY.\n\nDjango's CONN_MAX_AGE and PgBouncer work together: CONN_MAX_AGE maintains connections from Django to PgBouncer, PgBouncer maintains the pool to PostgreSQL.",
      realExample: "An app has 20 Gunicorn workers. Without connection pooling, under load it opens 20+ connections simultaneously, hitting PostgreSQL's connection limit. With CONN_MAX_AGE=60 and PgBouncer (pool_size=10), all 20 workers share 10 PostgreSQL connections.",
      codeExample: `# settings/production.py
DATABASES = {
    'default': {
        'ENGINE':   'django.db.backends.postgresql',
        'NAME':     env('DB_NAME'),
        'USER':     env('DB_USER'),
        'PASSWORD': env('DB_PASSWORD'),
        'HOST':     env('DB_HOST', default='localhost'),
        'PORT':     env('DB_PORT', default='5432'),
        # Keep connection alive for 60 seconds after each request
        # Django closes the connection if it is older than CONN_MAX_AGE
        'CONN_MAX_AGE': 60,
        # Optional: health check query to detect stale connections
        'CONN_HEALTH_CHECKS': True,   # Django 4.1+
        'OPTIONS': {
            # PostgreSQL connection options
            'connect_timeout': 10,
            'options': '-c statement_timeout=30000',  # 30s query timeout
        },
        'TEST': {
            'NAME': 'test_mydb',
        }
    }
}

# With PgBouncer — point to PgBouncer port instead of PostgreSQL directly:
# DATABASES = {
#     'default': {
#         'ENGINE': 'django.db.backends.postgresql',
#         'HOST': 'pgbouncer-host',
#         'PORT': '6432',           # PgBouncer default port
#         'NAME': env('DB_NAME'),
#         'USER': env('DB_USER'),
#         'PASSWORD': env('DB_PASSWORD'),
#         'CONN_MAX_AGE': 60,
#         'CONN_HEALTH_CHECKS': True,
#     }
# }

# pgbouncer.ini (infrastructure config — not Django)
# [databases]
# mydb = host=postgres-host port=5432 dbname=mydb
#
# [pgbouncer]
# pool_mode = transaction         # most efficient — but no advisory locks
# max_client_conn = 200           # max connections from Django workers
# default_pool_size = 10          # actual PostgreSQL connections per database
# server_idle_timeout = 600
# server_lifetime = 3600
# listen_port = 6432

# ---- UNDERSTANDING CONNECTION MATH ----
# Without pooling:
# 20 workers × 1 connection each = 20 PostgreSQL connections at idle
# 20 workers × peak concurrent = 20 connections always open
#
# With CONN_MAX_AGE=60:
# Same — but connections are reused within each worker for 60 seconds
# Reduces connection OPEN overhead, not the count
#
# With PgBouncer (transaction mode, pool_size=10):
# All 20 workers share 10 PostgreSQL connections
# Each query borrows a connection, returns it immediately after the query
# 20 workers can make queries "concurrently" using 10 connections
#
# Connection count formula for PostgreSQL limit:
# max_connections >= (num_django_processes × CONN_MAX_AGE > 0 ? 1 : queries_per_second)
# Safe rule: max_connections = (num_gunicorn_workers × 2) + 10 (for admin/migrations)

# ---- CONN_HEALTH_CHECKS (Django 4.1+) ----
# When CONN_HEALTH_CHECKS=True, Django executes a lightweight ping query
# before reusing a persistent connection. If the connection is stale
# (e.g., PostgreSQL restarted), Django transparently reconnects.
# Without it, a stale connection causes the first query of a request to fail.

# ---- DETECTING CONNECTION EXHAUSTION ----
# In PostgreSQL:
# SELECT count(*), state FROM pg_stat_activity GROUP BY state;
# If 'active' count approaches max_connections, you need pooling.

# ---- django-db-connection-pool ----
# An alternative to PgBouncer — pure Python connection pool inside Django.
# pip install django-db-connection-pool
# DATABASES['default']['ENGINE'] = 'dj_db_conn_pool.backends.postgresql'
# DATABASES['default']['POOL_OPTIONS'] = {
#     'POOL_SIZE': 10,
#     'MAX_OVERFLOW': 5,
#     'RECYCLE': 3600,
# }`,
      outputExplanation: "CONN_MAX_AGE=60 tells Django to keep the database connection open on the thread after the request finishes, for up to 60 seconds. The next request on the same thread reuses it. CONN_HEALTH_CHECKS=True (Django 4.1+) adds a lightweight SELECT 1 before reuse — if the connection is dead, Django reconnects transparently instead of raising an OperationalError on the first query. PgBouncer sits between Django and PostgreSQL, multiplexing many Django connections onto fewer PostgreSQL connections.",
      commonMistakes: [
        "Using PgBouncer in transaction mode with advisory locks (pg_advisory_lock) — advisory locks are session-scoped but PgBouncer in transaction mode reuses connections across sessions, causing locks to be acquired by one session and released by another.",
        "Setting CONN_MAX_AGE too high — if PostgreSQL is restarted or a connection drops, Django won't know until CONN_HEALTH_CHECKS detects it.",
        "Not accounting for migration connections — python manage.py migrate opens its own connection. Set max_connections high enough to accommodate migrations running alongside a live server.",
        "Using CONN_MAX_AGE with multi-threaded servers incorrectly — each thread gets its own connection. With 20 Gunicorn workers, you have up to 20 persistent connections."
      ],
      interviewNotes: [
        "CONN_MAX_AGE=0 means a new connection per request. CONN_MAX_AGE=None means keep forever (until thread dies). A timed value (e.g., 60) is the production sweet spot.",
        "PgBouncer in session mode (one server connection per client connection) is equivalent to CONN_MAX_AGE — no multiplexing benefit. Use transaction mode.",
        "Each Gunicorn worker is a separate OS process with its own thread and connection — CONN_MAX_AGE is per-worker, not shared.",
        "CONN_HEALTH_CHECKS was added in Django 4.1 to solve the stale connection problem that CONN_MAX_AGE causes after DB restarts.",
        "The formula for PostgreSQL max_connections: (num_workers × 2) + (num_celery_workers × 2) + 10 is a reasonable starting point."
      ],
      whenToUse: "Any production deployment with more than a few concurrent users. CONN_MAX_AGE=60 should be the default for all production Django apps. PgBouncer when you have many workers or approach PostgreSQL's connection limit.",
      whenNotToUse: "Applications using PostgreSQL advisory locks, LISTEN/NOTIFY, or prepared statements — these are session-scoped and incompatible with PgBouncer transaction mode."
    },
    tags: ["database", "pooling", "postgres", "performance", "settings"],
    order: 28,
    estimatedMinutes: 18
  },

  {
    id: "static-files-production",
    title: "Static Files in Production",
    slug: "static-files-production",
    category: "production",
    subcategory: "settings",
    difficulty: "intermediate",
    description: "Serve static files with WhiteNoise, or off-load to S3 with django-storages, with collectstatic and CDN integration.",
    content: {
      explanation: "Django's development server serves static files for convenience, but the production WSGI server (Gunicorn) does not — it is not designed for file serving. Two production options:\n\n1. WhiteNoise: a Python library that adds efficient static file serving to the WSGI app itself, using gzip and cache headers. No separate nginx static config needed. Best for simple deployments and Heroku-style PaaS.\n\n2. django-storages + S3: collectstatic uploads all static files to S3. Django generates URLs pointing to S3 (or a CloudFront CDN in front of S3). Best for high-traffic apps where CDN edge caching reduces latency.\n\nBoth require running python manage.py collectstatic before deployment. CompressedManifestStaticFilesStorage adds content-hash fingerprinting to filenames (app.a1b2c3.js) enabling permanent cache headers.",
      realExample: "A startup uses WhiteNoise for its first year — simple, zero infrastructure overhead. When traffic grows to 50,000 daily users, they switch to S3 + CloudFront to serve static files from 200+ edge locations instead of their single server.",
      codeExample: `# pip install whitenoise
# pip install django-storages boto3   (for S3)

# ---- OPTION 1: WhiteNoise ----
# settings/production.py

STATIC_URL  = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# WhiteNoise serves compressed, cache-controlled static files from the WSGI app
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # must be second
    # ... rest of middleware
]

# Compress files (gzip) and add content-hash to filenames for permanent caching
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# WhiteNoise serves files with Cache-Control: max-age=31536000, immutable
# for hashed files and Cache-Control: no-cache for index.html
# This means browsers cache static files for 1 year — no re-downloads

# wsgi.py (alternative — wrap the WSGI app directly)
# from whitenoise import WhiteNoise
# application = WhiteNoise(application, root=STATIC_ROOT, prefix='static')


# ---- OPTION 2: S3 + CloudFront (django-storages) ----
# settings/production.py

AWS_ACCESS_KEY_ID     = env('AWS_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = env('AWS_SECRET_ACCESS_KEY')
AWS_STORAGE_BUCKET_NAME = env('AWS_STORAGE_BUCKET_NAME')
AWS_S3_REGION_NAME    = env('AWS_S3_REGION_NAME', default='us-east-1')
AWS_S3_CUSTOM_DOMAIN  = f'{AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com'
AWS_S3_OBJECT_PARAMETERS = {
    'CacheControl': 'max-age=86400',
}
AWS_DEFAULT_ACL = 'public-read'
AWS_QUERYSTRING_AUTH = False  # public files — no signed URLs needed

# Static files → S3
STATICFILES_STORAGE = 'storages.backends.s3boto3.S3StaticStorage'
STATIC_URL = f'https://{AWS_S3_CUSTOM_DOMAIN}/static/'

# Media files (user uploads) → S3
DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
MEDIA_URL = f'https://{AWS_S3_CUSTOM_DOMAIN}/media/'


# ---- WITH CLOUDFRONT CDN ----
# S3 bucket sits behind CloudFront — replace S3 URL with CDN URL:
AWS_CLOUDFRONT_DOMAIN = env('AWS_CLOUDFRONT_DOMAIN', default='')
if AWS_CLOUDFRONT_DOMAIN:
    STATIC_URL = f'https://{AWS_CLOUDFRONT_DOMAIN}/static/'
    MEDIA_URL  = f'https://{AWS_CLOUDFRONT_DOMAIN}/media/'


# ---- CUSTOM S3 STORAGE CLASSES (separate buckets/paths) ----
# storages_backends.py
from storages.backends.s3boto3 import S3Boto3Storage

class StaticStorage(S3Boto3Storage):
    location = 'static'
    default_acl = 'public-read'

class MediaStorage(S3Boto3Storage):
    location = 'media'
    default_acl = 'public-read'
    file_overwrite = False   # unique filenames for uploads

# settings.py
STATICFILES_STORAGE  = 'myproject.storages_backends.StaticStorage'
DEFAULT_FILE_STORAGE = 'myproject.storages_backends.MediaStorage'


# ---- DEPLOYMENT COMMANDS ----
# 1. Collect all static files into STATIC_ROOT (or upload to S3)
# python manage.py collectstatic --noinput
#
# 2. With WhiteNoise: collectstatic copies to staticfiles/
#    With S3: collectstatic uploads directly to S3 bucket
#
# CI/CD pipeline step:
# - python manage.py collectstatic --noinput
# - python manage.py migrate
# - gunicorn myproject.wsgi:application --workers 4`,
      outputExplanation: "WhiteNoiseMiddleware intercepts requests for STATIC_URL paths and serves them directly from STATIC_ROOT with proper HTTP cache headers — no nginx configuration needed. CompressedManifestStaticFilesStorage creates a manifest.json mapping original filenames to hashed filenames (style.a1b2c3.css), then rewrites references in CSS/HTML to use the hashed versions, enabling permanent browser caching. S3Boto3Storage intercepts Django's file save operations and uploads directly to S3. MEDIA_URL points to S3/CloudFront for user-uploaded files.",
      commonMistakes: [
        "Not running collectstatic before deployment — the staticfiles directory is empty and users see broken styles.",
        "Using SecurityMiddleware after WhiteNoiseMiddleware — WhiteNoise must come immediately after SecurityMiddleware to serve static files before authentication middleware runs.",
        "Committing AWS credentials to source code — always use environment variables or AWS IAM roles.",
        "Setting AWS_DEFAULT_ACL='public-read' for a private bucket — user-uploaded files (profile pictures, documents) should not be publicly readable. Use signed S3 URLs instead."
      ],
      interviewNotes: [
        "CompressedManifestStaticFilesStorage fingerprints files (style.a1b2c3.css) enabling permanent cache headers (max-age=31536000) — content changes create new URLs.",
        "WhiteNoise adds ETag and Last-Modified headers for cache validation — browsers revalidate but do not redownload unchanged files.",
        "CDN-served static files have much lower latency for global users — edge nodes serve from the nearest geographic location.",
        "S3 storage classes: Standard for frequently accessed files, Intelligent-Tiering for user uploads with variable access patterns.",
        "AWS IAM role-based access (no static credentials) is more secure than AWS_ACCESS_KEY_ID/SECRET — use IAM roles for EC2/ECS deployments."
      ],
      whenToUse: "WhiteNoise for simple deployments (Heroku, single server, low traffic). S3 + CloudFront for high traffic, global users, or when you need to serve large media files.",
      whenNotToUse: "If nginx is already serving static files directly from STATIC_ROOT — adding WhiteNoise would duplicate the work. Choose one or the other."
    },
    tags: ["static-files", "whitenoise", "s3", "cdn", "production"],
    order: 29,
    estimatedMinutes: 18
  },

  {
    id: "security-settings",
    title: "Django Production Security Settings",
    slug: "security-settings",
    category: "production",
    subcategory: "settings",
    difficulty: "intermediate",
    description: "Complete production security settings: HSTS, SSL redirect, secure cookies, CORS, CSP headers, and the deployment checklist.",
    content: {
      explanation: "Django ships with many security settings that are off by default (to not break development). In production, all of them should be enabled. The python manage.py check --deploy command verifies the most critical ones.\n\nHTTP Strict Transport Security (HSTS) tells browsers to only use HTTPS for your domain for HSTS_SECONDS seconds. SECURE_SSL_REDIRECT sends HTTP → HTTPS redirects at the Django level (better done at the load balancer). Session and CSRF cookies need Secure and SameSite attributes. X-Frame-Options prevents your site from being embedded in iframes (clickjacking). CORS settings control which origins can make cross-origin API requests.",
      realExample: "A Django API serves a React frontend on a different domain. CORS headers allow the frontend origin. All cookies are Secure and HttpOnly. HSTS ensures browsers never use HTTP. Content-Security-Policy prevents XSS by whitelisting script sources.",
      codeExample: `# settings/production.py
import os

DEBUG = False

# REQUIRED: list all domains your site serves (no wildcards in production)
ALLOWED_HOSTS = env.list('ALLOWED_HOSTS')
# e.g. ALLOWED_HOSTS=api.example.com,www.example.com

SECRET_KEY = env('SECRET_KEY')   # min 50 chars of randomness


# ---- HTTPS / SSL ----
# Redirect all HTTP → HTTPS at the Django level
# (prefer doing this at load balancer/nginx level instead)
SECURE_SSL_REDIRECT = True

# Trust X-Forwarded-Proto header from load balancer
# so Django knows the original request was HTTPS
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')


# ---- HTTP STRICT TRANSPORT SECURITY (HSTS) ----
# Tell browsers to use HTTPS for this domain for 1 year
SECURE_HSTS_SECONDS = 31536000

# Apply HSTS to all subdomains (www.example.com, api.example.com)
SECURE_HSTS_INCLUDE_SUBDOMAINS = True

# Allow site to be added to browser HSTS preload lists
# Submit at https://hstspreload.org ONLY after you are 100% HTTPS
SECURE_HSTS_PRELOAD = True


# ---- COOKIES ----
# Session cookie — only sent over HTTPS
SESSION_COOKIE_SECURE   = True
SESSION_COOKIE_HTTPONLY = True        # no JS access
SESSION_COOKIE_SAMESITE = 'Lax'      # or 'Strict' for more protection
SESSION_COOKIE_AGE      = 3600       # 1 hour

# CSRF cookie — only sent over HTTPS
CSRF_COOKIE_SECURE   = True
CSRF_COOKIE_HTTPONLY = True           # JS cannot read CSRF cookie
CSRF_COOKIE_SAMESITE = 'Lax'


# ---- CLICKJACKING / CONTENT TYPE ----
# Prevent site from being embedded in iframes
X_FRAME_OPTIONS = 'DENY'

# Prevent MIME-type sniffing
SECURE_CONTENT_TYPE_NOSNIFF = True

# Enable browser XSS filter (legacy — CSP is the modern replacement)
SECURE_BROWSER_XSS_FILTER = True


# ---- CORS (Cross-Origin Resource Sharing) ----
# pip install django-cors-headers
INSTALLED_APPS += ['corsheaders']
MIDDLEWARE = ['corsheaders.middleware.CorsMiddleware'] + MIDDLEWARE

CORS_ALLOWED_ORIGINS = env.list('CORS_ALLOWED_ORIGINS', default=[])
# e.g. CORS_ALLOWED_ORIGINS=https://app.example.com,https://www.example.com

CORS_ALLOW_CREDENTIALS = True    # allow cookies in cross-origin requests
CORS_ALLOW_METHODS     = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']

# Never use CORS_ALLOW_ALL_ORIGINS = True in production


# ---- CONTENT SECURITY POLICY ----
# pip install django-csp
INSTALLED_APPS += ['csp']
MIDDLEWARE += ['csp.middleware.CSPMiddleware']

CSP_DEFAULT_SRC = ("'self'",)
CSP_SCRIPT_SRC  = ("'self'", 'https://cdn.jsdelivr.net',)
CSP_STYLE_SRC   = ("'self'", "'unsafe-inline'", 'https://fonts.googleapis.com',)
CSP_FONT_SRC    = ("'self'", 'https://fonts.gstatic.com',)
CSP_IMG_SRC     = ("'self'", 'data:', 'https:',)
CSP_CONNECT_SRC = ("'self'",)
CSP_FRAME_ANCESTORS = ("'none'",)   # same as X-Frame-Options DENY

# ---- DEPLOYMENT CHECKLIST ----
# Run: python manage.py check --deploy
# It checks for:
# - DEBUG = False
# - SECRET_KEY length and randomness
# - ALLOWED_HOSTS not empty
# - DATABASES not using SQLite
# - CACHES configured
# - Session and CSRF cookie secure settings
# - HSTS settings
# - SSL redirect

# ---- SECRET_KEY GENERATION ----
# Generate a new key:
# python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"`,
      outputExplanation: "SECURE_PROXY_SSL_HEADER is critical when Django sits behind a load balancer that terminates SSL — without it Django sees HTTP requests and SECURE_SSL_REDIRECT redirects to HTTPS infinitely. CorsMiddleware must be the first middleware (before Django's CommonMiddleware) so it sets headers on all responses including 401/403. CSP headers are the modern replacement for XSS filters — they whitelist trusted script sources at the browser level.",
      commonMistakes: [
        "Setting SECURE_HSTS_SECONDS too high before testing — if your site later breaks HTTPS, browsers will refuse to load it for HSTS_SECONDS. Start with 300 (5 minutes) and increase after confirming HTTPS works.",
        "Using CORS_ALLOW_ALL_ORIGINS=True in production — allows any website to make cross-origin requests to your API.",
        "Not setting SECURE_PROXY_SSL_HEADER when behind a load balancer — Django redirects HTTPS requests back to HTTPS infinitely.",
        "Setting CSRF_COOKIE_HTTPONLY=True with a JavaScript SPA — the JS client cannot read the CSRF cookie and cannot set the X-CSRFToken header."
      ],
      interviewNotes: [
        "python manage.py check --deploy is the official checklist — run it in CI before deploying.",
        "HSTS is a browser feature — once a browser receives a HSTS header, it enforces HTTPS even if your server sends HTTP. Be careful about setting it on domains you cannot maintain HTTPS on.",
        "SECURE_PROXY_SSL_HEADER tells Django to trust the X-Forwarded-Proto header — only set this if you trust the proxy (load balancer). Malicious clients can spoof this header otherwise.",
        "SameSite=Lax allows cookies to be sent with top-level navigation (links) but not with cross-origin AJAX. SameSite=Strict is most secure but breaks OAuth flows.",
        "Content-Security-Policy violations can be reported with report-uri or report-to directives — use CSP_REPORT_URI to collect violation reports before enforcing."
      ],
      whenToUse: "Every production Django deployment. These are not optional — they are baseline security requirements.",
      whenNotToUse: "Development environments — many of these settings break the development server (HTTPS redirect, HSTS). Keep them in production.py only."
    },
    tags: ["security", "settings", "https", "cors", "csp", "production"],
    order: 30,
    estimatedMinutes: 18
  },

  {
    id: "health-check-endpoint",
    title: "Health Check Endpoint",
    slug: "health-check-endpoint",
    category: "production",
    subcategory: "settings",
    difficulty: "beginner",
    description: "A /health/ endpoint checking DB and cache connectivity for load balancer health checks and Kubernetes probes.",
    content: {
      explanation: "Load balancers and orchestrators (Kubernetes, ECS) need to know when a Django instance is ready to receive traffic (readiness probe) and whether it is still alive (liveness probe). A health check endpoint returns 200 when the app is healthy and 503 when it is not.\n\nA minimal health check just returns 200 immediately. A comprehensive check verifies database connectivity (catches misconfiguration and DB outages) and cache connectivity (catches Redis connection failures). Optional: check Celery by querying the result backend.\n\nKubernetes distinguishes liveness (is the process stuck?) from readiness (is it ready to handle traffic?). A readiness probe checks DB + cache. A liveness probe just checks that the process is responsive — a simple 200 is enough.",
      realExample: "A Kubernetes deployment has readinessProbe hitting /health/ every 10 seconds. When the database is unavailable, the endpoint returns 503 and Kubernetes removes the pod from the load balancer — preventing users from hitting a pod that cannot serve database-backed requests.",
      codeExample: `# myapp/views.py
import logging
from django.http import JsonResponse
from django.db import connection
from django.core.cache import cache
from django.views.decorators.http import require_GET
from django.views.decorators.cache import never_cache

logger = logging.getLogger(__name__)


@require_GET
@never_cache
def health_check(request):
    """
    Readiness probe — checks DB and cache connectivity.
    Returns 200 if healthy, 503 if any dependency is unhealthy.
    """
    checks = {}
    healthy = True

    # ---- Database check ----
    try:
        with connection.cursor() as cursor:
            cursor.execute('SELECT 1')
        checks['database'] = {'status': 'ok'}
    except Exception as e:
        logger.error('Health check: database failed', exc_info=True)
        checks['database'] = {'status': 'error', 'detail': str(e)}
        healthy = False

    # ---- Cache check ----
    try:
        cache.set('health_check_ping', 'pong', timeout=5)
        value = cache.get('health_check_ping')
        if value != 'pong':
            raise ValueError('Cache ping/pong mismatch')
        cache.delete('health_check_ping')
        checks['cache'] = {'status': 'ok'}
    except Exception as e:
        logger.error('Health check: cache failed', exc_info=True)
        checks['cache'] = {'status': 'error', 'detail': str(e)}
        healthy = False

    status_code = 200 if healthy else 503
    return JsonResponse({
        'status': 'healthy' if healthy else 'unhealthy',
        'checks': checks,
    }, status=status_code)


@require_GET
@never_cache
def liveness_check(request):
    """
    Liveness probe — just confirms the process is running.
    Does not check external dependencies.
    """
    return JsonResponse({'status': 'alive'})


# urls.py
from django.urls import path
from myapp.views import health_check, liveness_check

urlpatterns = [
    path('health/',    health_check,    name='health-check'),
    path('liveness/',  liveness_check,  name='liveness-check'),
    # ... other URLs
]


# ---- EXCLUDE FROM ACCESS LOGGING ----
# In your AccessLogMiddleware, skip health check paths:
# EXCLUDED_PATHS = {'/health/', '/liveness/', '/metrics/'}


# ---- EXCLUDE FROM AUTHENTICATION ----
# If your API requires authentication globally, exempt health check:
# REST_FRAMEWORK = {
#     'DEFAULT_AUTHENTICATION_CLASSES': [...],
#     'DEFAULT_PERMISSION_CLASSES': ['rest_framework.permissions.IsAuthenticated'],
# }
# In the view, override:
# class HealthCheckView(APIView):
#     authentication_classes = []
#     permission_classes = []


# ---- KUBERNETES DEPLOYMENT YAML ----
# spec:
#   containers:
#     - name: django
#       readinessProbe:
#         httpGet:
#           path: /health/
#           port: 8000
#         initialDelaySeconds: 10
#         periodSeconds: 10
#         failureThreshold: 3
#         timeoutSeconds: 5
#       livenessProbe:
#         httpGet:
#           path: /liveness/
#           port: 8000
#         initialDelaySeconds: 30
#         periodSeconds: 30
#         failureThreshold: 3
#         timeoutSeconds: 5

# ---- AWS ALB / ELB HEALTH CHECK ----
# Path: /health/
# Healthy threshold: 2 consecutive 200s
# Unhealthy threshold: 3 consecutive non-200s
# Timeout: 5s
# Interval: 30s`,
      outputExplanation: "connection.cursor().execute('SELECT 1') is the lightest possible DB query — it opens a connection if none exists and executes a trivially fast query. The cache.set/get/delete round-trip verifies that the cache backend (Redis) is reachable and writable. @never_cache prevents the response from being cached by proxies. If either check fails, the response is 503 (Service Unavailable) — load balancers and Kubernetes treat this as unhealthy.",
      commonMistakes: [
        "Checking external third-party APIs in the health check — if Stripe or Twilio is down, your service should still be reachable. Only check your own dependencies.",
        "Not excluding the health check from authentication middleware — a load balancer cannot authenticate and receives 401, marking the instance as unhealthy.",
        "Including sensitive information (error details, stack traces) in the health check response — health endpoints are often publicly accessible.",
        "Using the health check as a metrics endpoint — keep it minimal. Use /metrics/ with Prometheus exporter for detailed metrics."
      ],
      interviewNotes: [
        "Kubernetes readiness vs liveness: readiness removes the pod from the load balancer (recoverable), liveness restarts the pod (fatal error).",
        "A 200 from a health check that doesn't actually check the DB can hide database failures until users start seeing 500 errors.",
        "Load balancer health checks typically run every 10-30 seconds — a 2-3 second timeout on DB + cache checks is reasonable.",
        "Health check endpoints should have O(1) performance — a complex query or heavy computation would make the instance appear slow.",
        "django-health-check is a third-party package that provides a plug-in system for health check components (DB, cache, celery, S3, etc.)."
      ],
      whenToUse: "Every production deployment behind a load balancer, Kubernetes, ECS, or any orchestrator that needs to verify instance health.",
      whenNotToUse: "Single-server deployments with no load balancer where there is nothing consuming the health check. Still useful for monitoring tools even without a load balancer."
    },
    tags: ["health-check", "kubernetes", "load-balancer", "monitoring", "devops"],
    order: 31,
    estimatedMinutes: 12
  },

  // ─── CACHING (32–36) ────────────────────────────────────────────────────────
  {
    id: "django-cache-framework",
    title: "Django Cache Framework",
    slug: "django-cache-framework",
    category: "production",
    subcategory: "caching",
    difficulty: "beginner",
    description: "Django's cache API: CACHES settings, cache.set/get/delete/get_or_set, set_many/get_many, key prefixing, and Redis backend setup.",
    content: {
      explanation: "Django provides a unified cache API that works with multiple backends: LocMemCache (in-process, per-worker — development only), FileBasedCache, Memcached, and Redis (via django-redis). The API is simple: cache.set(key, value, timeout), cache.get(key, default), cache.delete(key).\n\ncache.get_or_set(key, callable, timeout) is the cache-aside pattern in one method — if the key is missing it calls the callable, sets the result, and returns it. This avoids the double-check race condition in manual cache-aside.\n\nKey design matters: include model name, PK, and version to avoid collisions. timeout=None means the value is stored forever (until explicitly deleted or cache eviction). Cache versioning (version= kwarg) enables invalidating all keys at a version without enumerating them.",
      realExample: "A product page makes 5 database queries per request. Caching the assembled product data for 5 minutes reduces database load by ~95% on high-traffic pages. cache.get_or_set() handles both cache miss (calls the lambda, stores result) and cache hit (returns cached value) in one line.",
      codeExample: `# pip install django-redis

# settings.py
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': env('REDIS_URL', default='redis://127.0.0.1:6379/1'),
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'IGNORE_EXCEPTIONS': True,   # return None on Redis failure instead of raising
            'SOCKET_CONNECT_TIMEOUT': 5,
            'SOCKET_TIMEOUT': 5,
            'CONNECTION_POOL_KWARGS': {'max_connections': 50},
        },
        'KEY_PREFIX': 'myapp',       # all keys prefixed: myapp:1:user_profile_42
        'VERSION': 1,                # cache version — increment to invalidate all keys
        'TIMEOUT': 300,              # default timeout: 5 minutes
    }
}

# myapp/cache_keys.py — centralize cache key construction
def user_profile_key(user_id: int) -> str:
    return f'user:profile:{user_id}'

def product_key(product_id: int) -> str:
    return f'product:{product_id}'

def category_products_key(category_id: int, page: int) -> str:
    return f'category:{category_id}:products:page:{page}'


# myapp/views.py
from django.core.cache import cache
from myapp.models import Product, UserProfile
from myapp.cache_keys import user_profile_key, product_key
from myapp.serializers import ProductSerializer


def get_product(product_id: int) -> dict:
    key = product_key(product_id)

    # cache.get_or_set: fetch from cache or compute and store
    def compute():
        product = Product.objects.select_related('category').get(pk=product_id)
        return ProductSerializer(product).data

    return cache.get_or_set(key, compute, timeout=300)


# Manual cache-aside pattern
def get_user_profile(user_id: int) -> dict:
    key = user_profile_key(user_id)
    data = cache.get(key)

    if data is None:
        profile = UserProfile.objects.select_related('user').get(user_id=user_id)
        data = {
            'id': profile.user_id,
            'name': profile.user.get_full_name(),
            'avatar': profile.avatar.url if profile.avatar else None,
        }
        cache.set(key, data, timeout=3600)   # 1 hour

    return data


# Bulk operations
def get_many_products(product_ids: list) -> dict:
    keys = {product_key(pid): pid for pid in product_ids}
    cached = cache.get_many(list(keys.keys()))   # one Redis round-trip

    missing_ids = [keys[k] for k in keys if k not in cached]
    if missing_ids:
        products = Product.objects.filter(pk__in=missing_ids)
        new_data = {
            product_key(p.pk): ProductSerializer(p).data
            for p in products
        }
        cache.set_many(new_data, timeout=300)
        cached.update(new_data)

    return {keys[k]: v for k, v in cached.items()}


# Cache control:
cache.set('greeting', 'Hello', timeout=60)       # expires in 60s
cache.set('forever',  'data',  timeout=None)     # never expires
cache.get('greeting', default='Hi')              # returns 'Hi' if missing
cache.delete('greeting')                          # remove one key
cache.delete_many(['key1', 'key2'])              # remove multiple
cache.clear()                                    # clear ALL keys (use with caution!)

# Atomic increment (great for counters)
cache.set('page_views', 0)
cache.incr('page_views')           # atomic increment
cache.incr('page_views', delta=5)  # increment by 5
views = cache.get('page_views')`,
      outputExplanation: "cache.get_or_set(key, callable) atomically performs: if key exists return value, else call callable(), store result, return it. The callable is only called on cache miss, preventing duplicate computation in most cases (not 100% — see thundering herd). cache.get_many() fetches multiple keys in a single Redis MGET command, far more efficient than individual get() calls in a loop. KEY_PREFIX and VERSION are prepended to every key, allowing multiple apps to share one Redis instance.",
      commonMistakes: [
        "Using LocMemCache in production — each Gunicorn worker has its own in-memory cache. Clearing the cache in one worker does not affect others.",
        "Using cache.clear() in production — this clears ALL keys including session data if sessions use the same cache backend. Use cache.delete_pattern() or key versioning instead.",
        "Not handling cache.get() returning None for a legitimately cached None value — use a sentinel: cache.get(key, default=MISSING) and check for MISSING.",
        "Caching the queryset object itself — querysets are lazy and not serializable. Cache the evaluated data (list, dict) instead."
      ],
      interviewNotes: [
        "cache.get_or_set() has a thundering herd risk — on cache miss, many concurrent requests all call the callable simultaneously. Use a mutex (cache.add()) for expensive computations.",
        "IGNORE_EXCEPTIONS=True makes Redis failures transparent — cache returns None on error, falling back to the DB. Essential for production resilience.",
        "cache.incr() is atomic in Redis — safe for counters under concurrent access. Not atomic in LocMemCache.",
        "KEY_PREFIX and VERSION are prepended by Django: KEY_PREFIX:VERSION:key. Incrementing VERSION invalidates all keys without enumerating them.",
        "Memcached has a 1 MB value size limit. Redis default is 512 MB but large values should be chunked or stored elsewhere."
      ],
      whenToUse: "Any view or function with repetitive, expensive database queries. Product pages, user profiles, category listings, aggregation queries.",
      whenNotToUse: "Data that must always be current (account balances, stock levels under high demand). User-specific data that changes frequently (notifications, real-time feeds)."
    },
    tags: ["caching", "redis", "django-redis", "performance", "cache"],
    order: 32,
    estimatedMinutes: 18
  },

  {
    id: "view-level-caching",
    title: "View-Level Caching",
    slug: "view-level-caching",
    category: "production",
    subcategory: "caching",
    difficulty: "intermediate",
    description: "Cache entire view responses with @cache_page, Vary headers, per-site cache middleware, and cache invalidation strategies.",
    content: {
      explanation: "View-level caching caches the entire HTTP response (headers + body) for a given URL. This is coarser than data-level caching but requires zero changes to the view logic. Django's @cache_page decorator and CacheMiddleware both use the cache backend to store and retrieve responses.\n\nVary headers are critical: @cache_page caches per-URL by default. If the view returns different content for different Accept-Language or Cookie values, you must add Vary headers so the cache stores separate copies per language or per cookie. vary_on_cookie() and vary_on_headers() helpers set these headers.\n\nPer-site caching (UpdateCacheMiddleware + FetchFromCacheMiddleware in MIDDLEWARE) caches all responses automatically — but is incompatible with authenticated content since it ignores the current user.",
      realExample: "A high-traffic blog home page rebuilds the same HTML for every visitor. @cache_page(600) caches the response for 10 minutes. After a new post is published, the cache is manually invalidated. The page is rebuilt once and served to the next 10,000 visitors from cache.",
      codeExample: `# myapp/views.py
from django.views.decorators.cache import cache_page, never_cache
from django.views.decorators.vary import vary_on_cookie, vary_on_headers
from django.views.generic import ListView
from django.utils.decorators import method_decorator
from myapp.models import Post


# ---- @cache_page DECORATOR ----
@cache_page(60 * 10)   # cache for 10 minutes (600 seconds)
def post_list(request):
    posts = Post.objects.filter(status='published').order_by('-created_at')[:10]
    return render(request, 'blog/post_list.html', {'posts': posts})


# With Vary header — cache separate copies per language
@cache_page(60 * 10)
@vary_on_headers('Accept-Language')
def localized_view(request):
    # Returns different content based on Accept-Language header
    return render(request, 'landing.html')


# Never cache authenticated views
@never_cache
def user_dashboard(request):
    return render(request, 'dashboard.html', {'user': request.user})


# Class-based view
@method_decorator(cache_page(60 * 10), name='dispatch')
class PublicPostListView(ListView):
    model = Post
    template_name = 'blog/post_list.html'
    queryset = Post.objects.filter(status='published')


# ---- CACHE_PAGE IN URLconf ----
# Alternative: apply cache_page in urls.py instead of the view
# This is cleaner — keeps caching config out of view code
# urls.py
from django.views.decorators.cache import cache_page
from myapp.views import post_list, PublicPostListView

urlpatterns = [
    path('posts/',          cache_page(60 * 10)(post_list),                name='post-list'),
    path('posts/cbv/',      cache_page(60 * 10)(PublicPostListView.as_view()), name='post-list-cbv'),
]


# ---- MANUAL CACHE INVALIDATION ----
from django.core.cache import cache
from django.utils.cache import get_cache_key
from django.test import RequestFactory

def invalidate_post_list_cache():
    """
    Manually invalidate the cache for the post list page.
    This is the tricky part — you need to reconstruct the cache key.
    """
    factory = RequestFactory()
    request = factory.get('/posts/')
    # get_cache_key requires a real request with META set
    # In practice, it's easier to use a custom cache key:
    cache.delete('post_list_cache')

# Better approach: use a custom cache key and invalidate it directly:
from django.core.cache import cache
from django.db.models.signals import post_save
from django.dispatch import receiver

POST_LIST_CACHE_KEY = 'view:post_list:page_1'

@receiver(post_save, sender=Post)
def invalidate_post_list(sender, instance, **kwargs):
    if instance.status == 'published':
        cache.delete(POST_LIST_CACHE_KEY)
        # Also invalidate paginated pages
        for page in range(1, 20):
            cache.delete(f'view:post_list:page_{page}')


# ---- PER-SITE CACHE MIDDLEWARE ----
# settings.py — caches all non-authenticated responses
# MIDDLEWARE = [
#     'django.middleware.cache.UpdateCacheMiddleware',    # FIRST
#     'django.middleware.common.CommonMiddleware',
#     # ... other middleware ...
#     'django.middleware.cache.FetchFromCacheMiddleware', # LAST
# ]
# CACHE_MIDDLEWARE_ALIAS  = 'default'
# CACHE_MIDDLEWARE_SECONDS = 600
# CACHE_MIDDLEWARE_KEY_PREFIX = 'sitecache'
#
# WARNING: Per-site cache does not work with session or CSRF middleware
# correctly if you cache authenticated pages.`,
      outputExplanation: "@cache_page stores the HTTP response (status, headers, body) in the cache backend. The cache key is based on the URL and Vary headers. On subsequent requests to the same URL, the cached response is returned directly without touching the view function. Vary headers tell the cache to store separate copies for different header values. never_cache sends Cache-Control: max-age=0, no-cache, no-store, must-revalidate headers.",
      commonMistakes: [
        "Caching views that return user-specific content — @cache_page ignores the current user by default. Add vary_on_cookie() or check request.user before caching.",
        "Not setting Vary: Cookie on pages that are different when logged in — the cache serves the same response (possibly the logged-out version) to all users.",
        "Expecting manual cache.delete() to invalidate @cache_page responses — the cache key used by @cache_page includes the URL, Vary header values, and a prefix, making it hard to reconstruct manually. Use a custom caching layer instead.",
        "Using per-site cache middleware with CSRF middleware — CSRF tokens are unique per session, making every page different and preventing effective caching."
      ],
      interviewNotes: [
        "@cache_page timeout is in seconds — 60 * 10 = 600 = 10 minutes.",
        "The cache key for @cache_page is constructed from: key_prefix, URL, and values of headers listed in the Vary response header.",
        "FetchFromCacheMiddleware must be the LAST middleware in the list, UpdateCacheMiddleware must be the FIRST — this wraps the entire request/response cycle.",
        "never_cache sends no-store headers which prevent browser, proxy, and CDN caching.",
        "View-level caching is too coarse for personalized pages — use template fragment caching ({% cache 600 fragment_name %}) for partial caching."
      ],
      whenToUse: "Public, non-personalized views with expensive rendering: home pages, blog post lists, product categories, static marketing pages.",
      whenNotToUse: "Any view that returns user-specific content, includes CSRF tokens (forms), or changes frequently. Use data-level caching instead."
    },
    tags: ["caching", "cache-page", "view-cache", "performance", "middleware"],
    order: 33,
    estimatedMinutes: 15
  },

  {
    id: "queryset-caching-pattern",
    title: "QuerySet Result Caching",
    slug: "queryset-caching-pattern",
    category: "production",
    subcategory: "caching",
    difficulty: "intermediate",
    description: "Cache-aside pattern for QuerySet results, signal-based invalidation, and cache key design.",
    content: {
      explanation: "QuerySets are lazy — evaluating the same queryset twice sends two database queries. Django does not cache queryset results between requests. You must implement caching explicitly at the service or view layer.\n\nThe cache-aside (lazy loading) pattern: check cache first, on miss query the DB, store in cache, return. On model save, invalidate the cache via a post_save signal.\n\nCache key design is critical: keys must uniquely identify the data. Include: model name, primary key (for single objects), query parameters (for lists), and a version for easy bulk invalidation. Avoid putting unbounded data in keys (e.g., full query strings).",
      realExample: "A product catalog API serves 50,000 product detail requests per minute. Each request previously ran 3 queries (product + category + images). After caching product data for 5 minutes and invalidating on save, database queries for product detail drop from 150,000/minute to ~100 cache misses/minute.",
      codeExample: `# myapp/cache_manager.py
import logging
from django.core.cache import cache
from myapp.models import Product, Category

logger = logging.getLogger(__name__)

PRODUCT_CACHE_TIMEOUT  = 300   # 5 minutes
CATEGORY_CACHE_TIMEOUT = 600   # 10 minutes


def get_product_data(product_id: int) -> dict | None:
    """Cache-aside: return cached product or fetch and cache."""
    key = f'product:v1:{product_id}'
    data = cache.get(key)

    if data is not None:
        logger.debug('Cache HIT for product %s', product_id)
        return data

    logger.debug('Cache MISS for product %s', product_id)
    try:
        product = (
            Product.objects
            .select_related('category', 'brand')
            .prefetch_related('images', 'tags')
            .get(pk=product_id, is_active=True)
        )
    except Product.DoesNotExist:
        # Cache the miss too — prevents DB hammering for non-existent IDs
        cache.set(key, None, timeout=60)
        return None

    data = {
        'id':          product.pk,
        'name':        product.name,
        'price':       str(product.price),
        'category':    product.category.name,
        'images':      [img.url for img in product.images.all()],
        'tags':        [tag.name for tag in product.tags.all()],
    }
    cache.set(key, data, timeout=PRODUCT_CACHE_TIMEOUT)
    return data


def invalidate_product_cache(product_id: int):
    cache.delete(f'product:v1:{product_id}')
    # Also invalidate category listing caches that include this product
    # (if you maintain per-category caches)
    logger.info('Invalidated cache for product %s', product_id)


def get_category_products(category_id: int, page: int = 1) -> dict:
    key = f'category:v1:{category_id}:page:{page}'

    def compute():
        from myapp.serializers import ProductListSerializer
        from django.core.paginator import Paginator
        products = Product.objects.filter(
            category_id=category_id, is_active=True
        ).order_by('-created_at')
        paginator = Paginator(products, 20)
        page_obj  = paginator.page(page)
        return {
            'products':    ProductListSerializer(page_obj.object_list, many=True).data,
            'total':       paginator.count,
            'total_pages': paginator.num_pages,
        }

    return cache.get_or_set(key, compute, timeout=CATEGORY_CACHE_TIMEOUT)


# myapp/signals.py — signal-based cache invalidation
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from myapp.models import Product
from myapp.cache_manager import invalidate_product_cache
from django.core.cache import cache


@receiver(post_save, sender=Product)
def on_product_saved(sender, instance, **kwargs):
    invalidate_product_cache(instance.pk)
    # Invalidate category caches for all pages (simple approach)
    for page in range(1, 20):
        cache.delete(f'category:v1:{instance.category_id}:page:{page}')


@receiver(post_delete, sender=Product)
def on_product_deleted(sender, instance, **kwargs):
    invalidate_product_cache(instance.pk)


# myapp/apps.py — connect signals
from django.apps import AppConfig

class MyAppConfig(AppConfig):
    name = 'myapp'

    def ready(self):
        import myapp.signals   # noqa


# myapp/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from myapp.cache_manager import get_product_data

class ProductDetailView(APIView):
    def get(self, request, pk):
        data = get_product_data(pk)
        if data is None:
            return Response({'error': 'Not found'}, status=404)
        return Response(data)`,
      outputExplanation: "The cache-aside pattern checks the cache first with cache.get(). On a miss, it queries the database, serializes the result to a plain dict (not a model instance — which is not serializable), and stores it with cache.set(). post_save and post_delete signals call invalidate_product_cache() which deletes the cache key. Caching the 'miss' (None) for 60 seconds prevents a storm of DB queries for non-existent IDs (negative caching).",
      commonMistakes: [
        "Caching model instances directly — model instances are not JSON-serializable. Django's cache uses pickle by default but this is fragile across code changes.",
        "Not connecting signals in AppConfig.ready() — signals connected at module top-level may not fire until the module is imported.",
        "Not invalidating category listing caches when a product is updated — stale category pages show old product data.",
        "Key collision: two models using the same key format — always include the model name in the key: 'product:123' not just '123'."
      ],
      interviewNotes: [
        "Cache-aside (lazy loading) is the most common cache pattern — the app populates the cache on demand. Write-through (write to cache and DB together) is less common.",
        "Signal-based invalidation is event-driven — the cache is never stale for more than the duration of the signal processing.",
        "TTL-based expiry (timeout=300) is the fallback — if a signal is missed, the cache expires naturally.",
        "Negative caching (caching None for missing PKs) prevents cache stampedes on non-existent resources.",
        "django-cacheops provides automatic queryset caching and signal-based invalidation — it instruments the ORM to generate cache keys from the queryset and invalidates them on model changes."
      ],
      whenToUse: "Read-heavy endpoints where the same data is requested frequently. Product pages, user profiles, category listings, configuration data.",
      whenNotToUse: "Highly dynamic data (stock levels during flash sales, real-time bids) or user-specific data that changes per request."
    },
    tags: ["caching", "queryset", "cache-aside", "signals", "performance"],
    order: 34,
    estimatedMinutes: 18
  },

  {
    id: "redis-cache-patterns",
    title: "Redis-Specific Caching Patterns",
    slug: "redis-cache-patterns",
    category: "production",
    subcategory: "caching",
    difficulty: "advanced",
    description: "Raw Redis access with django-redis, atomic counters, Redis as session backend, TTL inspection, and cache warm-up.",
    content: {
      explanation: "django-redis exposes the raw Redis connection through get_redis_connection() for operations that go beyond Django's cache API: atomic counters (INCR/DECR), sets, sorted sets, pub/sub, and TTL inspection.\n\nRedis as a session backend is a common and performant pattern — session data is stored in Redis with natural TTL support, much faster than the default database backend and easier to scale than file sessions.\n\nCache warm-up (pre-populating cache on deploy) prevents a cold-start performance drop when a new deployment starts with an empty cache. Running warm-up as part of the deployment pipeline ensures the cache is ready before the first user request.",
      realExample: "A rate limiter uses Redis INCR for atomic request counting per user per minute. The user profile is cached in Redis as a Django session. On deploy, a management command pre-warms the 1000 most popular product pages.",
      codeExample: `# pip install django-redis

# settings.py
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': env('REDIS_URL'),
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'IGNORE_EXCEPTIONS': True,
        },
    }
}

# Redis as session backend — sessions stored in Redis with TTL
SESSION_ENGINE  = 'django.contrib.sessions.backends.cache'
SESSION_CACHE_ALIAS = 'default'   # use the 'default' cache (Redis)


# myapp/redis_utils.py
from django_redis import get_redis_connection
import time
import logging

logger = logging.getLogger(__name__)


def get_redis():
    """Get raw Redis connection — bypasses Django's cache key prefixing."""
    return get_redis_connection('default')


# ---- ATOMIC COUNTERS ----
def increment_page_view(page_key: str) -> int:
    """Atomically increment a page view counter. Returns new count."""
    redis = get_redis()
    count = redis.incr(f'pageviews:{page_key}')
    redis.expire(f'pageviews:{page_key}', 86400)   # expire after 24 hours
    return count


def get_page_views(page_key: str) -> int:
    redis = get_redis()
    value = redis.get(f'pageviews:{page_key}')
    return int(value) if value else 0


# ---- RATE LIMITER USING REDIS ----
def is_rate_limited(user_id: int, limit: int = 100, window: int = 3600) -> bool:
    """
    Returns True if user has exceeded limit requests in window seconds.
    Uses Redis INCR + EXPIRE for atomic counting.
    """
    redis = get_redis()
    key   = f'ratelimit:{user_id}:{int(time.time()) // window}'

    pipe  = redis.pipeline()
    pipe.incr(key)
    pipe.expire(key, window)
    results = pipe.execute()

    count = results[0]
    return count > limit


# ---- TTL INSPECTION ----
from django.core.cache import cache

def inspect_cache_key(key: str):
    """Check if a cache key exists and get its remaining TTL."""
    redis = get_redis()
    # Django prefixes keys: {KEY_PREFIX}:{VERSION}:{key}
    # For raw Redis access, construct the full key:
    full_key = f'myapp:1:{key}'   # prefix:version:key

    ttl    = redis.ttl(full_key)    # -2 = not exists, -1 = no expiry, N = seconds
    exists = redis.exists(full_key)

    return {
        'exists': bool(exists),
        'ttl_seconds': ttl if ttl >= 0 else None,
        'no_expiry': ttl == -1,
    }


# ---- CACHE WARM-UP MANAGEMENT COMMAND ----
# myapp/management/commands/warm_cache.py
from django.core.management.base import BaseCommand
from django.core.cache import cache
from myapp.models import Product
from myapp.cache_manager import get_product_data
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Pre-warm the cache with most popular products'

    def handle(self, *args, **options):
        # Warm top 100 most viewed products
        top_products = Product.objects.filter(
            is_active=True
        ).order_by('-view_count')[:100]

        warmed = 0
        for product in top_products:
            try:
                get_product_data(product.pk)   # populates cache
                warmed += 1
            except Exception as e:
                logger.error('Failed to warm product %s: %s', product.pk, e)

        self.stdout.write(
            self.style.SUCCESS(f'Warmed {warmed} products')
        )

# Deploy script:
# python manage.py migrate
# python manage.py collectstatic --noinput
# python manage.py warm_cache
# gunicorn myproject.wsgi:application --workers 4

# ---- REDIS PIPELINE (batching commands) ----
def batch_set_counters(data: dict):
    """Set many counters in one Redis round-trip using pipeline."""
    redis = get_redis()
    pipe  = redis.pipeline()
    for key, value in data.items():
        pipe.set(f'counter:{key}', value, ex=3600)
    pipe.execute()   # sends all commands in one round-trip`,
      outputExplanation: "get_redis_connection('default') returns the raw redis-py client object, bypassing Django's cache abstraction. redis.incr() is atomic at the Redis level — safe for counters under concurrency. Pipeline batches multiple Redis commands into one network round-trip. SESSION_ENGINE = 'cache' with SESSION_CACHE_ALIAS = 'default' stores all sessions in Redis with the session TTL managed by SESSION_COOKIE_AGE.",
      commonMistakes: [
        "Forgetting that get_redis_connection() bypasses Django's key prefix — construct the full key manually or use the cache API for normal operations.",
        "Using Python's threading.Lock() for atomic counters — it only works within one process. Use Redis INCR which is atomic across all processes.",
        "Not setting expiry on counters (redis.expire) — forgotten counters accumulate in Redis indefinitely, filling memory.",
        "Using Redis as the session backend and then calling cache.clear() — this deletes all user sessions."
      ],
      interviewNotes: [
        "Redis INCR is atomic — two concurrent INCR calls never result in a double-increment. Perfect for counters, rate limiters, and sequence generation.",
        "Redis pipeline sends multiple commands in one TCP round-trip — 10x faster than 10 individual commands.",
        "SESSION_ENGINE = 'django.contrib.sessions.backends.cache' uses the cache as the session store directly. 'cached_db' reads from cache and writes to DB.",
        "Redis TTL inspection: KEYS matching (O(N) — never use in production), TTL key, DEBUG OBJECT key.",
        "Cache warm-up is a deployment step — run it after the deployment but before switching traffic to the new release."
      ],
      whenToUse: "When you need Redis features beyond simple key-value: counters, rate limiters, leaderboards (sorted sets), pub/sub, or session storage.",
      whenNotToUse: "Simple cache.get/set operations — the Django cache API is simpler and portable across cache backends."
    },
    tags: ["redis", "caching", "django-redis", "counters", "performance"],
    order: 35,
    estimatedMinutes: 20
  },

  {
    id: "cache-invalidation-strategies",
    title: "Cache Invalidation Strategies",
    slug: "cache-invalidation-strategies",
    category: "production",
    subcategory: "caching",
    difficulty: "advanced",
    description: "TTL-based, event-driven, version-based, and tag-based cache invalidation patterns — when to use each.",
    content: {
      explanation: "Cache invalidation is famously hard. There are two problems: invalidating too eagerly (cache misses that defeat the purpose) and not invalidating enough (serving stale data). The right strategy depends on how often data changes and how long stale data is acceptable.\n\nTTL-based expiry is the simplest — the cache entry expires after N seconds regardless of data changes. Acceptable when some staleness is tolerable. Event-driven invalidation via signals or hooks fires immediately when data changes, keeping the cache fresh but adding complexity. Version-based invalidation increments a version number in the cache key to logically invalidate all data without deleting individual keys. Tag-based groups cache keys under tags and invalidates all keys sharing a tag.",
      realExample: "User profile data: cache for 1 hour (TTL). When the user updates their profile, delete the cache key immediately (event-driven). The combination means stale data is served for at most 1 hour passively, but changes trigger immediate invalidation.",
      codeExample: `# myapp/cache_strategies.py
from django.core.cache import cache
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
import logging

logger = logging.getLogger(__name__)


# ── STRATEGY 1: TTL-based (simplest) ──────────────────────────────────────
# Set a timeout — data becomes stale but refreshes automatically.
cache.set('popular_products', data, timeout=300)  # 5 minute staleness OK


# ── STRATEGY 2: Event-driven invalidation (via signals) ───────────────────
from myapp.models import Post, Author

def post_cache_key(post_id: int) -> str:
    return f'post:v1:{post_id}'

def author_posts_key(author_id: int) -> str:
    return f'author:v1:{author_id}:posts'

@receiver(post_save, sender=Post)
def invalidate_post_cache(sender, instance, **kwargs):
    # Invalidate the post itself
    cache.delete(post_cache_key(instance.pk))
    # Invalidate the author's post list
    cache.delete(author_posts_key(instance.author_id))
    logger.debug('Invalidated cache for post %s', instance.pk)

@receiver(post_delete, sender=Post)
def invalidate_post_on_delete(sender, instance, **kwargs):
    cache.delete(post_cache_key(instance.pk))
    cache.delete(author_posts_key(instance.author_id))


# ── STRATEGY 3: Version-based invalidation ────────────────────────────────
# Instead of deleting keys, increment a version stored in cache.
# All keys embed the version — old keys become unreachable.

def get_version(scope: str) -> int:
    return cache.get(f'version:{scope}', default=1)

def invalidate_scope(scope: str):
    """Increment version — logically invalidates all keys in this scope."""
    cache.incr(f'version:{scope}')   # atomic increment

def get_product_versioned(product_id: int) -> dict | None:
    version = get_version('products')
    key = f'product:v{version}:{product_id}'
    data = cache.get(key)
    if data is None:
        # Cache miss — compute and store under versioned key
        try:
            product = Product.objects.get(pk=product_id)
            data = {'id': product.pk, 'name': product.name, 'price': str(product.price)}
            cache.set(key, data, timeout=3600)
        except Product.DoesNotExist:
            return None
    return data

# Invalidate ALL product caches at once:
@receiver(post_save, sender=Product)
def invalidate_all_products(sender, **kwargs):
    invalidate_scope('products')
    # All keys with the old version are now unreachable (orphaned in Redis)
    # They will eventually expire by their TTL — no explicit deletion needed


# ── STRATEGY 4: Tag-based invalidation ───────────────────────────────────
# Group keys under tags, invalidate all keys sharing a tag.
# Requires tracking which keys belong to each tag.
# django-cacheops implements this natively.

class TaggedCache:
    """Simple tag-based cache invalidation using Redis sets."""

    @staticmethod
    def set(key: str, value, timeout: int, tags: list[str]):
        from django_redis import get_redis_connection
        redis = get_redis_connection('default')
        cache.set(key, value, timeout=timeout)
        # Store key under each tag's set
        for tag in tags:
            tag_key = f'cachetag:{tag}'
            redis.sadd(tag_key, key)
            redis.expire(tag_key, timeout + 60)   # tag set lives slightly longer

    @staticmethod
    def invalidate_tag(tag: str):
        from django_redis import get_redis_connection
        redis = get_redis_connection('default')
        tag_key = f'cachetag:{tag}'
        # Get all keys for this tag
        keys = redis.smembers(tag_key)
        if keys:
            cache.delete_many([k.decode() for k in keys])
        redis.delete(tag_key)


# Usage:
TaggedCache.set(
    key='product:42',
    value={'id': 42, 'name': 'Widget'},
    timeout=300,
    tags=['product:42', 'category:electronics']
)
# Later, when category changes:
TaggedCache.invalidate_tag('category:electronics')  # removes all keys tagged with this


# ── COMBINED STRATEGY (recommended) ──────────────────────────────────────
# Use TTL as the fallback (prevents stale data if a signal is missed)
# + event-driven invalidation for immediate freshness on changes
cache.set(key, data, timeout=3600)   # 1 hour fallback TTL

@receiver(post_save, sender=Product)
def invalidate_immediately(sender, instance, **kwargs):
    cache.delete(f'product:v1:{instance.pk}')   # immediate on change`,
      outputExplanation: "TTL-based expiry requires no explicit invalidation but serves stale data until the TTL expires. Event-driven signals delete the cache key immediately on change — fresher data but more complex. Version-based invalidation logically orphans old keys without expensive enumeration — orphaned keys eventually expire by their TTL. Tag-based uses Redis sets to track which keys belong to each tag, enabling batch invalidation of all related keys.",
      commonMistakes: [
        "Version-based invalidation without TTLs — orphaned old-version keys accumulate in Redis indefinitely. Always set a TTL on cached values.",
        "Signal-based invalidation that also needs to work from Django admin — admin does call model.save() so signals fire, but be aware bulk admin actions may call queryset.update() which bypasses signals.",
        "Tag-based invalidation growing unbounded — the tag set grows as new keys are added. Old keys (already expired) still appear in the set. Periodically clean up.",
        "Invalidating too broadly (invalidate_scope for all products when one product changes) — this causes a cache stampede as all product pages miss simultaneously."
      ],
      interviewNotes: [
        "The two hardest problems in computer science: naming things and cache invalidation.",
        "Event-driven + TTL combined is the production sweet spot: immediate invalidation on change, TTL as a fallback for missed signals.",
        "Version-based invalidation is O(1) — no enumeration of keys needed, just increment a counter. Old keys expire by TTL.",
        "django-cacheops implements automatic queryset result caching with tag-based invalidation keyed to model instances.",
        "Stale-while-revalidate: serve stale cache immediately and refresh asynchronously in the background — not natively supported by Django's cache API but implementable with Celery."
      ],
      whenToUse: "TTL-based: data that can be slightly stale (product listings, public pages). Event-driven: user-specific data and frequently updated entities. Version-based: when you need to invalidate a large group of related keys at once.",
      whenNotToUse: "Never cache financial balances, inventory under active purchase, or any data where even 1-second staleness causes business harm."
    },
    tags: ["caching", "invalidation", "redis", "signals", "patterns"],
    order: 36,
    estimatedMinutes: 20
  },

  // ─── CELERY (37–41) ─────────────────────────────────────────────────────────
  {
    id: "celery-setup",
    title: "Celery Setup with Django",
    slug: "celery-setup",
    category: "production",
    subcategory: "celery",
    difficulty: "beginner",
    description: "Install and configure Celery with Redis broker, project celery.py, autodiscover_tasks, delay() vs apply_async(), and Django settings.",
    content: {
      explanation: "Celery is an asynchronous task queue for Python. Tasks are Python functions decorated with @shared_task. They are sent to a message broker (Redis or RabbitMQ) and executed by worker processes. This decouples time-consuming operations (email sending, report generation, image processing) from the HTTP request/response cycle.\n\nThe project-level celery.py initializes the Celery app, configures it from Django settings using app.config_from_object, and calls autodiscover_tasks() to find tasks in each installed app's tasks.py file. The __init__.py imports the celery app so it is initialized when Django starts.",
      realExample: "An e-commerce site sends order confirmation emails after purchase. Without Celery, the user waits 2-3 seconds for the email to send. With Celery, the view sends a task and responds immediately. The email is sent asynchronously within 1-2 seconds.",
      codeExample: `# pip install celery redis django-celery-results

# myproject/celery.py
import os
from celery import Celery

# Tell Celery which settings module to use
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'myproject.settings.local')

app = Celery('myproject')

# Read config from Django settings — all CELERY_* settings
app.config_from_object('django.conf:settings', namespace='CELERY')

# Automatically discover tasks.py in each INSTALLED_APP
app.autodiscover_tasks()

@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')


# myproject/__init__.py — ensure Celery app is loaded with Django
from .celery import app as celery_app
__all__ = ('celery_app',)


# settings/base.py
CELERY_BROKER_URL            = env('REDIS_URL', default='redis://localhost:6379/0')
CELERY_RESULT_BACKEND        = env('REDIS_URL', default='redis://localhost:6379/0')
CELERY_TASK_SERIALIZER       = 'json'
CELERY_RESULT_SERIALIZER     = 'json'
CELERY_ACCEPT_CONTENT        = ['json']
CELERY_TIMEZONE              = 'UTC'
CELERY_TASK_TRACK_STARTED    = True      # STARTED state (for monitoring)
CELERY_TASK_TIME_LIMIT       = 300       # hard timeout: 5 minutes
CELERY_TASK_SOFT_TIME_LIMIT  = 240       # soft timeout: raises SoftTimeLimitExceeded
CELERY_WORKER_PREFETCH_MULTIPLIER = 1    # one task at a time per worker (safer for long tasks)

# django-celery-results — store results in Django DB
INSTALLED_APPS += ['django_celery_results']
CELERY_RESULT_BACKEND = 'django-db'   # or keep redis:// URL

# myapp/tasks.py
from celery import shared_task
from django.core.mail import send_mail
from myapp.models import Order
import logging

logger = logging.getLogger(__name__)


@shared_task(name='myapp.send_order_confirmation')
def send_order_confirmation(order_id: int):
    """Send order confirmation email."""
    try:
        order = Order.objects.select_related('user').get(pk=order_id)
    except Order.DoesNotExist:
        logger.warning('Order %s not found — skipping email', order_id)
        return

    send_mail(
        subject=f'Order #{order.reference} Confirmed',
        message=f'Thank you for your order! Total: {order.total}',
        from_email='orders@example.com',
        recipient_list=[order.user.email],
    )
    logger.info('Order confirmation sent for order %s', order_id)
    return {'order_id': order_id, 'email': order.user.email}


# ---- DISPATCHING TASKS ----
# myapp/views.py
from myapp.tasks import send_order_confirmation

def checkout_view(request):
    order = Order.objects.create(user=request.user, ...)

    # delay() — simple dispatch with positional args
    send_order_confirmation.delay(order.pk)

    # apply_async() — more control
    send_order_confirmation.apply_async(
        args=[order.pk],
        countdown=5,           # delay 5 seconds before executing
        # eta=datetime(2024, 1, 15, 10, 0),  # execute at specific time
        queue='emails',        # route to specific queue
        priority=9,            # 0-9, 9 = highest
        expires=3600,          # discard if not started within 1 hour
    )

    return Response({'order_id': order.pk}, status=201)


# ---- RUNNING WORKERS ----
# Start worker (development):
# celery -A myproject worker --loglevel=info

# Start worker with concurrency (production):
# celery -A myproject worker --loglevel=info --concurrency=4

# Start worker for specific queue:
# celery -A myproject worker --queues=emails --loglevel=info`,
      outputExplanation: "app.config_from_object('django.conf:settings', namespace='CELERY') reads all Django settings prefixed with CELERY_ into Celery's configuration. autodiscover_tasks() imports tasks.py from each INSTALLED_APPS directory. @shared_task means the task is registered on the default Celery app — it doesn't import the app directly, making it portable across projects. delay(args) is shorthand for apply_async(args=[args]).",
      commonMistakes: [
        "Passing model instances as task arguments — model instances are not JSON-serializable (unless you use pickle, which is a security risk). Always pass primary keys.",
        "Not using @shared_task in app tasks — using @app.task creates a circular import between the app and the celery.py module.",
        "Calling task.apply_async() in the same transaction as saving data — if the transaction rolls back, the task has already been dispatched and will try to process non-existent data. Use transaction.on_commit().",
        "Using CELERY_TASK_SERIALIZER='pickle' — pickle is a code execution vulnerability. Always use 'json'."
      ],
      interviewNotes: [
        "@shared_task vs @app.task: shared_task registers on the current app at call time, avoiding circular imports. Use shared_task in application code.",
        "task.delay(args) == task.apply_async(args=[args]) — delay is a convenience shorthand.",
        "CELERY_WORKER_PREFETCH_MULTIPLIER=1 means workers take one task at a time — prevents a slow task from blocking the worker for other tasks.",
        "CELERY_TASK_SOFT_TIME_LIMIT raises SoftTimeLimitExceeded inside the task — you can catch it and clean up. CELERY_TASK_TIME_LIMIT kills the worker process unconditionally.",
        "Celery workers and Django app can run on separate servers — they communicate only through the broker (Redis)."
      ],
      whenToUse: "Any time-consuming operation that should not block the HTTP response: email, SMS, report generation, image processing, API calls to slow services, data imports.",
      whenNotToUse: "Operations that take less than ~100ms — the overhead of serializing, brokering, and deserializing the task may exceed the task's own execution time."
    },
    tags: ["celery", "tasks", "redis", "async", "background"],
    order: 37,
    estimatedMinutes: 20
  },

  {
    id: "celery-task-patterns",
    title: "Celery Task Best Practices",
    slug: "celery-task-patterns",
    category: "production",
    subcategory: "celery",
    difficulty: "intermediate",
    description: "Retry logic, bind=True for self access, task routing, idempotency, apply_async options, and storing results in the database.",
    content: {
      explanation: "Production Celery tasks must handle failures gracefully. self.retry(exc=exc, countdown=60) re-queues the task with a delay — the key is to retry on transient failures (network timeouts) but not on logic errors (invalid data). max_retries limits the retry chain.\n\nIdempotency means a task that runs twice produces the same result as running once. Use get_or_create instead of create, check if work is already done before doing it, and use unique task IDs for deduplication.\n\nTask routing sends specific tasks to dedicated queues with dedicated workers — email tasks go to the 'emails' queue, image processing goes to the 'media' queue (possibly with more RAM). This isolates failure domains.",
      realExample: "A payment webhook processor must be idempotent — the payment provider retries webhooks if the first attempt fails. If the webhook arrives twice, the order should be fulfilled exactly once. The task uses get_or_create(webhook_id=...) to prevent double-processing.",
      codeExample: `# myapp/tasks.py
from celery import shared_task
from celery.exceptions import MaxRetriesExceededError
import logging
import requests

logger = logging.getLogger(__name__)


# ---- RETRY LOGIC with bind=True ----
@shared_task(
    bind=True,                   # gives access to self (the task instance)
    max_retries=3,               # retry up to 3 times (4 total attempts)
    default_retry_delay=60,      # wait 60s before retry (overridden below)
    name='myapp.call_external_api',
)
def call_external_api(self, endpoint: str, payload: dict):
    try:
        response = requests.post(endpoint, json=payload, timeout=10)
        response.raise_for_status()
        return response.json()
    except requests.Timeout as exc:
        # Transient error — retry with exponential backoff
        raise self.retry(
            exc=exc,
            countdown=2 ** self.request.retries * 30,  # 30s, 60s, 120s
        )
    except requests.HTTPError as exc:
        if exc.response.status_code == 429:   # rate limited
            retry_after = int(exc.response.headers.get('Retry-After', 60))
            raise self.retry(exc=exc, countdown=retry_after)
        if exc.response.status_code >= 500:   # server error — retry
            raise self.retry(exc=exc, countdown=60)
        # 4xx client error — do NOT retry, log and fail
        logger.error('External API client error: %s', exc, exc_info=True)
        raise   # raises without retry

    except MaxRetriesExceededError:
        logger.critical('Max retries exceeded for %s', endpoint)
        # Send alert, update DB, etc.
        raise


# ---- IDEMPOTENT TASK ----
@shared_task(name='myapp.process_webhook')
def process_webhook(webhook_id: str, event_type: str, data: dict):
    """
    Idempotent: safe to run multiple times for the same webhook_id.
    Payment providers retry webhooks — this handles duplicate deliveries.
    """
    from myapp.models import WebhookEvent, Order

    # Check if already processed (idempotency key)
    event, created = WebhookEvent.objects.get_or_create(
        webhook_id=webhook_id,
        defaults={'event_type': event_type, 'status': 'processing'}
    )

    if not created:
        if event.status == 'completed':
            logger.info('Webhook %s already processed — skipping', webhook_id)
            return {'skipped': True, 'webhook_id': webhook_id}
        if event.status == 'processing':
            logger.warning('Webhook %s is already being processed', webhook_id)
            return {'skipped': True, 'reason': 'already_processing'}

    try:
        if event_type == 'payment.succeeded':
            order_id = data['order_id']
            Order.objects.filter(pk=order_id).update(
                status='paid',
                paid_at=timezone.now()
            )
        event.status = 'completed'
        event.save(update_fields=['status'])
        return {'processed': True, 'webhook_id': webhook_id}
    except Exception as exc:
        event.status = 'failed'
        event.save(update_fields=['status'])
        raise


# ---- TASK ROUTING ----
# settings.py
from kombu import Queue

CELERY_TASK_QUEUES = (
    Queue('default',  routing_key='default'),
    Queue('emails',   routing_key='emails'),
    Queue('media',    routing_key='media'),
    Queue('critical', routing_key='critical'),
)
CELERY_TASK_DEFAULT_QUEUE = 'default'

CELERY_TASK_ROUTES = {
    'myapp.send_order_confirmation': {'queue': 'emails'},
    'myapp.process_media':           {'queue': 'media'},
    'myapp.process_webhook':         {'queue': 'critical'},
}

# Starting queue-specific workers:
# celery -A myproject worker --queues=emails --concurrency=2
# celery -A myproject worker --queues=media  --concurrency=1 --max-memory-per-child=512000
# celery -A myproject worker --queues=critical,default --concurrency=4


# ---- TASK RESULT STORAGE ----
@shared_task(name='myapp.generate_report')
def generate_report(report_id: int) -> dict:
    from myapp.models import Report
    report = Report.objects.get(pk=report_id)
    # ... generate CSV/PDF ...
    report.status = 'completed'
    report.file_url = '/reports/output.csv'
    report.save()
    return {'report_id': report_id, 'url': report.file_url}

# Check result from outside the task:
from celery.result import AsyncResult

def check_task(task_id: str) -> dict:
    result = AsyncResult(task_id)
    return {
        'state':  result.state,     # PENDING, STARTED, SUCCESS, FAILURE, RETRY
        'result': result.result if result.successful() else None,
        'error':  str(result.info) if result.failed() else None,
    }`,
      outputExplanation: "bind=True injects the task instance as self, providing access to self.retry(), self.request.retries (current attempt count), and self.request.id (task UUID). Exponential backoff (2 ** retries * 30) increases delay after each failure. Idempotency using get_or_create(webhook_id=...) ensures the webhook is processed exactly once even if the task runs multiple times. Task routing uses CELERY_TASK_ROUTES to map task names to queues, allowing dedicated workers per task type.",
      commonMistakes: [
        "Retrying on all exceptions — only retry on transient errors (network, rate limiting). Logic errors (ValueError, KeyError) should fail immediately.",
        "Not making tasks idempotent — if a task fails midway and retries, it may partially complete again. Design tasks to be safe to run twice.",
        "Passing mutable default arguments to tasks — default arguments are evaluated once. Use None and check inside the task.",
        "Long-running tasks holding database connections — Django keeps a DB connection open while the task runs. Set CONN_MAX_AGE=0 for Celery workers."
      ],
      interviewNotes: [
        "self.retry(exc=exc) re-raises a Retry exception — the task is re-queued and the current execution ends immediately.",
        "self.request.retries is 0-indexed — on the first retry it is 1. Compare with self.max_retries to check if this is the last attempt.",
        "Idempotency is a requirement, not a nice-to-have — payment webhooks, email triggers, and any external API callback must be idempotent.",
        "Task routing isolates failure domains — a slow media processing queue does not block the email queue.",
        "AsyncResult.state can be PENDING even if the task doesn't exist — PENDING is the default for unknown task IDs."
      ],
      whenToUse: "Any background task in production. Retry logic is mandatory for tasks calling external APIs. Idempotency is mandatory for tasks processing external events (webhooks, messages).",
      whenNotToUse: "One-off scripts or manual operations — use management commands. Tasks that must complete within the same HTTP transaction — use synchronous code."
    },
    tags: ["celery", "retry", "idempotency", "routing", "tasks"],
    order: 38,
    estimatedMinutes: 22
  },

  {
    id: "celery-periodic-tasks",
    title: "Celery Beat Periodic Tasks",
    slug: "celery-periodic-tasks",
    category: "production",
    subcategory: "celery",
    difficulty: "intermediate",
    description: "Schedule recurring tasks with CELERY_BEAT_SCHEDULE, crontab(), django-celery-beat for DB-stored schedules, and duplicate-run prevention locks.",
    content: {
      explanation: "Celery Beat is the task scheduler process — it reads a schedule and sends tasks to the broker at the right times. Schedules can be defined in settings (CELERY_BEAT_SCHEDULE) using timedelta or crontab(), or stored in the database using django-celery-beat (allowing runtime schedule changes without redeployment).\n\nThe critical production concern: if two Beat instances run (e.g., during a rolling deployment), the same task fires twice. Implement a cache-based lock: the task acquires a Redis lock on startup and returns immediately if it cannot acquire it. The lock expires after the expected task duration to recover from crashes.",
      realExample: "A nightly cleanup task purges soft-deleted records older than 30 days. It runs at 2 AM UTC using crontab(hour=2, minute=0). A Redis lock ensures only one worker executes the cleanup even during a rolling deployment.",
      codeExample: `# settings.py
from celery.schedules import crontab

CELERY_BEAT_SCHEDULE = {
    # Run every 5 minutes
    'refresh-popular-products-cache': {
        'task': 'myapp.refresh_product_cache',
        'schedule': timedelta(minutes=5),
        'args': (),
        'options': {'queue': 'default', 'expires': 290},   # discard if older than 290s
    },

    # Nightly cleanup at 2:00 AM UTC
    'nightly-cleanup': {
        'task': 'myapp.cleanup_deleted_records',
        'schedule': crontab(hour=2, minute=0),
    },

    # Weekly report every Monday at 8 AM
    'weekly-report': {
        'task': 'myapp.generate_weekly_report',
        'schedule': crontab(hour=8, minute=0, day_of_week='monday'),
    },

    # Every hour on the 15-minute mark
    'sync-inventory': {
        'task': 'myapp.sync_inventory',
        'schedule': crontab(minute=15),
    },

    # Business hours only: 9 AM to 5 PM, Mon-Fri
    'check-orders': {
        'task': 'myapp.check_pending_orders',
        'schedule': crontab(minute='*/15', hour='9-17', day_of_week='mon-fri'),
    },
}

CELERY_BEAT_SCHEDULER = 'django_celery_beat.schedulers:DatabaseScheduler'  # for DB schedules


# pip install django-celery-beat
INSTALLED_APPS += ['django_celery_beat']
# python manage.py migrate
# Now schedules can be edited in the admin without redeployment


# myapp/tasks.py
from celery import shared_task
from django.core.cache import cache
from django.utils import timezone
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)

CLEANUP_LOCK_KEY     = 'celery:lock:cleanup_deleted_records'
CLEANUP_LOCK_TIMEOUT = 3600   # 1 hour max runtime


@shared_task(name='myapp.cleanup_deleted_records')
def cleanup_deleted_records():
    """
    Nightly cleanup of soft-deleted records.
    Cache-based lock prevents duplicate execution.
    """
    # Try to acquire the lock (atomic set-if-not-exists)
    acquired = cache.add(CLEANUP_LOCK_KEY, '1', timeout=CLEANUP_LOCK_TIMEOUT)
    if not acquired:
        logger.warning('Cleanup task already running — skipping')
        return {'skipped': True, 'reason': 'lock_held'}

    try:
        logger.info('Starting cleanup of soft-deleted records')
        cutoff = timezone.now() - timedelta(days=30)

        from myapp.models import Document
        deleted_count, _ = Document.all_objects.filter(
            is_deleted=True,
            deleted_at__lt=cutoff
        ).hard_delete()

        logger.info('Cleaned up %d soft-deleted records', deleted_count)
        return {'deleted': deleted_count}

    except Exception as e:
        logger.error('Cleanup task failed', exc_info=True)
        raise
    finally:
        cache.delete(CLEANUP_LOCK_KEY)   # always release lock


@shared_task(name='myapp.refresh_product_cache')
def refresh_product_cache():
    """Refresh cache for top 50 products."""
    from myapp.models import Product
    from myapp.cache_manager import get_product_data

    products = Product.objects.filter(is_active=True).order_by('-view_count')[:50]
    refreshed = 0
    for product in products:
        try:
            # Force refresh by deleting first
            cache.delete(f'product:v1:{product.pk}')
            get_product_data(product.pk)
            refreshed += 1
        except Exception:
            logger.exception('Failed to refresh product %s', product.pk)

    return {'refreshed': refreshed}


# ---- RUNNING BEAT ----
# Development (combined worker + beat):
# celery -A myproject worker --beat --loglevel=info
#
# Production (separate processes):
# celery -A myproject worker --loglevel=info &
# celery -A myproject beat --loglevel=info &
#
# With django-celery-beat:
# celery -A myproject beat --scheduler django_celery_beat.schedulers:DatabaseScheduler`,
      outputExplanation: "cache.add(key, value, timeout) is atomic and returns True only if the key did not already exist. This implements a distributed mutex — two workers attempting cache.add simultaneously will have only one succeed. The finally block always releases the lock. crontab(hour=2, minute=0) fires once per day at 2:00 AM UTC. timedelta(minutes=5) fires every 5 minutes. 'expires' in task options discards the task if it is not started within that many seconds — prevents queued tasks from piling up.",
      commonMistakes: [
        "Running multiple Beat processes — Beat sends tasks, not workers. Two Beat processes double-fire every scheduled task. Only one Beat per Celery app.",
        "Not using a lock in periodic tasks — during rolling deployments, two workers briefly run the same Beat. The lock prevents double-execution.",
        "Not releasing the lock in finally — if the task crashes without a finally block, the lock stays until TTL expiry, blocking subsequent runs.",
        "Using crontab times without specifying timezone — crontab uses UTC by default. Set CELERY_TIMEZONE = 'America/New_York' if you want local times."
      ],
      interviewNotes: [
        "Celery Beat is a single process — it has no worker. It only sends task messages to the broker on schedule.",
        "cache.add() is the Redis SETNX (SET if Not eXists) operation — it is atomic and safe for distributed locking.",
        "django-celery-beat stores schedules in the database — non-technical users can adjust schedules in the admin without a code deployment.",
        "CELERY_BEAT_SCHEDULE options.expires — if a task sits in the queue longer than expires seconds, it is discarded. Essential for tasks that must not pile up.",
        "For precise distributed locking, use redis-py's Redlock algorithm or the redlock-py library instead of cache.add()."
      ],
      whenToUse: "Recurring maintenance tasks: cleanup, report generation, cache warm-up, external API sync, email digests.",
      whenNotToUse: "One-time tasks triggered by user actions — use apply_async() instead. Real-time tasks that need sub-second precision — Celery Beat has ~1 second resolution."
    },
    tags: ["celery", "beat", "periodic", "crontab", "scheduling"],
    order: 39,
    estimatedMinutes: 18
  },

  {
    id: "celery-monitoring",
    title: "Celery Monitoring and Observability",
    slug: "celery-monitoring",
    category: "production",
    subcategory: "celery",
    difficulty: "intermediate",
    description: "Flower dashboard, AsyncResult state inspection, Sentry task failure capture, and custom on_failure signal handlers.",
    content: {
      explanation: "Production Celery requires visibility into task states, queue depths, and failure rates. Flower is the standard web dashboard for monitoring Celery workers and tasks in real time. AsyncResult lets you check task state programmatically. Sentry CeleryIntegration automatically captures task exceptions.\n\nCustom signal handlers (task_failure, task_success, task_retry) allow custom actions on task lifecycle events: sending Slack alerts on failure, updating database status, or reporting metrics to Datadog.\n\nCELERY_TASK_TRACK_STARTED=True makes the STARTED state available — without it, tasks jump from PENDING to SUCCESS/FAILURE, making it impossible to distinguish 'not yet started' from 'in progress'.",
      realExample: "Flower shows a worker queue depth of 500 for the 'media' queue — a deployment forgot to start media workers. An alert fires when any task has been in STARTED state for over 10 minutes (indicating a stuck worker). The on_failure handler updates the Report model status to 'failed' and sends an email to the report requester.",
      codeExample: `# pip install flower

# Start Flower (web UI on port 5555):
# celery -A myproject flower --port=5555 --basic_auth=admin:secretpassword
# celery -A myproject flower --url_prefix=flower  # for nginx reverse proxy

# With authentication and Celery events:
# celery -A myproject worker --events   # workers must send events for Flower

# settings.py
CELERY_TASK_TRACK_STARTED   = True    # enables STARTED state
CELERY_TASK_SEND_SENT_EVENT = True    # enables SENT state for Flower
CELERY_WORKER_SEND_TASK_EVENTS = True


# ---- AsyncResult: checking task state ----
# myapp/views.py
from celery.result import AsyncResult
from rest_framework.views import APIView
from rest_framework.response import Response


class TaskStatusView(APIView):
    def get(self, request, task_id):
        result = AsyncResult(task_id)

        response_data = {
            'task_id': task_id,
            'state':   result.state,
            # States: PENDING, RECEIVED, STARTED, SUCCESS, FAILURE, RETRY, REVOKED
        }

        if result.state == 'PENDING':
            response_data['message'] = 'Task queued or not found'
        elif result.state == 'STARTED':
            response_data['message'] = 'Task in progress'
            response_data['meta'] = result.info   # dict passed to update_state()
        elif result.state == 'SUCCESS':
            response_data['result'] = result.result
        elif result.state == 'FAILURE':
            response_data['error'] = str(result.info)   # exception instance
            response_data['traceback'] = result.traceback
        elif result.state == 'RETRY':
            response_data['message'] = 'Task retrying'

        return Response(response_data)


# Dispatching a task and returning the task_id to the client:
class StartReportView(APIView):
    def post(self, request):
        from myapp.tasks import generate_report
        task = generate_report.apply_async(args=[request.data['report_id']])
        return Response({'task_id': task.id}, status=202)


# ---- Task with progress updates ----
@shared_task(bind=True, name='myapp.long_running_task')
def long_running_task(self, total_items: int):
    for i in range(total_items):
        # ... do work on item i ...
        # Update state with progress info
        self.update_state(
            state='STARTED',
            meta={'current': i + 1, 'total': total_items, 'percent': int((i + 1) / total_items * 100)}
        )

    return {'completed': total_items}


# ---- Sentry integration (see celery-setup for CeleryIntegration) ----
# sentry_sdk.init(integrations=[CeleryIntegration()])
# CeleryIntegration automatically captures unhandled task exceptions


# ---- Custom signal handlers ----
# myapp/signals.py
from celery.signals import task_failure, task_success, task_retry, task_prerun
from django.core.mail import send_mail
import logging

logger = logging.getLogger(__name__)


@task_failure.connect
def handle_task_failure(sender=None, task_id=None, exception=None,
                        args=None, kwargs=None, traceback=None, einfo=None, **kw):
    """
    Called when a task raises an unhandled exception (after max retries).
    """
    logger.error(
        'Task %s (id=%s) failed: %s',
        sender.name, task_id, str(exception),
        exc_info=True,
    )
    # Update related model if this task processes a specific record
    if sender.name == 'myapp.generate_report' and args:
        from myapp.models import Report
        Report.objects.filter(pk=args[0]).update(status='failed')

    # Send alert to on-call
    send_mail(
        subject=f'Celery Task Failed: {sender.name}',
        message=f'Task ID: {task_id}\nError: {exception}\nArgs: {args}',
        from_email='alerts@example.com',
        recipient_list=['oncall@example.com'],
    )


@task_success.connect
def handle_task_success(sender=None, result=None, **kwargs):
    logger.debug('Task %s completed successfully: %s', sender.name, result)


@task_retry.connect
def handle_task_retry(sender=None, request=None, reason=None, einfo=None, **kwargs):
    logger.warning(
        'Task %s (id=%s) retrying: %s (attempt %d/%d)',
        sender.name, request.id, reason,
        request.retries, sender.max_retries,
    )


# Connect signals in app config:
# myapp/apps.py
from django.apps import AppConfig
class MyAppConfig(AppConfig):
    name = 'myapp'
    def ready(self):
        import myapp.signals`,
      outputExplanation: "AsyncResult(task_id) reads the task's state from the result backend (Redis or DB). PENDING means the task has not been seen yet or has not been started — it does not mean 'waiting in queue'. STARTED is only available if CELERY_TASK_TRACK_STARTED=True. task_failure signal fires after max_retries are exhausted — it is the last chance to handle the failure. update_state() in the task body lets you report progress for long-running tasks.",
      commonMistakes: [
        "Assuming PENDING means the task is in the queue — PENDING is also the state for unknown task IDs. Without TRACK_STARTED, you cannot distinguish 'not found' from 'queued'.",
        "Blocking on AsyncResult.get() in a web view — .get() blocks until the task completes, defeating the purpose of async tasks. Use state polling instead.",
        "Not handling the case where the result backend has expired the task result — results expire (default 1 day) and AsyncResult.state returns PENDING for expired tasks.",
        "Using task signals for database writes without error handling — signal handlers that raise exceptions can cause unpredictable behavior."
      ],
      interviewNotes: [
        "Flower requires workers to run with --events flag to see real-time task updates.",
        "AsyncResult.get() has propagate=True by default — it re-raises the task's exception in the calling code. Use propagate=False when you want to inspect failures.",
        "CELERY_TASK_RESULT_EXPIRES controls how long task results are kept in the backend — default is 1 day.",
        "task_failure signal fires for exceptions that escape after max_retries. task_retry fires on each retry.",
        "For production Flower, always enable basic_auth or reverse-proxy authentication — the Flower dashboard can revoke and inspect all tasks."
      ],
      whenToUse: "Any production Celery deployment. Monitoring is not optional — without it, you are flying blind on task failures.",
      whenNotToUse: "Development environments where tailing the worker log is sufficient for debugging."
    },
    tags: ["celery", "flower", "monitoring", "async-result", "observability"],
    order: 40,
    estimatedMinutes: 18
  },

  {
    id: "background-task-patterns",
    title: "Background Task Design Patterns",
    slug: "background-task-patterns",
    category: "production",
    subcategory: "celery",
    difficulty: "advanced",
    description: "Celery canvas patterns: group (fan-out), chain (pipeline), chord (parallel then callback), and transaction.on_commit coordination.",
    content: {
      explanation: "Celery canvas provides primitives for composing tasks: group runs tasks in parallel (fan-out), chain runs tasks sequentially passing results (pipeline), and chord runs a group then calls a callback with all results.\n\nThe most critical coordination pattern: dispatching Celery tasks inside a Django database transaction. If the view dispatches a task and then the transaction rolls back (due to a later exception), the task has already been sent to the broker and will try to process data that was never committed. The solution: use transaction.on_commit() to dispatch the task only after the transaction successfully commits.",
      realExample: "An import job processes 10,000 rows. A chord fans out into 100 parallel tasks (100 rows each), then the callback aggregates results and generates a completion report. The entire chord is dispatched only after the import job record is committed to the database.",
      codeExample: `# myapp/tasks.py
from celery import shared_task, group, chain, chord, signature
from celery.exceptions import Chord
import logging

logger = logging.getLogger(__name__)


@shared_task(name='myapp.process_chunk')
def process_chunk(chunk_ids: list) -> dict:
    """Process a chunk of IDs — used as a subtask in group/chord."""
    from myapp.models import Item
    processed = 0
    failed    = 0
    for item_id in chunk_ids:
        try:
            item = Item.objects.get(pk=item_id)
            item.status = 'processed'
            item.save(update_fields=['status'])
            processed += 1
        except Exception as e:
            logger.error('Failed to process item %s: %s', item_id, e)
            failed += 1
    return {'processed': processed, 'failed': failed}


@shared_task(name='myapp.aggregate_results')
def aggregate_results(results: list, job_id: int) -> dict:
    """Chord callback — receives list of results from the group."""
    from myapp.models import ImportJob
    total_processed = sum(r['processed'] for r in results)
    total_failed    = sum(r['failed']    for r in results)

    ImportJob.objects.filter(pk=job_id).update(
        status='completed',
        processed_count=total_processed,
        failed_count=total_failed,
    )
    return {'total_processed': total_processed, 'total_failed': total_failed}


@shared_task(name='myapp.send_completion_email')
def send_completion_email(job_result: dict, job_id: int):
    """Runs after aggregate_results in a chain."""
    from myapp.models import ImportJob
    from django.core.mail import send_mail
    job = ImportJob.objects.get(pk=job_id)
    send_mail(
        subject='Import Complete',
        message=f"Processed: {job_result['total_processed']}, Failed: {job_result['total_failed']}",
        from_email='system@example.com',
        recipient_list=[job.created_by.email],
    )


# ---- PATTERNS IN ACTION ----

# GROUP: fan-out — run all tasks in parallel
def fan_out_processing(item_ids: list):
    chunks = [item_ids[i:i+100] for i in range(0, len(item_ids), 100)]
    task_group = group(process_chunk.s(chunk) for chunk in chunks)
    result = task_group.apply_async()
    return result.id   # GroupResult ID


# CHAIN: pipeline — output of each task is input to the next
def process_and_notify(item_id: int):
    pipeline = chain(
        process_chunk.s([item_id]),                 # step 1
        send_completion_email.s(job_id=None),       # step 2 — receives step 1's result
    )
    pipeline.apply_async()


# CHORD: parallel then callback — group + callback
def import_with_chord(item_ids: list, job_id: int):
    chunks = [item_ids[i:i+100] for i in range(0, len(item_ids), 100)]

    import_chord = chord(
        group(process_chunk.s(chunk) for chunk in chunks),  # parallel header
        chain(                                               # callback (also a chain)
            aggregate_results.s(job_id),
            send_completion_email.s(job_id),
        )
    )
    import_chord.apply_async()


# CHORD with error handling
def import_with_error_handling(item_ids: list, job_id: int):
    chunks = [item_ids[i:i+100] for i in range(0, len(item_ids), 100)]

    callback = aggregate_results.s(job_id).on_error(
        signature('myapp.handle_chord_error', args=[job_id])
    )
    import_chord = chord(
        group(process_chunk.s(chunk) for chunk in chunks),
        callback
    )
    import_chord.apply_async()


@shared_task(name='myapp.handle_chord_error')
def handle_chord_error(request, exc, traceback, job_id: int):
    from myapp.models import ImportJob
    logger.error('Import chord failed for job %s: %s', job_id, exc)
    ImportJob.objects.filter(pk=job_id).update(status='failed')


# ---- transaction.on_commit — dispatch ONLY after DB commit ----
# myapp/views.py
from django.db import transaction
from myapp.tasks import import_with_chord
from myapp.models import ImportJob

def start_import_view(request):
    with transaction.atomic():
        job = ImportJob.objects.create(
            created_by=request.user,
            status='pending',
            total_items=len(request.data['ids'])
        )
        # WRONG: task dispatched inside transaction — if transaction rolls back,
        # the task is already in the broker:
        # import_with_chord.delay(request.data['ids'], job.pk)

        # CORRECT: dispatch after commit — guaranteed the job row exists in DB
        transaction.on_commit(
            lambda: import_with_chord(request.data['ids'], job.pk)
        )

    return Response({'job_id': job.pk, 'status': 'pending'}, status=202)`,
      outputExplanation: "group(tasks) creates a GroupResult — all tasks are dispatched immediately and run in parallel. chord(group, callback) waits for all group tasks to finish, collects their return values into a list, and passes the list to the callback. chain(task1, task2) passes the return value of task1 as the first argument to task2. transaction.on_commit(callable) registers the callable to run after the current transaction successfully commits — if the transaction rolls back, the callable is never called.",
      commonMistakes: [
        "Dispatching tasks inside a transaction without on_commit — the task may run before the transaction commits, or the transaction may roll back after the task is dispatched.",
        "chord callback receiving results with a failed subtask — by default a chord fails if any subtask fails. Handle subtask errors within each subtask and return a status dict rather than raising.",
        "Using .s() (signature) vs .si() (immutable signature) — .s() passes the parent task's result as the first arg. .si() ignores the parent result. Use .si() for callbacks that don't need the previous result.",
        "Not chunking large datasets — dispatching 10,000 individual tasks creates 10,000 Redis messages. Chunk them into groups of 50-200."
      ],
      interviewNotes: [
        "transaction.on_commit() is the correct pattern for dispatching Celery tasks from views — it ensures the task only runs when data is actually in the database.",
        "chord requires the result backend to collect subtask results — CELERY_RESULT_BACKEND must be configured.",
        "group returns a GroupResult whose .join() blocks until all subtasks complete — never call .join() in a web view.",
        ".s() creates a Signature (lazy task specification). s(arg) is shorthand for signature(task_name, args=[arg]).",
        "Fan-out with chord is the standard pattern for parallel data processing: split → parallel work → aggregate results."
      ],
      whenToUse: "Bulk data processing (imports, exports, bulk email), parallel API calls, multi-step pipelines where each step depends on the previous.",
      whenNotToUse: "Simple tasks with no dependencies — group/chord/chain add complexity. Use delay() for straightforward background work."
    },
    tags: ["celery", "chord", "group", "chain", "canvas", "patterns"],
    order: 41,
    estimatedMinutes: 25
  },

  // ─── API PATTERNS (42–47) ───────────────────────────────────────────────────
  {
    id: "drf-viewset-patterns",
    title: "DRF ViewSet and Router Patterns",
    slug: "drf-viewset-patterns",
    category: "production",
    subcategory: "api-patterns",
    difficulty: "intermediate",
    description: "ModelViewSet, custom @action, Router registration, get_queryset/get_serializer_class overrides, and perform_create injection.",
    content: {
      explanation: "DRF ViewSets combine related views into a single class. ModelViewSet provides all CRUD actions (list, create, retrieve, update, partial_update, destroy) automatically. ReadOnlyModelViewSet provides only list and retrieve. A custom ViewSet can mix in only the actions you need.\n\nThe Router generates URL patterns from ViewSet registrations, eliminating manual url() definitions for standard CRUD. The @action decorator adds non-standard actions (e.g., POST /products/42/publish/) with full permission and throttle support.\n\nOverriding get_queryset() per-request (filtering by request.user) and get_serializer_class() per-action (different shapes for list vs detail) are the two most common customizations.",
      realExample: "A blog API has a PostViewSet. Authors see only their own posts in the list. The detail view shows the full body. The list view shows only title and created_at. A custom @action /posts/42/publish/ changes the post status. Admins see all posts.",
      codeExample: `# myapp/views.py
from rest_framework import viewsets, mixins, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.response import Response
from myapp.models import Post, Comment
from myapp.serializers import (
    PostListSerializer, PostDetailSerializer,
    PostCreateSerializer, CommentSerializer,
)
from myapp.permissions import IsOwnerOrAdmin


class PostViewSet(viewsets.ModelViewSet):
    """
    CRUD for blog posts.
    - List/Retrieve: public
    - Create: authenticated users
    - Update/Delete: owner or admin
    """
    queryset = Post.objects.all()

    # ---- Dynamic queryset per request ----
    def get_queryset(self):
        qs = Post.objects.select_related('author').prefetch_related('tags')

        # Admins see all posts; regular users see only published
        if not self.request.user.is_staff:
            qs = qs.filter(status='published')

        # Filter by author if query param provided
        author_id = self.request.query_params.get('author_id')
        if author_id:
            qs = qs.filter(author_id=author_id)

        return qs.order_by('-created_at')

    # ---- Different serializers per action ----
    def get_serializer_class(self):
        if self.action == 'list':
            return PostListSerializer       # lightweight: title, author, created_at
        if self.action in ('create', 'update', 'partial_update'):
            return PostCreateSerializer     # input: title, body, tags
        return PostDetailSerializer         # full: includes body, comments count

    # ---- Dynamic permissions per action ----
    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [AllowAny()]
        if self.action == 'create':
            return [IsAuthenticated()]
        return [IsOwnerOrAdmin()]   # update, partial_update, destroy

    # ---- Inject current user as author ----
    def perform_create(self, serializer):
        serializer.save(author=self.request.user, status='draft')

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    def perform_destroy(self, instance):
        # Soft delete instead of hard delete
        instance.soft_delete()

    # ---- Custom @action ----
    @action(detail=True, methods=['post'], permission_classes=[IsOwnerOrAdmin])
    def publish(self, request, pk=None):
        """POST /api/posts/42/publish/"""
        post = self.get_object()   # triggers object-level permission check
        try:
            post.publish()
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        serializer = self.get_serializer(post)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsOwnerOrAdmin])
    def archive(self, request, pk=None):
        """POST /api/posts/42/archive/"""
        post = self.get_object()
        post.archive()
        return Response({'status': post.status})

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_posts(self, request):
        """GET /api/posts/my_posts/ — returns current user's posts"""
        qs = Post.objects.filter(author=request.user).order_by('-created_at')
        serializer = PostListSerializer(qs, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='comments')
    def list_comments(self, request, pk=None):
        """GET /api/posts/42/comments/"""
        post = self.get_object()
        comments = Comment.objects.filter(post=post).select_related('author')
        serializer = CommentSerializer(comments, many=True)
        return Response(serializer.data)


# ---- Read-only ViewSet ----
from rest_framework.viewsets import ReadOnlyModelViewSet

class TagViewSet(ReadOnlyModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [AllowAny]


# ---- Custom ViewSet (mix in only what you need) ----
class LimitedPostViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    viewsets.GenericViewSet
):
    """List + Retrieve + Create only — no update or delete."""
    queryset = Post.objects.all()
    serializer_class = PostDetailSerializer


# myapp/urls.py
from rest_framework.routers import DefaultRouter
from myapp.views import PostViewSet, TagViewSet

router = DefaultRouter()
router.register('posts', PostViewSet, basename='post')
router.register('tags',  TagViewSet,  basename='tag')

urlpatterns = router.urls
# Generated URLs:
# GET    /api/posts/                → PostViewSet.list
# POST   /api/posts/                → PostViewSet.create
# GET    /api/posts/{pk}/           → PostViewSet.retrieve
# PUT    /api/posts/{pk}/           → PostViewSet.update
# PATCH  /api/posts/{pk}/           → PostViewSet.partial_update
# DELETE /api/posts/{pk}/           → PostViewSet.destroy
# POST   /api/posts/{pk}/publish/   → PostViewSet.publish (custom action)
# POST   /api/posts/{pk}/archive/   → PostViewSet.archive (custom action)
# GET    /api/posts/my_posts/       → PostViewSet.my_posts (non-detail action)
# GET    /api/posts/{pk}/comments/  → PostViewSet.list_comments`,
      outputExplanation: "get_queryset() is called on every request — filtering in here (not in the queryset class attribute) ensures request-scoped filtering. self.action is the string name of the current action ('list', 'create', 'retrieve', etc.) — use it in get_serializer_class() and get_permissions() for per-action behavior. @action(detail=True) generates /posts/{pk}/action_name/, while detail=False generates /posts/action_name/. perform_create() receives the serializer after validation — call serializer.save(**kwargs) to inject fields that are not in the request body.",
      commonMistakes: [
        "Setting queryset = Post.objects.filter(...) as a class attribute — this is evaluated once at class definition, not per-request. Use get_queryset() instead.",
        "Forgetting to call self.get_object() in custom @action methods — get_object() triggers object-level permission checks. Fetching the object directly bypasses permissions.",
        "Not passing context={'request': request} to serializers — hyperlinked serializers need the request to build absolute URLs.",
        "Overriding list() directly instead of get_queryset() — overriding list() bypasses pagination and filtering backends."
      ],
      interviewNotes: [
        "self.action is the dispatch method name: 'list', 'create', 'retrieve', 'update', 'partial_update', 'destroy', or custom action name.",
        "get_queryset() is called for every action including list, detail, update, and destroy — always filter appropriately.",
        "Router.register(prefix, viewset, basename) — basename is used for URL name generation: basename-list, basename-detail.",
        "perform_create/perform_update/perform_destroy hooks exist specifically to inject request.user or other context — prefer them over overriding create/update/destroy.",
        "GenericViewSet with mixins gives explicit control — ModelViewSet includes all 5 CRUD methods, which may include actions you don't want to expose."
      ],
      whenToUse: "Any REST API with standard CRUD operations. ViewSets + Routers eliminate boilerplate URL definitions and ensure consistent URL patterns.",
      whenNotToUse: "Non-resource endpoints (RPC-style: /send-email/, /calculate-price/) — use APIView instead. Complex workflows with no natural resource model."
    },
    tags: ["drf", "viewset", "router", "api", "crud"],
    order: 42,
    estimatedMinutes: 20
  },

  {
    id: "serializer-patterns",
    title: "DRF Serializer Patterns",
    slug: "serializer-patterns",
    category: "production",
    subcategory: "api-patterns",
    difficulty: "intermediate",
    description: "ModelSerializer vs Serializer, nested serializers with write support, SerializerMethodField, custom validate_<field> and to_representation.",
    content: {
      explanation: "DRF serializers handle both input validation (deserialization) and output formatting (serialization). ModelSerializer auto-generates fields from the model definition. Custom validation at the field level uses validate_<field_name>(), at the object level uses validate().\n\nNested serializers are read-only by default — to support writing to nested data you must override create() or update(). to_representation() transforms the output for each instance. to_internal_value() transforms incoming data before field-level validation.\n\nwrite_only=True fields appear in input but not output (passwords). read_only=True fields appear in output but not input (created_at). SerializerMethodField adds computed fields that call a get_<field_name>(obj) method.",
      realExample: "A User registration serializer takes {username, email, password, confirm_password}. It validates password matches confirm_password in validate(). Password is write_only. The response returns {id, username, email, created_at} — no password in the output.",
      codeExample: `# myapp/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from myapp.models import Post, Comment, Tag

User = get_user_model()


# ---- BASIC MODEL SERIALIZER ----
class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Tag
        fields = ['id', 'name', 'slug']


# ---- NESTED SERIALIZER (read-only) ----
class CommentSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()

    class Meta:
        model  = Comment
        fields = ['id', 'author_name', 'body', 'created_at']

    def get_author_name(self, obj) -> str:
        return obj.author.get_full_name() or obj.author.username


class PostListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views."""
    author = serializers.StringRelatedField()  # calls __str__ on the FK
    tag_names = serializers.SerializerMethodField()

    class Meta:
        model  = Post
        fields = ['id', 'title', 'author', 'tag_names', 'status', 'created_at']

    def get_tag_names(self, obj) -> list:
        return list(obj.tags.values_list('name', flat=True))


class PostDetailSerializer(serializers.ModelSerializer):
    """Full serializer with nested comments."""
    author      = CommentSerializer(source='author', read_only=True)  # nested
    comments    = CommentSerializer(many=True, read_only=True)
    tags        = TagSerializer(many=True, read_only=True)
    tag_ids     = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Tag.objects.all(),
        write_only=True, source='tags'
    )
    comment_count = serializers.SerializerMethodField()

    class Meta:
        model  = Post
        fields = [
            'id', 'title', 'body', 'status', 'author',
            'tags', 'tag_ids', 'comments', 'comment_count',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['status', 'created_at', 'updated_at']

    def get_comment_count(self, obj) -> int:
        # Use prefetch_related in the view to avoid N+1
        return obj.comments.count()

    def to_representation(self, instance):
        """Customize the output representation."""
        data = super().to_representation(instance)
        # Remove 'tag_ids' from output (it's write_only but still appears in some versions)
        data.pop('tag_ids', None)
        # Format price if present
        if 'price' in data and data['price']:
            data['price'] = "\${:.2f}".format(float(data['price']))
        return data


# ---- NESTED WRITE: Post with Tags (write support) ----
class PostCreateSerializer(serializers.ModelSerializer):
    tag_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Tag.objects.all(), source='tags', required=False
    )

    class Meta:
        model  = Post
        fields = ['title', 'body', 'tag_ids']

    def validate_title(self, value: str) -> str:
        """Field-level validation."""
        if len(value.strip()) < 5:
            raise serializers.ValidationError('Title must be at least 5 characters.')
        return value.strip()

    def validate(self, attrs: dict) -> dict:
        """Object-level validation — runs after all field validation."""
        if attrs.get('body') and '<script>' in attrs['body'].lower():
            raise serializers.ValidationError({'body': 'Script tags are not allowed.'})
        return attrs

    def create(self, validated_data):
        tags = validated_data.pop('tags', [])
        post = Post.objects.create(**validated_data)
        post.tags.set(tags)
        return post

    def update(self, instance, validated_data):
        tags = validated_data.pop('tags', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if tags is not None:
            instance.tags.set(tags)
        return instance


# ---- USER REGISTRATION SERIALIZER ----
class UserRegistrationSerializer(serializers.ModelSerializer):
    password         = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model  = User
        fields = ['username', 'email', 'password', 'confirm_password', 'id', 'created_at']
        read_only_fields = ['id', 'created_at']

    def validate(self, attrs):
        if attrs['password'] != attrs.pop('confirm_password'):
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        return attrs

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)`,
      outputExplanation: "PrimaryKeyRelatedField with source='tags' accepts a list of tag IDs in the request body but writes to the post.tags M2M field. write_only=True means the field is accepted in input (POST/PUT) but not included in output (GET). read_only=True is the reverse. validate() receives all fields after individual field validation — use it for cross-field validation. to_representation() is called for every serialized instance — use it to rename, remove, or reformat fields.",
      commonMistakes: [
        "Not popping M2M fields before calling Model.objects.create(**validated_data) — Django's create() does not accept M2M field values. Pop them first, create the instance, then set() them.",
        "Using SerializerMethodField for data that requires a query per instance — this causes N+1. Annotate the queryset in the view instead and read the annotation in the method.",
        "Setting read_only_fields in Meta but also defining the field explicitly — the explicit definition overrides read_only_fields.",
        "Not handling extra_kwargs correctly — extra_kwargs = {'password': {'write_only': True}} is equivalent to defining the field explicitly with write_only=True."
      ],
      interviewNotes: [
        "validate_<field>() receives the field value after type coercion — raise ValidationError to reject it.",
        "validate() receives all fields as a dict — used for cross-field dependencies (password + confirm_password).",
        "to_representation() is called for output; to_internal_value() for input — both can be overridden for deep customization.",
        "source='tags' on a PrimaryKeyRelatedField means the request body field (tag_ids) maps to the model attribute (tags).",
        "Serializer.save() calls create() for new instances (no pk) and update() for existing ones (has pk) — you override these to handle M2M."
      ],
      whenToUse: "Every DRF API endpoint. ModelSerializer for standard CRUD, plain Serializer for non-model data (file uploads, computed results).",
      whenNotToUse: "If you have more than 3 levels of nesting — deeply nested serializers become hard to maintain and cause N+1 queries. Flatten the response or use separate endpoints."
    },
    tags: ["drf", "serializer", "validation", "nested", "api"],
    order: 43,
    estimatedMinutes: 22
  },

  {
    id: "api-versioning",
    title: "API Versioning in DRF",
    slug: "api-versioning",
    category: "production",
    subcategory: "api-patterns",
    difficulty: "intermediate",
    description: "URL path versioning, namespace versioning, request.version in views, and routing to different serializers by version.",
    content: {
      explanation: "API versioning lets you evolve the API without breaking existing clients. DRF supports four schemes: URLPathVersioning (/api/v1/, /api/v2/), NamespaceVersioning (using Django URL namespaces), QueryParameterVersioning (?version=1), and AcceptHeaderVersioning (Accept: application/json; version=1).\n\nURLPathVersioning is the most common and explicit — clients can clearly see which version they are using. The request.version attribute is set by DRF's versioning scheme and is available in every view and serializer.\n\nPer-version routing in views: check request.version and return different serializers, different querysets, or different response shapes based on the version.",
      realExample: "v1 of the API returns user.name as a single field. v2 splits it into first_name and last_name. Existing v1 clients continue to work while v2 clients get the richer structure. The versioning middleware handles routing without duplicating the entire view.",
      codeExample: `# settings.py
REST_FRAMEWORK = {
    'DEFAULT_VERSIONING_CLASS':  'rest_framework.versioning.URLPathVersioning',
    'DEFAULT_VERSION':           'v1',
    'ALLOWED_VERSIONS':          ['v1', 'v2'],
    'VERSION_PARAM':             'version',   # URL segment name
}


# myapp/urls.py
from django.urls import path, include
from myapp.views import UserViewSet, ProductViewSet
from rest_framework.routers import DefaultRouter

router_v1 = DefaultRouter()
router_v1.register('users',    UserViewSet, basename='user')
router_v1.register('products', ProductViewSet, basename='product')

router_v2 = DefaultRouter()
router_v2.register('users',    UserViewSet, basename='user')
router_v2.register('products', ProductViewSet, basename='product')

urlpatterns = [
    path('api/v1/', include((router_v1.urls, 'v1'))),
    path('api/v2/', include((router_v2.urls, 'v2'))),
]

# Generated URLs:
# GET /api/v1/users/
# GET /api/v2/users/


# myapp/serializers.py — version-specific serializers
class UserV1Serializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()  # v1: single name field

    class Meta:
        model  = User
        fields = ['id', 'name', 'email']

    def get_name(self, obj) -> str:
        return obj.get_full_name() or obj.username


class UserV2Serializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = ['id', 'first_name', 'last_name', 'email', 'date_joined']


# myapp/views.py
from rest_framework import viewsets
from rest_framework.response import Response

class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all()

    def get_serializer_class(self):
        """Return different serializer based on API version."""
        version = self.request.version   # 'v1' or 'v2' — set by URLPathVersioning
        if version == 'v2':
            return UserV2Serializer
        return UserV1Serializer   # default to v1

    def get_queryset(self):
        qs = User.objects.all()
        # v2 may return additional fields that require extra data
        if self.request.version == 'v2':
            qs = qs.select_related('profile')
        return qs

    def retrieve(self, request, *args, **kwargs):
        instance   = self.get_object()
        serializer = self.get_serializer(instance)
        data = serializer.data

        # v2 adds extra metadata
        if request.version == 'v2':
            data['api_version'] = 'v2'
            data['_links'] = {
                'self': request.build_absolute_uri(),
            }

        return Response(data)


# ---- VERSIONING IN A MIXIN ----
class VersionedSerializerMixin:
    """
    Mixin that picks the serializer class by version.
    Define: versioned_serializer_classes = {'v1': V1Serializer, 'v2': V2Serializer}
    """
    versioned_serializer_classes = {}

    def get_serializer_class(self):
        version = getattr(self.request, 'version', 'v1')
        serializer_class = self.versioned_serializer_classes.get(version)
        if serializer_class:
            return serializer_class
        return super().get_serializer_class()


class ProductViewSet(VersionedSerializerMixin, viewsets.ModelViewSet):
    queryset = Product.objects.all()
    versioned_serializer_classes = {
        'v1': ProductV1Serializer,
        'v2': ProductV2Serializer,
    }

# ---- AcceptHeaderVersioning alternative ----
# Client sends: Accept: application/json; version=2
# REST_FRAMEWORK = {
#     'DEFAULT_VERSIONING_CLASS': 'rest_framework.versioning.AcceptHeaderVersioning',
# }`,
      outputExplanation: "URLPathVersioning reads the version from the URL segment matching VERSION_PARAM and sets request.version. If the version is not in ALLOWED_VERSIONS, DRF returns 404. DEFAULT_VERSION is used when no version is specified (mainly for AcceptHeader versioning where the client may omit it). get_serializer_class() is the standard hook for per-version serializer selection — it is called by retrieve(), list(), create(), etc.",
      commonMistakes: [
        "Duplicating entire ViewSets per version — the version is a parameter, not a different class. Use get_serializer_class() and get_queryset() to vary behavior.",
        "Not including old versions in ALLOWED_VERSIONS — DRF returns 404 for unknown versions, breaking existing clients.",
        "Using QueryParameterVersioning in production — ?version= parameters can be accidentally stripped by proxies and caches.",
        "Not documenting what changed between versions — clients cannot know which version to use without a changelog."
      ],
      interviewNotes: [
        "URLPathVersioning is the most explicit and most widely used — easy to test in a browser.",
        "AcceptHeaderVersioning is technically more RESTful (the URI identifies the resource, not the version) but harder to test and debug.",
        "Deprecation strategy: when v1 is deprecated, return a Deprecation header with the sunset date before removing it.",
        "request.version is None if no versioning class is configured — always check for None if versioning is optional.",
        "Per-version serializers are the correct abstraction — avoid if/else in serializer field definitions based on version."
      ],
      whenToUse: "Any public API that may evolve over time with breaking changes. APIs with multiple clients (mobile, web, third-party) that deploy independently.",
      whenNotToUse: "Internal APIs where all clients and the server are deployed together. Use feature flags or backwards-compatible schema evolution instead."
    },
    tags: ["api-versioning", "drf", "url-versioning", "rest", "api"],
    order: 44,
    estimatedMinutes: 18
  },

  {
    id: "api-filtering-searching",
    title: "DRF Filtering, Search, and Ordering",
    slug: "api-filtering-searching",
    category: "production",
    subcategory: "api-patterns",
    difficulty: "intermediate",
    description: "django-filter integration, SearchFilter, OrderingFilter, custom FilterSet classes, and filtering on related fields.",
    content: {
      explanation: "DRF's filter backends work as pluggable classes. django-filter provides DjangoFilterBackend with a declarative FilterSet that maps query parameters to queryset filters. SearchFilter provides ?search= with field-level prefix control. OrderingFilter provides ?ordering= with a whitelist of allowed fields.\n\nThe field lookup prefixes in SearchFilter: no prefix = icontains (case-insensitive contains), ^ = istartswith, = = iexact, @ = full-text search (PostgreSQL). FilterSet classes let you declare custom filter methods for complex lookups like date ranges.\n\nAll three backends can be combined on the same view — they are applied in sequence.",
      realExample: "A product API supports ?category=electronics&min_price=50&max_price=200&search=wireless&ordering=-created_at. DjangoFilterBackend handles category and price range, SearchFilter handles the text search, OrderingFilter handles the sort.",
      codeExample: `# pip install django-filter

# settings.py
INSTALLED_APPS += ['django_filters']

REST_FRAMEWORK = {
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
}


# myapp/filters.py
import django_filters
from myapp.models import Product


class ProductFilter(django_filters.FilterSet):
    # Exact match: ?category=electronics
    category = django_filters.CharFilter(field_name='category__slug', lookup_expr='exact')

    # Range filters: ?min_price=50&max_price=200
    min_price = django_filters.NumberFilter(field_name='price', lookup_expr='gte')
    max_price = django_filters.NumberFilter(field_name='price', lookup_expr='lte')

    # Date range: ?created_after=2024-01-01
    created_after  = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_before = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')

    # Boolean: ?in_stock=true
    in_stock = django_filters.BooleanFilter(field_name='stock_count', method='filter_in_stock')

    # Multi-value: ?tags=python&tags=django (OR logic)
    tags = django_filters.BaseInFilter(field_name='tags__slug', lookup_expr='in')

    class Meta:
        model  = Product
        fields = {
            'is_active': ['exact'],
            'brand':     ['exact', 'icontains'],
        }

    def filter_in_stock(self, queryset, name, value):
        if value:
            return queryset.filter(stock_count__gt=0)
        return queryset.filter(stock_count=0)


# myapp/views.py
from rest_framework.generics import ListAPIView
from rest_framework.viewsets import ModelViewSet
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from myapp.models import Product
from myapp.serializers import ProductListSerializer
from myapp.filters import ProductFilter


class ProductListView(ListAPIView):
    queryset         = Product.objects.select_related('category').all()
    serializer_class = ProductListSerializer

    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = ProductFilter   # use the FilterSet class

    # SearchFilter: ?search=wireless
    # ^ = istartswith, = = iexact, @ = full-text, no prefix = icontains
    search_fields = [
        'name',           # icontains match on name
        '^sku',           # istartswith on SKU
        '=category__slug',# exact match on category slug
        'description',    # icontains on description
    ]

    # OrderingFilter: ?ordering=-created_at or ?ordering=price
    ordering_fields = ['created_at', 'price', 'name', 'stock_count']
    ordering        = ['-created_at']   # default ordering


class ProductViewSet(ModelViewSet):
    queryset         = Product.objects.all()
    serializer_class = ProductListSerializer
    filter_backends  = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = {
        'status':   ['exact'],
        'category': ['exact'],
    }
    search_fields    = ['name', 'description']
    ordering_fields  = ['name', 'price']


# ---- Custom filter backend ----
from rest_framework.filters import BaseFilterBackend

class IsActiveFilterBackend(BaseFilterBackend):
    """Always filter out inactive products unless user is staff."""

    def filter_queryset(self, request, queryset, view):
        if request.user.is_staff:
            return queryset
        return queryset.filter(is_active=True)

# Add to view:
# filter_backends = [IsActiveFilterBackend, DjangoFilterBackend, SearchFilter]

# ---- EXAMPLE QUERIES ----
# GET /api/products/?category=electronics&min_price=50&max_price=500
# GET /api/products/?search=wireless+headphones&ordering=-price
# GET /api/products/?tags=python&tags=django&in_stock=true
# GET /api/products/?created_after=2024-01-01&created_before=2024-12-31`,
      outputExplanation: "DjangoFilterBackend reads query params and passes them to the FilterSet. Each FilterSet field maps a query param to a queryset filter. SearchFilter ORs all search_fields and applies the lookup prefix. OrderingFilter validates the ?ordering= param against ordering_fields whitelist — unknown fields are ignored (preventing arbitrary SQL ORDER BY injection). All backends call filter_queryset() in sequence — each narrows the queryset further.",
      commonMistakes: [
        "Using filterset_fields = ['category'] (a list) instead of {'category': ['exact']} — filterset_fields as a list only allows exact lookups implicitly, but the dict form is explicit and clear.",
        "Not whitelisting ordering_fields — without it, any field name is accepted in ?ordering=, including internal fields and related field paths.",
        "Using SearchFilter on unindexed text columns — icontains without a full-text index does a full table scan. Add a database text index or use PostgreSQL full-text search.",
        "Applying filter_backends globally in DEFAULT_FILTER_BACKENDS for all views — search fields on unintended views may expose data or cause errors."
      ],
      interviewNotes: [
        "SearchFilter combines all search_fields with OR logic — a match in any field returns the object.",
        "DjangoFilterBackend combines all filter parameters with AND logic — all conditions must match.",
        "FilterSet.filter_queryset() receives the full queryset — custom filter methods can perform any ORM operation.",
        "The ^ prefix in search_fields uses istartswith — more efficient than icontains because it can use a B-tree index.",
        "django-filter's BaseInFilter allows ?param=val1&param=val2 multi-value filtering, mapping to __in lookup."
      ],
      whenToUse: "Any list API endpoint where clients need to filter, search, or sort results.",
      whenNotToUse: "Highly complex search requirements (faceted search, relevance ranking, full-text scoring) — use Elasticsearch or PostgreSQL full-text search instead of DjangoFilterBackend."
    },
    tags: ["filtering", "search", "ordering", "drf", "django-filter"],
    order: 45,
    estimatedMinutes: 18
  },

  {
    id: "api-response-standards",
    title: "Standardized API Response Format",
    slug: "api-response-standards",
    category: "production",
    subcategory: "api-patterns",
    difficulty: "intermediate",
    description: "Consistent response envelopes, custom DRF renderers, error codes, RFC 7807 Problem Details, and meta-data patterns.",
    content: {
      explanation: "A consistent API response format reduces client-side code duplication. Every response, success or error, has the same outer structure. This is especially important when multiple client teams (web, mobile, third-party) consume the same API.\n\nTwo common approaches: a custom DRF Renderer that wraps every response in an envelope, or a utility function called in every view. The renderer approach is automatic and enforced — views cannot accidentally return inconsistent shapes. The utility function approach is more flexible.\n\nRFC 7807 (Problem Details for HTTP APIs) is the IETF standard for error responses: {type, title, status, detail, instance}. It is gaining adoption alongside custom formats.",
      realExample: "A React frontend and iOS app both consume the same API. Both teams agreed on {success: bool, data: {}, error: {code, message, details}, meta: {}}. The renderer enforces this shape for all endpoints — no per-view wrapping needed.",
      codeExample: `# myapp/renderers.py
from rest_framework.renderers import JSONRenderer
import json


class EnvelopedJSONRenderer(JSONRenderer):
    """
    Wraps all API responses in a consistent envelope:
    {
      "success": true,
      "data": {...},
      "error": null,
      "meta": {}
    }
    On error (status >= 400):
    {
      "success": false,
      "data": null,
      "error": {"code": "...", "message": "...", "details": null},
      "meta": {}
    }
    """

    def render(self, data, accepted_media_type=None, renderer_context=None):
        response = renderer_context.get('response') if renderer_context else None
        status_code = response.status_code if response else 200
        is_error    = status_code >= 400

        if is_error:
            # Error response — data contains error info from exception handler
            if isinstance(data, dict) and 'error' in data:
                error_payload = data['error']
            else:
                error_payload = {
                    'code':    'ERROR',
                    'message': str(data) if data else 'An error occurred.',
                    'details': None,
                }
            envelope = {
                'success': False,
                'data':    None,
                'error':   error_payload,
                'meta':    {},
            }
        else:
            # Success response
            envelope = {
                'success': True,
                'data':    data,
                'error':   None,
                'meta':    self._build_meta(data, response),
            }

        return super().render(envelope, accepted_media_type, renderer_context)

    def _build_meta(self, data, response) -> dict:
        meta = {}
        # Include pagination info in meta if present
        if isinstance(data, dict):
            for key in ('count', 'total_pages', 'next', 'previous'):
                if key in data:
                    meta[key] = data[key]
        return meta


# settings.py
REST_FRAMEWORK = {
    'DEFAULT_RENDERER_CLASSES': [
        'myapp.renderers.EnvelopedJSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer',
    ],
    'EXCEPTION_HANDLER': 'myapp.exception_handlers.custom_exception_handler',
}


# ---- UTILITY APPROACH (alternative to renderer) ----
# myapp/response.py
from rest_framework.response import Response as DRFResponse

class APIResponse:
    @staticmethod
    def success(data=None, message=None, status=200, meta=None) -> DRFResponse:
        return DRFResponse({
            'success': True,
            'data':    data,
            'message': message,
            'error':   None,
            'meta':    meta or {},
        }, status=status)

    @staticmethod
    def error(code: str, message: str, details=None, status=400) -> DRFResponse:
        return DRFResponse({
            'success': False,
            'data':    None,
            'error': {
                'code':    code,
                'message': message,
                'details': details,
            },
            'meta': {},
        }, status=status)

# Usage:
# from myapp.response import APIResponse
# return APIResponse.success(data={'user': ...}, status=201)
# return APIResponse.error('VALIDATION_ERROR', 'Invalid input', details=...)


# ---- RFC 7807 PROBLEM DETAILS ----
# https://tools.ietf.org/html/rfc7807
# {
#   "type": "https://api.example.com/errors/validation-error",
#   "title": "Validation Error",
#   "status": 422,
#   "detail": "The 'email' field is required.",
#   "instance": "/api/users/register",
#   "invalid-params": [
#     {"name": "email", "reason": "required"}
#   ]
# }

def problem_detail_response(
    type_url: str, title: str, status: int,
    detail: str, instance: str = None, **extensions
) -> DRFResponse:
    body = {
        'type':     type_url,
        'title':    title,
        'status':   status,
        'detail':   detail,
    }
    if instance:
        body['instance'] = instance
    body.update(extensions)
    return DRFResponse(body, status=status, content_type='application/problem+json')


# ---- EXAMPLE RESPONSES ----
# Success:
# {"success": true, "data": {"id": 1, "name": "Alice"}, "error": null, "meta": {}}

# Error:
# {"success": false, "data": null,
#  "error": {"code": "NOT_FOUND", "message": "Resource not found.", "details": null}, "meta": {}}

# Paginated:
# {"success": true, "data": [...], "error": null,
#  "meta": {"count": 100, "next": "...", "previous": null}}`,
      outputExplanation: "The custom renderer's render() method wraps every outgoing response before serialization. It distinguishes error responses (status >= 400) from success responses and builds the appropriate envelope. The renderer approach is automatic — no view needs to remember to wrap its response. The utility class approach (APIResponse) is opt-in per view — more flexible but requires discipline to use consistently.",
      commonMistakes: [
        "Not handling paginated responses in the renderer — paginated data has count/next/previous at the top level. Move these to meta and keep only results in data.",
        "Wrapping DRF's BrowsableAPI renderer output — the browsable API adds extra HTML wrapper pages. The renderer must detect and skip wrapping for the browsable API content type.",
        "Including the envelope in error schema documentation but forgetting to update it when the error handler changes — keep renderer and exception handler in sync.",
        "Changing the response format mid-project — clients have already built against the existing format. Treat the response format as a public API contract."
      ],
      interviewNotes: [
        "A consistent response envelope is an API design decision — make it early and stick to it. Changing it breaks all existing clients.",
        "RFC 7807 is the IETF standard for error bodies — use content-type: application/problem+json for RFC-compliant error responses.",
        "The renderer approach enforces the envelope uniformly. The utility approach gives per-view control — choose based on whether consistency or flexibility is the priority.",
        "BrowsableAPIRenderer must come after your custom renderer in DEFAULT_RENDERER_CLASSES — the client's Accept header determines which renderer is used.",
        "Include API version in the response meta or headers — helps clients debug which version of the API responded."
      ],
      whenToUse: "Any API consumed by multiple clients or teams. Standardized responses reduce integration friction and make error handling predictable.",
      whenNotToUse: "Internal service-to-service APIs where both sides are controlled and can evolve together. Or if you follow RFC 7807 Problem Details — that already defines the error format."
    },
    tags: ["api", "response", "envelope", "standards", "drf"],
    order: 46,
    estimatedMinutes: 18
  },

  {
    id: "drf-signals-and-hooks",
    title: "DRF Signals and Request Hooks",
    slug: "drf-signals-and-hooks",
    category: "production",
    subcategory: "api-patterns",
    difficulty: "intermediate",
    description: "perform_create/perform_destroy hooks, post_save signals in DRF context, AppConfig.ready() signal connection, and avoiding signal loops.",
    content: {
      explanation: "DRF provides perform_* hooks for injecting logic around model saves without overriding the full create/update/destroy methods. These are the correct places to inject request.user, dispatch Celery tasks (on_commit), send emails, or perform side effects.\n\nDjango signals (post_save, post_delete, pre_save) work independently of DRF — they fire on any model.save() call, whether from DRF, admin, shell, or management commands. Use signals for side effects that must happen regardless of how the data was saved.\n\nSignal loops occur when a signal handler saves the model, firing the signal again infinitely. Prevent with update_fields (only fire signal when specific fields change) or a dispatch_uid to prevent double-connection.",
      realExample: "When a user registers via the API, perform_create injects the referral code from the request. A post_save signal sends the welcome email (via Celery). The signal fires for any User creation — from API, admin, or shell — ensuring the email is always sent.",
      codeExample: `# myapp/views.py
from rest_framework import viewsets, status
from rest_framework.response import Response
from myapp.models import User, Post, UserProfile
from myapp.serializers import UserRegistrationSerializer, PostSerializer
from myapp.tasks import send_welcome_email, notify_followers
from django.db import transaction


class UserViewSet(viewsets.ModelViewSet):
    serializer_class = UserRegistrationSerializer
    queryset = User.objects.all()

    def perform_create(self, serializer):
        """
        Hook called after serializer.is_valid() and before serializer.save().
        Inject fields that come from the request context, not the request body.
        """
        referral_code = self.request.query_params.get('ref')
        user = serializer.save(
            is_active=True,
            referred_by_code=referral_code
        )
        # Dispatch welcome email after the transaction commits
        transaction.on_commit(
            lambda: send_welcome_email.delay(user.pk)
        )

    def perform_update(self, serializer):
        """Hook called on PUT/PATCH after validation."""
        instance = serializer.save(updated_by=self.request.user)
        # Log the change
        import logging
        logging.getLogger(__name__).info(
            'User %s updated by %s', instance.pk, self.request.user.pk
        )

    def perform_destroy(self, instance):
        """Hook called on DELETE."""
        # Soft delete instead of hard delete
        instance.soft_delete()
        # Return 200 with reason (default is 204 No Content)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response({'message': 'Resource deleted.'}, status=status.HTTP_200_OK)


class PostViewSet(viewsets.ModelViewSet):
    serializer_class = PostSerializer
    queryset = Post.objects.all()

    def perform_create(self, serializer):
        post = serializer.save(author=self.request.user)
        # Notify followers after DB commit
        transaction.on_commit(
            lambda: notify_followers.delay(post.pk, self.request.user.pk)
        )


# myapp/signals.py — side effects via signals (fire for ALL saves, not just API)
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from myapp.models import Post, UserProfile

User = get_user_model()


@receiver(post_save, sender=User, dispatch_uid='create_user_profile')
def create_user_profile(sender, instance, created, **kwargs):
    """
    dispatch_uid='...' prevents double-connection if signals.py is imported twice.
    """
    if created:
        UserProfile.objects.get_or_create(user=instance)


@receiver(post_save, sender=Post, dispatch_uid='invalidate_post_cache')
def invalidate_post_cache(sender, instance, **kwargs):
    """Invalidate cache when a post is saved — regardless of who saved it."""
    from django.core.cache import cache
    cache.delete(f'post:v1:{instance.pk}')
    cache.delete(f'author:v1:{instance.author_id}:posts')


# ---- AVOIDING SIGNAL LOOPS ----
@receiver(post_save, sender=Post)
def update_post_metadata(sender, instance, **kwargs):
    """
    This signal updates post.word_count on save.
    Without update_fields, it would trigger itself infinitely.
    """
    word_count = len(instance.body.split())
    if instance.word_count != word_count:
        # Use update() to bypass the signal (update() does NOT trigger post_save)
        Post.objects.filter(pk=instance.pk).update(word_count=word_count)
        # OR: use update_fields to limit which field changes trigger the signal:
        # instance.word_count = word_count
        # instance.save(update_fields=['word_count'])
        # Then in the signal: if kwargs.get('update_fields') == frozenset({'word_count'}): return


# myapp/apps.py — connect signals exactly once via AppConfig.ready()
from django.apps import AppConfig

class MyAppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'myapp'

    def ready(self):
        """
        ready() is called once when Django starts.
        Import signals here to ensure they are connected exactly once.
        """
        import myapp.signals   # noqa: F401 — imported for side effects (signal connection)`,
      outputExplanation: "perform_create(serializer) is called after serializer.is_valid() and receives the validated serializer. Calling serializer.save(**kwargs) passes additional field values (from the request context) alongside validated data. post_save signal fires after every model.save() call — using dispatch_uid prevents the signal from being connected twice if the app is initialized multiple times. QuerySet.update() bypasses post_save signals — use it to avoid signal loops.",
      commonMistakes: [
        "Connecting signals in models.py at module level — signals may be connected multiple times if the module is reimported. Always use AppConfig.ready().",
        "Creating infinite signal loops: post_save fires → handler calls save() → post_save fires again. Use update() or check update_fields.",
        "Dispatching Celery tasks directly in perform_create without transaction.on_commit — if the outer transaction rolls back, the task was already dispatched.",
        "Using signals for logic that only applies to API calls — signals fire for admin saves and shell too. Use perform_create if the logic is API-specific."
      ],
      interviewNotes: [
        "perform_create/update/destroy are DRF hooks — they run only for DRF views. post_save signals run for any model save.",
        "dispatch_uid is a string unique to the signal handler — prevents duplicate connections across app reloads in development.",
        "transaction.on_commit() in perform_create is the correct way to dispatch Celery tasks — ensures the task only runs after the DB commit.",
        "QuerySet.update() does not trigger post_save signal — this is a common performance optimization and a common source of bugs when you expect signals to fire.",
        "Signal handlers should be fast and side-effect-free with respect to the model being saved — avoid circular saves."
      ],
      whenToUse: "perform_* for API-context side effects (inject request.user, dispatch tasks). Signals for model-level side effects (cache invalidation, audit logs, profile creation) that must fire regardless of how the data was saved.",
      whenNotToUse: "Avoid signals for complex business logic — they are hard to test, hard to trace, and fire unexpectedly during admin saves, data migrations, and test fixtures."
    },
    tags: ["drf", "signals", "perform-create", "hooks", "patterns"],
    order: 47,
    estimatedMinutes: 18
  },

  // ─── SECURITY (48–52) ───────────────────────────────────────────────────────
  {
    id: "sql-injection-prevention",
    title: "SQL Injection Prevention",
    slug: "sql-injection-prevention",
    category: "production",
    subcategory: "security",
    difficulty: "intermediate",
    description: "Django ORM parameterization, safe raw() queries, cursor.execute() with params, and sanitizing user-controlled order_by fields.",
    content: {
      explanation: "Django's ORM parameterizes all queries automatically — field values are always treated as parameters, never interpolated as SQL. This makes standard ORM queries immune to SQL injection by design.\n\nThe danger area is raw SQL. raw() and cursor.execute() accept a params argument that is also parameterized. The critical rule: never use Python string formatting (% or f-strings) to insert user data into SQL strings. Always use the params tuple or list.\n\nAnother injection vector: user-controlled ORDER BY fields. SQL ORDER BY accepts column names, not parameters — you cannot parameterize order_by(). You must whitelist allowed field names against the model's actual fields.",
      realExample: "A search API accepts ?sort=name and passes it directly to order_by(request.GET['sort']). An attacker sends ?sort=(CASE WHEN (SELECT 1 FROM admin WHERE...)=1 THEN 1 ELSE 1/0 END) to perform a blind SQL injection. The whitelist check prevents this.",
      codeExample: `# myapp/views.py
from django.db import connection
from myapp.models import Product


# ---- ORM: ALWAYS SAFE (parameterized automatically) ----
# These are ALL safe — values are parameterized by Django:
Product.objects.filter(name=user_input)
Product.objects.filter(name__icontains=user_input)
Product.objects.raw('SELECT * FROM myapp_product WHERE name = %s', [user_input])


# ---- UNSAFE: NEVER DO THESE ----
# ❌ String formatting in raw SQL:
Product.objects.raw(f'SELECT * FROM myapp_product WHERE name = "{user_input}"')
Product.objects.raw('SELECT * FROM myapp_product WHERE name = "%s"' % user_input)

# ❌ cursor.execute without params:
with connection.cursor() as cursor:
    cursor.execute(f'SELECT * FROM myapp_product WHERE name = "{user_input}"')


# ---- SAFE raw() usage ----
with connection.cursor() as cursor:
    # Always pass user data as params — the DB driver handles quoting
    cursor.execute(
        'SELECT id, name, price FROM myapp_product WHERE category_id = %s AND is_active = %s',
        [category_id, True]   # parameters as a list, never interpolated
    )
    columns = [col[0] for col in cursor.description]
    rows    = cursor.fetchall()
    results = [dict(zip(columns, row)) for row in rows]


# ---- RawSQL expression (safe) ----
from django.db.models.expressions import RawSQL

# Add a computed annotation using raw SQL with parameters
products = Product.objects.annotate(
    relevance=RawSQL(
        "ts_rank(to_tsvector('english', name), plainto_tsquery('english', %s))",
        [search_term]
    )
).order_by('-relevance')


# ---- SANITIZING ORDER_BY FROM USER INPUT ----
from django.db.models import Field

ALLOWED_SORT_FIELDS = {'name', 'price', 'created_at', '-name', '-price', '-created_at'}

def safe_order_by(sort_param: str) -> str:
    """Validate user-supplied sort field against a whitelist."""
    if sort_param in ALLOWED_SORT_FIELDS:
        return sort_param
    return '-created_at'   # default fallback


class ProductListView(APIView):
    def get(self, request):
        sort_param = request.query_params.get('ordering', '-created_at')
        safe_sort  = safe_order_by(sort_param)

        products = Product.objects.filter(is_active=True).order_by(safe_sort)
        return Response(ProductSerializer(products, many=True).data)


# ---- EVEN SAFER: validate against actual model fields ----
def get_safe_ordering(model, sort_param: str, default='-created_at') -> str:
    """
    Validate sort_param against the model's actual field names.
    Handles leading '-' for descending order.
    """
    if not sort_param:
        return default

    # Strip leading '-' (descending indicator)
    field_name = sort_param.lstrip('-')

    # Get all field names from the model
    model_fields = {f.name for f in model._meta.get_fields()}

    if field_name in model_fields:
        return sort_param   # safe — it's a real field name
    return default


class SafeProductListView(APIView):
    def get(self, request):
        raw_ordering = request.query_params.get('ordering', '-created_at')
        ordering = get_safe_ordering(Product, raw_ordering)
        products = Product.objects.order_by(ordering)
        return Response(ProductSerializer(products, many=True).data)


# ---- extra() — deprecated, avoid ----
# extra() allows raw SQL fragments — deprecated in Django 3.2
# Use RawSQL, annotate(), or filter() with Q objects instead
# Product.objects.extra(where=['name = %s'], params=[user_input])  # deprecated`,
      outputExplanation: "cursor.execute(sql, params) passes the SQL string and parameters separately to the database driver. The driver handles quoting and escaping — the parameter is never interpolated into the SQL string itself. RawSQL(sql, params) follows the same pattern for annotations. Order-by validation compares the stripped field name against the model's actual field set (from _meta.get_fields()) — this is safer than a manual whitelist because it adapts automatically when fields are added.",
      commonMistakes: [
        "Using cursor.execute('SELECT ... WHERE id = %s' % user_id) — the % operator is Python string formatting, not parameterization. Use cursor.execute('SELECT ... WHERE id = %s', [user_id]).",
        "Trusting that ORM filter() is always safe and writing filter(id=int(request.GET['id'])) without catching ValueError — the int() call itself may raise, but that's a separate concern.",
        "Not validating order_by fields from user input — any string is a valid ORDER BY column name in SQL, making it an injection vector.",
        "Using extra() which is deprecated — it has complex escaping rules and is easy to misuse. Use RawSQL or annotate() instead."
      ],
      interviewNotes: [
        "Django ORM's Q objects, filter(), and exclude() are all parameterized — safe by default.",
        "The only unsafe paths are: raw() without params, cursor.execute() without params, and extra() (deprecated).",
        "ORDER BY cannot be parameterized — it accepts column names, not values. Whitelist validation is mandatory for user-controlled ordering.",
        "RawSQL(sql, params) is safe — params is passed separately to the DB driver.",
        "PostgreSQL supports parameterized queries natively. Django's database adapters ensure all ORM operations use parameterized queries."
      ],
      whenToUse: "Always follow these patterns. SQL injection prevention is non-negotiable.",
      whenNotToUse: "Never use f-strings or % string formatting with user input in raw SQL — regardless of any perceived safety."
    },
    tags: ["security", "sql-injection", "raw-sql", "orm", "prevention"],
    order: 48,
    estimatedMinutes: 18
  },

  {
    id: "csrf-protection",
    title: "CSRF Protection",
    slug: "csrf-protection",
    category: "production",
    subcategory: "security",
    difficulty: "intermediate",
    description: "Django CSRF middleware, CSRF tokens in forms, X-CSRFToken for SPAs, csrf_exempt, and SessionAuthentication CSRF requirements.",
    content: {
      explanation: "Cross-Site Request Forgery (CSRF) attacks trick authenticated browsers into making unwanted requests to a site where the user is logged in. Django's CsrfViewMiddleware validates a CSRF token on all state-changing requests (POST, PUT, PATCH, DELETE) when session authentication is used.\n\nFor server-rendered forms, {% csrf_token %} injects a hidden input. For SPAs with JavaScript, the CSRF token is read from the csrftoken cookie and sent in the X-CSRFToken header. DRF's SessionAuthentication enforces CSRF checking — if you use session auth in a DRF view, CSRF is required even for API calls.\n\nTokenAuthentication and JWTAuthentication are CSRF-exempt by design — the token in the Authorization header already proves the request is intentional.",
      realExample: "A React SPA uses session authentication (not token auth) to avoid the complexity of token refresh. Axios is configured to read the csrftoken cookie and attach it as the X-CSRFToken header on every non-GET request. Without this, all POST/PUT/DELETE calls return 403.",
      codeExample: `# settings.py
MIDDLEWARE = [
    # ...
    'django.middleware.csrf.CsrfViewMiddleware',
    # ...
]

# CSRF cookie settings
CSRF_COOKIE_SECURE      = True    # HTTPS only
CSRF_COOKIE_HTTPONLY    = False   # JS must read it to send X-CSRFToken
CSRF_COOKIE_SAMESITE    = 'Lax'
CSRF_TRUSTED_ORIGINS    = [
    'https://app.example.com',
    'https://admin.example.com',
]   # allowed cross-origin hosts (Django 4.0+)


# ---- FORMS (server-rendered) ----
# templates/myapp/form.html
# <form method="post">
#   {% csrf_token %}  {# renders: <input type="hidden" name="csrfmiddlewaretoken" value="..."> #}
#   {{ form.as_p }}
#   <button type="submit">Submit</button>
# </form>


# ---- CSRF EXEMPT (for API endpoints) ----
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

# Use csrf_exempt only for endpoints using token-based auth (NOT session auth)
@csrf_exempt
def webhook_receiver(request):
    """External webhooks cannot provide a CSRF token — exempt them."""
    # Verify webhook authenticity with HMAC signature instead:
    import hmac, hashlib
    signature = request.headers.get('X-Webhook-Signature', '')
    expected  = hmac.new(
        WEBHOOK_SECRET.encode(), request.body, hashlib.sha256
    ).hexdigest()
    if not hmac.compare_digest(signature, expected):
        return JsonResponse({'error': 'Invalid signature'}, status=403)
    # ... process webhook ...


# DRF APIView — csrf_exempt on the class level
@method_decorator(csrf_exempt, name='dispatch')
class PublicAPIView(APIView):
    authentication_classes = []   # no session auth — CSRF not required
    permission_classes = []


# ---- DRF SessionAuthentication CSRF requirement ----
# When using SessionAuthentication, DRF enforces CSRF.
# If your DRF API uses session auth, the JS client must send X-CSRFToken.

# axios setup for CSRF (React / JS SPA):
# import axios from 'axios';
# import Cookies from 'js-cookie';
#
# axios.defaults.xsrfCookieName = 'csrftoken';       // cookie name Django uses
# axios.defaults.xsrfHeaderName = 'X-CSRFToken';     // header name Django expects
# axios.defaults.withCredentials = true;              // send cookies cross-origin
#
# // Or set manually:
# const csrfToken = Cookies.get('csrftoken');
# axios.defaults.headers.common['X-CSRFToken'] = csrfToken;


# ---- GET the CSRF token for a SPA (without a form page) ----
from django.middleware.csrf import get_token
from django.http import JsonResponse

def csrf_token_view(request):
    """
    Endpoint that sets the CSRF cookie and returns the token.
    Call this once before making state-changing requests.
    """
    token = get_token(request)   # also sets the cookie
    return JsonResponse({'csrfToken': token})


# ---- DRF views and CSRF ----
# TokenAuthentication → CSRF NOT enforced (stateless, no session)
# JWTAuthentication   → CSRF NOT enforced (stateless, no session)
# SessionAuthentication → CSRF IS enforced
# BasicAuthentication → CSRF IS enforced (when combined with session)

# If a DRF view mixes SessionAuthentication with other methods:
# REST_FRAMEWORK = {
#     'DEFAULT_AUTHENTICATION_CLASSES': [
#         'rest_framework.authentication.SessionAuthentication',  # enforces CSRF
#         'rest_framework.authentication.TokenAuthentication',    # does not
#     ],
# }
# The view will enforce CSRF if the session auth is used for the request.

# ---- Double-submit cookie pattern ----
# DRF's CSRF check: the csrftoken cookie value must match the X-CSRFToken header.
# The attacker's site can make a cross-origin request but cannot read the csrftoken
# cookie (SameSite=Lax and HttpOnly=False allows JS on your domain to read it,
# but cross-origin JS cannot).`,
      outputExplanation: "CsrfViewMiddleware checks that the csrfmiddlewaretoken in POST data or X-CSRFToken header matches the signed token in the csrftoken cookie. The double-submit cookie pattern works because: the server sets the cookie, only JavaScript on your domain can read it (SameSite prevents cross-origin cookie sending), and attacker-controlled sites cannot read your cookies. Setting CSRF_COOKIE_HTTPONLY=False is intentional — JavaScript needs to read the cookie value to attach it as a header.",
      commonMistakes: [
        "Setting CSRF_COOKIE_HTTPONLY=True — JavaScript cannot read an HttpOnly cookie. The X-CSRFToken header cannot be set, and all POST requests from a SPA fail with 403.",
        "Using csrf_exempt on session-authenticated views — this removes CSRF protection from views that need it. Use token auth for API views instead.",
        "Not including CSRF_TRUSTED_ORIGINS for cross-origin requests — Django 4.0+ validates the Origin header for cross-origin requests.",
        "Forgetting to send withCredentials=true in Axios/fetch — without it, the csrftoken cookie is not sent cross-origin and the request fails CSRF verification."
      ],
      interviewNotes: [
        "CSRF attacks exploit session cookies — because session cookies are sent automatically. Token auth (Authorization header) is not sent automatically, so CSRF is not a concern.",
        "SameSite=Lax prevents the CSRF cookie from being sent on cross-origin requests initiated by foreign sites, adding another layer of protection.",
        "DRF's SessionAuthentication.enforce_csrf() is called from .authenticate() — this is why CSRF enforcement is per-authentication-class.",
        "CSRF_TRUSTED_ORIGINS (Django 4.0+) validates the Origin header for cross-origin POST requests — list all your frontend domains.",
        "The csrftoken cookie is not HttpOnly by design — JavaScript needs to read it. The session cookie IS HttpOnly — JavaScript should not read it."
      ],
      whenToUse: "All state-changing endpoints accessed from browsers with session auth. Handle this at the browser and server level simultaneously.",
      whenNotToUse: "Pure API endpoints using token or JWT auth — these are CSRF-safe by design because the Authorization header is not sent automatically."
    },
    tags: ["csrf", "security", "middleware", "spa", "authentication"],
    order: 49,
    estimatedMinutes: 18
  },

  {
    id: "xss-prevention",
    title: "XSS Prevention",
    slug: "xss-prevention",
    category: "production",
    subcategory: "security",
    difficulty: "intermediate",
    description: "Django template auto-escaping, mark_safe() dangers, format_html() for dynamic HTML, bleach for user HTML, and CSP headers.",
    content: {
      explanation: "Cross-Site Scripting (XSS) injects malicious scripts into pages viewed by other users. Django's template engine auto-escapes HTML by default — < becomes &lt;, & becomes &amp;, etc. This prevents most XSS attacks.\n\nThe danger points: mark_safe() marks a string as safe (no escaping) — if it contains user data, the user can inject scripts. The |safe template filter does the same. format_html() is the safe alternative for constructing HTML with dynamic values — it escapes the arguments but not the format string.\n\nFor rich user content (blog posts, comments with HTML), use bleach to whitelist allowed HTML tags and attributes while stripping dangerous ones. A Content-Security-Policy header adds a browser-level last line of defense.",
      realExample: "A comment system allows basic HTML formatting (bold, italic, links). User input is sanitized with bleach to strip script tags and event handlers. Even if bleach misses something, the CSP header prevents inline script execution.",
      codeExample: `# ---- Django template auto-escaping (default: ON) ----
# templates/myapp/post.html
# Safe — Django auto-escapes user_input:
# {{ user_comment }}
# Renders: &lt;script&gt;alert('xss')&lt;/script&gt; — not executed

# UNSAFE — |safe disables escaping:
# {{ user_comment|safe }}   ← NEVER use with unsanitized user input
# Renders: <script>alert('xss')</script> — executes!

# Explicitly escape a value that was previously marked safe:
# from django.utils.html import escape
# safe_comment = escape(user_comment)


# ---- mark_safe() — only for trusted, known-safe strings ----
from django.utils.html import mark_safe, format_html, escape

# WRONG: marking user data as safe
def render_username_badge_wrong(username: str) -> str:
    return mark_safe(f'<span class="badge">{username}</span>')
    # XSS: username = '<script>...</script>'

# CORRECT: use format_html — escapes all arguments
def render_username_badge(username: str) -> str:
    return format_html('<span class="badge">{}</span>', username)
    # Outputs: <span class="badge">&lt;script&gt;...&lt;/script&gt;</span>

# format_html with multiple arguments:
def render_user_link(user_id: int, username: str, url: str) -> str:
    return format_html(
        '<a href="{}" data-id="{}">@{}</a>',
        url, user_id, username
    )


# ---- bleach for user-provided HTML (allow basic formatting) ----
# pip install bleach
import bleach
from bleach.linkifier import Linker

ALLOWED_TAGS = [
    'a', 'abbr', 'acronym', 'b', 'blockquote', 'br',
    'code', 'em', 'i', 'li', 'ol', 'pre', 'strong',
    'ul', 'p', 'h1', 'h2', 'h3', 'h4',
]
ALLOWED_ATTRIBUTES = {
    'a':   ['href', 'title', 'rel'],
    'abbr': ['title'],
}

def sanitize_user_html(html_input: str) -> str:
    """
    Strip disallowed tags and attributes.
    Linkify plain-text URLs.
    Returns safe HTML string (can be used with mark_safe).
    """
    clean = bleach.clean(
        html_input,
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRIBUTES,
        strip=True,           # strip disallowed tags (don't escape them)
        strip_comments=True,  # remove HTML comments
    )
    # Convert plain-text URLs to <a> tags
    clean = bleach.linkify(clean, callbacks=[])
    return clean


# In a model:
class Comment(models.Model):
    raw_body   = models.TextField()    # store original user input
    safe_body  = models.TextField()    # store sanitized HTML

    def save(self, *args, **kwargs):
        self.safe_body = sanitize_user_html(self.raw_body)
        super().save(*args, **kwargs)


# In a template:
# {{ comment.safe_body|safe }}   ← safe because sanitize_user_html() cleaned it


# ---- Content-Security-Policy (pip install django-csp) ----
# settings.py
CSP_DEFAULT_SRC  = ("'self'",)
CSP_SCRIPT_SRC   = ("'self'",)   # no inline scripts
CSP_STYLE_SRC    = ("'self'", "'unsafe-inline'")
CSP_IMG_SRC      = ("'self'", 'data:', 'https:')
# Report violations (without blocking) during rollout:
CSP_REPORT_URI   = '/csp-report/'
# After confirming no violations:
# CSP_SCRIPT_SRC = ("'self'",)  # enforces — blocks inline scripts


# ---- HttpOnly cookies — prevent JS from reading session cookie ----
SESSION_COOKIE_HTTPONLY = True   # JS cannot read the session cookie


# ---- JSON responses — no auto-escaping! ----
from django.http import JsonResponse
import json

# WRONG: if data contains HTML, it is not escaped in JSON
# JsonResponse({'comment': user_input})  ← not escaped

# SAFE: Django's JsonResponse uses json.dumps which does escape </script>
# But still validate and sanitize user input before storing it

# When rendering user data in JavaScript:
# const comment = {{ comment.body|json_script:"comment-data" }};
# json_script filter: <script id="comment-data" type="application/json">"safe text"</script>
# Access in JS: const comment = JSON.parse(document.getElementById('comment-data').textContent);`,
      outputExplanation: "format_html(template, *args) applies Django's escape() to each argument before interpolating into the template string. The template string itself is treated as safe HTML. This is the safe way to construct HTML in Python code. bleach.clean() parses the HTML and removes any tags or attributes not in the whitelist. Storing sanitized HTML in safe_body and original in raw_body lets you re-sanitize if your allowlist changes.",
      commonMistakes: [
        "Using mark_safe(f'..{user_input}..') — this is equivalent to disabling escaping for the entire string. Use format_html() instead.",
        "Applying bleach only at display time and not at save time — if the sanitization logic has a bug, all stored content needs to be re-sanitized. Store clean content.",
        "Trusting bleach to handle all XSS cases — bleach handles HTML-level sanitization but not DOM-based XSS (javascript: URLs). Set rel='noopener noreferrer' on all user-provided links.",
        "Not setting HttpOnly on the session cookie — XSS that reads the session cookie can hijack the user's session."
      ],
      interviewNotes: [
        "Django template auto-escaping is on by default — the biggest XSS risk is mark_safe() or |safe on unsanitized data.",
        "format_html() is analogous to parameterized queries for SQL injection — the template is fixed, arguments are escaped.",
        "CSP is a browser-level defense — even if XSS occurs, the script cannot execute without being whitelisted in CSP.",
        "json_script template tag safely passes server-side data to JavaScript without XSS risk — it uses a script tag with type='application/json', not type='text/javascript'.",
        "bleach's ALLOWED_TAGS should be as restrictive as possible — start with an empty list and add tags as needed."
      ],
      whenToUse: "Wherever user content is displayed back in HTML. Use format_html() for dynamic HTML generation, bleach for rich text, and CSP as a browser-level fallback.",
      whenNotToUse: "If you never display user content in HTML — a pure JSON API with no server-rendered HTML has minimal XSS risk (though DOM-based XSS in the client is still possible)."
    },
    tags: ["xss", "security", "templates", "bleach", "csp"],
    order: 50,
    estimatedMinutes: 18
  },

  {
    id: "secrets-management",
    title: "Secrets Management in Production",
    slug: "secrets-management",
    category: "production",
    subcategory: "security",
    difficulty: "intermediate",
    description: "Environment variables, AWS Secrets Manager integration, SECRET_KEY rotation, Docker/K8s secrets, and audit logging.",
    content: {
      explanation: "Secrets (SECRET_KEY, database passwords, API keys) must never be hardcoded in source code or committed to version control. The minimum baseline is environment variables from a .env file (never committed). Production deployments should use a secrets manager.\n\nAWS Secrets Manager, HashiCorp Vault, and GCP Secret Manager provide: encryption at rest, access control, automatic rotation, audit logging of every access, and versioning. Django settings can fetch secrets on startup by calling the AWS API.\n\nSECRET_KEY rotation invalidates all sessions (session data is signed with SECRET_KEY) and all CSRF tokens. In Django 4.1+, SECRET_KEY_FALLBACKS allows gradual rotation without invalidating existing sessions immediately.",
      realExample: "A company rotates all production secrets quarterly. The rotation script updates the secret in AWS Secrets Manager, deploys new app servers with the new key in SECRET_KEY, and keeps the old key in SECRET_KEY_FALLBACKS for 24 hours to allow existing sessions to expire gracefully.",
      codeExample: `# ---- Minimum: django-environ with .env ----
# .env (NEVER commit)
SECRET_KEY=django-insecure-change-me-replace-with-50-random-chars
DATABASE_URL=postgres://user:password@localhost:5432/mydb

# settings/base.py
import environ
env = environ.Env()
environ.Env.read_env('.env')
SECRET_KEY = env('SECRET_KEY')


# ---- AWS Secrets Manager integration ----
# pip install boto3
import boto3
import json
import logging

logger = logging.getLogger(__name__)

def get_aws_secret(secret_name: str, region: str = 'us-east-1') -> dict:
    """
    Fetch a secret from AWS Secrets Manager.
    Returns the secret as a dict.
    Used in settings.py on application startup.
    """
    client = boto3.client('secretsmanager', region_name=region)
    try:
        response = client.get_secret_value(SecretId=secret_name)
    except Exception as e:
        logger.critical('Failed to fetch secret %s: %s', secret_name, e)
        raise

    secret_string = response.get('SecretString')
    if secret_string:
        return json.loads(secret_string)
    raise ValueError(f'Secret {secret_name} has no SecretString')


# settings/production.py
import os

# Fetch all app secrets on startup
_SECRETS = get_aws_secret(
    secret_name=os.environ['AWS_SECRET_NAME'],     # e.g. 'myapp/production'
    region=os.environ.get('AWS_REGION', 'us-east-1')
)

SECRET_KEY = _SECRETS['django_secret_key']
DATABASES = {
    'default': {
        'ENGINE':   'django.db.backends.postgresql',
        'NAME':     _SECRETS['db_name'],
        'USER':     _SECRETS['db_user'],
        'PASSWORD': _SECRETS['db_password'],
        'HOST':     _SECRETS['db_host'],
        'PORT':     _SECRETS['db_port'],
    }
}
EMAIL_HOST_PASSWORD = _SECRETS['smtp_password']
STRIPE_SECRET_KEY   = _SECRETS['stripe_secret_key']


# ---- SECRET_KEY ROTATION (Django 4.1+) ----
# settings.py
SECRET_KEY = env('DJANGO_SECRET_KEY_NEW')          # new primary key
SECRET_KEY_FALLBACKS = [
    env('DJANGO_SECRET_KEY_OLD', default=''),      # old key — still validates old sessions
]
# Sessions signed with the old key are still valid.
# After 24h (SESSION_COOKIE_AGE), all old sessions have expired naturally.
# Remove DJANGO_SECRET_KEY_OLD from environment and SECRET_KEY_FALLBACKS.


# ---- Docker secrets ----
# docker-compose.yml
# secrets:
#   db_password:
#     external: true
# services:
#   web:
#     secrets: [db_password]
# Secret is mounted at /run/secrets/db_password

def read_docker_secret(secret_name: str) -> str:
    """Read a Docker secret from the filesystem."""
    secret_path = f'/run/secrets/{secret_name}'
    try:
        with open(secret_path) as f:
            return f.read().strip()
    except FileNotFoundError:
        return os.environ.get(secret_name.upper(), '')


# ---- Kubernetes secrets ----
# k8s Secret → mounted as env var in the pod:
# env:
#   - name: DJANGO_SECRET_KEY
#     valueFrom:
#       secretKeyRef:
#         name: myapp-secrets
#         key: django_secret_key

# Access normally via os.environ['DJANGO_SECRET_KEY']


# ---- Generate a new SECRET_KEY ----
# python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"


# ---- .env.example (COMMIT THIS — no real values) ----
# SECRET_KEY=generate-50-char-random-string-here
# DATABASE_URL=postgres://user:password@localhost:5432/mydb
# REDIS_URL=redis://localhost:6379/0
# SENTRY_DSN=
# STRIPE_SECRET_KEY=sk_test_...
# AWS_SECRET_NAME=myapp/production`,
      outputExplanation: "get_aws_secret() is called once at settings.py import time — before any request is served. The secret is fetched from AWS Secrets Manager using the IAM role attached to the EC2/ECS instance (no hardcoded AWS credentials). SECRET_KEY_FALLBACKS (Django 4.1+) allows Django to validate cookies and sessions signed with older keys, enabling zero-downtime key rotation. After one session lifetime, remove the old key from FALLBACKS.",
      commonMistakes: [
        "Logging the secret value after fetching — even in error handlers. The logger should only log the secret name, never the value.",
        "Fetching secrets on every request instead of once at startup — AWS Secrets Manager has rate limits and API call costs. Cache the value at startup.",
        "Committing the .env file — add .env to .gitignore immediately. Check with git secret scan or truffleHog in CI.",
        "Using the same SECRET_KEY across all environments — a compromised staging key can forge sessions for production if they share the key."
      ],
      interviewNotes: [
        "SECRET_KEY in Django is used for: HMAC-signing session cookies, CSRF tokens, password reset tokens, and any django.core.signing operations.",
        "Rotating SECRET_KEY invalidates all signed tokens immediately — use SECRET_KEY_FALLBACKS for gradual rotation.",
        "IAM role-based access to Secrets Manager (no static AWS_ACCESS_KEY_ID) is more secure than environment-variable credentials.",
        "Audit logging in Secrets Manager records every GetSecretValue call — you can audit who accessed which secret and when.",
        "git-secrets (pre-commit hook) and truffleHog (CI scan) prevent accidental secret commits."
      ],
      whenToUse: "Every production application. Secrets management is a baseline security requirement — environment variables at minimum, Secrets Manager for compliance-driven systems.",
      whenNotToUse: "Local development — .env files are acceptable for local secrets that are not used in production."
    },
    tags: ["secrets", "security", "aws", "environment", "rotation"],
    order: 51,
    estimatedMinutes: 18
  },

  {
    id: "input-validation-patterns",
    title: "Input Validation and Sanitization",
    slug: "input-validation-patterns",
    category: "production",
    subcategory: "security",
    difficulty: "intermediate",
    description: "Form validation, DRF serializer validation, model-level clean(), file upload validation, and whitelist vs blacklist approaches.",
    content: {
      explanation: "Input validation is the first line of defense. Multiple validation layers provide defense in depth: DRF serializer validation for API input, Django form validation for HTML form input, and model-level validation (clean() + full_clean()) as a final check.\n\nFile upload validation must check: the file extension (the filename the client provides), the MIME type (from the Content-Type header — also client-provided and spoofable), and the actual file content using python-magic or Pillow's image verification.\n\nWhitelist validation (accept only known-good values) is stronger than blacklist validation (reject known-bad values) — attackers always find new bad values that your blacklist doesn't cover.",
      realExample: "A profile picture upload validates: extension must be .jpg/.png/.gif, file size must be under 5 MB, actual content must be a valid image (Pillow verify()), and the image is re-encoded before storage to strip EXIF metadata and prevent image-polyglot attacks.",
      codeExample: `# myapp/validators.py
import magic
import os
from PIL import Image
from io import BytesIO
from django.core.exceptions import ValidationError

ALLOWED_IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}
ALLOWED_IMAGE_MIME_TYPES  = {'image/jpeg', 'image/png', 'image/gif', 'image/webp'}
MAX_FILE_SIZE_MB          = 5
MAX_FILE_SIZE_BYTES       = MAX_FILE_SIZE_MB * 1024 * 1024


def validate_image_upload(file):
    """
    Comprehensive file upload validator — whitelist approach.
    Validates extension, MIME type, file size, and actual content.
    """
    # 1. Extension check (whitelist)
    ext = os.path.splitext(file.name)[1].lower()
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise ValidationError(
            f'Invalid file type. Allowed: {", ".join(ALLOWED_IMAGE_EXTENSIONS)}'
        )

    # 2. File size check
    if file.size > MAX_FILE_SIZE_BYTES:
        raise ValidationError(
            f'File too large. Maximum: {MAX_FILE_SIZE_MB} MB'
        )

    # 3. MIME type check using python-magic (reads actual file bytes — not spoofable)
    # pip install python-magic
    file.seek(0)
    mime_type = magic.from_buffer(file.read(2048), mime=True)
    file.seek(0)
    if mime_type not in ALLOWED_IMAGE_MIME_TYPES:
        raise ValidationError(
            f'Invalid file content. Detected: {mime_type}'
        )

    # 4. Verify it is a valid image (Pillow can open it)
    try:
        img = Image.open(file)
        img.verify()   # closes the file after verify — must reopen if reading further
        file.seek(0)
    except Exception:
        raise ValidationError('Uploaded file is not a valid image.')

    return file


# myapp/models.py — model-level validation
from django.db import models
from django.core.exceptions import ValidationError

class UserProfile(models.Model):
    user   = models.OneToOneField('auth.User', on_delete=models.CASCADE)
    bio    = models.TextField(max_length=500, blank=True)
    avatar = models.ImageField(
        upload_to='avatars/',
        null=True, blank=True,
        validators=[validate_image_upload]
    )

    def clean(self):
        """
        Model-level cross-field validation.
        Called by full_clean() — NOT called by save() automatically.
        """
        if self.bio and len(self.bio) > 500:
            raise ValidationError({'bio': 'Bio cannot exceed 500 characters.'})

    def save(self, *args, **kwargs):
        self.full_clean()   # invoke all field validators + clean()
        super().save(*args, **kwargs)


# myapp/forms.py — form validation
from django import forms
from django.core.validators import EmailValidator

class RegistrationForm(forms.Form):
    username = forms.CharField(max_length=50, min_length=3)
    email    = forms.EmailField(validators=[EmailValidator()])
    password = forms.CharField(
        min_length=8,
        widget=forms.PasswordInput,
    )
    confirm_password = forms.CharField(widget=forms.PasswordInput)

    def clean_username(self):
        """Field-level validation — whitelist approach."""
        username = self.cleaned_data['username']
        import re
        if not re.match(r'^[a-zA-Z0-9_-]+$', username):
            raise forms.ValidationError(
                'Username may only contain letters, numbers, underscores, and hyphens.'
            )
        from django.contrib.auth.models import User
        if User.objects.filter(username__iexact=username).exists():
            raise forms.ValidationError('Username is already taken.')
        return username.lower()

    def clean(self):
        """Cross-field validation."""
        cleaned_data = super().clean()
        password         = cleaned_data.get('password')
        confirm_password = cleaned_data.get('confirm_password')
        if password and confirm_password and password != confirm_password:
            raise forms.ValidationError({'confirm_password': 'Passwords do not match.'})
        return cleaned_data


# myapp/serializers.py — DRF validation
from rest_framework import serializers
from myapp.validators import validate_image_upload

class ProfileUpdateSerializer(serializers.ModelSerializer):
    avatar = serializers.ImageField(
        validators=[validate_image_upload],
        required=False
    )

    class Meta:
        model  = UserProfile
        fields = ['bio', 'avatar']

    def validate_bio(self, value: str) -> str:
        """Sanitize bio — strip leading/trailing whitespace, limit length."""
        value = value.strip()
        # Whitelist: allow only safe characters
        import bleach
        value = bleach.clean(value, tags=[], strip=True)   # strip all HTML
        if len(value) > 500:
            raise serializers.ValidationError('Bio cannot exceed 500 characters.')
        return value`,
      outputExplanation: "validate_image_upload() uses a whitelist approach: only listed extensions and MIME types are allowed. python-magic reads the actual file bytes (not just the header the client provides) to detect the real MIME type. Pillow's verify() confirms the file can be decoded as an image. model.clean() is called by full_clean() which is called explicitly in save() — Django does not call full_clean() automatically. DRF serializer validators are called as part of is_valid().",
      commonMistakes: [
        "Trusting the file extension or Content-Type header — both are client-controlled. Always read the actual file bytes to verify content.",
        "Not calling full_clean() in model.save() — clean() is only called by forms and full_clean(). Direct model saves bypass validation.",
        "Not limiting file size before reading the file — read file.size before opening the file. For very large files, even reading the first 2048 bytes for python-magic can be slow if size is not checked first.",
        "Using blacklist validation for HTML sanitization — new attack vectors emerge constantly. Whitelist (bleach with ALLOWED_TAGS) is more reliable."
      ],
      interviewNotes: [
        "Defense in depth: validate at the serializer/form level (API contract), model level (business rules), and infrastructure level (nginx max body size).",
        "python-magic reads the file's magic bytes — the first few bytes that identify the file format. This cannot be spoofed by renaming the file.",
        "full_clean() calls: clean_fields(), clean(), validate_unique(). save() does NOT call full_clean() — you must call it explicitly.",
        "Image re-encoding (re-saving with Pillow) strips EXIF metadata (GPS location, device info) and prevents image-polyglot attacks (images that are also valid HTML or JavaScript).",
        "Whitelist validation: define what is allowed, reject everything else. Blacklist validation: define what is blocked, allow everything else. Whitelist is always stronger."
      ],
      whenToUse: "Every user-provided input — file uploads, form data, API request bodies. Validation is not optional.",
      whenNotToUse: "Internal service-to-service calls on a trusted internal network can sometimes skip validation for performance, but document the trust assumption explicitly."
    },
    tags: ["validation", "security", "file-upload", "forms", "sanitization"],
    order: 52,
    estimatedMinutes: 20
  },

  // ─── PERFORMANCE (53–58) ────────────────────────────────────────────────────
  {
    id: "database-indexing-strategy",
    title: "Database Indexing Strategy",
    slug: "database-indexing-strategy",
    category: "production",
    subcategory: "performance",
    difficulty: "advanced",
    description: "Strategic indexes: db_index, Meta indexes, multi-column indexes, partial indexes, covering indexes, and monitoring slow queries.",
    content: {
      explanation: "Database indexes dramatically speed up reads but slow down writes and consume disk space. Strategic indexing means adding indexes where they pay off and avoiding them where they don't.\n\nSingle-column indexes (db_index=True) cover simple equality and range filters. Multi-column indexes cover queries that filter on multiple columns simultaneously — the order of columns in the index matters (leftmost prefix rule). Partial indexes (condition=) index only rows matching a condition — much smaller and faster for filtered queries. PostgreSQL covering indexes (include=) add extra columns to the index to avoid a table heap fetch.\n\nMonitor slow queries with Django's logging (django.db.backends at DEBUG level) or PostgreSQL's pg_stat_statements extension.",
      realExample: "A Post table has 10 million rows. Filtering published posts by author requires an index on (status, author_id) — both columns together. Without the index, the query scans all 10 million rows. With a partial index on is_deleted=False, the index is 80% smaller for a table where 80% of rows are soft-deleted.",
      codeExample: `# blog/models.py
from django.db import models
from django.db.models import Index, Q


class Post(models.Model):
    title      = models.CharField(max_length=200)
    body       = models.TextField()
    status     = models.CharField(max_length=20, default='draft', db_index=True)
    author     = models.ForeignKey('auth.User', on_delete=models.CASCADE, db_index=True)
    is_deleted = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    view_count = models.PositiveIntegerField(default=0)
    slug       = models.SlugField(unique=True)   # unique=True implies an index

    class Meta:
        indexes = [
            # Multi-column index: queries filtering on both status AND author
            # Column order: put the most selective column first
            Index(fields=['author', 'status'],    name='post_author_status_idx'),
            Index(fields=['status', 'created_at'], name='post_status_created_idx'),

            # Partial index (PostgreSQL): only index published posts
            # This index is much smaller than a full index on status
            Index(
                fields=['created_at'],
                name='post_published_created_idx',
                condition=Q(status='published', is_deleted=False)
            ),

            # Covering index (PostgreSQL 12+): includes extra columns
            # Allows index-only scans without hitting the table
            Index(
                fields=['author'],
                include=['title', 'created_at', 'status'],
                name='post_author_covering_idx'
            ),
        ]


# ---- WHEN TO ADD AN INDEX ----
# ✓ Foreign keys (Django adds these automatically in migrations)
# ✓ Fields used in WHERE clauses in frequent queries
# ✓ Fields used in ORDER BY (for large tables)
# ✓ Fields used in JOIN conditions
# ✓ Unique constraint fields (unique=True auto-creates an index)

# ✗ Do NOT index:
# - Small tables (< 1000 rows) — full scan is faster
# - Low-cardinality boolean columns with even distribution (50/50 true/false)
# - Write-heavy tables where index maintenance outweighs read benefit
# - Columns rarely used in queries


# ---- MONITORING SLOW QUERIES ----
# settings.py (development only)
LOGGING = {
    'loggers': {
        'django.db.backends': {
            'handlers': ['console'],
            'level': 'DEBUG',   # logs every SQL query
            'propagate': False,
        },
    },
}

# ---- EXPLAIN ANALYZE in Python ----
from django.db import connection

def explain_query(queryset):
    """Run EXPLAIN ANALYZE on a queryset (PostgreSQL)."""
    sql, params = queryset.query.sql_with_params()
    with connection.cursor() as cursor:
        cursor.execute(f'EXPLAIN ANALYZE {sql}', params)
        rows = cursor.fetchall()
        for row in rows:
            print(row[0])

# Usage in shell:
# from myapp.views import explain_query
# from myapp.models import Post
# qs = Post.objects.filter(status='published', author_id=42).order_by('-created_at')
# explain_query(qs)
# Output: Seq Scan on post (cost=0.00..10000.00 rows=5000 ...)
# After index: Index Scan using post_author_status_idx on post (cost=0.43..8.57 rows=5 ...)


# ---- GIN/GiST indexes for PostgreSQL full-text search ----
from django.contrib.postgres.indexes import GinIndex
from django.contrib.postgres.search import SearchVectorField

class Article(models.Model):
    title           = models.CharField(max_length=200)
    body            = models.TextField()
    search_vector   = SearchVectorField(null=True)   # for full-text search

    class Meta:
        indexes = [
            GinIndex(fields=['search_vector'], name='article_search_idx'),
        ]


# ---- Connection queries count for debugging ----
# In Django shell or tests:
from django.test.utils import override_settings
from django.db import connection, reset_queries

# Enable query logging:
with override_settings(DEBUG=True):
    reset_queries()
    posts = list(Post.objects.filter(status='published').select_related('author'))
    print(f'Queries: {len(connection.queries)}')
    for q in connection.queries:
        print(q['sql'][:100], '|', q['time'])`,
      outputExplanation: "db_index=True creates a single-column B-tree index in a migration. Index(fields=['author', 'status']) creates a composite index — queries filtering on (author) or (author, status) use this index, but queries filtering only on (status) do not. Partial indexes (condition=) are PostgreSQL-specific and reduce index size dramatically for skewed data. include= in Index creates a covering index — extra columns are stored in the index leaf nodes, enabling index-only scans that never touch the table heap.",
      commonMistakes: [
        "Adding db_index=True to every column — indexes slow down INSERT, UPDATE, and DELETE. Only add indexes where queries are slow.",
        "Putting the wrong column first in a composite index — PostgreSQL can use a composite index for queries on the leftmost column(s) but not rightmost-only queries.",
        "Not using partial indexes for soft-deleted tables — an index on all rows of a 90%-soft-deleted table is 10x larger than needed and slower to maintain.",
        "Running EXPLAIN without ANALYZE — EXPLAIN shows the query plan estimate. EXPLAIN ANALYZE actually runs the query and shows real execution statistics."
      ],
      interviewNotes: [
        "Leftmost prefix rule: a composite index on (A, B) can answer queries on (A) or (A, B) but not (B) alone.",
        "Index cardinality: a boolean column with 50/50 true/false has low cardinality — indexes on it may not be used by the planner.",
        "pg_stat_statements: a PostgreSQL extension that tracks per-query execution statistics — run SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 20 to find slow queries.",
        "Django's connection.queries (when DEBUG=True) shows every query with timing — use it in development to audit query counts.",
        "VACUUM ANALYZE in PostgreSQL updates table statistics used by the query planner — run it after bulk inserts to ensure the planner has accurate row count estimates."
      ],
      whenToUse: "Add indexes based on slow query analysis — not speculatively. Run EXPLAIN ANALYZE before and after to confirm the index is used and improves performance.",
      whenNotToUse: "Small tables, write-heavy tables where the index maintenance cost outweighs read benefit, or low-cardinality columns with uniform distribution."
    },
    tags: ["database", "indexes", "performance", "postgresql", "optimization"],
    order: 53,
    estimatedMinutes: 20
  },

  {
    id: "query-optimization-patterns",
    title: "Query Optimization Patterns",
    slug: "query-optimization-patterns",
    category: "production",
    subcategory: "performance",
    difficulty: "advanced",
    description: "iterator() for large sets, in_bulk(), values() for aggregation, exists() over count(), annotate vs Python computation, and update() without fetch.",
    content: {
      explanation: "Django's ORM provides high-level abstractions that sometimes hide performance costs. Specific patterns eliminate unnecessary data transfer and computation.\n\niterator() streams results one at a time without loading all rows into Python memory — critical for large datasets. in_bulk() fetches many objects by PK in one query and returns a dict. values() returns dicts instead of model instances — much lighter when you need only a few columns for aggregation. exists() runs SELECT 1 LIMIT 1 instead of loading objects. annotate() moves Python-side computation to the database. update() runs SQL UPDATE without fetching rows first.",
      realExample: "An export job generates a CSV of all 500,000 orders. Using Order.objects.all() loads all 500,000 instances into memory (2 GB+). Using Order.objects.all().values('id', 'reference', 'total').iterator(chunk_size=1000) streams 1000 rows at a time, consuming only a few MB.",
      codeExample: `from django.db import models
from django.db.models import Count, Sum, Avg, F, Q, Value
from django.db.models.functions import Coalesce, ExtractYear
from myapp.models import Order, Product, User


# ---- iterator() for large querysets ----
# WRONG: loads all 500k objects into Python memory
all_orders = list(Order.objects.all())

# CORRECT: streams in chunks, O(chunk_size) memory
for order in Order.objects.iterator(chunk_size=1000):
    process_order(order)    # processes one at a time

# With values() + iterator() for CSV export:
import csv
import io

def export_orders_csv():
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['id', 'reference', 'total', 'status'])

    qs = Order.objects.values('id', 'reference', 'total', 'status').iterator(chunk_size=2000)
    for row in qs:
        writer.writerow([row['id'], row['reference'], row['total'], row['status']])

    return output.getvalue()


# ---- in_bulk() for multiple PK lookups ----
# WRONG: one query per ID (N queries)
for pk in pk_list:
    order = Order.objects.get(pk=pk)

# CORRECT: one query, returns {pk: instance}
order_map = Order.objects.in_bulk(pk_list)
# Access: order = order_map.get(pk)


# ---- values() instead of full instances for aggregation ----
# WRONG: loads full instances, computes in Python
orders = list(Order.objects.filter(status='completed'))
total  = sum(o.total for o in orders)

# CORRECT: aggregation in DB, returns one row
from django.db.models import Sum
result = Order.objects.filter(status='completed').aggregate(total=Sum('total'))
total  = result['total']

# values() + annotate() for group-by:
revenue_by_status = (
    Order.objects
    .values('status')              # GROUP BY status
    .annotate(
        count=Count('id'),
        revenue=Sum('total'),
        avg_value=Avg('total'),
    )
    .order_by('-revenue')
)
# SELECT status, COUNT(id), SUM(total), AVG(total)
# FROM myapp_order GROUP BY status ORDER BY revenue DESC


# ---- exists() instead of len() or bool() ----
# WRONG: fetches all rows to check if any exist
if len(Order.objects.filter(user=user, status='pending')) > 0:
    pass

# CORRECT: SELECT 1 LIMIT 1 — minimal work
if Order.objects.filter(user=user, status='pending').exists():
    pass


# ---- annotate() instead of Python-side computation ----
# WRONG: N queries (one per user for their order count)
users_with_orders = []
for user in User.objects.all():
    order_count = Order.objects.filter(user=user).count()
    if order_count > 5:
        users_with_orders.append((user, order_count))

# CORRECT: one query with annotation
users_with_orders = (
    User.objects
    .annotate(order_count=Count('order'))
    .filter(order_count__gt=5)
    .values('id', 'username', 'order_count')
)


# ---- update() without fetching ----
# WRONG: fetches 10k objects, calls save() 10k times
for order in Order.objects.filter(status='pending', created_at__lt=cutoff):
    order.status = 'expired'
    order.save(update_fields=['status'])

# CORRECT: one SQL UPDATE
updated_count = Order.objects.filter(
    status='pending', created_at__lt=cutoff
).update(status='expired', updated_at=timezone.now())


# ---- Database functions ----
from django.db.models.functions import Coalesce, Cast, ExtractYear

# Coalesce: return first non-null value
products = Product.objects.annotate(
    effective_price=Coalesce('sale_price', 'price')
)

# Extract year from date for grouping
orders_by_year = (
    Order.objects
    .annotate(year=ExtractYear('created_at'))
    .values('year')
    .annotate(count=Count('id'))
    .order_by('year')
)

# F expressions: reference another column
# Price 10% above cost:
Product.objects.filter(price__lt=F('cost') * 1.1)

# Atomic update using F (no race condition):
Product.objects.filter(pk=product_id).update(
    view_count=F('view_count') + 1
)`,
      outputExplanation: "iterator() sends one query and reads results from the database cursor in chunks — only chunk_size rows are in Python memory at any time. values() returns plain dicts instead of model instances, avoiding ORM object instantiation overhead (significant for large datasets). aggregate() sends a single SQL GROUP BY query. update() sends a single SQL UPDATE without fetching rows. F('field') references a database column in Python code, enabling database-side arithmetic without a Python round-trip.",
      commonMistakes: [
        "Using iterator() with prefetch_related — iterator() disables queryset caching, which prefetch_related relies on. Use values() with iterator() for large querysets instead.",
        "Using values('field').count() when just count() suffices — .values('x').count() is equivalent to .count() for most purposes.",
        "Not using update_fields in save() for partial updates — full save() reads and writes all columns, causing unnecessary I/O.",
        "Using F() expressions inside Python conditionals — F('field') is a lazy expression, not a Python value. You cannot use it in if F('price') > 100."
      ],
      interviewNotes: [
        "iterator(chunk_size=N) uses server-side cursors on PostgreSQL — the database does not compute all results at once, saving both DB and Python memory.",
        "values() returns dicts instead of model instances — 5-10x less memory for large querysets. values_list() returns tuples (even lighter).",
        "aggregate() vs annotate(): aggregate() returns one dict for the whole queryset, annotate() adds a computed column per row.",
        "F() expressions are evaluated at the database level — they enable atomic increments and avoid race conditions in concurrent updates.",
        "update() bypasses model.save() and post_save signals — be aware of side effects that rely on signals."
      ],
      whenToUse: "Any view processing more than ~1000 rows, export jobs, bulk operations, background tasks. Profile first with connection.queries, then optimize.",
      whenNotToUse: "Simple views with small datasets — premature optimization adds complexity. Optimize after profiling confirms a performance problem."
    },
    tags: ["performance", "queryset", "optimization", "database", "orm"],
    order: 54,
    estimatedMinutes: 22
  },

  {
    id: "n-plus-one-detection",
    title: "N+1 Detection and Fixing",
    slug: "n-plus-one-detection",
    category: "production",
    subcategory: "performance",
    difficulty: "intermediate",
    description: "Detect N+1 with django-debug-toolbar, nplusone, and connection.queries. Fix with select_related, prefetch_related, and serializer optimization.",
    content: {
      explanation: "The N+1 query problem: a list view fetches N objects, then for each object executes a separate query to fetch related data — resulting in N+1 total queries. For a list of 100 posts, accessing post.author on each causes 100 additional queries (1 for the list + 100 for the authors = 101 queries).\n\nselect_related() performs a SQL JOIN for FK and OneToOne relationships — fetches everything in one query. prefetch_related() performs a separate query for each M2M or reverse FK relationship and caches the results — 2 queries instead of N+1.\n\nDRF serializers are a common N+1 source: a nested serializer that accesses a FK field causes one query per instance unless the viewset's get_queryset() uses select_related.",
      realExample: "A DRF API response for 50 posts takes 2 seconds. django-debug-toolbar shows 52 queries: 1 for posts, 50 for authors, 1 for tags. After adding select_related('author').prefetch_related('tags') to the viewset's queryset, it drops to 2 queries and 100ms.",
      codeExample: `# ---- DETECTING N+1 ----

# Method 1: django-debug-toolbar (development)
# Install and add to INSTALLED_APPS + MIDDLEWARE in local settings
# Browse to the page — the toolbar shows query count and SQL

# Method 2: connection.queries in shell
from django.test.utils import override_settings
from django.db import connection, reset_queries

with override_settings(DEBUG=True):
    reset_queries()
    # Simulate the view:
    from myapp.models import Post
    from myapp.serializers import PostListSerializer

    posts = Post.objects.all()[:10]
    data  = PostListSerializer(posts, many=True).data

    print(f'Total queries: {len(connection.queries)}')
    for i, q in enumerate(connection.queries, 1):
        print(f'{i}: [{q["time"]}s] {q["sql"][:120]}')


# Method 3: nplusone (automatically detects in tests)
# pip install nplusone
# settings/test.py
# NPLUSONE_RAISE = True   # raises NPlusOneError on detection
# NPLUSONE_LOGGER = logging.getLogger('nplusone')


# ---- IDENTIFYING N+1 IN DRF SERIALIZERS ----
# Bad serializer — causes N+1:
class PostListSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()
    tag_names   = serializers.SerializerMethodField()

    class Meta:
        model  = Post
        fields = ['id', 'title', 'author_name', 'tag_names', 'created_at']

    def get_author_name(self, obj) -> str:
        return obj.author.get_full_name()   # FK access — causes N queries without select_related

    def get_tag_names(self, obj) -> list:
        return list(obj.tags.values_list('name', flat=True))   # M2M — causes N queries without prefetch


# ---- FIX: select_related and prefetch_related in the ViewSet ----
class PostViewSet(viewsets.ModelViewSet):
    serializer_class = PostListSerializer

    def get_queryset(self):
        return (
            Post.objects
            .select_related('author')        # JOIN: fetches author in same query
            .prefetch_related('tags')         # 1 extra query: fetches all tags
            .order_by('-created_at')
        )
    # Result: 2 queries for any list size (instead of N+1)


# ---- select_related vs prefetch_related ----
# select_related: JOINs in SQL — use for ForeignKey and OneToOneField
Post.objects.select_related('author')             # author FK
Post.objects.select_related('author__profile')    # follow the chain: author → profile
Post.objects.select_related('author', 'category') # multiple FKs

# prefetch_related: separate query + Python-side join — use for M2M and reverse FK
Post.objects.prefetch_related('tags')             # M2M
Post.objects.prefetch_related('comments')         # reverse FK (Comment.post FK)
Post.objects.prefetch_related('tags', 'comments') # multiple

# Prefetch with filter/custom queryset:
from django.db.models import Prefetch

published_comments = Prefetch(
    'comments',
    queryset=Comment.objects.filter(is_approved=True).select_related('author'),
    to_attr='approved_comments'   # accessible as post.approved_comments
)
posts = Post.objects.prefetch_related(published_comments)
# post.approved_comments — list of approved Comment objects


# ---- DRF with annotations (avoid N+1 for counts) ----
from django.db.models import Count

class PostViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        return (
            Post.objects
            .select_related('author')
            .prefetch_related('tags')
            .annotate(comment_count=Count('comments'))   # computed in DB, no extra query
            .order_by('-created_at')
        )

# Serializer reads the annotation:
class PostListSerializer(serializers.ModelSerializer):
    comment_count = serializers.IntegerField(read_only=True)  # from annotation

    class Meta:
        model  = Post
        fields = ['id', 'title', 'comment_count', 'created_at']


# ---- Django logging for query detection ----
# settings/local.py
LOGGING['loggers']['django.db.backends'] = {
    'handlers': ['console'],
    'level': 'DEBUG',
    'propagate': False,
}
# This logs every SQL query in development — overwhelming for large pages
# but useful for spotting N+1 patterns`,
      outputExplanation: "select_related() generates a SQL JOIN: SELECT post.*, auth_user.* FROM post LEFT OUTER JOIN auth_user ON post.author_id = auth_user.id — one query regardless of how many posts. prefetch_related() runs two queries: first SELECT * FROM post, then SELECT * FROM post_tags WHERE post_id IN (1,2,3,...) — two queries regardless of how many posts (instead of 1 + N). Prefetch with Prefetch() object allows customizing the sub-queryset (adding filters, ordering, select_related on the prefetched model).",
      commonMistakes: [
        "Using select_related() for M2M relationships — select_related() only works for FK and OneToOne. Use prefetch_related() for M2M.",
        "Adding prefetch_related() after slicing — prefetch_related is ignored after queryset slicing. Apply it before [:20].",
        "Not using Prefetch() when you need to filter the prefetched related objects — without Prefetch(), you get ALL related objects, not filtered ones.",
        "Using len(post.comments.all()) instead of post.comment_count from annotation — len() fires a new query even after prefetch. Use annotate(comment_count=Count('comments')) instead."
      ],
      interviewNotes: [
        "N+1 is the single most common Django performance problem — always check query count in development before deploying to production.",
        "select_related() adds JOIN — only use for single-valued relationships (FK, OneToOne). Never for M2M (would produce cartesian product).",
        "prefetch_related() runs 1+N_relationships queries total — N is the number of different M2M/reverse FK fields prefetched, not the number of rows.",
        "django-debug-toolbar's SQL panel shows duplicate queries highlighted in red — easy visual identification of N+1.",
        "nplusone in test mode raises exceptions on N+1 — add it to your test settings to catch N+1 in CI before they reach production."
      ],
      whenToUse: "Any view rendering a list of objects with related data. Check query count for every list API endpoint before deploying.",
      whenNotToUse: "Detail views loading a single object — N+1 is only a problem when N is large. For a single object, one extra FK query is acceptable."
    },
    tags: ["n+1", "performance", "select-related", "prefetch-related", "optimization"],
    order: 55,
    estimatedMinutes: 20
  },

  {
    id: "middleware-performance",
    title: "Middleware Performance Patterns",
    slug: "middleware-performance",
    category: "production",
    subcategory: "performance",
    difficulty: "intermediate",
    description: "Middleware ordering impact, writing lightweight middleware, short-circuit patterns, and avoiding DB calls in middleware.",
    content: {
      explanation: "Every Django request passes through every middleware in the MIDDLEWARE list, in order. Middleware closer to the top runs first on request (and last on response). Slow middleware in the middle of the stack adds latency to every request.\n\nKey principles: put SecurityMiddleware first (it can redirect before other middleware runs), put SessionMiddleware before AuthenticationMiddleware (auth requires sessions), avoid database queries in middleware (it runs on every request), and short-circuit expensive middleware for known-cheap paths (health checks, static files).\n\nWrite middleware as plain Python — no class inheritance required in Django 3+. The __init__ method receives get_response. The __call__ method wraps it.",
      realExample: "A RequestIDMiddleware that makes a database query on every request to log the user's company name adds 5ms of database latency to every API call. Replacing the DB lookup with a value from the session (already loaded) reduces this to microseconds.",
      codeExample: `# ---- MIDDLEWARE ORDERING (settings.py) ----
MIDDLEWARE = [
    # 1. SECURITY: runs first on request, last on response
    'django.middleware.security.SecurityMiddleware',
    # 2. WHITENOISE: serves static files before session/auth overhead
    'whitenoise.middleware.WhiteNoiseMiddleware',
    # 3. SESSION: required before AuthMiddleware
    'django.contrib.sessions.middleware.SessionMiddleware',
    # 4. COMMON: handles APPEND_SLASH, USE_ETAGS
    'django.middleware.common.CommonMiddleware',
    # 5. CSRF: required before views that process POST
    'django.middleware.csrf.CsrfViewMiddleware',
    # 6. AUTH: requires session (must come after SessionMiddleware)
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    # 7. MESSAGES: requires session
    'django.contrib.messages.middleware.MessageMiddleware',
    # 8. CLICKJACKING
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    # 9. CUSTOM MIDDLEWARE: after built-ins
    'core.middleware.RequestIDMiddleware',
    'core.middleware.AccessLogMiddleware',
]


# ---- LIGHTWEIGHT MIDDLEWARE ----
# core/middleware.py
import time
import logging

logger = logging.getLogger(__name__)

# Paths excluded from expensive operations
CHEAP_PATHS = frozenset([
    '/health/',
    '/liveness/',
    '/metrics/',
    '/favicon.ico',
])


class AccessLogMiddleware:
    """
    Efficient middleware:
    1. Short-circuit for cheap paths
    2. No database queries
    3. Minimal object creation
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Short-circuit: skip expensive logic for health checks
        if request.path in CHEAP_PATHS:
            return self.get_response(request)

        # Also skip static files
        if request.path.startswith(('/static/', '/media/')):
            return self.get_response(request)

        start_time = time.monotonic()
        response   = self.get_response(request)
        duration_ms = round((time.monotonic() - start_time) * 1000, 2)

        # No DB queries here — read from request context only
        user_id = (
            request.user.id
            if hasattr(request, 'user') and request.user.is_authenticated
            else None
        )

        logger.info(
            '%s %s %s %.1fms',
            request.method, request.path, response.status_code, duration_ms,
            extra={
                'method':      request.method,
                'path':        request.path,
                'status':      response.status_code,
                'duration_ms': duration_ms,
                'user_id':     user_id,
            }
        )

        return response


# ---- AVOIDING DB CALLS IN MIDDLEWARE ----
# BAD: DB query on every request
class BadCurrentOrgMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.user.is_authenticated:
            # ❌ DB query on EVERY request!
            from myapp.models import Organization
            request.current_org = Organization.objects.get(users=request.user)
        return self.get_response(request)


# GOOD: read from session (already loaded by SessionMiddleware)
class GoodCurrentOrgMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.user.is_authenticated:
            # ✓ Read from session — already in memory
            org_id = request.session.get('current_org_id')
            if org_id:
                request.current_org_id = org_id
            # Set a lazy property instead of a DB object:
            request.get_current_org = lambda: (
                Organization.objects.get(pk=org_id) if org_id else None
            )
        return self.get_response(request)


# ---- PROCESS_VIEW for view-specific logic ----
class AuditMiddleware:
    """
    process_view is called just before the view function.
    Access to the view function and kwargs.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        return self.get_response(request)

    def process_view(self, request, view_func, view_args, view_kwargs):
        # Return None to continue normal processing
        # Return a Response to short-circuit (bypass the view entirely)
        if getattr(view_func, 'requires_audit', False):
            logger.info('Audited view: %s', view_func.__name__)
        return None   # continue to the view

    def process_exception(self, request, exception):
        """Called when a view raises an exception."""
        logger.error('View exception: %s', exception, exc_info=True)
        return None   # let Django's default error handling continue`,
      outputExplanation: "CHEAP_PATHS uses a frozenset for O(1) path lookup — checking a set is faster than iterating a list. The short-circuit returns immediately for health check and static file paths without starting timers or building log records. No database queries means the middleware adds only a few microseconds (a monotonic timer read and a logger call) to every request. process_view() is called after URL routing but before the view function — it can inspect the matched view and kwargs.",
      commonMistakes: [
        "Putting custom middleware before SecurityMiddleware — your middleware runs before HTTPS redirect, potentially on plain HTTP.",
        "Making a database query in middleware without caching — 1 extra DB query per request × 1000 req/sec = 1000 extra DB queries/sec.",
        "Not short-circuiting for health check paths — health check endpoints are called every 10-30 seconds. Even lightweight middleware adds up.",
        "Using MiddlewareMixin to inherit from BaseMiddleware — only needed for Django < 1.10 compatibility. Modern Django middleware is plain classes."
      ],
      interviewNotes: [
        "Middleware runs in order top-to-bottom for requests and bottom-to-top for responses — it forms a pipeline wrapper.",
        "SecurityMiddleware must be first — it handles HTTPS redirects. If it comes later, other middleware runs before the redirect.",
        "process_view() is called with the resolved view function — you can inspect view attributes (decorators, has_attr checks).",
        "process_exception() is only called for exceptions raised in views, not for exceptions in response middleware.",
        "Middleware that short-circuits (returns a Response from __call__ before calling get_response()) prevents all subsequent middleware from running on the request."
      ],
      whenToUse: "Cross-cutting concerns that apply to all (or most) requests: logging, request IDs, authentication context, response headers.",
      whenNotToUse: "View-specific logic — use view decorators or mixin classes instead. Middleware adds overhead to every request, even those that don't need it."
    },
    tags: ["middleware", "performance", "ordering", "optimization", "django"],
    order: 56,
    estimatedMinutes: 15
  },

  {
    id: "async-django-views",
    title: "Async Views in Django",
    slug: "async-django-views",
    category: "production",
    subcategory: "performance",
    difficulty: "advanced",
    description: "async def views, sync_to_async for ORM calls, asyncio.gather for parallel IO, ASGI deployment, and when async helps.",
    content: {
      explanation: "Django 3.1+ supports async views (async def). Async views are beneficial when a request makes multiple slow IO-bound calls (external HTTP requests, slow APIs) that can be parallelized. asyncio.gather() runs them concurrently within a single request, potentially reducing response time from sum(each_call_time) to max(each_call_time).\n\nCritical constraint: Django's ORM is synchronous. From an async view, ORM calls must be wrapped with sync_to_async() or run in a sync-to-async thread. Without this wrapper, Django raises SynchronousOnlyOperation.\n\nAsync views require an ASGI server (uvicorn, daphne, hypercorn). The WSGI server (Gunicorn) runs async views synchronously in a thread — defeating the purpose. Async middleware must also be async-compatible.",
      realExample: "A dashboard API aggregates data from 3 sources: the local DB, an external weather API, and an internal analytics service. Synchronous: 3 sequential calls × 500ms = 1500ms. Async with gather: 3 concurrent calls, response time = max(500ms) = 500ms.",
      codeExample: `# pip install uvicorn  (ASGI server for async Django)

# settings.py
# ASGI_APPLICATION = 'myproject.asgi.application'

# myproject/asgi.py
import os
from django.core.asgi import get_asgi_application
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'myproject.settings.production')
application = get_asgi_application()

# Run: uvicorn myproject.asgi:application --workers 4


# ---- BASIC ASYNC VIEW ----
# myapp/views.py
import asyncio
import httpx   # pip install httpx — async HTTP client
from django.http import JsonResponse
from asgiref.sync import sync_to_async
from myapp.models import UserProfile, Order


async def dashboard_view(request):
    """
    Fetches data from 3 sources concurrently:
    - Local DB (ORM must be wrapped with sync_to_async)
    - External weather API
    - Internal analytics API
    """
    # Wrap ORM calls with sync_to_async
    get_profile = sync_to_async(
        lambda: UserProfile.objects.select_related('user').get(user=request.user)
    )
    get_orders = sync_to_async(
        lambda: list(Order.objects.filter(user=request.user).order_by('-created_at')[:5])
    )

    # Async HTTP calls with httpx
    async def fetch_weather():
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                'https://api.weatherapi.com/v1/current.json',
                params={'key': WEATHER_API_KEY, 'q': 'London'},
            )
            return response.json() if response.status_code == 200 else {}

    async def fetch_analytics():
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                'https://analytics.internal/api/stats/',
                headers={'Authorization': f'Token {ANALYTICS_TOKEN}'},
            )
            return response.json() if response.status_code == 200 else {}

    # Run all IO operations concurrently — total time ≈ max(each_time)
    profile, orders, weather, analytics = await asyncio.gather(
        get_profile(),
        get_orders(),
        fetch_weather(),
        fetch_analytics(),
        return_exceptions=True,  # don't fail all if one fails
    )

    # Handle exceptions from return_exceptions=True
    if isinstance(weather, Exception):
        weather = {}
    if isinstance(analytics, Exception):
        analytics = {}

    return JsonResponse({
        'profile':   {'id': profile.user_id, 'name': str(profile.user)},
        'orders':    [{'id': o.pk, 'total': str(o.total)} for o in (orders or [])],
        'weather':   weather,
        'analytics': analytics,
    })


# ---- sync_to_async patterns ----
from asgiref.sync import sync_to_async

# Wrap a function
get_users = sync_to_async(User.objects.all)

# Using as a decorator
@sync_to_async
def get_user_profile(user_id: int):
    return UserProfile.objects.select_related('user').get(user_id=user_id)

# In an async view:
async def my_view(request):
    profile = await get_user_profile(request.user.id)
    return JsonResponse({'name': str(profile.user)})


# ---- async_to_sync for calling async from sync ----
from asgiref.sync import async_to_sync

# In a synchronous context:
@async_to_sync
async def run_async_task():
    async with httpx.AsyncClient() as client:
        return await client.get('https://api.example.com/data')


# ---- DRF ViewSet async (Django 4.1+) ----
# DRF does not fully support async views natively (as of DRF 3.14)
# Use regular sync DRF views and rely on async middleware + ORM
# For full async DRF, use ninja (django-ninja) which has first-class async support


# ---- WHEN ASYNC HELPS vs WHEN IT DOESN'T ----
# ✓ Async helps:
#   - Multiple external HTTP calls that can be parallelized
#   - IO-bound operations (file reads, WebSocket messages)
#   - Long-polling or streaming responses

# ✗ Async does NOT help:
#   - Pure ORM queries — the ORM is synchronous, still runs in a thread pool
#   - CPU-bound operations — asyncio does not add parallelism for CPU work
#   - Simple views with one DB query — overhead of async adds nothing

# Rule of thumb: async is beneficial only when you can run at least 2 slow IO
# operations concurrently with asyncio.gather()`,
      outputExplanation: "asyncio.gather() runs coroutines concurrently in the event loop — they are not threads, they are cooperative. return_exceptions=True means a failing coroutine returns its exception object instead of raising, allowing the other coroutines to complete. sync_to_async() wraps a synchronous function to run in a thread pool, yielding the event loop while the thread runs. Without sync_to_async(), calling synchronous ORM methods from an async view raises SynchronousOnlyOperation.",
      commonMistakes: [
        "Running async views with Gunicorn WSGI — Gunicorn wraps async views in an asyncio event loop but doesn't get the concurrency benefits. Use uvicorn or daphne (ASGI) for actual async benefits.",
        "Not wrapping ORM calls with sync_to_async — raises SynchronousOnlyOperation. Every ORM call from an async view needs the wrapper.",
        "Using asyncio.gather() for CPU-bound tasks — asyncio is for IO-bound concurrency. CPU-bound work should use ProcessPoolExecutor.",
        "Not setting return_exceptions=True in gather — if one IO call fails and raises, the entire gather raises and you lose all other results."
      ],
      interviewNotes: [
        "Django's ORM is synchronous — async views call ORM via sync_to_async which runs ORM in a thread pool. Not truly non-blocking at the DB level.",
        "True async database access requires an async ORM like encode/databases or SQLAlchemy async — Django's ORM does not yet support it natively.",
        "asyncio.gather() with 3 external API calls reduces response time from sum to max — the main async win for Django views.",
        "ASGI server (uvicorn) handles async views natively. Gunicorn with uvicorn workers (gunicorn -k uvicorn.workers.UvicornWorker) is a common production setup.",
        "DRF middleware must be updated to be async-compatible — synchronous middleware in an async request context uses sync_to_async internally."
      ],
      whenToUse: "Views that make multiple external HTTP requests that can be parallelized, WebSocket handlers, long-polling endpoints, or streaming responses.",
      whenNotToUse: "Standard CRUD views with ORM queries — the async overhead adds complexity without benefit when you cannot parallelize the DB calls."
    },
    tags: ["async", "performance", "asgi", "concurrency", "views"],
    order: 57,
    estimatedMinutes: 22
  },

  {
    id: "django-deployment-checklist",
    title: "Django Production Deployment Checklist",
    slug: "django-deployment-checklist",
    category: "production",
    subcategory: "performance",
    difficulty: "intermediate",
    description: "python manage.py check --deploy, Gunicorn configuration, zero-downtime migrations, systemd unit file, and deployment pipeline steps.",
    content: {
      explanation: "A production deployment checklist prevents common mistakes that cause outages or security vulnerabilities. Django's built-in check --deploy verifies the most critical settings. Beyond that: Gunicorn worker count formula, zero-downtime migration patterns (additive-only migrations first, remove old fields after deploy), health check verification before switching traffic.\n\nZero-downtime migrations: the old code and new code must both work against the same schema simultaneously during a rolling deploy. Never drop a column or rename a column in the same migration as the code change — add the new column first, deploy the new code, then remove the old column in a subsequent deploy.\n\nGunicorn worker count: 2 × CPU_count + 1 for synchronous workers. Add a gunicorn timeout to kill stuck workers. Use max_requests to recycle workers after N requests (prevents memory leak buildup).",
      realExample: "A deploy pipeline: run check --deploy → run migrations → collect static → health check → swap traffic. Zero-downtime migration: deploy 1 adds column (nullable), deploy 2 populates it and changes code to use it, deploy 3 drops the old column.",
      codeExample: `# ---- DJANGO DEPLOYMENT CHECKLIST ----
# Run before every production deployment:
# python manage.py check --deploy
# Checks: DEBUG=False, ALLOWED_HOSTS, SECRET_KEY strength, HSTS, SSL, cookies

# ---- GUNICORN CONFIGURATION ----
# gunicorn.conf.py
import multiprocessing

# Worker count formula: 2 × CPU + 1 (for sync workers)
workers = multiprocessing.cpu_count() * 2 + 1

# For async (uvicorn workers):
# workers = multiprocessing.cpu_count()
# worker_class = 'uvicorn.workers.UvicornWorker'

worker_class  = 'sync'
worker_connections = 1000
timeout       = 30    # kill worker if request takes longer than 30s
keepalive     = 5     # HTTP keepalive timeout
max_requests  = 1000  # recycle worker after 1000 requests (prevent memory leaks)
max_requests_jitter = 50   # randomize to prevent all workers recycling simultaneously

bind         = '0.0.0.0:8000'
loglevel     = 'info'
access_logfile = '-'   # log to stdout
error_logfile  = '-'
capture_output = True

# ---- GUNICORN COMMAND (production) ----
# gunicorn myproject.wsgi:application \
#   --config gunicorn.conf.py \
#   --workers 5 \
#   --timeout 30 \
#   --max-requests 1000 \
#   --max-requests-jitter 50 \
#   --bind 0.0.0.0:8000


# ---- SYSTEMD UNIT FILE ----
# /etc/systemd/system/myapp.service
SYSTEMD_UNIT = """
[Unit]
Description=My Django Application
After=network.target postgresql.service redis.service
Requires=postgresql.service redis.service

[Service]
Type=notify
User=www-data
Group=www-data
WorkingDirectory=/app
EnvironmentFile=/app/.env.production
ExecStart=/app/venv/bin/gunicorn myproject.wsgi:application \\
    --workers 5 \\
    --timeout 30 \\
    --bind unix:/run/myapp.sock \\
    --access-logfile /var/log/myapp/access.log \\
    --error-logfile /var/log/myapp/error.log
ExecReload=/bin/kill -s HUP $MAINPID
KillMode=mixed
Restart=on-failure
RestartSec=5s
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
"""
# sudo systemctl daemon-reload
# sudo systemctl enable myapp
# sudo systemctl start myapp
# sudo systemctl reload myapp   (graceful restart via SIGHUP)


# ---- ZERO-DOWNTIME MIGRATION STRATEGY ----
# STEP 1: Additive migration (safe to deploy while old code runs)
# Only ADD nullable columns or columns with defaults
# NEVER: drop columns, rename columns, change column types in one step

# Example: Renaming 'name' to 'full_name'
# Migration 1 (deploy 1): Add new column
class Migration(migrations.Migration):
    operations = [
        migrations.AddField(
            model_name='user_profile',
            name='full_name',
            field=models.CharField(max_length=200, null=True, blank=True),
        ),
    ]

# Data migration: copy data from old → new column
class DataMigration(migrations.Migration):
    operations = [
        migrations.RunPython(
            lambda apps, schema_editor: (
                apps.get_model('myapp', 'UserProfile')
                .objects.update(full_name=models.F('name'))
            ),
            reverse_code=migrations.RunPython.noop,
        )
    ]

# Deploy 2: Update code to write to both columns and read from new column
# Deploy 3: Migration 3 — drop old column (safe — old code no longer reads it)


# ---- CI/CD DEPLOYMENT PIPELINE (pseudocode) ----
PIPELINE = """
1. Run tests (pytest --cov)
2. Run security scan (bandit, safety check)
3. Build Docker image
4. Push to registry
5. Deploy to staging:
   a. Run migrations (python manage.py migrate)
   b. Run check --deploy
   c. Collect static (python manage.py collectstatic --noinput)
   d. Warm cache (python manage.py warm_cache)
   e. Health check /health/ → must return 200
6. Run smoke tests against staging
7. Deploy to production (rolling update — one instance at a time):
   a. Start new instance
   b. Wait for /health/ to return 200
   c. Remove old instance from load balancer
   d. Repeat for each instance
8. Monitor Sentry, Datadog for errors in first 15 minutes
9. Roll back if error rate increases: systemctl reload myapp OR deploy previous image
"""

# ---- PRE-DEPLOY SCRIPT ----
# deploy.sh
PRE_DEPLOY = """
#!/bin/bash
set -e   # exit on any error

# 1. Run check
python manage.py check --deploy

# 2. Migrations (run before starting new workers — safe with zero-downtime migrations)
python manage.py migrate --noinput

# 3. Static files
python manage.py collectstatic --noinput --clear

# 4. Warm cache
python manage.py warm_cache

# 5. Gracefully reload Gunicorn (sends SIGHUP — workers finish current requests)
if [ -f /run/myapp.pid ]; then
  kill -HUP $(cat /run/myapp.pid)
fi
"""`,
      outputExplanation: "max_requests and max_requests_jitter recycle workers after N requests — preventing slow memory leaks from accumulating. SIGHUP (systemctl reload) sends the reload signal to Gunicorn, which spawns new workers and gracefully stops old ones after they finish current requests — zero-downtime restart. Zero-downtime migrations rely on deploying schema changes (ADD COLUMN) before the code change, then deploying the code, then cleaning up (DROP COLUMN) afterwards — each step is backwards-compatible.",
      commonMistakes: [
        "Running migrations during the deploy while old workers are still serving traffic that depends on the old schema — only safe if the migration is purely additive.",
        "Setting timeout too high (e.g., 300) — stuck requests hold a worker until timeout. 30s is aggressive but prevents worker starvation.",
        "Not using max_requests — long-running workers accumulate memory from Python object cycles. Recycling after 1000 requests prevents gradual memory growth.",
        "Deploying a migration that drops a column before deploying code that stops using it — the running old code references the dropped column and crashes."
      ],
      interviewNotes: [
        "python manage.py check --deploy is the official deployment safety checker — fail the build if it reports any issues.",
        "SIGHUP to Gunicorn triggers a graceful restart — new workers start with new code while old workers finish current requests, then exit.",
        "Zero-downtime migrations: additive (add nullable column) → deploy new code → populate column → deploy code reading new column → drop old column (separate deploy).",
        "Gunicorn worker count: 2 × CPU + 1 for sync workers. For I/O-bound (ASGI/uvicorn), use CPU count and higher concurrency.",
        "Health check verification before traffic cutover is the last safety gate — it catches misconfiguration that check --deploy doesn't catch (e.g., wrong DB URL)."
      ],
      whenToUse: "Every production deployment. Treat this as a checklist, not a suggestion.",
      whenNotToUse: "Development and staging where downtime is acceptable and quick iteration is more important than rigorous process."
    },
    tags: ["deployment", "gunicorn", "checklist", "migrations", "production"],
    order: 58,
    estimatedMinutes: 20
  },
];

export const productionSubcategories = [
  { id: "authentication",  label: "Authentication",    icon: "Shield" },
  { id: "model-patterns",  label: "Model Patterns",    icon: "Database" },
  { id: "pagination",      label: "Pagination",        icon: "List" },
  { id: "logging",         label: "Logging & Errors",  icon: "FileText" },
  { id: "settings",        label: "Settings & Config", icon: "Settings" },
  { id: "caching",         label: "Caching",           icon: "Zap" },
  { id: "celery",          label: "Celery & Tasks",    icon: "Clock" },
  { id: "api-patterns",    label: "API Patterns",      icon: "Globe" },
  { id: "security",        label: "Security",          icon: "Lock" },
  { id: "performance",     label: "Performance",       icon: "TrendingUp" },
];

export const drfViewsTopics = [
  {
    id: "drf-intro",
    title: "Django REST Framework Introduction",
    slug: "drf-intro",
    category: "drf-views",
    difficulty: "beginner",
    description: "Understand what Django REST Framework is, why it's used, and how it extends Django to build web APIs.",
    content: {
      explanation: "Django REST Framework (DRF) is a powerful toolkit for building Web APIs in Django. It provides pre-built components like serializers, viewsets, authentication, and permissions that follow REST best practices. DRF handles content negotiation (JSON/XML), request parsing, response rendering, and API browsability out of the box.",
      realExample: "A mobile app backend needs JSON endpoints for user registration, login, and data retrieval. Instead of manually creating Django views that return JsonResponse for each endpoint, DRF provides generic views that automatically serialize querysets to JSON, handle POST/PUT/DELETE, validate input, and return proper HTTP status codes.",
      codeExample: `# Without DRF (manual approach)
from django.http import JsonResponse
from django.views import View
import json

class BookListView(View):
    def get(self, request):
        books = Book.objects.all().values('title', 'author', 'price')
        return JsonResponse(list(books), safe=False)

    def post(self, request):
        data = json.loads(request.body)
        # Manual validation...
        book = Book.objects.create(**data)
        return JsonResponse({'id': book.id, 'title': book.title})

# With DRF (much cleaner)
from rest_framework import generics
from .models import Book
from .serializers import BookSerializer

class BookListCreateView(generics.ListCreateAPIView):
    queryset = Book.objects.all()
    serializer_class = BookSerializer
    # DRF handles GET (list), POST (create), validation, and JSON rendering automatically!`,
      outputExplanation: "The DRF view automatically provides GET /api/books/ (list all), POST /api/books/ (create new), handles validation via the serializer, returns proper status codes (200, 201, 400), and renders JSON responses. It also provides a browsable API interface for testing.",
      commonMistakes: [
        "Not installing 'rest_framework' in INSTALLED_APPS — DRF views won't be discovered.",
        "Forgetting to add REST_FRAMEWORK settings dictionary for global configuration like default pagination.",
        "Using Django's regular View instead of DRF's APIView — you lose automatic request parsing and response rendering.",
        "Not setting a serializer_class on generic views — DRF can't serialize data without it."
      ],
      interviewNotes: [
        "DRF extends Django's class-based views with APIView, which adds request parsing (JSON/form data), content negotiation, and authentication/permissions.",
        "Generic views (ListAPIView, CreateAPIView, etc.) reduce boilerplate by providing common CRUD patterns.",
        "ViewSets combine multiple views (list/create/retrieve/update/delete) into a single class and work with routers for automatic URL configuration.",
        "DRF is the industry standard for Django APIs — used by Instagram, Mozilla, Red Hat, and Eventbrite."
      ],
      whenToUse: "When building any REST API with Django — mobile backends, SPAs, microservices, public APIs.",
      whenNotToUse: "For traditional server-rendered HTML views — use Django's TemplateView. For GraphQL APIs, consider Graphene-Django instead."
    },
    tags: ["drf", "rest", "api", "intro"],
    order: 1,
    estimatedMinutes: 10
  },
  {
    id: "apiview",
    title: "APIView - The Base View",
    slug: "apiview",
    category: "drf-views",
    difficulty: "beginner",
    description: "Learn how to use APIView, the most basic DRF view class that gives you full control over request handling.",
    content: {
      explanation: "APIView is the base class for all DRF views. It extends Django's View and adds DRF-specific functionality: automatic request parsing (JSON/form data into request.data), Response objects (automatic content negotiation), authentication/permission checking, and exception handling. You define methods for each HTTP verb (get, post, put, patch, delete).",
      realExample: "A custom authentication endpoint where you need fine-grained control over the logic — validating a one-time code, checking multiple conditions, and returning a custom response structure. Generic views are too rigid, so APIView gives you full control while still providing DRF's parsing and rendering.",
      codeExample: `from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

class BookDetailView(APIView):
    """
    Retrieve, update or delete a book instance.
    """
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        try:
            return Book.objects.get(pk=pk)
        except Book.DoesNotExist:
            return None

    def get(self, request, pk):
        book = self.get_object(pk)
        if book is None:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        serializer = BookSerializer(book)
        return Response(serializer.data)

    def put(self, request, pk):
        book = self.get_object(pk)
        if book is None:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        serializer = BookSerializer(book, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        book = self.get_object(pk)
        if book is None:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        book.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

# urls.py
from django.urls import path
urlpatterns = [
    path('books/<int:pk>/', BookDetailView.as_view(), name='book-detail'),
]`,
      outputExplanation: "GET /api/books/1/ returns {'id': 1, 'title': 'Django Guide', ...}. PUT /api/books/1/ with JSON body updates the book. DELETE /api/books/1/ removes it. request.data automatically parses JSON/form data. Response() handles JSON rendering and content-type headers.",
      commonMistakes: [
        "Forgetting to call serializer.is_valid() before serializer.save() — invalid data will raise an exception.",
        "Not setting proper HTTP status codes — always use status.HTTP_* constants for clarity.",
        "Manually constructing JSON with JsonResponse instead of using Response — you lose content negotiation.",
        "Not handling DoesNotExist exceptions — return 404 explicitly instead of letting it crash."
      ],
      interviewNotes: [
        "APIView gives you full control — you write explicit get/post/put/delete methods.",
        "request.data works for JSON, form data, and file uploads (unlike request.GET/POST).",
        "Response() automatically renders to JSON (or XML/YAML if configured).",
        "Use APIView when generic views don't fit your use case — custom business logic, multi-step operations, or complex validation."
      ],
      whenToUse: "When you need full control over the request/response cycle — custom authentication flows, complex business logic, or non-CRUD operations.",
      whenNotToUse: "For simple CRUD operations — use generic views or viewsets instead to reduce boilerplate."
    },
    tags: ["apiview", "views", "drf", "basic"],
    order: 2,
    estimatedMinutes: 12
  },
  {
    id: "generic-views",
    title: "Generic Views",
    slug: "generic-views",
    category: "drf-views",
    difficulty: "intermediate",
    description: "Master DRF's generic views like ListAPIView, CreateAPIView, and RetrieveUpdateDestroyAPIView for common CRUD patterns.",
    content: {
      explanation: "DRF provides generic views that implement common patterns: ListAPIView (GET list), CreateAPIView (POST), RetrieveAPIView (GET single), UpdateAPIView (PUT/PATCH), DestroyAPIView (DELETE), and combinations like ListCreateAPIView and RetrieveUpdateDestroyAPIView. You just set queryset and serializer_class — the view handles everything else.",
      realExample: "A blog API with Article model needs standard CRUD endpoints: GET /articles/ (list), POST /articles/ (create), GET /articles/{id}/ (detail), PUT /articles/{id}/ (update), DELETE /articles/{id}/ (delete). Instead of writing 5 separate APIView classes with repetitive code, use 2 generic views: ListCreateAPIView + RetrieveUpdateDestroyAPIView.",
      codeExample: `from rest_framework import generics
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from .models import Article
from .serializers import ArticleSerializer, ArticleDetailSerializer

# Handles GET (list all) and POST (create new)
class ArticleListCreateView(generics.ListCreateAPIView):
    queryset = Article.objects.filter(published=True).select_related('author')
    serializer_class = ArticleSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]  # Read: anyone, Write: authenticated

    def perform_create(self, serializer):
        # Auto-set author to the logged-in user
        serializer.save(author=self.request.user)

# Handles GET (retrieve), PUT/PATCH (update), DELETE (destroy)
class ArticleDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Article.objects.all()
    serializer_class = ArticleDetailSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def perform_update(self, serializer):
        # Custom logic before saving
        serializer.save(updated_at=timezone.now())

# Other useful generic views:
# - ListAPIView: GET list only (no POST)
# - CreateAPIView: POST only
# - RetrieveAPIView: GET single only
# - UpdateAPIView: PUT/PATCH only
# - DestroyAPIView: DELETE only

# urls.py
urlpatterns = [
    path('articles/', ArticleListCreateView.as_view()),
    path('articles/<int:pk>/', ArticleDetailView.as_view()),
]`,
      outputExplanation: "GET /articles/ returns paginated list of articles. POST /articles/ creates new article and auto-assigns author. GET /articles/1/ returns full detail. PUT /articles/1/ updates it. DELETE /articles/1/ soft-deletes. All JSON, validation, and error handling is automatic.",
      commonMistakes: [
        "Not using select_related() or prefetch_related() in queryset — causes N+1 queries when serializing relations.",
        "Setting both queryset and get_queryset() — get_queryset() overrides queryset, so pick one.",
        "Forgetting lookup_field when using non-pk URLs — e.g., path('<slug:slug>/', ...) requires lookup_field = 'slug'.",
        "Using the wrong combination class — e.g., ListCreateAPIView when you only need ListAPIView (exposing unwanted POST)."
      ],
      interviewNotes: [
        "Generic views follow the DRY principle — they implement common CRUD patterns with minimal code.",
        "perform_create()/perform_update()/perform_destroy() hooks let you customize behavior before saving.",
        "get_queryset() lets you filter based on request.user or query params dynamically.",
        "get_serializer_class() lets you use different serializers for list vs. detail views.",
        "Combine with permissions (IsAuthenticated, IsAdminUser) and throttling for production APIs."
      ],
      whenToUse: "For standard CRUD APIs — 90% of REST endpoints fit this pattern. Reduces boilerplate dramatically.",
      whenNotToUse: "When the operation doesn't map to CRUD — e.g., 'send email', 'calculate report', 'batch import' need custom APIView or @action methods."
    },
    tags: ["generic-views", "crud", "drf", "listcreateapiview"],
    order: 3,
    estimatedMinutes: 15
  },
  {
    id: "viewsets",
    title: "ViewSets and Routers",
    slug: "viewsets",
    category: "drf-views",
    difficulty: "intermediate",
    description: "Learn how ViewSets combine multiple views into one class and use routers for automatic URL routing.",
    content: {
      explanation: "A ViewSet combines list(), create(), retrieve(), update(), partial_update(), and destroy() actions into a single class. Instead of separate views for each endpoint, you define one ViewSet. DRF's DefaultRouter then automatically generates URL patterns. ModelViewSet provides full CRUD by default. ReadOnlyModelViewSet provides only list and retrieve.",
      realExample: "An e-commerce API with Product model needs: GET /products/ (list), POST /products/ (create), GET /products/{id}/ (detail), PUT /products/{id}/ (update), PATCH /products/{id}/ (partial update), DELETE /products/{id}/ (delete). Instead of 2 generic views, use 1 ModelViewSet with a router to auto-generate all 6 URLs.",
      codeExample: `from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from .models import Product
from .serializers import ProductSerializer

class ProductViewSet(viewsets.ModelViewSet):
    """
    A viewset that provides default \`create()\`, \`retrieve()\`, \`update()\`,
    \`partial_update()\`, \`destroy()\` and \`list()\` actions.
    """
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filterset_fields = ['category', 'price']  # Enable filtering
    search_fields = ['name', 'description']    # Enable search
    ordering_fields = ['price', 'created_at']  # Enable ordering

    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)

    # Custom action: POST /products/{id}/mark_featured/
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def mark_featured(self, request, pk=None):
        product = self.get_object()
        product.featured = True
        product.save()
        return Response({'status': 'Product marked as featured'})

    # Custom list action: GET /products/on_sale/
    @action(detail=False, methods=['get'])
    def on_sale(self, request):
        on_sale = self.queryset.filter(discount__gt=0)
        serializer = self.get_serializer(on_sale, many=True)
        return Response(serializer.data)

# urls.py
from rest_framework.routers import DefaultRouter
from .views import ProductViewSet

router = DefaultRouter()
router.register(r'products', ProductViewSet, basename='product')

urlpatterns = [
    path('api/', include(router.urls)),
]

# Generated URLs:
# GET    /api/products/           → list()
# POST   /api/products/           → create()
# GET    /api/products/{id}/      → retrieve()
# PUT    /api/products/{id}/      → update()
# PATCH  /api/products/{id}/      → partial_update()
# DELETE /api/products/{id}/      → destroy()
# POST   /api/products/{id}/mark_featured/ → custom action
# GET    /api/products/on_sale/   → custom list action`,
      outputExplanation: "The router auto-generates all CRUD URLs. ModelViewSet provides full create/read/update/delete. @action decorator adds custom endpoints beyond CRUD. detail=True means it operates on a single object (requires pk). detail=False means it's a collection action.",
      commonMistakes: [
        "Forgetting to include router.urls in urlpatterns — none of the viewset URLs will work.",
        "Using ModelViewSet when you only need read-only access — use ReadOnlyModelViewSet to prevent accidental writes.",
        "Not setting basename when the viewset doesn't have a queryset attribute — router needs it for URL name generation.",
        "Defining @action without methods parameter — it defaults to GET only.",
        "Using detail=True without a pk in the URL — DRF expects /resource/{pk}/action/."
      ],
      interviewNotes: [
        "ViewSets reduce boilerplate — one class handles all CRUD instead of 2-3 separate views.",
        "ModelViewSet = full CRUD. ReadOnlyModelViewSet = list + retrieve only.",
        "@action(detail=True) creates /resource/{pk}/action_name/ endpoint.",
        "@action(detail=False) creates /resource/action_name/ endpoint (collection-level).",
        "Routers auto-generate URL patterns based on viewset methods and actions.",
        "You can override individual actions: def list(self, request) to customize behavior."
      ],
      whenToUse: "When you need full or read-only CRUD for a model — the standard for most REST APIs.",
      whenNotToUse: "When you need fine-grained control over individual endpoints (different permissions per action beyond @action) — use separate generic views."
    },
    tags: ["viewsets", "routers", "modelviewset", "crud"],
    order: 4,
    estimatedMinutes: 18
  },
  {
    id: "function-based-views",
    title: "Function-Based API Views",
    slug: "function-based-views",
    category: "drf-views",
    difficulty: "beginner",
    description: "Use the @api_view decorator to create simple function-based views with DRF features.",
    content: {
      explanation: "The @api_view decorator transforms a regular function into a DRF view. It provides request parsing (request.data), Response objects, authentication/permission checks, and content negotiation. Specify allowed HTTP methods as decorator arguments. It's simpler than class-based views for one-off endpoints.",
      realExample: "A simple health check endpoint or a webhook receiver that doesn't fit the CRUD pattern. You just need a function that accepts POST, validates a token, and returns JSON. @api_view is perfect — no need for a full class.",
      codeExample: `from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status

# Simple GET endpoint
@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    return Response({'status': 'ok', 'version': '1.0.0'})

# POST endpoint with validation
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_email(request):
    email = request.data.get('email')
    message = request.data.get('message')

    if not email or not message:
        return Response(
            {'error': 'Email and message are required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Send email logic here
    send_mail('Subject', message, 'from@example.com', [email])

    return Response({'success': True}, status=status.HTTP_200_OK)

# Multiple methods
@api_view(['GET', 'POST'])
def user_profile(request):
    if request.method == 'GET':
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# urls.py
urlpatterns = [
    path('health/', health_check),
    path('send-email/', send_email),
    path('profile/', user_profile),
]`,
      outputExplanation: "GET /health/ returns {'status': 'ok', 'version': '1.0.0'}. POST /send-email/ with JSON {'email': 'a@b.com', 'message': 'Hi'} sends email and returns {'success': True}. Missing fields return 400 error with {'error': '...'} message.",
      commonMistakes: [
        "Forgetting the @api_view decorator — the function won't have request.data or Response.",
        "Not specifying allowed methods — defaults to GET only, POST will return 405 Method Not Allowed.",
        "Trying to use class-based features like self or mixins — not available in function-based views.",
        "Not returning a Response object — plain dictionaries won't work, must wrap in Response()."
      ],
      interviewNotes: [
        "@api_view is the function-based equivalent of APIView.",
        "Great for simple, one-off endpoints that don't fit CRUD patterns.",
        "Supports all DRF features: permissions, throttling, authentication, content negotiation.",
        "Can't use mixins or inheritance — if you need that, use class-based views.",
        "Cleaner for simple logic, but class-based views scale better for complex APIs."
      ],
      whenToUse: "For simple endpoints — webhooks, health checks, custom actions that don't fit CRUD.",
      whenNotToUse: "When you need inheritance, mixins, or have complex shared logic across multiple endpoints — use class-based views."
    },
    tags: ["function-based", "api_view", "decorator", "simple"],
    order: 5,
    estimatedMinutes: 10
  },
  {
    id: "permissions",
    title: "Permissions in Views",
    slug: "permissions",
    category: "drf-views",
    difficulty: "intermediate",
    description: "Control access to API endpoints using DRF's permission classes like IsAuthenticated, IsAdminUser, and custom permissions.",
    content: {
      explanation: "Permissions determine whether a request should be allowed. DRF checks permissions after authentication and before executing the view. Set permission_classes on views. Built-in: AllowAny (default), IsAuthenticated (login required), IsAdminUser (staff only), IsAuthenticatedOrReadOnly (read: anyone, write: authenticated). You can also write custom permission classes.",
      realExample: "A blog API where anyone can read posts (GET), but only authenticated users can create posts (POST), and only the post author can update/delete their own posts. Use IsAuthenticatedOrReadOnly globally, then add a custom IsAuthorOrReadOnly permission for detail views.",
      codeExample: `from rest_framework import permissions
from rest_framework import generics

# Built-in permissions
class ArticleListView(generics.ListCreateAPIView):
    queryset = Article.objects.all()
    serializer_class = ArticleSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    # GET: anyone, POST: authenticated users only

class ArticleDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Article.objects.all()
    serializer_class = ArticleSerializer
    permission_classes = [permissions.IsAuthenticated]
    # All methods require authentication

# Custom permission: only author can edit/delete
from rest_framework.permissions import BasePermission, SAFE_METHODS

class IsAuthorOrReadOnly(BasePermission):
    """
    Custom permission to only allow authors to edit/delete their articles.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions (GET, HEAD, OPTIONS) allowed to anyone
        if request.method in SAFE_METHODS:
            return True

        # Write permissions only allowed to the author
        return obj.author == request.user

class ArticleDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Article.objects.all()
    serializer_class = ArticleSerializer
    permission_classes = [IsAuthorOrReadOnly]

# Global default in settings.py
REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ]
}

# Override per-view
class PublicArticleListView(generics.ListAPIView):
    queryset = Article.objects.filter(published=True)
    serializer_class = ArticleSerializer
    permission_classes = [permissions.AllowAny]  # Override global`,
      outputExplanation: "IsAuthenticatedOrReadOnly allows GET for anyone, but POST/PUT/DELETE require authentication. Custom IsAuthorOrReadOnly checks obj.author == request.user for write operations. Unauthenticated DELETE returns 403 Forbidden. Non-author DELETE also returns 403.",
      commonMistakes: [
        "Not setting permission_classes — defaults to AllowAny in most configs (insecure!).",
        "Using has_permission when you need has_object_permission — has_permission runs before fetching the object, so you can't check obj.author.",
        "Forgetting SAFE_METHODS check in custom permissions — breaks read access for non-owners.",
        "Setting global IsAuthenticated then wondering why public endpoints return 401 — use AllowAny explicitly on public views."
      ],
      interviewNotes: [
        "has_permission() runs first (before DB query), checks general access.",
        "has_object_permission() runs second (after get_object()), checks object-level access.",
        "SAFE_METHODS = GET, HEAD, OPTIONS (read-only operations).",
        "Multiple permission classes are AND-ed — all must pass.",
        "Return False to deny, True to allow, raise PermissionDenied for custom error message.",
        "Common pattern: IsAuthenticated + custom object-level permission."
      ],
      whenToUse: "Always — every API endpoint should have explicit permissions. Default to IsAuthenticated unless explicitly public.",
      whenNotToUse: "Never skip permissions — even internal APIs should enforce authentication for security."
    },
    tags: ["permissions", "authentication", "security", "access-control"],
    order: 6,
    estimatedMinutes: 14
  },
  {
    id: "pagination",
    title: "Pagination in Views",
    slug: "pagination",
    category: "drf-views",
    difficulty: "intermediate",
    description: "Implement pagination for large datasets using PageNumberPagination, LimitOffsetPagination, and CursorPagination.",
    content: {
      explanation: "Pagination splits large querysets into smaller pages. DRF provides three built-in styles: PageNumberPagination (page=2, page_size=10), LimitOffsetPagination (limit=10, offset=20), and CursorPagination (encrypted cursor for infinite scroll). Configure globally in settings or per-view with pagination_class.",
      realExample: "A product listing API with 10,000 products. Without pagination, GET /products/ would load all 10,000 rows into memory and serialize them, causing timeouts and huge JSON payloads. With PageNumberPagination, each request returns 20 products with next/previous links, making the API fast and mobile-friendly.",
      codeExample: `# settings.py
REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20
}

# Custom pagination class
from rest_framework.pagination import PageNumberPagination

class LargeResultsSetPagination(PageNumberPagination):
    page_size = 100
    page_size_query_param = 'page_size'  # Allow client to override
    max_page_size = 1000

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

# Apply per-view
from rest_framework import generics

class ProductListView(generics.ListAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    pagination_class = LargeResultsSetPagination

# LimitOffsetPagination
from rest_framework.pagination import LimitOffsetPagination

class ProductListView(generics.ListAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    pagination_class = LimitOffsetPagination
    # GET /products/?limit=10&offset=20

# CursorPagination (best for real-time feeds)
from rest_framework.pagination import CursorPagination

class NewsFeedPagination(CursorPagination):
    page_size = 20
    ordering = '-created_at'  # Must specify ordering

class NewsFeedView(generics.ListAPIView):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    pagination_class = NewsFeedPagination`,
      outputExplanation: "PageNumber: {'count': 10000, 'next': '/products/?page=2', 'previous': null, 'results': [...]}. LimitOffset: same but with ?limit=10&offset=20. Cursor: {'next': 'cD0yMDIx...', 'previous': null, 'results': [...]} — encrypted cursor prevents offset manipulation and handles real-time updates.",
      commonMistakes: [
        "Not setting PAGE_SIZE globally — pagination won't activate.",
        "Using LimitOffsetPagination on huge datasets — offset=1000000 is slow; use CursorPagination for large data.",
        "Not setting ordering on CursorPagination — it requires a stable sort order (usually created_at or id).",
        "Allowing unlimited page_size — a malicious client could set ?page_size=1000000 and DoS your API. Always set max_page_size.",
        "Forgetting to document pagination params in API docs — clients won't know how to paginate."
      ],
      interviewNotes: [
        "PageNumberPagination: simple, best for most use cases, supports ?page=2.",
        "LimitOffsetPagination: flexible, supports ?limit=10&offset=20, but slow on high offsets.",
        "CursorPagination: fastest for large data, cursor is encrypted, perfect for real-time feeds, but can't jump to arbitrary page.",
        "Pagination runs in get_queryset(), so you can combine with filtering/search.",
        "Always set max_page_size to prevent abuse.",
        "Return 'count' in response so clients know total pages."
      ],
      whenToUse: "Always paginate list views — even for 'small' datasets that might grow.",
      whenNotToUse: "For single-object retrieval (RetrieveAPIView) — pagination is for lists only."
    },
    tags: ["pagination", "performance", "page-number", "cursor"],
    order: 7,
    estimatedMinutes: 12
  },
  {
    id: "filtering-searching",
    title: "Filtering and Searching",
    slug: "filtering-searching",
    category: "drf-views",
    difficulty: "intermediate",
    description: "Enable filtering, searching, and ordering in list views using django-filter and DRF's built-in backends.",
    content: {
      explanation: "DRF integrates with django-filter to enable URL-based filtering (?category=electronics&price__lte=100), SearchFilter for full-text search (?search=django), and OrderingFilter for sorting (?ordering=-created_at). Configure backends globally or per-view with filter_backends, filterset_fields, search_fields, and ordering_fields.",
      realExample: "An e-commerce product API needs: filter by category and price range, search by name/description, and sort by price/rating. Without DRF's filter backends, you'd manually parse query params and build Q objects. With DRF, you just set filterset_fields=['category', 'price'], search_fields=['name', 'description'], and it works automatically.",
      codeExample: `# Install django-filter
# pip install django-filter

# settings.py
INSTALLED_APPS = [
    ...
    'django_filters',
]

REST_FRAMEWORK = {
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
}

# Simple filtering
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, generics

class ProductListView(generics.ListAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'in_stock', 'price']  # Exact match
    search_fields = ['name', 'description', 'category__name']  # LIKE query
    ordering_fields = ['price', 'created_at', 'rating']  # Allow sorting
    ordering = ['-created_at']  # Default ordering

# URLs:
# GET /products/?category=electronics
# GET /products/?price=29.99
# GET /products/?search=django  (searches name, description, category__name)
# GET /products/?ordering=-price  (descending price)
# GET /products/?ordering=price,created_at  (multi-field sort)
# GET /products/?category=books&search=python&ordering=-rating

# Advanced filtering with FilterSet
import django_filters

class ProductFilter(django_filters.FilterSet):
    min_price = django_filters.NumberFilter(field_name='price', lookup_expr='gte')
    max_price = django_filters.NumberFilter(field_name='price', lookup_expr='lte')
    category = django_filters.CharFilter(field_name='category__slug', lookup_expr='iexact')
    created_after = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')

    class Meta:
        model = Product
        fields = ['in_stock', 'featured']

class ProductListView(generics.ListAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    filterset_class = ProductFilter

# URLs:
# GET /products/?min_price=10&max_price=50
# GET /products/?category=electronics&in_stock=true
# GET /products/?created_after=2024-01-01T00:00:00Z`,
      outputExplanation: "GET /products/?category=electronics&search=laptop&ordering=-price returns laptops in electronics category, sorted by price descending. Filters are AND-ed. Search uses ILIKE (case-insensitive) across all search_fields. Ordering supports multiple fields with comma separation.",
      commonMistakes: [
        "Not installing django-filter package — DjangoFilterBackend won't work.",
        "Using filterset_fields with related lookups like 'category__name' — use filterset_class with custom FilterSet instead.",
        "Not adding '^' or '=' prefix to search_fields — default is case-insensitive contains; use '^name' for startswith or '=name' for exact.",
        "Exposing all fields in ordering_fields — a malicious client could sort by non-indexed fields and slow down your DB. Whitelist only indexed fields.",
        "Forgetting to add indexes on filtered/searched fields — queries will be slow on large tables."
      ],
      interviewNotes: [
        "DjangoFilterBackend: exact match filters via URL query params.",
        "SearchFilter: full-text search across multiple fields (ILIKE under the hood).",
        "OrderingFilter: sorting via ?ordering=field or ?ordering=-field (descending).",
        "filterset_fields: simple exact-match filtering.",
        "filterset_class: advanced filtering with range, date, lookups, etc.",
        "search_fields prefixes: '^' (startswith), '=' (exact), '@' (full-text search), '$' (regex).",
        "Always whitelist filterset_fields, search_fields, ordering_fields — never allow arbitrary field access."
      ],
      whenToUse: "For any list API — filtering/search/ordering are expected features in production APIs.",
      whenNotToUse: "For detail views (single object) — filtering only makes sense for lists."
    },
    tags: ["filtering", "searching", "ordering", "django-filter"],
    order: 8,
    estimatedMinutes: 16
  }
];

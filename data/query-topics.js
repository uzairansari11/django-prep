export const queryTopics = [
  {
    id: "what-is-queryset",
    title: "What is a QuerySet",
    slug: "what-is-queryset",
    category: "queries",
    difficulty: "beginner",
    description: "Lazy evaluation, chaining, and when QuerySets actually hit the database.",
    content: {
      explanation: "A QuerySet is a collection of database queries that Django builds up lazily. It represents a SELECT statement that has not been executed yet. Django only hits the database when you actually need the data — when you iterate, slice, convert to a list, call len(), or call repr() in the shell. This lazy evaluation means you can chain multiple filters and Django sends only one SQL query.",
      realExample: "In a view, you might build up a queryset across several lines — filtering, ordering, annotating — and the database query fires only when the template iterates over it. This is why passing an un-evaluated QuerySet to a template is efficient.",
      codeExample: `from django.db import models

class Article(models.Model):
    title = models.CharField(max_length=200)
    status = models.CharField(max_length=20, default='draft')
    views = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

# ---- LAZY EVALUATION ----
# No DB query yet — just builds the SQL
qs = Article.objects.filter(status='published')
qs = qs.filter(views__gte=100)
qs = qs.order_by('-created_at')

# DB query fires HERE — when you evaluate:
for article in qs:          # iteration triggers query
    print(article.title)

list(qs)                    # explicit evaluation
len(qs)                     # triggers query
bool(qs)                    # triggers query
qs[0]                       # triggers query (LIMIT 1)
qs[0:5]                     # triggers query (LIMIT 5)

# ---- CACHING ----
qs = Article.objects.filter(status='published')
# First access — hits DB and caches results
articles = list(qs)
# Second access — uses cache, no second DB query
articles_again = list(qs)

# BUT — slicing does NOT cache
qs[0]  # hits DB
qs[0]  # hits DB again (no cache for single index access)

# ---- CHAINING ----
# Each filter() returns a new QuerySet — original is unchanged
base = Article.objects.all()
published = base.filter(status='published')   # new QS
popular = base.filter(views__gte=1000)         # new QS, independent of 'published'

# All of this is ONE SQL query:
result = (
    Article.objects
    .filter(status='published')
    .exclude(title__icontains='test')
    .order_by('-views')
    .select_related('author')
)
# SELECT ... FROM article
# WHERE status='published'
#   AND NOT (title ILIKE '%test%')
# ORDER BY views DESC

# Check pending SQL without evaluating:
print(qs.query)  # Prints the SQL string`,
      outputExplanation: "QuerySets are lazy — they accumulate SQL clauses without executing. Evaluation happens at iteration, slicing, list(), len(), bool(), or repr(). After evaluation, results are cached in the QuerySet's _result_cache for repeated access.",
      commonMistakes: [
        "Calling len(qs) to check if results exist — use qs.exists() instead, which is a much cheaper COUNT query.",
        "Accessing qs[0] twice in a loop — each index access fires a separate query. Evaluate to a list first if you need multiple elements.",
        "Building a QuerySet and never evaluating it — the data is never fetched and the variable holds an unevaluated SQL description."
      ],
      interviewNotes: [
        "QuerySets are lazy — no SQL is sent until evaluation.",
        "Evaluation triggers: iteration, slicing, list(), len(), bool(), repr(), exists(), count().",
        "After full evaluation (e.g. list(qs)), results are cached in _result_cache.",
        "Single-item slicing (qs[0]) does NOT cache — use first() or evaluate to a list.",
        "Each filter/exclude/order_by call returns a NEW QuerySet — the original is unmodified."
      ],
      whenToUse: "QuerySets are the primary way to query Django models. Always chain filters rather than evaluating early to let Django compose a single efficient SQL query.",
      whenNotToUse: "If you need to perform complex aggregations or queries that Django's ORM cannot express cleanly, use raw SQL via Manager.raw() or connection.cursor()."
    },
    tags: ["queryset", "lazy", "evaluation", "chaining", "orm"],
    order: 1,
    estimatedMinutes: 10
  },
  {
    id: "all-filter-exclude",
    title: "all(), filter(), exclude()",
    slug: "all-filter-exclude",
    category: "queries",
    difficulty: "beginner",
    description: "The core retrieval methods: all() returns everything, filter() keeps matching rows, exclude() removes matching rows.",
    content: {
      explanation: "all() returns a QuerySet of all objects for a model. filter(**kwargs) returns a QuerySet of objects matching all the given conditions (AND logic). exclude(**kwargs) returns objects that do NOT match the conditions. Both accept field lookups as keyword arguments.",
      realExample: "A blog admin page shows all posts. A public page shows only published posts. A moderation queue shows everything except already-reviewed posts.",
      codeExample: `from django.db import models

class Article(models.Model):
    title = models.CharField(max_length=200)
    status = models.CharField(max_length=20)
    author = models.ForeignKey('Author', on_delete=models.CASCADE)
    views = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

# all() — returns QuerySet of every row
Article.objects.all()
# SELECT * FROM article

# filter() — WHERE clause with AND between kwargs
Article.objects.filter(status='published')
# SELECT * FROM article WHERE status = 'published'

Article.objects.filter(status='published', views__gte=100)
# SELECT * FROM article WHERE status='published' AND views >= 100

# Multiple filter() calls — also AND
Article.objects.filter(status='published').filter(views__gte=100)
# Same SQL as above

# exclude() — WHERE NOT
Article.objects.exclude(status='draft')
# SELECT * FROM article WHERE NOT (status = 'draft')

Article.objects.exclude(status='draft', views=0)
# SELECT * FROM article WHERE NOT (status='draft' AND views=0)
# i.e. rows where status != 'draft' OR views != 0

# Combining filter and exclude
Article.objects.filter(status='published').exclude(title__icontains='test')
# Published articles whose title does not contain 'test'

# filter() with multiple values — OR via __in
Article.objects.filter(status__in=['published', 'featured'])
# SELECT * FROM article WHERE status IN ('published', 'featured')

# Chained filters are AND; for OR use Q objects
from django.db.models import Q
Article.objects.filter(Q(status='published') | Q(views__gte=1000))`,
      outputExplanation: "filter() kwargs are AND-ed together. exclude() negates the entire condition block (using SQL NOT). For OR logic you need Q objects. Both return new QuerySets — chainable and lazy.",
      commonMistakes: [
        "Expecting filter(a=1, b=2) to mean OR — it always means AND. Use Q objects for OR.",
        "Chaining exclude(status='draft') expecting to exclude drafts with no views separately — exclude(a=1, b=2) uses NOT(a AND b), which may not match your intent. Use .exclude(a=1).exclude(b=2) for NOT a AND NOT b."
      ],
      interviewNotes: [
        "filter(**kwargs) ANDs all conditions. For OR, use Q objects.",
        "exclude(**kwargs) is NOT(condition1 AND condition2) — use chained .exclude() calls for independent NOT conditions.",
        "both filter() and exclude() return new QuerySets — the original is unchanged.",
        "all() is equivalent to filter() with no arguments — mostly used for readability or to clone a queryset."
      ],
      whenToUse: "filter() for positive conditions, exclude() for negative conditions. Chain them freely — Django composes a single SQL query.",
      whenNotToUse: "Do not use filter() in a Python loop to simulate SQL — always express conditions as QuerySet methods so Django generates efficient SQL."
    },
    tags: ["filter", "exclude", "all", "queryset", "basics"],
    order: 2,
    estimatedMinutes: 8
  },
  {
    id: "get-first-last",
    title: "get(), first(), last()",
    slug: "get-first-last",
    category: "queries",
    difficulty: "beginner",
    description: "Fetching single objects with get(), first(), and last() — and handling DoesNotExist and MultipleObjectsReturned.",
    content: {
      explanation: "get() retrieves exactly one object matching the conditions and raises DoesNotExist if none found or MultipleObjectsReturned if more than one matches. first() and last() return the first or last object of the QuerySet (or None if empty) — they never raise exceptions.",
      realExample: "Fetching a user by their email uses get() since email is unique. Fetching the latest published article uses last() with ordering by date.",
      codeExample: `from django.db import models

class Article(models.Model):
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    status = models.CharField(max_length=20, default='draft')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

# get() — exactly one result required
try:
    article = Article.objects.get(slug='my-first-post')
except Article.DoesNotExist:
    article = None
except Article.MultipleObjectsReturned:
    # Should never happen for unique fields
    article = Article.objects.filter(slug='my-first-post').first()

# Shortcut for get-by-pk
article = Article.objects.get(pk=1)

# get_object_or_404 — common in views
from django.shortcuts import get_object_or_404
article = get_object_or_404(Article, slug='my-first-post')

# first() — returns first object or None (never raises)
oldest = Article.objects.filter(status='published').first()
# Uses Meta.ordering — returns first by created_at ASC
if oldest is None:
    print("No published articles")

# last() — returns last object or None
newest = Article.objects.filter(status='published').last()

# Explicit ordering with first()/last()
latest = Article.objects.order_by('-created_at').first()
earliest = Article.objects.order_by('created_at').first()

# first() on unordered QuerySet is non-deterministic
# Always order before using first()/last() if order matters
Article.objects.all().first()  # Fine if Meta.ordering is set`,
      outputExplanation: "get() is for fetching a unique row — always use for fields with unique=True. first()/last() are safe alternatives that return None instead of raising. first() respects the QuerySet's ordering.",
      commonMistakes: [
        "Using get() on non-unique fields — risks MultipleObjectsReturned in production.",
        "Not handling DoesNotExist from get() — unhandled exceptions return 500 errors. Use get_object_or_404() in views.",
        "Using first() without ordering — result is non-deterministic if no Meta.ordering is set."
      ],
      interviewNotes: [
        "get() raises DoesNotExist (on model class) or MultipleObjectsReturned.",
        "first() and last() return None for empty querysets — no exception raised.",
        "first() adds LIMIT 1 to SQL. last() reverses ordering and adds LIMIT 1.",
        "get_object_or_404() wraps get() and converts DoesNotExist to Http404 — use in views.",
        "Article.DoesNotExist is a subclass of django.core.exceptions.ObjectDoesNotExist."
      ],
      whenToUse: "get() for unique lookups (pk, unique fields). first()/last() when you want one record from a potentially multi-row result and None is acceptable.",
      whenNotToUse: "Never use get() on non-unique fields in production without robust exception handling."
    },
    tags: ["get", "first", "last", "doesnotexist", "queryset"],
    order: 3,
    estimatedMinutes: 8
  },
  {
    id: "ordering",
    title: "Ordering QuerySets",
    slug: "ordering",
    category: "queries",
    difficulty: "beginner",
    description: "order_by(), ascending, descending with '-', random ordering, ordering by related fields, and nulls_first/nulls_last.",
    content: {
      explanation: "order_by() specifies the ORDER BY clause. Prefix a field name with '-' for descending order. '?' orders randomly (expensive on large tables). Double-underscore notation lets you order by fields on related models. Django 3.1+ supports nulls_first and nulls_last via F expressions.",
      realExample: "An e-commerce site sorts products by price ascending by default, but lets users sort by rating descending or by newest first.",
      codeExample: `from django.db import models
from django.db.models import F

class Product(models.Model):
    name = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    rating = models.FloatField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    category = models.ForeignKey('Category', on_delete=models.CASCADE)
    stock = models.IntegerField(null=True, blank=True)

class Category(models.Model):
    name = models.CharField(max_length=100)

# Ascending (default)
Product.objects.order_by('price')
# SELECT ... ORDER BY price ASC

# Descending
Product.objects.order_by('-price')
# SELECT ... ORDER BY price DESC

# Multi-field ordering — primary sort by category, secondary by name
Product.objects.order_by('category__name', 'name')

# Order by related field (triggers JOIN)
Product.objects.order_by('category__name')

# Random order — avoid on large tables (ORDER BY RAND() full scan)
Product.objects.order_by('?')

# Clear Meta.ordering
Product.objects.all().order_by()   # No ORDER BY clause

# Override Meta.ordering for a specific query
Product.objects.order_by('-created_at')  # Replaces Meta.ordering

# nulls_first / nulls_last (Django 3.1+)
Product.objects.order_by(
    F('stock').asc(nulls_last=True)   # NULL values go to the end
)
Product.objects.order_by(
    F('stock').desc(nulls_first=True)  # NULL values go to the start
)

# F expression ordering — equivalent to '-price'
Product.objects.order_by(F('price').desc())

# Stable sort — use multiple fields for deterministic ordering
Product.objects.order_by('-rating', 'pk')  # pk as tiebreaker`,
      outputExplanation: "order_by() completely replaces Meta.ordering. Pass no arguments to remove all ordering. F().asc()/F().desc() are the idiomatic way to handle nulls and express ordering as expressions.",
      commonMistakes: [
        "Using order_by('?') in production on large tables — generates ORDER BY RAND() which is a full table scan.",
        "Forgetting that order_by() replaces (not extends) Meta.ordering.",
        "Ordering by a non-indexed field on large tables — use indexes for frequent sort fields."
      ],
      interviewNotes: [
        "'-field' means DESC, 'field' means ASC, '?' means random.",
        "order_by() replaces Meta.ordering entirely. Use order_by() with no args to clear it.",
        "Ordering by related fields (category__name) triggers a SQL JOIN.",
        "F('field').asc(nulls_last=True) requires Django 3.1+.",
        "Add a pk tiebreaker (order_by('-date', 'pk')) for deterministic pagination."
      ],
      whenToUse: "Always specify ordering for paginated querysets to ensure consistent page results. Use F() expressions when handling NULL values in sort columns.",
      whenNotToUse: "Avoid order_by('?') on large datasets. Avoid ordering in subqueries — most databases ignore ORDER BY in subqueries."
    },
    tags: ["ordering", "order_by", "ascending", "descending", "queryset"],
    order: 4,
    estimatedMinutes: 8
  },
  {
    id: "slicing",
    title: "QuerySet Slicing",
    slug: "slicing",
    category: "queries",
    difficulty: "beginner",
    description: "Python slice syntax on QuerySets, LIMIT/OFFSET mapping, no negative indexing, and step slicing.",
    content: {
      explanation: "QuerySets support Python slice syntax which maps to SQL LIMIT and OFFSET. qs[5:10] generates LIMIT 5 OFFSET 5. Negative indexing is not supported. Slicing a QuerySet returns a new QuerySet (still lazy) except for single-index access which returns an object immediately.",
      realExample: "Pagination in a REST API: page 2 with 20 items per page is qs[20:40] which maps to LIMIT 20 OFFSET 20.",
      codeExample: `from myapp.models import Article

# First 5 articles — LIMIT 5
Article.objects.all()[:5]

# Articles 5–10 — LIMIT 5 OFFSET 5
Article.objects.all()[5:10]

# Single object by index — triggers immediate query, returns object not QS
Article.objects.all()[0]       # First article (LIMIT 1)
# Equivalent to: Article.objects.first()

# Negative indexing — NOT SUPPORTED
# Article.objects.all()[-1]  # Raises AssertionError

# Workaround for last item:
Article.objects.order_by('-pk')[0]
# or
Article.objects.last()

# Step slicing — evaluates immediately to a list
Article.objects.all()[::2]   # Every other article — executes query now

# Slicing a filtered queryset
recent_published = Article.objects.filter(status='published').order_by('-created_at')
page_1 = recent_published[:20]    # Still lazy QuerySet
page_2 = recent_published[20:40]  # Still lazy QuerySet

# Cannot filter a sliced QuerySet
# Article.objects.all()[:5].filter(status='published')  # raises AssertionError

# Pagination with Django's Paginator (preferred over manual slicing)
from django.core.paginator import Paginator
paginator = Paginator(Article.objects.all(), 20)  # 20 per page
page = paginator.get_page(2)  # Page 2

# LIMIT/OFFSET SQL generated:
# qs[:10]      -> LIMIT 10
# qs[5:10]     -> LIMIT 5 OFFSET 5
# qs[5:]       -> OFFSET 5 (no LIMIT — fetches everything from offset)`,
      outputExplanation: "Slices return a new QuerySet (lazy) except for step slices and single-index access which evaluate immediately. You cannot filter a sliced QuerySet — apply all filters before slicing.",
      commonMistakes: [
        "Trying negative indexing — raises AssertionError. Use order_by('-pk')[0] instead.",
        "Filtering after slicing — raises AssertionError. Always filter before slicing.",
        "Using qs[5:] (no upper bound) on a large table — generates OFFSET 5 with no LIMIT, fetching all remaining rows."
      ],
      interviewNotes: [
        "qs[a:b] maps to LIMIT (b-a) OFFSET a in SQL.",
        "Single index (qs[0]) triggers an immediate query and returns an object, not a QuerySet.",
        "Negative indexing is not supported — use order_by('-field')[0] or last().",
        "Step slicing (qs[::2]) evaluates the QuerySet immediately.",
        "Cannot chain .filter() after slicing — apply filters first."
      ],
      whenToUse: "For simple pagination or top-N queries. For production pagination with page numbers, use Django's Paginator class.",
      whenNotToUse: "Avoid large OFFSET values on big tables — OFFSET N forces the database to scan and skip N rows. Use keyset/cursor pagination for large datasets."
    },
    tags: ["slicing", "limit", "offset", "pagination", "queryset"],
    order: 5,
    estimatedMinutes: 6
  },
  {
    id: "exists-count",
    title: "exists() and count()",
    slug: "exists-count",
    category: "queries",
    difficulty: "beginner",
    description: "When to use exists() vs count() for performance, and why both beat len() and bool().",
    content: {
      explanation: "count() generates SELECT COUNT(*) and returns an integer. exists() generates SELECT 1 ... LIMIT 1 and returns a boolean. Both are far more efficient than fetching all rows and calling len() or bool() on the result.",
      realExample: "Checking if a user has any unpaid invoices: Invoice.objects.filter(user=user, paid=False).exists() sends one tiny query. Doing bool(Invoice.objects.filter(...)) fetches all invoice rows just to check if the list is empty.",
      codeExample: `from myapp.models import Order, Product

# COUNT query — returns integer
total = Order.objects.count()
# SELECT COUNT(*) FROM order

pending_count = Order.objects.filter(status='pending').count()
# SELECT COUNT(*) FROM order WHERE status='pending'

# exists() — returns True/False, uses LIMIT 1
has_pending = Order.objects.filter(status='pending').exists()
# SELECT (1) AS "a" FROM order WHERE status='pending' LIMIT 1

# ---- PERFORMANCE COMPARISON ----

# BAD — fetches all rows to count them
orders = Order.objects.filter(status='pending')
if len(orders) > 0:   # Fetches EVERY row just to check > 0
    print("Has pending orders")

# BAD — fetches all rows to check truthiness
if Order.objects.filter(status='pending'):  # Full query evaluation
    print("Has pending orders")

# GOOD — exists() is O(1) regardless of table size
if Order.objects.filter(status='pending').exists():
    print("Has pending orders")

# GOOD — count() for counting without fetching rows
num = Order.objects.filter(status='pending').count()
print(f"{num} pending orders")

# When to use count() vs exists():
# - Need the NUMBER: use count()
# - Just need to know IF any exist: use exists()

# Annotating count (different use case):
from django.db.models import Count
products = Product.objects.annotate(order_count=Count('orderitem'))
# Adds order_count to each Product — count per object, not total

# Conditional count
from django.db.models import Q
Product.objects.aggregate(
    total=Count('id'),
    active=Count('id', filter=Q(is_active=True))
)
# Returns {'total': 500, 'active': 423}`,
      outputExplanation: "exists() is the fastest way to check for any matching rows — SQL optimizers stop scanning after the first match. count() generates a COUNT(*) aggregation. Both avoid transferring row data across the network.",
      commonMistakes: [
        "Using len(qs) instead of qs.count() — len() evaluates the full QuerySet.",
        "Using if qs: instead of qs.exists() — truthiness evaluation fetches all rows.",
        "Using count() when exists() suffices — count() scans the whole table, exists() stops at the first match."
      ],
      interviewNotes: [
        "exists() generates SELECT 1 ... LIMIT 1 — stops at the first matching row.",
        "count() generates SELECT COUNT(*) — scans all matching rows.",
        "len(qs) evaluates the QuerySet, caches results in _result_cache, then counts Python objects.",
        "If you've already evaluated the QuerySet (in a loop above), len() uses the cache — no extra query.",
        "Never use if queryset: in a view — always use .exists()."
      ],
      whenToUse: "exists() for boolean checks. count() when you need the actual number. Both over len() and bool() on unevaluated QuerySets.",
      whenNotToUse: "If you've already fetched the data (e.g. already iterated), using len() on the cached list is fine — no extra query."
    },
    tags: ["exists", "count", "performance", "queryset"],
    order: 6,
    estimatedMinutes: 6
  },
  {
    id: "create-update-delete",
    title: "create(), update(), delete(), get_or_create(), update_or_create()",
    slug: "create-update-delete",
    category: "queries",
    difficulty: "beginner",
    description: "Creating, updating, and deleting records via the ORM — including convenience methods.",
    content: {
      explanation: "Django provides multiple ways to write data: create() for new records, update() for bulk field updates, delete() to remove records, and convenience methods get_or_create() and update_or_create() for upsert patterns.",
      realExample: "A user registration creates a profile. A checkout process updates inventory stock. A cleanup job deletes old sessions. A webhook handler uses update_or_create to upsert subscription data.",
      codeExample: `from myapp.models import Product, Category, Tag

# ---- CREATE ----
# Method 1: create() — INSERT in one step
product = Product.objects.create(
    name='Laptop',
    price=999.99,
    stock=50
)
# Returns the saved instance with pk populated

# Method 2: save()
product = Product(name='Mouse', price=29.99)
product.save()  # INSERT

# ---- UPDATE ----
# Single instance update — two DB queries (SELECT + UPDATE)
product = Product.objects.get(pk=1)
product.price = 899.99
product.save()
# Efficient — only update changed field:
product.save(update_fields=['price'])

# Bulk update — ONE UPDATE query, no Python objects created
Product.objects.filter(category__name='Electronics').update(is_active=True)
# UPDATE product SET is_active=TRUE WHERE category_id IN (...)
# NOTE: bypasses save(), signals, and auto_now fields

# ---- DELETE ----
# Delete single instance
product = Product.objects.get(pk=1)
product.delete()  # Returns (count, {model: count}) dict

# Bulk delete
deleted_count, _ = Product.objects.filter(is_active=False).delete()

# ---- GET OR CREATE ----
# Returns (instance, created) tuple
category, created = Category.objects.get_or_create(
    name='Electronics',          # Lookup fields
    defaults={'slug': 'electronics'}  # Only set on creation
)
if created:
    print(f"New category created: {category.pk}")
else:
    print(f"Existing category found: {category.pk}")

# ---- UPDATE OR CREATE ----
product, created = Product.objects.update_or_create(
    sku='LAP001',                # Lookup field (must be unique)
    defaults={                   # Fields to set on create OR update
        'name': 'Laptop Pro',
        'price': 1299.99,
    }
)

# ---- ATOMIC GET OR CREATE (race condition safe) ----
# get_or_create uses SELECT then INSERT — can have race conditions
# in high concurrency. Always wrap in select_for_update or rely on
# unique constraint + IntegrityError handling for true atomicity.`,
      outputExplanation: "create() and save() run full_clean() validators only if you call it explicitly. update() bypasses Python entirely — no signals, no save(), no auto_now. get_or_create() returns a tuple (instance, created_bool).",
      commonMistakes: [
        "Using update() and expecting auto_now fields to update — they don't because update() bypasses save().",
        "Using get_or_create() without wrapping in atomic() in concurrent environments — two processes can both pass the GET check and both attempt the CREATE.",
        "Calling product.save() after bulk update() — the in-memory object is stale, save() would overwrite the bulk update."
      ],
      interviewNotes: [
        "create() = instantiate + save() in one call.",
        "update() is a single SQL UPDATE — bypasses save(), signals, and auto_now.",
        "delete() on a QuerySet returns (total_count, {model_label: count}) — useful for logging.",
        "get_or_create() defaults= are only applied on creation, not on get.",
        "update_or_create() defaults= are applied on BOTH create and update."
      ],
      whenToUse: "get_or_create() for idempotent creation logic. update_or_create() for upsert patterns (webhook handlers, data imports). Bulk update() for performance-critical mass updates.",
      whenNotToUse: "Do not use update() when you need signals, auto_now, or validator logic to run — use save() instead."
    },
    tags: ["create", "update", "delete", "get_or_create", "update_or_create", "queryset"],
    order: 7,
    estimatedMinutes: 12
  },
  {
    id: "bulk-operations",
    title: "Bulk Operations",
    slug: "bulk-operations",
    category: "queries",
    difficulty: "intermediate",
    description: "bulk_create(), bulk_update(), ignore_conflicts, and update_fields for high-performance batch writes.",
    content: {
      explanation: "Bulk operations send a single SQL statement for many rows, making them dramatically faster than looping over save(). bulk_create() inserts many records in one INSERT. bulk_update() updates specific fields across many records in one query.",
      realExample: "Importing 10,000 products from a CSV: looping and calling product.save() makes 10,000 INSERT queries. bulk_create() makes one query. On PostgreSQL this is 100x faster.",
      codeExample: `from myapp.models import Product, Tag

# ---- BULK CREATE ----
products = [
    Product(name='Laptop', price=999.99, stock=10),
    Product(name='Mouse', price=29.99, stock=100),
    Product(name='Keyboard', price=79.99, stock=50),
    # ... thousands more
]

# One INSERT query for all rows
created = Product.objects.bulk_create(products)
# Returns list of created instances
# NOTE: PKs are populated on PostgreSQL but NOT on MySQL/SQLite

# ignore_conflicts — skip rows that violate unique constraints
Product.objects.bulk_create(
    products,
    ignore_conflicts=True  # Silently skip duplicates
)

# update_conflicts (Django 4.1+) — upsert on conflict
Product.objects.bulk_create(
    products,
    update_conflicts=True,
    update_fields=['price', 'stock'],
    unique_fields=['sku']  # The conflict detection field
)

# batch_size — break into chunks to avoid huge SQL statements
Product.objects.bulk_create(products, batch_size=500)

# ---- BULK UPDATE ----
products = list(Product.objects.filter(category__name='Electronics'))
for p in products:
    p.price = p.price * 0.9  # 10% discount

# One UPDATE query per batch
Product.objects.bulk_update(products, fields=['price'], batch_size=200)
# UPDATE product SET price=... WHERE id=... for each batch

# ---- BULK DELETE ----
# Already covered by QuerySet.delete()
Product.objects.filter(is_active=False).delete()  # One DELETE query

# ---- CHUNKING LARGE IMPORTS ----
import csv
from itertools import islice

def chunked(iterable, size):
    it = iter(iterable)
    while True:
        chunk = list(islice(it, size))
        if not chunk:
            break
        yield chunk

def import_products(csv_file):
    reader = csv.DictReader(csv_file)
    objects = (
        Product(name=row['name'], price=row['price'])
        for row in reader
    )
    for chunk in chunked(objects, 500):
        Product.objects.bulk_create(chunk)`,
      outputExplanation: "bulk_create() sends one INSERT with many value sets. bulk_update() sends batched UPDATE statements. Both skip save(), full_clean(), and signals — purely SQL-level operations.",
      commonMistakes: [
        "Expecting PKs from bulk_create() on MySQL or SQLite — only PostgreSQL populates PKs on bulk create.",
        "Using bulk_create() with ignore_conflicts=True and expecting to know which rows were skipped — you can't, the failures are silent.",
        "Not using batch_size on large imports — a single INSERT with 100,000 rows can cause memory issues and DB timeouts."
      ],
      interviewNotes: [
        "bulk_create() is 10-100x faster than looping save() for large imports.",
        "bulk_create/update bypass save(), signals, and validators — add explicit validation before calling.",
        "PKs are populated after bulk_create() on PostgreSQL only.",
        "batch_size controls how many rows go into a single SQL statement — use 500-1000 as a starting point.",
        "Django 4.1+ added update_conflicts=True to bulk_create() for upsert behaviour."
      ],
      whenToUse: "Any time you need to insert or update hundreds or thousands of records. Always use bulk operations for data imports.",
      whenNotToUse: "When you need signals, validators, or auto_now to fire. When you need the PKs of created objects on non-PostgreSQL databases."
    },
    tags: ["bulk_create", "bulk_update", "performance", "queryset", "import"],
    order: 8,
    estimatedMinutes: 10
  },
  {
    id: "values-values-list",
    title: "values() and values_list()",
    slug: "values-values-list",
    category: "queries",
    difficulty: "intermediate",
    description: "Fetching dictionaries or tuples instead of model instances, flat=True, named=True, and when to use them.",
    content: {
      explanation: "values() returns a QuerySet of dictionaries instead of model instances. values_list() returns a QuerySet of tuples. Both reduce memory usage by not constructing full Python model objects, and let you SELECT only specific columns.",
      realExample: "Building a dropdown list of category names and IDs for a form — you only need two fields. Using values() avoids fetching all other columns and creating full model instances.",
      codeExample: `from myapp.models import Product, Category

# values() — returns list of dicts
Product.objects.values('name', 'price')
# [{'name': 'Laptop', 'price': Decimal('999.99')}, ...]
# SELECT name, price FROM product

Product.objects.values()  # All fields as dicts
# [{'id': 1, 'name': 'Laptop', 'price': ...}, ...]

# Access related fields via __ notation
Product.objects.values('name', 'category__name')
# [{'name': 'Laptop', 'category__name': 'Electronics'}, ...]
# Performs a JOIN

# values_list() — returns list of tuples
Product.objects.values_list('name', 'price')
# [('Laptop', Decimal('999.99')), ('Mouse', Decimal('29.99'))]

# flat=True — single field as flat list (not tuples)
Product.objects.values_list('name', flat=True)
# ['Laptop', 'Mouse', 'Keyboard']
# flat=True only works with a single field

# named=True — named tuples (like a lightweight object)
rows = Product.objects.values_list('name', 'price', named=True)
for row in rows:
    print(row.name, row.price)  # Access by attribute name

# Common use: get a list of PKs
pks = Product.objects.filter(is_active=True).values_list('pk', flat=True)
# [1, 2, 3, 4, ...]

# Use in another query
related = Order.objects.filter(product__in=pks)

# Model instances vs values() comparison:
# Model instance fetch:
products = Product.objects.all()
# Creates a Product Python object for each row — all field data loaded

# values() fetch:
products = Product.objects.values('id', 'name')
# No model instances — just plain dicts with selected columns
# Much faster for large datasets when you don't need model methods

# Aggregation with values() — GROUP BY
from django.db.models import Count, Avg
Product.objects.values('category__name').annotate(
    count=Count('id'),
    avg_price=Avg('price')
)
# SELECT category.name, COUNT(product.id), AVG(price)
# FROM product JOIN category ...
# GROUP BY category.name`,
      outputExplanation: "values() and values_list() skip model instantiation — they return raw data structures. This is significantly faster and lower memory for large result sets. flat=True on values_list() extracts a single column as a simple list.",
      commonMistakes: [
        "Using flat=True with multiple fields — raises TypeError. flat=True only works with exactly one field.",
        "Trying to call model methods on values() results — they return dicts/tuples, not model instances.",
        "Forgetting that values() with annotation groups results — values('field').annotate() is a GROUP BY."
      ],
      interviewNotes: [
        "values() returns QuerySet of dicts. values_list() returns QuerySet of tuples.",
        "flat=True on values_list() with one field returns a flat list: ['a', 'b', 'c'].",
        "values().annotate() is a GROUP BY — groups by the values() fields.",
        "No model instance is created — you lose access to model methods and properties.",
        "values_list('pk', flat=True) is the idiomatic way to get a list of IDs."
      ],
      whenToUse: "Large datasets where you only need specific fields. Building dropdowns, ID lists, or CSV exports. GROUP BY aggregations via values().annotate().",
      whenNotToUse: "When you need to call model methods or use the ORM's related object traversal — use model instances instead."
    },
    tags: ["values", "values_list", "flat", "performance", "queryset"],
    order: 9,
    estimatedMinutes: 10
  },
  {
    id: "distinct",
    title: "distinct()",
    slug: "distinct",
    category: "queries",
    difficulty: "intermediate",
    description: "Removing duplicate rows with distinct(), DISTINCT ON in PostgreSQL, and when duplicates appear.",
    content: {
      explanation: "distinct() adds SELECT DISTINCT to the query, removing duplicate rows. Duplicates typically appear when filtering through ManyToMany or reverse FK relations — a row is returned once per matching related row. PostgreSQL also supports DISTINCT ON (field) to keep only the first row per unique value of a specific column.",
      realExample: "Fetching all products that have at least one review — a product with 5 reviews appears 5 times without distinct(). Using distinct() collapses it to one row per product.",
      codeExample: `from myapp.models import Product, Tag, Review
from django.db.models import Count

# Without distinct — duplicates from M2M join
# A product with 3 tags appears 3 times
Product.objects.filter(tags__name__in=['python', 'web'])
# Returns duplicates if a product matches multiple tags

# With distinct — one row per product
Product.objects.filter(tags__name__in=['python', 'web']).distinct()

# M2M example
class Product(models.Model):
    name = models.CharField(max_length=200)
    tags = models.ManyToManyField('Tag', related_name='products')

# Products that have ANY of these tags (may duplicate)
Product.objects.filter(tags__name__in=['sale', 'featured', 'new'])
# Fix:
Product.objects.filter(tags__name__in=['sale', 'featured', 'new']).distinct()

# Reverse FK example
# Products that have at least one review
Product.objects.filter(review__rating__gte=4).distinct()

# Counting distinct values
# Count unique authors who have published articles
from myapp.models import Article
Article.objects.filter(status='published').values('author').distinct().count()

# DISTINCT ON — PostgreSQL only
# Keep only the latest product per category
from django.db.models import F
Product.objects.order_by('category_id', '-created_at').distinct('category_id')
# Keeps first row (by ordering) for each unique category_id
# SQL: SELECT DISTINCT ON (category_id) * FROM product ORDER BY category_id, created_at DESC

# distinct() with values() — distinct combinations
Product.objects.values('category__name', 'status').distinct()
# Unique (category, status) combinations

# Count distinct field values
from django.db.models import Count
Product.objects.aggregate(unique_categories=Count('category', distinct=True))`,
      outputExplanation: "distinct() prevents duplicate rows in the result. Duplicates appear naturally when JOINing to M2M or reverse FK relations — each matching related row creates a duplicate of the parent. DISTINCT ON (PostgreSQL only) is useful for 'latest per group' queries.",
      commonMistakes: [
        "Using distinct() with order_by() on non-DISTINCT fields in PostgreSQL — DISTINCT ON requires the ORDER BY to start with the same fields.",
        "Forgetting distinct() after filtering through M2M — the most common source of unexpected duplicates.",
        "Using distinct() unnecessarily — it adds overhead. Only add it when you know duplicates are possible."
      ],
      interviewNotes: [
        "Duplicates appear when filtering through M2M or reverse FK relations.",
        "distinct() adds SELECT DISTINCT — all columns must be identical for a row to be considered duplicate.",
        "distinct('field') is PostgreSQL-only DISTINCT ON — keeps first row per unique field value.",
        "For 'products with at least one review', prefer Exists() over filter().distinct() for better performance on large tables.",
        "Count('field', distinct=True) counts unique values without deduplicating rows."
      ],
      whenToUse: "After filtering through M2M or reverse FK relations when you want one row per 'main' object. For DISTINCT ON 'latest per group' patterns on PostgreSQL.",
      whenNotToUse: "Do not add distinct() by default — it has a cost. Identify the specific query that generates duplicates and add it there."
    },
    tags: ["distinct", "duplicates", "m2m", "postgresql", "queryset"],
    order: 10,
    estimatedMinutes: 8
  },
  {
    id: "lookups",
    title: "Field Lookups",
    slug: "lookups",
    category: "queries",
    difficulty: "intermediate",
    description: "All Django lookup types: exact, iexact, contains, icontains, startswith, endswith, in, gt, gte, lt, lte, range, isnull, regex, date, year, month, and more.",
    content: {
      explanation: "Django field lookups are the part after __ in filter() arguments. They translate directly to SQL WHERE conditions. Django provides ~30 built-in lookups covering equality, comparison, string matching, date extraction, null checks, and regular expressions.",
      realExample: "Search feature: icontains for case-insensitive text search. Date range filter: range for between two dates. Status filter: in for multiple allowed values. Null check: isnull for optional fields.",
      codeExample: `from myapp.models import Article, Product
from datetime import date

# ---- EQUALITY ----
Article.objects.filter(status__exact='published')    # = 'published'
Article.objects.filter(status='published')           # exact is the default
Article.objects.filter(title__iexact='hello world')  # case-insensitive =

# ---- CONTAINS ----
Article.objects.filter(title__contains='Django')     # LIKE '%Django%' (case-sensitive)
Article.objects.filter(title__icontains='django')    # ILIKE '%django%' (case-insensitive)
Article.objects.filter(title__startswith='How')      # LIKE 'How%'
Article.objects.filter(title__istartswith='how')     # ILIKE 'how%'
Article.objects.filter(title__endswith='?')          # LIKE '%?'
Article.objects.filter(title__iendswith='guide')     # ILIKE '%guide'

# ---- COMPARISON ----
Product.objects.filter(price__gt=100)                # > 100
Product.objects.filter(price__gte=100)               # >= 100
Product.objects.filter(price__lt=500)                # < 500
Product.objects.filter(price__lte=500)               # <= 500

# ---- IN ----
Article.objects.filter(status__in=['published', 'featured'])   # IN (...)
Article.objects.exclude(status__in=['draft', 'archived'])      # NOT IN (...)

# ---- RANGE ----
from datetime import datetime
Article.objects.filter(
    created_at__range=['2024-01-01', '2024-12-31']
)  # BETWEEN '2024-01-01' AND '2024-12-31'

Product.objects.filter(price__range=[100, 500])

# ---- NULL CHECK ----
Article.objects.filter(published_at__isnull=True)   # IS NULL
Article.objects.filter(published_at__isnull=False)  # IS NOT NULL

# ---- DATE LOOKUPS ----
Article.objects.filter(created_at__date=date.today())   # Cast to DATE
Article.objects.filter(created_at__year=2024)           # YEAR(created_at) = 2024
Article.objects.filter(created_at__month=6)             # MONTH = 6
Article.objects.filter(created_at__day=15)              # DAY = 15
Article.objects.filter(created_at__week=25)             # ISO week number
Article.objects.filter(created_at__week_day=2)          # 1=Sunday, 2=Monday...
Article.objects.filter(created_at__quarter=2)           # Q2
Article.objects.filter(created_at__time__gte='09:00:00')

# ---- REGEX ----
Article.objects.filter(title__regex=r'^Django [0-9]+')    # Case-sensitive regex
Article.objects.filter(title__iregex=r'^django [0-9]+')   # Case-insensitive regex

# ---- ACROSS RELATIONS ----
# Double underscore traverses FK relationships
Article.objects.filter(author__name__icontains='john')
Article.objects.filter(author__country__name='USA')  # Multi-level

# ---- COMBINING LOOKUPS ----
Article.objects.filter(
    status='published',
    created_at__year=2024,
    title__icontains='django',
    views__gte=100
)`,
      outputExplanation: "Each lookup after __ maps to a SQL operator. icontains uses ILIKE (native on PostgreSQL; UPPER() function on others). Date lookups extract date parts using database functions. Lookups chained with __ across relations trigger JOINs.",
      commonMistakes: [
        "Using contains when icontains is needed — contains is case-sensitive on most databases.",
        "Using date lookups on DateField instead of DateTimeField — date__year works on both, but __date only makes sense for DateTimeField.",
        "Expecting regex lookups to work identically across databases — regex syntax varies between PostgreSQL, MySQL, and SQLite."
      ],
      interviewNotes: [
        "The default lookup is exact — filter(name='x') == filter(name__exact='x').",
        "icontains translates to ILIKE on PostgreSQL, UPPER(col) LIKE UPPER('%val%') on others.",
        "range is inclusive: price__range=[100, 500] is 100 <= price <= 500.",
        "Date lookups (__year, __month, etc.) use database date extraction functions.",
        "__ can chain multiple levels: author__profile__country__name — each level is a JOIN."
      ],
      whenToUse: "Use the most specific lookup for your condition — icontains for search, range for date/price windows, isnull for optional fields.",
      whenNotToUse: "Avoid regex lookups in high-traffic queries — they're slow. Use full-text search (django.contrib.postgres.search or Elasticsearch) for production search features."
    },
    tags: ["lookups", "filter", "icontains", "range", "isnull", "queryset"],
    order: 11,
    estimatedMinutes: 15
  },
  {
    id: "q-objects",
    title: "Q Objects",
    slug: "q-objects",
    category: "queries",
    difficulty: "intermediate",
    description: "Q objects for OR, AND, NOT conditions and combining complex filter logic.",
    content: {
      explanation: "Q objects allow you to build complex WHERE clauses with OR, AND, and NOT logic. Regular filter() kwargs are always AND-ed. Q objects use | for OR, & for AND, and ~ for NOT. They can be combined and nested arbitrarily.",
      realExample: "A search endpoint that returns articles matching a keyword in the title OR body, published in the last year, and NOT archived.",
      codeExample: `from django.db.models import Q
from myapp.models import Article, Product

# OR condition — impossible with plain filter()
Article.objects.filter(
    Q(title__icontains='django') | Q(body__icontains='django')
)
# SELECT ... WHERE title ILIKE '%django%' OR body ILIKE '%django%'

# AND — same as regular filter() kwargs
Article.objects.filter(
    Q(status='published') & Q(views__gte=100)
)
# Equivalent to:
Article.objects.filter(status='published', views__gte=100)

# NOT
Article.objects.filter(~Q(status='draft'))
# WHERE NOT status = 'draft'
# Equivalent to:
Article.objects.exclude(status='draft')

# Combining Q objects
Article.objects.filter(
    (Q(title__icontains='python') | Q(title__icontains='django'))
    & Q(status='published')
    & ~Q(author__name='spam-bot')
)

# Mixing Q and kwargs — Q objects must come BEFORE kwargs
Article.objects.filter(
    Q(title__icontains='django') | Q(body__icontains='django'),
    status='published'   # kwargs after Q objects — AND-ed with Q
)

# Building Q objects dynamically
def search_articles(query=None, status=None, year=None):
    q = Q()  # Empty Q — neutral element for AND
    if query:
        q &= Q(title__icontains=query) | Q(body__icontains=query)
    if status:
        q &= Q(status=status)
    if year:
        q &= Q(created_at__year=year)
    return Article.objects.filter(q)

# Empty Q() — no effect when AND-ed
q = Q()
q &= Q(status='published')
q &= Q(views__gte=100)
Article.objects.filter(q)

# OR-reducing a list of Q objects
from functools import reduce
from operator import or_
statuses = ['published', 'featured', 'trending']
query = reduce(or_, [Q(status=s) for s in statuses])
Article.objects.filter(query)
# Equivalent to filter(status__in=statuses) in this case`,
      outputExplanation: "Q objects give you full boolean algebra in Django filters. | is OR, & is AND, ~ is NOT. Empty Q() acts as neutral element for &. Q objects must appear before keyword arguments in filter().",
      commonMistakes: [
        "Putting keyword arguments before Q objects in filter() — raises TypeError. Always put Q objects first.",
        "Using Q() OR-chain when __in lookup suffices — filter(status__in=[...]) is simpler and faster.",
        "NOT using Q objects for OR conditions and writing separate queries and combining in Python instead."
      ],
      interviewNotes: [
        "| is OR, & is AND, ~ is NOT in Q objects.",
        "Q objects must come before keyword arguments in filter().",
        "Q() with no args is a neutral element — filtering with it has no effect.",
        "Combine Q objects with reduce(or_, [...]) to build dynamic OR chains.",
        "Q objects are composable — build them separately and combine for reusable filter logic."
      ],
      whenToUse: "Any time you need OR logic, NOT logic, or dynamically constructed filter conditions.",
      whenNotToUse: "When __in lookup covers the OR case for a single field — it's simpler and the DB optimizer handles it better."
    },
    tags: ["q-objects", "or", "and", "not", "filter", "queryset"],
    order: 12,
    estimatedMinutes: 10
  },
  {
    id: "f-expressions",
    title: "F Expressions",
    slug: "f-expressions",
    category: "queries",
    difficulty: "intermediate",
    description: "F expressions for database-level field operations, avoiding race conditions, arithmetic with F, and comparing two fields.",
    content: {
      explanation: "F expressions represent the value of a model field at the database level. They let you reference and operate on field values in Python code, but the actual computation happens in SQL. This avoids race conditions from read-modify-write cycles and allows comparing two fields on the same model.",
      realExample: "Incrementing a view counter: using Python (article.views += 1; article.save()) reads the value, increments in Python, and writes back. In concurrent environments, two requests can both read 100, both compute 101, and write 101 — losing one increment. F('views') + 1 does the increment in the database atomically.",
      codeExample: `from django.db.models import F
from myapp.models import Article, Product, OrderItem

# ---- ATOMIC INCREMENT (race-condition safe) ----
# BAD: read-modify-write (race condition)
article = Article.objects.get(pk=1)
article.views += 1          # Read 100 in Python, add 1
article.save()              # Write 101 — but another request may have also incremented!

# GOOD: F expression — UPDATE in a single SQL statement
Article.objects.filter(pk=1).update(views=F('views') + 1)
# SQL: UPDATE article SET views = views + 1 WHERE id = 1
# No race condition — atomic at DB level

# ---- ARITHMETIC WITH F ----
# Apply 10% discount to all products in a category
Product.objects.filter(category__name='Electronics').update(
    price=F('price') * 0.9
)
# SQL: UPDATE product SET price = price * 0.9 WHERE ...

# Increase stock by order quantity
OrderItem.objects.filter(status='returned').update(
    product__stock=F('product__stock') + F('quantity')
)

# ---- COMPARING TWO FIELDS ON SAME MODEL ----
# Products where sale_price is less than cost_price (losing money)
Product.objects.filter(sale_price__lt=F('cost_price'))
# SQL: WHERE sale_price < cost_price

# Articles where views > comments count
Article.objects.filter(views__gt=F('comment_count'))

# ---- F IN ANNOTATIONS ----
from django.db.models import ExpressionWrapper, DecimalField
Product.objects.annotate(
    profit=ExpressionWrapper(
        F('sale_price') - F('cost_price'),
        output_field=DecimalField()
    )
)

# ---- F IN ORDERING ----
from django.db.models import F
Product.objects.order_by(F('stock').asc(nulls_last=True))

# ---- REFRESH AFTER F UPDATE ----
article = Article.objects.get(pk=1)
Article.objects.filter(pk=article.pk).update(views=F('views') + 1)
# article.views is still the old value in Python!
article.refresh_from_db()  # Re-fetch from DB to get updated value
print(article.views)       # Now shows the incremented value`,
      outputExplanation: "F expressions delegate computation to the database. The Python code never sees the field value — it builds an SQL expression. This is atomic and race-condition-free. After updating via F expressions on a fetched instance, call refresh_from_db() to sync the Python object.",
      commonMistakes: [
        "Using F expression then accessing the field on the Python object without refresh_from_db() — the Python object still holds the old value.",
        "Chaining multiple F arithmetic in one expression without ExpressionWrapper — complex expressions may need output_field specified.",
        "Using F for one-off manual increments instead of implementing proper transaction logic for complex multi-field operations."
      ],
      interviewNotes: [
        "F expressions are SQL-level — computation happens in the database, not Python.",
        "F('field') + 1 in update() is atomic — no race condition unlike Python read-modify-write.",
        "After update(field=F('field') + 1), the in-memory object is stale — call refresh_from_db().",
        "F expressions can compare two fields: filter(price__lt=F('cost')) — impossible with plain Python values.",
        "F expressions work in filter(), update(), annotate(), order_by(), and aggregate()."
      ],
      whenToUse: "Counter increments, view counts, stock adjustments, any field update where concurrent updates are possible. Comparing two columns on the same row.",
      whenNotToUse: "When you need the computed value in Python immediately — fetch the updated value with refresh_from_db() or use select_for_update() in a transaction."
    },
    tags: ["f-expressions", "atomic", "race-condition", "update", "queryset"],
    order: 13,
    estimatedMinutes: 10
  },
  {
    id: "aggregates",
    title: "Aggregates",
    slug: "aggregates",
    category: "queries",
    difficulty: "intermediate",
    description: "aggregate() with Sum, Count, Avg, Min, Max — returning a single dictionary of computed values.",
    content: {
      explanation: "aggregate() applies aggregate functions (SUM, COUNT, AVG, MIN, MAX) across an entire QuerySet and returns a single dictionary. It adds a SQL aggregate function over all rows matching the queryset filters.",
      realExample: "A dashboard shows total revenue, number of orders, average order value, and the most expensive product. All four are aggregations computed in the database.",
      codeExample: `from django.db.models import Sum, Count, Avg, Min, Max, StdDev, Variance
from myapp.models import Order, Product

# Single aggregate
total = Order.objects.aggregate(total_revenue=Sum('total'))
# {'total_revenue': Decimal('152340.50')}

# Multiple aggregates in one query
stats = Order.objects.filter(status='completed').aggregate(
    total_revenue=Sum('total'),
    order_count=Count('id'),
    avg_order=Avg('total'),
    min_order=Min('total'),
    max_order=Max('total'),
)
# {
#   'total_revenue': Decimal('152340.50'),
#   'order_count': 1423,
#   'avg_order': Decimal('107.05'),
#   'min_order': Decimal('9.99'),
#   'max_order': Decimal('2499.00')
# }
# ONE SQL query with multiple aggregate functions

# Count with distinct
unique_customers = Order.objects.aggregate(
    unique_buyers=Count('customer', distinct=True)
)

# Aggregate on related field
Product.objects.aggregate(
    total_stock_value=Sum(F('price') * F('stock'))
)

from django.db.models import F, ExpressionWrapper, DecimalField
Product.objects.aggregate(
    total_inventory_value=Sum(
        ExpressionWrapper(F('price') * F('stock'), output_field=DecimalField())
    )
)

# Conditional aggregation (Django 2.0+)
from django.db.models import Q
Order.objects.aggregate(
    total=Count('id'),
    completed=Count('id', filter=Q(status='completed')),
    pending=Count('id', filter=Q(status='pending')),
    revenue=Sum('total', filter=Q(status='completed'))
)

# StdDev and Variance
Product.objects.aggregate(
    price_stddev=StdDev('price'),
    price_variance=Variance('price')
)

# Aggregate returns None when no rows match — handle it
result = Order.objects.filter(status='nonexistent').aggregate(total=Sum('total'))
total = result['total'] or 0  # None if no rows`,
      outputExplanation: "aggregate() always returns a Python dict, not a QuerySet. The dict keys are the named aliases you provide. If the QuerySet is empty, aggregate functions return None (not 0) — always provide a default.",
      commonMistakes: [
        "Forgetting to name aggregates — Count('id') without alias generates a key 'id__count'.",
        "Not handling None from aggregate on empty queryset — Sum returns None, not 0.",
        "Using aggregate() when annotate() is needed — aggregate() returns ONE dict for the whole queryset; annotate() adds values per row."
      ],
      interviewNotes: [
        "aggregate() returns a single dict — one value for the whole QuerySet.",
        "annotate() returns per-row values — use for per-object aggregation.",
        "Count with distinct=True avoids counting duplicates from JOINs.",
        "Conditional aggregation (Count('id', filter=Q(...))) maps to SQL FILTER (WHERE ...) clause.",
        "Aggregate on empty QuerySet returns None — use (result['key'] or 0) defensively."
      ],
      whenToUse: "Dashboard statistics, report totals, single-value computations across a QuerySet. Always prefer aggregate() over fetching rows and computing in Python.",
      whenNotToUse: "When you need per-row computed values — use annotate() instead."
    },
    tags: ["aggregate", "sum", "count", "avg", "min", "max", "queryset"],
    order: 14,
    estimatedMinutes: 10
  },
  {
    id: "annotate",
    title: "annotate()",
    slug: "annotate",
    category: "queries",
    difficulty: "intermediate",
    description: "Adding per-object computed values with annotate(), combining with aggregate, and filtering on annotations.",
    content: {
      explanation: "annotate() adds a computed column to each object in the QuerySet. It performs a GROUP BY on the model's fields and computes an aggregate or expression for each group. The result is a QuerySet of model instances (or dicts with values()) with extra attributes.",
      realExample: "A product listing showing each product with its total number of reviews and average rating. An author list showing each author with their published article count.",
      codeExample: `from django.db.models import Count, Avg, Sum, Max, F, Q, Value
from django.db.models.functions import Concat
from myapp.models import Author, Article, Product, Review

# ---- BASIC ANNOTATE ----
# Add review count to each product
products = Product.objects.annotate(
    review_count=Count('review'),
    avg_rating=Avg('review__rating')
)
# Each product now has .review_count and .avg_rating
for p in products:
    print(f"{p.name}: {p.review_count} reviews, {p.avg_rating:.1f} avg")

# ---- FILTER AFTER ANNOTATE ----
# Products with more than 10 reviews AND avg rating >= 4
popular_products = Product.objects.annotate(
    review_count=Count('review'),
    avg_rating=Avg('review__rating')
).filter(
    review_count__gt=10,
    avg_rating__gte=4.0
)

# ---- ANNOTATE WITH CONDITION ----
from django.db.models import Case, When, IntegerField
products = Product.objects.annotate(
    five_star_count=Count('review', filter=Q(review__rating=5)),
    one_star_count=Count('review', filter=Q(review__rating=1)),
)

# ---- ANNOTATE VS AGGREGATE ----
# annotate() — per product
Product.objects.annotate(review_count=Count('review'))
# [{product1, review_count: 5}, {product2, review_count: 2}, ...]

# aggregate() — over all products
Product.objects.aggregate(total_reviews=Count('review'))
# {'total_reviews': 7}  — ONE value for the whole queryset

# ---- ORDER BY ANNOTATION ----
Product.objects.annotate(
    review_count=Count('review')
).order_by('-review_count')

# ---- ANNOTATE WITH F EXPRESSION ----
Product.objects.annotate(
    profit_margin=ExpressionWrapper(
        (F('sale_price') - F('cost_price')) / F('sale_price') * 100,
        output_field=DecimalField(max_digits=5, decimal_places=2)
    )
)

# ---- ANNOTATE WITH SUBQUERY ----
from django.db.models import OuterRef, Subquery
latest_review = Review.objects.filter(
    product=OuterRef('pk')
).order_by('-created_at').values('rating')[:1]

Product.objects.annotate(latest_rating=Subquery(latest_review))

# ---- GROUP BY WITH values() ----
# Count articles per status
Article.objects.values('status').annotate(count=Count('id'))
# [{'status': 'published', 'count': 45}, {'status': 'draft', 'count': 12}]
# SQL: SELECT status, COUNT(id) FROM article GROUP BY status`,
      outputExplanation: "annotate() adds SQL expressions to each row's SELECT. Each annotated object has the computed value as a Python attribute. Filtering after annotate() generates a HAVING clause (for aggregate annotations) or a WHERE on derived columns.",
      commonMistakes: [
        "Filtering BEFORE annotate() on the annotation value — you must filter AFTER annotate().",
        "Expecting annotate() to return a dict like aggregate() — it returns model instances with extra attributes.",
        "Using Count without distinct=True when filtering through M2M — may count the same related objects multiple times."
      ],
      interviewNotes: [
        "annotate() adds per-object computed values; aggregate() returns one value for the whole QuerySet.",
        "values('field').annotate() groups by 'field' — equivalent to GROUP BY.",
        "Filtering on annotation values after annotate() generates SQL HAVING for aggregate annotations.",
        "Count('related', filter=Q(related__field=val)) is conditional aggregation — counts only matching related rows.",
        "Annotated values are available as Python attributes: product.review_count"
      ],
      whenToUse: "Per-object computed values: counts, sums, averages of related data. Especially powerful for list views showing aggregate stats per item.",
      whenNotToUse: "When you need a single value for the whole queryset — use aggregate(). When the computation is too complex for SQL — compute in Python after fetching."
    },
    tags: ["annotate", "count", "avg", "group-by", "queryset"],
    order: 15,
    estimatedMinutes: 12
  },
  {
    id: "related-queries",
    title: "Related Field Queries",
    slug: "related-queries",
    category: "queries",
    difficulty: "intermediate",
    description: "Traversing ForeignKey, reverse FK, and M2M relationships in filter() using __ notation.",
    content: {
      explanation: "Django's __ (double underscore) notation lets you traverse model relationships in filter() calls. Django automatically generates the necessary JOINs. You can follow FK forward, traverse reverse FK relations, and cross M2M junctions — all in a single filter() call.",
      realExample: "Find all orders from customers in New York. Find all products that have a review with rating 5. Find all articles tagged with 'python' written by staff authors.",
      codeExample: `from myapp.models import Order, Product, Article, Customer

# ---- FORWARD FK LOOKUP (many-to-one) ----
# Orders placed by customer named 'Alice'
Order.objects.filter(customer__name='Alice')
# SQL: SELECT ... FROM order JOIN customer ON ... WHERE customer.name='Alice'

# Multi-level FK traversal
Order.objects.filter(customer__city__country__name='USA')

# ---- REVERSE FK LOOKUP (one-to-many) ----
# Customers who have placed an order over $500
Customer.objects.filter(order__total__gte=500)
# Customers appear multiple times if they have multiple qualifying orders
Customer.objects.filter(order__total__gte=500).distinct()

# Customers who have at least one order in 2024
from django.utils import timezone
Customer.objects.filter(
    order__created_at__year=2024
).distinct()

# ---- M2M LOOKUP ----
# Articles tagged with 'python'
Article.objects.filter(tags__name='python')

# Articles tagged with ALL of these tags — requires separate filter() chain
Article.objects.filter(tags__name='python').filter(tags__name='django')

# Articles tagged with ANY of these tags
Article.objects.filter(tags__name__in=['python', 'django']).distinct()

# ---- ISNULL ACROSS RELATIONS ----
# Orders with no items (empty orders)
Order.objects.filter(orderitem__isnull=True)

# Customers with no orders
Customer.objects.filter(order__isnull=True)

# ---- NESTED REVERSE + FORWARD ----
# Authors who have published articles with 5-star reviews
from myapp.models import Author
Author.objects.filter(
    article__status='published',
    article__review__rating=5
).distinct()

# ---- EXCLUDING BASED ON RELATION ----
# Products with NO five-star reviews
Product.objects.exclude(review__rating=5)
# Note: this also excludes products with NO reviews at all
# To exclude only those WITH reviews but none 5-star, use:
Product.objects.filter(review__isnull=False).exclude(review__rating=5).distinct()`,
      outputExplanation: "Each __ traversal is a SQL JOIN. Django generates the JOIN automatically. Filtering through one-to-many relations (reverse FK, M2M) can produce duplicate rows — use distinct() to deduplicate.",
      commonMistakes: [
        "Forgetting distinct() when filtering through reverse FK or M2M — duplicates from JOINs.",
        "Expecting filter(tag__name='a').filter(tag__name='b') to find items with BOTH tags — it does work (each filter adds a separate JOIN), but this creates duplicate rows. Use distinct().",
        "Using exclude() on reverse relations — exclude(review__rating=5) excludes any product that has even one 5-star review, not products whose ALL reviews are 5-star."
      ],
      interviewNotes: [
        "Each __ traversal is a SQL JOIN — deep traversal joins many tables.",
        "Filtering through one-to-many (reverse FK or M2M) produces one row per matching related row — use distinct().",
        "filter(tag__name='a').filter(tag__name='b') = separate JOINs = AND for different rows.",
        "filter(tag__name='a', tag__name='b') won't work — duplicate kwarg. Use chained filter() calls.",
        "__isnull=True on a reverse relation finds objects with NO related objects."
      ],
      whenToUse: "Whenever you need to filter on related model fields — the __ syntax is more efficient than Python-level filtering.",
      whenNotToUse: "Avoid deeply nested __ traversal (5+ levels) — each level is a JOIN. Consider denormalization or restructuring the query."
    },
    tags: ["related-queries", "foreignkey", "m2m", "join", "queryset"],
    order: 16,
    estimatedMinutes: 12
  },
  {
    id: "select-related",
    title: "select_related()",
    slug: "select-related",
    category: "queries",
    difficulty: "intermediate",
    description: "Solving N+1 queries for FK and O2O relations with select_related() via SQL JOIN.",
    content: {
      explanation: "select_related() fetches related objects in the same SQL query using JOIN. It works with ForeignKey and OneToOneField. Without it, accessing a related object on each instance triggers a separate query — the N+1 problem.",
      realExample: "A list of 100 blog posts displaying each post's author name: without select_related(), accessing post.author.name triggers 100 extra queries. With select_related('author'), Django does one JOIN query and fetches all authors at once.",
      codeExample: `from myapp.models import Article, Order, OrderItem

# ---- N+1 PROBLEM ----
articles = Article.objects.all()   # 1 query
for article in articles:
    print(article.author.name)     # N queries — one per article
# Total: 1 + N queries (N+1 problem)

# ---- SOLUTION: select_related() ----
articles = Article.objects.select_related('author')  # 1 JOIN query
for article in articles:
    print(article.author.name)  # No extra query — already fetched
# Total: 1 query

# SQL generated:
# SELECT article.*, author.*
# FROM article
# INNER JOIN author ON article.author_id = author.id

# ---- MULTIPLE RELATED FIELDS ----
articles = Article.objects.select_related('author', 'category', 'editor')

# ---- NESTED TRAVERSAL ----
articles = Article.objects.select_related('author__profile')
# JOIN article -> author -> user_profile
for article in articles:
    print(article.author.profile.bio)  # No extra queries

# ---- select_related() on queryset ----
articles = Article.objects.filter(
    status='published'
).select_related('author').order_by('-created_at')[:20]

# ---- ALL RELATED (depth=1) ----
articles = Article.objects.select_related()  # Fetches ALL FK relations (one level deep)
# Caution: may JOIN many tables unexpectedly

# ---- ONLY WORKS WITH FK AND O2O ----
# select_related() does NOT work with ManyToManyField
# For M2M use prefetch_related()

# ---- CHECKING QUERIES WITH DJANGO DEBUG TOOLBAR ----
# Or check via connection.queries:
from django.db import connection, reset_queries
reset_queries()
articles = list(Article.objects.select_related('author'))
print(len(connection.queries))  # Should be 1`,
      outputExplanation: "select_related() generates a single SQL JOIN query. All related objects are fetched in one round-trip. It only works with ForeignKey and OneToOneField (single-row relations). For ManyToMany or reverse FK, use prefetch_related().",
      commonMistakes: [
        "Using select_related() for ManyToManyField — it doesn't work; use prefetch_related().",
        "Using select_related() with no arguments on models with many FKs — it JOINs all FK relations, potentially creating a very wide and slow query.",
        "Forgetting select_related() in serializers (DRF) — DRF accesses related objects in each row, causing N+1."
      ],
      interviewNotes: [
        "select_related() uses SQL JOIN — one query total.",
        "Works only with ForeignKey and OneToOneField (not M2M or reverse FK).",
        "select_related('a__b') joins through two levels: model -> a -> b.",
        "select_related() with no args fetches all FK relations at depth 1 — use with care.",
        "The N+1 problem: 1 query for the list + N queries for related objects. select_related() solves it with 1 JOIN query."
      ],
      whenToUse: "Whenever you'll access a ForeignKey or O2O related object on each instance in a loop or template. Always add select_related in serializers that access related data.",
      whenNotToUse: "Do not use for M2M or reverse FK — use prefetch_related(). Avoid select_related() with no args on models with many FKs."
    },
    tags: ["select_related", "n+1", "join", "performance", "queryset"],
    order: 17,
    estimatedMinutes: 12
  },
  {
    id: "prefetch-related",
    title: "prefetch_related()",
    slug: "prefetch-related",
    category: "queries",
    difficulty: "intermediate",
    description: "Solving N+1 for M2M and reverse FK with prefetch_related(), the Prefetch object, and to_attr.",
    content: {
      explanation: "prefetch_related() fetches related objects in separate queries (not JOINs) and joins them in Python. It works with ManyToManyField and reverse FK relations. A custom Prefetch object lets you filter, order, or rename the prefetched queryset.",
      realExample: "A product page listing all products with their tags. Without prefetch_related, accessing product.tags.all() in a loop triggers N queries. With prefetch_related('tags'), Django fetches all tags in one query and maps them to products in Python.",
      codeExample: `from django.db.models import Prefetch
from myapp.models import Product, Tag, Review, Article

# ---- N+1 WITH M2M ----
products = Product.objects.all()   # 1 query
for p in products:
    tags = p.tags.all()            # N queries — one per product
# Total: 1 + N queries

# ---- SOLUTION: prefetch_related() ----
products = Product.objects.prefetch_related('tags')  # 2 queries total
# Query 1: SELECT * FROM product
# Query 2: SELECT tag.* FROM tag JOIN product_tags ON ... WHERE product_id IN (1,2,3,...)
for p in products:
    tags = p.tags.all()  # No extra query — uses prefetch cache

# ---- REVERSE FK ----
# Articles with all their comments prefetched
articles = Article.objects.prefetch_related('comment_set')
for article in articles:
    for comment in article.comment_set.all():  # No extra query
        print(comment.text)

# With related_name:
articles = Article.objects.prefetch_related('comments')  # if related_name='comments'

# ---- COMBINING SELECT_RELATED AND PREFETCH_RELATED ----
articles = Article.objects.select_related('author').prefetch_related('tags', 'comments')
# 3 queries: articles+authors (JOIN), tags, comments

# ---- CUSTOM PREFETCH OBJECT ----
# Only prefetch approved reviews, ordered by date
approved_reviews = Prefetch(
    'review_set',
    queryset=Review.objects.filter(approved=True).order_by('-created_at'),
    to_attr='approved_reviews'  # Store result on .approved_reviews instead of .review_set
)
products = Product.objects.prefetch_related(approved_reviews)
for p in products:
    print(p.approved_reviews)  # List (not Manager) of approved reviews

# ---- NESTED PREFETCH ----
articles = Article.objects.prefetch_related(
    Prefetch('comments', queryset=Comment.objects.select_related('author'))
)
# 3 queries: articles, comments+authors (JOIN)

# ---- FILTERING AFTER PREFETCH (danger!) ----
products = Product.objects.prefetch_related('tags')
# This REUSES the prefetch cache:
for p in products:
    p.tags.all()  # Uses cache — no query
    p.tags.filter(name='sale')  # NEW QUERY — breaks the cache!
# To avoid: use to_attr with a filtered Prefetch object`,
      outputExplanation: "prefetch_related() runs a separate SQL query per prefetch (not a JOIN) and assembles results in Python. Custom Prefetch objects let you filter, order, or annotate the prefetched queryset. Filtering on the prefetched relation after retrieval (p.tags.filter(...)) bypasses the cache and triggers new queries.",
      commonMistakes: [
        "Using prefetch_related() then filtering the relation in Python (p.tags.filter(...)) — this creates a new query and breaks the prefetch.",
        "Using select_related() for M2M — it silently fails or creates wrong results. Use prefetch_related() for M2M.",
        "Not using to_attr when you need a filtered subset — without it, the default manager accessor ignores your prefetch filter."
      ],
      interviewNotes: [
        "prefetch_related() = separate queries + Python join. select_related() = SQL JOIN.",
        "Works with M2M and reverse FK. select_related() works with FK and O2O.",
        "Prefetch(queryset=...) lets you filter/order the prefetched queryset.",
        "to_attr stores results as a plain list attribute — use when you need a filtered prefetch.",
        "Calling .filter() on a prefetched relation creates a new DB query — use Prefetch with to_attr instead."
      ],
      whenToUse: "Whenever iterating over M2M or reverse FK relations on multiple objects. Always use in list views that display related data.",
      whenNotToUse: "When you only need related data for one or two objects — a direct query is simpler. For FK/O2O use select_related() instead."
    },
    tags: ["prefetch_related", "prefetch", "m2m", "n+1", "performance", "queryset"],
    order: 18,
    estimatedMinutes: 12
  },
  {
    id: "only-defer",
    title: "only() and defer()",
    slug: "only-defer",
    category: "queries",
    difficulty: "intermediate",
    description: "Fetching a subset of fields for performance with only() and defer(), and the cost of accessing deferred fields.",
    content: {
      explanation: "only() specifies exactly which fields to load. defer() specifies which fields to skip. Both return model instances (unlike values()), but deferred fields are loaded lazily — accessing one fires an additional query per object.",
      realExample: "A list view showing 1000 article titles and dates doesn't need to load the body (potentially megabytes of text). Using only('title', 'created_at') avoids fetching the body column.",
      codeExample: `from myapp.models import Article, Product

# ---- only() — fetch ONLY these fields ----
articles = Article.objects.only('id', 'title', 'created_at')
# SELECT id, title, created_at FROM article (body NOT included)

for article in articles:
    print(article.title)      # No extra query — field was fetched
    print(article.created_at) # No extra query
    print(article.body)       # TRIGGERS extra query per article! (N+1)

# ---- defer() — fetch EVERYTHING EXCEPT these fields ----
articles = Article.objects.defer('body', 'raw_content')
# SELECT id, title, status, created_at, author_id, ... FROM article
# (body and raw_content are excluded)

for article in articles:
    print(article.title)   # No extra query
    print(article.body)    # TRIGGERS extra query — deferred field accessed

# ---- COMBINING WITH select_related ----
articles = Article.objects.only('id', 'title', 'author__name').select_related('author')
# Only fetches specified fields from both article and author tables

# ---- SAFE USAGE — never access deferred fields in loops ----
# PATTERN: know exactly which fields you need
article_summaries = Article.objects.only(
    'id', 'title', 'slug', 'created_at'
).filter(status='published').order_by('-created_at')[:20]

for article in article_summaries:
    print(article.title)   # Safe — fetched
    # DON'T access article.body here

# ---- only() vs values() comparison ----
# only() — returns model instances (has model methods, __str__, etc.)
articles = Article.objects.only('title')
print(articles[0].get_absolute_url())  # Model method works

# values() — returns dicts (no model methods)
articles = Article.objects.values('title')
# articles[0].get_absolute_url()  # AttributeError — dict has no methods

# ---- CHAINING ----
Article.objects.only('title').defer('title')  # Same as .only() with nothing = all fields
Article.objects.defer('body').only('title')   # only('title') wins — starts fresh`,
      outputExplanation: "only() and defer() return model instances with some fields deferred. Accessing a deferred field fires a SELECT for just that field — one extra query per object. This is the key gotcha: only() can cause its own N+1 if deferred fields are accessed in loops.",
      commonMistakes: [
        "Accessing a deferred field in a template loop — triggers N extra queries. Audit templates to ensure only pre-fetched fields are accessed.",
        "Using defer() for fields used in ordering or filtering — if you defer a field and then filter on it, Django may not include it in the SELECT.",
        "Assuming only() makes queries faster without profiling — if the excluded field is small, the savings may not be worth the complexity."
      ],
      interviewNotes: [
        "only() fetches specified fields; accessing others fires extra queries.",
        "defer() skips specified fields; accessing them fires extra queries.",
        "Both return model instances — unlike values() which returns dicts.",
        "Use django-debug-toolbar to detect accidental deferred field access in loops.",
        "Prefer only() when you know exactly what you need; prefer values() when you don't need model methods."
      ],
      whenToUse: "Large models with text/binary fields (body, description, image_data) that aren't needed in list views. Use only() for list APIs returning lightweight summaries.",
      whenNotToUse: "If you're unsure which fields will be accessed — use select_related/prefetch_related instead. Deferred field access in loops is worse than fetching all fields."
    },
    tags: ["only", "defer", "performance", "fields", "queryset"],
    order: 19,
    estimatedMinutes: 10
  },
  {
    id: "subquery-outerref",
    title: "Subquery and OuterRef",
    slug: "subquery-outerref",
    category: "queries",
    difficulty: "advanced",
    description: "Correlated subqueries with Subquery and OuterRef for annotating with values from related models.",
    content: {
      explanation: "Subquery lets you embed a QuerySet as a subquery in SQL. OuterRef references a field in the outer query from within a subquery — creating a correlated subquery. This is used to annotate each row with a value derived from a related model.",
      realExample: "Annotate each product with the date of its most recent review. Annotate each customer with their highest order total. These require a correlated subquery — for each product, find the MAX date among its reviews.",
      codeExample: `from django.db.models import OuterRef, Subquery, Max, F
from myapp.models import Product, Review, Order, Customer

# ---- BASIC SUBQUERY ----
# Annotate each product with its latest review rating
latest_review = Review.objects.filter(
    product=OuterRef('pk')         # OuterRef refers to Product.pk in outer query
).order_by('-created_at').values('rating')[:1]  # Must return a single value

products = Product.objects.annotate(
    latest_rating=Subquery(latest_review)
)
for p in products:
    print(f"{p.name}: latest rating = {p.latest_rating}")

# SQL generated:
# SELECT product.*, (
#   SELECT review.rating FROM review
#   WHERE review.product_id = product.id
#   ORDER BY review.created_at DESC
#   LIMIT 1
# ) AS latest_rating
# FROM product

# ---- SUBQUERY IN FILTER ----
# Products that have at least one 5-star review in the last month
from django.utils import timezone
from datetime import timedelta
recent_five_star = Review.objects.filter(
    product=OuterRef('pk'),
    rating=5,
    created_at__gte=timezone.now() - timedelta(days=30)
).values('pk')[:1]

products = Product.objects.filter(
    Exists(recent_five_star)
)

# ---- ANNOTATE WITH LATEST RELATED FIELD ----
# Customers annotated with their last order date
from myapp.models import Customer
last_order = Order.objects.filter(
    customer=OuterRef('pk')
).order_by('-created_at').values('created_at')[:1]

customers = Customer.objects.annotate(
    last_order_date=Subquery(last_order)
)

# ---- SUBQUERY RETURNING AGGREGATE ----
from django.db.models import Sum
# Annotate each customer with total spending
order_total = Order.objects.filter(
    customer=OuterRef('pk'),
    status='completed'
).values('customer').annotate(total=Sum('total')).values('total')[:1]

customers = Customer.objects.annotate(
    total_spent=Subquery(order_total)
)

# ---- NESTED OUTERREF (Django 3.0+) ----
# Deeply nested correlated subquery
inner = SomeModel.objects.filter(
    outer_field=OuterRef(OuterRef('pk'))
)`,
      outputExplanation: "Subquery must return exactly one column and zero or one rows — use .values('single_field')[:1]. OuterRef('pk') creates the correlation — it's evaluated once per outer row. This is a correlated subquery in SQL: potentially slow on large tables, so use Exists() when you only need boolean results.",
      commonMistakes: [
        "Subquery returning more than one column or more than one row — use .values('field')[:1].",
        "Forgetting [:1] on the subquery — without it, Django raises an error if more than one row is returned.",
        "Using Subquery when Exists() suffices — Exists() is more efficient for existence checks."
      ],
      interviewNotes: [
        "Subquery must return one column (.values('field')) and at most one row ([:1]).",
        "OuterRef('pk') references the outer queryset's pk for each row.",
        "Correlated subqueries run once per outer row — can be slow. Use Exists() for boolean checks.",
        "Django 3.0+ supports OuterRef(OuterRef('field')) for nested correlated subqueries.",
        "Combine Subquery with annotate() to add a per-row value from a related model."
      ],
      whenToUse: "When you need to annotate each object with a derived value from a related model (latest, first, aggregate) and a JOIN would produce duplicates.",
      whenNotToUse: "For simple existence checks — use Exists() which generates more efficient SQL. For counts/sums — prefer annotate(Count/Sum) which uses GROUP BY instead."
    },
    tags: ["subquery", "outerref", "correlated", "advanced", "queryset"],
    order: 20,
    estimatedMinutes: 15
  },
  {
    id: "exists-expression",
    title: "Exists() Expression",
    slug: "exists-expression",
    category: "queries",
    difficulty: "advanced",
    description: "Using Exists() as a filter or annotation for efficient boolean existence checks.",
    content: {
      explanation: "Exists() is a Subquery subclass that returns True/False based on whether any rows exist in the subquery. It generates SQL EXISTS (...) which is highly optimized — the database stops scanning as soon as it finds the first matching row. More efficient than annotating with Count or filtering with __isnull.",
      realExample: "Filter products that have at least one approved review. Annotate articles with a boolean has_comments field. These are perfect for Exists().",
      codeExample: `from django.db.models import Exists, OuterRef
from myapp.models import Product, Review, Article, Comment

# ---- FILTER WITH EXISTS ----
# Products that have at least one approved review
approved_reviews = Review.objects.filter(
    product=OuterRef('pk'),
    approved=True
)
products_with_reviews = Product.objects.filter(
    Exists(approved_reviews)
)
# SQL: SELECT ... FROM product WHERE EXISTS (
#   SELECT 1 FROM review WHERE review.product_id = product.id AND review.approved = TRUE
# )

# ---- FILTER WITH NOT EXISTS ----
# Products with NO reviews
products_without_reviews = Product.objects.filter(
    ~Exists(approved_reviews)
)

# ---- ANNOTATE WITH EXISTS (boolean field) ----
# Add a has_reviews boolean to each product
products = Product.objects.annotate(
    has_reviews=Exists(
        Review.objects.filter(product=OuterRef('pk'))
    )
)
for p in products:
    print(f"{p.name}: has_reviews={p.has_reviews}")  # True or False

# ---- COMPARING Exists() vs alternatives ----

# 1. Using filter + __isnull (requires JOIN + distinct)
Product.objects.filter(review__isnull=False).distinct()  # Less efficient

# 2. Using Count annotation (counts ALL matching rows)
from django.db.models import Count
Product.objects.annotate(rc=Count('review')).filter(rc__gt=0)  # Counts all

# 3. Using Exists (stops at first match — most efficient)
Product.objects.filter(Exists(Review.objects.filter(product=OuterRef('pk'))))

# ---- COMPLEX EXISTS ----
# Articles that have comments from premium users
premium_comments = Comment.objects.filter(
    article=OuterRef('pk'),
    author__profile__is_premium=True
)
articles = Article.objects.filter(Exists(premium_comments))

# ---- EXISTS IN CONDITIONAL ----
from django.db.models import Case, When, BooleanField, Value
Article.objects.annotate(
    has_five_star=Exists(
        Review.objects.filter(article=OuterRef('pk'), rating=5)
    )
).filter(has_five_star=True)`,
      outputExplanation: "Exists() generates SQL EXISTS (...) which is short-circuit: the DB stops after finding the first matching row. This is more efficient than COUNT or JOIN-based approaches for boolean existence checks.",
      commonMistakes: [
        "Confusing Exists() expression with QuerySet.exists() method — Exists() is used inside filter()/annotate(); .exists() is called on a QuerySet to get a boolean in Python.",
        "Not using OuterRef inside the Exists subquery — without it, the subquery is not correlated and returns the same value for all rows.",
        "Using Count() annotation when Exists() suffices — COUNT scans all matching rows; EXISTS stops at the first."
      ],
      interviewNotes: [
        "Exists() = SQL EXISTS (...) — stops at first match, very efficient.",
        "~Exists() = SQL NOT EXISTS — finds objects with no matching related rows.",
        "Exists() vs .exists(): Exists() is an ORM expression for use in filter()/annotate(). .exists() is a Python method returning bool.",
        "Always use OuterRef() inside the Exists subquery to correlate with the outer row.",
        "Annotating with Exists() adds a boolean attribute to each model instance."
      ],
      whenToUse: "Boolean existence checks: 'has at least one X', 'has no X'. More efficient than COUNT-based approaches.",
      whenNotToUse: "When you need the actual count or values of related objects — use Count() or Subquery()."
    },
    tags: ["exists", "subquery", "outerref", "performance", "queryset"],
    order: 21,
    estimatedMinutes: 10
  },
  {
    id: "case-when",
    title: "Case/When Expressions",
    slug: "case-when",
    category: "queries",
    difficulty: "advanced",
    description: "Conditional annotations and updates using Case and When — the SQL CASE WHEN equivalent.",
    content: {
      explanation: "Case/When lets you add conditional logic to SQL queries. Case contains multiple When conditions evaluated in order — the first matching When's result is used. If no When matches, the default value is used. Works in annotate(), filter(), update(), and order_by().",
      realExample: "Annotate each order with a human-readable 'tier' based on total value. Update discount percentages based on stock levels. Order results with a priority-based sort.",
      codeExample: `from django.db.models import Case, When, Value, IntegerField, CharField, DecimalField, F
from myapp.models import Order, Product

# ---- BASIC CASE/WHEN ----
# Annotate orders with a tier label
from django.db.models.functions import Cast
orders = Order.objects.annotate(
    tier=Case(
        When(total__gte=1000, then=Value('platinum')),
        When(total__gte=500, then=Value('gold')),
        When(total__gte=100, then=Value('silver')),
        default=Value('bronze'),
        output_field=CharField()
    )
)
for order in orders:
    print(f"Order #{order.pk}: {order.tier}")

# ---- CASE/WHEN WITH NUMERIC OUTPUT ----
products = Product.objects.annotate(
    discount_pct=Case(
        When(stock__lte=5, then=Value(30)),      # Clearance
        When(stock__lte=20, then=Value(15)),     # Low stock
        When(stock__gte=100, then=Value(5)),     # Overstocked
        default=Value(0),
        output_field=IntegerField()
    )
)

# ---- CONDITIONAL UPDATE ----
# Apply different discounts based on stock level
Product.objects.update(
    sale_price=Case(
        When(stock__lte=5, then=F('price') * 0.70),
        When(stock__lte=20, then=F('price') * 0.85),
        default=F('price'),
        output_field=DecimalField(max_digits=10, decimal_places=2)
    )
)

# ---- CONDITIONAL ORDERING ----
# Show active products first, then inactive
products = Product.objects.annotate(
    sort_order=Case(
        When(is_active=True, then=Value(0)),
        default=Value(1),
        output_field=IntegerField()
    )
).order_by('sort_order', 'name')

# ---- MULTIPLE CONDITIONS IN WHEN ----
orders = Order.objects.annotate(
    priority=Case(
        When(status='pending', total__gte=1000, then=Value(1)),   # AND condition
        When(status='pending', then=Value(2)),
        When(status='processing', then=Value(3)),
        default=Value(10),
        output_field=IntegerField()
    )
).order_by('priority')

# ---- CASE WITH Q OBJECTS ----
from django.db.models import Q
products = Product.objects.annotate(
    label=Case(
        When(Q(is_featured=True) | Q(views__gte=1000), then=Value('hot')),
        default=Value('normal'),
        output_field=CharField()
    )
)`,
      outputExplanation: "Case/When generates SQL CASE WHEN ... THEN ... ELSE ... END. Conditions in When() are ANDed. When() accepts Q objects for complex conditions. output_field is required to tell Django what Python type to use for the result.",
      commonMistakes: [
        "Forgetting output_field on Case — Django raises FieldError for ambiguous types.",
        "Order of When clauses matters — the first matching When is used. Put most specific conditions first.",
        "Using Case for simple ternary expressions — Case(When(active=True, then=1), default=0) works but Value(1) in annotate with filter is sometimes cleaner."
      ],
      interviewNotes: [
        "Case/When = SQL CASE WHEN ... THEN ... ELSE ... END.",
        "Conditions in When() are ANDed. Use Q objects for OR conditions.",
        "Order of When matters — first match wins.",
        "output_field is required — specifies the Python/DB type of the result.",
        "Case works in annotate(), update(), order_by(), and filter()."
      ],
      whenToUse: "Conditional annotations (tier labels, derived categories), conditional updates (applying different rules based on field values), and priority-based ordering.",
      whenNotToUse: "Simple boolean annotations — use Exists() or a direct filter. Complex multi-step logic — compute in Python after fetching data."
    },
    tags: ["case", "when", "conditional", "annotate", "queryset"],
    order: 22,
    estimatedMinutes: 12
  },
  {
    id: "union-intersection-difference",
    title: "union(), intersection(), difference()",
    slug: "union-intersection-difference",
    category: "queries",
    difficulty: "advanced",
    description: "Combining QuerySets with SQL UNION, INTERSECT, and EXCEPT operations.",
    content: {
      explanation: "Django supports SQL set operations: union() (UNION), intersection() (INTERSECT), and difference() (EXCEPT). All three require the querysets to have the same number of columns and compatible types. By default union() deduplicates — pass all=True for UNION ALL.",
      realExample: "Combine a list of featured products and on-sale products (union). Find products that are both featured AND have reviews (intersection). Get published articles excluding ones that have been reported (difference).",
      codeExample: `from myapp.models import Article, Product

# ---- UNION ----
published = Article.objects.filter(status='published')
featured = Article.objects.filter(is_featured=True)

# UNION — combines and deduplicates
combined = published.union(featured)
# SQL: SELECT ... FROM article WHERE status='published'
#      UNION
#      SELECT ... FROM article WHERE is_featured=TRUE

# UNION ALL — keeps duplicates
combined_all = published.union(featured, all=True)

# ---- INTERSECTION ----
# Articles that are BOTH published AND featured
both = published.intersection(featured)
# SQL: ... UNION ... INTERSECT ...

# ---- DIFFERENCE ----
# Published articles that are NOT featured
published_not_featured = published.difference(featured)
# SQL: SELECT ... FROM article WHERE status='published'
#      EXCEPT
#      SELECT ... FROM article WHERE is_featured=TRUE

# ---- LIMITATIONS ----
# After union/intersection/difference, you can ONLY use:
# .order_by(), .values(), .values_list(), .only(), .defer()
# You CANNOT use: .filter(), .exclude(), .annotate(), .select_related()

combined = published.union(featured)
combined.filter(title__icontains='django')  # Raises TypeError!

# Workaround: filter BEFORE combining
combined = (
    Article.objects.filter(status='published', title__icontains='django')
    .union(
        Article.objects.filter(is_featured=True, title__icontains='django')
    )
)

# ---- CROSS-MODEL UNION ----
# The querysets must return the same columns
from myapp.models import BlogPost, NewsArticle
posts = BlogPost.objects.values('title', 'created_at')
news = NewsArticle.objects.values('title', 'created_at')
combined = posts.union(news)

# ---- ORDERING COMBINED RESULTS ----
combined = published.union(featured).order_by('title')
# order_by() works on combined results`,
      outputExplanation: "Set operations work at the SQL level and require compatible column sets. The result is a QuerySet you can order or slice but not further filter. For complex OR conditions across the same model, Q objects are usually cleaner than union().",
      commonMistakes: [
        "Calling filter() on the result of union() — raises TypeError. Filter before combining.",
        "Using union() on querysets with different columns — the column count and types must match.",
        "Using intersection() on SQLite for Django < 4.2 — INTERSECT has limited support on older SQLite."
      ],
      interviewNotes: [
        "union(all=True) = UNION ALL (keeps duplicates). union() = UNION (deduplicates).",
        "Post-union operations limited to: order_by, values, values_list, only, defer.",
        "For complex OR on same model, Q objects are often cleaner than union().",
        "All querysets in a set operation must return the same number and type of columns.",
        "intersection() and difference() have limited support on MySQL — prefer PostgreSQL."
      ],
      whenToUse: "Combining results from different filter conditions into one ordered result set. Especially useful when combining queries across different models with the same column structure.",
      whenNotToUse: "For simple OR conditions on the same model — use Q objects. When you need to filter the combined result — filter first, then combine."
    },
    tags: ["union", "intersection", "difference", "set-operations", "queryset"],
    order: 23,
    estimatedMinutes: 10
  },
  {
    id: "transactions",
    title: "Transactions",
    slug: "transactions",
    category: "queries",
    difficulty: "advanced",
    description: "atomic(), on_commit(), select_for_update(), and savepoints for data integrity.",
    content: {
      explanation: "Transactions ensure database operations are atomic — either all succeed or all fail together. Django's atomic() context manager wraps operations in a transaction. select_for_update() locks selected rows until the transaction ends. on_commit() runs callbacks after the transaction successfully commits.",
      realExample: "A bank transfer: debit account A and credit account B must succeed or fail together. A flight booking: check seat availability and reserve it must be atomic — two users can't book the same seat simultaneously.",
      codeExample: `from django.db import transaction
from myapp.models import Account, Order, Product, Inventory

# ---- ATOMIC CONTEXT MANAGER ----
def transfer_funds(from_account_id, to_account_id, amount):
    with transaction.atomic():
        # All operations inside are in ONE transaction
        from_account = Account.objects.select_for_update().get(pk=from_account_id)
        to_account = Account.objects.select_for_update().get(pk=to_account_id)

        if from_account.balance < amount:
            raise ValueError("Insufficient funds")

        from_account.balance -= amount
        to_account.balance += amount
        from_account.save()
        to_account.save()
        # If any exception is raised, the whole transaction is rolled back

# ---- ATOMIC DECORATOR ----
@transaction.atomic
def create_order(customer, items):
    order = Order.objects.create(customer=customer)
    for item in items:
        product = Product.objects.select_for_update().get(pk=item['product_id'])
        if product.stock < item['quantity']:
            raise ValueError(f"Insufficient stock for {product.name}")
        product.stock -= item['quantity']
        product.save()
        order.items.create(product=product, quantity=item['quantity'])
    return order

# ---- SELECT FOR UPDATE — row locking ----
with transaction.atomic():
    # Lock these rows — other transactions must wait
    products = Product.objects.select_for_update().filter(stock__lt=10)
    for p in products:
        p.stock += 100
        p.save()

# skip_locked — skip rows already locked by other transactions
with transaction.atomic():
    product = Product.objects.select_for_update(skip_locked=True).filter(
        needs_reorder=True
    ).first()
    if product:
        product.trigger_reorder()

# ---- ON COMMIT — run after successful commit ----
def send_confirmation_email(order_id):
    # Celery task or direct email
    print(f"Sending confirmation for order {order_id}")

with transaction.atomic():
    order = Order.objects.create(customer=customer, total=100)
    # This runs ONLY if the transaction commits successfully
    # If rollback occurs, this callback is discarded
    transaction.on_commit(lambda: send_confirmation_email(order.pk))

# ---- SAVEPOINTS — nested atomic blocks ----
with transaction.atomic():  # Outer transaction
    order = Order.objects.create(customer=customer)
    try:
        with transaction.atomic():  # Savepoint
            # If this fails, only this inner block rolls back
            apply_discount(order)
    except Exception:
        pass  # Order still exists, discount failed silently
    order.finalize()`,
      outputExplanation: "atomic() creates a database transaction (or savepoint if nested). select_for_update() adds FOR UPDATE to the SELECT, locking rows until the transaction ends. on_commit() ensures callbacks (like emails or background tasks) only run after the transaction successfully commits — never on rollback.",
      commonMistakes: [
        "Sending emails or triggering side effects inside atomic() directly — if the transaction rolls back, the email was still sent. Use on_commit() instead.",
        "Not using select_for_update() when checking-then-modifying shared resources — creates race conditions.",
        "select_for_update() outside a transaction — raises TransactionManagementError."
      ],
      interviewNotes: [
        "atomic() wraps operations in a DB transaction — all or nothing.",
        "Nested atomic() blocks create savepoints — inner rollback doesn't affect outer transaction.",
        "select_for_update() locks rows with FOR UPDATE — prevents concurrent modification.",
        "on_commit() callbacks run only on successful commit — safe for emails, Celery tasks.",
        "Django wraps each view in an atomic transaction by default when ATOMIC_REQUESTS=True."
      ],
      whenToUse: "Any multi-step write operation that must succeed or fail together. select_for_update() when checking-then-updating shared state.",
      whenNotToUse: "Do not hold long transactions open (e.g. waiting for external API responses) — locks held during a transaction block other transactions."
    },
    tags: ["transactions", "atomic", "select_for_update", "on_commit", "queryset"],
    order: 24,
    estimatedMinutes: 15
  },
  {
    id: "performance-n-plus-1",
    title: "N+1 Problem and Performance",
    slug: "performance-n-plus-1",
    category: "queries",
    difficulty: "advanced",
    description: "Understanding N+1 queries, identifying them, fixing with select_related/prefetch_related, and using only()/defer() for large models.",
    content: {
      explanation: "The N+1 problem occurs when you fetch N objects and then make 1 additional query for each object (N more queries = N+1 total). This is the most common Django performance issue. It's caused by accessing related objects in a loop without prefetching them.",
      realExample: "An API endpoint listing 100 blog posts and their authors: without select_related, it's 1 query for posts + 100 queries for authors = 101 queries. With select_related, it's 1 JOIN query. At scale, this is the difference between a 50ms response and a 5000ms timeout.",
      codeExample: `from myapp.models import Article, Comment, Author
from django.db import connection, reset_queries

# ============================================================
# IDENTIFYING N+1 QUERIES
# ============================================================

# Method 1: Django's connection.queries
from django.conf import settings
settings.DEBUG = True  # Must be True to log queries

reset_queries()
articles = Article.objects.all()
for a in articles:
    _ = a.author.name  # N+1 here
print(f"Queries executed: {len(connection.queries)}")
# Output: Queries executed: 101 (1 + 100)

# Method 2: django-debug-toolbar (in browser)
# Shows SQL panel with all queries and their sources

# Method 3: nplusone library (test suite)
# from nplusone.core.autodetect import initialize
# initialize(warnings=True)

# ============================================================
# FIXING N+1 WITH select_related (FK / O2O)
# ============================================================

# BAD
articles = Article.objects.all()          # 1 query
for a in articles:
    print(a.author.name)                  # N queries

# GOOD
articles = Article.objects.select_related('author')  # 1 JOIN query
for a in articles:
    print(a.author.name)                  # 0 extra queries

# ============================================================
# FIXING N+1 WITH prefetch_related (M2M / reverse FK)
# ============================================================

# BAD
articles = Article.objects.all()          # 1 query
for a in articles:
    print(a.tags.all())                   # N queries (M2M)
    print(a.comments.count())             # N more queries

# GOOD
articles = Article.objects.prefetch_related('tags', 'comments')  # 3 queries total
for a in articles:
    print(a.tags.all())                   # 0 extra queries (cached)

# ============================================================
# REDUCING DATA FETCHED WITH only()
# ============================================================

# BAD — fetches 10 columns when only 2 are needed
articles = Article.objects.select_related('author')
for a in articles:
    print(a.title, a.author.name)  # body, raw_content, etc. fetched but unused

# GOOD
articles = Article.objects.only('title', 'author__name').select_related('author')
# Fetches only title from article and name from author

# ============================================================
# COMPLETE OPTIMIZED QUERY
# ============================================================

def get_article_list():
    return (
        Article.objects
        .filter(status='published')
        .select_related('author')                     # FK — 1 JOIN
        .prefetch_related(                            # M2M/reverse — 2 extra queries
            'tags',
            Prefetch('comments', queryset=Comment.objects.filter(approved=True))
        )
        .only('id', 'title', 'slug', 'created_at')   # Skip large text fields
        .order_by('-created_at')
    )
# Result: 3 total queries regardless of article count`,
      outputExplanation: "The N+1 problem scales linearly — 1000 articles = 1001 queries. select_related() collapses FK queries into 1 JOIN. prefetch_related() adds fixed 1-2 extra queries regardless of object count. only() reduces columns transferred per row.",
      commonMistakes: [
        "Adding select_related() but still triggering N+1 in a nested relation (e.g. a.author.profile.bio).",
        "Using prefetch_related() then calling .filter() on the prefetched relation in a loop — breaks the cache.",
        "Not profiling with DEBUG=True or django-debug-toolbar — guessing where N+1 occurs instead of measuring."
      ],
      interviewNotes: [
        "N+1: 1 query to get N objects + N queries to get each related object = N+1 total.",
        "select_related() = SQL JOIN (1 query). prefetch_related() = separate queries + Python join (2-3 queries).",
        "django-debug-toolbar shows all queries per request — essential for identifying N+1.",
        "only() reduces columns — good for models with large text or binary fields.",
        "Always test with realistic data volumes — N+1 is invisible with 5 rows, catastrophic with 5000."
      ],
      whenToUse: "Profile every list view and API endpoint that returns collections. Add select_related/prefetch_related aggressively — they rarely hurt and often save orders of magnitude in query count.",
      whenNotToUse: "Do not add select_related for every possible relation — only for fields actually accessed in the view/template. Use only() judiciously."
    },
    tags: ["n+1", "performance", "select_related", "prefetch_related", "only", "queryset"],
    order: 25,
    estimatedMinutes: 15
  }
];

export default queryTopics;

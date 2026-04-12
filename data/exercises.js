export const exercises = [
  // ============================================================
  // BEGINNER EXERCISES (1-15)
  // ============================================================
  {
    id: "ex-001",
    title: "Get All Books",
    difficulty: "beginner",
    topic: "all",
    category: "queries",
    description: "Retrieve every book from the database.",
    schema: `from django.db import models

class Author(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)

    def __str__(self):
        return self.name

class Book(models.Model):
    title = models.CharField(max_length=200)
    author = models.ForeignKey(Author, on_delete=models.CASCADE, related_name='books')
    price = models.DecimalField(max_digits=8, decimal_places=2)
    published_year = models.IntegerField()
    is_available = models.BooleanField(default=True)

    def __str__(self):
        return self.title`,
    sampleData: `Author.objects.create(name='J.K. Rowling', email='jk@example.com')
Author.objects.create(name='George Orwell', email='george@example.com')
Book.objects.create(title='Harry Potter', author_id=1, price=15.99, published_year=1997)
Book.objects.create(title='1984', author_id=2, price=12.99, published_year=1949)
Book.objects.create(title='Animal Farm', author_id=2, price=9.99, published_year=1945)`,
    problemStatement: "Write a Django ORM query that retrieves all books from the database.",
    expectedResult: "A QuerySet containing all 3 Book instances.",
    hints: [
      "Use the default Manager (objects) on the Book model.",
      "all() returns all rows from the table."
    ],
    solution: `Book.objects.all()`,
    alternativeSolutions: [
      `Book.objects.filter()`,
      `Book.objects.order_by('id')`
    ],
    explanation: "Book.objects.all() generates SELECT * FROM book and returns a QuerySet of all Book instances. It's lazy — the database query fires only when you iterate or evaluate the QuerySet.",
    tags: ["all", "queryset", "basic"]
  },
  {
    id: "ex-002",
    title: "Filter Books by Availability",
    difficulty: "beginner",
    topic: "filter",
    category: "queries",
    description: "Find all books that are currently available (is_available=True).",
    schema: `from django.db import models

class Book(models.Model):
    title = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    is_available = models.BooleanField(default=True)
    published_year = models.IntegerField()`,
    sampleData: `Book.objects.create(title='Harry Potter', price=15.99, published_year=1997, is_available=True)
Book.objects.create(title='1984', price=12.99, published_year=1949, is_available=False)
Book.objects.create(title='Dune', price=14.99, published_year=1965, is_available=True)`,
    problemStatement: "Write a query to get all books where is_available is True.",
    expectedResult: "QuerySet with 2 books: 'Harry Potter' and 'Dune'.",
    hints: [
      "Use filter() with the field name and value.",
      "Boolean fields can be filtered with =True or =False."
    ],
    solution: `Book.objects.filter(is_available=True)`,
    alternativeSolutions: [
      `Book.objects.exclude(is_available=False)`,
      `Book.objects.filter(is_available=True).all()`
    ],
    explanation: "filter(is_available=True) generates WHERE is_available = TRUE. The exact lookup is the default — filter(is_available=True) is the same as filter(is_available__exact=True).",
    tags: ["filter", "boolean", "queryset", "basic"]
  },
  {
    id: "ex-003",
    title: "Filter Books by Multiple Conditions (AND)",
    difficulty: "beginner",
    topic: "filter",
    category: "queries",
    description: "Get all available books published after 1960.",
    schema: `from django.db import models

class Book(models.Model):
    title = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    is_available = models.BooleanField(default=True)
    published_year = models.IntegerField()`,
    sampleData: `Book.objects.create(title='Harry Potter', price=15.99, published_year=1997, is_available=True)
Book.objects.create(title='1984', price=12.99, published_year=1949, is_available=True)
Book.objects.create(title='Dune', price=14.99, published_year=1965, is_available=True)
Book.objects.create(title='Old Man Sea', price=8.99, published_year=1952, is_available=False)`,
    problemStatement: "Find all books that are available AND published after 1960.",
    expectedResult: "QuerySet with 2 books: 'Harry Potter' (1997) and 'Dune' (1965).",
    hints: [
      "Multiple keyword arguments in filter() are AND-ed together.",
      "Use __gt for 'greater than'."
    ],
    solution: `Book.objects.filter(is_available=True, published_year__gt=1960)`,
    alternativeSolutions: [
      `Book.objects.filter(is_available=True).filter(published_year__gt=1960)`,
      `Book.objects.filter(is_available=True, published_year__gte=1961)`
    ],
    explanation: "Multiple kwargs in filter() use AND logic. published_year__gt=1960 maps to published_year > 1960. Chaining two filter() calls produces the same AND result.",
    tags: ["filter", "and", "gt", "queryset", "basic"]
  },
  {
    id: "ex-004",
    title: "Exclude Out-of-Stock Books",
    difficulty: "beginner",
    topic: "exclude",
    category: "queries",
    description: "Get all books that are NOT out of stock (is_available is not False).",
    schema: `from django.db import models

class Book(models.Model):
    title = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    is_available = models.BooleanField(default=True)`,
    sampleData: `Book.objects.create(title='Harry Potter', price=15.99, is_available=True)
Book.objects.create(title='1984', price=12.99, is_available=False)
Book.objects.create(title='Dune', price=14.99, is_available=True)`,
    problemStatement: "Use exclude() to get all books that are available.",
    expectedResult: "QuerySet with 2 books: 'Harry Potter' and 'Dune'.",
    hints: [
      "exclude() removes matching rows from the QuerySet.",
      "Excluding is_available=False is equivalent to filtering is_available=True."
    ],
    solution: `Book.objects.exclude(is_available=False)`,
    alternativeSolutions: [
      `Book.objects.filter(is_available=True)`,
      `Book.objects.exclude(is_available=False).order_by('title')`
    ],
    explanation: "exclude(is_available=False) generates WHERE NOT (is_available = FALSE). In this case it's equivalent to filter(is_available=True), but exclude() is useful when the negative condition is more natural to express.",
    tags: ["exclude", "boolean", "queryset", "basic"]
  },
  {
    id: "ex-005",
    title: "Order Books by Price",
    difficulty: "beginner",
    topic: "ordering",
    category: "queries",
    description: "Get all books ordered by price from cheapest to most expensive.",
    schema: `from django.db import models

class Book(models.Model):
    title = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=8, decimal_places=2)`,
    sampleData: `Book.objects.create(title='Dune', price=14.99)
Book.objects.create(title='Animal Farm', price=9.99)
Book.objects.create(title='Harry Potter', price=15.99)
Book.objects.create(title='1984', price=12.99)`,
    problemStatement: "Retrieve all books sorted by price ascending, then descending.",
    expectedResult: "Ascending: Animal Farm (9.99), 1984 (12.99), Dune (14.99), Harry Potter (15.99). Descending: Harry Potter, Dune, 1984, Animal Farm.",
    hints: [
      "Use order_by('field') for ascending.",
      "Prefix with '-' for descending: order_by('-field')."
    ],
    solution: `# Ascending
Book.objects.order_by('price')

# Descending
Book.objects.order_by('-price')`,
    alternativeSolutions: [
      `Book.objects.all().order_by('price')`,
      `from django.db.models import F\nBook.objects.order_by(F('price').asc())`
    ],
    explanation: "order_by('price') adds ORDER BY price ASC. order_by('-price') adds ORDER BY price DESC. The minus prefix is Django's convention for descending order.",
    tags: ["ordering", "order_by", "ascending", "descending", "queryset", "basic"]
  },
  {
    id: "ex-006",
    title: "Get Book by Primary Key",
    difficulty: "beginner",
    topic: "get",
    category: "queries",
    description: "Retrieve a single book by its primary key, handling the case where it doesn't exist.",
    schema: `from django.db import models

class Book(models.Model):
    title = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=8, decimal_places=2)`,
    sampleData: `Book.objects.create(title='Harry Potter', price=15.99)  # pk=1
Book.objects.create(title='1984', price=12.99)            # pk=2`,
    problemStatement: "Write a query to get the book with pk=1. Handle the DoesNotExist exception gracefully.",
    expectedResult: "The Book instance with title='Harry Potter', or None if not found.",
    hints: [
      "Use get(pk=1) for a single object.",
      "Wrap in try/except to handle Book.DoesNotExist.",
      "Alternatively use get_object_or_404 in views."
    ],
    solution: `try:
    book = Book.objects.get(pk=1)
except Book.DoesNotExist:
    book = None`,
    alternativeSolutions: [
      `# In views — raises Http404 if not found
from django.shortcuts import get_object_or_404
book = get_object_or_404(Book, pk=1)`,
      `# Using filter().first() — returns None if not found
book = Book.objects.filter(pk=1).first()`
    ],
    explanation: "get() raises Book.DoesNotExist if no matching row and MultipleObjectsReturned if more than one matches. Since pk is unique, only DoesNotExist is a concern. filter().first() is a safe alternative that returns None without raising.",
    tags: ["get", "pk", "doesnotexist", "queryset", "basic"]
  },
  {
    id: "ex-007",
    title: "Count Books in the Database",
    difficulty: "beginner",
    topic: "count",
    category: "queries",
    description: "Count the total number of books, and count only available books.",
    schema: `from django.db import models

class Book(models.Model):
    title = models.CharField(max_length=200)
    is_available = models.BooleanField(default=True)`,
    sampleData: `Book.objects.create(title='Harry Potter', is_available=True)
Book.objects.create(title='1984', is_available=False)
Book.objects.create(title='Dune', is_available=True)`,
    problemStatement: "Write queries to: (1) count all books, (2) count only available books.",
    expectedResult: "Total: 3. Available: 2.",
    hints: [
      "count() returns an integer, not a QuerySet.",
      "Chain filter() before count() to count a subset."
    ],
    solution: `total = Book.objects.count()          # 3
available = Book.objects.filter(is_available=True).count()  # 2`,
    alternativeSolutions: [
      `# Using aggregate
from django.db.models import Count
Book.objects.aggregate(total=Count('id'))
Book.objects.filter(is_available=True).aggregate(count=Count('id'))`
    ],
    explanation: "count() generates SELECT COUNT(*) FROM book — much faster than len(Book.objects.all()) which fetches all rows. Chaining filter().count() adds a WHERE clause to the COUNT query.",
    tags: ["count", "aggregate", "queryset", "basic"]
  },
  {
    id: "ex-008",
    title: "Check If Any Expensive Books Exist",
    difficulty: "beginner",
    topic: "exists",
    category: "queries",
    description: "Check if any books priced over $20 exist in the database.",
    schema: `from django.db import models

class Book(models.Model):
    title = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=8, decimal_places=2)`,
    sampleData: `Book.objects.create(title='Harry Potter', price=15.99)
Book.objects.create(title='Encyclopedia', price=45.00)
Book.objects.create(title='Dune', price=14.99)`,
    problemStatement: "Check if there are any books priced over $20. Return True or False.",
    expectedResult: "True (Encyclopedia costs $45).",
    hints: [
      "exists() returns True/False and is faster than count().",
      "Use __gt for greater than."
    ],
    solution: `has_expensive = Book.objects.filter(price__gt=20).exists()  # True`,
    alternativeSolutions: [
      `# Less efficient — fetches all rows
has_expensive = bool(Book.objects.filter(price__gt=20))`,
      `has_expensive = Book.objects.filter(price__gt=20).count() > 0`
    ],
    explanation: "exists() generates SELECT (1) AS a FROM book WHERE price > 20 LIMIT 1. It stops at the first matching row — O(1) regardless of table size. Much faster than fetching rows or counting.",
    tags: ["exists", "performance", "queryset", "basic"]
  },
  {
    id: "ex-009",
    title: "Create a New Book",
    difficulty: "beginner",
    topic: "create",
    category: "queries",
    description: "Add a new book to the database using the ORM.",
    schema: `from django.db import models

class Author(models.Model):
    name = models.CharField(max_length=100)

class Book(models.Model):
    title = models.CharField(max_length=200)
    author = models.ForeignKey(Author, on_delete=models.CASCADE)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    published_year = models.IntegerField()`,
    sampleData: `author = Author.objects.create(name='Frank Herbert')`,
    problemStatement: "Create a new book titled 'Dune Messiah' by Frank Herbert, priced at $13.99, published in 1969.",
    expectedResult: "A new Book instance saved to the database with pk populated.",
    hints: [
      "Use Book.objects.create() for a one-step create and save.",
      "Pass the author instance or author_id."
    ],
    solution: `author = Author.objects.get(name='Frank Herbert')
book = Book.objects.create(
    title='Dune Messiah',
    author=author,
    price=13.99,
    published_year=1969
)`,
    alternativeSolutions: [
      `# Two-step approach
book = Book(title='Dune Messiah', author=author, price=13.99, published_year=1969)
book.save()`,
      `# Using author_id directly
book = Book.objects.create(title='Dune Messiah', author_id=1, price=13.99, published_year=1969)`
    ],
    explanation: "create() is equivalent to instantiating the model and calling save(). It returns the saved instance with the pk field populated. Passing the author instance or author_id are both valid — Django stores the id in the author_id column.",
    tags: ["create", "save", "queryset", "basic"]
  },
  {
    id: "ex-010",
    title: "Update a Book's Price",
    difficulty: "beginner",
    topic: "update",
    category: "queries",
    description: "Update the price of a specific book.",
    schema: `from django.db import models

class Book(models.Model):
    title = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=8, decimal_places=2)`,
    sampleData: `Book.objects.create(title='Harry Potter', price=15.99)  # pk=1`,
    problemStatement: "Update the price of the book with pk=1 to $19.99. Do it efficiently using update_fields.",
    expectedResult: "Book pk=1 now has price=19.99 in the database.",
    hints: [
      "Fetch the object, modify it, call save(update_fields=['price']).",
      "Or use Book.objects.filter(pk=1).update(price=19.99) for a single SQL UPDATE."
    ],
    solution: `# Method 1: Instance update (runs full_clean if you add it)
book = Book.objects.get(pk=1)
book.price = 19.99
book.save(update_fields=['price'])  # Only updates the price column`,
    alternativeSolutions: [
      `# Method 2: Bulk update — one SQL UPDATE, no Python object
Book.objects.filter(pk=1).update(price=19.99)`,
      `# Method 3: F expression (atomic, avoids read-then-write)
from django.db.models import F
Book.objects.filter(pk=1).update(price=F('price') + 4.00)`
    ],
    explanation: "save(update_fields=['price']) generates UPDATE book SET price=19.99 WHERE id=1 — only the specified field is written. This is safer than save() which writes all fields (risking overwriting concurrent changes to other fields).",
    tags: ["update", "save", "update_fields", "queryset", "basic"]
  },
  {
    id: "ex-011",
    title: "Delete Out-of-Print Books",
    difficulty: "beginner",
    topic: "delete",
    category: "queries",
    description: "Delete all books marked as unavailable from the database.",
    schema: `from django.db import models

class Book(models.Model):
    title = models.CharField(max_length=200)
    is_available = models.BooleanField(default=True)`,
    sampleData: `Book.objects.create(title='Harry Potter', is_available=True)
Book.objects.create(title='Old Book', is_available=False)
Book.objects.create(title='Another Old Book', is_available=False)`,
    problemStatement: "Delete all books where is_available=False. Print how many were deleted.",
    expectedResult: "2 books deleted. Database now contains only 'Harry Potter'.",
    hints: [
      "delete() on a QuerySet deletes all matching rows in one SQL DELETE.",
      "delete() returns a tuple: (total_deleted, {model_label: count})."
    ],
    solution: `count, details = Book.objects.filter(is_available=False).delete()
print(f"Deleted {count} books: {details}")
# Output: Deleted 2 books: {'myapp.Book': 2}`,
    alternativeSolutions: [
      `# Delete with cascade info
result = Book.objects.filter(is_available=False).delete()
total = result[0]`,
      `# Delete single instance
book = Book.objects.get(pk=2)
book.delete()`
    ],
    explanation: "Calling delete() on a QuerySet generates DELETE FROM book WHERE is_available=FALSE — one SQL statement. It also handles cascading deletes for related objects (e.g. reviews) and returns a count tuple for logging.",
    tags: ["delete", "queryset", "basic"]
  },
  {
    id: "ex-012",
    title: "Get First and Last Published Book",
    difficulty: "beginner",
    topic: "first-last",
    category: "queries",
    description: "Find the oldest and newest published books.",
    schema: `from django.db import models

class Book(models.Model):
    title = models.CharField(max_length=200)
    published_year = models.IntegerField()

    class Meta:
        ordering = ['published_year']`,
    sampleData: `Book.objects.create(title='Moby Dick', published_year=1851)
Book.objects.create(title='1984', published_year=1949)
Book.objects.create(title='Harry Potter', published_year=1997)`,
    problemStatement: "Find the oldest book (by published_year) and the newest book.",
    expectedResult: "Oldest: 'Moby Dick' (1851). Newest: 'Harry Potter' (1997).",
    hints: [
      "first() returns the first item based on current ordering.",
      "last() returns the last item based on current ordering.",
      "Alternatively, order_by() then first()."
    ],
    solution: `oldest = Book.objects.order_by('published_year').first()
newest = Book.objects.order_by('published_year').last()
# OR using Meta.ordering (ordering=['published_year']):
oldest = Book.objects.first()
newest = Book.objects.last()`,
    alternativeSolutions: [
      `oldest = Book.objects.order_by('published_year')[0]`,
      `newest = Book.objects.order_by('-published_year').first()`
    ],
    explanation: "first() and last() respect the QuerySet's ordering and return None for empty QuerySets (no exception). They generate LIMIT 1 (with appropriate ORDER BY) in SQL.",
    tags: ["first", "last", "ordering", "queryset", "basic"]
  },
  {
    id: "ex-013",
    title: "Case-Insensitive Title Search",
    difficulty: "beginner",
    topic: "icontains",
    category: "queries",
    description: "Search for books whose title contains a keyword, case-insensitively.",
    schema: `from django.db import models

class Book(models.Model):
    title = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=8, decimal_places=2)`,
    sampleData: `Book.objects.create(title='Django for Beginners', price=29.99)
Book.objects.create(title='Advanced Django Patterns', price=49.99)
Book.objects.create(title='Flask Web Development', price=34.99)
Book.objects.create(title='django REST framework', price=39.99)`,
    problemStatement: "Find all books whose title contains the word 'django' (case-insensitive).",
    expectedResult: "3 books: 'Django for Beginners', 'Advanced Django Patterns', 'django REST framework'.",
    hints: [
      "Use __icontains for case-insensitive substring search.",
      "__contains is case-sensitive on most databases."
    ],
    solution: `books = Book.objects.filter(title__icontains='django')`,
    alternativeSolutions: [
      `# Case-sensitive (misses 'django REST framework')
books = Book.objects.filter(title__contains='Django')`,
      `# Using regex
books = Book.objects.filter(title__iregex=r'django')`
    ],
    explanation: "icontains generates ILIKE '%django%' on PostgreSQL (native case-insensitive) or UPPER(title) LIKE UPPER('%django%') on other databases. It finds the substring in any position.",
    tags: ["icontains", "search", "filter", "queryset", "basic"]
  },
  {
    id: "ex-014",
    title: "Filter Books by Multiple Years",
    difficulty: "beginner",
    topic: "in-lookup",
    category: "queries",
    description: "Get all books published in specific years using the __in lookup.",
    schema: `from django.db import models

class Book(models.Model):
    title = models.CharField(max_length=200)
    published_year = models.IntegerField()`,
    sampleData: `Book.objects.create(title='Harry Potter', published_year=1997)
Book.objects.create(title='1984', published_year=1949)
Book.objects.create(title='Dune', published_year=1965)
Book.objects.create(title='Moby Dick', published_year=1851)`,
    problemStatement: "Find all books published in 1949, 1965, or 1997.",
    expectedResult: "3 books: 'Harry Potter', '1984', 'Dune'.",
    hints: [
      "Use __in with a list of values.",
      "__in maps to SQL IN (...)."
    ],
    solution: `books = Book.objects.filter(published_year__in=[1949, 1965, 1997])`,
    alternativeSolutions: [
      `from django.db.models import Q
books = Book.objects.filter(
    Q(published_year=1949) | Q(published_year=1965) | Q(published_year=1997)
)`,
      `years = [1949, 1965, 1997]
books = Book.objects.filter(published_year__in=years)`
    ],
    explanation: "__in generates WHERE published_year IN (1949, 1965, 1997). It's more concise than multiple OR conditions and the database can optimize it with an index scan.",
    tags: ["in", "filter", "queryset", "basic"]
  },
  {
    id: "ex-015",
    title: "Filter Books by Author's Name",
    difficulty: "beginner",
    topic: "related-field-filter",
    category: "queries",
    description: "Find all books written by a specific author using ForeignKey traversal.",
    schema: `from django.db import models

class Author(models.Model):
    name = models.CharField(max_length=100)
    country = models.CharField(max_length=50)

class Book(models.Model):
    title = models.CharField(max_length=200)
    author = models.ForeignKey(Author, on_delete=models.CASCADE, related_name='books')
    price = models.DecimalField(max_digits=8, decimal_places=2)`,
    sampleData: `orwell = Author.objects.create(name='George Orwell', country='UK')
herbert = Author.objects.create(name='Frank Herbert', country='USA')
Book.objects.create(title='1984', author=orwell, price=12.99)
Book.objects.create(title='Animal Farm', author=orwell, price=9.99)
Book.objects.create(title='Dune', author=herbert, price=14.99)`,
    problemStatement: "Find all books written by authors from the UK.",
    expectedResult: "2 books: '1984' and 'Animal Farm'.",
    hints: [
      "Use __ to traverse ForeignKey: author__country.",
      "Django automatically creates the JOIN."
    ],
    solution: `books = Book.objects.filter(author__country='UK')`,
    alternativeSolutions: [
      `# First get the author, then filter
uk_authors = Author.objects.filter(country='UK')
books = Book.objects.filter(author__in=uk_authors)`,
      `# By author name
books = Book.objects.filter(author__name='George Orwell')`
    ],
    explanation: "author__country='UK' traverses the ForeignKey and generates a JOIN: SELECT book.* FROM book INNER JOIN author ON book.author_id = author.id WHERE author.country = 'UK'. This is Django's double-underscore FK traversal syntax.",
    tags: ["foreignkey", "related-field", "filter", "join", "queryset", "basic"]
  },

  // ============================================================
  // INTERMEDIATE EXERCISES (16-30)
  // ============================================================
  {
    id: "ex-016",
    title: "Search with OR Conditions Using Q Objects",
    difficulty: "intermediate",
    topic: "q-objects",
    category: "queries",
    description: "Find blog posts that match a search term in either the title or body.",
    schema: `from django.db import models

class BlogPost(models.Model):
    title = models.CharField(max_length=200)
    body = models.TextField()
    status = models.CharField(max_length=20, default='draft')
    created_at = models.DateTimeField(auto_now_add=True)`,
    sampleData: `BlogPost.objects.create(title='Django ORM Tips', body='Learn about querysets', status='published')
BlogPost.objects.create(title='Flask Tutorial', body='Introduction to Django REST', status='published')
BlogPost.objects.create(title='Python Basics', body='Variables and loops', status='draft')`,
    problemStatement: "Find all published posts where 'Django' appears in the title OR in the body (case-insensitive).",
    expectedResult: "2 posts: 'Django ORM Tips' (Django in title) and 'Flask Tutorial' (Django in body).",
    hints: [
      "Use Q objects with | for OR.",
      "AND it with status='published' condition."
    ],
    solution: `from django.db.models import Q

posts = BlogPost.objects.filter(
    Q(title__icontains='django') | Q(body__icontains='django'),
    status='published'
)`,
    alternativeSolutions: [
      `posts = BlogPost.objects.filter(
    (Q(title__icontains='django') | Q(body__icontains='django')) &
    Q(status='published')
)`
    ],
    explanation: "Q objects enable OR logic. The | operator creates SQL OR. Multiple Q objects with & create AND. Keyword arguments after Q objects are AND-ed with the Q expressions. Q objects must come before keyword arguments.",
    tags: ["q-objects", "or", "icontains", "queryset", "intermediate"]
  },
  {
    id: "ex-017",
    title: "Atomic View Counter with F Expression",
    difficulty: "intermediate",
    topic: "f-expressions",
    category: "queries",
    description: "Increment a post's view count atomically without a race condition.",
    schema: `from django.db import models

class BlogPost(models.Model):
    title = models.CharField(max_length=200)
    views = models.PositiveIntegerField(default=0)
    slug = models.SlugField(unique=True)`,
    sampleData: `BlogPost.objects.create(title='Django Tips', views=100, slug='django-tips')`,
    problemStatement: "Increment the view count of the post with slug='django-tips' by 1 atomically (no race condition).",
    expectedResult: "views field in DB becomes 101. Multiple concurrent increments are safe.",
    hints: [
      "F expressions do the arithmetic in SQL — no read-then-write race.",
      "Use update() with F('views') + 1."
    ],
    solution: `from django.db.models import F

BlogPost.objects.filter(slug='django-tips').update(views=F('views') + 1)`,
    alternativeSolutions: [
      `# If you need the updated value back
from django.db.models import F
post = BlogPost.objects.get(slug='django-tips')
BlogPost.objects.filter(pk=post.pk).update(views=F('views') + 1)
post.refresh_from_db()  # Sync Python object with DB
print(post.views)  # 101`
    ],
    explanation: "F('views') + 1 translates to SET views = views + 1 in SQL — the database does the arithmetic atomically. Contrast with post.views += 1; post.save() which reads the value into Python, increments there, and writes back — creating a race condition under concurrency.",
    tags: ["f-expressions", "atomic", "update", "race-condition", "queryset", "intermediate"]
  },
  {
    id: "ex-018",
    title: "Annotate Authors with Book Count",
    difficulty: "intermediate",
    topic: "annotate",
    category: "queries",
    description: "Get all authors with a count of how many books each has written.",
    schema: `from django.db import models

class Author(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name

class Book(models.Model):
    title = models.CharField(max_length=200)
    author = models.ForeignKey(Author, on_delete=models.CASCADE, related_name='books')`,
    sampleData: `orwell = Author.objects.create(name='George Orwell')
rowling = Author.objects.create(name='J.K. Rowling')
Author.objects.create(name='Silent Author')
Book.objects.create(title='1984', author=orwell)
Book.objects.create(title='Animal Farm', author=orwell)
Book.objects.create(title='Harry Potter 1', author=rowling)`,
    problemStatement: "Get all authors annotated with their book count, ordered by most books first.",
    expectedResult: "Orwell (2), Rowling (1), Silent Author (0) — ordered desc by book_count.",
    hints: [
      "Use annotate() with Count('books') — using the related_name.",
      "Order by the annotation with '-book_count'."
    ],
    solution: `from django.db.models import Count

authors = Author.objects.annotate(
    book_count=Count('books')
).order_by('-book_count')

for author in authors:
    print(f"{author.name}: {author.book_count} books")`,
    alternativeSolutions: [
      `from django.db.models import Count
authors = Author.objects.annotate(
    book_count=Count('book')  # Without related_name, use model name lowercase
).order_by('-book_count')`
    ],
    explanation: "annotate(book_count=Count('books')) generates a GROUP BY author.id with COUNT(book.id). Each author object gets a book_count attribute. Ordering by '-book_count' uses the annotation in ORDER BY.",
    tags: ["annotate", "count", "group-by", "ordering", "queryset", "intermediate"]
  },
  {
    id: "ex-019",
    title: "Calculate Total and Average Order Value",
    difficulty: "intermediate",
    topic: "aggregate",
    category: "queries",
    description: "Compute total revenue and average order value for completed orders.",
    schema: `from django.db import models

class Customer(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField()

class Order(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='orders')
    total = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)`,
    sampleData: `alice = Customer.objects.create(name='Alice', email='alice@example.com')
Order.objects.create(customer=alice, total=150.00, status='completed')
Order.objects.create(customer=alice, total=75.50, status='completed')
Order.objects.create(customer=alice, total=200.00, status='pending')`,
    problemStatement: "Calculate the total revenue and average order value for completed orders only.",
    expectedResult: "{'total_revenue': Decimal('225.50'), 'avg_order': Decimal('112.75'), 'order_count': 2}",
    hints: [
      "Use aggregate() with Sum, Avg, and Count.",
      "Filter to completed orders before aggregating."
    ],
    solution: `from django.db.models import Sum, Avg, Count

stats = Order.objects.filter(status='completed').aggregate(
    total_revenue=Sum('total'),
    avg_order=Avg('total'),
    order_count=Count('id')
)
print(stats)`,
    alternativeSolutions: [
      `from django.db.models import Sum, Avg, Count
# With None-safety
result = Order.objects.filter(status='completed').aggregate(
    total_revenue=Sum('total'),
    avg_order=Avg('total')
)
revenue = result['total_revenue'] or 0`
    ],
    explanation: "aggregate() returns a single dictionary computed over all matching rows. Multiple aggregate functions are computed in one SQL query. Sum returns None (not 0) if no rows match — always provide a fallback.",
    tags: ["aggregate", "sum", "avg", "count", "queryset", "intermediate"]
  },
  {
    id: "ex-020",
    title: "Filter Orders Within a Date Range",
    difficulty: "intermediate",
    topic: "range-lookup",
    category: "queries",
    description: "Get all orders placed within a specific date range.",
    schema: `from django.db import models

class Order(models.Model):
    total = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20)
    created_at = models.DateTimeField(auto_now_add=True)`,
    sampleData: `from django.utils import timezone
from datetime import timedelta

now = timezone.now()
Order.objects.create(total=100, status='completed', created_at=now - timedelta(days=10))
Order.objects.create(total=200, status='pending', created_at=now - timedelta(days=5))
Order.objects.create(total=300, status='completed', created_at=now - timedelta(days=1))`,
    problemStatement: "Find all orders created in the last 7 days.",
    expectedResult: "2 orders (the ones from 5 days ago and 1 day ago).",
    hints: [
      "Use __range for between two dates.",
      "Or use __gte with a calculated date 7 days ago."
    ],
    solution: `from django.utils import timezone
from datetime import timedelta

seven_days_ago = timezone.now() - timedelta(days=7)
orders = Order.objects.filter(created_at__gte=seven_days_ago)`,
    alternativeSolutions: [
      `from django.utils import timezone
from datetime import timedelta

now = timezone.now()
orders = Order.objects.filter(
    created_at__range=[now - timedelta(days=7), now]
)`,
      `from datetime import date, timedelta
# Date-only range
today = date.today()
week_ago = today - timedelta(days=7)
orders = Order.objects.filter(created_at__date__range=[week_ago, today])`
    ],
    explanation: "__range generates BETWEEN start AND end (inclusive on both ends). __gte is simpler when the end is now. Use timezone.now() when USE_TZ=True in settings for proper timezone handling.",
    tags: ["range", "date", "filter", "queryset", "intermediate"]
  },
  {
    id: "ex-021",
    title: "Get Distinct Categories from Products",
    difficulty: "intermediate",
    topic: "distinct",
    category: "queries",
    description: "Get a unique list of category names from the product catalogue.",
    schema: `from django.db import models

class Product(models.Model):
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=8, decimal_places=2)`,
    sampleData: `Product.objects.create(name='Laptop', category='Electronics', price=999)
Product.objects.create(name='Phone', category='Electronics', price=699)
Product.objects.create(name='T-Shirt', category='Clothing', price=29)
Product.objects.create(name='Jeans', category='Clothing', price=59)
Product.objects.create(name='Python Book', category='Books', price=39)`,
    problemStatement: "Get a distinct list of all category names, sorted alphabetically.",
    expectedResult: "['Books', 'Clothing', 'Electronics']",
    hints: [
      "Use values() to extract a single field, then distinct().",
      "Or use values_list(flat=True) for a flat list."
    ],
    solution: `categories = (
    Product.objects
    .values_list('category', flat=True)
    .distinct()
    .order_by('category')
)
print(list(categories))`,
    alternativeSolutions: [
      `categories = Product.objects.values('category').distinct().order_by('category')
# Returns [{'category': 'Books'}, {'category': 'Clothing'}, {'category': 'Electronics'}]`
    ],
    explanation: "values_list('category', flat=True).distinct() extracts the category column, removes duplicates (DISTINCT), and returns a flat list of strings. This avoids fetching entire model instances when you only need one field.",
    tags: ["distinct", "values_list", "flat", "queryset", "intermediate"]
  },
  {
    id: "ex-022",
    title: "Extract Product Names and Prices as Dicts",
    difficulty: "intermediate",
    topic: "values",
    category: "queries",
    description: "Fetch only the name and price of all products as dictionaries for a lightweight API response.",
    schema: `from django.db import models

class Product(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField()
    price = models.DecimalField(max_digits=8, decimal_places=2)
    stock = models.IntegerField(default=0)
    image = models.ImageField(upload_to='products/')`,
    sampleData: `Product.objects.create(name='Laptop', description='A powerful laptop', price=999, stock=10)
Product.objects.create(name='Mouse', description='Ergonomic mouse', price=29, stock=100)`,
    problemStatement: "Fetch only the name and price fields for all products (not the full model with description, stock, image).",
    expectedResult: "[{'name': 'Laptop', 'price': Decimal('999.00')}, {'name': 'Mouse', 'price': Decimal('29.00')}]",
    hints: [
      "values() returns dictionaries with only specified fields.",
      "This avoids loading large description and image fields."
    ],
    solution: `products = Product.objects.values('name', 'price').order_by('name')`,
    alternativeSolutions: [
      `# As tuples
products = Product.objects.values_list('name', 'price').order_by('name')
# [('Laptop', Decimal('999.00')), ('Mouse', Decimal('29.00'))]`,
      `# Named tuples
products = Product.objects.values_list('name', 'price', named=True)
for p in products:
    print(p.name, p.price)`
    ],
    explanation: "values('name', 'price') generates SELECT name, price FROM product. Only two columns are fetched — no image URLs, no text bodies. This is ideal for dropdown lists, lightweight API endpoints, and large table queries.",
    tags: ["values", "values_list", "performance", "queryset", "intermediate"]
  },
  {
    id: "ex-023",
    title: "Find Customers Who Placed Orders (Reverse FK)",
    difficulty: "intermediate",
    topic: "reverse-fk",
    category: "queries",
    description: "Find all customers who have placed at least one order over $100.",
    schema: `from django.db import models

class Customer(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField()

class Order(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='orders')
    total = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20)`,
    sampleData: `alice = Customer.objects.create(name='Alice', email='alice@example.com')
bob = Customer.objects.create(name='Bob', email='bob@example.com')
charlie = Customer.objects.create(name='Charlie', email='charlie@example.com')
Order.objects.create(customer=alice, total=150, status='completed')
Order.objects.create(customer=alice, total=50, status='completed')
Order.objects.create(customer=bob, total=200, status='pending')
# Charlie has no orders`,
    problemStatement: "Find customers who have at least one order with total > $100, without duplicates.",
    expectedResult: "2 customers: Alice and Bob.",
    hints: [
      "Filter through the reverse FK: orders__total__gt=100.",
      "Use distinct() to avoid duplicates (Alice has 2 orders but appears once)."
    ],
    solution: `customers = Customer.objects.filter(orders__total__gt=100).distinct()`,
    alternativeSolutions: [
      `from django.db.models import Exists, OuterRef
big_orders = Order.objects.filter(customer=OuterRef('pk'), total__gt=100)
customers = Customer.objects.filter(Exists(big_orders))`,
      `# Via related_name
customers = Customer.objects.filter(orders__total__gt=100).distinct()`
    ],
    explanation: "orders__total__gt=100 traverses the reverse FK (orders is the related_name). Django JOINs to the order table. Without distinct(), Alice appears twice (she has a 150 and a 50 order). Exists() is more efficient for large datasets.",
    tags: ["reverse-fk", "related-name", "distinct", "queryset", "intermediate"]
  },
  {
    id: "ex-024",
    title: "Avoid N+1 with select_related",
    difficulty: "intermediate",
    topic: "select-related",
    category: "queries",
    description: "List all orders with customer names without triggering N+1 queries.",
    schema: `from django.db import models

class Customer(models.Model):
    name = models.CharField(max_length=100)

class Order(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)`,
    sampleData: `alice = Customer.objects.create(name='Alice')
bob = Customer.objects.create(name='Bob')
Order.objects.create(customer=alice, total=100)
Order.objects.create(customer=bob, total=200)
Order.objects.create(customer=alice, total=50)`,
    problemStatement: "Print all orders with their customer name. Ensure this only uses 1 database query, not N+1.",
    expectedResult: "3 lines printed, 1 SQL query executed.",
    hints: [
      "select_related('customer') JOINs the customer table.",
      "Without it, each order.customer.name triggers a separate query."
    ],
    solution: `orders = Order.objects.select_related('customer').order_by('-created_at')

for order in orders:
    print(f"Order #{order.pk}: \${order.total} by {order.customer.name}")
# Total: 1 SQL query (JOIN)`,
    alternativeSolutions: [
      `# Verify with connection.queries
from django.db import connection, reset_queries
reset_queries()
orders = list(Order.objects.select_related('customer'))
print(f"Queries used: {len(connection.queries)}")  # Should be 1`
    ],
    explanation: "Without select_related, order.customer triggers a lazy load — 1 query per order. select_related('customer') generates SELECT order.*, customer.* FROM order JOIN customer ON ... — one query total. This is the primary solution to the FK N+1 problem.",
    tags: ["select_related", "n+1", "foreignkey", "performance", "queryset", "intermediate"]
  },
  {
    id: "ex-025",
    title: "Prefetch Tags for Blog Posts",
    difficulty: "intermediate",
    topic: "prefetch-related",
    category: "queries",
    description: "List all blog posts with their tags without triggering N+1 queries.",
    schema: `from django.db import models

class Tag(models.Model):
    name = models.CharField(max_length=50)

class BlogPost(models.Model):
    title = models.CharField(max_length=200)
    tags = models.ManyToManyField(Tag, blank=True, related_name='posts')`,
    sampleData: `t1 = Tag.objects.create(name='python')
t2 = Tag.objects.create(name='django')
t3 = Tag.objects.create(name='orm')
p1 = BlogPost.objects.create(title='Django ORM Guide')
p1.tags.add(t1, t2, t3)
p2 = BlogPost.objects.create(title='Python Basics')
p2.tags.add(t1)`,
    problemStatement: "Print all posts with their tag names using only 2 SQL queries (not N+1).",
    expectedResult: "'Django ORM Guide': python, django, orm. 'Python Basics': python. Total: 2 queries.",
    hints: [
      "Use prefetch_related('tags') for ManyToManyField.",
      "2 queries: one for posts, one for all tags."
    ],
    solution: `posts = BlogPost.objects.prefetch_related('tags')

for post in posts:
    tag_names = [tag.name for tag in post.tags.all()]
    print(f"{post.title}: {', '.join(tag_names)}")`,
    alternativeSolutions: [
      `from django.db.models import Prefetch
posts = BlogPost.objects.prefetch_related(
    Prefetch('tags', queryset=Tag.objects.order_by('name'))
)
for post in posts:
    print(post.title, [t.name for t in post.tags.all()])`
    ],
    explanation: "prefetch_related('tags') fetches all tags in a separate query and maps them to posts in Python — 2 queries total regardless of post count. In contrast, post.tags.all() in a loop without prefetch generates 1 query per post (N+1).",
    tags: ["prefetch_related", "manytomany", "n+1", "performance", "queryset", "intermediate"]
  },
  {
    id: "ex-026",
    title: "Fetch Only Title and Slug Fields",
    difficulty: "intermediate",
    topic: "only",
    category: "queries",
    description: "Fetch a list of articles loading only the title and slug — skipping the large body field.",
    schema: `from django.db import models

class Article(models.Model):
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    body = models.TextField()   # Potentially very large
    views = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)`,
    sampleData: `Article.objects.create(title='Django Guide', slug='django-guide', body='...' * 1000)
Article.objects.create(title='Python Tips', slug='python-tips', body='...' * 2000)`,
    problemStatement: "Fetch articles for a sitemap — you only need title and slug. Avoid loading the body.",
    expectedResult: "Model instances with .title and .slug accessible. Accessing .body would trigger an extra query (deferred).",
    hints: [
      "Use only('title', 'slug') to specify exact fields to load.",
      "Always include 'id' or 'pk' when using only() for safety."
    ],
    solution: `articles = Article.objects.only('id', 'title', 'slug').order_by('title')

for article in articles:
    print(f"{article.title} -> /articles/{article.slug}/")
    # Do NOT access article.body here — it would trigger N extra queries`,
    alternativeSolutions: [
      `# Using defer() — fetch all except body
articles = Article.objects.defer('body').order_by('title')`,
      `# Using values() — returns dicts, not model instances
articles = Article.objects.values('title', 'slug').order_by('title')`
    ],
    explanation: "only() generates SELECT id, title, slug FROM article — the body column is excluded. Accessing a deferred field (article.body) fires an additional SELECT for just that field. only() is best when you know exactly which fields are needed; values() is better when you don't need model methods.",
    tags: ["only", "defer", "performance", "fields", "queryset", "intermediate"]
  },
  {
    id: "ex-027",
    title: "Bulk Create Products from a List",
    difficulty: "intermediate",
    topic: "bulk-create",
    category: "queries",
    description: "Import a list of products from a CSV-like data structure using bulk_create.",
    schema: `from django.db import models

class Product(models.Model):
    name = models.CharField(max_length=200)
    sku = models.CharField(max_length=50, unique=True)
    price = models.DecimalField(max_digits=8, decimal_places=2)`,
    sampleData: `data = [
    {'name': 'Laptop', 'sku': 'LAP001', 'price': 999.99},
    {'name': 'Mouse', 'sku': 'MOU001', 'price': 29.99},
    {'name': 'Keyboard', 'sku': 'KEY001', 'price': 79.99},
    # ... imagine 10,000 rows
]`,
    problemStatement: "Create all products in the data list using a single bulk operation. Handle duplicate SKUs gracefully.",
    expectedResult: "All 3 products created in one SQL INSERT statement.",
    hints: [
      "Build a list of unsaved Product instances first.",
      "Use bulk_create() to insert all at once.",
      "Use ignore_conflicts=True to skip duplicates."
    ],
    solution: `data = [
    {'name': 'Laptop', 'sku': 'LAP001', 'price': 999.99},
    {'name': 'Mouse', 'sku': 'MOU001', 'price': 29.99},
    {'name': 'Keyboard', 'sku': 'KEY001', 'price': 79.99},
]

products = [Product(**row) for row in data]
created = Product.objects.bulk_create(products, ignore_conflicts=True)
print(f"Attempted to create {len(products)} products")`,
    alternativeSolutions: [
      `# With batch_size for very large datasets
Product.objects.bulk_create(products, batch_size=500)`,
      `# Upsert (Django 4.1+)
Product.objects.bulk_create(
    products,
    update_conflicts=True,
    update_fields=['price', 'name'],
    unique_fields=['sku']
)`
    ],
    explanation: "bulk_create() sends one INSERT with all rows — dramatically faster than calling create() in a loop. ignore_conflicts=True silently skips rows that violate unique constraints (like duplicate SKUs). Note: save() and signals do NOT run for bulk-created objects.",
    tags: ["bulk_create", "performance", "import", "queryset", "intermediate"]
  },
  {
    id: "ex-028",
    title: "Get or Create a Category",
    difficulty: "intermediate",
    topic: "get-or-create",
    category: "queries",
    description: "Ensure a category exists, creating it if necessary — the upsert pattern.",
    schema: `from django.db import models

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)`,
    sampleData: `Category.objects.create(name='Electronics', slug='electronics', description='Electronic devices')`,
    problemStatement: "Ensure a category named 'Electronics' exists. If it does, return it. If not, create it with the given slug.",
    expectedResult: "Returns the existing Electronics category. created=False because it already existed.",
    hints: [
      "get_or_create() returns a (instance, created) tuple.",
      "defaults= only applies during creation, not when the object already exists."
    ],
    solution: `category, created = Category.objects.get_or_create(
    name='Electronics',              # Lookup field
    defaults={
        'slug': 'electronics',       # Only used if creating
        'description': 'All electronic products'
    }
)
if created:
    print(f"Created new category: {category.pk}")
else:
    print(f"Found existing category: {category.pk}")`,
    alternativeSolutions: [
      `# Simple case — only one lookup field
category, created = Category.objects.get_or_create(name='Electronics', slug='electronics')
# Note: if both are lookup fields, BOTH must match for get to succeed`
    ],
    explanation: "get_or_create() does SELECT ... WHERE name='Electronics'; if no row, INSERT. The defaults dict provides values for new rows only — they're NOT used to update existing rows. This is safe for idempotent initialization code.",
    tags: ["get_or_create", "upsert", "queryset", "intermediate"]
  },
  {
    id: "ex-029",
    title: "Update or Create a Product Inventory Record",
    difficulty: "intermediate",
    topic: "update-or-create",
    category: "queries",
    description: "Upsert an inventory record — create it if new, update it if exists.",
    schema: `from django.db import models

class Product(models.Model):
    sku = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=200)

class Inventory(models.Model):
    product = models.OneToOneField(Product, on_delete=models.CASCADE, related_name='inventory')
    stock = models.IntegerField(default=0)
    warehouse = models.CharField(max_length=100)
    last_updated = models.DateTimeField(auto_now=True)`,
    sampleData: `product = Product.objects.create(sku='LAP001', name='Laptop')`,
    problemStatement: "A warehouse system sends stock updates. For product 'LAP001', set stock=50 in warehouse='London'. Create the record if it doesn't exist, update if it does.",
    expectedResult: "Inventory record for Laptop exists with stock=50, warehouse='London'.",
    hints: [
      "update_or_create() applies defaults= on BOTH create and update.",
      "Lookup by the unique field (product)."
    ],
    solution: `product = Product.objects.get(sku='LAP001')

inventory, created = Inventory.objects.update_or_create(
    product=product,                   # Lookup field
    defaults={
        'stock': 50,                   # Applied on create AND update
        'warehouse': 'London'
    }
)
action = 'Created' if created else 'Updated'
print(f"{action} inventory: stock={inventory.stock}")`,
    alternativeSolutions: [
      `# Using product_id directly
inventory, created = Inventory.objects.update_or_create(
    product_id=product.pk,
    defaults={'stock': 50, 'warehouse': 'London'}
)`
    ],
    explanation: "update_or_create() differs from get_or_create(): defaults= is applied during BOTH creation and updates. This makes it a true upsert. Common in webhook handlers, data imports, and sync jobs where you don't know if the record already exists.",
    tags: ["update_or_create", "upsert", "queryset", "intermediate"]
  },
  {
    id: "ex-030",
    title: "Find Products with No Category (isnull)",
    difficulty: "intermediate",
    topic: "isnull",
    category: "queries",
    description: "Find products that have not been assigned to any category.",
    schema: `from django.db import models

class Category(models.Model):
    name = models.CharField(max_length=100)

class Product(models.Model):
    name = models.CharField(max_length=200)
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='products'
    )`,
    sampleData: `cat = Category.objects.create(name='Electronics')
Product.objects.create(name='Laptop', category=cat)
Product.objects.create(name='Orphan Product 1', category=None)
Product.objects.create(name='Orphan Product 2', category=None)`,
    problemStatement: "Find all products that have no category assigned (category is NULL).",
    expectedResult: "2 products: 'Orphan Product 1' and 'Orphan Product 2'.",
    hints: [
      "Use __isnull=True to find NULL foreign keys.",
      "Also try finding products WITH a category using isnull=False."
    ],
    solution: `# Products with no category
uncategorized = Product.objects.filter(category__isnull=True)

# Products with a category
categorized = Product.objects.filter(category__isnull=False)`,
    alternativeSolutions: [
      `# Equivalent
uncategorized = Product.objects.filter(category=None)`,
      `# Find products in Electronics category
in_electronics = Product.objects.filter(category__name='Electronics')`
    ],
    explanation: "category__isnull=True generates WHERE category_id IS NULL. This is how you find rows where an optional ForeignKey is not set. Equivalent to filter(category=None).",
    tags: ["isnull", "null", "foreignkey", "filter", "queryset", "intermediate"]
  },

  // ============================================================
  // ADVANCED EXERCISES (31-40)
  // ============================================================
  {
    id: "ex-031",
    title: "Annotate Each Product with Latest Review Rating (Subquery)",
    difficulty: "advanced",
    topic: "subquery",
    category: "queries",
    description: "Annotate each product with the rating of its most recent review using a correlated Subquery.",
    schema: `from django.db import models

class Product(models.Model):
    name = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=8, decimal_places=2)

class Review(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    rating = models.IntegerField()  # 1-5
    created_at = models.DateTimeField(auto_now_add=True)`,
    sampleData: `laptop = Product.objects.create(name='Laptop', price=999)
Review.objects.create(product=laptop, rating=4)
Review.objects.create(product=laptop, rating=5)  # Latest
mouse = Product.objects.create(name='Mouse', price=29)
Review.objects.create(product=mouse, rating=3)  # Only review`,
    problemStatement: "Annotate each product with its most recent review's rating. Products with no reviews should have latest_rating=None.",
    expectedResult: "Laptop: latest_rating=5. Mouse: latest_rating=3.",
    hints: [
      "Use Subquery with OuterRef('pk') to correlate to each product.",
      "Use .order_by('-created_at').values('rating')[:1] to get the latest rating."
    ],
    solution: `from django.db.models import OuterRef, Subquery

latest_review = Review.objects.filter(
    product=OuterRef('pk')
).order_by('-created_at').values('rating')[:1]

products = Product.objects.annotate(
    latest_rating=Subquery(latest_review)
)

for p in products:
    print(f"{p.name}: latest_rating={p.latest_rating}")`,
    alternativeSolutions: [
      `# Alternative: prefetch + Python
products = Product.objects.prefetch_related('reviews')
for p in products:
    latest = p.reviews.order_by('-created_at').first()
    rating = latest.rating if latest else None
    print(f"{p.name}: {rating}")`
    ],
    explanation: "Subquery with OuterRef creates a correlated subquery: for each product row in the outer query, the subquery runs and returns the latest review's rating. The .values('rating')[:1] ensures the subquery returns exactly one column and at most one row.",
    tags: ["subquery", "outerref", "annotate", "correlated", "queryset", "advanced"]
  },
  {
    id: "ex-032",
    title: "Label Products by Stock Level (Case/When)",
    difficulty: "advanced",
    topic: "case-when",
    category: "queries",
    description: "Annotate each product with a stock level label using conditional logic.",
    schema: `from django.db import models

class Product(models.Model):
    name = models.CharField(max_length=200)
    stock = models.IntegerField(default=0)
    price = models.DecimalField(max_digits=8, decimal_places=2)`,
    sampleData: `Product.objects.create(name='Laptop', stock=0, price=999)
Product.objects.create(name='Mouse', stock=3, price=29)
Product.objects.create(name='Keyboard', stock=25, price=79)
Product.objects.create(name='Monitor', stock=150, price=299)`,
    problemStatement: "Annotate each product with a stock_label: 'Out of Stock' (0), 'Low Stock' (1-5), 'In Stock' (6-99), 'Overstocked' (100+). Order by stock label priority.",
    expectedResult: "Each product has a stock_label attribute.",
    hints: [
      "Use Case with multiple When conditions.",
      "When conditions are checked in order — first match wins.",
      "Specify output_field=CharField()."
    ],
    solution: `from django.db.models import Case, When, Value, CharField, IntegerField

products = Product.objects.annotate(
    stock_label=Case(
        When(stock=0, then=Value('Out of Stock')),
        When(stock__lte=5, then=Value('Low Stock')),
        When(stock__lt=100, then=Value('In Stock')),
        default=Value('Overstocked'),
        output_field=CharField()
    ),
    sort_priority=Case(
        When(stock=0, then=Value(1)),
        When(stock__lte=5, then=Value(2)),
        When(stock__lt=100, then=Value(3)),
        default=Value(4),
        output_field=IntegerField()
    )
).order_by('sort_priority', 'name')

for p in products:
    print(f"{p.name} (stock={p.stock}): {p.stock_label}")`,
    alternativeSolutions: [
      `# Case/When in update — apply different prices based on stock
from django.db.models import F
Product.objects.update(
    price=Case(
        When(stock=0, then=F('price') * 0),  # Free clearance
        When(stock__lte=5, then=F('price') * 0.7),
        default=F('price'),
        output_field=DecimalField(max_digits=8, decimal_places=2)
    )
)`
    ],
    explanation: "Case/When generates SQL CASE WHEN ... THEN ... ELSE ... END. Conditions in When() are ANDed. The first matching When returns its then value. output_field tells Django what Python type the result is. This can also be used in update() for conditional bulk updates.",
    tags: ["case", "when", "conditional", "annotate", "queryset", "advanced"]
  },
  {
    id: "ex-033",
    title: "Complex Q Objects: Published OR Featured, NOT Archived",
    difficulty: "advanced",
    topic: "complex-q",
    category: "queries",
    description: "Build a complex filter combining AND, OR, and NOT conditions using Q objects.",
    schema: `from django.db import models

class Article(models.Model):
    title = models.CharField(max_length=200)
    status = models.CharField(max_length=20, default='draft')
    is_featured = models.BooleanField(default=False)
    author = models.ForeignKey('auth.User', on_delete=models.CASCADE)
    views = models.PositiveIntegerField(default=0)`,
    sampleData: `# status can be: 'published', 'draft', 'featured', 'archived'
Article.objects.create(title='Published Article', status='published', is_featured=False)
Article.objects.create(title='Featured Article', status='published', is_featured=True)
Article.objects.create(title='Archived Article', status='archived', is_featured=True)
Article.objects.create(title='Draft Article', status='draft', is_featured=False)`,
    problemStatement: "Find articles that: (are published OR is_featured=True) AND are NOT archived AND have at least 10 views.",
    expectedResult: "Only 'Featured Article' (published, featured, not archived — but views=0 so none match with default data).",
    hints: [
      "Combine Q objects with | for OR, & for AND, ~ for NOT.",
      "Chain Q and keyword args carefully."
    ],
    solution: `from django.db.models import Q

articles = Article.objects.filter(
    (Q(status='published') | Q(is_featured=True)) &
    ~Q(status='archived') &
    Q(views__gte=10)
)

# Dynamically building the query
base_q = Q(status='published') | Q(is_featured=True)
exclude_archived = ~Q(status='archived')
min_views = Q(views__gte=10)

articles = Article.objects.filter(base_q & exclude_archived & min_views)`,
    alternativeSolutions: [
      `articles = Article.objects.filter(
    Q(status='published') | Q(is_featured=True),
    views__gte=10
).exclude(status='archived')`
    ],
    explanation: "Q objects support Python's bitwise operators: | (OR), & (AND), ~ (NOT). They can be combined and nested. Separating Q objects into named variables improves readability for complex filters. The exclude() alternative is often more readable than ~Q().",
    tags: ["q-objects", "or", "not", "and", "complex-filter", "queryset", "advanced"]
  },
  {
    id: "ex-034",
    title: "Latest Order Per Customer (Subquery + OuterRef)",
    difficulty: "advanced",
    topic: "subquery-annotate",
    category: "queries",
    description: "Annotate each customer with the date of their most recent order.",
    schema: `from django.db import models

class Customer(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField()

class Order(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='orders')
    total = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)`,
    sampleData: `alice = Customer.objects.create(name='Alice', email='alice@example.com')
bob = Customer.objects.create(name='Bob', email='bob@example.com')
ghost = Customer.objects.create(name='Ghost', email='ghost@example.com')
Order.objects.create(customer=alice, total=100)
Order.objects.create(customer=alice, total=200)
Order.objects.create(customer=bob, total=50)`,
    problemStatement: "Annotate each customer with their most recent order date. Customers with no orders should have last_order_date=None.",
    expectedResult: "Alice: recent date. Bob: recent date. Ghost: None.",
    hints: [
      "Use Subquery with OuterRef('pk').",
      "Filter Order by customer=OuterRef('pk'), order by -created_at, take first."
    ],
    solution: `from django.db.models import OuterRef, Subquery

latest_order = Order.objects.filter(
    customer=OuterRef('pk')
).order_by('-created_at').values('created_at')[:1]

customers = Customer.objects.annotate(
    last_order_date=Subquery(latest_order)
).order_by(F('last_order_date').desc(nulls_last=True))

for c in customers:
    print(f"{c.name}: last order = {c.last_order_date}")`,
    alternativeSolutions: [
      `from django.db.models import Max
# Simpler but returns the max date, not the date of the latest order
customers = Customer.objects.annotate(
    last_order_date=Max('orders__created_at')
)`
    ],
    explanation: "Max('orders__created_at') is simpler and equivalent for dates. The Subquery approach is needed when you want other fields from the latest row (like order total). Both generate efficient SQL — Max uses GROUP BY, Subquery uses a correlated subquery.",
    tags: ["subquery", "outerref", "annotate", "latest", "queryset", "advanced"]
  },
  {
    id: "ex-035",
    title: "Filter Products With Approved Reviews Using Exists()",
    difficulty: "advanced",
    topic: "exists-expression",
    category: "queries",
    description: "Find products that have at least one approved review using the Exists() expression.",
    schema: `from django.db import models

class Product(models.Model):
    name = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=8, decimal_places=2)

class Review(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    rating = models.IntegerField()
    approved = models.BooleanField(default=False)`,
    sampleData: `laptop = Product.objects.create(name='Laptop', price=999)
mouse = Product.objects.create(name='Mouse', price=29)
keyboard = Product.objects.create(name='Keyboard', price=79)
Review.objects.create(product=laptop, rating=5, approved=True)
Review.objects.create(product=laptop, rating=3, approved=False)
Review.objects.create(product=mouse, rating=4, approved=False)
# Keyboard has no reviews`,
    problemStatement: "Find products that have at least one approved review. Also annotate all products with a has_approved_reviews boolean.",
    expectedResult: "Only Laptop has an approved review. Mouse has reviews but none approved. Keyboard has no reviews.",
    hints: [
      "Use Exists() with OuterRef('pk') in filter().",
      "Use Exists() in annotate() for the boolean flag."
    ],
    solution: `from django.db.models import Exists, OuterRef

approved_reviews = Review.objects.filter(
    product=OuterRef('pk'),
    approved=True
)

# Filter to only products with approved reviews
with_approved = Product.objects.filter(Exists(approved_reviews))

# Annotate all products with boolean
products = Product.objects.annotate(
    has_approved_reviews=Exists(approved_reviews)
)

for p in products:
    print(f"{p.name}: has_approved_reviews={p.has_approved_reviews}")`,
    alternativeSolutions: [
      `# Less efficient — uses COUNT
from django.db.models import Count
products = Product.objects.annotate(
    approved_count=Count('reviews', filter=Q(reviews__approved=True))
).filter(approved_count__gt=0)`,
      `# Simple join-based (less efficient on large datasets)
Product.objects.filter(reviews__approved=True).distinct()`
    ],
    explanation: "Exists() generates SQL EXISTS (...) which stops at the first matching row — most efficient for boolean existence checks. Annotating with Exists() adds a True/False attribute to each product. Much faster than Count() which counts all matching rows.",
    tags: ["exists", "outerref", "filter", "annotate", "queryset", "advanced"]
  },
  {
    id: "ex-036",
    title: "Atomic Order Creation with select_for_update",
    difficulty: "advanced",
    topic: "transaction",
    category: "queries",
    description: "Create an order atomically, locking the product row to prevent overselling.",
    schema: `from django.db import models

class Product(models.Model):
    name = models.CharField(max_length=200)
    stock = models.IntegerField(default=0)
    price = models.DecimalField(max_digits=8, decimal_places=2)

class Order(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.IntegerField()
    total = models.DecimalField(max_digits=10, decimal_places=2)`,
    sampleData: `Product.objects.create(name='Laptop', stock=5, price=999.99)`,
    problemStatement: "Create an order for 3 laptops. Lock the product row first to prevent another request from also selling the same stock. Raise an error if insufficient stock.",
    expectedResult: "Order created. Product stock reduced from 5 to 2. Under concurrent load, no overselling occurs.",
    hints: [
      "Use transaction.atomic() to wrap the operation.",
      "Use select_for_update() to lock the product row.",
      "Check stock AFTER locking."
    ],
    solution: `from django.db import transaction

def purchase_product(product_id, quantity):
    with transaction.atomic():
        # Lock the product row — other transactions wait here
        product = Product.objects.select_for_update().get(pk=product_id)

        if product.stock < quantity:
            raise ValueError(
                f"Only {product.stock} units available, requested {quantity}"
            )

        # Safe to reduce stock — we have the lock
        product.stock -= quantity
        product.save(update_fields=['stock'])

        order = Order.objects.create(
            product=product,
            quantity=quantity,
            total=product.price * quantity
        )
        return order

# Call it
order = purchase_product(product_id=1, quantity=3)
print(f"Order #{order.pk} created — remaining stock: {Product.objects.get(pk=1).stock}")`,
    alternativeSolutions: [
      `# Using F expression (no select_for_update needed for simple decrements)
from django.db.models import F
with transaction.atomic():
    updated = Product.objects.filter(pk=1, stock__gte=3).update(stock=F('stock') - 3)
    if not updated:
        raise ValueError("Insufficient stock")
    order = Order.objects.create(product_id=1, quantity=3, total=2999.97)`
    ],
    explanation: "select_for_update() adds FOR UPDATE to the SELECT — the database locks those rows until the transaction ends. Other transactions trying to SELECT FOR UPDATE the same rows must wait. This prevents two requests from both reading stock=5 and both subtracting 3 (ending with stock=2 instead of stock=-1).",
    tags: ["transaction", "atomic", "select_for_update", "locking", "queryset", "advanced"]
  },
  {
    id: "ex-037",
    title: "Combine Two QuerySets with union()",
    difficulty: "advanced",
    topic: "union",
    category: "queries",
    description: "Create a combined feed of published articles and featured articles, deduplicating and ordering by date.",
    schema: `from django.db import models

class Article(models.Model):
    title = models.CharField(max_length=200)
    status = models.CharField(max_length=20, default='draft')
    is_featured = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)`,
    sampleData: `Article.objects.create(title='Published Only', status='published', is_featured=False)
Article.objects.create(title='Published and Featured', status='published', is_featured=True)
Article.objects.create(title='Featured Not Published', status='draft', is_featured=True)`,
    problemStatement: "Get a deduplicated union of published articles and featured articles, ordered by newest first.",
    expectedResult: "3 unique articles (union of both sets, deduplicated), ordered by created_at desc.",
    hints: [
      "Use .union() to combine two QuerySets.",
      "Apply .order_by() after union().",
      "Filter before union, not after."
    ],
    solution: `published = Article.objects.filter(status='published')
featured = Article.objects.filter(is_featured=True)

# Combine and deduplicate
combined = published.union(featured).order_by('-created_at')

for article in combined:
    print(article.title)`,
    alternativeSolutions: [
      `# Q objects alternative — often simpler
from django.db.models import Q
combined = Article.objects.filter(
    Q(status='published') | Q(is_featured=True)
).order_by('-created_at')`,
      `# Union All — keeps duplicates
combined_with_dupes = published.union(featured, all=True)`
    ],
    explanation: "union() creates SQL UNION which deduplicates by default. UNION ALL (all=True) keeps duplicates. After union(), you can only use order_by(), values(), values_list(), only(), and defer(). For simple OR on the same model, Q objects are usually cleaner.",
    tags: ["union", "set-operations", "queryset", "advanced"]
  },
  {
    id: "ex-038",
    title: "Complex Annotate + Aggregate + Filter Chain",
    difficulty: "advanced",
    topic: "annotate-aggregate",
    category: "queries",
    description: "Find product categories where average product price is above $100 and total stock exceeds 500 units.",
    schema: `from django.db import models

class Category(models.Model):
    name = models.CharField(max_length=100)

class Product(models.Model):
    name = models.CharField(max_length=200)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='products')
    price = models.DecimalField(max_digits=8, decimal_places=2)
    stock = models.IntegerField(default=0)`,
    sampleData: `electronics = Category.objects.create(name='Electronics')
books = Category.objects.create(name='Books')
Product.objects.create(name='Laptop', category=electronics, price=999, stock=300)
Product.objects.create(name='Phone', category=electronics, price=699, stock=400)
Product.objects.create(name='Python Book', category=books, price=39, stock=50)
Product.objects.create(name='Django Book', category=books, price=49, stock=75)`,
    problemStatement: "Find categories where the average product price > $100 AND total stock > 500 units.",
    expectedResult: "Only 'Electronics' (avg price ~$849, total stock 700).",
    hints: [
      "Use values('name') to group by category, then annotate.",
      "Filter on the annotations after annotate()."
    ],
    solution: `from django.db.models import Avg, Sum, Count

categories = (
    Category.objects
    .annotate(
        product_count=Count('products'),
        avg_price=Avg('products__price'),
        total_stock=Sum('products__stock')
    )
    .filter(
        avg_price__gt=100,
        total_stock__gt=500
    )
    .order_by('-avg_price')
)

for cat in categories:
    print(
        f"{cat.name}: {cat.product_count} products, "
        f"avg \${cat.avg_price}, "
        f"total stock {cat.total_stock}"
    )`,
    alternativeSolutions: [
      `# Alternative: go through Product, group by category
from django.db.models import Avg, Sum
Product.objects.values('category__name').annotate(
    avg_price=Avg('price'),
    total_stock=Sum('stock')
).filter(avg_price__gt=100, total_stock__gt=500)`
    ],
    explanation: "annotate() adds per-category aggregations (Avg, Sum, Count). Filtering AFTER annotate() on annotation values generates a SQL HAVING clause. This is the equivalent of GROUP BY category ... HAVING AVG(price) > 100 AND SUM(stock) > 500.",
    tags: ["annotate", "aggregate", "having", "group-by", "filter", "queryset", "advanced"]
  },
  {
    id: "ex-039",
    title: "Prefetch Related with Custom Prefetch Object",
    difficulty: "advanced",
    topic: "prefetch-custom",
    category: "queries",
    description: "Prefetch only approved, recent reviews for each product using a custom Prefetch object.",
    schema: `from django.db import models

class Product(models.Model):
    name = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=8, decimal_places=2)

class Review(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    rating = models.IntegerField()
    approved = models.BooleanField(default=False)
    author_name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)`,
    sampleData: `laptop = Product.objects.create(name='Laptop', price=999)
mouse = Product.objects.create(name='Mouse', price=29)
Review.objects.create(product=laptop, rating=5, approved=True, author_name='Alice')
Review.objects.create(product=laptop, rating=2, approved=False, author_name='SpamBot')
Review.objects.create(product=laptop, rating=4, approved=True, author_name='Bob')
Review.objects.create(product=mouse, rating=3, approved=True, author_name='Charlie')`,
    problemStatement: "Fetch all products with their approved reviews (ordered by newest first), stored as 'approved_reviews' attribute — 2 total queries, not N+1.",
    expectedResult: "Each product has .approved_reviews list. Laptop has 2 approved reviews. Mouse has 1.",
    hints: [
      "Use Prefetch() with queryset= to filter and order prefetched data.",
      "Use to_attr= to store the prefetched list under a custom attribute name."
    ],
    solution: `from django.db.models import Prefetch

approved_reviews_qs = Review.objects.filter(
    approved=True
).order_by('-created_at')

products = Product.objects.prefetch_related(
    Prefetch(
        'reviews',
        queryset=approved_reviews_qs,
        to_attr='approved_reviews'    # Stored as list, not Manager
    )
)

for product in products:
    # product.approved_reviews is a plain Python list
    print(f"\\n{product.name} ({len(product.approved_reviews)} approved reviews):")
    for review in product.approved_reviews:
        print(f"  {review.author_name}: {review.rating}/5")`,
    alternativeSolutions: [
      `# Without to_attr — still filtered, but accessed via .reviews.all()
products = Product.objects.prefetch_related(
    Prefetch('reviews', queryset=Review.objects.filter(approved=True).order_by('-created_at'))
)
# Must still use .reviews.all() to access (filter on manager is ignored)`
    ],
    explanation: "Prefetch(to_attr='approved_reviews') stores the prefetched result as a plain list attribute on each product — not a Manager. This means you access it as product.approved_reviews (no .all() call) and can use len() directly. The queryset= parameter filters and orders the prefetched data.",
    tags: ["prefetch_related", "prefetch", "to_attr", "performance", "queryset", "advanced"]
  },
  {
    id: "ex-040",
    title: "On-Commit Email After Transaction",
    difficulty: "advanced",
    topic: "on-commit",
    category: "queries",
    description: "Create an order in a transaction and send a confirmation email only after the transaction successfully commits.",
    schema: `from django.db import models

class Customer(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField()

class Order(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, default='pending')`,
    sampleData: `Customer.objects.create(name='Alice', email='alice@example.com')`,
    problemStatement: "Create an order inside a transaction. After the transaction commits (not before), trigger a confirmation email. Ensure the email is NOT sent if the transaction rolls back.",
    expectedResult: "Order created. Email triggered via on_commit. If an exception is raised inside atomic(), no email is sent.",
    hints: [
      "Use transaction.on_commit() inside the atomic() block.",
      "on_commit() callbacks run AFTER the transaction commits, not during.",
      "Use a lambda to capture the order pk."
    ],
    solution: `from django.db import transaction

def send_order_confirmation(order_id):
    # In production, this would be a Celery task
    print(f"[EMAIL] Sending order confirmation for Order #{order_id}")

def create_order(customer_id, total):
    with transaction.atomic():
        customer = Customer.objects.get(pk=customer_id)

        order = Order.objects.create(
            customer=customer,
            total=total,
            status='pending'
        )

        # This callback runs ONLY if the transaction commits
        # If an exception causes a rollback, this is discarded
        transaction.on_commit(
            lambda: send_order_confirmation(order.pk)
        )

        # Simulate a potential error:
        # raise ValueError("Something went wrong")
        # If uncommenting above, the email is NOT sent

    return order  # Returned after successful commit

order = create_order(customer_id=1, total=99.99)
print(f"Order #{order.pk} created successfully")`,
    alternativeSolutions: [
      `# Using a named function instead of lambda
def create_order(customer_id, total):
    with transaction.atomic():
        order = Order.objects.create(customer_id=customer_id, total=total)

        def notify():
            send_order_confirmation(order.pk)

        transaction.on_commit(notify)
    return order`
    ],
    explanation: "transaction.on_commit() registers a callback that runs after the transaction successfully commits to the database. If the transaction rolls back (due to an exception or explicit rollback), the callback is discarded and never runs. This is critical for sending emails, triggering Celery tasks, or publishing events — you don't want side effects when the data was never actually saved.",
    tags: ["transaction", "on_commit", "atomic", "email", "queryset", "advanced"]
  },

  // ============================================================
  // BEGINNER EXERCISES (41-085)
  // ============================================================
  {
    id: "ex-041",
    title: "Filter Books by Exact Price",
    difficulty: "beginner",
    topic: "filter",
    category: "queries",
    description: "Find all books priced at exactly $29.99.",
    schema: `from django.db import models

class Book(models.Model):
    title = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=8, decimal_places=2)`,
    sampleData: `Book.objects.create(title='Django for Beginners', price=29.99)
Book.objects.create(title='Two Scoops of Django', price=39.99)
Book.objects.create(title='Python Crash Course', price=29.99)`,
    problemStatement: "Find all books where the price is exactly 29.99.",
    expectedResult: "QuerySet with 2 books: 'Django for Beginners' and 'Python Crash Course'.",
    hints: [
      "Use filter() with the exact field value.",
      "Decimal comparisons work just like integer comparisons in Django ORM."
    ],
    solution: `Book.objects.filter(price=29.99)`,
    alternativeSolutions: [
      `Book.objects.filter(price__exact=29.99)`,
      `from decimal import Decimal\nBook.objects.filter(price=Decimal('29.99'))`
    ],
    explanation: "filter(price=29.99) uses the implicit __exact lookup, generating WHERE price = 29.99. When comparing Decimal fields it is safest to use the Decimal type or a string to avoid floating-point precision issues, though Django handles this transparently for most databases.",
    tags: ["filter", "exact", "decimal", "queryset", "beginner"]
  },
  {
    id: "ex-042",
    title: "Sort Authors by Name Descending",
    difficulty: "beginner",
    topic: "ordering",
    category: "queries",
    description: "Get all authors sorted alphabetically in reverse (Z to A).",
    schema: `from django.db import models

class Author(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField()`,
    sampleData: `Author.objects.create(name='Alice Walker', email='alice@example.com')
Author.objects.create(name='George Orwell', email='george@example.com')
Author.objects.create(name='Frank Herbert', email='frank@example.com')`,
    problemStatement: "Retrieve all authors ordered by name descending (Z to A).",
    expectedResult: "QuerySet ordered: George Orwell, Frank Herbert, Alice Walker.",
    hints: [
      "Use order_by() with a field name.",
      "Prefix the field name with '-' for descending order."
    ],
    solution: `Author.objects.order_by('-name')`,
    alternativeSolutions: [
      `from django.db.models import F\nAuthor.objects.order_by(F('name').desc())`,
      `Author.objects.all().order_by('-name')`
    ],
    explanation: "order_by('-name') adds ORDER BY name DESC to the SQL query. The minus prefix is Django's shorthand for descending. F('name').desc() is the explicit alternative and also supports nulls_first/nulls_last parameters.",
    tags: ["ordering", "order_by", "descending", "queryset", "beginner"]
  },
  {
    id: "ex-043",
    title: "Get Books Published in 2023",
    difficulty: "beginner",
    topic: "filter",
    category: "queries",
    description: "Retrieve all books published in the year 2023.",
    schema: `from django.db import models

class Book(models.Model):
    title = models.CharField(max_length=200)
    published_year = models.IntegerField()
    price = models.DecimalField(max_digits=8, decimal_places=2)`,
    sampleData: `Book.objects.create(title='Django 4 by Example', published_year=2023, price=49.99)
Book.objects.create(title='Fluent Python', published_year=2022, price=59.99)
Book.objects.create(title='Python for Data', published_year=2023, price=44.99)`,
    problemStatement: "Get all books where published_year equals 2023.",
    expectedResult: "2 books: 'Django 4 by Example' and 'Python for Data'.",
    hints: [
      "Use filter() with published_year=2023.",
      "Integer fields use simple equality comparison."
    ],
    solution: `Book.objects.filter(published_year=2023)`,
    alternativeSolutions: [
      `Book.objects.filter(published_year__exact=2023)`,
      `Book.objects.filter(published_year__gte=2023, published_year__lte=2023)`
    ],
    explanation: "filter(published_year=2023) generates WHERE published_year = 2023. For DateField or DateTimeField you could also use __year=2023, but with an IntegerField storing the year, direct equality is the correct approach.",
    tags: ["filter", "integer", "year", "queryset", "beginner"]
  },
  {
    id: "ex-044",
    title: "Count Total Number of Products",
    difficulty: "beginner",
    topic: "count",
    category: "queries",
    description: "Get the total count of all products in the database.",
    schema: `from django.db import models

class Product(models.Model):
    name = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    stock = models.IntegerField(default=0)`,
    sampleData: `Product.objects.create(name='Laptop', price=999.99, stock=10)
Product.objects.create(name='Mouse', price=29.99, stock=100)
Product.objects.create(name='Keyboard', price=79.99, stock=50)
Product.objects.create(name='Monitor', price=299.99, stock=25)`,
    problemStatement: "Count the total number of products in the database without fetching them.",
    expectedResult: "4",
    hints: [
      "count() returns an integer, not a QuerySet.",
      "It runs SELECT COUNT(*) — very efficient."
    ],
    solution: `total = Product.objects.count()
print(total)  # 4`,
    alternativeSolutions: [
      `from django.db.models import Count\nProduct.objects.aggregate(total=Count('id'))['total']`,
      `len(Product.objects.all())  # Less efficient — fetches all rows`
    ],
    explanation: "count() generates SELECT COUNT(*) FROM product, which is handled at the database level without fetching any rows into Python memory. Always prefer count() over len() on a QuerySet for large tables.",
    tags: ["count", "aggregate", "queryset", "beginner"]
  },
  {
    id: "ex-045",
    title: "Get First 5 Books by Price Ascending",
    difficulty: "beginner",
    topic: "slicing",
    category: "queries",
    description: "Retrieve the 5 cheapest books using QuerySet slicing.",
    schema: `from django.db import models

class Book(models.Model):
    title = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=8, decimal_places=2)`,
    sampleData: `Book.objects.create(title='Book A', price=9.99)
Book.objects.create(title='Book B', price=19.99)
Book.objects.create(title='Book C', price=14.99)
Book.objects.create(title='Book D', price=4.99)
Book.objects.create(title='Book E', price=24.99)
Book.objects.create(title='Book F', price=12.99)`,
    problemStatement: "Get the 5 cheapest books, ordered by price ascending.",
    expectedResult: "5 books ordered: Book D (4.99), Book A (9.99), Book F (12.99), Book C (14.99), Book B (19.99).",
    hints: [
      "order_by('price') sorts ascending.",
      "Use Python slice [:5] to limit results — this adds LIMIT 5 to SQL."
    ],
    solution: `books = Book.objects.order_by('price')[:5]`,
    alternativeSolutions: [
      `books = Book.objects.order_by('price')[0:5]`,
      `# Using iterator for memory efficiency on large sets\nbooks = list(Book.objects.order_by('price')[:5])`
    ],
    explanation: "Slicing a QuerySet translates to SQL LIMIT and OFFSET. [:5] becomes LIMIT 5. [5:10] becomes LIMIT 5 OFFSET 5. QuerySet slicing does NOT support negative indexing. The slice is applied at the database level — only 5 rows are fetched.",
    tags: ["slicing", "limit", "ordering", "queryset", "beginner"]
  },
  {
    id: "ex-046",
    title: "Get Last 3 Orders",
    difficulty: "beginner",
    topic: "slicing",
    category: "queries",
    description: "Retrieve the 3 most recently created orders.",
    schema: `from django.db import models

class Order(models.Model):
    total = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)`,
    sampleData: `from django.utils import timezone
from datetime import timedelta
now = timezone.now()
Order.objects.create(total=50.00, created_at=now - timedelta(days=5))
Order.objects.create(total=120.00, created_at=now - timedelta(days=3))
Order.objects.create(total=75.00, created_at=now - timedelta(days=2))
Order.objects.create(total=200.00, created_at=now - timedelta(days=1))`,
    problemStatement: "Retrieve the 3 most recently created orders.",
    expectedResult: "The 3 orders from days -1, -2, and -3 ago.",
    hints: [
      "Order by '-created_at' to get newest first.",
      "Slice [:3] to get only the first 3 results."
    ],
    solution: `orders = Order.objects.order_by('-created_at')[:3]`,
    alternativeSolutions: [
      `# Using last() is not right here — it only returns 1 object\norders = Order.objects.order_by('created_at').reverse()[:3]`,
      `orders = Order.objects.all().order_by('-created_at')[:3]`
    ],
    explanation: "order_by('-created_at') sorts newest first. Slicing with [:3] adds LIMIT 3 to the SQL. This is the standard pattern for 'most recent N records'. reverse() on a QuerySet reverses the default ordering but requires a default ordering to be set.",
    tags: ["slicing", "ordering", "limit", "queryset", "beginner"]
  },
  {
    id: "ex-047",
    title: "Check If Any Product Is Out of Stock",
    difficulty: "beginner",
    topic: "exists",
    category: "queries",
    description: "Check whether any product has zero stock.",
    schema: `from django.db import models

class Product(models.Model):
    name = models.CharField(max_length=200)
    stock = models.IntegerField(default=0)`,
    sampleData: `Product.objects.create(name='Laptop', stock=5)
Product.objects.create(name='Mouse', stock=0)
Product.objects.create(name='Keyboard', stock=12)`,
    problemStatement: "Check if there is at least one product with stock equal to 0. Return True or False.",
    expectedResult: "True (Mouse has stock=0).",
    hints: [
      "Use exists() for a True/False check.",
      "exists() is more efficient than count() > 0 for boolean checks."
    ],
    solution: `has_out_of_stock = Product.objects.filter(stock=0).exists()
print(has_out_of_stock)  # True`,
    alternativeSolutions: [
      `has_out_of_stock = Product.objects.filter(stock__lte=0).exists()`,
      `# Less efficient\nhas_out_of_stock = Product.objects.filter(stock=0).count() > 0`
    ],
    explanation: "exists() generates SELECT (1) AS a FROM product WHERE stock = 0 LIMIT 1. It returns True as soon as it finds one matching row — it never counts all matches. For boolean checks, always prefer exists() over count() > 0.",
    tags: ["exists", "filter", "boolean", "queryset", "beginner"]
  },
  {
    id: "ex-048",
    title: "Get All Distinct Category Names",
    difficulty: "beginner",
    topic: "distinct",
    category: "queries",
    description: "Get a unique list of category names stored directly on products.",
    schema: `from django.db import models

class Product(models.Model):
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=100)`,
    sampleData: `Product.objects.create(name='Laptop', category='Electronics')
Product.objects.create(name='Phone', category='Electronics')
Product.objects.create(name='T-Shirt', category='Clothing')
Product.objects.create(name='Novel', category='Books')`,
    problemStatement: "Get a sorted list of distinct category names from all products.",
    expectedResult: "['Books', 'Clothing', 'Electronics']",
    hints: [
      "Use values_list() to extract a single field.",
      "Chain .distinct() to remove duplicates."
    ],
    solution: `categories = list(
    Product.objects.values_list('category', flat=True).distinct().order_by('category')
)`,
    alternativeSolutions: [
      `categories = Product.objects.values('category').distinct().order_by('category')`,
      `# Python-side dedup (less efficient)\ncategories = sorted(set(Product.objects.values_list('category', flat=True)))`
    ],
    explanation: "values_list('category', flat=True) returns a flat list of category strings. .distinct() adds SQL DISTINCT so duplicates are removed at the database level. Wrapping in list() evaluates the lazy QuerySet.",
    tags: ["distinct", "values_list", "flat", "queryset", "beginner"]
  },
  {
    id: "ex-049",
    title: "Get Books Whose Title Starts With 'The'",
    difficulty: "beginner",
    topic: "startswith",
    category: "queries",
    description: "Find all books whose title begins with the word 'The'.",
    schema: `from django.db import models

class Book(models.Model):
    title = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=8, decimal_places=2)`,
    sampleData: `Book.objects.create(title='The Pragmatic Programmer', price=49.99)
Book.objects.create(title='Clean Code', price=39.99)
Book.objects.create(title='The Clean Coder', price=34.99)
Book.objects.create(title='Refactoring', price=44.99)`,
    problemStatement: "Find all books whose title starts with 'The' (case-sensitive).",
    expectedResult: "2 books: 'The Pragmatic Programmer' and 'The Clean Coder'.",
    hints: [
      "Use __startswith for case-sensitive prefix matching.",
      "Use __istartswith for case-insensitive prefix matching."
    ],
    solution: `books = Book.objects.filter(title__startswith='The')`,
    alternativeSolutions: [
      `# Case-insensitive\nbooks = Book.objects.filter(title__istartswith='the')`,
      `# Using regex\nbooks = Book.objects.filter(title__regex=r'^The')`
    ],
    explanation: "__startswith generates WHERE title LIKE 'The%'. It uses a left-anchored pattern and can use a database index on the title column. __istartswith is case-insensitive and generates ILIKE 'the%' on PostgreSQL.",
    tags: ["startswith", "filter", "string", "queryset", "beginner"]
  },
  {
    id: "ex-050",
    title: "Get Orders Over $100",
    difficulty: "beginner",
    topic: "filter",
    category: "queries",
    description: "Find all orders where the total amount exceeds $100.",
    schema: `from django.db import models

class Order(models.Model):
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)`,
    sampleData: `Order.objects.create(total_amount=50.00, status='completed')
Order.objects.create(total_amount=150.00, status='pending')
Order.objects.create(total_amount=200.00, status='completed')
Order.objects.create(total_amount=99.99, status='pending')`,
    problemStatement: "Get all orders where total_amount is greater than 100.",
    expectedResult: "2 orders with totals 150.00 and 200.00.",
    hints: [
      "Use __gt for greater than.",
      "filter(total_amount__gt=100) maps to WHERE total_amount > 100."
    ],
    solution: `orders = Order.objects.filter(total_amount__gt=100)`,
    alternativeSolutions: [
      `orders = Order.objects.filter(total_amount__gte=100.01)`,
      `from decimal import Decimal\norders = Order.objects.filter(total_amount__gt=Decimal('100.00'))`
    ],
    explanation: "__gt (greater than) generates WHERE total_amount > 100. Related lookups: __gte (>=), __lt (<), __lte (<=). These work with any comparable field type including DecimalField, IntegerField, and DateField.",
    tags: ["filter", "gt", "decimal", "queryset", "beginner"]
  },
  {
    id: "ex-051",
    title: "Get All Active Customers",
    difficulty: "beginner",
    topic: "filter",
    category: "queries",
    description: "Retrieve all customers where is_active is True.",
    schema: `from django.db import models

class Customer(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField()
    is_active = models.BooleanField(default=True)
    joined_at = models.DateTimeField(auto_now_add=True)`,
    sampleData: `Customer.objects.create(name='Alice', email='alice@example.com', is_active=True)
Customer.objects.create(name='Bob', email='bob@example.com', is_active=False)
Customer.objects.create(name='Carol', email='carol@example.com', is_active=True)`,
    problemStatement: "Get all customers with is_active=True.",
    expectedResult: "2 customers: Alice and Carol.",
    hints: [
      "Filter on BooleanField with =True.",
      "exclude(is_active=False) is equivalent."
    ],
    solution: `active_customers = Customer.objects.filter(is_active=True)`,
    alternativeSolutions: [
      `active_customers = Customer.objects.exclude(is_active=False)`,
      `active_customers = Customer.objects.filter(is_active=True).order_by('name')`
    ],
    explanation: "filter(is_active=True) generates WHERE is_active = TRUE. BooleanField filters accept True/False/1/0. Using exclude(is_active=False) is semantically identical and slightly more readable in contexts where you're thinking about what to exclude rather than include.",
    tags: ["filter", "boolean", "queryset", "beginner"]
  },
  {
    id: "ex-052",
    title: "Get Employees in the Engineering Department",
    difficulty: "beginner",
    topic: "filter",
    category: "queries",
    description: "Retrieve all employees who belong to the Engineering department.",
    schema: `from django.db import models

class Department(models.Model):
    name = models.CharField(max_length=100)

class Employee(models.Model):
    name = models.CharField(max_length=100)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='employees')
    salary = models.DecimalField(max_digits=10, decimal_places=2)`,
    sampleData: `eng = Department.objects.create(name='Engineering')
mkt = Department.objects.create(name='Marketing')
Employee.objects.create(name='Alice', department=eng, salary=90000)
Employee.objects.create(name='Bob', department=mkt, salary=70000)
Employee.objects.create(name='Carol', department=eng, salary=95000)`,
    problemStatement: "Get all employees in the 'Engineering' department using FK traversal.",
    expectedResult: "2 employees: Alice and Carol.",
    hints: [
      "Use the double-underscore FK traversal: department__name.",
      "Or get the Department first and filter by it."
    ],
    solution: `employees = Employee.objects.filter(department__name='Engineering')`,
    alternativeSolutions: [
      `eng = Department.objects.get(name='Engineering')\nemployees = Employee.objects.filter(department=eng)`,
      `employees = Employee.objects.filter(department__name__iexact='engineering')`
    ],
    explanation: "department__name='Engineering' traverses the ForeignKey and generates a JOIN with a WHERE clause on the department name. This is more convenient than fetching the department object first, especially in filtered list views.",
    tags: ["filter", "foreignkey", "related-field", "queryset", "beginner"]
  },
  {
    id: "ex-053",
    title: "Get Books That Are Not Out of Print",
    difficulty: "beginner",
    topic: "filter",
    category: "queries",
    description: "Find all books where is_out_of_print is False.",
    schema: `from django.db import models

class Book(models.Model):
    title = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    is_out_of_print = models.BooleanField(default=False)`,
    sampleData: `Book.objects.create(title='Modern Django', price=39.99, is_out_of_print=False)
Book.objects.create(title='Old Django Book', price=9.99, is_out_of_print=True)
Book.objects.create(title='Python 3 Guide', price=29.99, is_out_of_print=False)`,
    problemStatement: "Get all books that are still in print (is_out_of_print=False).",
    expectedResult: "2 books: 'Modern Django' and 'Python 3 Guide'.",
    hints: [
      "filter(is_out_of_print=False) directly.",
      "Or use exclude(is_out_of_print=True)."
    ],
    solution: `books = Book.objects.filter(is_out_of_print=False)`,
    alternativeSolutions: [
      `books = Book.objects.exclude(is_out_of_print=True)`,
      `books = Book.objects.filter(is_out_of_print=False).order_by('title')`
    ],
    explanation: "Filtering on a BooleanField with =False generates WHERE is_out_of_print = FALSE. The exclude() alternative generates WHERE NOT (is_out_of_print = TRUE). Both produce the same SQL result for non-nullable BooleanFields.",
    tags: ["filter", "boolean", "exclude", "queryset", "beginner"]
  },
  {
    id: "ex-054",
    title: "Get the Most Expensive Book",
    difficulty: "beginner",
    topic: "aggregate",
    category: "queries",
    description: "Find the single most expensive book in the catalog.",
    schema: `from django.db import models

class Book(models.Model):
    title = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=8, decimal_places=2)`,
    sampleData: `Book.objects.create(title='Budget Book', price=9.99)
Book.objects.create(title='Mid Book', price=29.99)
Book.objects.create(title='Premium Book', price=99.99)`,
    problemStatement: "Get the Book instance with the highest price.",
    expectedResult: "Book instance with title='Premium Book', price=99.99.",
    hints: [
      "Order by '-price' and take the first result.",
      "Or use aggregate(Max('price')) to get just the value."
    ],
    solution: `# Get the actual book instance
most_expensive = Book.objects.order_by('-price').first()
print(most_expensive.title, most_expensive.price)`,
    alternativeSolutions: [
      `from django.db.models import Max\n# Get just the max price value\nmax_price = Book.objects.aggregate(max_price=Max('price'))['max_price']`,
      `# Using last() on ascending order\nmost_expensive = Book.objects.order_by('price').last()`
    ],
    explanation: "order_by('-price').first() generates ORDER BY price DESC LIMIT 1 — one row returned. aggregate(Max('price')) returns only the numeric value without the Book instance. Use the first approach when you need the full object, Max() when you only need the value for comparison or display.",
    tags: ["aggregate", "max", "ordering", "first", "queryset", "beginner"]
  },
  {
    id: "ex-055",
    title: "Get Products Priced Between $10 and $50",
    difficulty: "beginner",
    topic: "range-lookup",
    category: "queries",
    description: "Find all products in a specific price range using the __range lookup.",
    schema: `from django.db import models

class Product(models.Model):
    name = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=8, decimal_places=2)`,
    sampleData: `Product.objects.create(name='Cheap Item', price=5.00)
Product.objects.create(name='Budget Item', price=15.00)
Product.objects.create(name='Mid Item', price=35.00)
Product.objects.create(name='Expensive Item', price=75.00)`,
    problemStatement: "Find all products priced between $10 and $50 (inclusive).",
    expectedResult: "2 products: 'Budget Item' (15.00) and 'Mid Item' (35.00).",
    hints: [
      "Use __range=[low, high] for inclusive range filtering.",
      "Or combine __gte and __lte."
    ],
    solution: `products = Product.objects.filter(price__range=[10, 50])`,
    alternativeSolutions: [
      `products = Product.objects.filter(price__gte=10, price__lte=50)`,
      `from decimal import Decimal\nproducts = Product.objects.filter(price__range=[Decimal('10.00'), Decimal('50.00')])`
    ],
    explanation: "__range=[10, 50] generates WHERE price BETWEEN 10 AND 50. BETWEEN is inclusive on both ends. It is equivalent to price__gte=10, price__lte=50. __range works on any comparable field — numbers, dates, and datetimes.",
    tags: ["range", "filter", "between", "queryset", "beginner"]
  },
  {
    id: "ex-056",
    title: "Case-Insensitive Search for 'Python' in Title",
    difficulty: "beginner",
    topic: "icontains",
    category: "queries",
    description: "Find all books whose title contains 'Python', regardless of case.",
    schema: `from django.db import models

class Book(models.Model):
    title = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=8, decimal_places=2)`,
    sampleData: `Book.objects.create(title='Python Crash Course', price=29.99)
Book.objects.create(title='Learning python', price=34.99)
Book.objects.create(title='PYTHON DATA SCIENCE', price=44.99)
Book.objects.create(title='Django for Beginners', price=24.99)`,
    problemStatement: "Find all books whose title contains the word 'python' (case-insensitive).",
    expectedResult: "3 books: 'Python Crash Course', 'Learning python', 'PYTHON DATA SCIENCE'.",
    hints: [
      "Use __icontains for case-insensitive substring matching.",
      "__contains is case-sensitive."
    ],
    solution: `books = Book.objects.filter(title__icontains='python')`,
    alternativeSolutions: [
      `# Case-sensitive — misses 'Learning python' and 'PYTHON DATA SCIENCE'\nbooks = Book.objects.filter(title__contains='Python')`,
      `books = Book.objects.filter(title__iregex=r'python')`
    ],
    explanation: "__icontains generates UPPER(title) LIKE UPPER('%python%') or ILIKE '%python%' on PostgreSQL. It finds 'python' in any position, case-insensitively. Use __icontains for user-facing search fields where casing is unpredictable.",
    tags: ["icontains", "search", "filter", "case-insensitive", "queryset", "beginner"]
  },
  {
    id: "ex-057",
    title: "Get Orders Placed in January 2024",
    difficulty: "beginner",
    topic: "date-filter",
    category: "queries",
    description: "Retrieve all orders placed between Jan 1 and Jan 31, 2024.",
    schema: `from django.db import models

class Order(models.Model):
    total = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField()`,
    sampleData: `from datetime import datetime
import pytz
utc = pytz.UTC
Order.objects.create(total=100, created_at=datetime(2024, 1, 5, tzinfo=utc))
Order.objects.create(total=200, created_at=datetime(2024, 1, 28, tzinfo=utc))
Order.objects.create(total=150, created_at=datetime(2024, 2, 3, tzinfo=utc))`,
    problemStatement: "Get all orders created in January 2024.",
    expectedResult: "2 orders (Jan 5 and Jan 28).",
    hints: [
      "Use __year and __month lookups for DateTimeField.",
      "Or use __range with explicit start and end datetimes."
    ],
    solution: `orders = Order.objects.filter(created_at__year=2024, created_at__month=1)`,
    alternativeSolutions: [
      `from datetime import datetime
import pytz
start = datetime(2024, 1, 1, tzinfo=pytz.UTC)
end = datetime(2024, 1, 31, 23, 59, 59, tzinfo=pytz.UTC)
orders = Order.objects.filter(created_at__range=[start, end])`,
      `orders = Order.objects.filter(created_at__date__range=['2024-01-01', '2024-01-31'])`
    ],
    explanation: "Django's __year and __month transform lookups extract the year and month from a DateTimeField for comparison, generating EXTRACT(year FROM created_at) = 2024 AND EXTRACT(month FROM created_at) = 1. The __range approach is more explicit and can leverage date indexes.",
    tags: ["date-filter", "range", "year", "month", "queryset", "beginner"]
  },
  {
    id: "ex-058",
    title: "Get Customers With Gmail Addresses",
    difficulty: "beginner",
    topic: "endswith",
    category: "queries",
    description: "Find all customers whose email address ends with '@gmail.com'.",
    schema: `from django.db import models

class Customer(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField()`,
    sampleData: `Customer.objects.create(name='Alice', email='alice@gmail.com')
Customer.objects.create(name='Bob', email='bob@yahoo.com')
Customer.objects.create(name='Carol', email='carol@gmail.com')
Customer.objects.create(name='Dave', email='dave@company.com')`,
    problemStatement: "Find all customers whose email ends with '@gmail.com'.",
    expectedResult: "2 customers: Alice and Carol.",
    hints: [
      "Use __endswith for suffix matching.",
      "Use __iendswith for case-insensitive suffix matching."
    ],
    solution: `customers = Customer.objects.filter(email__endswith='@gmail.com')`,
    alternativeSolutions: [
      `customers = Customer.objects.filter(email__iendswith='@gmail.com')`,
      `customers = Customer.objects.filter(email__regex=r'@gmail\\.com$')`
    ],
    explanation: "__endswith generates WHERE email LIKE '%@gmail.com'. It anchors the pattern to the right side of the string. Use __iendswith if email casing may vary (e.g., '@Gmail.COM'). The regex alternative is more flexible but less readable.",
    tags: ["endswith", "filter", "email", "string", "queryset", "beginner"]
  },
  {
    id: "ex-059",
    title: "Get Products Where Stock Is Null",
    difficulty: "beginner",
    topic: "isnull",
    category: "queries",
    description: "Find products where the stock field has not been set (NULL).",
    schema: `from django.db import models

class Product(models.Model):
    name = models.CharField(max_length=200)
    stock = models.IntegerField(null=True, blank=True)`,
    sampleData: `Product.objects.create(name='Laptop', stock=10)
Product.objects.create(name='Untracked Item', stock=None)
Product.objects.create(name='Mouse', stock=50)
Product.objects.create(name='Unknown Stock', stock=None)`,
    problemStatement: "Find all products where the stock field is NULL.",
    expectedResult: "2 products: 'Untracked Item' and 'Unknown Stock'.",
    hints: [
      "Use __isnull=True to match NULL values.",
      "Never use == None in ORM — it won't work as expected."
    ],
    solution: `products = Product.objects.filter(stock__isnull=True)`,
    alternativeSolutions: [
      `# Equivalent\nproducts = Product.objects.filter(stock=None)`,
      `# Find products that DO have stock set\nproducts_with_stock = Product.objects.filter(stock__isnull=False)`
    ],
    explanation: "__isnull=True generates WHERE stock IS NULL. Never use stock=None to check for NULL via Python comparison — Django actually does handle filter(stock=None) as IS NULL, but __isnull is more explicit and makes the intent clear.",
    tags: ["isnull", "null", "filter", "queryset", "beginner"]
  },
  {
    id: "ex-060",
    title: "Get Employees Hired Before 2022",
    difficulty: "beginner",
    topic: "filter",
    category: "queries",
    description: "Find all employees who were hired before the year 2022.",
    schema: `from django.db import models

class Employee(models.Model):
    name = models.CharField(max_length=100)
    hired_at = models.DateField()
    salary = models.DecimalField(max_digits=10, decimal_places=2)`,
    sampleData: `from datetime import date
Employee.objects.create(name='Alice', hired_at=date(2019, 3, 15), salary=80000)
Employee.objects.create(name='Bob', hired_at=date(2022, 6, 1), salary=75000)
Employee.objects.create(name='Carol', hired_at=date(2020, 11, 20), salary=85000)`,
    problemStatement: "Get all employees hired before January 1, 2022.",
    expectedResult: "2 employees: Alice (2019) and Carol (2020).",
    hints: [
      "Use __lt with a date value.",
      "import date from datetime for the comparison value."
    ],
    solution: `from datetime import date

employees = Employee.objects.filter(hired_at__lt=date(2022, 1, 1))`,
    alternativeSolutions: [
      `employees = Employee.objects.filter(hired_at__year__lt=2022)`,
      `employees = Employee.objects.filter(hired_at__lt='2022-01-01')`
    ],
    explanation: "__lt=date(2022, 1, 1) generates WHERE hired_at < '2022-01-01'. Django accepts date strings ('2022-01-01'), date objects, and datetime objects for DateField comparisons. Using __year__lt=2022 uses a database EXTRACT function which may be slower on large tables without a functional index.",
    tags: ["filter", "date", "lt", "queryset", "beginner"]
  },
  {
    id: "ex-061",
    title: "Get Books With Page Count Between 200 and 500",
    difficulty: "beginner",
    topic: "range-lookup",
    category: "queries",
    description: "Find books with a page count in the range 200–500 using __range.",
    schema: `from django.db import models

class Book(models.Model):
    title = models.CharField(max_length=200)
    pages = models.IntegerField()`,
    sampleData: `Book.objects.create(title='Short Story', pages=120)
Book.objects.create(title='Medium Novel', pages=320)
Book.objects.create(title='Long Epic', pages=800)
Book.objects.create(title='Standard Guide', pages=450)`,
    problemStatement: "Find all books with pages between 200 and 500 inclusive.",
    expectedResult: "2 books: 'Medium Novel' (320) and 'Standard Guide' (450).",
    hints: [
      "Use __range=[200, 500] for inclusive range.",
      "Both endpoints are included with __range."
    ],
    solution: `books = Book.objects.filter(pages__range=[200, 500])`,
    alternativeSolutions: [
      `books = Book.objects.filter(pages__gte=200, pages__lte=500)`,
      `books = Book.objects.filter(pages__gte=200).filter(pages__lte=500)`
    ],
    explanation: "__range=[200, 500] maps to BETWEEN 200 AND 500, which is inclusive on both ends. Both alternatives using __gte and __lte produce identical SQL. Prefer __range when both bounds apply to the same field for readability.",
    tags: ["range", "filter", "integer", "queryset", "beginner"]
  },
  {
    id: "ex-062",
    title: "Get Orders With Status 'pending' or 'processing'",
    difficulty: "beginner",
    topic: "in-lookup",
    category: "queries",
    description: "Get all orders currently in a pending or processing state.",
    schema: `from django.db import models

class Order(models.Model):
    total = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20)`,
    sampleData: `Order.objects.create(total=50.00, status='pending')
Order.objects.create(total=120.00, status='processing')
Order.objects.create(total=75.00, status='completed')
Order.objects.create(total=200.00, status='cancelled')`,
    problemStatement: "Get all orders with status in ['pending', 'processing'].",
    expectedResult: "2 orders: the pending one and the processing one.",
    hints: [
      "Use __in with a list of allowed values.",
      "__in maps to SQL IN (...)."
    ],
    solution: `orders = Order.objects.filter(status__in=['pending', 'processing'])`,
    alternativeSolutions: [
      `from django.db.models import Q\norders = Order.objects.filter(Q(status='pending') | Q(status='processing'))`,
      `active_statuses = ['pending', 'processing']\norders = Order.objects.filter(status__in=active_statuses)`
    ],
    explanation: "__in=['pending', 'processing'] generates WHERE status IN ('pending', 'processing'). This is cleaner than multiple OR conditions when checking membership in a list. Storing the list in a variable makes it reusable.",
    tags: ["in", "filter", "status", "queryset", "beginner"]
  },
  {
    id: "ex-063",
    title: "Get Authors Where Bio Is Not Null",
    difficulty: "beginner",
    topic: "isnull",
    category: "queries",
    description: "Find all authors who have a bio filled in.",
    schema: `from django.db import models

class Author(models.Model):
    name = models.CharField(max_length=100)
    bio = models.TextField(null=True, blank=True)`,
    sampleData: `Author.objects.create(name='Alice', bio='Alice is a prolific writer.')
Author.objects.create(name='Bob', bio=None)
Author.objects.create(name='Carol', bio='Carol writes thrillers.')`,
    problemStatement: "Get all authors where bio is not null.",
    expectedResult: "2 authors: Alice and Carol.",
    hints: [
      "Use __isnull=False to exclude NULL values.",
      "You may also want to exclude empty strings."
    ],
    solution: `authors = Author.objects.filter(bio__isnull=False)`,
    alternativeSolutions: [
      `# Exclude both null and empty string\nauthors = Author.objects.exclude(bio__isnull=True).exclude(bio='')`,
      `authors = Author.objects.filter(bio__isnull=False).exclude(bio='')`
    ],
    explanation: "__isnull=False generates WHERE bio IS NOT NULL. Note that this does NOT exclude empty strings ('') — a field can be IS NOT NULL but still be an empty string. If both should be excluded, chain .exclude(bio='') after the filter.",
    tags: ["isnull", "null", "filter", "queryset", "beginner"]
  },
  {
    id: "ex-064",
    title: "Filter Products by Multiple Categories Using __in",
    difficulty: "beginner",
    topic: "in-lookup",
    category: "queries",
    description: "Get all products belonging to any of several specified categories.",
    schema: `from django.db import models

class Category(models.Model):
    name = models.CharField(max_length=100)

class Product(models.Model):
    name = models.CharField(max_length=200)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='products')`,
    sampleData: `electronics = Category.objects.create(name='Electronics')
clothing = Category.objects.create(name='Clothing')
books = Category.objects.create(name='Books')
food = Category.objects.create(name='Food')
Product.objects.create(name='Laptop', category=electronics)
Product.objects.create(name='T-Shirt', category=clothing)
Product.objects.create(name='Novel', category=books)
Product.objects.create(name='Apple', category=food)`,
    problemStatement: "Get all products in 'Electronics' or 'Books' categories.",
    expectedResult: "2 products: 'Laptop' and 'Novel'.",
    hints: [
      "Get the category QuerySet first, then use category__in.",
      "Or pass category names with category__name__in."
    ],
    solution: `# Using category names directly (no extra query for categories)
products = Product.objects.filter(category__name__in=['Electronics', 'Books'])`,
    alternativeSolutions: [
      `# Using category objects\ntarget_cats = Category.objects.filter(name__in=['Electronics', 'Books'])\nproducts = Product.objects.filter(category__in=target_cats)`,
      `# Using category pks\nproducts = Product.objects.filter(category_id__in=[1, 3])`
    ],
    explanation: "category__name__in traverses the FK and applies IN on the related field, generating a JOIN with WHERE category.name IN ('Electronics', 'Books'). Passing a QuerySet to __in is also efficient — Django uses a subquery or IN clause depending on the database.",
    tags: ["in", "filter", "foreignkey", "related-field", "queryset", "beginner"]
  },
  {
    id: "ex-065",
    title: "Get Blog Posts Published in the Last Week",
    difficulty: "beginner",
    topic: "date-filter",
    category: "queries",
    description: "Find blog posts published within the past 7 days.",
    schema: `from django.db import models

class BlogPost(models.Model):
    title = models.CharField(max_length=200)
    published_at = models.DateTimeField()
    status = models.CharField(max_length=20, default='draft')`,
    sampleData: `from django.utils import timezone
from datetime import timedelta
now = timezone.now()
BlogPost.objects.create(title='Old Post', published_at=now - timedelta(days=10), status='published')
BlogPost.objects.create(title='Recent Post', published_at=now - timedelta(days=3), status='published')
BlogPost.objects.create(title='Today Post', published_at=now - timedelta(hours=2), status='published')`,
    problemStatement: "Get all published blog posts from the last 7 days.",
    expectedResult: "2 posts: 'Recent Post' and 'Today Post'.",
    hints: [
      "Calculate 7 days ago using timezone.now() - timedelta(days=7).",
      "Filter with __gte on published_at."
    ],
    solution: `from django.utils import timezone
from datetime import timedelta

week_ago = timezone.now() - timedelta(days=7)
posts = BlogPost.objects.filter(
    status='published',
    published_at__gte=week_ago
).order_by('-published_at')`,
    alternativeSolutions: [
      `from django.utils.timezone import now\nfrom datetime import timedelta\nposts = BlogPost.objects.filter(published_at__gte=now() - timedelta(days=7))`,
      `# Using __date for day-level granularity\nfrom datetime import date, timedelta\nposts = BlogPost.objects.filter(published_at__date__gte=date.today() - timedelta(days=7))`
    ],
    explanation: "timezone.now() - timedelta(days=7) gives a timezone-aware datetime exactly 7 days ago. Filtering with __gte returns all posts since that moment. Always use timezone.now() (not datetime.now()) when USE_TZ=True to avoid naive/aware datetime mixing errors.",
    tags: ["date-filter", "gte", "timedelta", "queryset", "beginner"]
  },
  {
    id: "ex-066",
    title: "Create a New Author",
    difficulty: "beginner",
    topic: "create",
    category: "queries",
    description: "Create a new Author object with a name and email.",
    schema: `from django.db import models

class Author(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    bio = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)`,
    sampleData: `# No existing authors`,
    problemStatement: "Create a new author named 'Jane Doe' with email 'jane@example.com'.",
    expectedResult: "New Author instance saved to DB with pk populated.",
    hints: [
      "Author.objects.create() creates and saves in one step.",
      "It returns the new instance with pk set."
    ],
    solution: `author = Author.objects.create(
    name='Jane Doe',
    email='jane@example.com'
)
print(f"Created author with pk={author.pk}")`,
    alternativeSolutions: [
      `# Two-step create\nauthor = Author(name='Jane Doe', email='jane@example.com')\nauthor.save()\nprint(author.pk)`,
      `# With bio\nauthor = Author.objects.create(\n    name='Jane Doe',\n    email='jane@example.com',\n    bio='An award-winning novelist.'\n)`
    ],
    explanation: "create() runs INSERT INTO author (name, email, bio) VALUES (...) and returns the saved instance with the database-generated pk. The two-step Author(); save() approach is equivalent but useful when you need to set attributes conditionally before saving.",
    tags: ["create", "save", "insert", "queryset", "beginner"]
  },
  {
    id: "ex-067",
    title: "Update a Book's Price by Primary Key",
    difficulty: "beginner",
    topic: "update",
    category: "queries",
    description: "Change the price of a specific book identified by its primary key.",
    schema: `from django.db import models

class Book(models.Model):
    title = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=8, decimal_places=2)`,
    sampleData: `Book.objects.create(title='Django Unchained', price=24.99)  # pk=1`,
    problemStatement: "Update the price of the book with pk=1 to $34.99.",
    expectedResult: "Book pk=1 now has price=34.99 in the database.",
    hints: [
      "Use .filter(pk=1).update(price=34.99) for a single SQL UPDATE.",
      "Or fetch the object and call save(update_fields=['price'])."
    ],
    solution: `# Efficient: single SQL UPDATE, no object fetch
Book.objects.filter(pk=1).update(price=34.99)`,
    alternativeSolutions: [
      `# Fetch then save — slower but runs model validation\nbook = Book.objects.get(pk=1)\nbook.price = 34.99\nbook.save(update_fields=['price'])`,
      `# save() without update_fields — updates all columns\nbook = Book.objects.get(pk=1)\nbook.price = 34.99\nbook.save()`
    ],
    explanation: "filter(pk=1).update(price=34.99) generates UPDATE book SET price=34.99 WHERE id=1 in a single query without fetching the object. It does NOT call save() or post_save signals. Use it for bulk or simple field updates; use the fetch+save approach when you need signals or full_clean() validation.",
    tags: ["update", "queryset", "filter", "beginner"]
  },
  {
    id: "ex-068",
    title: "Delete All Orders Older Than 1 Year",
    difficulty: "beginner",
    topic: "delete",
    category: "queries",
    description: "Remove old orders from the database to keep the table lean.",
    schema: `from django.db import models

class Order(models.Model):
    total = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20)
    created_at = models.DateTimeField(auto_now_add=True)`,
    sampleData: `from django.utils import timezone
from datetime import timedelta
now = timezone.now()
Order.objects.create(total=50, status='completed', created_at=now - timedelta(days=400))
Order.objects.create(total=100, status='completed', created_at=now - timedelta(days=300))
Order.objects.create(total=75, status='pending', created_at=now - timedelta(days=10))`,
    problemStatement: "Delete all orders created more than 1 year (365 days) ago.",
    expectedResult: "1 order deleted (the 400-day-old one). 2 remain.",
    hints: [
      "Calculate the cutoff date with timezone.now() - timedelta(days=365).",
      "Filter with created_at__lt=cutoff then call .delete()."
    ],
    solution: `from django.utils import timezone
from datetime import timedelta

cutoff = timezone.now() - timedelta(days=365)
deleted_count, _ = Order.objects.filter(created_at__lt=cutoff).delete()
print(f"Deleted {deleted_count} old orders")`,
    alternativeSolutions: [
      `import datetime\ncutoff = datetime.date.today() - datetime.timedelta(days=365)\nOrder.objects.filter(created_at__date__lt=cutoff).delete()`
    ],
    explanation: "Chaining filter() and delete() executes DELETE FROM order WHERE created_at < cutoff in one query. delete() returns a tuple (total_deleted, {model: count}). Destructuring to (deleted_count, _) ignores the breakdown dictionary.",
    tags: ["delete", "filter", "date", "queryset", "beginner"]
  },
  {
    id: "ex-069",
    title: "Use get_or_create for a Category",
    difficulty: "beginner",
    topic: "get-or-create",
    category: "queries",
    description: "Ensure a category exists in the database, creating it if it doesn't.",
    schema: `from django.db import models

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)`,
    sampleData: `# No existing categories`,
    problemStatement: "Ensure a 'Fiction' category exists. Run it twice — first call should create, second should return existing.",
    expectedResult: "First call: (category, True). Second call: (same category, False).",
    hints: [
      "get_or_create returns (instance, created_bool).",
      "The defaults dict provides fields only used during creation."
    ],
    solution: `# First call — creates it
category, created = Category.objects.get_or_create(
    name='Fiction',
    defaults={'description': 'Fictional literature'}
)
print(created)  # True

# Second call — gets it
category2, created2 = Category.objects.get_or_create(
    name='Fiction',
    defaults={'description': 'This description is ignored'}
)
print(created2)  # False
print(category.pk == category2.pk)  # True`,
    alternativeSolutions: [
      `# Simpler — no defaults\ncategory, created = Category.objects.get_or_create(name='Fiction')`
    ],
    explanation: "get_or_create() first attempts a SELECT. If no match, it runs INSERT with the lookup fields plus defaults. The defaults dict is NOT used in the lookup — only in the INSERT. This makes it safe for idempotent initialization: calling it multiple times never creates duplicates.",
    tags: ["get_or_create", "upsert", "create", "queryset", "beginner"]
  },
  {
    id: "ex-070",
    title: "Create Multiple Books With bulk_create",
    difficulty: "beginner",
    topic: "bulk-create",
    category: "queries",
    description: "Insert multiple Book records efficiently using a single database query.",
    schema: `from django.db import models

class Book(models.Model):
    title = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    published_year = models.IntegerField()`,
    sampleData: `# No existing books`,
    problemStatement: "Create 4 books at once using bulk_create instead of 4 separate create() calls.",
    expectedResult: "4 Book rows inserted in one SQL statement.",
    hints: [
      "Build a list of unsaved Book instances.",
      "Pass the list to Book.objects.bulk_create()."
    ],
    solution: `books_to_create = [
    Book(title='Book One', price=19.99, published_year=2021),
    Book(title='Book Two', price=24.99, published_year=2022),
    Book(title='Book Three', price=14.99, published_year=2023),
    Book(title='Book Four', price=34.99, published_year=2023),
]

created = Book.objects.bulk_create(books_to_create)
print(f"Created {len(created)} books")`,
    alternativeSolutions: [
      `# From a list of dicts\ndata = [{'title': 'A', 'price': 10, 'published_year': 2022}]\nBook.objects.bulk_create([Book(**d) for d in data])`,
      `# With batch_size for large lists\nBook.objects.bulk_create(books_to_create, batch_size=100)`
    ],
    explanation: "bulk_create() sends one INSERT INTO book (...) VALUES (...), (...), (...), (...) statement. This is dramatically faster than N separate create() calls. Important: save() is not called, pre_save/post_save signals do not fire, and pks may not be set on the returned objects in older Django versions (fixed in Django 4.1+ for most backends).",
    tags: ["bulk_create", "create", "performance", "queryset", "beginner"]
  },
  {
    id: "ex-071",
    title: "Update All Pending Orders to 'processing'",
    difficulty: "beginner",
    topic: "update",
    category: "queries",
    description: "Bulk-update the status of all pending orders to 'processing' with a single query.",
    schema: `from django.db import models

class Order(models.Model):
    total = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, default='pending')`,
    sampleData: `Order.objects.create(total=50.00, status='pending')
Order.objects.create(total=120.00, status='pending')
Order.objects.create(total=75.00, status='completed')`,
    problemStatement: "Update all orders with status='pending' to status='processing' in one query.",
    expectedResult: "2 orders updated. The completed order is untouched.",
    hints: [
      "Chain filter() and update() — no need to fetch objects.",
      "update() returns the count of rows updated."
    ],
    solution: `updated_count = Order.objects.filter(status='pending').update(status='processing')
print(f"Updated {updated_count} orders")  # 2`,
    alternativeSolutions: [
      `# With timestamp update\nfrom django.utils import timezone\nOrder.objects.filter(status='pending').update(\n    status='processing',\n    updated_at=timezone.now()\n)`
    ],
    explanation: "filter().update() generates UPDATE order SET status='processing' WHERE status='pending' — a single efficient SQL statement. No model instances are loaded into memory. update() returns the number of rows affected, useful for logging or conditional checks.",
    tags: ["update", "bulk-update", "filter", "queryset", "beginner"]
  },
  {
    id: "ex-072",
    title: "Get or Create a Customer Profile",
    difficulty: "beginner",
    topic: "get-or-create",
    category: "queries",
    description: "Ensure a CustomerProfile exists for a given user, creating it if necessary.",
    schema: `from django.db import models

class Customer(models.Model):
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=100)

class CustomerProfile(models.Model):
    customer = models.OneToOneField(Customer, on_delete=models.CASCADE, related_name='profile')
    loyalty_points = models.IntegerField(default=0)
    tier = models.CharField(max_length=20, default='bronze')`,
    sampleData: `customer = Customer.objects.create(email='alice@example.com', name='Alice')`,
    problemStatement: "Get or create a CustomerProfile for customer with email 'alice@example.com'.",
    expectedResult: "Profile created on first call (created=True), retrieved on subsequent calls (created=False).",
    hints: [
      "Look up by the customer FK.",
      "Use defaults for fields only set on creation."
    ],
    solution: `customer = Customer.objects.get(email='alice@example.com')

profile, created = CustomerProfile.objects.get_or_create(
    customer=customer,
    defaults={'loyalty_points': 0, 'tier': 'bronze'}
)
if created:
    print("New profile created")
else:
    print(f"Existing profile: tier={profile.tier}")`,
    alternativeSolutions: [
      `# Using customer_id directly\nprofile, created = CustomerProfile.objects.get_or_create(\n    customer_id=customer.pk\n)`
    ],
    explanation: "get_or_create(customer=customer) looks up by the OneToOneField value. If no profile exists, one is created with default values. This is the standard pattern for creating companion records (profiles, settings, preferences) lazily.",
    tags: ["get_or_create", "one-to-one", "create", "queryset", "beginner"]
  },
  {
    id: "ex-073",
    title: "Update Product Stock by Primary Key",
    difficulty: "beginner",
    topic: "update",
    category: "queries",
    description: "Set the stock level of a specific product to a new value.",
    schema: `from django.db import models

class Product(models.Model):
    name = models.CharField(max_length=200)
    stock = models.IntegerField(default=0)`,
    sampleData: `Product.objects.create(name='Laptop', stock=5)  # pk=1`,
    problemStatement: "Update the stock of product pk=1 to 50.",
    expectedResult: "Product pk=1 has stock=50.",
    hints: [
      "filter(pk=1).update(stock=50) is the most efficient approach.",
      "Returns the number of rows updated."
    ],
    solution: `rows_updated = Product.objects.filter(pk=1).update(stock=50)
print(f"Updated {rows_updated} product(s)")`,
    alternativeSolutions: [
      `product = Product.objects.get(pk=1)\nproduct.stock = 50\nproduct.save(update_fields=['stock'])`,
      `from django.db.models import F\n# Relative update: add 45 to current stock\nProduct.objects.filter(pk=1).update(stock=F('stock') + 45)`
    ],
    explanation: "filter(pk=1).update(stock=50) runs UPDATE product SET stock=50 WHERE id=1 directly. The F expression alternative is useful when you want to increment/decrement relative to the current value without knowing it upfront — and it avoids race conditions.",
    tags: ["update", "filter", "queryset", "beginner"]
  },
  {
    id: "ex-074",
    title: "Soft Delete Pattern — Set is_deleted to True",
    difficulty: "beginner",
    topic: "update",
    category: "queries",
    description: "Mark records as deleted without removing them from the database.",
    schema: `from django.db import models

class Order(models.Model):
    customer_name = models.CharField(max_length=100)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)`,
    sampleData: `Order.objects.create(customer_name='Alice', total=100.00)  # pk=1
Order.objects.create(customer_name='Bob', total=200.00)    # pk=2`,
    problemStatement: "Soft-delete the order with pk=1 by setting is_deleted=True and recording the deletion timestamp.",
    expectedResult: "Order pk=1 has is_deleted=True and deleted_at set to now. Still in the DB.",
    hints: [
      "Use filter(pk=1).update(is_deleted=True, deleted_at=...) .",
      "Use timezone.now() for the timestamp."
    ],
    solution: `from django.utils import timezone

Order.objects.filter(pk=1).update(
    is_deleted=True,
    deleted_at=timezone.now()
)

# Query non-deleted orders
active_orders = Order.objects.filter(is_deleted=False)`,
    alternativeSolutions: [
      `order = Order.objects.get(pk=1)\norder.is_deleted = True\norder.deleted_at = timezone.now()\norder.save(update_fields=['is_deleted', 'deleted_at'])`
    ],
    explanation: "Soft delete preserves data for auditing, recovery, and analytics while hiding it from normal queries. The pattern requires always filtering with is_deleted=False in your application queries. A custom manager can automate this filter — see the advanced exercises.",
    tags: ["update", "soft-delete", "pattern", "queryset", "beginner"]
  },
  {
    id: "ex-075",
    title: "Count Orders by Status",
    difficulty: "beginner",
    topic: "annotate",
    category: "queries",
    description: "Get a count of orders grouped by their status field.",
    schema: `from django.db import models

class Order(models.Model):
    total = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, default='pending')`,
    sampleData: `Order.objects.create(total=50, status='pending')
Order.objects.create(total=100, status='pending')
Order.objects.create(total=75, status='completed')
Order.objects.create(total=200, status='completed')
Order.objects.create(total=30, status='cancelled')`,
    problemStatement: "Get the count of orders for each status value.",
    expectedResult: "{'pending': 2, 'completed': 2, 'cancelled': 1}",
    hints: [
      "Use values('status') to group, then annotate with Count.",
      "This generates GROUP BY status."
    ],
    solution: `from django.db.models import Count

status_counts = (
    Order.objects
    .values('status')
    .annotate(count=Count('id'))
    .order_by('status')
)

# Convert to dict
result = {item['status']: item['count'] for item in status_counts}
print(result)  # {'cancelled': 1, 'completed': 2, 'pending': 2}`,
    alternativeSolutions: [
      `# Individual counts\nfrom django.db.models import Count\nOrder.objects.aggregate(\n    pending=Count('id', filter=Q(status='pending')),\n    completed=Count('id', filter=Q(status='completed'))\n)`
    ],
    explanation: "values('status').annotate(Count('id')) generates SELECT status, COUNT(id) FROM order GROUP BY status. This is the standard Django pattern for count-by-group queries. Converting to a dict with a comprehension makes downstream use cleaner.",
    tags: ["annotate", "count", "group-by", "values", "queryset", "beginner"]
  },
  {
    id: "ex-076",
    title: "Get Book Titles and Prices as Dictionaries",
    difficulty: "beginner",
    topic: "values",
    category: "queries",
    description: "Fetch only the title and price fields from all books as lightweight dictionaries.",
    schema: `from django.db import models

class Book(models.Model):
    title = models.CharField(max_length=200)
    author_name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    description = models.TextField()`,
    sampleData: `Book.objects.create(title='Clean Code', author_name='Robert Martin', price=39.99, description='A very long description...')
Book.objects.create(title='The Pragmatic Programmer', author_name='David Thomas', price=49.99, description='Another long description...')`,
    problemStatement: "Get just the title and price of all books as dictionaries (not full model instances).",
    expectedResult: "[{'title': 'Clean Code', 'price': Decimal('39.99')}, ...]",
    hints: [
      "values('title', 'price') returns dictionaries.",
      "This avoids loading large fields like description."
    ],
    solution: `books = Book.objects.values('title', 'price').order_by('title')
for book in books:
    print(book['title'], book['price'])`,
    alternativeSolutions: [
      `# As tuples\nbooks = Book.objects.values_list('title', 'price').order_by('title')`,
      `# As named tuples\nbooks = Book.objects.values_list('title', 'price', named=True)`
    ],
    explanation: "values('title', 'price') generates SELECT title, price FROM book — only two columns. The result is a QuerySet of dictionaries, not model instances. Use this for read-only operations like API serialization or template rendering where you don't need model methods.",
    tags: ["values", "performance", "queryset", "beginner"]
  },
  {
    id: "ex-077",
    title: "Get Flat List of Unique Author Names",
    difficulty: "beginner",
    topic: "values-list",
    category: "queries",
    description: "Get a flat Python list of all unique author names.",
    schema: `from django.db import models

class Author(models.Model):
    name = models.CharField(max_length=100)
    country = models.CharField(max_length=50)`,
    sampleData: `Author.objects.create(name='George Orwell', country='UK')
Author.objects.create(name='Frank Herbert', country='USA')
Author.objects.create(name='J.K. Rowling', country='UK')`,
    problemStatement: "Get a flat list of all author names, sorted alphabetically.",
    expectedResult: "['Frank Herbert', 'George Orwell', 'J.K. Rowling']",
    hints: [
      "values_list('name', flat=True) returns a flat list.",
      "flat=True only works when specifying a single field."
    ],
    solution: `names = list(Author.objects.values_list('name', flat=True).order_by('name'))
print(names)  # ['Frank Herbert', 'George Orwell', 'J.K. Rowling']`,
    alternativeSolutions: [
      `# Without flat — returns list of tuples\nnames = Author.objects.values_list('name').order_by('name')`,
      `# As values dicts\nnames = [a['name'] for a in Author.objects.values('name').order_by('name')]`
    ],
    explanation: "values_list('name', flat=True) returns a QuerySet that evaluates to a flat list ['George Orwell', ...] instead of a list of tuples [('George Orwell',), ...]. flat=True is only valid when exactly one field is specified.",
    tags: ["values_list", "flat", "queryset", "beginner"]
  },
  {
    id: "ex-078",
    title: "Get Total Revenue From All Orders",
    difficulty: "beginner",
    topic: "aggregate",
    category: "queries",
    description: "Calculate the sum of all order totals (total revenue).",
    schema: `from django.db import models

class Order(models.Model):
    total = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20)`,
    sampleData: `Order.objects.create(total=100.00, status='completed')
Order.objects.create(total=250.00, status='completed')
Order.objects.create(total=75.50, status='completed')`,
    problemStatement: "Calculate the total revenue (sum of all order totals).",
    expectedResult: "{'total_revenue': Decimal('425.50')}",
    hints: [
      "Use aggregate(Sum('total')).",
      "Sum returns None if no rows match — handle that case."
    ],
    solution: `from django.db.models import Sum

result = Order.objects.aggregate(total_revenue=Sum('total'))
revenue = result['total_revenue'] or 0
print(f"Total revenue: \${revenue}")`,
    alternativeSolutions: [
      `from django.db.models import Sum\nfrom django.db.models.functions import Coalesce\nfrom decimal import Decimal\n\n# Coalesce handles the None case\nrevenue = Order.objects.aggregate(\n    total_revenue=Coalesce(Sum('total'), Decimal('0.00'))\n)['total_revenue']`
    ],
    explanation: "Sum('total') generates SELECT SUM(total) FROM order. It returns None (not 0) if there are no rows — always use or 0 or Coalesce() to handle the empty table case. aggregate() returns a dict with the key you specify.",
    tags: ["aggregate", "sum", "revenue", "queryset", "beginner"]
  },
  {
    id: "ex-079",
    title: "Get Average Product Price",
    difficulty: "beginner",
    topic: "aggregate",
    category: "queries",
    description: "Calculate the average price across all products.",
    schema: `from django.db import models

class Product(models.Model):
    name = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=8, decimal_places=2)`,
    sampleData: `Product.objects.create(name='Laptop', price=999.99)
Product.objects.create(name='Mouse', price=29.99)
Product.objects.create(name='Keyboard', price=79.99)`,
    problemStatement: "Calculate the average price of all products.",
    expectedResult: "{'avg_price': Decimal('369.99')}",
    hints: [
      "Use aggregate(Avg('price')).",
      "Avg returns a Decimal for DecimalField."
    ],
    solution: `from django.db.models import Avg

result = Product.objects.aggregate(avg_price=Avg('price'))
print(f"Average price: \${result['avg_price']}")`,
    alternativeSolutions: [
      `from django.db.models import Avg, Count, Sum\n# Multiple aggregations at once\nstats = Product.objects.aggregate(\n    avg_price=Avg('price'),\n    total_products=Count('id'),\n    total_value=Sum('price')\n)`,
    ],
    explanation: "Avg('price') generates SELECT AVG(price) FROM product. Like Sum, it returns None for empty tables. Combining multiple aggregate functions in one call is efficient — Django runs one SQL query with multiple aggregate expressions.",
    tags: ["aggregate", "avg", "queryset", "beginner"]
  },
  {
    id: "ex-080",
    title: "Get Min and Max Employee Salary",
    difficulty: "beginner",
    topic: "aggregate",
    category: "queries",
    description: "Find the lowest and highest salaries among all employees.",
    schema: `from django.db import models

class Employee(models.Model):
    name = models.CharField(max_length=100)
    salary = models.DecimalField(max_digits=10, decimal_places=2)`,
    sampleData: `Employee.objects.create(name='Alice', salary=95000)
Employee.objects.create(name='Bob', salary=65000)
Employee.objects.create(name='Carol', salary=120000)`,
    problemStatement: "Get both the minimum and maximum salary in a single query.",
    expectedResult: "{'min_salary': Decimal('65000'), 'max_salary': Decimal('120000')}",
    hints: [
      "Use Min and Max from django.db.models.",
      "Combine them in a single aggregate() call."
    ],
    solution: `from django.db.models import Min, Max

salary_range = Employee.objects.aggregate(
    min_salary=Min('salary'),
    max_salary=Max('salary')
)
print(f"Min: \${salary_range['min_salary']}, Max: \${salary_range['max_salary']}")`,
    alternativeSolutions: [
      `from django.db.models import Min, Max, Avg\nEmployee.objects.aggregate(min_salary=Min('salary'), max_salary=Max('salary'), avg_salary=Avg('salary'))`,
      `# Get employee objects instead of just values\nlowest_paid = Employee.objects.order_by('salary').first()\nhighest_paid = Employee.objects.order_by('-salary').first()`
    ],
    explanation: "Min and Max generate SELECT MIN(salary), MAX(salary) FROM employee in one query. To get the actual employee objects (not just the values), use order_by + first/last. aggregate() is ideal when only the scalar values are needed.",
    tags: ["aggregate", "min", "max", "queryset", "beginner"]
  },
  {
    id: "ex-081",
    title: "Count Books Per Author",
    difficulty: "beginner",
    topic: "annotate",
    category: "queries",
    description: "Get each author with the count of books they have written.",
    schema: `from django.db import models

class Author(models.Model):
    name = models.CharField(max_length=100)

class Book(models.Model):
    title = models.CharField(max_length=200)
    author = models.ForeignKey(Author, on_delete=models.CASCADE, related_name='books')`,
    sampleData: `a1 = Author.objects.create(name='Orwell')
a2 = Author.objects.create(name='Rowling')
Book.objects.create(title='1984', author=a1)
Book.objects.create(title='Animal Farm', author=a1)
Book.objects.create(title='Harry Potter', author=a2)`,
    problemStatement: "Annotate each author with how many books they have written.",
    expectedResult: "Orwell: 2 books. Rowling: 1 book.",
    hints: [
      "Use annotate(book_count=Count('books')) — 'books' is the related_name.",
      "Order by '-book_count' to see most prolific authors first."
    ],
    solution: `from django.db.models import Count

authors = Author.objects.annotate(book_count=Count('books')).order_by('-book_count')
for a in authors:
    print(f"{a.name}: {a.book_count} books")`,
    alternativeSolutions: [
      `# Using values() approach\nAuthor.objects.values('name').annotate(book_count=Count('books')).order_by('-book_count')`
    ],
    explanation: "annotate(book_count=Count('books')) adds a GROUP BY author.id with COUNT(book.id) join. Each author gets a book_count attribute. The related_name 'books' is used as the relation name in Count().",
    tags: ["annotate", "count", "group-by", "values", "queryset", "beginner"]
  },
  {
    id: "ex-082",
    title: "Get All Book Titles as a Flat List",
    difficulty: "beginner",
    topic: "values-list",
    category: "queries",
    description: "Get a plain Python list of all book titles.",
    schema: `from django.db import models

class Book(models.Model):
    title = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=8, decimal_places=2)`,
    sampleData: `Book.objects.create(title='Django for Beginners', price=29.99)
Book.objects.create(title='Two Scoops of Django', price=39.99)
Book.objects.create(title='Django REST Framework', price=34.99)`,
    problemStatement: "Get all book titles as a flat Python list.",
    expectedResult: "['Django REST Framework', 'Django for Beginners', 'Two Scoops of Django']",
    hints: [
      "values_list('title', flat=True) returns a flat QuerySet.",
      "Wrap in list() to evaluate it."
    ],
    solution: `titles = list(Book.objects.values_list('title', flat=True).order_by('title'))
print(titles)`,
    alternativeSolutions: [
      `# List comprehension approach\ntitles = [book.title for book in Book.objects.only('title').order_by('title')]`,
      `# As tuples (without flat=True)\ntitles = list(Book.objects.values_list('title').order_by('title'))`
    ],
    explanation: "values_list('title', flat=True) returns a flat QuerySet of string values. list() forces evaluation. This is the most memory-efficient way to get a list of field values — no model instances are created.",
    tags: ["values_list", "flat", "queryset", "beginner"]
  },
  {
    id: "ex-083",
    title: "Get Total Quantity Sold Per Product",
    difficulty: "beginner",
    topic: "annotate",
    category: "queries",
    description: "Sum up quantities sold for each product across all order line items.",
    schema: `from django.db import models

class Product(models.Model):
    name = models.CharField(max_length=200)

class OrderItem(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='order_items')
    quantity = models.IntegerField()`,
    sampleData: `p1 = Product.objects.create(name='Laptop')
p2 = Product.objects.create(name='Mouse')
OrderItem.objects.create(product=p1, quantity=2)
OrderItem.objects.create(product=p1, quantity=1)
OrderItem.objects.create(product=p2, quantity=5)`,
    problemStatement: "Get each product annotated with the total quantity sold (sum of order_items.quantity).",
    expectedResult: "Laptop: 3 total sold. Mouse: 5 total sold.",
    hints: [
      "Use annotate(total_sold=Sum('order_items__quantity')).",
      "order_items is the related_name on the FK."
    ],
    solution: `from django.db.models import Sum

products = Product.objects.annotate(
    total_sold=Sum('order_items__quantity')
).order_by('-total_sold')

for p in products:
    print(f"{p.name}: {p.total_sold} units sold")`,
    alternativeSolutions: [
      `# Via OrderItem model\nfrom django.db.models import Sum\nOrderItem.objects.values('product__name').annotate(total=Sum('quantity'))`
    ],
    explanation: "Sum('order_items__quantity') traverses the reverse FK and sums the quantity column, generating GROUP BY product.id, SUM(order_item.quantity). Products with no order items will have total_sold=None — add Coalesce(Sum(...), 0) if 0 is preferred.",
    tags: ["annotate", "sum", "reverse-fk", "group-by", "queryset", "beginner"]
  },
  {
    id: "ex-084",
    title: "Get Average Rating of Reviewed Products",
    difficulty: "beginner",
    topic: "annotate",
    category: "queries",
    description: "Annotate products that have at least one review with their average rating.",
    schema: `from django.db import models

class Product(models.Model):
    name = models.CharField(max_length=200)

class Review(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    rating = models.IntegerField()  # 1-5`,
    sampleData: `p1 = Product.objects.create(name='Laptop')
p2 = Product.objects.create(name='Mouse')
p3 = Product.objects.create(name='Keyboard')
Review.objects.create(product=p1, rating=5)
Review.objects.create(product=p1, rating=4)
Review.objects.create(product=p2, rating=3)`,
    problemStatement: "Get all products with their average rating. Only return products that have at least one review.",
    expectedResult: "Laptop: avg 4.5. Mouse: avg 3.0. Keyboard excluded (no reviews).",
    hints: [
      "Use annotate(avg_rating=Avg('reviews__rating')).",
      "Filter where avg_rating__isnull=False to exclude unreviewed products."
    ],
    solution: `from django.db.models import Avg

products = (
    Product.objects
    .annotate(avg_rating=Avg('reviews__rating'))
    .filter(avg_rating__isnull=False)
    .order_by('-avg_rating')
)

for p in products:
    print(f"{p.name}: {p.avg_rating:.1f} avg rating")`,
    alternativeSolutions: [
      `from django.db.models import Avg, Count\nproducts = Product.objects.annotate(\n    avg_rating=Avg('reviews__rating'),\n    review_count=Count('reviews')\n).filter(review_count__gt=0)`
    ],
    explanation: "Avg('reviews__rating') traverses the reverse FK and computes an average per product. Products with no reviews get avg_rating=None. Filtering avg_rating__isnull=False removes them. The alternative uses Count to achieve the same effect.",
    tags: ["annotate", "avg", "filter", "reverse-fk", "queryset", "beginner"]
  },
  {
    id: "ex-085",
    title: "Check Existence and Count in One Pass",
    difficulty: "beginner",
    topic: "aggregate",
    category: "queries",
    description: "Determine whether any premium products exist and how many there are, efficiently.",
    schema: `from django.db import models

class Product(models.Model):
    name = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    is_premium = models.BooleanField(default=False)`,
    sampleData: `Product.objects.create(name='Budget', price=9.99, is_premium=False)
Product.objects.create(name='Pro Laptop', price=2999.99, is_premium=True)
Product.objects.create(name='Pro Monitor', price=1499.99, is_premium=True)`,
    problemStatement: "In a single query, get the count of premium products and whether any exist at all.",
    expectedResult: "{'count': 2, 'exists': True}",
    hints: [
      "aggregate(count=Count('id')) gives the count.",
      "A count > 0 implies existence; or use exists() separately."
    ],
    solution: `from django.db.models import Count

qs = Product.objects.filter(is_premium=True)
result = qs.aggregate(count=Count('id'))
count = result['count']
exists = count > 0
print(f"Premium products: {count}, any exist: {exists}")`,
    alternativeSolutions: [
      `# Two separate optimized queries\nqs = Product.objects.filter(is_premium=True)\nexists = qs.exists()      # SELECT (1) LIMIT 1\ncount = qs.count() if exists else 0  # Only count if necessary`,
      `# Single query returning both\nfrom django.db.models import Count, Case, When, IntegerField\nqs.aggregate(\n    count=Count('id'),\n    has_any=Count(Case(When(pk__isnull=False, then=1), output_field=IntegerField()))\n)`
    ],
    explanation: "A single aggregate() with Count is the cleanest approach. Alternatively, checking exists() before count() saves a COUNT(*) query when no premium products exist. For truly performance-critical code, exists() stops at the first row while count() scans all matching rows.",
    tags: ["aggregate", "count", "exists", "queryset", "beginner"]
  },
  // ============================================================
  // Q OBJECTS (ex-086 to ex-097)
  // ============================================================
  {
    id: "ex-086",
    title: "OR Query: Cheap or Highly Rated Books",
    difficulty: "intermediate",
    topic: "Q objects",
    category: "queries",
    description: "Use Q objects to find books that are cheap (under $15) OR highly rated (above 4.5).",
    schema: `from django.db import models

class Book(models.Model):
    title = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)`,
    sampleData: `Book.objects.create(title='Budget Guide', price=9.99, rating=3.5)
Book.objects.create(title='Masterpiece', price=45.00, rating=4.8)
Book.objects.create(title='Mid Book', price=25.00, rating=4.0)
Book.objects.create(title='Cheap Classic', price=12.00, rating=4.9)`,
    problemStatement: "Find all books where price < 15 OR rating > 4.5 using Q objects.",
    expectedResult: "3 books: 'Budget Guide', 'Masterpiece', and 'Cheap Classic'.",
    hints: [
      "Import Q from django.db.models.",
      "Use | operator to combine Q objects for OR logic."
    ],
    solution: `from django.db.models import Q

books = Book.objects.filter(
    Q(price__lt=15) | Q(rating__gt=4.5)
)`,
    alternativeSolutions: [
      `# Without Q — union approach\ncheap = Book.objects.filter(price__lt=15)\nhighly_rated = Book.objects.filter(rating__gt=4.5)\nresult = cheap | highly_rated  # QuerySet union`
    ],
    explanation: "Q objects allow combining filters with |  (OR), & (AND), and ~ (NOT). Without Q, .filter() only supports AND between keyword arguments. The | operator generates WHERE price < 15 OR rating > 4.5 in a single SQL query.",
    tags: ["Q", "OR", "filter", "queryset", "intermediate"]
  },
  {
    id: "ex-087",
    title: "AND+OR: Complex Order Filter",
    difficulty: "intermediate",
    topic: "Q objects",
    category: "queries",
    description: "Filter orders that are (pending AND over $200) OR (cancelled AND created today).",
    schema: `from django.db import models

class Order(models.Model):
    total = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20)
    created_at = models.DateTimeField(auto_now_add=True)`,
    sampleData: `from django.utils import timezone
today = timezone.now()
Order.objects.create(total=250.00, status='pending')
Order.objects.create(total=50.00, status='cancelled')
Order.objects.create(total=300.00, status='completed')
Order.objects.create(total=10.00, status='cancelled')`,
    problemStatement: "Retrieve orders that are (status='pending' AND total > 200) OR (status='cancelled' AND created today).",
    expectedResult: "The pending $250 order and any cancelled orders created today.",
    hints: [
      "Use & inside Q groups for AND, | between groups for OR.",
      "Use __date=today for date-only comparison on DateTimeField."
    ],
    solution: `from django.db.models import Q
from django.utils import timezone

today = timezone.now().date()

orders = Order.objects.filter(
    Q(status='pending', total__gt=200) |
    Q(status='cancelled', created_at__date=today)
)`,
    alternativeSolutions: [
      `from django.db.models import Q\nfrom django.utils import timezone\ntoday = timezone.now().date()\norders = Order.objects.filter(\n    (Q(status='pending') & Q(total__gt=200)) |\n    (Q(status='cancelled') & Q(created_at__date=today))\n)`
    ],
    explanation: "Multiple kwargs inside a single Q() are implicitly ANDed. Combining two Q() groups with | produces OR between them. Grouping with parentheses ensures correct operator precedence. __date extracts only the date part from a DateTimeField for comparison.",
    tags: ["Q", "AND", "OR", "filter", "date", "intermediate"]
  },
  {
    id: "ex-088",
    title: "NOT Query: Employees Outside HR and Finance",
    difficulty: "intermediate",
    topic: "Q objects",
    category: "queries",
    description: "Use ~Q to find employees who are NOT in the HR or Finance departments.",
    schema: `from django.db import models

class Department(models.Model):
    name = models.CharField(max_length=100)

class Employee(models.Model):
    name = models.CharField(max_length=100)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='employees')`,
    sampleData: `hr = Department.objects.create(name='HR')
fin = Department.objects.create(name='Finance')
eng = Department.objects.create(name='Engineering')
Employee.objects.create(name='Alice', department=hr)
Employee.objects.create(name='Bob', department=fin)
Employee.objects.create(name='Carol', department=eng)`,
    problemStatement: "Get all employees who are NOT in the 'HR' or 'Finance' departments using ~Q.",
    expectedResult: "1 employee: Carol (Engineering).",
    hints: [
      "~Q negates a Q object (NOT).",
      "Use __in lookup to match multiple values in one Q."
    ],
    solution: `from django.db.models import Q

employees = Employee.objects.filter(
    ~Q(department__name__in=['HR', 'Finance'])
)`,
    alternativeSolutions: [
      `employees = Employee.objects.exclude(department__name__in=['HR', 'Finance'])`,
      `from django.db.models import Q\nemployees = Employee.objects.filter(\n    ~Q(department__name='HR') & ~Q(department__name='Finance')\n)`
    ],
    explanation: "~Q negates the condition, generating WHERE NOT (department__name IN ('HR', 'Finance')). This is equivalent to exclude(). The ~Q approach is more flexible because you can combine negated conditions with other Q objects using & and |.",
    tags: ["Q", "NOT", "negate", "exclude", "filter", "intermediate"]
  },
  {
    id: "ex-089",
    title: "Q on FK: Books by Tolkien OR in Fantasy Category",
    difficulty: "intermediate",
    topic: "Q objects",
    category: "queries",
    description: "Use Q objects to filter books by author name or category using FK traversal.",
    schema: `from django.db import models

class Author(models.Model):
    name = models.CharField(max_length=100)

class Category(models.Model):
    name = models.CharField(max_length=100)

class Book(models.Model):
    title = models.CharField(max_length=200)
    author = models.ForeignKey(Author, on_delete=models.CASCADE)
    category = models.ForeignKey(Category, on_delete=models.CASCADE)`,
    sampleData: `tolkien = Author.objects.create(name='Tolkien')
rowling = Author.objects.create(name='Rowling')
fantasy = Category.objects.create(name='Fantasy')
scifi = Category.objects.create(name='Sci-Fi')
Book.objects.create(title='The Hobbit', author=tolkien, category=fantasy)
Book.objects.create(title='Harry Potter', author=rowling, category=fantasy)
Book.objects.create(title='Foundation', author=rowling, category=scifi)`,
    problemStatement: "Find all books where author__name='Tolkien' OR category__name='Fantasy'.",
    expectedResult: "2 books: 'The Hobbit' and 'Harry Potter'.",
    hints: [
      "Use double underscores to traverse FK relationships inside Q objects.",
      "Combine with | for OR logic."
    ],
    solution: `from django.db.models import Q

books = Book.objects.filter(
    Q(author__name='Tolkien') | Q(category__name='Fantasy')
)`,
    alternativeSolutions: [
      `from django.db.models import Q\nbooks = Book.objects.filter(\n    Q(author__name__icontains='tolkien') | Q(category__name='Fantasy')\n).distinct()`
    ],
    explanation: "Q objects support the same field lookups as filter(), including FK traversals with __. Combining Q(author__name=...) | Q(category__name=...) generates a single SQL query with JOINs and WHERE ... OR ... clauses.",
    tags: ["Q", "OR", "FK", "filter", "intermediate"]
  },
  {
    id: "ex-090",
    title: "Complex Q: Active Old Users OR Premium Users",
    difficulty: "intermediate",
    topic: "Q objects",
    category: "queries",
    description: "Filter users who joined more than 1 year ago AND are active, OR have premium=True.",
    schema: `from django.db import models

class UserProfile(models.Model):
    username = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)
    is_premium = models.BooleanField(default=False)
    joined_at = models.DateTimeField()`,
    sampleData: `from django.utils import timezone
from datetime import timedelta
now = timezone.now()
UserProfile.objects.create(username='alice', is_active=True, is_premium=False, joined_at=now - timedelta(days=400))
UserProfile.objects.create(username='bob', is_active=False, is_premium=True, joined_at=now - timedelta(days=10))
UserProfile.objects.create(username='carol', is_active=True, is_premium=False, joined_at=now - timedelta(days=30))`,
    problemStatement: "Get users who (are active AND joined > 1 year ago) OR have premium=True.",
    expectedResult: "2 users: alice (active + old) and bob (premium).",
    hints: [
      "Use timedelta to compute the cutoff date.",
      "Combine two Q groups with |."
    ],
    solution: `from django.db.models import Q
from django.utils import timezone
from datetime import timedelta

one_year_ago = timezone.now() - timedelta(days=365)

users = UserProfile.objects.filter(
    Q(is_active=True, joined_at__lt=one_year_ago) |
    Q(is_premium=True)
)`,
    alternativeSolutions: [
      `from django.db.models import Q\nfrom django.utils import timezone\nfrom datetime import timedelta\ncutoff = timezone.now() - timedelta(days=365)\nusers = UserProfile.objects.filter(\n    (Q(is_active=True) & Q(joined_at__lt=cutoff)) | Q(is_premium=True)\n)`
    ],
    explanation: "Multiple kwargs inside Q() are ANDed, so Q(is_active=True, joined_at__lt=one_year_ago) is equivalent to Q(is_active=True) & Q(joined_at__lt=one_year_ago). The outer | produces OR between the two groups in SQL.",
    tags: ["Q", "AND", "OR", "date", "filter", "intermediate"]
  },
  {
    id: "ex-091",
    title: "NOT with AND: Products NOT Out-of-Stock AND Discontinued",
    difficulty: "intermediate",
    topic: "Q objects",
    category: "queries",
    description: "Use ~Q to find products that are NOT simultaneously out of stock and discontinued.",
    schema: `from django.db import models

class Product(models.Model):
    name = models.CharField(max_length=200)
    stock = models.IntegerField(default=0)
    is_discontinued = models.BooleanField(default=False)`,
    sampleData: `Product.objects.create(name='Widget A', stock=0, is_discontinued=True)
Product.objects.create(name='Widget B', stock=5, is_discontinued=False)
Product.objects.create(name='Widget C', stock=0, is_discontinued=False)
Product.objects.create(name='Widget D', stock=3, is_discontinued=True)`,
    problemStatement: "Get products that are NOT (out of stock AND discontinued). Keep products that are available or still active.",
    expectedResult: "3 products: Widget B, Widget C, Widget D. Only Widget A is excluded.",
    hints: [
      "~Q(stock=0, is_discontinued=True) negates the entire AND condition.",
      "De Morgan's law: NOT(A AND B) = NOT A OR NOT B."
    ],
    solution: `from django.db.models import Q

products = Product.objects.filter(
    ~Q(stock=0, is_discontinued=True)
)`,
    alternativeSolutions: [
      `from django.db.models import Q\n# De Morgan equivalent\nproducts = Product.objects.filter(\n    Q(stock__gt=0) | Q(is_discontinued=False)\n)`,
      `products = Product.objects.exclude(stock=0, is_discontinued=True)`
    ],
    explanation: "~Q(stock=0, is_discontinued=True) negates the compound AND condition: NOT (stock=0 AND discontinued=True). This is equivalent to stock>0 OR discontinued=False by De Morgan's law. exclude() is the simpler equivalent but ~Q is more composable.",
    tags: ["Q", "NOT", "AND", "negate", "filter", "intermediate"]
  },
  {
    id: "ex-092",
    title: "Dynamic Q Building with reduce and operator.or_",
    difficulty: "advanced",
    topic: "Q objects",
    category: "queries",
    description: "Dynamically combine a list of Q objects into a single OR filter using functools.reduce.",
    schema: `from django.db import models

class Product(models.Model):
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=8, decimal_places=2)`,
    sampleData: `Product.objects.create(name='Laptop', category='Electronics', price=999)
Product.objects.create(name='T-Shirt', category='Clothing', price=19)
Product.objects.create(name='Novel', category='Books', price=14)
Product.objects.create(name='Tablet', category='Electronics', price=499)`,
    problemStatement: "Given a list of category names from user input, dynamically build a single Q OR filter to match any of them.",
    expectedResult: "Filtered products matching any category in the input list.",
    hints: [
      "Start with an empty list of Q objects, then reduce with operator.or_.",
      "functools.reduce(operator.or_, q_list) chains all Q objects with OR."
    ],
    solution: `import operator
from functools import reduce
from django.db.models import Q

# Dynamic list of categories from user input
categories_to_filter = ['Electronics', 'Books']

# Build list of Q objects
q_list = [Q(category=cat) for cat in categories_to_filter]

# Combine all with OR
combined_q = reduce(operator.or_, q_list)

products = Product.objects.filter(combined_q)`,
    alternativeSolutions: [
      `# Simpler for this case — use __in\nproducts = Product.objects.filter(category__in=['Electronics', 'Books'])`,
      `# Useful when conditions are heterogeneous\nimport operator\nfrom functools import reduce\nfrom django.db.models import Q\nconditions = [Q(category='Electronics'), Q(price__lt=20)]\nproducts = Product.objects.filter(reduce(operator.or_, conditions))`
    ],
    explanation: "reduce(operator.or_, q_list) folds the list of Q objects using |, equivalent to Q(a) | Q(b) | Q(c). This is the idiomatic pattern for runtime-constructed filters. For homogeneous conditions on one field, __in is simpler, but reduce shines when conditions differ.",
    tags: ["Q", "dynamic", "reduce", "OR", "advanced", "queryset"]
  },
  {
    id: "ex-093",
    title: "Negate Q: All Books Not By Author ID 5",
    difficulty: "intermediate",
    topic: "Q objects",
    category: "queries",
    description: "Use ~Q to exclude books written by a specific author identified by primary key.",
    schema: `from django.db import models

class Author(models.Model):
    name = models.CharField(max_length=100)

class Book(models.Model):
    title = models.CharField(max_length=200)
    author = models.ForeignKey(Author, on_delete=models.CASCADE)`,
    sampleData: `a1 = Author.objects.create(name='Alice')  # pk=1
a5 = Author.objects.create(name='Bob')    # pk=5 (assume)
Book.objects.create(title='Alice Book', author=a1)
Book.objects.create(title='Bob Book', author=a5)`,
    problemStatement: "Get all books NOT written by the author with id=5.",
    expectedResult: "All books except those where author_id=5.",
    hints: [
      "~Q(author_id=5) negates the FK condition.",
      "exclude(author_id=5) is equivalent but ~Q is more composable."
    ],
    solution: `from django.db.models import Q

books = Book.objects.filter(~Q(author_id=5))`,
    alternativeSolutions: [
      `books = Book.objects.exclude(author_id=5)`,
      `books = Book.objects.filter(~Q(author__id=5))`
    ],
    explanation: "~Q(author_id=5) generates WHERE NOT author_id = 5. author_id is the raw FK column (no JOIN needed), while author__id traverses the FK relationship (produces a JOIN). Both yield identical results. exclude() is the most readable form for simple negation.",
    tags: ["Q", "NOT", "negate", "FK", "filter", "intermediate"]
  },
  {
    id: "ex-094",
    title: "Triple Condition: A AND (B OR C) NOT D",
    difficulty: "advanced",
    topic: "Q objects",
    category: "queries",
    description: "Combine three conditions with AND, OR, and NOT in a single Q expression.",
    schema: `from django.db import models

class Article(models.Model):
    title = models.CharField(max_length=200)
    is_published = models.BooleanField(default=False)
    category = models.CharField(max_length=100)
    views = models.IntegerField(default=0)
    is_flagged = models.BooleanField(default=False)`,
    sampleData: `Article.objects.create(title='Tech News', is_published=True, category='Tech', views=500, is_flagged=False)
Article.objects.create(title='Sports Update', is_published=True, category='Sports', views=100, is_flagged=False)
Article.objects.create(title='Flagged Tech', is_published=True, category='Tech', views=600, is_flagged=True)
Article.objects.create(title='Draft', is_published=False, category='Tech', views=0, is_flagged=False)`,
    problemStatement: "Find published articles (A) that are in category 'Tech' (B) OR have >200 views (C), but NOT flagged (D).",
    expectedResult: "1 article: 'Tech News' (published, Tech, 500 views, not flagged).",
    hints: [
      "A & (B | C) & ~D is the logical structure.",
      "Use parentheses to group Q objects and control operator precedence."
    ],
    solution: `from django.db.models import Q

articles = Article.objects.filter(
    Q(is_published=True) &
    (Q(category='Tech') | Q(views__gt=200)) &
    ~Q(is_flagged=True)
)`,
    alternativeSolutions: [
      `from django.db.models import Q\narticles = Article.objects.filter(\n    is_published=True\n).filter(\n    Q(category='Tech') | Q(views__gt=200)\n).exclude(\n    is_flagged=True\n)`
    ],
    explanation: "Chaining .filter().filter() is always AND between the chains. Within a single filter(), combining Q objects with &, |, and ~ gives full boolean control. The parenthesised (Q(category=...) | Q(views__gt=...)) ensures OR is evaluated before the outer AND.",
    tags: ["Q", "AND", "OR", "NOT", "complex", "advanced", "queryset"]
  },
  {
    id: "ex-095",
    title: "Q on Related Field: Orders From London Customers",
    difficulty: "intermediate",
    topic: "Q objects",
    category: "queries",
    description: "Use Q with FK traversal to filter orders based on customer city.",
    schema: `from django.db import models

class Customer(models.Model):
    name = models.CharField(max_length=100)
    city = models.CharField(max_length=100)

class Order(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='orders')
    total = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20)`,
    sampleData: `c1 = Customer.objects.create(name='Alice', city='London')
c2 = Customer.objects.create(name='Bob', city='Paris')
Order.objects.create(customer=c1, total=150.00, status='completed')
Order.objects.create(customer=c2, total=200.00, status='pending')`,
    problemStatement: "Find all orders where the customer's city is 'London' using a Q object.",
    expectedResult: "1 order for Alice from London.",
    hints: [
      "Use Q(customer__city='London') for FK traversal inside Q.",
      "This generates a JOIN with the customer table."
    ],
    solution: `from django.db.models import Q

orders = Order.objects.filter(Q(customer__city='London'))`,
    alternativeSolutions: [
      `orders = Order.objects.filter(customer__city='London')`,
      `from django.db.models import Q\norders = Order.objects.filter(\n    Q(customer__city='London') & Q(status='completed')\n)`
    ],
    explanation: "Q(customer__city='London') traverses the FK exactly like the keyword argument customer__city='London'. The advantage of Q is that it can be combined with | and ~ for complex conditions. Django generates an INNER JOIN between Order and Customer tables.",
    tags: ["Q", "FK", "filter", "join", "intermediate"]
  },
  {
    id: "ex-096",
    title: "Q Date Filter: Posts Published Today or Modified This Week",
    difficulty: "intermediate",
    topic: "Q objects",
    category: "queries",
    description: "Find posts published today OR modified within the last 7 days using Q objects.",
    schema: `from django.db import models

class Post(models.Model):
    title = models.CharField(max_length=200)
    published_at = models.DateTimeField(null=True, blank=True)
    modified_at = models.DateTimeField(auto_now=True)
    is_published = models.BooleanField(default=False)`,
    sampleData: `from django.utils import timezone
from datetime import timedelta
now = timezone.now()
Post.objects.create(title='Today Post', published_at=now, is_published=True)
Post.objects.create(title='Old Post', published_at=now - timedelta(days=30), is_published=True)
Post.objects.create(title='Recent Draft', published_at=None, is_published=False)`,
    problemStatement: "Find posts where published_at__date=today OR modified_at is within the last 7 days.",
    expectedResult: "Posts published today and/or modified in the past week.",
    hints: [
      "Use __date for date-only comparison on DateTimeField.",
      "Use __gte with a timedelta for range queries."
    ],
    solution: `from django.db.models import Q
from django.utils import timezone
from datetime import timedelta

today = timezone.now().date()
week_ago = timezone.now() - timedelta(days=7)

posts = Post.objects.filter(
    Q(published_at__date=today) |
    Q(modified_at__gte=week_ago)
)`,
    alternativeSolutions: [
      `from django.db.models import Q\nfrom django.utils import timezone\nfrom datetime import timedelta\nnow = timezone.now()\nposts = Post.objects.filter(\n    Q(published_at__date=now.date()) |\n    Q(modified_at__gte=now - timedelta(days=7))\n)`
    ],
    explanation: "__date extracts the date portion of a DateTimeField for comparison, timezone-aware. __gte with a datetime object filters for records where the field is on or after the specified moment. Combining both with | covers both conditions in a single SQL query.",
    tags: ["Q", "OR", "date", "filter", "datetime", "intermediate"]
  },
  {
    id: "ex-097",
    title: "Dynamic Filter Loop: Build Q From a Dict of Conditions",
    difficulty: "advanced",
    topic: "Q objects",
    category: "queries",
    description: "Build a combined Q filter dynamically from a dictionary of field-value conditions at runtime.",
    schema: `from django.db import models

class Product(models.Model):
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    in_stock = models.BooleanField(default=True)`,
    sampleData: `Product.objects.create(name='Laptop', category='Electronics', price=999, in_stock=True)
Product.objects.create(name='Phone', category='Electronics', price=599, in_stock=False)
Product.objects.create(name='Shirt', category='Clothing', price=29, in_stock=True)`,
    problemStatement: "Given a dict of filter conditions, dynamically build and apply a Q-based filter that ANDs all conditions together.",
    expectedResult: "Products matching all conditions in the dict.",
    hints: [
      "Start with Q() (empty Q, identity for AND) and combine with &.",
      "Use **{'field__lookup': value} to unpack dict keys as Q kwargs."
    ],
    solution: `from django.db.models import Q

# Runtime filter conditions (e.g., from API query params)
filters = {
    'category': 'Electronics',
    'in_stock': True,
    'price__lt': 800,
}

# Build combined Q with AND
combined_q = Q()
for field, value in filters.items():
    combined_q &= Q(**{field: value})

products = Product.objects.filter(combined_q)`,
    alternativeSolutions: [
      `# Equivalent: pass dict directly to filter\nproducts = Product.objects.filter(**filters)`,
      `# Using reduce for AND\nimport operator\nfrom functools import reduce\nfrom django.db.models import Q\nq_list = [Q(**{k: v}) for k, v in filters.items()]\nproducts = Product.objects.filter(reduce(operator.and_, q_list))`
    ],
    explanation: "Q() with no arguments is a no-op identity for AND operations. Accumulating with &= builds the compound filter. The **{field: value} syntax dynamically unpacks a dict key as a keyword argument to Q(). This pattern is essential for building filters from API query parameters.",
    tags: ["Q", "dynamic", "AND", "filter", "advanced", "queryset"]
  },
  // ============================================================
  // F EXPRESSIONS (ex-098 to ex-105)
  // ============================================================
  {
    id: "ex-098",
    title: "F Expression: Books with 50% or More Discount",
    difficulty: "intermediate",
    topic: "F expressions",
    category: "queries",
    description: "Find books where the sale price is less than half the original price using F expressions.",
    schema: `from django.db import models

class Book(models.Model):
    title = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    sale_price = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)`,
    sampleData: `Book.objects.create(title='Half Off Book', price=40.00, sale_price=18.00)
Book.objects.create(title='Small Discount', price=40.00, sale_price=35.00)
Book.objects.create(title='Massive Sale', price=100.00, sale_price=45.00)`,
    problemStatement: "Find all books where sale_price is less than half of price (sale_price < price * 0.5).",
    expectedResult: "2 books: 'Half Off Book' (18 < 20) and 'Massive Sale' (45 < 50).",
    hints: [
      "F('price') refers to the price column at the database level.",
      "Multiply F expression: F('price') * 0.5"
    ],
    solution: `from django.db.models import F

books = Book.objects.filter(
    sale_price__lt=F('price') * 0.5
)`,
    alternativeSolutions: [
      `from django.db.models import F\n# Using ExpressionWrapper for explicit output type\nfrom django.db.models import ExpressionWrapper, DecimalField\nbooks = Book.objects.filter(\n    sale_price__lt=ExpressionWrapper(\n        F('price') * 0.5, output_field=DecimalField()\n    )\n)`
    ],
    explanation: "F('price') represents the database column value, allowing column-to-column comparisons without loading data into Python. F('price') * 0.5 generates price * 0.5 in SQL. This is evaluated per-row in the database, making it efficient for large tables.",
    tags: ["F", "filter", "arithmetic", "column-comparison", "intermediate"]
  },
  {
    id: "ex-099",
    title: "F Expression: Increment Product Views by 1",
    difficulty: "intermediate",
    topic: "F expressions",
    category: "queries",
    description: "Use F expression in an update to atomically increment the view count for all products.",
    schema: `from django.db import models

class Product(models.Model):
    name = models.CharField(max_length=200)
    views = models.IntegerField(default=0)`,
    sampleData: `Product.objects.create(name='Laptop', views=100)
Product.objects.create(name='Phone', views=250)
Product.objects.create(name='Tablet', views=75)`,
    problemStatement: "Increment the views field by 1 for all products in a single database query.",
    expectedResult: "All products have views incremented: 101, 251, 76.",
    hints: [
      "Use update() with F('views') + 1.",
      "F in update() avoids race conditions — no Python read needed."
    ],
    solution: `from django.db.models import F

Product.objects.update(views=F('views') + 1)`,
    alternativeSolutions: [
      `# Race-condition-prone Python approach (avoid)\nfor product in Product.objects.all():\n    product.views += 1\n    product.save()`,
      `# For a single object\nProduct.objects.filter(pk=1).update(views=F('views') + 1)`
    ],
    explanation: "F('views') + 1 in update() generates UPDATE product SET views = views + 1 — a single atomic SQL statement. The Python-loop approach requires a SELECT then N UPDATEs, and is prone to race conditions in concurrent environments. F expressions are the correct pattern for increments.",
    tags: ["F", "update", "atomic", "increment", "intermediate"]
  },
  {
    id: "ex-100",
    title: "F Expression: Employees Where Salary Equals Bonus",
    difficulty: "intermediate",
    topic: "F expressions",
    category: "queries",
    description: "Find employees where their salary value equals their bonus value using F field-to-field comparison.",
    schema: `from django.db import models

class Employee(models.Model):
    name = models.CharField(max_length=100)
    salary = models.DecimalField(max_digits=10, decimal_places=2)
    bonus = models.DecimalField(max_digits=10, decimal_places=2)`,
    sampleData: `Employee.objects.create(name='Alice', salary=50000, bonus=50000)
Employee.objects.create(name='Bob', salary=60000, bonus=10000)
Employee.objects.create(name='Carol', salary=45000, bonus=45000)`,
    problemStatement: "Find all employees whose salary is exactly equal to their bonus.",
    expectedResult: "2 employees: Alice and Carol.",
    hints: [
      "filter(salary=F('bonus')) compares two columns in the same row.",
      "This generates WHERE salary = bonus in SQL."
    ],
    solution: `from django.db.models import F

employees = Employee.objects.filter(salary=F('bonus'))`,
    alternativeSolutions: [
      `# Python-level comparison (loads all rows — avoid for large tables)\nemployees = [e for e in Employee.objects.all() if e.salary == e.bonus]`
    ],
    explanation: "filter(salary=F('bonus')) compares the salary column to the bonus column within the same row. Django generates WHERE salary = bonus. Without F, you'd need to load all rows into Python to compare. F expressions push the comparison to the database efficiently.",
    tags: ["F", "filter", "column-comparison", "field-vs-field", "intermediate"]
  },
  {
    id: "ex-101",
    title: "F Expression: Give All Employees a 10% Raise",
    difficulty: "intermediate",
    topic: "F expressions",
    category: "queries",
    description: "Use F expression to multiply salary by 1.10 in a single atomic update for all employees.",
    schema: `from django.db import models

class Employee(models.Model):
    name = models.CharField(max_length=100)
    department = models.CharField(max_length=100)
    salary = models.DecimalField(max_digits=10, decimal_places=2)`,
    sampleData: `Employee.objects.create(name='Alice', department='Engineering', salary=80000)
Employee.objects.create(name='Bob', department='Marketing', salary=60000)
Employee.objects.create(name='Carol', department='Engineering', salary=90000)`,
    problemStatement: "Give every employee a 10% salary raise in a single database update using F expression.",
    expectedResult: "Salaries become 88000, 66000, 99000.",
    hints: [
      "Use Decimal('1.10') to avoid floating-point issues with DecimalField.",
      "update(salary=F('salary') * Decimal('1.10')) is a single SQL UPDATE."
    ],
    solution: `from django.db.models import F
from decimal import Decimal

Employee.objects.update(salary=F('salary') * Decimal('1.10'))`,
    alternativeSolutions: [
      `# Only Engineering department\nfrom django.db.models import F\nfrom decimal import Decimal\nEmployee.objects.filter(department='Engineering').update(\n    salary=F('salary') * Decimal('1.10')\n)`
    ],
    explanation: "F('salary') * Decimal('1.10') generates UPDATE employee SET salary = salary * 1.10 in a single SQL statement. Using Decimal instead of float prevents floating-point precision errors when working with DecimalField. This updates all rows without loading any into Python.",
    tags: ["F", "update", "arithmetic", "decimal", "atomic", "intermediate"]
  },
  {
    id: "ex-102",
    title: "F Expression: Orders Where Shipping Exceeds 5% of Total",
    difficulty: "advanced",
    topic: "F expressions",
    category: "queries",
    description: "Find orders where the shipping cost is more than 5% of the order total using F expressions.",
    schema: `from django.db import models

class Order(models.Model):
    reference = models.CharField(max_length=20)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    shipping_cost = models.DecimalField(max_digits=8, decimal_places=2)`,
    sampleData: `Order.objects.create(reference='ORD-001', total=200.00, shipping_cost=5.00)
Order.objects.create(reference='ORD-002', total=30.00, shipping_cost=8.00)
Order.objects.create(reference='ORD-003', total=500.00, shipping_cost=10.00)`,
    problemStatement: "Find orders where shipping_cost > total * 0.05.",
    expectedResult: "1 order: ORD-002 (shipping 8.00 > 30 * 0.05 = 1.50).",
    hints: [
      "F('total') * Decimal('0.05') computes 5% of total per row.",
      "Use ExpressionWrapper if Django raises a mixed-type error."
    ],
    solution: `from django.db.models import F
from decimal import Decimal

orders = Order.objects.filter(
    shipping_cost__gt=F('total') * Decimal('0.05')
)`,
    alternativeSolutions: [
      `from django.db.models import F, ExpressionWrapper, DecimalField\nfrom decimal import Decimal\nfive_percent = ExpressionWrapper(\n    F('total') * Decimal('0.05'),\n    output_field=DecimalField()\n)\norders = Order.objects.filter(shipping_cost__gt=five_percent)`
    ],
    explanation: "F('total') * Decimal('0.05') computes 5% of the total column at the database level per row. When Django cannot infer the output type of an expression, wrapping with ExpressionWrapper and specifying output_field resolves type inference errors. This is common with mixed arithmetic on DecimalField.",
    tags: ["F", "filter", "arithmetic", "decimal", "ExpressionWrapper", "advanced"]
  },
  {
    id: "ex-103",
    title: "F Expression: Set Sale Price to 90% of Price",
    difficulty: "intermediate",
    topic: "F expressions",
    category: "queries",
    description: "Use an F expression update to set sale_price to 90% of the original price for all books.",
    schema: `from django.db import models

class Book(models.Model):
    title = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    sale_price = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)`,
    sampleData: `Book.objects.create(title='Python Crash Course', price=40.00)
Book.objects.create(title='Clean Code', price=50.00)
Book.objects.create(title='The Pragmatic Programmer', price=45.00)`,
    problemStatement: "Update sale_price for all books to be 90% of their price in one query.",
    expectedResult: "sale_price values: 36.00, 45.00, 40.50.",
    hints: [
      "F('price') * Decimal('0.9') computes 90% of price per row.",
      "update() applies to all rows matched by the queryset."
    ],
    solution: `from django.db.models import F
from decimal import Decimal

Book.objects.update(sale_price=F('price') * Decimal('0.9'))`,
    alternativeSolutions: [
      `# Only update books without existing sale price\nfrom django.db.models import F\nfrom decimal import Decimal\nBook.objects.filter(sale_price__isnull=True).update(\n    sale_price=F('price') * Decimal('0.9')\n)`
    ],
    explanation: "update(sale_price=F('price') * 0.9) generates UPDATE book SET sale_price = price * 0.9 touching every row in one SQL statement. The F expression reads the price column for each row during the UPDATE itself, so no Python-level data loading occurs.",
    tags: ["F", "update", "arithmetic", "bulk-update", "intermediate"]
  },
  {
    id: "ex-104",
    title: "F Expression: Products Below Reorder Level",
    difficulty: "intermediate",
    topic: "F expressions",
    category: "queries",
    description: "Find products where current stock has fallen below the reorder threshold.",
    schema: `from django.db import models

class Product(models.Model):
    name = models.CharField(max_length=200)
    stock = models.IntegerField(default=0)
    reorder_level = models.IntegerField(default=10)`,
    sampleData: `Product.objects.create(name='Widget A', stock=5, reorder_level=20)
Product.objects.create(name='Widget B', stock=50, reorder_level=10)
Product.objects.create(name='Widget C', stock=8, reorder_level=5)`,
    problemStatement: "Find all products where reorder_level is greater than stock (stock is below reorder point).",
    expectedResult: "1 product: Widget A (reorder_level=20 > stock=5).",
    hints: [
      "filter(reorder_level__gt=F('stock')) compares two columns.",
      "Equivalent: filter(stock__lt=F('reorder_level'))."
    ],
    solution: `from django.db.models import F

products = Product.objects.filter(reorder_level__gt=F('stock'))`,
    alternativeSolutions: [
      `from django.db.models import F\nproducts = Product.objects.filter(stock__lt=F('reorder_level'))`,
      `# Annotate with shortfall amount\nfrom django.db.models import F, ExpressionWrapper, IntegerField\nproducts = Product.objects.filter(\n    stock__lt=F('reorder_level')\n).annotate(\n    shortfall=ExpressionWrapper(F('reorder_level') - F('stock'), output_field=IntegerField())\n)`
    ],
    explanation: "Both filter(reorder_level__gt=F('stock')) and filter(stock__lt=F('reorder_level')) generate WHERE reorder_level > stock. These are logically identical — the lookup direction is just inverted. The annotated version adds a computed shortfall column for reporting.",
    tags: ["F", "filter", "column-comparison", "inventory", "intermediate"]
  },
  {
    id: "ex-105",
    title: "F Expression: Annotate Profit Using ExpressionWrapper",
    difficulty: "advanced",
    topic: "F expressions",
    category: "queries",
    description: "Annotate each product with its profit margin (price minus cost) using F and ExpressionWrapper.",
    schema: `from django.db import models

class Product(models.Model):
    name = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    cost = models.DecimalField(max_digits=8, decimal_places=2)`,
    sampleData: `Product.objects.create(name='Widget', price=50.00, cost=30.00)
Product.objects.create(name='Gadget', price=200.00, cost=120.00)
Product.objects.create(name='Doohickey', price=15.00, cost=8.00)`,
    problemStatement: "Annotate each product with profit = price - cost using ExpressionWrapper.",
    expectedResult: "Products annotated with profit: 20.00, 80.00, 7.00.",
    hints: [
      "ExpressionWrapper wraps arithmetic and declares the output_field type.",
      "F('price') - F('cost') computes the subtraction at the database level."
    ],
    solution: `from django.db.models import F, ExpressionWrapper, DecimalField

products = Product.objects.annotate(
    profit=ExpressionWrapper(
        F('price') - F('cost'),
        output_field=DecimalField()
    )
)

for p in products:
    print(f"{p.name}: profit = {p.profit}")`,
    alternativeSolutions: [
      `from django.db.models import F, ExpressionWrapper, DecimalField\n# Filter for profitable products\nproducts = Product.objects.annotate(\n    profit=ExpressionWrapper(F('price') - F('cost'), output_field=DecimalField())\n).filter(profit__gt=0).order_by('-profit')`
    ],
    explanation: "ExpressionWrapper is needed when Django cannot automatically infer the output type of an arithmetic expression involving F objects. Specifying output_field=DecimalField() tells Django how to interpret the result. The annotated profit field is then available for filtering, ordering, and display.",
    tags: ["F", "ExpressionWrapper", "annotate", "arithmetic", "DecimalField", "advanced"]
  },
  // ============================================================
  // ANNOTATE + AGGREGATE (ex-106 to ex-117)
  // ============================================================
  {
    id: "ex-106",
    title: "Annotate Authors with Book Count",
    difficulty: "intermediate",
    topic: "annotate",
    category: "queries",
    description: "Annotate each author with the number of books they have written using Count.",
    schema: `from django.db import models

class Author(models.Model):
    name = models.CharField(max_length=100)

class Book(models.Model):
    title = models.CharField(max_length=200)
    author = models.ForeignKey(Author, on_delete=models.CASCADE, related_name='books')`,
    sampleData: `a1 = Author.objects.create(name='Alice')
a2 = Author.objects.create(name='Bob')
Book.objects.create(title='Book 1', author=a1)
Book.objects.create(title='Book 2', author=a1)
Book.objects.create(title='Book 3', author=a2)`,
    problemStatement: "Annotate each author queryset entry with a book_count field showing how many books they wrote.",
    expectedResult: "Alice: 2 books, Bob: 1 book.",
    hints: [
      "Use annotate(book_count=Count('books')) where 'books' is the related_name.",
      "Count traverses the reverse FK to count related Book records."
    ],
    solution: `from django.db.models import Count

authors = Author.objects.annotate(book_count=Count('books')).order_by('-book_count')

for author in authors:
    print(f"{author.name}: {author.book_count} books")`,
    alternativeSolutions: [
      `from django.db.models import Count\n# Using the model name (lowercase) instead of related_name\nauthors = Author.objects.annotate(book_count=Count('book'))`,
      `from django.db.models import Count\nauthors = Author.objects.annotate(book_count=Count('books', distinct=True))`
    ],
    explanation: "annotate(book_count=Count('books')) adds a book_count attribute to each Author object, computed via GROUP BY author_id and COUNT(*) in SQL. The 'books' string uses the related_name set on the ForeignKey. Each author object in the queryset now has a .book_count attribute.",
    tags: ["annotate", "Count", "aggregate", "FK", "intermediate"]
  },
  {
    id: "ex-107",
    title: "Authors with More Than 3 Books",
    difficulty: "intermediate",
    topic: "annotate",
    category: "queries",
    description: "Use annotate and filter to find authors who have written more than 3 books.",
    schema: `from django.db import models

class Author(models.Model):
    name = models.CharField(max_length=100)

class Book(models.Model):
    title = models.CharField(max_length=200)
    author = models.ForeignKey(Author, on_delete=models.CASCADE, related_name='books')`,
    sampleData: `a1 = Author.objects.create(name='Prolific Writer')
a2 = Author.objects.create(name='Casual Writer')
for i in range(5):
    Book.objects.create(title=f'Book {i}', author=a1)
Book.objects.create(title='Only Book', author=a2)`,
    problemStatement: "Get only those authors who have written more than 3 books.",
    expectedResult: "1 author: 'Prolific Writer' with 5 books.",
    hints: [
      "Annotate first, then filter on the annotation.",
      "filter() after annotate() adds a HAVING clause in SQL."
    ],
    solution: `from django.db.models import Count

authors = Author.objects.annotate(
    book_count=Count('books')
).filter(book_count__gt=3)`,
    alternativeSolutions: [
      `from django.db.models import Count\n# gte=4 is equivalent to gt=3 for integers\nauthors = Author.objects.annotate(\n    book_count=Count('books')\n).filter(book_count__gte=4).order_by('-book_count')`
    ],
    explanation: "Chaining .filter() after .annotate() adds a SQL HAVING clause: HAVING COUNT(books.id) > 3. This filters at the GROUP BY level, not the WHERE level. You cannot reference the annotation alias in a regular WHERE clause — the filter must come after annotate() to use HAVING.",
    tags: ["annotate", "Count", "filter", "HAVING", "aggregate", "intermediate"]
  },
  {
    id: "ex-108",
    title: "Each Category with Average Book Price",
    difficulty: "intermediate",
    topic: "annotate",
    category: "queries",
    description: "Annotate each book category with the average price of its books.",
    schema: `from django.db import models

class Category(models.Model):
    name = models.CharField(max_length=100)

class Book(models.Model):
    title = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='books')`,
    sampleData: `tech = Category.objects.create(name='Tech')
fiction = Category.objects.create(name='Fiction')
Book.objects.create(title='Python', price=40.00, category=tech)
Book.objects.create(title='Django', price=50.00, category=tech)
Book.objects.create(title='Dune', price=15.00, category=fiction)`,
    problemStatement: "Annotate each category with avg_price — the average price of books in that category.",
    expectedResult: "Tech: avg 45.00, Fiction: avg 15.00.",
    hints: [
      "Use Avg('books__price') to traverse the reverse FK to price.",
      "Order by '-avg_price' to rank categories by average price."
    ],
    solution: `from django.db.models import Avg

categories = Category.objects.annotate(
    avg_price=Avg('books__price')
).order_by('-avg_price')

for cat in categories:
    print(f"{cat.name}: avg price = {cat.avg_price:.2f}")`,
    alternativeSolutions: [
      `from django.db.models import Avg\ncategories = Category.objects.annotate(\n    avg_price=Avg('books__price'),\n    book_count=Count('books')\n).filter(book_count__gt=0)`
    ],
    explanation: "Avg('books__price') traverses the reverse FK (books) to the price field and computes AVG(price) grouped by category. Categories with no books get avg_price=None. The double underscore traversal works the same in annotations as in filter lookups.",
    tags: ["annotate", "Avg", "aggregate", "FK", "intermediate"]
  },
  {
    id: "ex-109",
    title: "Department with Highest Average Salary",
    difficulty: "advanced",
    topic: "annotate",
    category: "queries",
    description: "Find the single department with the highest average employee salary using annotate and first().",
    schema: `from django.db import models

class Department(models.Model):
    name = models.CharField(max_length=100)

class Employee(models.Model):
    name = models.CharField(max_length=100)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='employees')
    salary = models.DecimalField(max_digits=10, decimal_places=2)`,
    sampleData: `eng = Department.objects.create(name='Engineering')
mkt = Department.objects.create(name='Marketing')
Employee.objects.create(name='Alice', department=eng, salary=95000)
Employee.objects.create(name='Bob', department=eng, salary=105000)
Employee.objects.create(name='Carol', department=mkt, salary=70000)`,
    problemStatement: "Find the department with the highest average employee salary.",
    expectedResult: "Engineering (avg salary: 100000).",
    hints: [
      "Annotate departments with Avg('employees__salary').",
      "Order by '-avg_salary' and call .first() to get the top result."
    ],
    solution: `from django.db.models import Avg

top_dept = Department.objects.annotate(
    avg_salary=Avg('employees__salary')
).order_by('-avg_salary').first()

print(f"{top_dept.name}: avg salary = {top_dept.avg_salary}")`,
    alternativeSolutions: [
      `from django.db.models import Avg\ntop_dept = Department.objects.annotate(\n    avg_salary=Avg('employees__salary')\n).order_by('-avg_salary')[:1].get()`
    ],
    explanation: "Annotating with Avg then ordering descending and calling .first() is a clean pattern for finding the maximum-annotated record. Django generates a single query: SELECT department.*, AVG(salary) AS avg_salary ... GROUP BY department.id ORDER BY avg_salary DESC LIMIT 1.",
    tags: ["annotate", "Avg", "order_by", "first", "aggregate", "advanced"]
  },
  {
    id: "ex-110",
    title: "Orders Annotated with Item Count",
    difficulty: "intermediate",
    topic: "annotate",
    category: "queries",
    description: "Annotate each order with the number of line items it contains.",
    schema: `from django.db import models

class Order(models.Model):
    reference = models.CharField(max_length=20)
    status = models.CharField(max_length=20, default='pending')

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product_name = models.CharField(max_length=200)
    quantity = models.IntegerField(default=1)`,
    sampleData: `o1 = Order.objects.create(reference='ORD-001')
o2 = Order.objects.create(reference='ORD-002')
OrderItem.objects.create(order=o1, product_name='Laptop', quantity=1)
OrderItem.objects.create(order=o1, product_name='Mouse', quantity=2)
OrderItem.objects.create(order=o2, product_name='Keyboard', quantity=1)`,
    problemStatement: "Annotate each order with item_count — the number of OrderItem records linked to it.",
    expectedResult: "ORD-001: 2 items, ORD-002: 1 item.",
    hints: [
      "Count('items') uses the related_name 'items' on the FK.",
      "Orders with no items get item_count=0."
    ],
    solution: `from django.db.models import Count

orders = Order.objects.annotate(
    item_count=Count('items')
).order_by('reference')

for order in orders:
    print(f"{order.reference}: {order.item_count} items")`,
    alternativeSolutions: [
      `from django.db.models import Count\norders = Order.objects.annotate(\n    item_count=Count('items', distinct=True)\n).filter(item_count__gt=0)`
    ],
    explanation: "Count('items') uses the related_name of the ForeignKey to count reverse-related OrderItem records per order. This generates GROUP BY order.id with COUNT(items.id). distinct=True is redundant here but becomes important when joins cause row multiplication (e.g., with M2M or multiple JOINs).",
    tags: ["annotate", "Count", "aggregate", "reverse-FK", "intermediate"]
  },
  {
    id: "ex-111",
    title: "Customers Who Spent More Than $500 Total",
    difficulty: "advanced",
    topic: "annotate",
    category: "queries",
    description: "Annotate customers with total spending and filter for those who spent over $500.",
    schema: `from django.db import models

class Customer(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField()

class Order(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='orders')
    total = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, default='completed')`,
    sampleData: `c1 = Customer.objects.create(name='Alice', email='alice@example.com')
c2 = Customer.objects.create(name='Bob', email='bob@example.com')
Order.objects.create(customer=c1, total=300.00)
Order.objects.create(customer=c1, total=250.00)
Order.objects.create(customer=c2, total=100.00)`,
    problemStatement: "Find customers whose sum of all order totals exceeds $500.",
    expectedResult: "1 customer: Alice (total: $550).",
    hints: [
      "Use Sum('orders__total') to sum all order totals per customer.",
      "Filter on total_spent__gt=500 after annotating."
    ],
    solution: `from django.db.models import Sum

customers = Customer.objects.annotate(
    total_spent=Sum('orders__total')
).filter(total_spent__gt=500).order_by('-total_spent')

for c in customers:
    print(f"{c.name}: \${c.total_spent}")`,
    alternativeSolutions: [
      `from django.db.models import Sum\ncustomers = Customer.objects.annotate(\n    total_spent=Sum('orders__total')\n).filter(\n    total_spent__gte=500.01  # strict > 500\n)`
    ],
    explanation: "Sum('orders__total') traverses the reverse FK to sum order totals per customer, grouped by customer.id. Chaining .filter(total_spent__gt=500) adds HAVING SUM(orders.total) > 500. Customers with no orders get total_spent=None and are excluded by the gt filter.",
    tags: ["annotate", "Sum", "filter", "HAVING", "aggregate", "advanced"]
  },
  {
    id: "ex-112",
    title: "Books Annotated with Review Count and Average Rating",
    difficulty: "intermediate",
    topic: "annotate",
    category: "queries",
    description: "Annotate each book with both review count and average rating in a single query.",
    schema: `from django.db import models

class Book(models.Model):
    title = models.CharField(max_length=200)

class Review(models.Model):
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='reviews')
    rating = models.IntegerField()
    text = models.TextField()`,
    sampleData: `b1 = Book.objects.create(title='Django for Beginners')
b2 = Book.objects.create(title='Advanced Django')
Review.objects.create(book=b1, rating=5, text='Great!')
Review.objects.create(book=b1, rating=4, text='Good.')
Review.objects.create(book=b2, rating=3, text='Okay.')`,
    problemStatement: "Annotate each book with review_count and avg_rating in a single queryset.",
    expectedResult: "Django for Beginners: 2 reviews, avg 4.5. Advanced Django: 1 review, avg 3.0.",
    hints: [
      "Multiple annotations can be chained or combined in one annotate() call.",
      "Use Count('reviews') and Avg('reviews__rating') together."
    ],
    solution: `from django.db.models import Count, Avg

books = Book.objects.annotate(
    review_count=Count('reviews'),
    avg_rating=Avg('reviews__rating')
).order_by('-avg_rating')

for book in books:
    print(f"{book.title}: {book.review_count} reviews, avg {book.avg_rating}")`,
    alternativeSolutions: [
      `from django.db.models import Count, Avg\n# Separate annotate calls also work\nbooks = Book.objects.annotate(\n    review_count=Count('reviews')\n).annotate(\n    avg_rating=Avg('reviews__rating')\n)`
    ],
    explanation: "Multiple aggregates in a single annotate() call are computed in one SQL query with multiple aggregate functions: SELECT COUNT(reviews.id) AS review_count, AVG(reviews.rating) AS avg_rating FROM book LEFT JOIN review ... GROUP BY book.id. This is more efficient than two separate queries.",
    tags: ["annotate", "Count", "Avg", "multiple-aggregates", "intermediate"]
  },
  {
    id: "ex-113",
    title: "Orders Per Month Using TruncMonth",
    difficulty: "advanced",
    topic: "annotate",
    category: "queries",
    description: "Group orders by month and count how many orders were placed each month.",
    schema: `from django.db import models

class Order(models.Model):
    reference = models.CharField(max_length=20)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField()`,
    sampleData: `from django.utils import timezone
from datetime import datetime
Order.objects.create(reference='ORD-001', total=100, created_at=datetime(2024, 1, 15, tzinfo=timezone.utc))
Order.objects.create(reference='ORD-002', total=200, created_at=datetime(2024, 1, 22, tzinfo=timezone.utc))
Order.objects.create(reference='ORD-003', total=300, created_at=datetime(2024, 2, 5, tzinfo=timezone.utc))`,
    problemStatement: "Count the number of orders placed each month, grouped by month.",
    expectedResult: "2024-01: 2 orders, 2024-02: 1 order.",
    hints: [
      "TruncMonth truncates the datetime to month precision.",
      "Combine annotate(month=TruncMonth(...)) then values('month') then Count."
    ],
    solution: `from django.db.models import Count
from django.db.models.functions import TruncMonth

monthly_orders = (
    Order.objects
    .annotate(month=TruncMonth('created_at'))
    .values('month')
    .annotate(order_count=Count('id'))
    .order_by('month')
)

for row in monthly_orders:
    print(f"{row['month'].strftime('%Y-%m')}: {row['order_count']} orders")`,
    alternativeSolutions: [
      `from django.db.models import Count\nfrom django.db.models.functions import TruncMonth\nresult = (\n    Order.objects\n    .annotate(month=TruncMonth('created_at'))\n    .values('month')\n    .annotate(count=Count('id'), total_revenue=Sum('total'))\n    .order_by('month')\n)`
    ],
    explanation: "TruncMonth('created_at') truncates each datetime to the first of its month. Calling .values('month') groups by the truncated month. The second .annotate() then counts rows within each group. The pattern annotate() → values() → annotate() is the standard Django approach for time-series aggregation.",
    tags: ["annotate", "TruncMonth", "Count", "group-by", "time-series", "advanced"]
  },
  {
    id: "ex-114",
    title: "Products Annotated with Total Revenue",
    difficulty: "advanced",
    topic: "annotate",
    category: "queries",
    description: "Annotate products with total revenue computed as quantity sold times unit price using ExpressionWrapper.",
    schema: `from django.db import models

class Product(models.Model):
    name = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=8, decimal_places=2)

class SaleLine(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='sale_lines')
    quantity = models.IntegerField(default=1)`,
    sampleData: `p1 = Product.objects.create(name='Laptop', price=999.00)
p2 = Product.objects.create(name='Mouse', price=29.00)
SaleLine.objects.create(product=p1, quantity=3)
SaleLine.objects.create(product=p1, quantity=2)
SaleLine.objects.create(product=p2, quantity=10)`,
    problemStatement: "Annotate each product with total_revenue = SUM(sale_lines__quantity) * price.",
    expectedResult: "Laptop: 5 * 999 = 4995.00, Mouse: 10 * 29 = 290.00.",
    hints: [
      "First annotate with Sum of quantities, then compute revenue with ExpressionWrapper.",
      "Alternatively, use Sum with an expression inside."
    ],
    solution: `from django.db.models import Sum, F, ExpressionWrapper, DecimalField

products = Product.objects.annotate(
    total_qty=Sum('sale_lines__quantity')
).annotate(
    total_revenue=ExpressionWrapper(
        F('total_qty') * F('price'),
        output_field=DecimalField()
    )
).order_by('-total_revenue')

for p in products:
    print(f"{p.name}: revenue = {p.total_revenue}")`,
    alternativeSolutions: [
      `from django.db.models import Sum, F, ExpressionWrapper, DecimalField\n# Single annotate with nested expression\nproducts = Product.objects.annotate(\n    total_revenue=Sum(\n        ExpressionWrapper(F('price') * F('sale_lines__quantity'), output_field=DecimalField())\n    )\n)`
    ],
    explanation: "Chaining two annotate() calls allows building on the first annotation (total_qty) in the second. ExpressionWrapper is required when multiplying an aggregated integer by a DecimalField to specify the output type. The nested Sum+ExpressionWrapper approach computes revenue directly but may be less readable.",
    tags: ["annotate", "Sum", "F", "ExpressionWrapper", "revenue", "advanced"]
  },
  {
    id: "ex-115",
    title: "Conditional Count with filter= Kwarg",
    difficulty: "advanced",
    topic: "annotate",
    category: "queries",
    description: "Use Count with filter= kwarg to conditionally count only specific related records.",
    schema: `from django.db import models

class Author(models.Model):
    name = models.CharField(max_length=100)

class Book(models.Model):
    title = models.CharField(max_length=200)
    author = models.ForeignKey(Author, on_delete=models.CASCADE, related_name='books')
    is_published = models.BooleanField(default=False)`,
    sampleData: `a = Author.objects.create(name='Alice')
Book.objects.create(title='Published 1', author=a, is_published=True)
Book.objects.create(title='Published 2', author=a, is_published=True)
Book.objects.create(title='Draft', author=a, is_published=False)`,
    problemStatement: "Annotate each author with total book count AND count of only published books, in a single query.",
    expectedResult: "Alice: 3 total, 2 published.",
    hints: [
      "Count('books', filter=Q(books__is_published=True)) counts only published books.",
      "This generates a conditional COUNT using SQL FILTER or CASE WHEN."
    ],
    solution: `from django.db.models import Count, Q

authors = Author.objects.annotate(
    total_books=Count('books'),
    published_books=Count('books', filter=Q(books__is_published=True))
)

for a in authors:
    print(f"{a.name}: {a.total_books} total, {a.published_books} published")`,
    alternativeSolutions: [
      `from django.db.models import Count, Q, Case, When, IntegerField\n# Old approach using Case/When\nauthors = Author.objects.annotate(\n    published_books=Count(\n        Case(When(books__is_published=True, then=1), output_field=IntegerField())\n    )\n)`
    ],
    explanation: "The filter= kwarg on Count (Django 2.0+) generates a conditional aggregate: COUNT(CASE WHEN is_published THEN 1 END) or COUNT(*) FILTER (WHERE is_published) on PostgreSQL. This avoids a second query or GROUP BY subquery. It's the modern replacement for the Case/When inside Count pattern.",
    tags: ["annotate", "Count", "filter-kwarg", "conditional", "aggregate", "advanced"]
  },
  {
    id: "ex-116",
    title: "Combined Aggregate: total, avg, count, min, max in One Call",
    difficulty: "advanced",
    topic: "annotate",
    category: "queries",
    description: "Run multiple aggregate functions on an order queryset in a single database call.",
    schema: `from django.db import models

class Order(models.Model):
    reference = models.CharField(max_length=20)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, default='completed')`,
    sampleData: `Order.objects.create(reference='ORD-001', total=100.00)
Order.objects.create(reference='ORD-002', total=250.00)
Order.objects.create(reference='ORD-003', total=75.00)
Order.objects.create(reference='ORD-004', total=400.00)`,
    problemStatement: "In a single query, compute total revenue, average order value, order count, minimum, and maximum order total.",
    expectedResult: "{'total': 825, 'avg': 206.25, 'count': 4, 'min': 75, 'max': 400}",
    hints: [
      "Pass multiple aggregate functions to a single .aggregate() call.",
      "aggregate() returns a dict, not a QuerySet."
    ],
    solution: `from django.db.models import Sum, Avg, Count, Min, Max

stats = Order.objects.filter(status='completed').aggregate(
    total=Sum('total'),
    avg=Avg('total'),
    count=Count('id'),
    min_order=Min('total'),
    max_order=Max('total'),
)

print(stats)
# {'total': Decimal('825.00'), 'avg': ..., 'count': 4, ...}`,
    alternativeSolutions: [
      `from django.db.models import Sum, Avg, Count, Min, Max\n# All orders regardless of status\nstats = Order.objects.aggregate(\n    total_revenue=Sum('total'),\n    average_order=Avg('total'),\n    order_count=Count('pk'),\n    smallest=Min('total'),\n    largest=Max('total'),\n)`
    ],
    explanation: "aggregate() accepts multiple keyword arguments, each being an aggregate expression. Django issues a single SQL query: SELECT SUM(total), AVG(total), COUNT(id), MIN(total), MAX(total) FROM order WHERE status='completed'. The result is a plain Python dict with your specified keys.",
    tags: ["aggregate", "Sum", "Avg", "Count", "Min", "Max", "advanced"]
  },
  {
    id: "ex-117",
    title: "Annotate Years of Service with ExpressionWrapper and Now()",
    difficulty: "advanced",
    topic: "annotate",
    category: "queries",
    description: "Annotate employees with years_of_service calculated as the difference between today and hire_date.",
    schema: `from django.db import models

class Employee(models.Model):
    name = models.CharField(max_length=100)
    hire_date = models.DateField()
    department = models.CharField(max_length=100)`,
    sampleData: `from datetime import date
Employee.objects.create(name='Alice', hire_date=date(2018, 3, 1), department='Engineering')
Employee.objects.create(name='Bob', hire_date=date(2021, 7, 15), department='Marketing')
Employee.objects.create(name='Carol', hire_date=date(2015, 1, 20), department='Engineering')`,
    problemStatement: "Annotate each employee with years_of_service as an integer, computed at the database level.",
    expectedResult: "Alice: ~6 years, Bob: ~3 years, Carol: ~9 years (depends on today's date).",
    hints: [
      "Use Now() from django.db.models.functions to get the current timestamp.",
      "Wrap Now() - F('hire_date') in ExpressionWrapper with output_field=DurationField()."
    ],
    solution: `from django.db.models import F, ExpressionWrapper, DurationField
from django.db.models.functions import Now

employees = Employee.objects.annotate(
    service_duration=ExpressionWrapper(
        Now() - F('hire_date'),
        output_field=DurationField()
    )
)

# Convert timedelta to years in Python
for e in employees:
    years = e.service_duration.days // 365
    print(f"{e.name}: {years} years of service")`,
    alternativeSolutions: [
      `# PostgreSQL-specific: extract years directly\nfrom django.db.models import F, IntegerField, ExpressionWrapper\nfrom django.db.models.functions import ExtractYear, Now, TruncYear\n# Note: date arithmetic behavior varies by database backend`
    ],
    explanation: "Now() returns the current database timestamp. Subtracting a DateField from it produces a DurationField (timedelta). ExpressionWrapper makes the output type explicit. The result .days // 365 converts to approximate years in Python. Database-native year extraction is more accurate but less portable.",
    tags: ["annotate", "ExpressionWrapper", "Now", "DurationField", "F", "advanced"]
  },
  // ============================================================
  // RELATED QUERIES / FK / M2M (ex-118 to ex-132)
  // ============================================================
  {
    id: "ex-118",
    title: "FK Traversal: Books by Orwell",
    difficulty: "intermediate",
    topic: "related queries",
    category: "queries",
    description: "Use double-underscore FK traversal to filter books by author name.",
    schema: `from django.db import models

class Author(models.Model):
    name = models.CharField(max_length=100)

class Book(models.Model):
    title = models.CharField(max_length=200)
    author = models.ForeignKey(Author, on_delete=models.CASCADE, related_name='books')`,
    sampleData: `orwell = Author.objects.create(name='Orwell')
tolkien = Author.objects.create(name='Tolkien')
Book.objects.create(title='1984', author=orwell)
Book.objects.create(title='Animal Farm', author=orwell)
Book.objects.create(title='The Hobbit', author=tolkien)`,
    problemStatement: "Get all books where the author's name is 'Orwell' using FK lookup.",
    expectedResult: "2 books: '1984' and 'Animal Farm'.",
    hints: [
      "author__name traverses the FK to the Author model's name field.",
      "Django generates an INNER JOIN between Book and Author tables."
    ],
    solution: `books = Book.objects.filter(author__name='Orwell')`,
    alternativeSolutions: [
      `# First get author, then filter\norwell = Author.objects.get(name='Orwell')\nbooks = Book.objects.filter(author=orwell)`,
      `books = Book.objects.filter(author__name__icontains='orwell')`
    ],
    explanation: "author__name uses Django's double-underscore FK traversal. Django generates SELECT book.* FROM book INNER JOIN author ON book.author_id = author.id WHERE author.name = 'Orwell'. This avoids loading the Author object first. You can chain further: author__country__name.",
    tags: ["FK", "filter", "double-underscore", "join", "intermediate"]
  },
  {
    id: "ex-119",
    title: "FK Traversal: Orders for a Customer by Email",
    difficulty: "intermediate",
    topic: "related queries",
    category: "queries",
    description: "Filter orders based on the customer's email using FK traversal.",
    schema: `from django.db import models

class Customer(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)

class Order(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='orders')
    total = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20)`,
    sampleData: `c = Customer.objects.create(name='John', email='john@test.com')
Order.objects.create(customer=c, total=150.00, status='completed')
Order.objects.create(customer=c, total=300.00, status='pending')`,
    problemStatement: "Retrieve all orders placed by the customer with email 'john@test.com'.",
    expectedResult: "2 orders: $150 and $300.",
    hints: [
      "customer__email traverses the Customer FK to its email field.",
      "EmailField works with exact match lookups."
    ],
    solution: `orders = Order.objects.filter(customer__email='john@test.com')`,
    alternativeSolutions: [
      `customer = Customer.objects.get(email='john@test.com')\norders = customer.orders.all()`,
      `orders = Order.objects.filter(customer__email__iexact='john@test.com')`
    ],
    explanation: "customer__email traverses the ForeignKey to filter by the related Customer model's email field. Django performs an INNER JOIN. The alternative approach uses the reverse manager (customer.orders.all()) which is more readable when you already have the customer object.",
    tags: ["FK", "filter", "email", "double-underscore", "intermediate"]
  },
  {
    id: "ex-120",
    title: "FK Traversal: Products in Electronics Category",
    difficulty: "intermediate",
    topic: "related queries",
    category: "queries",
    description: "Filter products by their category name using a ForeignKey relationship.",
    schema: `from django.db import models

class Category(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)

class Product(models.Model):
    name = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='products')`,
    sampleData: `electronics = Category.objects.create(name='Electronics', slug='electronics')
clothing = Category.objects.create(name='Clothing', slug='clothing')
Product.objects.create(name='Laptop', price=999, category=electronics)
Product.objects.create(name='T-Shirt', price=19, category=clothing)
Product.objects.create(name='Headphones', price=149, category=electronics)`,
    problemStatement: "Retrieve all products in the 'Electronics' category.",
    expectedResult: "2 products: Laptop and Headphones.",
    hints: [
      "category__name='Electronics' traverses the FK to the Category model.",
      "You can also filter by category__slug='electronics' for URL-friendly lookups."
    ],
    solution: `products = Product.objects.filter(category__name='Electronics')`,
    alternativeSolutions: [
      `products = Product.objects.filter(category__slug='electronics')`,
      `from django.shortcuts import get_object_or_404\ncat = get_object_or_404(Category, slug='electronics')\nproducts = cat.products.all()`
    ],
    explanation: "Filtering by FK field (category__name) is idiomatic Django. It issues a JOIN to the category table. Filtering by slug is URL-safe and avoids case-sensitivity issues. Using the reverse manager (cat.products.all()) requires fetching the category object first but is clean in view code.",
    tags: ["FK", "filter", "category", "double-underscore", "intermediate"]
  },
  {
    id: "ex-121",
    title: "M2M Lookup: Books Tagged 'Django'",
    difficulty: "intermediate",
    topic: "related queries",
    category: "queries",
    description: "Use a ManyToMany relationship to filter books that have a specific tag.",
    schema: `from django.db import models

class Tag(models.Model):
    name = models.CharField(max_length=50)

class Book(models.Model):
    title = models.CharField(max_length=200)
    tags = models.ManyToManyField(Tag, related_name='books', blank=True)`,
    sampleData: `django_tag = Tag.objects.create(name='Django')
python_tag = Tag.objects.create(name='Python')
b1 = Book.objects.create(title='Django for Beginners')
b2 = Book.objects.create(title='Python Crash Course')
b1.tags.add(django_tag, python_tag)
b2.tags.add(python_tag)`,
    problemStatement: "Find all books that have the tag 'Django'.",
    expectedResult: "1 book: 'Django for Beginners'.",
    hints: [
      "M2M lookups use the same double-underscore syntax as FK.",
      "tags__name='Django' joins through the M2M junction table."
    ],
    solution: `books = Book.objects.filter(tags__name='Django')`,
    alternativeSolutions: [
      `tag = Tag.objects.get(name='Django')\nbooks = tag.books.all()`,
      `books = Book.objects.filter(tags__name__iexact='django')`
    ],
    explanation: "M2M lookups with tags__name generate a JOIN through the intermediate junction table. Django handles the junction table automatically. If a book has multiple tags, it may appear multiple times — add .distinct() if needed. The reverse manager (tag.books.all()) is cleaner when you already have the tag.",
    tags: ["M2M", "filter", "tags", "double-underscore", "intermediate"]
  },
  {
    id: "ex-122",
    title: "Two-Level FK: Books by Author From UK",
    difficulty: "intermediate",
    topic: "related queries",
    category: "queries",
    description: "Traverse two levels of ForeignKey to filter books by the author's country name.",
    schema: `from django.db import models

class Country(models.Model):
    name = models.CharField(max_length=100)

class Author(models.Model):
    name = models.CharField(max_length=100)
    country = models.ForeignKey(Country, on_delete=models.SET_NULL, null=True)

class Book(models.Model):
    title = models.CharField(max_length=200)
    author = models.ForeignKey(Author, on_delete=models.CASCADE, related_name='books')`,
    sampleData: `uk = Country.objects.create(name='UK')
us = Country.objects.create(name='US')
orwell = Author.objects.create(name='Orwell', country=uk)
twain = Author.objects.create(name='Twain', country=us)
Book.objects.create(title='1984', author=orwell)
Book.objects.create(title='Tom Sawyer', author=twain)`,
    problemStatement: "Get all books written by authors from the UK using two-level FK traversal.",
    expectedResult: "1 book: '1984'.",
    hints: [
      "Chain double underscores: author__country__name.",
      "Django generates two JOINs: book→author→country."
    ],
    solution: `books = Book.objects.filter(author__country__name='UK')`,
    alternativeSolutions: [
      `books = Book.objects.filter(author__country__name__in=['UK', 'United Kingdom'])`,
      `uk = Country.objects.get(name='UK')\nbooks = Book.objects.filter(author__country=uk)`
    ],
    explanation: "author__country__name chains two FK lookups. Django generates two JOINs: book INNER JOIN author ON ... INNER JOIN country ON ... WHERE country.name = 'UK'. There is no practical limit to the depth of chaining, but deep chains can affect query performance.",
    tags: ["FK", "filter", "double-underscore", "multi-level", "join", "intermediate"]
  },
  {
    id: "ex-123",
    title: "Orders Containing Any Product Over $100",
    difficulty: "advanced",
    topic: "related queries",
    category: "queries",
    description: "Find orders that include at least one order item with a product priced above $100.",
    schema: `from django.db import models

class Product(models.Model):
    name = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=8, decimal_places=2)

class Order(models.Model):
    reference = models.CharField(max_length=20)

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.IntegerField(default=1)`,
    sampleData: `p1 = Product.objects.create(name='Laptop', price=999)
p2 = Product.objects.create(name='Cable', price=15)
o1 = Order.objects.create(reference='ORD-001')
o2 = Order.objects.create(reference='ORD-002')
OrderItem.objects.create(order=o1, product=p1, quantity=1)
OrderItem.objects.create(order=o2, product=p2, quantity=3)`,
    problemStatement: "Get all orders that have at least one item where the product price exceeds $100.",
    expectedResult: "1 order: ORD-001 (contains Laptop at $999).",
    hints: [
      "items__product__price traverses two FK levels: OrderItem → Product.",
      "filter() on reverse FK automatically applies EXISTS-style logic."
    ],
    solution: `orders = Order.objects.filter(
    items__product__price__gt=100
).distinct()`,
    alternativeSolutions: [
      `from django.db.models import Exists, OuterRef\nfrom django.db.models import Subquery\nhigh_value_items = OrderItem.objects.filter(\n    order=OuterRef('pk'),\n    product__price__gt=100\n)\norders = Order.objects.filter(Exists(high_value_items))`
    ],
    explanation: "Filtering through a reverse FK (items__product__price) joins Order → OrderItem → Product and filters where any item's product price > 100. .distinct() is needed because multiple matching items would duplicate an order row. The Exists() approach avoids duplicates entirely and can be faster.",
    tags: ["FK", "M2M", "filter", "distinct", "reverse-FK", "advanced"]
  },
  {
    id: "ex-124",
    title: "Reverse FK: All Books for an Author Instance",
    difficulty: "intermediate",
    topic: "related queries",
    category: "queries",
    description: "Use the reverse FK manager to get all books for a specific Author object.",
    schema: `from django.db import models

class Author(models.Model):
    name = models.CharField(max_length=100)

class Book(models.Model):
    title = models.CharField(max_length=200)
    author = models.ForeignKey(Author, on_delete=models.CASCADE, related_name='books')
    published_year = models.IntegerField()`,
    sampleData: `alice = Author.objects.create(name='Alice')
Book.objects.create(title='Book One', author=alice, published_year=2020)
Book.objects.create(title='Book Two', author=alice, published_year=2022)`,
    problemStatement: "Given an Author instance, retrieve all their books ordered by published_year.",
    expectedResult: "2 books for Alice, ordered by year.",
    hints: [
      "Use author.books.all() where 'books' is the related_name.",
      "You can chain filter/order_by on the reverse manager."
    ],
    solution: `author = Author.objects.get(name='Alice')

# Use the reverse manager
books = author.books.all().order_by('published_year')

for book in books:
    print(f"{book.title} ({book.published_year})")`,
    alternativeSolutions: [
      `# Equivalent queryset approach\nbooks = Book.objects.filter(author__name='Alice').order_by('published_year')`,
      `author = Author.objects.get(name='Alice')\nrecent_books = author.books.filter(published_year__gte=2021)`
    ],
    explanation: "author.books is the reverse manager created by ForeignKey with related_name='books'. Calling .all() returns all related books. You can apply any queryset method: .filter(), .order_by(), .annotate(), etc. It generates WHERE author_id = <author.pk>.",
    tags: ["reverse-FK", "related-manager", "filter", "intermediate"]
  },
  {
    id: "ex-125",
    title: "M2M: Get All Tags for a BlogPost",
    difficulty: "intermediate",
    topic: "related queries",
    category: "queries",
    description: "Retrieve all tags associated with a specific blog post through a ManyToMany relationship.",
    schema: `from django.db import models

class Tag(models.Model):
    name = models.CharField(max_length=50)
    slug = models.SlugField(unique=True)

class BlogPost(models.Model):
    title = models.CharField(max_length=200)
    tags = models.ManyToManyField(Tag, related_name='posts', blank=True)`,
    sampleData: `t1 = Tag.objects.create(name='Django', slug='django')
t2 = Tag.objects.create(name='Python', slug='python')
t3 = Tag.objects.create(name='Web', slug='web')
post = BlogPost.objects.create(title='Django Tips')
post.tags.add(t1, t2)`,
    problemStatement: "Given the BlogPost with pk=5 (or any pk), retrieve all its tags.",
    expectedResult: "2 tags: Django and Python.",
    hints: [
      "Use post.tags.all() to get tags through the M2M manager.",
      "The M2M manager supports all queryset operations."
    ],
    solution: `post = BlogPost.objects.get(pk=5)

# Access M2M related tags
tags = post.tags.all().order_by('name')

for tag in tags:
    print(tag.name)`,
    alternativeSolutions: [
      `# Queryset approach\ntags = Tag.objects.filter(posts__pk=5)`,
      `post = BlogPost.objects.prefetch_related('tags').get(pk=5)\ntags = post.tags.all()  # No extra query due to prefetch`
    ],
    explanation: "post.tags is the M2M forward manager. .all() returns a queryset of Tag objects. Django queries the junction table automatically. Using prefetch_related('tags') before the get() call caches the tags, avoiding a second query when accessing post.tags.all() in a loop.",
    tags: ["M2M", "related-manager", "tags", "intermediate"]
  },
  {
    id: "ex-126",
    title: "Posts with Comments from a Specific User",
    difficulty: "intermediate",
    topic: "related queries",
    category: "queries",
    description: "Find blog posts that have at least one comment authored by a specific username.",
    schema: `from django.db import models

class User(models.Model):
    username = models.CharField(max_length=100)

class Post(models.Model):
    title = models.CharField(max_length=200)
    body = models.TextField()

class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    text = models.TextField()`,
    sampleData: `alice = User.objects.create(username='alice')
bob = User.objects.create(username='bob')
p1 = Post.objects.create(title='Django Tips', body='...')
p2 = Post.objects.create(title='Python Guide', body='...')
Comment.objects.create(post=p1, user=alice, text='Great post!')
Comment.objects.create(post=p2, user=bob, text='Nice!')`,
    problemStatement: "Find all posts that have at least one comment from user with username='alice'.",
    expectedResult: "1 post: 'Django Tips'.",
    hints: [
      "comments__user__username traverses Comment → User FK.",
      "Use .distinct() if a user has multiple comments on the same post."
    ],
    solution: `posts = Post.objects.filter(
    comments__user__username='alice'
).distinct()`,
    alternativeSolutions: [
      `alice = User.objects.get(username='alice')\nposts = Post.objects.filter(comments__user=alice).distinct()`,
      `from django.db.models import Exists, OuterRef\ncomments_by_alice = Comment.objects.filter(post=OuterRef('pk'), user__username='alice')\nposts = Post.objects.filter(Exists(comments_by_alice))`
    ],
    explanation: "Filtering through comments__user__username traverses two FK levels: Post → Comment → User. .distinct() is important because a user with multiple comments on the same post would cause duplicate Post rows without it. Exists() is an alternative that inherently deduplicates.",
    tags: ["FK", "filter", "reverse-FK", "distinct", "intermediate"]
  },
  {
    id: "ex-127",
    title: "Employees on More Than 2 Projects",
    difficulty: "advanced",
    topic: "related queries",
    category: "queries",
    description: "Use annotate and filter on a ManyToMany count to find employees assigned to more than 2 projects.",
    schema: `from django.db import models

class Project(models.Model):
    name = models.CharField(max_length=200)

class Employee(models.Model):
    name = models.CharField(max_length=100)
    projects = models.ManyToManyField(Project, related_name='employees', blank=True)`,
    sampleData: `p1 = Project.objects.create(name='Alpha')
p2 = Project.objects.create(name='Beta')
p3 = Project.objects.create(name='Gamma')
alice = Employee.objects.create(name='Alice')
bob = Employee.objects.create(name='Bob')
alice.projects.add(p1, p2, p3)
bob.projects.add(p1)`,
    problemStatement: "Find employees who are assigned to more than 2 projects.",
    expectedResult: "1 employee: Alice (3 projects).",
    hints: [
      "Annotate with Count('projects') then filter on the annotation.",
      "M2M Count uses the M2M field name directly."
    ],
    solution: `from django.db.models import Count

employees = Employee.objects.annotate(
    project_count=Count('projects')
).filter(project_count__gt=2)

for e in employees:
    print(f"{e.name}: {e.project_count} projects")`,
    alternativeSolutions: [
      `from django.db.models import Count\nemployees = Employee.objects.annotate(\n    project_count=Count('projects', distinct=True)\n).filter(project_count__gte=3)`
    ],
    explanation: "Count('projects') counts the M2M related Project records per employee. Django uses the junction table in the query. distinct=True is usually not needed for M2M counts since the junction table already has unique (employee_id, project_id) pairs, but it's safe to include.",
    tags: ["M2M", "annotate", "Count", "filter", "HAVING", "advanced"]
  },
  {
    id: "ex-128",
    title: "Departments with No Employees",
    difficulty: "intermediate",
    topic: "related queries",
    category: "queries",
    description: "Find departments that have no employees using annotate and filter on count=0.",
    schema: `from django.db import models

class Department(models.Model):
    name = models.CharField(max_length=100)

class Employee(models.Model):
    name = models.CharField(max_length=100)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='employees')`,
    sampleData: `eng = Department.objects.create(name='Engineering')
hr = Department.objects.create(name='HR')
empty_dept = Department.objects.create(name='Legal')
Employee.objects.create(name='Alice', department=eng)
Employee.objects.create(name='Bob', department=hr)`,
    problemStatement: "Find departments that have zero employees assigned.",
    expectedResult: "1 department: Legal.",
    hints: [
      "Annotate with Count('employees') and filter count=0.",
      "Alternatively use exclude(employees__isnull=False)."
    ],
    solution: `from django.db.models import Count

empty_depts = Department.objects.annotate(
    employee_count=Count('employees')
).filter(employee_count=0)`,
    alternativeSolutions: [
      `# Exclude departments that have at least one employee\nempty_depts = Department.objects.exclude(employees__isnull=False)`,
      `empty_depts = Department.objects.filter(employees__isnull=True).distinct()`
    ],
    explanation: "Annotating with Count then filtering count=0 generates HAVING COUNT(employees.id) = 0. The exclude(employees__isnull=False) approach excludes any department with a non-null employee FK, which is equivalent but phrased differently. Both approaches are efficient.",
    tags: ["annotate", "Count", "filter", "reverse-FK", "empty", "intermediate"]
  },
  {
    id: "ex-129",
    title: "Customers Who Never Ordered",
    difficulty: "intermediate",
    topic: "related queries",
    category: "queries",
    description: "Find customers who have placed zero orders using annotate and filter.",
    schema: `from django.db import models

class Customer(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField()

class Order(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='orders')
    total = models.DecimalField(max_digits=10, decimal_places=2)`,
    sampleData: `c1 = Customer.objects.create(name='Alice', email='alice@test.com')
c2 = Customer.objects.create(name='Bob', email='bob@test.com')
c3 = Customer.objects.create(name='Carol', email='carol@test.com')
Order.objects.create(customer=c1, total=100)`,
    problemStatement: "Find all customers who have never placed an order.",
    expectedResult: "2 customers: Bob and Carol.",
    hints: [
      "Annotate with Count('orders') and filter count=0.",
      "exclude(orders__isnull=False) is a simpler equivalent."
    ],
    solution: `from django.db.models import Count

no_order_customers = Customer.objects.annotate(
    order_count=Count('orders')
).filter(order_count=0)`,
    alternativeSolutions: [
      `no_order_customers = Customer.objects.exclude(orders__isnull=False)`,
      `no_order_customers = Customer.objects.filter(orders__isnull=True).distinct()`
    ],
    explanation: "This is the standard pattern for finding records with no related objects. The annotate+filter approach is explicit and allows ordering by order_count. The exclude approach is shorter and equally efficient. Both are commonly used in real Django applications for user engagement analytics.",
    tags: ["annotate", "Count", "filter", "reverse-FK", "zero-related", "intermediate"]
  },
  {
    id: "ex-130",
    title: "Books with Zero Reviews",
    difficulty: "intermediate",
    topic: "related queries",
    category: "queries",
    description: "Find books that have no reviews submitted.",
    schema: `from django.db import models

class Book(models.Model):
    title = models.CharField(max_length=200)
    author = models.CharField(max_length=100)

class Review(models.Model):
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='reviews')
    rating = models.IntegerField()
    text = models.TextField()`,
    sampleData: `b1 = Book.objects.create(title='Popular Book', author='Alice')
b2 = Book.objects.create(title='Unreviewed Book', author='Bob')
b3 = Book.objects.create(title='Another Unreviewed', author='Carol')
Review.objects.create(book=b1, rating=5, text='Excellent!')`,
    problemStatement: "Get all books that have received zero reviews.",
    expectedResult: "2 books: 'Unreviewed Book' and 'Another Unreviewed'.",
    hints: [
      "Use annotate(review_count=Count('reviews')) then filter review_count=0.",
      "Or filter(reviews__isnull=True) for a simpler approach."
    ],
    solution: `from django.db.models import Count

unreviewed_books = Book.objects.annotate(
    review_count=Count('reviews')
).filter(review_count=0)`,
    alternativeSolutions: [
      `unreviewed_books = Book.objects.filter(reviews__isnull=True)`,
      `from django.db.models import Exists, OuterRef\nhas_review = Review.objects.filter(book=OuterRef('pk'))\nunreviewed_books = Book.objects.exclude(Exists(has_review))`
    ],
    explanation: "Books with no reviews have no rows in the Review table with that book_id. filter(reviews__isnull=True) performs a LEFT OUTER JOIN and checks for NULL on the review side, which is efficient. The Exists approach uses NOT EXISTS in SQL which often has the best query plan.",
    tags: ["annotate", "Count", "filter", "reverse-FK", "zero-related", "intermediate"]
  },
  {
    id: "ex-131",
    title: "Authors Published in More Than One Distinct Category",
    difficulty: "advanced",
    topic: "related queries",
    category: "queries",
    description: "Find authors who have books in more than one distinct category.",
    schema: `from django.db import models

class Category(models.Model):
    name = models.CharField(max_length=100)

class Author(models.Model):
    name = models.CharField(max_length=100)

class Book(models.Model):
    title = models.CharField(max_length=200)
    author = models.ForeignKey(Author, on_delete=models.CASCADE, related_name='books')
    category = models.ForeignKey(Category, on_delete=models.CASCADE)`,
    sampleData: `sci = Category.objects.create(name='Science')
fiction = Category.objects.create(name='Fiction')
alice = Author.objects.create(name='Alice')
bob = Author.objects.create(name='Bob')
Book.objects.create(title='Science Book', author=alice, category=sci)
Book.objects.create(title='Fiction Book', author=alice, category=fiction)
Book.objects.create(title='Only Science', author=bob, category=sci)`,
    problemStatement: "Find authors with books spanning more than one distinct category.",
    expectedResult: "1 author: Alice (Science and Fiction).",
    hints: [
      "Use Count('books__category', distinct=True) to count distinct categories.",
      "Filter where distinct category count > 1."
    ],
    solution: `from django.db.models import Count

authors = Author.objects.annotate(
    category_count=Count('books__category', distinct=True)
).filter(category_count__gt=1)`,
    alternativeSolutions: [
      `from django.db.models import Count\nauthors = Author.objects.annotate(\n    category_count=Count('books__category_id', distinct=True)\n).filter(category_count__gte=2)`
    ],
    explanation: "Count('books__category', distinct=True) traverses Book → Category and counts DISTINCT category_id values per author. Without distinct=True, multiple books in the same category would be counted separately. distinct=True ensures only unique categories are counted per author.",
    tags: ["annotate", "Count", "distinct", "FK", "advanced", "queryset"]
  },
  {
    id: "ex-132",
    title: "Orders Containing a Specific Product",
    difficulty: "advanced",
    topic: "related queries",
    category: "queries",
    description: "Find all orders that include a specific product through the order items relationship.",
    schema: `from django.db import models

class Product(models.Model):
    name = models.CharField(max_length=200)
    sku = models.CharField(max_length=50, unique=True)

class Order(models.Model):
    reference = models.CharField(max_length=20)
    created_at = models.DateTimeField(auto_now_add=True)

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='order_items')
    quantity = models.IntegerField(default=1)`,
    sampleData: `laptop = Product.objects.create(name='Laptop', sku='LAP-001')
mouse = Product.objects.create(name='Mouse', sku='MOU-001')
o1 = Order.objects.create(reference='ORD-001')
o2 = Order.objects.create(reference='ORD-002')
OrderItem.objects.create(order=o1, product=laptop, quantity=1)
OrderItem.objects.create(order=o1, product=mouse, quantity=1)
OrderItem.objects.create(order=o2, product=mouse, quantity=2)`,
    problemStatement: "Find all orders that contain the product with sku='LAP-001'.",
    expectedResult: "1 order: ORD-001.",
    hints: [
      "Filter through items__product__sku to traverse the relation.",
      "distinct() ensures each order appears only once even with multiple matching items."
    ],
    solution: `orders = Order.objects.filter(
    items__product__sku='LAP-001'
).distinct()`,
    alternativeSolutions: [
      `laptop = Product.objects.get(sku='LAP-001')\norders = Order.objects.filter(items__product=laptop).distinct()`,
      `from django.db.models import Exists, OuterRef\nlaptop_items = OrderItem.objects.filter(order=OuterRef('pk'), product__sku='LAP-001')\norders = Order.objects.filter(Exists(laptop_items))`
    ],
    explanation: "items__product__sku chains two FK lookups: Order.items (reverse FK) → OrderItem.product (forward FK) → Product.sku. .distinct() prevents duplicate orders when a product appears in multiple line items of the same order. Exists() is more efficient for large tables.",
    tags: ["FK", "filter", "distinct", "reverse-FK", "M2M-through", "advanced"]
  },
  // ============================================================
  // SELECT_RELATED + PREFETCH_RELATED (ex-133 to ex-140)
  // ============================================================
  {
    id: "ex-133",
    title: "select_related to Avoid N+1 on Book Author",
    difficulty: "intermediate",
    topic: "select_related",
    category: "queries",
    description: "Use select_related to fetch books and their authors in a single SQL JOIN, avoiding N+1 queries.",
    schema: `from django.db import models

class Author(models.Model):
    name = models.CharField(max_length=100)
    bio = models.TextField(blank=True)

class Book(models.Model):
    title = models.CharField(max_length=200)
    author = models.ForeignKey(Author, on_delete=models.CASCADE, related_name='books')
    price = models.DecimalField(max_digits=8, decimal_places=2)`,
    sampleData: `a1 = Author.objects.create(name='Alice', bio='Author bio')
a2 = Author.objects.create(name='Bob', bio='Another bio')
Book.objects.create(title='Book 1', author=a1, price=30)
Book.objects.create(title='Book 2', author=a2, price=25)
Book.objects.create(title='Book 3', author=a1, price=40)`,
    problemStatement: "Fetch all books with their author data in a single query using select_related.",
    expectedResult: "All books with author names, no extra queries when accessing book.author.name.",
    hints: [
      "select_related('author') performs an SQL JOIN.",
      "Without select_related, accessing book.author triggers a separate query per book."
    ],
    solution: `# Without select_related: 1 query for books + N queries for authors (N+1 problem)
# books = Book.objects.all()

# With select_related: 1 JOIN query
books = Book.objects.select_related('author').order_by('title')

for book in books:
    # No extra query — author data is already loaded
    print(f"{book.title} by {book.author.name}")`,
    alternativeSolutions: [
      `# select_related with multiple FK fields\nbooks = Book.objects.select_related('author').only('title', 'price', 'author__name')`
    ],
    explanation: "select_related performs an SQL INNER JOIN (or LEFT OUTER JOIN for nullable FKs) to fetch related objects in one query. Without it, accessing book.author.name for each book issues a separate SELECT per book — the N+1 problem. Use select_related for ForeignKey and OneToOneField relationships.",
    tags: ["select_related", "N+1", "FK", "join", "performance", "intermediate"]
  },
  {
    id: "ex-134",
    title: "select_related Depth 2: Book → Author → Publisher",
    difficulty: "intermediate",
    topic: "select_related",
    category: "queries",
    description: "Use select_related to fetch two levels of ForeignKey in a single query.",
    schema: `from django.db import models

class Publisher(models.Model):
    name = models.CharField(max_length=200)
    country = models.CharField(max_length=100)

class Author(models.Model):
    name = models.CharField(max_length=100)
    publisher = models.ForeignKey(Publisher, on_delete=models.SET_NULL, null=True)

class Book(models.Model):
    title = models.CharField(max_length=200)
    author = models.ForeignKey(Author, on_delete=models.CASCADE, related_name='books')`,
    sampleData: `pub = Publisher.objects.create(name='Tech Press', country='USA')
author = Author.objects.create(name='Alice', publisher=pub)
Book.objects.create(title='Django Mastery', author=author)`,
    problemStatement: "Fetch all books with their author AND the author's publisher, using select_related to avoid N+1 at two levels.",
    expectedResult: "Books with book.author.name and book.author.publisher.name available without extra queries.",
    hints: [
      "Pass multiple related fields: select_related('author', 'author__publisher').",
      "Django follows the chain and joins all specified tables."
    ],
    solution: `books = Book.objects.select_related(
    'author',
    'author__publisher'
).order_by('title')

for book in books:
    author = book.author
    publisher = author.publisher
    pub_name = publisher.name if publisher else 'Unknown'
    print(f"{book.title} | {author.name} | {pub_name}")`,
    alternativeSolutions: [
      `# select_related() with no args traverses all FK/O2O relationships (careful with deep graphs)\nbooks = Book.objects.select_related().order_by('title')`
    ],
    explanation: "select_related('author', 'author__publisher') performs two JOINs in a single query: book → author → publisher. Passing related field paths with __ notation specifies exactly which relationships to follow. Using select_related() with no arguments follows all FK chains, which may be expensive.",
    tags: ["select_related", "multi-level", "FK", "join", "performance", "intermediate"]
  },
  {
    id: "ex-135",
    title: "prefetch_related for M2M: Books with Tags",
    difficulty: "intermediate",
    topic: "prefetch_related",
    category: "queries",
    description: "Use prefetch_related to efficiently load M2M tag relationships for multiple books.",
    schema: `from django.db import models

class Tag(models.Model):
    name = models.CharField(max_length=50)

class Book(models.Model):
    title = models.CharField(max_length=200)
    tags = models.ManyToManyField(Tag, related_name='books', blank=True)`,
    sampleData: `t1 = Tag.objects.create(name='Python')
t2 = Tag.objects.create(name='Django')
t3 = Tag.objects.create(name='Web')
b1 = Book.objects.create(title='Django Book')
b2 = Book.objects.create(title='Python Book')
b1.tags.add(t1, t2)
b2.tags.add(t1, t3)`,
    problemStatement: "Fetch all books with their tags pre-loaded to avoid N+1 queries.",
    expectedResult: "2 books, each with tags accessible without extra queries.",
    hints: [
      "M2M relationships cannot use select_related — use prefetch_related instead.",
      "prefetch_related issues a separate query and merges in Python."
    ],
    solution: `# Without prefetch_related: 1 query for books + N queries for tags
# With prefetch_related: 2 queries total (one for books, one for all tags)
books = Book.objects.prefetch_related('tags').order_by('title')

for book in books:
    tag_names = ', '.join(tag.name for tag in book.tags.all())
    print(f"{book.title}: [{tag_names}]")`,
    alternativeSolutions: [
      `# Combine with select_related if book also has FK\nbooks = Book.objects.prefetch_related('tags').select_related('author')`
    ],
    explanation: "prefetch_related issues 2 queries: one for books, one for all tags of those books, then merges them in Python. For M2M relationships, it fetches the junction table in the second query. This is always 2 queries regardless of how many books — compared to N+1 without prefetching.",
    tags: ["prefetch_related", "M2M", "N+1", "performance", "intermediate"]
  },
  {
    id: "ex-136",
    title: "Prefetch with Custom Queryset Using to_attr",
    difficulty: "advanced",
    topic: "prefetch_related",
    category: "queries",
    description: "Use the Prefetch object to apply a filtered queryset and store results in a custom attribute.",
    schema: `from django.db import models

class Author(models.Model):
    name = models.CharField(max_length=100)

class Book(models.Model):
    title = models.CharField(max_length=200)
    author = models.ForeignKey(Author, on_delete=models.CASCADE, related_name='books')
    is_published = models.BooleanField(default=False)`,
    sampleData: `alice = Author.objects.create(name='Alice')
Book.objects.create(title='Published Book', author=alice, is_published=True)
Book.objects.create(title='Draft Book', author=alice, is_published=False)
Book.objects.create(title='Another Published', author=alice, is_published=True)`,
    problemStatement: "Fetch authors prefetched with only their published books, stored in 'published_books' attribute.",
    expectedResult: "Each author has .published_books list with only is_published=True books.",
    hints: [
      "Use Prefetch(lookup, queryset=..., to_attr='...') for custom prefetching.",
      "to_attr stores results as a list (not QuerySet) on the parent object."
    ],
    solution: `from django.db.models import Prefetch

published_books_qs = Book.objects.filter(is_published=True)

authors = Author.objects.prefetch_related(
    Prefetch(
        'books',
        queryset=published_books_qs,
        to_attr='published_books'
    )
)

for author in authors:
    # published_books is a list, not a queryset
    print(f"{author.name}: {len(author.published_books)} published books")
    for book in author.published_books:
        print(f"  - {book.title}")`,
    alternativeSolutions: [
      `from django.db.models import Prefetch\nauthors = Author.objects.prefetch_related(\n    Prefetch('books', queryset=Book.objects.filter(is_published=True).order_by('title'), to_attr='published_books')\n)`
    ],
    explanation: "The Prefetch object gives fine-grained control over prefetching. queryset= applies filtering/ordering to the prefetch query. to_attr='published_books' stores results as a Python list on each author instance. Accessing author.published_books makes no additional query. This is the solution to N+1 with filtered related objects.",
    tags: ["prefetch_related", "Prefetch", "to_attr", "queryset", "advanced", "performance"]
  },
  {
    id: "ex-137",
    title: "select_related: Orders with Customer",
    difficulty: "intermediate",
    topic: "select_related",
    category: "queries",
    description: "Fetch orders with their customer data pre-loaded using select_related.",
    schema: `from django.db import models

class Customer(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField()
    city = models.CharField(max_length=100)

class Order(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='orders')
    total = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)`,
    sampleData: `c1 = Customer.objects.create(name='Alice', email='alice@test.com', city='London')
c2 = Customer.objects.create(name='Bob', email='bob@test.com', city='Paris')
Order.objects.create(customer=c1, total=150, status='completed')
Order.objects.create(customer=c2, total=300, status='pending')`,
    problemStatement: "List recent orders with customer name and city, avoiding N+1 queries.",
    expectedResult: "Orders with customer data accessible without extra DB hits.",
    hints: [
      "select_related('customer') joins the Customer table in a single query.",
      "Access order.customer.name and order.customer.city freely after select_related."
    ],
    solution: `orders = Order.objects.select_related('customer').order_by('-created_at')

for order in orders:
    print(
        f"Order {order.id} | {order.customer.name} ({order.customer.city}) "
        f"| \${order.total} | {order.status}"
    )`,
    alternativeSolutions: [
      `orders = Order.objects.select_related('customer').filter(\n    status='pending'\n).order_by('-created_at')[:20]`
    ],
    explanation: "select_related('customer') tells Django to JOIN the customer table: SELECT order.*, customer.* FROM order INNER JOIN customer ON order.customer_id = customer.id. Accessing order.customer.name and .city then costs zero extra queries. This is standard practice for any view that renders customer info per order.",
    tags: ["select_related", "FK", "N+1", "performance", "intermediate"]
  },
  {
    id: "ex-138",
    title: "Combine select_related and prefetch_related",
    difficulty: "advanced",
    topic: "select_related",
    category: "queries",
    description: "Use both select_related for FK and prefetch_related for M2M in a single queryset.",
    schema: `from django.db import models

class Author(models.Model):
    name = models.CharField(max_length=100)

class Tag(models.Model):
    name = models.CharField(max_length=50)

class Book(models.Model):
    title = models.CharField(max_length=200)
    author = models.ForeignKey(Author, on_delete=models.CASCADE, related_name='books')
    tags = models.ManyToManyField(Tag, related_name='books', blank=True)`,
    sampleData: `author = Author.objects.create(name='Alice')
t1 = Tag.objects.create(name='Django')
t2 = Tag.objects.create(name='Python')
book = Book.objects.create(title='Django Guide', author=author)
book.tags.add(t1, t2)`,
    problemStatement: "Fetch all books with their author (FK) and tags (M2M) in exactly 2 queries total.",
    expectedResult: "Books with book.author.name and book.tags.all() available without extra queries.",
    hints: [
      "select_related handles the FK author JOIN.",
      "prefetch_related handles the M2M tags in a second query."
    ],
    solution: `books = Book.objects.select_related('author').prefetch_related('tags')

for book in books:
    author_name = book.author.name  # from JOIN — no extra query
    tag_names = [t.name for t in book.tags.all()]  # from prefetch — no extra query
    print(f"{book.title} by {author_name} | Tags: {tag_names}")`,
    alternativeSolutions: [
      `from django.db.models import Prefetch\nbooks = Book.objects.select_related('author').prefetch_related(\n    Prefetch('tags', queryset=Tag.objects.order_by('name'))\n)`
    ],
    explanation: "Combining select_related and prefetch_related results in 2 queries: one JOIN query for books+authors, one separate query for all tags. Without these, you'd get 1 (books) + N (authors) + N (tags) queries. select_related handles ForeignKey/O2O; prefetch_related handles M2M and reverse FK.",
    tags: ["select_related", "prefetch_related", "M2M", "FK", "performance", "advanced"]
  },
  {
    id: "ex-139",
    title: "prefetch_related: Authors with Their Books",
    difficulty: "intermediate",
    topic: "prefetch_related",
    category: "queries",
    description: "Prefetch the reverse FK relationship to load all books for each author efficiently.",
    schema: `from django.db import models

class Author(models.Model):
    name = models.CharField(max_length=100)

class Book(models.Model):
    title = models.CharField(max_length=200)
    author = models.ForeignKey(Author, on_delete=models.CASCADE, related_name='books')
    published_year = models.IntegerField()`,
    sampleData: `alice = Author.objects.create(name='Alice')
bob = Author.objects.create(name='Bob')
Book.objects.create(title='Book A1', author=alice, published_year=2020)
Book.objects.create(title='Book A2', author=alice, published_year=2022)
Book.objects.create(title='Book B1', author=bob, published_year=2021)`,
    problemStatement: "Fetch all authors with their books pre-loaded, avoiding N+1 queries on the reverse FK.",
    expectedResult: "Authors with author.books.all() accessible without extra queries.",
    hints: [
      "prefetch_related('books') prefetches the reverse FK relationship.",
      "Django issues 2 queries: one for authors, one for all their books."
    ],
    solution: `authors = Author.objects.prefetch_related('books').order_by('name')

for author in authors:
    book_list = author.books.all()  # No extra query — already prefetched
    print(f"{author.name} ({book_list.count()} books):")
    for book in book_list:
        print(f"  {book.title} ({book.published_year})")`,
    alternativeSolutions: [
      `from django.db.models import Prefetch\nauthors = Author.objects.prefetch_related(\n    Prefetch('books', queryset=Book.objects.order_by('-published_year'))\n)`
    ],
    explanation: "prefetch_related('books') handles the reverse FK: Django fetches all books WHERE author_id IN (<list of author PKs>) and maps them to each author. This is 2 queries regardless of the number of authors. Calling author.books.all() on a prefetched queryset uses the cached data.",
    tags: ["prefetch_related", "reverse-FK", "N+1", "performance", "intermediate"]
  },
  {
    id: "ex-140",
    title: "only() + select_related: Fetch Specific Fields with Join",
    difficulty: "advanced",
    topic: "select_related",
    category: "queries",
    description: "Combine only() with select_related to fetch minimal fields from both book and author tables.",
    schema: `from django.db import models

class Author(models.Model):
    name = models.CharField(max_length=100)
    bio = models.TextField()
    website = models.URLField(blank=True)

class Book(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    price = models.DecimalField(max_digits=8, decimal_places=2)
    author = models.ForeignKey(Author, on_delete=models.CASCADE, related_name='books')`,
    sampleData: `author = Author.objects.create(name='Alice', bio='Long bio...', website='https://alice.com')
Book.objects.create(title='Django Guide', description='Long description...', price=39.99, author=author)`,
    problemStatement: "Fetch books listing page data: only title, price, and author name — no large text fields.",
    expectedResult: "Books with only title and price loaded; author.name accessible without extra queries.",
    hints: [
      "only('title', 'price', 'author') limits book fields; add 'author__name' for the join field.",
      "Accessing a deferred field after only() triggers an extra query per object."
    ],
    solution: `books = Book.objects.only(
    'title', 'price', 'author_id'
).select_related('author').only(
    'title', 'price', 'author_id', 'author__name'
)

for book in books:
    # title, price from book; name from joined author — all in one query
    print(f"{book.title} (\${book.price}) by {book.author.name}")
    # Accessing book.description here would trigger an extra query per book`,
    alternativeSolutions: [
      `# Simpler: defer heavy fields\nbooks = Book.objects.select_related('author').defer('description', 'author__bio', 'author__website')`
    ],
    explanation: "only() restricts the SELECT to specified columns, reducing data transfer. When combined with select_related, you must include the FK column (author_id) and the joined fields you need (author__name). Accessing a deferred field later generates a separate query. defer() is the inverse — specify what to exclude instead.",
    tags: ["only", "select_related", "defer", "performance", "optimization", "advanced"]
  },
  // ============================================================
  // ONLY / DEFER / EXISTS / COUNT (ex-141 to ex-150)
  // ============================================================
  {
    id: "ex-141",
    title: "only() for Book Listing Page",
    difficulty: "intermediate",
    topic: "only",
    category: "queries",
    description: "Use only() to load just id and title for a lightweight book listing.",
    schema: `from django.db import models

class Book(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    price = models.DecimalField(max_digits=8, decimal_places=2)
    cover_image = models.ImageField(upload_to='covers/', blank=True)`,
    sampleData: `Book.objects.create(title='Django Guide', description='A very long description...', price=39.99)
Book.objects.create(title='Python Mastery', description='Another long description...', price=49.99)`,
    problemStatement: "For a book listing page, load only id and title — skip the heavy description and image fields.",
    expectedResult: "Book objects with only id and title populated.",
    hints: [
      "only('id', 'title') generates SELECT id, title FROM book.",
      "Accessing other fields on the result triggers extra queries per object."
    ],
    solution: `books = Book.objects.only('id', 'title').order_by('title')

for book in books:
    print(f"[{book.id}] {book.title}")
    # Accessing book.description here would hit the DB again — avoid it`,
    alternativeSolutions: [
      `# values() is an alternative that returns dicts\nbooks = Book.objects.values('id', 'title').order_by('title')`,
      `# values_list for tuples\nbooks = Book.objects.values_list('id', 'title').order_by('title')`
    ],
    explanation: "only('id', 'title') generates SELECT id, title FROM book. Django still creates model instances but defers all other fields. Accessing a deferred field triggers a per-object query. For pure data (no model methods needed), values() returning dicts is often more efficient.",
    tags: ["only", "defer", "optimization", "performance", "intermediate"]
  },
  {
    id: "ex-142",
    title: "defer() to Skip Heavy Fields",
    difficulty: "intermediate",
    topic: "defer",
    category: "queries",
    description: "Use defer() to exclude large text fields from the initial query.",
    schema: `from django.db import models

class Article(models.Model):
    title = models.CharField(max_length=200)
    summary = models.CharField(max_length=500)
    body = models.TextField()
    author = models.CharField(max_length=100)
    published_at = models.DateTimeField()`,
    sampleData: `from django.utils import timezone
Article.objects.create(
    title='Django Tips', summary='Short summary', body='Very long body text...',
    author='Alice', published_at=timezone.now()
)`,
    problemStatement: "Fetch articles for a listing page, deferring the large 'body' field.",
    expectedResult: "Article objects with title, summary, author, published_at — body is deferred.",
    hints: [
      "defer('body') excludes only the body from SELECT.",
      "It is the inverse of only() — specify what NOT to load."
    ],
    solution: `articles = Article.objects.defer('body').order_by('-published_at')

for article in articles:
    print(f"{article.title} by {article.author}: {article.summary}")
    # article.body would trigger an extra DB query here`,
    alternativeSolutions: [
      `# Equivalent with only()\narticles = Article.objects.only(\n    'title', 'summary', 'author', 'published_at'\n).order_by('-published_at')`
    ],
    explanation: "defer('body') generates SELECT id, title, summary, author, published_at FROM article — everything except body. It is semantically the inverse of only(): specify what to omit rather than what to include. Use defer() when you know which fields are heavy and want to load everything else.",
    tags: ["defer", "only", "optimization", "performance", "intermediate"]
  },
  {
    id: "ex-143",
    title: "exists() to Check for Premium Products",
    difficulty: "intermediate",
    topic: "exists",
    category: "queries",
    description: "Use exists() to efficiently check whether any premium products are available.",
    schema: `from django.db import models

class Product(models.Model):
    name = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    is_premium = models.BooleanField(default=False)
    in_stock = models.BooleanField(default=True)`,
    sampleData: `Product.objects.create(name='Budget Widget', price=9.99, is_premium=False, in_stock=True)
Product.objects.create(name='Premium Gadget', price=299.99, is_premium=True, in_stock=True)`,
    problemStatement: "Check if there is at least one premium product currently in stock.",
    expectedResult: "True",
    hints: [
      "exists() returns True/False without loading objects.",
      "It generates SELECT (1) ... LIMIT 1 for maximum efficiency."
    ],
    solution: `has_premium_stock = Product.objects.filter(
    is_premium=True,
    in_stock=True
).exists()

if has_premium_stock:
    print("Premium products are available")
else:
    print("No premium products in stock")`,
    alternativeSolutions: [
      `# Less efficient alternatives\nhas_premium_stock = Product.objects.filter(is_premium=True, in_stock=True).count() > 0\nhas_premium_stock = bool(Product.objects.filter(is_premium=True, in_stock=True))`
    ],
    explanation: "exists() generates SELECT (1) AS a FROM product WHERE is_premium=True AND in_stock=True LIMIT 1. It returns True immediately upon finding the first matching row without counting all matches. This is significantly faster than count() > 0 for large tables.",
    tags: ["exists", "filter", "boolean", "performance", "intermediate"]
  },
  {
    id: "ex-144",
    title: "count() Without Loading Objects",
    difficulty: "intermediate",
    topic: "count",
    category: "queries",
    description: "Use count() to get the number of matching records without loading them into memory.",
    schema: `from django.db import models

class Order(models.Model):
    status = models.CharField(max_length=20)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)`,
    sampleData: `Order.objects.create(status='pending', total=100)
Order.objects.create(status='pending', total=200)
Order.objects.create(status='completed', total=150)
Order.objects.create(status='pending', total=75)`,
    problemStatement: "Count the number of pending orders without loading any Order objects.",
    expectedResult: "3",
    hints: [
      "count() issues SELECT COUNT(*) FROM order WHERE ... — no rows returned.",
      "Never use len(queryset) when count() will do."
    ],
    solution: `pending_count = Order.objects.filter(status='pending').count()
print(f"Pending orders: {pending_count}")`,
    alternativeSolutions: [
      `# Using aggregate\nfrom django.db.models import Count\nresult = Order.objects.filter(status='pending').aggregate(total=Count('id'))\npending_count = result['total']`
    ],
    explanation: "count() generates SELECT COUNT(*) FROM order WHERE status = 'pending'. No row data is transferred — just a single integer. Using len(queryset) would load all matching rows into memory first, which is wasteful. Always use count() when you need a number.",
    tags: ["count", "filter", "aggregate", "performance", "intermediate"]
  },
  {
    id: "ex-145",
    title: "exists() for Conditional Logic",
    difficulty: "intermediate",
    topic: "exists",
    category: "queries",
    description: "Use exists() in an if-statement to branch logic without loading objects.",
    schema: `from django.db import models

class Subscription(models.Model):
    user_id = models.IntegerField()
    plan = models.CharField(max_length=50)
    is_active = models.BooleanField(default=True)`,
    sampleData: `Subscription.objects.create(user_id=1, plan='premium', is_active=True)
Subscription.objects.create(user_id=2, plan='free', is_active=True)`,
    problemStatement: "Check if user_id=1 has an active premium subscription to determine access level.",
    expectedResult: "True for user_id=1, False for user_id=2.",
    hints: [
      "exists() is faster than count() > 0 for boolean checks.",
      "Filter on all relevant conditions before calling exists()."
    ],
    solution: `user_id = 1

has_premium = Subscription.objects.filter(
    user_id=user_id,
    plan='premium',
    is_active=True
).exists()

if has_premium:
    print("Grant premium access")
else:
    print("Redirect to upgrade page")`,
    alternativeSolutions: [
      `# Slightly less efficient\ntry:\n    sub = Subscription.objects.get(user_id=user_id, plan='premium', is_active=True)\n    has_premium = True\nexcept Subscription.DoesNotExist:\n    has_premium = False`
    ],
    explanation: "exists() is the recommended pattern for boolean access checks. It generates a single SELECT (1) LIMIT 1 query and returns immediately. Using .get() with try/except works but involves fetching the full object. Using .count() > 0 counts all matches unnecessarily. exists() is both idiomatic and efficient.",
    tags: ["exists", "filter", "boolean", "performance", "conditional", "intermediate"]
  },
  {
    id: "ex-146",
    title: "only() with FK: Minimal Fields Plus Author Name",
    difficulty: "advanced",
    topic: "only",
    category: "queries",
    description: "Use only() combined with select_related to fetch specific fields from both book and author.",
    schema: `from django.db import models

class Author(models.Model):
    name = models.CharField(max_length=100)
    bio = models.TextField()

class Book(models.Model):
    title = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    description = models.TextField()
    author = models.ForeignKey(Author, on_delete=models.CASCADE, related_name='books')`,
    sampleData: `author = Author.objects.create(name='Alice', bio='Long bio...')
Book.objects.create(title='Django Book', price=39.99, description='Long...', author=author)`,
    problemStatement: "Fetch book title, price, and author name only — skip description and bio in a single query.",
    expectedResult: "Book objects with title, price, author.name — no extra queries.",
    hints: [
      "Include author_id in only() to allow the JOIN.",
      "Specify author__name in the second only() for the joined table."
    ],
    solution: `books = (
    Book.objects
    .select_related('author')
    .only('title', 'price', 'author__name')
)

for book in books:
    print(f"{book.title} (\${book.price}) by {book.author.name}")
    # book.description and book.author.bio are deferred`,
    alternativeSolutions: [
      `# Using values() for pure data\nbooks = Book.objects.select_related('author').values('title', 'price', 'author__name')`
    ],
    explanation: "When combining only() and select_related(), Django automatically includes the FK column (author_id). Specifying author__name in only() ensures the author name is selected in the JOIN. Accessing book.description or book.author.bio would trigger per-object queries. values() is simpler but returns dicts, not model instances.",
    tags: ["only", "select_related", "FK", "optimization", "advanced"]
  },
  {
    id: "ex-147",
    title: "defer() on JSONField to Skip Heavy Nested Data",
    difficulty: "intermediate",
    topic: "defer",
    category: "queries",
    description: "Defer a JSONField containing large nested configuration data to speed up listing queries.",
    schema: `from django.db import models

class Integration(models.Model):
    name = models.CharField(max_length=200)
    status = models.CharField(max_length=20, default='active')
    config = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)`,
    sampleData: `Integration.objects.create(
    name='Stripe',
    status='active',
    config={'api_key': '...', 'webhook_secret': '...', 'nested': {'many': 'fields'}}
)
Integration.objects.create(name='SendGrid', status='inactive', config={'key': 'value'})`,
    problemStatement: "List integrations with name and status only, deferring the potentially large config JSONField.",
    expectedResult: "Integrations with name and status loaded; config is not fetched.",
    hints: [
      "defer('config') skips the JSON column from SELECT.",
      "JSONField can contain large payloads — deferring it reduces data transfer."
    ],
    solution: `integrations = Integration.objects.defer('config').order_by('name')

for integration in integrations:
    print(f"{integration.name}: {integration.status}")
    # integration.config here would trigger an extra query per object`,
    alternativeSolutions: [
      `integrations = Integration.objects.only('name', 'status').order_by('name')`,
      `# If you need config for one specific integration\ndetail = Integration.objects.get(name='Stripe')  # Full load\nprint(detail.config)`
    ],
    explanation: "JSONField values can be large nested structures serialized to JSON. Deferring them reduces the amount of data fetched from the database for listing operations. When the full config is needed (e.g., on a detail page), fetch the individual record without defer().",
    tags: ["defer", "JSONField", "optimization", "performance", "intermediate"]
  },
  {
    id: "ex-148",
    title: "only() Combined with filter()",
    difficulty: "intermediate",
    topic: "only",
    category: "queries",
    description: "Use only() together with filter() to load minimal data from a filtered queryset.",
    schema: `from django.db import models

class Employee(models.Model):
    name = models.CharField(max_length=100)
    department = models.CharField(max_length=100)
    salary = models.DecimalField(max_digits=10, decimal_places=2)
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)`,
    sampleData: `Employee.objects.create(name='Alice', department='Engineering', salary=90000, phone='555-1234', address='123 Main St')
Employee.objects.create(name='Bob', department='Marketing', salary=70000, phone='555-5678', address='456 Oak Ave')
Employee.objects.create(name='Carol', department='Engineering', salary=95000, phone='555-9012', address='789 Pine Rd')`,
    problemStatement: "Get only name and salary for Engineering employees — skip phone and address.",
    expectedResult: "Alice: 90000, Carol: 95000 (Engineering only, minimal fields).",
    hints: [
      "Chain filter() before only() — order doesn't matter for QuerySets.",
      "only() and filter() are composable in any order."
    ],
    solution: `engineers = Employee.objects.filter(
    department='Engineering'
).only('name', 'salary').order_by('name')

for emp in engineers:
    print(f"{emp.name}: \${emp.salary}")`,
    alternativeSolutions: [
      `engineers = Employee.objects.only('name', 'salary').filter(department='Engineering')`,
      `# values() approach\nengineers = Employee.objects.filter(department='Engineering').values('name', 'salary')`
    ],
    explanation: "only() and filter() are fully composable — they produce the same result regardless of order. Django merges them into a single query: SELECT id, name, salary FROM employee WHERE department = 'Engineering'. id is always included by Django to maintain object identity.",
    tags: ["only", "filter", "optimization", "queryset", "intermediate"]
  },
  {
    id: "ex-149",
    title: "exists() on a Reverse FK Subqueryset",
    difficulty: "advanced",
    topic: "exists",
    category: "queries",
    description: "Use exists() on a reverse FK queryset to efficiently check for related records.",
    schema: `from django.db import models

class Author(models.Model):
    name = models.CharField(max_length=100)
    is_verified = models.BooleanField(default=False)

class Book(models.Model):
    title = models.CharField(max_length=200)
    author = models.ForeignKey(Author, on_delete=models.CASCADE, related_name='books')
    is_published = models.BooleanField(default=False)`,
    sampleData: `alice = Author.objects.create(name='Alice', is_verified=True)
bob = Author.objects.create(name='Bob', is_verified=True)
Book.objects.create(title='Published Book', author=alice, is_published=True)
Book.objects.create(title='Draft', author=bob, is_published=False)`,
    problemStatement: "Check if author 'Alice' has any published books using exists() on the reverse FK.",
    expectedResult: "True for Alice, False for Bob.",
    hints: [
      "author.books.filter(is_published=True).exists() checks the reverse FK.",
      "This generates SELECT (1) FROM book WHERE author_id=X AND is_published=True LIMIT 1."
    ],
    solution: `alice = Author.objects.get(name='Alice')
bob = Author.objects.get(name='Bob')

# Check via reverse FK manager
alice_has_published = alice.books.filter(is_published=True).exists()
bob_has_published = bob.books.filter(is_published=True).exists()

print(f"Alice: {alice_has_published}")  # True
print(f"Bob: {bob_has_published}")      # False`,
    alternativeSolutions: [
      `# Filter authors who have published books (single query)\nfrom django.db.models import Exists, OuterRef\npublished_book = Book.objects.filter(author=OuterRef('pk'), is_published=True)\nauthors_with_published = Author.objects.filter(Exists(published_book))`
    ],
    explanation: "author.books.filter(is_published=True).exists() uses the reverse FK manager to scope the query to books belonging to that author, then checks for published status with EXISTS. For bulk filtering of authors with published books, the Exists() + OuterRef() pattern is more efficient (single query).",
    tags: ["exists", "reverse-FK", "filter", "performance", "advanced"]
  },
  {
    id: "ex-150",
    title: "in_bulk() for O(1) PK Lookup",
    difficulty: "advanced",
    topic: "in_bulk",
    category: "queries",
    description: "Use in_bulk() to fetch multiple objects by primary key and access them in O(1) by pk.",
    schema: `from django.db import models

class Product(models.Model):
    name = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    sku = models.CharField(max_length=50, unique=True)`,
    sampleData: `p1 = Product.objects.create(name='Laptop', price=999, sku='LAP-001')
p2 = Product.objects.create(name='Mouse', price=29, sku='MOU-001')
p3 = Product.objects.create(name='Keyboard', price=79, sku='KEY-001')`,
    problemStatement: "Given a list of product PKs from an API request, fetch them as a dict for O(1) lookup.",
    expectedResult: "A dict {pk: Product} for the requested PKs.",
    hints: [
      "in_bulk(id_list) returns {pk: model_instance} for all found PKs.",
      "Unfound PKs are simply absent from the dict — no error."
    ],
    solution: `# PKs from an API request or form submission
requested_pks = [1, 2, 3, 999]  # 999 doesn't exist

product_map = Product.objects.in_bulk(requested_pks)
# Returns {1: <Product: Laptop>, 2: <Product: Mouse>, 3: <Product: Keyboard>}
# pk=999 is silently absent

for pk in requested_pks:
    product = product_map.get(pk)
    if product:
        print(f"pk={pk}: {product.name} (\${product.price})")
    else:
        print(f"pk={pk}: not found")`,
    alternativeSolutions: [
      `# With filter__in — returns a list not a dict\nproducts = Product.objects.filter(pk__in=requested_pks)\nproduct_map = {p.pk: p for p in products}`,
      `# in_bulk with field_name for non-PK unique fields\nproduct_map = Product.objects.in_bulk(['LAP-001', 'MOU-001'], field_name='sku')`
    ],
    explanation: "in_bulk(id_list) generates SELECT * FROM product WHERE id IN (...) and returns a dict mapping PK to instance. This is ideal when you need to look up many objects by PK in O(1) time. Missing PKs are absent from the dict without raising exceptions. The field_name parameter (Django 2.2+) allows in_bulk on any unique field.",
    tags: ["in_bulk", "pk", "lookup", "optimization", "advanced"]
  },
  // ============================================================
  // SUBQUERY + OUTERREF (ex-151 to ex-160)
  // ============================================================
  {
    id: "ex-151",
    title: "Subquery: Annotate Author with Most Expensive Book Price",
    difficulty: "advanced",
    topic: "Subquery",
    category: "queries",
    description: "Annotate each author with the price of their most expensive book using a correlated Subquery.",
    schema: `from django.db import models

class Author(models.Model):
    name = models.CharField(max_length=100)

class Book(models.Model):
    title = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    author = models.ForeignKey(Author, on_delete=models.CASCADE, related_name='books')`,
    sampleData: `alice = Author.objects.create(name='Alice')
bob = Author.objects.create(name='Bob')
Book.objects.create(title='Cheap', price=10.00, author=alice)
Book.objects.create(title='Expensive', price=99.00, author=alice)
Book.objects.create(title='Only Book', price=45.00, author=bob)`,
    problemStatement: "Annotate each author with their most_expensive_book price using a Subquery.",
    expectedResult: "Alice: 99.00, Bob: 45.00.",
    hints: [
      "Use OuterRef('pk') to reference the outer Author's pk inside the subquery.",
      "Subquery wraps an inner queryset that returns a single value."
    ],
    solution: `from django.db.models import OuterRef, Subquery

# Inner queryset: for a given author, find their max-priced book's price
most_expensive = Book.objects.filter(
    author=OuterRef('pk')
).order_by('-price').values('price')[:1]

authors = Author.objects.annotate(
    most_expensive_book=Subquery(most_expensive)
)

for author in authors:
    print(f"{author.name}: most expensive = \${author.most_expensive_book}")`,
    alternativeSolutions: [
      `from django.db.models import Max\n# Using annotate+Avg for max — simpler but less flexible\nauthors = Author.objects.annotate(most_expensive_book=Max('books__price'))`
    ],
    explanation: "Subquery wraps an inner QuerySet that is correlated to the outer query via OuterRef('pk'). OuterRef('pk') refers to the pk of each Author row being processed. .values('price')[:1] ensures the subquery returns a single scalar value. This generates a correlated subquery in SQL: SELECT price FROM book WHERE author_id = author.pk ORDER BY price DESC LIMIT 1.",
    tags: ["Subquery", "OuterRef", "annotate", "correlated", "advanced"]
  },
  {
    id: "ex-152",
    title: "Subquery: Authors Whose Latest Book Was After 2022",
    difficulty: "advanced",
    topic: "Subquery",
    category: "queries",
    description: "Filter authors whose most recently published book has a published_year greater than 2022.",
    schema: `from django.db import models

class Author(models.Model):
    name = models.CharField(max_length=100)

class Book(models.Model):
    title = models.CharField(max_length=200)
    published_year = models.IntegerField()
    author = models.ForeignKey(Author, on_delete=models.CASCADE, related_name='books')`,
    sampleData: `alice = Author.objects.create(name='Alice')
bob = Author.objects.create(name='Bob')
Book.objects.create(title='Old Book', published_year=2019, author=alice)
Book.objects.create(title='New Book', published_year=2023, author=alice)
Book.objects.create(title='Only Old', published_year=2020, author=bob)`,
    problemStatement: "Find authors whose latest (most recent year) book was published after 2022.",
    expectedResult: "1 author: Alice (latest book 2023).",
    hints: [
      "Subquery to get latest published_year per author, then filter on it.",
      "Annotate with Subquery first, then filter on the annotation."
    ],
    solution: `from django.db.models import OuterRef, Subquery

latest_year = Book.objects.filter(
    author=OuterRef('pk')
).order_by('-published_year').values('published_year')[:1]

authors = Author.objects.annotate(
    latest_published=Subquery(latest_year)
).filter(latest_published__gt=2022)`,
    alternativeSolutions: [
      `from django.db.models import Max\n# Simpler approach using annotate+Max\nauthors = Author.objects.annotate(\n    latest_published=Max('books__published_year')\n).filter(latest_published__gt=2022)`
    ],
    explanation: "The Subquery approach is semantically equivalent to Max('books__published_year') here, but Subquery is more flexible — you can return any field from the most recent book, not just the max of a numeric field. Both generate efficient SQL. Use Subquery when you need to return a non-aggregated value from a related row.",
    tags: ["Subquery", "OuterRef", "annotate", "filter", "advanced"]
  },
  {
    id: "ex-153",
    title: "Subquery: Annotate Orders with Most Recently Added Product Name",
    difficulty: "advanced",
    topic: "Subquery",
    category: "queries",
    description: "Annotate each order with the name of its most recently added order item's product.",
    schema: `from django.db import models

class Product(models.Model):
    name = models.CharField(max_length=200)

class Order(models.Model):
    reference = models.CharField(max_length=20)

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    added_at = models.DateTimeField(auto_now_add=True)`,
    sampleData: `p1 = Product.objects.create(name='Laptop')
p2 = Product.objects.create(name='Mouse')
o = Order.objects.create(reference='ORD-001')
OrderItem.objects.create(order=o, product=p1)
OrderItem.objects.create(order=o, product=p2)`,
    problemStatement: "Annotate each order with 'latest_product' — the name of the product in its most recently added OrderItem.",
    expectedResult: "ORD-001: latest_product = 'Mouse' (or whichever was added last).",
    hints: [
      "Subquery over OrderItem filtered by OuterRef('pk') for the order.",
      "Order by '-added_at' and take values('product__name')[:1]."
    ],
    solution: `from django.db.models import OuterRef, Subquery

latest_product_name = OrderItem.objects.filter(
    order=OuterRef('pk')
).order_by('-added_at').values('product__name')[:1]

orders = Order.objects.annotate(
    latest_product=Subquery(latest_product_name)
)

for order in orders:
    print(f"{order.reference}: latest product = {order.latest_product}")`,
    alternativeSolutions: [
      `from django.db.models import OuterRef, Subquery\n# Using product_id for a FK reference\nlatest_product_id = OrderItem.objects.filter(\n    order=OuterRef('pk')\n).order_by('-added_at').values('product_id')[:1]\norders = Order.objects.annotate(latest_product_id=Subquery(latest_product_id))`
    ],
    explanation: "values('product__name')[:1] in the Subquery traverses the FK to return the product name directly. Subquery can return any single column from the inner queryset, including values from related models. The [:1] slice ensures the subquery returns exactly one row (scalar subquery).",
    tags: ["Subquery", "OuterRef", "annotate", "FK-traversal", "advanced"]
  },
  {
    id: "ex-154",
    title: "Subquery: Employees Earning More Than Their Department Average",
    difficulty: "advanced",
    topic: "Subquery",
    category: "queries",
    description: "Find employees whose salary is above their department's average using a correlated subquery.",
    schema: `from django.db import models

class Department(models.Model):
    name = models.CharField(max_length=100)

class Employee(models.Model):
    name = models.CharField(max_length=100)
    salary = models.DecimalField(max_digits=10, decimal_places=2)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='employees')`,
    sampleData: `eng = Department.objects.create(name='Engineering')
mkt = Department.objects.create(name='Marketing')
Employee.objects.create(name='Alice', salary=120000, department=eng)
Employee.objects.create(name='Bob', salary=80000, department=eng)
Employee.objects.create(name='Carol', salary=90000, department=mkt)
Employee.objects.create(name='Dave', salary=60000, department=mkt)`,
    problemStatement: "Find employees whose salary exceeds the average salary in their own department.",
    expectedResult: "Alice (120k > eng avg 100k) and Carol (90k > mkt avg 75k).",
    hints: [
      "Use OuterRef('department') to correlate the subquery to each employee's department.",
      "Subquery with Avg to compute per-department average salary."
    ],
    solution: `from django.db.models import OuterRef, Subquery, Avg

# Subquery: average salary for the same department as the outer employee
dept_avg = Employee.objects.filter(
    department=OuterRef('department')
).values('department').annotate(
    avg_sal=Avg('salary')
).values('avg_sal')

above_avg = Employee.objects.annotate(
    dept_avg_salary=Subquery(dept_avg)
).filter(salary__gt=Subquery(dept_avg))`,
    alternativeSolutions: [
      `from django.db.models import OuterRef, Subquery, Avg\ndept_avg_sq = Employee.objects.filter(\n    department_id=OuterRef('department_id')\n).values('department_id').annotate(a=Avg('salary')).values('a')\nabove_avg = Employee.objects.filter(salary__gt=Subquery(dept_avg_sq))`
    ],
    explanation: "The correlated subquery computes AVG(salary) WHERE department_id = <outer employee's department_id>. OuterRef('department') references the outer query's department FK. The Subquery is used both for annotation and directly in the filter. This is a classic correlated subquery pattern.",
    tags: ["Subquery", "OuterRef", "Avg", "correlated", "advanced"]
  },
  {
    id: "ex-155",
    title: "Subquery: Books Annotated with Latest Review Text",
    difficulty: "advanced",
    topic: "Subquery",
    category: "queries",
    description: "Annotate each book with the text of its most recent review using a Subquery.",
    schema: `from django.db import models

class Book(models.Model):
    title = models.CharField(max_length=200)

class Review(models.Model):
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='reviews')
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)`,
    sampleData: `from django.utils import timezone
from datetime import timedelta
b = Book.objects.create(title='Django Guide')
Review.objects.create(book=b, text='Old review')
Review.objects.create(book=b, text='Latest review')`,
    problemStatement: "Annotate each book with 'latest_review_text' — the text of the most recent review.",
    expectedResult: "Books with .latest_review_text attribute showing the newest review.",
    hints: [
      "Filter reviews by OuterRef('pk'), order by '-created_at', take values('text')[:1].",
      "Books with no reviews get None for latest_review_text."
    ],
    solution: `from django.db.models import OuterRef, Subquery

latest_review = Review.objects.filter(
    book=OuterRef('pk')
).order_by('-created_at').values('text')[:1]

books = Book.objects.annotate(
    latest_review_text=Subquery(latest_review)
)

for book in books:
    print(f"{book.title}: {book.latest_review_text or 'No reviews'}")`,
    alternativeSolutions: [
      `from django.db.models import OuterRef, Subquery\nlatest_review = Review.objects.filter(\n    book_id=OuterRef('pk')\n).order_by('-created_at').values('text')[:1]\nbooks = Book.objects.annotate(latest_review_text=Subquery(latest_review))`
    ],
    explanation: "values('text')[:1] ensures the subquery returns a single scalar (the text column of the most recent review). Books with no reviews get NULL from the subquery, which Django represents as None. This is a common pattern for 'latest related record' annotations in list views.",
    tags: ["Subquery", "OuterRef", "annotate", "latest", "advanced"]
  },
  {
    id: "ex-156",
    title: "Subquery: Customers Whose Last Order Is Completed",
    difficulty: "advanced",
    topic: "Subquery",
    category: "queries",
    description: "Filter customers whose most recent order has status='completed' using a correlated subquery.",
    schema: `from django.db import models

class Customer(models.Model):
    name = models.CharField(max_length=100)

class Order(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='orders')
    status = models.CharField(max_length=20)
    created_at = models.DateTimeField(auto_now_add=True)`,
    sampleData: `c1 = Customer.objects.create(name='Alice')
c2 = Customer.objects.create(name='Bob')
Order.objects.create(customer=c1, status='completed')
Order.objects.create(customer=c2, status='completed')
Order.objects.create(customer=c2, status='pending')  # Bob's latest`,
    problemStatement: "Find customers whose most recent order has status='completed'.",
    expectedResult: "1 customer: Alice (last order completed). Bob's latest is pending.",
    hints: [
      "Subquery to get the status of the last order per customer.",
      "Annotate then filter, or use the Subquery directly in filter."
    ],
    solution: `from django.db.models import OuterRef, Subquery

last_order_status = Order.objects.filter(
    customer=OuterRef('pk')
).order_by('-created_at').values('status')[:1]

customers = Customer.objects.annotate(
    last_order_status=Subquery(last_order_status)
).filter(last_order_status='completed')`,
    alternativeSolutions: [
      `from django.db.models import OuterRef, Subquery\nlast_status = Order.objects.filter(\n    customer_id=OuterRef('pk')\n).order_by('-created_at').values('status')[:1]\ncustomers = Customer.objects.filter(Subquery(last_status) == 'completed')`
    ],
    explanation: "The Subquery retrieves the status of the most recent order per customer. Annotating with it as last_order_status then filtering last_order_status='completed' generates a correlated subquery in the HAVING or WHERE clause. Customers with no orders get None and are excluded.",
    tags: ["Subquery", "OuterRef", "annotate", "filter", "advanced"]
  },
  {
    id: "ex-157",
    title: "Subquery: Count of Reviews Per Book as Annotation",
    difficulty: "advanced",
    topic: "Subquery",
    category: "queries",
    description: "Annotate books with their review count using a Subquery instead of annotate+Count.",
    schema: `from django.db import models

class Book(models.Model):
    title = models.CharField(max_length=200)

class Review(models.Model):
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='reviews')
    rating = models.IntegerField()`,
    sampleData: `b1 = Book.objects.create(title='Popular Book')
b2 = Book.objects.create(title='Less Popular')
Review.objects.create(book=b1, rating=5)
Review.objects.create(book=b1, rating=4)
Review.objects.create(book=b2, rating=3)`,
    problemStatement: "Annotate each book with review_count using a Subquery with Count.",
    expectedResult: "Popular Book: 2, Less Popular: 1.",
    hints: [
      "Use Subquery wrapping a Count aggregate of reviews filtered by OuterRef.",
      "This approach avoids GROUP BY on the outer query."
    ],
    solution: `from django.db.models import OuterRef, Subquery, Count

review_count_sq = Review.objects.filter(
    book=OuterRef('pk')
).values('book').annotate(cnt=Count('pk')).values('cnt')

books = Book.objects.annotate(
    review_count=Subquery(review_count_sq)
)

for book in books:
    print(f"{book.title}: {book.review_count or 0} reviews")`,
    alternativeSolutions: [
      `# Simpler with direct annotate\nfrom django.db.models import Count\nbooks = Book.objects.annotate(review_count=Count('reviews'))`
    ],
    explanation: "Using Subquery for counting avoids GROUP BY on the outer queryset, which matters when you have multiple annotations that would otherwise cause GROUP BY conflicts. The inner queryset groups by book and counts, returning the count as a scalar. For simple cases, Count in annotate is cleaner.",
    tags: ["Subquery", "OuterRef", "Count", "annotate", "advanced"]
  },
  {
    id: "ex-158",
    title: "Subquery: Products Priced Above Their Category Average",
    difficulty: "advanced",
    topic: "Subquery",
    category: "queries",
    description: "Find products whose price exceeds the average price within their own category.",
    schema: `from django.db import models

class Category(models.Model):
    name = models.CharField(max_length=100)

class Product(models.Model):
    name = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='products')`,
    sampleData: `tech = Category.objects.create(name='Tech')
book = Category.objects.create(name='Books')
Product.objects.create(name='Budget Phone', price=200, category=tech)
Product.objects.create(name='Flagship Phone', price=1200, category=tech)
Product.objects.create(name='Cheap Book', price=10, category=book)
Product.objects.create(name='Premium Book', price=80, category=book)`,
    problemStatement: "Find products priced above the average price of their own category.",
    expectedResult: "Flagship Phone (>tech avg 700) and Premium Book (>books avg 45).",
    hints: [
      "Use OuterRef('category') to correlate to the outer product's category.",
      "Compute Avg('price') filtered by the same category."
    ],
    solution: `from django.db.models import OuterRef, Subquery, Avg

cat_avg = Product.objects.filter(
    category=OuterRef('category')
).values('category').annotate(
    avg_price=Avg('price')
).values('avg_price')

above_avg_products = Product.objects.filter(
    price__gt=Subquery(cat_avg)
)`,
    alternativeSolutions: [
      `from django.db.models import OuterRef, Subquery, Avg\ncat_avg = Product.objects.filter(\n    category_id=OuterRef('category_id')\n).values('category_id').annotate(a=Avg('price')).values('a')\nproducts = Product.objects.annotate(cat_avg=Subquery(cat_avg)).filter(price__gt=F('cat_avg'))`
    ],
    explanation: "The correlated subquery computes AVG(price) for all products in the same category as the outer product row. OuterRef('category') ties the inner query to the outer row's category. This is equivalent to a SQL subquery WHERE price > (SELECT AVG(price) FROM product WHERE category_id = outer.category_id).",
    tags: ["Subquery", "OuterRef", "Avg", "correlated", "filter", "advanced"]
  },
  {
    id: "ex-159",
    title: "Subquery with values() Returning a Single Scalar Field",
    difficulty: "advanced",
    topic: "Subquery",
    category: "queries",
    description: "Use Subquery with values() to return a single scalar field value from a related model.",
    schema: `from django.db import models

class Company(models.Model):
    name = models.CharField(max_length=200)

class Employee(models.Model):
    name = models.CharField(max_length=100)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='employees')
    is_ceo = models.BooleanField(default=False)`,
    sampleData: `c = Company.objects.create(name='Acme Corp')
Employee.objects.create(name='Alice (CEO)', company=c, is_ceo=True)
Employee.objects.create(name='Bob', company=c, is_ceo=False)`,
    problemStatement: "Annotate each company with the name of its CEO (the employee where is_ceo=True).",
    expectedResult: "Acme Corp: ceo_name = 'Alice (CEO)'.",
    hints: [
      "Filter employees by OuterRef('pk') and is_ceo=True, return values('name')[:1].",
      "Subquery must return exactly one row — use [:1] slice."
    ],
    solution: `from django.db.models import OuterRef, Subquery

ceo_name = Employee.objects.filter(
    company=OuterRef('pk'),
    is_ceo=True
).values('name')[:1]

companies = Company.objects.annotate(ceo_name=Subquery(ceo_name))

for company in companies:
    print(f"{company.name}: CEO = {company.ceo_name or 'Not set'}")`,
    alternativeSolutions: [
      `from django.db.models import OuterRef, Subquery\nceo_sq = Employee.objects.filter(\n    company_id=OuterRef('pk'), is_ceo=True\n).values('name')[:1]\ncompanies = Company.objects.annotate(ceo_name=Subquery(ceo_sq))`
    ],
    explanation: "values('name')[:1] is the key pattern for scalar Subquery: .values('fieldname') selects only that column, and [:1] ensures at most one row is returned (making it a scalar subquery). Django wraps this in a SELECT subquery in the main query's SELECT clause. Companies without a CEO get None.",
    tags: ["Subquery", "OuterRef", "scalar", "values", "annotate", "advanced"]
  },
  {
    id: "ex-160",
    title: "OuterRef on M2M Through Model",
    difficulty: "advanced",
    topic: "Subquery",
    category: "queries",
    description: "Use OuterRef on a ManyToMany through model to build a correlated subquery.",
    schema: `from django.db import models

class Student(models.Model):
    name = models.CharField(max_length=100)

class Course(models.Model):
    name = models.CharField(max_length=200)
    students = models.ManyToManyField(Student, through='Enrollment', related_name='courses')

class Enrollment(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    grade = models.DecimalField(max_digits=5, decimal_places=2, null=True)
    enrolled_at = models.DateTimeField(auto_now_add=True)`,
    sampleData: `alice = Student.objects.create(name='Alice')
bob = Student.objects.create(name='Bob')
django_course = Course.objects.create(name='Django 101')
Enrollment.objects.create(student=alice, course=django_course, grade=9.5)
Enrollment.objects.create(student=bob, course=django_course, grade=7.0)`,
    problemStatement: "Annotate each student with the grade they received in the 'Django 101' course.",
    expectedResult: "Alice: django_grade = 9.5, Bob: django_grade = 7.0.",
    hints: [
      "Filter Enrollment by student=OuterRef('pk') and course__name='Django 101'.",
      "Return values('grade')[:1] for the scalar grade value."
    ],
    solution: `from django.db.models import OuterRef, Subquery

django_grade = Enrollment.objects.filter(
    student=OuterRef('pk'),
    course__name='Django 101'
).values('grade')[:1]

students = Student.objects.annotate(
    django_grade=Subquery(django_grade)
)

for s in students:
    print(f"{s.name}: Django 101 grade = {s.django_grade}")`,
    alternativeSolutions: [
      `from django.db.models import OuterRef, Subquery\ngrade_sq = Enrollment.objects.filter(\n    student_id=OuterRef('pk'),\n    course__name='Django 101'\n).values('grade')[:1]\nstudents = Student.objects.annotate(django_grade=Subquery(grade_sq))`
    ],
    explanation: "When a M2M relationship has a through model with extra fields (like grade), you must query the through model directly. Filtering Enrollment by student=OuterRef('pk') correlates the subquery to each Student. This pattern retrieves per-student data from the junction table that would not be accessible via simple M2M lookups.",
    tags: ["Subquery", "OuterRef", "M2M", "through-model", "advanced"]
  },
  // ============================================================
  // EXISTS() EXPRESSION (ex-161 to ex-165)
  // ============================================================
  {
    id: "ex-161",
    title: "Exists() Expression: Authors With Published Books",
    difficulty: "advanced",
    topic: "Exists",
    category: "queries",
    description: "Use the Exists() expression to filter authors who have at least one published book.",
    schema: `from django.db import models

class Author(models.Model):
    name = models.CharField(max_length=100)
    is_verified = models.BooleanField(default=False)

class Book(models.Model):
    title = models.CharField(max_length=200)
    author = models.ForeignKey(Author, on_delete=models.CASCADE, related_name='books')
    is_published = models.BooleanField(default=False)`,
    sampleData: `alice = Author.objects.create(name='Alice', is_verified=True)
bob = Author.objects.create(name='Bob', is_verified=True)
Book.objects.create(title='Published', author=alice, is_published=True)
Book.objects.create(title='Draft', author=bob, is_published=False)`,
    problemStatement: "Filter authors who have at least one published book using the Exists() expression.",
    expectedResult: "1 author: Alice.",
    hints: [
      "Exists() takes a queryset and generates EXISTS (...) in SQL.",
      "OuterRef('pk') inside the Exists queryset correlates to the outer Author."
    ],
    solution: `from django.db.models import Exists, OuterRef

published_books = Book.objects.filter(
    author=OuterRef('pk'),
    is_published=True
)

authors_with_published = Author.objects.filter(
    Exists(published_books)
)`,
    alternativeSolutions: [
      `# Via FK filter (may return duplicates without distinct)\nauthors_with_published = Author.objects.filter(books__is_published=True).distinct()`,
      `from django.db.models import Count\nauthors_with_published = Author.objects.annotate(\n    pub_count=Count('books', filter=Q(books__is_published=True))\n).filter(pub_count__gt=0)`
    ],
    explanation: "Exists(queryset) generates WHERE EXISTS (SELECT 1 FROM book WHERE author_id = author.pk AND is_published = TRUE). Unlike filter(books__is_published=True), Exists never produces duplicate rows. The database stops checking after finding one match, making it very efficient.",
    tags: ["Exists", "OuterRef", "filter", "subquery", "advanced"]
  },
  {
    id: "ex-162",
    title: "Exists() Annotation: Orders with Expensive Item",
    difficulty: "advanced",
    topic: "Exists",
    category: "queries",
    description: "Annotate orders with a boolean flag indicating whether they contain any item priced above $100.",
    schema: `from django.db import models

class Product(models.Model):
    name = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=8, decimal_places=2)

class Order(models.Model):
    reference = models.CharField(max_length=20)

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)`,
    sampleData: `cheap = Product.objects.create(name='Cable', price=10)
expensive = Product.objects.create(name='Laptop', price=999)
o1 = Order.objects.create(reference='ORD-001')
o2 = Order.objects.create(reference='ORD-002')
OrderItem.objects.create(order=o1, product=expensive)
OrderItem.objects.create(order=o2, product=cheap)`,
    problemStatement: "Annotate each order with has_expensive_item=True/False based on whether any item's product price > 100.",
    expectedResult: "ORD-001: has_expensive_item=True, ORD-002: has_expensive_item=False.",
    hints: [
      "Exists() can be used as an annotation value (returns boolean).",
      "Filter items by OuterRef('pk') and product__price__gt=100."
    ],
    solution: `from django.db.models import Exists, OuterRef

expensive_items = OrderItem.objects.filter(
    order=OuterRef('pk'),
    product__price__gt=100
)

orders = Order.objects.annotate(
    has_expensive_item=Exists(expensive_items)
)

for order in orders:
    print(f"{order.reference}: has_expensive_item={order.has_expensive_item}")`,
    alternativeSolutions: [
      `from django.db.models import Exists, OuterRef\norders = Order.objects.annotate(\n    has_expensive_item=Exists(\n        OrderItem.objects.filter(order=OuterRef('pk'), product__price__gt=100)\n    )\n).filter(has_expensive_item=True)  # further filterable`
    ],
    explanation: "When Exists() is used in annotate() rather than filter(), Django annotates each row with a boolean TRUE/FALSE from the EXISTS subquery. This is more powerful than filtering alone — you can display the boolean in a template or API response, or further filter on it.",
    tags: ["Exists", "OuterRef", "annotate", "boolean", "advanced"]
  },
  {
    id: "ex-163",
    title: "Exists() on Categories Where High-Rated Books Exist",
    difficulty: "advanced",
    topic: "Exists",
    category: "queries",
    description: "Filter categories that contain at least one book rated above 4.0 using Exists().",
    schema: `from django.db import models

class Category(models.Model):
    name = models.CharField(max_length=100)

class Book(models.Model):
    title = models.CharField(max_length=200)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='books')`,
    sampleData: `tech = Category.objects.create(name='Tech')
cooking = Category.objects.create(name='Cooking')
Book.objects.create(title='Django Guide', rating=4.8, category=tech)
Book.objects.create(title='Python Basics', rating=3.5, category=tech)
Book.objects.create(title='Recipes', rating=2.0, category=cooking)`,
    problemStatement: "Find categories that have at least one book with rating > 4.0.",
    expectedResult: "1 category: Tech (Django Guide rated 4.8).",
    hints: [
      "Exists(Book.objects.filter(category=OuterRef('pk'), rating__gt=4.0)).",
      "Exists() in filter() adds WHERE EXISTS (...) to the outer query."
    ],
    solution: `from django.db.models import Exists, OuterRef

high_rated_book = Book.objects.filter(
    category=OuterRef('pk'),
    rating__gt=4.0
)

categories = Category.objects.filter(
    Exists(high_rated_book)
)`,
    alternativeSolutions: [
      `# Alternative without Exists\ncategories = Category.objects.filter(books__rating__gt=4.0).distinct()`
    ],
    explanation: "Exists(high_rated_book) adds WHERE EXISTS (SELECT 1 FROM book WHERE category_id = category.pk AND rating > 4.0). Django stops scanning book rows after the first match per category. The filter(books__rating__gt=4.0).distinct() alternative works but the JOIN may be less efficient without a good index.",
    tags: ["Exists", "OuterRef", "filter", "FK", "advanced"]
  },
  {
    id: "ex-164",
    title: "Exists() on Reverse FK as Boolean Annotation",
    difficulty: "advanced",
    topic: "Exists",
    category: "queries",
    description: "Annotate each product with a boolean 'has_orders' using Exists() on the reverse FK.",
    schema: `from django.db import models

class Product(models.Model):
    name = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=8, decimal_places=2)

class OrderItem(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='order_items')
    quantity = models.IntegerField(default=1)`,
    sampleData: `p1 = Product.objects.create(name='Popular Widget', price=29.99)
p2 = Product.objects.create(name='Unpopular Widget', price=19.99)
OrderItem.objects.create(product=p1, quantity=5)`,
    problemStatement: "Annotate each product with has_orders (True if ordered at least once, else False).",
    expectedResult: "Popular Widget: has_orders=True, Unpopular Widget: has_orders=False.",
    hints: [
      "Exists(OrderItem.objects.filter(product=OuterRef('pk'))) checks for any order items.",
      "Use in annotate() to get a boolean per product."
    ],
    solution: `from django.db.models import Exists, OuterRef

order_items_exist = OrderItem.objects.filter(product=OuterRef('pk'))

products = Product.objects.annotate(
    has_orders=Exists(order_items_exist)
).order_by('-has_orders', 'name')

for p in products:
    status = 'ordered' if p.has_orders else 'never ordered'
    print(f"{p.name}: {status}")`,
    alternativeSolutions: [
      `from django.db.models import Count\nproducts = Product.objects.annotate(\n    order_count=Count('order_items')\n).annotate(has_orders=Case(\n    When(order_count__gt=0, then=True), default=False, output_field=BooleanField()\n))`
    ],
    explanation: "Exists() as an annotation produces a boolean column via EXISTS subquery. This is more efficient than Count() > 0 because EXISTS stops on the first row. The annotated has_orders can be used for ordering, filtering, or displaying in templates/APIs. Django maps the database boolean to Python True/False.",
    tags: ["Exists", "OuterRef", "annotate", "boolean", "reverse-FK", "advanced"]
  },
  {
    id: "ex-165",
    title: "Exists() Combined with Q Objects in Filter",
    difficulty: "advanced",
    topic: "Exists",
    category: "queries",
    description: "Combine Exists() with Q objects to build a complex filter with OR logic.",
    schema: `from django.db import models

class Author(models.Model):
    name = models.CharField(max_length=100)
    is_featured = models.BooleanField(default=False)

class Book(models.Model):
    title = models.CharField(max_length=200)
    author = models.ForeignKey(Author, on_delete=models.CASCADE, related_name='books')
    is_bestseller = models.BooleanField(default=False)`,
    sampleData: `alice = Author.objects.create(name='Alice', is_featured=True)
bob = Author.objects.create(name='Bob', is_featured=False)
carol = Author.objects.create(name='Carol', is_featured=False)
Book.objects.create(title='Bestseller', author=carol, is_bestseller=True)`,
    problemStatement: "Find authors who are either featured OR have written at least one bestseller.",
    expectedResult: "Alice (featured) and Carol (has bestseller).",
    hints: [
      "Combine Q(is_featured=True) | Exists(bestseller_books) in filter().",
      "Exists() can be used directly alongside Q objects."
    ],
    solution: `from django.db.models import Exists, OuterRef, Q

bestseller_books = Book.objects.filter(
    author=OuterRef('pk'),
    is_bestseller=True
)

authors = Author.objects.filter(
    Q(is_featured=True) | Exists(bestseller_books)
)`,
    alternativeSolutions: [
      `from django.db.models import Exists, OuterRef, Q\nbestseller_sq = Book.objects.filter(author=OuterRef('pk'), is_bestseller=True)\nauthors = Author.objects.filter(\n    Q(is_featured=True) | Q(Exists(bestseller_sq))\n)`
    ],
    explanation: "Exists() can be combined with Q objects using | and & operators in filter(). This generates WHERE is_featured = TRUE OR EXISTS (SELECT 1 FROM book WHERE author_id = author.pk AND is_bestseller = TRUE). Combining Exists() with Q gives full boolean control without multiple queries.",
    tags: ["Exists", "Q", "OuterRef", "OR", "filter", "advanced"]
  },
  // ============================================================
  // CASE / WHEN (ex-166 to ex-173)
  // ============================================================
  {
    id: "ex-166",
    title: "Case/When: Price Tier Annotation",
    difficulty: "intermediate",
    topic: "Case When",
    category: "queries",
    description: "Annotate products with a price tier label (budget/mid/premium) using Case/When.",
    schema: `from django.db import models

class Product(models.Model):
    name = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=8, decimal_places=2)`,
    sampleData: `Product.objects.create(name='Budget Widget', price=9.99)
Product.objects.create(name='Mid Widget', price=49.99)
Product.objects.create(name='Premium Widget', price=199.99)`,
    problemStatement: "Annotate each product with a 'tier' label: 'budget' if price < 20, 'premium' if price > 100, else 'mid'.",
    expectedResult: "Budget Widget: budget, Mid Widget: mid, Premium Widget: premium.",
    hints: [
      "Use Case(When(condition, then=Value('label')), ..., default=Value('default')).",
      "Import Case, When, Value, CharField from django.db.models."
    ],
    solution: `from django.db.models import Case, When, Value, CharField

products = Product.objects.annotate(
    tier=Case(
        When(price__lt=20, then=Value('budget')),
        When(price__gt=100, then=Value('premium')),
        default=Value('mid'),
        output_field=CharField()
    )
).order_by('price')

for p in products:
    print(f"{p.name}: {p.tier}")`,
    alternativeSolutions: [
      `from django.db.models import Case, When, Value, CharField\nproducts = Product.objects.annotate(\n    tier=Case(\n        When(price__lt=20, then=Value('budget')),\n        When(price__gte=20, price__lte=100, then=Value('mid')),\n        default=Value('premium'),\n        output_field=CharField()\n    )\n)`
    ],
    explanation: "Case evaluates When conditions in order and returns the first matching then value. default is used when no When matches. output_field=CharField() is required to tell Django the type of the annotation. This generates a CASE WHEN price < 20 THEN 'budget' WHEN price > 100 THEN 'premium' ELSE 'mid' END in SQL.",
    tags: ["Case", "When", "annotate", "conditional", "CharField", "intermediate"]
  },
  {
    id: "ex-167",
    title: "Case/When: Conditional Price Increase Based on Rating",
    difficulty: "advanced",
    topic: "Case When",
    category: "queries",
    description: "Use Case/When in an update to apply different price increase percentages based on book rating.",
    schema: `from django.db import models

class Book(models.Model):
    title = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)`,
    sampleData: `Book.objects.create(title='Top Rated', price=30.00, rating=4.8)
Book.objects.create(title='Good Book', price=25.00, rating=4.0)
Book.objects.create(title='Average Book', price=20.00, rating=3.0)`,
    problemStatement: "Apply a 20% price increase to books rated >= 4.5, 10% to books rated >= 4.0, no increase otherwise.",
    expectedResult: "Top Rated: 36.00, Good Book: 27.50, Average Book: 20.00.",
    hints: [
      "Use Case/When inside update() for conditional bulk updates.",
      "F('price') * Decimal('1.20') computes the new price."
    ],
    solution: `from django.db.models import Case, When, F, DecimalField
from django.db.models import ExpressionWrapper
from decimal import Decimal

Book.objects.update(
    price=Case(
        When(rating__gte=Decimal('4.5'), then=ExpressionWrapper(
            F('price') * Decimal('1.20'), output_field=DecimalField()
        )),
        When(rating__gte=Decimal('4.0'), then=ExpressionWrapper(
            F('price') * Decimal('1.10'), output_field=DecimalField()
        )),
        default=F('price'),
        output_field=DecimalField()
    )
)`,
    alternativeSolutions: [
      `from django.db.models import Case, When, F, DecimalField\nfrom decimal import Decimal\n# Two separate updates (simpler but 2 queries)\nBook.objects.filter(rating__gte=Decimal('4.5')).update(price=F('price') * Decimal('1.20'))\nBook.objects.filter(rating__gte=Decimal('4.0'), rating__lt=Decimal('4.5')).update(price=F('price') * Decimal('1.10'))`
    ],
    explanation: "Case/When inside update() generates UPDATE book SET price = CASE WHEN rating >= 4.5 THEN price * 1.20 WHEN rating >= 4.0 THEN price * 1.10 ELSE price END. This is a single atomic SQL statement. When conditions are evaluated in order — the first match wins.",
    tags: ["Case", "When", "update", "F", "arithmetic", "advanced"]
  },
  {
    id: "ex-168",
    title: "Case/When: Annotate Orders as Fast or Slow Delivery",
    difficulty: "intermediate",
    topic: "Case When",
    category: "queries",
    description: "Annotate orders with 'fast' or 'slow' based on whether delivery took 2 days or fewer.",
    schema: `from django.db import models

class Order(models.Model):
    reference = models.CharField(max_length=20)
    ordered_at = models.DateTimeField()
    delivered_at = models.DateTimeField(null=True, blank=True)`,
    sampleData: `from django.utils import timezone
from datetime import timedelta
now = timezone.now()
Order.objects.create(reference='ORD-001', ordered_at=now - timedelta(days=5), delivered_at=now - timedelta(days=4))
Order.objects.create(reference='ORD-002', ordered_at=now - timedelta(days=10), delivered_at=now - timedelta(days=3))`,
    problemStatement: "Annotate each order with 'fast' if delivered within 2 days, 'slow' otherwise.",
    expectedResult: "ORD-001: fast (1 day), ORD-002: slow (7 days).",
    hints: [
      "Use ExpressionWrapper to compute the duration, then Case/When on the result.",
      "Or use When(delivered_at__lte=F('ordered_at') + timedelta(days=2), then=...)."
    ],
    solution: `from django.db.models import Case, When, Value, F, CharField, ExpressionWrapper, DurationField
from datetime import timedelta

orders = Order.objects.annotate(
    delivery_speed=Case(
        When(
            delivered_at__lte=ExpressionWrapper(
                F('ordered_at') + timedelta(days=2),
                output_field=F('delivered_at').field.__class__()
            ),
            then=Value('fast')
        ),
        default=Value('slow'),
        output_field=CharField()
    )
)

for order in orders:
    print(f"{order.reference}: {order.delivery_speed}")`,
    alternativeSolutions: [
      `from django.db.models import Case, When, Value, F, CharField\nfrom datetime import timedelta\n# Simpler approach using duration field comparison\norders = Order.objects.annotate(\n    delivery_speed=Case(\n        When(delivered_at__isnull=False,\n             delivered_at__lte=F('ordered_at') + timedelta(days=2),\n             then=Value('fast')),\n        default=Value('slow'),\n        output_field=CharField()\n    )\n)`
    ],
    explanation: "Case/When can compare datetime fields using timedelta arithmetic. F('ordered_at') + timedelta(days=2) computes the cutoff timestamp. When delivered_at is <= that cutoff, delivery was fast. default=Value('slow') catches all other cases including null delivered_at.",
    tags: ["Case", "When", "annotate", "datetime", "duration", "intermediate"]
  },
  {
    id: "ex-169",
    title: "Case/When: Employee Salary Band Annotation",
    difficulty: "intermediate",
    topic: "Case When",
    category: "queries",
    description: "Annotate employees with a salary band label using Case/When ranges.",
    schema: `from django.db import models

class Employee(models.Model):
    name = models.CharField(max_length=100)
    salary = models.DecimalField(max_digits=10, decimal_places=2)
    department = models.CharField(max_length=100)`,
    sampleData: `Employee.objects.create(name='Alice', salary=45000, department='Support')
Employee.objects.create(name='Bob', salary=85000, department='Engineering')
Employee.objects.create(name='Carol', salary=150000, department='Engineering')`,
    problemStatement: "Annotate each employee with salary_band: 'junior' (<50k), 'senior' (<100k), 'executive' (>=100k).",
    expectedResult: "Alice: junior, Bob: senior, Carol: executive.",
    hints: [
      "When conditions are checked in order — put the most specific first.",
      "Use output_field=CharField() to specify the annotation type."
    ],
    solution: `from django.db.models import Case, When, Value, CharField

employees = Employee.objects.annotate(
    salary_band=Case(
        When(salary__lt=50000, then=Value('junior')),
        When(salary__lt=100000, then=Value('senior')),
        default=Value('executive'),
        output_field=CharField()
    )
).order_by('salary')

for emp in employees:
    print(f"{emp.name}: {emp.salary_band} (\${emp.salary})")`,
    alternativeSolutions: [
      `from django.db.models import Case, When, Value, CharField\nemployees = Employee.objects.annotate(\n    salary_band=Case(\n        When(salary__lt=50000, then=Value('junior')),\n        When(salary__gte=50000, salary__lt=100000, then=Value('senior')),\n        When(salary__gte=100000, then=Value('executive')),\n        output_field=CharField()\n    )\n)`
    ],
    explanation: "Case evaluates When clauses in order — the first matching When wins. Using salary__lt=50000 then salary__lt=100000 (without a lower bound on the second) works because the first condition already excludes salaries < 50000. Being explicit with both bounds in each When (alternative solution) is also valid and clearer.",
    tags: ["Case", "When", "annotate", "salary", "bands", "intermediate"]
  },
  {
    id: "ex-170",
    title: "Case/When: Human-Readable Status from Code",
    difficulty: "intermediate",
    topic: "Case When",
    category: "queries",
    description: "Annotate orders with a human-readable status label from a short status code.",
    schema: `from django.db import models

class Order(models.Model):
    reference = models.CharField(max_length=20)
    status = models.CharField(max_length=5, choices=[
        ('P', 'Pending'), ('C', 'Completed'), ('X', 'Cancelled'), ('R', 'Refunded')
    ])`,
    sampleData: `Order.objects.create(reference='ORD-001', status='P')
Order.objects.create(reference='ORD-002', status='C')
Order.objects.create(reference='ORD-003', status='X')`,
    problemStatement: "Annotate each order with status_label: the full human-readable name for its status code.",
    expectedResult: "ORD-001: Pending, ORD-002: Completed, ORD-003: Cancelled.",
    hints: [
      "When(status='P', then=Value('Pending')) maps each code to a label.",
      "Use get_status_display() as a Python alternative (no DB query needed)."
    ],
    solution: `from django.db.models import Case, When, Value, CharField

orders = Order.objects.annotate(
    status_label=Case(
        When(status='P', then=Value('Pending')),
        When(status='C', then=Value('Completed')),
        When(status='X', then=Value('Cancelled')),
        When(status='R', then=Value('Refunded')),
        default=Value('Unknown'),
        output_field=CharField()
    )
)

for order in orders:
    print(f"{order.reference}: {order.status_label}")`,
    alternativeSolutions: [
      `# Using Django's built-in choices display (Python-level, no annotation)\norders = Order.objects.all()\nfor order in orders:\n    print(f"{order.reference}: {order.get_status_display()}")`
    ],
    explanation: "Case/When is useful for mapping codes to labels in a queryset annotation, especially when you need to filter or order by the label, or return it in an API response. However, if you only need the label for display, get_status_display() (Django's built-in for choices) is simpler — no SQL needed.",
    tags: ["Case", "When", "annotate", "choices", "status", "intermediate"]
  },
  {
    id: "ex-171",
    title: "Case/When: Conditional Discount Calculation",
    difficulty: "advanced",
    topic: "Case When",
    category: "queries",
    description: "Annotate products with a final price after applying conditional discounts based on category.",
    schema: `from django.db import models

class Product(models.Model):
    name = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    category = models.CharField(max_length=50)`,
    sampleData: `Product.objects.create(name='Tech Item', price=100.00, category='tech')
Product.objects.create(name='Book Item', price=30.00, category='books')
Product.objects.create(name='Other Item', price=50.00, category='misc')`,
    problemStatement: "Annotate each product with final_price: 15% off for tech, 20% off for books, no discount otherwise.",
    expectedResult: "Tech Item: 85.00, Book Item: 24.00, Other Item: 50.00.",
    hints: [
      "Use F('price') * Decimal('0.85') inside When for tech.",
      "Wrap arithmetic in ExpressionWrapper with output_field=DecimalField()."
    ],
    solution: `from django.db.models import Case, When, F, DecimalField, ExpressionWrapper
from decimal import Decimal

products = Product.objects.annotate(
    final_price=Case(
        When(category='tech', then=ExpressionWrapper(
            F('price') * Decimal('0.85'), output_field=DecimalField()
        )),
        When(category='books', then=ExpressionWrapper(
            F('price') * Decimal('0.80'), output_field=DecimalField()
        )),
        default=F('price'),
        output_field=DecimalField()
    )
)

for p in products:
    print(f"{p.name}: \${p.final_price}")`,
    alternativeSolutions: [
      `from django.db.models import Case, When, F, DecimalField, Value\nfrom decimal import Decimal\n# Using discount multiplier per category\ndiscounts = {'tech': Decimal('0.85'), 'books': Decimal('0.80')}\n# Can build Case dynamically for many categories`
    ],
    explanation: "Each When branch can contain an expression, not just a static value. ExpressionWrapper is required to specify DecimalField output when multiplying F expressions. The default=F('price') returns the original price when no discount applies. This pattern is common for pricing rules in e-commerce.",
    tags: ["Case", "When", "F", "ExpressionWrapper", "annotate", "discount", "advanced"]
  },
  {
    id: "ex-172",
    title: "Case/When Inside Sum: Conditional Aggregate",
    difficulty: "advanced",
    topic: "Case When",
    category: "queries",
    description: "Use Case/When inside a Sum aggregate to conditionally sum only matching values.",
    schema: `from django.db import models

class Order(models.Model):
    customer_id = models.IntegerField()
    total = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20)`,
    sampleData: `Order.objects.create(customer_id=1, total=100, status='completed')
Order.objects.create(customer_id=1, total=200, status='refunded')
Order.objects.create(customer_id=1, total=150, status='completed')`,
    problemStatement: "In one query, compute both total completed revenue and total refunded amount for customer_id=1.",
    expectedResult: "{'completed_revenue': 250, 'refunded_amount': 200}",
    hints: [
      "Sum(Case(When(status='completed', then=F('total')), default=Value(0))) sums only completed.",
      "This pattern is called 'conditional aggregation'."
    ],
    solution: `from django.db.models import Sum, Case, When, F, Value, DecimalField

result = Order.objects.filter(customer_id=1).aggregate(
    completed_revenue=Sum(
        Case(
            When(status='completed', then=F('total')),
            default=Value(0),
            output_field=DecimalField()
        )
    ),
    refunded_amount=Sum(
        Case(
            When(status='refunded', then=F('total')),
            default=Value(0),
            output_field=DecimalField()
        )
    )
)

print(result)`,
    alternativeSolutions: [
      `# Modern Django: use filter= kwarg on Sum\nfrom django.db.models import Sum, Q\nresult = Order.objects.filter(customer_id=1).aggregate(\n    completed_revenue=Sum('total', filter=Q(status='completed')),\n    refunded_amount=Sum('total', filter=Q(status='refunded'))\n)`
    ],
    explanation: "Sum(Case(When(..., then=F('total')), default=0)) is the classic conditional aggregation pattern. The filter= kwarg (Django 2.0+) is the modern, cleaner equivalent that generates the same SQL. Both produce a single query with SUM(CASE WHEN ... END) or SUM(total) FILTER (WHERE ...) on PostgreSQL.",
    tags: ["Case", "When", "Sum", "conditional-aggregate", "advanced"]
  },
  {
    id: "ex-173",
    title: "Case/When: Urgency Score with Overlapping Conditions",
    difficulty: "advanced",
    topic: "Case When",
    category: "queries",
    description: "Annotate support tickets with an urgency level based on multiple overlapping conditions.",
    schema: `from django.db import models

class Ticket(models.Model):
    title = models.CharField(max_length=200)
    priority = models.CharField(max_length=20)
    days_open = models.IntegerField(default=0)
    customer_tier = models.CharField(max_length=20, default='standard')`,
    sampleData: `Ticket.objects.create(title='Old Premium Issue', priority='low', days_open=30, customer_tier='premium')
Ticket.objects.create(title='New Critical', priority='critical', days_open=1, customer_tier='standard')
Ticket.objects.create(title='Normal Issue', priority='low', days_open=5, customer_tier='standard')`,
    problemStatement: "Annotate tickets with urgency: 'critical' if priority=critical OR (premium customer AND open>14 days), 'high' if open>7 days, else 'normal'.",
    expectedResult: "Old Premium Issue: critical, New Critical: critical, Normal Issue: normal.",
    hints: [
      "Combine Q objects inside When for multi-condition cases.",
      "When(Q(priority='critical') | Q(customer_tier='premium', days_open__gt=14), then=...)."
    ],
    solution: `from django.db.models import Case, When, Value, Q, CharField

tickets = Ticket.objects.annotate(
    urgency=Case(
        When(
            Q(priority='critical') | Q(customer_tier='premium', days_open__gt=14),
            then=Value('critical')
        ),
        When(days_open__gt=7, then=Value('high')),
        default=Value('normal'),
        output_field=CharField()
    )
).order_by('-days_open')

for t in tickets:
    print(f"{t.title}: {t.urgency}")`,
    alternativeSolutions: [
      `from django.db.models import Case, When, Value, Q, CharField\ntickets = Ticket.objects.annotate(\n    urgency=Case(\n        When(priority='critical', then=Value('critical')),\n        When(customer_tier='premium', days_open__gt=14, then=Value('critical')),\n        When(days_open__gt=7, then=Value('high')),\n        default=Value('normal'),\n        output_field=CharField()\n    )\n)`
    ],
    explanation: "When() accepts Q objects for complex boolean conditions. Q(priority='critical') | Q(customer_tier='premium', days_open__gt=14) creates an OR condition with an AND inside. The alternative uses multiple separate When() checks — both produce the same result but the Q-based version is more concise for OR conditions.",
    tags: ["Case", "When", "Q", "annotate", "complex", "urgency", "advanced"]
  },
  // ============================================================
  // TRANSACTIONS (ex-174 to ex-178)
  // ============================================================
  {
    id: "ex-174",
    title: "Transaction: Atomic Order Creation and Inventory Deduction",
    difficulty: "advanced",
    topic: "transactions",
    category: "production",
    description: "Wrap order creation and inventory update in an atomic transaction to prevent data inconsistency.",
    schema: `from django.db import models

class Product(models.Model):
    name = models.CharField(max_length=200)
    stock = models.IntegerField(default=0)

class Order(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.IntegerField()
    total = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, default='pending')`,
    sampleData: `Product.objects.create(name='Widget', stock=10)`,
    problemStatement: "Create an order and deduct stock in a single atomic transaction. If either operation fails, roll back both.",
    expectedResult: "Order created and stock decremented atomically. On error, neither change persists.",
    hints: [
      "Use transaction.atomic() as a context manager.",
      "Raise an exception inside the block to trigger a rollback."
    ],
    solution: `from django.db import transaction
from django.db.models import F

def create_order(product_id, quantity, unit_price):
    with transaction.atomic():
        product = Product.objects.select_for_update().get(pk=product_id)

        if product.stock < quantity:
            raise ValueError(f"Insufficient stock: {product.stock} available, {quantity} requested")

        # Deduct stock atomically
        Product.objects.filter(pk=product_id).update(
            stock=F('stock') - quantity
        )

        # Create the order
        order = Order.objects.create(
            product=product,
            quantity=quantity,
            total=unit_price * quantity,
            status='confirmed'
        )

    return order`,
    alternativeSolutions: [
      `from django.db import transaction\n\n@transaction.atomic\ndef create_order(product_id, quantity, unit_price):\n    # Decorator form of atomic()\n    product = Product.objects.select_for_update().get(pk=product_id)\n    if product.stock < quantity:\n        raise ValueError('Insufficient stock')\n    product.stock -= quantity\n    product.save(update_fields=['stock'])\n    return Order.objects.create(product=product, quantity=quantity, total=unit_price * quantity)`
    ],
    explanation: "transaction.atomic() wraps multiple database operations in a single transaction. If any exception is raised inside the block, all changes are rolled back. select_for_update() locks the product row to prevent concurrent reads from seeing stale stock data. The @transaction.atomic decorator is equivalent to the context manager form.",
    tags: ["transaction", "atomic", "select_for_update", "rollback", "production", "advanced"]
  },
  {
    id: "ex-175",
    title: "Transaction: Savepoint for Partial Rollback",
    difficulty: "advanced",
    topic: "transactions",
    category: "production",
    description: "Use a savepoint inside an atomic block to partially roll back a failed operation while preserving others.",
    schema: `from django.db import models

class LogEntry(models.Model):
    message = models.TextField()
    level = models.CharField(max_length=20, default='INFO')
    created_at = models.DateTimeField(auto_now_add=True)

class Setting(models.Model):
    key = models.CharField(max_length=100, unique=True)
    value = models.TextField()`,
    sampleData: `Setting.objects.create(key='theme', value='light')`,
    problemStatement: "Within an outer transaction, attempt to update a setting and log it. If the setting update fails, roll back only that part but keep the log entry.",
    expectedResult: "Log entry saved even if setting update fails.",
    hints: [
      "Use transaction.savepoint() and transaction.savepoint_rollback() for partial rollback.",
      "Nested atomic() blocks create savepoints automatically."
    ],
    solution: `from django.db import transaction

def update_setting_with_log(key, value):
    with transaction.atomic():
        # This log entry will always be saved (unless outer transaction fails)
        LogEntry.objects.create(
            message=f"Attempting to update setting: {key}={value}",
            level='INFO'
        )

        try:
            with transaction.atomic():
                # Nested atomic creates a savepoint
                # If this fails, only the savepoint is rolled back
                setting = Setting.objects.get(key=key)
                setting.value = value
                setting.save()

                LogEntry.objects.create(
                    message=f"Setting updated: {key}={value}",
                    level='INFO'
                )
        except Setting.DoesNotExist:
            LogEntry.objects.create(
                message=f"Setting not found: {key}",
                level='ERROR'
            )`,
    alternativeSolutions: [
      `from django.db import transaction\n\ndef update_with_savepoint(key, value):\n    with transaction.atomic():\n        LogEntry.objects.create(message=f"Start: {key}", level="INFO")\n        sid = transaction.savepoint()\n        try:\n            Setting.objects.filter(key=key).update(value=value)\n            transaction.savepoint_commit(sid)\n        except Exception:\n            transaction.savepoint_rollback(sid)\n            LogEntry.objects.create(message=f"Failed: {key}", level="ERROR")`
    ],
    explanation: "Nested atomic() blocks create savepoints in the database. If the inner block raises an exception, Django rolls back to the savepoint but the outer transaction continues. This enables partial rollback: the log entry survives even if the setting update fails. Explicit savepoint() API gives the same control manually.",
    tags: ["transaction", "savepoint", "atomic", "rollback", "production", "advanced"]
  },
  {
    id: "ex-176",
    title: "Transaction: select_for_update() to Prevent Race Condition",
    difficulty: "advanced",
    topic: "transactions",
    category: "production",
    description: "Use select_for_update() to lock inventory rows and prevent overselling in concurrent requests.",
    schema: `from django.db import models

class InventoryItem(models.Model):
    product_name = models.CharField(max_length=200)
    quantity = models.IntegerField(default=0)
    reserved = models.IntegerField(default=0)`,
    sampleData: `InventoryItem.objects.create(product_name='Laptop', quantity=5, reserved=0)`,
    problemStatement: "Reserve inventory for an order: lock the row, check availability, and decrement quantity atomically.",
    expectedResult: "Inventory decremented safely under concurrent access. Raises error if insufficient stock.",
    hints: [
      "select_for_update() adds SELECT ... FOR UPDATE — blocks other transactions from reading the row.",
      "Must be inside a transaction.atomic() block."
    ],
    solution: `from django.db import transaction
from django.db.models import F

def reserve_inventory(product_name, quantity_needed):
    with transaction.atomic():
        # Lock the row — other transactions will wait at this line
        item = InventoryItem.objects.select_for_update().get(
            product_name=product_name
        )

        available = item.quantity - item.reserved
        if available < quantity_needed:
            raise ValueError(
                f"Only {available} units available, {quantity_needed} requested"
            )

        # Safe to update — row is locked
        InventoryItem.objects.filter(pk=item.pk).update(
            reserved=F('reserved') + quantity_needed
        )

        return True`,
    alternativeSolutions: [
      `from django.db import transaction\n\nwith transaction.atomic():\n    # nowait=True raises DatabaseError immediately if row is locked\n    item = InventoryItem.objects.select_for_update(nowait=True).get(\n        product_name='Laptop'\n    )\n    # ... proceed with reservation`
    ],
    explanation: "select_for_update() adds FOR UPDATE to the SELECT statement, acquiring a row-level lock. Other transactions trying to select_for_update() the same row will block until the first transaction commits or rolls back. nowait=True raises an immediate error instead of blocking. This prevents the race condition where two concurrent requests both see sufficient stock and both proceed.",
    tags: ["select_for_update", "transaction", "atomic", "race-condition", "production", "advanced"]
  },
  {
    id: "ex-177",
    title: "Transaction: on_commit() to Trigger Email After Save",
    difficulty: "advanced",
    topic: "transactions",
    category: "production",
    description: "Use transaction.on_commit() to send an email only after the database transaction successfully commits.",
    schema: `from django.db import models

class Order(models.Model):
    customer_email = models.EmailField()
    total = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)`,
    sampleData: `# Created dynamically in the solution`,
    problemStatement: "Create an order inside a transaction, then trigger an email notification only after the transaction commits successfully.",
    expectedResult: "Email sent only if order save succeeds. Not sent if transaction rolls back.",
    hints: [
      "transaction.on_commit(callback) registers a function to run after commit.",
      "Without on_commit, sending email before commit may result in email with no order."
    ],
    solution: `from django.db import transaction

def send_order_confirmation(order_id, email):
    """This runs after the transaction commits successfully."""
    from django.core.mail import send_mail
    send_mail(
        subject=f'Order #{order_id} Confirmed',
        message=f'Your order has been placed.',
        from_email='noreply@shop.com',
        recipient_list=[email],
    )

def create_order_with_notification(customer_email, total):
    with transaction.atomic():
        order = Order.objects.create(
            customer_email=customer_email,
            total=total,
            status='confirmed'
        )

        # Register callback to run AFTER this transaction commits
        # If the transaction rolls back, this callback is never called
        transaction.on_commit(
            lambda: send_order_confirmation(order.id, customer_email)
        )

    return order`,
    alternativeSolutions: [
      `from django.db import transaction\n\n# With Celery task\ndef create_order_with_celery(email, total):\n    with transaction.atomic():\n        order = Order.objects.create(customer_email=email, total=total)\n        # Delay task until after commit\n        transaction.on_commit(\n            lambda: send_confirmation_email.delay(order.id)\n        )`
    ],
    explanation: "transaction.on_commit() registers a callback that runs only after the database transaction successfully commits. Without it, sending email inside the atomic block could result in a confirmation email for an order that was later rolled back. on_commit() is the correct pattern for any side effects (email, Celery tasks, webhooks) that depend on successful database writes.",
    tags: ["transaction", "on_commit", "atomic", "email", "side-effects", "production", "advanced"]
  },
  {
    id: "ex-178",
    title: "Transaction: Catch IntegrityError with Savepoint Retry",
    difficulty: "advanced",
    topic: "transactions",
    category: "production",
    description: "Handle an IntegrityError within a transaction using a savepoint to allow the outer transaction to continue.",
    schema: `from django.db import models

class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True)

class Article(models.Model):
    title = models.CharField(max_length=200)
    tags = models.ManyToManyField(Tag, blank=True)`,
    sampleData: `Tag.objects.create(name='existing-tag')`,
    problemStatement: "Create or get tags by name inside a transaction — handle IntegrityError from duplicate tag creation gracefully using a savepoint.",
    expectedResult: "Tag created if new; fetched if duplicate. No transaction abort on duplicate.",
    hints: [
      "Catching IntegrityError outside a savepoint poisons the outer transaction on PostgreSQL.",
      "Wrap the create() in nested atomic() to use a savepoint."
    ],
    solution: `from django.db import transaction, IntegrityError

def get_or_create_tag_safe(name):
    """get_or_create is preferred, but this shows the savepoint pattern."""
    try:
        with transaction.atomic():
            # Nested atomic() creates a savepoint
            tag = Tag.objects.create(name=name)
            return tag, True  # created=True
    except IntegrityError:
        # Savepoint is rolled back, outer transaction is unaffected
        tag = Tag.objects.get(name=name)
        return tag, False  # created=False

def create_article_with_tags(title, tag_names):
    with transaction.atomic():
        article = Article.objects.create(title=title)

        for tag_name in tag_names:
            tag, created = get_or_create_tag_safe(tag_name)
            article.tags.add(tag)

    return article`,
    alternativeSolutions: [
      `# Use built-in get_or_create which handles this pattern\nfrom django.db import transaction\n\ndef create_article_simple(title, tag_names):\n    with transaction.atomic():\n        article = Article.objects.create(title=title)\n        for name in tag_names:\n            tag, _ = Tag.objects.get_or_create(name=name)\n            article.tags.add(tag)\n    return article`
    ],
    explanation: "On PostgreSQL, an IntegrityError inside a transaction poisons the entire transaction — no further queries can run. Wrapping the risky operation in a nested atomic() creates a savepoint. If IntegrityError occurs, only the savepoint is rolled back; the outer transaction remains valid. Django's get_or_create() uses this pattern internally.",
    tags: ["transaction", "savepoint", "IntegrityError", "atomic", "production", "advanced"]
  },
  // ============================================================
  // UNION / INTERSECTION / DIFFERENCE (ex-179 to ex-183)
  // ============================================================
  {
    id: "ex-179",
    title: "union(): Premium Books and Books Over $30",
    difficulty: "advanced",
    topic: "union",
    category: "queries",
    description: "Combine two querysets with union() to get books that are either premium or cost over $30.",
    schema: `from django.db import models

class Book(models.Model):
    title = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    is_premium = models.BooleanField(default=False)`,
    sampleData: `Book.objects.create(title='Premium Cheap', price=10.00, is_premium=True)
Book.objects.create(title='Expensive Non-Premium', price=50.00, is_premium=False)
Book.objects.create(title='Mid Book', price=25.00, is_premium=False)
Book.objects.create(title='Premium Expensive', price=60.00, is_premium=True)`,
    problemStatement: "Get all books that are premium OR priced over $30, without duplicates.",
    expectedResult: "3 books: 'Premium Cheap', 'Expensive Non-Premium', 'Premium Expensive'.",
    hints: [
      "qs1.union(qs2) combines results and removes duplicates by default.",
      "Both querysets must select the same columns."
    ],
    solution: `premium_books = Book.objects.filter(is_premium=True)
expensive_books = Book.objects.filter(price__gt=30)

result = premium_books.union(expensive_books)

for book in result:
    print(f"{book.title} (\${book.price}, premium={book.is_premium})")`,
    alternativeSolutions: [
      `from django.db.models import Q\n# Equivalent with Q — single query, often more efficient\nresult = Book.objects.filter(Q(is_premium=True) | Q(price__gt=30))`
    ],
    explanation: "union() combines two querysets using SQL UNION, which removes duplicates. Books matching both conditions (premium AND expensive) appear once. The Q(is_premium=True) | Q(price__gt=30) approach is equivalent and often more efficient as it's a single query without UNION. Use union() when combining querysets from different models or complex conditions.",
    tags: ["union", "queryset", "set-operations", "advanced"]
  },
  {
    id: "ex-180",
    title: "intersection(): Authors in Both Fiction and Non-Fiction",
    difficulty: "advanced",
    topic: "intersection",
    category: "queries",
    description: "Use intersection() to find authors who have books in both Fiction and Non-Fiction categories.",
    schema: `from django.db import models

class Author(models.Model):
    name = models.CharField(max_length=100)

class Book(models.Model):
    title = models.CharField(max_length=200)
    author = models.ForeignKey(Author, on_delete=models.CASCADE, related_name='books')
    category = models.CharField(max_length=50)`,
    sampleData: `alice = Author.objects.create(name='Alice')
bob = Author.objects.create(name='Bob')
Book.objects.create(title='Alice Fiction', author=alice, category='Fiction')
Book.objects.create(title='Alice Non-Fiction', author=alice, category='Non-Fiction')
Book.objects.create(title='Bob Fiction', author=bob, category='Fiction')`,
    problemStatement: "Find authors who have written at least one book in Fiction AND at least one in Non-Fiction.",
    expectedResult: "1 author: Alice.",
    hints: [
      "Get fiction authors queryset and non-fiction authors queryset, then intersection().",
      "Requires PostgreSQL or SQLite 3.25+ — not supported on all backends."
    ],
    solution: `fiction_authors = Author.objects.filter(books__category='Fiction')
nonfiction_authors = Author.objects.filter(books__category='Non-Fiction')

# Authors in both categories
versatile_authors = fiction_authors.intersection(nonfiction_authors)`,
    alternativeSolutions: [
      `from django.db.models import Count, Q\n# Cross-database compatible approach\nversatile_authors = Author.objects.annotate(\n    fiction_count=Count('books', filter=Q(books__category='Fiction')),\n    nonfiction_count=Count('books', filter=Q(books__category='Non-Fiction'))\n).filter(fiction_count__gt=0, nonfiction_count__gt=0)`
    ],
    explanation: "intersection() uses SQL INTERSECT to find rows present in both querysets. It is only supported on PostgreSQL and SQLite 3.25+. The annotate + filter approach is cross-database compatible and often preferred in production. Note: after union()/intersection(), you cannot chain further filter() or annotate() — the result is a frozen queryset.",
    tags: ["intersection", "queryset", "set-operations", "PostgreSQL", "advanced"]
  },
  {
    id: "ex-181",
    title: "difference(): Books Not in User's Wishlist",
    difficulty: "advanced",
    topic: "difference",
    category: "queries",
    description: "Use difference() to find books that are NOT in a user's wishlist.",
    schema: `from django.db import models

class Book(models.Model):
    title = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=8, decimal_places=2)

class Wishlist(models.Model):
    user_id = models.IntegerField()
    book = models.ForeignKey(Book, on_delete=models.CASCADE)`,
    sampleData: `b1 = Book.objects.create(title='Book 1', price=20)
b2 = Book.objects.create(title='Book 2', price=30)
b3 = Book.objects.create(title='Book 3', price=40)
Wishlist.objects.create(user_id=1, book=b1)`,
    problemStatement: "Find all books that user_id=1 has NOT wishlisted.",
    expectedResult: "2 books: Book 2 and Book 3.",
    hints: [
      "qs1.difference(qs2) returns rows in qs1 that are not in qs2.",
      "Get all books, then subtract wishlisted books."
    ],
    solution: `user_id = 1

all_books = Book.objects.all()
wishlisted_books = Book.objects.filter(wishlist__user_id=user_id)

books_not_wishlisted = all_books.difference(wishlisted_books)`,
    alternativeSolutions: [
      `# Cross-database compatible\nwishlisted_ids = Wishlist.objects.filter(user_id=1).values_list('book_id', flat=True)\nbooks_not_wishlisted = Book.objects.exclude(pk__in=wishlisted_ids)`
    ],
    explanation: "difference() uses SQL EXCEPT to subtract the second queryset from the first. Like intersection(), it requires PostgreSQL or SQLite 3.25+. The exclude(pk__in=...) approach is universally compatible and often preferred. After difference(), further filter() calls raise an error — the queryset is finalized.",
    tags: ["difference", "queryset", "set-operations", "exclude", "advanced"]
  },
  {
    id: "ex-182",
    title: "union(all=True): Preserve Duplicates in Combined Queryset",
    difficulty: "advanced",
    topic: "union",
    category: "queries",
    description: "Use union(all=True) to combine querysets while preserving duplicate rows.",
    schema: `from django.db import models

class Sale(models.Model):
    product_name = models.CharField(max_length=200)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    region = models.CharField(max_length=50)`,
    sampleData: `Sale.objects.create(product_name='Widget', amount=100, region='North')
Sale.objects.create(product_name='Widget', amount=100, region='North')
Sale.objects.create(product_name='Gadget', amount=200, region='South')`,
    problemStatement: "Combine two regional sale querysets with union(all=True) to preserve all rows including duplicates.",
    expectedResult: "All rows from both querysets including any identical rows.",
    hints: [
      "union() by default uses UNION (removes duplicates).",
      "union(all=True) uses UNION ALL which preserves duplicates."
    ],
    solution: `north_sales = Sale.objects.filter(region='North').values('product_name', 'amount')
south_sales = Sale.objects.filter(region='South').values('product_name', 'amount')

# UNION ALL — preserves all rows including duplicates
all_sales = north_sales.union(south_sales, all=True)

for sale in all_sales:
    print(f"{sale['product_name']}: \${sale['amount']}")`,
    alternativeSolutions: [
      `# Filter-based approach (no UNION needed here)\nall_sales = Sale.objects.filter(region__in=['North', 'South']).values('product_name', 'amount')`
    ],
    explanation: "union() with no arguments uses SQL UNION which removes duplicate rows. union(all=True) uses UNION ALL which includes all rows including exact duplicates. Use UNION ALL when duplicates are meaningful (e.g., summing sales from multiple sources) or when you know there are no duplicates and want to avoid the deduplication overhead.",
    tags: ["union", "UNION-ALL", "queryset", "set-operations", "advanced"]
  },
  {
    id: "ex-183",
    title: "union() Across Different Models via values()",
    difficulty: "advanced",
    topic: "union",
    category: "queries",
    description: "Use union() with values() to combine records from two different models into a unified result set.",
    schema: `from django.db import models

class BlogPost(models.Model):
    title = models.CharField(max_length=200)
    published_at = models.DateTimeField()
    content_type = models.CharField(max_length=20, default='post')

class NewsArticle(models.Model):
    headline = models.CharField(max_length=200)
    published_at = models.DateTimeField()
    content_type = models.CharField(max_length=20, default='news')`,
    sampleData: `from django.utils import timezone
BlogPost.objects.create(title='Blog Post One', published_at=timezone.now(), content_type='post')
NewsArticle.objects.create(headline='News Article One', published_at=timezone.now(), content_type='news')`,
    problemStatement: "Combine blog posts and news articles into a unified feed, ordered by published_at, with matching column names.",
    expectedResult: "A combined queryset with 'title' and 'published_at' for all items.",
    hints: [
      "Use values() with aliased field names to align columns across models.",
      "Both sides of union() must have the same number of columns with compatible types."
    ],
    solution: `from django.utils import timezone

posts = BlogPost.objects.values('title', 'published_at', 'content_type')
news = NewsArticle.objects.values(
    title=models.F('headline'),  # alias headline as title
    published_at=models.F('published_at'),
    content_type=models.F('content_type')
)

# Combine into unified feed
feed = posts.union(news).order_by('-published_at')

for item in feed:
    print(f"[{item['content_type']}] {item['title']}")`,
    alternativeSolutions: [
      `from django.db.models import Value, CharField\nposts = BlogPost.objects.annotate(\n    item_title=models.F('title')\n).values('item_title', 'published_at')\nnews = NewsArticle.objects.annotate(\n    item_title=models.F('headline')\n).values('item_title', 'published_at')\nfeed = posts.union(news).order_by('-published_at')`
    ],
    explanation: "union() requires both querysets to have the same number of columns. Use values() to select specific fields and rename them with keyword arguments (Django 3.2+: values(alias=F('field'))). The column names from the first queryset are used in the result. This is the standard pattern for building heterogeneous content feeds.",
    tags: ["union", "values", "multi-model", "feed", "set-operations", "advanced"]
  },
  // ============================================================
  // MODEL OPERATIONS (ex-184 to ex-195)
  // ============================================================
  {
    id: "ex-184",
    title: "Model save(): Auto-Generate Slug on Save",
    difficulty: "intermediate",
    topic: "models",
    category: "models",
    description: "Override Model.save() to automatically generate a URL slug from the title if not provided.",
    schema: `from django.db import models
from django.utils.text import slugify

class Article(models.Model):
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True, blank=True)
    body = models.TextField()
    published = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)`,
    sampleData: `Article.objects.create(title='Django Tips and Tricks', body='Content here...')`,
    problemStatement: "Create an Article without providing a slug — the model should auto-generate it from the title.",
    expectedResult: "Article with slug='django-tips-and-tricks' auto-set.",
    hints: [
      "Override save() and call super().save(*args, **kwargs).",
      "slugify() converts 'Django Tips' to 'django-tips'."
    ],
    solution: `from django.utils.text import slugify

class Article(models.Model):
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True, blank=True)
    body = models.TextField()

    def save(self, *args, **kwargs):
        if not self.slug:
            # Auto-generate slug only if not already set
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)

# Usage
article = Article(title='Django Tips and Tricks', body='...')
article.save()
print(article.slug)  # 'django-tips-and-tricks'`,
    alternativeSolutions: [
      `# Using pre_save signal instead of save() override\nfrom django.db.models.signals import pre_save\nfrom django.dispatch import receiver\nfrom django.utils.text import slugify\n\n@receiver(pre_save, sender=Article)\ndef set_slug(sender, instance, **kwargs):\n    if not instance.slug:\n        instance.slug = slugify(instance.title)`
    ],
    explanation: "Overriding save() is the standard Django pattern for computing derived fields before saving. Always call super().save(*args, **kwargs) to ensure the actual database write happens. The if not self.slug guard prevents overwriting manually-set slugs and avoids regenerating on updates. The pre_save signal is an alternative that keeps model code cleaner.",
    tags: ["save", "slug", "slugify", "override", "model", "intermediate"]
  },
  {
    id: "ex-185",
    title: "Custom Manager: Return Only Published Objects",
    difficulty: "intermediate",
    topic: "models",
    category: "models",
    description: "Create a custom Manager that filters to only published posts by default.",
    schema: `from django.db import models

class PublishedManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(is_published=True)

class Post(models.Model):
    title = models.CharField(max_length=200)
    body = models.TextField()
    is_published = models.BooleanField(default=False)

    objects = models.Manager()        # Default manager (all posts)
    published = PublishedManager()    # Custom manager (published only)`,
    sampleData: `Post.objects.create(title='Draft Post', body='...', is_published=False)
Post.objects.create(title='Live Post', body='...', is_published=True)`,
    problemStatement: "Define a custom Manager that returns only published posts and attach it as Post.published.",
    expectedResult: "Post.published.all() returns only published posts. Post.objects.all() returns all.",
    hints: [
      "Override get_queryset() to add a base filter.",
      "Keep 'objects' as the default manager so Django admin works correctly."
    ],
    solution: `class PublishedManager(models.Manager):
    def get_queryset(self):
        # Always filter to published posts
        return super().get_queryset().filter(is_published=True)

class Post(models.Model):
    title = models.CharField(max_length=200)
    body = models.TextField()
    is_published = models.BooleanField(default=False)

    # Keep default manager first for Django internals
    objects = models.Manager()
    published = PublishedManager()

# Usage
all_posts = Post.objects.all()            # All posts
live_posts = Post.published.all()         # Published only
recent_live = Post.published.order_by('-id')[:5]  # Chain works normally`,
    alternativeSolutions: [
      `# Using a custom QuerySet class (more flexible — see ex-205)\nclass PostQuerySet(models.QuerySet):\n    def published(self):\n        return self.filter(is_published=True)\n\nclass Post(models.Model):\n    objects = PostQuerySet.as_manager()`
    ],
    explanation: "A custom Manager overrides get_queryset() to provide a filtered base queryset. Attaching it as Post.published creates a clean API: Post.published.all(), Post.published.filter(...). Keeping objects = models.Manager() as the first (default) manager is important because Django uses the first manager for internal operations like admin and migrations.",
    tags: ["Manager", "custom-manager", "published", "queryset", "model", "intermediate"]
  },
  {
    id: "ex-186",
    title: "Model Method: total_price Property",
    difficulty: "intermediate",
    topic: "models",
    category: "models",
    description: "Add a model method that computes total price from unit price and quantity.",
    schema: `from django.db import models

class OrderItem(models.Model):
    product_name = models.CharField(max_length=200)
    unit_price = models.DecimalField(max_digits=8, decimal_places=2)
    quantity = models.IntegerField(default=1)

    def total_price(self):
        return self.unit_price * self.quantity

    @property
    def discounted_price(self):
        return self.unit_price * self.quantity * 0.9`,
    sampleData: `OrderItem.objects.create(product_name='Widget', unit_price=25.00, quantity=4)`,
    problemStatement: "Add a total_price() method and a discounted_price property to OrderItem.",
    expectedResult: "item.total_price() == 100.00, item.discounted_price == 90.00.",
    hints: [
      "Regular methods: item.total_price().",
      "@property makes it accessible as item.discounted_price (no parentheses)."
    ],
    solution: `from decimal import Decimal

class OrderItem(models.Model):
    product_name = models.CharField(max_length=200)
    unit_price = models.DecimalField(max_digits=8, decimal_places=2)
    quantity = models.IntegerField(default=1)

    def total_price(self):
        """Compute total price as unit_price * quantity."""
        return self.unit_price * self.quantity

    @property
    def discounted_price(self):
        """Total price with 10% discount applied."""
        return self.total_price() * Decimal('0.9')

    def __str__(self):
        return f"{self.product_name} x{self.quantity} = \${self.total_price()}"

# Usage
item = OrderItem.objects.get(product_name='Widget')
print(item.total_price())       # 100.00
print(item.discounted_price)    # 90.00`,
    alternativeSolutions: [
      `# Annotation alternative (computed in DB)\nfrom django.db.models import F, ExpressionWrapper, DecimalField\nitems = OrderItem.objects.annotate(\n    total=ExpressionWrapper(F('unit_price') * F('quantity'), output_field=DecimalField())\n)`
    ],
    explanation: "Model methods encapsulate business logic on the model instance. Regular methods require parentheses; @property decorators allow attribute-style access. Model methods only work on already-fetched instances — they cannot be used in filter() or order_by(). Use annotations for database-level computations.",
    tags: ["model-method", "property", "total_price", "decimal", "intermediate"]
  },
  {
    id: "ex-187",
    title: "Abstract Model: TimeStampedModel Mixin",
    difficulty: "intermediate",
    topic: "models",
    category: "models",
    description: "Define an abstract TimeStampedModel with created_at and updated_at, then inherit it in child models.",
    schema: `from django.db import models

class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

class Article(TimeStampedModel):
    title = models.CharField(max_length=200)
    body = models.TextField()

class Comment(TimeStampedModel):
    article = models.ForeignKey(Article, on_delete=models.CASCADE, related_name='comments')
    text = models.TextField()`,
    sampleData: `article = Article.objects.create(title='Test', body='Body text')
Comment.objects.create(article=article, text='Great article!')`,
    problemStatement: "Create an abstract TimeStampedModel and inherit it in Article and Comment models.",
    expectedResult: "Article and Comment both have created_at and updated_at fields without code duplication.",
    hints: [
      "abstract = True in Meta prevents Django from creating a database table for the abstract model.",
      "Child models inherit all fields from abstract parents."
    ],
    solution: `class TimeStampedModel(models.Model):
    """Abstract base model providing created_at and updated_at timestamps."""
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True  # No database table created for this model

class Article(TimeStampedModel):
    title = models.CharField(max_length=200)
    body = models.TextField()
    # Inherits: created_at, updated_at

class Comment(TimeStampedModel):
    article = models.ForeignKey(Article, on_delete=models.CASCADE, related_name='comments')
    text = models.TextField()
    # Inherits: created_at, updated_at

# Usage
article = Article.objects.create(title='My Article', body='Content')
print(article.created_at)  # auto-set on creation
print(article.updated_at)  # auto-updated on save`,
    alternativeSolutions: [
      `# Using mixin with additional utility methods\nclass TimeStampedModel(models.Model):\n    created_at = models.DateTimeField(auto_now_add=True)\n    updated_at = models.DateTimeField(auto_now=True)\n\n    def was_recently_created(self):\n        from django.utils import timezone\n        from datetime import timedelta\n        return self.created_at >= timezone.now() - timedelta(hours=24)\n\n    class Meta:\n        abstract = True`
    ],
    explanation: "Abstract models (Meta: abstract = True) are Python-only — no database table is created. Child models inherit all fields, managers, and methods from the abstract parent. This is the DRY pattern for shared fields like timestamps, soft-delete flags, or UUID PKs. Each child gets its own database table with the inherited fields included.",
    tags: ["abstract-model", "mixin", "timestamps", "inheritance", "DRY", "intermediate"]
  },
  {
    id: "ex-188",
    title: "Soft Delete Pattern: Override delete() and Add restore()",
    difficulty: "intermediate",
    topic: "models",
    category: "models",
    description: "Implement soft delete on a model by overriding delete() to set deleted_at instead of removing the row.",
    schema: `from django.db import models
from django.utils import timezone

class SoftDeleteManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(deleted_at__isnull=True)

class Document(models.Model):
    title = models.CharField(max_length=200)
    content = models.TextField()
    deleted_at = models.DateTimeField(null=True, blank=True)

    objects = SoftDeleteManager()     # Active documents only
    all_objects = models.Manager()    # All including deleted

    def delete(self, *args, **kwargs):
        self.deleted_at = timezone.now()
        self.save(update_fields=['deleted_at'])

    def restore(self):
        self.deleted_at = None
        self.save(update_fields=['deleted_at'])`,
    sampleData: `Document.objects.create(title='Active Doc', content='...')
Document.objects.create(title='Soon Deleted', content='...')`,
    problemStatement: "Implement soft delete: calling doc.delete() sets deleted_at, doc.restore() clears it. Normal queries exclude deleted docs.",
    expectedResult: "Document.objects.all() excludes soft-deleted docs. Document.all_objects.all() includes them.",
    hints: [
      "Override delete() to set deleted_at instead of calling super().delete().",
      "Custom manager filters out deleted records in get_queryset()."
    ],
    solution: `from django.utils import timezone

class SoftDeleteManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(deleted_at__isnull=True)

class Document(models.Model):
    title = models.CharField(max_length=200)
    content = models.TextField()
    deleted_at = models.DateTimeField(null=True, blank=True)

    objects = SoftDeleteManager()      # Default: active only
    all_objects = models.Manager()     # All records

    def delete(self, using=None, keep_parents=False):
        """Soft delete: mark as deleted without removing from DB."""
        self.deleted_at = timezone.now()
        self.save(update_fields=['deleted_at'])

    def restore(self):
        """Undelete a soft-deleted document."""
        self.deleted_at = None
        self.save(update_fields=['deleted_at'])

    @property
    def is_deleted(self):
        return self.deleted_at is not None

# Usage
doc = Document.objects.create(title='My Doc', content='...')
doc.delete()                          # Soft delete
Document.objects.count()             # 0 (filtered by manager)
Document.all_objects.count()         # 1 (includes deleted)
doc.restore()
Document.objects.count()             # 1`,
    alternativeSolutions: [
      `# Using a boolean flag instead of timestamp\nclass Document(models.Model):\n    title = models.CharField(max_length=200)\n    is_deleted = models.BooleanField(default=False)\n\n    def delete(self, **kwargs):\n        self.is_deleted = True\n        self.save(update_fields=['is_deleted'])`
    ],
    explanation: "Soft delete preserves data history and allows recovery. The custom manager filters deleted_at__isnull=True so normal queries never see deleted records. all_objects = models.Manager() provides an escape hatch for admin/audit views. update_fields=['deleted_at'] makes the save() only touch one column instead of all.",
    tags: ["soft-delete", "delete", "restore", "Manager", "model", "intermediate"]
  },
  {
    id: "ex-189",
    title: "UUID Primary Key Model",
    difficulty: "intermediate",
    topic: "models",
    category: "models",
    description: "Define a model that uses a UUID as its primary key instead of the default auto-incrementing integer.",
    schema: `import uuid
from django.db import models

class Token(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)`,
    sampleData: `Token.objects.create(name='API Token for Alice')`,
    problemStatement: "Define a Token model with a UUID primary key, then create and look up a token by UUID.",
    expectedResult: "Token created with UUID pk. Accessible via Token.objects.get(pk=<uuid>).",
    hints: [
      "UUIDField(primary_key=True, default=uuid.uuid4, editable=False) sets UUID as PK.",
      "uuid.uuid4 (without parentheses) is a callable used as default."
    ],
    solution: `import uuid
from django.db import models

class Token(models.Model):
    # UUID primary key — globally unique, not guessable
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,   # callable, not uuid.uuid4()
        editable=False
    )
    name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

# Usage
token = Token.objects.create(name='API Token for Alice')
print(token.pk)    # e.g. 3f2504e0-4f89-11d3-9a0c-0305e82c3301

# Lookup by UUID
retrieved = Token.objects.get(pk=token.pk)

# URL-safe lookup
import uuid
uuid_str = '3f2504e0-4f89-11d3-9a0c-0305e82c3301'
token = Token.objects.get(pk=uuid.UUID(uuid_str))`,
    alternativeSolutions: [
      `import uuid\n# Abstract base for UUID PK on any model\nclass UUIDModel(models.Model):\n    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)\n    class Meta:\n        abstract = True\n\nclass Token(UUIDModel):\n    name = models.CharField(max_length=100)`
    ],
    explanation: "UUIDField with primary_key=True replaces Django's default AutoField. default=uuid.uuid4 (a callable) generates a new UUID4 for each new instance. editable=False hides it from forms. UUIDs prevent sequential enumeration attacks and work well in distributed systems. The abstract base pattern makes it reusable across models.",
    tags: ["UUID", "primary-key", "UUIDField", "model", "security", "intermediate"]
  },
  {
    id: "ex-190",
    title: "UniqueConstraint on Author and Title Combination",
    difficulty: "intermediate",
    topic: "models",
    category: "models",
    description: "Use UniqueConstraint in Meta to enforce that (author, title) combinations are unique.",
    schema: `from django.db import models

class Author(models.Model):
    name = models.CharField(max_length=100)

class Book(models.Model):
    title = models.CharField(max_length=200)
    author = models.ForeignKey(Author, on_delete=models.CASCADE)
    published_year = models.IntegerField()

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['author', 'title'],
                name='unique_author_title'
            )
        ]`,
    sampleData: `alice = Author.objects.create(name='Alice')
Book.objects.create(title='My Book', author=alice, published_year=2023)`,
    problemStatement: "Define a UniqueConstraint ensuring no two books by the same author can have the same title.",
    expectedResult: "Creating a second 'My Book' by Alice raises IntegrityError.",
    hints: [
      "UniqueConstraint(fields=[...], name='...') adds a DB-level UNIQUE constraint.",
      "The name is used in error messages and migration generation."
    ],
    solution: `from django.db import models

class Author(models.Model):
    name = models.CharField(max_length=100)

class Book(models.Model):
    title = models.CharField(max_length=200)
    author = models.ForeignKey(Author, on_delete=models.CASCADE)
    published_year = models.IntegerField()

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['author', 'title'],
                name='unique_author_title'
            )
        ]

# Usage
from django.db import IntegrityError

alice = Author.objects.create(name='Alice')
Book.objects.create(title='My Book', author=alice, published_year=2023)

try:
    Book.objects.create(title='My Book', author=alice, published_year=2024)
except IntegrityError:
    print("Duplicate (author, title) combination rejected by database")`,
    alternativeSolutions: [
      `# Old style — still works but UniqueConstraint is preferred\nclass Book(models.Model):\n    title = models.CharField(max_length=200)\n    author = models.ForeignKey(Author, on_delete=models.CASCADE)\n\n    class Meta:\n        unique_together = [['author', 'title']]`
    ],
    explanation: "UniqueConstraint in Meta.constraints creates a database-level UNIQUE INDEX on the specified fields. This is the modern replacement for unique_together. The constraint is enforced at the database level, so even raw SQL inserts will fail. Django raises IntegrityError on duplicate combinations. The name is required and must be unique across the project.",
    tags: ["UniqueConstraint", "unique-together", "constraints", "model", "Meta", "intermediate"]
  },
  {
    id: "ex-191",
    title: "CheckConstraint: Price Must Be Positive",
    difficulty: "intermediate",
    topic: "models",
    category: "models",
    description: "Use CheckConstraint in Meta to enforce that the price field is always greater than zero.",
    schema: `from django.db import models

class Product(models.Model):
    name = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=8, decimal_places=2)

    class Meta:
        constraints = [
            models.CheckConstraint(
                check=models.Q(price__gt=0),
                name='price_must_be_positive'
            )
        ]`,
    sampleData: `Product.objects.create(name='Widget', price=9.99)`,
    problemStatement: "Add a CheckConstraint so that price must be > 0. Verify it rejects negative prices.",
    expectedResult: "Creating a product with price=-1 raises IntegrityError.",
    hints: [
      "CheckConstraint uses a Q object as the condition.",
      "The constraint is enforced at the database level (not just Django validation)."
    ],
    solution: `from django.db import models

class Product(models.Model):
    name = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=8, decimal_places=2)

    class Meta:
        constraints = [
            models.CheckConstraint(
                check=models.Q(price__gt=0),
                name='price_must_be_positive'
            )
        ]

# Usage
from django.db import IntegrityError

Product.objects.create(name='Valid Widget', price=9.99)  # OK

try:
    Product.objects.create(name='Free Widget', price=0)
except IntegrityError:
    print("Price must be > 0 — rejected by database constraint")`,
    alternativeSolutions: [
      `# Using clean() for application-level validation (not DB-level)\nclass Product(models.Model):\n    name = models.CharField(max_length=200)\n    price = models.DecimalField(max_digits=8, decimal_places=2)\n\n    def clean(self):\n        from django.core.exceptions import ValidationError\n        if self.price is not None and self.price <= 0:\n            raise ValidationError("Price must be greater than zero.")`
    ],
    explanation: "CheckConstraint uses a Q object to define the validation rule at the database level. Django translates it to CHECK (price > 0) in the CREATE TABLE statement. Unlike clean() which is only called by forms and ModelForm.is_valid(), CheckConstraint is enforced by the database on every INSERT and UPDATE.",
    tags: ["CheckConstraint", "Q", "constraints", "model", "validation", "intermediate"]
  },
  {
    id: "ex-192",
    title: "Custom QuerySet Promoted to Manager",
    difficulty: "advanced",
    topic: "models",
    category: "models",
    description: "Create a custom QuerySet class with business-logic methods and promote it to a Manager using as_manager().",
    schema: `from django.db import models

class ArticleQuerySet(models.QuerySet):
    def published(self):
        return self.filter(is_published=True)

    def by_author(self, author_name):
        return self.filter(author__icontains=author_name)

    def recent(self, days=7):
        from django.utils import timezone
        from datetime import timedelta
        cutoff = timezone.now() - timedelta(days=days)
        return self.filter(created_at__gte=cutoff)

class Article(models.Model):
    title = models.CharField(max_length=200)
    author = models.CharField(max_length=100)
    is_published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = ArticleQuerySet.as_manager()`,
    sampleData: `Article.objects.create(title='Draft', author='Alice', is_published=False)
Article.objects.create(title='Live Post', author='Bob', is_published=True)`,
    problemStatement: "Define ArticleQuerySet with published(), by_author(), and recent() methods. Promote it as the default manager.",
    expectedResult: "Chainable: Article.objects.published().recent().by_author('Bob').",
    hints: [
      "QuerySet.as_manager() creates a Manager that proxies QuerySet methods.",
      "Methods on the QuerySet are chainable with each other and with built-in filter/order_by."
    ],
    solution: `from django.db import models
from django.utils import timezone
from datetime import timedelta

class ArticleQuerySet(models.QuerySet):
    def published(self):
        return self.filter(is_published=True)

    def by_author(self, author_name):
        return self.filter(author__icontains=author_name)

    def recent(self, days=7):
        cutoff = timezone.now() - timedelta(days=days)
        return self.filter(created_at__gte=cutoff)

class Article(models.Model):
    title = models.CharField(max_length=200)
    author = models.CharField(max_length=100)
    is_published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    # Promote QuerySet to Manager — all methods become chainable
    objects = ArticleQuerySet.as_manager()

# Usage — all of these are valid chains
Article.objects.published()
Article.objects.published().recent()
Article.objects.published().recent(days=30).by_author('Alice')
Article.objects.by_author('Bob').order_by('-created_at')[:10]`,
    alternativeSolutions: [
      `# Alternative: explicit Manager + QuerySet\nclass ArticleManager(models.Manager):\n    def get_queryset(self):\n        return ArticleQuerySet(self.model, using=self._db)\n\n    def published(self):\n        return self.get_queryset().published()\n\nclass Article(models.Model):\n    objects = ArticleManager()`
    ],
    explanation: "QuerySet.as_manager() creates a Manager that exposes all custom QuerySet methods directly on the Manager, and those methods remain chainable because they return QuerySet instances. This is the modern, idiomatic approach — cleaner than writing separate Manager and QuerySet classes. Methods must return self.filter(...) (a QuerySet) to remain chainable.",
    tags: ["QuerySet", "Manager", "as_manager", "chainable", "advanced", "model"]
  },
  {
    id: "ex-193",
    title: "Model.clean(): Cross-Field Validation",
    difficulty: "advanced",
    topic: "models",
    category: "models",
    description: "Override Model.clean() to validate that end_date is always after start_date.",
    schema: `from django.db import models
from django.core.exceptions import ValidationError

class Event(models.Model):
    title = models.CharField(max_length=200)
    start_date = models.DateField()
    end_date = models.DateField()
    location = models.CharField(max_length=200)

    def clean(self):
        if self.end_date and self.start_date:
            if self.end_date < self.start_date:
                raise ValidationError({
                    'end_date': 'End date must be on or after start date.'
                })`,
    sampleData: `from datetime import date
Event.objects.create(title='Conference', start_date=date(2024,3,1), end_date=date(2024,3,3), location='NYC')`,
    problemStatement: "Implement clean() on Event to raise ValidationError if end_date < start_date.",
    expectedResult: "ValidationError raised with a message on the end_date field.",
    hints: [
      "clean() is called by ModelForm.is_valid() and full_clean().",
      "Raise ValidationError with a dict to associate error with a specific field."
    ],
    solution: `from django.db import models
from django.core.exceptions import ValidationError

class Event(models.Model):
    title = models.CharField(max_length=200)
    start_date = models.DateField()
    end_date = models.DateField()
    location = models.CharField(max_length=200)

    def clean(self):
        """Cross-field validation: end_date must be >= start_date."""
        if self.start_date and self.end_date:
            if self.end_date < self.start_date:
                raise ValidationError({
                    'end_date': ValidationError(
                        'End date (%(end)s) must be on or after start date (%(start)s).',
                        code='invalid_date_range',
                        params={'end': self.end_date, 'start': self.start_date}
                    )
                })

    def save(self, *args, **kwargs):
        # Call clean() before saving for model-level validation
        self.full_clean()
        super().save(*args, **kwargs)`,
    alternativeSolutions: [
      `# Only via form — clean() on the form level\nclass EventForm(forms.ModelForm):\n    class Meta:\n        model = Event\n        fields = '__all__'\n\n    def clean(self):\n        data = super().clean()\n        if data.get('end_date') < data.get('start_date'):\n            raise forms.ValidationError('End date must be after start date.')\n        return data`
    ],
    explanation: "Model.clean() is the hook for cross-field validation. It is automatically called by ModelForm.is_valid() but NOT by Model.save() — you must call self.full_clean() in save() to enforce it at the model level. Passing a dict to ValidationError associates errors with specific fields for form rendering. Using params in ValidationError enables translated error messages.",
    tags: ["clean", "ValidationError", "cross-field", "model", "validation", "advanced"]
  },
  {
    id: "ex-194",
    title: "Proxy Model with Different Default Ordering",
    difficulty: "advanced",
    topic: "models",
    category: "models",
    description: "Create a proxy model that reuses the parent's table but with different default ordering and a custom manager.",
    schema: `from django.db import models

class Article(models.Model):
    title = models.CharField(max_length=200)
    author = models.CharField(max_length=100)
    views = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']  # Default: newest first

class PopularArticle(Article):
    """Proxy model showing articles ordered by view count."""
    class Meta:
        proxy = True
        ordering = ['-views']  # Override: most viewed first`,
    sampleData: `Article.objects.create(title='Viral Post', author='Alice', views=10000)
Article.objects.create(title='New Post', author='Bob', views=50)`,
    problemStatement: "Define PopularArticle as a proxy of Article with ordering by -views instead of -created_at.",
    expectedResult: "PopularArticle.objects.all() returns articles most-viewed-first. Same database table.",
    hints: [
      "proxy = True in Meta makes Django use the parent's table.",
      "You can add methods and managers without a new table."
    ],
    solution: `from django.db import models

class Article(models.Model):
    title = models.CharField(max_length=200)
    author = models.CharField(max_length=100)
    views = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

class PopularArticle(Article):
    """
    Proxy model — same table as Article, different default ordering.
    Can add methods and managers without schema changes.
    """
    class Meta:
        proxy = True
        ordering = ['-views']  # Most viewed first

    def popularity_tier(self):
        if self.views > 5000:
            return 'viral'
        elif self.views > 1000:
            return 'popular'
        return 'normal'

# Usage
Article.objects.all()         # Newest first
PopularArticle.objects.all()  # Most viewed first — same DB table
# All Article instances are accessible via PopularArticle.objects too`,
    alternativeSolutions: [
      `# Adding a custom manager to the proxy\nclass TrendingManager(models.Manager):\n    def get_queryset(self):\n        return super().get_queryset().filter(views__gt=1000)\n\nclass TrendingArticle(Article):\n    objects = TrendingManager()\n    class Meta:\n        proxy = True\n        ordering = ['-views']`
    ],
    explanation: "Proxy models share the same database table as their parent. They can override Meta (ordering, verbose_name), add Python methods, and define custom managers — but cannot add new database fields. They are useful for presenting the same data with different default behavior, such as different ordering or filtered managers for different parts of an application.",
    tags: ["proxy-model", "ordering", "Meta", "model", "advanced"]
  },
  {
    id: "ex-195",
    title: "Multi-Table Inheritance: Child Model Query",
    difficulty: "advanced",
    topic: "models",
    category: "models",
    description: "Define a multi-table inheritance hierarchy and query both parent and child models.",
    schema: `from django.db import models

class Animal(models.Model):
    name = models.CharField(max_length=100)
    sound = models.CharField(max_length=50)
    weight_kg = models.FloatField()

class Dog(Animal):
    breed = models.CharField(max_length=100)
    is_trained = models.BooleanField(default=False)`,
    sampleData: `Dog.objects.create(name='Rex', sound='Woof', weight_kg=25.0, breed='Labrador', is_trained=True)
Dog.objects.create(name='Buddy', sound='Bark', weight_kg=18.0, breed='Beagle', is_trained=False)`,
    problemStatement: "Query Dog model objects and access both parent Animal fields and child Dog fields.",
    expectedResult: "Dog objects with .name (from Animal) and .breed (from Dog) accessible.",
    hints: [
      "Dog.objects.all() returns Dog instances with both parent and child fields.",
      "Multi-table inheritance creates two tables joined by a OneToOneField."
    ],
    solution: `from django.db import models

class Animal(models.Model):
    name = models.CharField(max_length=100)
    sound = models.CharField(max_length=50)
    weight_kg = models.FloatField()

    def __str__(self):
        return self.name

class Dog(Animal):
    # Implicitly has: animal_ptr = OneToOneField(Animal, parent_link=True)
    breed = models.CharField(max_length=100)
    is_trained = models.BooleanField(default=False)

    class Meta:
        verbose_name = 'Dog'

# Querying
all_dogs = Dog.objects.all()
trained_dogs = Dog.objects.filter(is_trained=True)
heavy_dogs = Dog.objects.filter(weight_kg__gt=20)  # From parent!

for dog in Dog.objects.select_related('animal_ptr'):
    print(f"{dog.name} ({dog.breed}): {dog.sound}, trained={dog.is_trained}")

# Access parent table directly
all_animals = Animal.objects.all()
# Animal.objects includes Dogs too — dog appears as Animal instance
# Access child: animal_instance.dog (raises RelatedObjectDoesNotExist if not a Dog)`,
    alternativeSolutions: [
      `# Prefer composition over multi-table inheritance in most cases\n# MTI has JOIN cost on every query — consider using\n# a single table with a 'type' field or abstract inheritance instead`
    ],
    explanation: "Multi-table inheritance (no proxy = True, no abstract = True) creates a separate Dog table linked to Animal via an implicit OneToOneField (animal_ptr). Dog.objects.all() JOINs both tables automatically. Parent fields (name, weight_kg) are accessible on Dog instances. This is more expensive than abstract inheritance but allows polymorphic queries on the parent.",
    tags: ["multi-table-inheritance", "model", "FK", "join", "advanced"]
  },
  // ============================================================
  // COMPLEX CHAINS (ex-196 to ex-205)
  // ============================================================
  {
    id: "ex-196",
    title: "Chain: annotate + filter + order_by + values()",
    difficulty: "advanced",
    topic: "complex chains",
    category: "queries",
    description: "Combine annotate, filter, order_by, and values() in a single queryset chain to produce a report.",
    schema: `from django.db import models

class Category(models.Model):
    name = models.CharField(max_length=100)

class Product(models.Model):
    name = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='products')`,
    sampleData: `tech = Category.objects.create(name='Tech')
books = Category.objects.create(name='Books')
Product.objects.create(name='Laptop', price=999, category=tech)
Product.objects.create(name='Phone', price=699, category=tech)
Product.objects.create(name='Novel', price=15, category=books)`,
    problemStatement: "Get a report: category name, product count, avg price — for categories with > 1 product — ordered by avg_price descending.",
    expectedResult: "Tech: 2 products, avg $849. Books excluded (only 1 product).",
    hints: [
      "Annotate Category with Count and Avg, filter on count, then values().",
      "values() after annotate selects which fields appear in the result dicts."
    ],
    solution: `from django.db.models import Count, Avg

report = (
    Category.objects
    .annotate(
        product_count=Count('products'),
        avg_price=Avg('products__price')
    )
    .filter(product_count__gt=1)
    .order_by('-avg_price')
    .values('name', 'product_count', 'avg_price')
)

for row in report:
    print(f"{row['name']}: {row['product_count']} products, avg \${ round(row['avg_price'], 2) }")`,
    alternativeSolutions: [
      `from django.db.models import Count, Avg\nreport = Category.objects.annotate(\n    product_count=Count('products', distinct=True),\n    avg_price=Avg('products__price')\n).filter(product_count__gt=1).order_by('-avg_price')\n\nfor cat in report:\n    print(f"{cat.name}: {cat.product_count} products")`
    ],
    explanation: "The chain: annotate() → filter() → order_by() → values() is a common report-generation pattern. Django compiles this into a single SQL query with GROUP BY, HAVING, and ORDER BY. values() at the end returns dicts and limits the SELECT to specified columns. The queryset is evaluated lazily — only executed when iterated.",
    tags: ["annotate", "filter", "order_by", "values", "chain", "advanced"]
  },
  {
    id: "ex-197",
    title: "Multiple Annotations on One QuerySet",
    difficulty: "advanced",
    topic: "complex chains",
    category: "queries",
    description: "Add multiple independent annotations to a single queryset for a comprehensive product report.",
    schema: `from django.db import models

class Product(models.Model):
    name = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=8, decimal_places=2)

class Review(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    rating = models.IntegerField()

class OrderItem(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='order_items')
    quantity = models.IntegerField(default=1)`,
    sampleData: `p = Product.objects.create(name='Widget', price=25.00)
Review.objects.create(product=p, rating=5)
Review.objects.create(product=p, rating=4)
OrderItem.objects.create(product=p, quantity=10)
OrderItem.objects.create(product=p, quantity=5)`,
    problemStatement: "Annotate each product with review_count, avg_rating, and total_units_sold in one queryset.",
    expectedResult: "Widget: 2 reviews, avg 4.5, 15 total units sold.",
    hints: [
      "Multiple annotate() calls are safe but be careful about JOIN multiplication.",
      "Use distinct=True on Counts to avoid duplicates from multiple JOINs."
    ],
    solution: `from django.db.models import Count, Avg, Sum

products = Product.objects.annotate(
    review_count=Count('reviews', distinct=True),
    avg_rating=Avg('reviews__rating'),
    total_units_sold=Sum('order_items__quantity')
).order_by('-total_units_sold')

for p in products:
    print(
        f"{p.name}: "
        f"{p.review_count} reviews, "
        f"avg {p.avg_rating or 0:.1f}, "
        f"{p.total_units_sold or 0} units sold"
    )`,
    alternativeSolutions: [
      `# Chained annotate calls\nfrom django.db.models import Count, Avg, Sum\nproducts = Product.objects.annotate(\n    review_count=Count('reviews', distinct=True)\n).annotate(\n    avg_rating=Avg('reviews__rating')\n).annotate(\n    total_units_sold=Sum('order_items__quantity')\n)`
    ],
    explanation: "Multiple annotations on the same queryset can cause JOIN multiplication when traversing different FK relationships (reviews and order_items). Using distinct=True on Count prevents duplicate counting. Sum may still be inflated by cross-join multiplication — in such cases, using Subquery for each annotation is safer (though more verbose).",
    tags: ["annotate", "Count", "Avg", "Sum", "multiple", "advanced"]
  },
  {
    id: "ex-198",
    title: "ExpressionWrapper for Arithmetic Annotation",
    difficulty: "advanced",
    topic: "complex chains",
    category: "queries",
    description: "Use ExpressionWrapper to annotate products with margin percentage computed from price and cost.",
    schema: `from django.db import models

class Product(models.Model):
    name = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    cost = models.DecimalField(max_digits=8, decimal_places=2)`,
    sampleData: `Product.objects.create(name='Widget A', price=100.00, cost=60.00)
Product.objects.create(name='Widget B', price=50.00, cost=45.00)`,
    problemStatement: "Annotate each product with margin_pct = (price - cost) / price * 100 using ExpressionWrapper.",
    expectedResult: "Widget A: 40.00%, Widget B: 10.00%.",
    hints: [
      "ExpressionWrapper wraps the arithmetic expression and specifies output_field.",
      "Use FloatField() or DecimalField() as output_field for division."
    ],
    solution: `from django.db.models import F, ExpressionWrapper, FloatField

products = Product.objects.annotate(
    margin_pct=ExpressionWrapper(
        (F('price') - F('cost')) / F('price') * 100,
        output_field=FloatField()
    )
).order_by('-margin_pct')

for p in products:
    print(f"{p.name}: margin = {p.margin_pct:.1f}%")`,
    alternativeSolutions: [
      `from django.db.models import F, ExpressionWrapper, DecimalField\nfrom decimal import Decimal\nproducts = Product.objects.annotate(\n    profit=ExpressionWrapper(F('price') - F('cost'), output_field=DecimalField()),\n    margin_pct=ExpressionWrapper(\n        (F('price') - F('cost')) * Decimal('100') / F('price'),\n        output_field=DecimalField()\n    )\n)`
    ],
    explanation: "ExpressionWrapper is required when Django cannot determine the output type of an arithmetic expression. FloatField() output allows division to produce decimal results. DecimalField() maintains precision for financial calculations. The expression (price - cost) / price * 100 computes gross margin percentage at the database level.",
    tags: ["ExpressionWrapper", "F", "annotate", "arithmetic", "margin", "advanced"]
  },
  {
    id: "ex-199",
    title: "Coalesce: Replace NULL with Default in Annotation",
    difficulty: "advanced",
    topic: "complex chains",
    category: "queries",
    description: "Use Coalesce to replace null annotation values with a default (e.g., 0) for cleaner output.",
    schema: `from django.db import models

class Author(models.Model):
    name = models.CharField(max_length=100)

class Book(models.Model):
    title = models.CharField(max_length=200)
    author = models.ForeignKey(Author, on_delete=models.CASCADE, related_name='books')

class Sale(models.Model):
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='sales')
    quantity = models.IntegerField(default=0)`,
    sampleData: `alice = Author.objects.create(name='Alice')
bob = Author.objects.create(name='Bob')
b1 = Book.objects.create(title='Alice Book', author=alice)
Sale.objects.create(book=b1, quantity=100)
# Bob has no books/sales`,
    problemStatement: "Annotate authors with total_sales — use Coalesce so authors with no sales show 0 instead of None.",
    expectedResult: "Alice: 100 total sales, Bob: 0 total sales.",
    hints: [
      "Coalesce(Sum('books__sales__quantity'), 0) returns 0 when Sum returns NULL.",
      "Coalesce takes a list of expressions and returns the first non-NULL one."
    ],
    solution: `from django.db.models import Sum
from django.db.models.functions import Coalesce

authors = Author.objects.annotate(
    total_sales=Coalesce(
        Sum('books__sales__quantity'),
        0  # Default value when no sales exist
    )
).order_by('-total_sales')

for author in authors:
    print(f"{author.name}: {author.total_sales} total sales")`,
    alternativeSolutions: [
      `from django.db.models import Sum, Value, IntegerField\nfrom django.db.models.functions import Coalesce\nauthors = Author.objects.annotate(\n    total_sales=Coalesce(\n        Sum('books__sales__quantity'),\n        Value(0),\n        output_field=IntegerField()\n    )\n)`
    ],
    explanation: "Sum() returns NULL when there are no matching rows (e.g., author has no books or no sales). Coalesce(expr, default) returns the first non-NULL value — so Coalesce(Sum(...), 0) returns 0 instead of None. This makes the annotation safe for arithmetic and display. Value(0) is more explicit than bare 0 in some Django versions.",
    tags: ["Coalesce", "Sum", "annotate", "NULL", "default", "advanced"]
  },
  {
    id: "ex-200",
    title: "Conditional Sum with filter= Kwarg",
    difficulty: "advanced",
    topic: "complex chains",
    category: "queries",
    description: "Use Sum with filter= kwarg to compute separate revenue totals for different order statuses.",
    schema: `from django.db import models

class Customer(models.Model):
    name = models.CharField(max_length=100)

class Order(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='orders')
    total = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20)`,
    sampleData: `c = Customer.objects.create(name='Alice')
Order.objects.create(customer=c, total=100, status='completed')
Order.objects.create(customer=c, total=200, status='completed')
Order.objects.create(customer=c, total=50, status='refunded')`,
    problemStatement: "Per customer: compute completed_revenue (Sum of completed orders) and refunded_amount (Sum of refunded orders) in one query.",
    expectedResult: "Alice: completed_revenue=300, refunded_amount=50.",
    hints: [
      "Sum('orders__total', filter=Q(orders__status='completed')) for conditional sum.",
      "Combine multiple conditional Sums in one annotate() call."
    ],
    solution: `from django.db.models import Sum, Q

customers = Customer.objects.annotate(
    completed_revenue=Sum(
        'orders__total',
        filter=Q(orders__status='completed')
    ),
    refunded_amount=Sum(
        'orders__total',
        filter=Q(orders__status='refunded')
    )
)

for c in customers:
    print(
        f"{c.name}: "
        f"completed=\${c.completed_revenue || 0}, "
        f"refunded=\${c.refunded_amount || 0}"
    )`,
    alternativeSolutions: [
      `from django.db.models import Sum, Case, When, F, DecimalField\n# Older approach using Case/When inside Sum\ncustomers = Customer.objects.annotate(\n    completed_revenue=Sum(\n        Case(When(orders__status='completed', then=F('orders__total')),\n             default=0, output_field=DecimalField())\n    )\n)`
    ],
    explanation: "The filter= kwarg on Sum (Django 2.0+) is the modern, clean way to do conditional aggregation. Django generates SUM(total) FILTER (WHERE status='completed') on PostgreSQL or SUM(CASE WHEN status='completed' THEN total END) on other backends. Multiple conditional Sums in one annotate() produce a single GROUP BY query.",
    tags: ["Sum", "filter-kwarg", "conditional-aggregate", "annotate", "advanced"]
  },
  {
    id: "ex-201",
    title: "DRF: Nested Serializer for Book and Author",
    difficulty: "advanced",
    topic: "DRF serializers",
    category: "production",
    description: "Create a Django REST Framework serializer that nests Author data inside a Book serializer.",
    schema: `from django.db import models

class Author(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField()
    bio = models.TextField(blank=True)

class Book(models.Model):
    title = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    author = models.ForeignKey(Author, on_delete=models.CASCADE, related_name='books')
    published_year = models.IntegerField()`,
    sampleData: `author = Author.objects.create(name='Alice', email='alice@example.com', bio='Django expert')
Book.objects.create(title='Django Guide', price=39.99, author=author, published_year=2023)`,
    problemStatement: "Create AuthorSerializer and BookSerializer where BookSerializer nests AuthorSerializer for the author field.",
    expectedResult: "GET /api/books/ returns books with nested author object containing name and email.",
    hints: [
      "Nest AuthorSerializer as a field in BookSerializer.",
      "Use select_related('author') in the view queryset to avoid N+1."
    ],
    solution: `from rest_framework import serializers

class AuthorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Author
        fields = ['id', 'name', 'email']

class BookSerializer(serializers.ModelSerializer):
    # Nest author — read-only by default
    author = AuthorSerializer(read_only=True)
    # Write operations use author_id FK
    author_id = serializers.PrimaryKeyRelatedField(
        queryset=Author.objects.all(),
        source='author',
        write_only=True
    )

    class Meta:
        model = Book
        fields = ['id', 'title', 'price', 'published_year', 'author', 'author_id']

# In your ViewSet:
# queryset = Book.objects.select_related('author').all()
# serializer_class = BookSerializer`,
    alternativeSolutions: [
      `# Simpler read-only nested serializer\nclass BookSerializer(serializers.ModelSerializer):\n    author = AuthorSerializer(read_only=True)\n    class Meta:\n        model = Book\n        fields = '__all__'`
    ],
    explanation: "Nesting AuthorSerializer as a field provides rich nested output for reads. For writes, a separate author_id PrimaryKeyRelatedField allows clients to specify just an ID. Using source='author' on the write field and read_only=True on the nested serializer handles both read and write correctly. Always use select_related in the view to avoid N+1.",
    tags: ["DRF", "serializer", "nested", "ModelSerializer", "production", "advanced"]
  },
  {
    id: "ex-202",
    title: "Django Cache: Cache a QuerySet for 5 Minutes",
    difficulty: "advanced",
    topic: "caching",
    category: "production",
    description: "Cache the result of an expensive queryset for 5 minutes using Django's cache framework.",
    schema: `from django.db import models

class Product(models.Model):
    name = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    category = models.CharField(max_length=100)
    is_featured = models.BooleanField(default=False)`,
    sampleData: `Product.objects.create(name='Featured Widget', price=29.99, category='tech', is_featured=True)
Product.objects.create(name='Regular Widget', price=9.99, category='misc', is_featured=False)`,
    problemStatement: "Cache the list of featured products for 5 minutes to reduce database hits on the homepage.",
    expectedResult: "First call hits DB; subsequent calls within 5 min return cached list.",
    hints: [
      "cache.get() returns None on cache miss. cache.set(key, value, timeout) sets the cache.",
      "Evaluate queryset to a list before caching — QuerySets are lazy."
    ],
    solution: `from django.core.cache import cache

def get_featured_products():
    """
    Return featured products from cache if available,
    otherwise query DB and cache the result for 5 minutes.
    """
    cache_key = 'featured_products'
    cached = cache.get(cache_key)

    if cached is None:
        # Cache miss — query the database
        products = list(
            Product.objects.filter(is_featured=True)
            .order_by('name')
            .values('id', 'name', 'price')
        )
        # Cache for 5 minutes (300 seconds)
        cache.set(cache_key, products, timeout=300)
        return products

    return cached

# Invalidate cache when products change
def invalidate_featured_cache():
    cache.delete('featured_products')`,
    alternativeSolutions: [
      `# Using cache.get_or_set (Django 1.9+)\ndef get_featured_products():\n    return cache.get_or_set(\n        'featured_products',\n        lambda: list(Product.objects.filter(is_featured=True).values('id', 'name', 'price')),\n        timeout=300\n    )`
    ],
    explanation: "Django's cache.get() returns None on a miss. cache.set(key, value, timeout) stores the value. Converting the QuerySet to a list() evaluates it and makes it serializable for caching. cache.get_or_set() (Django 1.9+) is a convenient one-liner for the get-or-set-and-return pattern. Always provide a way to invalidate the cache when the underlying data changes.",
    tags: ["cache", "cache.get", "cache.set", "performance", "production", "advanced"]
  },
  {
    id: "ex-203",
    title: "DRF: Custom Permission IsOwner",
    difficulty: "advanced",
    topic: "DRF permissions",
    category: "production",
    description: "Implement a custom DRF permission class that only allows the object's owner to modify it.",
    schema: `from django.db import models
from django.contrib.auth.models import User

class Post(models.Model):
    title = models.CharField(max_length=200)
    body = models.TextField()
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts')
    created_at = models.DateTimeField(auto_now_add=True)`,
    sampleData: `# Created via Django auth\nfrom django.contrib.auth.models import User\nalice = User.objects.create_user('alice', password='pass')\nPost.objects.create(title='Alice Post', body='...', author=alice)`,
    problemStatement: "Create an IsOwner permission class: safe methods (GET) are allowed for all; write methods only for the post's author.",
    expectedResult: "GET allowed for anyone. PUT/PATCH/DELETE only for post.author == request.user.",
    hints: [
      "Override has_object_permission(request, view, obj) in BasePermission subclass.",
      "SAFE_METHODS = ('GET', 'HEAD', 'OPTIONS')."
    ],
    solution: `from rest_framework.permissions import BasePermission, SAFE_METHODS

class IsOwnerOrReadOnly(BasePermission):
    """
    Custom permission: read access for any request,
    write access only for the owner of the object.
    """
    message = "You do not have permission to modify this post."

    def has_permission(self, request, view):
        # Allow all authenticated users to view
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        # Read permissions for any request (GET, HEAD, OPTIONS)
        if request.method in SAFE_METHODS:
            return True

        # Write permissions only for the owner
        return obj.author == request.user

# In your ViewSet:
# permission_classes = [IsOwnerOrReadOnly]`,
    alternativeSolutions: [
      `from rest_framework.permissions import BasePermission, SAFE_METHODS\n\nclass IsOwner(BasePermission):\n    """Strict: only owner can view AND modify."""\n    def has_object_permission(self, request, view, obj):\n        return obj.author == request.user`
    ],
    explanation: "DRF permissions have two hooks: has_permission() (view-level) and has_object_permission() (object-level, called for retrieve/update/delete). SAFE_METHODS covers read-only HTTP methods. obj.author == request.user compares the post's owner with the authenticated user. DRF only calls has_object_permission when has_permission returns True.",
    tags: ["DRF", "permissions", "IsOwner", "BasePermission", "production", "advanced"]
  },
  {
    id: "ex-204",
    title: "DRF: Custom PageNumberPagination Class",
    difficulty: "advanced",
    topic: "DRF pagination",
    category: "production",
    description: "Create a custom PageNumberPagination class with a configurable page size and max page size.",
    schema: `from django.db import models

class Product(models.Model):
    name = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    category = models.CharField(max_length=100)`,
    sampleData: `for i in range(50):\n    Product.objects.create(name=f'Product {i}', price=10+i, category='misc')`,
    problemStatement: "Define a StandardPagination class with default page_size=20, max 100, configurable via ?page_size= query param.",
    expectedResult: "GET /api/products/ returns 20 items. GET /api/products/?page_size=50 returns 50. Max is 100.",
    hints: [
      "Subclass PageNumberPagination and set page_size, page_size_query_param, max_page_size.",
      "Set pagination_class = StandardPagination on your ViewSet."
    ],
    solution: `from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

class StandardPagination(PageNumberPagination):
    # Default items per page
    page_size = 20

    # Client can override via ?page_size=N
    page_size_query_param = 'page_size'

    # Maximum allowed page size
    max_page_size = 100

    # Customize the page query param name (default is 'page')
    page_query_param = 'page'

    def get_paginated_response(self, data):
        return Response({
            'count': self.page.paginator.count,
            'total_pages': self.page.paginator.num_pages,
            'next': self.get_next_link(),
            'previous': self.get_previous_link(),
            'results': data
        })

# In settings.py (global default):
# REST_FRAMEWORK = {
#     'DEFAULT_PAGINATION_CLASS': 'myapp.pagination.StandardPagination',
#     'PAGE_SIZE': 20
# }

# Or on a specific ViewSet:
# class ProductViewSet(viewsets.ModelViewSet):
#     pagination_class = StandardPagination`,
    alternativeSolutions: [
      `from rest_framework.pagination import CursorPagination\n\nclass CursorPagination(CursorPagination):\n    """Cursor-based pagination for stable ordering on large datasets."""\n    page_size = 20\n    ordering = '-created_at'  # Must be unique and ordered field`
    ],
    explanation: "Subclassing PageNumberPagination gives full control over pagination behavior. page_size_query_param allows clients to request custom sizes. max_page_size caps it to prevent abuse. Overriding get_paginated_response() lets you customize the JSON envelope structure (adding total_pages, etc.). CursorPagination is better for real-time feeds and very large datasets.",
    tags: ["DRF", "pagination", "PageNumberPagination", "production", "advanced"]
  },
  {
    id: "ex-205",
    title: "Custom Manager with Chainable published().recent() Methods",
    difficulty: "advanced",
    topic: "models",
    category: "production",
    description: "Build a custom QuerySet with chainable business-logic methods and expose it as the model's manager.",
    schema: `from django.db import models
from django.utils import timezone
from datetime import timedelta

class ArticleQuerySet(models.QuerySet):
    def published(self):
        return self.filter(is_published=True)

    def recent(self, days=30):
        cutoff = timezone.now() - timedelta(days=days)
        return self.filter(published_at__gte=cutoff)

    def by_category(self, category):
        return self.filter(category=category)

    def popular(self, min_views=1000):
        return self.filter(views__gte=min_views)

class Article(models.Model):
    title = models.CharField(max_length=200)
    category = models.CharField(max_length=100)
    is_published = models.BooleanField(default=False)
    published_at = models.DateTimeField(null=True, blank=True)
    views = models.IntegerField(default=0)

    objects = ArticleQuerySet.as_manager()`,
    sampleData: `from django.utils import timezone\nfrom datetime import timedelta\nnow = timezone.now()\nArticle.objects.create(title='Recent Popular', category='tech', is_published=True, published_at=now - timedelta(days=5), views=5000)\nArticle.objects.create(title='Old Article', category='tech', is_published=True, published_at=now - timedelta(days=60), views=2000)\nArticle.objects.create(title='Draft', category='tech', is_published=False, views=0)`,
    problemStatement: "Define a chainable QuerySet with published(), recent(), by_category(), popular() methods and use as_manager().",
    expectedResult: "Article.objects.published().recent().popular() returns articles that are live, recent, and have > 1000 views.",
    hints: [
      "Each method returns self.filter(...) — keeping the chain going.",
      "as_manager() makes all QuerySet methods available on Article.objects."
    ],
    solution: `from django.db import models
from django.utils import timezone
from datetime import timedelta

class ArticleQuerySet(models.QuerySet):
    def published(self):
        """Filter to published articles only."""
        return self.filter(is_published=True)

    def recent(self, days=30):
        """Filter to articles published within the last N days."""
        cutoff = timezone.now() - timedelta(days=days)
        return self.filter(published_at__gte=cutoff)

    def by_category(self, category):
        """Filter to a specific category."""
        return self.filter(category=category)

    def popular(self, min_views=1000):
        """Filter to articles with view count above threshold."""
        return self.filter(views__gte=min_views)

class Article(models.Model):
    title = models.CharField(max_length=200)
    category = models.CharField(max_length=100)
    is_published = models.BooleanField(default=False)
    published_at = models.DateTimeField(null=True, blank=True)
    views = models.IntegerField(default=0)

    # All QuerySet methods become chainable on Article.objects
    objects = ArticleQuerySet.as_manager()

# Chainable usage examples:
# Article.objects.published()
# Article.objects.published().recent()
# Article.objects.published().recent(days=7).popular(min_views=500)
# Article.objects.by_category('tech').published().order_by('-views')[:10]
homepage_articles = (
    Article.objects
    .published()
    .recent(days=30)
    .popular(min_views=1000)
    .by_category('tech')
    .order_by('-views')[:5]
)`,
    alternativeSolutions: [
      `# Using a Manager subclass for additional manager-level methods\nclass ArticleManager(models.Manager):\n    def get_queryset(self):\n        return ArticleQuerySet(self.model, using=self._db)\n\n    def trending(self):\n        \"\"\"Convenience method on the manager itself.\"\"\"\n        return self.get_queryset().published().recent(days=7).popular()\n\nclass Article(models.Model):\n    objects = ArticleManager()\n\n# Article.objects.trending()  # Direct manager method`
    ],
    explanation: "Custom QuerySet with as_manager() is the idiomatic Django pattern for encapsulating domain logic in the data layer. Each method returns self.filter(...) — a new QuerySet — enabling infinite chaining with Django's built-in methods (order_by, values, annotate, etc.). The Manager subclass alternative adds manager-level convenience methods that don't return QuerySets (e.g., Article.objects.trending()).",
    tags: ["QuerySet", "Manager", "as_manager", "chainable", "production", "advanced"]
  },
];


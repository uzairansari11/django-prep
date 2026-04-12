export const modelTopics = [
  {
    id: "what-is-a-model",
    title: "What is a Django Model",
    slug: "what-is-a-model",
    category: "models",
    difficulty: "beginner",
    description: "Understand what a Django model is, how it maps to a database table, and why it is the foundation of Django's ORM.",
    content: {
      explanation: "A Django model is a Python class that subclasses django.db.models.Model. Each model class maps to a single database table. Each attribute on the class represents a column in that table. Django uses the model definition to automatically generate SQL CREATE TABLE statements via migrations. The ORM (Object-Relational Mapper) lets you interact with the database using Python objects instead of writing raw SQL.",
      realExample: "In a blog application, you might have a BlogPost model. Each instance of BlogPost corresponds to one row in the blog_post table. The title attribute maps to a VARCHAR column, published_at maps to a DATETIME column, and so on. You never write INSERT INTO blog_post ... directly — you just do BlogPost.objects.create(title='Hello').",
      codeExample: `# myapp/models.py
from django.db import models

class BlogPost(models.Model):
    title = models.CharField(max_length=200)
    body = models.TextField()
    published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

# Django generates this SQL automatically:
# CREATE TABLE myapp_blogpost (
#     id INTEGER PRIMARY KEY AUTOINCREMENT,
#     title VARCHAR(200) NOT NULL,
#     body TEXT NOT NULL,
#     published BOOL NOT NULL,
#     created_at DATETIME NOT NULL
# );

# Creating a record
post = BlogPost.objects.create(title="Hello World", body="My first post")

# Reading records
all_posts = BlogPost.objects.all()
published = BlogPost.objects.filter(published=True)`,
      outputExplanation: "Django auto-creates the table name as appname_modelname (lowercase). It also adds an auto-incrementing 'id' primary key unless you define one yourself. The objects attribute is the default Manager that gives you access to all ORM query methods.",
      commonMistakes: [
        "Forgetting to run makemigrations and migrate after changing model fields — the Python class and the DB schema get out of sync.",
        "Defining a model outside of an installed app — Django won't discover it unless the app is in INSTALLED_APPS.",
        "Mutating model fields directly without saving — e.g. post.title = 'New' without calling post.save() does NOT persist to the database."
      ],
      interviewNotes: [
        "A model class maps 1:1 to a database table. Instances map to rows. Attributes map to columns.",
        "Django uses migrations to translate model changes into DDL (Data Definition Language) SQL statements.",
        "The ORM is database-agnostic — the same model code works with PostgreSQL, MySQL, SQLite, and Oracle.",
        "Models can define business logic via methods, making them the natural place to centralise domain rules."
      ],
      whenToUse: "Always — every piece of persistent data in a Django app should be represented as a model.",
      whenNotToUse: "If you only need temporary in-memory data structures that are never persisted, a plain Python dataclass or namedtuple is more appropriate."
    },
    tags: ["models", "orm", "database", "basics"],
    order: 1,
    estimatedMinutes: 8
  },
  {
    id: "primary-key",
    title: "Primary Keys",
    slug: "primary-key",
    category: "models",
    difficulty: "beginner",
    description: "How Django handles primary keys, the auto-generated 'id' field, and how to define a custom primary key.",
    content: {
      explanation: "Every Django model must have exactly one field designated as the primary key. If you do not define one, Django automatically adds an AutoField named 'id'. You can override this globally with DEFAULT_AUTO_FIELD in settings.py (e.g. BigAutoField) or per-model by setting primary_key=True on any field.",
      realExample: "An e-commerce product catalogue often uses a UUID as the primary key instead of an auto-incrementing integer to avoid exposing sequential IDs to end users and to support distributed systems where multiple services insert records.",
      codeExample: `import uuid
from django.db import models

# Default: Django auto-adds 'id = models.AutoField(primary_key=True)'
class Category(models.Model):
    name = models.CharField(max_length=100)
    # id is added automatically

# Custom integer PK
class Product(models.Model):
    sku = models.IntegerField(primary_key=True)
    name = models.CharField(max_length=200)

# UUID primary key — common in production APIs
class Order(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    total = models.DecimalField(max_digits=10, decimal_places=2)

# settings.py — change default globally
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Accessing the pk
order = Order.objects.first()
print(order.pk)   # Works regardless of the actual field name
print(order.id)   # Same thing for UUID model`,
      outputExplanation: "order.pk is always an alias for whatever field has primary_key=True. This is important for generic code that doesn't know the actual PK field name. BigAutoField uses a 64-bit integer and is recommended for large datasets.",
      commonMistakes: [
        "Using AutoField (32-bit) for tables expected to grow very large — switch to BigAutoField.",
        "Setting primary_key=True on a non-unique field — Django will raise an error at migration time.",
        "Forgetting editable=False on a UUID pk, which causes it to appear in admin forms and potentially be overwritten."
      ],
      interviewNotes: [
        "Django's .pk attribute always resolves to the primary key regardless of field name.",
        "UUIDs are not sequential, which improves security but can degrade index performance on large tables.",
        "You can set DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField' in settings.py to avoid overflows on large tables.",
        "A composite primary key is not natively supported in Django ORM (as of Django 5.x composite PKs are in progress) — use unique_together or UniqueConstraint as a workaround."
      ],
      whenToUse: "Use a custom UUID primary key when building APIs where sequential IDs would expose business data or when operating in distributed environments. Use BigAutoField for most standard tables.",
      whenNotToUse: "Avoid UUID PKs when the table will be joined frequently and query performance is critical — sequential integer keys perform better for B-tree indexes."
    },
    tags: ["primary-key", "uuid", "autofield", "models"],
    order: 2,
    estimatedMinutes: 8
  },
  {
    id: "common-fields",
    title: "Common Field Types",
    slug: "common-fields",
    category: "models",
    difficulty: "beginner",
    description: "A comprehensive reference of Django's built-in field types: CharField, IntegerField, FloatField, DecimalField, BooleanField, TextField, EmailField, URLField, SlugField, UUIDField, JSONField, FileField, ImageField, DateField, DateTimeField, TimeField, and numeric variants.",
    content: {
      explanation: "Django provides a rich library of field types, each mapping to a specific SQL column type and providing Python-level validation. Choosing the right field type is critical for data integrity, query performance, and form validation.",
      realExample: "In a real e-commerce system: price uses DecimalField (never FloatField for money), product_slug uses SlugField for URL-friendly identifiers, description uses TextField for unlimited text, thumbnail uses ImageField, metadata uses JSONField, and created_at uses DateTimeField.",
      codeExample: `from django.db import models
import uuid

class Product(models.Model):
    # Text fields
    name = models.CharField(max_length=200)          # VARCHAR
    slug = models.SlugField(unique=True)              # VARCHAR, URL-safe
    description = models.TextField()                  # TEXT, unlimited
    email = models.EmailField()                       # VARCHAR with email validation
    website = models.URLField(blank=True)             # VARCHAR with URL validation

    # Numeric fields
    price = models.DecimalField(max_digits=10, decimal_places=2)  # DECIMAL — use for money
    rating = models.FloatField(default=0.0)           # FLOAT — imprecise, ok for scores
    stock = models.IntegerField(default=0)            # INTEGER
    views = models.PositiveIntegerField(default=0)    # INTEGER, enforces >= 0
    small_val = models.SmallIntegerField(default=0)   # SMALLINT
    big_val = models.BigIntegerField(default=0)       # BIGINT
    pos_small = models.PositiveSmallIntegerField(default=0)

    # Boolean
    is_active = models.BooleanField(default=True)     # BOOLEAN

    # Unique identifier
    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

    # Dates and times
    launch_date = models.DateField()                  # DATE
    created_at = models.DateTimeField(auto_now_add=True)  # DATETIME
    updated_at = models.DateTimeField(auto_now=True)
    sale_starts = models.TimeField(null=True, blank=True)  # TIME

    # Files
    image = models.ImageField(upload_to='products/')  # requires Pillow
    spec_sheet = models.FileField(upload_to='specs/', blank=True)

    # Flexible data
    metadata = models.JSONField(default=dict)         # JSON (PostgreSQL/MySQL 5.7+/SQLite 3.38+)

    def __str__(self):
        return self.name`,
      outputExplanation: "Each field type enforces constraints at both the Python (form validation / full_clean) and database level. DecimalField stores exact decimal numbers in SQL DECIMAL type — critical for financial data. FloatField uses IEEE 754 floating point and should never be used for money.",
      commonMistakes: [
        "Using FloatField for monetary values — always use DecimalField for money to avoid floating-point rounding errors (0.1 + 0.2 != 0.3).",
        "Using CharField without max_length — it's required and maps to VARCHAR(n).",
        "Using ImageField without installing Pillow — Django will raise an error on startup.",
        "Using JSONField with SQLite older than 3.38 — it silently stores as text without native JSON support."
      ],
      interviewNotes: [
        "DecimalField vs FloatField: DecimalField is stored as SQL DECIMAL (exact), FloatField as SQL REAL/FLOAT (approximate). Always use DecimalField for money.",
        "SlugField is just a CharField with a slug validator and max_length=50 default.",
        "JSONField was added in Django 3.1 and works natively with PostgreSQL, MySQL 5.7+, MariaDB 10.2+, and SQLite 3.38+.",
        "PositiveIntegerField enforces >= 0 at the application level but the DB constraint depends on the backend.",
        "FileField and ImageField store file paths in the DB, not the file contents themselves."
      ],
      whenToUse: "Choose the most specific field type that matches your data. This gives you free validation, better query semantics, and appropriate DB column types.",
      whenNotToUse: "Avoid JSONField for structured data that you need to query or index frequently — break it into proper model fields instead."
    },
    tags: ["fields", "charfield", "integerfield", "decimalfield", "jsonfield", "models"],
    order: 3,
    estimatedMinutes: 15
  },
  {
    id: "null-vs-blank",
    title: "null=True vs blank=True",
    slug: "null-vs-blank",
    category: "models",
    difficulty: "beginner",
    description: "The critical difference between null=True (database level) and blank=True (form/validation level), and when to use each combination.",
    content: {
      explanation: "null=True tells Django to store NULL in the database column when no value is provided. blank=True tells Django's form validation (and serializer validation) to allow an empty value. These are completely independent settings operating at different layers. Most beginners confuse them and use null=True alone, which causes inconsistent empty values (NULL vs empty string) in the database.",
      realExample: "A user's middle name is optional. For a CharField, the correct setting is blank=True only — this stores an empty string '' when not provided, which is consistent. Adding null=True as well means the DB can store either NULL or '' representing the same 'no value' concept, causing bugs in queries like filter(middle_name='') missing the NULL rows.",
      codeExample: `from django.db import models

class UserProfile(models.Model):
    # Required field — neither null nor blank
    username = models.CharField(max_length=100)

    # Optional text — blank=True only (stores empty string, NOT NULL)
    middle_name = models.CharField(max_length=50, blank=True)
    bio = models.TextField(blank=True)

    # Optional non-string field — null=True AND blank=True
    # (empty string is not valid for DateField, so we need null=True)
    date_of_birth = models.DateField(null=True, blank=True)
    last_login_ip = models.GenericIPAddressField(null=True, blank=True)
    score = models.FloatField(null=True, blank=True)

    # ForeignKey — null=True means optional relationship
    referred_by = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='referrals'
    )

    # BAD PATTERN — two representations of "no value"
    # bad_field = models.CharField(max_length=100, null=True, blank=True)
    # This allows BOTH null and '' which creates query inconsistency

class Article(models.Model):
    title = models.CharField(max_length=200)
    # null=True on CharField is almost always wrong
    subtitle = models.CharField(max_length=200, blank=True)  # correct
    published_at = models.DateTimeField(null=True, blank=True)  # correct for optional datetime`,
      outputExplanation: "The rule: for string-based fields (CharField, TextField, EmailField, etc.) use blank=True only. For non-string fields (DateField, IntegerField, ForeignKey, etc.) that need to be optional, use both null=True and blank=True.",
      commonMistakes: [
        "Adding null=True to CharField/TextField — creates two possible empty values (NULL and '') making queries like filter(field='') miss NULL rows.",
        "Using null=True without blank=True — the database allows NULL but Django forms/serializers will still reject an empty value, creating a mismatch.",
        "Forgetting blank=True on optional ForeignKey fields — the DB allows NULL but Django admin and DRF will require the field."
      ],
      interviewNotes: [
        "null is a database constraint, blank is a Django validation constraint — they operate at different layers.",
        "For string fields: use blank=True only. For non-string optional fields: use null=True, blank=True together.",
        "A ForeignKey with null=True means the relationship is optional (the row exists but points to nothing).",
        "Django admin and DRF ModelSerializer both respect blank=True for form/serializer validation.",
        "isnull lookup: filter(field__isnull=True) finds NULL values; filter(field='') finds empty strings. With null=True on CharField both queries return different rows."
      ],
      whenToUse: "blank=True alone for optional string fields. Both null=True and blank=True for optional non-string fields and optional foreign keys.",
      whenNotToUse: "Never add null=True to CharField or TextField in isolation — it creates ambiguity between NULL and empty string."
    },
    tags: ["null", "blank", "validation", "fields", "models"],
    order: 4,
    estimatedMinutes: 10
  },
  {
    id: "field-options",
    title: "Field Options",
    slug: "field-options",
    category: "models",
    difficulty: "beginner",
    description: "Common field keyword arguments: default, unique, db_index, editable, serialize, verbose_name, help_text, and choices.",
    content: {
      explanation: "Every Django field accepts a set of common keyword arguments that control database behaviour, form presentation, admin display, and serialization. Understanding these options lets you build robust models without writing custom validation or SQL.",
      realExample: "In a product model, price might have default=0.00 and db_index=True for fast filtering. The status field might have choices=Status.choices, verbose_name='Product Status', and help_text='Whether the product is live on the store.'",
      codeExample: `from django.db import models

class Product(models.Model):
    class Status(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        PUBLISHED = 'published', 'Published'
        ARCHIVED = 'archived', 'Archived'

    # verbose_name — human-readable name in admin and forms
    name = models.CharField(
        max_length=200,
        verbose_name='Product Name',
        help_text='The full display name of the product.'
    )

    # unique — adds a UNIQUE constraint at the DB level
    sku = models.CharField(max_length=50, unique=True)

    # default — used when no value is provided
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    is_active = models.BooleanField(default=True)
    stock = models.IntegerField(default=0)

    # db_index — creates a B-tree index for faster lookups
    category_code = models.CharField(max_length=10, db_index=True)

    # choices — restricts values and provides display labels
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
        verbose_name='Status',
        help_text='Controls visibility on the store.'
    )

    # editable=False — hides from admin and ModelForm
    internal_code = models.CharField(max_length=100, editable=False, default='')

    # serialize=False — excludes from Django's serialization framework
    cache_key = models.CharField(max_length=200, serialize=False, editable=False, default='')

    def __str__(self):
        return f"{self.name} ({self.get_status_display()})"`,
      outputExplanation: "get_status_display() is auto-generated for any field with choices — it returns the human-readable label. db_index=True creates an index but unique=True also implies an index, so don't set both. editable=False removes the field from all auto-generated forms.",
      commonMistakes: [
        "Setting both unique=True and db_index=True — unique already creates an index, db_index is redundant.",
        "Using default=[] or default={} for list/dict fields — mutable defaults are shared across all instances. Use default=list or default=dict instead.",
        "Forgetting that editable=False still allows programmatic assignment — it only hides the field from forms."
      ],
      interviewNotes: [
        "unique=True adds a UNIQUE constraint at the DB level AND creates an index.",
        "db_index=True only creates an index, no uniqueness constraint.",
        "default can be a callable (e.g. default=timezone.now) — it is called each time a new instance is created.",
        "verbose_name defaults to the field name with underscores replaced by spaces.",
        "help_text renders in Django admin below the field input.",
        "serialize=False excludes the field from django.core.serializers output (used in dumpdata/loaddata)."
      ],
      whenToUse: "Add db_index=True to fields you filter or order by frequently. Add unique=True for natural identifiers. Always provide verbose_name and help_text for complex fields to improve admin usability.",
      whenNotToUse: "Do not index every field — indexes slow down writes and consume storage. Only index fields used in WHERE, ORDER BY, or JOIN clauses."
    },
    tags: ["field-options", "default", "unique", "db_index", "choices", "models"],
    order: 5,
    estimatedMinutes: 10
  },
  {
    id: "choices-field",
    title: "Choices and Enums",
    slug: "choices-field",
    category: "models",
    difficulty: "beginner",
    description: "Using choices parameter, TextChoices, IntegerChoices, and enum-like patterns to restrict field values.",
    content: {
      explanation: "The choices parameter restricts a field to a predefined set of values at the form/serializer validation level (not the database level unless you add a CheckConstraint). Django 3.0+ introduced TextChoices and IntegerChoices, which are enum subclasses providing cleaner syntax, auto-generated labels, and IDE autocompletion.",
      realExample: "An order status field with choices ensures users can only set PENDING, PROCESSING, SHIPPED, or DELIVERED. Without choices, any string could be stored, leading to data inconsistency like 'shipped', 'Shipped', 'SHIPPED' all meaning the same thing.",
      codeExample: `from django.db import models

# Modern approach — TextChoices (Django 3.0+)
class Order(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        PROCESSING = 'processing', 'Processing'
        SHIPPED = 'shipped', 'Shipped'
        DELIVERED = 'delivered', 'Delivered'
        CANCELLED = 'cancelled', 'Cancelled'

    class Priority(models.IntegerChoices):
        LOW = 1, 'Low'
        MEDIUM = 2, 'Medium'
        HIGH = 3, 'High'
        CRITICAL = 4, 'Critical'

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )
    priority = models.IntegerField(
        choices=Priority.choices,
        default=Priority.MEDIUM
    )

    def __str__(self):
        return f"Order #{self.pk} — {self.get_status_display()}"

# Usage
order = Order(status=Order.Status.SHIPPED, priority=Order.Priority.HIGH)
print(order.status)              # 'shipped'
print(order.get_status_display())  # 'Shipped'
print(order.priority)            # 3
print(order.get_priority_display())  # 'High'

# Filtering using enum values
shipped_orders = Order.objects.filter(status=Order.Status.SHIPPED)
high_priority = Order.objects.filter(priority__gte=Order.Priority.HIGH)

# Old-style choices (still valid, but less readable)
STATUS_CHOICES = [
    ('draft', 'Draft'),
    ('published', 'Published'),
]

# Checking membership
print(Order.Status.SHIPPED in Order.Status)  # True
print(Order.Status.values)  # ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
print(Order.Status.labels)  # ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled']`,
      outputExplanation: "TextChoices stores the first value (e.g. 'shipped') in the database. get_status_display() returns the human label. The enum class itself (Order.Status.SHIPPED) can be used in filter() calls — Django knows to use the database value.",
      commonMistakes: [
        "Assuming choices enforces the constraint at the database level — it only validates at the form/serializer level. Use CheckConstraint for DB-level enforcement.",
        "Hardcoding string values in filter() calls (filter(status='shipped')) instead of using the enum (filter(status=Order.Status.SHIPPED)) — the enum approach is refactor-safe.",
        "Making choice values too long — they are stored verbatim in every row, wasting storage. Keep values short."
      ],
      interviewNotes: [
        "choices validation happens in full_clean() — direct .save() calls bypass it unless you explicitly call full_clean().",
        "TextChoices/IntegerChoices are proper Python Enum subclasses — you get .name, .value, .label attributes.",
        "get_FOO_display() is auto-generated for any field with choices defined.",
        "To enforce choices at the DB level, add a CheckConstraint in Meta.constraints.",
        "Order.Status.choices returns [(value, label), ...] compatible with the choices parameter."
      ],
      whenToUse: "Any field that should be restricted to a known set of values — statuses, priorities, categories, types. Always prefer TextChoices/IntegerChoices over raw tuples for new code.",
      whenNotToUse: "If the set of valid values changes frequently or is user-configurable, store choices in a separate table (a Category model) instead of hardcoded choices."
    },
    tags: ["choices", "textchoices", "integerchoices", "enum", "models"],
    order: 6,
    estimatedMinutes: 10
  },
  {
    id: "validators",
    title: "Validators",
    slug: "validators",
    category: "models",
    difficulty: "intermediate",
    description: "Built-in Django validators and how to write custom validators to enforce field-level constraints at the Python layer.",
    content: {
      explanation: "Validators are callables that receive a field value and raise ValidationError if the value is invalid. They run during model.full_clean() and form/serializer validation. Django provides many built-in validators, and you can write custom ones as simple functions or classes.",
      realExample: "A discount percentage field needs to be between 0 and 100. A username field should only contain alphanumeric characters and underscores. A phone number field needs to match a specific regex pattern. These constraints are best expressed as validators.",
      codeExample: `from django.db import models
from django.core.validators import (
    MinValueValidator,
    MaxValueValidator,
    RegexValidator,
    EmailValidator,
    URLValidator,
    MinLengthValidator,
    MaxLengthValidator,
    FileExtensionValidator,
    validate_email,
    validate_slug,
)
from django.core.exceptions import ValidationError

# Custom validator — function style
def validate_even(value):
    if value % 2 != 0:
        raise ValidationError(
            '%(value)s is not an even number',
            params={'value': value}
        )

# Custom validator — class style (useful for parameterised validators)
class validate_no_profanity:
    BAD_WORDS = ['spam', 'junk']

    def __call__(self, value):
        for word in self.BAD_WORDS:
            if word in value.lower():
                raise ValidationError(f'Content contains prohibited word: {word}')

    def deconstruct(self):
        # Required for migrations to serialize this validator
        return ('myapp.validators.validate_no_profanity', [], {})

phone_regex = RegexValidator(
    regex=r'^\\+?1?\\d{9,15}$',
    message="Phone number must be entered in format: '+999999999'. Up to 15 digits."
)

class Product(models.Model):
    name = models.CharField(
        max_length=200,
        validators=[MinLengthValidator(3), validate_no_profanity()]
    )
    discount = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    phone = models.CharField(
        max_length=17,
        validators=[phone_regex],
        blank=True
    )
    website = models.URLField(validators=[URLValidator(schemes=['https'])])
    image = models.FileField(
        upload_to='images/',
        validators=[FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png', 'webp'])]
    )
    batch_size = models.IntegerField(validators=[validate_even])

    def clean(self):
        # Cross-field validation goes in clean(), not validators
        if self.discount > 50 and self.batch_size < 10:
            raise ValidationError('High discounts require batch size of at least 10.')

    def save(self, *args, **kwargs):
        self.full_clean()  # Runs all validators before saving
        super().save(*args, **kwargs)`,
      outputExplanation: "Validators run when you call model.full_clean(). They do NOT run automatically on .save() unless you override save() to call full_clean() first. DRF and Django forms call full_clean() for you, but direct ORM .save() calls do not.",
      commonMistakes: [
        "Assuming validators run on .save() — they only run on full_clean(). You must call self.full_clean() in save() to enforce them on direct ORM saves.",
        "Forgetting to implement deconstruct() on class-based validators — Django can't serialize them into migration files without it.",
        "Using validators for constraints that should be database-level (e.g. uniqueness) — use unique=True or UniqueConstraint instead."
      ],
      interviewNotes: [
        "Validators are callables (functions or classes with __call__) that raise ValidationError.",
        "full_clean() calls: clean_fields() (runs validators), clean() (cross-field), validate_unique().",
        "Django forms and DRF serializers call full_clean() automatically. Direct ORM .save() does not.",
        "MinValueValidator/MaxValueValidator use >= and <= comparisons and work on any comparable type.",
        "For database-level constraints, use CheckConstraint; for Python-layer constraints, use validators."
      ],
      whenToUse: "For application-layer validation that is more complex than what field types and choices provide. Especially useful for regex patterns, range checks, and file type restrictions.",
      whenNotToUse: "Do not use validators as a replacement for database constraints — for critical data integrity, pair them with CheckConstraint."
    },
    tags: ["validators", "validation", "minvalue", "maxvalue", "regex", "models"],
    order: 7,
    estimatedMinutes: 12
  },
  {
    id: "auto-fields",
    title: "Auto Fields (auto_now, auto_now_add)",
    slug: "auto-fields",
    category: "models",
    difficulty: "beginner",
    description: "How auto_now and auto_now_add work on DateTimeField and DateField, their differences, and important gotchas.",
    content: {
      explanation: "auto_now_add=True sets the field to the current datetime when the object is first created and never changes it afterward. auto_now=True sets the field to the current datetime every time the object is saved. Both automatically set editable=False and blank=True internally.",
      realExample: "A blog post has created_at (set once at creation) and updated_at (updated every time you edit the post). This is one of the most common patterns in Django models.",
      codeExample: `from django.db import models
from django.utils import timezone

class Article(models.Model):
    title = models.CharField(max_length=200)

    # Set once at creation, never changed automatically
    created_at = models.DateTimeField(auto_now_add=True)

    # Updated every time .save() is called
    updated_at = models.DateTimeField(auto_now=True)

    # Manual timestamp — you control it (can set default and update manually)
    published_at = models.DateTimeField(null=True, blank=True)

# Behaviour examples
article = Article.objects.create(title="Hello")
print(article.created_at)   # e.g. 2024-01-15 10:00:00
print(article.updated_at)   # e.g. 2024-01-15 10:00:00

article.title = "Hello World"
article.save()
print(article.updated_at)   # now 2024-01-15 10:05:00 (updated)
print(article.created_at)   # still 2024-01-15 10:00:00 (unchanged)

# GOTCHA 1: auto_now freezes value in update()
# This does NOT update updated_at:
Article.objects.filter(pk=article.pk).update(title="New Title")
# updated_at is NOT changed because update() bypasses .save()

# GOTCHA 2: You cannot set auto_now_add fields manually
# article.created_at = timezone.now()  # This does nothing — field is not editable

# WORKAROUND: Use default=timezone.now if you need manual control
class FlexibleArticle(models.Model):
    title = models.CharField(max_length=200)
    created_at = models.DateTimeField(default=timezone.now)   # editable, settable
    updated_at = models.DateTimeField(default=timezone.now)   # you update manually

    def save(self, *args, **kwargs):
        self.updated_at = timezone.now()
        super().save(*args, **kwargs)`,
      outputExplanation: "auto_now=True is triggered only by model .save() calls — NOT by QuerySet.update(). If you use update() for bulk updates, auto_now fields will not reflect the update time. Using default=timezone.now gives you full control at the cost of having to manage the timestamp yourself.",
      commonMistakes: [
        "Using QuerySet.update() expecting auto_now fields to update — they don't, because update() is a SQL UPDATE that bypasses Python model instances.",
        "Trying to set auto_now_add fields in fixtures or tests — you can't because they're not editable. Use a mock or override with update().",
        "Confusing auto_now and auto_now_add — auto_now updates EVERY save, auto_now_add only on CREATE."
      ],
      interviewNotes: [
        "auto_now_add=True sets editable=False and blank=True automatically. You cannot manually assign the field value.",
        "auto_now=True is triggered by .save() only — QuerySet.update(), bulk_create(), and bulk_update() bypass it.",
        "For testing with controlled timestamps, use default=timezone.now instead and manually set in tests.",
        "auto_now fields are always timezone-aware datetime objects when USE_TZ=True in settings.",
        "To override auto_now_add in tests/migrations: Article.objects.filter(pk=pk).update(created_at=past_date)"
      ],
      whenToUse: "Use auto_now_add for created_at (immutable creation timestamp) and auto_now for updated_at (last modified) in virtually every model that needs auditing.",
      whenNotToUse: "If you need to set the timestamp manually (e.g. importing historical data), use default=timezone.now instead and manage the field yourself."
    },
    tags: ["auto_now", "auto_now_add", "datetime", "timestamp", "models"],
    order: 8,
    estimatedMinutes: 8
  },
  {
    id: "meta-options",
    title: "Model Meta Options",
    slug: "meta-options",
    category: "models",
    difficulty: "intermediate",
    description: "The inner Meta class: ordering, verbose_name, verbose_name_plural, db_table, unique_together, indexes, constraints, and abstract.",
    content: {
      explanation: "The inner Meta class on a Django model provides metadata about the model itself — not about any single field. It controls database table naming, default ordering, admin display names, constraints, and whether the model is abstract (no table created).",
      realExample: "A legacy database named its tables with a 'tbl_' prefix. Meta.db_table lets you connect Django models to existing tables without renaming them. unique_together ensures that no two products in the same store have the same SKU.",
      codeExample: `from django.db import models

class Category(models.Model):
    name = models.CharField(max_length=100)
    store = models.ForeignKey('Store', on_delete=models.CASCADE)

    class Meta:
        # Human-readable names in admin
        verbose_name = 'Category'
        verbose_name_plural = 'Categories'

        # Custom DB table name (overrides default 'myapp_category')
        db_table = 'product_categories'

        # Default ordering — prefix '-' for descending
        ordering = ['name']

        # Legacy unique_together (prefer UniqueConstraint in new code)
        unique_together = [['name', 'store']]

        # Named indexes for performance
        indexes = [
            models.Index(fields=['name'], name='category_name_idx'),
            models.Index(fields=['store', 'name'], name='category_store_name_idx'),
        ]

        # Constraints (preferred over unique_together for new code)
        constraints = [
            models.UniqueConstraint(
                fields=['name', 'store'],
                name='unique_category_per_store'
            ),
            models.CheckConstraint(
                check=models.Q(name__length__gt=0),
                name='category_name_not_empty'
            )
        ]

# Abstract model — no DB table created, used as base class
class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True  # No migration or table created for THIS class

class BlogPost(TimeStampedModel):
    title = models.CharField(max_length=200)
    # Inherits created_at and updated_at
    # Table: myapp_blogpost (includes created_at and updated_at columns)

    class Meta(TimeStampedModel.Meta):
        ordering = ['-created_at']
        verbose_name = 'Blog Post'
        verbose_name_plural = 'Blog Posts'`,
      outputExplanation: "Abstract models are Python base classes — no database table is created for them. All their fields and methods are inherited by concrete subclasses. TimeStampedModel is a popular pattern to add timestamps to all models in a project.",
      commonMistakes: [
        "Overriding Meta in a child of an abstract model without inheriting — class Meta(ParentModel.Meta) should be used to preserve parent Meta settings like abstract = True removal.",
        "Using unique_together for new code — UniqueConstraint in Meta.constraints is preferred as it supports more options (conditions, deferrable).",
        "Setting db_table on a proxy model — the proxy and its parent share the same table."
      ],
      interviewNotes: [
        "Meta.ordering applies a default ORDER BY to all QuerySets for this model — individual .order_by() calls override it.",
        "Meta.abstract = True means no migration and no DB table. The model exists only as a Python base class.",
        "Meta.db_table is useful for legacy database integration without renaming existing tables.",
        "unique_together is deprecated in favour of UniqueConstraint — use UniqueConstraint for all new constraints.",
        "Meta.indexes creates B-tree indexes by default — for other index types (GIN, GiST) use django.contrib.postgres.indexes."
      ],
      whenToUse: "Always define verbose_name and verbose_name_plural for better admin UX. Use abstract=True for shared base models. Add indexes for fields you query frequently.",
      whenNotToUse: "Do not define ordering in Meta if queries against this model rarely need a consistent order — it adds an ORDER BY to every query and can hurt performance."
    },
    tags: ["meta", "ordering", "verbose_name", "db_table", "abstract", "models"],
    order: 9,
    estimatedMinutes: 12
  },
  {
    id: "model-ordering",
    title: "Model Ordering",
    slug: "model-ordering",
    category: "models",
    difficulty: "beginner",
    description: "Default ordering in Meta, direction control with '-', ordering by related fields, and nulls_first/nulls_last.",
    content: {
      explanation: "Django supports default ordering via Meta.ordering and per-query ordering via .order_by(). Ordering direction is controlled with a '-' prefix for descending. You can order by related model fields using double-underscore notation. Django 3.1+ supports nulls_first and nulls_last.",
      realExample: "A news site wants articles ordered by published_at descending by default (newest first). Within the same published time, alphabetically by title. Staff can override to sort by author name.",
      codeExample: `from django.db import models
from django.db.models import F

class Author(models.Model):
    name = models.CharField(max_length=100)
    birth_year = models.IntegerField(null=True, blank=True)

class Article(models.Model):
    title = models.CharField(max_length=200)
    author = models.ForeignKey(Author, on_delete=models.CASCADE)
    published_at = models.DateTimeField(null=True, blank=True)
    views = models.PositiveIntegerField(default=0)

    class Meta:
        # Default: newest first, then alphabetically by title
        ordering = ['-published_at', 'title']

# QuerySet ordering examples
Article.objects.all()                          # Uses Meta.ordering
Article.objects.order_by('title')              # Ascending by title
Article.objects.order_by('-views')             # Descending by views
Article.objects.order_by('author__name')       # Order by related field
Article.objects.order_by('-published_at', 'title')  # Multi-field
Article.objects.order_by('?')                  # Random (expensive on large tables!)

# Clear default ordering
Article.objects.all().order_by()              # Removes all ordering

# Nulls first / nulls last (Django 3.1+)
from django.db.models import F
Article.objects.order_by(
    F('published_at').asc(nulls_last=True)    # NULLs appear at the end
)
Article.objects.order_by(
    F('published_at').desc(nulls_first=True)  # NULLs appear at the start
)

# F expression ordering (same as '-views')
Article.objects.order_by(F('views').desc())`,
      outputExplanation: "Meta.ordering is a convenience default — it's overridden by any explicit .order_by() call. Using order_by() on a queryset that has Meta.ordering completely replaces the default. Calling .order_by() with no arguments removes all ordering.",
      commonMistakes: [
        "Forgetting that order_by() replaces Meta.ordering entirely — to extend it, read it first and concatenate.",
        "Using order_by('?') (random ordering) on large tables — it generates ORDER BY RAND() which is extremely slow on MySQL.",
        "Ordering by a non-indexed field on large tables — add db_index=True or Meta.indexes to avoid full table scans."
      ],
      interviewNotes: [
        "Meta.ordering adds ORDER BY to every QuerySet for the model. This has a performance cost on large tables.",
        "F('field').asc(nulls_last=True) requires Django 3.1+. Before that, use CASE WHEN or database-specific solutions.",
        "Ordering by related fields with __ notation (e.g. author__name) triggers a JOIN.",
        "order_by() with no arguments removes all ordering including Meta.ordering — useful for aggregate queries."
      ],
      whenToUse: "Set Meta.ordering when there's a natural sort order for the model (e.g. newest first for posts). Override with order_by() in views or serializers when different ordering is needed.",
      whenNotToUse: "Avoid Meta.ordering if rows are almost always retrieved in a custom order — the default ordering adds overhead to every query."
    },
    tags: ["ordering", "order_by", "meta", "models", "queryset"],
    order: 10,
    estimatedMinutes: 8
  },
  {
    id: "indexes",
    title: "Database Indexes",
    slug: "indexes",
    category: "models",
    difficulty: "intermediate",
    description: "Creating indexes with db_index, Meta.indexes, partial indexes, and composite indexes for query performance.",
    content: {
      explanation: "Indexes are database structures that dramatically speed up read queries at the cost of slower writes and extra storage. Django supports single-column indexes via db_index=True, and multi-column or partial indexes via Meta.indexes using the Index class.",
      realExample: "An e-commerce site with millions of products filters frequently by category AND is_active. A composite index on (category_id, is_active) is far faster than two separate indexes because the database can satisfy both conditions with one index scan.",
      codeExample: `from django.db import models
from django.db.models import Index, Q

class Product(models.Model):
    name = models.CharField(max_length=200)
    category = models.ForeignKey('Category', on_delete=models.CASCADE)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    sku = models.CharField(max_length=50)

    class Meta:
        indexes = [
            # Simple index on a single field
            Index(fields=['sku'], name='product_sku_idx'),

            # Composite index — speeds up filter(category=x, is_active=True)
            Index(fields=['category', 'is_active'], name='product_category_active_idx'),

            # Descending index (useful for ORDER BY -created_at)
            Index(fields=['-created_at'], name='product_created_desc_idx'),

            # Partial index — only indexes active products
            # (PostgreSQL only)
            Index(
                fields=['price'],
                name='active_product_price_idx',
                condition=Q(is_active=True)
            ),
        ]

# Field-level index (equivalent to Index(fields=['name']))
class Tag(models.Model):
    name = models.CharField(max_length=50, db_index=True)

# PostgreSQL-specific indexes (from django.contrib.postgres.indexes)
# from django.contrib.postgres.indexes import GinIndex, GistIndex, BrinIndex
#
# class Article(models.Model):
#     body = models.TextField()
#     class Meta:
#         indexes = [
#             GinIndex(fields=['body'], name='article_body_gin_idx'),
#         ]`,
      outputExplanation: "Partial indexes (condition=Q(...)) index only a subset of rows — ideal when you almost always query with a specific filter (e.g. is_active=True). They're smaller and faster than full indexes but are PostgreSQL-specific.",
      commonMistakes: [
        "Creating an index on a low-cardinality field (e.g. is_active which has only True/False) — the DB optimizer may ignore the index and do a full table scan instead.",
        "Forgetting that ForeignKey fields automatically get an index in Django — no need to add db_index=True.",
        "Over-indexing — every index slows INSERT/UPDATE/DELETE. Index only fields that appear in WHERE, ORDER BY, or JOIN clauses of real queries."
      ],
      interviewNotes: [
        "ForeignKey fields in Django automatically create a database index — you don't need to add db_index=True.",
        "Composite indexes work for prefix lookups: Index(fields=['a','b']) helps queries on 'a' or 'a AND b' but NOT 'b' alone.",
        "Partial indexes (condition=Q(...)) are PostgreSQL-only and are not supported in MySQL or SQLite.",
        "unique=True implicitly creates an index, so don't also add db_index=True.",
        "Use EXPLAIN ANALYZE in PostgreSQL to verify your indexes are being used."
      ],
      whenToUse: "Add indexes to fields used in WHERE clauses of frequent queries, ORDER BY columns, and JOIN conditions. Add composite indexes for multi-field filters.",
      whenNotToUse: "Do not index columns with very few distinct values (low cardinality) or columns that are rarely queried. Avoid over-indexing write-heavy tables."
    },
    tags: ["indexes", "db_index", "composite-index", "partial-index", "performance", "models"],
    order: 11,
    estimatedMinutes: 12
  },
  {
    id: "constraints",
    title: "Model Constraints",
    slug: "constraints",
    category: "models",
    difficulty: "intermediate",
    description: "UniqueConstraint, CheckConstraint, deferrable constraints, and naming constraints in Meta.constraints.",
    content: {
      explanation: "Django's Meta.constraints allow you to define database-level constraints beyond simple unique=True. UniqueConstraint is more powerful than unique_together (supports conditions and deferrable). CheckConstraint allows arbitrary SQL-level validation that even bypasses the ORM.",
      realExample: "A booking system needs to ensure that an appointment's end_time is always after its start_time. A CheckConstraint enforces this at the database level, so even direct SQL inserts can't violate it.",
      codeExample: `from django.db import models
from django.db.models import Q, UniqueConstraint, CheckConstraint

class Seat(models.Model):
    event = models.ForeignKey('Event', on_delete=models.CASCADE)
    row = models.CharField(max_length=5)
    number = models.PositiveIntegerField()
    is_reserved = models.BooleanField(default=False)

    class Meta:
        constraints = [
            # UniqueConstraint — preferred over unique_together
            UniqueConstraint(
                fields=['event', 'row', 'number'],
                name='unique_seat_per_event'
            ),

            # Conditional UniqueConstraint — only one reserved seat per row per event
            UniqueConstraint(
                fields=['event', 'row'],
                condition=Q(is_reserved=True),
                name='unique_reserved_per_row_event'
            ),
        ]

class Appointment(models.Model):
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    doctor = models.ForeignKey('Doctor', on_delete=models.CASCADE)
    patient = models.ForeignKey('Patient', on_delete=models.CASCADE)

    class Meta:
        constraints = [
            # CheckConstraint — enforced at DB level
            CheckConstraint(
                check=Q(end_time__gt=models.F('start_time')),
                name='appointment_end_after_start'
            ),
            # No overlapping appointments for same doctor
            UniqueConstraint(
                fields=['doctor', 'start_time'],
                name='unique_doctor_start_time'
            ),
        ]

class Product(models.Model):
    price = models.DecimalField(max_digits=10, decimal_places=2)
    discount = models.IntegerField(default=0)

    class Meta:
        constraints = [
            CheckConstraint(
                check=Q(price__gt=0),
                name='product_price_positive'
            ),
            CheckConstraint(
                check=Q(discount__gte=0) & Q(discount__lte=100),
                name='product_discount_0_to_100'
            ),
        ]`,
      outputExplanation: "Constraints are enforced at the database level — they cannot be bypassed even with raw SQL. Violation raises django.db.IntegrityError. Unlike validators, constraints don't run in Python — they're pure SQL DDL.",
      commonMistakes: [
        "Expecting CheckConstraint to run during Python validation — it does not. full_clean() does not check DB constraints.",
        "Forgetting to name constraints — unnamed constraints get auto-generated names that change across Django versions, causing migration conflicts.",
        "Using F() inside Q() for CheckConstraint — the correct syntax uses models.F() not just F() in some Django versions."
      ],
      interviewNotes: [
        "Constraints are enforced at the database level and raise IntegrityError on violation.",
        "UniqueConstraint with condition= creates a partial unique index (PostgreSQL only).",
        "Always name your constraints explicitly — auto-generated names can conflict across team members' migrations.",
        "CheckConstraint check= accepts Q objects — this translates to SQL CHECK (condition).",
        "unique_together is a legacy shortcut for UniqueConstraint — prefer UniqueConstraint for all new code."
      ],
      whenToUse: "Use CheckConstraint for business rules that must be enforced even against direct SQL inserts (e.g. end > start). Use UniqueConstraint for multi-column uniqueness requirements.",
      whenNotToUse: "Do not rely solely on constraints for user-facing validation — they raise IntegrityError which needs to be caught and converted to user-friendly messages. Pair with validators."
    },
    tags: ["constraints", "uniqueconstraint", "checkconstraint", "meta", "models"],
    order: 12,
    estimatedMinutes: 12
  },
  {
    id: "str-method",
    title: "__str__ Method",
    slug: "str-method",
    category: "models",
    difficulty: "beginner",
    description: "Why __str__ matters, how Django uses it in the admin and shell, and best practices for writing it.",
    content: {
      explanation: "__str__ is a Python dunder method that returns the human-readable string representation of an object. In Django, it's displayed in the admin list view, shell repr, ForeignKey dropdowns, and anywhere Django converts a model instance to a string. Without it, you see something like '<BlogPost object (1)>' which is useless.",
      realExample: "In the Django admin, when you select a ForeignKey field, you see a dropdown of all related objects. Their display labels come from __str__. If you don't define it, every item shows as 'BlogPost object (1)', 'BlogPost object (2)' making it impossible to pick the right one.",
      codeExample: `from django.db import models

# BAD — no __str__
class BadProduct(models.Model):
    name = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=10, decimal_places=2)
# In shell: <BadProduct: BadProduct object (1)>

# GOOD — descriptive __str__
class Product(models.Model):
    name = models.CharField(max_length=200)
    sku = models.CharField(max_length=50)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.ForeignKey('Category', on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.name} (SKU: {self.sku})"

class Order(models.Model):
    customer = models.ForeignKey('Customer', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    total = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"Order #{self.pk} by {self.customer} — \${self.total}"

class Category(models.Model):
    name = models.CharField(max_length=100)
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL)

    def __str__(self):
        if self.parent:
            return f"{self.parent} > {self.name}"
        return self.name

# Django admin uses __str__ for:
# 1. The list display of objects
# 2. ForeignKey dropdown labels
# 3. ManyToMany widget labels
# 4. Breadcrumb navigation

# Shell usage
product = Product.objects.first()
print(product)           # "Laptop (SKU: LAP001)"
print(str(product))      # "Laptop (SKU: LAP001)"
print(repr(product))     # "<Product: Laptop (SKU: LAP001)>"
print(f"{product}")      # "Laptop (SKU: LAP001)"`,
      outputExplanation: "str(instance) calls __str__. repr(instance) calls __repr__ which Django defaults to '<ModelName: __str__ result>'. The f-string {product} also calls __str__. Django admin uses __str__ wherever it displays model instances.",
      commonMistakes: [
        "Triggering a database query inside __str__ (e.g. accessing a ForeignKey that wasn't selected) — this can cause N+1 problems when listing objects.",
        "Returning None from __str__ — Python will raise TypeError. Always return a string.",
        "Making __str__ too long — it's used in dropdowns and list views. Keep it concise and identifying."
      ],
      interviewNotes: [
        "__str__ should always return a str — if it might be None, use str() to coerce: return str(self.name or 'Unnamed')",
        "Accessing self.category.name inside __str__ will trigger an extra DB query for each object unless select_related() is used.",
        "Django admin's list_display can override what's shown in the list view, but __str__ is still used in ForeignKey dropdowns.",
        "Every Django model should define __str__ — it's considered a best practice and mentioned in the official docs."
      ],
      whenToUse: "Always. Every model should have a meaningful __str__ method. It costs nothing and dramatically improves debugging, admin usability, and log readability.",
      whenNotToUse: "There is no case where you should not define __str__. Even a simple return self.name is better than the default."
    },
    tags: ["str", "admin", "models", "best-practices"],
    order: 13,
    estimatedMinutes: 6
  },
  {
    id: "model-methods",
    title: "Model Methods",
    slug: "model-methods",
    category: "models",
    difficulty: "intermediate",
    description: "Custom instance methods, @property, classmethods, and staticmethods on Django models for encapsulating business logic.",
    content: {
      explanation: "Models should not just store data — they should encapsulate business logic related to that data. Instance methods operate on a single instance, @property creates computed attributes, classmethods operate on the class itself, and staticmethods are utility functions related to the model but not needing instance or class access.",
      realExample: "An Order model might have a method get_total_with_tax() that calculates the total after applying the appropriate tax rate. A property is_overdue checks if a due date has passed. A classmethod get_pending_orders() returns a pre-filtered queryset.",
      codeExample: `from django.db import models
from django.utils import timezone
from decimal import Decimal

class Order(models.Model):
    customer = models.ForeignKey('Customer', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    due_date = models.DateField(null=True, blank=True)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=4, default=Decimal('0.08'))
    status = models.CharField(max_length=20, default='pending')
    shipped_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Order #{self.pk}"

    # Instance method — operates on self
    def get_total_with_tax(self):
        return self.subtotal * (1 + self.tax_rate)

    def mark_shipped(self):
        self.status = 'shipped'
        self.shipped_at = timezone.now()
        self.save(update_fields=['status', 'shipped_at'])

    def can_cancel(self):
        return self.status in ('pending', 'processing')

    # Property — accessed like an attribute, not called as a method
    @property
    def is_overdue(self):
        if not self.due_date:
            return False
        return timezone.now().date() > self.due_date

    @property
    def tax_amount(self):
        return self.subtotal * self.tax_rate

    @property
    def total(self):
        return self.subtotal + self.tax_amount

    # Classmethod — gets the class as first argument
    @classmethod
    def get_pending(cls):
        return cls.objects.filter(status='pending')

    @classmethod
    def create_for_customer(cls, customer, items):
        subtotal = sum(item.price for item in items)
        return cls.objects.create(customer=customer, subtotal=subtotal)

    # Staticmethod — no class or instance access needed
    @staticmethod
    def calculate_tax(amount, rate):
        return amount * rate

# Usage
order = Order.objects.get(pk=1)
print(order.total)             # Uses @property — no ()
print(order.is_overdue)        # Uses @property
print(order.get_total_with_tax())  # Instance method — needs ()
pending = Order.get_pending()  # Classmethod
tax = Order.calculate_tax(Decimal('100'), Decimal('0.08'))  # Staticmethod`,
      outputExplanation: "@property makes a method accessible as an attribute (no parentheses). This is ideal for computed values derived from instance data. Classmethods are useful for factory methods and pre-filtered QuerySets. Staticmethods are utility functions that happen to live on the model for namespace purposes.",
      commonMistakes: [
        "Making expensive DB queries inside a @property — this triggers queries every time the property is accessed, potentially causing N+1 in templates.",
        "Calling instance methods as if they are classmethods — Order.mark_shipped() fails because there's no instance.",
        "Forgetting to use update_fields in save() inside a method — calling self.save() without update_fields saves ALL fields, which can overwrite concurrent changes."
      ],
      interviewNotes: [
        "@property creates a computed attribute. It cannot be filtered or annotated in QuerySets — for that, use annotate().",
        "Classmethods that return QuerySets are a great pattern for common filters: Order.get_overdue().count()",
        "save(update_fields=['field1', 'field2']) only writes those specific fields — more efficient and avoids race conditions.",
        "Put business logic on the model (Fat Models, Thin Views) rather than in views or serializers for better testability and reuse."
      ],
      whenToUse: "Put business logic that relates to a single model instance on the model itself as methods or properties. This keeps views thin and logic testable in isolation.",
      whenNotToUse: "Do not put logic that involves multiple models or external services on the model. Use service classes or manager methods for cross-model or orchestration logic."
    },
    tags: ["methods", "property", "classmethod", "staticmethod", "business-logic", "models"],
    order: 14,
    estimatedMinutes: 12
  },
  {
    id: "save-override",
    title: "Overriding save()",
    slug: "save-override",
    category: "models",
    difficulty: "intermediate",
    description: "How to override the save() method, use super().save(), call full_clean(), and when to use signals instead.",
    content: {
      explanation: "Overriding save() lets you add custom logic that runs every time a model instance is saved — whether created or updated. The key rule: always call super().save(*args, **kwargs) to preserve Django's default save behaviour. You can detect create vs update by checking self.pk.",
      realExample: "A Product model auto-generates a slug from the name on creation. An Article model automatically sets published_at when the status changes to 'published'. An Order model sends a confirmation email after saving.",
      codeExample: `from django.db import models
from django.utils.text import slugify
from django.utils import timezone

class Article(models.Model):
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True, blank=True)
    status = models.CharField(max_length=20, default='draft')
    published_at = models.DateTimeField(null=True, blank=True)
    body = models.TextField()

    def save(self, *args, **kwargs):
        # Detect if this is a CREATE (no pk yet) or UPDATE
        is_create = self.pk is None

        # Auto-generate slug from title on creation
        if is_create and not self.slug:
            self.slug = slugify(self.title)

        # Auto-set published_at when status changes to 'published'
        if self.status == 'published' and not self.published_at:
            self.published_at = timezone.now()

        # Run all validators before saving
        # (Django doesn't call full_clean() automatically)
        self.full_clean()

        # ALWAYS call super() — this does the actual SQL INSERT/UPDATE
        super().save(*args, **kwargs)

        # Post-save logic (e.g. send notification)
        if is_create:
            self._send_creation_notification()

    def _send_creation_notification(self):
        # Called after save, so self.pk is available
        print(f"Article {self.pk} created: {self.title}")

class Product(models.Model):
    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name)
            slug = base_slug
            counter = 1
            # Ensure slug uniqueness
            while Product.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)

# Signals — alternative to save() override for decoupled logic
from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver

@receiver(post_save, sender=Article)
def article_post_save(sender, instance, created, **kwargs):
    if created:
        print(f"Signal: Article {instance.pk} was just created")`,
      outputExplanation: "self.pk is None before the first save (create). After super().save(), the pk is populated. Always place super().save() BEFORE any logic that needs the pk (like creating related objects). Place validation and field mutation BEFORE super().save().",
      commonMistakes: [
        "Forgetting super().save(*args, **kwargs) — the object never actually gets saved to the database.",
        "Calling full_clean() AFTER super().save() — validation errors would be raised after the DB write.",
        "Putting post-save logic (like sending emails) before super().save() — if save fails, the email was already sent.",
        "Overriding save() for logic that should be in signals — signals allow decoupled apps to react to model saves without modifying the model."
      ],
      interviewNotes: [
        "self.pk is None for unsaved instances — use this to distinguish create from update.",
        "Always call super().save(*args, **kwargs) and forward *args and **kwargs to support update_fields and other save parameters.",
        "QuerySet.update() bypasses save() entirely — no save() override logic runs for bulk updates.",
        "Signals (pre_save, post_save) are the decoupled alternative to save() overrides — use signals for cross-app concerns.",
        "full_clean() inside save() means every direct ORM save() will validate — good for data integrity but adds overhead."
      ],
      whenToUse: "Use save() override for logic tightly coupled to the model (slug generation, auto-setting fields). Use signals for cross-app or decoupled side effects.",
      whenNotToUse: "Avoid heavy operations (API calls, sending emails) directly in save() without async handling — they block the request. Use Celery tasks triggered from post_save signals instead."
    },
    tags: ["save", "override", "signals", "full_clean", "models"],
    order: 15,
    estimatedMinutes: 12
  },
  {
    id: "managers",
    title: "Model Managers",
    slug: "managers",
    category: "models",
    difficulty: "intermediate",
    description: "The default Manager, custom Managers, overriding get_queryset(), and chainable QuerySet methods via Manager.",
    content: {
      explanation: "A Manager is the interface through which database query operations are provided to Django models. Every model has at least one Manager (objects by default). You can create custom Managers to provide pre-filtered QuerySets, add helper methods, or change the default queryset.",
      realExample: "A PublishedManager on an Article model automatically filters to only published articles. Every view that needs published articles just uses Article.published.all() instead of Article.objects.filter(status='published') everywhere.",
      codeExample: `from django.db import models

# Custom QuerySet — chainable methods
class ArticleQuerySet(models.QuerySet):
    def published(self):
        return self.filter(status='published')

    def by_author(self, author):
        return self.filter(author=author)

    def recent(self):
        return self.order_by('-published_at')[:10]

    def popular(self):
        return self.filter(views__gte=1000)

# Custom Manager — uses the custom QuerySet
class ArticleManager(models.Manager):
    def get_queryset(self):
        # Override default queryset — exclude soft-deleted articles
        return ArticleQuerySet(self.model, using=self._db).filter(is_deleted=False)

    # Convenience method that calls into QuerySet
    def published(self):
        return self.get_queryset().published()

    def popular_and_recent(self):
        return self.get_queryset().published().popular().recent()

class Article(models.Model):
    title = models.CharField(max_length=200)
    status = models.CharField(max_length=20, default='draft')
    author = models.ForeignKey('Author', on_delete=models.CASCADE)
    published_at = models.DateTimeField(null=True, blank=True)
    views = models.PositiveIntegerField(default=0)
    is_deleted = models.BooleanField(default=False)

    # Replace default manager
    objects = ArticleManager()

    # Add an additional manager (doesn't override objects)
    all_objects = models.Manager()  # Access including deleted

    class Meta:
        ordering = ['-published_at']

# Usage — chainable because QuerySet methods return QuerySet
Article.objects.all()                   # Excludes is_deleted=True
Article.objects.published()             # Only published, not deleted
Article.objects.published().by_author(author).recent()  # Chain!
Article.objects.popular_and_recent()    # Convenience method
Article.all_objects.all()               # Including soft-deleted`,
      outputExplanation: "By defining methods on ArticleQuerySet, they become chainable. ArticleManager.published() returns a QuerySet, so you can chain .by_author().recent() after it. The get_queryset() override applies a base filter to ALL queries through this manager.",
      commonMistakes: [
        "Defining methods only on Manager (not QuerySet) — they can't be chained because Manager methods return QuerySets that don't have the custom methods.",
        "Overriding get_queryset() without a fallback manager — related managers and admin may need unfiltered access. Always add an all_objects = models.Manager().",
        "Forgetting to use self._db in custom QuerySet init — this is needed for multi-database support."
      ],
      interviewNotes: [
        "Define methods on QuerySet for chainability. Call them from Manager for convenience entry points.",
        "Overriding get_queryset() on the default manager affects all ORM operations including admin and related managers — be careful.",
        "Django's from_queryset() class method creates a Manager from a QuerySet class: ArticleManager = BaseManager.from_queryset(ArticleQuerySet)",
        "use_in_migrations = True on custom managers is needed if the manager is used in RunPython migrations.",
        "Related managers (accessed via reverse FK) use the model's default manager — your custom get_queryset() applies there too."
      ],
      whenToUse: "Create custom managers for commonly repeated filter patterns. Override get_queryset() for soft-delete patterns or multi-tenancy where every query needs a base filter.",
      whenNotToUse: "Avoid overriding get_queryset() without providing a bypass manager — it can break admin and data migrations that need unfiltered access."
    },
    tags: ["managers", "queryset", "custom-manager", "objects", "models"],
    order: 16,
    estimatedMinutes: 15
  },
  {
    id: "abstract-models",
    title: "Abstract Models",
    slug: "abstract-models",
    category: "models",
    difficulty: "intermediate",
    description: "Using abstract = True in Meta for code reuse without creating a database table. The TimeStampedModel pattern.",
    content: {
      explanation: "An abstract model is a Python base class that defines fields and methods shared by multiple concrete models. Setting abstract = True in Meta tells Django not to create a database table for the abstract model itself. Each concrete subclass gets all the abstract model's fields added to its own table.",
      realExample: "Almost every production Django project has a TimeStampedModel with created_at and updated_at. Instead of adding these fields to every model, define them once in an abstract model and subclass it everywhere.",
      codeExample: `from django.db import models
from django.utils import timezone

# Abstract base model — NO database table created
class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
        ordering = ['-created_at']

class SoftDeleteModel(models.Model):
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        abstract = True

    def soft_delete(self):
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save(update_fields=['is_deleted', 'deleted_at'])

    def restore(self):
        self.is_deleted = False
        self.deleted_at = None
        self.save(update_fields=['is_deleted', 'deleted_at'])

# Combine multiple abstract models
class BaseModel(TimeStampedModel, SoftDeleteModel):
    class Meta(TimeStampedModel.Meta):
        abstract = True

# Concrete models — each gets its own table with all inherited fields
class BlogPost(BaseModel):
    title = models.CharField(max_length=200)
    body = models.TextField()

    class Meta(BaseModel.Meta):
        verbose_name = 'Blog Post'
        # No abstract = True here — this creates a real table
        # Table: myapp_blogpost with columns:
        # id, created_at, updated_at, is_deleted, deleted_at, title, body

class Comment(BaseModel):
    post = models.ForeignKey(BlogPost, on_delete=models.CASCADE)
    text = models.TextField()

    class Meta(BaseModel.Meta):
        verbose_name = 'Comment'
        # Table: myapp_comment with same timestamp and soft-delete columns

# Migrations: only BlogPost and Comment get tables, NOT BaseModel
# python manage.py makemigrations  — creates tables for BlogPost and Comment only`,
      outputExplanation: "The abstract model's fields are copied into each concrete subclass's table. There is no foreign key or JOIN between the abstract model and its children — it's purely a Python code-sharing mechanism. Running migrations creates tables only for concrete models.",
      commonMistakes: [
        "Forgetting class Meta(ParentModel.Meta) in child classes — without this, the child's Meta doesn't inherit abstract=True removal or ordering settings.",
        "Trying to query the abstract model directly — AbstractModel.objects.all() raises AttributeError because there's no table.",
        "Defining related_name on a ForeignKey in an abstract model — this causes a clash when two subclasses inherit the same FK. Use related_name='%(class)s_set' instead."
      ],
      interviewNotes: [
        "Abstract models create no DB table and cannot be queried directly — they're Python-only.",
        "Fields in abstract models are duplicated into each concrete subclass's table — no join overhead.",
        "Use related_name='%(app_label)s_%(class)s_set' in abstract model FK fields to avoid reverse relation name clashes.",
        "Abstract model Meta settings (like ordering) are inherited by subclasses but can be overridden.",
        "The TimeStampedModel pattern is one of the most common Django patterns in production codebases."
      ],
      whenToUse: "Use abstract models for fields and methods shared across multiple models: timestamps, soft-delete, audit fields, ownership, etc.",
      whenNotToUse: "Do not use abstract models when you need to query all instances across subclasses — use multi-table inheritance or a shared concrete base model instead."
    },
    tags: ["abstract", "inheritance", "timestampedmodel", "base-model", "models"],
    order: 17,
    estimatedMinutes: 10
  },
  {
    id: "proxy-models",
    title: "Proxy Models",
    slug: "proxy-models",
    category: "models",
    difficulty: "intermediate",
    description: "Proxy models with proxy = True — same table, different Python class, different behaviour or ordering.",
    content: {
      explanation: "A proxy model uses the same database table as its parent but is a different Python class. You can add methods, change default ordering, register different admin classes, or give a semantic alias to a subset of data — all without any database changes.",
      realExample: "A User model has all users. You create a StaffUser proxy model that adds staff-specific methods and a different admin view, and a PremiumUser proxy model that filters to premium users. Both use the same auth_user table.",
      codeExample: `from django.db import models

class Article(models.Model):
    title = models.CharField(max_length=200)
    status = models.CharField(max_length=20, default='draft')
    views = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['title']

# Proxy model — same table as Article, different Python class
class PublishedArticle(Article):
    class Meta:
        proxy = True
        ordering = ['-created_at']  # Different default ordering
        verbose_name = 'Published Article'

    # Custom manager to filter by default
    class PublishedManager(models.Manager):
        def get_queryset(self):
            return super().get_queryset().filter(status='published')

    objects = PublishedManager()

    def publish(self):
        self.status = 'published'
        self.save(update_fields=['status'])

class PopularArticle(Article):
    class Meta:
        proxy = True
        ordering = ['-views']
        verbose_name = 'Popular Article'

    class PopularManager(models.Manager):
        def get_queryset(self):
            return super().get_queryset().filter(views__gte=1000)

    objects = PopularManager()

    @property
    def popularity_tier(self):
        if self.views >= 10000:
            return 'viral'
        if self.views >= 1000:
            return 'popular'
        return 'normal'

# Usage
published = PublishedArticle.objects.all()   # Only published articles
popular = PopularArticle.objects.all()       # Only 1000+ view articles

# Same table — isinstance checks
article = Article.objects.first()
print(isinstance(article, Article))          # True
print(type(article))                         # <class 'Article'> (not proxy)

# Proxy instance
pub = PublishedArticle.objects.first()
print(isinstance(pub, Article))              # True — proxy IS-A Article
print(isinstance(pub, PublishedArticle))     # True`,
      outputExplanation: "Proxy models create no new database table and add no new columns. Migrations for proxy models only register the proxy in Django's migration history — no DDL SQL is generated. A proxy instance IS-A instance of the parent model.",
      commonMistakes: [
        "Trying to add new fields to a proxy model — proxy models cannot have new database columns. Use abstract or multi-table inheritance instead.",
        "Forgetting that proxy = True still requires a migration — run makemigrations even though no SQL is generated.",
        "Assuming proxy model managers are independent — the proxy's Manager still queries the same table as the parent."
      ],
      interviewNotes: [
        "Proxy models share the exact same database table as their parent — no new columns, no new table.",
        "Proxy models can have their own: methods, properties, managers, Meta.ordering, and admin registration.",
        "Common use cases: semantic aliases (PublishedArticle), role-based classes (AdminUser, StaffUser), different default orderings.",
        "proxy=True models generate a migration but no SQL DDL — they're recorded in django_migrations only.",
        "You can register a proxy model separately in admin.py with ModelAdmin to get a different admin view of the same table."
      ],
      whenToUse: "Use proxy models when you need different Python behaviour (methods, managers, ordering) for a subset of data in the same table without schema changes.",
      whenNotToUse: "Do not use proxy models when you need to add new fields — use abstract inheritance (copies fields) or multi-table inheritance (new table) instead."
    },
    tags: ["proxy", "inheritance", "models", "admin"],
    order: 18,
    estimatedMinutes: 10
  },
  {
    id: "model-inheritance",
    title: "Model Inheritance Types",
    slug: "model-inheritance",
    category: "models",
    difficulty: "intermediate",
    description: "Comparing abstract inheritance, proxy inheritance, and multi-table (concrete) inheritance — when to use each.",
    content: {
      explanation: "Django supports three types of model inheritance: Abstract (no table, fields copied to children), Proxy (same table, different Python class), and Multi-table (each class gets its own table joined via a OneToOneField). Each has distinct database implications and use cases.",
      realExample: "A content platform with Articles, Videos, and Podcasts: All share common fields (title, author, created_at) which go in an abstract model. Articles and Videos are separate tables (multi-table or separate concrete models). PremiumVideo is a proxy of Video with different methods.",
      codeExample: `from django.db import models

# ============================================================
# 1. ABSTRACT INHERITANCE — no table, fields copied to children
# ============================================================
class ContentBase(models.Model):
    title = models.CharField(max_length=200)
    author = models.ForeignKey('auth.User', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        abstract = True  # No DB table

class Article(ContentBase):
    body = models.TextField()
    # Table: myapp_article (id, title, author_id, created_at, body)

class Video(ContentBase):
    url = models.URLField()
    duration = models.PositiveIntegerField()
    # Table: myapp_video (id, title, author_id, created_at, url, duration)

# ============================================================
# 2. PROXY INHERITANCE — same table, different Python class
# ============================================================
class PublishedArticle(Article):
    class Meta:
        proxy = True  # Same table as Article

    class Meta:
        proxy = True

    def is_published(self):
        return True  # Adds behaviour, no new columns

# ============================================================
# 3. MULTI-TABLE INHERITANCE — each class gets its own table
# ============================================================
class Place(models.Model):
    name = models.CharField(max_length=200)
    address = models.CharField(max_length=500)
    # Table: myapp_place

class Restaurant(Place):
    cuisine = models.CharField(max_length=100)
    serves_pizza = models.BooleanField(default=False)
    # Table: myapp_restaurant (place_ptr_id FK to myapp_place, cuisine, serves_pizza)
    # Django auto-creates: place_ptr = OneToOneField(Place, parent_link=True)

# Accessing multi-table inheritance
restaurant = Restaurant.objects.get(pk=1)
print(restaurant.name)      # From Place table (via JOIN)
print(restaurant.cuisine)   # From Restaurant table

place = Place.objects.get(pk=1)
try:
    print(place.restaurant)  # Access child via reverse O2O
except Restaurant.DoesNotExist:
    print("This place is not a restaurant")

# Comparison table:
# Type          | DB Table      | New Fields | Same Table | JOIN needed
# Abstract      | None          | Yes (copied) | No       | No
# Proxy         | Parent's      | No         | Yes        | No
# Multi-table   | Own + Parent  | Yes        | No         | Yes (always)`,
      outputExplanation: "Multi-table inheritance always requires a JOIN to access parent fields. This can be a performance concern. Abstract inheritance is the most commonly used pattern. Proxy is for behaviour-only changes. Multi-table is rarely recommended in modern Django — prefer abstract inheritance + composition.",
      commonMistakes: [
        "Using multi-table inheritance when abstract is sufficient — multi-table always adds a JOIN, abstract does not.",
        "Trying to query across all children of an abstract model — you can't, because each is a separate table.",
        "Confusing proxy with multi-table — proxy shares the table (no new columns), multi-table creates a new table."
      ],
      interviewNotes: [
        "Abstract: no table, fields duplicated in each child. Best for shared fields/methods.",
        "Proxy: same table as parent, no new fields, different Python behaviour. Best for semantic aliases or different managers.",
        "Multi-table: new table per child, always JOIN to parent. Use sparingly — often better to use composition (ForeignKey) instead.",
        "Django admin handles each type differently — proxy models can be registered separately, multi-table children appear as separate models.",
        "For polymorphic querysets across types, consider django-polymorphic or a GenericForeignKey approach."
      ],
      whenToUse: "Abstract for shared code. Proxy for different admin/manager/method behaviour on same data. Multi-table very rarely — prefer explicit composition.",
      whenNotToUse: "Avoid multi-table inheritance for performance-critical paths — the implicit JOINs are invisible in code but costly at scale."
    },
    tags: ["inheritance", "abstract", "proxy", "multi-table", "models"],
    order: 19,
    estimatedMinutes: 15
  },
  {
    id: "foreignkey",
    title: "ForeignKey",
    slug: "foreignkey",
    category: "models",
    difficulty: "beginner",
    description: "ForeignKey field, on_delete options (CASCADE, PROTECT, SET_NULL, SET_DEFAULT, DO_NOTHING), related_name, to_field, and db_constraint.",
    content: {
      explanation: "ForeignKey creates a many-to-one relationship. Many instances of the model can reference one instance of the related model. Django creates an integer column (field_name_id) in the database and a Python attribute (field_name) that lazily loads the related object.",
      realExample: "Many blog posts can belong to one author. Many order items can belong to one order. Many comments can belong to one blog post. These are all ForeignKey relationships.",
      codeExample: `from django.db import models

class Author(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)

class BlogPost(models.Model):
    title = models.CharField(max_length=200)
    # on_delete=CASCADE — if Author deleted, all their BlogPosts are deleted
    author = models.ForeignKey(
        Author,
        on_delete=models.CASCADE,
        related_name='posts'       # Access via author.posts.all()
    )
    # on_delete=SET_NULL — if Author deleted, author becomes NULL
    editor = models.ForeignKey(
        Author,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='edited_posts'
    )

class Order(models.Model):
    customer = models.ForeignKey(
        'Customer',               # String reference — avoids circular imports
        on_delete=models.PROTECT, # Prevents deleting Customer if they have orders
        related_name='orders'
    )

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(
        'Product',
        on_delete=models.SET_DEFAULT,
        default=1,               # SET_DEFAULT requires a default value
        related_name='order_items'
    )
    quantity = models.PositiveIntegerField()

# ON DELETE OPTIONS:
# CASCADE      — delete child rows when parent is deleted
# PROTECT      — raise ProtectedError, prevent parent deletion if children exist
# SET_NULL     — set FK to NULL (field must have null=True)
# SET_DEFAULT  — set FK to default value (field must have a default)
# DO_NOTHING   — no action (may cause DB integrity errors)
# RESTRICT     — like PROTECT but raises RestrictedError (Django 3.1+)

# Database column: author_id (integer) stored in db
# Python access:
post = BlogPost.objects.first()
print(post.author_id)   # Raw integer (no DB query)
print(post.author)      # Triggers DB query to load Author object
print(post.author.name) # Two DB queries if author not pre-fetched

# Reverse relation
author = Author.objects.first()
print(author.posts.all())  # All BlogPosts by this author
print(author.posts.count())

# to_field — reference non-PK unique field
class Store(models.Model):
    code = models.CharField(max_length=10, unique=True)
    name = models.CharField(max_length=100)

class Inventory(models.Model):
    store = models.ForeignKey(Store, to_field='code', on_delete=models.CASCADE)
    # DB column: store_id stores the store.code value`,
      outputExplanation: "Django stores the FK as field_name_id (integer). Accessing field_name triggers a lazy DB query. Accessing field_name_id is free — no query needed. Use select_related() when you know you'll need the related object to avoid N+1.",
      commonMistakes: [
        "Using on_delete=DO_NOTHING — if you delete the parent, child rows have dangling FK references causing integrity errors.",
        "Not setting null=True when using on_delete=SET_NULL — Django will raise an error.",
        "Accessing post.author in a loop without select_related() — triggers N queries for N posts (N+1 problem).",
        "Using on_delete=CASCADE when PROTECT is more appropriate — accidental parent deletion can cascade-delete thousands of child rows."
      ],
      interviewNotes: [
        "ForeignKey stores field_name_id in the DB. Accessing field_name triggers a lazy query; field_name_id is free.",
        "on_delete is required since Django 2.0 — you must explicitly choose what happens when the parent is deleted.",
        "PROTECT is safer than CASCADE for critical data — it forces explicit deletion of children before the parent.",
        "related_name customizes the reverse accessor name: author.posts.all() instead of author.blogpost_set.all().",
        "String references ('Author') allow forward references to models defined later in the file."
      ],
      whenToUse: "Any many-to-one relationship. Prefer PROTECT for business-critical relationships and CASCADE for composition (e.g. OrderItem belongs to Order — no order means no items).",
      whenNotToUse: "Do not use ForeignKey for many-to-many relationships — use ManyToManyField."
    },
    tags: ["foreignkey", "on_delete", "cascade", "protect", "related_name", "models"],
    order: 20,
    estimatedMinutes: 15
  },
  {
    id: "onetoonefield",
    title: "OneToOneField",
    slug: "onetoonefield",
    category: "models",
    difficulty: "intermediate",
    description: "OneToOneField, its difference from ForeignKey, the user profile pattern, and its role in multi-table inheritance.",
    content: {
      explanation: "OneToOneField is a ForeignKey with unique=True. It creates a one-to-one relationship where each instance of model A is related to exactly one instance of model B and vice versa. Commonly used to extend built-in models (like User) without modifying them.",
      realExample: "Django's built-in User model can't be easily extended. The User Profile pattern uses OneToOneField to attach additional user data (avatar, bio, phone) to User without touching the auth_user table.",
      codeExample: `from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

# User Profile pattern — the most common O2O use case
class UserProfile(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='profile'
    )
    avatar = models.ImageField(upload_to='avatars/', blank=True)
    bio = models.TextField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    is_premium = models.BooleanField(default=False)

    def __str__(self):
        return f"Profile of {self.user.username}"

# Auto-create profile when User is created
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()

# Access the related object from either side
user = User.objects.get(username='alice')
profile = user.profile          # Reverse accessor (related_name='profile')
print(profile.is_premium)

# Access user from profile
profile = UserProfile.objects.get(pk=1)
print(profile.user.email)

# ForeignKey vs OneToOneField comparison:
class Category(models.Model):
    name = models.CharField(max_length=100)

# ForeignKey — many products can be in one category
class Product(models.Model):
    category = models.ForeignKey(Category, on_delete=models.CASCADE)

# OneToOneField — one product has exactly one barcode
class Barcode(models.Model):
    product = models.OneToOneField(Product, on_delete=models.CASCADE, related_name='barcode')
    code = models.CharField(max_length=100, unique=True)

# Multi-table inheritance uses O2O internally
class Place(models.Model):
    name = models.CharField(max_length=200)

class Restaurant(Place):  # Django creates:
    # place_ptr = OneToOneField(Place, parent_link=True, primary_key=True)
    cuisine = models.CharField(max_length=100)`,
      outputExplanation: "OneToOneField = ForeignKey + unique=True. The reverse accessor returns the single related object directly (user.profile) instead of a Manager (user.blogpost_set). Accessing a non-existent reverse O2O raises RelatedObjectDoesNotExist (a subclass of DoesNotExist).",
      commonMistakes: [
        "Accessing the reverse O2O without try/except — if the profile doesn't exist, user.profile raises RelatedObjectDoesNotExist.",
        "Forgetting to create the O2O instance — unlike ForeignKey, the O2O parent doesn't auto-create the child. Use post_save signals.",
        "Using O2O when a ForeignKey is needed — O2O enforces that each parent has at most one child. If multiple children are possible, use ForeignKey."
      ],
      interviewNotes: [
        "OneToOneField is a ForeignKey with unique=True at the DB level.",
        "Reverse access returns the object directly (not a Manager): user.profile (not user.profile.all())",
        "Accessing a missing reverse O2O raises ModelName.RelatedObjectDoesNotExist — use hasattr(user, 'profile') or try/except.",
        "Multi-table inheritance uses O2O under the hood with parent_link=True.",
        "The profile pattern is preferred over custom User models when you only need to add fields to User."
      ],
      whenToUse: "Extending built-in models (User), splitting a large model into logical groups, or when a strict one-to-one business relationship exists.",
      whenNotToUse: "When multiple child records per parent are possible — use ForeignKey instead."
    },
    tags: ["onetoonefield", "profile-pattern", "inheritance", "models"],
    order: 21,
    estimatedMinutes: 12
  },
  {
    id: "manytomanyfield",
    title: "ManyToManyField",
    slug: "manytomanyfield",
    category: "models",
    difficulty: "intermediate",
    description: "ManyToManyField, the automatic through table, custom through tables with through=, through_fields, symmetrical, and M2M operations.",
    content: {
      explanation: "ManyToManyField creates a many-to-many relationship backed by an automatically created junction/through table. You can customize the through table with through= to add extra fields to the relationship itself.",
      realExample: "A blog post can have many tags, and a tag can be on many posts. A student can enroll in many courses, and a course can have many students — but enrollment also has an enrollment_date and grade.",
      codeExample: `from django.db import models

class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True)

class BlogPost(models.Model):
    title = models.CharField(max_length=200)
    # Simple M2M — Django creates blogpost_tags junction table automatically
    tags = models.ManyToManyField(Tag, blank=True, related_name='posts')

# Custom through table — adds extra data to the relationship
class Student(models.Model):
    name = models.CharField(max_length=100)
    # through= specifies the custom junction model
    courses = models.ManyToManyField(
        'Course',
        through='Enrollment',
        through_fields=('student', 'course'),  # Required if Enrollment has multiple FKs to same model
        related_name='students'
    )

class Course(models.Model):
    title = models.CharField(max_length=200)
    code = models.CharField(max_length=10, unique=True)

class Enrollment(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    # Extra fields on the relationship itself
    enrolled_at = models.DateTimeField(auto_now_add=True)
    grade = models.CharField(max_length=5, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = [['student', 'course']]

# ---- M2M OPERATIONS ----
post = BlogPost.objects.get(pk=1)
tag1 = Tag.objects.get(name='python')
tag2 = Tag.objects.get(name='django')

post.tags.add(tag1, tag2)          # Add tags
post.tags.remove(tag1)              # Remove a tag
post.tags.clear()                   # Remove all tags
post.tags.set([tag1, tag2])         # Replace all tags with this set

# With custom through — CANNOT use add/remove/clear directly
student = Student.objects.first()
course = Course.objects.first()
# Must create through instance:
Enrollment.objects.create(student=student, course=course, grade='A')

# Querying M2M
post.tags.all()                     # All tags on this post
tag1.posts.all()                    # All posts with this tag
# Filter using M2M:
BlogPost.objects.filter(tags__name='python')
BlogPost.objects.filter(tags__in=[tag1, tag2]).distinct()

# Symmetrical M2M (friendship)
class Person(models.Model):
    name = models.CharField(max_length=100)
    friends = models.ManyToManyField('self', symmetrical=True)
    # symmetrical=True (default for self-referential): adding A->B also adds B->A
    followers = models.ManyToManyField('self', symmetrical=False, related_name='following')
    # symmetrical=False: A follows B does NOT mean B follows A`,
      outputExplanation: "With a simple M2M, Django auto-creates a junction table (modelname_fieldname). With through=, you control the junction table and can add extra fields. When using a custom through table, you cannot use .add(), .remove(), .set(), .clear() — you must manage the through model directly.",
      commonMistakes: [
        "Trying to use post.tags.add() when a custom through= is defined — Django raises AttributeError.",
        "Forgetting .distinct() when filtering across M2M — if a post has 3 matching tags, it appears 3 times in the result.",
        "Setting symmetrical=True on a non-self-referential M2M — it only makes sense for self-referential (same model on both sides)."
      ],
      interviewNotes: [
        "M2M auto-creates a junction table named appname_modelname_fieldname with two FK columns.",
        "through= lets you customize the junction table and add extra fields to the relationship.",
        "With through=, add()/remove()/clear() are disabled — manage the through model explicitly.",
        "symmetrical=True (default for self-referential M2M): adding A friend B automatically adds B friend A.",
        "Always use .distinct() when filtering a QuerySet through M2M to avoid duplicate rows."
      ],
      whenToUse: "Relationships where both sides can have multiple of the other: posts-tags, students-courses, products-categories. Use through= when the relationship itself has data.",
      whenNotToUse: "Do not model ordered relationships with M2M — use a ForeignKey with an order field instead if the ordering of related objects matters."
    },
    tags: ["manytomany", "m2m", "through", "junction-table", "models"],
    order: 22,
    estimatedMinutes: 15
  },
  {
    id: "related-name",
    title: "related_name and Reverse Relations",
    slug: "related-name",
    category: "models",
    difficulty: "intermediate",
    description: "The related_name parameter, reverse relation accessors, disabling reverse relations with '+', and related_query_name.",
    content: {
      explanation: "When you define a ForeignKey or ManyToManyField, Django automatically creates a reverse accessor on the related model. By default this is modelname_set. The related_name parameter lets you customize this reverse accessor name.",
      realExample: "An Author has many BlogPosts. The default reverse accessor is author.blogpost_set. Setting related_name='posts' makes it author.posts — cleaner and more intuitive.",
      codeExample: `from django.db import models

class Author(models.Model):
    name = models.CharField(max_length=100)

class Category(models.Model):
    name = models.CharField(max_length=100)

class BlogPost(models.Model):
    title = models.CharField(max_length=200)

    # Default reverse: author.blogpost_set.all()
    # With related_name: author.posts.all()
    author = models.ForeignKey(
        Author,
        on_delete=models.CASCADE,
        related_name='posts'
    )

    # '+' disables reverse relation entirely (no author.draft_posts accessor)
    draft_editor = models.ForeignKey(
        Author,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='+'    # No reverse accessor created
    )

    categories = models.ManyToManyField(
        Category,
        related_name='posts',
        related_query_name='post'  # Controls the query name
    )

# Usage
author = Author.objects.first()
author.posts.all()           # All BlogPosts by this author
author.posts.filter(title__icontains='django')  # Filter the reverse set
author.posts.count()

# related_query_name — controls the lookup name in filter()
Category.objects.filter(post__title__icontains='django')
# Without related_query_name, this would be:
Category.objects.filter(posts__title__icontains='django')

# Abstract model ForeignKey — use %(class)s pattern to avoid clashes
class Owned(models.Model):
    owner = models.ForeignKey(
        'auth.User',
        on_delete=models.CASCADE,
        related_name='%(app_label)s_%(class)s_set'
    )

    class Meta:
        abstract = True

class Article(Owned):
    title = models.CharField(max_length=200)
    # user.myapp_article_set.all()

class Photo(Owned):
    image = models.ImageField(upload_to='photos/')
    # user.myapp_photo_set.all()

# Without the %(class)s pattern, both Article and Photo would try
# to create the same reverse accessor name causing a SystemCheckError`,
      outputExplanation: "related_name is the name of the reverse accessor on the target model. related_query_name is the name used in filter() lookups across the relation. Using '+' suppresses the reverse accessor — useful when you don't need it and want to avoid name clashes.",
      commonMistakes: [
        "Forgetting related_name on abstract models — causes 'Reverse accessor clashes' errors when multiple concrete models inherit the same FK.",
        "Using the same related_name for two FKs pointing to the same model — Django raises a SystemCheckError.",
        "Confusing related_name (accessor name) with related_query_name (filter lookup name) — they serve different purposes."
      ],
      interviewNotes: [
        "Default reverse accessor: modelname_set (e.g. author.blogpost_set). Customize with related_name.",
        "related_name='+' suppresses the reverse accessor — useful for FKs you never traverse in reverse.",
        "For abstract model FKs, use '%(app_label)s_%(class)s_set' to auto-generate unique reverse names.",
        "Reverse FK relations return a Manager (RelatedManager), so you call .all(), .filter(), etc. on them.",
        "Reverse O2O returns the object directly (not a Manager) — user.profile not user.profile.all()."
      ],
      whenToUse: "Always set related_name to something meaningful when you'll traverse the reverse relation. Use related_name='+' when you define a FK but never need the reverse accessor.",
      whenNotToUse: "Do not use the default (no related_name) for production code — the default _set naming is verbose and makes code harder to read."
    },
    tags: ["related_name", "reverse-relations", "foreignkey", "models"],
    order: 23,
    estimatedMinutes: 10
  },
  {
    id: "migrations-concepts",
    title: "Migrations",
    slug: "migrations-concepts",
    category: "models",
    difficulty: "intermediate",
    description: "What migrations are, makemigrations vs migrate, migration file structure, dependencies, squashing, fake migrations, RunSQL, and RunPython.",
    content: {
      explanation: "Migrations are Django's way of propagating model changes (adding a field, creating a table) into the database schema. They are Python files stored in your app's migrations/ directory. makemigrations creates migration files from model changes. migrate applies those files to the database.",
      realExample: "Your team is building a blog. Developer A adds a 'subtitle' field to Article. They run makemigrations which creates 0002_article_subtitle.py. After committing, developer B runs migrate to apply the schema change to their local database. On deployment, the CI/CD pipeline runs migrate automatically.",
      codeExample: `# ============================================================
# BASIC COMMANDS
# ============================================================
# python manage.py makemigrations          — detect changes, create files
# python manage.py makemigrations myapp   — only for specific app
# python manage.py migrate                 — apply all pending migrations
# python manage.py migrate myapp 0003     — migrate to specific version
# python manage.py showmigrations         — list all migrations and status
# python manage.py sqlmigrate myapp 0002 — show the SQL for a migration

# ============================================================
# ANATOMY OF A MIGRATION FILE (auto-generated)
# ============================================================
# myapp/migrations/0002_article_subtitle.py

from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('myapp', '0001_initial'),  # Must run 0001 first
    ]

    operations = [
        migrations.AddField(
            model_name='article',
            name='subtitle',
            field=models.CharField(max_length=200, blank=True, default=''),
        ),
    ]

# ============================================================
# RUNPYTHON — run arbitrary Python in a migration
# ============================================================
from django.db import migrations

def populate_slugs(apps, schema_editor):
    # Use apps.get_model — never import models directly in migrations
    Article = apps.get_model('myapp', 'Article')
    from django.utils.text import slugify
    for article in Article.objects.all():
        article.slug = slugify(article.title)
        article.save()

def reverse_slugs(apps, schema_editor):
    # Reverse function — called if migration is reversed
    Article = apps.get_model('myapp', 'Article')
    Article.objects.update(slug='')

class Migration(migrations.Migration):
    dependencies = [('myapp', '0003_article_slug')]
    operations = [
        migrations.RunPython(populate_slugs, reverse_slugs),
    ]

# ============================================================
# RUNSQL — run raw SQL in a migration
# ============================================================
class Migration(migrations.Migration):
    dependencies = [('myapp', '0004_populate_slugs')]
    operations = [
        migrations.RunSQL(
            sql="CREATE INDEX CONCURRENTLY myapp_article_title_idx ON myapp_article(title);",
            reverse_sql="DROP INDEX myapp_article_title_idx;"
        ),
    ]

# ============================================================
# FAKE MIGRATIONS — for legacy databases
# ============================================================
# python manage.py migrate --fake myapp 0003
# Marks 0003 as applied without running the SQL
# Useful when the DB already has the schema but Django doesn't know

# ============================================================
# SQUASHING — reduce number of migration files
# ============================================================
# python manage.py squashmigrations myapp 0001 0010
# Creates 0001_squashed_0010_*.py replacing 0001-0010`,
      outputExplanation: "Migration files are version control for your database schema. Dependencies ensure migrations run in the correct order. RunPython is the escape hatch for data migrations — always use apps.get_model() not direct model imports to get the historical model state.",
      commonMistakes: [
        "Importing models directly in RunPython migrations — the model may have changed since that migration was created. Always use apps.get_model('app', 'ModelName').",
        "Running makemigrations without committing the migration files — teammates can't apply your schema changes.",
        "Forgetting migrate on deployment — the app code expects fields that don't exist in the DB yet.",
        "Editing migration files manually without understanding dependencies — can break the migration graph."
      ],
      interviewNotes: [
        "makemigrations detects model changes and creates migration files. migrate applies them to the DB.",
        "Migration files track the dependency graph — each migration lists which ones must run before it.",
        "RunPython receives (apps, schema_editor) — apps is a registry of historical model states.",
        "Never import models directly in migrations — use apps.get_model() for historical correctness.",
        "--fake marks a migration as applied without running it — useful for syncing Django's state with an existing schema.",
        "squashmigrations compresses many small migrations into one for faster initial setup."
      ],
      whenToUse: "Always use migrations — never manually alter the database schema in production. Migrations provide versioning, reversibility, and team synchronization.",
      whenNotToUse: "Avoid running migrations on production during high-traffic windows without testing. Use --fake for legacy database integration where the schema already exists."
    },
    tags: ["migrations", "makemigrations", "migrate", "runpython", "database"],
    order: 24,
    estimatedMinutes: 15
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Topic 25 — Choosing the Right Relationship
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: "choosing-relationships",
    title: "How to Choose the Right Relationship",
    slug: "choosing-relationships",
    category: "models",
    subcategory: "relationships",
    difficulty: "intermediate",
    description: "A practical decision guide for choosing between OneToOneField, ForeignKey, and ManyToManyField — with real-world examples and decision flowchart logic.",
    content: {
      explanation: `The 3-question test — ask these in order and you will never pick the wrong relationship.

QUESTION 1: Can ONE [A] have MULTIPLE [B]s?
If the answer is no (exactly one B per A, and exactly one A per B) → OneToOneField.
If the answer is yes (one A can have many Bs) → move to question 2.

QUESTION 2: Can ONE [B] also have MULTIPLE [A]s (in reverse)?
If no — ONE B belongs to exactly ONE A, but ONE A can have MANY Bs → ForeignKey (on B pointing to A).
If yes — MANY A relate to MANY B in both directions → ManyToManyField.

QUESTION 3 (only if M2M): Does the relationship itself carry extra data?
No extra data → plain ManyToManyField.
Yes, extra data (quantity, grade, role, date enrolled) → ManyToManyField with through= model.

──────────────────────────────────────────────────────────────
ONETOONEFIELD — the extension pattern
──────────────────────────────────────────────────────────────
Use when the related object IS an extension or profile of the main object. The hallmark is: exactly one B exists per A, and that B is conceptually part of A — it just lives in a separate table.

Real-world: User ↔ UserProfile. A user has exactly one profile. A profile belongs to exactly one user. Neither side can have multiples. Django even gives you a direct attribute — request.user.profile — no .all(), no queryset.

Also used in multi-table inheritance: when you extend a concrete model, Django creates a OneToOne under the hood linking the parent table to the child table.

──────────────────────────────────────────────────────────────
FOREIGNKEY — the ownership / parent-child pattern
──────────────────────────────────────────────────────────────
Use when MANY instances of B belong to ONE A, but B does not belong to multiple A. The FK lives on the "many" side (B), pointing at the "one" side (A).

Real-world examples:
• Many Books → One Author. The FK is on Book: book.author = ForeignKey(Author).
• Many Orders → One Customer. The FK is on Order.
• Many Comments → One BlogPost. The FK is on Comment.
• Many Invoices → One Company. The FK is on Invoice.

Reverse access uses _set by default (author.book_set.all()) or a custom related_name (author.books.all()).

──────────────────────────────────────────────────────────────
MANYTOMANYFIELD — the peer relationship pattern
──────────────────────────────────────────────────────────────
Use when MANY A relate to MANY B AND MANY B relate back to MANY A. Django creates a hidden junction table automatically.

Real-world examples:
• Book has many Tags AND a Tag applies to many Books.
• Student takes many Courses AND a Course has many Students.
• Employee works on many Projects AND a Project has many Employees.
• Article has many Authors AND an Author writes many Articles.

──────────────────────────────────────────────────────────────
THE THROUGH TABLE — when M2M needs extra data on the join
──────────────────────────────────────────────────────────────
When the relationship itself has attributes (date enrolled, role in project, quantity ordered, grade received), the auto-generated junction table cannot hold them. You declare an explicit through model and put FKs on it pointing to both sides, plus your extra fields.

──────────────────────────────────────────────────────────────
COMMON CONFUSION CASES
──────────────────────────────────────────────────────────────
"A person has one passport" → OneToOneField. Not ForeignKey — a passport does not have many persons.
"A post can have one category" → ForeignKey on Post pointing to Category. NOT OneToOne — a category can have MANY posts!
"A product belongs to one category" → ForeignKey on Product pointing to Category. One category, many products.
"A product can be in multiple categories" → ManyToManyField between Product and Category.
"A user follows other users" → Self-referential ManyToManyField with symmetrical=False (asymmetric: A follows B does not mean B follows A).`,

      realExample: `E-commerce system — every relationship type appears naturally:

USER ↔ ADDRESS
A user can have many shipping addresses (home, work, etc.) → ForeignKey on Address pointing to User.
address.user = ForeignKey(User) — the address is a child of the user.

USER ↔ CART
A user has exactly one active cart → OneToOneField on Cart pointing to User.
cart.user = OneToOneField(User) — access via user.cart directly, no .all().

PRODUCT ↔ CATEGORY
A product can belong to multiple categories (e.g. "Django Book" is in both "Books" and "Programming") → ManyToManyField.
product.categories = ManyToManyField(Category) — both sides have many of the other.

ORDER ↔ PRODUCT (through OrderItem)
An order contains many products AND a product appears in many orders → M2M. But we need quantity and unit_price on each line item → explicit through model OrderItem.
Without through=, you cannot store quantity per line. This is the most common real-world reason to add a through model.

AUTHOR ↔ BOOK
Many books belong to one author (in a simple bookstore model) → ForeignKey on Book.
book.author = ForeignKey(Author) — reverse: author.books.all() if related_name='books'.`,

      codeExample: `from django.db import models
from django.contrib.auth.models import User

# ── OneToOne: User has exactly ONE profile ──────────────────────────
class UserProfile(models.Model):
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name='profile'
    )
    bio = models.TextField(blank=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    # Access: request.user.profile      ← direct attribute, not a queryset
    # Reverse from User is automatic:  user.profile

# ── ForeignKey: Many Books → One Author ────────────────────────────
class Author(models.Model):
    name = models.CharField(max_length=200)

class Book(models.Model):
    title = models.CharField(max_length=300)
    author = models.ForeignKey(
        Author, on_delete=models.CASCADE, related_name='books'
    )
    # Access forward: book.author          ← single Author object
    # Access reverse: author.books.all()   ← QuerySet of Books

# ── ManyToMany: Articles ↔ Tags ────────────────────────────────────
class Tag(models.Model):
    name = models.CharField(max_length=50)

class Article(models.Model):
    title = models.CharField(max_length=300)
    tags = models.ManyToManyField(Tag, related_name='articles', blank=True)
    # Access forward: article.tags.all()   ← QuerySet of Tags
    # Access reverse: tag.articles.all()   ← QuerySet of Articles
    # Django auto-creates junction table: myapp_article_tags

# ── ManyToMany WITH THROUGH: needs extra data on the relationship ───
class Product(models.Model):
    name = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=8, decimal_places=2)

class Order(models.Model):
    customer = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    products = models.ManyToManyField(
        Product, through='OrderItem', related_name='orders'
    )

class OrderItem(models.Model):   # The explicit through model
    order = models.ForeignKey(Order, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=8, decimal_places=2)

    class Meta:
        unique_together = ('order', 'product')

# With through=, you CANNOT use: order.products.add(product)
# You must create: OrderItem.objects.create(order=o, product=p, quantity=2, unit_price=9.99)

# ── DECISION QUESTIONS IN CODE ──────────────────────────────────────
# Q1: Can there be MANY B for ONE A?
#   No (exactly one)  → OneToOneField
#   Yes               → ForeignKey or ManyToMany

# Q2: Can there be MANY A for ONE B (reverse direction)?
#   No  → ForeignKey  (ownership is directional: B is a child of A)
#   Yes → ManyToManyField

# Q3: Does the relationship itself have attributes?
#   Yes → ManyToManyField with through= model
#   No  → plain ManyToManyField`,

      outputExplanation: `OneToOneField generates a UNIQUE FK column in the DB. At the Python layer this means .profile returns an object (not a queryset), and accessing a non-existent related object raises a RelatedObjectDoesNotExist exception (a subclass of DoesNotExist). Always use hasattr(user, 'profile') or a try/except when the related object might not exist yet.

ForeignKey generates an ordinary FK column (e.g. author_id) with a DB-level foreign key constraint. The reverse manager (author.books) is a RelatedManager — it supports .all(), .filter(), .count(), and .create(). Use select_related('author') to fetch the FK in a single SQL JOIN and avoid N+1 queries.

ManyToManyField generates a junction table with two FK columns. Django names it appname_modelname_fieldname by default. The M2M manager supports .add(), .remove(), .set(), .clear(), and .all(). Use prefetch_related('tags') for M2M — select_related does not work with M2M because it is not a single JOIN. With a through= model, .add()/.remove()/.set() are disabled — you manage the through model rows directly.`,

      commonMistakes: [
        "Using ForeignKey when you mean OneToOneField: ForeignKey(User, unique=True) works but is semantically wrong and gives you a queryset on the reverse — OneToOneField gives direct attribute access. Only use ForeignKey when the reverse can return multiple rows.",
        "Using OneToOneField when a ForeignKey is correct: 'A post has ONE category' is a common trap. The category can have MANY posts — so it's ForeignKey on Post pointing to Category, not OneToOneField.",
        "Forgetting through= when M2M needs extra data: adding a field to an M2M after the fact requires converting it to a through model and writing a data migration — do it upfront when you know you'll need extra relationship data.",
        "Not setting related_name on multiple FK or M2M pointing to the same model: if Author has two FKs to User (created_by and approved_by), Django raises a system check error for clashing reverse accessors. Always give each a unique related_name.",
        "Confusing symmetrical M2M: a self-referential M2M like Person.friends is symmetrical by default — if A friends B, B friends A automatically. For follower/following (asymmetric), set symmetrical=False explicitly."
      ],

      interviewNotes: [
        "OneToOne is implemented as a ForeignKey with unique=True at the database level — the difference is purely at the ORM layer: direct attribute access vs .all(). Interviewers love asking this.",
        "ManyToMany creates a hidden junction table automatically. The table name follows the pattern appname_modelname_fieldname. You can override it with db_table on the Meta of your through model.",
        "select_related() works with ForeignKey and OneToOneField only (SQL JOIN). prefetch_related() is required for ManyToMany and reverse FK lookups. Mixing them up silently causes N+1 query problems.",
        "A through model disables .add() / .remove() / .set() on the M2M field entirely — Django raises AttributeError. You must create or delete through model instances directly via its manager.",
        "RelatedManager vs ManyRelatedManager: FK reverse relations return a RelatedManager (like a queryset manager). M2M fields give a ManyRelatedManager. Both support .all() and .filter() but the M2M manager also exposes .add(), .remove(), .set(), .clear()."
      ],

      whenToUse: "Use OneToOneField when the relationship is truly 1:1 in both directions and the related object IS conceptually an extension of the main object (UserProfile, AuthorBio, CompanySettings). Use ForeignKey when many instances of a child point to one parent and the child does not belong to multiple parents (Book → Author, Comment → Post). Use ManyToManyField when both sides can have multiple of the other (Article ↔ Tag, Student ↔ Course). Add a through= model whenever the M2M relationship itself carries data you need to store (quantity, grade, role, date).",

      whenNotToUse: "Do not use OneToOneField just because you want unique=True on a FK — only use it when access is truly 1:1 in both directions and the object is an extension of the other. Do not use M2M when the relationship is clearly directional ownership (posts don't own their author — ForeignKey is correct). Do not use M2M without a through model when you know you will need extra fields on the join — converting later requires a data migration and is painful at scale."
    },
    tags: ["relationships", "onetoonefield", "foreignkey", "manytomanyfield", "design"],
    order: 25,
    estimatedMinutes: 20
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Topic 26 — on_delete Options In Depth
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: "on-delete-options",
    title: "on_delete Options In Depth",
    slug: "on-delete-options",
    category: "models",
    difficulty: "intermediate",
    description: "A deep dive into all 6 on_delete options for ForeignKey and OneToOneField — what each does at the database level, when to use each, and the consequences of choosing wrong.",
    content: {
      explanation: `on_delete tells Django what to do with rows that hold a ForeignKey (or OneToOneField) when the referenced row is deleted. It has been required since Django 2.0 — omitting it raises TypeError. Before 2.0 it silently defaulted to CASCADE, which caused many accidental mass-deletions in production.

There are 6 options. Each one answers the question: "The parent is gone — what happens to the child?"

──────────────────────────────────────────────────────────────
CASCADE — "If parent dies, I die too"
──────────────────────────────────────────────────────────────
When the referenced object is deleted, Django also deletes every object that FK-points to it. This chains recursively: if A cascades to B and B cascades to C, deleting A destroys B and C.

Equivalent to SQL ON DELETE CASCADE, but Django enforces it in Python, not via a DB trigger.

Use when: the child object is meaningless without its parent. A Comment without its BlogPost makes no sense. An OrderItem without its Order is orphaned garbage. An Image without its Product serves no purpose.

Risk: accidental mass-deletion. Deleting a single User in a system where Posts, Comments, Orders, Reviews all cascade from User wipes everything at once. Django admin shows a confirmation listing what will be deleted — pay attention to it.

Important: Django fires pre_delete and post_delete signals for each cascaded object. Deleting a Post with 10,000 Comments fires 10,001 signal pairs — a potential performance hazard.

──────────────────────────────────────────────────────────────
PROTECT — "Parent cannot die while I exist"
──────────────────────────────────────────────────────────────
Raises django.db.models.ProtectedError (a subclass of IntegrityError) if you try to delete the referenced object while child rows still exist. The deletion is blocked at the Django level before any SQL runs.

Use when: the parent is reference data that should not disappear while in use. You should not be able to delete a Category that still has 200 Products assigned to it. The error forces whoever is deleting to clean up first — deliberately.

This is the safest option for lookup tables and reference data. It prevents accidents by making deletion explicit.

──────────────────────────────────────────────────────────────
SET_NULL — "If parent dies, I become an orphan (null)"
──────────────────────────────────────────────────────────────
Sets the FK column to NULL when the referenced object is deleted. Requires null=True (and usually blank=True) on the FK field — otherwise Django rejects the migration.

Use when: the child record has independent value and you want to keep it but mark it as de-linked. Common in audit and archival patterns: delete an Author, but keep their Articles around with author=NULL so the content is not lost.

Also useful for soft-delete patterns where you want to know something was associated with a now-deleted entity.

──────────────────────────────────────────────────────────────
SET_DEFAULT — "If parent dies, give me a new default parent"
──────────────────────────────────────────────────────────────
Sets the FK column to the field's default= value when the referenced object is deleted. You must set a default= on the field. The default value is typically the PK of a sentinel/placeholder record.

Use when: orphaned records should be reassigned to a known placeholder rather than go NULL. Example: all Posts by a deleted User get reassigned to a "system" or "staff" account (pk=1).

Fragile across environments: pk=1 might be a different record in staging vs production. Use carefully and ensure the default record always exists.

──────────────────────────────────────────────────────────────
SET(value_or_callable) — "Call this function to find my new parent"
──────────────────────────────────────────────────────────────
Sets the FK to a specific value or the return value of a callable. More flexible than SET_DEFAULT because the function is called at deletion time, not at import time.

Critical rule: never pass an object instance to SET(). SET(User.objects.get(username='admin')) evaluates at import time — the object might not exist when the code is first loaded. Always pass a callable: SET(get_sentinel_user) where get_sentinel_user is a function that returns a PK.

Use when: the replacement object cannot be expressed as a simple default= because you need logic to find it dynamically (get-or-create a sentinel, pick from multiple candidates based on context).

──────────────────────────────────────────────────────────────
DO_NOTHING — "I don't care — deal with it yourself"
──────────────────────────────────────────────────────────────
Django does absolutely nothing at the ORM level. The database then handles it. If there is a DB-level FK constraint (the default), the database will raise an IntegrityError when you delete the parent. If db_constraint=False, the FK column holds a dangling reference — the parent row is gone, but the child still has the old PK in its column. Accessing the related object via the ORM (log.user) will raise DoesNotExist or return stale data depending on caching.

Use with extreme care: only when you manage referential integrity yourself — raw SQL, DB triggers, or intentionally denormalized archive/log tables where the FK is purely informational and you never join on it.

──────────────────────────────────────────────────────────────
DATABASE-LEVEL VS DJANGO-LEVEL
──────────────────────────────────────────────────────────────
Django's on_delete behavior is enforced in Python by the ORM, not by a database trigger. Django does add FK constraints to the DB schema, but the cascade/protect/set-null logic runs in Python. If you bypass Django and delete directly via raw SQL, on_delete behavior is NOT applied. Only the DB-level FK constraint (if present) will trigger.

Exception: DO_NOTHING with db_constraint=True lets the DB raise the error itself.

──────────────────────────────────────────────────────────────
BULK DELETION AND SIGNALS
──────────────────────────────────────────────────────────────
When using CASCADE, Django fires pre_delete and post_delete signals for each cascaded object individually. However, QuerySet.delete() (bulk delete via SQL) may not fire signals for all cascaded rows in complex scenarios — Django uses SQL DELETE directly for simple cases and may only fire signals for the directly deleted objects. Always verify signal behavior if you rely on signals with bulk operations.`,

      realExample: `Online bookstore — all 6 options appear naturally:

CASCADE: Comment on a Book review.
When a Book is deleted (taken off the store), all its Comments and Ratings should also disappear — they have no meaning without the book. on_delete=CASCADE on Comment.book.

PROTECT: Book in a Genre.
You should not be able to delete the "Fantasy" Genre while 500 Books are still in it. Deletion is blocked until books are reassigned. on_delete=PROTECT on Book.genre.

SET_NULL: Article with an Author who deletes their account.
The article content is valuable — it should remain on the site with author=NULL (shown as "Anonymous" in the UI). on_delete=SET_NULL, null=True on Article.author.

SET_DEFAULT: Staff post reassigned on employee departure.
A staff member leaves, but their published posts should show under a "Staff" account (pk=1). on_delete=SET_DEFAULT, default=1 on Post.author.

SET(callable): Order reassigned to a sentinel user.
On GDPR deletion of a User, their Orders should be kept for financial records but point to a sentinel "deleted_user" account fetched dynamically. on_delete=SET(get_sentinel_user) on Order.customer.

DO_NOTHING + db_constraint=False: Append-only event log.
A log table recording every user action stores user_id as a plain integer column with db_constraint=False. When a user is deleted, the log rows are intentionally preserved with the stale user_id — they are used only for analytics queries that know the user is gone. on_delete=DO_NOTHING.`,

      codeExample: `from django.db import models
from django.contrib.auth.models import User

# ── CASCADE — delete child rows when parent is deleted ──────────────
class Post(models.Model):
    title = models.CharField(max_length=200)

class Comment(models.Model):
    post = models.ForeignKey(
        Post, on_delete=models.CASCADE, related_name='comments'
    )
    body = models.TextField()
# Post.objects.get(pk=1).delete()
# → deletes the Post AND all its Comments automatically

# ── PROTECT — block parent deletion while children exist ────────────
class Category(models.Model):
    name = models.CharField(max_length=100)

class Product(models.Model):
    name = models.CharField(max_length=200)
    category = models.ForeignKey(Category, on_delete=models.PROTECT)
# Category.objects.get(pk=1).delete()
# → raises ProtectedError: "Cannot delete some instances of model
#   'Category' because they are referenced through protected FK
#   'Product.category'"

# ── SET_NULL — orphan the child row (null out the FK) ───────────────
class OrderItem(models.Model):
    product = models.ForeignKey(
        Product,
        on_delete=models.SET_NULL,
        null=True,    # ← required, or migration fails
        blank=True,
    )
    quantity = models.PositiveIntegerField()
# Product deleted → orderitem.product is None, orderitem.product_id is NULL

# ── SET_DEFAULT — assign a default replacement parent ───────────────
class Article(models.Model):
    author = models.ForeignKey(
        User,
        on_delete=models.SET_DEFAULT,
        default=1,    # ← pk of the "staff" sentinel user
    )
    title = models.CharField(max_length=200)
# User(pk=5) deleted → article.author_id becomes 1 for all their articles

# ── SET(callable) — dynamically resolve the replacement ────────────
def get_sentinel_user():
    # Called at deletion time, not at import time
    return User.objects.get_or_create(username='deleted_user')[0].pk

class UserPost(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.SET(get_sentinel_user),
        null=True,
    )
    content = models.TextField()
# User deleted → get_sentinel_user() is called → post.user = sentinel

# ── DO_NOTHING + db_constraint=False — dangling reference (use carefully) ──
class EventLog(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.DO_NOTHING,
        db_constraint=False,  # No FK constraint in DB schema
    )
    action = models.CharField(max_length=100)
    logged_at = models.DateTimeField(auto_now_add=True)
# User deleted → log rows remain with stale user_id
# log.user → raises User.DoesNotExist (user is gone from DB)
# log.user_id → still holds the old integer PK

# ── Quick reference ─────────────────────────────────────────────────
# CASCADE      → "If parent dies, I die too"
# PROTECT      → "Parent cannot die while I exist"
# SET_NULL     → "If parent dies, my FK becomes NULL"
# SET_DEFAULT  → "If parent dies, I get the default parent"
# SET(fn)      → "If parent dies, fn() picks my new parent"
# DO_NOTHING   → "I don't care — DB or I handle it manually"`,

      outputExplanation: `CASCADE is the most frequently used option but also the most dangerous if misapplied. Django shows a deletion summary in the admin UI specifically because of CASCADE — it lists every related object that will be deleted. In code, you should explicitly understand the cascade chain before calling .delete() on any object with downstream relationships.

PROTECT raises django.db.models.ProtectedError, which is a subclass of django.db.IntegrityError. Catch it as: except models.ProtectedError as e: — e.protected_objects gives you the set of objects that blocked the deletion.

SET_NULL silently sets the FK column to NULL. The child row remains in the DB and is visible in querysets — but filtering on the FK (Product.objects.filter(author__isnull=False)) will exclude those orphaned rows. Make sure your UI handles the null case gracefully (display "Unknown" or "Deleted User" rather than crashing on NoneType).

SET_DEFAULT and SET() both write a new FK value to the child rows at deletion time. Django does this with a SQL UPDATE before the DELETE — so the replacement parent must exist in the DB at the time of deletion or you get an IntegrityError.

DO_NOTHING with db_constraint=True: the DB FK constraint fires and raises django.db.IntegrityError when you try to delete the parent. With db_constraint=False: the delete succeeds, but the FK column now holds a PK that references nothing. Any subsequent ORM traversal on that FK field raises DoesNotExist.`,

      commonMistakes: [
        "Using CASCADE on financial or legal records (Orders, Invoices, Payments): deleting a User should not silently erase their purchase history. Use PROTECT or SET_NULL for records that must be preserved for business or compliance reasons.",
        "Forgetting null=True when using SET_NULL: Django will reject the migration with a ValueError — the field must allow NULL before you can set it to NULL. Always pair SET_NULL with null=True (and blank=True for forms).",
        "Passing an object instance to SET(): SET(User.objects.get(username='admin')) evaluates at module import time — if the admin user doesn't exist yet (fresh DB), this raises DoesNotExist on startup. Always pass a callable: SET(lambda: User.objects.get(username='admin').pk).",
        "Using DO_NOTHING without db_constraint=False: you said 'do nothing' but the database FK constraint still fires IntegrityError when you delete the parent — which is confusing and looks like the option is broken.",
        "Not considering cascade chains: CASCADE on A→B and CASCADE on B→C means deleting one A row deletes all B rows for that A and all C rows for those Bs. In production this can wipe thousands of rows from a single .delete() call. Always trace the full cascade tree before deploying."
      ],

      interviewNotes: [
        "on_delete is required since Django 2.0 — omitting it raises TypeError. Before 2.0 it defaulted silently to CASCADE, which caused many accidental mass-deletions. This is a common interview trivia question.",
        "Django enforces on_delete in Python, not via a DB trigger. If you run raw SQL DELETE on the parent, the on_delete behavior does NOT run — only the DB-level FK constraint fires.",
        "PROTECT vs SET_NULL: use PROTECT when the parent is source-of-truth and its children are meaningless without it. Use SET_NULL when the child records have independent value and should outlive the parent.",
        "CASCADE fires pre_delete and post_delete signals for each cascaded object individually. For a Post with 10,000 comments, deleting the post fires 10,001 pre_delete signals — a real performance issue at scale.",
        "In high-traffic systems, PROTECT is often safer than CASCADE for critical data tables. It forces explicit cleanup and prevents a single misguided .delete() call from cascading into a production incident."
      ],

      whenToUse: "CASCADE for child objects that have no meaning without their parent — comments, order items, product images, session tokens. PROTECT for reference/lookup data that must not disappear while in use — categories, genres, currency codes. SET_NULL for historical data that should be preserved but can be de-linked — audit logs, old orders when a user account is removed. SET_DEFAULT or SET() for reassignment patterns where orphaned rows should point to a known sentinel or fallback record. DO_NOTHING only for denormalized archive/log tables where you intentionally manage referential integrity outside Django.",

      whenNotToUse: "Avoid CASCADE on any table that holds financial, legal, or compliance data — soft-delete or archive those records instead of destroying them. Avoid DO_NOTHING without also setting db_constraint=False, or you will get confusing IntegrityErrors that look like the option is not working. Avoid SET_DEFAULT with a hardcoded pk=1 if that row's existence is not guaranteed across all environments (development, staging, production) — the migration will succeed but deletions will fail at runtime."
    },
    tags: ["on_delete", "cascade", "protect", "set_null", "foreignkey", "database"],
    order: 26,
    estimatedMinutes: 18
  }
];

export default modelTopics;

export const drfSerializersTopics = [
  {
    id: "serializer-intro",
    title: "Serializers Introduction",
    slug: "serializer-intro",
    category: "drf-serializers",
    difficulty: "beginner",
    description: "Understand what serializers are, why they're essential in DRF, and how they convert complex data types to/from Python datatypes and JSON.",
    content: {
      explanation: "Serializers in Django REST Framework convert complex data types (querysets, model instances) into native Python datatypes that can then be easily rendered into JSON, XML, or other content types. They also handle deserialization — parsing incoming data and converting it back to complex types after validating it. Think of serializers as the bridge between your Django models and JSON API responses.",
      realExample: "A User model has fields like id, username, email, password, date_joined. When you send this data as JSON to a mobile app, you don't want to expose the password field. A serializer lets you select which fields to expose, add computed fields (like full_name from first_name + last_name), and format dates consistently. Incoming POST data gets validated by the serializer before creating the User object.",
      codeExample: `# models.py
from django.db import models

class Book(models.Model):
    title = models.CharField(max_length=200)
    author = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=6, decimal_places=2)
    published_date = models.DateField()
    is_available = models.BooleanField(default=True)

# serializers.py
from rest_framework import serializers
from .models import Book

class BookSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    title = serializers.CharField(max_length=200)
    author = serializers.CharField(max_length=100)
    price = serializers.DecimalField(max_digits=6, decimal_places=2)
    published_date = serializers.DateField()
    is_available = serializers.BooleanField(default=True)

    def create(self, validated_data):
        """Create and return a new Book instance."""
        return Book.objects.create(**validated_data)

    def update(self, instance, validated_data):
        """Update and return an existing Book instance."""
        instance.title = validated_data.get('title', instance.title)
        instance.author = validated_data.get('author', instance.author)
        instance.price = validated_data.get('price', instance.price)
        instance.published_date = validated_data.get('published_date', instance.published_date)
        instance.is_available = validated_data.get('is_available', instance.is_available)
        instance.save()
        return instance

# views.py
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

@api_view(['GET', 'POST'])
def book_list(request):
    if request.method == 'GET':
        books = Book.objects.all()
        serializer = BookSerializer(books, many=True)  # many=True for queryset
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = BookSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()  # Calls create()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)`,
      outputExplanation: "GET returns: {'id': 1, 'title': 'Django Guide', 'author': 'John', 'price': '29.99', 'published_date': '2024-01-15', 'is_available': true}. POST with JSON creates a Book object after validation. Invalid data returns: {'title': ['This field is required'], 'price': ['A valid number is required']}.",
      commonMistakes: [
        "Forgetting many=True when serializing querysets — DRF tries to serialize the queryset itself instead of individual objects.",
        "Not calling serializer.is_valid() before serializer.save() — invalid data will be saved without validation.",
        "Returning serializer.data before calling save() — .data triggers validation and might not exist yet.",
        "Not implementing create() and update() methods — serializer.save() will fail on custom Serializer classes (not needed for ModelSerializer)."
      ],
      interviewNotes: [
        "Serializers handle both serialization (model → JSON) and deserialization (JSON → model).",
        "serializer.data returns the serialized representation (read-only).",
        "serializer.validated_data contains the clean data after calling is_valid().",
        "serializer.save() calls create() or update() depending on whether an instance was passed.",
        "Many=True parameter serializes a list/queryset of objects instead of a single object."
      ],
      whenToUse: "Always — every API endpoint that sends or receives JSON should use a serializer.",
      whenNotToUse: "For simple JSON responses without model data (like health checks or status messages) — use Response({'status': 'ok'}) directly."
    },
    tags: ["serializers", "drf", "json", "validation"],
    order: 1,
    estimatedMinutes: 12
  },
  {
    id: "modelserializer",
    title: "ModelSerializer",
    slug: "modelserializer",
    category: "drf-serializers",
    difficulty: "beginner",
    description: "Learn how ModelSerializer automatically generates serializer fields from Django models, reducing boilerplate dramatically.",
    content: {
      explanation: "ModelSerializer is a shortcut that automatically generates serializer fields based on a Django model. It provides default create() and update() implementations, so you don't need to write them manually. Specify the model and fields in a Meta class, and DRF does the rest. It's the most common serializer type — use it unless you need custom behavior.",
      realExample: "Instead of writing 20 lines defining fields manually for a User model (id, username, email, first_name, last_name, date_joined, etc.), ModelSerializer generates them automatically from the model definition. You just specify which fields to include or exclude. It also handles ForeignKey and ManyToMany fields automatically.",
      codeExample: `# models.py
from django.db import models

class Author(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    bio = models.TextField(blank=True)

class Book(models.Model):
    title = models.CharField(max_length=200)
    author = models.ForeignKey(Author, on_delete=models.CASCADE, related_name='books')
    price = models.DecimalField(max_digits=6, decimal_places=2)
    published_date = models.DateField()
    isbn = models.CharField(max_length=13, unique=True)

# serializers.py
from rest_framework import serializers

# Simple ModelSerializer
class BookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Book
        fields = ['id', 'title', 'author', 'price', 'published_date', 'isbn']
        # OR use __all__ to include all fields
        # fields = '__all__'
        # OR exclude specific fields
        # exclude = ['isbn']

# Read-only fields
class BookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Book
        fields = ['id', 'title', 'author', 'price', 'published_date', 'isbn']
        read_only_fields = ['id', 'published_date']  # Can't be set via API

# Adding custom fields
class BookSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.name', read_only=True)
    days_since_published = serializers.SerializerMethodField()

    class Meta:
        model = Book
        fields = ['id', 'title', 'author', 'author_name', 'price', 'published_date', 'days_since_published']

    def get_days_since_published(self, obj):
        from datetime import date
        return (date.today() - obj.published_date).days

# Nested serializers
class AuthorSerializer(serializers.ModelSerializer):
    books = BookSerializer(many=True, read_only=True)  # Nested

    class Meta:
        model = Author
        fields = ['id', 'name', 'email', 'bio', 'books']`,
      outputExplanation: "GET /books/1/ returns: {'id': 1, 'title': 'Django Guide', 'author': 2, 'author_name': 'John Doe', 'price': '29.99', 'published_date': '2024-01-15', 'days_since_published': 105}. Nested AuthorSerializer returns: {'id': 2, 'name': 'John Doe', 'email': 'john@example.com', 'bio': '...', 'books': [{...}, {...}]}.",
      commonMistakes: [
        "Using fields = '__all__' in production — exposes all model fields including sensitive data like passwords. Always whitelist fields explicitly.",
        "Not setting read_only=True on ForeignKey when you don't want it writable — clients can change the author by sending a different ID.",
        "Forgetting many=True on reverse relations (like books = BookSerializer()) — it will only serialize the first book.",
        "Using nested writable serializers without implementing create()/update() — DRF doesn't handle nested writes automatically.",
        "Not using source parameter when the serializer field name differs from the model field."
      ],
      interviewNotes: [
        "ModelSerializer auto-generates fields from the model, including validators.",
        "Meta.fields controls which fields to include. Use __all__, specific list, or exclude.",
        "read_only_fields prevents fields from being set via POST/PUT.",
        "SerializerMethodField creates computed fields via get_<field_name>() method.",
        "source='related.field' lets you access nested model fields (dot notation).",
        "Nested serializers create one-to-many representations but are read-only by default."
      ],
      whenToUse: "Default choice for 95% of cases — when you're serializing a Django model.",
      whenNotToUse: "When the serializer doesn't map to a single model (aggregating data from multiple models), or when you need complex custom validation logic."
    },
    tags: ["modelserializer", "drf", "meta", "fields"],
    order: 2,
    estimatedMinutes: 14
  },
  {
    id: "serializer-validation",
    title: "Serializer Validation",
    slug: "serializer-validation",
    category: "drf-serializers",
    difficulty: "intermediate",
    description: "Master field-level validation, object-level validation, and custom validators to ensure data integrity.",
    content: {
      explanation: "DRF provides multiple layers of validation: field-level validators (on individual fields), validate_<field_name>() methods for single-field validation, and validate() for multi-field validation. Validators run before save(), and any ValidationError raised returns a 400 response. You can also create reusable custom validators as functions.",
      realExample: "A BookSerializer needs to ensure: (1) price is positive, (2) published_date isn't in the future, (3) title doesn't contain profanity, (4) if book is marked as 'featured', price must be less than $50. Field validators handle #1 and #2, validate_title() handles #3, and validate() handles #4 (multi-field rule).",
      codeExample: `from rest_framework import serializers
from django.core.validators import MinValueValidator
from datetime import date

# Custom reusable validator
def validate_isbn(value):
    """Ensure ISBN-13 format."""
    if not value.isdigit() or len(value) != 13:
        raise serializers.ValidationError("ISBN must be exactly 13 digits.")
    return value

# Field-level validation
class BookSerializer(serializers.ModelSerializer):
    # Inline validators on fields
    price = serializers.DecimalField(
        max_digits=6,
        decimal_places=2,
        validators=[MinValueValidator(0.01)]  # Must be positive
    )
    isbn = serializers.CharField(validators=[validate_isbn])

    class Meta:
        model = Book
        fields = ['id', 'title', 'price', 'published_date', 'isbn', 'is_featured']

    # Single-field method validation
    def validate_title(self, value):
        """Ensure title doesn't contain profanity."""
        forbidden_words = ['spam', 'badword']
        if any(word in value.lower() for word in forbidden_words):
            raise serializers.ValidationError("Title contains forbidden words.")
        return value

    def validate_published_date(self, value):
        """Ensure date is not in the future."""
        if value > date.today():
            raise serializers.ValidationError("Published date cannot be in the future.")
        return value

    # Multi-field object-level validation
    def validate(self, data):
        """Ensure featured books cost less than $50."""
        if data.get('is_featured') and data.get('price') >= 50:
            raise serializers.ValidationError({
                'price': "Featured books must cost less than $50."
            })

        # Ensure title and author combination is unique
        title = data.get('title')
        author = data.get('author')
        if self.instance is None:  # Creating new object
            if Book.objects.filter(title=title, author=author).exists():
                raise serializers.ValidationError(
                    "A book with this title and author already exists."
                )

        return data

# UniqueValidator for field uniqueness
from rest_framework.validators import UniqueValidator

class AuthorSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
        validators=[UniqueValidator(queryset=Author.objects.all())]
    )

    class Meta:
        model = Author
        fields = ['id', 'name', 'email']

# UniqueTogetherValidator for model-level constraints
from rest_framework.validators import UniqueTogetherValidator

class BookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Book
        fields = ['id', 'title', 'author', 'isbn']
        validators = [
            UniqueTogetherValidator(
                queryset=Book.objects.all(),
                fields=['title', 'author'],
                message="This author already has a book with this title."
            )
        ]`,
      outputExplanation: "POST with price=-10 returns 400: {'price': ['Ensure this value is greater than or equal to 0.01.']}. POST with future date returns: {'published_date': ['Published date cannot be in the future.']}. POST with is_featured=true & price=60 returns: {'price': 'Featured books must cost less than $50.'}.",
      commonMistakes: [
        "Validating in create()/update() instead of validate() — validation should happen before save, not during.",
        "Not returning the value in validate_<field>() methods — this causes the field to be None.",
        "Raising Exception instead of ValidationError — DRF won't catch it and will return 500 instead of 400.",
        "Using validate() for single-field checks when validate_<field>() is cleaner.",
        "Not checking self.instance in validate() when uniqueness depends on create vs update — updates will fail if the object already exists."
      ],
      interviewNotes: [
        "Validation order: field validators → validate_<field>() → validate().",
        "validate_<field>(value) validates a single field. Must return the value or raise ValidationError.",
        "validate(data) validates the entire object. Useful for cross-field validation.",
        "Return a dict of field errors from validate() to specify which field failed.",
        "UniqueValidator handles unique field constraints (replaces model's unique=True validation).",
        "UniqueTogetherValidator handles unique_together model constraints.",
        "Always raise serializers.ValidationError, not ValueError or Exception."
      ],
      whenToUse: "Always add validation — never trust client input. Field validators for simple rules, validate() for complex/multi-field rules.",
      whenNotToUse: "For database-level constraints like ForeignKey integrity — Django/DB handles those automatically."
    },
    tags: ["validation", "validators", "errors", "unique"],
    order: 3,
    estimatedMinutes: 16
  },
  {
    id: "nested-serializers",
    title: "Nested Serializers",
    slug: "nested-serializers",
    category: "drf-serializers",
    difficulty: "intermediate",
    description: "Learn how to serialize related objects, handle nested writes, and optimize queries with prefetch_related/select_related.",
    content: {
      explanation: "Nested serializers display related objects inline. For example, a Book serializer can include the full Author object instead of just the author ID. By default, nested serializers are read-only. To support nested writes (creating/updating related objects), you must override create()/update() and handle the nested data manually. Always use prefetch_related() or select_related() to avoid N+1 queries.",
      realExample: "A Blog API endpoint GET /posts/ returns a list of posts. Instead of returning author: 5, you want author: {'id': 5, 'name': 'John', 'avatar': '...'}. Nested serializers make this automatic. For write operations, when creating a post via POST /posts/, the client might send {'title': '...', 'author': {'name': 'Jane'}} to create a new author inline — you need custom create() logic to handle this.",
      codeExample: `# models.py
class Author(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)

class Book(models.Model):
    title = models.CharField(max_length=200)
    author = models.ForeignKey(Author, on_delete=models.CASCADE, related_name='books')
    price = models.DecimalField(max_digits=6, decimal_places=2)

# serializers.py - READ-ONLY nested
class AuthorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Author
        fields = ['id', 'name', 'email']

class BookSerializer(serializers.ModelSerializer):
    author = AuthorSerializer(read_only=True)  # Nested, read-only
    author_id = serializers.PrimaryKeyRelatedField(
        queryset=Author.objects.all(),
        source='author',
        write_only=True  # Used for writes
    )

    class Meta:
        model = Book
        fields = ['id', 'title', 'author', 'author_id', 'price']

# GET /books/1/ → {'id': 1, 'title': 'Django', 'author': {'id': 2, 'name': 'John'}, 'price': '29.99'}
# POST /books/ → send {'title': '...', 'author_id': 2, 'price': '19.99'}

# WRITABLE nested serializer
class BookSerializer(serializers.ModelSerializer):
    author = AuthorSerializer()  # Nested, writable

    class Meta:
        model = Book
        fields = ['id', 'title', 'author', 'price']

    def create(self, validated_data):
        author_data = validated_data.pop('author')
        # Create or get the author
        author, created = Author.objects.get_or_create(
            email=author_data['email'],
            defaults={'name': author_data['name']}
        )
        book = Book.objects.create(author=author, **validated_data)
        return book

    def update(self, instance, validated_data):
        author_data = validated_data.pop('author', None)
        if author_data:
            # Update author fields
            for attr, value in author_data.items():
                setattr(instance.author, attr, value)
            instance.author.save()

        # Update book fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance

# Reverse nested (books in author)
class AuthorDetailSerializer(serializers.ModelSerializer):
    books = BookSerializer(many=True, read_only=True)

    class Meta:
        model = Author
        fields = ['id', 'name', 'email', 'books']

# GET /authors/1/ → {'id': 1, 'name': 'John', 'email': '...', 'books': [{...}, {...}]}

# IMPORTANT: Optimize queries
# views.py
from rest_framework import generics

class BookListView(generics.ListAPIView):
    queryset = Book.objects.select_related('author')  # JOIN to avoid N+1
    serializer_class = BookSerializer

class AuthorDetailView(generics.RetrieveAPIView):
    queryset = Author.objects.prefetch_related('books')  # Separate query for reverse FK
    serializer_class = AuthorDetailSerializer`,
      outputExplanation: "Without select_related, 100 books causes 101 queries (1 for books, 100 for authors). With select_related, only 1 query with JOIN. For reverse relations (books in Author), prefetch_related uses 2 queries: one for Author, one for all books, then joins in Python. Still better than N+1.",
      commonMistakes: [
        "Forgetting to make nested serializer read_only — DRF allows writes but doesn't handle them, causing silent failures.",
        "Not implementing create()/update() for writable nested serializers — nested data is ignored.",
        "Not using select_related/prefetch_related — causes N+1 query problem on list endpoints.",
        "Using select_related for ManyToMany or reverse ForeignKey — it only works for forward ForeignKey and OneToOne. Use prefetch_related instead.",
        "Creating duplicate related objects in nested writes instead of checking if they exist first."
      ],
      interviewNotes: [
        "Nested serializers are read-only by default.",
        "For writable nested serializers, override create()/update() and handle nested data manually.",
        "Use separate read/write fields: nested serializer for reads, PrimaryKeyRelatedField for writes.",
        "select_related (JOIN) for ForeignKey and OneToOne forward relations.",
        "prefetch_related (separate query + Python join) for ManyToMany and reverse FK.",
        "drf-writable-nested package automates writable nested serializers (third-party).",
        "Depth parameter: Meta.depth = 1 auto-nests one level deep, but is read-only."
      ],
      whenToUse: "When you need full object details in responses instead of just IDs. Essential for mobile/SPA frontends to reduce API calls.",
      whenNotToUse: "For simple list views where nested data isn't needed — it bloats response size. Use a separate detail endpoint instead."
    },
    tags: ["nested", "relations", "select_related", "prefetch"],
    order: 4,
    estimatedMinutes: 18
  },
  {
    id: "serializer-fields",
    title: "Serializer Fields Deep Dive",
    slug: "serializer-fields",
    category: "drf-serializers",
    difficulty: "intermediate",
    description: "Master all serializer field types: CharField, IntegerField, DateTimeField, FileField, custom fields, and field parameters.",
    content: {
      explanation: "DRF provides field types for every common data type: CharField, EmailField, IntegerField, FloatField, DecimalField, BooleanField, DateField, DateTimeField, TimeField, FileField, ImageField, JSONField, ListField, DictField, and more. Each field accepts parameters like required, allow_null, allow_blank, default, validators, read_only, write_only, source, and help_text. Understanding these is crucial for building robust APIs.",
      realExample: "A UserSerializer for user registration needs: email (required, validated, unique), password (write-only, minimum 8 chars), first_name (optional, trimmed), avatar (optional file upload), date_joined (auto, read-only), is_active (default True), profile_data (JSON field for flexible metadata). Each field type and parameter combination enforces a specific constraint.",
      codeExample: `from rest_framework import serializers
from django.contrib.auth.models import User

class UserSerializer(serializers.ModelSerializer):
    # String fields
    email = serializers.EmailField(required=True)
    first_name = serializers.CharField(max_length=30, allow_blank=True, trim_whitespace=True)
    bio = serializers.CharField(allow_blank=True, allow_null=True, style={'base_template': 'textarea.html'})

    # Password field (write-only)
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        min_length=8
    )

    # Numeric fields
    age = serializers.IntegerField(min_value=0, max_value=120, allow_null=True)
    rating = serializers.FloatField(min_value=0.0, max_value=5.0, default=0.0)
    salary = serializers.DecimalField(max_digits=10, decimal_places=2, allow_null=True)

    # Boolean
    is_active = serializers.BooleanField(default=True)
    is_verified = serializers.BooleanField(read_only=True)

    # Date/Time
    date_joined = serializers.DateTimeField(read_only=True)
    birth_date = serializers.DateField(allow_null=True, input_formats=['%Y-%m-%d'])
    last_login = serializers.DateTimeField(read_only=True, format='%Y-%m-%d %H:%M:%S')

    # File fields
    avatar = serializers.ImageField(allow_null=True, required=False)
    resume = serializers.FileField(allow_null=True, required=False)

    # Choice field
    GENDER_CHOICES = [('M', 'Male'), ('F', 'Female'), ('O', 'Other')]
    gender = serializers.ChoiceField(choices=GENDER_CHOICES, allow_blank=True)

    # JSON/Dict/List fields
    profile_data = serializers.JSONField(default=dict, allow_null=True)
    tags = serializers.ListField(child=serializers.CharField(), allow_empty=True)
    settings = serializers.DictField(child=serializers.CharField(), allow_null=True)

    # Related fields
    created_by = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), allow_null=True)
    groups = serializers.SlugRelatedField(many=True, slug_field='name', queryset=Group.objects.all())

    # URL field
    website = serializers.URLField(allow_blank=True, allow_null=True)

    # Custom method field
    full_name = serializers.SerializerMethodField()

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()

    # Custom field with source
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = UserProfile
        fields = [
            'id', 'email', 'password', 'first_name', 'bio', 'age', 'rating',
            'salary', 'is_active', 'is_verified', 'date_joined', 'birth_date',
            'last_login', 'avatar', 'resume', 'gender', 'profile_data', 'tags',
            'settings', 'created_by', 'groups', 'website', 'full_name', 'username'
        ]

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)  # Hash the password
        user.save()
        return user

# Common field parameters:
# - required=True/False (default True except for read_only fields)
# - allow_null=True/False (default False)
# - allow_blank=True/False (for strings, default False)
# - default=value (default value if not provided)
# - validators=[validator1, validator2]
# - read_only=True (exclude from writes)
# - write_only=True (exclude from reads, like passwords)
# - source='model.field' (map to different model field)
# - help_text='...' (API documentation)
# - label='...' (human-readable label)
# - error_messages={'required': 'Custom error message'}`,
      outputExplanation: "POST with missing email returns: {'email': ['This field is required.']}. POST with password='123' returns: {'password': ['Ensure this field has at least 8 characters.']}. GET response excludes password (write_only) but includes full_name (computed field).",
      commonMistakes: [
        "Not using write_only=True on password fields — passwords are exposed in GET responses (security risk!).",
        "Using required=False when you mean allow_null=True or allow_blank=True — they serve different purposes.",
        "Not specifying max_length on CharField — defaults to 200, but model might have different limit.",
        "Using IntegerField for prices instead of DecimalField — floating point precision issues.",
        "Forgetting input_formats on DateField when accepting multiple formats — only ISO 8601 is accepted by default.",
        "Using SerializerMethodField for simple field mapping when source parameter is simpler."
      ],
      interviewNotes: [
        "CharField: required, allow_blank, max_length, min_length, trim_whitespace.",
        "EmailField extends CharField with email validation.",
        "IntegerField/FloatField/DecimalField: min_value, max_value. Use Decimal for money.",
        "BooleanField: required=False allows null. Use default for missing values.",
        "DateTimeField: format controls output. input_formats controls accepted input formats.",
        "FileField/ImageField: handle uploads. Require MEDIA_URL and MEDIA_ROOT settings.",
        "JSONField stores arbitrary JSON. Useful for flexible metadata without schema changes.",
        "SerializerMethodField: custom computed fields via get_<field_name>() method.",
        "source parameter maps serializer field to model field (e.g., source='user.email').",
        "PrimaryKeyRelatedField: FK represented as ID. SlugRelatedField: FK represented as slug."
      ],
      whenToUse: "Always choose the most specific field type. EmailField over CharField, DecimalField over FloatField for money, ImageField over FileField for images.",
      whenNotToUse: "Don't use SerializerMethodField when a simple source parameter suffices — it's slower."
    },
    tags: ["fields", "charfield", "integerfield", "filefield", "jsonfield"],
    order: 5,
    estimatedMinutes: 20
  },
  {
    id: "serializer-context",
    title: "Serializer Context",
    slug: "serializer-context",
    category: "drf-serializers",
    difficulty: "intermediate",
    description: "Use context to pass request data, user information, and other dynamic data to serializers for conditional behavior.",
    content: {
      explanation: "Serializers often need access to the current request, logged-in user, or other view-level data. DRF automatically passes request, view, and format in the context dict. You can add custom data via self.context. This is essential for conditional fields, permission-based serialization, and URL generation.",
      realExample: "A PostSerializer should show an 'edit' button only if the current user is the author. A nested CommentSerializer needs the post_id from the URL to create comments. A UserSerializer shows email only to the user themselves or admins. All these require access to request.user or URL kwargs, passed via context.",
      codeExample: `# serializers.py
from rest_framework import serializers

class CommentSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.username', read_only=True)
    is_author = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ['id', 'text', 'author', 'author_name', 'is_author', 'created_at']

    def get_is_author(self, obj):
        """Check if current user is the comment author."""
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            return obj.author == request.user
        return False

class PostSerializer(serializers.ModelSerializer):
    author = serializers.StringRelatedField(read_only=True)
    comments = CommentSerializer(many=True, read_only=True)
    can_edit = serializers.SerializerMethodField()
    detail_url = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = ['id', 'title', 'content', 'author', 'comments', 'can_edit', 'detail_url']

    def get_can_edit(self, obj):
        """User can edit if they're the author or an admin."""
        request = self.context.get('request')
        if not request or not hasattr(request, 'user'):
            return False
        user = request.user
        return user == obj.author or user.is_staff

    def get_detail_url(self, obj):
        """Generate absolute URL for the post."""
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(f'/posts/{obj.id}/')
        return f'/posts/{obj.id}/'

# Conditional fields based on user
class UserSerializer(serializers.ModelSerializer):
    email = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'date_joined']

    def get_email(self, obj):
        """Show email only to the user themselves or admins."""
        request = self.context.get('request')
        if not request or not hasattr(request, 'user'):
            return None
        user = request.user
        if user == obj or user.is_staff:
            return obj.email
        return None  # Hidden for other users

# views.py - Passing custom context
from rest_framework import generics

class PostDetailView(generics.RetrieveAPIView):
    queryset = Post.objects.all()
    serializer_class = PostSerializer

    def get_serializer_context(self):
        """Add custom data to serializer context."""
        context = super().get_serializer_context()
        context['is_preview'] = self.request.query_params.get('preview') == 'true'
        context['show_hidden'] = self.request.user.is_staff
        return context

# Using custom context in serializer
class PostSerializer(serializers.ModelSerializer):
    content = serializers.SerializerMethodField()

    def get_content(self, obj):
        is_preview = self.context.get('is_preview', False)
        if is_preview:
            return obj.content[:200] + '...'  # Truncate for preview
        return obj.content

# Default context keys (auto-provided by DRF):
# - request: The HTTP request object
# - view: The view instance
# - format: The format suffix (json, xml, etc.)`,
      outputExplanation: "GET /posts/1/ with authenticated author returns: {'can_edit': true, 'is_author': true, ...}. GET /posts/1/ with different user returns: {'can_edit': false, 'is_author': false, ...}. GET /users/1/ with user 1 logged in returns: {'email': 'user1@example.com'}. GET /users/1/ with user 2 returns: {'email': null}.",
      commonMistakes: [
        "Accessing self.context['request'] without checking if it exists — crashes when serializer is used outside views (e.g., in shell).",
        "Not using hasattr(request, 'user') before accessing request.user — crashes for unauthenticated requests.",
        "Forgetting to call super().get_serializer_context() when overriding — loses default request/view/format keys.",
        "Passing large objects in context (like querysets) — context is passed to all nested serializers, causing performance issues.",
        "Using self.request instead of self.context['request'] — self.request doesn't exist on serializers."
      ],
      interviewNotes: [
        "self.context is a dict passed to the serializer from the view.",
        "Default keys: request, view, format (auto-provided by DRF generic views).",
        "Access via self.context.get('request') to avoid KeyError.",
        "Override get_serializer_context() in views to add custom data.",
        "Common uses: conditional fields, permission checks, URL generation, filtering nested data.",
        "Context is inherited by nested serializers — no need to pass manually.",
        "request.user gives the authenticated user. Check is_authenticated first."
      ],
      whenToUse: "Whenever serializer behavior depends on the request, user, or view-level data.",
      whenNotToUse: "For static field definitions that don't change based on request — use regular field parameters instead."
    },
    tags: ["context", "request", "user", "conditional"],
    order: 6,
    estimatedMinutes: 14
  },
  {
    id: "serializer-relations",
    title: "Serializer Relations",
    slug: "serializer-relations",
    category: "drf-serializers",
    difficulty: "advanced",
    description: "Master PrimaryKeyRelatedField, StringRelatedField, SlugRelatedField, HyperlinkedRelatedField, and custom relation fields.",
    content: {
      explanation: "DRF provides multiple ways to represent related objects: PrimaryKeyRelatedField (just the ID), StringRelatedField (__str__ representation), SlugRelatedField (a specific field like 'slug'), HyperlinkedRelatedField (a URL to the object), and nested serializers (full object). Choose based on your API needs: IDs are compact, URLs are RESTful, nested objects reduce requests.",
      realExample: "A Book API can represent the author as: (1) author: 5 (PK), (2) author: 'John Doe' (String), (3) author: 'john-doe' (Slug), (4) author: '/api/authors/5/' (URL), (5) author: {'id': 5, 'name': 'John Doe'} (nested). For mobile apps, nested is best (fewer requests). For web dashboards linking to author pages, URLs work well.",
      codeExample: `from rest_framework import serializers

class Book(models.Model):
    title = models.CharField(max_length=200)
    author = models.ForeignKey(Author, on_delete=models.CASCADE, related_name='books')
    genre = models.ForeignKey(Genre, on_delete=models.CASCADE)
    publisher = models.ForeignKey(Publisher, on_delete=models.CASCADE)

# 1. PrimaryKeyRelatedField (default for ModelSerializer ForeignKey)
class BookSerializer(serializers.ModelSerializer):
    author = serializers.PrimaryKeyRelatedField(queryset=Author.objects.all())

    class Meta:
        model = Book
        fields = ['id', 'title', 'author']  # author: 5

# 2. StringRelatedField (uses __str__ method)
class BookSerializer(serializers.ModelSerializer):
    author = serializers.StringRelatedField()  # Read-only!

    class Meta:
        model = Book
        fields = ['id', 'title', 'author']  # author: "John Doe"

# 3. SlugRelatedField (use any model field)
class BookSerializer(serializers.ModelSerializer):
    author = serializers.SlugRelatedField(
        slug_field='username',  # Use author.username
        queryset=Author.objects.all()
    )
    genre = serializers.SlugRelatedField(
        slug_field='slug',
        queryset=Genre.objects.all()
    )

    class Meta:
        model = Book
        fields = ['id', 'title', 'author', 'genre']
    # author: "john-doe", genre: "science-fiction"

# 4. HyperlinkedRelatedField (URL to the object)
class BookSerializer(serializers.HyperlinkedModelSerializer):
    author = serializers.HyperlinkedRelatedField(
        view_name='author-detail',  # URL name from urls.py
        queryset=Author.objects.all()
    )

    class Meta:
        model = Book
        fields = ['url', 'title', 'author']  # author: "http://api.com/authors/5/"

# 5. Custom RelatedField
class AuthorFullNameField(serializers.RelatedField):
    """Custom field that shows author's full name."""

    def to_representation(self, value):
        """Serialize to full name."""
        return f"{value.first_name} {value.last_name}"

    def to_internal_value(self, data):
        """Deserialize from username."""
        try:
            return Author.objects.get(username=data)
        except Author.DoesNotExist:
            raise serializers.ValidationError(f"Author with username '{data}' not found.")

class BookSerializer(serializers.ModelSerializer):
    author = AuthorFullNameField(queryset=Author.objects.all())

    class Meta:
        model = Book
        fields = ['id', 'title', 'author']  # author: "John Doe" (custom format)

# Handling Many-to-Many
class Book(models.Model):
    title = models.CharField(max_length=200)
    tags = models.ManyToManyField(Tag, related_name='books')

class BookSerializer(serializers.ModelSerializer):
    tags = serializers.PrimaryKeyRelatedField(many=True, queryset=Tag.objects.all())
    # OR
    tags = serializers.SlugRelatedField(many=True, slug_field='name', queryset=Tag.objects.all())

    class Meta:
        model = Book
        fields = ['id', 'title', 'tags']

# Read-only vs writable
class BookSerializer(serializers.ModelSerializer):
    author_name = serializers.StringRelatedField(source='author', read_only=True)  # For reads
    author_id = serializers.PrimaryKeyRelatedField(
        source='author',
        queryset=Author.objects.all(),
        write_only=True  # For writes
    )

    class Meta:
        model = Book
        fields = ['id', 'title', 'author_name', 'author_id']

# GET returns: {'author_name': 'John Doe'}
# POST expects: {'author_id': 5}`,
      outputExplanation: "PrimaryKeyRelatedField returns author: 5. StringRelatedField returns author: 'John Doe' (read-only). SlugRelatedField returns author: 'john-doe'. HyperlinkedRelatedField returns author: 'http://api.com/authors/5/'. Custom field returns whatever format you define.",
      commonMistakes: [
        "Using StringRelatedField for writable fields — it's always read-only.",
        "Forgetting view_name parameter on HyperlinkedRelatedField — DRF can't generate URLs.",
        "Not setting queryset on writable related fields — DRF can't validate the input.",
        "Using PrimaryKeyRelatedField without prefetch_related/select_related — causes N+1 queries.",
        "Not handling DoesNotExist in custom RelatedField.to_internal_value() — causes 500 instead of 400."
      ],
      interviewNotes: [
        "PrimaryKeyRelatedField: most compact, best for writes. Requires queryset for writable fields.",
        "StringRelatedField: human-readable, always read-only, uses model's __str__.",
        "SlugRelatedField: uses any field (username, slug, etc.). Supports reads and writes.",
        "HyperlinkedRelatedField: RESTful, requires view_name. Good for discoverability.",
        "Nested serializers: full object, reduces API calls, but verbose. Read-only by default.",
        "many=True for ManyToMany or reverse ForeignKey relations.",
        "Combine read-only (display) and write-only (input) fields for different representations.",
        "Always optimize queries: select_related for FK, prefetch_related for M2M."
      ],
      whenToUse: "Choose based on use case: PKs for efficiency, URLs for RESTful design, nested for rich data, slugs for human-readable IDs.",
      whenNotToUse: "Don't use HyperlinkedRelatedField if your client can't follow URLs efficiently — mobile apps prefer IDs or nested data."
    },
    tags: ["relations", "pk", "slug", "hyperlinked", "foreignkey"],
    order: 7,
    estimatedMinutes: 18
  },
  {
    id: "serializer-performance",
    title: "Serializer Performance Optimization",
    slug: "serializer-performance",
    category: "drf-serializers",
    difficulty: "advanced",
    description: "Optimize serializers with select_related, prefetch_related, only(), defer(), and avoid N+1 queries.",
    content: {
      explanation: "Serializers can cause severe performance issues if not optimized. Each ForeignKey access triggers a query. Serializing 100 books without select_related('author') causes 101 queries. Nested serializers with reverse relations (comments on posts) cause N+1. Use select_related for FK/OneToOne, prefetch_related for M2M/reverse FK, only() to fetch specific columns, and Prefetch objects for advanced filtering.",
      realExample: "A blog API endpoint GET /posts/ returns 50 posts, each with author details and comment count. Without optimization: 50 posts (1 query) + 50 authors (50 queries) + 50 comment counts (50 queries) = 101 queries, taking 2+ seconds. With optimization: 1 query for posts with authors (select_related), 1 query for comment counts (annotate) = 2 queries, 50ms. 40x faster!",
      codeExample: `from django.db.models import Prefetch, Count
from rest_framework import serializers, generics

# models.py
class Author(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField()
    bio = models.TextField()

class Post(models.Model):
    title = models.CharField(max_length=200)
    content = models.TextField()
    author = models.ForeignKey(Author, on_delete=models.CASCADE, related_name='posts')
    created_at = models.DateTimeField(auto_now_add=True)

class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    text = models.TextField()
    user = models.ForeignKey(User, on_delete=models.CASCADE)

# ❌ BAD: Causes N+1 queries
class PostSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.name')  # Query per post
    comment_count = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = ['id', 'title', 'author_name', 'comment_count']

    def get_comment_count(self, obj):
        return obj.comments.count()  # Query per post!

class PostListView(generics.ListAPIView):
    queryset = Post.objects.all()  # No optimization
    serializer_class = PostSerializer
# 1 query for posts + N queries for authors + N queries for counts = 1 + N + N queries

# ✅ GOOD: Optimized with select_related and annotate
class PostSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.name')
    comment_count = serializers.IntegerField(read_only=True)  # From annotation

    class Meta:
        model = Post
        fields = ['id', 'title', 'author_name', 'comment_count']

class PostListView(generics.ListAPIView):
    queryset = Post.objects.select_related('author').annotate(
        comment_count=Count('comments')
    )
    serializer_class = PostSerializer
# Just 1 query with JOIN and COUNT

# Nested serializers with prefetch_related
class CommentSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username')

    class Meta:
        model = Comment
        fields = ['id', 'text', 'user_name']

class PostDetailSerializer(serializers.ModelSerializer):
    author = AuthorSerializer()
    comments = CommentSerializer(many=True)

    class Meta:
        model = Post
        fields = ['id', 'title', 'author', 'comments']

class PostDetailView(generics.RetrieveAPIView):
    queryset = Post.objects.select_related('author').prefetch_related(
        Prefetch('comments', queryset=Comment.objects.select_related('user'))
    )
    serializer_class = PostDetailSerializer
# 3 queries: 1 for post+author, 1 for comments, 1 for comment users

# Using only() to fetch fewer columns
class PostListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Post
        fields = ['id', 'title', 'created_at']  # Only need these fields

class PostListView(generics.ListAPIView):
    queryset = Post.objects.only('id', 'title', 'created_at')
    serializer_class = PostListSerializer
# Fetches only specified columns, skips 'content' (large TextField)

# defer() to exclude heavy fields
class PostListView(generics.ListAPIView):
    queryset = Post.objects.defer('content')  # Exclude content field
    serializer_class = PostListSerializer

# Advanced: Prefetch with filtering
class PostDetailView(generics.RetrieveAPIView):
    def get_queryset(self):
        return Post.objects.prefetch_related(
            Prefetch(
                'comments',
                queryset=Comment.objects.filter(is_approved=True).select_related('user').order_by('-created_at')[:5]
            )
        )
# Only fetch approved comments, with user, limited to 5

# Using serializer context to toggle optimization
class PostSerializer(serializers.ModelSerializer):
    comments = serializers.SerializerMethodField()

    def get_comments(self, obj):
        if self.context.get('include_comments'):
            return CommentSerializer(obj.comments.all(), many=True).data
        return []

class PostListView(generics.ListAPIView):
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['include_comments'] = self.request.query_params.get('comments') == 'true'
        return context
# GET /posts/ → no comments (fast)
# GET /posts/?comments=true → includes comments (slower but complete)`,
      outputExplanation: "Without optimization, 100 posts = ~200 queries. With select_related/prefetch_related = 2-3 queries. Response time drops from 2000ms to 50ms. only() reduces data transfer — fetching 100 posts with large content field might transfer 10MB, without it <100KB.",
      commonMistakes: [
        "Not checking query count with django-debug-toolbar or logging — you won't know about N+1 problems.",
        "Using select_related on ManyToMany or reverse ForeignKey — it doesn't work. Use prefetch_related.",
        "Not prefetching nested related objects — Prefetch('comments') fetches comments but not comments.user.",
        "Using .count() on prefetched querysets — triggers extra query. Use len() or annotate instead.",
        "Over-optimizing — adding select_related for fields not used in serializer wastes JOIN performance."
      ],
      interviewNotes: [
        "N+1 problem: 1 query for main objects + N queries for related objects.",
        "select_related: SQL JOIN for ForeignKey/OneToOne forward relations. Single query.",
        "prefetch_related: Separate query + Python join for ManyToMany/reverse FK. Two queries.",
        "only('field1', 'field2'): Fetch only specified columns. defer('field'): Fetch all except specified.",
        "annotate(count=Count('relation')): Aggregates in single query, avoid .count() in serializer.",
        "Prefetch('relation', queryset=...): Advanced prefetch with filtering/ordering.",
        "Use django-debug-toolbar or connection.queries to count queries.",
        "Optimize serializers based on actual usage — list vs detail views need different optimization."
      ],
      whenToUse: "Always optimize list endpoints and detail endpoints with nested data. Essential for production APIs.",
      whenNotToUse: "Don't optimize prematurely for rarely-used endpoints. Profile first, then optimize."
    },
    tags: ["performance", "n+1", "select_related", "prefetch", "optimization"],
    order: 8,
    estimatedMinutes: 22
  }
];

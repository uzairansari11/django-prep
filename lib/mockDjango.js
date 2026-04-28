/**
 * Embedded Python source for a minimal Django-ORM-like runtime.
 *
 * Runs in Pyodide (browser-side CPython). Exposes a `django.db.models`
 * module that's API-compatible enough for the practice exercises:
 *   • Model + Manager + QuerySet
 *   • filter / exclude / get / first / last / count / exists / order_by
 *     values / values_list / distinct / none / all / create / aggregate / annotate
 *   • Field lookups: __exact, __iexact, __lt, __lte, __gt, __gte,
 *     __contains, __icontains, __startswith, __endswith, __istartswith,
 *     __iendswith, __in, __isnull, __range
 *   • Q (AND / OR / NOT)
 *   • F (field references)
 *   • Aggregates: Count, Sum, Avg, Min, Max
 *
 * NOT supported (exercises using these will error and fall back to AST check):
 *   • select_related / prefetch_related (relational joins beyond simple FK lookups)
 *   • Subqueries / OuterRef
 *   • complex annotate expressions
 *   • raw SQL
 */
export const MOCK_DJANGO_SOURCE = String.raw`
import sys
import types
from copy import deepcopy

# ───────────────────────────────────────────────────────────────────────
# Internal registry: model class -> list of instances
# ───────────────────────────────────────────────────────────────────────
_REGISTRY = {}

def _reset_db():
    """Clear all stored instances. Call between exercises."""
    _REGISTRY.clear()


# ───────────────────────────────────────────────────────────────────────
# Lookups
# ───────────────────────────────────────────────────────────────────────
def _safe_str(v):
    return "" if v is None else str(v)

LOOKUPS = {
    "exact":        lambda a, b: a == b,
    "iexact":       lambda a, b: _safe_str(a).lower() == _safe_str(b).lower(),
    "lt":           lambda a, b: a is not None and a < b,
    "lte":          lambda a, b: a is not None and a <= b,
    "gt":           lambda a, b: a is not None and a > b,
    "gte":          lambda a, b: a is not None and a >= b,
    "contains":     lambda a, b: _safe_str(b) in _safe_str(a),
    "icontains":    lambda a, b: _safe_str(b).lower() in _safe_str(a).lower(),
    "startswith":   lambda a, b: _safe_str(a).startswith(_safe_str(b)),
    "endswith":     lambda a, b: _safe_str(a).endswith(_safe_str(b)),
    "istartswith":  lambda a, b: _safe_str(a).lower().startswith(_safe_str(b).lower()),
    "iendswith":    lambda a, b: _safe_str(a).lower().endswith(_safe_str(b).lower()),
    "in":           lambda a, b: a in b,
    "isnull":       lambda a, b: (a is None) == bool(b),
    "range":        lambda a, b: a is not None and b[0] <= a <= b[1],
}

def _resolve_value(obj, value):
    """If value is an F() reference, fetch the field from obj."""
    if isinstance(value, F):
        return getattr(obj, value.name, None)
    return value

def _walk_attr(obj, parts):
    """Walk a list of attribute names through obj (FK traversal)."""
    cur = obj
    for p in parts:
        if cur is None:
            return None
        cur = getattr(cur, p, None)
    return cur

def _match_kw(obj, key, value):
    """Match a single field__lookup=value kwarg against an object."""
    parts = key.split("__")
    # If last part is a known lookup name, separate it; else default to exact.
    if parts[-1] in LOOKUPS:
        lookup = parts[-1]
        path = parts[:-1]
    else:
        lookup = "exact"
        path = parts
    if not path:
        return False
    actual = _walk_attr(obj, path)
    return LOOKUPS[lookup](actual, _resolve_value(obj, value))


# ───────────────────────────────────────────────────────────────────────
# Q objects
# ───────────────────────────────────────────────────────────────────────
class Q:
    AND = "AND"
    OR  = "OR"

    def __init__(self, *args, **kwargs):
        self.children = list(kwargs.items())
        self.connector = self.AND
        self.negated = False
        for q in args:
            if isinstance(q, Q):
                self.children.append(q)

    def _matches(self, obj):
        results = []
        for child in self.children:
            if isinstance(child, Q):
                results.append(child._matches(obj))
            else:
                key, value = child
                results.append(_match_kw(obj, key, value))
        if not results:
            r = True
        elif self.connector == self.AND:
            r = all(results)
        else:
            r = any(results)
        return (not r) if self.negated else r

    def __or__(self, other):
        n = Q()
        n.children = [self, other]
        n.connector = self.OR
        return n

    def __and__(self, other):
        n = Q()
        n.children = [self, other]
        n.connector = self.AND
        return n

    def __invert__(self):
        n = deepcopy(self)
        n.negated = not n.negated
        return n


# ───────────────────────────────────────────────────────────────────────
# F expressions
# ───────────────────────────────────────────────────────────────────────
class F:
    def __init__(self, name):
        self.name = name


# ───────────────────────────────────────────────────────────────────────
# Aggregates
# ───────────────────────────────────────────────────────────────────────
class _Aggregate:
    suffix = "agg"
    def __init__(self, field):
        self.field = field
    def _values(self, items):
        out = []
        for i in items:
            v = _walk_attr(i, self.field.split("__"))
            if v is not None:
                out.append(v)
        return out
    def default_alias(self):
        return f"{self.field}__{self.suffix}"

class Count(_Aggregate):
    suffix = "count"
    def compute(self, items):
        if self.field == "*":
            return len(items)
        return sum(1 for v in self._values(items))

class Sum(_Aggregate):
    suffix = "sum"
    def compute(self, items):
        vs = self._values(items)
        return sum(vs) if vs else 0

class Avg(_Aggregate):
    suffix = "avg"
    def compute(self, items):
        vs = self._values(items)
        if not vs:
            return None
        return sum(vs) / len(vs)

class Min(_Aggregate):
    suffix = "min"
    def compute(self, items):
        vs = self._values(items)
        return min(vs) if vs else None

class Max(_Aggregate):
    suffix = "max"
    def compute(self, items):
        vs = self._values(items)
        return max(vs) if vs else None


# ───────────────────────────────────────────────────────────────────────
# QuerySet
# ───────────────────────────────────────────────────────────────────────
class QuerySet:
    def __init__(self, model, items):
        self.model = model
        self._items = list(items)

    # ── filtering ──
    def filter(self, *args, **kwargs):
        items = list(self._items)
        for q in args:
            if isinstance(q, Q):
                items = [i for i in items if q._matches(i)]
        for k, v in kwargs.items():
            items = [i for i in items if _match_kw(i, k, v)]
        return QuerySet(self.model, items)

    def exclude(self, *args, **kwargs):
        items = list(self._items)
        for q in args:
            if isinstance(q, Q):
                items = [i for i in items if not q._matches(i)]
        for k, v in kwargs.items():
            items = [i for i in items if not _match_kw(i, k, v)]
        return QuerySet(self.model, items)

    def get(self, *args, **kwargs):
        qs = self.filter(*args, **kwargs)
        n = len(qs._items)
        if n == 0:
            raise self.model.DoesNotExist(f"{self.model.__name__} matching query does not exist.")
        if n > 1:
            raise self.model.MultipleObjectsReturned(f"get() returned more than one {self.model.__name__} -- it returned {n}!")
        return qs._items[0]

    # ── single-object accessors ──
    def first(self):
        return self._items[0] if self._items else None
    def last(self):
        return self._items[-1] if self._items else None
    def count(self):
        return len(self._items)
    def exists(self):
        return len(self._items) > 0

    # ── ordering ──
    def order_by(self, *fields):
        items = list(self._items)
        for f in reversed(fields):
            reverse = f.startswith("-")
            name = f.lstrip("-?")
            def keyfn(i, name=name):
                v = _walk_attr(i, name.split("__"))
                # Place None last regardless of direction
                return (v is None, v)
            items.sort(key=keyfn, reverse=reverse)
        return QuerySet(self.model, items)

    def reverse(self):
        return QuerySet(self.model, list(reversed(self._items)))

    # ── projection ──
    def values(self, *fields):
        out = []
        for i in self._items:
            if fields:
                d = {f: _walk_attr(i, f.split("__")) for f in fields}
            else:
                # all declared fields
                names = list(getattr(self.model, "_field_names", []))
                if "id" not in names:
                    names = ["id"] + names
                d = {name: getattr(i, name, None) for name in names}
            out.append(d)
        return _ValuesQuerySet(self.model, out)

    def values_list(self, *fields, flat=False, named=False):
        if flat:
            if len(fields) != 1:
                raise TypeError("values_list with flat=True needs exactly one field")
            data = [_walk_attr(i, fields[0].split("__")) for i in self._items]
        else:
            data = [tuple(_walk_attr(i, f.split("__")) for f in fields) for i in self._items]
        return _FlatQuerySet(self.model, data)

    def distinct(self, *fields):
        seen = set()
        out = []
        for i in self._items:
            key = tuple(_walk_attr(i, f.split("__")) for f in fields) if fields else id(i)
            if key not in seen:
                seen.add(key)
                out.append(i)
        return QuerySet(self.model, out)

    def none(self):
        return QuerySet(self.model, [])

    def all(self):
        return QuerySet(self.model, list(self._items))

    # ── aggregations ──
    def aggregate(self, *args, **kwargs):
        result = {}
        for agg in args:
            if isinstance(agg, _Aggregate):
                result[agg.default_alias()] = agg.compute(self._items)
        for alias, agg in kwargs.items():
            if isinstance(agg, _Aggregate):
                result[alias] = agg.compute(self._items)
        return result

    def annotate(self, **kwargs):
        # Naive: for each item, compute the aggregate over related items if FK,
        # otherwise compute against this single item (gives a per-row count = 1).
        new_items = []
        for i in self._items:
            cloned = _shallow_clone(i)
            for alias, agg in kwargs.items():
                if isinstance(agg, _Aggregate):
                    if "__" in agg.field:
                        related, attr = agg.field.split("__", 1)
                        related_qs = getattr(cloned, related, None)
                        if related_qs is None:
                            setattr(cloned, alias, agg.compute([]))
                        else:
                            sub = _Aggregate.__new__(type(agg))
                            sub.field = attr
                            setattr(cloned, alias, sub.compute(list(related_qs)))
                    else:
                        setattr(cloned, alias, agg.compute([cloned]))
            new_items.append(cloned)
        return QuerySet(self.model, new_items)

    # ── delete / update ──
    def delete(self):
        kept = [i for i in _REGISTRY.get(self.model, []) if i not in self._items]
        n = len(_REGISTRY.get(self.model, [])) - len(kept)
        _REGISTRY[self.model] = kept
        return (n, {self.model.__name__: n})

    def update(self, **kwargs):
        n = 0
        for i in self._items:
            for k, v in kwargs.items():
                setattr(i, k, _resolve_value(i, v))
            n += 1
        return n

    # ── protocol ──
    def __iter__(self): return iter(self._items)
    def __len__(self):  return len(self._items)
    def __bool__(self): return bool(self._items)
    def __getitem__(self, idx):
        if isinstance(idx, slice):
            return QuerySet(self.model, self._items[idx])
        return self._items[idx]

    def __repr__(self):
        if not self._items:
            return "<QuerySet []>"
        preview = self._items[:20]
        truncated = len(self._items) > 20
        body = ",\n".join(f"  {repr(i)}" for i in preview)
        suffix = ",\n  '...(remaining elements truncated)...'" if truncated else ""
        return f"<QuerySet [\n{body}{suffix}\n]>"


def _shallow_clone(obj):
    """Make an object that delegates field reads to obj but allows new attrs."""
    cls = type(obj)
    clone = cls.__new__(cls)
    clone.__dict__.update(obj.__dict__)
    return clone


class _ValuesQuerySet(QuerySet):
    def __repr__(self):
        if not self._items:
            return "<QuerySet []>"
        preview = self._items[:20]
        body = ",\n".join(f"  {repr(d)}" for d in preview)
        return f"<QuerySet [\n{body}\n]>"


class _FlatQuerySet(QuerySet):
    def __repr__(self):
        return f"<QuerySet {repr(self._items)}>"


# ───────────────────────────────────────────────────────────────────────
# Manager
# ───────────────────────────────────────────────────────────────────────
class Manager:
    def __init__(self, model):
        self.model = model

    @property
    def _objects(self):
        return _REGISTRY.setdefault(self.model, [])

    def all(self):                         return QuerySet(self.model, list(self._objects))
    def filter(self, *a, **kw):            return self.all().filter(*a, **kw)
    def exclude(self, *a, **kw):           return self.all().exclude(*a, **kw)
    def get(self, *a, **kw):               return self.all().get(*a, **kw)
    def first(self):                       return self.all().first()
    def last(self):                        return self.all().last()
    def count(self):                       return len(self._objects)
    def exists(self):                      return len(self._objects) > 0
    def order_by(self, *f):                return self.all().order_by(*f)
    def values(self, *f):                  return self.all().values(*f)
    def values_list(self, *f, **kw):       return self.all().values_list(*f, **kw)
    def distinct(self, *f):                return self.all().distinct(*f)
    def none(self):                        return QuerySet(self.model, [])
    def aggregate(self, *a, **kw):         return self.all().aggregate(*a, **kw)
    def annotate(self, **kw):              return self.all().annotate(**kw)

    def create(self, **kwargs):
        instance = self.model(**kwargs)
        if not getattr(instance, "id", None):
            existing_ids = [getattr(o, "id", 0) or 0 for o in self._objects]
            instance.id = (max(existing_ids) + 1) if existing_ids else 1
        instance.pk = instance.id
        self._objects.append(instance)
        return instance

    def bulk_create(self, objs, **kw):
        return [self.create(**(o.__dict__ if hasattr(o, "__dict__") else o)) for o in objs]

    def __iter__(self): return iter(self.all())


# ───────────────────────────────────────────────────────────────────────
# Field descriptors
# ───────────────────────────────────────────────────────────────────────
class _Field:
    def __init__(self, *args, **kwargs):
        self.kwargs = kwargs
    def __set_name__(self, owner, name):
        self.name = name

class CharField(_Field): pass
class TextField(_Field): pass
class IntegerField(_Field): pass
class BigIntegerField(_Field): pass
class SmallIntegerField(_Field): pass
class PositiveIntegerField(_Field): pass
class PositiveSmallIntegerField(_Field): pass
class FloatField(_Field): pass
class DecimalField(_Field): pass
class BooleanField(_Field): pass
class DateField(_Field): pass
class DateTimeField(_Field): pass
class TimeField(_Field): pass
class DurationField(_Field): pass
class EmailField(_Field): pass
class URLField(_Field): pass
class SlugField(_Field): pass
class UUIDField(_Field): pass
class JSONField(_Field): pass
class FileField(_Field): pass
class ImageField(_Field): pass
class AutoField(_Field): pass
class BigAutoField(_Field): pass
class BinaryField(_Field): pass
class IPAddressField(_Field): pass
class GenericIPAddressField(_Field): pass


class _RelatedManager:
    """Stand-in for a reverse FK manager (e.g. author.books)."""
    def __init__(self, items):
        self._items = items
    def all(self):           return QuerySet(None, list(self._items))
    def filter(self, **kw):  return QuerySet(None, list(self._items)).filter(**kw)
    def count(self):         return len(self._items)
    def __iter__(self):      return iter(self._items)
    def __len__(self):       return len(self._items)


class ForeignKey(_Field):
    def __init__(self, to, on_delete=None, related_name=None, **kwargs):
        super().__init__(**kwargs)
        self.to = to
        self.related_name = related_name
        self.on_delete = on_delete

class OneToOneField(ForeignKey): pass
class ManyToManyField(ForeignKey): pass


# ───────────────────────────────────────────────────────────────────────
# Model meta + base
# ───────────────────────────────────────────────────────────────────────
class _ModelMeta(type):
    def __init__(cls, name, bases, dct):
        super().__init__(name, bases, dct)
        if name == "Model" or bases == (object,):
            return
        # Collect declared field names
        cls._field_names = [k for k, v in dct.items() if isinstance(v, _Field)]
        cls._fk_fields = {k: v for k, v in dct.items() if isinstance(v, ForeignKey)}
        cls.objects = Manager(cls)
        cls.DoesNotExist = type("DoesNotExist", (Exception,), {})
        cls.MultipleObjectsReturned = type("MultipleObjectsReturned", (Exception,), {})


class Model(metaclass=_ModelMeta):
    def __init__(self, **kwargs):
        for k, v in kwargs.items():
            setattr(self, k, v)
        # Auto-resolve <fk>_id → instance lookup at access time via __getattr__
        for fk_name, fk in type(self)._fk_fields.items():
            id_key = f"{fk_name}_id"
            if id_key in kwargs and fk_name not in kwargs:
                # Resolve the related instance on demand
                target = fk.to
                if target == "self":
                    target = type(self)
                if isinstance(target, str):
                    target = _MODELS_BY_NAME.get(target.split(".")[-1])
                if target:
                    target_id = kwargs[id_key]
                    related = next(
                        (o for o in _REGISTRY.get(target, []) if getattr(o, "id", None) == target_id),
                        None,
                    )
                    setattr(self, fk_name, related)
                    # Add reverse accessor on the related object
                    if related is not None:
                        rname = fk.related_name or f"{type(self).__name__.lower()}_set"
                        existing = getattr(related, rname, None)
                        if not isinstance(existing, _RelatedManager):
                            existing = _RelatedManager([])
                            setattr(related, rname, existing)
                        existing._items.append(self)

    def __repr__(self):
        return f"<{type(self).__name__}: {type(self).__name__} object ({getattr(self, 'id', '?')})>"

    def __str__(self):
        return f"{type(self).__name__} object ({getattr(self, 'id', '?')})"

    def save(self, *a, **kw):
        if not getattr(self, "id", None):
            cls = type(self)
            existing = [getattr(o, "id", 0) or 0 for o in _REGISTRY.get(cls, [])]
            self.id = (max(existing) + 1) if existing else 1
            self.pk = self.id
            _REGISTRY.setdefault(cls, []).append(self)
        return self

    def delete(self):
        cls = type(self)
        if self in _REGISTRY.get(cls, []):
            _REGISTRY[cls].remove(self)


_MODELS_BY_NAME = {}

# Track models as they're declared (for FK string refs)
_orig_init = _ModelMeta.__init__
def _tracking_init(cls, name, bases, dct):
    _orig_init(cls, name, bases, dct)
    if name != "Model" and bases != (object,):
        _MODELS_BY_NAME[name] = cls
_ModelMeta.__init__ = _tracking_init


# ───────────────────────────────────────────────────────────────────────
# Install as django.db.models module
# ───────────────────────────────────────────────────────────────────────
_django = types.ModuleType("django")
_django_db = types.ModuleType("django.db")
_django_db_models = types.ModuleType("django.db.models")

for _name in (
    "Model", "Manager", "QuerySet", "Q", "F",
    "Count", "Sum", "Avg", "Min", "Max",
    "ForeignKey", "OneToOneField", "ManyToManyField",
    "CharField", "TextField", "IntegerField", "BigIntegerField",
    "SmallIntegerField", "PositiveIntegerField", "PositiveSmallIntegerField",
    "FloatField", "DecimalField", "BooleanField",
    "DateField", "DateTimeField", "TimeField", "DurationField",
    "EmailField", "URLField", "SlugField", "UUIDField", "JSONField",
    "FileField", "ImageField", "AutoField", "BigAutoField",
    "BinaryField", "IPAddressField", "GenericIPAddressField",
):
    setattr(_django_db_models, _name, globals()[_name])

# CASCADE etc — accept any value, just store the name
class _DummyOnDelete:
    def __init__(self, name): self.name = name
    def __call__(self, *a, **kw): pass
for _name in ("CASCADE", "SET_NULL", "SET_DEFAULT", "PROTECT", "DO_NOTHING", "RESTRICT", "SET"):
    setattr(_django_db_models, _name, _DummyOnDelete(_name))

sys.modules["django"] = _django
sys.modules["django.db"] = _django_db
sys.modules["django.db.models"] = _django_db_models
_django.db = _django_db
_django_db.models = _django_db_models
`;

'use client';

import ListingPage from '@/components/layout/ListingPage';
import { djangoInternalsTopics } from '@/data/django-internals-topics';

export default function DjangoInternalsPage() {
  return (
    <ListingPage
      label="Internals"
      title="Django Internals"
      description="How Django works under the hood — request lifecycle, middleware pipeline, signals, file uploads, migrations."
      topics={djangoInternalsTopics}
      hrefFor={(id) => `/learn/django/${id}`}
    />
  );
}

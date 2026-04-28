'use client';

import ListingPage from '@/components/layout/ListingPage';
import { queryTopics } from '@/data/query-topics';

export default function QueriesPage() {
  return (
    <ListingPage
      label="Queries"
      title="QuerySet & ORM"
      description="Master Django’s query API — lazy evaluation, filtering, annotation, aggregation, raw SQL when needed."
      topics={queryTopics}
      hrefFor={(id) => `/learn/queries/${id}`}
    />
  );
}

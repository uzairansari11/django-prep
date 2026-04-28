'use client';

import ListingPage from '@/components/layout/ListingPage';
import { productionTopics } from '@/data/production-topics';

export default function ProductionPage() {
  return (
    <ListingPage
      label="Production"
      title="Production Patterns"
      description="From auth to deployment — auth, caching, Celery, security hardening, structured logging, performance."
      topics={productionTopics}
      hrefFor={(id) => `/learn/production/${id}`}
    />
  );
}

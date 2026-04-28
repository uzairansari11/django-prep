'use client';

import ListingPage from '@/components/layout/ListingPage';
import { drfViewsTopics } from '@/data/drf-views-topics';

export default function DRFViewsPage() {
  return (
    <ListingPage
      label="DRF Views"
      title="DRF Views"
      description="Master DRF views — APIView, ViewSets, generic views, permissions, pagination, filtering."
      topics={drfViewsTopics}
      hrefFor={(id) => `/learn/drf-views/${id}`}
    />
  );
}

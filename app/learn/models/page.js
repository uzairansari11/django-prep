'use client';

import ListingPage from '@/components/layout/ListingPage';
import { modelTopics } from '@/data/models-topics';

export default function ModelsPage() {
  return (
    <ListingPage
      label="Models"
      title="Django Models"
      description="Define how your data looks. Field types, primary keys, relationships, Meta options, custom managers."
      topics={modelTopics}
      hrefFor={(id) => `/learn/models/${id}`}
    />
  );
}

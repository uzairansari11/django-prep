'use client';

import ListingPage from '@/components/layout/ListingPage';
import { drfSerializersTopics } from '@/data/drf-serializers-topics';

export default function DRFSerializersPage() {
  return (
    <ListingPage
      label="DRF Serializers"
      title="DRF Serializers"
      description="Validation, nested serialization, relations, custom fields, performance optimization."
      topics={drfSerializersTopics}
      hrefFor={(id) => `/learn/drf-serializers/${id}`}
    />
  );
}

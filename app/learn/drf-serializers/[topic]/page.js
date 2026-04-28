'use client';

import { use } from 'react';
import TopicDetail from '@/components/learn/TopicDetail';
import { drfSerializersTopics } from '@/data/drf-serializers-topics';

export default function DrfSerializersTopicPage({ params }) {
  const { topic: topicId } = use(params);
  const topic = drfSerializersTopics.find((t) => t.id === topicId);

  return (
    <TopicDetail
      topic={topic}
      topics={drfSerializersTopics}
      sectionLabel="DRF Serializers"
      sectionHref="/learn/drf-serializers"
      topicHref={(id) => `/learn/drf-serializers/${id}`}
    />
  );
}

'use client';

import { use } from 'react';
import TopicDetail from '@/components/learn/TopicDetail';
import { productionTopics } from '@/data/production-topics';

export default function ProductionTopicPage({ params }) {
  const { topic: topicId } = use(params);
  const topic = productionTopics.find((t) => t.id === topicId);

  return (
    <TopicDetail
      topic={topic}
      topics={productionTopics}
      sectionLabel="Production"
      sectionHref="/learn/production"
      topicHref={(id) => `/learn/production/${id}`}
    />
  );
}

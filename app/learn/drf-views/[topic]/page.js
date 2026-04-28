'use client';

import { use } from 'react';
import TopicDetail from '@/components/learn/TopicDetail';
import { drfViewsTopics } from '@/data/drf-views-topics';

export default function DrfViewsTopicPage({ params }) {
  const { topic: topicId } = use(params);
  const topic = drfViewsTopics.find((t) => t.id === topicId);

  return (
    <TopicDetail
      topic={topic}
      topics={drfViewsTopics}
      sectionLabel="DRF Views"
      sectionHref="/learn/drf-views"
      topicHref={(id) => `/learn/drf-views/${id}`}
    />
  );
}

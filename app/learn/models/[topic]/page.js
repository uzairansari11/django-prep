'use client';

import { use } from 'react';
import TopicDetail from '@/components/learn/TopicDetail';
import { modelTopics } from '@/data/models-topics';

export default function ModelTopicPage({ params }) {
  const { topic: topicId } = use(params);
  const topic = modelTopics.find((t) => t.id === topicId);

  return (
    <TopicDetail
      topic={topic}
      topics={modelTopics}
      sectionLabel="Models"
      sectionHref="/learn/models"
      topicHref={(id) => `/learn/models/${id}`}
    />
  );
}

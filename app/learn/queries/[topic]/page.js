'use client';

import { use } from 'react';
import TopicDetail from '@/components/learn/TopicDetail';
import { queryTopics } from '@/data/query-topics';

export default function QueryTopicPage({ params }) {
  const { topic: topicId } = use(params);
  const topic = queryTopics.find((t) => t.id === topicId);

  return (
    <TopicDetail
      topic={topic}
      topics={queryTopics}
      sectionLabel="Queries"
      sectionHref="/learn/queries"
      topicHref={(id) => `/learn/queries/${id}`}
    />
  );
}

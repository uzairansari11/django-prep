'use client';

import { use } from 'react';
import TopicDetail from '@/components/learn/TopicDetail';
import { djangoInternalsTopics } from '@/data/django-internals-topics';

export default function DjangoTopicPage({ params }) {
  const { topic: topicId } = use(params);
  const topic = djangoInternalsTopics.find((t) => t.id === topicId);

  return (
    <TopicDetail
      topic={topic}
      topics={djangoInternalsTopics}
      sectionLabel="Internals"
      sectionHref="/learn/django"
      topicHref={(id) => `/learn/django/${id}`}
    />
  );
}

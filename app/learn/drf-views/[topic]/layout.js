import TopicShell from '@/components/learn/TopicShell';
import { drfViewsTopics } from '@/data/drf-views-topics';

export default async function DrfViewsTopicLayout({ children, params }) {
  const { topic: topicId } = await params;
  return (
    <TopicShell
      topicId={topicId}
      topics={drfViewsTopics}
      sectionLabel="DRF Views"
      sectionHref="/learn/drf-views"
    >
      {children}
    </TopicShell>
  );
}

import TopicShell from '@/components/learn/TopicShell';
import { queryTopics } from '@/data/query-topics';

export default async function QueriesTopicLayout({ children, params }) {
  const { topic: topicId } = await params;
  return (
    <TopicShell
      topicId={topicId}
      topics={queryTopics}
      sectionLabel="Queries"
      sectionHref="/learn/queries"
    >
      {children}
    </TopicShell>
  );
}

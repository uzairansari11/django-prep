import TopicShell from '@/components/learn/TopicShell';
import { productionTopics } from '@/data/production-topics';

export default async function ProductionTopicLayout({ children, params }) {
  const { topic: topicId } = await params;
  return (
    <TopicShell
      topicId={topicId}
      topics={productionTopics}
      sectionLabel="Production"
      sectionHref="/learn/production"
    >
      {children}
    </TopicShell>
  );
}

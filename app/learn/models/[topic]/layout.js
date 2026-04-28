import TopicShell from '@/components/learn/TopicShell';
import { modelTopics } from '@/data/models-topics';

export default async function ModelsTopicLayout({ children, params }) {
  const { topic: topicId } = await params;
  return (
    <TopicShell
      topicId={topicId}
      topics={modelTopics}
      sectionLabel="Models"
      sectionHref="/learn/models"
    >
      {children}
    </TopicShell>
  );
}

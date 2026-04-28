import TopicShell from '@/components/learn/TopicShell';
import { drfSerializersTopics } from '@/data/drf-serializers-topics';

export default async function DrfSerializersTopicLayout({ children, params }) {
  const { topic: topicId } = await params;
  return (
    <TopicShell
      topicId={topicId}
      topics={drfSerializersTopics}
      sectionLabel="DRF Serializers"
      sectionHref="/learn/drf-serializers"
    >
      {children}
    </TopicShell>
  );
}

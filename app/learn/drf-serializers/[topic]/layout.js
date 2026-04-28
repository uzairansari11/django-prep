import TopicShell from '@/components/learn/TopicShell';
import { drfSerializersTopics } from '@/data/drf-serializers-topics';

export default function DrfSerializersTopicLayout({ children }) {
  return (
    <TopicShell
      topics={drfSerializersTopics}
      sectionLabel="DRF Serializers"
      sectionHref="/learn/drf-serializers"
    >
      {children}
    </TopicShell>
  );
}

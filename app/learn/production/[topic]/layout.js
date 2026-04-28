import TopicShell from '@/components/learn/TopicShell';
import { productionTopics } from '@/data/production-topics';

export default function ProductionTopicLayout({ children }) {
  return (
    <TopicShell
      topics={productionTopics}
      sectionLabel="Production"
      sectionHref="/learn/production"
    >
      {children}
    </TopicShell>
  );
}

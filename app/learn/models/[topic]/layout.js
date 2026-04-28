import TopicShell from '@/components/learn/TopicShell';
import { modelTopics } from '@/data/models-topics';

export default function ModelsTopicLayout({ children }) {
  return (
    <TopicShell
      topics={modelTopics}
      sectionLabel="Models"
      sectionHref="/learn/models"
    >
      {children}
    </TopicShell>
  );
}

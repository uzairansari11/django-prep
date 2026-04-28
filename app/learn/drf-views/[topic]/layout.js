import TopicShell from '@/components/learn/TopicShell';
import { drfViewsTopics } from '@/data/drf-views-topics';

export default function DrfViewsTopicLayout({ children }) {
  return (
    <TopicShell
      topics={drfViewsTopics}
      sectionLabel="DRF Views"
      sectionHref="/learn/drf-views"
    >
      {children}
    </TopicShell>
  );
}

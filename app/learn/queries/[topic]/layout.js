import TopicShell from '@/components/learn/TopicShell';
import { queryTopics } from '@/data/query-topics';

// Plain server component, no params. The active topic is derived from
// pathname inside TopicShell, so the layout itself never has to re-render
// when the user navigates between sibling topics.
export default function QueriesTopicLayout({ children }) {
  return (
    <TopicShell
      topics={queryTopics}
      sectionLabel="Queries"
      sectionHref="/learn/queries"
    >
      {children}
    </TopicShell>
  );
}

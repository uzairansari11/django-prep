import TopicShell from '@/components/learn/TopicShell';
import { djangoInternalsTopics } from '@/data/django-internals-topics';

export default function DjangoTopicLayout({ children }) {
  return (
    <TopicShell
      topics={djangoInternalsTopics}
      sectionLabel="Internals"
      sectionHref="/learn/django"
    >
      {children}
    </TopicShell>
  );
}

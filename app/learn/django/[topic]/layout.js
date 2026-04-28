import TopicShell from '@/components/learn/TopicShell';
import { djangoInternalsTopics } from '@/data/django-internals-topics';

export default async function DjangoTopicLayout({ children, params }) {
  const { topic: topicId } = await params;
  return (
    <TopicShell
      topicId={topicId}
      topics={djangoInternalsTopics}
      sectionLabel="Internals"
      sectionHref="/learn/django"
    >
      {children}
    </TopicShell>
  );
}

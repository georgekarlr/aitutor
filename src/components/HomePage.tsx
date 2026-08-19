import type { User, Subscription, Conversation } from '@/types';
import { HomeHero } from './home/HomeHero';
import { HomeToolGrid } from './home/HomeToolGrid';
import { HomeRecentActivity } from './home/HomeRecentActivity';
import { HomeStudySparks } from './home/HomeStudySparks';
import { HomeAgentFleetStatus } from './home/HomeAgentFleetStatus';

interface HomePageProps {
  user: User | null;
  subscription: Subscription | null;
  hasActiveSubscription: boolean;
  hasKey: boolean;
  focusStreakCount?: number;
  telemetryCount?: number;
  conversations: Conversation[];
  onStartChat: (prompt?: string) => void;
  onStartTutor: (topic?: string) => void;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onOpenGeminiLive: (topic?: string) => void;
  onOpenDocumentIngestion: () => void;
  onOpenMockExam: (subject?: string) => void;
  onOpenWhiteboard: (topic?: string) => void;
  onOpenPodcast: (topic?: string) => void;
  onOpenFocusHub: () => void;
  onOpenCurriculum: () => void;
  onOpenScratchpad: () => void;
  onOpenStudyBank: () => void;
  onOpenAgentInspector?: () => void;
  onOpenArchitecture?: () => void;
  onOpenSettings: () => void;
}

export function HomePage({
  user,
  subscription,
  hasActiveSubscription,
  hasKey,
  focusStreakCount = 0,
  telemetryCount = 0,
  conversations,
  onStartChat,
  onStartTutor,
  onSelectConversation,
  onNewChat,
  onOpenGeminiLive,
  onOpenDocumentIngestion,
  onOpenMockExam,
  onOpenWhiteboard,
  onOpenPodcast,
  onOpenFocusHub,
  onOpenCurriculum,
  onOpenScratchpad,
  onOpenStudyBank,
  onOpenAgentInspector,
  onOpenArchitecture,
  onOpenSettings,
}: HomePageProps) {
  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-950 px-4 py-6 sm:px-6 md:px-8 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-8 pb-12">
        {/* Hero Section */}
        <HomeHero
          user={user}
          subscription={subscription}
          hasActiveSubscription={hasActiveSubscription}
          hasKey={hasKey}
          focusStreakCount={focusStreakCount}
          onStartChat={onStartChat}
          onStartTutor={onStartTutor}
          onOpenGeminiLive={onOpenGeminiLive}
          onOpenSettings={onOpenSettings}
        />

        {/* Core Studio Tools Bento Grid */}
        <HomeToolGrid
          onOpenGeminiLive={() => onOpenGeminiLive()}
          onOpenTutor={() => onStartTutor()}
          onOpenDocumentIngestion={onOpenDocumentIngestion}
          onOpenMockExam={() => onOpenMockExam()}
          onOpenWhiteboard={() => onOpenWhiteboard()}
          onOpenPodcast={() => onOpenPodcast()}
          onOpenFocusHub={onOpenFocusHub}
          onOpenCurriculum={onOpenCurriculum}
          onOpenScratchpad={onOpenScratchpad}
          onOpenStudyBank={onOpenStudyBank}
          onOpenTelemetry={onOpenAgentInspector}
        />

        {/* Recent Learning Threads & Quick Study Bank */}
        <HomeRecentActivity
          conversations={conversations}
          onSelectConversation={onSelectConversation}
          onNewChat={onNewChat}
          onOpenStudyBank={onOpenStudyBank}
          onOpenCurriculum={onOpenCurriculum}
          onOpenTutor={() => onStartTutor()}
        />

        {/* Curated High-Yield Study Sparks */}
        <HomeStudySparks
          onStartChat={onStartChat}
          onStartTutor={onStartTutor}
          onOpenWhiteboard={onOpenWhiteboard}
        />

        {/* Autonomous Multi-Agent Fleet Status */}
        <HomeAgentFleetStatus
          telemetryCount={telemetryCount}
          onOpenAgentInspector={onOpenAgentInspector}
          onOpenArchitecture={onOpenArchitecture}
        />
      </div>
    </div>
  );
}

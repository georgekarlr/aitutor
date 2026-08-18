import type { Conversation } from '@/types';

export interface ExtractedStudyContext {
  contextText: string;
  topicSuggestion: string;
  messageCount: number;
  attachmentCount: number;
  artifactCount: number;
  previewSummary: string;
  hasRichContent: boolean;
}

/**
 * Extracts comprehensive conversational context, user questions, tutor explanations,
 * uploaded file contents, and studio artifacts from a given Conversation.
 */
export function extractConversationStudyContext(
  conv: Conversation | null | undefined
): ExtractedStudyContext {
  if (!conv || !conv.messages || conv.messages.length === 0) {
    return {
      contextText: '',
      topicSuggestion: conv?.title && conv.title !== 'New chat' ? conv.title : '',
      messageCount: 0,
      attachmentCount: 0,
      artifactCount: 0,
      previewSummary: 'No messages in this conversation yet.',
      hasRichContent: false,
    };
  }

  const attachments = conv.messages.flatMap((m) => m.attachments || []);
  const docSnippets = attachments
    .map((a) => {
      const typeStr = a.mimeType ? ` (${a.mimeType})` : '';
      let contentSnippet = '';
      if (a.data) {
        // If data is text-based or base64 preview
        try {
          if (a.data.length < 3000) {
            contentSnippet = `\nContent Excerpt:\n${a.data.slice(0, 1500)}`;
          } else {
            contentSnippet = `\nContent Excerpt (first 1500 chars):\n${a.data.slice(0, 1500)}...`;
          }
        } catch {
          // ignore
        }
      }
      return `[Attached Document: "${a.name}"${typeStr}]${contentSnippet}`;
    })
    .join('\n\n');

  // Filter messages that have meaningful content
  const meaningfulMessages = conv.messages.filter((m) => m.content && m.content.trim().length > 0);

  // Take the most relevant messages (up to 30 recent turns)
  const turns = meaningfulMessages.slice(-30).map((m) => {
    const roleName = m.role === 'user' ? 'Student' : 'Tutor';
    let artifactNote = '';
    if (m.studioArtifact) {
      artifactNote = `\n[Generated Artifact (${m.studioArtifact.type}): "${m.studioArtifact.title}" - ${m.studioArtifact.summary || ''}]`;
    }
    return `${roleName}: ${m.content}${artifactNote}`;
  }).join('\n\n');

  const contextParts: string[] = [];
  contextParts.push(`SOURCE CONVERSATION: "${conv.title}"`);
  
  if (docSnippets) {
    contextParts.push(`UPLOADED DOCUMENTS & ATTACHMENTS:\n${docSnippets}`);
  }
  
  if (turns) {
    contextParts.push(`CHAT TRANSCRIPT & TUTORING EXCHANGES:\n${turns}`);
  }

  const contextText = contextParts.join('\n\n===============================\n\n');

  // Find recent student inquiries to show in the preview
  const userQueries = conv.messages
    .filter((m) => m.role === 'user')
    .slice(-3)
    .map((m) => m.content.replace(/\n+/g, ' ').trim().slice(0, 70))
    .filter(Boolean);

  const previewSummary = userQueries.length > 0
    ? `Recent queries: ${userQueries.map((q) => `"${q}${q.length >= 70 ? '...' : ''}"`).join(' | ')}`
    : `${meaningfulMessages.length} messages in discussion.`;

  return {
    contextText,
    topicSuggestion: conv.title && conv.title !== 'New chat' ? conv.title : '',
    messageCount: meaningfulMessages.length,
    attachmentCount: attachments.length,
    artifactCount: conv.messages.filter((m) => m.studioArtifact).length,
    previewSummary,
    hasRichContent: meaningfulMessages.length > 0 || attachments.length > 0,
  };
}

export interface ChatUser {
  _id: string;
  name?: string;
  display_name?: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  email: string;
  role: string;
  profileImageUrl?: string;
  profilePicture?: string;
}

export interface Conversation {
  _id: string;
  type?: 'direct' | 'context' | 'system' | 'group';
  name?: string | null;
  contextType?: string | null;
  contextId?: string | null;
  participants: (string | ChatUser)[];
  organizationId: string;
  lastMessage?: string;
  lastMessageAt?: string;
  lastMessageType?: string;
  unreadCount?: Record<string, number>;
  createdAt: string;
  updatedAt: string;
  // Computed field for UI
  otherParticipant?: ChatUser;
  display_name?: string;
  conversation_label?: string;
}

export interface ChatMessage {
  _id: string;
  conversationId: string;
  senderId: string | ChatUser | null;
  receiverId?: string | ChatUser | null;
  text: string;
  isRead: boolean;
  messageType?: string;
  contextType?: string | null;
  contextId?: string | null;
  attachments?: any[];
  metadata?: Record<string, any>;
  createdAt: string;
}

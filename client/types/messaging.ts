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
  participants: (string | ChatUser)[];
  organizationId: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount?: Record<string, number>;
  createdAt: string;
  updatedAt: string;
  // Computed field for UI
  otherParticipant?: ChatUser;
}

export interface ChatMessage {
  _id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  text: string;
  isRead: boolean;
  createdAt: string;
}

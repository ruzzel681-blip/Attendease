import React, { useState, useEffect, useRef } from 'react';
import { 
  UserProfile, 
  DirectMessage 
} from '../../types';
import { 
  subscribeUserDirectMessages, 
  sendDirectMessage, 
  markMessagesAsRead, 
  subscribeAllUsers 
} from '../../services/attendanceService';
import { useAuth } from '../../contexts/AuthContext';
import { processFileUpload, FileUploadResult } from '../../utils/fileUpload';
import { AvatarDisplay } from '../common/AvatarDisplay';
import { 
  MessageSquare, 
  Send, 
  Paperclip, 
  X, 
  Search, 
  FileText, 
  Download, 
  Check, 
  CheckCheck, 
  Clock, 
  ArrowLeft,
  Loader2
} from 'lucide-react';

interface DirectMessagesTabProps {
  currentUser?: UserProfile | null;
  initialSelectedUser?: UserProfile | null;
  preselectedRecipientId?: string;
  preselectedRecipientName?: string;
}

export const DirectMessagesTab: React.FC<DirectMessagesTabProps> = ({
  currentUser: propCurrentUser,
  initialSelectedUser = null,
  preselectedRecipientId,
  preselectedRecipientName
}) => {
  const { userProfile: authProfile } = useAuth();
  const currentUser = propCurrentUser || authProfile;

  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(initialSelectedUser);
  const [searchQuery, setSearchQuery] = useState('');

  // Input states
  const [messageText, setMessageText] = useState('');
  const [attachment, setAttachment] = useState<FileUploadResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentUserId = currentUser?.uid;

  // Subscribe to all users
  useEffect(() => {
    if (!currentUserId) return;
    const unsubUsers = subscribeAllUsers((users) => {
      setAllUsers(users.filter((u) => u.uid !== currentUserId && u.status === 'approved'));
    });
    return () => unsubUsers();
  }, [currentUserId]);

  // If initialSelectedUser changes, update selectedUser
  useEffect(() => {
    if (initialSelectedUser) {
      setSelectedUser(initialSelectedUser);
    }
  }, [initialSelectedUser]);

  // Handle preselected recipient from props
  useEffect(() => {
    if (!preselectedRecipientId) return;

    if (allUsers.length > 0) {
      const found = allUsers.find((u) => u.uid === preselectedRecipientId);
      if (found) {
        setSelectedUser(found);
        return;
      }
    }

    if (preselectedRecipientName) {
      setSelectedUser({
        uid: preselectedRecipientId,
        name: preselectedRecipientName,
        email: '',
        role: 'teacher',
        userCode: '',
        status: 'approved',
        createdAt: ''
      });
    }
  }, [preselectedRecipientId, preselectedRecipientName, allUsers]);

  // Subscribe to direct messages for currentUser
  useEffect(() => {
    if (!currentUserId) return;
    const unsubMessages = subscribeUserDirectMessages(currentUserId, (data) => {
      setMessages(data);
    });
    return () => unsubMessages();
  }, [currentUserId]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedUser]);

  // Mark unread messages as read when conversation is open
  useEffect(() => {
    if (!selectedUser || !currentUserId) return;

    const unreadMsgIds = messages
      .filter((m) => {
        const rId = m.recipientId || m.receiverId;
        const isUnread = !m.read && !m.isRead;
        return m.senderId === selectedUser.uid && rId === currentUserId && isUnread;
      })
      .map((m) => m.id);

    if (unreadMsgIds.length > 0) {
      markMessagesAsRead(unreadMsgIds);
    }
  }, [selectedUser, messages, currentUserId]);

  if (!currentUser) {
    return (
      <div className="bg-white/90 dark:bg-[#111318]/90 border border-stone-200 dark:border-stone-800 rounded-3xl p-12 text-center text-stone-400 space-y-2 folio-card">
        <Loader2 className="h-6 w-6 animate-spin mx-auto text-stone-500" />
        <p className="text-xs font-sans">Loading messages...</p>
      </div>
    );
  }

  // Filter messages for currently selected conversation
  const currentConversationMessages = selectedUser && currentUserId
    ? messages.filter((m) => {
        const rId = m.recipientId || m.receiverId;
        return (
          (m.senderId === currentUserId && rId === selectedUser.uid) ||
          (m.senderId === selectedUser.uid && rId === currentUserId)
        );
      })
    : [];

  // Group contacts by recent conversation
  const contactUids = currentUserId
    ? Array.from(
        new Set(
          messages.map((m) => {
            const rId = m.recipientId || m.receiverId;
            return m.senderId === currentUserId ? rId : m.senderId;
          }).filter(Boolean) as string[]
        )
      )
    : [];

  // Filter contacts by search
  const filteredUsers = allUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.departmentOrLocation && u.departmentOrLocation.toLowerCase().includes(searchQuery.toLowerCase())) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort: users with active conversations first, then others
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const aHasConvo = contactUids.includes(a.uid);
    const bHasConvo = contactUids.includes(b.uid);
    if (aHasConvo && !bHasConvo) return -1;
    if (!aHasConvo && bHasConvo) return 1;
    return a.name.localeCompare(b.name);
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const result = await processFileUpload(file);
      setAttachment(result);
    } catch (err: any) {
      alert(err.message || 'File upload failed');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !currentUser) return;
    if (!messageText.trim() && !attachment) return;

    setIsSending(true);
    try {
      await sendDirectMessage(
        currentUser.uid,
        currentUser.name,
        currentUser.role,
        selectedUser.uid,
        selectedUser.name,
        messageText.trim(),
        attachment ? {
          url: attachment.dataUrl || attachment.attachmentUrl,
          name: attachment.fileName || attachment.attachmentName,
          size: attachment.fileSize || attachment.attachmentSize,
          type: attachment.fileType || attachment.attachmentType
        } : undefined
      );

      setMessageText('');
      setAttachment(null);
    } catch (err: any) {
      alert(err.message || 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const getUnreadCount = (userId: string) => {
    if (!currentUserId) return 0;
    return messages.filter((m) => {
      const rId = m.recipientId || m.receiverId;
      const isUnread = !m.read && !m.isRead;
      return m.senderId === userId && rId === currentUserId && isUnread;
    }).length;
  };

  return (
    <div className="bg-white/90 dark:bg-[#111318]/90 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-xs overflow-hidden flex flex-col md:flex-row h-[680px] folio-card">
      
      {/* Left Pane: Contacts List */}
      <div
        className={`w-full md:w-80 border-r border-stone-200 dark:border-stone-800 flex flex-col shrink-0 ${
          selectedUser ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-stone-100 dark:border-stone-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold italic text-stone-900 dark:text-white text-base flex items-center space-x-2">
              <MessageSquare className="h-4 w-4 text-stone-500" />
              <span>Direct Messages</span>
            </h3>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
              {contactUids.length}
            </span>
          </div>

          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-stone-400" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl text-xs text-stone-900 dark:text-white focus:outline-none focus:border-stone-900 dark:focus:border-white font-sans"
            />
          </div>
        </div>

        {/* Contacts Scroll */}
        <div className="flex-1 overflow-y-auto divide-y divide-stone-100 dark:divide-stone-800/60">
          {sortedUsers.length === 0 ? (
            <div className="p-6 text-center text-xs text-stone-400 font-sans">
              No contacts found.
            </div>
          ) : (
            sortedUsers.map((user) => {
              const isSelected = selectedUser?.uid === user.uid;
              const unreadCount = getUnreadCount(user.uid);
              const lastMessage = messages
                .filter((m) => {
                  const rId = m.recipientId || m.receiverId;
                  return (
                    (m.senderId === user.uid && rId === currentUserId) ||
                    (m.senderId === currentUserId && rId === user.uid)
                  );
                })
                .slice(-1)[0];

              const lastContent = lastMessage?.message || lastMessage?.content;

              return (
                <button
                  key={user.uid}
                  onClick={() => setSelectedUser(user)}
                  className={`w-full p-3.5 flex items-center space-x-3 text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-stone-100 dark:bg-stone-800'
                      : 'hover:bg-stone-50 dark:hover:bg-stone-800/40'
                  }`}
                >
                  <div className="relative">
                    <AvatarDisplay avatarId={user.avatar} name={user.name} size="md" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-stone-900 dark:bg-white text-white dark:text-stone-950 text-[9px] font-mono font-bold rounded-full h-4 w-4 flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-heading font-bold text-xs text-stone-900 dark:text-white truncate">
                        {user.name}
                      </span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold uppercase ${
                        user.role === 'teacher'
                          ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-950'
                          : 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300'
                      }`}>
                        {user.role}
                      </span>
                    </div>

                    <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate font-sans">
                      {lastMessage ? (
                        lastMessage.attachmentUrl && !lastContent ? (
                          <span className="italic flex items-center">
                            <Paperclip className="h-3 w-3 mr-1 text-stone-400" />
                            {lastMessage.attachmentName || 'File'}
                          </span>
                        ) : (
                          lastContent
                        )
                      ) : (
                        user.departmentOrLocation || 'Start message'
                      )}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right Pane: Active Chat */}
      <div className={`flex-1 flex flex-col h-full bg-stone-50/40 dark:bg-stone-950/40 ${
        !selectedUser ? 'hidden md:flex' : 'flex'
      }`}>
        {selectedUser ? (
          <>
            {/* Top Bar of Active Conversation */}
            <div className="p-3.5 bg-white/90 dark:bg-[#111318]/90 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="md:hidden p-1.5 rounded-xl text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <AvatarDisplay avatarId={selectedUser.avatar} name={selectedUser.name} size="md" />
                <div>
                  <h4 className="font-heading font-bold text-stone-900 dark:text-white text-sm">
                    {selectedUser.name}
                  </h4>
                  <div className="flex items-center space-x-2 text-[10px] text-stone-500 font-sans">
                    {selectedUser.userCode && <span className="font-mono">#{selectedUser.userCode}</span>}
                    {selectedUser.userCode && <span>•</span>}
                    <span className="capitalize font-mono">{selectedUser.role}</span>
                    {selectedUser.departmentOrLocation && (
                      <>
                        <span>•</span>
                        <span>{selectedUser.departmentOrLocation}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {selectedUser.officeHours && (
                <span className="hidden sm:inline-flex items-center text-[10px] font-mono font-bold text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 px-2.5 py-1 rounded-full border border-stone-200 dark:border-stone-700">
                  <Clock className="h-3 w-3 mr-1 text-stone-400" />
                  {selectedUser.officeHours}
                </span>
              )}
            </div>

            {/* Message Thread */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
              {currentConversationMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-400 space-y-2 font-sans">
                  <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center justify-center border border-stone-200 dark:border-stone-700">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-heading font-bold text-stone-700 dark:text-stone-300">
                    No messages yet with {selectedUser.name}
                  </p>
                  <p className="text-[11px] max-w-xs text-stone-500">
                    Start the conversation below.
                  </p>
                </div>
              ) : (
                currentConversationMessages.map((msg) => {
                  const isMe = msg.senderId === currentUserId;
                  const timeStr = msg.timestamp || msg.createdAt;
                  const timeFormatted = timeStr 
                    ? new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '';
                  const contentText = msg.message || msg.content;
                  const isMsgRead = msg.read ?? msg.isRead;

                  return (
                    <div
                      key={msg.id}
                      className={`flex items-end space-x-2 ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isMe && (
                        <AvatarDisplay avatarId={selectedUser.avatar} name={selectedUser.name} size="sm" />
                      )}

                      <div
                        className={`max-w-[78%] rounded-2xl p-3 space-y-1.5 shadow-2xs text-xs font-sans ${
                          isMe
                            ? 'bg-stone-900 text-stone-100 dark:bg-white dark:text-stone-950 rounded-br-xs border border-stone-900 dark:border-white'
                            : 'bg-white dark:bg-[#111318] text-stone-900 dark:text-white border border-stone-200/80 dark:border-stone-800 rounded-bl-xs'
                        }`}
                      >
                        {/* Text Content */}
                        {contentText && (
                          <p className="whitespace-pre-wrap leading-relaxed break-words">
                            {contentText}
                          </p>
                        )}

                        {/* Attachment Box */}
                        {msg.attachmentUrl && (
                          <div
                            className={`rounded-xl p-2 mt-1 border ${
                              isMe
                                ? 'bg-white/10 border-white/20'
                                : 'bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300'
                            }`}
                          >
                            {msg.attachmentType?.startsWith('image/') ? (
                              <div className="space-y-1.5">
                                <img
                                  src={msg.attachmentUrl}
                                  alt={msg.attachmentName || 'Attachment'}
                                  className="max-h-48 rounded-lg object-contain bg-black/5"
                                />
                                <div className="flex items-center justify-between text-[10px]">
                                  <span className="truncate max-w-[140px]">
                                    {msg.attachmentName}
                                  </span>
                                  <a
                                    href={msg.attachmentUrl}
                                    download={msg.attachmentName || 'image'}
                                    className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10"
                                  >
                                    <Download className="h-3 w-3" />
                                  </a>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between space-x-2">
                                <div className="flex items-center space-x-1.5 min-w-0">
                                  <FileText className="h-4 w-4 shrink-0 text-stone-400" />
                                  <span className="text-[11px] font-medium truncate max-w-[150px]">
                                    {msg.attachmentName || 'Document'}
                                  </span>
                                </div>
                                <a
                                  href={msg.attachmentUrl}
                                  download={msg.attachmentName || 'attachment'}
                                  className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 shrink-0"
                                >
                                  <Download className="h-3 w-3" />
                                </a>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Timestamp & Read Status */}
                        <div
                          className={`flex items-center justify-end space-x-1 text-[9px] font-mono ${
                            isMe ? 'text-stone-400 dark:text-stone-600' : 'text-stone-400'
                          }`}
                        >
                          {timeFormatted && <span>{timeFormatted}</span>}
                          {isMe && (
                            <span>
                              {isMsgRead ? (
                                <CheckCheck className="h-3 w-3 text-stone-300 dark:text-stone-700" title="Read" />
                              ) : (
                                <Check className="h-3 w-3 opacity-60" title="Sent" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>

                      {isMe && (
                        <AvatarDisplay avatarId={currentUser.avatar} name={currentUser.name} size="sm" />
                      )}
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Attachment Preview if selected */}
            {attachment && (
              <div className="p-2.5 mx-4 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl flex items-center justify-between text-xs animate-in fade-in duration-100 font-sans">
                <div className="flex items-center space-x-2 min-w-0">
                  <FileText className="h-4 w-4 text-stone-500 shrink-0" />
                  <span className="font-heading font-bold text-stone-800 dark:text-stone-200 truncate max-w-xs">
                    {attachment.fileName || attachment.attachmentName}
                  </span>
                  <span className="text-[10px] text-stone-400 font-mono">
                    ({Math.round((attachment.fileSize || attachment.attachmentSize || 0) / 1024)} KB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setAttachment(null)}
                  className="p-1 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-full text-stone-500 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Message Input Box */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 bg-white/90 dark:bg-[#111318]/90 border-t border-stone-200 dark:border-stone-800 flex items-center space-x-2"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*,.pdf,.doc,.docx,.txt"
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                title="Attach file"
                className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 text-stone-600 dark:text-stone-300 hover:border-stone-900 dark:hover:border-white transition-colors shrink-0 cursor-pointer"
              >
                <Paperclip className="h-4 w-4" />
              </button>

              <input
                type="text"
                placeholder={`Message ${selectedUser.name}...`}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="flex-1 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-stone-900 dark:focus:border-white font-sans"
              />

              <button
                type="submit"
                disabled={isSending || (!messageText.trim() && !attachment)}
                className="p-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-100 text-white dark:text-stone-950 font-bold text-xs disabled:opacity-40 transition-colors shrink-0 flex items-center justify-center cursor-pointer shadow-2xs border border-stone-900 dark:border-white"
              >
                {isSending ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white dark:border-stone-900/30 dark:border-t-stone-900 rounded-full animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </form>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-stone-400 space-y-2.5 font-sans">
            <div className="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center justify-center border border-stone-200 dark:border-stone-700">
              <MessageSquare className="h-6 w-6" />
            </div>
            <h3 className="font-heading font-bold text-stone-800 dark:text-stone-200 text-sm">
              Select a conversation
            </h3>
            <p className="text-xs max-w-sm text-stone-500">
              Select a contact to view or send messages.
            </p>
          </div>
        )}
      </div>

    </div>
  );
};

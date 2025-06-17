import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Send, 
  Paperclip, 
  Smile, 
  MoreVertical,
  Phone,
  Video,
  Users,
  AlertCircle,
  CheckCircle,
  Clock,
  MessageSquare,
  Image as ImageIcon,
  File
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useWebSocket } from "@/hooks/use-websocket";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface Message {
  id: number;
  fromUserId: number;
  toUserId: number;
  message: string;
  timestamp: string;
  read: boolean;
  messageType: 'text' | 'image' | 'file' | 'alert';
  metadata?: any;
  fromUser?: {
    id: number;
    fullName: string;
    role: string;
  };
}

interface Contact {
  id: number;
  fullName: string;
  role: string;
  phoneNumber?: string;
  lastSeen?: string;
  isOnline: boolean;
  unreadCount: number;
  lastMessage?: string;
}

interface ChatInterfaceProps {
  selectedContact: number | null;
  onContactSelect: (contactId: number) => void;
}

export function ChatInterface({ selectedContact, onContactSelect }: ChatInterfaceProps) {
  const { user } = useAuth();
  const { sendMessage } = useWebSocket();
  const [message, setMessage] = useState("");
  const [onlineUsers, setOnlineUsers] = useState<Set<number>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);

  // Fetch contacts (other users)
  const { data: contacts = [], isLoading: contactsLoading } = useQuery<Contact[]>({
    queryKey: ["/api/chat/contacts"],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Fetch messages for selected contact
  const { data: messages = [], isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ["/api/chat/messages", selectedContact],
    enabled: !!selectedContact,
    refetchInterval: 5000 // Refresh every 5 seconds
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { toUserId: number; message: string; messageType?: string }) => {
      const response = await apiRequest("POST", "/api/chat/messages", messageData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/messages", selectedContact] });
      queryClient.invalidateQueries({ queryKey: ["/api/chat/contacts"] });
      setMessage("");
      
      // Send via WebSocket for real-time delivery
      if (selectedContact) {
        sendMessage({
          type: "chat_message",
          data: {
            toUserId: selectedContact,
            message: message,
            timestamp: new Date().toISOString()
          }
        });
      }
    }
  });

  // Mark messages as read
  const markAsReadMutation = useMutation({
    mutationFn: async (fromUserId: number) => {
      await apiRequest("POST", `/api/chat/messages/read/${fromUserId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/contacts"] });
    }
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark messages as read when contact is selected
  useEffect(() => {
    if (selectedContact && user) {
      markAsReadMutation.mutate(selectedContact);
    }
  }, [selectedContact]);

  // Handle typing indicators
  const handleTyping = () => {
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    if (selectedContact) {
      sendMessage({
        type: "typing_start",
        data: { toUserId: selectedContact }
      });

      const timeout = setTimeout(() => {
        sendMessage({
          type: "typing_stop",
          data: { toUserId: selectedContact }
        });
      }, 2000);

      setTypingTimeout(timeout);
    }
  };

  const handleSendMessage = () => {
    if (!message.trim() || !selectedContact || sendMessageMutation.isPending) return;

    sendMessageMutation.mutate({
      toUserId: selectedContact,
      message: message.trim(),
      messageType: "text"
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = diff / (1000 * 60 * 60);

    if (hours < 1) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (hours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString();
    }
  };

  const getStatusIcon = (contact: Contact) => {
    if (contact.isOnline) {
      return <div className="w-3 h-3 bg-green-500 rounded-full" />;
    }
    return <div className="w-3 h-3 bg-gray-400 rounded-full" />;
  };

  const selectedContactData = contacts.find(c => c.id === selectedContact);

  return (
    <div className="flex h-full">
      {/* Contacts Sidebar */}
      <Card className="w-80 h-full rounded-none border-r">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5" />
            <span>Conversations</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 h-full">
          <ScrollArea className="h-full">
            <div className="space-y-1 p-3">
              {contactsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-muted-foreground">Loading contacts...</div>
                </div>
              ) : contacts.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-muted-foreground">No contacts available</div>
                </div>
              ) : (
                contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className={cn(
                      "flex items-center space-x-3 p-3 rounded-lg cursor-pointer hover:bg-muted transition-colors",
                      selectedContact === contact.id && "bg-muted"
                    )}
                    onClick={() => onContactSelect(contact.id)}
                  >
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {contact.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1">
                        {getStatusIcon(contact)}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium truncate">
                          {contact.fullName}
                        </p>
                        {contact.unreadCount > 0 && (
                          <Badge variant="destructive" className="h-5 w-5 flex items-center justify-center p-0 text-xs">
                            {contact.unreadCount}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground capitalize">
                          {contact.role.replace('_', ' ')}
                        </p>
                        {contact.lastSeen && (
                          <p className="text-xs text-muted-foreground">
                            {formatTimestamp(contact.lastSeen)}
                          </p>
                        )}
                      </div>
                      {contact.lastMessage && (
                        <p className="text-xs text-muted-foreground truncate mt-1">
                          {contact.lastMessage}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col h-full">
        {selectedContact && selectedContactData ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {selectedContactData.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1">
                    {getStatusIcon(selectedContactData)}
                  </div>
                </div>
                <div>
                  <p className="font-medium">{selectedContactData.fullName}</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {selectedContactData.role.replace('_', ' ')}
                    {typingUsers.has(selectedContact) && " • typing..."}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Phone className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Voice call</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Video className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Video call</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messagesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-muted-foreground">Loading messages...</div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-muted-foreground">No messages yet. Start the conversation!</div>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex",
                        msg.fromUserId === user?.id ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-xs lg:max-w-md px-4 py-2 rounded-lg",
                          msg.fromUserId === user?.id
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        )}
                      >
                        <p className="text-sm">{msg.message}</p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs opacity-70">
                            {formatTimestamp(msg.timestamp)}
                          </p>
                          {msg.fromUserId === user?.id && (
                            <div className="ml-2">
                              {msg.read ? (
                                <CheckCircle className="w-3 h-3 opacity-70" />
                              ) : (
                                <Clock className="w-3 h-3 opacity-70" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t">
              <div className="flex items-end space-x-2">
                <div className="flex space-x-1">
                  <Button variant="ghost" size="icon">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex-1">
                  <Textarea
                    ref={inputRef}
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      handleTyping();
                    }}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    className="min-h-0 resize-none"
                    rows={1}
                  />
                </div>
                
                <Button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || sendMessageMutation.isPending}
                  size="icon"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Select a conversation</p>
              <p className="text-muted-foreground">
                Choose a contact from the sidebar to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
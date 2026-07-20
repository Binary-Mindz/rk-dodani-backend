# Chat Frontend Implementation Guide

This guide is based on the current backend chat implementation.

The chat system uses:

- REST API for conversation/member/message history management
- Socket.IO for real-time message, typing, and read receipt events
- JWT bearer token for both REST and socket authentication

Base REST path:

```txt
/chat
```

This exists in the backend because `ChatController` is mounted with
`@Controller('chat')`. So every route in this guide starts with `/chat`.

All REST requests require:

```txt
Authorization: Bearer <access_token>
```

Socket connection requires the same access token in `auth.token`.

---

## 1. Conversation Types

There are two conversation types:

```ts
type ConversationType = 'DIRECT' | 'GROUP';
```

Use `DIRECT` for one-to-one chat.

Use `GROUP` for group/team chat.

---

## 2. Normal Chat APIs

Normal chat does not check team ownership or team admin permissions.

### Create Normal Conversation

```http
POST /chat/conversations
```

Request body:

```json
{
  "type": "DIRECT",
  "participantIds": ["user-id-1"],
  "name": "Optional Group Name"
}
```

Notes:

- `participantIds` should not include the logged-in user.
- Backend automatically adds the logged-in user as `OWNER`.
- `name` is optional for `DIRECT`.
- `name` is recommended for `GROUP`.

Example direct chat:

```json
{
  "type": "DIRECT",
  "participantIds": ["target-user-id"]
}
```

Example group chat:

```json
{
  "type": "GROUP",
  "name": "Project Discussion",
  "participantIds": ["user-id-1", "user-id-2"]
}
```

### Add Member To Normal Group

```http
POST /chat/conversations/:conversationId/members
```

Request body:

```json
{
  "userId": "user-id-to-add"
}
```

Permission:

- Only conversation `OWNER` or `ADMIN` can add members.
- This is for normal group conversation.
- No team validation is applied here.

### Block Normal Conversation Member

```http
POST /chat/conversations/:conversationId/members/:memberUserId/block
```

Optional request body:

```json
{
  "reason": "Spam or policy violation"
}
```

Permission:

- Only conversation `OWNER` or `ADMIN` can block members.
- A member cannot block themselves.
- Conversation `OWNER` cannot be blocked.

### Unblock Normal Conversation Member

```http
POST /chat/conversations/:conversationId/members/:memberUserId/unblock
```

Permission:

- Only conversation `OWNER` or `ADMIN` can unblock members.

---

## 3. Team Chat APIs

Team chat applies team-based permission checks.

### Create Team Conversation

```http
POST /chat/team/conversations
```

Request body is the same as normal conversation:

```json
{
  "type": "GROUP",
  "name": "Team Chat",
  "participantIds": ["team-member-user-id"]
}
```

Backend checks:

- All participants must belong to the same team as the requester.
- Logged-in user is added as `OWNER`.

### Add Member To Team Conversation

```http
POST /chat/team/conversations/:conversationId/members
```

Request body:

```json
{
  "userId": "team-member-user-id"
}
```

Permission:

- Team creator can add members.
- Team admin can add members.
- Normal team member cannot add members.
- New member must belong to the same team.

Expected errors:

- `403 Forbidden`: normal member tries to add a member.
- `400 Bad Request`: user is not from the same team.
- `409 Conflict`: user is already in the conversation.

### Block Team Conversation Member

```http
POST /chat/team/conversations/:conversationId/members/:memberUserId/block
```

Optional request body:

```json
{
  "reason": "Spam or policy violation"
}
```

Permission:

- Team creator can block members.
- Team admin can block members.
- Normal team member cannot block members.
- A member cannot block themselves.
- Conversation `OWNER` cannot be blocked.

### Unblock Team Conversation Member

```http
POST /chat/team/conversations/:conversationId/members/:memberUserId/unblock
```

Permission:

- Team creator can unblock members.
- Team admin can unblock members.
- Normal team member cannot unblock members.

---

## 4. Common REST APIs

These APIs are used for both normal chat and team chat.

### Get Conversations

```http
GET /chat/conversations
```

Returns all conversations where the logged-in user is a member.

Each conversation includes:

- members
- last message in `messages[0]`

Frontend use:

- Render conversation list/sidebar.
- Use `messages[0]` as preview text.

### Get Messages

```http
GET /chat/conversations/:conversationId/messages?skip=0&take=50
```

Returns messages newest-first.

Frontend should reverse before rendering if the UI shows oldest-to-newest.

Example:

```ts
const messages = await api.getMessages(conversationId, { skip: 0, take: 50 });
const renderMessages = [...messages].reverse();
```

### Get Conversation Members

```http
GET /chat/conversations/:conversationId/members
```

Only conversation members can access this.

Use this for:

- member list
- avatar stack
- group member modal
- permission UI decisions

---

## 5. Socket.IO Setup

Install:

```bash
npm install socket.io-client
```

Create socket client:

```ts
import { io, Socket } from 'socket.io-client';

export function createChatSocket(token: string): Socket {
  return io(process.env.NEXT_PUBLIC_API_URL!, {
    auth: {
      token,
    },
  });
}
```

Alternative if your API expects full bearer text:

```ts
auth: {
  token: `Bearer ${token}`,
}
```

The backend currently accepts both raw token and `Bearer <token>`.

---

## 6. Socket Events

### Join Room

Call this after selecting a conversation.

```ts
socket.emit(
  'joinRoom',
  { conversationId },
  (ack: { event: string; data?: string; message?: string }) => {
    if (ack.event !== 'joinedRoom') {
      console.error(ack.message);
      return;
    }
  },
);
```

Backend checks that the user is a conversation member before joining the room.

### Send Message

```ts
socket.emit(
  'sendMessage',
  {
    conversationId,
    content: messageText,
  },
  (ack: { status: 'ok' | 'error'; data?: Message; message?: string }) => {
    if (ack.status === 'error') {
      console.error(ack.message);
      return;
    }
  },
);
```

Do not append the message only from the send callback if you are already listening to `newMessage`.

Recommended:

- send the event
- wait for `newMessage`
- append from `newMessage`

This keeps sender and receiver behavior consistent.

### Typing Indicator

```ts
socket.emit('typing', {
  conversationId,
  isTyping: true,
});

socket.emit('typing', {
  conversationId,
  isTyping: false,
});
```

Frontend should debounce this.

Example:

```ts
let typingTimer: ReturnType<typeof setTimeout>;

function handleTyping(value: string) {
  setMessage(value);

  socket.emit('typing', {
    conversationId,
    isTyping: true,
  });

  clearTimeout(typingTimer);
  typingTimer = setTimeout(() => {
    socket.emit('typing', {
      conversationId,
      isTyping: false,
    });
  }, 1000);
}
```

### Mark Message As Read

```ts
socket.emit(
  'markAsRead',
  {
    conversationId,
    messageId,
  },
  (ack: { status: 'ok' | 'error'; message?: string }) => {
    if (ack.status === 'error') {
      console.error(ack.message);
    }
  },
);
```

Call this when:

- conversation is open
- message is visible
- message sender is not the current user

---

## 7. Socket Listeners

Register listeners once when the chat screen mounts.

```ts
socket.on('newMessage', (message: Message) => {
  setMessages((prev) => {
    if (prev.some((item) => item.id === message.id)) return prev;
    return [...prev, message];
  });
});

socket.on('typingIndicator', (payload: TypingPayload) => {
  setTypingUsers((prev) => ({
    ...prev,
    [payload.userId]: payload.isTyping,
  }));
});

socket.on('messageRead', (payload: MessageReadPayload) => {
  setMessages((prev) =>
    prev.map((message) => {
      if (message.id !== payload.messageId) return message;

      return {
        ...message,
        readReceipts: [
          ...message.readReceipts.filter(
            (receipt) => receipt.userId !== payload.userId,
          ),
          {
            userId: payload.userId,
            readAt: payload.readAt,
          },
        ],
      };
    }),
  );
});
```

Cleanup on unmount:

```ts
socket.off('newMessage');
socket.off('typingIndicator');
socket.off('messageRead');
socket.disconnect();
```

---

## 8. Recommended Frontend Flow

### Open Chat Page

```txt
1. Create socket connection
2. GET /chat/conversations
3. Render conversation list
```

### Select Conversation

```txt
1. Set active conversation
2. GET /chat/conversations/:id/messages?skip=0&take=50
3. Reverse messages for UI if needed
4. socket.emit('joinRoom', { conversationId })
5. Mark visible unread messages as read
```

### Send Message

```txt
1. Validate non-empty input
2. Emit sendMessage
3. Clear input
4. Append message when newMessage event arrives
```

### Load Older Messages

```txt
1. User scrolls to top
2. GET /chat/conversations/:id/messages?skip=currentCount&take=50
3. Prepend reversed older messages to the list
```

---

## 9. TypeScript Types

```ts
export type ConversationType = 'DIRECT' | 'GROUP';
export type ConversationRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export interface UserSummary {
  id: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
}

export interface ConversationMember {
  id: string;
  conversationId: string;
  userId: string;
  role: ConversationRole;
  joinedAt: string;
  leftAt: string | null;
  blockedAt: string | null;
  blockedById: string | null;
  blockReason: string | null;
  user: UserSummary;
}

export interface ReadReceipt {
  userId: string;
  readAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId?: string;
  content: string;
  mediaUrl: string | null;
  mediaType: string | null;
  fileUrl: string | null;
  fileType: string | null;
  createdAt: string;
  updatedAt?: string;
  sender: UserSummary;
  readReceipts: ReadReceipt[];
}

export interface Conversation {
  id: string;
  type: ConversationType;
  name: string | null;
  title?: string | null;
  description?: string | null;
  avatar?: string | null;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
  members: ConversationMember[];
  messages: Message[];
}

export interface TypingPayload {
  userId: string;
  isTyping: boolean;
}

export interface MessageReadPayload {
  messageId: string;
  userId: string;
  readAt: string;
}
```

---

## 10. API Helper Example

```ts
const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function apiRequest<T>(
  path: string,
  token: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message || 'Request failed');
  }

  return response.json();
}

export function getConversations(token: string) {
  return apiRequest<Conversation[]>('/chat/conversations', token);
}

export function getMessages(
  token: string,
  conversationId: string,
  skip = 0,
  take = 50,
) {
  return apiRequest<Message[]>(
    `/chat/conversations/${conversationId}/messages?skip=${skip}&take=${take}`,
    token,
  );
}

export function createConversation(
  token: string,
  body: {
    type: ConversationType;
    participantIds: string[];
    name?: string;
  },
) {
  return apiRequest<Conversation>('/chat/conversations', token, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function createTeamConversation(
  token: string,
  body: {
    type: ConversationType;
    participantIds: string[];
    name?: string;
  },
) {
  return apiRequest<Conversation>('/chat/team/conversations', token, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function addConversationMember(
  token: string,
  conversationId: string,
  userId: string,
) {
  return apiRequest<ConversationMember>(
    `/chat/conversations/${conversationId}/members`,
    token,
    {
      method: 'POST',
      body: JSON.stringify({ userId }),
    },
  );
}

export function addTeamConversationMember(
  token: string,
  conversationId: string,
  userId: string,
) {
  return apiRequest<ConversationMember>(
    `/chat/team/conversations/${conversationId}/members`,
    token,
    {
      method: 'POST',
      body: JSON.stringify({ userId }),
    },
  );
}

export function blockConversationMember(
  token: string,
  conversationId: string,
  memberUserId: string,
  reason?: string,
) {
  return apiRequest<ConversationMember>(
    `/chat/conversations/${conversationId}/members/${memberUserId}/block`,
    token,
    {
      method: 'POST',
      body: JSON.stringify({ reason }),
    },
  );
}

export function unblockConversationMember(
  token: string,
  conversationId: string,
  memberUserId: string,
) {
  return apiRequest<ConversationMember>(
    `/chat/conversations/${conversationId}/members/${memberUserId}/unblock`,
    token,
    {
      method: 'POST',
    },
  );
}

export function blockTeamConversationMember(
  token: string,
  conversationId: string,
  memberUserId: string,
  reason?: string,
) {
  return apiRequest<ConversationMember>(
    `/chat/team/conversations/${conversationId}/members/${memberUserId}/block`,
    token,
    {
      method: 'POST',
      body: JSON.stringify({ reason }),
    },
  );
}

export function unblockTeamConversationMember(
  token: string,
  conversationId: string,
  memberUserId: string,
) {
  return apiRequest<ConversationMember>(
    `/chat/team/conversations/${conversationId}/members/${memberUserId}/unblock`,
    token,
    {
      method: 'POST',
    },
  );
}
```

---

## 11. UI Permission Rules

Frontend can hide or show buttons based on current user membership.

Normal group add button:

```ts
const currentMember = conversation.members.find(
  (member) => member.userId === currentUser.id,
);

const canAddNormalMember =
  currentMember?.role === 'OWNER' || currentMember?.role === 'ADMIN';
```

Team group add button:

```ts
const canAddTeamMember =
  currentUserIsTeamCreator || currentUserTeamRole === 'ADMIN';
```

Block/unblock button:

```ts
const isBlocked = Boolean(member.blockedAt);
```

Backend is the source of truth. Frontend checks are only for UI display.

---

## 12. Error Handling

Common REST errors:

| Status | Meaning                                            |
| ------ | -------------------------------------------------- |
| `400`  | Bad request, invalid payload, or outside-team user |
| `401`  | Missing or invalid token                           |
| `403`  | User does not have permission                      |
| `404`  | Conversation/user not found or access denied       |
| `409`  | User already exists in the conversation            |
| `500`  | Server error                                       |

Common socket errors:

```ts
{ status: 'error', message: '...' }
```

or for `joinRoom`:

```ts
{ event: 'error', message: '...' }
```

Always check acknowledgement payloads before updating UI state.

---

## 13. Important Notes

- `GET /chat/conversations/:id/messages` returns newest-first.
- Reverse messages before rendering oldest-first UI.
- `joinRoom` must be called after selecting a conversation.
- `sendMessage` works only if the user is already a conversation member.
- Blocked members cannot read messages, join the socket room, or send messages.
- `typing` only emits to users already joined to the room.
- `markAsRead` updates read receipts and broadcasts `messageRead`.
- Use normal APIs for regular chat.
- Use team APIs only when same-team restrictions are required.

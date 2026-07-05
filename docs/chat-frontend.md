# Chat System — Frontend Implementation Docs

## Overview

Real-time chat using **REST API** (conversation/message management) + **WebSocket** (Socket.IO for live events).

---

## 1. REST API Endpoints

Base URL: `/chat`  
Auth: `Bearer <access_token>` required on all endpoints.

### Create Conversation

```
POST /chat/conversations
```

**Body:**
```json
{
  "type": "DIRECT",
  "participantIds": ["user-id-1"],
  "name": "Optional Group Name"
}
```

> `name` is optional for DIRECT, recommended for GROUP.  
> `participantIds` must have at least 1 entry (excluding yourself — backend adds you automatically as OWNER).

**Response:**
```json
{
  "id": "conv-uuid",
  "type": "DIRECT",
  "name": null,
  "members": [
    {
      "id": "member-uuid",
      "userId": "user-uuid",
      "role": "OWNER",
      "user": {
        "id": "user-uuid",
        "firstName": "John",
        "lastName": "Doe",
        "avatarUrl": "https://..."
      }
    }
  ]
}
```

---

### Get All Conversations

```
GET /chat/conversations
```

Returns all conversations the current user is a member of.  
Each conversation includes `members[]` and `messages[0]` (last message only — for preview).

---

### Get Messages

```
GET /chat/conversations/:id/messages?skip=0&take=50
```

Returns messages newest-first. Reverse before rendering.

**Response:**
```json
[
  {
    "id": "msg-uuid",
    "conversationId": "conv-uuid",
    "content": "Hello!",
    "mediaUrl": null,
    "fileUrl": null,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "sender": {
      "id": "user-uuid",
      "firstName": "John",
      "lastName": "Doe",
      "avatarUrl": "https://..."
    },
    "readReceipts": [
      { "userId": "user-uuid", "readAt": "2025-01-01T00:00:01.000Z" }
    ]
  }
]
```

---

### Get Conversation Members

```
GET /chat/conversations/:id/members
```

Returns all members with user info. Only accessible if you are a member.

---

## 2. WebSocket (Socket.IO)

### Connection

```js
import { io } from 'socket.io-client';

const socket = io('wss://your-api-domain', {
  auth: { token: '<access_token>' }
});
```

JWT is validated server-side on handshake. Connection is rejected if token is invalid/expired.

---

### Emit Events (Client → Server)

#### Join a Room
Call this after selecting a conversation. Required before receiving room events.
```js
socket.emit('joinRoom', { conversationId: 'conv-uuid' });
// Ack: { event: 'joinedRoom', data: 'conv-uuid' }
```

#### Send Message
```js
socket.emit('sendMessage', {
  conversationId: 'conv-uuid',
  content: 'Hello!'
});
// Ack: { status: 'ok', data: <message object> }
```

#### Typing Indicator
```js
socket.emit('typing', { conversationId: 'conv-uuid', isTyping: true });
socket.emit('typing', { conversationId: 'conv-uuid', isTyping: false });
```

#### Mark as Read
```js
socket.emit('markAsRead', {
  messageId: 'msg-uuid',
  conversationId: 'conv-uuid'
});
// Ack: { status: 'ok' }
```

---

### Listen Events (Server → Client)

| Event             | Payload                                                      | Trigger                        |
|-------------------|--------------------------------------------------------------|--------------------------------|
| `newMessage`      | Full message object (sender + readReceipts)                  | Someone sends a message        |
| `typingIndicator` | `{ userId: string, isTyping: boolean }`                      | Someone starts/stops typing    |
| `messageRead`     | `{ messageId: string, userId: string, readAt: Date }`        | Someone marks a message read   |

```js
socket.on('newMessage', (msg) => { /* append to message list */ });
socket.on('typingIndicator', ({ userId, isTyping }) => { /* show/hide indicator */ });
socket.on('messageRead', ({ messageId, userId, readAt }) => { /* update read receipt UI */ });
```

---

## 3. TypeScript Types

```ts
type ConversationType = 'DIRECT' | 'GROUP';
type ConversationRole = 'OWNER' | 'ADMIN' | 'MEMBER';

interface UserSummary {
  id: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
}

interface ConversationMember {
  id: string;
  userId: string;
  role: ConversationRole;
  joinedAt: string;
  user: UserSummary;
}

interface Message {
  id: string;
  conversationId: string;
  content: string;
  mediaUrl: string | null;
  mediaType: string | null;
  fileUrl: string | null;
  fileType: string | null;
  createdAt: string;
  sender: UserSummary;
  readReceipts: { userId: string; readAt: string }[];
}

interface Conversation {
  id: string;
  type: ConversationType;
  name: string | null;
  createdAt: string;
  members: ConversationMember[];
  messages: Message[]; // only last message in list view
}
```

---

## 4. Typical Frontend Flow

```
1. Open chat
   → GET /chat/conversations

2. Select conversation
   → GET /chat/conversations/:id/messages
   → socket.emit('joinRoom', { conversationId })

3. User types
   → socket.emit('typing', { conversationId, isTyping: true/false })

4. Send message
   → socket.emit('sendMessage', { conversationId, content })
   → socket.on('newMessage') → append to list

5. Read messages
   → socket.emit('markAsRead', { messageId, conversationId })
   → socket.on('messageRead') → update receipt UI

6. See others typing
   → socket.on('typingIndicator') → show/hide indicator
```

---

## 5. Pagination

```
GET /chat/conversations/:id/messages?skip=0&take=50   // first page
GET /chat/conversations/:id/messages?skip=50&take=50  // second page
```

Use infinite scroll (load more on scroll-up).

---

## 6. Error Handling

| Scenario                     | REST          | WebSocket                    |
|------------------------------|---------------|------------------------------|
| Not a member                 | `404`         | `{ status: 'error', message }` |
| Invalid/expired token        | `401`         | Connection rejected           |
| Empty `participantIds`       | `400`         | —                            |
| Server error                 | `500`         | `{ status: 'error', message }` |

Always check `status` on WS acknowledgements before updating UI state.

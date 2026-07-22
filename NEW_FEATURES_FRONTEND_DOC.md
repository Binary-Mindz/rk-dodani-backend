
### 2.1 Load Paginated Messages via Socket

- **Emit Event Name:** `getMessages` (or `loadMessages`)
- **Listen Event Name:** `messagesLoaded`

#### Request Payload Schema:
| Field | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `conversationId` | `string` | **Yes** | - | UUID of the conversation |
| `page` | `number` | Optional | `1` | Page number (1-based index) |
| `limit` | `number` | Optional | `20` | Number of messages per page |
| `skip` | `number` | Optional | `(page-1)*limit` | Offset skip |

#### Code Example:
```javascript
import { io } from 'socket.io-client';

const chatSocket = io('http://localhost:4000', {
  auth: { token: `Bearer ${userAccessToken}` },
  transports: ['websocket'],
});

// 1. Join Room first
chatSocket.emit('joinRoom', { conversationId: 'YOUR_CONVERSATION_UUID' });

// 2. Request Page 1 of messages (Latest 20 messages)
chatSocket.emit('getMessages', {
  conversationId: 'YOUR_CONVERSATION_UUID',
  page: 1,
  limit: 20
});

// 3. Listen for loaded messages response
chatSocket.on('messagesLoaded', (response) => {
  console.log('Conversation ID:', response.conversationId);
  console.log('Messages Array:', response.messages);
  console.log('Pagination Metadata:', response.meta);
  /*
    response.meta structure:
    {
      "total": 45,
      "page": 1,
      "limit": 20,
      "skip": 0,
      "take": 20,
      "totalPages": 3,
      "hasMore": true
    }
  */
});

// Request Page 2 when scrolling up
function loadNextPage(nextPage) {
  chatSocket.emit('getMessages', {
    conversationId: 'YOUR_CONVERSATION_UUID',
    page: nextPage,
    limit: 20
  });
}
```

---

### 2.2 Load Conversation List via Socket

- **Emit Event Name:** `getConversations` (or `loadConversations`)
- **Listen Event Name:** `conversationsLoaded`

#### Code Example:
```javascript
// Request all user conversations via socket
chatSocket.emit('getConversations');

// Listen for response
chatSocket.on('conversationsLoaded', (conversationsList) => {
  console.log('User Conversations:', conversationsList);
});
```

---

## Summary of Socket Event Names

| Namespace | Event Direction | Event Name | Payload Description |
| :--- | :--- | :--- | :--- |
| `/notifications` | Server -> Client | `maintenanceAlert` | `{ isUnderMaintenance, title, message, updatedAt }` |
| `/` | Client -> Server | `getMessages` | `{ conversationId, page, limit, skip }` |
| `/` | Server -> Client | `messagesLoaded` | `{ conversationId, messages, meta: { total, page, limit, totalPages, hasMore } }` |
| `/` | Client -> Server | `getConversations` | `{}` |
| `/` | Server -> Client | `conversationsLoaded` | `[ ...conversations ]` |

# ChatFlow - Team Collaboration SaaS

**A modern team collaboration platform built with NestJS GraphQL and real-time WebSocket technology.**

ChatFlow enables teams to communicate, collaborate, and stay productive with real-time messaging, file sharing, and workspace management.

## 🚀 Features

- 🏢 **Multi-Tenant Workspaces** - Isolated environments for different organizations
- 💬 **Real-Time Chat** - Instant messaging with WebSocket support
- 🔔 **Smart Notifications** - Stay updated with important messages
- 📁 **File Sharing** - Upload and share files with team members
- 👥 **User Management** - Invite team members and manage permissions
- 📊 **Analytics Dashboard** - Track team activity and engagement
- 🔐 **Enterprise Security** - JWT authentication with role-based access
- 📱 **GraphQL API** - Modern, type-safe API for frontend integration

## 🛠️ Tech Stack

- **Backend**: NestJS, GraphQL, TypeORM, PostgreSQL
- **Real-time**: Socket.IO, GraphQL Subscriptions
- **Authentication**: JWT with refresh tokens
- **File Storage**: Cloudinary integration
- **Database**: PostgreSQL with multi-tenant architecture

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone <repository-url>
cd chatflow-saas
npm install
```

### 2. Database Setup

```sql
CREATE USER chatflow WITH PASSWORD 'chatflow123';
CREATE DATABASE chatflow OWNER chatflow;
GRANT ALL PRIVILEGES ON DATABASE chatflow TO chatflow;
```

### 3. Environment Variables

```env
# Database
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USERNAME=chatflow
DB_PASSWORD=chatflow123
DB_NAME=chatflow

# JWT
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=900s
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d

# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
FRONTEND_URL=http://localhost:3001

# Cloudinary (for file uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 4. Run Migrations & Start

```bash
npm run migration:run
npm run start:dev
```

**Access ChatFlow:**
- GraphQL Playground: `http://localhost:3000/graphql`
- API Endpoint: `http://localhost:3000/graphql`

## 📱 API Examples

### Workspace Management

```graphql
# Create workspace
mutation {
  createWorkspace(createWorkspaceInput: {
    name: "Acme Corp"
    description: "Main workspace for Acme Corporation"
  }) {
    id
    name
    slug
  }
}

# Get my workspace
query {
  myWorkspace {
    id
    name
    users {
      firstName
      lastName
      email
    }
  }
}
```

### Team Chat

```graphql
# Create chat channel
mutation {
  createRoom(createRoomInput: {
    name: "general"
    participantIds: [1, 2, 3]
  }) {
    id
    name
  }
}

# Send message
mutation {
  sendMessage(sendMessageInput: {
    content: "Hello team!"
    roomId: 1
  }) {
    id
    content
    createdAt
  }
}

# Subscribe to new messages
subscription {
  messageAdded {
    id
    content
    senderId
    roomId
    createdAt
  }
}
```

## 💰 Pricing Model

- **Free**: 1 workspace, 5 users, 1GB storage
- **Pro**: $8/user/month - Unlimited workspaces, advanced features
- **Enterprise**: $15/user/month - SSO, advanced analytics, priority support

## 🏗️ Architecture

```
ChatFlow SaaS
├── Multi-tenant workspaces
├── Real-time messaging
├── File upload & sharing
├── User management
├── Analytics & insights
└── Enterprise security
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes and test
4. Submit pull request

---

**Built with ❤️ using NestJS GraphQL Foundation**
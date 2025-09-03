# ChatFlow - Complete SaaS Foundation

**A production-ready SaaS foundation built with NestJS GraphQL, real-time WebSocket technology, and Stripe billing integration.**

ChatFlow is a complete multi-tenant SaaS platform that provides team collaboration features with enterprise-grade billing, authentication, and real-time communication. Perfect foundation for any SaaS product.

## 🚀 Complete SaaS Features

### **🏗️ Core Foundation**
- 🏢 **Multi-Tenant Architecture** - Complete workspace isolation with tenant-scoped data
- 🔐 **Enterprise Authentication** - JWT + refresh tokens, email verification, password reset
- 💳 **Stripe Billing Integration** - Subscriptions, payments, usage tracking, webhooks
- 📊 **Usage Limits Enforcement** - FREE/PRO/ENTERPRISE plan limits with real-time tracking
- 🎯 **Plan Management** - Automatic upgrades, downgrades, and billing cycle management

### **💬 Team Collaboration**
- 💬 **Real-Time Chat System** - Socket.IO + GraphQL subscriptions for instant messaging
- 👥 **Team Invitations** - Email-based invitations with workspace onboarding
- 🔔 **Smart Notifications** - Real-time alerts and activity tracking
- 📁 **File Management** - Cloudinary integration for secure file uploads and sharing
- 📈 **Analytics Dashboard** - User growth, activity metrics, and engagement tracking

### **🔧 Developer Experience**
- 📱 **GraphQL API** - Type-safe API with auto-generated schema
- 🗃️ **Database Migrations** - TypeORM with proper schema versioning
- 🎛️ **Development Mode** - Mock Stripe responses for testing without payment setup
- 🔍 **Comprehensive Logging** - Audit trails and error tracking
- 🛡️ **Security Best Practices** - Rate limiting, input validation, SQL injection protection

## 🛠️ Complete Tech Stack

### **Backend Foundation**
- **Framework**: NestJS with TypeScript
- **API**: GraphQL with Apollo Server
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT + Refresh Tokens
- **Real-time**: Socket.IO + GraphQL Subscriptions

### **SaaS Infrastructure**
- **Billing**: Stripe API integration
- **Payments**: Payment intents, subscriptions, webhooks
- **Usage Tracking**: Plan limits and feature enforcement
- **File Storage**: Cloudinary for media management
- **Email**: Nodemailer for transactional emails

### **Production Ready**
- **Multi-tenancy**: Complete workspace isolation
- **Migrations**: Database schema versioning
- **Security**: Rate limiting, validation, audit logs
- **Monitoring**: Comprehensive error handling and logging

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/saadamir1/chatflow-saas.git
cd chatflow-saas
npm install
```

### 2. Database Setup

```sql
CREATE USER dev WITH PASSWORD 'secret';
CREATE DATABASE demo OWNER dev;
GRANT ALL PRIVILEGES ON DATABASE demo TO dev;
```

### 3. Environment Variables

```env
# Database
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USERNAME=dev
DB_PASSWORD=secret
DB_NAME=demo

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
# Run database migrations
npm run migration:run

# Start development server
npm run start:dev
```

**Access ChatFlow:**
- GraphQL Playground: `http://localhost:3000/graphql`
- API Endpoint: `http://localhost:3000/graphql`
- Stripe Webhooks: `http://localhost:3000/webhooks/stripe`

### 5. Optional: Stripe Setup (for billing)

```env
# Add to .env for production billing
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PRO_PRICE_ID=price_your_pro_plan_id
STRIPE_ENTERPRISE_PRICE_ID=price_your_enterprise_plan_id
```

**Note**: Billing works in development mode without Stripe keys (uses mock responses).

## 📱 Complete API Examples

### Authentication & Workspace

```graphql
# Register new user
mutation {
  register(registerInput: {
    email: "user@example.com"
    password: "securePassword123"
    firstName: "John"
    lastName: "Doe"
  }) {
    access_token
    refresh_token
    user { id email }
  }
}

# Create workspace
mutation {
  createWorkspace(createWorkspaceInput: {
    name: "Acme Corp"
    description: "Main workspace for Acme Corporation"
  }) {
    id name slug
    subscription { planType status }
  }
}
```

### Billing & Subscriptions

```graphql
# Create subscription
mutation {
  createSubscription(createSubscriptionInput: {
    planType: PRO
    paymentMethodId: "pm_card_visa"
  }) {
    subscriptionId
    status
    clientSecret
  }
}

# Get billing info
query {
  myBillingSubscription {
    planType
    status
    amount
    currentPeriodEnd
  }
}

# Create payment
mutation {
  createPaymentIntent(createPaymentIntentInput: {
    amount: 10.00
    description: "One-time payment"
  }) {
    clientSecret
    paymentIntentId
  }
}
```

### Team Collaboration

```graphql
# Invite team member
mutation {
  inviteUser(inviteUserInput: {
    email: "teammate@example.com"
    message: "Join our team!"
  }) {
    message
    success
  }
}

# Real-time chat
mutation {
  sendMessage(sendMessageInput: {
    content: "Hello team!"
    roomId: 1
  }) {
    id content createdAt
    sender { firstName lastName }
  }
}

# Subscribe to messages
subscription {
  messageAdded {
    id content senderId roomId createdAt
  }
}
```

## 💰 Built-in SaaS Pricing Model

### **Plan Limits (Configurable)**
- **FREE**: 5 users, 1,000 messages/month, 1GB storage, 3 rooms
- **PRO**: 50 users, 50,000 messages/month, 10GB storage, 50 rooms
- **ENTERPRISE**: Unlimited users, unlimited messages, 100GB storage, unlimited rooms

### **Billing Features**
- ✅ **Stripe Integration** - Automatic payment processing
- ✅ **Usage Tracking** - Real-time feature usage monitoring
- ✅ **Plan Enforcement** - Automatic limit blocking when exceeded
- ✅ **Webhook Handling** - Real-time payment status updates
- ✅ **Subscription Management** - Upgrades, downgrades, cancellations
- ✅ **Invoice Generation** - Automatic billing cycle management

## 🏗️ Complete SaaS Architecture

```
ChatFlow SaaS Foundation
├── 🏢 Multi-Tenant Core
│   ├── Workspace isolation
│   ├── User management
│   └── Role-based access
├── 💳 Billing System
│   ├── Stripe integration
│   ├── Usage tracking
│   ├── Plan enforcement
│   └── Webhook handling
├── 💬 Real-Time Features
│   ├── Socket.IO messaging
│   ├── GraphQL subscriptions
│   ├── Live notifications
│   └── Presence tracking
├── 🔐 Security Layer
│   ├── JWT authentication
│   ├── Rate limiting
│   ├── Input validation
│   └── Audit logging
└── 📊 Analytics & Monitoring
    ├── User growth tracking
    ├── Feature usage metrics
    ├── Billing analytics
    └── Performance monitoring
```

## 🎯 SaaS Foundation Benefits

### **For Developers**
- ⚡ **Rapid Development** - Skip months of boilerplate setup
- 🔧 **Production Ready** - Enterprise-grade architecture from day one
- 📚 **Well Documented** - Comprehensive API documentation and examples
- 🧪 **Testing Friendly** - Mock services for development without external dependencies

### **For Businesses**
- 💰 **Revenue Ready** - Complete billing system with Stripe integration
- 📈 **Scalable** - Multi-tenant architecture supports unlimited workspaces
- 🛡️ **Secure** - Enterprise security practices built-in
- 🚀 **Fast Time-to-Market** - Focus on your unique features, not infrastructure

## 🏷️ Version Tags

- **v1.0.0-saas-foundation** - Complete SaaS foundation (use this for new projects)
- **master** - ChatFlow-specific features and frontend integration

## 🚀 Using as SaaS Foundation

### **For New SaaS Projects**
```bash
# Clone the foundation
git clone https://github.com/saadamir1/chatflow-saas.git my-saas-app
cd my-saas-app

# Checkout the foundation tag
git checkout v1.0.0-saas-foundation

# Create your new branch
git checkout -b my-product-features

# Install and setup
npm install
cp .env.example .env
# Configure your database and services

# Start building your unique features!
```

### **What You Get Out of the Box**
- ✅ Complete user authentication system
- ✅ Multi-tenant workspace architecture
- ✅ Stripe billing integration
- ✅ Real-time communication infrastructure
- ✅ File upload and management
- ✅ Team invitation system
- ✅ Analytics and usage tracking
- ✅ Production-ready database schema
- ✅ GraphQL API with comprehensive resolvers
- ✅ Security best practices implemented

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**🎯 Built as a complete SaaS foundation - ready for your next big idea!**

**⭐ Star this repo if it helps you build your SaaS faster!**
# 🔐 P2P Gists

<div align="center">

![P2P Gists Banner](https://img.shields.io/badge/P2P-Gists-blue?style=for-the-badge&logo=github)

**A lightweight, peer-to-peer web application for sharing encrypted code snippets**

[![Live Demo](https://img.shields.io/badge/Live-Demo-green?style=for-the-badge)](https://weboko.github.io/p2p-gists/)
[![MIT License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)
[![React](https://img.shields.io/badge/React-18.2.0-blue?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Waku](https://img.shields.io/badge/Waku-P2P-purple?style=for-the-badge)](https://waku.org/)

</div>

---

## 🌟 What is P2P Gists?

P2P Gists is a modern, privacy-focused alternative to traditional code sharing platforms. Instead of storing your code on centralized servers, it uses cutting-edge peer-to-peer technology to share encrypted code snippets directly between users.

### 🎯 Key Concepts Explained

#### 🔗 **Peer-to-Peer (P2P)**
Instead of sending your code to a central server (like GitHub or Pastebin), P2P technology allows users to share data directly with each other. Think of it like passing a note directly to someone instead of putting it in a shared mailbox.

#### 🏠 **Local-First**
Your data lives on your device first. The app works offline, syncs when online, and you maintain control over your information. No dependency on external servers for basic functionality.

#### 🔐 **End-to-End Encryption (E2EE)**
Your code is encrypted before it leaves your device and can only be decrypted by recipients who have the proper keys. Even if someone intercepts the data, they can't read it without the decryption key.

---

## ✨ Features

- 🔒 **End-to-end encrypted** code sharing
- 🌐 **Peer-to-peer** distribution using Waku network
- 💾 **Local-first** - works offline and syncs when online
- 🎨 **Syntax highlighting** for 20+ programming languages
- 🌙 **Dark/Light theme** support
- 📱 **Responsive design** - works on desktop and mobile
- 🚀 **No registration required** - truly anonymous
- ⚡ **Fast and lightweight** - built with modern web technologies

---

## 🛠️ Technology Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS
- **P2P Network**: [Waku](https://waku.org/) - Ethereum's messaging protocol
- **Database**: Dexie (IndexedDB wrapper)
- **Encryption**: Built-in Web Crypto API
- **Syntax Highlighting**: PrismJS
- **Routing**: React Router

---

## 🚀 Quick Start

### 📱 Use Online (Recommended)

Visit the live application: **[https://weboko.github.io/p2p-gists/](https://weboko.github.io/p2p-gists/)**

### 💻 Run Locally

#### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

#### Installation

```bash
# Clone the repository
git clone https://github.com/weboko/p2p-gists.git
cd p2p-gists

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:3000`

#### Build for Production

```bash
# Build the application
npm run build

# Preview the build
npm run preview
```

---

## 📖 How to Use

### Creating a Code Snippet

1. **Open the app** in your browser
2. **Write or paste your code** in the editor
3. **Select the programming language** from the dropdown
4. **Add a title** (optional)
5. **Click "Share"** to generate an encrypted link
6. **Copy the link** and share it with others

### Viewing a Shared Snippet

1. **Click on a P2P Gists link** you received
2. The app will **automatically decrypt** the code (if you have access)
3. **View the syntax-highlighted code** in your browser
4. **Copy the code** or **save it locally** if needed

### 🔑 Privacy Features

- **No accounts required** - completely anonymous
- **No server storage** - code is shared directly between peers
- **Automatic encryption** - your code is encrypted before leaving your device
- **Ephemeral sharing** - snippets exist only as long as peers are sharing them

---

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Your Device   │    │   Waku Network  │    │  Peer's Device  │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │   Encrypt   │ │───▶│ │   Relay     │ │───▶│ │   Decrypt   │ │
│ │   Code      │ │    │ │   Messages  │ │    │ │   Code      │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ Local Store │ │    │ │ P2P Network │ │    │ │ Local Store │ │
│ │ (IndexedDB) │ │    │ │ (Libp2p)    │ │    │ │ (IndexedDB) │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

1. **Code is encrypted** on your device using Web Crypto API
2. **Encrypted data is shared** via Waku's P2P network
3. **Peers receive and decrypt** the code using the shared key
4. **Local storage** keeps your snippets available offline

---

## 🔧 Development

### Project Structure

```
src/
├── components/          # React components
│   ├── CreateSnippet.jsx
│   ├── ViewSnippet.jsx
│   └── ...
├── hooks/               # Custom React hooks
│   ├── useIdentity.js
│   └── useTheme.js
├── lib/                 # Core utilities
│   ├── crypto.js        # Encryption/decryption
│   ├── database.js      # Local storage
│   ├── waku.js          # P2P networking
│   └── utils.js
└── ...
```

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

### Environment Variables

The app automatically detects the environment:
- **Development**: No configuration needed
- **GitHub Pages**: Automatically configured for deployment

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### 🔥 **Technical Challenges**
Want to dive deep into P2P technology? We have exciting implementation challenges:
- **Peer Sharing Module** - Implement real-time P2P snippet sharing
- **Collaborative Editing** - Add CRDT-based collaborative editing

👉 **[View All Challenges & Get Started →](CONTRIBUTING.md)**

### 🐛 Found a Bug?
- Check existing [issues](https://github.com/weboko/p2p-gists/issues)
- Create a new issue with detailed description

### 💡 Have an Idea?
- Open an issue to discuss your idea
- Fork the repo and create a pull request

### 🔧 Want to Code?
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Test thoroughly
5. Commit: `git commit -m 'Add amazing feature'`
6. Push: `git push origin feature/amazing-feature`
7. Open a pull request

---

## 🛡️ Security & Privacy

### What We Do
- ✅ **End-to-end encryption** for all code snippets
- ✅ **No server-side storage** of your code
- ✅ **No tracking or analytics**
- ✅ **Open source** - audit the code yourself

### What We Don't Do
- ❌ **No data collection** - we don't know what you share
- ❌ **No user accounts** - completely anonymous
- ❌ **No server logs** - no central storage of any kind

### Important Notes
- **Links contain encryption keys** - only share with trusted recipients
- **Snippets are ephemeral** - they exist only while peers are online
- **Use responsibly** - don't share sensitive credentials or personal data

---

## 📚 Learn More

### About the Technologies
- [Waku Protocol](https://waku.org/) - Decentralized messaging
- [Libp2p](https://libp2p.io/) - P2P networking stack
- [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) - Browser storage
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API) - Browser encryption

### Similar Projects
- [IPFS](https://ipfs.io/) - Distributed file system
- [Secure Scuttlebutt](https://scuttlebutt.nz/) - P2P social network
- [Dat Protocol](https://dat.foundation/) - Distributed data sharing

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 💖 Support

If you find this project useful:
- ⭐ **Star the repository**
- 🐦 **Share on social media**
- 🤝 **Contribute to the code**
- 🐛 **Report bugs or suggest features**

---

<div align="center">

**Made with ❤️ for the decentralized web**

[Demo](https://weboko.github.io/p2p-gists/) • [Issues](https://github.com/weboko/p2p-gists/issues) • [Discussions](https://github.com/weboko/p2p-gists/discussions)

</div>
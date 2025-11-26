# InkFlow 🌊

InkFlow is a real-time, privacy-focused digital whiteboard designed for ultimate productivity and creative workflows. It combines a high-performance drawing canvas with integrated task management and focus tools to help you capture, organize, and execute on your ideas seamlessly.

## ✨ Core Features

- **High-Performance Drawing Canvas:** Experience a smooth, responsive, and infinite canvas powered by a C++/WebAssembly engine, perfect for everything from quick sketches to detailed diagrams.
- **Real-Time Collaboration:** Collaborate with your team in real-time. A peer-to-peer WebRTC architecture (using a Cloudflare signaling server) ensures your data remains private and is not stored on a central server.
- **Integrated Productivity Tools:**
  - **Task Stack:** A simple yet powerful task manager to keep you organized.
  - **Pomodoro Timer:** Stay focused and manage your time effectively with a built-in Pomodoro timer.
  - **Unique Focus Views:** Switch between different modes like `Sniper Mode` and `Black Box` to tailor your workspace to the task at hand.
- **Offline-First:** Full offline support ensures you can continue working from anywhere. Your data is stored locally in-browser using IndexedDB and automatically syncs when you reconnect, thanks to Yjs and Dexie.
- **Quick Capture:** Instantly jot down thoughts and ideas before they disappear.

## 🛠️ Tech Stack

- **Frontend:** React, TypeScript, Vite
- **Real-Time Sync & CRDTs:** Yjs (with `y-webrtc` and `y-indexeddb`)
- **State Management:** Zustand
- **Local Database:** Dexie.js
- **Drawing Engine:** C++ compiled to WebAssembly for near-native performance.
- **Styling:** Styled Components
- **Signaling:** A lightweight Cloudflare Worker for WebRTC peer discovery.

## 🚀 Getting Started

Follow these instructions to get the project running on your local machine.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or newer recommended)
- npm or your favorite package manager

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    cd inkflow/inkflow 
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

### Available Scripts

- **Run the development server:**
  Starts the application in development mode with hot-reloading.
  ```bash
  npm run dev
  ```

- **Build for production:**
  Builds and optimizes the application for production. The output is placed in the `dist` folder.
  ```bash
  npm run build
  ```

- **Lint the codebase:**
  Analyzes the code to find and fix problems.
  ```bash
  npm run lint
  ```

- **Preview the production build:**
  Serves the `dist` folder locally to preview the production application.
  ```bash
  npm run preview
  ```

## 📁 Project Structure

```
/inkflow/
├── src/                  # Main frontend application source code
│   ├── components/       # Reusable React components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Core libraries (DB, Sync)
│   ├── store/            # Zustand state management stores
│   ├── views/            # Application pages/views
│   └── wasm-modules/     # JS bindings for the Wasm engine
├── wasm/                 # C++ source for the WebAssembly modules
└── signaling-server-cf/ # Source for the Cloudflare Worker signaling server
```
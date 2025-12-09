# 🌊 InkFlow

**A local-first, privacy-focused, "anti-todo list" designed for deep work and single-tasking.**

InkFlow is a productivity PWA built for developers and creatives who thrive in focused environments. It combines a high-performance WebAssembly-powered drawing canvas with a real-time, peer-to-peer synchronization engine to create a seamless, zero-latency creative space.

*(Suggestion: Add a GIF here showing the Black Box -> Drag to Sniper Mode -> Pomodoro Timer workflow)*

---

## 🚀 Architectural & Technical Highlights

This project was built to showcase a deep understanding of modern web technologies, performance optimization, and complex system design.

### 1. Local-First & Real-Time Collaboration (CRDTs)

The application is built on a **local-first** principle. All data is stored locally in your browser's IndexedDB, making it fast and always available offline.

- **Conflict-Free Replicated Data Types (CRDTs):** Real-time, peer-to-peer synchronization between your devices is powered by **Y.js**.
- **Custom Synchronizer:** A custom `YjsSynchronizer` class was developed to create a clean, reactive bridge between the Yjs data structures and the application's **Zustand** state management stores.
- **Robust Testing:** The complex synchronization logic is validated with a suite of integration tests that simulate multiple clients and manually propagate updates, ensuring the CRDT implementation is reliable.

### 2. High-Performance Ink Engine (C++ & WebAssembly)

To achieve a 60fps+, zero-latency drawing experience, the ink stroke processing logic was written in C++ and compiled to **WebAssembly** using Emscripten.

- **Why C++?** For CPU-intensive tasks like stroke smoothing and pressure interpolation, C++ provides the raw performance that JavaScript cannot guarantee.

#### The Stroke Processing Algorithm

The core of the engine is the `process_stroke` function, which transforms a raw series of pointer events into a smooth, natural-looking curve. This is a two-step process:

1.  **Simplification:** First, the raw array of points is filtered to remove redundant points that are too close to each other. This is a crucial optimization that reduces the amount of data to be processed in the next step. It uses a squared-distance check for maximum efficiency, avoiding costly square root calculations.

2.  **Smoothing:** The simplified points are then fed into a **Catmull-Rom spline** interpolation function. This algorithm generates a smooth, curved path that passes through the control points, resulting in a fluid line that accurately reflects the user's stroke. The interpolation is applied not just to the `x` and `y` coordinates, but to the `pressure` of the stroke as well, ensuring that variations in pressure are also smoothly rendered.

```cpp
// A simplified view of the C++ algorithm
std::vector<Point> process_stroke(const std::vector<Point> &raw_points)
{
  // 1. Simplify the stroke by filtering out points that are too close
  std::vector<Point> filtered_points = simplify(raw_points);
  
  // 2. Apply Catmull-Rom smoothing on the simplified stroke
  std::vector<Point> smoothed_points = smooth(filtered_points);

  return smoothed_points;
}
```

- **Advanced Memory Management:** The `useInkEngine` React hook demonstrates a critical skill in Wasm development: **manual memory management**. It correctly allocates and de-allocates memory on the Emscripten heap by calling the `.delete()` method on C++ objects exposed to JavaScript, preventing memory leaks.
- **Module Integration:** The Wasm module is cleanly integrated into the Vite-based project using a TypeScript path alias (`tsconfig.app.json`) for clean, module-like imports (`import ... from 'ink-engine'`).

### 3. Serverless Signaling (Cloudflare Workers)

Peer-to-peer WebRTC connections are established using a lightweight, serverless signaling server built with **Cloudflare Workers**.

- **Efficiency & Scalability:** The worker leverages **Durable Objects** and the **Hibernatable WebSockets API** to create persistent, low-cost signaling "rooms" that can automatically go to sleep when not in use, making the architecture highly scalable and cost-effective.
- **Security:** The implementation is secure, with no hardcoded secrets, and demonstrates a modern approach to building supporting infrastructure for web applications.

### 4. Modern Frontend Stack

- **Framework:** React (with Vite)
- **Language:** TypeScript
- **State Management:** Zustand (for its simplicity and performance)
- **Styling:** Styled-Components
- **Offline Storage:** IndexedDB (managed by Yjs and Dexie.js)

---

## 🏁 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [Emscripten SDK](https://emscripten.org/docs/getting_started/downloads.html): Required to compile the C++ WebAssembly module. Make sure the `emcc` command is available in your PATH.

### Installation & Running

1. **Clone the repository:**

    ```bash
    git clone https://github.com/danillog/inkFlow 
    cd inkFlow/inkflow
    ```

2. **Compile the WebAssembly Module:**
    The project includes a script to compile the C++ code.

    ```bash
    ../build.sh 
    ```

    *(Suggestion: For a more integrated workflow, consider adding a `build:wasm` script to your `package.json` that calls this script)*

3. **Install dependencies:**

    ```bash
    npm install
    ```

4. **Run the development server:**

    ```bash
    npm run dev
    ```

    The application should now be running on `http://localhost:5173`.

# Assuming build.sh is in the parent directory

---

## 📁 Project Structure

```
/inkflow/
├── src/                  # Main frontend application source code
│   ├── components/       # Reusable React components
│   ├── hooks/            # Custom React hooks (including useInkEngine.ts)
│   ├── lib/              # Core logic (db.ts, sync.ts, yjs-synchronizer.ts)
│   ├── store/            # Zustand state management stores
│   ├── tests/            # Vitest unit and integration tests
│   │   └── __mocks__/    # Mocks for testing
│   ├── views/            # Application pages/views
│   │   ├── BlackBoxView.tsx
│   │   ├── LandingPageView.tsx
│   │   ├── RealityCheckView.tsx
│   │   └── SniperModeView.tsx
│   └── wasm-modules/     # JS bindings for the Wasm engine (ink_engine.js, ink_engine.wasm)
├── public/               # Static assets
├── wasm/                 # C++ source code for the Ink Engine (ink_engine.cpp)
├── vite.config.ts        # Vite configuration
├── package.json          # Project dependencies and scripts
└── build.sh              # Script to compile the Wasm module
```

# BlastShield Studio — Production Support Simulator

BlastShield Studio is a full-screen observability platform inside VS Code that allows you to simulate production traffic, analyze system failures, and generate Postmortem incident reports without ever leaving your editor.

## Features

- **Production Simulation**: Simulate heavy concurrent traffic and latency on your local workspace.
- **Observability Dashboard**: High-fidelity engineering dashboard mimicking Datadog and Sentry.
- **Failure Propagation Map**: Visual React Flow graph tracking how errors cascade between files.
- **Incident Replay Timeline**: Step-by-step playback of the system crash.
- **Root Cause & Patches**: View AI-generated patches with a built-in diff viewer.
- **What-If Simulations**: Adjust traffic, latency, and fault injection to re-test scenarios.
- **Demo Mode**: Works fully offline using realistic mock data for zero-friction demonstrations.

## Getting Started

1. Open a workspace in VS Code.
2. Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`).
3. Run **`BlastShield: Run Production Simulation`**.
4. The BlastShield Studio observability dashboard will open in a new webview panel.

## Architecture

- **Extension Core**: Packaged with `esbuild`, handles workspace zipping (`adm-zip`) and API orchestration.
- **Webview UI**: Built with Vite, React 18, React Flow, and Chart.js, running safely within a CSP-restricted iframe.

## Development

```bash
# Install dependencies
npm install
cd webview-ui && npm install && cd ..

# Build extension and UI
npm run build

# Start dev server for UI (browser testing)
cd webview-ui && npm run dev
```

## Settings

- `blastshield.apiBaseUrl`: Configure the backend API endpoint (default: `http://localhost:8000`).

---
*Built for production stress testing.*

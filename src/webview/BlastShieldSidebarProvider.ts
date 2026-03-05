import * as vscode from 'vscode';

export class BlastShieldSidebarProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'blastshield-sidebar';
    private _view?: vscode.WebviewView;

    constructor(private readonly _extensionUri: vscode.Uri) { }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage((data) => {
            switch (data.type) {
                case 'runSimulation':
                    vscode.commands.executeCommand('blastshield.runSimulation');
                    break;
            }
        });
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        // Return a simple premium look button
        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body {
                        padding: 15px;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 20px;
                        background-color: var(--vscode-sideBar-background);
                        color: var(--vscode-foreground);
                        font-family: var(--vscode-font-family);
                    }
                    .header {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        margin-bottom: 10px;
                    }
                    .icon {
                        font-size: 56px;
                    }
                    .title {
                        font-size: 18px;
                        font-weight: 700;
                        margin-top: 10px;
                        text-align: center;
                    }
                    .subtitle {
                        font-size: 11px;
                        opacity: 0.7;
                        text-align: center;
                        margin-top: 4px;
                    }
                    .card {
                        background: var(--vscode-sideBar-border);
                        padding: 15px;
                        border-radius: 8px;
                        width: 100%;
                        box-sizing: border-box;
                    }
                    .description {
                        font-size: 12px;
                        line-height: 1.4;
                        margin-bottom: 20px;
                    }
                    .primary-button {
                        background-color: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        padding: 10px 16px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-weight: 600;
                        width: 100%;
                        transition: filter 0.2s;
                    }
                    .primary-button:hover {
                        filter: brightness(1.2);
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="icon">🛡️</div>
                    <div class="title">BlastShield Studio</div>
                    <div class="subtitle">Production Simulation Lab</div>
                </div>
                
                <div class="card">
                    <div class="description">
                        Ready to simulate production failures? Run a full stress test on your current project.
                    </div>
                    <button class="primary-button" onclick="run()">
                        🚀 Run Production Simulation
                    </button>
                </div>

                <div style="font-size: 10px; opacity: 0.5; margin-top: 20px;">
                    Simulates traffic, latency, and edge cases.
                </div>

                <script>
                    const vscode = acquireVsCodeApi();
                    function run() {
                        vscode.postMessage({ type: 'runSimulation' });
                    }
                </script>
            </body>
            </html>`;
    }
}

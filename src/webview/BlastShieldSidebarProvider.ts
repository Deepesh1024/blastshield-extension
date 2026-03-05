import * as vscode from 'vscode';
import * as path from 'path';

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
        const logoUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'logo', 'blastshield-logo.png')
        );

        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

                    * { box-sizing: border-box; margin: 0; padding: 0; }

                    body {
                        padding: 20px 14px;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 0;
                        background: var(--vscode-sideBar-background);
                        color: var(--vscode-foreground);
                        font-family: 'Inter', var(--vscode-font-family), sans-serif;
                        min-height: 100vh;
                    }

                    .logo-wrap {
                        margin-bottom: 14px;
                        display: flex;
                        justify-content: center;
                    }
                    .logo-wrap img {
                        width: 72px;
                        height: 72px;
                        object-fit: contain;
                        filter: drop-shadow(0 4px 16px rgba(249,115,22,0.3));
                    }

                    .title {
                        font-size: 17px;
                        font-weight: 800;
                        text-align: center;
                        color: #f1f1f5;
                        margin-bottom: 4px;
                        letter-spacing: -0.3px;
                    }

                    .subtitle {
                        font-size: 10.5px;
                        opacity: 0.5;
                        text-align: center;
                        letter-spacing: 1.5px;
                        text-transform: uppercase;
                        margin-bottom: 22px;
                    }

                    .card {
                        background: rgba(255,255,255,0.04);
                        border: 1px solid rgba(255,255,255,0.08);
                        padding: 14px;
                        border-radius: 10px;
                        width: 100%;
                        margin-bottom: 14px;
                    }

                    .description {
                        font-size: 12px;
                        line-height: 1.55;
                        opacity: 0.75;
                        margin-bottom: 14px;
                    }

                    .run-btn {
                        background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
                        color: #fff;
                        border: none;
                        padding: 11px 16px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 700;
                        font-size: 13px;
                        width: 100%;
                        transition: all 0.2s;
                        box-shadow: 0 4px 14px rgba(249,115,22,0.35);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 7px;
                        letter-spacing: 0.2px;
                    }

                    .run-btn:hover {
                        transform: translateY(-1px);
                        box-shadow: 0 6px 20px rgba(249,115,22,0.5);
                        background: linear-gradient(135deg, #fb923c 0%, #f97316 100%);
                    }

                    .run-btn:active {
                        transform: translateY(0);
                    }

                    .footer-text {
                        font-size: 10px;
                        opacity: 0.35;
                        text-align: center;
                        margin-top: 16px;
                        line-height: 1.6;
                    }

                    .stat-row {
                        display: flex;
                        gap: 8px;
                        margin-top: 10px;
                    }

                    .stat-chip {
                        flex: 1;
                        background: rgba(249,115,22,0.08);
                        border: 1px solid rgba(249,115,22,0.2);
                        border-radius: 6px;
                        padding: 7px 6px;
                        text-align: center;
                        font-size: 10px;
                        color: rgba(255,255,255,0.7);
                        line-height: 1.4;
                    }

                    .stat-chip strong {
                        display: block;
                        font-size: 13px;
                        font-weight: 700;
                        color: #f97316;
                    }
                </style>
            </head>
            <body>
                <div class="logo-wrap">
                    <img src="${logoUri}" alt="BlastShield Logo" />
                </div>
                <div class="title">BlastShield Studio</div>
                <div class="subtitle">Production Incident Simulator</div>

                <div class="card">
                    <div class="description">
                        Simulate real production failures — traffic spikes, race conditions, cascade failures — before they hit your users.
                    </div>
                    <button class="run-btn" onclick="run()">
                        🚀 Run Production Simulation
                    </button>

                    <div class="stat-row">
                        <div class="stat-chip">
                            <strong>6</strong> drill types
                        </div>
                        <div class="stat-chip">
                            <strong>AI</strong> powered
                        </div>
                        <div class="stat-chip">
                            <strong>Live</strong> analysis
                        </div>
                    </div>
                </div>

                <div class="footer-text">
                    Analyzes concurrency, latency,<br>chaos, and edge cases.
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

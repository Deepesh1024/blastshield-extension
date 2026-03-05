import * as vscode from 'vscode';
import { getHtmlTemplate } from './htmlTemplate';

export class BlastShieldPanel {
    public static currentPanel: BlastShieldPanel | undefined;
    private static readonly viewType = 'blastshieldStudio';

    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];
    private _messageHandler: ((message: any) => void) | undefined;

    public static createOrShow(extensionUri: vscode.Uri) {
        const column = vscode.ViewColumn.One;

        if (BlastShieldPanel.currentPanel) {
            BlastShieldPanel.currentPanel._panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            BlastShieldPanel.viewType,
            'BlastShield Studio',
            column,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'dist', 'webview'),
                    vscode.Uri.joinPath(extensionUri, 'logo'),
                ],
            }
        );

        BlastShieldPanel.currentPanel = new BlastShieldPanel(panel, extensionUri);
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        this._panel.webview.html = this._getHtmlContent();
        this._panel.iconPath = vscode.Uri.joinPath(extensionUri, 'logo', 'blastshield-logo.png');

        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        this._panel.webview.onDidReceiveMessage(
            (message) => {
                if (this._messageHandler) {
                    this._messageHandler(message);
                }
            },
            null,
            this._disposables
        );
    }

    public postMessage(message: any) {
        this._panel.webview.postMessage(message);
    }

    public onDidReceiveMessage(handler: (message: any) => void) {
        this._messageHandler = handler;
    }

    private _getHtmlContent(): string {
        const webview = this._panel.webview;

        // URIs for webview-ui built assets
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview', 'index.js')
        );
        const styleUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview', 'index.css')
        );
        const logoUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'logo', 'blastshield-logo.png')
        );

        const nonce = getNonce();

        return getHtmlTemplate({
            scriptUri: scriptUri.toString(),
            styleUri: styleUri.toString(),
            logoUri: logoUri.toString(),
            nonce,
            cspSource: webview.cspSource,
        });
    }

    public dispose() {
        BlastShieldPanel.currentPanel = undefined;
        this._panel.dispose();

        while (this._disposables.length) {
            const d = this._disposables.pop();
            if (d) {
                d.dispose();
            }
        }
    }
}

function getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

import * as vscode from 'vscode';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { zipWorkspace } from './zip/workspaceZipper';
import { sendScanRequest } from './api/scanClient';
import { BlastShieldPanel } from './webview/BlastShieldPanel';
import { BlastShieldSidebarProvider } from './webview/BlastShieldSidebarProvider';

export function activate(context: vscode.ExtensionContext) {
    // Load .env relative to the extension's root directory
    dotenv.config({ path: path.resolve(context.extensionUri.fsPath, '.env') });

    console.log('BlastShield Studio is now active.');

    // Register Sidebar View
    const sidebarProvider = new BlastShieldSidebarProvider(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            BlastShieldSidebarProvider.viewType,
            sidebarProvider
        )
    );

    const runSimulation = vscode.commands.registerCommand(
        'blastshield.runSimulation',
        async () => {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders || workspaceFolders.length === 0) {
                vscode.window.showErrorMessage(
                    'BlastShield: No workspace folder is open. Please open a project first.'
                );
                return;
            }

            const rootPath = workspaceFolders[0].uri.fsPath;

            // Open (or reveal) the BlastShield panel immediately
            BlastShieldPanel.createOrShow(context.extensionUri);
            const panel = BlastShieldPanel.currentPanel;

            if (!panel) {
                vscode.window.showErrorMessage('BlastShield: Failed to create webview panel.');
                return;
            }

            let lastResult: any = null;

            // Notify the webview to start loading
            panel.postMessage({ type: 'scanStart' });

            try {
                // Step 1: Zip the workspace
                vscode.window.showInformationMessage('BlastShield: Zipping workspace...');
                const zipBuffer = await zipWorkspace(rootPath);

                // Step 2: Send to backend
                vscode.window.showInformationMessage('BlastShield: Sending to analysis backend...');

                // Read from .env populated by dotenv.config above
                const apiBaseUrl = process.env.BLASTSHIELD_API_URL || 'http://localhost:8000';

                const result = await sendScanRequest(apiBaseUrl, zipBuffer);
                lastResult = result;

                // Step 3: Send results to webview
                panel.postMessage({ type: 'scanResult', data: result });

                vscode.window.showInformationMessage('BlastShield: Simulation complete.');
            } catch (error: any) {
                console.error('BlastShield scan error:', error);

                // Send error to webview — it will fallback to demo mode
                panel.postMessage({
                    type: 'scanError',
                    error: error.message || 'Unknown error occurred',
                });

                vscode.window.showWarningMessage(
                    `BlastShield: Backend unavailable — loading demo mode. (${error.message})`
                );
            }

            // Handle messages from webview
            panel.onDidReceiveMessage(async (message: any) => {
                switch (message.type) {
                    case 'ready':
                        if (lastResult) {
                            panel.postMessage({ type: 'scanResult', data: lastResult });
                        }
                        break;
                    case 'runSimulation':
                        vscode.commands.executeCommand('blastshield.runSimulation');
                        break;

                    case 'runScenario':
                        try {
                            const apiBaseUrl = process.env.BLASTSHIELD_API_URL || 'http://localhost:8000';
                            // For What-If scenarios, we re-zip to ensure we're testing the latest code
                            const zipBuffer = await zipWorkspace(rootPath);
                            const scenarioResult = await sendScanRequest(apiBaseUrl, zipBuffer, message.data);

                            // Send back as scenarioResult (UI will merge/update)
                            panel.postMessage({ type: 'scenarioResult', data: scenarioResult });
                        } catch (err: any) {
                            panel.postMessage({
                                type: 'scenarioError',
                                error: err.message || 'Scenario request failed',
                            });
                        }
                        break;
                }
            });
        }
    );

    context.subscriptions.push(runSimulation);
}

export function deactivate() { }

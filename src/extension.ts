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

            // Open (or reveal) the BlastShield panel
            BlastShieldPanel.createOrShow(context.extensionUri);
            const panel = BlastShieldPanel.currentPanel;

            if (!panel) {
                vscode.window.showErrorMessage('BlastShield: Failed to create webview panel.');
                return;
            }

            // Register message handler FIRST, before any async work
            panel.onDidReceiveMessage(async (message: any) => {
                switch (message.type) {
                    case 'runSimulation':
                        vscode.commands.executeCommand('blastshield.runSimulation');
                        break;
                    case 'runScenario':
                        try {
                            const apiBase = process.env.BLASTSHIELD_API_URL || 'http://localhost:8000';
                            const zipBuf = await zipWorkspace(rootPath);
                            const scenarioResult = await sendScanRequest(apiBase, zipBuf, message.data);
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

            // Wait for the webview to signal it's fully loaded before sending anything
            await panel.ready;

            // Notify the webview to show loading state
            panel.postMessage({ type: 'scanStart' });

            try {
                vscode.window.showInformationMessage('BlastShield: Zipping workspace...');
                const zipBuffer = await zipWorkspace(rootPath);

                vscode.window.showInformationMessage('BlastShield: Sending to analysis backend...');
                const apiBaseUrl = process.env.BLASTSHIELD_API_URL || 'http://localhost:8000';

                const result = await sendScanRequest(apiBaseUrl, zipBuffer);

                panel.postMessage({ type: 'scanResult', data: result });
                vscode.window.showInformationMessage('BlastShield: Simulation complete.');
            } catch (error: any) {
                console.error('BlastShield scan error:', error);

                // Fallback to demo mode
                panel.postMessage({
                    type: 'scanError',
                    error: error.message || 'Unknown error occurred',
                });

                vscode.window.showWarningMessage(
                    `BlastShield: Backend unavailable — loading demo mode. (${error.message})`
                );
            }
        }
    );

    context.subscriptions.push(runSimulation);
}

export function deactivate() { }

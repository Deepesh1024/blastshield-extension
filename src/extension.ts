import * as vscode from 'vscode';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { zipWorkspace } from './zip/workspaceZipper';
import { sendScanRequest } from './api/scanClient';
import { BlastShieldPanel } from './webview/BlastShieldPanel';
import { BlastShieldSidebarProvider } from './webview/BlastShieldSidebarProvider';
import { MOCK_DATA } from './mockData';

export function activate(context: vscode.ExtensionContext) {
    dotenv.config({ path: path.resolve(context.extensionUri.fsPath, '.env') });
    console.log('BlastShield Studio is now active.');

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
            const isNew = !BlastShieldPanel.currentPanel;

            BlastShieldPanel.createOrShow(context.extensionUri);
            const panel = BlastShieldPanel.currentPanel!;

            // Register message handlers
            panel.onDidReceiveMessage(async (message: any) => {
                if (message.type === 'runSimulation') {
                    vscode.commands.executeCommand('blastshield.runSimulation');
                } else if (message.type === 'runScenario') {
                    try {
                        const apiBase = process.env.BLASTSHIELD_API_URL || 'http://localhost:8000';
                        const zipBuf = await zipWorkspace(rootPath);
                        const scenarioResult = await sendScanRequest(apiBase, zipBuf, message.data);
                        panel.postMessage({ type: 'scenarioResult', data: scenarioResult });
                    } catch (err: any) {
                        panel.postMessage({ type: 'scenarioError', error: err.message });
                    }
                }
            });

            // If panel was just created, wait for React to mount before sending messages
            if (isNew) {
                await panel.ready;
            } else {
                // Panel already exists and React is running — give it a moment to re-activate
                await new Promise(r => setTimeout(r, 100));
            }

            panel.postMessage({ type: 'scanStart' });

            try {
                vscode.window.showInformationMessage('BlastShield: Zipping workspace...');
                const zipBuffer = await zipWorkspace(rootPath);

                vscode.window.showInformationMessage('BlastShield: Analysing with AI backend...');
                const apiBaseUrl = process.env.BLASTSHIELD_API_URL || 'http://localhost:8000';
                const rawResult = await sendScanRequest(apiBaseUrl, zipBuffer);

                // Merge with MOCK_DATA as a safe fallback for any missing fields
                const result = { ...MOCK_DATA, ...rawResult };

                panel.postMessage({ type: 'scanResult', data: result });
                vscode.window.showInformationMessage('BlastShield: Simulation complete.');
            } catch (error: any) {
                console.error('BlastShield scan error:', error);
                // Send demo data on error
                panel.postMessage({ type: 'scanError', error: error.message || 'Unknown error' });
                vscode.window.showWarningMessage(
                    `BlastShield: Backend unavailable — loading demo mode. (${error.message})`
                );
            }
        }
    );

    context.subscriptions.push(runSimulation);
}

export function deactivate() { }

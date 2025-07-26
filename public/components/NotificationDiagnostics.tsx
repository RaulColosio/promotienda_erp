import React, { useState } from 'react';
import { useCrm } from '../store/crmStore';
import { db } from '../firebase'; // Using compat db
import { TerminalIcon, RefreshCwIcon, CheckCircleIcon, XCircleIcon } from './Icons';

type Status = 'idle' | 'pending' | 'success' | 'failed';

const StatusIndicator: React.FC<{ status: Status; message?: string }> = ({ status, message }) => {
    switch(status) {
        case 'pending':
            return <RefreshCwIcon className="w-5 h-5 text-slate-500 animate-spin" />;
        case 'success':
            return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
        case 'failed':
            return (
                <div className="flex items-center gap-2">
                    <XCircleIcon className="w-5 h-5 text-red-500" />
                    {message && <span className="text-xs text-red-600">{message}</span>}
                </div>
            )
        default:
            return <div className="w-5 h-5"></div>;
    }
};

const NotificationDiagnostics: React.FC = () => {
    const { currentUser } = useCrm();
    const [isTesting, setIsTesting] = useState(false);

    const [writeStatus, setWriteStatus] = useState<Status>('idle');
    const [readStatus, setReadStatus] = useState<Status>('idle');
    const [deleteStatus, setDeleteStatus] = useState<Status>('idle');

    const [writeError, setWriteError] = useState('');
    const [readError, setReadError] = useState('');
    const [deleteError, setDeleteError] = useState('');

    const runDiagnostics = async () => {
        if (!currentUser) {
            alert("Current user not found. Please log in again.");
            return;
        }

        setIsTesting(true);
        // Reset states
        setWriteStatus('pending'); setWriteError('');
        setReadStatus('idle');    setReadError('');
        setDeleteStatus('idle');  setDeleteError('');
        
        const testId = `test_${currentUser.id}_${Date.now()}`;
        let testDocId: string | null = null;
        
        // --- 1. Test Write ---
        try {
            const testNotification = {
                userId: currentUser.id,
                message: "Notification system test write.",
                link: '/settings',
                isRead: true,
                createdAt: new Date().toISOString(),
                createdBy: { id: currentUser.id, name: currentUser.name },
                testId: testId
            };
            const docRef = await db.collection('notifications').add(testNotification);
            testDocId = docRef.id;
            setWriteStatus('success');
        } catch (error: any) {
            setWriteStatus('failed');
            setWriteError(error.message || 'An unknown error occurred.');
            setIsTesting(false);
            return; // Stop if write fails
        }

        // --- 2. Test Read ---
        setReadStatus('pending');
        await new Promise(resolve => setTimeout(resolve, 500)); // Give Firestore a moment to index

        try {
            const querySnapshot = await db.collection('notifications').where('testId', '==', testId).limit(1).get();
            if (querySnapshot.empty) {
                throw new Error("Test notification created but not found. This might indicate a permissions issue or an ID mismatch.");
            }
            // Verify ID matches the one we received from `add`
            if (querySnapshot.docs[0].id !== testDocId) {
                 throw new Error("Found a test doc, but its ID does not match. This could indicate a query issue.");
            }
            setReadStatus('success');
        } catch (error: any) {
            setReadStatus('failed');
            setReadError(error.message || 'An unknown error occurred.');
            // Continue to cleanup even if read fails
        }
        
        // --- 3. Test Delete ---
        setDeleteStatus('pending');
        if (testDocId) {
            try {
                await db.collection('notifications').doc(testDocId).delete();
                setDeleteStatus('success');
            } catch (error: any) {
                setDeleteStatus('failed');
                setDeleteError(error.message || 'Failed to clean up test notification.');
            }
        } else {
             setDeleteStatus('failed');
             setDeleteError('Cannot run delete test because write test failed to return a document ID.');
        }

        setIsTesting(false);
    };

    return (
        <div>
            <h3 className="text-xl font-semibold text-slate-800 mb-4">Notification System Diagnostics</h3>
            <div className="bg-slate-50 p-6 rounded-lg border">
                <p className="text-sm text-slate-600 mb-4">
                    This tool tests the fundamental operations (Write, Read, Delete) for notifications for your user account.
                    If any step fails, it likely indicates a problem with database permissions or configuration.
                </p>
                <div className="space-y-3 p-4 bg-white rounded-md border">
                    <div className="flex justify-between items-center">
                        <span className="font-medium text-slate-700">1. Write Test Notification</span>
                        <StatusIndicator status={writeStatus} message={writeError} />
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="font-medium text-slate-700">2. Read Test Notification</span>
                        <StatusIndicator status={readStatus} message={readError} />
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="font-medium text-slate-700">3. Delete Test Notification (Cleanup)</span>
                        <StatusIndicator status={deleteStatus} message={deleteError} />
                    </div>
                </div>
                <div className="mt-6 flex justify-end">
                     <button 
                        onClick={runDiagnostics} 
                        disabled={isTesting}
                        className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-wait"
                    >
                        {isTesting ? (
                            <RefreshCwIcon className="w-5 h-5 mr-2 animate-spin" />
                        ) : (
                            <TerminalIcon className="w-5 h-5 mr-2" />
                        )}
                        {isTesting ? 'Running...' : 'Run Diagnostics'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotificationDiagnostics;
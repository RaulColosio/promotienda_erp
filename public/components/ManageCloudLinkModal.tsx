

import React, { useState, useEffect } from 'react';
import { useCrm } from '../store/crmStore';
import { Deal } from '../types';
import Modal from './Modal';
import { LinkIcon } from './Icons';

interface ManageCloudLinkModalProps {
    isOpen: boolean;
    onClose: () => void;
    deal: Deal;
}

const ManageCloudLinkModal: React.FC<ManageCloudLinkModalProps> = ({ isOpen, onClose, deal }) => {
    const { updateDeal, pickGoogleDriveFolder, isGoogleDriveConnected, googleApiReady } = useCrm();
    const [url, setUrl] = useState('');

    useEffect(() => {
        if (isOpen && deal) {
            setUrl(deal.googleDriveFolderUrl || '');
        }
    }, [isOpen, deal]);

    const handleSave = () => {
        const trimmedUrl = url.trim();
        updateDeal(deal.id, () => ({
            googleDriveFolderUrl: trimmedUrl || undefined,
        }));
        onClose();
    };

    const handleClear = () => {
        updateDeal(deal.id, () => ({
            googleDriveFolderUrl: undefined,
        }));
        onClose();
    };

    const handleSelectFolder = async () => {
        try {
            const folder = await pickGoogleDriveFolder();
            if (folder) {
                setUrl(folder.url);
            }
        } catch (error) {
            console.error(error);
            alert("Could not open Google Drive picker. Please ensure you are connected in Settings.");
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Manage Cloud Link">
            <div className="space-y-4">
                <p className="text-sm text-slate-600">
                    Set a specific Google Drive folder URL for this deal, or clear it to use the primary contact's default folder.
                </p>
                <div>
                    <label htmlFor="cloud-link-url" className="block text-sm font-medium text-slate-700">Google Drive Folder URL</label>
                     <div className="mt-1 flex gap-2">
                        <input
                            type="url"
                            id="cloud-link-url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://drive.google.com/drive/folders/..."
                            className="flex-grow block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                            type="button"
                            onClick={handleSelectFolder}
                            disabled={!isGoogleDriveConnected || !googleApiReady}
                            title={!isGoogleDriveConnected ? "Connect to Google Drive in Settings first" : "Select Folder from Google Drive"}
                            className="flex-shrink-0 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 border border-slate-300 rounded-md hover:bg-slate-200 disabled:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
                        >
                            <LinkIcon className="w-5 h-5" />
                        </button>
                    </div>
                     {!isGoogleDriveConnected && <p className="text-xs text-slate-500 mt-1">Connect to Google Drive in Settings to enable folder selection.</p>}
                </div>
                <div className="flex justify-between items-center pt-4">
                    <button
                        type="button"
                        onClick={handleClear}
                        className="px-4 py-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-50"
                    >
                        Clear Deal-Specific Link
                    </button>
                    <div className="flex gap-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 border border-slate-300 rounded-md hover:bg-slate-200">Cancel</button>
                        <button type="button" onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700">Save</button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default ManageCloudLinkModal;
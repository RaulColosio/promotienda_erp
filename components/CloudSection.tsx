

import React, { useState, useMemo } from 'react';
import { useCrm } from '../store/crmStore';
import { Deal, Contact } from '../types';
import { CloudIcon, EditIcon, LinkIcon } from './Icons';
import ManageCloudLinkModal from './ManageCloudLinkModal';

interface CloudSectionProps {
    deal: Deal;
}

const CloudSection: React.FC<CloudSectionProps> = ({ deal }) => {
    const { getContactById } = useCrm();
    const [isManageModalOpen, setIsManageModalOpen] = useState(false);

    const primaryContact = useMemo(() =>
        deal.contactIds.length > 0 ? getContactById(deal.contactIds[0]) : undefined
    , [deal.contactIds, getContactById]);

    const effectiveUrl = useMemo(() =>
        deal.googleDriveFolderUrl || primaryContact?.googleDriveFolderUrl
    , [deal, primaryContact]);

    const urlSource = useMemo(() => {
        if (deal.googleDriveFolderUrl) return 'Deal';
        if (primaryContact?.googleDriveFolderUrl) return `Contact (${primaryContact.firstName})`;
        return null;
    }, [deal, primaryContact]);

    return (
        <>
            {isManageModalOpen && <ManageCloudLinkModal isOpen={isManageModalOpen} onClose={() => setIsManageModalOpen(false)} deal={deal} />}

            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-slate-800 flex items-center">
                        <CloudIcon className="w-5 h-5 mr-2 text-slate-500" />
                        Nube de contacto
                    </h3>
                    <button onClick={() => setIsManageModalOpen(true)} className="text-blue-600 hover:text-blue-800 text-sm font-semibold">
                        Manage Link
                    </button>
                </div>
                
                {effectiveUrl ? (
                    <div className="space-y-2">
                        <a 
                            href={effectiveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-blue-600 font-medium break-all hover:underline"
                        >
                            <LinkIcon className="w-4 h-4 flex-shrink-0" />
                            <span>{effectiveUrl}</span>
                        </a>
                        {urlSource && <p className="text-xs text-slate-400">Source: {urlSource}</p>}
                    </div>
                ) : (
                     <div className="text-center py-4">
                        <p className="text-sm text-slate-500">No Google Drive folder linked.</p>
                        <button onClick={() => setIsManageModalOpen(true)} className="mt-2 text-sm font-semibold text-blue-600 hover:underline">
                            Add a link for this deal
                        </button>
                    </div>
                )}
            </div>
        </>
    );
};

export default CloudSection;
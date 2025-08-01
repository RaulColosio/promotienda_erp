

import React from 'react';
import { Deal } from '../types';
import Modal from './Modal';

interface ManageCloudLinkModalProps {
    isOpen: boolean;
    onClose: () => void;
    deal: Deal;
}

const ManageCloudLinkModal: React.FC<ManageCloudLinkModalProps> = ({ isOpen, onClose, deal }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Manage Cloud Link">
            <div className="p-4 text-center">
                <p className="text-slate-600">This feature is temporarily disabled.</p>
            </div>
        </Modal>
    );
};

export default ManageCloudLinkModal;
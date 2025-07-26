import React from 'react';
import { NavLink } from 'react-router-dom';
import { useCrm } from '../store/crmStore';
import { BellIcon } from './Icons';

interface NotificationCenterProps {
    isCollapsed: boolean;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ isCollapsed }) => {
    const { notifications } = useCrm();

    const unreadCount = notifications.filter(n => !n.isRead).length;
    
    const navLinkClasses = ({ isActive }: { isActive: boolean }): string =>
        `flex items-center py-3 text-sm font-medium rounded-lg transition-colors duration-200 relative ${isCollapsed ? 'px-3 justify-center' : 'px-4'} ${
            isActive 
            ? 'bg-blue-600 text-white' 
            : 'text-slate-200 hover:bg-slate-700 hover:text-white'
        }`;

    return (
        <NavLink to="/messages" className={navLinkClasses} title="Mensajes">
            <BellIcon className={`w-5 h-5 shrink-0 ${!isCollapsed && 'mr-3'}`} />
            {!isCollapsed && <span className="truncate">Mensajes</span>}
            {unreadCount > 0 && (
                <span className={`absolute top-2 flex ${isCollapsed ? 'right-2' : 'right-4'}`}>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative flex items-center justify-center h-5 min-w-[20px] px-1 text-xs font-bold text-white bg-red-500 rounded-full">
                        {unreadCount}
                    </span>
                </span>
            )}
        </NavLink>
    );
};

export default NotificationCenter;
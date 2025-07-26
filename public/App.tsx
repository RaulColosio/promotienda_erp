

import React, { useState, useEffect, useMemo } from 'react';
import { HashRouter, Routes, Route, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { CrmProvider, useCrm } from './store/crmStore';
import { Contact } from './types';
import DealsPage from './pages/DealsPage';
import ContactsPage from './pages/ContactsPage';
import DealDetailPage from './pages/DealDetailPage';
import ActivitiesPage from './pages/ActivitiesPage';
import SettingsPage from './pages/SettingsPage';
import ProductionPage from './pages/ProductionPage';
import LoginPage from './pages/LoginPage';
import MessagesPage from './pages/MessagesPage';
import ConfirmationModal from './components/ConfirmationModal';
import ContactDetailModal from './components/ContactDetailModal';
import AddEditContactModal from './components/AddEditContactModal';
import AddDealModal from './components/AddDealModal';
import AlertModal from './components/AlertModal';
import NotificationCenter from './components/NotificationCenter';
import { LayersIcon, UsersIcon, ClipboardListIcon, SettingsIcon, TagIcon, ChevronLeftIcon, ChevronRightIcon, LogOutIcon } from './components/Icons';

interface SidebarProps {
    isCollapsed: boolean;
    onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
    const { currentUser, logout, tasks } = useCrm();
    const isAdmin = currentUser?.role === 'Administrador';

    const pendingTaskCount = useMemo(() => {
        if (!currentUser) return 0;
        return tasks.filter(task => !task.completed && task.responsibleUserId === currentUser.id).length;
    }, [tasks, currentUser]);

    const navLinkClasses = ({ isActive }: { isActive: boolean }): string =>
        `flex items-center py-3 text-sm font-medium rounded-lg transition-colors duration-200 relative ${isCollapsed ? 'px-3 justify-center' : 'px-4'} ${
            isActive 
            ? 'bg-blue-600 text-white' 
            : 'text-slate-200 hover:bg-slate-700 hover:text-white'
        }`;

  return (
    <div className={`bg-slate-800 text-white flex flex-col h-screen relative z-20 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className="flex items-center justify-center h-20 border-b border-slate-700 shrink-0 px-4">
        {isCollapsed ? (
             <LayersIcon className="w-8 h-8 text-white mx-auto" />
        ) : (
            <h1 className="text-2xl font-bold text-white">PROMOTIENDA</h1>
        )}
      </div>

      <nav className={`p-4 space-y-2 overflow-y-auto flex-grow ${isCollapsed ? 'px-2' : 'px-4'}`}>
        <NavLink to="/deals" className={navLinkClasses} title="Ventas">
          <LayersIcon className={`w-5 h-5 shrink-0 ${!isCollapsed && 'mr-3'}`} />
          {!isCollapsed && <span className="truncate">Ventas</span>}
        </NavLink>
        <NavLink to="/production" className={navLinkClasses} title="Producción">
          <TagIcon className={`w-5 h-5 shrink-0 ${!isCollapsed && 'mr-3'}`} />
          {!isCollapsed && <span className="truncate">Producción</span>}
        </NavLink>
        
        <NavLink to="/activities" className={navLinkClasses} title="Tareas">
          <ClipboardListIcon className={`w-5 h-5 shrink-0 ${!isCollapsed && 'mr-3'}`} />
          {!isCollapsed && <span className="truncate">Tareas</span>}
          {pendingTaskCount > 0 && (
            <span className={`absolute top-2 flex ${isCollapsed ? 'right-2' : 'right-4'}`}>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative flex items-center justify-center h-5 min-w-[20px] px-1 text-xs font-bold text-white bg-red-500 rounded-full">
                    {pendingTaskCount}
                </span>
            </span>
          )}
        </NavLink>
        
        <NotificationCenter isCollapsed={isCollapsed} />
        
        <NavLink to="/contacts" className={navLinkClasses} title="Contacts">
          <UsersIcon className={`w-5 h-5 shrink-0 ${!isCollapsed && 'mr-3'}`} />
          {!isCollapsed && <span className="truncate">Contacts</span>}
        </NavLink>
        {isAdmin && (
            <NavLink to="/settings" className={navLinkClasses} title="Settings">
                <SettingsIcon className={`w-5 h-5 shrink-0 ${!isCollapsed && 'mr-3'}`} />
                {!isCollapsed && <span className="truncate">Settings</span>}
            </NavLink>
        )}
      </nav>

      <div className="shrink-0">
          <div className="p-4 border-t border-slate-700">
             <button 
                onClick={onToggle} 
                className={`${navLinkClasses({isActive: false})} w-full`}
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
                {isCollapsed 
                    ? <ChevronRightIcon className="w-5 h-5" /> 
                    : <ChevronLeftIcon className="w-5 h-5" />
                }
             </button>
          </div>
          {currentUser && (
            <div className="p-4 border-t border-slate-700">
                {!isCollapsed ? (
                    <div>
                        <p className="text-sm font-semibold text-white truncate" title={currentUser.name}>{currentUser.name}</p>
                        <p className="text-xs text-slate-400 truncate" title={currentUser.email}>{currentUser.email}</p>
                    </div>
                ) : (
                    <div 
                        className="bg-slate-700 text-white rounded-full h-10 w-10 flex items-center justify-center text-lg font-bold mx-auto" 
                        title={`${currentUser.name}\n${currentUser.email}`}
                    >
                        {currentUser.name.charAt(0).toUpperCase()}
                    </div>
                )}
            </div>
          )}
          <div className="p-4 border-t border-slate-700">
              <button onClick={logout} className={`${navLinkClasses({isActive: false})} w-full`} title="Logout">
                  <LogOutIcon className={`w-5 h-5 shrink-0 ${!isCollapsed && 'mr-3'}`} />
                  {!isCollapsed && <span className="truncate">Logout</span>}
              </button>
          </div>
      </div>
    </div>
  );
};

const Layout: React.FC = () => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    return (
        <div className="flex bg-slate-100 h-screen">
            <Sidebar isCollapsed={isSidebarCollapsed} onToggle={() => setIsSidebarCollapsed(prev => !prev)} />
            <main className="flex-1 flex flex-col overflow-hidden">
                <Outlet />
            </main>
        </div>
    );
};

const ProtectedRoute: React.FC = () => {
    const { loading, currentUser } = useCrm();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-100">
                <p className="text-slate-500">Loading Application...</p>
            </div>
        );
    }

    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

const AppRoutes: React.FC = () => {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
                <Route element={<Layout />}>
                    <Route path="/" element={<Navigate to="/deals" replace />} />
                    <Route path="/deals" element={<DealsPage />} />
                    <Route path="/deals/:dealId" element={<DealDetailPage />} />
                    <Route path="/contacts" element={<ContactsPage />} />
                    <Route path="/activities" element={<ActivitiesPage />} />
                    <Route path="/production" element={<ProductionPage />} />
                    <Route path="/messages" element={<MessagesPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

// This component will live inside the Router and Provider, so it can use their hooks/context.
const NotificationHandler: React.FC = () => {
  const { showContactDetail } = useCrm();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const contactId = params.get('contactId');
    if (contactId) {
      showContactDetail(contactId);
      // Clean up the URL to avoid re-opening the modal on refresh/navigation
      navigate(location.pathname, { replace: true });
    }
  }, [location.search, showContactDetail, navigate]);
  
  return null; // This component does not render anything visible
};

const App: React.FC = () => {
  const [confirmation, setConfirmation] = useState<{ isOpen: boolean; message: string; onConfirm: () => void | Promise<void>; } | null>(null);
  const [contactDetail, setContactDetail] = useState<{ isOpen: boolean; contactId: string | null }>({ isOpen: false, contactId: null });
  const [addEditContact, setAddEditContact] = useState<{ isOpen: boolean; contactToEdit: Contact | null | undefined }>({ isOpen: false, contactToEdit: null });
  const [addDeal, setAddDeal] = useState<{ isOpen: boolean, contactId?: string }>({ isOpen: false });
  const [alert, setAlert] = useState<{ isOpen: boolean; title: string; message: string } | null>(null);

  const showConfirmation = (message: string, onConfirm: () => void | Promise<void>) => setConfirmation({ isOpen: true, message, onConfirm });
  const showContactDetail = (contactId: string) => setContactDetail({ isOpen: true, contactId });
  const showAddEditContact = (contact?: Contact | null) => setAddEditContact({ isOpen: true, contactToEdit: contact });
  const showAddDeal = (contactId?: string) => setAddDeal({ isOpen: true, contactId });
  const showAlert = (title: string, message: string) => setAlert({ isOpen: true, title, message });

  const handleCloseConfirmation = () => setConfirmation(null);
  const handleConfirm = async () => {
    if (confirmation) {
        await confirmation.onConfirm();
        handleCloseConfirmation();
    }
  }

  const handleCloseContactDetail = () => setContactDetail({ isOpen: false, contactId: null });
  const handleCloseAddEditContact = () => setAddEditContact({ isOpen: false, contactToEdit: null });
  const handleCloseAddDeal = () => setAddDeal({ isOpen: false });
  const handleCloseAlert = () => setAlert(null);
  
  return (
    <HashRouter>
      <CrmProvider
        showConfirmation={showConfirmation}
        showContactDetail={showContactDetail}
        showAddEditContact={showAddEditContact}
        showAddDeal={showAddDeal}
        showAlert={showAlert}
      >
        <NotificationHandler />
        <AppRoutes />
        
        <ConfirmationModal
          isOpen={confirmation?.isOpen || false}
          onClose={handleCloseConfirmation}
          onConfirm={handleConfirm}
          title="Confirm Action"
          message={confirmation?.message || ''}
        />
        <ContactDetailModal
          isOpen={contactDetail.isOpen}
          onClose={handleCloseContactDetail}
          contactId={contactDetail.contactId}
        />
        <AddEditContactModal
          isOpen={addEditContact.isOpen}
          onClose={handleCloseAddEditContact}
          contactToEdit={addEditContact.contactToEdit}
        />
        <AddDealModal
          isOpen={addDeal.isOpen}
          onClose={handleCloseAddDeal}
          defaultContactId={addDeal.contactId}
        />
        <AlertModal
            isOpen={alert?.isOpen || false}
            onClose={handleCloseAlert}
            title={alert?.title || 'Alert'}
            message={alert?.message || ''}
        />
      </CrmProvider>
    </HashRouter>
  );
};

export default App;
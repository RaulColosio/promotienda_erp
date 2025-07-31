import React, { useState, useEffect, useMemo, useRef } from 'react';
import { HashRouter, Routes, Route, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { CrmProvider, useCrm } from './store/crmStore';
import { Contact, Transaction } from './types';
import DealsPage from './pages/DealsPage';
import ContactsPage from './pages/ContactsPage';
import DealDetailPage from './pages/DealDetailPage';
import ActivitiesPage from './pages/ActivitiesPage';
import SettingsPage from './pages/SettingsPage';
import ProductionPage from './pages/ProductionPage';
import FinancialsPage from './pages/FinancialsPage';
import LoginPage from './pages/LoginPage';
import MessagesPage from './pages/MessagesPage';
import ConfirmationModal from './components/ConfirmationModal';
import ContactDetailModal from './components/ContactDetailModal';
import AddEditContactModal from './components/AddEditContactModal';
import AddDealModal from './components/AddDealModal';
import AddTransactionModal from './components/AddTransactionModal';
import AlertModal from './components/AlertModal';
import NotificationCenter from './components/NotificationCenter';
import GlobalSearch from './components/GlobalSearch';
import { LayersIcon, UsersIcon, ClipboardListIcon, SettingsIcon, DollarSignIcon, PaintBrushIcon, TrendingUpIcon, ChevronLeftIcon, ChevronRightIcon, LogOutIcon } from './components/Icons';

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
          <DollarSignIcon className={`w-5 h-5 shrink-0 ${!isCollapsed && 'mr-3'}`} />
          {!isCollapsed && <span className="truncate">Ventas</span>}
        </NavLink>
        <NavLink to="/production" className={navLinkClasses} title="Producción">
          <PaintBrushIcon className={`w-5 h-5 shrink-0 ${!isCollapsed && 'mr-3'}`} />
          {!isCollapsed && <span className="truncate">Producción</span>}
        </NavLink>
        <NavLink to="/financials" className={navLinkClasses} title="Finanzas">
            <TrendingUpIcon className={`w-5 h-5 shrink-0 ${!isCollapsed && 'mr-3'}`} />
            {!isCollapsed && <span className="truncate">Finanzas</span>}
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

const Header: React.FC = () => {
    return (
        <header className="flex-shrink-0 bg-white border-b border-slate-200 p-4 flex items-center justify-center z-10">
            <GlobalSearch />
        </header>
    );
};

const Layout: React.FC = () => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

    return (
        <div className="flex bg-slate-100 h-screen">
            <Sidebar isCollapsed={isSidebarCollapsed} onToggle={() => setIsSidebarCollapsed(prev => !prev)} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
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
                    <Route path="/financials" element={<FinancialsPage />} />
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, showContactDetail, navigate]);
  
  return null; // This component does not render anything visible
};

// NotificationController component to manage sounds and native notifications reliably
const NotificationController: React.FC = () => {
  const { notifications, loading } = useCrm();
  const audioRef = useRef<HTMLAudioElement>(null);
  const hasInitialized = useRef(false);
  const previousNotificationIds = useRef<Set<string>>(new Set());
  const isForeground = useRef(true);

  useEffect(() => {
    const handleVisibilityChange = () => {
      isForeground.current = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => {
    if (loading) return;

    const currentIds = new Set<string>(notifications.map(n => n.id));
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      previousNotificationIds.current = currentIds;
      return;
    }

    const newNotifications = notifications.filter(n => !previousNotificationIds.current.has(n.id));

    if (newNotifications.length > 0) {
      const latestNotification = newNotifications[0]; // Assuming notifications are sorted descending by date
      if (isForeground.current) {
        // Play sound directly if the app is in the foreground
        audioRef.current?.play().catch(e => console.warn("Audio play failed:", e));
      } else {
        // Show a native notification if the app is in the background
        if ('Notification' in window && Notification.permission === 'granted') {
          const notification = new Notification('New Message', {
            body: latestNotification.message,
            icon: '/vite.svg', // Optional: Add an icon URL
            silent: false, // Ensure sound plays if the OS allows
          });
          notification.onclick = () => {
             // Focus the window and navigate when the notification is clicked
             window.focus();
          };
        }
      }
    }

    previousNotificationIds.current = currentIds;
  }, [notifications, loading]);

  // The audio element is now part of this controller
  return <audio ref={audioRef} id="notification-sound" src="https://cdn.pixabay.com/download/audio/2023/09/24/audio_3108132791.mp3" preload="auto"></audio>;
};

const App: React.FC = () => {
  const [confirmation, setConfirmation] = useState<{ isOpen: boolean; message: string; onConfirm: () => void | Promise<void>; } | null>(null);
  const [contactDetail, setContactDetail] = useState<{ isOpen: boolean; contactId: string | null }>({ isOpen: false, contactId: null });
  const [addEditContact, setAddEditContact] = useState<{
    isOpen: boolean;
    contactToEdit?: Contact | null;
    initialValues?: Partial<Pick<Contact, 'firstName' | 'lastName' | 'email' | 'company'>>;
    onSave?: (newContact: Contact) => void;
  }>({ isOpen: false });
  const [addDeal, setAddDeal] = useState<{ isOpen: boolean, contactId?: string }>({ isOpen: false });
  const [alert, setAlert] = useState<{ isOpen: boolean; title: string; message: string } | null>(null);
  const [addEditTransaction, setAddEditTransaction] = useState<{ isOpen: boolean; transactionToEdit?: Transaction | null }>({ isOpen: false });

  const showConfirmation = (message: string, onConfirm: () => void | Promise<void>) => setConfirmation({ isOpen: true, message, onConfirm });
  const showContactDetail = (contactId: string) => setContactDetail({ isOpen: true, contactId });
  const showAddEditContact = (
    contact?: Contact | null,
    config?: {
        initialValues?: Partial<Pick<Contact, 'firstName' | 'lastName' | 'email' | 'company'>>;
        onSave?: (newContact: Contact) => void;
    }
  ) => setAddEditContact({
      isOpen: true,
      contactToEdit: contact,
      initialValues: config?.initialValues,
      onSave: config?.onSave,
  });
  const showAddDeal = (contactId?: string) => setAddDeal({ isOpen: true, contactId });
  const showAlert = (title: string, message: string) => setAlert({ isOpen: true, title, message });
  const showAddEditTransaction = (transaction?: Transaction | null) => setAddEditTransaction({ isOpen: true, transactionToEdit: transaction });

  const handleCloseConfirmation = () => setConfirmation(null);
  const handleConfirm = async () => {
    if (confirmation) {
        await confirmation.onConfirm();
        handleCloseConfirmation();
    }
  }

  const handleCloseContactDetail = () => setContactDetail({ isOpen: false, contactId: null });
  const handleCloseAddEditContact = () => setAddEditContact({ isOpen: false });
  const handleCloseAddDeal = () => setAddDeal({ isOpen: false });
  const handleCloseAlert = () => setAlert(null);
  const handleCloseAddEditTransaction = () => setAddEditTransaction({ isOpen: false });
  
  return (
    <HashRouter>
      <CrmProvider
        showConfirmation={showConfirmation}
        showContactDetail={showContactDetail}
        showAddEditContact={showAddEditContact}
        showAddDeal={showAddDeal}
        showAlert={showAlert}
        showAddEditTransaction={showAddEditTransaction}
      >
        <NotificationHandler />
        <NotificationController />
        <AppRoutes />
        
        <ContactDetailModal
          isOpen={contactDetail.isOpen}
          onClose={handleCloseContactDetail}
          contactId={contactDetail.contactId}
        />
        <AddDealModal
          isOpen={addDeal.isOpen}
          onClose={handleCloseAddDeal}
          defaultContactId={addDeal.contactId}
        />
        <AddEditContactModal
          isOpen={addEditContact.isOpen}
          onClose={handleCloseAddEditContact}
          contactToEdit={addEditContact.contactToEdit}
          initialValues={addEditContact.initialValues}
          onSave={addEditContact.onSave}
        />
        <AddTransactionModal
            isOpen={addEditTransaction.isOpen}
            onClose={handleCloseAddEditTransaction}
            transactionToEdit={addEditTransaction.transactionToEdit}
        />
        <ConfirmationModal
          isOpen={confirmation?.isOpen || false}
          onClose={handleCloseConfirmation}
          onConfirm={handleConfirm}
          title="Confirm Action"
          message={confirmation?.message || ''}
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
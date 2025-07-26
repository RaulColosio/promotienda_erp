

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { Contact, Deal, Task, Note, User, Tag, MessageTemplate, Quote, DealStage, ContactNote, Notification } from '../types';
import { auth, db, googleAuthProvider } from '../firebase';
import firebase from 'firebase/compat/app';

const permanentUser: User = {
  id: 'user_raul_colosio',
  name: 'Raúl Colosio',
  email: 'hola@promotienda.mx',
  role: 'Administrador'
};

const monthAbbreviations = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun', 
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic'
];

export const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return '';
  const date = new Date(dateString.includes('T') ? dateString : `${dateString}T00:00:00`);
  if (isNaN(date.getTime())) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = monthAbbreviations[date.getMonth()];
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

export const addWorkingDays = (startDate: Date, days: number): Date => {
    let d = new Date(startDate);
    let addedDays = 0;
    while (addedDays < days) {
        d.setDate(d.getDate() + 1);
        if (d.getDay() !== 0) { // 0 = Sunday
            addedDays++;
        }
    }
    return d;
};


interface CrmContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;

  contacts: Contact[];
  deals: Deal[];
  tasks: Task[];
  notes: Note[];
  contactNotes: ContactNote[];
  users: User[];
  tags: Tag[];
  messageTemplates: MessageTemplate[];
  quotes: Quote[];
  notifications: Notification[];
  sentNotifications: Notification[];

  addContact: (contact: Omit<Contact, 'id' | 'createdAt'>) => Promise<Contact>;
  bulkAddContacts: (contacts: Omit<Contact, 'id' | 'createdAt'>[]) => Promise<void>;
  updateContact: (contact: Contact) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  mergeContacts: (masterContactId: string, mergedContactData: Partial<Contact>, otherContactIds: string[]) => Promise<void>;
  addDeal: (deal: Omit<Deal, 'id' | 'createdAt' | 'sortIndex'>) => Promise<Deal>;
  updateDeal: (dealId: string, updater: (deal: Deal) => Partial<Deal>) => Promise<void>;
  deleteDeal: (id: string) => Promise<void>;
  reorderDeal: (draggedId: string, targetId: string) => Promise<void>;
  getContactById: (id: string) => Contact | undefined;
  getDealById: (id: string) => Deal | undefined;
  getTasksForDeal: (dealId: string) => Task[];
  getAllPendingTasks: () => Task[];
  addTask: (task: Omit<Task, 'id' | 'completed'>) => Promise<void>;
  updateTask: (task: Task) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  deleteTasks: (ids: string[]) => Promise<void>;
  completeTasks: (ids: string[]) => Promise<void>;
  getNotesForDeal: (dealId: string) => Note[];
  addNote: (note: Omit<Note, 'id' | 'createdAt'>) => Promise<void>;
  updateNote: (note: Note) => Promise<void>;
  deleteNote: (noteId: string) => Promise<void>;
  getNotesForContact: (contactId: string) => ContactNote[];
  addContactNote: (note: Omit<ContactNote, 'id' | 'createdAt'>) => Promise<void>;
  updateContactNote: (note: ContactNote) => Promise<void>;
  deleteContactNote: (noteId: string) => Promise<void>;
  getUsers: () => User[];
  getUserById: (id: string) => User | undefined;
  addUser: (user: Omit<User, 'id'>) => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  deleteUser: (id: string) => Promise<void>; // This should probably be deactivate
  getTags: () => Tag[];
  getTagById: (id: string) => Tag | undefined;
  addTag: (tag: Omit<Tag, 'id' | 'sortIndex'>) => Promise<Tag>;
  updateTag: (tag: Tag) => Promise<void>;
  reorderTag: (draggedId: string, targetId: string) => Promise<void>;
  deleteTag: (tagId: string) => Promise<void>;
  addMessageTemplate: (template: Omit<MessageTemplate, 'id'>) => Promise<void>;
  updateMessageTemplate: (template: MessageTemplate) => Promise<void>;
  deleteMessageTemplate: (templateId: string) => Promise<void>;
  getQuotesForDeal: (dealId: string) => Quote[];
  addQuote: (quote: Omit<Quote, 'id' | 'createdAt'>) => Promise<void>;
  updateQuote: (quoteId: string, updates: Partial<Quote>) => Promise<void>;
  deleteQuote: (id: string) => Promise<void>;
  markNotificationsAsRead: (ids: string[]) => Promise<void>;
  markNotificationsAsUnread: (ids: string[]) => Promise<void>;
  deleteNotifications: (ids: string[]) => Promise<void>;
  toggleNoteLike: (noteId: string) => Promise<void>;
  toggleContactNoteLike: (noteId: string) => Promise<void>;

  deletedContacts: Contact[];
  deletedDeals: Deal[];
  deletedTasks: Task[];

  restoreContact: (id: string) => Promise<void>;
  restoreDeal: (id: string) => Promise<void>;
  restoreTask: (id: string) => Promise<void>;
  
  permanentlyDeleteContact: (id: string) => Promise<void>;
  permanentlyDeleteDeal: (id: string) => Promise<void>;
  permanentlyDeleteTask: (id: string) => Promise<void>;

  showConfirmation: (message: string, onConfirm: () => void | Promise<void>) => void;
  showContactDetail: (contactId: string) => void;
  showAddEditContact: (contact?: Contact | null) => void;
  showAddDeal: (contactId?: string) => void;
  showAlert: (title: string, message: string) => void;

  isGoogleDriveConnected: boolean;
  googleApiReady: boolean;
  connectToGoogleDrive: () => Promise<void>;
  disconnectFromGoogleDrive: () => Promise<void>;
  pickGoogleDriveFolder: () => Promise<{ id: string; url: string; name: string; } | null>;
}

const CrmContext = createContext<CrmContextType | undefined>(undefined);

const mapDocToData = <T extends {id: string}>(doc: any): T => ({ ...doc.data(), id: doc.id } as T);

export const CrmProvider: React.FC<{ children: ReactNode } & Pick<CrmContextType, 'showConfirmation' | 'showContactDetail' | 'showAddEditContact' | 'showAddDeal' | 'showAlert'>> = ({ 
    children, 
    showConfirmation,
    showContactDetail,
    showAddEditContact,
    showAddDeal,
    showAlert,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [contactNotes, setContactNotes] = useState<ContactNote[]>([]);
  const [users, setUsers] = useState<User[]>([permanentUser]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [messageTemplates, setMessageTemplates] = useState<MessageTemplate[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [sentNotifications, setSentNotifications] = useState<Notification[]>([]);
  
  const [deletedContacts, setDeletedContacts] = useState<Contact[]>([]);
  const [deletedDeals, setDeletedDeals] = useState<Deal[]>([]);
  const [deletedTasks, setDeletedTasks] = useState<Task[]>([]);

  const [isGoogleDriveConnected, setIsGoogleDriveConnected] = useState(false);
  const [googleApiReady, setGoogleApiReady] = useState(false);

  useEffect(() => {
      if ((window as any).gapi) {
          (window as any).gapi.load('picker', () => setGoogleApiReady(true));
      }
  }, []);

  useEffect(() => {
    const storedStatus = localStorage.getItem('googleDriveConnected');
    if (storedStatus === 'true') {
      setIsGoogleDriveConnected(true);
    }
  }, []);

  const connectToGoogleDrive = async () => {
      try {
          const result = await auth.signInWithPopup(googleAuthProvider);
          const credential = result.credential as firebase.auth.OAuthCredential;
          if (credential?.accessToken) {
              // Store token to use with Google Picker API
              sessionStorage.setItem('googleOauthToken', credential.accessToken);
              setIsGoogleDriveConnected(true);
              localStorage.setItem('googleDriveConnected', 'true');
          } else {
               throw new Error("No access token received from Google.");
          }
      } catch (error) {
          console.error("Google Drive connection error:", error);
          alert("Could not connect to Google Drive. Please check popup blockers and try again.");
          setIsGoogleDriveConnected(false);
          localStorage.removeItem('googleDriveConnected');
          sessionStorage.removeItem('googleOauthToken');
      }
  };

  const disconnectFromGoogleDrive = async () => {
      // For simplicity, we just clear our state. A full implementation
      // might involve revoking tokens or unlinking from Firebase user.
      setIsGoogleDriveConnected(false);
      localStorage.removeItem('googleDriveConnected');
      sessionStorage.removeItem('googleOauthToken');
  };

  const pickGoogleDriveFolder = async (): Promise<{id: string, url: string, name: string} | null> => {
      return new Promise((resolve, reject) => {
          const oauthToken = sessionStorage.getItem('googleOauthToken');
          const developerKey = (window as any).process?.env?.GOOGLE_API_KEY; // Placeholder
          const clientId = (window as any).process?.env?.GOOGLE_CLIENT_ID; // Placeholder

          if (!oauthToken || !googleApiReady) {
              return reject(new Error("Google Drive integration is not ready or user is not authenticated."));
          }
          
          const docsView = new (window as any).google.picker.DocsView((window as any).google.picker.ViewId.FOLDERS)
              .setIncludeFolders(true)
              .setSelectFolderEnabled(true);

          const picker = new (window as any).google.picker.PickerBuilder()
              // .setAppId(clientId) // AppID is your project number
              .setOAuthToken(oauthToken)
              // .setDeveloperKey(developerKey)
              .addView(docsView)
              .setCallback((data: any) => {
                  if (data.action === (window as any).google.picker.Action.PICKED) {
                      const doc = data.docs[0];
                      resolve({
                          id: doc.id,
                          url: doc.url,
                          name: doc.name,
                      });
                  } else if (data.action === (window as any).google.picker.Action.CANCEL) {
                      resolve(null);
                  }
              })
              .build();
          picker.setVisible(true);
      });
  };

  useEffect(() => {
    setLoading(true);

    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser && firebaseUser.email) {
        let userProfile: User | null = null;
        // Unified logic: always query Firestore to get the full user profile.
        const userQuery = await db.collection('users').where('email', '==', firebaseUser.email).limit(1).get();

        if (!userQuery.empty) {
            userProfile = mapDocToData<User>(userQuery.docs[0]);
        } else if (firebaseUser.email === permanentUser.email) {
            // Fallback for the permanent user if they don't have a Firestore doc.
            // This ensures the main admin can always log in.
            userProfile = permanentUser;
        }

        if (userProfile) {
          // If the profile from Firestore doesn't have an authUid, link it now.
          // This is important for new users created in the app.
          if (userProfile.id !== permanentUser.id && !userProfile.authUid) {
            await db.collection('users').doc(userProfile.id).update({ authUid: firebaseUser.uid });
            userProfile.authUid = firebaseUser.uid;
          }
          setCurrentUser(userProfile);
        } else {
            console.warn(`Authenticated user with email ${firebaseUser.email} has no profile in Firestore. Logging out.`);
            await auth.signOut();
            setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser) {
        setLoading(false); // Ensure loading is false if there's no user from the start
        setNotifications([]);
        setSentNotifications([]);
        return;
    };
    
    setLoading(true);
    const purgeExpiredItems = async () => { /* ... */ };
    purgeExpiredItems();

    const unsubscribers = [
      db.collection('contacts').where("deletedAt", "==", null).onSnapshot(snapshot => setContacts(snapshot.docs.map(doc => mapDocToData<Contact>(doc)))),
      db.collection('deals').where("deletedAt", "==", null).onSnapshot(snapshot => setDeals(snapshot.docs.map(doc => mapDocToData<Deal>(doc)))),
      db.collection('tasks').where("deletedAt", "==", null).onSnapshot(snapshot => setTasks(snapshot.docs.map(doc => mapDocToData<Task>(doc)))),
      db.collection('notes').onSnapshot(snapshot => setNotes(snapshot.docs.map(doc => mapDocToData<Note>(doc)))),
      db.collection('contactNotes').onSnapshot(snapshot => setContactNotes(snapshot.docs.map(doc => mapDocToData<ContactNote>(doc)))),
      db.collection('users').onSnapshot(snapshot => {
        const firestoreUsers = snapshot.docs.map(doc => mapDocToData<User>(doc));
        const combinedUsers = [permanentUser, ...firestoreUsers.filter(u => u.id !== permanentUser.id)];
        setUsers(combinedUsers.sort((a,b) => a.name.localeCompare(b.name)));
      }),
      db.collection('tags').orderBy('sortIndex').onSnapshot(snapshot => setTags(snapshot.docs.map(doc => mapDocToData<Tag>(doc)))),
      db.collection('messageTemplates').onSnapshot(snapshot => setMessageTemplates(snapshot.docs.map(doc => mapDocToData<MessageTemplate>(doc)))),
      db.collection('quotes').onSnapshot(snapshot => setQuotes(snapshot.docs.map(doc => mapDocToData<Quote>(doc)))),
      db.collection('notifications').where('userId', '==', currentUser.id).orderBy('createdAt', 'desc').onSnapshot(snapshot => setNotifications(snapshot.docs.map(doc => mapDocToData<Notification>(doc)))),
      db.collection('notifications').where('createdBy.id', '==', currentUser.id).orderBy('createdAt', 'desc').onSnapshot(snapshot => setSentNotifications(snapshot.docs.map(doc => mapDocToData<Notification>(doc)))),
      db.collection('contacts').where("deletedAt", "!=", null).onSnapshot(snapshot => setDeletedContacts(snapshot.docs.map(doc => mapDocToData<Contact>(doc)))),
      db.collection('deals').where("deletedAt", "!=", null).onSnapshot(snapshot => setDeletedDeals(snapshot.docs.map(doc => mapDocToData<Deal>(doc)))),
      db.collection('tasks').where("deletedAt", "!=", null).onSnapshot(snapshot => setDeletedTasks(snapshot.docs.map(doc => mapDocToData<Task>(doc)))),
    ];
    setLoading(false);
    return () => unsubscribers.forEach(unsub => unsub());
  }, [currentUser]);

  const login = async (email: string, password: string) => {
    await auth.signInWithEmailAndPassword(email, password);
  };
  const logout = async () => {
    await auth.signOut();
  };

  const add = async (coll: string, data: object) => {
    const cleanData = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined));
    return await db.collection(coll).add(cleanData);
  };
  const update = async (coll: string, id: string, data: object) => {
    const updateData = { ...data };
    for (const key in updateData) { if ((updateData as any)[key] === undefined) { (updateData as any)[key] = firebase.firestore.FieldValue.delete(); } }
    await db.collection(coll).doc(id).update(updateData);
  };
  const remove = async (coll: string, id: string) => await db.collection(coll).doc(id).delete();
  const softDelete = async (coll: string, id: string) => await update(coll, id, { deletedAt: new Date().toISOString() });
  const restore = async (coll: string, id: string) => await update(coll, id, { deletedAt: null });

  const syncNotificationsForNote = async (content: string, link: string, sourceNoteId: string, createdBy: User) => {
    const mentionRegex = /<span[^>]*data-user-id="([^"]+)"[^>]*>/g;
    let match;
    const newMentionIds = new Set<string>();
    while ((match = mentionRegex.exec(content)) !== null) {
      newMentionIds.add(match[1]);
    }

    const existingNotifsQuery = await db.collection('notifications').where('sourceNoteId', '==', sourceNoteId).get();
    const existingNotifsMap = new Map<string, string>(); // Map<userId, notificationId>
    existingNotifsQuery.docs.forEach(doc => {
        const data = doc.data();
        if(data.userId) {
            existingNotifsMap.set(data.userId, doc.id);
        }
    });
    const existingUserIds = new Set(existingNotifsMap.keys());
    
    const userIdsToAdd = new Set([...newMentionIds].filter(id => !existingUserIds.has(id)));
    const userIdsToDelete = new Set([...existingUserIds].filter(id => !newMentionIds.has(id)));
    
    if (userIdsToAdd.size === 0 && userIdsToDelete.size === 0) {
        return; // No changes needed
    }

    const batch = db.batch();

    userIdsToDelete.forEach(userId => {
        const notifId = existingNotifsMap.get(userId);
        if (notifId) {
            const notifRef = db.collection('notifications').doc(notifId);
            batch.delete(notifRef);
        }
    });

    userIdsToAdd.forEach(userId => {
        if (userId === createdBy.id) return; // Don't notify self

        const notificationRef = db.collection('notifications').doc();
        const message = `${createdBy.name} mentioned you in a note.`;
        batch.set(notificationRef, {
            userId,
            message,
            link,
            isRead: false,
            createdAt: new Date().toISOString(),
            createdBy: { id: createdBy.id, name: createdBy.name },
            sourceNoteId,
        });
    });

    await batch.commit();
  };

  const markNotificationsAsRead = async (ids: string[]) => {
    if (ids.length === 0) return;
    const batch = db.batch();
    ids.forEach(id => {
      const notificationRef = db.collection('notifications').doc(id);
      batch.update(notificationRef, { isRead: true });
    });
    await batch.commit();
  };
  
  const markNotificationsAsUnread = async (ids: string[]) => {
    if (ids.length === 0) return;
    const batch = db.batch();
    ids.forEach(id => {
      const notificationRef = db.collection('notifications').doc(id);
      batch.update(notificationRef, { isRead: false });
    });
    await batch.commit();
  };
  
  const deleteNotifications = async (ids: string[]) => {
    if (ids.length === 0) return;
    const batch = db.batch();
    ids.forEach(id => {
      const notificationRef = db.collection('notifications').doc(id);
      batch.delete(notificationRef);
    });
    await batch.commit();
  };

  const toggleLike = async (collectionName: 'notes' | 'contactNotes', noteId: string) => {
    if (!currentUser) return;
    const noteRef = db.collection(collectionName).doc(noteId);
    const noteDoc = await noteRef.get();
    if (!noteDoc.exists) return;

    const noteData = noteDoc.data();
    const currentLikes: string[] = noteData?.likes || [];
    
    if (currentLikes.includes(currentUser.id)) {
        await noteRef.update({
            likes: firebase.firestore.FieldValue.arrayRemove(currentUser.id)
        });
    } else {
        await noteRef.update({
            likes: firebase.firestore.FieldValue.arrayUnion(currentUser.id)
        });
    }
  };

  const toggleNoteLike = (noteId: string) => toggleLike('notes', noteId);
  const toggleContactNoteLike = (noteId: string) => toggleLike('contactNotes', noteId);


  const addContact = async (contact: Omit<Contact, 'id' | 'createdAt'>) => {
    const newContactRef = await add("contacts", {...contact, createdAt: new Date().toISOString(), deletedAt: null});
    const newContactSnap = await newContactRef.get();
    return mapDocToData<Contact>(newContactSnap);
  };
  const bulkAddContacts = async (contacts: Omit<Contact, 'id' | 'createdAt'>[]) => {
    const batch = db.batch();
    contacts.forEach(contact => {
        const newContactRef = db.collection('contacts').doc(); // Auto-generate ID
        const contactData = { ...contact, createdAt: new Date().toISOString(), deletedAt: null };
        batch.set(newContactRef, contactData);
    });
    await batch.commit();
  };
  const updateContact = async (contact: Contact) => await update("contacts", contact.id, contact);
  const mergeContacts = async (masterContactId: string, mergedContactData: Partial<Contact>, otherContactIds: string[]) => {
    const batch = db.batch();

    // 1. Update master contact
    const masterRef = db.collection('contacts').doc(masterContactId);
    const { id, ...updateData } = mergedContactData as Contact; // remove id before updating
    batch.update(masterRef, updateData);

    // 2. Re-associate deals
    const dealsToUpdate = deals.filter(deal => 
        deal.contactIds.some(cid => otherContactIds.includes(cid))
    );
    
    dealsToUpdate.forEach(deal => {
        const newContactIds = Array.from(new Set(
            deal.contactIds
                .filter(cid => !otherContactIds.includes(cid))
                .concat(masterContactId)
        ));
        const dealRef = db.collection('deals').doc(deal.id);
        batch.update(dealRef, { contactIds: newContactIds });
    });

    // 3. Re-associate contact notes
    const notesToUpdate = contactNotes.filter(note => otherContactIds.includes(note.contactId));
    notesToUpdate.forEach(note => {
        const noteRef = db.collection('contactNotes').doc(note.id);
        batch.update(noteRef, { contactId: masterContactId });
    });

    // 4. Delete duplicate contacts
    otherContactIds.forEach(id => {
        const contactRef = db.collection('contacts').doc(id);
        batch.delete(contactRef);
    });
    
    await batch.commit();
  };
  const addDeal = async (deal: Omit<Deal, 'id' | 'createdAt' | 'sortIndex'>): Promise<Deal> => {
    if (!deal.assignedUserId) {
        showAlert('Asignación obligatoria', 'Por favor, asigna el trato a un usuario antes de guardarlo.');
        throw new Error('Deal must be assigned to a user.');
    }
    const dealData = { ...deal, createdAt: new Date().toISOString(), tagIds: deal.tagIds || [], sortIndex: Date.now(), deletedAt: null };
    const newDealRef = await add("deals", dealData);

    // Automation: Create "Enviar cotización" task
    const today = new Date().toISOString().split('T')[0];
    await addTask({
        title: "Enviar cotización",
        dealId: newDealRef.id,
        responsibleUserId: deal.assignedUserId,
        dueDate: today,
    });

    const newDealSnap = await newDealRef.get();
    return mapDocToData<Deal>(newDealSnap);
  };
  const updateDeal = async (dealId: string, updater: (deal: Deal) => Partial<Deal>) => {
    const deal = deals.find(d => d.id === dealId) || deletedDeals.find(d => d.id === dealId);
    if (!deal) return;
    
    const updates = updater(deal);

    if (updates.hasOwnProperty('assignedUserId') && !updates.assignedUserId) {
        showAlert("Asignación obligatoria", "Los tratos no pueden quedar sin asignar. Por favor, selecciona otro usuario.");
        return; // Abort update
    }
    
    const originalStage = deal.stage;
    const newStage = updates.stage || deal.stage;
    
    const originalTagIds = new Set(deal.tagIds || []);
    // Start with the tags from the update, or fall back to original tags
    const finalTagIds = new Set('tagIds' in updates ? (updates.tagIds || []) : (deal.tagIds || []));

    // --- AUTOMATION TRIGGERS ---
    
    const today = new Date().toISOString().split('T')[0];
    
    // --- STAGE-BASED AUTOMATIONS ---
    // 1. Task for 'Compra de material'
    if (newStage === DealStage.MATERIAL_PURCHASE && originalStage !== DealStage.MATERIAL_PURCHASE && deal.assignedUserId) {
        await addTask({
            title: "Comprar material",
            dealId: deal.id,
            responsibleUserId: deal.assignedUserId,
            dueDate: today,
        });
    }

    // 2. 'Recibido' tag for 'Producción'
    if (newStage === DealStage.PRODUCTION && originalStage !== DealStage.PRODUCTION) {
        const recibidoTag = tags.find(t => t.name.toLowerCase() === 'recibido');
        if (recibidoTag) {
            finalTagIds.add(recibidoTag.id);
        }
    }
    
    // --- TAG-BASED AUTOMATIONS ---
    const addedTagIds = [...finalTagIds].filter(id => !originalTagIds.has(id));
    if (addedTagIds.length > 0) {
        const raul = users.find(u => u.name === 'Raúl Colosio');
        const produccionUser = users.find(u => u.name.toLowerCase() === 'producción');
        const addedTagsInfo = tags.filter(t => addedTagIds.includes(t.id));

        for (const addedTag of addedTagsInfo) {
            if (addedTag.name.toLowerCase() === 'serigrafía' && raul) {
                await addTask({ title: 'Preparar positivo', dealId: deal.id, responsibleUserId: raul.id, dueDate: today });
            }
            if (addedTag.name.toLowerCase() === 'dtf textil') {
                if (raul) await addTask({ title: 'Enviar diseño a impresión', dealId: deal.id, responsibleUserId: raul.id, dueDate: today });
                if (produccionUser) await addTask({ title: 'Estampado DTF textil', dealId: deal.id, responsibleUserId: produccionUser.id, dueDate: today });
            }
            if (addedTag.name.toLowerCase() === 'uv') {
                if (raul) await addTask({ title: 'Enviar diseño a impresión', dealId: deal.id, responsibleUserId: raul.id, dueDate: today });
                if (produccionUser) await addTask({ title: 'Estampado UV', dealId: deal.id, responsibleUserId: produccionUser.id, dueDate: today });
            }
        }
    }
    
    // --- FINAL RULES & VALIDATIONS ---

    // 1. Tags are cleared when leaving Production
    if (newStage !== DealStage.PRODUCTION && originalStage === DealStage.PRODUCTION) {
        updates.tagIds = [];
    } else {
        updates.tagIds = Array.from(finalTagIds);
    }

    // 2. Deals in Production must have at least one tag
    if (newStage === DealStage.PRODUCTION && updates.tagIds.length === 0) {
        showAlert("Action Required", "To keep this deal in Production, it must have at least one tag. Add another tag before removing this one.");
        return; // Abort update
    }

    await update("deals", dealId, updates);
  };
   const reorderDeal = async (draggedId: string, targetId: string) => {
    const draggedDeal = deals.find(d => d.id === draggedId);
    const targetDeal = deals.find(d => d.id === targetId);
    if (!draggedDeal || !targetDeal || draggedId === targetId) return;
    const stageDeals = deals.filter(d => d.stage === targetDeal.stage).sort((a, b) => a.sortIndex - b.sortIndex);
    const draggedIndex = stageDeals.findIndex(d => d.id === draggedId);
    const targetIndex = stageDeals.findIndex(d => d.id === targetId);
    if (draggedIndex === -1 || targetIndex === -1) return;
    let newSortIndex;
    if (draggedIndex < targetIndex) {
        const sortIndexAfter = stageDeals[targetIndex + 1]?.sortIndex;
        newSortIndex = (targetDeal.sortIndex + (sortIndexAfter || targetDeal.sortIndex + 2)) / 2;
    } else {
        const sortIndexBefore = stageDeals[targetIndex - 1]?.sortIndex;
        newSortIndex = (targetDeal.sortIndex + (sortIndexBefore || 0)) / 2;
    }
    await update("deals", draggedId, { sortIndex: newSortIndex, stage: targetDeal.stage });
  };
  const addTask = async (task: Omit<Task, 'id' | 'completed'>) => {
    if (!task.responsibleUserId) {
        showAlert('Asignación obligatoria', 'Por favor, asigna la tarea a un usuario antes de guardarla.');
        throw new Error('Task must be assigned to a user.');
    }
    await add("tasks", { ...task, completed: false, deletedAt: null });
  };
  const updateTask = async (task: Task) => {
    if (!task.responsibleUserId) {
        showAlert('Asignación obligatoria', 'Por favor, asigna la tarea a un usuario antes de guardarla.');
        throw new Error('Task must be assigned to a user.');
    }
    await update("tasks", task.id, task);
  };
  const batchSoftDelete = async (ids: string[], collectionName: string) => {
    const batch = db.batch();
    ids.forEach(id => { const docRef = db.collection(collectionName).doc(id); batch.update(docRef, { deletedAt: new Date().toISOString() }); });
    await batch.commit();
  }
  const deleteTasks = (ids: string[]) => batchSoftDelete(ids, 'tasks');
  const completeTasks = async (ids: string[]) => {
      const batch = db.batch();
      ids.forEach(id => { const docRef = db.collection("tasks").doc(id); batch.update(docRef, { completed: true }); });
      await batch.commit();
  };

  const deleteNoteAndAssociatedNotifications = async (noteId: string, noteCollection: 'notes' | 'contactNotes') => {
    const batch = db.batch();
    // 1. Delete the note itself
    const noteRef = db.collection(noteCollection).doc(noteId);
    batch.delete(noteRef);
    // 2. Find and delete associated notifications
    const notifsQuery = await db.collection('notifications').where('sourceNoteId', '==', noteId).get();
    notifsQuery.docs.forEach(doc => {
        batch.delete(doc.ref);
    });
    await batch.commit();
  };

  const addNote = async (note: Omit<Note, 'id' | 'createdAt'>) => {
    const newNoteRef = await add("notes", {...note, createdAt: new Date().toISOString()});
    if (currentUser) {
      await syncNotificationsForNote(note.content, `/deals/${note.dealId}`, newNoteRef.id, currentUser);
    }
  };
  const updateNote = async (note: Note) => {
    await update("notes", note.id, note);
    if (currentUser) {
      await syncNotificationsForNote(note.content, `/deals/${note.dealId}`, note.id, currentUser);
    }
  };
  const deleteNote = async (noteId: string) => {
    await deleteNoteAndAssociatedNotifications(noteId, 'notes');
  };

  const addContactNote = async (note: Omit<ContactNote, 'id' | 'createdAt'>) => {
    const newNoteRef = await add("contactNotes", {...note, createdAt: new Date().toISOString()});
    if (currentUser) {
      await syncNotificationsForNote(note.content, `/contacts?contactId=${note.contactId}`, newNoteRef.id, currentUser);
    }
  };
  const updateContactNote = async (note: ContactNote) => {
    await update("contactNotes", note.id, note);
    if (currentUser) {
      await syncNotificationsForNote(note.content, `/contacts?contactId=${note.contactId}`, note.id, currentUser);
    }
  };
  const deleteContactNote = async (noteId: string) => {
    await deleteNoteAndAssociatedNotifications(noteId, 'contactNotes');
  };

  const addUser = async (user: Omit<User, 'id'>) => { await add("users", user); };
  const updateUser = async (user: User) => await update("users", user.id, user);
  const deleteUser = async (id: string) => await remove("users", id);
  const addTag = async (tag: Omit<Tag, 'id' | 'sortIndex'>) => {
    const highestSortIndex = tags.reduce((max, t) => Math.max(max, t.sortIndex || 0), 0);
    const newTagRef = await add("tags", { ...tag, sortIndex: highestSortIndex + 1000 });
    const newTagSnap = await newTagRef.get();
    return mapDocToData<Tag>(newTagSnap);
  };
  const updateTag = async (tag: Tag) => await update("tags", tag.id, tag);
  const reorderTag = async (draggedId: string, targetId: string) => {
    const allTags = [...tags].sort((a, b) => a.sortIndex - b.sortIndex);
    const draggedIndex = allTags.findIndex(t => t.id === draggedId);
    const targetIndex = allTags.findIndex(t => t.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1 || draggedId === targetId) return;

    const targetTag = allTags[targetIndex];

    let newSortIndex;
    if (draggedIndex < targetIndex) {
      // Dragging down
      const afterTargetTag = allTags[targetIndex + 1];
      newSortIndex = (targetTag.sortIndex + (afterTargetTag ? afterTargetTag.sortIndex : targetTag.sortIndex + 2000)) / 2;
    } else {
      // Dragging up
      const beforeTargetTag = allTags[targetIndex - 1];
      newSortIndex = (targetTag.sortIndex + (beforeTargetTag ? beforeTargetTag.sortIndex : 0)) / 2;
    }

    await update("tags", draggedId, { sortIndex: newSortIndex });
  };
  const deleteTag = async (tagId: string) => {
    await remove("tags", tagId);
    const batch = db.batch();
    deals.forEach(deal => {
        if(deal.tagIds.includes(tagId)){
            const newTagIds = deal.tagIds.filter(id => id !== tagId);
            batch.update(db.collection("deals").doc(deal.id), {tagIds: newTagIds});
        }
    });
    await batch.commit();
  };
  const addMessageTemplate = async (template: Omit<MessageTemplate, 'id'>) => { await add("messageTemplates", template); };
  const updateMessageTemplate = async (template: MessageTemplate) => await update("messageTemplates", template.id, template);
  const deleteMessageTemplate = async (id: string) => await remove("messageTemplates", id);
  const addQuote = async (quote: Omit<Quote, 'id' | 'createdAt'>) => { await add("quotes", {...quote, createdAt: new Date().toISOString()}); };
  const updateQuote = async (quoteId: string, updates: Partial<Quote>) => await update("quotes", quoteId, updates);
  const deleteQuote = async (id: string) => await remove("quotes", id);

  const contextValue: CrmContextType = {
    currentUser, loading, login, logout,
    contacts, deals, tasks, notes, contactNotes, users, tags, messageTemplates, quotes, notifications, sentNotifications,
    getContactById: (id) => contacts.find(c => c.id === id) || deletedContacts.find(c => c.id === id),
    getDealById: (id) => deals.find(d => d.id === id) || deletedDeals.find(d => d.id === id),
    getTasksForDeal: (dealId) => tasks.filter(t => t.dealId === dealId).sort((a,b) => (a.completed ? 1 : -1) - (b.completed ? 1 : -1) || a.id.localeCompare(b.id)),
    getAllPendingTasks: () => tasks.filter(t => !t.completed).sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || '') || a.id.localeCompare(b.id)),
    getNotesForDeal: (dealId) => notes.filter(n => n.dealId === dealId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    getNotesForContact: (contactId) => contactNotes.filter(n => n.contactId === contactId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    getUsers: () => users,
    getUserById: (id) => users.find(u => u.id === id),
    getTags: () => tags,
    getTagById: (id) => tags.find(t => t.id === id),
    getQuotesForDeal: (dealId) => quotes.filter(q => q.dealId === dealId).sort((a, b) => (b.createdAt && a.createdAt) ? (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) : b.id.localeCompare(a.id)),
    addContact, bulkAddContacts, updateContact, mergeContacts, addDeal, updateDeal, reorderDeal, addTask, updateTask, completeTasks, addNote, updateNote, deleteNote, addContactNote, updateContactNote, deleteContactNote, addUser, updateUser, deleteUser, addTag, updateTag, deleteTag, reorderTag, addMessageTemplate, updateMessageTemplate, deleteMessageTemplate, addQuote, updateQuote, deleteQuote, markNotificationsAsRead, markNotificationsAsUnread, deleteNotifications,
    toggleNoteLike, toggleContactNoteLike,
    deleteContact: (id) => softDelete( 'contacts', id),
    deleteDeal: (id) => softDelete('deals', id),
    deleteTask: (id) => softDelete('tasks', id),
    deleteTasks,
    deletedContacts, deletedDeals, deletedTasks,
    restoreContact: (id) => restore('contacts', id),
    restoreDeal: (id) => restore('deals', id),
    restoreTask: (id) => restore('tasks', id),
    permanentlyDeleteContact: (id) => remove('contacts', id),
    permanentlyDeleteDeal: (id) => remove('deals', id),
    permanentlyDeleteTask: (id) => remove('tasks', id),
    showConfirmation, showContactDetail, showAddEditContact, showAddDeal, showAlert,
    isGoogleDriveConnected, googleApiReady, connectToGoogleDrive, disconnectFromGoogleDrive, pickGoogleDriveFolder,
  };

  return (
    <CrmContext.Provider value={contextValue}>
      {children}
    </CrmContext.Provider>
  );
};

export const useCrm = (): CrmContextType => {
  const context = useContext(CrmContext);
  if (!context) {
    throw new Error('useCrm must be used within a CrmProvider');
  }
  return context;
};


import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { Contact, Deal, Task, Note, User, Tag, MessageTemplate, Quote, ContactNote, Notification, ContactTag, DynamicList, BulkContactUpdatePayload, PipelineStage, Attachment } from '../types';
import { auth, db, storage, googleAuthProvider } from '../firebase';
import firebase from 'firebase/compat/app';

const permanentUser: User = {
  id: 'user_raul_colosio',
  name: 'Raúl Colosio',
  email: 'hola@promotienda.mx',
  role: 'Administrador',
  sortIndex: 0,
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

const reorderItems = async <T extends { id: string, sortIndex: number }>(
    draggedId: string, 
    targetId: string, 
    items: T[], 
    collectionName: string
) => {
    const allItems = [...items].sort((a, b) => a.sortIndex - b.sortIndex);
    const draggedIndex = allItems.findIndex(t => t.id === draggedId);
    const targetIndex = allItems.findIndex(t => t.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1 || draggedId === targetId) return;

    const targetItem = allItems[targetIndex];
    let newSortIndex;
    if (draggedIndex < targetIndex) { // Dragging down
        const afterTargetItem = allItems[targetIndex + 1];
        newSortIndex = (targetItem.sortIndex + (afterTargetItem ? afterTargetItem.sortIndex : targetItem.sortIndex + 2000)) / 2;
    } else { // Dragging up
        const beforeTargetItem = allItems[targetIndex - 1];
        newSortIndex = (targetItem.sortIndex + (beforeTargetItem ? beforeTargetItem.sortIndex : 0)) / 2;
    }
    await db.collection(collectionName).doc(draggedId).update({ sortIndex: newSortIndex });
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
  contactTags: ContactTag[];
  messageTemplates: MessageTemplate[];
  quotes: Quote[];
  notifications: Notification[];
  sentNotifications: Notification[];
  dynamicLists: DynamicList[];
  pipelineStages: PipelineStage[];

  addContact: (contact: Omit<Contact, 'id' | 'createdAt'>) => Promise<Contact>;
  bulkAddContacts: (contacts: Omit<Contact, 'id' | 'createdAt'>[]) => Promise<void>;
  updateContact: (contact: Contact) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  bulkDeleteContacts: (ids: string[]) => Promise<void>;
  bulkUpdateContacts: (ids: string[], updates: BulkContactUpdatePayload) => Promise<void>;
  mergeContacts: (masterContactId: string, mergedContactData: Partial<Contact>, otherContactIds: string[]) => Promise<void>;
  addDeal: (deal: Omit<Deal, 'id' | 'createdAt' | 'sortIndex'>) => Promise<Deal>;
  updateDeal: (dealId: string, updater: (deal: Deal) => Partial<Deal>) => Promise<void>;
  deleteDeal: (id: string) => Promise<void>;
  reorderDeal: (draggedId: string, targetId: string) => Promise<void>;
  getContactById: (id: string) => Contact | undefined;
  getDealById: (id: string) => Deal | undefined;
  getStageById: (id: string) => PipelineStage | undefined;
  getTasksForDeal: (dealId: string) => Task[];
  getAllPendingTasks: () => Task[];
  addTask: (task: Omit<Task, 'id' | 'completed'>) => Promise<void>;
  updateTask: (task: Task) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  deleteTasks: (ids: string[]) => Promise<void>;
  completeTasks: (ids: string[]) => Promise<void>;
  getNotesForDeal: (dealId: string) => Note[];
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'attachments'>, attachments: File[]) => Promise<void>;
  updateNote: (note: Omit<Note, 'attachments'>, newAttachments: File[], removedAttachments: Attachment[]) => Promise<void>;
  deleteNote: (noteId: string) => Promise<void>;
  getNotesForContact: (contactId: string) => ContactNote[];
  addContactNote: (note: Omit<ContactNote, 'id' | 'createdAt' | 'attachments'>, attachments: File[]) => Promise<void>;
  updateContactNote: (note: Omit<ContactNote, 'attachments'>, newAttachments: File[], removedAttachments: Attachment[]) => Promise<void>;
  deleteContactNote: (noteId: string) => Promise<void>;
  getUsers: () => User[];
  getUserById: (id: string) => User | undefined;
  addUser: (user: Omit<User, 'id' | 'sortIndex'>) => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  reorderUser: (draggedId: string, targetId: string) => Promise<void>;
  deleteUser: (id: string) => Promise<void>; // This should probably be deactivate
  getTags: () => Tag[];
  getTagById: (id: string) => Tag | undefined;
  addTag: (tag: Omit<Tag, 'id' | 'sortIndex'>) => Promise<Tag>;
  updateTag: (tag: Tag) => Promise<void>;
  reorderTag: (draggedId: string, targetId: string) => Promise<void>;
  deleteTag: (tagId: string) => Promise<void>;
  addContactTag: (tag: Omit<ContactTag, 'id' | 'sortIndex'>) => Promise<ContactTag>;
  updateContactTag: (tag: ContactTag) => Promise<void>;
  reorderContactTag: (draggedId: string, targetId: string) => Promise<void>;
  deleteContactTag: (tagId: string) => Promise<void>;
  addMessageTemplate: (template: Omit<MessageTemplate, 'id' | 'sortIndex'>) => Promise<void>;
  updateMessageTemplate: (template: MessageTemplate) => Promise<void>;
  reorderMessageTemplate: (draggedId: string, targetId: string) => Promise<void>;
  deleteMessageTemplate: (templateId: string) => Promise<void>;
  updatePipelineStage: (stage: PipelineStage) => Promise<void>;
  reorderPipelineStage: (draggedId: string, targetId: string) => Promise<void>;
  getQuotesForDeal: (dealId: string) => Quote[];
  addQuote: (quote: Omit<Quote, 'id' | 'createdAt'>) => Promise<void>;
  updateQuote: (quoteId: string, updates: Partial<Quote>) => Promise<void>;
  deleteQuote: (id: string) => Promise<void>;
  markNotificationsAsRead: (ids: string[]) => Promise<void>;
  markNotificationsAsUnread: (ids: string[]) => Promise<void>;
  deleteNotifications: (ids: string[]) => Promise<void>;
  toggleNoteLike: (noteId: string) => Promise<void>;
  toggleContactNoteLike: (noteId: string) => Promise<void>;
  addDynamicList: (list: Omit<DynamicList, 'id'>) => Promise<void>;
  updateDynamicList: (list: DynamicList) => Promise<void>;
  deleteDynamicList: (id: string) => Promise<void>;

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

// --- ATTACHMENT HELPERS ---
const uploadAttachment = async (file: File, contextId: string): Promise<Attachment> => {
    const storagePath = `attachments/${contextId}/${Date.now()}_${file.name}`;
    const storageRef = storage.ref(storagePath);
    const snapshot = await storageRef.put(file);
    const url = await snapshot.ref.getDownloadURL();
    return {
        id: snapshot.ref.name, // Use the file name in storage as a unique ID
        name: file.name,
        type: file.type,
        size: file.size,
        url,
        storagePath,
    };
};

const deleteAttachment = async (attachment: Attachment) => {
    try {
        await storage.ref(attachment.storagePath).delete();
    } catch (error: any) {
        // It's common for this to fail if the file doesn't exist (e.g., already deleted).
        // We can safely ignore these "object-not-found" errors.
        if (error.code !== 'storage/object-not-found') {
            console.error("Failed to delete attachment from storage:", error);
            // Optionally re-throw or handle the error if it's not a 'not found' error.
        }
    }
};

const deleteAttachments = async (attachments: Attachment[]) => {
    if (!attachments || attachments.length === 0) return;
    await Promise.all(attachments.map(att => deleteAttachment(att)));
};


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
  const [contactTags, setContactTags] = useState<ContactTag[]>([]);
  const [messageTemplates, setMessageTemplates] = useState<MessageTemplate[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [sentNotifications, setSentNotifications] = useState<Notification[]>([]);
  const [dynamicLists, setDynamicLists] = useState<DynamicList[]>([]);
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>([]);
  
  const [deletedContacts, setDeletedContacts] = useState<Contact[]>([]);
  const [deletedDeals, setDeletedDeals] = useState<Deal[]>([]);
  const [deletedTasks, setDeletedTasks] = useState<Task[]>([]);

  const [isGoogleDriveConnected, setIsGoogleDriveConnected] = useState(false);
  const [googleApiReady, setGoogleApiReady] = useState(false);

  // --- ONE-TIME MIGRATION ---
  const initializeDefaultPipelineStages = async () => {
    const pipelineRef = db.collection('pipelineStages');
    const snapshot = await pipelineRef.get();
    
    if (snapshot.empty) {
        console.log("No pipeline stages found. Initializing default pipeline...");
        const defaultStages = [
            'Nuevos', 'Contactados', 'En revisión', 'Aprobado', 'Compra de material', 
            'En camino', 'Producción', 'Taller externo', 'Listo en local', 
            'Espera de pago', 'Listo para entrega', 'Ganado', 'Perdido'
        ];
        const batch = db.batch();
        defaultStages.forEach((name, index) => {
            const docRef = pipelineRef.doc(); // Auto-generate ID
            batch.set(docRef, { name, sortIndex: (index + 1) * 1000 });
        });
        await batch.commit();
        console.log("Default pipeline initialized.");
    }
  };


  useEffect(() => {
      if ((window as any).gapi) {
          (window as any).gapi.load('picker', () => setGoogleApiReady(true));
      }
      initializeDefaultPipelineStages();
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
        setLoading(false);
        setContacts([]);
        setDeals([]);
        setTasks([]);
        setNotes([]);
        setContactNotes([]);
        setTags([]);
        setContactTags([]);
        setMessageTemplates([]);
        setQuotes([]);
        setNotifications([]);
        setSentNotifications([]);
        setDynamicLists([]);
        setPipelineStages([]);
        setDeletedContacts([]);
        setDeletedDeals([]);
        setDeletedTasks([]);
        return;
    };
    
    let unsubscribers: (() => void)[] = [];

    const loadAndListen = async () => {
        setLoading(true);

        // --- ONE-TIME DATA MIGRATION ---
        const stagesSnapshot = await db.collection('pipelineStages').get();
        if (!stagesSnapshot.empty) {
            const stageNameMap = new Map(stagesSnapshot.docs.map(doc => [doc.data().name, doc.id]));
            const dealsSnapshot = await db.collection('deals').get();
            const dealsToMigrate = dealsSnapshot.docs.filter(doc => (doc.data() as any).stage && !doc.data().stageId);
            
            if (dealsToMigrate.length > 0) {
                console.log(`Migrating ${dealsToMigrate.length} deals to use stage IDs.`);
                const batch = db.batch();
                dealsToMigrate.forEach(doc => {
                    const dealData = doc.data() as any;
                    const stageId = stageNameMap.get(dealData.stage);
                    if (stageId) {
                        batch.update(doc.ref, {
                            stageId: stageId,
                            stage: firebase.firestore.FieldValue.delete()
                        });
                    }
                });
                await batch.commit();
                console.log("Deal migration finished.");
            }
        }
        // --- END MIGRATION ---

        const purgeExpiredItems = async () => { /* ... */ };
        purgeExpiredItems();

        unsubscribers = [
          db.collection('contacts').where("deletedAt", "==", null).onSnapshot(snapshot => setContacts(snapshot.docs.map(doc => mapDocToData<Contact>(doc)))),
          db.collection('deals').where("deletedAt", "==", null).onSnapshot(snapshot => setDeals(snapshot.docs.map(doc => mapDocToData<Deal>(doc)))),
          db.collection('tasks').where("deletedAt", "==", null).onSnapshot(snapshot => setTasks(snapshot.docs.map(doc => mapDocToData<Task>(doc)))),
          db.collection('notes').onSnapshot(snapshot => setNotes(snapshot.docs.map(doc => mapDocToData<Note>(doc)))),
          db.collection('contactNotes').onSnapshot(snapshot => setContactNotes(snapshot.docs.map(doc => mapDocToData<ContactNote>(doc)))),
          db.collection('users').orderBy('sortIndex').onSnapshot(snapshot => {
            const firestoreUsers = snapshot.docs.map(doc => mapDocToData<User>(doc));
            const combinedUsers = [permanentUser, ...firestoreUsers.filter(u => u.id !== permanentUser.id)];
            setUsers(combinedUsers);
          }),
          db.collection('tags').orderBy('sortIndex').onSnapshot(snapshot => setTags(snapshot.docs.map(doc => mapDocToData<Tag>(doc)))),
          db.collection('contactTags').orderBy('sortIndex').onSnapshot(snapshot => setContactTags(snapshot.docs.map(doc => mapDocToData<ContactTag>(doc)))),
          db.collection('messageTemplates').orderBy('sortIndex').onSnapshot(snapshot => setMessageTemplates(snapshot.docs.map(doc => mapDocToData<MessageTemplate>(doc)))),
          db.collection('quotes').onSnapshot(snapshot => setQuotes(snapshot.docs.map(doc => mapDocToData<Quote>(doc)))),
          db.collection('notifications').where('userId', '==', currentUser.id).orderBy('createdAt', 'desc').onSnapshot(snapshot => setNotifications(snapshot.docs.map(doc => mapDocToData<Notification>(doc)))),
          db.collection('notifications').where('createdBy.id', '==', currentUser.id).orderBy('createdAt', 'desc').onSnapshot(snapshot => setSentNotifications(snapshot.docs.map(doc => mapDocToData<Notification>(doc)))),
          db.collection('contacts').where("deletedAt", "!=", null).onSnapshot(snapshot => setDeletedContacts(snapshot.docs.map(doc => mapDocToData<Contact>(doc)))),
          db.collection('deals').where("deletedAt", "!=", null).onSnapshot(snapshot => setDeletedDeals(snapshot.docs.map(doc => mapDocToData<Deal>(doc)))),
          db.collection('tasks').where("deletedAt", "!=", null).onSnapshot(snapshot => setDeletedTasks(snapshot.docs.map(doc => mapDocToData<Task>(doc)))),
          db.collection('dynamicLists').orderBy('name').onSnapshot(snapshot => setDynamicLists(snapshot.docs.map(doc => mapDocToData<DynamicList>(doc)))),
          db.collection('pipelineStages').orderBy('sortIndex').onSnapshot(snapshot => setPipelineStages(snapshot.docs.map(doc => mapDocToData<PipelineStage>(doc)))),
        ];
        setLoading(false);
    };

    loadAndListen();
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

  const resolveTagConflict = (tagIds: string[]): string[] => {
    const leadTag = contactTags.find(t => t.name.toLowerCase() === 'lead');
    const clienteTag = contactTags.find(t => t.name.toLowerCase() === 'cliente');
    
    if (!leadTag || !clienteTag) return tagIds;

    const hasLead = tagIds.includes(leadTag.id);
    const hasCliente = tagIds.includes(clienteTag.id);

    if (hasLead && hasCliente) {
        return tagIds.filter(id => id !== leadTag.id);
    }
    return tagIds;
  };

  const evaluateContactAgainstList = (contact: Contact, list: DynamicList): boolean => {
      return list.rules.every(rule => {
          const contactValue = contact[rule.field];
          const ruleValue = rule.value;

          if (rule.field === 'contactTagIds') {
              const tags = contact.contactTagIds || [];
              if (rule.operator === 'has_tag') return tags.includes(ruleValue);
              if (rule.operator === 'not_has_tag') return !tags.includes(ruleValue);
          } else if (typeof contactValue === 'string') {
              const cVal = contactValue.toLowerCase();
              const rVal = ruleValue.toLowerCase();
              if (rule.operator === 'contains') return cVal.includes(rVal);
              if (rule.operator === 'not_contains') return !cVal.includes(rVal);
              if (rule.operator === 'is') return cVal === rVal;
              if (rule.operator === 'is_not') return cVal !== rVal;
          }
          return false;
      });
  };
  
  const evaluateContactAgainstAllLists = async (contact: Contact) => {
      if (dynamicLists.length === 0 && !contact.contactTagIds) return;

      const dynamicallyAssignedTags = new Set<string>();
      dynamicLists.forEach(list => {
          if (evaluateContactAgainstList(contact, list)) {
              list.assignedTagIds.forEach(tagId => dynamicallyAssignedTags.add(tagId));
          }
      });

      const allPossibleDynamicTags = new Set<string>(dynamicLists.flatMap(l => l.assignedTagIds));
      const currentTags = new Set(contact.contactTagIds || []);
      const manualTags = new Set([...currentTags].filter(tagId => !allPossibleDynamicTags.has(tagId)));
      
      const newTagSet = new Set([...manualTags, ...dynamicallyAssignedTags]);
      const finalTagIds = resolveTagConflict(Array.from(newTagSet));
      
      const arraysAreEqual = currentTags.size === finalTagIds.length && [...currentTags].every(id => finalTagIds.includes(id));

      if (!arraysAreEqual) {
          await update("contacts", contact.id, { contactTagIds: finalTagIds });
      }
  };
  
  const reEvaluateAllContactsForLists = async (lists: DynamicList[]) => {
      let batch = db.batch();
      let writeCount = 0;

      for (const contact of contacts) {
          const dynamicallyAssignedTags = new Set<string>();
          lists.forEach(list => {
              if (evaluateContactAgainstList(contact, list)) {
                  list.assignedTagIds.forEach(tagId => dynamicallyAssignedTags.add(tagId));
              }
          });

          const allPossibleDynamicTags = new Set<string>(lists.flatMap(l => l.assignedTagIds));
          const currentTags = new Set(contact.contactTagIds || []);
          const manualTags = new Set([...currentTags].filter(tagId => !allPossibleDynamicTags.has(tagId)));
          const newTagSet = new Set([...manualTags, ...dynamicallyAssignedTags]);
          const finalTagIds = resolveTagConflict(Array.from(newTagSet));
          
          const arraysAreEqual = currentTags.size === finalTagIds.length && [...currentTags].every(id => finalTagIds.includes(id));
          
          if (!arraysAreEqual) {
              const contactRef = db.collection("contacts").doc(contact.id);
              batch.update(contactRef, { contactTagIds: finalTagIds });
              writeCount++;
              if (writeCount >= 499) { // Firestore batch limit is 500
                  await batch.commit();
                  batch = db.batch();
                  writeCount = 0;
              }
          }
      }
      if (writeCount > 0) {
          await batch.commit();
      }
  };
  
  const batchSoftDelete = async (ids: string[], collectionName: string) => {
    const batch = db.batch();
    ids.forEach(id => { const docRef = db.collection(collectionName).doc(id); batch.update(docRef, { deletedAt: new Date().toISOString() }); });
    await batch.commit();
  }

  const addContact = async (contact: Omit<Contact, 'id' | 'createdAt'>) => {
    const leadTag = contactTags.find(t => t.name.toLowerCase() === 'lead');
    let initialTagIds = contact.contactTagIds || [];
    if (leadTag && !initialTagIds.includes(leadTag.id)) {
        initialTagIds.push(leadTag.id);
    }
    initialTagIds = resolveTagConflict(initialTagIds);

    const newContactRef = await add("contacts", {...contact, contactTagIds: initialTagIds, createdAt: new Date().toISOString(), deletedAt: null});
    const newContactSnap = await newContactRef.get();
    const newContact = mapDocToData<Contact>(newContactSnap);
    await evaluateContactAgainstAllLists(newContact);
    return newContact;
  };

  const bulkAddContacts = async (contactsData: Omit<Contact, 'id' | 'createdAt'>[]) => {
    const batch = db.batch();
    const newContactPromises: Promise<Contact>[] = [];
    const leadTag = contactTags.find(t => t.name.toLowerCase() === 'lead');

    contactsData.forEach(contact => {
        const newContactRef = db.collection('contacts').doc();
        let initialTagIds = contact.contactTagIds || [];
        if (leadTag && !initialTagIds.includes(leadTag.id)) {
            initialTagIds.push(leadTag.id);
        }
        initialTagIds = resolveTagConflict(initialTagIds);
        const contactData = { ...contact, contactTagIds: initialTagIds, createdAt: new Date().toISOString(), deletedAt: null };
        batch.set(newContactRef, contactData);
        newContactPromises.push(newContactRef.get().then(snap => mapDocToData<Contact>(snap)));
    });
    await batch.commit();
    const newContacts = await Promise.all(newContactPromises);
    await Promise.all(newContacts.map(c => evaluateContactAgainstAllLists(c)));
  };

  const updateContact = async (contact: Contact) => {
    const finalTagIds = resolveTagConflict(contact.contactTagIds || []);
    const finalContact = { ...contact, contactTagIds: finalTagIds };
    await update("contacts", finalContact.id, finalContact);
    await evaluateContactAgainstAllLists(finalContact);
  };

  const bulkDeleteContacts = (ids: string[]) => batchSoftDelete(ids, 'contacts');

  const bulkUpdateContacts = async (ids: string[], updates: BulkContactUpdatePayload) => {
    if (ids.length === 0) return;

    const contactsToUpdate = contacts.filter(c => ids.includes(c.id));
    if (contactsToUpdate.length === 0) return;
    
    const batch = db.batch();
    const updatedContactsForEval: Contact[] = [];
    
    contactsToUpdate.forEach(contact => {
        const contactRef = db.collection('contacts').doc(contact.id);
        const currentTags = new Set(contact.contactTagIds || []);
        updates.addTagIds.forEach(tagId => currentTags.add(tagId));
        updates.removeTagIds.forEach(tagId => currentTags.delete(tagId));
        
        const finalTagIds = resolveTagConflict(Array.from(currentTags));
        batch.update(contactRef, { contactTagIds: finalTagIds });
        updatedContactsForEval.push({ ...contact, contactTagIds: finalTagIds });
    });
    await batch.commit();

    await Promise.all(updatedContactsForEval.map(c => evaluateContactAgainstAllLists(c)));
  };

  const mergeContacts = async (masterContactId: string, mergedContactData: Partial<Contact>, otherContactIds: string[]) => {
    const batch = db.batch();
    const allContactIds = [masterContactId, ...otherContactIds];

    // 1. Aggregate tags from all contacts being merged
    const contactsToMergeDocs = await Promise.all(allContactIds.map(id => db.collection('contacts').doc(id).get()));
    const allTags = new Set<string>();
    contactsToMergeDocs.forEach(doc => {
        if(doc.exists) {
            const contact = mapDocToData<Contact>(doc);
            contact.contactTagIds?.forEach(tagId => allTags.add(tagId));
        }
    });
    let finalTagIds = resolveTagConflict(Array.from(allTags));

    // 2. Update master contact
    const masterRef = db.collection('contacts').doc(masterContactId);
    const { id, ...updateData } = mergedContactData as Contact;
    batch.update(masterRef, { ...updateData, contactTagIds: finalTagIds });

    // 3. Re-associate deals
    const dealsToUpdate = deals.filter(deal => deal.contactIds.some(cid => otherContactIds.includes(cid)));
    dealsToUpdate.forEach(deal => {
        const newContactIds = Array.from(new Set(deal.contactIds.filter(cid => !otherContactIds.includes(cid)).concat(masterContactId)));
        batch.update(db.collection('deals').doc(deal.id), { contactIds: newContactIds });
    });

    // 4. Re-associate contact notes
    const notesToUpdate = contactNotes.filter(note => otherContactIds.includes(note.contactId));
    notesToUpdate.forEach(note => {
        batch.update(db.collection('contactNotes').doc(note.id), { contactId: masterContactId });
    });

    // 5. Delete duplicate contacts
    otherContactIds.forEach(id => {
        batch.delete(db.collection('contacts').doc(id));
    });
    
    await batch.commit();
    
    const masterContactSnap = await db.collection('contacts').doc(masterContactId).get();
    if(masterContactSnap.exists) {
        await evaluateContactAgainstAllLists(mapDocToData<Contact>(masterContactSnap));
    }
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
    
    const originalStageId = deal.stageId;
    const newStageId = updates.stageId || deal.stageId;
    const originalStage = pipelineStages.find(s => s.id === originalStageId);
    const newStage = pipelineStages.find(s => s.id === newStageId);
    
    const finalTagIds = new Set('tagIds' in updates ? (updates.tagIds || []) : (deal.tagIds || []));

    // --- AUTOMATION TRIGGERS ---
    
    const today = new Date().toISOString().split('T')[0];
    
    // --- STAGE-BASED AUTOMATIONS ---
    if (newStage && originalStage?.name !== newStage.name) {
        if (newStage.name === 'Compra de material' && deal.assignedUserId) {
            await addTask({ title: "Comprar material", dealId: deal.id, responsibleUserId: deal.assignedUserId, dueDate: today });
        }
        if (newStage.name === 'Producción') {
            const recibidoTag = tags.find(t => t.name.toLowerCase() === 'recibido');
            if (recibidoTag) finalTagIds.add(recibidoTag.id);
        }
        if (newStage.name === 'Ganado') {
            const raul = users.find(u => u.name === 'Raúl Colosio');
            if (raul) {
                const reviewDate = addWorkingDays(new Date(), 2);
                await addTask({ title: "Enviar el Google review", dealId: deal.id, responsibleUserId: raul.id, dueDate: reviewDate.toISOString().split('T')[0] });
            }
            const contactId = deal.contactIds[0];
            if (contactId) {
                const contactRef = db.collection('contacts').doc(contactId);
                await db.runTransaction(async (transaction) => {
                    const contactDoc = await transaction.get(contactRef);
                    if (!contactDoc.exists) return;
                    
                    const contactData = mapDocToData<Contact>(contactDoc);
                    let currentTags = contactData.contactTagIds || [];
                    const leadTag = contactTags.find(t => t.name.toLowerCase() === 'lead');
                    const clienteTag = contactTags.find(t => t.name.toLowerCase() === 'cliente');
                    
                    if (leadTag) currentTags = currentTags.filter(id => id !== leadTag.id);
                    if (clienteTag && !currentTags.includes(clienteTag.id)) currentTags.push(clienteTag.id);

                    transaction.update(contactRef, { contactTagIds: currentTags });
                });
            }
        }
    }
    
    // --- TAG-BASED AUTOMATIONS ---
    const addedTagIds = [...finalTagIds].filter(id => !(deal.tagIds || []).includes(id));
    if (addedTagIds.length > 0) {
        const raul = users.find(u => u.name === 'Raúl Colosio');
        const produccionUser = users.find(u => u.email === 'produccion.promotienda@gmail.com');
        const impresionUser = users.find(u => u.email === 'impresion@promotienda.mx');
        const addedTagsInfo = tags.filter(t => addedTagIds.includes(t.id));

        for (const addedTag of addedTagsInfo) {
            if (addedTag.name.toLowerCase() === 'serigrafía') {
                if (raul) await addTask({ title: 'Preparar positivo', dealId: deal.id, responsibleUserId: raul.id, dueDate: today });
                if (impresionUser) await addTask({ title: 'Impresión de serigrafía', dealId: deal.id, responsibleUserId: impresionUser.id, dueDate: today });
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
    if (newStage?.name === 'Producción') {
        const recibidoTag = tags.find(t => t.name.toLowerCase() === 'recibido');
        if (recibidoTag && finalTagIds.has(recibidoTag.id) && finalTagIds.size > 1) {
            finalTagIds.delete(recibidoTag.id);
        }
    }

    if (newStage?.name !== 'Producción' && originalStage?.name === 'Producción') {
        updates.tagIds = [];
    } else {
        updates.tagIds = Array.from(finalTagIds);
    }

    if (newStage?.name === 'Producción' && updates.tagIds.length === 0) {
        showAlert("Action Required", "To keep this deal in Production, it must have at least one tag. Add another tag before removing this one.");
        return; // Abort update
    }

    await update("deals", dealId, updates);
  };

   const reorderDeal = async (draggedId: string, targetId: string) => {
    const draggedDeal = deals.find(d => d.id === draggedId);
    const targetDeal = deals.find(d => d.id === targetId);
    if (!draggedDeal || !targetDeal || draggedId === targetId) return;
    const stageDeals = deals.filter(d => d.stageId === targetDeal.stageId).sort((a, b) => a.sortIndex - b.sortIndex);
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
    await update("deals", draggedId, { sortIndex: newSortIndex, stageId: targetDeal.stageId });
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
  const deleteTasks = (ids: string[]) => batchSoftDelete(ids, 'tasks');
  const completeTasks = async (ids: string[]) => {
      const batch = db.batch();
      ids.forEach(id => { const docRef = db.collection("tasks").doc(id); batch.update(docRef, { completed: true }); });
      await batch.commit();
  };

  const deleteNoteAndAssociatedData = async (noteId: string, noteCollection: 'notes' | 'contactNotes') => {
    const noteRef = db.collection(noteCollection).doc(noteId);
    const noteDoc = await noteRef.get();
    if (!noteDoc.exists) return;
    const noteData = mapDocToData<Note | ContactNote>(noteDoc);

    const batch = db.batch();
    // 1. Delete associated attachments from Storage
    if (noteData.attachments) {
        await deleteAttachments(noteData.attachments);
    }
    // 2. Delete the note itself
    batch.delete(noteRef);
    // 3. Find and delete associated notifications
    const notifsQuery = await db.collection('notifications').where('sourceNoteId', '==', noteId).get();
    notifsQuery.docs.forEach(doc => {
        batch.delete(doc.ref);
    });
    await batch.commit();
  };

  const addNote = async (note: Omit<Note, 'id' | 'createdAt' | 'attachments'>, files: File[]) => {
    const uploadedAttachments = await Promise.all(files.map(file => uploadAttachment(file, note.dealId)));
    const newNoteRef = await add("notes", {...note, attachments: uploadedAttachments, createdAt: new Date().toISOString()});
    if (currentUser) {
      await syncNotificationsForNote(note.content, `/deals/${note.dealId}`, newNoteRef.id, currentUser);
    }
  };
  const updateNote = async (note: Omit<Note, 'attachments'>, newFiles: File[], removedAttachments: Attachment[]) => {
    await deleteAttachments(removedAttachments);
    const newUploadedAttachments = await Promise.all(newFiles.map(file => uploadAttachment(file, note.dealId)));
    
    const originalNote = notes.find(n => n.id === note.id);
    const originalAttachments = originalNote?.attachments || [];
    const finalAttachments = [...originalAttachments.filter(att => !removedAttachments.some(rem => rem.id === att.id)), ...newUploadedAttachments];

    await update("notes", note.id, {...note, attachments: finalAttachments});
    if (currentUser) {
      await syncNotificationsForNote(note.content, `/deals/${note.dealId}`, note.id, currentUser);
    }
  };
  const deleteNote = (noteId: string) => deleteNoteAndAssociatedData(noteId, 'notes');

  const addContactNote = async (note: Omit<ContactNote, 'id' | 'createdAt' | 'attachments'>, files: File[]) => {
    const uploadedAttachments = await Promise.all(files.map(file => uploadAttachment(file, note.contactId)));
    const newNoteRef = await add("contactNotes", {...note, attachments: uploadedAttachments, createdAt: new Date().toISOString()});
    if (currentUser) {
      await syncNotificationsForNote(note.content, `/contacts?contactId=${note.contactId}`, newNoteRef.id, currentUser);
    }
  };
  const updateContactNote = async (note: Omit<ContactNote, 'attachments'>, newFiles: File[], removedAttachments: Attachment[]) => {
    await deleteAttachments(removedAttachments);
    const newUploadedAttachments = await Promise.all(newFiles.map(file => uploadAttachment(file, note.contactId)));
    
    const originalNote = contactNotes.find(n => n.id === note.id);
    const originalAttachments = originalNote?.attachments || [];
    const finalAttachments = [...originalAttachments.filter(att => !removedAttachments.some(rem => rem.id === att.id)), ...newUploadedAttachments];
    
    await update("contactNotes", note.id, {...note, attachments: finalAttachments});
    if (currentUser) {
      await syncNotificationsForNote(note.content, `/contacts?contactId=${note.contactId}`, note.id, currentUser);
    }
  };
  const deleteContactNote = (noteId: string) => deleteNoteAndAssociatedData(noteId, 'contactNotes');


  const addUser = async (user: Omit<User, 'id' | 'sortIndex'>) => { 
      const highestSortIndex = users.reduce((max, u) => Math.max(max, u.sortIndex || 0), 0);
      await add("users", { ...user, sortIndex: highestSortIndex + 1000 }); 
  };
  const updateUser = async (user: User) => await update("users", user.id, user);
  const reorderUser = (draggedId: string, targetId: string) => reorderItems(draggedId, targetId, users, 'users');
  const deleteUser = async (id: string) => await remove("users", id);
  const addTag = async (tag: Omit<Tag, 'id' | 'sortIndex'>) => {
    const highestSortIndex = tags.reduce((max, t) => Math.max(max, t.sortIndex || 0), 0);
    const newTagRef = await add("tags", { ...tag, sortIndex: highestSortIndex + 1000 });
    const newTagSnap = await newTagRef.get();
    return mapDocToData<Tag>(newTagSnap);
  };
  const updateTag = async (tag: Tag) => await update("tags", tag.id, tag);
  const reorderTag = (draggedId: string, targetId: string) => reorderItems(draggedId, targetId, tags, 'tags');
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
  const addContactTag = async (tag: Omit<ContactTag, 'id' | 'sortIndex'>) => {
    const highestSortIndex = contactTags.reduce((max, t) => Math.max(max, t.sortIndex || 0), 0);
    const newTagRef = await add("contactTags", { ...tag, sortIndex: highestSortIndex + 1000 });
    const newTagSnap = await newTagRef.get();
    return mapDocToData<ContactTag>(newTagSnap);
  };
  const updateContactTag = async (tag: ContactTag) => await update("contactTags", tag.id, tag);
  const reorderContactTag = (draggedId: string, targetId: string) => reorderItems(draggedId, targetId, contactTags, 'contactTags');
  const deleteContactTag = async (tagId: string) => {
    await remove("contactTags", tagId);
    const batch = db.batch();
    contacts.forEach(contact => {
        if(contact.contactTagIds?.includes(tagId)){
            const newTagIds = contact.contactTagIds.filter(id => id !== tagId);
            batch.update(db.collection("contacts").doc(contact.id), {contactTagIds: newTagIds});
        }
    });
    await batch.commit();
  };
  const addMessageTemplate = async (template: Omit<MessageTemplate, 'id' | 'sortIndex'>) => { 
      const highestSortIndex = messageTemplates.reduce((max, t) => Math.max(max, t.sortIndex || 0), 0);
      await add("messageTemplates", { ...template, sortIndex: highestSortIndex + 1000 });
  };
  const updateMessageTemplate = async (template: MessageTemplate) => await update("messageTemplates", template.id, template);
  const reorderMessageTemplate = (draggedId: string, targetId: string) => reorderItems(draggedId, targetId, messageTemplates, 'messageTemplates');
  const deleteMessageTemplate = async (id: string) => await remove("messageTemplates", id);
  
  const updatePipelineStage = async (stage: PipelineStage) => await update("pipelineStages", stage.id, stage);
  const reorderPipelineStage = (draggedId: string, targetId: string) => reorderItems(draggedId, targetId, pipelineStages, 'pipelineStages');

  const addQuote = async (quote: Omit<Quote, 'id' | 'createdAt'>) => { await add("quotes", {...quote, createdAt: new Date().toISOString()}); };
  const updateQuote = async (quoteId: string, updates: Partial<Quote>) => await update("quotes", quoteId, updates);
  const deleteQuote = async (id: string) => await remove("quotes", id);
  const addDynamicList = async (list: Omit<DynamicList, 'id'>) => {
    await add("dynamicLists", list);
    await reEvaluateAllContactsForLists([...dynamicLists, { ...list, id: 'temp' }]);
  };
  const updateDynamicList = async (list: DynamicList) => {
    await update("dynamicLists", list.id, list);
    const updatedLists = dynamicLists.map(l => l.id === list.id ? list : l);
    await reEvaluateAllContactsForLists(updatedLists);
  };
  const deleteDynamicList = async (id: string) => {
    await remove("dynamicLists", id);
    const updatedLists = dynamicLists.filter(l => l.id !== id);
    await reEvaluateAllContactsForLists(updatedLists);
  };

  const contextValue: CrmContextType = {
    currentUser, loading, login, logout,
    contacts, deals, tasks, notes, contactNotes, users, tags, contactTags, messageTemplates, quotes, notifications, sentNotifications, dynamicLists, pipelineStages,
    getContactById: (id) => contacts.find(c => c.id === id) || deletedContacts.find(c => c.id === id),
    getDealById: (id) => deals.find(d => d.id === id) || deletedDeals.find(d => d.id === id),
    getStageById: (id) => pipelineStages.find(s => s.id === id),
    getTasksForDeal: (dealId) => tasks.filter(t => t.dealId === dealId).sort((a,b) => (a.completed ? 1 : -1) - (b.completed ? 1 : -1) || a.id.localeCompare(b.id)),
    getAllPendingTasks: () => tasks.filter(t => !t.completed).sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || '') || a.id.localeCompare(b.id)),
    getNotesForDeal: (dealId) => notes.filter(n => n.dealId === dealId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    getNotesForContact: (contactId) => contactNotes.filter(n => n.contactId === contactId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    getUsers: () => users,
    getUserById: (id) => users.find(u => u.id === id),
    getTags: () => tags,
    getTagById: (id) => tags.find(t => t.id === id),
    getQuotesForDeal: (dealId) => quotes.filter(q => q.dealId === dealId).sort((a, b) => (b.createdAt && a.createdAt) ? (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) : b.id.localeCompare(a.id)),
    addContact, bulkAddContacts, updateContact, bulkDeleteContacts, bulkUpdateContacts, mergeContacts, addDeal, updateDeal, reorderDeal, addTask, updateTask, completeTasks, addNote, updateNote, deleteNote, addContactNote, updateContactNote, deleteContactNote, addUser, updateUser, deleteUser, reorderUser, addTag, updateTag, deleteTag, reorderTag, addContactTag, updateContactTag, deleteContactTag, reorderContactTag, addMessageTemplate, updateMessageTemplate, deleteMessageTemplate, reorderMessageTemplate, updatePipelineStage, reorderPipelineStage, addQuote, updateQuote, deleteQuote, markNotificationsAsRead, markNotificationsAsUnread, deleteNotifications, addDynamicList, updateDynamicList, deleteDynamicList,
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
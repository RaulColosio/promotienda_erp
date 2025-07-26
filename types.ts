export interface PipelineStage {
  id: string;
  name: string;
  sortIndex: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  authUid?: string;
  sortIndex: number;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  sortIndex: number;
}

export interface ContactTag {
  id: string;
  name: string;
  color: string;
  sortIndex: number;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  email2?: string;
  phone: string;
  company: string;
  createdAt: string;
  deletedAt?: string;
  googleDriveFolderUrl?: string;
  contactTagIds?: string[];
}

export type DeliveryMethod = 'pickup' | 'shipping';

export interface Deal {
  id:string;
  title: string;
  stageId: string;
  contactIds: string[];
  tagIds: string[];
  createdAt: string;
  deliveryDate?: string;
  assignedUserId?: string;
  deletedAt?: string;
  sortIndex: number;
  googleDriveFolderUrl?: string;
  deliveryMethod?: DeliveryMethod;
  trackingUrl?: string;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
  dealId?: string;
  responsibleUserId?: string;
  deletedAt?: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string; // Public URL for downloading/viewing
  storagePath: string; // Path in Firebase Storage for management
}

export interface Note {
    id: string;
    dealId: string;
    content: string;
    createdAt: string;
    attachments?: Attachment[];
    likes?: string[];
}

export interface ContactNote {
    id: string;
    contactId: string;
    content: string;
    createdAt: string;
    attachments?: Attachment[];
    likes?: string[];
}

export interface MessageTemplate {
  id: string;
  title: string;
  body: string;
  sortIndex: number;
}

export interface Quote {
  id: string;
  dealId: string;
  title?: string;
  pdfName?: string;
  pdfData?: string; // Base64 data URL
  zohoUrl?: string;
  createdAt: string;
  deliveryMethods?: ('whatsapp' | 'email')[];
}

export interface Notification {
  id: string;
  userId: string; // The user who receives the notification
  message: string;
  link: string; // e.g., /deals/dealId123
  isRead: boolean;
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
  };
  sourceNoteId?: string;
}

export interface FilterRule {
  field: 'firstName' | 'lastName' | 'email' | 'company' | 'contactTagIds';
  operator: 'contains' | 'not_contains' | 'is' | 'is_not' | 'has_tag' | 'not_has_tag';
  value: string; // for has_tag/not_has_tag, this will be a tag ID
}

export interface DynamicList {
  id: string;
  name: string;
  assignedTagIds: string[];
  rules: FilterRule[];
}

export interface BulkContactUpdatePayload {
  addTagIds: string[];
  removeTagIds: string[];
}
export enum DealStage {
  NEW = 'Nuevos',
  CONTACTED = 'Contactados',
  REVIEW = 'En revisión',
  APPROVED = 'Aprobado',
  MATERIAL_PURCHASE = 'Compra de material',
  IN_TRANSIT = 'En camino',
  PRODUCTION = 'Producción',
  EXTERNAL_WORKSHOP = 'Taller externo',
  READY_LOCAL = 'Listo en local',
  AWAITING_PAYMENT = 'Espera de pago',
  READY_FOR_DELIVERY = 'Listo para entrega',
  WON = 'Ganado',
  LOST = 'Perdido',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  authUid?: string;
}

export interface Tag {
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
  zipCode: string;
  createdAt: string;
  deletedAt?: string;
  googleDriveFolderUrl?: string;
}

export type DeliveryMethod = 'pickup' | 'shipping';

export interface Deal {
  id:string;
  title: string;
  stage: DealStage;
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
  data: string; // Base64 encoded content
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
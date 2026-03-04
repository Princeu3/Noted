export interface Workspace {
  id: number;
  publicId: string;
  name: string;
  orgId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Page {
  id: number;
  publicId: string;
  workspaceId: number;
  parentId: number | null;
  title: string;
  icon: string | null;
  position: number;
  isArchived: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tag {
  id: number;
  publicId: string;
  workspaceId: number;
  name: string;
  color: string;
}

export interface FileRecord {
  id: number;
  publicId: string;
  pageId: number;
  name: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
  thumbnailPath: string | null;
  uploadedBy: string;
  createdAt: Date;
}

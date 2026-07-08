export interface User {
  id: string;
  name: string;
  email: string;
  role: 'STUDENT' | 'PARENT' | 'FACULTY' | 'ADMIN';
}

export type ResourceType = 'NOTES' | 'PRACTICE_PAPERS' | 'REFERENCE_BOOKS' | 'VIDEOS';

export interface Resource {
  id: string;
  title: string;
  description: string | null;
  fileUrl: string;
  type: ResourceType;
  uploadedById: string;
  uploadedBy?: { id: string; name: string };
  tracks?: { track: { id: string; name: string } }[];
  batches?: { batch: { id: string; subject: { name: string } } }[];
  createdAt: string;
  updatedAt: string;
}

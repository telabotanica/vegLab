import { OccurrenceModel } from './occurrence.model';

export interface PhotoModel {
  id: number;
  userId: string;
  userEmail: string;
  userPseudo?: string;
  originalName: string;
  dateShot?: Date;
  latitude?: number;
  longitude?: number;
  dateCreated: Date;
  dateUpdated?: Date;
  dateLinkedToOccurrence?: Date;
  contentUrl: string;
  size: number;
  mimeType: string;
  url: string;
  photoTagRelations?: any;
  occurrence?: OccurrenceModel;
}

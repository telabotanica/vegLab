import { RepositoryItemModel } from 'tb-tsb-lib';

export interface TableRelatedSyntaxon {
  isDiagnosis: boolean;
  validation: RepositoryItemModel;
  pdf?: {
    file: File,
    formData: FormData,
    uploadStatus: 'staging' | 'uploading' | 'uploaded'
  };
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';

import { PdfFileJsonLd, PdfFile } from '../_models/pdf-file.model';

@Injectable({
  providedIn: 'root'
})
export class PdfFileService {

  constructor(private http: HttpClient) { }

  createPdfFile(formDataFile: FormData): Observable<PdfFileJsonLd> {
    return this.http.post<PdfFileJsonLd>('http://localhost:8000/api/pdf_files', formDataFile);
  }

  removePdfFile(pdfFileId: number): Observable<PdfFile> {
    console.log('PDF FILE SERVICE, REMOVE PDF...');
    return this.http.delete<PdfFile>(`http://localhost:8000/api/pdf_files/${pdfFileId}`);
  }
}

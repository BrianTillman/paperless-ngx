import { HttpClient, HttpErrorResponse } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Observable, throwError } from 'rxjs'
import { catchError } from 'rxjs/operators'
import { environment } from 'src/environments/environment'
import {
  SplitMergeMetadata,
  SplitMergeRequest,
} from '../data/split-merge-request'
import { Document, DocumentPart } from '../data/document'

@Injectable({
  providedIn: 'root',
})
export class SplitMergeService {
  // this also needs to incorporate pages, if we want to support that.
  private documents: DocumentPart[] = []

  constructor(private http: HttpClient) {}

  addDocument(document: Document, atIndex?: number) {
    if (atIndex !== undefined) this.documents.splice(atIndex, 0, document)
    else this.documents.push(document)
  }

  addDocuments(documents: Document[]) {
    this.documents = this.documents.concat(documents)
  }

  removeDocument(document: Document, atIndex?: number) {
    if (!atIndex) atIndex = this.documents.indexOf(document)
    this.documents.splice(atIndex, 1)
    this.sanitizeStartEndSeparators()
  }

  getDocuments() {
    return this.documents
  }

  hasDocuments(): boolean {
    return this.documents.length > 0
  }

  clear() {
    this.documents = []
  }

  setDocumentPages(d: Document, index: number, pages: number[]) {
    ;(this.documents[index] as DocumentPart).pages =
      pages.length > 0 ? pages : null
  }

  splitDocument(
    d: Document,
    index: number,
    secondPages: number[],
    enabledPages?: number[]
  ) {
    const firstPages = []
    for (let page = 1; page < secondPages[0]; page++) {
      if (
        !enabledPages ||
        (enabledPages?.length && enabledPages.indexOf(page) !== -1)
      )
        firstPages.push(page)
    }
    ;(this.documents[index] as DocumentPart).pages = firstPages
    this.documents.splice(index + 1, 0, { is_separator: true } as DocumentPart)
    let d2 = { ...d } as DocumentPart
    d2.pages = secondPages
    this.documents.splice(index + 2, 0, d2)
  }

  sanitizeStartEndSeparators() {
    if (
      this.documents.length > 0 &&
      (this.documents[this.documents.length - 1] as DocumentPart).is_separator
    ) {
      this.documents.pop()
    } else if (
      this.documents.length > 0 &&
      (this.documents[0] as DocumentPart).is_separator
    ) {
      this.documents.shift()
    }
  }

  executeSplitMerge(
    preview: boolean,
    delete_source: boolean,
    metadata: SplitMergeMetadata
  ): Observable<string[]> {
    this.sanitizeStartEndSeparators()
    let currentDocument = []
    let split_merge_plan = [currentDocument]
    this.documents.forEach((d) => {
      if ((d as DocumentPart).is_separator) {
        currentDocument = []
        split_merge_plan.push(currentDocument)
      } else {
        currentDocument.push({
          document: d.id,
          pages: (d as DocumentPart).pages?.join(','),
        })
      }
    })

    let request: SplitMergeRequest = {
      delete_source: delete_source,
      preview: preview,
      metadata: metadata,
      split_merge_plan: split_merge_plan,
    }
    return this.http
      .post<string[]>(`${environment.apiBaseUrl}split_merge/`, request)
      .pipe(catchError(this.handleError))
  }

  handleError(error: HttpErrorResponse) {
    console.log('API split_merge result error:', error)
    return throwError(error.message)
  }

  getPreviewUrl(previewKey: string) {
    return `${environment.apiBaseUrl}split_merge/${previewKey}/`
  }
}

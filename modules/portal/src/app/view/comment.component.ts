import { CommonModule } from '@angular/common';
import { Component, inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import {QuillModule} from 'ngx-quill';
import { Comment } from '../models/model';
import {AuthService} from '../services/auth-service';
import { SiteAssetService } from '../services/site-asset-service';

class EditableComment extends Comment {
  isEditing: boolean = false;
  form: FormGroup;

  constructor(comment: Comment, fb: FormBuilder) {
    super(comment.user, comment.comment, comment.id, comment.edited);
    this.isEditing = false;
    this.form = fb.group({
      comment: [comment.comment],
      user: [comment.user],
      id: [comment.id],
      edited: [comment.edited]
    });
  }
}

@Component({
  selector: 'app-comments',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule, QuillModule
  ],
  template: `
    <div class="comments">
      <div *ngFor="let comment of editableComments; let i = index"
           [ngClass]="{'comment-container': true, 'comment-right': comment.user === currentUser, 'comment-left': comment.user !== currentUser}">
        <div class="comment-header">
          <span class="user">{{ comment.user }}</span>
          <span class="edited" *ngIf="comment.edited">(Edited)</span>
          <span class="date">{{ comment.id | date:'short' }}</span>
          <button mat-icon-button class="edit-button" (click)="editComment(i)" *ngIf="comment.user === currentUser && !comment.isEditing">
            <mat-icon>edit</mat-icon>
          </button>
        </div>
        <div *ngIf="!comment.isEditing">
          <div class="comment-text ql-editor" [innerHTML]="comment.comment"></div>
        </div>
        <div *ngIf="comment.isEditing" class="form-container">
          <form [formGroup]="comment.form" (ngSubmit)="saveComment(i)" style="display:flex; flex-direction: column; width: 100%">
            <quill-editor formControlName="comment" placeholder="Add a new comment..." style="flex: 1" [modules]="{
              toolbar: [
        [{ 'size': ['small', 'medium', 'large', 'huge'] },{ 'font': [] },{ 'color': [] }, { 'background': [] }],
        [{ 'align': [] }],
        ['bold', 'italic', 'underline'],
        ['blockquote','code-block'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'script': 'sub'}, { 'script': 'super' }],
        [{ 'indent': '-1'}, { 'indent': '+1' }]
      ]}"></quill-editor>
            <div class="comment-actions">
              @if (authService.isAdmin$ | async) {
                <button mat-icon-button type="button" (click)="deleteComment(i)">
                  <mat-icon>delete</mat-icon>
                </button>
              }
              <span style="flex: 1"></span>
              <button mat-button type="submit" class="save-button">Save</button>
              <button mat-button type="button" class="cancel-button" (click)="cancelEdit(i)">Cancel</button>
            </div>
          </form>
        </div>
      </div>

    </div>
    <!--    <div>-->
    <form [formGroup]="newCommentForm" (ngSubmit)="addComment()" class="new-comment-form">
      <quill-editor formControlName="comment" placeholder="Add a new comment..." style="flex: 1" [modules]="{
    toolbar: [
      [{ 'size': ['small', 'medium', 'large', 'huge'] },{ 'font': [] },{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['bold', 'italic', 'underline'],
      ['blockquote','code-block'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }]
    ]}"></quill-editor>
      <button mat-icon-button type="submit" [disabled]="newCommentForm.invalid">
        <mat-icon>send</mat-icon>
      </button>
    </form>
    <!--    </div>-->

  `,
  styles: [`
    :host {
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .comments {
      display: flex;
      flex-direction: column;
      flex: 1;
      overflow: auto;
      align-items: flex-start;
    }

    .comment-container {
      background-color: #f9f9f9;
      border-radius: 4px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      margin: 8px 16px;
      transition: transform 0.2s ease-in-out;
      max-width: 90%;
      min-width: 80%;
      clear: both;
    }

    .comment-left {
      float: left;
      text-align: left;
    }

    .comment-right {
      align-self: flex-end;
      /*float: right;*/
      /*text-align: right;*/
    }

    .comment-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top-left-radius: 4px;
      border-top-right-radius: 4px;
      padding: 2px 8px;
      background-color: #ed1c24;
      color: #fff;
      height: 44px;
    }

    .comment-right .comment-header {
      background-color: #000;
      color: #fff;
    }

    .user {
      font-weight: bold;
    }

    .edited {
      font-style: italic;
      font-size: 80%;
      margin-left: 8px;
    }

    .date {
      font-size: 12px;
      padding: 0 4px;
      text-align: right;
      flex: 1;
    }

    .edit-button {
      margin-left: auto;
      font-size: 12px;
      padding: 2px 8px;
    }

    .comment-text {
      font-size: 16px;
      color: #333;
      margin: 12px 4px;
    }

    .comment-actions {
      display: flex;
      justify-content: flex-end;
    }

    .form-field {
      width: 100%;
    }

    .form-container {
      padding: 8px;
      box-sizing: border-box;
    }

    .mat-input-element {
      font-size: 16px;
    }

    .save-button {
      color: white;
    }

    .cancel-button {
      color: white;
    }

    .new-comment-form {
      display: flex;
      align-items: center;
      padding: 8px;
      background-color: #fff;
      box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.1);
      z-index: 10;
    }

    .new-comment-field {
      flex: 1;
      margin-right: 8px;
    }

    .new-comment-form button {
      margin-right: 16px;
    }

    /* Quill Editor Default Styles */
    .ql-container {
      box-sizing: border-box;
      font-family: inherit;
      font-size: 14px;
      line-height: 1.42;
    }

    .ql-editor {
      box-sizing: border-box;
      line-height: 1.42;
      height: auto;
      padding: 12px;
      outline: none;
      overflow-y: auto;
    }

    .ql-editor p {
      margin: 0 0 1em;
    }

    .ql-editor a {
      color: #3498db;
      text-decoration: none;
    }

    .ql-editor a:hover {
      text-decoration: underline;
    }

    .ql-editor blockquote {
      border-left: 4px solid #ddd;
      margin: 1.5em 0;
      padding-left: 1em;
      color: #666;
    }

    .ql-editor ul, .ql-editor ol {
      padding-left: 1.5em;
    }

    .ql-editor ul li, .ql-editor ol li {
      margin-bottom: 0.5em;
    }

    .ql-editor h1 {
      font-size: 2em;
      margin-bottom: 0.5em;
      font-weight: bold;
    }

    .ql-editor h2 {
      font-size: 1.5em;
      margin-bottom: 0.5em;
      font-weight: bold;
    }

    .ql-editor h3 {
      font-size: 1.25em;
      margin-bottom: 0.5em;
      font-weight: bold;
    }

    .ql-editor pre {
      background-color: #f5f5f5;
      padding: 1em;
      white-space: pre-wrap;
      margin-bottom: 1em;
      border-radius: 4px;
    }

    .ql-editor code {
      background-color: #f5f5f5;
      padding: 0.2em 0.4em;
      border-radius: 4px;
      font-family: monospace;
    }

    .ql-editor img {
      max-width: 100%;
      margin-bottom: 1em;
      border-radius: 4px;
    }

    .ql-editor video {
      max-width: 100%;
      margin-bottom: 1em;
    }

    .ql-editor hr {
      border: none;
      border-top: 1px solid #ccc;
      margin: 2em 0;
    }

    .ql-editor .ql-align-center {
      text-align: center;
    }

    .ql-editor .ql-align-right {
      text-align: right;
    }

    .ql-editor .ql-align-justify {
      text-align: justify;
    }
  `]
})
export class CommentsComponent implements OnChanges {
  @Input({ required: true }) comments: Comment[] = [];
  @Input({ required: true }) assetId: string;
  @Input() currentUser: string;
  siteAssetService: SiteAssetService = inject(SiteAssetService);
  editableComments: EditableComment[] = [];
  newCommentForm: FormGroup;
  authService: AuthService = inject(AuthService);

  constructor(private fb: FormBuilder) {
    this.newCommentForm = this.fb.group({
      comment: ['']
    });
  }

  editComment(index: number): void {
    this.editableComments[index].isEditing = true;
  }

  saveComment(index: number): void {
    if (this.editableComments[index].form.valid) {
      this.editableComments[index].form.patchValue({ edited: true });
      this.siteAssetService.updateComment(this.assetId, this.editableComments[index].id!, this.editableComments[index].form.value).subscribe(data => {
        this.editableComments[index].comment = this.editableComments[index].form.get('comment')!.value;
        this.editableComments[index].edited = true;
        this.editableComments[index].isEditing = false;
      });
    }
  }

  cancelEdit(index: number): void {
    this.editableComments[index].isEditing = false;
  }

  addComment(): void {
    if (this.newCommentForm.valid) {
      const newComment = new Comment(this.currentUser, this.newCommentForm.value.comment, null, false);
      this.siteAssetService.addComment(this.assetId, newComment).subscribe(data => {
        this.comments.push(newComment);
        this.editableComments.push(new EditableComment(newComment, this.fb));
        this.newCommentForm.reset();
      });
    }
  }

  deleteComment(index: number): void {
    const commentId = this.editableComments[index].id;
    this.siteAssetService.deleteComment(this.assetId, this.editableComments[index].id!).subscribe(() => {
      this.comments.splice(index, 1);
      this.editableComments.splice(index, 1);
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['comments']) {
      this.editableComments = this.comments.map(comment => new EditableComment(comment, this.fb));
    }
  }
}

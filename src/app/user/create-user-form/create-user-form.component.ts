import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { VlUser } from 'src/app/_models/vl-user.model';

import { UserService } from 'src/app/_services/user.service';
import { NotificationService } from 'src/app/_services/notification.service';

import { Subscription } from 'rxjs';

@Component({
  selector: 'vl-create-user-form',
  templateUrl: './create-user-form.component.html',
  styleUrls: ['./create-user-form.component.scss']
})
export class CreateUserFormComponent implements OnInit, OnDestroy {
  @Input() redirectAfterAccountCreated = true;
  @Input() resetFormAfterAccountCreated = false;

  // VAR Form
  form: FormGroup;
  emailValueSubscr: Subscription;
  emailVerificationValueSubscr: Subscription;
  emailCtrl = new FormControl('', [Validators.required, Validators.email]);
  emailVerificationCtrl = new FormControl('', [Validators.required, Validators.email]);

  // VARS
  title = 'Créer un compte';
  creatingUser = false;
  userHasBeenCreated: VlUser = null;

  constructor(private userService: UserService,
              private notificationService: NotificationService,
              public router: Router) { }

  ngOnInit() {
    this.form = new FormGroup({
      firstName: new FormControl('', [Validators.required, Validators.pattern('[A-zÀ-ú(.)(\-)( )?]*')]),
      lastName: new FormControl('', [Validators.required, Validators.pattern('[A-zÀ-ú(.)(\-)( )?]*')]),
      username: new FormControl('', [Validators.required, Validators.pattern('[A-zÀ-ú(.)(\-)( )?]*')]),
      email: this.emailCtrl,
      emailVerification: this.emailVerificationCtrl,
      password: new FormControl('', [Validators.required, Validators.minLength(8)]),
      // passwordVerification: new FormControl('', [Validators.required, Validators.pattern('^[a-z]+')]),
      enabled: new FormControl(true, [Validators.required]),
      emailVerified: new FormControl(true, [Validators.required])
    });

    this.emailValueSubscr = this.emailCtrl.valueChanges.subscribe(value => {
      if (this.emailCtrl.value !== this.emailVerificationCtrl.value) {
        this.emailVerificationCtrl.setErrors({ emailDoesNotMatch: true });
      } else {
        this.emailVerificationCtrl.setErrors(null);
      }
    });

    this.emailVerificationValueSubscr = this.emailVerificationCtrl.valueChanges.subscribe(value => {
      if (this.emailCtrl.value !== this.emailVerificationCtrl.value) {
        this.emailVerificationCtrl.setErrors({ emailDoesNotMatch: true });
      } else {
        this.emailVerificationCtrl.setErrors(null);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.emailVerificationValueSubscr) { this.emailVerificationValueSubscr.unsubscribe(); }
    if (this.emailValueSubscr) { this.emailValueSubscr.unsubscribe(); }
  }


  createUser(ev: Event): void {
    ev.preventDefault();

    // Are fields valid ?
    if (this.form.valid) {
      this.creatingUser = true;
      const newUser: VlUser = {
        id: null,
        ssoId: '',  // must be provided, filled in backend
        enabled: this.form.controls.enabled.value,
        emailVerified: this.form.controls.emailVerified.value,
        firstName: this.form.controls.firstName.value,
        lastName: this.form.controls.lastName.value,
        username: this.form.controls.username.value,
        email: this.emailCtrl.value,
        password: this.form.controls.password.value,
      };
      console.log('CREATE USER WITH', newUser);
      this.userService.createUser(newUser).subscribe(createdUser => {
        this.creatingUser = false;

        if (this.resetFormAfterAccountCreated === true) {
          // Reset component
          this.notificationService.notify(`Le compte '${createdUser.username}' a bien été créé`);
          this.creatingUser = false;
          this.userHasBeenCreated = null;
          this.form.reset();
        } else {
          this.userHasBeenCreated = createdUser;
          this.title = 'Votre compte a été créé';

          // Redirect after X sec
          if (this.redirectAfterAccountCreated === true) {
            setTimeout(() => {
              this.router.navigate(['/login']);
            }, 5000);
          }
        }
      }, er => {
        this.creatingUser = false;
        if (er.error && er.error['hydra:description'] !== null) {
          this.notificationService.error(er.error['hydra:description']);
        } else {
          this.notificationService.error('Une erreur est survenue lors de la création de l\'utilisateur');
        }
        console.log(er);
      });
    } else {
      // Form is not valid,
      // Form Validators show what's wrong
    }
  }

  // tslint:disable-next-line:member-ordering
  static sameEmailValidator(control: FormControl): { [key: string]: boolean } | null {
    return control.parent.controls['emailVerification'].value === control.value ? null : { emailDoesNotMatch: true };
  }

}

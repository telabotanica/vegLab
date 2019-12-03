import { Component, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';

import { environment } from '../../../environments/environment';
import { SsoService } from 'src/app/_services/sso.service';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'vl-login-page',
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.scss']
})
export class LoginPageComponent implements OnInit {
  hidePassword = true;

  email = new FormControl('', [Validators.required, Validators.email]);
  password = new FormControl('', [Validators.required]);

  isLogging = false;
  errorMessage: string = null;
  private readonly unsetToken = environment.app.unsetTokenValue;

  redirectUrl: string = null;

  constructor(private ssoService: SsoService,
              private routerService: Router,
              private route: ActivatedRoute) { }

  ngOnInit() {
    this.redirectUrl = this.route.snapshot.queryParams['redirectUrl'] || '/';
  }

  getErrorMessage(): string {
    return this.email.hasError('required') ? 'Ce champ est obligatoire' :
      this.email.hasError('email') ? 'Ce courriel n\'est pas valide' :
        '';
  }

  isFormComplete(): boolean {
    return this.email.valid && this.password.valid;
  }

  login(): void {
    this.isLogging = true;
    this.errorMessage = null;
    this.ssoService.loginWithEmailAndPassword(this.email.value, this.password.value).subscribe(
      identite => {
        this.isLogging = false;
        // For now, SSO doesn't returns a valid body (body === null), we can't get the token
        // @DEV : setToken will be ignored (identite === null) and Identity() is call from ssoService wich returns a valid mocked token
        // @TODO IMPORTANT : FIX SSO LOGIN
        if (identite && identite.token) {
          this.ssoService.setToken(identite.token);
          this.ssoService.identity();
        } else {
          this.ssoService.identity();
          const token = this.ssoService.getToken();
          if (token && token !== this.unsetToken) {
            // Logged and token
            // Navigate
            this.routerService.navigateByUrl(this.redirectUrl);
          } else {
            // Logged but no token
            //
          }
        }
      }, error => {
        if (error.status) {
          switch (error.status) {
            case 401:
              // Not logged, email or password error
              this.errorMessage = 'Courriel ou mot de passe non valide';
              break;
            case 500:
              // Server error
              this.errorMessage = 'Le serveur de connexion ne répond pas';
              // @Todo manage error : log
              break;
            default:
              this.errorMessage = 'Erreur inconnue';
              break;
          }
        }
        this.isLogging = false;
        console.log(error);
      }
    );
  }

}

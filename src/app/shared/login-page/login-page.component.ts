import { Component, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import { environment } from '../../../environments/environment';
import { SsoService } from 'src/app/_services/sso.service';
import { NotificationService } from 'src/app/_services/notification.service';
import { WorkspaceService } from 'src/app/_services/workspace.service';
import { MenuService } from 'src/app/_services/menu.service';

import { loginMenu } from '../../_menus/main-menus';

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
              private route: ActivatedRoute,
              private notificationService: NotificationService,
              private wsService: WorkspaceService,
              private menuService: MenuService) { }

  ngOnInit() {
    this.redirectUrl = this.route.snapshot.queryParams['redirectUrl'] || '/';
    this.wsService.currentWS.next('none');
    this.menuService.setMenu(loginMenu);
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
          // At this point, we should have a valid identite.token value
          this.ssoService.setToken(identite.token);
          this.routerService.navigateByUrl(this.redirectUrl);
        } else {
          // If, for any reason (?), we don't get the token,
          // try to get it trought identity
          this.ssoService.getIdentity().subscribe(
            _identite => {
              if (_identite && _identite.token) {
                this.ssoService.setToken(_identite.token);
                this.routerService.navigateByUrl(this.redirectUrl);
              } else {
                // @TODO Log error to admin
                this.notificationService.warn('Nous ne parvenons pas à vous connecter au serveur');
              }
            }, error => {
              // @Todo manage error
              console.log(error);
            }
          );
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

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
      response => {
        this.isLogging = false;
        if (response && response.access_token) {
          // At this point, we should have a valid identite.token value
          this.ssoService.setToken(response.access_token);
          this.ssoService.setRefreshToken(response.refresh_token);

          // Refresh the token periodically
          this.ssoService.alwaysRefreshToken();

          // Go to desired page
          this.routerService.navigateByUrl(this.redirectUrl);
        } else {
          // For any reason (?), we don't get the token...
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

  onPasswordKeyup(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.login();
    }
  }

  onHidePasswordKeypress(event: KeyboardEvent): void {
    event.preventDefault();
  }

}

import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HomePageComponent } from './shared/home-page/home-page.component';
import { LoginPageComponent } from './shared/login-page/login-page.component';
import { PhytoHomePageComponent } from './wsPhyto/phyto-home-page/phyto-home-page.component';
import { PhytoAppPageComponent } from './wsPhyto/phyto-app-page/phyto-app-page.component';
import { FatalErrorPageComponent } from './shared/fatal-error-page/fatal-error-page.component';

import { AdminGuard } from './_guards/admin.guard';
import { AdminHomePageComponent } from './admin/admin-home-page/admin-home-page.component';
import { AdminMetadataPageComponent } from './admin/metadata/admin-metadata-page/admin-metadata-page.component';
import { AdminTestMetadataComponent } from './admin/metadata/admin-test-metadata/admin-test-metadata.component';
import { SophyImportAndSplitCsvComponent } from './admin/sophy/sophy-import-and-split-csv/sophy-import-and-split-csv.component';
import { SophyImportComponent } from './admin/sophy/sophy-import/sophy-import.component';
import { DataSourcesPageComponent } from './admin/dataSources/data-sources-page.component';

import { OccurrenceFormComponent } from './shared/occurrence-form/occurrence-form.component';
import { OccurrenceSearchComponent } from './shared/occurrence-search/occurrence-search.component';
import { TableFormComponent } from './shared/table-form/table-form.component';
import { TableSearchComponent } from './shared/table-search/table-search.component';
import { TableImportComponent } from './shared/table-import/table-import.component';
import { IdentificationComponent } from './shared/identification/identification.component';

import { MyDataPageComponent } from './user/my-data-page/my-data-page.component';

import { AuthGuard } from './_guards/auth.guard';
import { CanDeactivateTableGuard } from './_guards/can-deactivate-table.guard';


const routes: Routes = [
  { path: '', component: HomePageComponent },
  { path: 'login', component: LoginPageComponent },
  { path: 'phyto', component: PhytoHomePageComponent},
  { path: 'phyto/app', component: PhytoAppPageComponent,
    canActivate: [AuthGuard],
    canActivateChild: [AuthGuard],
    canDeactivate: [CanDeactivateTableGuard],
    children: [
    { path: 'create-occurrence', component: OccurrenceFormComponent },
    { path: 'search-occurrence', component: OccurrenceSearchComponent },
    { path: 'create-table', component: TableFormComponent },
    { path: 'search-table', component: TableSearchComponent },
    { path: 'import-table', component: TableImportComponent },
    { path: 'identification', component: IdentificationComponent}
  ]},
  { path: 'my-data', component: MyDataPageComponent, canActivate: [AuthGuard]},
  { path: 'error', component: FatalErrorPageComponent },
  // { path: 'admin', component: AdminHomePageComponent, canActivate: [AdminGuard], canActivateChild: [AdminGuard], children: [
  { path: 'admin', component: AdminHomePageComponent,
    canActivate: [AdminGuard],
    canActivateChild: [AdminGuard],
    children: [
    { path: 'metadata-manager', component: AdminMetadataPageComponent },
    { path: 'metadata-test', component: AdminTestMetadataComponent},
    { path: 'sophy-consolidate', component: SophyImportAndSplitCsvComponent },
    { path: 'sophy-import', component: SophyImportComponent },
    { path: 'data-sources', component: DataSourcesPageComponent }
  ]},
  { path: '**', component: FatalErrorPageComponent, data: { error: 404 } },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

// our bootstrap html, DON'T PUT OTHER HTML HERE (other templates should get inlined with a webpack plugin)
require('file?name=[name].[ext]!./index.html');

// polyfill for web animations API
require('file?name=[name].[ext]!../../node_modules/web-animations-js/web-animations.min.js');

// shims + angular dependencies to load before the main bundle
require('file?name=[name].[ext]!../../node_modules/reflect-metadata/Reflect.js');
require('file?name=[name].[ext]!../../node_modules/zone.js/dist/zone.js');
require('file?name=[name].[ext]!../../node_modules/core-js/client/shim.min.js');

// favicons
require('../assets/favicon/favicon-32x32.png');
require('../assets/favicon/favicon-96x96.png');
require('../assets/favicon/favicon-16x16.png');
require('../assets/favicon/favicon.ico');
require('../assets/bp_logo.png');

require('../scss/global.scss');

import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule, Routes } from '@angular/router';

import { Title } from '@angular/platform-browser';

import { BlindpadService } from '../services/blindpad.service';
import { MediaService } from '../services/media.service';

import { AppComponent } from './app.component';
import { AudioMonitorComponent } from './audio-monitor.component';
import { EditorComponent } from './editor.component';
import { PadComponent } from './pad.component';
import { UserComponent } from './user.component';
import { LoginComponent } from './login.component';
import { DataService } from '../services/data.service';
import { HttpModule } from '@angular/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthenticationService } from '../services/authentication.service';
import { UserService } from '../services/user.service';
import { AuthGuard } from '../services/authGuard.service';

const routes: Routes = [
    { path: 'sandbox', component: PadComponent },
    { path: 'pad/:id', component: PadComponent },
    { path: 'about', component: PadComponent },
    { path: 'support', component: PadComponent },
    { path: 'login', pathMatch: 'prefix', component: LoginComponent },
    { path: '', pathMatch: 'prefix', component: PadComponent, canActivate: [AuthGuard] },
    { path: '**', redirectTo: '' }
];

@NgModule({
    imports: [
        BrowserModule,
        HttpModule,
        ReactiveFormsModule,
        FormsModule,
        RouterModule.forRoot(routes, {useHash: true})
    ],
    declarations: [
        AppComponent,
        PadComponent,
        AudioMonitorComponent,
        EditorComponent,
        UserComponent,
        LoginComponent
    ],
    providers: [
        {
        provide: 'data',
        useClass: DataService
        },
        Title,
        BlindpadService,
        MediaService,
        AuthenticationService,
        AuthGuard,
        UserService
    ],
    schemas: [ CUSTOM_ELEMENTS_SCHEMA ],
    bootstrap: [AppComponent]
})
export class AppModule { }

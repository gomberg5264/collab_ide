import {
    Component,
    OnInit,
    OnDestroy,
    ElementRef,
    Inject,
    trigger, state, style, transition, animate
} from '@angular/core';

import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';
import * as bowser from 'bowser';

import { BlindpadService } from '../services/blindpad.service';
import { MediaService } from '../services/media.service';
import { UserModel } from '../services/UserModel';
import { getDescribedNoun } from '../util/Names';
import { getModeForMime, EditorMode, MODES } from '../util/CodeMirror';
import { fadeInOut } from '../util/Animations';
import { EditorComponent } from '../app/editor.component';

enum PadView {
    Welcome,
    AudioSetup,
    Editor,
    About
}

@Component({
    selector: 'pad',
    templateUrl: 'pad.component.html',
    styleUrls: ['pad.component.scss'],
    animations: [ fadeInOut,
    trigger('slideInOut', [
        state('in', style({
            transform: 'translate3d(0, 0, 0)'
        })),
        state('out', style({
            transform: 'translate3d(-100%, 0, 0)'
        })),
        transition('in => out', animate('600ms ease-in-out')),
        transition('out => in', animate('600ms ease-in-out'))
        ])
    ],
    host: {
        '(document:click)': 'onDocumentClick($event)'
    }
})

export class PadComponent implements OnInit, OnDestroy {
    model: any = {};
    PadView = PadView;
    visibleModeChoices: EditorMode[] = null;
    pads: any;
    output: string;
    createdPads: any;
    result: string;
    menuState: string = 'out';
    userCode: string = '';
    public running: boolean = true;
    public isPadLive: boolean = false;
    // font: string[] = ['Lucida Console', 'Anonymous Pro', 'Courier', 'Droid Sans Mono', 'Inconsolata', 'Source Code Pro', 'Ubuntu Mono'];
    // size: number[] = [12, 14, 16, 18, 20, 22, 24];

    private routeSub: Subscription;
    private randomPadId: string;
    private view: PadView;
    // private editorComponent: EditorComponent;
    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private blindpadService: BlindpadService,
        public media: MediaService,
        private elementRef: ElementRef,
        @Inject('data') private data
    ) { }
    ngOnInit() {
        // localStorage.clear();
        // localStorage.removeItem('currentUser');
        this.routeSub = this.route.params.subscribe(params => {
            const url = this.route.snapshot.url[0];
            const path = url ? url.path : '';
            const urlPadId: string = params['id'];
            this.randomPadId = getDescribedNoun('Pad', 10000);

            // if we're being asked to load a different pad than we're currently showing close the one we're showing
            if (this.blindpadService.getPadId() && this.blindpadService.getPadId() !== urlPadId) {
                this.blindpadService.setPadId(null);
            }

            if (path === 'pad' && urlPadId) {
                this.blindpadService.setPadId(urlPadId);
                if (!this.media.needsCalibration()) { // if we're not calibrating turn the mic on now
                    this.media.initializeLocal();
                }
                // if we've already turned this pad on (presumably before navigating here) don't bother with the welcome screen
                this.view = this.blindpadService.isPadStarted() ? PadView.Editor : PadView.Welcome;
            } else if (path === 'about') {
                this.view = PadView.About;
            } else {
                this.view = PadView.Welcome;
            }
            this.data.getPadStatus()
            .then(res => this.pads = res);
            this.data.saveAndFetchPads()
            .then(res => this.createdPads = res);
        });
    }

    ngOnDestroy() { this.routeSub.unsubscribe(); }

    hasWebRTC(): boolean {
        return hasMethod(window.RTCPeerConnection || window['webkitRTCPeerConnection'], 'createDataChannel')
            && hasMethod(window.navigator, 'getUserMedia');

    }

    hasWebAudio(): boolean {
        return hasMethod(window.AudioContext || window['webkitAudioContext'], 'createMediaStreamDestination');
    }

    browserIsSupported() { return this.hasWebAudio() && this.hasWebRTC(); }

    getView(): PadView { return this.view; }
    getPad() { return this.blindpadService.getPad().value; }
    hasPad() { return !!this.getPad(); }
    isRunning() { return this.running; }

    /* navigation */

    getPadMode(): EditorMode {
        const pad = this.getPad();
        if (!pad) return null;
        return getModeForMime(pad.getMimeType().value);
    }

    onModeButtonClick() {
        if (this.visibleModeChoices) {
            this.visibleModeChoices = null;
        } else {
            this.visibleModeChoices = MODES;
        }
    }

    submit() {
        this.output = '';
        this.userCode = '';
        this.userCode = EditorComponent.myapp.editor.getValue();
        let language = EditorComponent.myapp.editor.options.mode.split('-')[1];
        let lengthUserCode = this.userCode.replace(/\s/g, '').length;
        if (lengthUserCode !== 0) {
            this.running = !this.running;
        }
        let data = {
            user_code: this.userCode,
            lang: language.toLowerCase()
        };
        if (lengthUserCode !== 0) {
            this.data.buildAndRun(data)
              .then(res => (this.output = res) && (this.running = true));
        }
    }

    toggleMenu() {
    // 1-line if statement that toggles the value:
        this.menuState = this.menuState === 'out' ? 'in' : 'out';
    }

    onModeChoice(choice: EditorMode) {
        if (!choice || !this.hasPad()) {
            this.visibleModeChoices = null;
        } else if (choice.children && choice.children.length > 0) {
            this.visibleModeChoices = choice.children;
        } else {
            this.getPad().setMimeType(choice.mime);
            this.visibleModeChoices = null;
        }
    }

    onDocumentClick(event: MouseEvent) {
        if (this.visibleModeChoices === null) return;
        const target = event.target as Element;
        const isModeChoice = target.tagName.toLowerCase() === 'mode-choice';
        const isModeButton = target.classList.contains('mode-button');
        if (isModeButton || isModeChoice) return;
        this.visibleModeChoices = null;
    }

    /* audio setup */

    isChromeOnMac(): boolean { return !!bowser.chrome && !!bowser['mac']; }

    optOutOfVoice() {
        this.media.setOptOut();
        this.view = PadView.Welcome;
    }

    startAudioSetup(): void {
        let initFailure = this.media.getLocalStream().subscribe(null, error => {
            this.view = PadView.Welcome;
            initFailure.unsubscribe();
            initFailure = null;
            if (success) success.unsubscribe();
        });

        // switch the view back once we've calibrated
        let success = this.media.getCalibration().filter(pitch => pitch !== null).take(1).subscribe(pitch => {
            if (this.view === PadView.AudioSetup) {
                this.view = PadView.Welcome;
                if (initFailure) { initFailure.unsubscribe(); }
            }
        });

        this.media.initializeLocal();
        this.view = PadView.AudioSetup;
    }

    isConnected(): boolean { return this.hasPad() && this.getPad().isSignalerConnected(); }

    getUsers(): UserModel[] {
        if (!this.hasPad()) return [];
        return Array.from(this.getPad().getUsers().values());
    }

    /* joining a pad */

    getJoinId() { return this.hasPad() ? this.getPad().getPadId() : this.randomPadId; }
    customInputChange(input: string): void {
        console.log(input);
    }
    getCurrentUser() {
        let currentUser = '';
        if (localStorage.getItem('currentUser') !== null) {
            currentUser = JSON.parse(localStorage.getItem('currentUser'))['username'];
        }
        return true ? (currentUser === 'admin') : false;
    }

    isSandboxUrl() {
        const urlArrayLength = this.route.snapshot.url.length;
        const url = this.route.snapshot.url[urlArrayLength - 1];
        const path = url ? url.path : '';
        return true ? (path === 'sandbox') : false;
    }
    sandboxPad() {
        if (this.hasPad()) {
            this.blindpadService.startPad();
            this.view = PadView.Editor;
        } else {
        this.blindpadService.setPadId('sandbox');
        this.blindpadService.startPad();
        this.router.navigate(['/pad', 'sandbox']);
    }}
    joinPad() {
        let clientPad = '';
        this.data.getPadStatus()
            .then(res => this.pads = res);
        if (this.getPad() != null) {
            clientPad = this.getPad()['padId'];
        }
        this.data.saveAndFetchPads(this.randomPadId)
                .then(res => this.createdPads = res);
        if ((this.hasPad()) && (!this.pads.includes(clientPad)) && (this.createdPads.includes(clientPad))) {
            this.blindpadService.startPad();
            this.view = PadView.Editor;
        } else if (!this.pads.includes(clientPad) && this.getCurrentUser()) {
                this.blindpadService.setPadId(this.randomPadId);
                this.blindpadService.startPad();
                this.router.navigate(['/pad', this.randomPadId]);
            } else {
                this.isPadLive = true;
            }
        }
    endPad() {
        // localStorage.removeItem('currentUser');
        if (this.hasPad()) {
            this.blindpadService.stopPad();
            // this.view = PadView.Editor;
            // this.router.navigate(['/',  this.router ]);
        }
    }

}

function hasMethod(type: any, methodName: string): boolean {
    return type && (type[methodName] || (type['prototype'] && type['prototype'][methodName]));
}

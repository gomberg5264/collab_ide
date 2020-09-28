import { Injectable, NgZone } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import { MediaService } from './media.service';
import { PadModel } from './PadModel';

@Injectable()
export class BlindpadService {

    private pad: BehaviorSubject<PadModel>;

    constructor(
        public mediaService: MediaService,
        private titleService: Title,
        public zone: NgZone
    ) {
        this.pad = new BehaviorSubject<PadModel>(null);
        window.addEventListener('beforeunload', this.onBeforeUnload);
        this.pad.subscribe((pad) => this.titleService.setTitle(pad ? `devpad - ${pad.getPadId()}` : 'devpad'));
    }

    getPad(): BehaviorSubject<PadModel> { return this.pad; }

    setPadId(padId: string): void {
        if (this.pad.value && this.pad.value.getPadId() === padId) return;
        if (this.pad.value) this.pad.value.close();
        this.pad.next(padId ? new PadModel(padId, this) : null);
    }

    getPadId(): string {
        return this.pad.value ? this.pad.value.getPadId() : null;
    }

    startPad(): void {
        if (this.pad.value) {
            this.pad.value.start();
        }
    }

    stopPad(): void {
        if (this.pad.value) {
            this.pad.value.closePad();
        }
    }

    isPadStarted(): boolean {
        return this.pad.value && this.pad.value.isStarted();
    }

    private onBeforeUnload = () => {
        if (this.pad.value) this.pad.value.close();
    }

}

import { Component, OnInit, ViewChild } from "@angular/core";
import {
    Config,
    IonInfiniteScroll,
    IonRouterOutlet,
    IonVirtualScroll,
    ModalController,
    ToastController
} from "@ionic/angular";
import { FlightLogService } from "../../services/flightlog.service";
import { FlightLogItem } from "../../models/flightlog.model";
import { mergeMap } from "rxjs/operators";
import { of } from "rxjs";
import { FlightModalComponent } from "./flight-modal/flight-modal.component";

@Component({
    selector: 'app-flight-log',
    templateUrl: 'flight-log.component.html',
    styleUrls: ['flight-log.component.scss'],
})
export class FlightLogComponent implements OnInit {

    @ViewChild('virtualScroll')
    virtualScroll: IonVirtualScroll;

    @ViewChild('infiniteScroll')
    infiniteScroll: IonInfiniteScroll;

    firstLoad = true;
    logItems: FlightLogItem[] = [];

    constructor(
        private config: Config,
        private routerOutlet: IonRouterOutlet,
        private modalController: ModalController,
        private toastController: ToastController,
        private flightLogService: FlightLogService
    ) {
    }

    ngOnInit() {
        this.flightLogService.init().subscribe(() => {
            // TODO do something here?
            console.log('flight log service init ok');
            this.loadMoreData();
        });
    }

    async record() {
        const modal = await this.modalController.create({
            component: FlightModalComponent
        });
        modal.onDidDismiss().then((data) => this.onEditorDismiss(data));
        return await modal.present();
    }

    async edit(item: FlightLogItem) {
        const modal = await this.modalController.create({
            component: FlightModalComponent,
            componentProps: {
                logItemId: 'TODO',
                flightModel: item,
            }
        });
        modal.onDidDismiss().then((data) => this.onEditorDismiss(data));
        return await modal.present();
    }

    private async onEditorDismiss(data) {
        console.log(data);
        if (data.role) {
            let toastMessage;
            switch (data.role) {
                case 'deleted':
                    toastMessage = 'Volo cancellato';
                    break;
                case 'updated':
                    toastMessage = 'Volo modificato';
                    break;
                case 'created':
                    toastMessage = 'Volo registrato';
                    break;
            }
            if (toastMessage) {
                const toast = await this.toastController.create({
                    message: toastMessage,
                    duration: 2000,
                    cssClass: 'tabs-bottom',
                });
                toast.present();
            }
            // TODO reload data?
        }
    }

    private fetchData() {
        return this.flightLogService.fetchItems()
            .pipe(
                mergeMap((items => {
                    this.logItems.push(...items.reverse());
                    this.virtualScroll.checkEnd();
                    return of(items);
                }))
            );
    }

    loadMoreData() {
        setTimeout(() => {
            return this.fetchData().subscribe(() => {
                this.firstLoad = false;
                this.infiniteScroll.complete();
                if (!this.flightLogService.hasMoreData()) {
                    this.infiniteScroll.disabled = true;
                }
            });
        }, 5000);
    }

    /** There is no default spinner in ion-infinite-scroll-content :-( */
    getLoadingSpinner() {
        return this.config.get('mode') == 'ios' ? 'lines' : 'circular';
    }

}

var GridsterLayoutService_1;
import * as tslib_1 from "tslib";
import { Injectable, EventEmitter } from '@angular/core';
import { DisplayGrid, GridType } from 'angular-gridster2';
import { UUID } from 'angular2-uuid';
import { Lspi } from '../models/Lspi';
import { Serie } from '../models/Serie';
import { Page } from '../models/Page';
import { Frame } from '../models/Frame';
import { Frame_Element } from '../models/Frame_Element';
let GridsterLayoutService = GridsterLayoutService_1 = class GridsterLayoutService {
    constructor(settingsService, auth) {
        this.settingsService = settingsService;
        this.auth = auth;
        this.options = {
            draggable: {
                enabled: true,
                ignoreContent: true,
                dragHandleClass: 'dragHandleHeader'
            },
            pushItems: true,
            resizable: {
                enabled: true
            },
            minCols: 50,
            maxCols: 100,
            minRows: 50,
            maxRows: 100,
            maxItemCols: 100,
            minItemCols: 5,
            maxItemRows: 100,
            minItemRows: 5,
            maxItemArea: 10000,
            minItemArea: 25,
            defaultItemCols: 10,
            defaultItemRows: 10,
            displayGrid: DisplayGrid.None,
            margin: 10,
            outerMargin: true,
            outerMarginTop: null,
            outerMarginRight: null,
            outerMarginBottom: null,
            outerMarginLeft: null,
            gridType: GridType.Fit
        };
        this.layout = [];
        this.components = [];
        this.startTime = new Date(2019, 8, 26, 0, 0, 0);
        this.endTime = new Date(2019, 8, 28, 0, 0, 0);
        this.updateTimeEvent = new EventEmitter();
        this.auth.userProfile$.subscribe(profile => {
            this.auth0_profile = profile;
        });
        this.settingsService.getUsers().subscribe(users => {
            console.log('GridsterLayoutService:getUsers', 'received users: ', users);
            this.usersShortList = users;
            if (this.auth0_profile) {
                let currentUserId = this.usersShortList.find(x => x.name == this.auth0_profile.name).id;
                if (currentUserId) {
                    this.settingsService.getUser(currentUserId).subscribe(user => {
                        this.currentUser = user;
                        console.log('GridsterLayoutService this.currentUser:  ', this.currentUser);
                        console.log('Update this.currentUser login_time to now: ', this.currentUser);
                        this.currentUser.login_time = new Date();
                        this.currentUser.login_count++;
                        this.settingsService.updateUser(this.currentUser).subscribe();
                        /* Check if already pages exist: */
                        if (this.currentUser.Page.length == 0) {
                            this.settingsService.updatePage(new Page(0, [], this.currentUser.id, 'Page 1')).subscribe(() => { this.UpdateCurrentUser(); }); /* Add empty frame for user */
                        }
                        else {
                            this.currentPage = this.currentUser.Page[0];
                        }
                        console.log('Current page set to: ', this.currentPage);
                        this.RebuildLayout(this.currentPage);
                    });
                }
            }
        });
        return GridsterLayoutService_1.instance = GridsterLayoutService_1.instance || this;
    }
    RebuildLayout(page) {
        page.Frame.forEach(frame => {
            let newId = frame.name;
            let getGetijSeriesData = new Array();
            frame.Frame_Element.forEach(frameElement => {
                if (typeof frameElement.start_time == 'string') {
                    frameElement.start_time = new Date(frameElement.start_time);
                }
                if (typeof frameElement.stop_time == 'string') {
                    frameElement.stop_time = new Date(frameElement.stop_time);
                }
                getGetijSeriesData.push(new Serie(new Lspi(frameElement.LSPI_location, frameElement.LSPI_sensor, frameElement.LSPI_parameter, frameElement.LSPI_interval), frameElement.start_time, frameElement.stop_time));
            });
            let gridsterType = '';
            switch (frame.frame_type) {
                case 1: {
                    gridsterType = 'widgetTimeSeriesChart';
                    break;
                }
                case 2: {
                    gridsterType = 'widgetTimeSeriesChart';
                    break;
                }
                case 3: {
                    gridsterType = 'widgetTimeSeriesChart';
                    break;
                }
                default: {
                    gridsterType = 'widgetTimeSeriesChart';
                    break;
                }
            }
            this.layout.push({
                cols: frame.width,
                id: newId,
                rows: frame.height,
                x: frame.X,
                y: frame.Y,
                type: gridsterType,
                title: frame.name,
                serieList: getGetijSeriesData
            });
        });
    }
    ChangeCallback(gridsterItem, gridsterItemComponent) {
        console.log("GridsterLayoutService ChangeCallback event: ");
        console.log("gridsterItem: ", gridsterItem);
        console.log("gridsterItemComponent: ", gridsterItemComponent);
        console.log("this: ", this);
        let frame = this.currentPage.Frame.find(x => x.name == gridsterItem.id);
        console.log("frame before: ", frame);
        if (frame) {
            frame.X = gridsterItem.x;
            frame.Y = gridsterItem.y;
            frame.width = gridsterItem.cols;
            frame.height = gridsterItem.rows;
            console.log("frame send: ", frame);
            this.settingsService.updateFrame(frame).subscribe();
        }
    }
    UpdateCurrentUser() {
        this.settingsService.getUser(this.currentUser.id).subscribe(user => {
            this.currentUser = user;
        });
    }
    UpdateCurrentPage() {
        this.settingsService.getPage(this.currentPage.page_id).subscribe(page => {
            this.currentPage = page;
        });
    }
    updateItem(frameGUID, title, lspiList, type) {
        console.log('updateItem: ', frameGUID, title, lspiList);
        let startTime = new Date(2019, 8, 26, 0, 0, 0);
        let endTime = new Date(2019, 8, 28, 0, 0, 0);
        let frameItem = this.currentPage.Frame.find(x => x.name == frameGUID);
        let gridsterItem = this.layout.find(d => d.id === frameGUID);
        console.log('frameItem: ', frameItem);
        console.log('gridsterItem: ', gridsterItem);
        /* Update widget: */
        gridsterItem.title = title;
        let serieList = new Array();
        lspiList.forEach(lspi => {
            serieList.push(new Serie(lspi, startTime, endTime));
        });
        gridsterItem.serieList = serieList;
        let frame_type = 0;
        switch (type.value) {
            case 'chart': {
                gridsterItem.type = 'widgetTimeSeriesChart';
                frame_type = 1;
                break;
            }
            case 'value': {
                gridsterItem.type = 'widgetTimeSeriesChart';
                frame_type = 2;
                break;
            }
            case 'table': {
                gridsterItem.type = 'widgetTimeSeriesChart';
                frame_type = 3;
                break;
            }
            default: {
                gridsterItem.type = 'widgetTimeSeriesChart';
                frame_type = 4;
                break;
            }
        }
        /* Update settings: */
        //frameItem.name = title;
        frameItem.frame_type = frame_type;
        frameItem.Frame_Element.forEach(frameElement => {
            this.settingsService.deleteFrame_Element(frameElement.id).subscribe(() => { this.UpdateCurrentPage(); });
        });
        lspiList.forEach(lspi => {
            this.settingsService.updateFrame_Element(new Frame_Element(0, frameItem.frame_id, lspi.Location, lspi.Sensor, lspi.Parameter, lspi.Interval, startTime, endTime, true, 60, 1, 1)).subscribe(() => { this.UpdateCurrentPage(); });
        });
        this.settingsService.updateFrame(frameItem).subscribe(() => { this.UpdateCurrentPage(); });
    }
    addItem() {
        var newId;
        newId = UUID.UUID();
        let getGetijSeriesData = [];
        this.layout.push({
            cols: 40,
            id: newId,
            rows: 30,
            x: 0,
            y: 0,
            type: 'widgetTimeSeriesChart',
            serieList: getGetijSeriesData,
            title: 'nieuw frame'
        });
        console.log('addItem:' + newId);
        let newFrameElements = new Array();
        /* Add new frame to page: */
        this.settingsService.updateFrame(new Frame(0, [], this.currentPage.page_id, newId, 1, 0, 0, 40, 30)).subscribe(() => {
            this.settingsService.getPage(this.currentPage.page_id).subscribe(page => {
                this.currentPage = page;
                console.log('added new frame to page with ID: ', newId, this.currentPage);
                let frameId = this.currentPage.Frame.find(x => x.name == newId).frame_id;
                console.log('add 3 Frame_elements with frame ID:', frameId);
                this.settingsService.updateFrame_Element(new Frame_Element(0, frameId, 'OKG', 'VL1', 'WS0', 10, new Date(2019, 8, 26, 0, 0, 0), new Date(2019, 8, 28, 0, 0, 0), true, 60, 1, 1)).subscribe(() => { this.UpdateCurrentPage(); });
                this.settingsService.updateFrame_Element(new Frame_Element(0, frameId, 'NPT', 'VL1', 'WS0', 10, new Date(2019, 8, 26, 0, 0, 0), new Date(2019, 8, 28, 0, 0, 0), true, 60, 1, 1)).subscribe(() => { this.UpdateCurrentPage(); });
                this.settingsService.updateFrame_Element(new Frame_Element(0, frameId, 'ZLD', 'VL1', 'WS0', 10, new Date(2019, 8, 26, 0, 0, 0), new Date(2019, 8, 28, 0, 0, 0), true, 60, 1, 1)).subscribe(() => { this.UpdateCurrentPage(); });
            });
        });
    }
    deleteItem(id) {
        console.log('deleteItem:' + id);
        const item = this.layout.find(d => d.id === id);
        this.layout.splice(this.layout.indexOf(item), 1);
        const comp = this.components.find(c => c.id === id);
        this.components.splice(this.components.indexOf(comp), 1);
        this.settingsService.deleteFrame(this.currentPage.Frame.find(x => x.name == id).frame_id).subscribe();
    }
    ChangeSettings(id) {
        console.log('ChangeSettings:' + id);
    }
    setDropId(dropId) {
        this.dropId = dropId;
    }
    dropItem(dragId) {
        const componentlist = this.components;
        const comp = componentlist.find(c => c.id === this.dropId);
        const updateIdx = comp ? componentlist.indexOf(comp) : componentlist.length;
        const componentItem = {
            id: this.dropId,
            componentRef: dragId
        };
        this.components = Object.assign([], componentlist, { [updateIdx]: componentItem });
    }
    getComponentRef(id) {
        const comp = this.components.find(c => c.id === id);
        return comp ? comp.componentRef : null;
    }
    goBackward() {
        let timeDiff = (this.endTime.getTime() - this.startTime.getTime());
        this.startTime = new Date(this.startTime.getTime() - timeDiff);
        this.endTime = new Date(this.endTime.getTime() - timeDiff);
        this.updateTime();
    }
    goForward() {
        let timeDiff = (this.endTime.getTime() - this.startTime.getTime());
        this.startTime = new Date(this.startTime.getTime() + timeDiff);
        this.endTime = new Date(this.endTime.getTime() + timeDiff);
        this.updateTime();
    }
    zoomIn() {
        let timeDiff = (this.endTime.getTime() - this.startTime.getTime());
        this.startTime = new Date(this.startTime.getTime() + timeDiff / 4);
        this.endTime = new Date(this.endTime.getTime() - timeDiff / 4);
        this.startTime.setSeconds(0);
        this.endTime.setSeconds(0);
        this.updateTime();
    }
    zoomOut() {
        let timeDiff = (this.endTime.getTime() - this.startTime.getTime());
        this.startTime = new Date(this.startTime.getTime() - timeDiff / 2);
        this.endTime = new Date(this.endTime.getTime() + timeDiff / 2);
        this.startTime.setSeconds(0);
        this.endTime.setSeconds(0);
        this.updateTime();
    }
    updateTime() {
        let startTime = this.startTime;
        let endTime = this.endTime;
        this.updateTimeEvent.emit({ startTime, endTime });
    }
};
GridsterLayoutService = GridsterLayoutService_1 = tslib_1.__decorate([
    Injectable({
        providedIn: 'root'
    })
], GridsterLayoutService);
export { GridsterLayoutService };
//# sourceMappingURL=gridster-layout.service.js.map
import { Injectable, EventEmitter } from '@angular/core';
import { GridsterConfig, GridsterItem, DisplayGrid, GridType } from 'angular-gridster2';
import { UUID } from 'angular2-uuid';
import { Lspi } from '../models/Lspi';
import { Serie } from '../models/Serie';

import { AuthService } from 'src/app/services/auth.service';

import { SettingsService } from '../services/settings.service'
import { User } from '../models/User'
import { UserShort } from '../models/UserShort'
import { Page } from '../models/Page'
import { Frame } from '../models/Frame'
import { Frame_Element } from '../models/Frame_Element'

export interface IComponent {
  id: string;
  componentRef: string;
}

@Injectable({
  providedIn: 'root'
})
export class GridsterLayoutService {
  static instance: GridsterLayoutService;

  public options: GridsterConfig = {
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

  public layout: GridsterItem[] = [];
  public components: IComponent[] = [];
  dropId: string;

  startTime: Date = new Date(2019, 8, 26, 0, 0, 0);
  endTime: Date = new Date(2019, 8, 28, 0, 0, 0);  
  public updateTimeEvent: EventEmitter<any> = new EventEmitter();

  usersShortList: UserShort[];
  auth0_profile: any;  

  currentUser: User;
  public currentPage: Page;

  constructor( public settingsService: SettingsService, public auth: AuthService ) {
    this.auth.userProfile$.subscribe(profile => {
      this.auth0_profile = profile;
    })

    this.settingsService.getUsers().subscribe(users => {
      console.log('GridsterLayoutService:getUsers', 'received users: ', users);
      this.usersShortList = users;
      if(this.auth0_profile){
        let currentUserId: number = this.usersShortList.find(x => x.name == this.auth0_profile.name).id;
        if(currentUserId){
          this.settingsService.getUser(currentUserId).subscribe(user => { 
            this.currentUser = user;
            console.log('GridsterLayoutService this.currentUser:  ', this.currentUser );
            console.log('Update this.currentUser login_time to now: ', this.currentUser );
            this.currentUser.login_time = new Date();
            this.currentUser.login_count++;
            this.settingsService.updateUser(this.currentUser).subscribe();

            /* Check if already pages exist: */
            if(this.currentUser.Page.length == 0){
              this.settingsService.updatePage(new Page(0, [], this.currentUser.id, 'Page 1')).subscribe( () => { this.UpdateCurrentUser(); } ); /* Add empty frame for user */
            }else{
              this.currentPage = this.currentUser.Page[0];
            }
            console.log('Current page set to: ', this.currentPage );

            this.RebuildLayout(this.currentPage);
          });
        }
      }
    });

    return GridsterLayoutService.instance = GridsterLayoutService.instance || this;
  }

  RebuildLayout(page: Page){
    page.Frame.forEach(frame => {
      let newId: string = frame.name;
      let getGetijSeriesData: Array<Serie> = new Array<Serie>();

      frame.Frame_Element.forEach(frameElement => {

        if (typeof frameElement.start_time == 'string') {
          frameElement.start_time = new Date(frameElement.start_time);
        }

        if (typeof frameElement.stop_time == 'string') {
          frameElement.stop_time = new Date(frameElement.stop_time);
        }

        getGetijSeriesData.push(new Serie(
                                      new Lspi(frameElement.LSPI_location, frameElement.LSPI_sensor, frameElement.LSPI_parameter, frameElement.LSPI_interval),
                                      frameElement.start_time, frameElement.stop_time));
      });

      this.layout.push({
        cols: frame.width,
        id: newId,
        rows: frame.height,
        x: frame.X,
        y: frame.Y,
        type: 'widgetTimeSeriesChart',
        serieList: getGetijSeriesData
      });
    });
  }

  ChangeCallback(gridsterItem: any, gridsterItemComponent: any){
      console.log("GridsterLayoutService ChangeCallback event: ");
      console.log("gridsterItem: ", gridsterItem);
      console.log("gridsterItemComponent: ", gridsterItemComponent);
      console.log("this: ", this);

      let frame: Frame = this.currentPage.Frame.find(x => x.name == gridsterItem.id);
      
      console.log("frame before: ", frame);
      if(frame)
      {
        frame.X = gridsterItem.x;
        frame.Y = gridsterItem.y;
        frame.width = gridsterItem.cols;
        frame.height = gridsterItem.rows;

        console.log("frame send: ", frame);
        
        this.settingsService.updateFrame(frame).subscribe();        
      }
  }


  UpdateCurrentUser(){
    this.settingsService.getUser(this.currentUser.id).subscribe(user => { 
    this.currentUser = user;
    });
  }

  UpdateCurrentPage(){
    this.settingsService.getPage(this.currentPage.page_id).subscribe(page => { 
    this.currentPage = page;
    });
  }

  addItem(): void {
    var newId: string;
    newId = UUID.UUID();

    let getGetijSeriesData: Array<Serie> = [
      new Serie( new Lspi('OKG', 'VL1', 'WS0', 10), new Date(2019, 8, 26, 0, 0, 0), new Date(2019, 8, 28, 0, 0, 0) ),
      new Serie( new Lspi('NPT', 'VL1', 'WS0', 10), new Date(2019, 8, 26, 0, 0, 0), new Date(2019, 8, 28, 0, 0, 0) ),
      new Serie( new Lspi('ZLD', 'VL1', 'WS0', 10), new Date(2019, 8, 26, 0, 0, 0), new Date(2019, 8, 28, 0, 0, 0) )
    ]

    this.layout.push({
      cols: 40,
      id: newId,
      rows: 30,
      x: 0,
      y: 0,
      type: 'widgetTimeSeriesChart',
      serieList: getGetijSeriesData
    });

    console.log('addItem:' + newId);

    let newFrameElements: Frame_Element[] = new Array<Frame_Element>();
    
    /* Add new frame to page: */
    this.settingsService.updateFrame(new Frame(0, [], this.currentPage.page_id, newId, 1, 0, 0, 40, 30 )).subscribe( () => { 
      this.settingsService.getPage(this.currentPage.page_id).subscribe(page => { 
        this.currentPage = page;
        console.log('added new frame to page with ID: ', newId, this.currentPage);

        let frameId: number = this.currentPage.Frame.find(x => x.name == newId).frame_id;

        console.log('add 3 Frame_elements with frame ID:', frameId);
        this.settingsService.updateFrame_Element(new Frame_Element(0, frameId, 'OKG', 'VL1', 'WS0', 10, new Date(2019, 8, 26, 0, 0, 0), new Date(2019, 8, 28, 0, 0, 0), true, 60, 1, 1)).subscribe( () => { this.UpdateCurrentPage() } );
        this.settingsService.updateFrame_Element(new Frame_Element(0, frameId, 'NPT', 'VL1', 'WS0', 10, new Date(2019, 8, 26, 0, 0, 0), new Date(2019, 8, 28, 0, 0, 0), true, 60, 1, 1)).subscribe( () => { this.UpdateCurrentPage() } );
        this.settingsService.updateFrame_Element(new Frame_Element(0, frameId, 'ZLD', 'VL1', 'WS0', 10, new Date(2019, 8, 26, 0, 0, 0), new Date(2019, 8, 28, 0, 0, 0), true, 60, 1, 1)).subscribe( () => { this.UpdateCurrentPage() } );                
      });
     });
  }

  deleteItem(id: string): void {
    console.log('deleteItem:' + id);
    
    const item = this.layout.find(d => d.id === id);
    this.layout.splice(this.layout.indexOf(item), 1);
    const comp = this.components.find(c => c.id === id);
    this.components.splice(this.components.indexOf(comp), 1);

    this.settingsService.deleteFrame(this.currentPage.Frame.find(x => x.name == id).frame_id).subscribe();
  } 

  ChangeSettings(id: string): void {
    console.log('ChangeSettings:' + id);
  }

  setDropId(dropId: string): void {
    this.dropId = dropId;
  }
  dropItem(dragId: string): void {
    const componentlist = this.components;
    const comp: IComponent = componentlist.find(c => c.id === this.dropId);
    
    const updateIdx: number = comp ? componentlist.indexOf(comp) : componentlist.length;
    const componentItem: IComponent = {
      id: this.dropId,
      componentRef: dragId
    };
    this.components = Object.assign([], componentlist, { [updateIdx]: componentItem });
  }
  getComponentRef(id: string): string {
    const comp = this.components.find(c => c.id === id);
    return comp ? comp.componentRef : null;
  }  

  goBackward(){
    let timeDiff = (this.endTime.getTime() - this.startTime.getTime());
    this.startTime = new Date(this.startTime.getTime() - timeDiff);
    this.endTime = new Date(this.endTime.getTime() - timeDiff);
    this.updateTime();
  }  

  goForward(){
    let timeDiff = (this.endTime.getTime() - this.startTime.getTime());
    this.startTime = new Date(this.startTime.getTime() + timeDiff);
    this.endTime = new Date(this.endTime.getTime() + timeDiff);
    this.updateTime();
  }

  zoomIn(){
    let timeDiff = (this.endTime.getTime() - this.startTime.getTime());
    this.startTime = new Date(this.startTime.getTime() + timeDiff/4);
    this.endTime = new Date(this.endTime.getTime() - timeDiff/4);
    this.startTime.setSeconds(0);
    this.endTime.setSeconds(0);
    this.updateTime();
  }

  zoomOut(){
    let timeDiff = (this.endTime.getTime() - this.startTime.getTime());
    this.startTime = new Date(this.startTime.getTime() - timeDiff/2);
    this.endTime = new Date(this.endTime.getTime() + timeDiff/2);
    this.startTime.setSeconds(0);
    this.endTime.setSeconds(0);
    this.updateTime();
  }

  updateTime() {
    let startTime = this.startTime;
    let endTime = this.endTime;
    this.updateTimeEvent.emit( {startTime, endTime} );
  }   
}

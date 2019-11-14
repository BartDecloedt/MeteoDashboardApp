import { Injectable, EventEmitter } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MAT_EXPANSION_PANEL_DEFAULT_OPTIONS } from '@angular/material';

import { Lspi } from '../models/Lspi';
import { Serie } from '../models/Serie';
import { DataPoint } from '../models/DataPoint';


class chartData {
  constructor(
    public ColumnNames: string[],
    public Data: Array<Array<any>>
  ) {}
}

interface IDataPoints {
  [key: number]: number;
};

class dataCacheLine {
  constructor(
    public Lspi: Lspi, 
    public LastUpdate: Date, 
    public StartTime: Date, 
    public EndTime: Date, 
    public MostRecentDataPointTime: Date,     
    public Data: IDataPoints
  ) {}
}


@Injectable({
  providedIn: 'root'
})
export class DataService {
  static instance: DataService;
  
  updateChartDataEvent: EventEmitter<any> = new EventEmitter();

  lspis: Lspi[] = [];
  loading: boolean;

  dataCache: dataCacheLine[] = [];

  constructor(private httpClient: HttpClient) { 
    this.lspis = [];
    this.loading = false;
    return DataService.instance = DataService.instance || this;
  }

  ClearCache(){
    let now: Date = new Date();

    this.dataCache.forEach( (cacheLine, cacheIndex) => { 
      if( (now.getTime() - cacheLine.LastUpdate.getTime()) > 1000 * 60 * 60 ){

      }
    });
  }

  GetData(widget: any, Version: number, StartTime: Date, EndTime: Date, SerieList: Serie[]) 
  {
    let completeCacheLines: dataCacheLine[] = [];
    let inCompleteCacheLines: dataCacheLine[] = [];
    let emptyCacheLines: dataCacheLine[] = [];

    let ChartData: Array<Array<any>>;
    let ColumnNames: string[];

    console.log("GetData();", Version, StartTime, EndTime, SerieList);

    SerieList.forEach( (serie, index) => { 

      //console.log("SerieList.forEach.serie;", serie);

      let cacheLines: dataCacheLine[] = this.dataCache.filter( element => element.Lspi.LspiName() == serie.Lspi.LspiName() )

      //console.log("Found cacheLines", cacheLines);

      let found:boolean = false;
      cacheLines.forEach( (cacheLine, cacheIndex) => { 
        // Check if cacheline exist with needed data:
        if(!found){
          if( serie.StartTime.getTime() == cacheLine.StartTime.getTime() ){
            // Check if all data is avaible ? 
            if( cacheLine.EndTime.getTime() >= serie.EndTime.getTime() ){ 
              // Reqeusted data was already completely requested from database and put in the cache 
              if( (cacheLine.MostRecentDataPointTime.getTime() < serie.EndTime.getTime()) && (Date.now() - cacheLine.LastUpdate.getTime()) > 30000 ){   
                // Still missing some datapoints from requested time region:
                cacheLine.LastUpdate = new Date(Date.now()); // Update time stamp
                inCompleteCacheLines.push(cacheLine);
              }
              else
              {
                // All requested data is available:
                cacheLine.LastUpdate = new Date(Date.now()); // Update time stamp
                completeCacheLines.push(cacheLine);
              }
              found = true;
            }
            else{ 
              // Some of the requested data is missing in the cache:
              cacheLine.LastUpdate = new Date(Date.now()); // Update time stamp
              inCompleteCacheLines.push(cacheLine);
              found = true;
            }
          }
        }
      });
      if(!found){
        // Reqeuested data is missing in the cache:
        emptyCacheLines.push(new dataCacheLine(serie.Lspi, new Date(Date.now()), StartTime, EndTime, StartTime, [] ));
      }
    });

    let startTimeInCompleteCacheLines: Date = EndTime;
    inCompleteCacheLines.forEach( (cacheLine, cacheIndex) => { 
      if(cacheLine.EndTime < startTimeInCompleteCacheLines)
      {
        startTimeInCompleteCacheLines = cacheLine.EndTime;
      }
    });

    console.log("completeCacheLines before dataload: ", completeCacheLines);
    console.log("inCompleteCacheLines before dataload: ", inCompleteCacheLines);
    console.log("emptyCacheLines before dataload: ", emptyCacheLines);

    console.log("inCompleteCacheLines.length: ", inCompleteCacheLines.length);
    console.log("emptyCacheLines.length: ", emptyCacheLines.length);

    if(inCompleteCacheLines.length > 0 || emptyCacheLines.length > 0){
      if(emptyCacheLines.length == 0){
        this.loadDataFromServerInDataCache(widget, 1, startTimeInCompleteCacheLines, EndTime, SerieList, inCompleteCacheLines.concat(completeCacheLines), ChartData, ColumnNames, []); 
      } else {
        let linesToUpdate: dataCacheLine[] = emptyCacheLines.concat(inCompleteCacheLines).concat(completeCacheLines);
        this.loadDataFromServerInDataCache(widget, 1, StartTime, EndTime, SerieList, linesToUpdate, ChartData, ColumnNames, emptyCacheLines);   
      }
    }
    else
    {
      this.updateChartFromCache(widget, StartTime, EndTime, SerieList, completeCacheLines, ChartData, ColumnNames);
    }
  }

  updateChartFromCache(widget: any, StartTime: Date, EndTime: Date, SerieList: Serie[], DataCache: dataCacheLine[], ChartData: Array<Array<any>>, ColumnNames: string[]){
    ColumnNames = [];
    ChartData = [];

    console.log("updateChartFromCache -> SerieList: ", SerieList);        
    console.log("updateChartFromCache -> DataCache: ", DataCache);

    ColumnNames.push("Time");
    //ChartData.push([]);
    //ChartData[0].push({label: 'Time', id: 'Time', type: 'date'});
    
    let cacheLines: dataCacheLine[] = [];

    SerieList.forEach( (serie, index) => { 
      ColumnNames.push(serie.Lspi.LspiName());
      //ChartData[0].push({label: serie.Lspi.LspiName(), id: serie.Lspi.LspiName(), type: 'number'});
      cacheLines.push(DataCache.find( element => element.Lspi.LspiName() == serie.Lspi.LspiName()));
    });

    console.log("ColumnNames: ", ColumnNames);
    console.log("cacheLines: ", cacheLines);

    let firstCacheLine: boolean = true;
    cacheLines.forEach( (cacheLine, index) => { 
      //let cacheLineIndex: number = 1;
      let cacheLineIndex: number = 0;
      let highestDateKey: number = 0;
      for(let key in cacheLine.Data){
        let dataValue = cacheLine.Data[key];
        if(Number(key) > highestDateKey){
          highestDateKey = Number(key);
        }
        if(firstCacheLine){
          ChartData.push([]);
          
          //let time: string = new Date(Number(key)).toISOString().split('T')[0] + 'T' + new Date(Number(key)).toISOString().split('T')[1].slice(0,-5);
          //ChartData[cacheLineIndex].push(time);          
          ChartData[cacheLineIndex].push(new Date(Number(key)) );          
        }
        ChartData[cacheLineIndex].push(dataValue);
        cacheLineIndex++;
      };

      if(highestDateKey != 0){
        cacheLine.MostRecentDataPointTime = new Date(highestDateKey);
      }
      firstCacheLine = false;
    });

    this.updateChartDataEvent.emit( { widget, ChartData, ColumnNames } );
    console.log("ChartData: ", ChartData);    
  }  

  loadDataFromServerInDataCache(widget: any, Version: number, StartTime: Date, EndTime: Date, SerieList: Serie[], DataCache: dataCacheLine[], ChartData: Array<Array<any>>, ColumnNames: string[], DataCacheLinesToAdd: dataCacheLine[]) 
  {
    let lspiList: Lspi[] = [];

    DataCache.forEach( (cacheLine, cacheIndex) => { 
      lspiList.push(cacheLine.Lspi);
    });    

    //console.log("loadDataFromServerInDataCache: ", DataCache, lspiList, lspiList.length);

    if(lspiList.length > 0){
      this.getDataFrameWithLspiList(Version, StartTime, EndTime, lspiList).then((dataFrame: any) => { 
          dataFrame.forEach( (arrayItem, index) => {
            //console.log("loadDataFromServerInDataCache: dataFrame.forEach: ", arrayItem);
            let time: Date;
            for (var key in arrayItem) {
              if(key == 'Time'){
                time = new Date(arrayItem[key]);
                //console.log("loadDataFromServerInDataCache: time: ", time);
              }
              else{
                //console.log("loadDataFromServerInDataCache: value: ", arrayItem[key]);
                let line: dataCacheLine = DataCache.find(element => element.Lspi.LspiName() == key);
                //console.log("loadDataFromServerInDataCache update cachline: ", line);

                // Put datapoint in cache if it didn't already exist:
                //console.log("loadDataFromServerInDataCache line data: ", line.Data);
                //console.log("loadDataFromServerInDataCache line data number of items: ", Object.keys(line.Data).length);
                //console.log("line.Data[time.getTime()]: ", time.getTime(), line.Data[time.getTime()]);
                if(line.Data[time.getTime()] == undefined){
                  //console.log("loadDataFromServerInDataCache INITIAL insert: ", time.getTime(), arrayItem[key]);
                  line.Data[time.getTime()] = arrayItem[key];
                }
              } 
            }
          });
          //console.log("CacheLines after dataload: ", DataCache);

          this.updateChartFromCache(widget, StartTime, EndTime, SerieList, DataCache, ChartData, ColumnNames);

          this.dataCache = this.dataCache.concat(DataCacheLinesToAdd);
      });
    }
  }

  padZeroes(input: number, length: number)
  {
    return String("0").repeat(Math.abs(length - input.toString().length)) + input.toString();
  }

  getDataFrameWithLspiList( Version: number, StartTime: Date, EndTime: Date, LspiList: Lspi[]){
    let apiRequest:string = 'https://localhost:44395/api/DataPoints?';
    
    LspiList.forEach( (lspi, index) => { 
      apiRequest += 'lspis=' + lspi.LspiName() + '&'; 
    });

    let formatted_startTime = StartTime.getFullYear() + "-" + this.padZeroes((StartTime.getMonth() + 1), 2) + "-" + this.padZeroes(StartTime.getDate(),2) + " " + this.padZeroes(StartTime.getHours(),2) + ":" + this.padZeroes(StartTime.getMinutes(),2) + ":" + this.padZeroes(StartTime.getSeconds(),2);
    let formatted_endTime = EndTime.getFullYear() + "-" + this.padZeroes((EndTime.getMonth() + 1), 2) + "-" + this.padZeroes(EndTime.getDate(),2) + " " + this.padZeroes(EndTime.getHours(),2) + ":" + this.padZeroes(EndTime.getMinutes(),2) + ":" + this.padZeroes(EndTime.getSeconds(),2);

    //console.log("getDataFrameWithLspiList: startTime: ", StartTime, formatted_startTime);
    //console.log("getDataFrameWithLspiList: endTime: ", EndTime, formatted_endTime);

    apiRequest += 'startTime=' + formatted_startTime + '&endTime=' + formatted_endTime + '&version=' + Version;

    console.log("Get data from API: " + apiRequest);

    return this.httpClient.get(apiRequest).toPromise();
  }  

  getLSPIList(){
    let promise = new Promise((resolve, reject) => {
      /*let apiRequest: string = 'https://localhost:44395/api/LSPIS';*/
      let apiRequest: string = 'http://localhost:8090/GTSACQ/GetLSPIS';
      /*let apiRequest: string = 'http://localhost:8090/Dashboard/SELECT_User_list';*/
      console.log("Get LSPI list from API: " + apiRequest);

      /*
      const httpOptions = {
        headers: new HttpHeaders({ 
          'Access-Control-Allow-Origin':'*',
          'Authorization':'authkey',
          'userid':'1'
        })
      };
      */

      this.httpClient
        .get(apiRequest/*, httpOptions*/)
        .toPromise()
        .then(
          (res: any) => { console.log("res: ", res);
            this.lspis = res.data.map(item => {
                return new Lspi(item.LocationShortName, item.SensorShortName, item.ParameterShortName, item.Interval);
          });
          resolve();
          },
          msg => {
            // Error
            reject(msg);
          }
        );
    });
    return promise;
  }
}
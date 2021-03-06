import { Injectable } from '@angular/core';
import { GoogleChartsBaseService } from './google-charts-base.service';
import { LineChartConfig } from '../models/LineChartConfig';

@Injectable({
  providedIn: 'root'
})
export class GoogleLineChartService extends GoogleChartsBaseService {

  /*chartFuncMap: Map<string, Object>;*/

  constructor() { super(); /*this.chartFuncMap = new Map<string, Object>();*/ }

  public BuildLineChart(elementId: string, data: any[], config: LineChartConfig) : void {  
    /*console.log("GoogleLineChartService BuildLineChart", elementId, data, config, this.chartFuncMap);*/
    
    /*
    var chartFunc;
    if(this.chartFuncMap.has(elementId))
    {  
      chartFunc = this.chartFuncMap.get(elementId);
      console.log("GoogleLineChartService BuildLineChart: reused existing LineChart");
    }
    else
    {
      chartFunc = () => { return new google.visualization.LineChart(document.getElementById(elementId)); };
      this.chartFuncMap.set(elementId, chartFunc);
      console.log("GoogleLineChartService BuildLineChart: created new LineChart");
    }
    */

   var chartFunc = () => { return new google.visualization.LineChart(document.getElementById(elementId)); };

    let hAxisFormat:string = 'dd/MM HH:mm';
    
    var options = {
      width: config.width,
      height: config.height,
      interpolateNulls: true,
      chart: {
        title: config.title,
        dynamicResize: true,
        interpolateNulls: true,
      },
      chartArea: {
        left: /*10*/40,
        right: 15, // !!! works !!!
        bottom: /*20*/60,  // !!! works !!!
        top: 20,
        width: "100%",
        height: "100%",
        dynamicResize: true,
      },      
      /*animation: {
        duration: 1000,
        easing: 'out',
        startup: false
      },*/
      curveType: 'none',
      legend: { position: 'bottom' },
      /*        
      axes: {
      // Adds labels to each axis; they don't have to match the axis names.
          y: {
            0: {label: 'Luchtdruk (hPa)'  },
          },
          x: { 
            0: { side: 'bottom', label: 'Tijd' }
          },
      },
      */
      vAxis: { 
        format: '###.###'/*, textPosition: 'in'*/,
        viewWindowMode: 'maximized',
        textStyle: {
          fontName: 'Times-Roman',
          fontSize: 12,
          /*bold: true,*/
          /*italic: true,*/
          /*color: '#871b47',*/
          // The color of the text outline.
          /*auraColor: '#d799ae',*/
          // The transparency of the text.
          /*opacity: 0.8*/
        }
      },
      hAxis: {  
        format: config.hAxisFormat/*, textPosition: 'in'*/,
        viewWindowMode: 'maximized',
        textStyle: {
          fontName: 'Times-Roman',
          fontSize: 12,
          /*bold: true,*/
          /*italic: true,*/
          // The color of the text.
          /*color: '#871b47',*/
          // The color of the text outline.
          /*auraColor: '#d799ae',*/
          // The transparency of the text.
          /*opacity: 0.8*/
        }
      },
    };

    this.buildChart(data, chartFunc, options, elementId);
  }  
}

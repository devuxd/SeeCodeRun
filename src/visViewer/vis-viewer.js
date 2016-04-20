/* global $ */

import {EventAggregator} from 'aurelia-event-aggregator';
import {inject} from 'aurelia-framework';
import * as d3 from 'd3';
import {VisualizationFactory} from '../visualization/visualizationFactory';
import {Visualization} from '../visualization/visualization';

@inject(EventAggregator)
export class VisViewer {

  constructor(eventAggregator) {
    this.eventAggregator = eventAggregator;

    this.visualizations = [];
    this.tempVis = null;

    this.factory = new VisualizationFactory();
    this.visualizationTypes = this.factory.getVisualizationTypes();

    /*let dataTableConfig = this.factory.getVisualizationByType('DataTable');
    let dataTableVisualization = new Visualization(d3, this.eventAggregator, dataTableConfig.config);*/

    //this.visualizations.push(dataTableVisualization);

    this.isChecked = false;
    this.addVisualization = this.addVis;
    this.subscribe();
  }

  attached() {
    for (let visualization of this.visualizations) {
      visualization.attached();
    }
  }

  subscribe() {
    let ea = this.eventAggregator;

    ea.subscribe('onEditorCopy', payload => {
      if (this.isChecked) {
        this.publish(payload);
      }
    });
  }

  publish(payload) {
    let ea = this.eventAggregator;
    ea.publish('onVisRequest', payload);
  }
  
  addVis() {
    if(this.tempVis) {
      if(!this.checkVisExists(this.tempVis.type)) {
        this.visualizations.push(this.tempVis);
        let vis = this.visualizations[this.visualizations.length-1];
        setTimeout(function() {
          vis.attached();
        }, 50);
        this.removeVisType(this.tempVis.type);
      }
    }
  }
  
  onSelectChange(event) {
    let type = $(event.target).val();
    if (type !== '' && type !== null) {
      this.tempVis = new Visualization(d3, this.eventAggregator, this.factory.getVisualizationByType(type));
    }
  }
  
  checkVisExists(type) {
    let exists = false;
    for (let i = 0; i < this.visualizations.length; i++) {
      if (this.visualizations[i].type === type) {
        exists = true;
        break;
      }
    }
    return exists;
  }
  
  removeVisType(type) {
    let index = -1;
    for (let i = 0; i < this.visualizationTypes.length; i++) {
      if (this.visualizationTypes[i].value === type) {
        index = i;
        break;
      }
    }
    
    if(index >= 0) {
      this.visualizationTypes.splice(index, 1);
    }
  }
}
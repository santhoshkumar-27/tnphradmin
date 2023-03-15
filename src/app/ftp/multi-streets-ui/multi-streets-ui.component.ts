import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-multi-streets-ui',
  templateUrl: './multi-streets-ui.component.html',
  styleUrls: ['./multi-streets-ui.component.scss']
})
export class MultiStreetsUiComponent implements OnInit {

  @Input() streets: any;
  COLOURS:any =  ["#008000", "#35459d", "#f57c00", "#008000", "#35459d"];

  constructor() { }

  ngOnInit(): void {
  }

}

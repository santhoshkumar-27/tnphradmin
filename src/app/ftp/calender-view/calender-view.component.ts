import { Component, Input, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Constants } from 'src/app/config/constants/constants';
import {
  FTP_MAPPING,
  DAY_MAPPING,
  WEEK_MAPPING,
  MAPPING,
} from 'src/app/models/ftp-mapping';
import { User } from 'src/app/models/user';
import { isStateAdmin } from 'src/app/utils/session.util';
import { FtpService } from '../ftp.service';
import { getModelObject } from '../utils/modelObject';

@Component({
  selector: 'app-calender-view',
  templateUrl: './calender-view.component.html',
  styleUrls: ['./calender-view.component.scss'],
})
export class CalenderViewComponent implements OnInit {
  @Input() ftpData: any;
  @Input() currentUser: User;
  @Input() hscFacilityId: string;

  WEEKS: Array<any> = [
    { name: 'Week 1', value: 'week-1' },
    { name: 'Week 2', value: 'week-2' },
    { name: 'Week 3', value: 'week-3' },
    { name: 'Week 4', value: 'week-4' },
  ];
  DAYS: Array<string> = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];
  UNITS: Array<any> = [
    { name: 'Unit 1', value: 'unit-1' },
    { name: 'Unit 2', value: 'unit-2' },
    { name: 'Unit 3', value: 'unit-3' },
    { name: 'Unit 4', value: 'unit-4' },
    { name: 'Holiday', value: 'Holiday' },
    { name: 'Review', value: 'Review' },
  ];
  allStreets: Array<any> = [];
  isCallInProgress: boolean = false;
  storeFtpMappings: any;
  hideSaveBtn: boolean = false;
  hideStreets: boolean = false;

  constructor(private ftpService: FtpService, private _snackBar: MatSnackBar) {}

  ngOnInit(): void {}

  ngOnChanges() {
    if (this.currentUser && isStateAdmin(this.currentUser))
      this.hideSaveBtn = true;
    this.bindFtpData();
  }

  bindFtpData() {
    //binding the ftp mappings to ui (assigning ftp data to storeFtpMappings)
    this.storeFtpMappings = getModelObject();
    this.allStreets = this.ftpData?.all_streets;
    // let defaultfilteredStreets = this.allStreets.filter(
    //   (elem) => elem.unit_name == 'unit-1'
    // );

    let defaultfilteredStreets = this.allStreets['unit-1'] || [];

    //assigning default value for unit as "unit-1" for all the cells
    //getting filteredStreets based on "unit-1"
    for (let eachweek in this.storeFtpMappings) {
      for (let eachday in this.storeFtpMappings[eachweek]) {
        this.storeFtpMappings[eachweek][eachday].unit = ['unit-1'];
        this.storeFtpMappings[eachweek][eachday].filteredStreets = [
          defaultfilteredStreets,
        ];
      }
    }

    console.log(this.storeFtpMappings);

    // loop through each street mapping
    // for (let street of this.ftpData?.mappings) {
    let mappings: MAPPING = this.ftpData.mapping;

    // loop through each week for the mapping
    for (let week in mappings) {
      let weekMappings: WEEK_MAPPING = mappings[week];
      let weekObj: any = this.storeFtpMappings[week];

      // loop through each day of the week
      for (let day in weekMappings) {
        let dayMappings: Array<DAY_MAPPING> = weekMappings[day];
        let dayObj: any = weekObj[day];

        for (let obj of dayMappings) {
          if (obj.meridian == 'AM' || obj.meridian == 'ALL') {
            // let temp = this.allStreets.filter(
            //   (el) => el.unit_name == street.unit_name
            // );
            dayObj.filteredStreets[0] = this.allStreets[obj['unit_name']];
            dayObj.unit[0] = obj['unit_name'];
            if (obj['action'][0] == 'Holiday' || obj['action'][0] == 'Review') {
              dayObj.unit[0] = obj['action'][0];
              dayObj.filteredStreets[0] = null;
            } else {
              obj['action'].forEach((street_id: any) => {
                let streetObj = dayObj.filteredStreets[0].find(
                  (el: any) => el.street_id == street_id
                );
                dayObj.streets[0].push(streetObj);
              });
            }
          } else {
            dayObj.unit[1] = obj['unit_name'];
            dayObj.filteredStreets[1] = this.allStreets[obj['unit_name']];
            obj['action'].forEach((street_id: any) => {
              let streetObj = dayObj.filteredStreets[1].find(
                (el: any) => el.street_id == street_id
              );
              dayObj.streets[1].push(streetObj);
            });
          }
        }
        dayObj.view = true;
      }
    }
    //}
    console.log(this.storeFtpMappings);
  }

  getFilteredStreets(week: string, day: string, unitInd: number) {
    let selectedUnit = this.storeFtpMappings[week][day].unit[unitInd];
    this.storeFtpMappings[week][day].isHoliday =
      selectedUnit == 'Holiday' || selectedUnit == 'Review' ? true : false;
    this.storeFtpMappings[week][day].filteredStreets[unitInd] =
      this.allStreets[selectedUnit] || [];
    this.storeFtpMappings[week][day].streets[unitInd] = [];
    if (
      this.storeFtpMappings[week][day].isHoliday &&
      this.storeFtpMappings[week][day].split
    ) {
      this.storeFtpMappings[week][day].streets = [[], []];
      this.storeFtpMappings[week][day].unit = [selectedUnit, 'unit-1'];
      this.storeFtpMappings[week][day].filteredStreets = [
        this.allStreets['unit-1'],
        this.allStreets['unit-1'],
      ];
    }
  }

  splitCell(week: string, day: string) {
    this.storeFtpMappings[week][day].split = true;
    // assigning default values for second dropdown
    this.storeFtpMappings[week][day].unit[1] = 'unit-1';
    this.storeFtpMappings[week][day].filteredStreets[1] =
      this.allStreets['unit-1'];
  }

  showEditMode(week: string, day: string) {
    //if unit has two values show split mode else default mode
    if (this.storeFtpMappings[week][day]?.unit?.length == 1) {
      this.storeFtpMappings[week][day].view = false;
      // if (
      //   this.storeFtpMappings[week][day]?.unit[0] == 'Holiday' ||
      //   this.storeFtpMappings[week][day]?.unit[0] == 'Review'
      // )
      //   this.storeFtpMappings[week][day].unit[0] = 'unit-1';
    } else {
      this.storeFtpMappings[week][day].view = false;
      this.storeFtpMappings[week][day].split = true;
    }
  }

  gotoDefaultMode(week: string, day: string) {
    this.storeFtpMappings[week][day].view = false;
    this.storeFtpMappings[week][day].split = false;
    // clearing second area dropdown values
    this.storeFtpMappings[week][day].streets[1] = [];
    this.storeFtpMappings[week][day].unit?.splice(1, 1);
    this.storeFtpMappings[week][day].filteredStreets?.splice(1, 1);
  }

  saveFtpData() {
    console.log(this.storeFtpMappings);
    //create request body for upsert ftp api from storeFtpMappings
    let ftpArr: any = [];
    for (let week in this.storeFtpMappings) {
      let week_mappings = this.storeFtpMappings[week];
      let times = ['AM', 'PM'];
      for (let day in week_mappings) {
        let unit = week_mappings[day].unit[0];

        if (unit == 'Holiday' || unit == 'Review') {
          ftpArr.push({
            week: week,
            day: day,
            meridian: 'ALL',
            unit_id: 'ALL',
            unit_name: 'ALL',
            action: [unit],
          });
          continue;
        }

        let streets = week_mappings[day].streets;
        // loop for streets selected for each split area
        for (let i = 0; i < streets.length; i++) {
          let multipleStreets = streets[i];

          if (streets[i].length > 0) {
            let time = streets[1]?.length == 0 ? 'ALL' : times[i];

            let strIds = streets[i].map((str) => str.street_id);
            let unitId = this.allStreets[week_mappings[day].unit[i]][0].unit_id;
            let obj: any = {
              week: week,
              day: day,
              meridian: time,
              unit_id: unitId,
              unit_name: week_mappings[day].unit[i],
              action: strIds,
            };

            ftpArr.push(obj);
          }
          // loop for multiple streets under each streets value
          // for (var j = 0; j < multipleStreets.length; j++) {
          //   let street = multipleStreets[j];
          //   if (street == undefined || street == '') continue;
          //   let streetMapping = ftpArr.find(
          //     (elem: any) => elem.street_id == street.street_id
          //   );
          //   if (streetMapping) {
          //     streetMapping['ftp_details'][week].push(`${day}-${time}`);
          //   } else {
          //     let obj: any = {
          //       street_id: street.street_id,
          //       ftp_details: {
          //         'week-1': [],
          //         'week-2': [],
          //         'week-3': [],
          //         'week-4': [],
          //       },
          //     };
          //     obj['ftp_details'][week] = [`${day}-${time}`];
          //     ftpArr.push(obj);
          //   }
          // }
        }
      }
    }

    console.log('ftp mappings', ftpArr);
    //do not hit api call when no mappings are selected

    if (Object.keys(this.ftpData?.mapping)?.length == 0 && ftpArr?.length == 0)
      return;


    this.isCallInProgress = true;

    this.ftpService
      .saveFtpMappings(this.currentUser, ftpArr, this.hscFacilityId)
      .subscribe((response: any) => {
        console.log('update ftp response', response);
        this.isCallInProgress = false;
        if (response.status === Constants.SUCCESS_FLAG) {
          this.getFtpData();
          this._snackBar.open('Ftp Mappings Saved Successfully.', 'Dismiss', {
            duration: 4000,
          });
        } else {
          this._snackBar.open('Error while Saving Ftp Mappings.', 'Dismiss', {
            duration: 4000,
          });
        }
      });
  }

  getFtpData() {
    this.isCallInProgress = true;
    this.ftpService
      .getFtpMappings(this.currentUser, this.hscFacilityId)
      .subscribe((response: FTP_MAPPING) => {
        this.isCallInProgress = false;
        this.ftpData = response;
        this.bindFtpData();
      });
  }

  getStreetName(streetId: string) {
    let temp = this.allStreets.find((elem) => elem.street_id == streetId);
    return temp?.street_name;
  }

  disableOptions(selectedOptions: any, option: any) {
    if (selectedOptions?.length == 5) {
      let checked = selectedOptions.find(
        (el: any) => el.street_id == option.street_id
      );
      return checked ? false : true;
    }
    return false;
  }
}

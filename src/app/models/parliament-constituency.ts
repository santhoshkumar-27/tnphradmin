export class ParliamentConstituency {
    parlimentary_constituency_id: string;
    parlimentary_constituency_name: string;
    reference_id: 29;
    
    static mapJsonToParliament(data: JSON):ParliamentConstituency {
      let parliament = new ParliamentConstituency();
      Object.assign(parliament, data);
      return parliament;
    }
  
   
  }
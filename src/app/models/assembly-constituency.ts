export class AssemblyConstituency {
    assembly_constituency_id: string;
    reference_id:number;
    assembly_constituency_name: string;
    district_id: string;
    parlimentary_constituency_id: string;
    
    static mapJsonToAssembly(data: JSON):AssemblyConstituency {
      let assembly = new AssemblyConstituency();
      Object.assign(assembly, data);
      return assembly;
    }
  
   
  }

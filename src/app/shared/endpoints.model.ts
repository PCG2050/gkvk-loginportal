export class Endpoints {
    static readonly LoginBasicAuth = Endpoints.getbaseURL() + '/api/Auth/login';
    static states = Endpoints.getbaseURL()+'/api/Locations/states';
    static districts = Endpoints.getbaseURL()+'/api/Locations/states/{stateId}/districts';
    // static admins = Endpoints.getbaseURL()+'/api/Users';
    static admin = Endpoints.getbaseURL()+'/api/Organizations';
    static units = Endpoints.getbaseURL()+'/api/Units';
    static institutes = Endpoints.getbaseURL()+'/api/Organizations';
    static organizationUnit = Endpoints.getbaseURL()+'/api/organization-units';
    static addUnitHead = Endpoints.getbaseURL()+'/api/RegisterUser';
    static user = Endpoints.getbaseURL()+'/api/Users';
    static unitHead = Endpoints.getbaseURL()+'/api/UnitHeads';
    static updateUnitHead = Endpoints.getbaseURL+'/api/Users/{id}/UnitHead'
    static getUnitHead = Endpoints.getbaseURL()+'/api/UnitHeads';
    static staff = Endpoints.getbaseURL()+'/api/Trainers';
    static logout = Endpoints.getbaseURL()+'/api/Auth/logout';

    //   ✅ STU Endpoints
    static stuReports = Endpoints.getbaseURL() + '/api/STUReport/AllReports';
    static stuThemeReportsByLocation = Endpoints.getbaseURL() + '/api/STUReport/Last3MonthsThemeReportByLocation';

      // ✅ FTI Endpoints
  static ftiReports = Endpoints.getbaseURL() + '/api/FTIReport/MonthlyReports';
  static ftiThemeReports = Endpoints.getbaseURL() + '/api/FTIReport/MonthlyThemeReports';


  static fiuReports = Endpoints.getbaseURL() + '/api/FIUReport/MonthlyReports';
  static fiuOtherActivities = Endpoints.getbaseURL() + '/api/FIUReport/OtherActivities';

  static ibtvReports = Endpoints.getbaseURL() + '/api/IBTVAReport/MonthlyReport';
  static ibtvThemeReports = Endpoints.getbaseURL() + '/api/IBTVAReport/MonthlyThemeReports';
  static ibtvExtensionActivities = Endpoints.getbaseURL() +'/api/IBTVAReport/ExtensionActivities';

  static aticReports = Endpoints.getbaseURL() + '/api/AticReport/MonthlyReports';
  static aticThemeReports = Endpoints.getbaseURL() + '/api/AticReport/MonthlyThemeReports';

  static deuReports = Endpoints.getbaseURL() + '/api/DeuReport/MonthlyReports';
  static deuThemeReports = Endpoints.getbaseURL() + '/api/DeuReport/MonthlyThemeReports';

  static asmReports = Endpoints.getbaseURL() + '/api/AsmReport/MonthlyReports';
  static asmThemeReports = Endpoints.getbaseURL() + '/api/AsmReport/MonthlyThemeReports';

  static naepReports = Endpoints.getbaseURL() + '/api/NaepReport/MonthlyReports';
  static naepThemeReports = Endpoints.getbaseURL() + '/api/NaepReport/MonthlyThemeReports';

  static eeuReports = Endpoints.getbaseURL() + '/api/EeuReport/MonthlyReports';
  static eeuThemeReports = Endpoints.getbaseURL() + '/api/EeuReport/MonthlyThemeReports';

  static kvkReports = Endpoints.getbaseURL() + '/api/KvkReport/MonthlyReports';
  static kvkThemeReports = Endpoints.getbaseURL() + '/api/KvkReport/MonthlyThemeReports';
  
  // report (Legacy endpoints)

  static filterOptions = Endpoints.getbaseURL() + '/api/admin/reports/filter-options';
  static generateReport = Endpoints.getbaseURL() + '/api/admin/reports/generate';

  // Dynamic Report endpoints
  static dynamicReportConfiguration = Endpoints.getbaseURL() + '/api/admin/reports/dynamic/configuration';
  static dynamicReportGenerate = Endpoints.getbaseURL() + '/api/admin/reports/dynamic/generate';
  static dynamicReportPreview = Endpoints.getbaseURL() + '/api/admin/reports/dynamic/preview';


    static getbaseURL() {
    return 'https://gkvk-qaenv.azurewebsites.net';
    //  return 'https://localhost:7024'
}
}
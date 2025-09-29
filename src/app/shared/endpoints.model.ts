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
    static stuReports = Endpoints.getbaseURL() + '/api/STUReport/AllReports';
    static stuThemeReportsByLocation = Endpoints.getbaseURL() + '/api/STUReport/Last3MonthsThemeReportByLocation';

    static getbaseURL() {
    //return 'https://gkvk-qaenv.azurewebsites.net';
     return 'https://localhost:7024'
}
}
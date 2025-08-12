export class Endpoints {
    static readonly LoginBasicAuth = Endpoints.getbaseURL() + '/api/Auth/login';
    static states = Endpoints.getbaseURL()+'/api/Locations/states';
    static districts = Endpoints.getbaseURL()+'/api/Locations/states/{stateId}/districts';
    static admins = Endpoints.getbaseURL()+'/api/Users';
    static addAdmin = Endpoints.getbaseURL()+'/api/Organizations';
    static units = Endpoints.getbaseURL()+'/api/Units';
    static institutes = Endpoints.getbaseURL()+'/api/Organizations';
    static organizationUnit = Endpoints.getbaseURL()+'/api/organization-units';
    static addUnitHead = Endpoints.getbaseURL()+'/api/RegisterUser'
    static getbaseURL() {
    // return 'https://gkvk-qaenv.azurewebsites.net';
    return 'https://localhost:7024'
}
}
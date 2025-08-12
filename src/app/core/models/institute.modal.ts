export interface InstituteData {
  id: number,
  name: string,
  pincode?: string;
  districtName: string,
  stateName: string,
  logoUrl: string,
  storageContainerName: string,
  storageContainerNamePublic: string;
  emailEnabled: boolean;
  phoneEnabled: boolean;
}
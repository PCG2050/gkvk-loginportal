import { Injectable } from '@angular/core';

export interface Institute {
  id: number;
  name: string;
  logoUrl?: string;
  communicationChannels?: {
    website?: string;
    emailEnabled?: boolean;
    phoneEnabled?: boolean;
  };
  storageInfo?: {
    privateContainerName?: string;
    publicContainerName?: string;
  };
  address?: {
    state?: string;
    district?: string;
    pincode?: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class InstituteThemeService {
  private institutes: Institute[] = [
    {
      id: 1,
      name: 'GKVK University',
      logoUrl: 'https://dummyimage.com/80x80/012a5b/fff.png&text=GKVK',
      communicationChannels: {
        website: 'https://gkvk.edu',
        emailEnabled: true,
        phoneEnabled: true
      },
      storageInfo: {
        privateContainerName: 'gkvk-private',
        publicContainerName: 'gkvk-public'
      },
      address: {
        state: 'Karnataka',
        district: 'Bangalore',
        pincode: '560065'
      }
    },
    {
      id: 2,
      name: 'AgriTech Institute',
      logoUrl: 'https://dummyimage.com/80x80/007bff/fff.png&text=ATI',
      communicationChannels: {
        website: 'https://atitech.org',
        emailEnabled: true,
        phoneEnabled: false
      },
      storageInfo: {
        privateContainerName: 'ati-private',
        publicContainerName: 'ati-public'
      },
      address: {
        state: 'Maharashtra',
        district: 'Pune',
        pincode: '411001'
      }
    }
  ];
  private nextId = 3;

  getInstitutes(): Institute[] {
    return [...this.institutes];
  }

  addInstitute(institute: Omit<Institute, 'id'>): void {
    const newInstitute: Institute = {
      id: this.nextId++,
      ...institute
    };
    this.institutes.push(newInstitute);
  }

  updateInstitute(id: number, updatedFields: Partial<Institute>): void {
    const index = this.institutes.findIndex(i => i.id === id);
    if (index !== -1) {
      this.institutes[index] = {
        ...this.institutes[index],
        ...updatedFields,
        communicationChannels: {
          ...this.institutes[index].communicationChannels,
          ...updatedFields.communicationChannels
        },
        storageInfo: {
          ...this.institutes[index].storageInfo,
          ...updatedFields.storageInfo
        },
        address: {
          ...this.institutes[index].address,
          ...updatedFields.address
        }
      };
    }
  }

  deleteInstitute(id: number): void {
    this.institutes = this.institutes.filter(i => i.id !== id);
  }
}
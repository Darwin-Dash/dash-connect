export interface DashDocument {
  $id: string
  $ownerId: string
  $dataContractId: string
  $createdAt?: number
  $updatedAt?: number
  message?: string
  [key: string]: any
}

export interface DashIdentity {
  id: string
  balance?: number
}

export interface DashPlatformSDK {
  documents: {
    query: (
      dataContractId: string,
      documentType: string,
      options?: QueryOptions
    ) => Promise<DashDocument[]>
    create: (
      dataContractId: string,
      documentType: string,
      data: any,
      identity: string,
      identityContractNonce: bigint
    ) => Promise<any>
  }
  identities: {
    getIdentityContractNonce: (
      identityId: string,
      dataContractId: string
    ) => Promise<bigint>
  }
  stateTransitions: {
    documentsBatch: {
      create: (document: any, identityContractNonce: bigint) => Promise<any>
    }
    broadcast: (stateTransition: any) => Promise<void>
  }
  signer: {
    signStateTransition: (stateTransition: any) => Promise<void>
  }
}

export interface QueryOptions {
  limit?: number
  startAt?: number
  orderBy?: Array<[string, 'asc' | 'desc']>
  where?: Array<[string, string, any]>
}

declare global {
  interface Window {
    dashPlatformSDK?: DashPlatformSDK
  }
}
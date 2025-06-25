declare module 'dash-platform-sdk' {
  export interface QueryOptions {
    where?: Array<[string, string, any]>
    orderBy?: Array<[string, 'asc' | 'desc']>
    limit?: number
    startAt?: number
  }

  export interface DocumentsAPI {
    query: (
      dataContractId: string,
      documentType: string,
      where: any[],
      orderBy: any,
      limit: number
    ) => Promise<any[]>
    create: (
      dataContractId: string,
      documentType: string,
      data: any,
      identity: string,
      identityContractNonce: bigint
    ) => Promise<any>
  }

  export interface IdentitiesAPI {
    getIdentityContractNonce: (
      identityId: string,
      dataContractId: string
    ) => Promise<bigint>
    getBalance: (identityId: string) => Promise<number>
    get: (identityId: string) => Promise<any>
  }

  export interface StateTransitionsAPI {
    documentsBatch: {
      create: (document: any, identityContractNonce: bigint) => Promise<any>
    }
    broadcast: (stateTransition: any) => Promise<void>
  }

  export interface SignerAPI {
    signAndBroadcast?: (stateTransition: any) => Promise<void>
    signStateTransition?: (stateTransition: any) => Promise<void>
    sign?: (stateTransition: any) => Promise<void>
    [key: string]: any // Allow for dynamic method discovery
  }

  export class DashPlatformSDK {
    documents: DocumentsAPI
    identities: IdentitiesAPI
    stateTransitions: StateTransitionsAPI
    signer: SignerAPI

    constructor(options?: { network?: string; signer?: any })
  }
}
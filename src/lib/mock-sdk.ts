import type { DashDocument, DashPlatformSDK } from '../types'

const mockDocuments: DashDocument[] = [
  {
    $id: '1',
    $ownerId: 'GWRSAVFMjXx8HpQFaNJMqBV7MBgMK4br5UESsB4S31Ec',
    $dataContractId: 'GWRSAVFMjXx8HpQFaNJMqBV7MBgMK4br5UESsB4S31Ec',
    $createdAt: Date.now() - 1000 * 60 * 5, // 5 minutes ago
    message: 'Hello from Incubator Weekly! 🚀',
  },
  {
    $id: '2',
    $ownerId: 'H9sjVAaB1yLq2xqrYGw1vkJZBFXNvZH8dPRxKvTfD6wE',
    $dataContractId: 'GWRSAVFMjXx8HpQFaNJMqBV7MBgMK4br5UESsB4S31Ec',
    $createdAt: Date.now() - 1000 * 60 * 15, // 15 minutes ago
    message: 'Testing the new Dash Platform extension. Works great!',
  },
  {
    $id: '3',
    $ownerId: 'FqHmFGVPg7YqN7Qb4jzfJgNXqUxtRhkdHC4fYnLShQQr',
    $dataContractId: 'GWRSAVFMjXx8HpQFaNJMqBV7MBgMK4br5UESsB4S31Ec',
    $createdAt: Date.now() - 1000 * 60 * 30, // 30 minutes ago
    message: 'Building decentralized social media on Dash Platform 💪',
  },
  {
    $id: '4',
    $ownerId: 'GWRSAVFMjXx8HpQFaNJMqBV7MBgMK4br5UESsB4S31Ec',
    $dataContractId: 'GWRSAVFMjXx8HpQFaNJMqBV7MBgMK4br5UESsB4S31Ec',
    $createdAt: Date.now() - 1000 * 60 * 60, // 1 hour ago
    message: 'The future is decentralized! Join us on this journey.',
  },
  {
    $id: '5',
    $ownerId: 'H9sjVAaB1yLq2xqrYGw1vkJZBFXNvZH8dPRxKvTfD6wE',
    $dataContractId: 'GWRSAVFMjXx8HpQFaNJMqBV7MBgMK4br5UESsB4S31Ec',
    $createdAt: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
    message: 'Just deployed my first data contract! 🎉',
  },
  {
    $id: '6',
    $ownerId: 'FqHmFGVPg7YqN7Qb4jzfJgNXqUxtRhkdHC4fYnLShQQr',
    $dataContractId: 'GWRSAVFMjXx8HpQFaNJMqBV7MBgMK4br5UESsB4S31Ec',
    $createdAt: Date.now() - 1000 * 60 * 60 * 3, // 3 hours ago
    message: 'Pro tip: Use the new extension for easy identity management!',
  },
  {
    $id: '7',
    $ownerId: 'GWRSAVFMjXx8HpQFaNJMqBV7MBgMK4br5UESsB4S31Ec',
    $dataContractId: 'GWRSAVFMjXx8HpQFaNJMqBV7MBgMK4br5UESsB4S31Ec',
    $createdAt: Date.now() - 1000 * 60 * 60 * 5, // 5 hours ago
    message: 'Dash Platform is revolutionizing how we build dApps.',
  },
  {
    $id: '8',
    $ownerId: 'H9sjVAaB1yLq2xqrYGw1vkJZBFXNvZH8dPRxKvTfD6wE',
    $dataContractId: 'GWRSAVFMjXx8HpQFaNJMqBV7MBgMK4br5UESsB4S31Ec',
    $createdAt: Date.now() - 1000 * 60 * 60 * 8, // 8 hours ago
    message: 'Anyone else excited about the upcoming features? 🔥',
  },
  {
    $id: '9',
    $ownerId: 'FqHmFGVPg7YqN7Qb4jzfJgNXqUxtRhkdHC4fYnLShQQr',
    $dataContractId: 'GWRSAVFMjXx8HpQFaNJMqBV7MBgMK4br5UESsB4S31Ec',
    $createdAt: Date.now() - 1000 * 60 * 60 * 12, // 12 hours ago
    message: 'Remember: Not your keys, not your identity! Stay safe out there.',
  },
  {
    $id: '10',
    $ownerId: 'GWRSAVFMjXx8HpQFaNJMqBV7MBgMK4br5UESsB4S31Ec',
    $dataContractId: 'GWRSAVFMjXx8HpQFaNJMqBV7MBgMK4br5UESsB4S31Ec',
    $createdAt: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
    message: 'Welcome to the decentralized future! This is just the beginning.',
  },
]

export const createMockSDK = (): DashPlatformSDK => {
  return {
    documents: {
      query: async (_dataContractId, _documentType, options) => {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Return mock documents
        const limit = options?.limit || 10
        return mockDocuments.slice(0, limit)
      },
      create: async () => {
        // Mock implementation
        await new Promise(resolve => setTimeout(resolve, 1000))
        return {}
      }
    },
    identities: {
      getIdentityContractNonce: async () => {
        return 1n
      }
    },
    stateTransitions: {
      documentsBatch: {
        create: async () => {
          return {}
        }
      },
      broadcast: async () => {
        // Mock broadcast
      }
    },
    signer: {
      signStateTransition: async () => {
        // Mock signing
        await new Promise(resolve => setTimeout(resolve, 1500))
      }
    }
  }
}
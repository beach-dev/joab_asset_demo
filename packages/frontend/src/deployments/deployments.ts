import { env } from '@config/environment'
import { SubstrateDeployment } from '@scio-labs/use-inkathon'

export enum ContractIds {
  Greeter = 'greeter',
  ExploraToken = 'ExploraToken',
}

export const getDeployments = async (): Promise<SubstrateDeployment[]> => {
  const networks = env.supportedChains
  const deployments = networks
    .map(async (network) => [
      {
        contractId: ContractIds.Greeter,
        networkId: network,
        abi: await import(`@inkathon/contracts/deployments/greeter/metadata.json`),
        address: (await import(`@inkathon/contracts/deployments/greeter/${network}.ts`)).address,
      },
      {
        contractId: ContractIds.ExploraToken,
        networkId: network,
        abi: await import(`./explora_token.json`),
        address: '5F8DbxH9MjPDQ4STdCrSkxinLc6abZSZUxdSKGCayNwV2zmb',
      },
    ])
    .reduce(async (acc, curr) => [...(await acc), ...(await curr)], [] as any)
  return deployments
}

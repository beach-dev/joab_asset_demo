import { Button, Card, FormControl, FormLabel, Input, Stack } from '@chakra-ui/react'
import { ContractIds } from '@deployments/deployments'
import {
  contractQuery,
  decodeOutput,
  useInkathon,
  useRegisteredContract,
} from '@scio-labs/use-inkathon'
import { contractTxWithToast } from '@utils/contractTxWithToast'
import { FC, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import 'twin.macro'

export const ExploraContractInteractions: FC = () => {
  const { api, activeAccount, isConnected, activeSigner } = useInkathon()
  const { contract, address: contractAddress } = useRegisteredContract(ContractIds.ExploraToken)
  const [assets, setAssets] = useState([])
  const [fetchIsLoading, setFetchIsLoading] = useState<boolean>()
  const [updateIsLoading, setUpdateIsLoading] = useState<boolean>()
  const form = useForm<{ newMessage: string }>()

  const fetchAssets = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/assets/`)
      const data = await response.json()
      setAssets(data)
    } catch (error) {
      console.error('Error fetching assets:', error)
    }
  }

  useEffect(() => {
    fetchAssets()
  }, [])

  // Update Greeting
  const updateGreeting = async () => {
    if (!activeAccount || !contract || !activeSigner || !api) {
      toast.error('Wallet not connected. Try again…')
      return
    }

    // Send transaction
    setUpdateIsLoading(true)
    try {
      await contractTxWithToast(api, activeAccount.address, contract, 'mint', {}, [
        2000,
        'test123',
        '0xcb7d700cd99ac07f2ff3eb81a21b6c6588230897b1a750bd8501699f32b1644657aea2bcc225f1c495ca0808b7282e3c2bbbe031e24a9934c235be309e90937f1b',
      ])
      form.reset()
    } catch (e) {
      console.error(e)
    } finally {
      setUpdateIsLoading(false)
      // fetchGreeting()
    }
  }

  async function handleMint(assetId: number) {
    if (!activeAccount || !contract || !activeSigner || !api) {
      toast.error('Wallet not connected. Try again…')
      return
    }
    // Send transaction
    setUpdateIsLoading(true)
    try {
      const tokenuriRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/apps/asset-tokenuri/${assetId}`,
      )
      const { tokenId, tokenUri } = await tokenuriRes.json()

      const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenUri, tokenId }),
      }
      const signatureRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/apps/sign-tokenuri`,
        requestOptions,
      )
      const signature = (await signatureRes.json()).signature

      await contractTxWithToast(api, activeAccount.address, contract, 'mint', {}, [
        tokenId,
        tokenUri,
        signature,
      ])

      const requestOptions2 = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId }),
      }
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/assets/update-mint`, requestOptions2)
      await fetchAssets()
    } catch (error) {
      console.error('Error minting NFT:', error)
    } finally {
      setUpdateIsLoading(false)
      // fetchGreeting()
    }
  }

  if (!contract) return null

  return (
    <>
      <div tw="flex grow flex-col space-y-4">
        <h2 tw="text-center font-mono text-gray-400">Asset List</h2>

        {/* Update Greeting */}
        {!!isConnected && (
          <Card variant="outline" p={4} bgColor="whiteAlpha.100">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th
                    style={{ textAlign: 'left' }}
                    className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Id
                  </th>
                  <th
                    style={{ textAlign: 'left' }}
                    className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Name
                  </th>
                  <th
                    style={{ textAlign: 'left' }}
                    className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Knowledge
                  </th>
                  <th
                    style={{ textAlign: 'left' }}
                    className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Level
                  </th>
                  <th
                    style={{ textAlign: 'left' }}
                    className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Rank
                  </th>
                  <th
                    style={{ textAlign: 'left' }}
                    className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Allegiance
                  </th>
                  <th
                    style={{ textAlign: 'left' }}
                    className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assets.map((asset) => (
                  <tr style={{ height: 60 }} className="h-16" key={asset.asset_id}>
                    <td className="px-6 py-4 whitespace-nowrap">{asset.asset_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{asset.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{asset.knowledge}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{asset.level}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{asset.rank}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{asset.allegiance}</td>
                    <td className="text-center">
                      {!asset.is_minted ? (
                        <Button
                          mt={4}
                          colorScheme="purple"
                          type="button"
                          onClick={() => handleMint(asset.asset_id)}
                        >
                          Submit
                        </Button>
                      ) : (
                        <div>Minted</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        {/* Contract Address */}
        <p tw="text-center font-mono text-xs text-gray-600">{contractAddress}</p>
      </div>
    </>
  )
}

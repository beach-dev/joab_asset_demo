import { ConnectButton } from '@components/web3/ConnectButton'
import { ExploraContractInteractions } from '@components/web3/ExploraContractInteractions'
import { useInkathon } from '@scio-labs/use-inkathon'
import type { NextPage } from 'next'
import { useEffect } from 'react'
import { toast } from 'react-hot-toast'
import 'twin.macro'

const HomePage: NextPage = () => {
  // Display `useInkathon` error messages (optional)
  const { error } = useInkathon()
  useEffect(() => {
    if (!error) return
    toast.error(error.message)
  }, [error])

  return (
    <>
      <div tw="mt-20 mb-10 flex flex-col items-center px-5">
        {/* Connect Wallet Button */}
        <ConnectButton />

        <div tw="mt-10 flex w-full flex-wrap items-start justify-center gap-4">
          {/* Greeter Read/Write Contract Interactions */}
          <ExploraContractInteractions />
        </div>
      </div>
    </>
  )
}

export default HomePage

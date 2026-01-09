import type { FC } from 'react'

interface Props {
  address: string
}

// External revoke/approval helper.
const RevokeButton: FC<Props> = ({ address }) => {
  // Open DeBank revoke page for the connected address.
  const openRevoke = () => {
    window.open(`https://debank.com/approve?address=${address}`, '_blank')
  }

  return (
    <button onClick={openRevoke} className="revoke-btn">
      一键撤销风险授权
    </button>
  )
}

export default RevokeButton

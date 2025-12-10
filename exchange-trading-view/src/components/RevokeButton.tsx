import type { FC } from 'react'

interface Props {
  address: string
}

const RevokeButton: FC<Props> = ({ address }) => {
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
import useStore from 'lib/store'
import { prettyBalance } from 'utils/common'
import { useIntl } from 'hooks/useIntl'
import Modal from 'components/Common/Modal'
import Button from 'components/Common/Button'
import { sentryCaptureException } from 'lib/sentry'
import { GAS_FEE, STORAGE_ADD_MARKET_FEE } from 'config/constants'
import JSBI from 'jsbi'
import { IconX } from 'components/Icons'
import { useState } from 'react'
import WalletHelper from 'lib/WalletHelper'
import { trackUpdateListingToken } from 'lib/ga'

const AcceptBidAuctionModal = ({ data, show, onClose, onSuccess, tokenType = `token` }) => {
	const { localeLn } = useIntl()
	const [isAcceptBid, setIsAcceptBid] = useState(false)
	const { currentUser, setTransactionRes } = useStore((state) => ({
		currentUser: state.currentUser,
		setTransactionRes: state.setTransactionRes,
	}))

	const hasStorageBalance = async () => {
		try {
			const currentStorage = await WalletHelper.viewFunction({
				methodName: 'storage_balance_of',
				contractId: process.env.MARKETPLACE_CONTRACT_ID,
				args: { account_id: currentUser },
			})

			const supplyPerOwner = await WalletHelper.viewFunction({
				methodName: 'get_supply_by_owner_id',
				contractId: process.env.MARKETPLACE_CONTRACT_ID,
				args: { account_id: currentUser },
			})

			const usedStorage = JSBI.multiply(
				JSBI.BigInt(parseInt(supplyPerOwner) + 1),
				JSBI.BigInt(STORAGE_ADD_MARKET_FEE)
			)

			if (JSBI.greaterThanOrEqual(JSBI.BigInt(currentStorage), usedStorage)) {
				return true
			}
			return false
		} catch (err) {
			sentryCaptureException(err)
		}
	}

	const onAcceptBidAuction = async () => {
		setIsAcceptBid(true)

		trackUpdateListingToken(data.token_id)

		const hasDepositStorage = await hasStorageBalance()

		try {
			const depositParams = { receiver_id: currentUser }

			const params = {
				nft_contract_id: data.contract_id,
				...(data.token_id
					? { token_id: data.token_id }
					: { token_series_id: data.token_series_id }),
				token_id: data.token_id,
			}

			let res
			if (hasDepositStorage) {
				res = await WalletHelper.signAndSendTransaction({
					receiverId: process.env.MARKETPLACE_CONTRACT_ID,
					actions: [
						{
							methodName: 'accept_bid',
							args: params,
							deposit: '1',
							gas: GAS_FEE,
						},
					],
				})
			} else {
				res = await WalletHelper.signAndSendTransaction({
					receiverId: process.env.MARKETPLACE_CONTRACT_ID,
					actions: [
						{
							methodName: 'storage_deposit',
							args: depositParams,
							deposit: STORAGE_ADD_MARKET_FEE,
							gas: GAS_FEE,
						},
						{
							methodName: 'accept_bid',
							args: params,
							deposit: '1',
							gas: GAS_FEE,
						},
					],
				})
			}
			if (res?.response) {
				onClose()
				setTransactionRes(res?.response)
				onSuccess && onSuccess()
			}
			setIsAcceptBid(false)
		} catch (err) {
			sentryCaptureException(err)
			setIsAcceptBid(false)
		}
	}

	return (
		<>
			<Modal isShow={show} close={onClose} closeOnBgClick={false} closeOnEscape={false}>
				<div className="max-w-sm w-full p-4 bg-gray-800  m-auto rounded-md relative">
					<div className="absolute right-0 top-0 pr-4 pt-4">
						<div className="cursor-pointer" onClick={onClose}>
							<IconX />
						</div>
					</div>
					<div>
						<div className="flex items-center space-x-2">
							<h1 className="text-2xl font-bold text-white tracking-tight">
								{'Accept Bid Auction'}
							</h1>
						</div>
						<p className="text-white mt-2">
							{localeLn('You are about to accept bid')} <b>{data?.metadata.title}</b>.
						</p>
						<div className="mt-4 text-center text-white opacity-90">
							<div className="flex justify-between">
								<div className="text-sm">{localeLn('Current Bid')}</div>
								<div>{prettyBalance(data.amount, 24)} Ⓝ</div>
							</div>
						</div>
						<p className="text-white opacity-80 mt-4 text-sm text-center px-4">
							{localeLn('RedirectedToconfirm')}
						</p>
						<div className="">
							<Button
								disabled={isAcceptBid}
								isLoading={isAcceptBid}
								className="mt-4"
								isFullWidth
								size="md"
								type="submit"
								onClick={onAcceptBidAuction}
							>
								{localeLn('Accept Bid')}
							</Button>
							<Button variant="ghost" size="md" isFullWidth className="mt-4" onClick={onClose}>
								{localeLn('Cancel')}
							</Button>
						</div>
					</div>
				</div>
			</Modal>
		</>
	)
}

export default AcceptBidAuctionModal

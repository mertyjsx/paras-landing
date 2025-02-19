import { useEffect, useRef, useState } from 'react'
import Card from 'components/Card/Card'
import { parseImgUrl, prettyBalance } from 'utils/common'
import Link from 'next/link'
import useStore from 'lib/store'
import { useRouter } from 'next/router'
import JSBI from 'jsbi'
import InfiniteScroll from 'react-infinite-scroll-component'

import TokenDetailModal from 'components/Token/TokenDetailModal'
import { useIntl } from 'hooks/useIntl'
import CardListLoader from 'components/Card/CardListLoader'
import MarketTokenModal from 'components/Modal/MarketTokenModal'
import CardListLoaderSmall from 'components/Card/CardListLoaderSmall'
import useToken from 'hooks/useToken'
import { formatNearAmount } from 'near-api-js/lib/utils/format'

const TokenList = ({
	name = 'default',
	tokens,
	fetchData,
	hasMore,
	displayType = 'large',
	volume,
}) => {
	const store = useStore()
	const containerRef = useRef()
	const animValuesRef = useRef(store.marketScrollPersist[name])
	const { localeLn } = useIntl()

	useEffect(() => {
		animValuesRef.current = store.marketScrollPersist[name]
	}, [store.marketScrollPersist[name]])

	useEffect(() => {
		return () => {
			if (containerRef.current) {
				containerRef.current.removeEventListener('wheel', handleScroll)
			}
		}
	}, [containerRef, store.marketScrollPersist[name]])

	const handleScroll = (e) => {
		e.preventDefault()

		var rawData = e.deltaY ? e.deltaY : e.deltaX
		var mouseY = Math.floor(rawData)

		var animationValue = animValuesRef.current || 0
		var newAnimationValue = animationValue - mouseY

		animateScroll(newAnimationValue)
	}

	const animateScroll = (newAnimationValue) => {
		let max = containerRef.current.lastElementChild.scrollWidth
		let win = containerRef.current.offsetWidth

		var bounds = -(max - win)

		if (newAnimationValue > 0) {
			store.setMarketScrollPersist(name, 0)
		} else if (newAnimationValue < bounds) {
			fetchData()
			store.setMarketScrollPersist(name, bounds)
		} else {
			store.setMarketScrollPersist(name, newAnimationValue)
		}
	}

	return (
		<div ref={containerRef} className="rounded-md p-4 md:p-0">
			{tokens.length === 0 && !hasMore && (
				<div className="w-full">
					<div className="m-auto text-2xl text-gray-600 font-semibold py-32 text-center">
						<div className="w-40 m-auto">
							<img src="/cardstack.png" className="opacity-75" />
						</div>
						<p className="mt-4">{localeLn('NoCards')}</p>
					</div>
				</div>
			)}
			<InfiniteScroll
				dataLength={tokens.length}
				next={fetchData}
				hasMore={hasMore}
				loader={
					displayType === 'large' ? (
						<CardListLoader length={4} />
					) : (
						<CardListLoaderSmall length={6} />
					)
				}
				className="-mx-4"
			>
				<div className="flex flex-wrap select-none">
					{tokens.map((token, idx) => (
						<TokenSingle
							key={`${token.contract_id}::${token.token_series_id}/${token.token_id}-${displayType}-${idx}`}
							initialData={token}
							displayType={displayType}
							volume={token.volume || volume?.[idx]}
						/>
					))}
				</div>
			</InfiniteScroll>
		</div>
	)
}

export default TokenList

const TokenSingle = ({ initialData, displayType = 'large', volume }) => {
	const { token, mutate } = useToken({
		key: `${initialData.contract_id}::${initialData.token_series_id}/${initialData.token_id}`,
		initialData: initialData,
	})

	const store = useStore()
	const router = useRouter()
	const [activeToken, setActiveToken] = useState(null)
	const [modalType, setModalType] = useState(null)
	const currentUser = useStore((state) => state.currentUser)
	const { localeLn } = useIntl()

	const price = token.price

	const onClickSeeDetails = async (choosenToken) => {
		const token = (await mutate()) || choosenToken
		router.push(
			{
				pathname: router.pathname,
				query: {
					...router.query,
					tokenId: token.token_id,
					contractId: token.contract_id,
				},
			},
			`/token/${token.contract_id}::${token.token_series_id}/${token.token_id}`,
			{
				shallow: true,
				scroll: false,
			}
		)
	}

	const onCloseModal = () => {
		setActiveToken(null)
		setModalType(null)
	}

	const actionButtonText = (token) => {
		const price = token.price

		if (token.owner_id === currentUser) {
			if (token.is_staked) {
				return localeLn('Unstake')
			}
			return localeLn('UpdateListing')
		}

		return price ? 'Buy Now' : 'Place Offer'
	}

	const actionButtonClick = (token) => {
		const price = token.price

		setActiveToken(token)
		if (token.owner_id === currentUser) {
			if (token.is_staked) {
				router.push('https://stake.paras.id')
				return
			}
			setModalType('updatelisting')
		} else {
			setModalType(price ? 'buy' : 'offer')
		}
	}

	return (
		<>
			<TokenDetailModal tokens={[token]} />
			<MarketTokenModal
				useNFTModal
				activeToken={activeToken}
				onCloseModal={onCloseModal}
				modalType={modalType}
				setModalType={setModalType}
			/>
			<div
				className={`${
					displayType === `large` ? `w-full md:w-1/3 lg:w-1/4 p-4` : `w-1/2 md:w-1/4 lg:w-1/6 p-2`
				} flex-shrink-0 relative`}
			>
				<Link href={`/token/${token.contract_id}::${token.token_series_id}/${token.token_id}`}>
					<a onClick={(e) => e.preventDefault()}>
						<div className="w-full m-auto">
							<Card
								imgUrl={parseImgUrl(token.metadata.media, null, {
									width: `600`,
									useOriginal: process.env.APP_ENV === 'production' ? false : true,
									isMediaCdn: token.isMediaCdn,
								})}
								imgBlur={token.metadata.blurhash}
								flippable
								token={{
									title: token.metadata.title,
									edition_id: token.edition_id,
									collection: token.metadata.collection || token.contract_id,
									copies: token.metadata.copies,
									creatorId: token.metadata.creator_id || token.contract_id,
									is_creator: token.is_creator,
									description: token.metadata.description,
									royalty: token.royalty,
									attributes: token.metadata.attributes,
									mime_type: token.metadata.mime_type,
								}}
							/>
						</div>
					</a>
				</Link>
				<div className={`px-1 relative ${displayType === 'large' ? `mt-4` : `mt-2`}`}>
					<div className="block">
						<p className="text-gray-400 text-xs">{localeLn('OnSale')}</p>
						<div className={`text-gray-100 ${displayType === 'large' ? `text-2xl` : `text-lg`}`}>
							{price ? (
								<div className="flex items-baseline space-x-1">
									<div className="truncate">{prettyBalance(price, 24, 2)} Ⓝ</div>
									{store.nearUsdPrice !== 0 && (
										<div className="text-xs text-gray-400 truncate">
											~ ${prettyBalance(JSBI.BigInt(price) * store.nearUsdPrice, 24, 4)}
										</div>
									)}
								</div>
							) : (
								<div className="line-through text-red-600">
									<span className="text-gray-100">{localeLn('SALE')}</span>
								</div>
							)}
						</div>
					</div>
					{volume && (
						<div
							className={`${
								displayType === 'large' ? `block` : `flex flex-col`
							} text-right absolute top-0 right-0`}
						>
							<p
								className={`${
									displayType === 'large' ? `block` : `hidden`
								} text-white opacity-80 md:text-sm`}
								style={{ fontSize: 11 }}
							>
								Volume Total
							</p>
							<p
								className={`${
									displayType === 'large' ? `hidden` : `block`
								} text-white opacity-80 md:text-sm`}
								style={{ fontSize: 11 }}
							>
								Volume Total
							</p>
							<p className="text-white opacity-80 md:text-base">{formatNearAmount(volume)} Ⓝ</p>
						</div>
					)}
					<div className="flex justify-between md:items-baseline">
						<p
							className={`font-bold text-white cursor-pointer hover:opacity-80 ${
								displayType === 'large' ? `text-base md:text-base` : `text-sm md:text-sm`
							} mb-1 md:mb-0`}
							onClick={() => actionButtonClick(token)}
						>
							{actionButtonText(token)}
						</p>
						<Link href={`/token/${token.contract_id}::${token.token_series_id}/${token.token_id}`}>
							<a
								onClick={(e) => {
									e.preventDefault()
									onClickSeeDetails(token)
								}}
								className={`text-gray-300 underline ${
									displayType === 'large' ? `text-sm md:text-sm` : `text-xs md:text-xs`
								}`}
							>
								{displayType === 'large' ? 'See Details' : 'More'}
							</a>
						</Link>
					</div>
				</div>
			</div>
		</>
	)
}

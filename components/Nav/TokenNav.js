import { useIntl } from 'hooks/useIntl'
import { useEffect, useRef, useState } from 'react'

const TokenNav = () => {
	const [openDetail, setOpenDetail] = useState(false)
	const tokenNavRef = useRef()

	const { localeLn } = useIntl()

	useEffect(() => {
		const onClickEv = (e) => {
			if (tokenNavRef.current?.contains && !tokenNavRef.current.contains(e.target)) {
				setOpenDetail(false)
			}
		}

		if (openDetail) {
			document.body.addEventListener('click', onClickEv)
		}

		return () => {
			document.body.removeEventListener('click', onClickEv)
		}
	}, [openDetail])

	const toggleTokenModal = () => {
		setOpenDetail(!openDetail)
	}

	return (
		<div ref={tokenNavRef} className="relative">
			<div className="cursor-pointer text-center" onClick={toggleTokenModal}>
				Token
			</div>
			{openDetail && (
				<div className="absolute right-0 max-w-xs w-48">
					<svg
						width="28"
						height="12"
						viewBox="0 0 28 12"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
						className="absolute right-2"
					>
						<path d="M16.1436 0L32.1436 16H0.143593L16.1436 0Z" fill="#26222C" />
					</svg>
					<div className="bg-dark-primary-2 w-full mt-3 p-1 rounded-md">
						<a
							className="p-2 button-wrapper rounded cursor-pointer block w-full"
							href="https://ipfs.fleek.co/ipfs/bafybeihu6atdada45rmx4sszny6sahrzas4tuzrpuufdcpe6b63r6ugdce"
							target="_blank"
						>
							{localeLn('Whitepaper')}
						</a>
						<a
							className="p-2 button-wrapper rounded cursor-pointer block w-full"
							href="https://app.ref.finance/#wrap.near|token.paras.near"
							target="_blank"
						>
							{localeLn('NavGetParas')}
						</a>
					</div>
				</div>
			)}
		</div>
	)
}

export default TokenNav

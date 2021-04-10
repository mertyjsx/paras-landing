import { useEffect, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import near from '../lib/near'
import useStore from '../store'
import axios from 'axios'
import { useRouter } from 'next/router'
import * as gtag from '../lib/gtag'
import cookie from '../lib/cookie'
import Modal from '../components/Modal'

import '../styles/font.css'
import '../styles/tailwind.css'
import 'pure-react-carousel/dist/react-carousel.es.css'
import 'croppie/croppie.css'

import ToastProvider from '../hooks/useToast'
import { SWRConfig } from 'swr'

function MyApp({ Component, pageProps }) {
	const store = useStore()
	const [isAgreed, setIsAgreed] = useState(true)
	const [checked, setChecked] = useState(false)

	const router = useRouter()

	const counter = async (url) => {
		// check cookie uid
		let uid = cookie.get('uid')
		// create cookie uid if not exist
		if (!uid) {
			uid = uuidv4()
			cookie.set('uid', uid, {
				expires: 30,
			})
		}
		const authHeader = await near.authToken()
		await axios.post(
			`${process.env.API_URL}/analytics`,
			{
				uid: uid,
				page: url,
			},
			{
				headers: {
					authorization: authHeader,
				},
			}
		)
	}

	useEffect(() => {
		const handleRouteChange = (url) => {
			if (window && window.gtag) {
				gtag.pageview(url)
			}
			if (window) {
				counter(url)
			}
		}

		if (process.env.APP_ENV === 'production') {
			router.events.on('routeChangeComplete', handleRouteChange)
		}

		return () => {
			router.events.off('routeChangeComplete', handleRouteChange)
		}
	}, [router.events])

	useEffect(() => {
		_init()
		checkAgreement()
	}, [])

	const onPressAgree = () => {
		localStorage.setItem('agree', 'true')
		setIsAgreed(true)
	}

	const checkAgreement = () => {
		const _agree = JSON.parse(localStorage.getItem('agree')) || false
		setIsAgreed(_agree)
	}

	const _init = async () => {
		await near.init()
		const currentUser = await near.currentUser
		const nearUsdPrice = await axios.get(
			'https://api.coingecko.com/api/v3/simple/price?ids=NEAR&vs_currencies=USD'
		)
		if (currentUser) {
			const userProfileResp = await axios.get(
				`${process.env.API_URL}/profiles?accountId=${currentUser.accountId}`
			)
			const userProfileResults = userProfileResp.data.data.results

			if (userProfileResults.length === 0) {
				const formData = new FormData()
				formData.append('bio', 'Citizen of Paras')
				formData.append('accountId', currentUser.accountId)

				try {
					const resp = await axios.put(
						`${process.env.API_URL}/profiles`,
						formData,
						{
							headers: {
								'Content-Type': 'multipart/form-data',
								authorization: await near.authToken(),
							},
						}
					)
					store.setUserProfile(resp.data.data)
				} catch (err) {
					console.log(err)
					store.setUserProfile({})
				}
			} else {
				const userProfile = userProfileResults[0]
				store.setUserProfile(userProfile)
			}

			store.setCurrentUser(currentUser.accountId)
			store.setUserBalance(currentUser.balance)
		}
		store.setNearUsdPrice(nearUsdPrice.data.near.usd)
		store.setInitialized(true)

		if (process.env.APP_ENV === 'production') {
			// initial route analytics
			const url = router.asPath

			if (window && window.gtag) {
				gtag.pageview(url)
			}
			if (window) {
				counter(url)
			}
		}
	}

	return (
		<div>
			<SWRConfig value={{}}>
				<ToastProvider>
					<Component {...pageProps} />
					{!isAgreed && (
						<Modal>
							<div className="max-w-sm w-full p-4 bg-gray-100 m-auto rounded-md">
								<p className="font-bold text-2xl mb-2">Terms and Conditions</p>
								<label>
									<input
										name="agree"
										type="checkbox"
										className="w-auto mr-2"
										checked={checked}
										onChange={(event) => setChecked(event.target.checked)}
									/>
									I agree to the Paras Terms and Conditions
								</label>
								<button
									disabled={!checked}
									onClick={onPressAgree}
									className="w-full outline-none h-12 mt-4 rounded-md bg-transparent text-sm font-semibold border-2 px-4 py-2 border-primary bg-primary text-gray-100"
								>
									Continue to Website
								</button>
							</div>
						</Modal>
					)}
				</ToastProvider>
			</SWRConfig>
		</div>
	)
}

export default MyApp

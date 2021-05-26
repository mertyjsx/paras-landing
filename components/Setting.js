import Axios from 'axios'
import { useEffect, useState } from 'react'
import { useToast } from '../hooks/useToast'
import near from '../lib/near'

const Setting = ({ close }) => {
	const toast = useToast()
	const [email, setEmail] = useState('')
	const [preferences, setPreferences] = useState([])
	const [initialSetting, setInitialSetting] = useState(null)
	const [isUpdating, setIsUpdating] = useState(false)

	useEffect(() => {
		fetchEmail()
	}, [])

	const fetchEmail = async () => {
		const resp = await Axios.get(`${process.env.API_URL}/credentials/mail`, {
			headers: {
				authorization: await near.authToken(),
			},
		})
		const data = await resp.data.data.results[0]
		if (data) {
			setEmail(data.email)
			setPreferences(data.preferences)
			setInitialSetting(data)
		}
	}

	const updateEmail = async () => {
		setIsUpdating(true)
		try {
			console.log('masuk')
			const resp = await Axios.put(
				`${process.env.API_URL}/credentials/mail`,
				{ email, preferences },
				{ headers: { authorization: await near.authToken() } }
			)
			const message = resp.data.data
			const toastMessage =
				message === 'verify-email'
					? 'Add email success, please check your email address to verify'
					: 'Update setting success'
			toast.show({
				text: (
					<div className="font-semibold text-center text-sm">
						{toastMessage}
					</div>
				),
				type: 'success',
				duration: 5000,
			})
			setIsUpdating(false)
			fetchEmail()
		} catch (err) {
			const message = err.response.data.message
			toast.show({
				text: (
					<div className="font-semibold text-center text-sm">{message}</div>
				),
				type: 'error',
				duration: 2500,
			})
			setIsUpdating(false)
		}
	}

	const updatePreferences = (preference) => {
		let temp = [...preferences]
		temp.includes(preference)
			? temp.splice(preferences.indexOf(preference), 1)
			: temp.push(preference)
		setPreferences(temp)
	}

	const checkIfSettingUnedited = () => {
		return (
			initialSetting?.email === email &&
			initialSetting?.preferences.length === preferences.length
		)
	}

	return (
		<>
			<div className="max-w-md w-full m-auto bg-dark-primary-2 rounded-md overflow-hidden p-4">
				<div className="m-auto">
					<div className="flex justify-between">
						<h1 className="text-3xl font-bold text-gray-100 tracking-tight mb-4">
							Setting
						</h1>
						<div onClick={close}>
							<svg
								className="cursor-pointer"
								width="16"
								height="16"
								viewBox="0 0 16 16"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									fillRule="evenodd"
									clipRule="evenodd"
									d="M8.00008 9.41423L3.70718 13.7071L2.29297 12.2929L6.58586 8.00001L2.29297 3.70712L3.70718 2.29291L8.00008 6.5858L12.293 2.29291L13.7072 3.70712L9.41429 8.00001L13.7072 12.2929L12.293 13.7071L8.00008 9.41423Z"
									fill="white"
								/>
							</svg>
						</div>
					</div>
					<div>
						<label className="font-bold text-xl my-2 text-gray-100">
							Add Email
						</label>
						<input
							type="text"
							name="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className={`resize-none h-auto focus:border-gray-100`}
							placeholder="Email"
						/>
					</div>
					<div className="text-gray-100 font-bold text-xl mt-4 my-2">
						Notification preferences
					</div>
					<div className="text-gray-100 flex justify-between items-center my-2">
						<div>
							<div className="text-lg">Newsletters</div>
							<div className="text-gray-100 opacity-75">
								Get first notified for any paras Info
							</div>
						</div>
						<Toggle
							id="newsletter"
							value={preferences.includes('newsletter')}
							onChange={() => updatePreferences('newsletter')}
						/>
					</div>
					<div className="text-gray-100 flex justify-between items-center my-2">
						<div>
							<div className="text-lg">NFT Drops</div>
							<div className="text-gray-100 opacity-75">
								Get first notified for upcoming drops!
							</div>
						</div>
						<Toggle
							id="nft-drops"
							value={preferences.includes('nft-drops')}
							onChange={() => updatePreferences('nft-drops')}
						/>
					</div>
					<button
						disabled={checkIfSettingUnedited() || email === ''}
						className="outline-none h-12 w-full mt-4 rounded-md bg-transparent text-sm font-semibold border-none px-4 py-2 bg-primary text-gray-100"
						onClick={updateEmail}
					>
						{isUpdating ? 'Saving...' : 'Save'}
					</button>
				</div>
			</div>
		</>
	)
}

export default Setting

const Toggle = ({ value, onChange, id }) => {
	return (
		<div className="mb-2">
			<div className="form-switch inline-block align-middle">
				<input
					type="checkbox"
					name={id}
					id={id}
					className="form-switch-checkbox"
					onChange={onChange}
					checked={value}
				/>
				<label className="form-switch-label" htmlFor={id} />
			</div>
		</div>
	)
}

export const prettyBalance = (balance, decimals = 18, len = 8) => {
	if (!balance) {
		return '0'
	}
	const diff = balance.toString().length - decimals
	const fixedPoint = len - Math.max(diff, 0)
	const fixedBalance = (balance / 10 ** decimals).toFixed(fixedPoint)
	const finalBalance = parseFloat(fixedBalance).toLocaleString()
	const [head, tail] = finalBalance.split('.')
	if (head == 0) {
		return `${head}.${tail.substring(0, len - 1)}`
	}
	const formattedHead = head.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
	return tail ? `${formattedHead}.${tail}` : formattedHead
}

export const readFileAsUrl = (file) => {
	const temporaryFileReader = new FileReader()

	return new Promise((resolve, reject) => {
		temporaryFileReader.onload = () => {
			resolve(temporaryFileReader.result)
		}
		temporaryFileReader.readAsDataURL(file)
	})
}

export const parseImgUrl = (url) => {
	if (!url) {
		return ''
	}
	const [protocol, path] = url.split('://')
	if (protocol === 'ipfs') {
		return `https://ipfs-gateway.paras.id/ipfs/${path}`
	}
	return url
}
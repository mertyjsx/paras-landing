import create from 'zustand'
import near from './lib/near'

const useStore = create((set, get) => ({
	currentUser: null,
	setCurrentUser: (user) => set(() => ({ currentUser: user })),
	initialized: false,
	setInitialized: (val) => set(() => ({ initialized: val })),
	marketScrollPersist: {},
	marketDataPersist: {},
	setMarketScrollPersist: (key, val) =>
		set(() => {
			const newMarket = {
				...get().marketScrollPersist,
				...{ [key]: val },
			}
			return {
				marketScrollPersist: newMarket,
			}
		}),
	setMarketDataPersist: (key, val) =>
		set(() => {
			const newMarket = {
				...get().marketDataPersist,
				...{ [key]: val },
			}
			return {
				marketDataPersist: newMarket,
			}
		}),
	nearUsdPrice: 0,
	setNearUsdPrice: (val) => set(() => ({ nearUsdPrice: val })),
	userBalance: {},
	setUserBalance: (val) => set(() => ({ userBalance: val })),
	userProfile: {},
	setUserProfile: (val) => set(() => ({ userProfile: val })),
}))

export default useStore

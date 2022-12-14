import browser from 'webextension-polyfill'
import * as U from './'

class Help {
	static goWeb(url: string) {
		browser.tabs.create({ url })
	}

	static formatAddress(address: string) {
		const str_1 = address.substring(0, 4)
		const str_2 = address.substring(address.length - 4)
		return `${str_1}......${str_2}`
	}

	private static handleGetParams(p: any) {
		let u = ''
		Object.keys(p).forEach(key => {
			console.log(key, p[key])
			u += `${key}=${p[key]}&`
		})
		u = u.substr(0, u.length - 1)

		return u
	}

	static async apiCall(apiInfo: U.ApiInfo<U.Params>) {
		let url = apiInfo.full_url ? apiInfo.URI : U.API + apiInfo.URI
		const req: U.RequestReq<any, any> = {
			method: apiInfo.method,
			headers: {
				'Content-Type': apiInfo.content_type || 'application/json'
			}
		}

		switch (apiInfo.method) {
			case 'GET':
				if (apiInfo.params) {
					url = url.concat('?', this.handleGetParams(apiInfo.params))
				}
				break
			case 'POST':
				req.body = JSON.stringify(apiInfo.params)
				break
		}
		try {
			const response = await fetch(url, req)
			return await response.json()
		} catch (error) {
			return Promise.reject()
		}
	}

	static copyTextToClipboard(text: string) {
		var copyFrom = document.createElement('textarea')
		copyFrom.textContent = text
		document.body.appendChild(copyFrom)
		copyFrom.select()
		document.execCommand('copy')
		copyFrom.blur()
		document.body.removeChild(copyFrom)
	}

	static getQueryVariable(variable: string, url: string) {
		let query = new URL(url).search.substring(1)
		let vars = query.split('&')
		for (let i = 0; i < vars.length; i++) {
			let pair = vars[i].split('=')
			if (pair[0] == variable) {
				return pair[1]
			}
		}
		return ''
	}

	static isInWhiteList(whiteList: U.Domain[], url: string) {
		return whiteList.some(v => {
			return url.includes(v.name.toLowerCase())
		})
	}

	static currentDomainIdx(whiteList: U.Domain[], url: string) {
		return whiteList.findIndex(v => {
			return url.includes(v.name.toLowerCase())
		})
	}

	static packageData(n: string) {
		let emptyList: U.ScoreList = []
		U.WHITE_LIST.categories.forEach(v => {
			emptyList.push({ name: v, score: 0 })
		})
		browser.storage.local.get(['score_list']).then(({ score_list }) => {
			if (!score_list) {
				browser.storage.local.set({ score_list: emptyList })
				return
			}
			let newList: U.ScoreList = score_list

			let index = U.WHITE_LIST.products.findIndex(v => {
				return v.name === n
			})
			if (index === -1) {
				return
			}
			const categoryList = U.WHITE_LIST.products[index].category
			let temp: number[] = []
			newList.forEach((v, index) => {

				if (
					categoryList.findIndex(s => {
						return s === v.name
					}) !== -1
				) {
					temp.push(index)
				}
			})
			temp.forEach((v) => {
				newList[v].score += 1
			})
			console.log(newList)
			browser.storage.local.set({ score_list: newList })
		})
	}

}

export default Help

const http = require('http')
const cheerio = require('cheerio')

function crawlHTML(url){
	return new Promise((resolve, reject) => {
		http.get(url, res => {
			let {statusCode} = res
			if(statusCode !== 200){
				res.resume()
				reject(new Error(`request failed with code: ${statusCode}`))
			}
			let chunks = ''
			res.on('data', chunk => { chunks += chunk })
			res.on('end', () => {
				resolve(cheerio.load(chunks))
			})
		})
	})
}

crawlHTML('http://www.lssdjt.com').then(parseTodayonHistory).catch(err => {

})
crawlHTML('http://wufazhuce.com').then(parseTheOne).catch(err => {

})

function parseTodayonHistory($){
	let data = {
				date: '',
				illus: [],
				desc: []
			}
	data.date = $('div.info').text()
	$('div.main li').each((index, element) => {
		let anchor = $(element).children('a'),
				ref = anchor.attr('rel'),
				text = anchor.text()
		if(ref){
			illus.push({
				img: ref,
				text
			})
		}else {
			desc.push(text)
		}
	})
	return data
}

function parseTheOne($){
	let today, img, type, text
	today = $('.carousel-inner').children('.active')
	img = today.find('.fp-one-imagen').attr('src')
	type = today.find('.fp-one-imagen-footer').text().trim()
	text = today.find('.fp-one-cita').text().trim()
	return {
		img,
		type,
		text
	}
}

function parseJikipedia($){
	
}
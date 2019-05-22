const http = require('http')
const https = require('https')
const cheerio = require('cheerio')
const ejs = require('ejs')
const path = require('path')
const nodemailer = require('nodemailer')

function crawlHTML(url){
	return new Promise((resolve, reject) => {
		let proxy = http
		if(/^\s*https:\/\//.test(url)) proxy = https
		proxy.get(url, res => {
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
function
let parser = [parseTodayonHistory, parseTheOne, parseJikipedia],
		promises = ['http://www.lssdjt.com', 'http://wufazhuce.com', 'https://jikipedia.com'].map((item, index) => {
			return crawlHTML(item).then(res => {
				return parser[index](res)
			})
		})
Promise.all(promises).then(res => {
	let html = ejs.renderFile(path.resolve(__dirname, 'email.ejs'), {
		history: res[0],
		theOne: res[1],
		jikipedia: res[2]
	})
}).catch(err => {
	console.log(err)
})

function parseTodayonHistory($){
	let data = {
				date: '',
				illus: [],
				desc: []
			}
	data.date = $('div.info').text()
	$('ul.list li').each((index, element) => {
		let anchor = $(element).children('a'),
				ref = anchor.attr('rel'),
				text = anchor.text()
		if(ref){
			data.illus.push({
				img: ref,
				text
			})
		}else {
			data.desc.push(text)
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
	let range = $('.masonry').children(),
			random = Math.floor(Math.random() * range.length),
			selected = range.eq(random).find('.card-content').children('.card-middle'),
			title, content
	title = selected.find('.title').text().trim()
	content = selected.find('.brax-render').text()
	return {
		title,
		content
	}
}
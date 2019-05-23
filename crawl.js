const http = require('http')
const https = require('https')
const path = require('path')
const urlParser = require('url')
const cheerio = require('cheerio')
const ejs = require('ejs')
const nodemailer = require('nodemailer')
const nodeschedule = require('node-schedule')

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

let parser = [parseTodayonHistory, parseTheOne, parseJikipedia],
		promises = [ 'https://jikipedia.com'].map((item, index) => {
			return crawlHTML(item)
		})
setTimeout(function(){
	console.log(promises)
}, 2000)
http.createServer((request, response) => {
	if(urlParser.parse(request.url).pathname !== '/inprocess'){
		response.statusCode = 404
		response.statusMessage = 'Not Found'
		return response.end()
	}
	Promise.all(promises)
		.then(res => {
			return ejs.renderFile(path.resolve(__dirname, 'email.ejs'), {
				history: res[0],
				theOne: res[1],
				jikipedia: res[2]
			})
		})
		.then(res => {
			response.end(res)
		})
		.catch(err => {
			console.log(err)
		})
}).listen(9000)

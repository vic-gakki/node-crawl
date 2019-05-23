const http = require('http')
const https = require('https')
const path = require('path')
const urlParser = require('url')
const cheerio = require('cheerio')
const ejs = require('ejs')
const nodemailer = require('nodemailer')
const nodeschedule = require('node-schedule')

function crawlHTML(options){
	return new Promise((resolve, reject) => {
		let proxy = http,
				{url, parserFn} = options
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
				chunks = parserFn(cheerio.load(chunks))
				resolve(chunks)
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

function runServer(promises){
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
}

function mail(html){
	mailOptions.html = html
	return transport.sendMail(mailOptions)
}

function render(filePath, params){
	return ejs.renderFile(path.resolve(__dirname, filePath), params)
}

async function start(){
	let promises = crawlTarget.map(item => {
		return crawlHTML(item)
	})
	let res = await Promise.all(promises)
	let html = await render('email.ejs', {
		history: res[0],
		theOne: res[1],
		jikipedia: res[2]
	})
	let mailStatus = await mail(html)
	return mailStatus
}

function scheduleEmail(){
	console.log('start schedule')
	nodeschedule.scheduleJob('0 30 9 * * *', () => {
		start().catch(err => {
			console.log(err)
		})
	})
}
let crawlTarget = [
			{url: 'http://www.lssdjt.com', parserFn: parseTodayonHistory},
			{url: 'http://wufazhuce.com', parserFn: parseTheOne},
			{url: 'https://jikipedia.com', parserFn: parseJikipedia},
		],
		//邮件相关配置
		transport = nodemailer.createTransport({
			service: 'qq',
			port: 465,
			secureConnection: true,
			auth: {
				user: 'xxx@qq.com',
				pass: 'xxxxxx'
			}
		}),
		mailOptions = {
			from: 'xxx',
			to: 'xxx@qq.com',
			subject: 'xxx'
		}
scheduleEmail()






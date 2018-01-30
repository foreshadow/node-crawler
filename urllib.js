const http = require('http')
const https = require('https')
const urlParse = require('url').parse

function urlResolve(url, base) {
    url = urlParse(url)
    base = urlParse(base)
    if (url.host) {
        return url
    }
    let path = base.path.split('/')
    path.pop()
    if (url.path == null) {
        url.path = ''
    }
    for (let to of url.path.split('/')) {
        if (to === '') {
            path = ['']
        } else if (to === '..') {
            path.pop()
        } else if (to !== '.') {
            path.push(to)
        }
    }
    return urlParse(`${base.protocol}//${base.host}${path.join('/')}`)
}

function urlGet(url, cb) {
    let protocol
    switch (urlParse(url).protocol) {
        case 'http:':
            protocol = http
            break
        case 'https:':
            protocol = https
            break
        default:
            // console.log(`Unknown protocol: url = ${url}`)
            return
    }
    protocol.get(url, res => {
        let data = ''
        res.on('data', chunk => {
            data += chunk
        }).on('end', () => {
            cb(null, data)
        })
    }).on('error', err => {
        cb(err)
    })
}

module.exports = {
    urlGet,
    urlParse,
    urlResolve,
}

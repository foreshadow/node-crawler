const fs = require('fs')
const { urlGet, urlParse, urlResolve } = require('./urllib')
const cheerio = require('cheerio')

function mkdirRSync(path) {
    path = path.split('/')
    for (let i = 1; i < path.length; i += 1) {
        let dir = path.slice(0, i).join('/')
        try {
            fs.mkdirSync(dir)
        } catch (err) {
        }
    }
}

let crawled = {}
let waiting = []
let running = []

class Page {
    constructor(url, path) {
        this.remote = url
        this.url = urlParse(url)
        this.path = path
    }

    prepare() {
        if (cooldown) {
            waiting.push(this)
            return
        } else {
            this.crawl()
        }
    }

    crawl() {
        if (crawled[this.remote]) {
            return
        } else {
            crawled[this.remote] = this
        }
        this.load(() => {
            if (this.path.endsWith('.html')) {
                this.extractLinks()
            }
            this.save(err => {
                console.log(`${this.url.href} => ${localPath}${this.path}`)
            })
        })
    }

    load(cb) {
        urlGet(this.remote, (err, data) => {
            if (err) {
                console.log(err.Error.split('\n')[0])
            } else {
                this.data = data
                cb()
            }
        })
    }

    extractLinks() {
        let $ = cheerio.load(this.data)
        for (let [nodes, attr] of [
            [$('link'), 'href'], [$('a'), 'href'], [$('script'), 'src'], [$('img'), 'src'],
        ]) {
            nodes.each((i, item) => {
                let url = item.attribs[attr]
                if (url) {
                    for (let prefix of ['mailto:', 'javascript:']) {
                        if (url.startsWith(prefix)) {
                            return
                        }
                    }
                    let newLink = this.handleLink(urlParse(url))
                    if (newLink) {
                        $(item).attr(attr, this.relativePath(newLink))
                        $(item).attr('crossorigin', null)
                        $(item).attr('integrity', null)
                    }
                }
            })
        }
        this.data = $.html()
    }

    handleLink(url) {
        let path
        if (url.host && url.host != host || this.url.host != host) {
            let allowed = false
            for (let suffix of ['.js', '.css']) {
                if (url.path.endsWith(suffix)) {
                    allowed = true
                    path = Page.toLocalPath(url)
                }
            }
            if (allowed === false) {
                return false
            }
        } else {
            url = urlResolve(url, this.url)
            path = url.path
            path = path.replace(/[\?=&]/g, '/')
            if (path.endsWith('/')) {
                path += 'index.html'
            } else if (path.indexOf('.') === -1) {
                path += '.html'
            }
        }
        new Page(url.href, path).prepare()
        return path
    }

    save(cb) {
        let file = `${localPath}${this.path}`
        mkdirRSync(file)
        fs.writeFile(file, this.data, (err) => {
            if (cb) {
                cb(err)
            }
        })
    }

    relativePath(path) {
        let base = this.path.split('/')
        let to = path.split('/')
        while (base.length && to.length && base[0] === to[0]) {
            base = base.slice(1)
            to = to.slice(1)
        }
        while (base.length > 1) {
            base = base.slice(1)
            to = ['..', ...to]
        }
        return to.join('/')
    }

    static toLocalPath(url) {
        return `/../extern/${url.host.replace(/\./g, '-')}${url.path}`
    }
}

let localPath = './data/www'
let url = urlParse('http://www.cs.usfca.edu/~galles/visualization/Algorithms.html')
let root = `${url.protocol}//${url.host}`
let host = url.host
let cooldown = 1000

console.log(`[Url]  ${url.href}`)
console.log(`[Root] ${root}`)
console.log(`[Host] ${host}`)

new Page(url, '/index.html').prepare()

function next() {
    if (waiting.length == 0 && running.length == 0) {
        process.exit(0)
    }
    job = waiting.pop()
    running.push(job)
    job.crawl()

    setTimeout(next, cooldown)
}

next()

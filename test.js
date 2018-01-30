const { urlResolve } = require('./urllib')

function assertEqual(expression1, expression2) {
    if (expression1 !== expression2) {
        console.log(`Assert failed: ${expression1} != ${expression2}`)
    } else {
        console.log('Assert OK')
    }
}

assertEqual(urlResolve('../css/app.css', 'https://host.com/path/to').href, 'https://host.com/css/app.css')
assertEqual(urlResolve('index', 'https://host.com/path/to').href, 'https://host.com/path/index')
assertEqual(urlResolve('./index', 'https://host.com/path/to').href, 'https://host.com/path/index')
assertEqual(urlResolve('https://another.host/path', 'https://host.com/path/to').href, 'https://another.host/path')

module.exports = ({ host, token }) => require('got').extend({
  headers: {
    Authorization: `Bearer ${token}`
  },
  prefixUrl: `https://${host}/api/v1`,
  responseType: 'json',
  resolveBodyOnly: true,
  hooks: {
    beforeRequest: [
      ({ method, url }) => console.error(`${method} ${url}`)
    ]
  },
  searchParams: {
    per_page: 1000
  },
  pagination: {
    stackAllItems: false,
    paginate: (response, allItems, currentItems) => {
      const links = response.headers.link.split(/\s*,\s*/)

      for (const link of links) {
        const match = link.match(/^<(?<url>[^>]+)>(;\s*[^;]+)*;\s*rel="(?<rel>[^"]+)"/)

        if (match) {
          const { url, rel } = match.groups

          if (rel === 'next') {
            return {
              searchParams: new URLSearchParams(url.substr(url.indexOf('?')))
            }
          }
        }
      }

      return false
    }
  }
})

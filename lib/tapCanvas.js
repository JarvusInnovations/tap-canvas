// dependencies

// library
function writeSchema (stream, keyProperties, properties) {
  console.log(JSON.stringify({
    type: 'SCHEMA',
    stream,
    schema: { properties },
    key_properties: keyProperties
  }))
}

function writeRecord (stream, record) {
  console.log(JSON.stringify({
    type: 'RECORD',
    stream,
    record
  }))
}

// function writeState (value) {
//   console.log(JSON.stringify({
//     type: 'STATE',
//     value
//   }))
// }

async function tapCanvas ({ host, token, account }, state, { streams }) {
  const canvas = require('./api')({ host, token })

  // compile selected paths
  const selectedPaths = new Set()

  for (const { stream, metadata: streamMetadata = [] } of streams) {
    for (const { breadcrumb, metadata: { selected = false } } of streamMetadata) {
      if (selected) {
        selectedPaths.add(`${stream}/${breadcrumb.join('/')}`)
      }
    }
  }

  // collect users
  writeSchema('users', ['id'], {
    id: { type: 'integer' },
    logins: { sort: 'id' }
  })

  const users = await canvas.paginate(`accounts/${account}/users`)

  for await (const user of users) {
    if (selectedPaths.has('users/properties/logins')) {
      user.logins = await canvas.get(`users/${user.id}/logins`)
    }

    writeRecord('users', user)
  }
}

// exports
module.exports = tapCanvas

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

async function tapCanvas ({
  host,
  token,
  account
}) {
  const canvas = require('./api')({ host, token })

  // collect users
  writeSchema('users', ['id'], {
    id: { type: 'integer' }
  })

  const users = await canvas.paginate(`accounts/${account}/users`)

  for await (const user of users) {
    writeRecord('users', user)
  }
}

// exports
module.exports = tapCanvas

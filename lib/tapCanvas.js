// dependencies

// constants
const COURSES_INCLUDES = [
  'syllabus_body',
  'term',
  'course_progress',
  'storage_quota_used_mb',
  'total_students',
  'teachers',
  'account_name',
  'concluded'
]

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

  // collect courses
  writeSchema('courses', ['id'], {
    id: { type: 'integer' }
  })

  const coursesSearchParams = new URLSearchParams({ state: 'all' })

  for (const field of COURSES_INCLUDES) {
    if (selectedPaths.has(`courses/properties/${field}`)) {
      coursesSearchParams.append('include[]', field)
    }
  }

  const courses = await canvas.paginate(`accounts/${account}/courses`, {
    searchParams: coursesSearchParams
  })

  for await (const course of courses) {
    writeRecord('courses', course)
  }
}

// exports
module.exports = tapCanvas

// dependencies

// constants
const COURSES_INCLUDES = [
  'account_name',
  'concluded',
  'course_progress',
  'sections',
  'storage_quota_used_mb',
  'syllabus_body',
  'teachers',
  'term',
  'total_students'
]

const SECTION_INCLUDES = [
  'avatar_url',
  'enrollments',
  'passback_status',
  'students',
  'total_students'
]

const ENROLLMENT_TYPES = [
  'StudentEnrollment',
  'TeacherEnrollment',
  'TaEnrollment',
  'DesignerEnrollment',
  'ObserverEnrollment'
]

const ENROLLMENT_STATES = [
  'active',
  'invited',
  'creation_pending',
  'deleted',
  'rejected',
  'completed',
  'inactive',
  'current_and_invited',
  'current_and_future',
  'current_and_concluded'
]

const ENROLLMENT_INCLUDES = [
  'avatar_url',
  'group_ids',
  'locked',
  'observed_users',
  'can_be_removed',
  'uuid',
  'current_points'
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

  // collect terms
  writeSchema('terms', ['id'], {
    id: { type: 'integer' }
  })

  const terms = await canvas.paginate(`accounts/${account}/terms`, {
    pagination: {
      transform: response => response.body.enrollment_terms
    },
    searchParams: { workflow_state: 'all', 'include[]': 'overrides' }
  })

  for await (const term of terms) {
    writeRecord('terms', term)
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
  const activeCourseIds = new Set()

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

    if (course.workflow_state !== 'deleted') {
      activeCourseIds.add(course.id)
    }
  }

  // collect sections
  const sectionIds = new Set()

  writeSchema('sections', ['course_id', 'id'], {
    id: { type: 'integer' },
    course_id: { type: 'integer' }
  })

  const sectionsSearchParams = new URLSearchParams()

  for (const field of SECTION_INCLUDES) {
    if (selectedPaths.has(`sections/properties/${field}`)) {
      sectionsSearchParams.append('include[]', field)
    }
  }

  for (const courseId of activeCourseIds) {
    const sections = await canvas.paginate(`courses/${courseId}/sections`, {
      searchParams: sectionsSearchParams
    })

    for await (const section of sections) {
      writeRecord('sections', section)
      sectionIds.add(section.id)
    }
  }

  // collect enrollments
  writeSchema('enrollments', ['course_section_id', 'role', 'user_id'], {
    id: { type: 'integer' },
    course_id: { type: 'integer' },
    course_section_id: { type: 'integer' },
    role: { type: 'string', enum: ENROLLMENT_TYPES }
  })

  const enrollmentsSearchParams = new URLSearchParams()

  for (const state of ENROLLMENT_STATES) {
    if (state !== 'deleted') {
      enrollmentsSearchParams.append('state[]', state)
    }
  }

  for (const field of ENROLLMENT_INCLUDES) {
    if (selectedPaths.has(`enrollments/properties/${field}`)) {
      enrollmentsSearchParams.append('include[]', field)
    }
  }

  for (const sectionId of sectionIds) {
    const enrollments = await canvas.paginate(`sections/${sectionId}/enrollments`, {
      searchParams: enrollmentsSearchParams
    })

    for await (const enrollment of enrollments) {
      writeRecord('enrollments', enrollment)
    }
  }
}

// exports
module.exports = tapCanvas

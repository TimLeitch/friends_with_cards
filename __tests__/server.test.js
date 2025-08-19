const request = require('supertest')
const app = require('../backend/server')

describe('Server API', () => {
  test('GET / should return welcome message', async () => {
    const response = await request(app).get('/')
    expect(response.status).toBe(200)
    expect(response.body.message).toBe('Friends with Cards API')
  })

  test('GET /health should return health status', async () => {
    const response = await request(app).get('/health')
    expect(response.status).toBe(200)
    expect(response.body.status).toBe('OK')
    expect(response.body.timestamp).toBeDefined()
  })

  test('GET /nonexistent should return 404', async () => {
    const response = await request(app).get('/nonexistent')
    expect(response.status).toBe(404)
    expect(response.body.error).toBe('Route not found')
  })
})

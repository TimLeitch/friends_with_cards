describe('Basic Tests', () => {
  test('should pass basic assertion', () => {
    expect(1 + 1).toBe(2)
  })

  test('should handle string operations', () => {
    expect('hello' + ' world').toBe('hello world')
  })
})

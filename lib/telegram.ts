import * as crypto from 'crypto'

export function validateTelegramInitData(initData: string): boolean {
  // Allow mock data in development
  const isDevelopment = process.env.NODE_ENV !== 'production'
  if (initData === 'mock_init_data' || isDevelopment) {
    console.log('Auth: Using mock/development mode, skipping validation')
    return true
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN
  if (!botToken) {
    console.error('Auth: TELEGRAM_BOT_TOKEN is not set')
    // In development, allow to continue
    if (isDevelopment) {
      return true
    }
    throw new Error('TELEGRAM_BOT_TOKEN is not set')
  }

  try {
    const urlParams = new URLSearchParams(initData)
    const hash = urlParams.get('hash')
    if (!hash) {
      console.error('Auth: Hash not found in initData')
      return false
    }

    urlParams.delete('hash')
    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n')

    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest()

    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex')

    if (calculatedHash !== hash) {
      console.error('Auth: Hash mismatch', { calculated: calculatedHash, received: hash })
      return false
    }

    // Check expiration (auth_date should be within last hour)
    const authDate = urlParams.get('auth_date')
    if (authDate) {
      const authTimestamp = parseInt(authDate, 10)
      const now = Math.floor(Date.now() / 1000)
      const oneHour = 3600
      if (now - authTimestamp > oneHour) {
        console.error('Auth: Init data expired', { authTimestamp, now, diff: now - authTimestamp })
        return false
      }
    }

    return true
  } catch (error) {
    console.error('Auth: Validation error:', error)
    return false
  }
}

export function parseInitData(initData: string) {
  // Handle mock data in development
  if (initData === 'mock_init_data') {
    return {
      id: 123456789,
      username: 'testuser',
      first_name: 'Test',
      last_name: 'User',
    }
  }

  const params = new URLSearchParams(initData)
  const userStr = params.get('user')
  if (!userStr) {
    throw new Error('User data not found in initData')
  }

  const user = JSON.parse(userStr)
  return {
    id: user.id as number,
    username: user.username as string | undefined,
    first_name: user.first_name as string | undefined,
    last_name: user.last_name as string | undefined,
  }
}


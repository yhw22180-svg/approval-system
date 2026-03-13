import { createContext, useContext, useState, useEffect } from 'react'
import API from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { 
      const savedUser = localStorage.getItem('user')
      return (savedUser && savedUser !== 'undefined' && savedUser !== 'null') ? JSON.parse(savedUser) : null 
    } catch { return null }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token')
      if (token && token !== 'undefined' && token !== 'null') {
        try {
          const res = await API.get('/auth/me')
          setUser(res.data)
          localStorage.setItem('user', JSON.stringify(res.data))
        } catch (error) {
          console.error("초기 인증 확인 실패:", error)
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          setUser(null)
        }
      }
      setLoading(false)
    }
    checkAuth()
  }, [])

  const login = async (email, password) => {
    try {
      const res = await API.post('/auth/login', { email, password })
      
      // 백엔드 응답 구조(access_token 또는 token)에 모두 대응
      const token = res.data.access_token || res.data.token
      const userData = res.data.user

      if (token) {
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(userData))
        setUser(userData)
        return userData
      } else {
        throw new Error('응답에 토큰이 없습니다.')
      }
    } catch (err) {
      throw err
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    window.location.href = '/login'
  }

  const refreshUser = async () => {
    try {
      const res = await API.get('/auth/me')
      setUser(res.data)
      localStorage.setItem('user', JSON.stringify(res.data))
    } catch (err) {
      console.error("사용자 정보 갱신 실패")
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, refreshUser }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
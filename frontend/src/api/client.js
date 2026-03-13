import axios from 'axios'

const API = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

// 요청 인터셉터: JWT 토큰 자동 첨부
API.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  // 'undefined' 문자열이 들어오는 경우를 방어
  if (token && token !== 'undefined' && token !== 'null') {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 응답 인터셉터: 401 시 대응 (무한 루프 방지)
API.interceptors.response.use(
  res => res,
  err => {
    const isLoginPath = window.location.pathname.includes('/login')
    const isLoginRequest = err.config?.url?.includes('/auth/login')

    // [수정] 현재 로그인 페이지가 아니고, 로그인 요청 자체가 실패한 게 아닐 때만 튕김
    if (err.response?.status === 401 && !isLoginPath && !isLoginRequest) {
      console.warn("인증 만료: 로그인 페이지로 이동합니다.")
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default API
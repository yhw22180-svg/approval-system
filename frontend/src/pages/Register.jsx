import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import API from '../api/client'
import toast from 'react-hot-toast'
import { FiFileText } from 'react-icons/fi'

const POSITIONS = ['사원', '주임', '대리', '과장', '차장', '부장', '이사', '상무', '전무', '대표']

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', password2: '', department: '', position: '', phone: '' })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.department.trim()) { toast.error('부서를 입력해주세요.'); return }
    if (form.password !== form.password2) { toast.error('비밀번호가 일치하지 않습니다.'); return }
    if (form.password.length < 6) { toast.error('비밀번호는 6자 이상이어야 합니다.'); return }
    setLoading(true)
    try {
      await API.post('/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password,
        department: form.department,
        position: form.position,
        phone: form.phone
      })
      toast.success('가입되었습니다. 로그인해주세요.')
      navigate('/login')
    } catch (err) {
      const msg = err.response?.data?.detail
      if (msg === '이미 사용 중인 이메일입니다.') {
        toast.error('이미 사용 중인 이메일입니다.')
      } else if (err.code === 'ERR_NETWORK' || !err.response) {
        toast.error('서버에 연결할 수 없습니다. start.bat을 먼저 실행해주세요!')
      } else {
        toast.error(msg || '회원가입에 실패했습니다.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 rounded-2xl mb-4">
            <FiFileText className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white">회원가입</h1>
          <p className="text-slate-400 text-sm mt-1">전자결재 시스템 계정을 만드세요</p>
        </div>
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">이름 *</label>
                <input name="name" value={form.name} onChange={handleChange} required placeholder="홍길동"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">전화번호</label>
                <input name="phone" value={form.phone} onChange={handleChange} placeholder="010-0000-0000"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">이메일 *</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} required placeholder="name@company.com"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">부서 *</label>
                <input name="department" value={form.department} onChange={handleChange} required
                  placeholder="예) 영업팀, 개발팀"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">직급 *</label>
                <select name="position" value={form.position} onChange={handleChange} required
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white">
                  <option value="">선택</option>
                  {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">비밀번호 *</label>
              <input name="password" type="password" value={form.password} onChange={handleChange} required placeholder="6자 이상"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">비밀번호 확인 *</label>
              <input name="password2" type="password" value={form.password2} onChange={handleChange} required placeholder="비밀번호 재입력"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 mt-2">
              {loading ? '가입 중...' : '가입하기'}
            </button>
          </form>
          <p className="text-center text-sm text-slate-500 mt-4">
            이미 계정이 있으신가요? <Link to="/login" className="text-blue-600 hover:underline font-medium">로그인</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

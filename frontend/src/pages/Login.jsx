import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogIn, Mail, Lock, Cross } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import GlassCard from '../components/common/GlassCard'
import BrandLogo from '../components/common/BrandLogo'

export default function Login() {
  const [formData, setFormData] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      await login(formData.username, formData.password)
      toast.success('Welcome back!')
      navigate('/portal')
    } catch (err) {
      console.error('Login error:', err)
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-crm-black via-crm-dark to-crm-black" />
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-crm-purple/30 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-crm-purple-light/20 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <BrandLogo size="lg" priority />
            </div>
            <h1 className="text-3xl font-bold text-crm-white mb-2">Welcome Back</h1>
            <p className="text-crm-gray">Sign in to continue your journey</p>
          </div>

          <GlassCard className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-crm-gray-light mb-2">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-crm-gray" />
                  </div>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-crm-black/50 border border-white/10 rounded-xl text-crm-white placeholder-crm-gray focus:outline-none focus:border-crm-purple focus:ring-1 focus:ring-crm-purple transition-all"
                    placeholder="Enter your username"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-crm-gray-light mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-crm-gray" />
                  </div>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-crm-black/50 border border-white/10 rounded-xl text-crm-white placeholder-crm-gray focus:outline-none focus:border-crm-purple focus:ring-1 focus:ring-crm-purple transition-all"
                    placeholder="Enter your password"
                  />
                </div>
              </div>

              {/* Remember & Forgot */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center">
                  <input type="checkbox" className="w-4 h-4 rounded border-white/10 bg-crm-black/50 text-crm-purple focus:ring-crm-purple" />
                  <span className="ml-2 text-crm-gray">Remember me</span>
                </label>
                <Link to="/forgot-password" className="text-crm-purple hover:text-crm-purple-light transition-colors">
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full shield-button py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-crm-black/30 border-t-crm-black rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    Sign In
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-crm-dark text-crm-gray">New to CRM?</span>
              </div>
            </div>

            {/* Register Link */}
            <Link
              to="/register"
              className="block w-full text-center py-3 rounded-xl border border-white/20 text-crm-white hover:bg-white/5 transition-all font-medium"
            >
              Create an Account
            </Link>
          </GlassCard>

          {/* Back Home */}
          <div className="text-center mt-6">
            <Link to="/" className="text-sm text-crm-gray hover:text-crm-white transition-colors">
              ← Back to Home
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

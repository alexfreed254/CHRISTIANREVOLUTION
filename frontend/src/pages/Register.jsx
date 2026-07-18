import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { UserPlus, Mail, Lock, User, Globe, MapPin, Phone, Cross } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import GlassCard from '../components/common/GlassCard'
import BrandLogo from '../components/common/BrandLogo'

const CONTINENTS = ['Africa', 'Asia', 'Europe', 'North America', 'South America', 'Oceania']

export default function Register() {
  const [formData, setFormData] = useState({
    full_name: '',
    continent: '',
    country: '',
    city: '',
    village: '',
    email: '',
    phone: '',
    username: '',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const { confirmPassword, ...registerData } = formData
      await register(registerData)
      toast.success('Welcome to Christ Revolution Movement!')
      navigate('/portal')
    } catch (err) {
      console.error('Registration error:', err)
      toast.error(err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-crm-black via-crm-dark to-crm-black" />
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-crm-purple/30 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-crm-purple-light/20 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-2xl">
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
            <h1 className="text-3xl font-bold text-crm-white mb-2">Join the Movement</h1>
            <p className="text-crm-gray">Start your discipleship journey today</p>
          </div>

          <GlassCard className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-semibold text-crm-white mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-crm-purple" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-crm-gray-light mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-crm-black/50 border border-white/10 rounded-xl text-crm-white placeholder-crm-gray focus:outline-none focus:border-crm-purple focus:ring-1 focus:ring-crm-purple transition-all"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-crm-gray-light mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-crm-black/50 border border-white/10 rounded-xl text-crm-white placeholder-crm-gray focus:outline-none focus:border-crm-purple focus:ring-1 focus:ring-crm-purple transition-all"
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-crm-gray-light mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-crm-black/50 border border-white/10 rounded-xl text-crm-white placeholder-crm-gray focus:outline-none focus:border-crm-purple focus:ring-1 focus:ring-crm-purple transition-all"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-crm-gray-light mb-2">
                      Username *
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-crm-black/50 border border-white/10 rounded-xl text-crm-white placeholder-crm-gray focus:outline-none focus:border-crm-purple focus:ring-1 focus:ring-crm-purple transition-all"
                      placeholder="johndoe"
                    />
                  </div>
                </div>
              </div>

              {/* Location */}
              <div>
                <h3 className="text-lg font-semibold text-crm-white mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-crm-purple" />
                  Location
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-crm-gray-light mb-2">
                      Continent *
                    </label>
                    <select
                      name="continent"
                      value={formData.continent}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-crm-black/50 border border-white/10 rounded-xl text-crm-white focus:outline-none focus:border-crm-purple focus:ring-1 focus:ring-crm-purple transition-all"
                    >
                      <option value="">Select Continent</option>
                      {CONTINENTS.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-crm-gray-light mb-2">
                      Country *
                    </label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-crm-black/50 border border-white/10 rounded-xl text-crm-white placeholder-crm-gray focus:outline-none focus:border-crm-purple focus:ring-1 focus:ring-crm-purple transition-all"
                      placeholder="Kenya"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-crm-gray-light mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-crm-black/50 border border-white/10 rounded-xl text-crm-white placeholder-crm-gray focus:outline-none focus:border-crm-purple focus:ring-1 focus:ring-crm-purple transition-all"
                      placeholder="Nairobi"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-crm-gray-light mb-2">
                      Village (Optional)
                    </label>
                    <input
                      type="text"
                      name="village"
                      value={formData.village}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-crm-black/50 border border-white/10 rounded-xl text-crm-white placeholder-crm-gray focus:outline-none focus:border-crm-purple focus:ring-1 focus:ring-crm-purple transition-all"
                      placeholder="Kiambu"
                    />
                  </div>
                </div>
              </div>

              {/* Security */}
              <div>
                <h3 className="text-lg font-semibold text-crm-white mb-4 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-crm-purple" />
                  Security
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-crm-gray-light mb-2">
                      Password *
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      minLength={6}
                      className="w-full px-4 py-3 bg-crm-black/50 border border-white/10 rounded-xl text-crm-white placeholder-crm-gray focus:outline-none focus:border-crm-purple focus:ring-1 focus:ring-crm-purple transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-crm-gray-light mb-2">
                      Confirm Password *
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      minLength={6}
                      className="w-full px-4 py-3 bg-crm-black/50 border border-white/10 rounded-xl text-crm-white placeholder-crm-gray focus:outline-none focus:border-crm-purple focus:ring-1 focus:ring-crm-purple transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              {/* Terms */}
              <div className="flex items-start">
                <input
                  type="checkbox"
                  required
                  className="w-4 h-4 mt-1 rounded border-white/10 bg-crm-black/50 text-crm-purple focus:ring-crm-purple"
                />
                <label className="ml-2 text-sm text-crm-gray">
                  I agree to the{' '}
                  <Link to="/terms" className="text-crm-purple hover:text-crm-purple-light">
                    Terms of Service
                  </Link>
                  {' '}and{' '}
                  <Link to="/privacy" className="text-crm-purple hover:text-crm-purple-light">
                    Privacy Policy
                  </Link>
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full shield-button py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-crm-black/30 border-t-crm-black rounded-full animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    Create Account
                  </>
                )}
              </button>
            </form>

            {/* Login Link */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-crm-dark text-crm-gray">Already have an account?</span>
              </div>
            </div>

            <Link
              to="/login"
              className="block w-full text-center py-3 rounded-xl border border-white/20 text-crm-white hover:bg-white/5 transition-all font-medium"
            >
              Sign In
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

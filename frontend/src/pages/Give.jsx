import { useState } from 'react'
import { motion } from 'framer-motion'
import { DollarSign, Heart, Globe, Building, Users, CreditCard, Smartphone, ArrowRight, CheckCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import GlassCard from '../components/common/GlassCard'
import BrandLogo from '../components/common/BrandLogo'
import axios from 'axios'
import Footer from '../components/common/Footer'

export default function Give() {
  const { user, token } = useAuth()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    amount: '',
    category: 'tithe',
    payment_method: 'card',
    is_recurring: false,
    currency: 'USD'
  })
  const [processing, setProcessing] = useState(false)

  const categories = [
    { id: 'tithe', name: 'Tithe', icon: Heart, description: 'Your faithful 10%' },
    { id: 'offering', name: 'Offering', icon: DollarSign, description: 'General church support' },
    { id: 'mission', name: 'Missions', icon: Globe, description: 'Support global outreach' },
    { id: 'building', name: 'Building Fund', icon: Building, description: 'Physical expansion' },
    { id: 'special', name: 'Special Project', icon: Users, description: 'Specific initiatives' }
  ]

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!user) {
      toast.error('Please login to donate')
      navigate('/login')
      return
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    setProcessing(true)

    try {
      const response = await axios.post('/api/give', formData, {
        headers: { Authorization: `Bearer ${token}` }
      })

      toast.success('Thank you for your generous donation! 🙏')
      setFormData({
        amount: '',
        category: 'tithe',
        payment_method: 'card',
        is_recurring: false,
        currency: 'USD'
      })
    } catch (err) {
      console.error('Giving error:', err)
      toast.error(err.response?.data?.error || 'Payment failed. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex justify-center mb-4">
            <BrandLogo size="md" />
          </div>
          <h1 className="text-4xl font-bold text-crm-white mb-4">Support and Donations</h1>
          <p className="text-crm-gray-light max-w-2xl mx-auto">
            "Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, 
            for God loves a cheerful giver." - 2 Corinthians 9:7
          </p>
        </motion.div>

        {/* Impact Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[
            { label: 'Souls Reached', value: '45.6M+' },
            { label: 'Countries', value: '78' },
            { label: 'Churches Planted', value: '2,340' },
            { label: 'Disciples Trained', value: '125K' }
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <GlassCard className="p-4 text-center">
                <div className="text-2xl font-bold text-green-400">{stat.value}</div>
                <div className="text-xs text-crm-gray uppercase tracking-wider mt-1">{stat.label}</div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Giving Form */}
          <div className="lg:col-span-2">
            <GlassCard className="p-8">
              <h2 className="text-2xl font-bold text-crm-white mb-6">Make a Donation</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Category Selection */}
                <div>
                  <label className="block text-sm font-medium text-crm-gray-light mb-3">
                    Choose Category
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, category: cat.id })}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${
                          formData.category === cat.id
                            ? 'border-crm-purple bg-crm-purple/10'
                            : 'border-white/10 hover:border-white/20'
                        }`}
                      >
                        <cat.icon className={`w-6 h-6 mb-2 ${
                          formData.category === cat.id ? 'text-crm-purple' : 'text-crm-gray'
                        }`} />
                        <div className="text-sm font-medium text-crm-white mb-1">{cat.name}</div>
                        <div className="text-xs text-crm-gray">{cat.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-crm-gray-light mb-2">
                    Amount *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-crm-gray text-lg">$</span>
                    </div>
                    <input
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleChange}
                      required
                      min="1"
                      step="0.01"
                      className="w-full pl-8 pr-4 py-4 text-2xl font-bold bg-crm-black/50 border border-white/10 rounded-xl text-crm-white placeholder-crm-gray focus:outline-none focus:border-crm-purple focus:ring-2 focus:ring-crm-purple/20 transition-all"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="flex gap-2 mt-3">
                    {[10, 25, 50, 100, 250].map(amount => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => setFormData({ ...formData, amount: amount.toString() })}
                        className="flex-1 px-3 py-2 rounded-lg bg-white/5 text-crm-gray hover:bg-white/10 hover:text-crm-white transition-all text-sm font-medium"
                      >
                        ${amount}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-medium text-crm-gray-light mb-3">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, payment_method: 'card' })}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        formData.payment_method === 'card'
                          ? 'border-crm-purple bg-crm-purple/10'
                          : 'border-white/10 hover:border-white/20'
                      }`}
                    >
                      <CreditCard className={`w-6 h-6 mb-2 ${
                        formData.payment_method === 'card' ? 'text-crm-purple' : 'text-crm-gray'
                      }`} />
                      <div className="text-sm font-medium text-crm-white">Card</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, payment_method: 'mpesa' })}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        formData.payment_method === 'mpesa'
                          ? 'border-crm-purple bg-crm-purple/10'
                          : 'border-white/10 hover:border-white/20'
                      }`}
                    >
                      <Smartphone className={`w-6 h-6 mb-2 ${
                        formData.payment_method === 'mpesa' ? 'text-crm-purple' : 'text-crm-gray'
                      }`} />
                      <div className="text-sm font-medium text-crm-white">M-Pesa</div>
                    </button>
                  </div>
                </div>

                {/* Recurring Option */}
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="is_recurring"
                    name="is_recurring"
                    checked={formData.is_recurring}
                    onChange={handleChange}
                    className="w-4 h-4 mt-1 rounded border-white/10 bg-crm-black/50 text-crm-purple focus:ring-crm-purple"
                  />
                  <label htmlFor="is_recurring" className="ml-2 text-sm text-crm-gray">
                    Make this a recurring monthly donation
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={processing}
                  className="w-full shield-button py-4 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-crm-black/30 border-t-crm-black rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Heart className="w-5 h-5" />
                      Complete Donation
                    </>
                  )}
                </button>

                <p className="text-xs text-crm-gray text-center">
                  All transactions are secure and encrypted. You will receive a receipt via email.
                </p>
              </form>
            </GlassCard>
          </div>

          {/* Why Give Sidebar */}
          <div className="space-y-6">
            <GlassCard className="p-6">
              <h3 className="text-lg font-bold text-crm-white mb-4">Why Support?</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-crm-white mb-1">Advance the Gospel</p>
                    <p className="text-xs text-crm-gray">Reach 2 billion souls by 2033</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-crm-white mb-1">Plant Churches</p>
                    <p className="text-xs text-crm-gray">Support new congregations worldwide</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-crm-white mb-1">Train Leaders</p>
                    <p className="text-xs text-crm-gray">Equip disciples to disciple nations</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-crm-white mb-1">Serve Communities</p>
                    <p className="text-xs text-crm-gray">Meet practical needs with love</p>
                  </div>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-6 bg-gradient-to-br from-crm-purple/10 to-transparent border-crm-purple/20">
              <h3 className="text-lg font-bold text-crm-white mb-2">Tax Deductible</h3>
              <p className="text-sm text-crm-gray mb-4">
                Your generous donations are tax-deductible. You'll receive a receipt for your records.
              </p>
              <p className="text-xs text-crm-gray">
                CRM is a registered 501(c)(3) nonprofit organization.
              </p>
            </GlassCard>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  )
}

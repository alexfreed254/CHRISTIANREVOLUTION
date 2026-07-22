import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { DollarSign, Heart, Globe, Building, Users, ArrowRight, CheckCircle, Copy } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import GlassCard from '../components/common/GlassCard'
import BrandLogo from '../components/common/BrandLogo'
import PayPalLogo from '../components/common/PayPalLogo'
import MpesaLogo from '../components/common/MpesaLogo'
import StripeLogo from '../components/common/StripeLogo'
import axios from 'axios'
import Footer from '../components/common/Footer'
import useLiveStats from '../hooks/useLiveStats'

const CATEGORIES = [
  { id: 'tithe', name: 'Tithe', icon: Heart, description: 'Your faithful 10%' },
  { id: 'offering', name: 'Offering', icon: DollarSign, description: 'General church support' },
  { id: 'mission', name: 'Missions', icon: Globe, description: 'Support global outreach' },
  { id: 'building', name: 'Building Fund', icon: Building, description: 'Physical expansion' },
  { id: 'special', name: 'Special Project', icon: Users, description: 'Specific initiatives' },
]

const USD_PRESETS = [10, 25, 50, 100, 250]
const KES_PRESETS = [500, 1000, 2500, 5000, 10000]

export default function Support() {
  const { user, token } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { stats } = useLiveStats({ pollMs: 30000 })
  const pollRef = useRef(null)

  const [config, setConfig] = useState(null)
  const [formData, setFormData] = useState({
    amount: '',
    category: 'tithe',
    payment_method: 'stripe',
    is_recurring: false,
    currency: 'USD',
    phone_number: '',
    donor_name: '',
    donor_email: '',
  })
  const [processing, setProcessing] = useState(false)
  const [manualMpesa, setManualMpesa] = useState(null)
  const [mpesaCode, setMpesaCode] = useState('')
  const [awaitingStk, setAwaitingStk] = useState(null)
  const [successReceipt, setSuccessReceipt] = useState(null)

  useEffect(() => {
    axios.get('/api/payments/config')
      .then((res) => {
        setConfig(res.data)
        if (res.data.stripe_configured) {
          setFormData((p) => ({ ...p, payment_method: 'stripe' }))
        } else if (res.data.paypal_configured) {
          setFormData((p) => ({ ...p, payment_method: 'paypal' }))
        } else if (res.data.mpesa_stk_configured || res.data.mpesa_manual_available) {
          setFormData((p) => ({ ...p, payment_method: 'mpesa' }))
        }
      })
      .catch(() => setConfig({ paypal_configured: false, mpesa_manual_available: false, stripe_configured: false }))
  }, [])

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        donor_name: prev.donor_name || user.full_name || '',
        donor_email: prev.donor_email || user.email || '',
        phone_number: prev.phone_number || user.phone || '',
      }))
    }
  }, [user])

  // Handle PayPal return
  useEffect(() => {
    const paypal = searchParams.get('paypal')
    const receipt = searchParams.get('receipt')
    const tokenOrder = searchParams.get('token') // PayPal order id on return
    if (paypal === 'success' && receipt) {
      ;(async () => {
        try {
          await axios.post('/api/payments/paypal/capture', {
            receipt_id: receipt,
            order_id: tokenOrder || undefined,
          })
          setSuccessReceipt(receipt)
          toast.success('Thank you! Your PayPal donation is confirmed.')
        } catch (err) {
          toast.error(err.response?.data?.error || 'Could not confirm PayPal payment')
        }
        setSearchParams({})
      })()
    } else if (paypal === 'cancel') {
      toast.error('PayPal payment was cancelled')
      setSearchParams({})
    }
  }, [searchParams, setSearchParams])

  // Handle Stripe return
  useEffect(() => {
    const stripe = searchParams.get('stripe')
    const receipt = searchParams.get('receipt')
    const sessionId = searchParams.get('session_id')
    if (stripe === 'success' && receipt && sessionId) {
      ;(async () => {
        try {
          await axios.post('/api/payments/stripe/verify', { receipt_id: receipt, session_id: sessionId })
          setSuccessReceipt(receipt)
          toast.success('Thank you! Your Stripe donation is confirmed.')
        } catch (err) {
          toast.error(err.response?.data?.error || 'Could not confirm Stripe payment')
        }
        setSearchParams({})
      })()
    } else if (stripe === 'cancel') {
      toast.error('Stripe payment was cancelled')
      setSearchParams({})
    }
  }, [searchParams, setSearchParams])

  useEffect(() => () => {
    if (pollRef.current) clearInterval(pollRef.current)
  }, [])

  const currency = formData.payment_method === 'mpesa' ? 'KES' : formData.currency
  const presets = currency === 'KES' ? KES_PRESETS : USD_PRESETS
  const symbol = currency === 'KES' ? 'Ksh ' : '$'

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    })
  }

  const selectMethod = (method) => {
    setFormData((prev) => ({
      ...prev,
      payment_method: method,
      currency: method === 'mpesa' ? 'KES' : prev.currency === 'KES' ? 'USD' : prev.currency,
      is_recurring: method === 'mpesa' ? false : prev.is_recurring,
    }))
    setManualMpesa(null)
    setAwaitingStk(null)
  }

  const startStkPoll = (receiptId) => {
    if (pollRef.current) clearInterval(pollRef.current)
    let tries = 0
    pollRef.current = setInterval(async () => {
      tries += 1
      try {
        const res = await axios.get(`/api/payments/mpesa/status/${receiptId}`)
        if (res.data.status === 'completed') {
          clearInterval(pollRef.current)
          setAwaitingStk(null)
          setSuccessReceipt(receiptId)
          toast.success('M-Pesa payment received. Thank you!')
        } else if (res.data.status === 'failed') {
          clearInterval(pollRef.current)
          setAwaitingStk(null)
          toast.error('M-Pesa payment failed or was cancelled')
        }
      } catch { /* keep polling */ }
      if (tries > 40) {
        clearInterval(pollRef.current)
        toast('Still waiting for M-Pesa confirmation. You can refresh later.', { icon: '⏳' })
      }
    }, 3000)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }
    if (formData.payment_method === 'stripe' && config && !config.stripe_configured) {
      toast.error('Stripe is not set up yet. Superadmin must enable Stripe in Payment Setup.')
      return
    }
    if (formData.payment_method === 'paypal' && config && !config.paypal_configured) {
      toast.error('PayPal is not set up yet. Please try Stripe, M-Pesa, or contact the church office.')
      return
    }
    if (formData.payment_method === 'mpesa' && config && !config.mpesa_stk_configured && !config.mpesa_manual_available) {
      toast.error('M-Pesa is not set up yet. Superadmin must add a Till number.')
      return
    }
    if (formData.payment_method === 'mpesa' && !formData.phone_number) {
      toast.error('Enter your M-Pesa phone number')
      return
    }

    setProcessing(true)
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const res = await axios.post('/api/give', {
        ...formData,
        currency,
        amount: parseFloat(formData.amount),
      }, { headers })

      const data = res.data

      if (data.status === 'redirect' && data.approve_url) {
        toast.success('Opening PayPal Checkout…')
        window.location.href = data.approve_url
        return
      }

      if (data.status === 'stk_sent') {
        setAwaitingStk({ receipt_id: data.receipt_id, message: data.message })
        toast.success(data.message || 'STK Push sent — check your phone')
        startStkPoll(data.receipt_id)
        return
      }

      if (data.status === 'manual_mpesa') {
        setManualMpesa(data)
        toast('Pay via M-Pesa Till, then enter your transaction code', { icon: '📱' })
        return
      }

      toast.success(data.message || 'Donation recorded')
      setSuccessReceipt(data.receipt_id)
    } catch (err) {
      console.error('Giving error:', err)
      toast.error(err.response?.data?.error || 'Payment failed. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  const submitMpesaCode = async () => {
    if (!manualMpesa?.receipt_id) return
    if (!mpesaCode.trim()) {
      toast.error('Enter your M-Pesa transaction code')
      return
    }
    setProcessing(true)
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      await axios.post('/api/payments/mpesa/confirm-code', {
        receipt_id: manualMpesa.receipt_id,
        transaction_code: mpesaCode.trim(),
      }, { headers })
      setSuccessReceipt(manualMpesa.receipt_id)
      setManualMpesa(null)
      toast.success('Thank you! Donation recorded.')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not confirm code')
    } finally {
      setProcessing(false)
    }
  }

  const copyTill = async () => {
    const till = manualMpesa?.till_number || config?.mpesa_till_number
    if (!till) return
    try {
      await navigator.clipboard.writeText(till)
      toast.success('Till number copied')
    } catch {
      toast.error('Could not copy')
    }
  }

  const formatStat = (n) => {
    const v = Number(n) || 0
    if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M+`
    if (v >= 1000) return `${(v / 1000).toFixed(1)}K+`
    return `${v}`
  }

  if (successReceipt) {
    return (
      <div className="min-h-screen pt-20 pb-12">
        <div className="max-w-lg mx-auto px-4 text-center">
          <GlassCard className="p-10">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-crm-white mb-2">Thank you!</h1>
            <p className="text-crm-gray-light mb-6">
              Your donation has been recorded. Receipt ID:
            </p>
            <p className="font-mono text-crm-purple text-lg mb-8">{successReceipt}</p>
            <button
              type="button"
              onClick={() => {
                setSuccessReceipt(null)
                setFormData((p) => ({ ...p, amount: '', is_recurring: false }))
              }}
              className="shield-button px-6 py-3"
            >
              Support again
            </button>
          </GlassCard>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
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
            &ldquo;Each of you should give what you have decided in your heart to give… for God loves a cheerful giver.&rdquo;
            — 2 Corinthians 9:7
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[
            { label: 'Members', value: formatStat(stats.members) },
            { label: 'Nations', value: String(stats.countries || 0) },
            { label: 'Souls Reached', value: formatStat(stats.souls) },
            { label: 'Online Now', value: String(stats.online_now || 0) },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <GlassCard className="p-4 text-center">
                <div className="text-2xl font-bold text-green-400">{stat.value}</div>
                <div className="text-xs text-crm-gray uppercase tracking-wider mt-1">{stat.label}</div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <GlassCard className="p-8">
              <h2 className="text-2xl font-bold text-crm-white mb-6">Make a Donation</h2>

              {awaitingStk && (
                <div className="mb-6 p-5 rounded-xl bg-green-500/10 border border-green-500/30 text-center">
                  <MpesaLogo className="h-10 mx-auto mb-3" />
                  <p className="text-crm-white font-medium mb-1">Waiting for M-Pesa PIN…</p>
                  <p className="text-sm text-crm-gray-light">{awaitingStk.message}</p>
                  <p className="text-xs text-crm-gray mt-2 font-mono">{awaitingStk.receipt_id}</p>
                </div>
              )}

              {manualMpesa && (
                <div className="mb-6 p-5 rounded-xl bg-green-500/10 border border-green-500/30 space-y-4">
                  <div className="flex items-center gap-3">
                    <MpesaLogo className="h-8" />
                    <div>
                      <p className="text-crm-white font-semibold">Lipa na M-Pesa — Buy Goods</p>
                      <p className="text-sm text-crm-gray">Till Number</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-3xl font-bold text-green-400 tracking-widest">{manualMpesa.till_number}</p>
                    <button type="button" onClick={copyTill} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-crm-gray">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-crm-gray-light">
                    Amount: <span className="text-crm-white font-semibold">Ksh {Number(manualMpesa.amount).toLocaleString()}</span>
                  </p>
                  <ol className="text-sm text-crm-gray space-y-1 list-decimal list-inside">
                    <li>Open M-Pesa → Lipa na M-Pesa → Buy Goods and Services</li>
                    <li>Enter Till Number above</li>
                    <li>Enter the amount and your PIN</li>
                    <li>Paste the M-Pesa transaction code below</li>
                  </ol>
                  <input
                    value={mpesaCode}
                    onChange={(e) => setMpesaCode(e.target.value.toUpperCase())}
                    placeholder="M-Pesa Transaction Code"
                    className="w-full px-4 py-3 rounded-xl bg-crm-black/50 border border-white/10 text-crm-white font-mono tracking-wider"
                  />
                  <button type="button" onClick={submitMpesaCode} disabled={processing} className="w-full shield-button py-3">
                    Submit Donation
                  </button>
                </div>
              )}

              {!manualMpesa && !awaitingStk && (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-crm-gray-light mb-3">Choose Category</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {CATEGORIES.map((cat) => (
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
                          <cat.icon className={`w-6 h-6 mb-2 ${formData.category === cat.id ? 'text-crm-purple' : 'text-crm-gray'}`} />
                          <div className="text-sm font-medium text-crm-white mb-1">{cat.name}</div>
                          <div className="text-xs text-crm-gray">{cat.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-crm-gray-light">Amount *</label>
                      {formData.payment_method !== 'mpesa' && (
                        <select
                          name="currency"
                          value={formData.currency}
                          onChange={handleChange}
                          className="text-sm bg-crm-black/50 border border-white/10 rounded-lg px-2 py-1 text-crm-white"
                        >
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                          <option value="GBP">GBP</option>
                          {formData.payment_method === 'stripe' && <option value="KES">KES</option>}
                        </select>
                      )}
                      {formData.payment_method === 'mpesa' && (
                        <span className="text-sm text-green-400 font-medium">KES</span>
                      )}
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <span className="text-crm-gray text-lg">{symbol.trim()}</span>
                      </div>
                      <input
                        type="number"
                        name="amount"
                        value={formData.amount}
                        onChange={handleChange}
                        required
                        min="1"
                        step={currency === 'KES' ? '1' : '0.01'}
                        className="w-full pl-14 pr-4 py-4 text-2xl font-bold bg-crm-black/50 border border-white/10 rounded-xl text-crm-white placeholder-crm-gray focus:outline-none focus:border-crm-purple focus:ring-2 focus:ring-crm-purple/20 transition-all"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {presets.map((amount) => (
                        <button
                          key={amount}
                          type="button"
                          onClick={() => setFormData({ ...formData, amount: String(amount) })}
                          className="px-3 py-2 rounded-lg bg-white/5 text-crm-gray hover:bg-white/10 hover:text-crm-white transition-all text-sm font-medium"
                        >
                          {symbol}{amount.toLocaleString()}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-crm-gray-light mb-3">Payment Method</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => selectMethod('stripe')}
                        className={`p-5 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${
                          formData.payment_method === 'stripe'
                            ? 'border-[#635BFF] bg-[#635BFF]/10'
                            : 'border-white/10 hover:border-white/20'
                        }`}
                      >
                        <StripeLogo className="h-8 w-auto" />
                        <div className="text-sm text-crm-gray text-center">Card · Apple Pay · Google Pay</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => selectMethod('paypal')}
                        className={`p-5 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${
                          formData.payment_method === 'paypal'
                            ? 'border-[#003087] bg-[#003087]/10'
                            : 'border-white/10 hover:border-white/20'
                        }`}
                      >
                        <PayPalLogo className="h-8 w-auto" />
                        <div className="text-sm text-crm-gray text-center">PayPal · International</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => selectMethod('mpesa')}
                        className={`p-5 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${
                          formData.payment_method === 'mpesa'
                            ? 'border-green-500 bg-green-500/10'
                            : 'border-white/10 hover:border-white/20'
                        }`}
                      >
                        <MpesaLogo className="h-8 w-auto" />
                        <div className="text-sm text-crm-gray text-center">Kenya · STK / Till</div>
                      </button>
                    </div>
                    {config && formData.payment_method === 'stripe' && !config.stripe_configured && (
                      <p className="text-xs text-amber-400 mt-2">Stripe not configured — superadmin must enable in Payment Setup.</p>
                    )}
                    {config && formData.payment_method === 'paypal' && !config.paypal_configured && (
                      <p className="text-xs text-amber-400 mt-2">PayPal receiving email not configured yet.</p>
                    )}
                    {config && formData.payment_method === 'mpesa' && !config.mpesa_stk_configured && !config.mpesa_manual_available && (
                      <p className="text-xs text-amber-400 mt-2">M-Pesa Till number not configured yet.</p>
                    )}
                  </div>

                  {formData.payment_method === 'mpesa' && (
                    <div>
                      <label className="block text-sm font-medium text-crm-gray-light mb-2">M-Pesa Phone Number *</label>
                      <input
                        type="tel"
                        name="phone_number"
                        value={formData.phone_number}
                        onChange={handleChange}
                        placeholder="+254 7XX XXX XXX"
                        className="w-full px-4 py-3 rounded-xl bg-crm-black/50 border border-white/10 text-crm-white"
                        required
                      />
                      <p className="text-xs text-crm-gray mt-1">
                        {config?.mpesa_stk_configured
                          ? 'You will receive an STK Push prompt on this phone.'
                          : 'After paying to the Till, you will enter your transaction code.'}
                      </p>
                    </div>
                  )}

                  {!user && (
                    <div className="grid sm:grid-cols-2 gap-3">
                      <input
                        name="donor_name"
                        value={formData.donor_name}
                        onChange={handleChange}
                        placeholder="Your name"
                        className="px-4 py-3 rounded-xl bg-crm-black/50 border border-white/10 text-crm-white"
                      />
                      <input
                        name="donor_email"
                        type="email"
                        value={formData.donor_email}
                        onChange={handleChange}
                        placeholder="Email for receipt"
                        className="px-4 py-3 rounded-xl bg-crm-black/50 border border-white/10 text-crm-white"
                      />
                    </div>
                  )}

                  {formData.payment_method !== 'mpesa' && (
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
                        {formData.payment_method === 'stripe' ? ' (via Stripe)' : ' (via PayPal)'}
                      </label>
                    </div>
                  )}

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
                    ) : formData.payment_method === 'stripe' ? (
                      <>
                        <StripeLogo className="h-5 w-auto" />
                        Continue to Stripe
                        <ArrowRight className="w-4 h-4" />
                      </>
                    ) : formData.payment_method === 'paypal' ? (
                      <>
                        <PayPalLogo className="h-5 w-auto" />
                        Continue to PayPal
                        <ArrowRight className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        <MpesaLogo className="h-5 w-auto" />
                        Pay with M-Pesa
                      </>
                    )}
                  </button>

                  <p className="text-xs text-crm-gray text-center">
                    Secure checkout via PayPal or Safaricom M-Pesa. You will receive a receipt for your records.
                  </p>
                </form>
              )}
            </GlassCard>
          </div>

          <div className="space-y-6">
            <GlassCard className="p-6">
              <h3 className="text-lg font-bold text-crm-white mb-4">How it works</h3>
              <div className="space-y-4 text-sm text-crm-gray-light">
                <p><span className="text-crm-white font-medium">International:</span> Stripe (cards, Apple Pay, Google Pay) or PayPal Checkout.</p>
                <p><span className="text-crm-white font-medium">Kenya:</span> M-Pesa STK Push or Till number.</p>
              </div>
            </GlassCard>
            <GlassCard className="p-6 bg-gradient-to-br from-crm-purple/10 to-transparent border-crm-purple/20">
              <h3 className="text-lg font-bold text-crm-white mb-2">Need help?</h3>
              <p className="text-sm text-crm-gray mb-4">
                If a payment succeeds but you do not see a receipt, contact the church office with your PayPal or M-Pesa confirmation.
              </p>
              {!user && (
                <button type="button" onClick={() => navigate('/login')} className="text-sm text-crm-purple hover:underline">
                  Log in to track your giving history →
                </button>
              )}
            </GlassCard>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

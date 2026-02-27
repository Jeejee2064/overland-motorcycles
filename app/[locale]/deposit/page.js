'use client'
import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { Shield, Lock, CheckCircle } from 'lucide-react'

import Navigation from '../../../components/Navigation'
import Footer from '../../../components/Footer'
import ButtonPrimary from '../../../components/ButtonPrimary'

const DepositPage = () => {
  const t = useTranslations('DepositPage')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleAuth = async () => {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch('/api/create-deposit-auth', {
        method: 'POST'
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message)
      }

      alert(t('successMessage'))

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <Navigation />

      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Image
              src="/LOGOBL.svg"
              alt="Overland Motorcycles"
              width={220}
              height={80}
              className="mx-auto mb-10"
            />

            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-br from-yellow-500 to-yellow-400 bg-clip-text text-transparent">
              {t('title')}
            </h1>

            <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-10">
              {t('subtitle')}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-800/30 border border-gray-700/50 rounded-3xl p-10 backdrop-blur-sm space-y-6"
          >
            <div className="flex items-start gap-4 text-left">
              <Shield className="text-yellow-400 flex-shrink-0 mt-1" />
              <p className="text-gray-300">{t('point1')}</p>
            </div>

            <div className="flex items-start gap-4 text-left">
              <Lock className="text-yellow-400 flex-shrink-0 mt-1" />
              <p className="text-gray-300">{t('point2')}</p>
            </div>

            <div className="flex items-start gap-4 text-left">
              <CheckCircle className="text-yellow-400 flex-shrink-0 mt-1" />
              <p className="text-gray-300">{t('point3')}</p>
            </div>

            {error && (
              <p className="text-red-400 mt-4">{error}</p>
            )}

            <div className="pt-6">
              <ButtonPrimary
                onClick={handleAuth}
                text={loading ? t('processing') : t('button')}
              />
            </div>
          </motion.div>

        </div>
      </section>

      <Footer />
    </div>
  )
}

export default DepositPage
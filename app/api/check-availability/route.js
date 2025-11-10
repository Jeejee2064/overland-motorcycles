import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function POST(req) {
  try {
    const { startDate, endDate } = await req.json()

    const { data, error } = await supabase.rpc('check_bikes_available', {
      p_start_date: startDate,
      p_end_date: endDate,
    })

    if (error) {
      console.error('Error checking bikes:', error)
      return NextResponse.json({ available: 0, error: error.message }, { status: 400 })
    }

    return NextResponse.json({ available: data || 0 })
  } catch (err) {
    console.error('Unexpected error checking availability:', err)
    return NextResponse.json({ available: 0, error: err.message }, { status: 500 })
  }
}

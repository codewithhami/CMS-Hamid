'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  try {
    const supabase = await createClient()

    const data = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    }

    const { error } = await supabase.auth.signInWithPassword(data)

    if (error) {
      return { error: error.message }
    }

    redirect('/dashboard')
  } catch (err: any) {
    console.error('Login error:', err)
    if (err?.message === 'NEXT_REDIRECT') {
      throw err
    }
    return { error: err?.message || 'An unexpected error occurred during login' }
  }
}

export async function signup(formData: FormData) {
  try {
    const supabase = await createClient()

    const fullName = formData.get('fullName') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    if (error) {
      return { error: error.message }
    }

    redirect('/dashboard')
  } catch (err: any) {
    console.error('Signup error:', err)
    if (err?.message === 'NEXT_REDIRECT') {
      throw err
    }
    return { error: err?.message || 'An unexpected error occurred during signup' }
  }
}

export async function forgotPassword(formData: FormData) {
  try {
    const supabase = await createClient()

    const email = formData.get('email') as string

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/callback?next=/settings`,
    })

    if (error) {
      return { error: error.message }
    }

    return { success: 'Password reset link sent to your email!' }
  } catch (err: any) {
    console.error('Forgot password error:', err)
    return { error: err?.message || 'An unexpected error occurred' }
  }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

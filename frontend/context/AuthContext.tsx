'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { User, AuthContextType } from '@/types'
import { socket } from '@/lib/socket'

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
  isLoading: true,
})

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        // eslint-disable-next-line
        setToken(storedToken)
        // eslint-disable-next-line
        setUser(parsedUser)
        
        socket.auth = { token: storedToken }
        socket.connect()
        socket.emit('join', parsedUser.id)
      } catch (error) {
        console.error('Failed to parse user from local storage', error)
      }
    }
    setIsLoading(false)

    return () => {
      socket.disconnect()
    }
  }, [])

  useEffect(() => {
    socket.on('connect', () => {
      if (user) {
        socket.emit('join', user.id)
      }
    })

    socket.on('disconnect', (reason) => {
    })

    socket.on('reconnect', (attemptNumber) => {
      if (user) {
        socket.emit('join', user.id)
      }
    })

    return () => {
      socket.off('connect')
      socket.off('disconnect')
      socket.off('reconnect')
    }
  }, [user])

  const login = (newToken: string, newUser: User, redirectTo?: string) => {
    setToken(newToken)
    setUser(newUser)
    
    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(newUser))
    
    // Set cookies for middleware
    document.cookie = `token=${newToken}; path=/; max-age=${7 * 24 * 60 * 60}`
    document.cookie = `user=${JSON.stringify(newUser)}; path=/; max-age=${7 * 24 * 60 * 60}`

    socket.auth = { token: newToken }
    socket.connect()
    socket.emit('join', newUser.id)
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
    document.cookie = 'user=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'

    socket.disconnect()
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

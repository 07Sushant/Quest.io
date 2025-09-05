'use client'

import { useState } from 'react'
import questAPI from '@/lib/quest-api-new'

export default function TestPage() {
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const testAPI = async () => {
    setLoading(true)
    setError('')
    setResponse('')
    
    try {
      // Test health check first
      const healthCheck = await questAPI.healthCheck()
      console.log('Health check:', healthCheck)
      
      // Test chat completion
      const chatResponse = await questAPI.chatCompletion('azure', [
        { role: 'user', content: 'Hello, say hi back!' }
      ])
      
      console.log('Chat response:', chatResponse)
      setResponse(JSON.stringify(chatResponse, null, 2))
    } catch (err: any) {
      console.error('API Error:', err)
      setError(err.message || 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Quest.io API Test</h1>
        
        <div className="space-y-6">
          <button
            onClick={testAPI}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-6 py-3 rounded-lg font-medium"
          >
            {loading ? 'Testing...' : 'Test API Connection'}
          </button>
          
          {error && (
            <div className="bg-red-900/50 border border-red-500 rounded-lg p-4">
              <h3 className="text-red-400 font-medium mb-2">Error:</h3>
              <pre className="text-red-200 text-sm">{error}</pre>
            </div>
          )}
          
          {response && (
            <div className="bg-green-900/50 border border-green-500 rounded-lg p-4">
              <h3 className="text-green-400 font-medium mb-2">Response:</h3>
              <pre className="text-green-200 text-sm overflow-auto">{response}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

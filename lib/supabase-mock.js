// Mock Supabase 클라이언트 (테스트용)
import { generateMockStats, generateMockAgentStats, mockQuoteRequests } from './mock-data'

// Mock Supabase 클라이언트
export const supabase = {
  from: (table) => ({
    select: (columns = '*', options = {}) => ({
      eq: (column, value) => ({
        single: () => Promise.resolve({ data: null, error: null }),
        limit: (count) => Promise.resolve({ data: [], error: null })
      }),
      order: (column, options) => ({
        limit: (count) => Promise.resolve({ data: [], error: null })
      }),
      limit: (count) => Promise.resolve({ data: [], error: null }),
      then: (callback) => {
        // Mock 데이터 반환
        if (table === 'agents') {
          const mockAgents = generateMockAgentStats()
          if (options.count === 'exact') {
            return callback({ data: mockAgents, error: null, count: mockAgents.length })
          }
          return callback({ data: mockAgents, error: null })
        }
        
        if (table === 'link_clicks') {
          if (options.count === 'exact') {
            return callback({ data: [], error: null, count: 3 })
          }
          return callback({ data: [], error: null })
        }
        
        if (table === 'quote_requests') {
          if (options.count === 'exact') {
            return callback({ data: mockQuoteRequests, error: null, count: mockQuoteRequests.length })
          }
          return callback({ data: mockQuoteRequests, error: null })
        }
        
        return callback({ data: [], error: null })
      }
    }),
    insert: (data) => ({
      select: () => ({
        single: () => Promise.resolve({ 
          data: { ...data[0], id: Date.now() }, 
          error: null 
        })
      })
    })
  }),
  
  channel: (name) => ({
    on: (event, schema, callback) => ({ subscribe: () => {} }),
    send: (data) => Promise.resolve()
  })
}

// Mock Admin 클라이언트 (동일)
export const supabaseAdmin = supabase

'use client'

import { useState } from 'react'
import { MessageSquare, Send, Paperclip, FileText, X } from 'lucide-react'

// 임시 더미 채팅 데이터
const dummyMessages = [
  {
    id: '1',
    type: 'user' as const,
    text: '정규화가 정확히 무엇인가요?',
    timestamp: '10:23',
  },
  {
    id: '2',
    type: 'ai' as const,
    text: '정규화(Normalization)는 데이터베이스 설계 과정에서 데이터의 중복을 최소화하고 데이터 무결성을 유지하기 위한 체계적인 방법입니다.\n\n방금 강의에서 교수님께서 설명하신 것처럼, 정규화는 다음과 같은 목적을 가집니다:\n\n1. **데이터 중복 최소화**: 같은 데이터가 여러 곳에 저장되는 것을 방지\n2. **데이터 무결성 유지**: 데이터의 일관성과 정확성 보장\n3. **이상 현상 제거**: 삽입, 수정, 삭제 시 발생할 수 있는 문제 방지',
    timestamp: '10:23',
    sources: ['강의 자막 00:00:23', 'database_lecture.pdf'],
  },
]

export default function ChatPanel() {
  const [messages] = useState(dummyMessages)
  const [inputText, setInputText] = useState('')
  const [attachedFiles] = useState<string[]>(['database_lecture.pdf'])

  const handleSend = () => {
    if (!inputText.trim()) return
    // TODO: AI 챗봇 메시지 전송
    console.log('Sending message:', inputText)
    setInputText('')
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Panel Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-800">AI 채팅</h2>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Claude 3.5 Sonnet</span>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-purple-600" />
              </div>
              <p className="text-gray-700 font-medium mb-2">
                AI에게 질문하세요
              </p>
              <p className="text-gray-500 text-sm">
                강의 내용과 업로드한 PDF를 기반으로 답변드립니다
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.type === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] ${
                    message.type === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl rounded-tr-sm'
                      : 'bg-gray-100 text-gray-800 rounded-2xl rounded-tl-sm'
                  } px-4 py-3`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">
                    {message.text}
                  </p>

                  {/* AI 답변의 출처 */}
                  {message.type === 'ai' && message.sources && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-600 mb-2 font-semibold">
                        참고 자료:
                      </p>
                      <div className="space-y-1">
                        {message.sources.map((source, idx) => (
                          <div
                            key={idx}
                            className="text-xs text-gray-600 flex items-center gap-1"
                          >
                            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                            {source}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-2 text-xs opacity-70">
                    {message.timestamp}
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Attached Files */}
      {attachedFiles.length > 0 && (
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2 mb-2">
            <Paperclip className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              첨부된 자료:
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {attachedFiles.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm"
              >
                <FileText className="w-4 h-4 text-blue-600" />
                <span className="text-gray-700">{file}</span>
                <button className="text-gray-400 hover:text-gray-600">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-end gap-3">
          {/* File Upload Button */}
          <button className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Input Field */}
          <div className="flex-1 relative">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder="AI에게 질문하세요... (Shift+Enter로 줄바꿈)"
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
              rows={2}
            />
          </div>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={!inputText.trim()}
            className="p-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-2 text-center">
          AI는 강의 자막과 업로드된 PDF를 참고하여 답변합니다
        </p>
      </div>
    </div>
  )
}

import ChatInterface from '../../../components/messaging/ChatInterface'

export default function InstructorMessagesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Messages</h1>
        <p className="text-slate-500 font-medium">Chat with your students and organization administrators.</p>
      </div>

      <ChatInterface role="instructor" />
    </div>
  )
}

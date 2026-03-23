import ChatInterface from '../../../components/messaging/ChatInterface'

export default function StudentMessagesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Messages</h1>
        <p className="text-slate-500 font-medium">Communicate with your instructors and college administrators.</p>
      </div>

      <ChatInterface role="student" />
    </div>
  )
}

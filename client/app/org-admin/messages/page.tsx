import ChatInterface from '../../../components/messaging/ChatInterface'

export default function OrgAdminMessagesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Communication Center</h1>
        <p className="text-slate-500 font-medium">Message any student or instructor in your organization.</p>
      </div>

      <ChatInterface role="admin" />
    </div>
  )
}

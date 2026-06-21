export default function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
           style={{ background: 'rgba(240,100,30,0.1)' }}>
        <span className="text-2xl">✦</span>
      </div>
      <p className="text-slate-400 text-sm">{message}</p>
    </div>
  )
}
